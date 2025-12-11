// ======== Users by Role Chart (Top Widget 1) ========
const ctxRoles = document.getElementById('chartRoles').getContext('2d');
let chartRoles = new Chart(ctxRoles, {
    type: 'doughnut',
    data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#fff' } }, tooltip: { enabled: true } }
    }
});

// ======== Monthly Activities Chart (Top Widget 2) ========
const ctxActive = document.getElementById('chartActive').getContext('2d');
let chartActive = new Chart(ctxActive, {
    type: 'line',
    data: { labels: [], datasets: [{
        label: 'Monthly Activities',
        data: [],
        fill: true,
        tension: 0.3,
        backgroundColor: 'rgba(78,168,255,0.12)',
        borderColor: '#4ea8ff',
        pointBackgroundColor: '#4ea8ff',
        pointRadius: 4
    }]},
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { ticks: { color: '#fff', beginAtZero: true }, grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true }
        },
        plugins: { legend: { display: false }, tooltip: { enabled: true } }
    }
});

// ======== Users by School Chart (Bottom Large Widget) ========
const ctxSchools = document.getElementById('chartSchools').getContext('2d');
let chartSchools = new Chart(ctxSchools, {
    type: 'bar',
    data: { labels: [], datasets: [{ label: 'Users by Organization', data: [], backgroundColor: [] }] },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
            y: { 
                ticks: { color: '#fff', stepSize: 1 },
                grid: { color: 'rgba(255,255,255,0.1)' },
                beginAtZero: true
            }
        },
        plugins: { legend: { display: false }, tooltip: { enabled: true } }
    }
});

// Utility: generate palette
function generatePalette(n) {
    const base = ['#4ea8ff','#ff6b6b','#f5a623','#34d399','#9b5de5','#ff9671','#00b4d8','#ffafcc'];
    const out = [];
    for (let i=0;i<n;i++) out.push(base[i % base.length]);
    return out;
}

// new: cache for organizations map
const _orgNameMap = {};

// new: fetch organizations list and build a lookup map (id, acronym, lower-name -> display name)
async function fetchOrganizationsMap() {
    if (Object.keys(_orgNameMap).length > 0) return _orgNameMap;

    const endpoint = (typeof API_CONFIG !== 'undefined' && API_CONFIG.orgsEndpoint) ? API_CONFIG.orgsEndpoint : '/api/organizations';
    try {
        const res = await fetch(endpoint, { credentials: 'include' });
        if (!res.ok) {
            console.warn('Failed to load organizations map:', res.status, res.statusText);
            return _orgNameMap;
        }
        const payload = await res.json();
        const list = Array.isArray(payload) ? payload : (payload?.data || payload?.organizations || []);
        if (!Array.isArray(list)) return _orgNameMap;

        list.forEach(org => {
            if (!org) return;
            const id = org.id ?? org._id ?? org.org_id ?? org.orgId;
            const name = org.name ?? org.orgName ?? org.title;
            const acronym = org.acronym ?? org.short ?? org.code;
            if (id) _orgNameMap[String(id)] = name || String(acronym || id);
            if (acronym) _orgNameMap[String(acronym)] = name || String(acronym);
            if (name) _orgNameMap[String(name).toLowerCase()] = name;
        });
    } catch (err) {
        console.warn('Error fetching organizations map', err);
    }
    return _orgNameMap;
}

// Fetch stats from Node.js API endpoint and update charts
async function loadDashboardStats(period = '7d') {
    try {
        if (typeof API_CONFIG === 'undefined' || !API_CONFIG.statsEndpoint) {
            console.error('API_CONFIG.statsEndpoint is not defined. Set it in script/config.js (e.g. API_CONFIG.statsEndpoint = "/api/stats")');
            return;
        }

        const url = new URL(API_CONFIG.statsEndpoint, window.location.origin);
        url.searchParams.set('period', period);

        const res = await fetch(url.toString(), { credentials: 'include' });
        if (!res.ok) {
            console.error('Stats fetch failed:', res.status, res.statusText);
            return;
        }
        const payload = await res.json();
        if (!payload || !payload.success) {
            console.error('Stats load failed', payload);
            return;
        }

        const { roles, recentActivities, organizations } = payload.data || {};

        // Roles
        if (roles && Array.isArray(roles.labels) && Array.isArray(roles.data)) {
            chartRoles.data.labels = roles.labels;
            chartRoles.data.datasets[0].data = roles.data;
            chartRoles.data.datasets[0].backgroundColor = generatePalette(roles.data.length);
            chartRoles.update();
        } else {
            console.warn('Roles data missing or invalid', roles);
        }

        // Recent activities -> aggregate by month (Jan..Dec) for current year
        if (Array.isArray(recentActivities)) {
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const counts = new Array(12).fill(0);
            const now = new Date();
            const currentYear = now.getFullYear();

            recentActivities.forEach(a => {
                const raw = a.createdAt || a.date || a.timestamp || a.created_at || a._id || a.id || a.submittedAt || a.time;
                let d = null;
                if (raw && typeof raw === 'string' && /^[0-9a-fA-F]{24}$/.test(raw)) {
                    // ObjectId -> timestamp
                    try {
                        const ts = parseInt(raw.substring(0,8), 16) * 1000;
                        d = new Date(ts);
                    } catch (e) { d = null; }
                } else {
                    d = raw ? new Date(raw) : null;
                }
                if (d && !isNaN(d)) {
                    const y = d.getFullYear();
                    const m = d.getMonth(); // 0-11
                    if (y === currentYear) counts[m] += 1;
                }
            });

            chartActive.data.labels = months;
            chartActive.data.datasets[0].data = counts;
            chartActive.update();
        } else if (recentActivities && Array.isArray(recentActivities.labels) && Array.isArray(recentActivities.data)) {
            // legacy server-provided shape
            chartActive.data.labels = recentActivities.labels;
            chartActive.data.datasets[0].data = recentActivities.data;
            chartActive.update();
        } else {
            console.warn('Recent Activities data missing or invalid', recentActivities);
        }

        // Organizations - map labels using org list so we show names instead of Unknown/IDs
        if (organizations && Array.isArray(organizations.labels) && Array.isArray(organizations.data)) {
            await fetchOrganizationsMap();
            const mapped = organizations.labels.map(lbl => {
                if (lbl === null || lbl === undefined) return 'Unknown';
                const s = String(lbl);
                return _orgNameMap[s] || _orgNameMap[s.toLowerCase()] || (s.trim() ? s : 'Unknown');
            });

            const topLabels = mapped.slice(0, 10);
            const topData = organizations.data.slice(0, 10);

            chartSchools.data.labels = topLabels;
            chartSchools.data.datasets[0].data = topData;
            chartSchools.data.datasets[0].backgroundColor = generatePalette(topLabels.length);
            chartSchools.update();
        } else {
            console.warn('Organizations data missing or invalid', organizations);
        }

    } catch (err) {
        console.error('Error loading dashboard stats', err);
    }
}

// Initial load (backend handles filtering). Call with '7d', '30d', or 'all'.
loadDashboardStats('7d');

// Optional: refresh periodically
setInterval(() => loadDashboardStats('7d'), 5 * 60 * 1000);

