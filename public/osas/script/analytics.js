// Check if Chart.js is loaded
if (typeof Chart === 'undefined') {
    console.error('Chart.js is not loaded. Please include Chart.js in your HTML.');
    // Load Chart.js dynamically if not loaded
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = init;
    document.head.appendChild(script);
} else {
    init();
}

// Constants
const SDG_COLORS = {
    "1. No Poverty": "#E5243B",
    "2. Zero Hunger": "#DDA63A",
    "3. Good Health": "#4C9F38",
    "4. Quality Education": "#C5192D",
    "5. Gender Equality": "#FF3A21",
    "6. Clean Water": "#26BDE2",
    "7. Affordable Energy": "#FCC30B",
    "8. Decent Work": "#A21942",
    "9. Innovation": "#FD6925",
    "10. Reduced Inequality": "#DD1367",
    "11. Sustainable Cities": "#FD9D24",
    "12. Consumption": "#BF8B2E",
    "13. Climate Action": "#3F7E44",
    "14. Life Below Water": "#0A97D9",
    "15. Life on Land": "#56C02B",
    "16. Peace and Justice": "#00689D",
    "17. Partnerships": "#19486A"
};

const SCHOOL_COLORS = {
    "SEA": "#800000",
    "SAMCIS": "#FFD700",
    "SONAHBS": "#800080",
    "STELA": "#0000FF",
    "SOM": "#FFC0CB",
    "SOL": "#FF0000"
};

// DOM Elements
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebar = document.querySelector('.sidebar');
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const logoutModalClose = document.getElementById('logoutModalClose');
const logoutCancel = document.getElementById('logoutCancel');
const logoutConfirm = document.getElementById('logoutConfirm');

// Chart instances
let charts = {
    submissions: null,
    sdg: null,
    schools: null
};

// Initialize application
function init() {
    console.log('Initializing Analytics Dashboard...');
    
    // Set current year
    document.getElementById('curYear').textContent = new Date().getFullYear();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load data
    loadAnalyticsData();
}

// Setup Event Listeners
function setupEventListeners() {
    // Mobile menu toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && 
            mobileMenuToggle && 
            !mobileMenuToggle.contains(e.target) && 
            sidebar.classList.contains('open')) {
            closeMobileMenu();
        }
    });
    
    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', showLogoutModal);
    }
    
    if (logoutModalClose) {
        logoutModalClose.addEventListener('click', hideLogoutModal);
    }
    
    if (logoutCancel) {
        logoutCancel.addEventListener('click', hideLogoutModal);
    }
    
    if (logoutConfirm) {
        logoutConfirm.addEventListener('click', performLogout);
    }
    
    if (logoutModal) {
        logoutModal.addEventListener('click', (e) => {
            if (e.target === logoutModal) hideLogoutModal();
        });
    }
    
    // Close mobile menu when clicking nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', closeMobileMenu);
    });
    
    // Window resize - update charts
    window.addEventListener('resize', () => {
        Object.values(charts).forEach(chart => {
            if (chart) chart.resize();
        });
    });
}

// Mobile Menu Functions
function toggleMobileMenu() {
    sidebar.classList.toggle('open');
    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}

function closeMobileMenu() {
    sidebar.classList.remove('open');
    document.body.style.overflow = '';
}

// Logout Functions
function showLogoutModal() {
    if (logoutModal) {
        logoutModal.classList.add('show');
    }
    closeMobileMenu();
}

function hideLogoutModal() {
    if (logoutModal) {
        logoutModal.classList.remove('show');
    }
}

function performLogout() {
    try {
        fetch('../../php-server/routes/logout.php', { method: 'POST' });
    } catch (err) {
        console.error('Logout error:', err);
    }
    window.location.href = '../../index.php';
}

// Data Fetching
async function fetchOrganizations() {
    try {
        const response = await fetch('../../php-server/routes/organizations.php');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }
        const result = await response.json();
        console.log('Organizations data:', result);
        return result.success ? result.data : [];
    } catch (error) {
        console.error('Error fetching organizations:', error);
        return [];
    }
}

async function fetchSubmissions() {
    try {
        const response = await fetch('../../php-server/routes/submissions.php');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }
        const result = await response.json();
        console.log('Submissions data:', result);
        return result.success ? result.data : [];
    } catch (error) {
        console.error('Error fetching submissions:', error);
        return [];
    }
}

// Load Analytics Data
async function loadAnalyticsData() {
    console.log('Loading analytics data...');
    
    try {
        // Show loading states
        showLoadingStates();
        
        // Fetch data
        const [submissions, organizations] = await Promise.all([
            fetchSubmissions(),
            fetchOrganizations()
        ]);
        
        console.log('Submissions count:', submissions.length);
        console.log('Organizations count:', organizations.length);
        
        // Process and render data
        const processedData = processAnalyticsData(submissions, organizations);
        renderAnalytics(processedData);
        
    } catch (error) {
        console.error('Error loading analytics data:', error);
        showError('Failed to load analytics data. Please check your internet connection and try again.');
    }
}

function showLoadingStates() {
    // Show loading messages
    const orgsList = document.getElementById('orgsList');
    if (orgsList) {
        orgsList.innerHTML = '<div class="loading-state">Loading organizations...</div>';
    }
    
    // Hide chart loading messages when charts render
}

function processAnalyticsData(submissions, organizations) {
    console.log('Processing analytics data...');
    
    // Create organization mapping
    const orgMap = {};
    organizations.forEach(org => {
        let orgId = org._id;
        
        // Handle MongoDB ObjectId format
        if (orgId && typeof orgId === 'object' && orgId.$oid) {
            orgId = orgId.$oid;
        } else if (typeof orgId === 'string') {
            orgId = orgId;
        }
        
        orgMap[orgId] = {
            name: org.name || 'Unknown',
            acronym: org.acronym || 'N/A',
            school: org.school || 'Unknown School'
        };
    });
    
    console.log('Organization map:', orgMap);
    
    // Process monthly data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCounts = new Array(12).fill(0);
    
    submissions.forEach(submission => {
        let date;
        
        // Try to get date from event, then submission date
        if (submission.event && submission.event.eventDate) {
            date = new Date(submission.event.eventDate);
        } else if (submission.submittedAt) {
            date = new Date(submission.submittedAt);
        } else {
            date = new Date(); // fallback
        }
        
        const month = date.getMonth();
        monthlyCounts[month]++;
    });
    
    console.log('Monthly counts:', monthlyCounts);
    
    // Process SDG data
    const sdgCounts = {};
    const sdgColors = [];
    const sdgLabels = [];
    
    // Initialize all SDGs (1-17)
    for (let i = 1; i <= 17; i++) {
        sdgCounts[i] = 0;
        sdgLabels.push(i.toString());
        
        // Find corresponding color
        const sdgKey = Object.keys(SDG_COLORS).find(key => key.startsWith(`${i}.`));
        sdgColors.push(sdgKey ? SDG_COLORS[sdgKey] : '#666666');
    }
    
    // Count SDG occurrences
    submissions.forEach(submission => {
        if (submission.event && submission.event.eventSDG) {
            const sdgs = Array.isArray(submission.event.eventSDG) ? 
                submission.event.eventSDG : [submission.event.eventSDG];
            
            sdgs.forEach(sdg => {
                if (sdg) {
                    // Extract number from SDG string
                    const match = sdg.toString().match(/\d+/);
                    if (match) {
                        const num = parseInt(match[0]);
                        if (num >= 1 && num <= 17) {
                            sdgCounts[num] = (sdgCounts[num] || 0) + 1;
                        }
                    }
                }
            });
        }
    });
    
    const sdgData = Object.values(sdgCounts);
    const activeGoals = sdgData.filter(count => count > 0).length;
    const totalSDGEvents = sdgData.reduce((sum, count) => sum + count, 0);
    
    console.log('SDG data:', sdgData);
    console.log('Active goals:', activeGoals);
    console.log('Total SDG events:', totalSDGEvents);
    
    // Process school data
    const schoolCounts = {};
    const schoolColors = [];
    const schoolLabels = [];
    
    submissions.forEach(submission => {
        let orgId = submission.orgInfo?.orgId;
        
        // Handle MongoDB ObjectId format
        if (orgId && typeof orgId === 'object' && orgId.$oid) {
            orgId = orgId.$oid;
        } else if (typeof orgId === 'string') {
            orgId = orgId;
        }
        
        const org = orgMap[orgId];
        const school = org ? org.school : 'Unknown School';
        
        schoolCounts[school] = (schoolCounts[school] || 0) + 1;
    });
    
    // Sort schools by count
    const sortedSchools = Object.entries(schoolCounts).sort((a, b) => b[1] - a[1]);
    
    sortedSchools.forEach(([school, count]) => {
        schoolLabels.push(school);
        schoolColors.push(SCHOOL_COLORS[school] || '#666666');
    });
    
    console.log('School data:', sortedSchools);
    
    // Process top organizations
    const orgCounts = {};
    
    submissions.forEach(submission => {
        let orgId = submission.orgInfo?.orgId;
        
        // Handle MongoDB ObjectId format
        if (orgId && typeof orgId === 'object' && orgId.$oid) {
            orgId = orgId.$oid;
        } else if (typeof orgId === 'string') {
            orgId = orgId;
        }
        
        const org = orgMap[orgId];
        if (org) {
            const key = `${org.acronym} - ${org.name}`;
            if (!orgCounts[key]) {
                orgCounts[key] = {
                    name: org.acronym || org.name,
                    submissions: 0,
                    school: org.school
                };
            }
            orgCounts[key].submissions++;
        }
    });
    
    const topOrgs = Object.values(orgCounts)
        .sort((a, b) => b.submissions - a.submissions)
        .slice(0, 5);
    
    console.log('Top organizations:', topOrgs);
    
    return {
        monthly: {
            labels: months,
            data: monthlyCounts
        },
        sdg: {
            labels: sdgLabels,
            data: sdgData,
            colors: sdgColors,
            totalEvents: totalSDGEvents,
            activeGoals: activeGoals
        },
        schools: {
            labels: schoolLabels,
            data: sortedSchools.map(([_, count]) => count),
            colors: schoolColors
        },
        organizations: topOrgs
    };
}

// Render Analytics
function renderAnalytics(data) {
    console.log('Rendering analytics...');
    
    try {
        // Update stats
        const sdgSubmissions = document.getElementById('sdgSubmissions');
        const sdgGoals = document.getElementById('sdgGoals');
        
        if (sdgSubmissions) {
            sdgSubmissions.textContent = `${data.sdg.totalEvents} Events`;
        }
        
        if (sdgGoals) {
            sdgGoals.textContent = `${data.sdg.activeGoals} Goals`;
        }
        
        // Create or update charts
        createOrUpdateChart('submissionsChart', 'line', {
            labels: data.monthly.labels,
            datasets: [{
                label: 'Submissions',
                data: data.monthly.data,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 2
            }]
        });
        
        createOrUpdateChart('sdgChart', 'bar', {
            labels: data.sdg.labels,
            datasets: [{
                label: 'SDG Submissions',
                data: data.sdg.data,
                backgroundColor: data.sdg.colors,
                borderWidth: 1
            }]
        });
        
        createOrUpdateChart('schoolsChart', 'bar', {
            labels: data.schools.labels,
            datasets: [{
                label: 'School Submissions',
                data: data.schools.data,
                backgroundColor: data.schools.colors,
                borderWidth: 1
            }]
        });
        
        // Render organizations
        renderOrganizations(data.organizations);
        
    } catch (error) {
        console.error('Error rendering analytics:', error);
        showError('Failed to render charts. Please refresh the page.');
    }
}

function createOrUpdateChart(canvasId, type, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas element #${canvasId} not found`);
        return;
    }
    
    // Remove loading message
    const loadingElement = canvas.nextElementSibling;
    if (loadingElement && loadingElement.classList.contains('chart-loading')) {
        loadingElement.style.display = 'none';
    }
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }
    
    // Create new chart
    charts[canvasId] = new Chart(ctx, {
        type: type,
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    cornerRadius: 4,
                    padding: 12
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        color: '#666'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#666'
                    }
                }
            }
        }
    });
}

function renderOrganizations(orgs) {
    const orgsList = document.getElementById('orgsList');
    if (!orgsList) return;
    
    if (orgs.length === 0) {
        orgsList.innerHTML = '<div class="no-data">No organization data available</div>';
        return;
    }
    
    let html = '';
    orgs.forEach((org, index) => {
        const schoolColor = SCHOOL_COLORS[org.school] || '#666666';
        
        html += `
            <div class="org-item">
                <div class="org-header">
                    <div class="rank-badge" style="background-color: ${schoolColor}">${index + 1}</div>
                    <div class="org-name">${org.name}</div>
                </div>
                <div class="org-stats">
                    <div class="org-stat">
                        <div class="org-stat-value">${org.submissions}</div>
                        <div class="org-stat-label">Submissions</div>
                    </div>
                    <div class="org-stat">
                        <div class="org-stat-value" style="color: ${schoolColor}">${org.school}</div>
                        <div class="org-stat-label">School</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    orgsList.innerHTML = html;
}

function showError(message) {
    console.error('Analytics Error:', message);
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <p>${message}</p>
        <button onclick="location.reload()" style="margin-top: 8px; padding: 6px 12px; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer;">
            Try Again
        </button>
    `;
    
    // Add to top of dashboard
    const dashboardBody = document.querySelector('.dashboard-body');
    if (dashboardBody) {
        dashboardBody.prepend(errorDiv);
    }
}

// Handle offline/online status
window.addEventListener('online', () => {
    console.log('Network connection restored. Reloading data...');
    loadAnalyticsData();
});

window.addEventListener('offline', () => {
    showError('Network connection lost. Please check your internet connection.');
});

// Export for debugging
window.analyticsDashboard = {
    reload: loadAnalyticsData,
    charts: charts
};