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

// ======== Active Users Chart (Top Widget 2) ========
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
            y: { ticks: { color: '#fff', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true }
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
                beginAtZero: true,
                max: 10
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

        // Recent activities - support both { labels,data } and array of activity objects
        const formatDate = (val) => {
            if (!val) return 'Unknown';
            // If value is an ObjectId string (24 hex chars), derive timestamp
            if (typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val)) {
                try {
                    const ts = parseInt(val.substring(0, 8), 16) * 1000;
                    const d = new Date(ts);
                    if (!isNaN(d)) return d.toLocaleDateString();
                } catch (e) { /* fallback below */ }
            }
            // Numbers (timestamp) or string dates
            try {
                const d = (typeof val === 'number') ? new Date(val) : new Date(String(val));
                if (!isNaN(d)) return d.toLocaleDateString();
            } catch (e) { /* ignore */ }
            // final fallback: return the string (trim) or 'Unknown'
            const s = String(val || '').trim();
            return s ? s : 'Unknown';
        };

        if (recentActivities) {
            // Case A: legacy object with labels/data already prepared by backend
            if (Array.isArray(recentActivities.labels) && Array.isArray(recentActivities.data)) {
                chartActive.data.labels = recentActivities.labels;
                chartActive.data.datasets[0].data = recentActivities.data;
                // width adjust
                const numItems = recentActivities.labels.length || 1;
                const canvasEl = document.getElementById('chartActive');
                if (canvasEl) {
                    const px = Math.max(480, numItems * 72);
                    canvasEl.style.setProperty('width', px + 'px', 'important');
                    const parent = canvasEl.closest('.chart-scroll-container');
                    if (parent) parent.style.overflowX = 'auto';
                }
                chartActive.update();
            }
            // Case B: recentActivities is an array of objects from backend: [{ createdAt, ... }, ...]
            else if (Array.isArray(recentActivities) && recentActivities.length && typeof recentActivities[0] === 'object') {
                // Aggregate activities by month for current year
                const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const counts = new Array(12).fill(0);
                const now = new Date();
                const currentYear = now.getFullYear();

                recentActivities.forEach(a => {
                    const raw = a.createdAt || a.date || a.timestamp || a.created_at || a._id || a.id || a.submittedAt;
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
            } else {
                console.warn('Recent Activities data missing or invalid', recentActivities);
            }
        } else {
            console.warn('Recent Activities not present in payload');
        }

        // Organizations (robust parsing - accepts multiple shapes)
        (function handleOrganizations(organizations) {
            const fallbackSchools = ['SEA','SAMCIS','SONAHBS','STELA','SOM','SOL','UNIVERSITY-WIDE'];
            let orgLabels = [], orgData = [];

            if (organizations) {
                // Case A: { labels: [], data: [] }
                if (Array.isArray(organizations.labels) && Array.isArray(organizations.data)) {
                    orgLabels = organizations.labels.slice();
                    orgData = organizations.data.slice();
                }
                // Case B: array of objects [{ label/name/school, value/... }, ...]
                else if (Array.isArray(organizations) && organizations.length && typeof organizations[0] === 'object') {
                    organizations.forEach(item => {
                        let label = item.label || item.name || item.school || item.schoolName || item.acronym || '';
                        if (label === null || typeof label === 'undefined') label = '';
                        label = String(label).trim();
                        if (!label) label = 'Unassigned';
                        const value = (item.value ?? item.count ?? item.users ?? item.total ?? item.amount ?? 0);
                        orgLabels.push(label);
                        orgData.push(Number(value) || 0);
                    });
                }
                // Case C: object map { "SAMCIS": 12, "SEA": 3, ... }
                else if (typeof organizations === 'object' && !Array.isArray(organizations)) {
                    for (const [k, v] of Object.entries(organizations)) {
                        const label = (k && String(k).trim()) || 'Unassigned';
                        orgLabels.push(label);
                        orgData.push(Number(v) || 0);
                    }
                }
                // Case D: simple numeric array [4,1,1,...] -> assume fallback school order
                else if (Array.isArray(organizations) && organizations.length && organizations.every(n => typeof n === 'number')) {
                    orgData = organizations.slice();
                    orgLabels = fallbackSchools.slice(0, orgData.length);
                }
            }

            // Normalize labels and replace empty/unknown tokens
            orgLabels = orgLabels.map(l => {
                if (!l || String(l).trim().length === 0) return 'Unassigned';
                const s = String(l).trim();
                if (['unknown','null','undefined',''].includes(s.toLowerCase())) return 'Unassigned';
                return s;
            });

            // If nothing found, fall back to a known school list (no "Unknown")
            if (orgLabels.length === 0 || orgData.length === 0) {
                console.warn('Organizations data missing or unexpected shape:', organizations);
                const fallback = fallbackSchools;
                chartSchools.data.labels = fallback;
                chartSchools.data.datasets[0].data = new Array(fallback.length).fill(0);
                chartSchools.data.datasets[0].backgroundColor = generatePalette(fallback.length);
            } else {
                chartSchools.data.labels = orgLabels.slice(0, 10);
                chartSchools.data.datasets[0].data = orgData.slice(0, 10);
                chartSchools.data.datasets[0].backgroundColor = generatePalette(Math.min(10, orgData.length));
            }
            chartSchools.update();
        })(organizations);

    } catch (err) {
        console.error('Error loading dashboard stats', err);
    }
}

// Initial load (backend handles filtering). Call with '7d', '30d', or 'all'.
loadDashboardStats('7d');

// Optional: refresh periodically
setInterval(() => loadDashboardStats('7d'), 5 * 60 * 1000);

