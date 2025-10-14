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

// Use a fixed "today" for demo (change to new Date() for live)
let viewDate = new Date(2025, 9, 13); // Oct 13, 2025
const today = new Date(2025, 9, 13);

// ---------------- EXPANDED Demo events ----------------
const events = [
  {id: 101, title: "Orientation Meeting", date: "2025-10-02", start:"09:00", end:"10:00", category:"Meeting", description:"Discuss orientation plan with staff."},
  {id: 102, title: "Team Sync", date: "2025-10-05", start:"11:00", end:"11:30", category:"Standup", description:"Weekly sprint sync and blockers."},
  {id: 103, title: "Client Debrief", date: "2025-10-10", start:"14:00", end:"15:00", category:"Client", description:"Debrief on recent delivery and feedback."},
  {id: 104, title: "Security Patch", date: "2025-10-12", start:"22:00", end:"23:30", category:"Maintenance", description:"Apply emergency security patch to servers."},
  {id: 105, title: "Townhall", date: "2025-10-25", start:"15:00", end:"16:00", category:"All-hands", description:"Monthly company townhall."},
  {id: 106, title: "Budget Review", date: "2025-10-18", start:"10:00", end:"11:30", category:"Finance", description:"Quarterly budget review meeting."},
  {id: 107, title: "Product Launch", date: "2025-10-30", start:"13:00", end:"14:30", category:"Marketing", description:"Launch event for new product line."},
  {id: 108, title: "Training Session", date: "2025-10-08", start:"09:30", end:"12:00", category:"HR", description:"Employee training on new software."},
  
  // Previous months events
  {id: 201, title: "Project Kickoff", date: "2025-08-20", start:"09:30", end:"10:30", category:"Meeting", description:"Kickoff for new client project."},
  {id: 202, title: "Design Review", date: "2025-07-10", start:"14:00", end:"15:00", category:"Review", description:"UX/UI design review."},
  {id: 203, title: "Release 1.2", date: "2025-06-02", start:"02:00", end:"03:00", category:"Release", description:"Deployment of release v1.2."},
  {id: 204, title: "Quarterly Planning", date: "2025-09-15", start:"10:00", end:"12:00", category:"Strategy", description:"Q4 planning session with department heads."},
  {id: 205, title: "Client Workshop", date: "2025-09-22", start:"13:00", end:"17:00", category:"Client", description:"Full-day workshop with key client."},
  {id: 206, title: "System Upgrade", date: "2025-08-05", start:"20:00", end:"23:00", category:"Maintenance", description:"Scheduled system maintenance and upgrades."}
];

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
function renderCalendar(){
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
}

// Create a day cell element
function makeDayCell(dateObj, inactive=false){
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

  const eventsOnDate = events.filter(ev => ev.date === iso);

  const evList = document.createElement('div');
  evList.className = 'event-list';
  if (eventsOnDate.length > 0){
    // Show max 2 events in calendar cell to prevent overflow
    const eventsToShow = eventsOnDate.slice(0, 2);
    eventsToShow.forEach(ev => {
      const badge = document.createElement('span');
      badge.className = 'event-badge';
      const isPast = fromISO(ev.date) < today;
      badge.textContent = ev.title;
      evList.appendChild(badge);
    });
    // Show "+X more" if there are more events
    if (eventsOnDate.length > 2) {
      const moreBadge = document.createElement('span');
      moreBadge.className = 'event-badge';
      moreBadge.textContent = `+${eventsOnDate.length - 2} more`;
      moreBadge.style.background = '#f0f0f0';
      moreBadge.style.color = '#666';
      evList.appendChild(moreBadge);
    }
  } else {
    const spacer = document.createElement('div'); spacer.style.minHeight = '6px'; evList.appendChild(spacer);
  }
  el.appendChild(evList);

  el.addEventListener('click', () => {
    // only act when clicking current-month days
    if (inactive) return;
    clearDayHighlights();
    el.classList.add('highlight');

    const isoStr = iso;
    const pastEvents = events.filter(ev => ev.date === isoStr && fromISO(ev.date) < today);
    if (pastEvents.length){
      // open the first matching event in the events list
      const firstEv = pastEvents[0];
      const card = document.querySelector(`.event-card[data-id="${firstEv.id}"]`);
      if (card) {
        // scroll the events container to the card
        card.scrollIntoView({behavior:'smooth', block:'center'});
        // open detail panel for that event
        openDetailPanel(firstEv);
      }
    }
  });

  return el;
}

// ---------------- Render Past Events panel ----------------
function renderPastEvents(filterText = '') {
  eventsListEl.innerHTML = '';
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const monthEvents = events.filter(ev => {
    const d = fromISO(ev.date);
    const isSameMonth = (d.getFullYear() === viewYear && d.getMonth() === viewMonth);
    const isPast = d < today;
    return isSameMonth && isPast;
  }).sort((a,b) => (b.date + b.start) > (a.date + a.start) ? 1 : -1);

  const q = (filterText || '').trim().toLowerCase();
  const filtered = monthEvents.filter(ev => {
    if (!q) return true;
    return (ev.title + ' ' + ev.category + ' ' + ev.description).toLowerCase().includes(q);
  });

  if (filtered.length === 0){
    const empty = document.createElement('div'); empty.className = 'event-card';
    empty.innerHTML = `<div class="event-title">No past events</div><div class="event-meta muted">No events matching the month/search</div>`;
    eventsListEl.appendChild(empty);
    return;
  }

  filtered.forEach(ev => {
    const card = document.createElement('div'); card.className = 'event-card'; card.tabIndex = 0;
    card.dataset.id = ev.id;

    const head = document.createElement('div'); head.className = 'event-head';
    const title = document.createElement('div'); title.className = 'event-title'; title.textContent = ev.title;
    const meta = document.createElement('div'); meta.className = 'event-meta'; meta.textContent = `${ev.date} • ${ev.start} - ${ev.end}`;
    head.appendChild(title); head.appendChild(meta);

    const details = document.createElement('div'); details.className = 'event-details';
    details.innerHTML = `
      <div class="event-meta"><span class="cat">${ev.category}</span></div>
      <div class="event-desc">${ev.description}</div>
      <div class="event-extra">Event ID: ${ev.id}</div>
    `;

    card.appendChild(head);
    card.appendChild(details);

    // clicking opens slide-in panel with full details
    card.addEventListener('click', (e) => {
      // don't let click bubble accidentally cause other behaviors
      e.stopPropagation();
      openDetailPanel(ev);
      // highlight corresponding day in calendar
      clearDayHighlights();
      const dayEl = document.querySelector(`.day[data-date="${ev.date}"]`);
      if (dayEl) {
        dayEl.classList.add('highlight');
        dayEl.scrollIntoView({behavior:'smooth', block:'center'});
      }
    });

    // keyboard accessibility: Enter/Space opens details
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDetailPanel(ev);
      }
    });

    eventsListEl.appendChild(card);
  });
}

// ---------------- Slide-in detail panel ----------------
function openDetailPanel(ev) {
  detailTitle.textContent = ev.title;
  detailMeta.textContent = `${ev.date} • ${ev.start} - ${ev.end} • ${ev.category}`;
  detailBody.innerHTML = `
    <p style="margin-top:8px; line-height:1.5;">${ev.description}</p>
    <hr style="margin:12px 0;">
    <div style="font-size:13px; color:#6b7280;">
      <div><strong>Event ID:</strong> ${ev.id}</div>
      <div><strong>Category:</strong> ${ev.category}</div>
    </div>
  `;

  overlay.classList.add('show');
  detailPanel.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  detailPanel.setAttribute('aria-hidden', 'false');

  // focus for accessibility
  detailPanel.focus();
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
prevBtn.addEventListener('click', () => {
  viewDate.setMonth(viewDate.getMonth() - 1);
  renderCalendar();
  renderPastEvents(searchInput.value);
  clearDayHighlights();
});

nextBtn.addEventListener('click', () => {
  viewDate.setMonth(viewDate.getMonth() + 1);
  renderCalendar();
  renderPastEvents(searchInput.value);
  clearDayHighlights();
});

todayBtn.addEventListener('click', () => {
  viewDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  renderCalendar();
  renderPastEvents(searchInput.value);
  clearDayHighlights();
});

// initial render
renderCalendar();
renderPastEvents(); 