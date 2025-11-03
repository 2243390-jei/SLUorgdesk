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
let viewDate = new Date(); // Months are 0-based (0 = January, 10 = November)
const today = new Date();

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
async function fetchSubmissionsFromMongoDB() {
  try {
    console.log("Fetching submissions from MongoDB...");
    const response = await fetch(`${API_BASE_URL}/Submissions`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const submissions = await response.json();
    console.log(`Successfully fetched ${submissions.length} submissions from MongoDB`);

    if (submissions.length === 0) {
      console.warn(" No submissions found in database");
      return [];
    }

    // Transform submissions to events - handle multiple events per submission
    const transformedEvents = [];
    
    submissions.forEach((submission) => {
      // Process each event in the submission
      if (submission.events && submission.events.length > 0) {
        submission.events.forEach((event, index) => {
          let eventDate = new Date(event.eventDate || submission.submittedAt || Date.now());
          if (isNaN(eventDate)) eventDate = new Date();

          const eventDateISO = toISO(eventDate);

          transformedEvents.push({
            id: `${submission._id?.$oid || submission._id}-${index}`,
            title: `${submission.organizationInfo.org_acronym} - ${event.eventName}`,
            date: eventDateISO,
            start: event.startTime || "09:00",
            end: event.endTime || "10:00",
            category: getCategoryFromOrgType(submission.organizationInfo.org_type),
            description: `${submission.organizationInfo.org_name} - ${event.eventName}`,
            submissionData: submission,
            eventData: event,
            status: submission.status || "Unknown",
            school: submission.organizationInfo.org_category || "Unknown School",
            organizationType: submission.organizationInfo.org_type || "Unknown Type",
            acronym: submission.organizationInfo.org_acronym || "No Acronym",
            completeName: submission.organizationInfo.org_name || "Unknown Name",
            SDGCategory: event.eventSDG ? event.eventSDG.join(', ') : "Not specified"
          });
        });
      } else {
        // If no events array, use submission date as a single event
        let submissionDate = new Date(submission.submittedAt || Date.now());
        if (isNaN(submissionDate)) submissionDate = new Date();

        const submissionDateISO = toISO(submissionDate);

        transformedEvents.push({
          id: submission._id?.$oid || submission._id || `temp-${Math.random()}`,
          title: `${submission.organizationInfo.org_acronym} - Submission`,
          date: submissionDateISO,
          start: "09:00",
          end: "10:00",
          category: getCategoryFromOrgType(submission.organizationInfo.org_type),
          description: `${submission.organizationInfo.org_name} - Form Submission`,
          submissionData: submission,
          status: submission.status || "Unknown",
          school: submission.organizationInfo.org_category || "Unknown School",
          organizationType: submission.organizationInfo.org_type || "Unknown Type",
          acronym: submission.organizationInfo.org_acronym || "No Acronym",
          completeName: submission.organizationInfo.org_name || "Unknown Name",
          SDGCategory: "Form Submission"
        });
      }
    });

    return transformedEvents;
  } catch (error) {
    console.error("Error fetching submissions from MongoDB:", error);
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
  const events = await fetchSubmissionsFromMongoDB();
  updateCalendarCellsWithEvents(events);
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
    const events = await fetchSubmissionsFromMongoDB();
    const pastEvents = events.filter(event => event.date === isoStr && fromISO(event.date) < today);
    
    if (pastEvents.length > 0){
      // Find and highlight the first matching event card
      const firstEvent = pastEvents[0];
      const card = document.querySelector(`.event-card[data-id="${firstEvent.id}"]`);
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
        
        // Open detail panel for that event
        openDetailPanel(firstEvent);
      }
    } else {
      // If no events for this date, just clear any active event cards
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

  // Fetch events from MongoDB
  const events = await fetchSubmissionsFromMongoDB();
  
  const monthEvents = events.filter(event => {
    const d = fromISO(event.date);
    const isSameMonth = (d.getFullYear() === viewYear && d.getMonth() === viewMonth);
    const isPast = d < today;
    return isSameMonth && isPast;
  }).sort((a,b) => (b.date + b.start) > (a.date + a.start) ? 1 : -1);

  const q = (filterText || '').trim().toLowerCase();
  const filtered = monthEvents.filter(event => {
    if (!q) return true;
    return (event.title + ' ' + event.category + ' ' + event.description + ' ' + event.acronym + ' ' + event.completeName + ' ' + event.SDGCategory).toLowerCase().includes(q);
  });

  if (filtered.length === 0){
    const empty = document.createElement('div'); 
    empty.className = 'event-card';
    empty.innerHTML = `<div class="event-title">No past events</div><div class="event-meta muted">No events matching the month/search</div>`;
    eventsListEl.appendChild(empty);
    return;
  }

  filtered.forEach(event => {
    const card = document.createElement('div'); 
    card.className = 'event-card'; 
    card.tabIndex = 0;
    card.dataset.id = event.id;

    const head = document.createElement('div'); 
    head.className = 'event-head';
    const title = document.createElement('div'); 
    title.className = 'event-title'; 
    title.textContent = event.title;
    const meta = document.createElement('div'); 
    meta.className = 'event-meta'; 
    meta.textContent = `${event.date} • ${event.school}`;
    head.appendChild(title); 
    head.appendChild(meta);

    const details = document.createElement('div'); 
    details.className = 'event-details';
    
    // Show SDG in the event card if available
    let sdgDisplay = '';
    if (event.SDGCategory && event.SDGCategory !== "Not specified") {
      sdgDisplay = `<span class="sdg-badge">${event.SDGCategory}</span>`;
    }
    
    details.innerHTML = `
      <div class="event-meta">
        <span class="cat">${event.organizationType}</span>
        ${sdgDisplay}
      </div>
      <div class="event-desc">${event.completeName}</div>
      <div class="event-extra">Applicant: ${event.submissionData.applicantInfo.applicant_name}</div>
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
      
      openDetailPanel(event);
      
      // Highlight corresponding day in calendar
      clearDayHighlights();
      const dayEl = document.querySelector(`.day[data-date="${event.date}"]`);
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
        openDetailPanel(event);
      }
    });

    eventsListEl.appendChild(card);
  });
}

// Update calendar cells with events (NO ANIMATION)
function updateCalendarCellsWithEvents(events) {
  // Clear all existing event badges
  document.querySelectorAll('.event-list').forEach(eventList => {
    eventList.innerHTML = '';
  });

  // Group events by date
  const eventsByDate = {};
  events.forEach(event => {
    if (!eventsByDate[event.date]) {
      eventsByDate[event.date] = [];
    }
    eventsByDate[event.date].push(event);
  });

  // Add events to each day cell
  Object.keys(eventsByDate).forEach(date => {
    const dayEl = document.querySelector(`.day[data-date="${date}"]`);
    if (dayEl) {
      const eventList = dayEl.querySelector('.event-list');
      if (eventList) {
        eventList.innerHTML = ''; // Clear existing content
        
        const eventsOnDate = eventsByDate[date];
        const eventsToShow = eventsOnDate.slice(0, 2);
        
        eventsToShow.forEach(eventItem => {
          const badge = document.createElement('span');
          badge.className = 'event-badge';
          badge.textContent = eventItem.acronym;
          eventList.appendChild(badge);
        });
        
        // Show "+X more" if there are more events
        if (eventsOnDate.length > 2) {
          const moreBadge = document.createElement('span');
          moreBadge.className = 'event-badge more-badge';
          moreBadge.textContent = `+${eventsOnDate.length - 2} more`;
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
function openDetailPanel(event) {
  const submission = event.submissionData;
  const eventData = event.eventData;
  
  detailTitle.textContent = event.title;
  detailMeta.textContent = `${event.date} • ${submission.organizationInfo.org_category} • ${submission.organizationInfo.org_type}`;
  
  // Improved design for detail panel with event and submission details
  detailBody.innerHTML = `
    <div class="detail-section">
      <div class="detail-header">
        <h3 class="detail-org-name">${submission.organizationInfo.org_name}</h3>
        <p class="detail-email">${submission.organizationInfo.org_email}</p>
      </div>
    </div>

    ${eventData ? `
    <div class="detail-section">
      <h4 class="detail-section-title">Event Details</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Event Name:</span>
          <span class="detail-value">${eventData.eventName}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Event Type:</span>
          <span class="detail-value">${eventData.eventType}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Date & Time:</span>
          <span class="detail-value">${event.date} • ${event.start} - ${event.end}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Venue:</span>
          <span class="detail-value">${eventData.eventVenue}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Attendees:</span>
          <span class="detail-value">${eventData.eventAttendees || 'N/A'}</span>
        </div>
      </div>
    </div>
    ` : ''}

    <div class="detail-section">
      <h4 class="detail-section-title">Organization Details</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Category:</span>
          <span class="detail-value">${submission.organizationInfo.org_category}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Type:</span>
          <span class="detail-value">${submission.organizationInfo.org_type}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">CBL Status:</span>
          <span class="detail-value status-${(submission.documentUploads?.cbl_status || '').toLowerCase().replace(' ', '-')}">${submission.documentUploads?.cbl_status || 'N/A'}</span>
        </div>
      </div>
    </div>

    ${event.SDGCategory && event.SDGCategory !== "Not specified" ? `
    <div class="detail-section">
      <h4 class="detail-section-title">Sustainable Development Goals</h4>
      <div class="sdg-section">
        <div class="sdg-badge-large">${event.SDGCategory}</div>
      </div>
    </div>
    ` : ''}

    <div class="detail-section">
      <h4 class="detail-section-title">Contact Information</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Applicant:</span>
          <span class="detail-value">${submission.applicantInfo.applicant_name} (${submission.applicantInfo.applicant_position})</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Applicant Email:</span>
          <span class="detail-value">${submission.applicantInfo.applicant_email}</span>
        </div>
        <div class="detail-item full-width">
          <span class="detail-label">Advisers:</span>
          <span class="detail-value">${submission.adviserInfo.adviser_name.join(', ') || 'None specified'}</span>
        </div>
      </div>
    </div>

    ${submission.organizationInfo.org_social && submission.organizationInfo.org_social.length > 0 ? `
    <div class="detail-section">
      <h4 class="detail-section-title">Social Media Links</h4>
      <div class="social-links">
        ${submission.organizationInfo.org_social.map(link => 
          `<a href="${link}" target="_blank" class="social-link">
            <span class="link-icon"></span>
            ${link}
          </a>`
        ).join('')}
      </div>
    </div>
    ` : ''}

    <div class="detail-section">
      <h4 class="detail-section-title">Documents & Files</h4>
      <div class="document-list">
        ${submission.documentUploads?.strategic_plan ? `
        <div class="document-item">
          <span class="doc-icon"></span>
          <div class="doc-info">
            <span class="doc-name">Strategic Plans</span>
            <a href="${submission.documentUploads.strategic_plan.url}" target="_blank" class="doc-link">Download</a>
          </div>
        </div>
        ` : ''}
        
        ${submission.documentUploads?.annual_report ? `
        <div class="document-item">
          <span class="doc-icon"></span>
          <div class="doc-info">
            <span class="doc-name">Annual Report</span>
            <a href="${submission.documentUploads.annual_report.url}" target="_blank" class="doc-link">Download</a>
          </div>
        </div>
        ` : ''}
        
        ${submission.documentUploads?.cbl ? `
        <div class="document-item">
          <span class="doc-icon"></span>
          <div class="doc-info">
            <span class="doc-name">Constitution & Bylaws</span>
            <a href="${submission.documentUploads.cbl.url}" target="_blank" class="doc-link">Download</a>
          </div>
        </div>
        ` : ''}
        
        ${submission.documentUploads?.infographic ? `
        <div class="document-item">
          <span class="doc-icon"></span>
          <div class="doc-info">
            <span class="doc-name">Infographics</span>
            <a href="${submission.documentUploads.infographic.url}" target="_blank" class="doc-link">Download</a>
          </div>
        </div>
        ` : ''}
        
        ${submission.documentUploads?.video_link ? `
        <div class="document-item">
          <span class="doc-icon"></span>
          <div class="doc-info">
            <span class="doc-name">Presentation Video</span>
            <a href="${submission.documentUploads.video_link}" target="_blank" class="doc-link">Watch Video</a>
          </div>
        </div>
        ` : ''}
      </div>
    </div>

    <div class="detail-section">
      <h4 class="detail-section-title">Submission Details</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Submission ID:</span>
          <span class="detail-value monospace">${event.id}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Status:</span>
          <span class="detail-value status-badge status-${(submission.status || '').toLowerCase()}">${submission.status}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Academic Year:</span>
          <span class="detail-value">${submission.academicYear || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Semester:</span>
          <span class="detail-value">${submission.semester || 'N/A'}</span>
        </div>
        ${submission.remarks ? `
        <div class="detail-item full-width">
          <span class="detail-label">Remarks:</span>
          <span class="detail-value">${submission.remarks}</span>
        </div>
        ` : ''}
        ${submission.additional_note ? `
        <div class="detail-item full-width">
          <span class="detail-label">Additional Note:</span>
          <span class="detail-value">${submission.additional_note}</span>
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
    'PENDING': '#f59e0b',
    'APPROVED': '#10b981',
    'REJECTED': '#ef4444',
    'NEEDS REVISION': '#f97316'
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
    console.log('Calendar initialized with submission data from MongoDB');
  } catch (error) {
    console.error('Error initializing calendar:', error);
  }
}

// Start the application
initializeCalendar();