// ---------- constants & elements ----------
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const calendarGrid = document.getElementById('calendarGrid');
const monthNameEl = document.getElementById('monthName');
const yearNameEl = document.getElementById('yearName');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const todayBtn = document.getElementById('todayBtn');
const eventsListEl = document.getElementById('eventsList');
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const overlay = document.getElementById('overlay');
const detailPanel = document.getElementById('detailPanel');
const detailTitle = document.getElementById('detailTitle');
const detailMeta = document.getElementById('detailMeta');
const detailBody = document.getElementById('detailBody');
const detailClose = document.getElementById('detailClose');

document.getElementById('curYear').textContent = new Date().getFullYear();

// Use current system date - no hardcoded dates
let viewDate = new Date(); // Current system date
const today = new Date(); // Current system date

// Base URL (adjust port if needed)
const API_BASE_URL = "http://localhost:3000/api";

// Make events list scrollable
function makeEventsListScrollable() {
  eventsListEl.style.flex = '1';
  eventsListEl.style.overflowY = 'auto';
  eventsListEl.style.maxHeight = '400px';
  eventsListEl.style.paddingRight = '8px';
  eventsListEl.style.minHeight = '200px';
}

// ---------------- MongoDB Integration ----------------
async function fetchFormsFromMongoDB() {
  try {
    console.log("Fetching forms from MongoDB...");
    const response = await fetch(`${API_BASE_URL}/forms`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const forms = await response.json();
    console.log(`✅ Successfully fetched ${forms.length} forms from MongoDB`);

    if (forms.length === 0) {
      console.warn("⚠️ No forms found in database");
      return [];
    }

    // Transform forms to events
    const transformedForms = forms.map((form) => {
      let formDate = new Date(form.createdAt || Date.now());
      if (isNaN(formDate)) formDate = new Date();

      const eventDate = toISO(formDate);

      return {
        id: form._id?.$oid || form._id || `temp-${Math.random()}`,
        title: `${form.acronym} - ${form.status || "No Status"}`,
        date: eventDate,
        start: "09:00",
        end: "10:00",
        category: getCategoryFromOrgType(form.organizationType),
        description: `${form.completeName} - ${form.school}`,
        formData: form,
        status: form.status || "Unknown",
        school: form.school || "Unknown School",
        organizationType: form.organizationType || "Unknown Type",
        acronym: form.acronym || "No Acronym",
        completeName: form.completeName || "Unknown Name",
      };
    });

    return transformedForms;
  } catch (error) {
    console.error("❌ Error fetching forms from MongoDB:", error);
    return [];
  }
}

// Helper function to categorize organizations
function getCategoryFromOrgType(orgType) {
  const categories = {
    'Co-Curricular': 'Academic',
    'Extra-Curricular': 'Activities',
    'Academic': 'Academic',
    'Cultural': 'Cultural',
    'Sports': 'Sports',
    'Religious': 'Religious'
  };
  return categories[orgType] || 'General';
}

// Utility functions
function toISO(dateObj){
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth()+1).padStart(2,'0');
  const d = String(dateObj.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function fromISO(iso){
  const [y,m,d] = iso.split('-').map(Number);
  return new Date(y, m-1, d);
}

function clearDayHighlights(){
  document.querySelectorAll('.day.highlight').forEach(el => el.classList.remove('highlight'));
}

// ---------------- Render calendar ----------------
async function renderCalendar(){
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  monthNameEl.textContent = MONTHS[month];
  yearNameEl.textContent = year;

  calendarGrid.innerHTML = '';
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(w => {
    const el = document.createElement('div'); el.className = 'week'; el.textContent = w; calendarGrid.appendChild(el);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  for (let i = firstDay - 1; i >= 0; i--){
    const dnum = prevMonthDays - i;
    const cellDate = new Date(year, month-1, dnum);
    const cell = makeDayCell(cellDate, true);
    calendarGrid.appendChild(cell);
  }

  for (let d = 1; d <= daysInMonth; d++){
    const cellDate = new Date(year, month, d);
    const cell = makeDayCell(cellDate, false);
    calendarGrid.appendChild(cell);
  }

  const totalCells = calendarGrid.children.length;
  const filled = totalCells - 7;
  if (filled % 7 !== 0) {
    const toAdd = 7 - (filled % 7);
    for (let k = 1; k <= toAdd; k++){
      const cellDate = new Date(year, month+1, k);
      const cell = makeDayCell(cellDate, true);
      calendarGrid.appendChild(cell);
    }
  }

  // Update calendar cells with events after rendering
  const forms = await fetchFormsFromMongoDB();
  updateCalendarCellsWithEvents(forms);
}

// Create a day cell element
function makeDayCell(dateObj, inactive=false){
  const iso = toISO(dateObj);
  const el = document.createElement('div');
  el.className = 'day' + (inactive ? ' inactive' : '');
  el.dataset.date = iso;

  const dateRow = document.createElement('div');
  dateRow.className = 'date-row';
  const dayNum = document.createElement('div'); 
  dayNum.textContent = dateObj.getDate();
  const todayMark = document.createElement('div');
  if (iso === toISO(today) && !inactive) {
    todayMark.textContent = 'Today';
    todayMark.style.fontSize = '12px';
    todayMark.style.color = '#2563eb';
  }
  dateRow.appendChild(dayNum); 
  dateRow.appendChild(todayMark);
  el.appendChild(dateRow);

  const evList = document.createElement('div');
  evList.className = 'event-list';
  
  // Create empty spacer - events will be populated separately
  const spacer = document.createElement('div'); 
  spacer.style.minHeight = '6px'; 
  evList.appendChild(spacer);
  
  el.appendChild(evList);

  // Add click event to ALL cells (both active and inactive)
  el.addEventListener('click', async () => {
    // Only act when clicking current-month days
    if (inactive) return;
    
    clearDayHighlights();
    el.classList.add('highlight');

    const isoStr = iso;
    const forms = await fetchFormsFromMongoDB();
    const pastForms = forms.filter(form => form.date === isoStr && fromISO(form.date) < today);
    
    if (pastForms.length > 0){
      // Find and highlight the first matching event card
      const firstForm = pastForms[0];
      const card = document.querySelector(`.event-card[data-id="${firstForm.id}"]`);
      if (card) {
        // Scroll to the card if needed
        const cardRect = card.getBoundingClientRect();
        const containerRect = eventsListEl.getBoundingClientRect();
        
        if (cardRect.top < containerRect.top || cardRect.bottom > containerRect.bottom) {
          card.scrollIntoView(false); // No animation
        }
        
        // Also highlight the card
        document.querySelectorAll('.event-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        // Open detail panel for that form
        openDetailPanel(firstForm);
      }
    } else {
      // If no forms for this date, just clear any active event cards
      document.querySelectorAll('.event-card').forEach(c => c.classList.remove('active'));
    }
  });

  return el;
}

// ---------------- Render Past Events panel ----------------
async function renderPastEvents(filterText = '') {
  eventsListEl.innerHTML = '';
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Fetch forms from MongoDB
  const forms = await fetchFormsFromMongoDB();
  
  const monthForms = forms.filter(form => {
    const d = fromISO(form.date);
    const isSameMonth = (d.getFullYear() === viewYear && d.getMonth() === viewMonth);
    const isPast = d < today;
    return isSameMonth && isPast;
  }).sort((a,b) => (b.date + b.start) > (a.date + a.start) ? 1 : -1);

  const q = (filterText || '').trim().toLowerCase();
  const filtered = monthForms.filter(form => {
    if (!q) return true;
    return (form.title + ' ' + form.category + ' ' + form.description + ' ' + form.acronym + ' ' + form.completeName).toLowerCase().includes(q);
  });

  if (filtered.length === 0){
    const empty = document.createElement('div'); 
    empty.className = 'event-card';
    empty.innerHTML = `<div class="event-title">No past form submissions</div><div class="event-meta muted">No form submissions matching the month/search</div>`;
    eventsListEl.appendChild(empty);
    return;
  }

  filtered.forEach(form => {
    const card = document.createElement('div'); 
    card.className = 'event-card'; 
    card.tabIndex = 0;
    card.dataset.id = form.id;

    const head = document.createElement('div'); 
    head.className = 'event-head';
    const title = document.createElement('div'); 
    title.className = 'event-title'; 
    title.textContent = `${form.acronym} - ${form.status}`;
    const meta = document.createElement('div'); 
    meta.className = 'event-meta'; 
    meta.textContent = `${form.date} • ${form.school}`;
    head.appendChild(title); 
    head.appendChild(meta);

    const details = document.createElement('div'); 
    details.className = 'event-details';
    details.innerHTML = `
      <div class="event-meta"><span class="cat">${form.organizationType}</span></div>
      <div class="event-desc">${form.completeName}</div>
      <div class="event-extra">Applicant: ${form.formData.applicantName}</div>
    `;

    card.appendChild(head);
    card.appendChild(details);

    // Clicking opens slide-in panel with full details
    card.addEventListener('click', (e) => {
      // Don't let click bubble accidentally cause other behaviors
      e.stopPropagation();
      
      // Remove active class from all other cards
      document.querySelectorAll('.event-card').forEach(c => c.classList.remove('active'));
      // Add active class to clicked card
      card.classList.add('active');
      
      openDetailPanel(form);
      
      // Highlight corresponding day in calendar
      clearDayHighlights();
      const dayEl = document.querySelector(`.day[data-date="${form.date}"]`);
      if (dayEl) {
        dayEl.classList.add('highlight');
        // Scroll to day if needed
        const dayRect = dayEl.getBoundingClientRect();
        const calendarRect = calendarGrid.getBoundingClientRect();
        
        if (dayRect.top < calendarRect.top || dayRect.bottom > calendarRect.bottom) {
          dayEl.scrollIntoView(false); // No animation
        }
      }
    });

    // Keyboard accessibility: Enter/Space opens details
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDetailPanel(form);
      }
    });

    eventsListEl.appendChild(card);
  });
}

// Update calendar cells with events (NO ANIMATION)
function updateCalendarCellsWithEvents(forms) {
  // Clear all existing event badges
  document.querySelectorAll('.event-list').forEach(eventList => {
    eventList.innerHTML = '';
  });

  // Group forms by date
  const formsByDate = {};
  forms.forEach(form => {
    if (!formsByDate[form.date]) {
      formsByDate[form.date] = [];
    }
    formsByDate[form.date].push(form);
  });

  // Add events to each day cell
  Object.keys(formsByDate).forEach(date => {
    const dayEl = document.querySelector(`.day[data-date="${date}"]`);
    if (dayEl) {
      const eventList = dayEl.querySelector('.event-list');
      if (eventList) {
        eventList.innerHTML = ''; // Clear existing content
        
        const formsOnDate = formsByDate[date];
        const formsToShow = formsOnDate.slice(0, 2);
        
        formsToShow.forEach(formItem => {
          const badge = document.createElement('span');
          badge.className = 'event-badge';
          badge.textContent = formItem.acronym;
          eventList.appendChild(badge);
        });
        
        // Show "+X more" if there are more forms
        if (formsOnDate.length > 2) {
          const moreBadge = document.createElement('span');
          moreBadge.className = 'event-badge more-badge';
          moreBadge.textContent = `+${formsOnDate.length - 2} more`;
          moreBadge.style.background = '#f0f0f0';
          moreBadge.style.color = '#666';
          eventList.appendChild(moreBadge);
        }
      }
    }
  });

  // Add spacers to days with no events
  document.querySelectorAll('.day').forEach(dayEl => {
    const eventList = dayEl.querySelector('.event-list');
    if (eventList && eventList.children.length === 0) {
      const spacer = document.createElement('div');
      spacer.style.minHeight = '6px';
      eventList.appendChild(spacer);
    }
  });
}

// ---------------- Slide-in detail panel ----------------
function openDetailPanel(form) {
  const formData = form.formData;
  
  detailTitle.textContent = `${formData.acronym} - ${form.status}`;
  detailMeta.textContent = `${form.date} • ${formData.school} • ${formData.organizationType}`;
  
  // Improved design for detail panel
  detailBody.innerHTML = `
    <div class="detail-section">
      <div class="detail-header">
        <h3 class="detail-org-name">${formData.completeName}</h3>
        <p class="detail-email">${formData.officialEmail}</p>
      </div>
    </div>

    <div class="detail-section">
      <h4 class="detail-section-title">Organization Details</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Category:</span>
          <span class="detail-value">${formData.category || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">School:</span>
          <span class="detail-value">${formData.school}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Type:</span>
          <span class="detail-value">${formData.organizationType}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">CBL Status:</span>
          <span class="detail-value status-${(formData.cblStatus || '').toLowerCase().replace(' ', '-')}">${formData.cblStatus || 'N/A'}</span>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <h4 class="detail-section-title">Contact Information</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Applicant:</span>
          <span class="detail-value">${formData.applicantName} (${formData.applicantPosition})</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Applicant Email:</span>
          <span class="detail-value">${formData.applicantEmail}</span>
        </div>
        <div class="detail-item full-width">
          <span class="detail-label">Advisers:</span>
          <span class="detail-value">${formData.adviserNames.join(', ') || 'None specified'}</span>
        </div>
      </div>
    </div>

    ${formData.socialMediaLinks && formData.socialMediaLinks.length > 0 ? `
    <div class="detail-section">
      <h4 class="detail-section-title">Social Media Links</h4>
      <div class="social-links">
        ${formData.socialMediaLinks.map(link => 
          `<a href="${link}" target="_blank" class="social-link">
            <span class="link-icon">🔗</span>
            ${link}
          </a>`
        ).join('')}
      </div>
    </div>
    ` : ''}

    <div class="detail-section">
      <h4 class="detail-section-title">Documents & Files</h4>
      <div class="document-list">
        ${formData.strategicPlans ? `
        <div class="document-item">
          <span class="doc-icon">📊</span>
          <div class="doc-info">
            <span class="doc-name">Strategic Plans</span>
            <a href="${formData.strategicPlans.fileUrl}" target="_blank" class="doc-link">Download</a>
          </div>
        </div>
        ` : ''}
        
        ${formData.annualReport ? `
        <div class="document-item">
          <span class="doc-icon">📈</span>
          <div class="doc-info">
            <span class="doc-name">Annual Report</span>
            <a href="${formData.annualReport.fileUrl}" target="_blank" class="doc-link">Download</a>
          </div>
        </div>
        ` : ''}
        
        ${formData.constitutionByLaws ? `
        <div class="document-item">
          <span class="doc-icon">📜</span>
          <div class="doc-info">
            <span class="doc-name">Constitution & Bylaws</span>
            <a href="${formData.constitutionByLaws.fileUrl}" target="_blank" class="doc-link">Download</a>
          </div>
        </div>
        ` : ''}
        
        ${formData.infographics ? `
        <div class="document-item">
          <span class="doc-icon">🖼️</span>
          <div class="doc-info">
            <span class="doc-name">Infographics</span>
            <a href="${formData.infographics.fileUrl}" target="_blank" class="doc-link">Download</a>
          </div>
        </div>
        ` : ''}
        
        ${formData.videoLink ? `
        <div class="document-item">
          <span class="doc-icon">🎥</span>
          <div class="doc-info">
            <span class="doc-name">Presentation Video</span>
            <a href="${formData.videoLink}" target="_blank" class="doc-link">Watch Video</a>
          </div>
        </div>
        ` : ''}
      </div>
    </div>

    <div class="detail-section">
      <h4 class="detail-section-title">Submission Details</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Form ID:</span>
          <span class="detail-value monospace">${form.id}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Status:</span>
          <span class="detail-value status-badge status-${(form.status || '').toLowerCase().replace(' ', '-')}">${form.status}</span>
        </div>
        ${formData.remarks ? `
        <div class="detail-item full-width">
          <span class="detail-label">Remarks:</span>
          <span class="detail-value">${formData.remarks}</span>
        </div>
        ` : ''}
      </div>
    </div>
  `;

  overlay.classList.add('show');
  detailPanel.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  detailPanel.setAttribute('aria-hidden', 'false');

  // Focus for accessibility
  detailPanel.focus();
}

// Helper function for status colors
function getStatusColor(status) {
  const colors = {
    'Pending Review': '#f59e0b',
    'Approved': '#10b981',
    'Rejected': '#ef4444',
    'Needs Revision': '#f97316'
  };
  return colors[status] || '#6b7280';
}

// Close detail panel
function closeDetailPanel(){
  overlay.classList.remove('show');
  detailPanel.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  detailPanel.setAttribute('aria-hidden', 'true');
  
  // Clear highlights when closing panel
  clearDayHighlights();
  document.querySelectorAll('.event-card').forEach(c => c.classList.remove('active'));
}

// Close on overlay click or close button
overlay.addEventListener('click', closeDetailPanel);
detailClose.addEventListener('click', closeDetailPanel);

// Close with Esc
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeDetailPanel();
    clearDayHighlights();
  }
});

// ---------------- Search handling ----------------
searchInput.addEventListener('input', (e) => {
  const q = e.target.value;
  renderPastEvents(q);
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  renderPastEvents('');
  searchInput.focus();
});

// ---------------- Navigation handlers ----------------
prevBtn.addEventListener('click', async () => {
  viewDate.setMonth(viewDate.getMonth() - 1);
  await renderCalendar();
  await renderPastEvents(searchInput.value);
  clearDayHighlights();
});

nextBtn.addEventListener('click', async () => {
  viewDate.setMonth(viewDate.getMonth() + 1);
  await renderCalendar();
  await renderPastEvents(searchInput.value);
  clearDayHighlights();
});

todayBtn.addEventListener('click', async () => {
  viewDate = new Date(); // Reset to current system date
  await renderCalendar();
  await renderPastEvents(searchInput.value);
  clearDayHighlights();
});

// Initial render
async function initializeCalendar() {
  try {
    makeEventsListScrollable(); // Make events list scrollable
    await renderCalendar();
    await renderPastEvents();
    console.log('Calendar initialized with form data from MongoDB');
  } catch (error) {
    console.error('Error initializing calendar:', error);
  }
}

// Start the application
initializeCalendar();