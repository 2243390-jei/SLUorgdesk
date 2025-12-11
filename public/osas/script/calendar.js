// DOM Elements
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
const detailBack = document.getElementById('detailBack');
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const logoutModalClose = document.getElementById('logoutModalClose');
const logoutCancel = document.getElementById('logoutCancel');
const logoutConfirm = document.getElementById('logoutConfirm');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebar = document.querySelector('.sidebar');

// Constants
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// State
let viewDate = new Date();
const today = new Date();
today.setHours(0, 0, 0, 0);
let orgToSchoolMap = {};
let orgByAcronym = {};
let orgById = {};
let orgByName = {};

// Initialize
async function init() {
    document.getElementById('curYear').textContent = new Date().getFullYear();
    // ensure organization -> school map is loaded before rendering so transformSubmissions
    // can inject the correct school value into each event
    await fetchOrganizations();
    setupEventListeners();
    // now render calendar and events (fetchSubmissions / transformSubmissions will use orgToSchoolMap)
    await renderCalendar();
    await renderPastEvents();
}

// Setup Event Listeners
function setupEventListeners() {
    // Mobile menu
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    overlay.addEventListener('click', closeMobileMenu);
    
    // Calendar navigation
    prevBtn.addEventListener('click', () => navigateMonth(-1));
    nextBtn.addEventListener('click', () => navigateMonth(1));
    todayBtn.addEventListener('click', goToToday);
    
    // Search
    searchInput.addEventListener('input', () => renderPastEvents(searchInput.value));
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        renderPastEvents('');
        searchInput.focus();
    });
    
    // Detail panel
    detailClose.addEventListener('click', closeDetailPanel);
    detailBack.addEventListener('click', closeDetailPanel);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeDetailPanel();
            closeMobileMenu();
        }
    });
    
    // Close detail panel with Esc key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (detailPanel.classList.contains('open')) {
                closeDetailPanel();
            } else if (sidebar.classList.contains('open')) {
                closeMobileMenu();
            }
        }
    });
    
    // Logout
    logoutBtn.addEventListener('click', showLogoutModal);
    logoutModalClose.addEventListener('click', hideLogoutModal);
    logoutCancel.addEventListener('click', hideLogoutModal);
    logoutConfirm.addEventListener('click', performLogout);
    
    logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) hideLogoutModal();
    });
    
    // Close mobile menu when clicking on nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', closeMobileMenu);
    });
}

// Mobile Menu
function toggleMobileMenu() {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
    
    // Add/remove click event for overlay
    if (sidebar.classList.contains('open')) {
        overlay.addEventListener('click', closeMobileMenu);
    } else {
        overlay.removeEventListener('click', closeMobileMenu);
    }
}

function closeMobileMenu() {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
}

// Calendar Functions
function navigateMonth(direction) {
    viewDate.setMonth(viewDate.getMonth() + direction);
    renderCalendar();
    renderPastEvents(searchInput.value);
    clearHighlights();
}

function goToToday() {
    viewDate = new Date();
    renderCalendar();
    renderPastEvents(searchInput.value);
    clearHighlights();
}

function clearHighlights() {
    document.querySelectorAll('.day.highlight').forEach(el => el.classList.remove('highlight'));
    document.querySelectorAll('.event-card.active').forEach(el => el.classList.remove('active'));
}

// Date Utilities
function toISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function fromISO(iso) {
    if (!iso) return new Date();
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
}

// Fetch Data
// keep a simple helper for on-demand refresh of past events
async function fetchData() {
    await renderPastEvents();
}

async function fetchOrganizations() {
    try {
        const response = await fetch('../../php-server/routes/organizations.php');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        const organizations = result.success ? result.data : [];
        
        // reset maps
        orgToSchoolMap = {};
        orgByAcronym = {};
        orgById = {};
        orgByName = {};
        
        organizations.forEach(org => {
            // normalize possible id shapes
            const id = org._id?.$oid || org._id || (org.id && (org.id.$oid || org.id)) || null;
            const acronym = (org.acronym || '').toString().trim();
            const name = (org.name || '').toString().trim();
            const school = org.school || org.college || org.faculty || '';

            if (id) {
                orgById[id] = org;
                orgToSchoolMap[id] = school;
            }
            if (acronym) {
                orgByAcronym[acronym.toUpperCase()] = org;
                // map acronym key to school as well for quick lookup
                orgToSchoolMap[acronym.toUpperCase()] = school;
            }
            if (name) {
                orgByName[name.toLowerCase()] = org;
            }
        });
        
        return { orgToSchoolMap, orgByAcronym, orgById, orgByName };
    } catch (error) {
        console.error("Error fetching organizations:", error);
        return {};
    }
}

async function fetchSubmissions(options = {}) {
    try {
        const params = new URLSearchParams();
        if (options.month) params.append('month', options.month);
        if (options.year) params.append('year', options.year);
        if (options.date) params.append('date', options.date);
        if (options.search) params.append('search', options.search);
        
        const url = `../../php-server/routes/submissions.php?${params.toString()}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        const submissions = result.success ? result.data : [];
        
        return transformSubmissions(submissions);
    } catch (error) {
        console.error("Error fetching submissions:", error);
        return [];
    }
}

function transformSubmissions(submissions) {
    return submissions.map(submission => {
        const eventDate = submission.event?.eventDate ? new Date(submission.event.eventDate) : new Date();
        const orgId = submission.orgInfo?._id?.$oid || submission.orgInfo?._id || submission.orgInfo?.orgId || null;
        const acronym = (submission.orgInfo?.acronym || submission.org || '').toString().trim();
        const orgName = (submission.orgInfo?.name || '').toString().trim();

        // try to find organization record by id, then acronym, then name
        let orgRecord = null;
        if (orgId && orgById[orgId]) orgRecord = orgById[orgId];
        if (!orgRecord && acronym) orgRecord = orgByAcronym[acronym.toUpperCase()];
        if (!orgRecord && orgName) orgRecord = orgByName[orgName.toLowerCase()];

        const resolvedSchool = orgRecord?.school || submission.orgInfo?.school || orgToSchoolMap[orgId] || orgToSchoolMap[acronym?.toUpperCase()] || 'Unknown';

        // Format SDG properly
        let sdgDisplay = "Not specified";
        if (submission.event?.eventSDG) {
            if (Array.isArray(submission.event.eventSDG)) {
                sdgDisplay = submission.event.eventSDG.map(sdg => {
                    if (sdg.includes('.')) return sdg;
                    // Add SDG number formatting
                    const sdgNumber = sdg.match(/\d+/)?.[0] || '';
                    const sdgText = sdg.replace(/\d+/g, '').trim();
                    return `${sdgNumber}. ${sdgText}`;
                }).join(', ');
            } else {
                sdgDisplay = submission.event.eventSDG;
            }
        }
        
        return {
            id: submission._id?.$oid || submission._id,
            title: `${submission.orgInfo?.acronym || 'ORG'} - ${submission.event?.eventName || 'Event'}`,
            date: toISO(eventDate),
            start: submission.event?.startTime || "09:00",
            end: submission.event?.endTime || "10:00",
            category: getCategory(submission.orgInfo?.acronym),
            description: `${submission.orgInfo?.name || 'Organization'} - ${submission.event?.eventName || 'Event'}`,
            submissionData: submission,
            eventData: submission.event || {},
            school: resolvedSchool,
            acronym: submission.orgInfo?.acronym || 'ORG',
            completeName: submission.orgInfo?.name || 'Organization',
            SDGCategory: sdgDisplay
        };
    });
}

function getCategory(acronym) {
    const categories = {
        'ICON': 'Academic', 'SCO': 'Academic', 'JMA': 'Activities',
        'CSS': 'Academic', 'ACT': 'Activities', 'RPG': 'Organization'
    };
    return categories[acronym] || 'General';
}

// Render Calendar
async function renderCalendar() {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    monthNameEl.textContent = MONTHS[month];
    yearNameEl.textContent = year;
    
    // Clear and render week headers
    calendarGrid.innerHTML = DAYS.map(day => `<div class="week">${day}</div>`).join('');
    
    // Calculate dates
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    // Previous month
    for (let i = firstDay - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, prevMonthDays - i);
        calendarGrid.appendChild(createDayCell(date, true));
    }
    
    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        calendarGrid.appendChild(createDayCell(date, false));
    }
    
    // Next month
    const totalCells = calendarGrid.children.length;
    // avoid adding 7 extra cells when already aligned: use mod 7
    const remaining = (7 - ((totalCells - 7) % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
        const date = new Date(year, month + 1, i);
        calendarGrid.appendChild(createDayCell(date, true));
    }
    
    // Update with events
    const events = await fetchSubmissions({
        month: month + 1,
        year: year
    });
    
    updateCalendarWithEvents(events);
}

function createDayCell(date, inactive) {
    const iso = toISO(date);
    const isToday = iso === toISO(today);
    
    const cell = document.createElement('div');
    cell.className = `day ${inactive ? 'inactive' : ''}`;
    cell.dataset.date = iso;
    
    cell.innerHTML = `
        <div class="date-row">
            <div>${date.getDate()}</div>
            ${isToday && !inactive ? '<div class="today">Today</div>' : ''}
        </div>
        <div class="event-list"></div>
    `;
    
    if (!inactive) {
        cell.addEventListener('click', async () => {
            closeMobileMenu(); // Close mobile menu if open
            clearHighlights();
            cell.classList.add('highlight');
            
            const events = await fetchSubmissions({ date: iso });
            const pastEvents = events.filter(event => fromISO(event.date) < today);
            
            if (pastEvents.length > 0) {
                const firstEvent = pastEvents[0];
                const eventCard = document.querySelector(`.event-card[data-id="${firstEvent.id}"]`);
                
                if (eventCard) {
                    eventCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    document.querySelectorAll('.event-card').forEach(c => c.classList.remove('active'));
                    eventCard.classList.add('active');
                    openDetailPanel(firstEvent);
                }
            }
        });
    }
    
    return cell;
}

function updateCalendarWithEvents(events) {
    const eventsByDate = {};
    
    events.forEach(event => {
        if (!eventsByDate[event.date]) eventsByDate[event.date] = [];
        eventsByDate[event.date].push(event);
    });
    
    Object.entries(eventsByDate).forEach(([date, dateEvents]) => {
        const dayCell = document.querySelector(`.day[data-date="${date}"]`);
        if (dayCell) {
            const eventList = dayCell.querySelector('.event-list');
            eventList.innerHTML = '';
            
            dateEvents.slice(0, 2).forEach(event => {
                const badge = document.createElement('span');
                badge.className = 'event-badge';
                badge.textContent = event.acronym || 'EVT';
                badge.title = event.title;
                eventList.appendChild(badge);
            });
            
            if (dateEvents.length > 2) {
                const moreBadge = document.createElement('span');
                moreBadge.className = 'event-badge more-badge';
                moreBadge.textContent = `+${dateEvents.length - 2} more`;
                eventList.appendChild(moreBadge);
            }
        }
    });
}

// Render Past Events
async function renderPastEvents(filter = '') {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const events = await fetchSubmissions({ month: month + 1, year: year });
    const pastEvents = events
        .filter(event => {
            const eventDate = fromISO(event.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate < today;
        })
        .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start));
    
    const filtered = pastEvents.filter(event => {
        if (!filter) return true;
        const searchText = [
            event.title, event.category, event.description,
            event.acronym, event.completeName, event.SDGCategory, event.school
        ].join(' ').toLowerCase();
        return searchText.includes(filter.toLowerCase());
    });
    
    eventsListEl.innerHTML = '';
    
    if (filtered.length === 0) {
        eventsListEl.innerHTML = `
            <div class="event-card">
                <div class="event-title">No past events found</div>
                <div class="event-meta muted">
                    ${filter ? 'No events matching your search' : 'No past events for this month'}
                </div>
            </div>
        `;
        return;
    }
    
    filtered.forEach(event => {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.dataset.id = event.id;
        card.tabIndex = 0;
        
        card.innerHTML = `
            <div class="event-head">
                <div class="event-title">${event.title}</div>
                <div class="event-meta">${event.date} • ${event.school} • ${event.start}</div>
            </div>
            <div class="event-details">
                <div class="event-desc">${event.completeName}</div>
                <div class="event-extra">${event.category}
                ${event.SDGCategory !== "Not specified" ? 
                    `<span class="sdg-badge">${event.SDGCategory}</span>` : ''}
            </div>
        `;
        
        card.addEventListener('click', () => {
            closeMobileMenu(); // Close mobile menu if open
            document.querySelectorAll('.event-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            clearHighlights();
            
            const dayCell = document.querySelector(`.day[data-date="${event.date}"]:not(.inactive)`);
            if (dayCell) dayCell.classList.add('highlight');
            
            openDetailPanel(event);
        });
        
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openDetailPanel(event);
            }
        });
        
        eventsListEl.appendChild(card);
    });
}

// Detail Panel
function openDetailPanel(event) {
    const submission = event.submissionData || {};
    const eventData = event.eventData || {};
    
    detailTitle.textContent = event.title || 'Event Details';
    detailMeta.textContent = `${event.date} • ${event.school} • ${event.acronym}`;
    
    // Format time properly
    const startTime = event.start ? formatTime(event.start) : 'N/A';
    const endTime = event.end ? formatTime(event.end) : 'N/A';
    
    detailBody.innerHTML = `
        <div class="detail-section">
            <h4>Event Details</h4>
            <div class="detail-grid">
                <div class="detail-item full-width">
                    <div class="detail-label">EVENT NAME</div>
                    <div class="detail-value">${eventData.eventName || 'N/A'}</div>
                </div>
                <div class="detail-item full-width">
                    <div class="detail-label">DATE & TIME</div>
                    <div class="detail-value">${event.date} • ${startTime} - ${endTime}</div>
                </div>
                ${eventData.eventVenue ? `
                <div class="detail-item full-width">
                    <div class="detail-label">VENUE</div>
                    <div class="detail-value">${eventData.eventVenue}</div>
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="detail-section">
            <h4>Organization Details</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">SCHOOL</div>
                    <div class="detail-value">${event.school || 'Unknown'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">ACRONYM</div>
                    <div class="detail-value">${event.acronym || 'N/A'}</div>
                </div>
            </div>
        </div>
        
        ${event.SDGCategory && event.SDGCategory !== "Not specified" ? `
        <div class="detail-section">
            <h4>Sustainable Development Goals</h4>
            <div class="sdg-section">
                <div class="detail-value">${event.SDGCategory}</div>
            </div>
        </div>
        ` : ''}
        
        <div class="detail-section">
            <h4>Submission Details</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">SUBMISSION ID</div>
                    <div class="detail-value">${event.id ? event.id.substring(0, 8) + '...' : 'N/A'}</div>
                </div>
            </div>
        </div>
    `;
    
    overlay.classList.add('show');
    detailPanel.classList.add('open');
    detailPanel.focus();
    
    // Make sure back button is visible
    document.querySelector('.detail-back').style.display = 'flex';
}

function formatTime(timeStr) {
    if (!timeStr) return 'N/A';
    // Convert 24-hour time to 12-hour format
    const [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

function closeDetailPanel() {
    overlay.classList.remove('show');
    detailPanel.classList.remove('open');
    clearHighlights();
}

// Logout Functions
function showLogoutModal() {
    logoutModal.classList.add('show');
    closeMobileMenu();
}

function hideLogoutModal() {
    logoutModal.classList.remove('show');
}

function performLogout() {
    try {
        fetch('../../php-server/routes/logout.php', { method: 'POST' });
    } catch (err) {
        console.error('Logout error:', err);
    }
    window.location.href = '../../index.php';
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);