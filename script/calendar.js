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

// Use October 2025 to match your data
let viewDate = new Date(2025, 9, 13); // Oct 13, 2025
const today = new Date(2025, 9, 13);

// Base URL (adjust port if needed)
const API_BASE_URL = "http://localhost:3000/api";

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
    const cell = await makeDayCell(cellDate, true);
    calendarGrid.appendChild(cell);
  }

  for (let d = 1; d <= daysInMonth; d++){
    const cellDate = new Date(year, month, d);
    const cell = await makeDayCell(cellDate, false);
    calendarGrid.appendChild(cell);
  }

  const totalCells = calendarGrid.children.length;
  const filled = totalCells - 7;
  if (filled % 7 !== 0) {
    const toAdd = 7 - (filled % 7);
    for (let k = 1; k <= toAdd; k++){
      const cellDate = new Date(year, month+1, k);
      const cell = await makeDayCell(cellDate, true);
      calendarGrid.appendChild(cell);
    }
  }
}

// Create a day cell element
async function makeDayCell(dateObj, inactive=false){
  const iso = toISO(dateObj);
  const el = document.createElement('div');
  el.className = 'day' + (inactive ? ' inactive' : '');
  el.dataset.date = iso;

  const dateRow = document.createElement('div');
  dateRow.className = 'date-row';
  const dayNum = document.createElement('div'); dayNum.textContent = dateObj.getDate();
  const todayMark = document.createElement('div');
  if (iso === toISO(today) && !inactive) {
    todayMark.textContent = 'Today';
    todayMark.style.fontSize = '12px';
    todayMark.style.color = '#2563eb';
  }
  dateRow.appendChild(dayNum); dateRow.appendChild(todayMark);
  el.appendChild(dateRow);

  // Fetch forms for this specific date from MongoDB
  const forms = await fetchFormsFromMongoDB();
  const formsOnDate = forms.filter(form => form.date === iso);

  const evList = document.createElement('div');
  evList.className = 'event-list';
  if (formsOnDate.length > 0){
    // Show max 2 forms in calendar cell to prevent overflow
    const formsToShow = formsOnDate.slice(0, 2);
    formsToShow.forEach(form => {
      const badge = document.createElement('span');
      badge.className = 'event-badge';
      badge.textContent = form.acronym;
      evList.appendChild(badge);
    });
    // Show "+X more" if there are more forms
    if (formsOnDate.length > 2) {
      const moreBadge = document.createElement('span');
      moreBadge.className = 'event-badge';
      moreBadge.textContent = `+${formsOnDate.length - 2} more`;
      moreBadge.style.background = '#f0f0f0';
      moreBadge.style.color = '#666';
      evList.appendChild(moreBadge);
    }
  } else {
    const spacer = document.createElement('div'); spacer.style.minHeight = '6px'; evList.appendChild(spacer);
  }
  el.appendChild(evList);

  el.addEventListener('click', async () => {
    // only act when clicking current-month days
    if (inactive) return;
    clearDayHighlights();
    el.classList.add('highlight');

    const isoStr = iso;
    const forms = await fetchFormsFromMongoDB();
    const pastForms = forms.filter(form => form.date === isoStr && fromISO(form.date) < today);
    
    if (pastForms.length){
      // open the first matching form in the events list
      const firstForm = pastForms[0];
      const card = document.querySelector(`.event-card[data-id="${firstForm.id}"]`);
      if (card) {
        // FIXED SCROLLING: Only scroll if the card is not in view
        const cardRect = card.getBoundingClientRect();
        const containerRect = eventsListEl.getBoundingClientRect();
        
        if (cardRect.top < containerRect.top || cardRect.bottom > containerRect.bottom) {
          card.scrollIntoView({behavior:'smooth', block:'nearest'});
        }
        // open detail panel for that form
        openDetailPanel(firstForm);
      }
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
    const empty = document.createElement('div'); empty.className = 'event-card';
    empty.innerHTML = `<div class="event-title">No past form submissions</div><div class="event-meta muted">No form submissions matching the month/search</div>`;
    eventsListEl.appendChild(empty);
    return;
  }

  filtered.forEach(form => {
    const card = document.createElement('div'); card.className = 'event-card'; card.tabIndex = 0;
    card.dataset.id = form.id;

    const head = document.createElement('div'); head.className = 'event-head';
    const title = document.createElement('div'); title.className = 'event-title'; title.textContent = `${form.acronym} - ${form.status}`;
    const meta = document.createElement('div'); meta.className = 'event-meta'; meta.textContent = `${form.date} • ${form.school}`;
    head.appendChild(title); head.appendChild(meta);

    const details = document.createElement('div'); details.className = 'event-details';
    details.innerHTML = `
      <div class="event-meta"><span class="cat">${form.organizationType}</span></div>
      <div class="event-desc">${form.completeName}</div>
      <div class="event-extra">Applicant: ${form.formData.applicantName}</div>
    `;

    card.appendChild(head);
    card.appendChild(details);

    // clicking opens slide-in panel with full details
    card.addEventListener('click', (e) => {
      // don't let click bubble accidentally cause other behaviors
      e.stopPropagation();
      openDetailPanel(form);
      // highlight corresponding day in calendar
      clearDayHighlights();
      const dayEl = document.querySelector(`.day[data-date="${form.date}"]`);
      if (dayEl) {
        dayEl.classList.add('highlight');
        // FIXED SCROLLING: Only scroll if the day is not in view
        const dayRect = dayEl.getBoundingClientRect();
        const calendarRect = calendarGrid.getBoundingClientRect();
        
        if (dayRect.top < calendarRect.top || dayRect.bottom > calendarRect.bottom) {
          dayEl.scrollIntoView({behavior:'smooth', block:'nearest'});
        }
      }
    });

    // keyboard accessibility: Enter/Space opens details
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDetailPanel(form);
      }
    });

    eventsListEl.appendChild(card);
  });
}

// ---------------- Slide-in detail panel ----------------
function openDetailPanel(form) {
  const formData = form.formData;
  
  detailTitle.textContent = `${formData.acronym} - ${form.status}`;
  detailMeta.textContent = `${form.date} • ${formData.school} • ${formData.organizationType}`;
  
  detailBody.innerHTML = `
    <div style="margin-bottom: 16px;">
      <h4 style="margin-bottom: 8px; color: #1f2937;">${formData.completeName}</h4>
      <p style="color: #6b7280; font-size: 14px;">${formData.officialEmail}</p>
    </div>

    <div style="margin-bottom: 16px;">
      <h5 style="margin-bottom: 8px; color: #374151;">Organization Details</h5>
      <div style="font-size: 14px; color: #6b7280; line-height: 1.5;">
        <div><strong>Category:</strong> ${formData.category}</div>
        <div><strong>School:</strong> ${formData.school}</div>
        <div><strong>Type:</strong> ${formData.organizationType}</div>
        <div><strong>CBL Status:</strong> ${formData.cblStatus}</div>
      </div>
    </div>

    <div style="margin-bottom: 16px;">
      <h5 style="margin-bottom: 8px; color: #374151;">Contact Information</h5>
      <div style="font-size: 14px; color: #6b7280; line-height: 1.5;">
        <div><strong>Applicant:</strong> ${formData.applicantName} (${formData.applicantPosition})</div>
        <div><strong>Applicant Email:</strong> ${formData.applicantEmail}</div>
        <div><strong>Advisers:</strong> ${formData.adviserNames.join(', ')}</div>
      </div>
    </div>

    ${formData.socialMediaLinks && formData.socialMediaLinks.length > 0 ? `
    <div style="margin-bottom: 16px;">
      <h5 style="margin-bottom: 8px; color: #374151;">Social Media</h5>
      <div style="font-size: 14px; color: #6b7280;">
        ${formData.socialMediaLinks.map(link => 
          `<div><a href="${link}" target="_blank" style="color: #2563eb;">${link}</a></div>`
        ).join('')}
      </div>
    </div>
    ` : ''}

    <div style="margin-bottom: 16px;">
      <h5 style="margin-bottom: 8px; color: #374151;">Documents</h5>
      <div style="font-size: 14px; color: #6b7280; line-height: 1.5;">
        ${formData.strategicPlans ? `<div><strong>Strategic Plans:</strong> <a href="${formData.strategicPlans.fileUrl}" target="_blank" style="color: #2563eb;">${formData.strategicPlans.fileName}</a></div>` : ''}
        ${formData.annualReport ? `<div><strong>Annual Report:</strong> <a href="${formData.annualReport.fileUrl}" target="_blank" style="color: #2563eb;">${formData.annualReport.fileName}</a></div>` : ''}
        ${formData.constitutionByLaws ? `<div><strong>Constitution & Bylaws:</strong> <a href="${formData.constitutionByLaws.fileUrl}" target="_blank" style="color: #2563eb;">${formData.constitutionByLaws.fileName}</a></div>` : ''}
        ${formData.infographics ? `<div><strong>Infographics:</strong> <a href="${formData.infographics.fileUrl}" target="_blank" style="color: #2563eb;">${formData.infographics.fileName}</a></div>` : ''}
        ${formData.videoLink ? `<div><strong>Video:</strong> <a href="${formData.videoLink}" target="_blank" style="color: #2563eb;">View Video</a></div>` : ''}
      </div>
    </div>

    <hr style="margin: 16px 0; border: none; border-top: 1px solid #e5e7eb;">

    <div style="font-size: 13px; color: #6b7280;">
      <div><strong>Form ID:</strong> ${form.id}</div>
      <div><strong>Status:</strong> <span style="color: ${getStatusColor(form.status)}">${form.status}</span></div>
      ${formData.remarks ? `<div><strong>Remarks:</strong> ${formData.remarks}</div>` : ''}
    </div>
  `;

  overlay.classList.add('show');
  detailPanel.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  detailPanel.setAttribute('aria-hidden', 'false');

  // focus for accessibility
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

// close detail panel
function closeDetailPanel(){
  overlay.classList.remove('show');
  detailPanel.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  detailPanel.setAttribute('aria-hidden', 'true');
}

// close on overlay click or close button
overlay.addEventListener('click', closeDetailPanel);
detailClose.addEventListener('click', closeDetailPanel);

// close with Esc
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
  viewDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  await renderCalendar();
  await renderPastEvents(searchInput.value);
  clearDayHighlights();
});

// Initial render
async function initializeCalendar() {
  try {
    await renderCalendar();
    await renderPastEvents();
    console.log('Calendar initialized with form data from MongoDB');
  } catch (error) {
    console.error('Error initializing calendar:', error);
  }
}

// Start the application
initializeCalendar();