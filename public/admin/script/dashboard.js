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
    type: 'bar',
    data: { labels: [], datasets: [{ label: 'Recent Activities', data: [], backgroundColor: '#4ea8ff' }] },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { 
                ticks: { color: '#fff' }, 
                grid: { color: 'rgba(255,255,255,0.1)' }
            },
            y: { 
                ticks: { display: false },
                grid: { color: 'rgba(255,255,255,0.1)' },
                beginAtZero: true,
                max: 10
            }
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
async function loadDashboardStats() {
    try {
        const res = await fetch(`${API_CONFIG.statsEndpoint}`);
        if (!res.ok) {
            console.error('Stats fetch failed:', res.status, res.statusText);
            return;
        }
        const payload = await res.json();
        if (!payload.success) {
            console.error('Stats load failed', payload);
            return;
        }

        const { roles, recentActivities, organizations, organizationCount, totalUsers } = payload.data;

        // Roles
        if (roles && roles.labels && roles.data) {
            chartRoles.data.labels = roles.labels;
            chartRoles.data.datasets[0].data = roles.data;
            chartRoles.data.datasets[0].backgroundColor = generatePalette(roles.data.length);
            chartRoles.update();
            console.log('Roles chart updated');
        } else {
            console.warn('Roles data missing or invalid', roles);
        }

        // Recent activities
        if (recentActivities && recentActivities.labels && recentActivities.data) {
            chartActive.data.labels = recentActivities.labels;
            chartActive.data.datasets[0].data = recentActivities.data;
            
            // Dynamically adjust canvas width based on number of days
            const numDays = recentActivities.labels.length;
            const chartCanvas = document.getElementById('chartActive');
            
            // Calculate appropriate width for the chart (wider bars and spacing)
            const canvasWidth = Math.max(400, numDays * 80);
            chartCanvas.style.width = canvasWidth + 'px';
            
            chartActive.update();
            console.log('Recent Activities chart updated with', numDays, 'days');
        } else {
            console.warn('Recent Activities data missing or invalid', recentActivities);
        }

        // Organizations
        if (organizations && organizations.labels && organizations.data) {
            chartSchools.data.labels = organizations.labels.slice(0,10);
            chartSchools.data.datasets[0].data = organizations.data.slice(0,10);
            chartSchools.data.datasets[0].backgroundColor = generatePalette(Math.min(10, organizations.data.length));
            chartSchools.update();
            console.log('Organizations chart updated');
        } else {
            console.warn('Organizations data missing or invalid', organizations);
        }

    } catch (err) {
        console.error('Error loading dashboard stats', err);
    }
}

// Initial load
loadDashboardStats();

// Optional: refresh every 5 minutes
setInterval(loadDashboardStats, 5 * 60 * 1000);

