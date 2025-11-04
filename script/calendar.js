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
let viewDate = new Date();
const today = new Date();

// Organization to school mapping
let orgToSchoolMap = {};

// Make events list scrollable
function makeEventsListScrollable() {
  eventsListEl.style.flex = '1';
  eventsListEl.style.overflowY = 'auto';
  eventsListEl.style.maxHeight = '400px';
  eventsListEl.style.paddingRight = '8px';
  eventsListEl.style.minHeight = '200px';
}

// ---------------- MongoDB Integration ----------------
async function fetchOrganizationsFromMongoDB() {
  try {
    console.log("Fetching organizations from MongoDB...");
    const response = await fetch(`../dataFetch/fetchDatabase.php`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const organizations = await response.json();
    console.log(`Successfully fetched ${organizations.length} organizations from MongoDB`);

    // Create organization to school mapping
    organizations.forEach(org => {
      orgToSchoolMap[org._id] = org.school;
    });

    return orgToSchoolMap;
  } catch (error) {
    console.error("Error fetching organizations from MongoDB:", error);
    return {};
  }
}

async function fetchSubmissionsFromMongoDB() {
  try {
    console.log("Fetching submissions from MongoDB...");
    const response = await fetch(`../dataFetch/fetchSubmissions.php`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const submissions = await response.json();
    console.log(`Successfully fetched ${submissions.length} submissions from MongoDB`);

    if (submissions.length === 0) {
      console.warn(" No submissions found in database");
      return [];
    }

    // Transform submissions to events
    const transformedEvents = [];
    
    submissions.forEach((submission) => {
      // Process the event from submission (single event object)
      if (submission.event) {
        let eventDate = new Date(submission.event.eventDate || submission.submittedAt || Date.now());
        if (isNaN(eventDate)) eventDate = new Date();

        const eventDateISO = toISO(eventDate);
        
        // Get school from organization mapping
        const orgId = submission.orgInfo?.orgId;
        const school = orgToSchoolMap[orgId] || 'Unknown School';

        transformedEvents.push({
          id: submission._id?.$oid || submission._id,
          title: `${submission.orgInfo?.acronym || 'ORG'} - ${submission.event.eventName}`,
          date: eventDateISO,
          start: submission.event.startTime || "09:00",
          end: submission.event.endTime || "10:00",
          category: getCategoryFromOrgType(submission.orgInfo?.acronym),
          description: `${submission.orgInfo?.name || 'Unknown Organization'} - ${submission.event.eventName}`,
          submissionData: submission,
          eventData: submission.event,
          status: submission.status || "Unknown",
          school: school,
          organizationType: submission.orgInfo?.acronym || "Unknown Type",
          acronym: submission.orgInfo?.acronym || "No Acronym",
          completeName: submission.orgInfo?.name || "Unknown Name",
          SDGCategory: submission.event.eventSDG ? submission.event.eventSDG.join(', ') : "Not specified"
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
    'ICON': 'Academic',
    'SCO': 'Academic',
    'JMA': 'Activities',
    'CSS': 'Academic',
    'ACT': 'Activities'
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
          card.scrollIntoView(false);
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
      <div class="event-desc">${event.completeName}</div>
      <div class="event-extra">Applicant: ${event.submissionData.applicationInfo?.applicantName || 'N/A'}</div>
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
          dayEl.scrollIntoView(false);
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
  detailMeta.textContent = `${event.date} • ${event.school} • ${event.organizationType}`;
  
  // Improved design for detail panel with event and submission details
  detailBody.innerHTML = `
    <div class="detail-section">
      <div class="detail-header">
        <h3 class="detail-org-name">${submission.orgInfo?.name || 'Unknown Organization'}</h3>
        <p class="detail-email">${submission.orgInfo?.email || 'N/A'}</p>
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
          <span class="detail-label">Attendance:</span>
          <span class="detail-value">${eventData.attendance || 'N/A'}</span>
        </div>
        <div class="detail-item full-width">
          <span class="detail-label">Description:</span>
          <span class="detail-value">${eventData.eventDescription || 'No description available'}</span>
        </div>
      </div>
    </div>
    ` : ''}

    <div class="detail-section">
      <h4 class="detail-section-title">Organization Details</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">School:</span>
          <span class="detail-value">${event.school}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Acronym:</span>
          <span class="detail-value">${submission.orgInfo?.acronym || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Organization:</span>
          <span class="detail-value">${submission.orgInfo?.name || 'N/A'}</span>
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
          <span class="detail-value">${submission.applicationInfo?.applicantName || 'N/A'} (${submission.applicationInfo?.position || 'N/A'})</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Applicant Email:</span>
          <span class="detail-value">${submission.applicationInfo?.email || 'N/A'}</span>
        </div>
      </div>
    </div>

    ${eventData?.supportingDocuments && eventData.supportingDocuments.length > 0 ? `
    <div class="detail-section">
      <h4 class="detail-section-title">Supporting Documents</h4>
      <div class="document-list">
        ${eventData.supportingDocuments.map((doc, index) => {
          // Extract document title from filename or use a meaningful title
          let docTitle = 'Supporting Document';
          if (typeof doc === 'string') {
            // If it's a URL or filename, extract the meaningful part
            const fileName = doc.split('/').pop() || doc;
            docTitle = fileName.replace(/\.[^/.]+$/, ""); // Remove file extension
            docTitle = docTitle.replace(/[_-]/g, ' '); // Replace underscores and dashes with spaces
            docTitle = docTitle.charAt(0).toUpperCase() + docTitle.slice(1); // Capitalize first letter
          } else if (doc.title) {
            // If it's an object with title property
            docTitle = doc.title;
          } else if (doc.name) {
            // If it's an object with name property
            docTitle = doc.name;
          }
          
          const docUrl = typeof doc === 'string' ? doc : (doc.url || doc.link || '#');
          
          return `
            <div class="document-item">
              <span class="doc-icon"></span>
              <div class="doc-info">
                <span class="doc-name">${docTitle}</span>
                <a href="${docUrl}" target="_blank" class="doc-link">View</a>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    ` : ''}

    ${eventData?.eventProof ? `
    <div class="detail-section">
      <h4 class="detail-section-title">Event Proof</h4>
      <div class="document-list">
        <div class="document-item">
          <span class="doc-icon"></span>
          <div class="doc-info">
            <span class="doc-name">Event Proof Document</span>
            <a href="${eventData.eventProof}" target="_blank" class="doc-link">View</a>
          </div>
        </div>
      </div>
    </div>
    ` : ''}

    <div class="detail-section">
      <h4 class="detail-section-title">Submission Details</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Submission ID:</span>
          <span class="detail-value monospace">${event.id}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Academic Year:</span>
          <span class="detail-value">${submission.academicYear || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Semester:</span>
          <span class="detail-value">${submission.semester || 'N/A'}</span>
        </div>
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

// Helper function to extract meaningful document titles
function getDocumentTitle(doc) {
  if (!doc) return 'Document';
  
  if (typeof doc === 'string') {
    // If it's a URL or filename, extract the meaningful part
    const fileName = doc.split('/').pop() || doc;
    let title = fileName.replace(/\.[^/.]+$/, ""); // Remove file extension
    title = title.replace(/[_-]/g, ' '); // Replace underscores and dashes with spaces
    title = title.charAt(0).toUpperCase() + title.slice(1); // Capitalize first letter
    
    // Common document type mappings
    const docTypeMappings = {
      'proposal': 'Event Proposal',
      'budget': 'Budget Plan',
      'permit': 'Permit Document',
      'endorsement': 'Endorsement Letter',
      'attendance': 'Attendance Sheet',
      'minutes': 'Meeting Minutes',
      'photos': 'Event Photos',
      'report': 'Event Report',
      'proof': 'Event Proof',
      'evaluation': 'Evaluation Form'
    };
    
    // Check if the title matches any common document types
    const lowerTitle = title.toLowerCase();
    for (const [key, value] of Object.entries(docTypeMappings)) {
      if (lowerTitle.includes(key)) {
        return value;
      }
    }
    
    return title || 'Supporting Document';
  } else if (doc.title) {
    // If it's an object with title property
    return doc.title;
  } else if (doc.name) {
    // If it's an object with name property
    return doc.name;
  }
  
  return 'Document';
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
    
    // First fetch organizations to build the mapping
    await fetchOrganizationsFromMongoDB();
    
    // Then render calendar and events
    await renderCalendar();
    await renderPastEvents();
    console.log('Calendar initialized with submission data from MongoDB');
  } catch (error) {
    console.error('Error initializing calendar:', error);
  }
}

// Start the application
initializeCalendar();