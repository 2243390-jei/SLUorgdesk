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

// Logout and Profile Modal Elements
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const logoutModalClose = document.getElementById('logoutModalClose');
const logoutCancel = document.getElementById('logoutCancel');
const logoutConfirm = document.getElementById('logoutConfirm');

const mobileProfileBtn = document.getElementById('mobileProfileBtn');
const profileModal = document.getElementById('profileModal');
const profileModalClose = document.getElementById('profileModalClose');
const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

document.getElementById('curYear').textContent = new Date().getFullYear();

// Use current system date - no hardcoded dates
let viewDate = new Date();
const today = new Date();
today.setHours(0, 0, 0, 0); // Normalize to start of day for accurate comparison

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
async function fetchOrganization(opts = {}) {
  try {
    console.log("Fetching organizations from backend with options:", opts);

    const params = new URLSearchParams();
    if (opts.id) params.append('id', opts.id);
    if (opts.search) params.append('search', opts.search);
    if (opts.school) params.append('school', opts.school);
    if (opts.acronym) params.append('acronym', opts.acronym);
    if (opts.limit) params.append('limit', opts.limit);

    const url = `../../php-server/routes/organizations.php` + (Array.from(params).length ? `?${params.toString()}` : '');
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    const organizations = result.success ? result.data : [];
    console.log(`Successfully fetched ${organizations.length} organizations from backend`);

    // Create organization to school mapping (normalize _id)
    orgToSchoolMap = {}; // reset
    organizations.forEach(org => {
      if (org._id) {
        const id = (typeof org._id === 'string') ? org._id : (org._id.$oid ? org._id.$oid : org._id);
        orgToSchoolMap[id] = org.school;
      }
    });

    return orgToSchoolMap;
  } catch (error) {
    console.error("Error fetching organizations from backend:", error);
    return {};
  }
}

async function fetchSubmissions(opts = {}) {
  try {
    console.log("Fetching submissions from backend with options:", opts);

    // Build query string parameters for backend filtering
    const params = new URLSearchParams();
    if (opts.organizationId) params.append('organizationId', opts.organizationId);
    if (opts.status) params.append('status', opts.status);
    if (opts.search) params.append('search', opts.search);
    if (opts.month) params.append('month', opts.month); // 1-12
    if (opts.year) params.append('year', opts.year);
    if (opts.myorg) params.append('myorg', opts.myorg ? '1' : '0');
    if (opts.date) params.append('date', opts.date); // exact day YYYY-MM-DD
    if (opts.limit) params.append('limit', opts.limit);

    const url = `../../php-server/routes/submissions.php` + (Array.from(params).length ? `?${params.toString()}` : '');
    console.log("Fetching from URL:", url);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return [];
    }

    const result = await response.json();
    console.log("Backend response:", result);
    
    const submissions = result.success ? result.data : [];
    console.log(`Successfully fetched ${Array.isArray(submissions) ? submissions.length : 0} submissions from backend`);

    if (!Array.isArray(submissions) || submissions.length === 0) {
      console.log("No submissions found or submissions is not an array");
      return [];
    }

    // Transform submissions to events
    const transformedEvents = [];

    submissions.forEach((submission) => {
      if (submission.event && submission.event.eventName) {
        try {
          // Parse event date
          let eventDate;
          if (submission.event.eventDate) {
            eventDate = new Date(submission.event.eventDate);
          } else if (submission.submittedAt) {
            eventDate = new Date(submission.submittedAt);
          } else {
            eventDate = new Date();
          }
          
          // Check if date is valid
          if (isNaN(eventDate.getTime())) {
            console.warn("Invalid date for submission:", submission._id);
            eventDate = new Date();
          }
          
          const eventDateISO = toISO(eventDate);

          // Get organization info
          const orgId = submission.orgInfo?.orgId || submission.orgInfo?._id;
          let orgKey;
          
          if (typeof orgId === 'object' && orgId !== null && orgId.$oid) {
            orgKey = orgId.$oid;
          } else if (orgId) {
            orgKey = orgId.toString();
          } else {
            orgKey = submission.orgInfo?._id?.$oid || submission.orgInfo?._id;
          }
          
          const school = orgToSchoolMap[orgKey] || submission.orgInfo?.school || 'Unknown School';
          const orgName = submission.orgInfo?.name || 'Unknown Organization';
          const acronym = submission.orgInfo?.acronym || 'ORG';

          transformedEvents.push({
            id: (submission._id && submission._id.$oid) ? submission._id.$oid : submission._id,
            title: `${acronym} - ${submission.event.eventName}`,
            date: eventDateISO,
            start: submission.event.startTime || "09:00",
            end: submission.event.endTime || "10:00",
            category: getCategoryFromOrgType(acronym),
            description: `${orgName} - ${submission.event.eventName}`,
            submissionData: submission,
            eventData: submission.event,
            status: submission.status || "Unknown",
            school: school,
            organizationType: acronym,
            acronym: acronym,
            completeName: orgName,
            SDGCategory: submission.event.eventSDG ? 
              (Array.isArray(submission.event.eventSDG) ? 
                submission.event.eventSDG.join(', ') : 
                submission.event.eventSDG) : 
              "Not specified"
          });
          
          console.log("Transformed event:", transformedEvents[transformedEvents.length - 1]);
        } catch (error) {
          console.error("Error transforming submission:", submission._id, error);
        }
      }
    });

    console.log(`Total transformed events: ${transformedEvents.length}`);
    return transformedEvents;
  } catch (error) {
    console.error("Error fetching submissions from backend:", error);
    return [];
  }
}

// Helper function to categorize organizations
function getCategoryFromOrgType(orgType) {
  if (!orgType) return 'General';
  
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
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fromISO(iso){
  if (!iso || typeof iso !== 'string') return new Date();
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
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
    const el = document.createElement('div'); 
    el.className = 'week'; 
    el.textContent = w; 
    calendarGrid.appendChild(el);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--){
    const dnum = prevMonthDays - i;
    const cellDate = new Date(year, month - 1, dnum);
    const cell = makeDayCell(cellDate, true);
    calendarGrid.appendChild(cell);
  }

  // Current month days
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
      const cellDate = new Date(year, month + 1, k);
      const cell = makeDayCell(cellDate, true);
      calendarGrid.appendChild(cell);
    }
  }

  // Update calendar cells with events after rendering
  const events = await fetchSubmissions({
    month: month + 1,
    year: year
  });
  
  console.log(`Rendering calendar with ${events.length} events`);
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
  const todayISO = toISO(today);
  if (iso === todayISO && !inactive) {
    todayMark.textContent = 'Today';
    todayMark.style.fontSize = '12px';
    todayMark.style.color = '#2563eb';
  }
  
  dateRow.appendChild(dayNum); 
  dateRow.appendChild(todayMark);
  el.appendChild(dateRow);

  const evList = document.createElement('div');
  evList.className = 'event-list';
  
  // Create empty spacer
  const spacer = document.createElement('div'); 
  spacer.style.minHeight = '6px'; 
  evList.appendChild(spacer);
  
  el.appendChild(evList);

  // Add click event to ALL cells
  el.addEventListener('click', async () => {
    // Only act when clicking current-month days
    if (inactive) return;
    
    clearDayHighlights();
    el.classList.add('highlight');

    const isoStr = iso;
    console.log(`Clicked on date: ${isoStr}`);
    
    // Request backend for exact-day events
    const events = await fetchSubmissions({
      date: isoStr
    });

    console.log(`Found ${events.length} events for ${isoStr}`);
    
    // Filter past events (events before today)
    const pastEvents = events.filter(event => {
      const eventDate = fromISO(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate < today;
    });

    console.log(`Past events: ${pastEvents.length}`);
    
    if (pastEvents.length > 0){
      // Find and highlight the first matching event card
      const firstEvent = pastEvents[0];
      const card = document.querySelector(`.event-card[data-id="${firstEvent.id}"]`);
      if (card) {
        // Scroll to the card if needed
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Highlight the card
        document.querySelectorAll('.event-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        // Open detail panel for that event
        openDetailPanel(firstEvent);
      } else {
        // If card not found in DOM, open detail panel directly
        openDetailPanel(firstEvent);
      }
    } else {
      // If no events for this date, clear any active event cards
      document.querySelectorAll('.event-card').forEach(c => c.classList.remove('active'));
      console.log("No past events found for this date");
    }
  });

  return el;
}

// ---------------- Render Past Events panel ----------------
async function renderPastEvents(filterText = '') {
  console.log(`Rendering past events with filter: "${filterText}"`);
  
  eventsListEl.innerHTML = '';
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Fetch events from backend for current month
  const events = await fetchSubmissions({
    month: viewMonth + 1,
    year: viewYear
  });

  console.log(`Fetched ${events.length} total events for month ${viewMonth + 1}/${viewYear}`);

  // Filter by month and past status
  const monthEvents = events.filter(event => {
    const d = fromISO(event.date);
    d.setHours(0, 0, 0, 0);
    
    const isSameMonth = (d.getFullYear() === viewYear && d.getMonth() === viewMonth);
    const isPast = d < today;
    
    return isSameMonth && isPast;
  }).sort((a,b) => (b.date + b.start) > (a.date + a.start) ? 1 : -1);

  console.log(`Month events (past only): ${monthEvents.length}`);

  // THEN filter by search text on client side only
  const q = (filterText || '').trim().toLowerCase();
  const filtered = monthEvents.filter(event => {
    if (!q) return true;
    
    const searchText = (
      (event.title || '') + ' ' + 
      (event.category || '') + ' ' + 
      (event.description || '') + ' ' + 
      (event.acronym || '') + ' ' + 
      (event.completeName || '') + ' ' + 
      (event.SDGCategory || '') + ' ' +
      (event.school || '')
    ).toLowerCase();
    
    return searchText.includes(q);
  });

  console.log(`Filtered events after search: ${filtered.length}`);

  if (filtered.length === 0){
    const empty = document.createElement('div'); 
    empty.className = 'event-card';
    empty.innerHTML = `
      <div class="event-title">No past events found</div>
      <div class="event-meta muted">
        ${q ? 'No events matching your search' : 'No past events for this month'}
      </div>
    `;
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
    title.textContent = event.title || 'Untitled Event';
    
    const meta = document.createElement('div'); 
    meta.className = 'event-meta'; 
    meta.textContent = `${event.date} • ${event.school} • ${event.start}`;
    
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
      <div class="event-desc">${event.completeName || event.description}</div>
      <div class="event-extra">${event.category} • ${event.status}</div>
      ${sdgDisplay}
    `;

    card.appendChild(head);
    card.appendChild(details);

    // Clicking opens slide-in panel with full details
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Remove active class from all other cards
      document.querySelectorAll('.event-card').forEach(c => c.classList.remove('active'));
      // Add active class to clicked card
      card.classList.add('active');
      
      openDetailPanel(event);
      
      // Highlight corresponding day in calendar
      clearDayHighlights();
      const dayEl = document.querySelector(`.day[data-date="${event.date}"]:not(.inactive)`);
      if (dayEl) {
        dayEl.classList.add('highlight');
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

// Update calendar cells with events
function updateCalendarCellsWithEvents(events) {
  console.log(`Updating calendar cells with ${events.length} events`);
  
  // Clear all existing event badges
  document.querySelectorAll('.event-list').forEach(eventList => {
    eventList.innerHTML = '';
  });

  // Group events by date
  const eventsByDate = {};
  events.forEach(event => {
    if (event && event.date) {
      if (!eventsByDate[event.date]) {
        eventsByDate[event.date] = [];
      }
      eventsByDate[event.date].push(event);
    }
  });

  console.log(`Events grouped by date:`, Object.keys(eventsByDate));

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
          badge.textContent = eventItem.acronym || 'EVT';
          badge.title = eventItem.title;
          eventList.appendChild(badge);
        });
        
        // Show "+X more" if there are more events
        if (eventsOnDate.length > 2) {
          const moreBadge = document.createElement('span');
          moreBadge.className = 'event-badge more-badge';
          moreBadge.textContent = `+${eventsOnDate.length - 2} more`;
          moreBadge.title = `${eventsOnDate.length - 2} more events`;
          eventList.appendChild(moreBadge);
        }
      }
    }
  });

  // Add spacers to days with no events
  document.querySelectorAll('.day:not(.inactive)').forEach(dayEl => {
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
  console.log("Opening detail panel for event:", event);
  
  const submission = event.submissionData || {};
  const eventData = event.eventData || {};
  
  detailTitle.textContent = event.title || 'Event Details';
  detailMeta.textContent = `${event.date} • ${event.school || 'Unknown School'} • ${event.organizationType || 'General'}`;
  
  // Improved design for detail panel with event and submission details
  detailBody.innerHTML = `
    <div class="detail-section">
      <div class="detail-header">
        <h3 class="detail-org-name">${submission.orgInfo?.name || 'Unknown Organization'}</h3>
        <p class="detail-email">${submission.orgInfo?.email || 'N/A'}</p>
      </div>
    </div>

    ${eventData.eventName ? `
    <div class="detail-section">
      <h4 class="detail-section-title">Event Details</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Event Name:</span>
          <span class="detail-value">${eventData.eventName}</span>
        </div>
        ${eventData.eventType ? `
        <div class="detail-item">
          <span class="detail-label">Event Type:</span>
          <span class="detail-value">${eventData.eventType}</span>
        </div>
        ` : ''}
        <div class="detail-item">
          <span class="detail-label">Date & Time:</span>
          <span class="detail-value">${event.date} • ${event.start || 'N/A'} - ${event.end || 'N/A'}</span>
        </div>
        ${eventData.eventVenue ? `
        <div class="detail-item">
          <span class="detail-label">Venue:</span>
          <span class="detail-value">${eventData.eventVenue}</span>
        </div>
        ` : ''}
        ${eventData.attendance ? `
        <div class="detail-item">
          <span class="detail-label">Attendance:</span>
          <span class="detail-value">${eventData.attendance}</span>
        </div>
        ` : ''}
        ${eventData.eventDescription ? `
        <div class="detail-item full-width">
          <span class="detail-label">Description:</span>
          <span class="detail-value">${eventData.eventDescription}</span>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    <div class="detail-section">
      <h4 class="detail-section-title">Organization Details</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">School:</span>
          <span class="detail-value">${event.school || 'Unknown'}</span>
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

    ${submission.applicationInfo ? `
    <div class="detail-section">
      <h4 class="detail-section-title">Contact Information</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Applicant:</span>
          <span class="detail-value">${submission.applicationInfo.applicantName || 'N/A'} (${submission.applicationInfo.position || 'N/A'})</span>
        </div>
        ${submission.applicationInfo.email ? `
        <div class="detail-item">
          <span class="detail-label">Applicant Email:</span>
          <span class="detail-value">${submission.applicationInfo.email}</span>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    ${eventData.supportingDocuments && eventData.supportingDocuments.length > 0 ? `
    <div class="detail-section">
      <h4 class="detail-section-title">Supporting Documents</h4>
      <div class="document-list">
        ${eventData.supportingDocuments.map((doc, index) => {
          const docTitle = getDocumentTitle(doc);
          const docUrl = typeof doc === 'string' ? doc : (doc.url || doc.link || '#');
          
          return `
            <div class="document-item">
              <span class="doc-icon">📄</span>
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

    ${eventData.eventProof ? `
    <div class="detail-section">
      <h4 class="detail-section-title">Event Proof</h4>
      <div class="document-list">
        <div class="document-item">
          <span class="doc-icon">✅</span>
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
          <span class="detail-value monospace">${event.id || 'N/A'}</span>
        </div>
        ${submission.academicYear ? `
        <div class="detail-item">
          <span class="detail-label">Academic Year:</span>
          <span class="detail-value">${submission.academicYear}</span>
        </div>
        ` : ''}
        ${submission.semester ? `
        <div class="detail-item">
          <span class="detail-label">Semester:</span>
          <span class="detail-value">${submission.semester}</span>
        </div>
        ` : ''}
        <div class="detail-item">
          <span class="detail-label">Status:</span>
          <span class="detail-value">${event.status}</span>
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
    
    const lowerTitle = title.toLowerCase();
    for (const [key, value] of Object.entries(docTypeMappings)) {
      if (lowerTitle.includes(key)) {
        return value;
      }
    }
    
    return title || 'Supporting Document';
  } else if (doc.title) {
    return doc.title;
  } else if (doc.name) {
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

// ---------------- Logout Functionality ----------------
// Show logout confirmation modal
function showLogoutModal() {
  logoutModal.classList.add('show');
  logoutModal.setAttribute('aria-hidden', 'false');
}

// Hide logout confirmation modal
function hideLogoutModal() {
  logoutModal.classList.remove('show');
  logoutModal.setAttribute('aria-hidden', 'true');
}

// Logout function
function performLogout() {
  try {
    fetch('../../php-server/routes/logout.php', { method: 'POST' });
  } catch (err) {
    console.error('Logout error:', err);
  }

  window.location.href = '../../index.php';
}

// Event listeners for logout functionality
logoutBtn.addEventListener('click', showLogoutModal);
logoutModalClose.addEventListener('click', hideLogoutModal);
logoutCancel.addEventListener('click', hideLogoutModal);
logoutConfirm.addEventListener('click', performLogout);

// Close modals when clicking on overlay
logoutModal.addEventListener('click', (e) => {
  if (e.target === logoutModal) {
    hideLogoutModal();
  }
});

// ---------------- Search handling ----------------
searchInput.addEventListener('input', async (e) => {
  const q = e.target.value;
  await renderPastEvents(q);
});

searchClear.addEventListener('click', async () => {
  searchInput.value = '';
  await renderPastEvents('');
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
  viewDate = new Date();
  await renderCalendar();
  await renderPastEvents(searchInput.value);
  clearDayHighlights();
});

// Initial render
async function initializeCalendar() {
  try {
    console.log("Initializing calendar...");
    makeEventsListScrollable();
    
    // First fetch organizations to build the mapping
    await fetchOrganization();
    
    // Then render calendar and events
    await renderCalendar();
    await renderPastEvents();
    
    console.log("Calendar initialization complete");
  } catch (error) {
    console.error('Error initializing calendar:', error);
    // Show error message to user
    eventsListEl.innerHTML = `
      <div class="event-card" style="text-align: center;">
        <div class="event-title">Error Loading Calendar</div>
        <div class="event-meta muted">Please check console for details</div>
      </div>
    `;
  }
}

// Start the application
document.addEventListener('DOMContentLoaded', initializeCalendar);