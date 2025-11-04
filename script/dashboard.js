// School colors mapping - Match analytics colors
const SCHOOL_COLORS = {
    "SEA": "#800000",      // Maroon
    "SAMCIS": "#FFD700",   // Yellow
    "SONAHBS": "#800080",  // Purple
    "STELA": "#0000FF",    // Blue
    "SOM": "#FFC0CB",      // Pink
    "SOL": "#FF0000",      // Red
    "SNA": "#00FF00",      // Green
    "Unknown School": "#666666" // Gray for unknown
};

// Role colors mapping
const ROLE_COLORS = {
    "admin": "#4CAF50",     // Green
    "osas": "#2196F3",      // Blue
    "student": "#FFC107",   // Amber
    "orgAdmin": "#9C27B0",  // Purple
    "faculty": "#FF5722"    // Deep Orange
};

class DashboardAnalytics {
    constructor() {
        // Initialize chart containers
        this.orgsBySchoolChart = null;
        this.usersByRoleChart = null;
        this.usersBySchoolChart = null;
        
        // Initialize data containers
        this.orgsData = null;
        this.usersData = null;
        
        // Current year for footer
        this.currentYear = new Date().getFullYear();
    }

    async init() {
        try {
            // Set current year
            document.getElementById('curYear').textContent = this.currentYear;
            
            // Fetch data
            await this.fetchData();
            
            // Process and render charts
            this.renderCharts();
            
            // Setup event listeners
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    async fetchData() {
        try {
            // Fetch organizations data
            const orgsResponse = await fetch('../dataFetch/fetchDatabase.php');
            if (!orgsResponse.ok) throw new Error('Failed to fetch organizations');
            this.orgsData = await orgsResponse.json();

            // Fetch users data
            const usersResponse = await fetch('../dataFetch/fetchUsers.php');
            if (!usersResponse.ok) throw new Error('Failed to fetch users');
            this.usersData = await usersResponse.json();
            
            console.log('Organizations data:', this.orgsData);
            console.log('Users data:', this.usersData);
        } catch (error) {
            console.error('Error fetching data:', error);
            throw new Error('Failed to fetch data: ' + error.message);
        }
    }

    renderCharts() {
        this.renderOrgsBySchoolChart();
        this.renderUsersByRoleChart();
        this.renderUsersBySchoolChart();
    }

    renderOrgsBySchoolChart() {
        // Count organizations by school
        const schoolCounts = {};
        this.orgsData.forEach(org => {
            const school = org.school || 'Unknown School';
            schoolCounts[school] = (schoolCounts[school] || 0) + 1;
        });

        // Prepare data for chart
        const labels = Object.keys(schoolCounts);
        const data = labels.map(school => schoolCounts[school]);
        const colors = labels.map(school => SCHOOL_COLORS[school] || '#666666');

        // Create chart with modern styling
        const ctx = document.getElementById('orgsBySchoolChart').getContext('2d');
        this.orgsBySchoolChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverBorderWidth: 3,
                    hoverBorderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 12,
                                family: 'Inter, system-ui'
                            },
                            color: '#26343f'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(38, 52, 63, 0.9)',
                        titleFont: {
                            family: 'Inter, system-ui',
                            size: 13
                        },
                        bodyFont: {
                            family: 'Inter, system-ui',
                            size: 13
                        },
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                cutout: '60%',
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    }

    renderUsersByRoleChart() {
        // Count users by role
        const roleCounts = {};
        this.usersData.forEach(user => {
            const role = user.role || 'Unknown Role';
            roleCounts[role] = (roleCounts[role] || 0) + 1;
        });

        // Prepare data for chart
        const labels = Object.keys(roleCounts);
        const data = labels.map(role => roleCounts[role]);
        const colors = labels.map(role => ROLE_COLORS[role] || '#666666');

        // Create chart with modern styling
        const ctx = document.getElementById('usersByRoleChart').getContext('2d');
        this.usersByRoleChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverBorderWidth: 3,
                    hoverBorderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 12,
                                family: 'Inter, system-ui'
                            },
                            color: '#26343f'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(38, 52, 63, 0.9)',
                        titleFont: {
                            family: 'Inter, system-ui',
                            size: 13
                        },
                        bodyFont: {
                            family: 'Inter, system-ui',
                            size: 13
                        },
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    }

    renderUsersBySchoolChart() {
        // Count users by school
        const schoolCounts = {};
        this.usersData.forEach(user => {
            const school = user.school || 'Unknown School';
            schoolCounts[school] = (schoolCounts[school] || 0) + 1;
        });

        // Prepare data for chart
        const labels = Object.keys(schoolCounts);
        const data = labels.map(school => schoolCounts[school]);
        const colors = labels.map(school => SCHOOL_COLORS[school] || '#666666');

        // Create chart with modern styling
        const ctx = document.getElementById('usersBySchoolChart').getContext('2d');
        this.usersBySchoolChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Users',
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0,
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            font: {
                                family: 'Inter, system-ui',
                                size: 11
                            },
                            color: '#8f9aa3',
                            stepSize: 1
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            font: {
                                family: 'Inter, system-ui',
                                size: 11
                            },
                            color: '#8f9aa3'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(38, 52, 63, 0.9)',
                        titleFont: {
                            family: 'Inter, system-ui',
                            size: 13
                        },
                        bodyFont: {
                            family: 'Inter, system-ui',
                            size: 13
                        },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    setupEventListeners() {
        // Logout Modal Elements
        const logoutBtn = document.getElementById('logoutBtn');
        const logoutModal = document.getElementById('logoutModal');
        const logoutModalClose = document.getElementById('logoutModalClose');
        const logoutCancel = document.getElementById('logoutCancel');
        const logoutConfirm = document.getElementById('logoutConfirm');

        // Profile Modal Elements
        const mobileProfileBtn = document.getElementById('mobileProfileBtn');
        const profileModal = document.getElementById('profileModal');
        const profileModalClose = document.getElementById('profileModalClose');

        // Logout Button Click
        logoutBtn.addEventListener('click', () => {
            this.showModal(logoutModal);
        });

        // Profile Button Click
        mobileProfileBtn.addEventListener('click', () => {
            this.showProfileModal();
        });

        // Close Modal functions
        [logoutModalClose, logoutCancel].forEach(element => {
            element.addEventListener('click', () => {
                this.hideModal(logoutModal);
            });
        });

        profileModalClose.addEventListener('click', () => {
            this.hideModal(profileModal);
        });

        // Confirm Logout
        logoutConfirm.addEventListener('click', () => {
            window.location.href = '../index.html';
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === logoutModal) {
                this.hideModal(logoutModal);
            }
            if (e.target === profileModal) {
                this.hideModal(profileModal);
            }
        });

        // Handle window resize for charts
        window.addEventListener('resize', () => {
            if (this.orgsBySchoolChart) this.orgsBySchoolChart.resize();
            if (this.usersByRoleChart) this.usersByRoleChart.resize();
            if (this.usersBySchoolChart) this.usersBySchoolChart.resize();
        });
    }

    showModal(modal) {
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
    }

    hideModal(modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    }

    showProfileModal() {
        const profileModal = document.getElementById('profileModal');
        const modalBody = profileModal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <div class="profile-info">
                <div class="profile-large">A</div>
                <div class="profile-details">
                    <h4>Hello, Admin</h4>
                    <div class="profile-logout">
                        <button id="profileLogoutBtn" class="btn-logout">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('profileLogoutBtn').addEventListener('click', () => {
            window.location.href = "../index.html";
        });
        
        this.showModal(profileModal);
    }

    showError(message) {
        console.error('Dashboard Error:', message);
        // You can implement a toast notification or error modal here
        alert(`Dashboard Error: ${message}`);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new DashboardAnalytics();
    dashboard.init();
});