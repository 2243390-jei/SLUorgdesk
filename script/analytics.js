// Updated SDG Category Mapping for your format
const SDG_CATEGORIES = {
    "1. No Poverty": "1. No Poverty",
    "2. Zero Hunger": "2. Zero Hunger", 
    "3. Good Health": "3. Good Health",
    "4. Quality Education": "4. Quality Education",
    "5. Gender Equality": "5. Gender Equality",
    "6. Clean Water": "6. Clean Water",
    "7. Affordable Energy": "7. Affordable Energy",
    "8. Decent Work": "8. Decent Work",
    "9. Innovation": "9. Innovation",
    "10. Reduced Inequality": "10. Reduced Inequality",
    "11. Sustainable Cities": "11. Sustainable Cities",
    "12. Consumption": "12. Consumption",
    "13. Climate Action": "13. Climate Action",
    "14. Life Below Water": "14. Life Below Water",
    "15. Life on Land": "15. Life on Land",
    "16. Peace and Justice": "16. Peace and Justice",
    "17. Partnerships": "17. Partnerships"
};

// SDG Color Mapping for your format
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

// School Color Mapping
const SCHOOL_COLORS = {
    "SEA": "#800000",      // Maroon
    "SAMCIS": "#FFD700",   // Yellow
    "SONAHBS": "#800080",  // Purple
    "STELA": "#0000FF",    // Blue
    "SOM": "#FFC0CB",      // Pink
    "SOL": "#FF0000"       // Red
};

// Enhanced Chart implementation with animations and hover effects
class LargeChart {
    constructor(ctx, type, data, options = {}) {
        this.ctx = ctx;
        this.type = type;
        this.data = data;
        this.options = options;
        this.hoverInfo = document.getElementById(options.hoverId);
        this.mouseX = 0;
        this.mouseY = 0;
        this.hoveredIndex = -1;
        this.animationProgress = 0;
        this.isAnimating = true;
        
        this.init();
        this.animateChart();
        this.setupInteractions();
    }

    init() {
        const canvas = this.ctx.canvas;
        const container = canvas.parentElement;
        
        // Set canvas to fill its container
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        
        console.log(`Canvas size: ${canvas.width}x${canvas.height}`);
    }

    animateChart() {
        const animate = (timestamp) => {
            if (!this.startTime) this.startTime = timestamp;
            const progress = Math.min((timestamp - this.startTime) / 1000, 1);
            this.animationProgress = progress;
            
            this.draw();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
            }
        };
        
        requestAnimationFrame(animate);
    }

    draw() {
        const { labels, datasets } = this.data;
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.type === 'bar') {
            this.drawBarChart(labels, datasets[0]);
        } else if (this.type === 'line') {
            this.drawLineChart(labels, datasets[0]);
        }

        // Always draw bottom labels
        this.drawBottomLabels(labels);
    }

    drawBarChart(labels, dataset) {
        const { data, backgroundColor } = dataset;
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        const padding = { top: 60, right: 60, bottom: 80, left: 80 };
        const chartWidth = canvas.width - padding.left - padding.right;
        const chartHeight = canvas.height - padding.top - padding.bottom;
        
        const maxValue = Math.max(...data, 1);
        const barWidth = (chartWidth / labels.length) * 0.6;
        
        // Store bar positions for hover detection
        this.barPositions = [];
        
        // Draw bars with animation
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = '14px Arial';
        
        labels.forEach((label, i) => {
            const x = padding.left + (i * chartWidth / labels.length) + (chartWidth / labels.length - barWidth) / 2;
            const animatedHeight = (data[i] / maxValue) * chartHeight * this.animationProgress;
            const y = padding.top + chartHeight - animatedHeight;
            
            // Store bar position
            this.barPositions.push({
                x: x,
                y: y,
                width: barWidth,
                height: animatedHeight,
                index: i,
                value: data[i],
                label: label
            });
            
            // Draw bar with animation - use color from dataset or fallback
            let barColor;
            if (Array.isArray(backgroundColor)) {
                barColor = backgroundColor[i];
            } else if (typeof backgroundColor === 'function') {
                barColor = backgroundColor(label, i);
            } else {
                barColor = backgroundColor;
            }
            
            ctx.fillStyle = barColor;
            ctx.fillRect(x, y, barWidth, animatedHeight);
        });

        this.drawAxes(padding, chartWidth, chartHeight, maxValue, 'Number of Events');
    }

    drawLineChart(labels, dataset) {
        const { data, borderColor = '#2563eb' } = dataset;
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        const padding = { top: 60, right: 60, bottom: 80, left: 80 };
        const chartWidth = canvas.width - padding.left - padding.right;
        const chartHeight = canvas.height - padding.top - padding.bottom;
        
        const maxValue = Math.max(...data, 1);
        
        // Store point positions for hover detection
        this.pointPositions = [];
        
        // Draw line with animation
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.strokeStyle = borderColor;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        const animatedData = data.map(val => val * this.animationProgress);
        
        labels.forEach((label, i) => {
            const x = padding.left + (i * chartWidth / (labels.length - 1));
            const y = padding.top + chartHeight - (animatedData[i] / maxValue) * chartHeight;
            
            // Store point position
            this.pointPositions.push({
                x: x,
                y: y,
                index: i,
                value: data[i],
                label: label
            });
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // Draw points - LARGER with animation
        ctx.fillStyle = borderColor;
        this.pointPositions.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 8 * this.animationProgress, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw white border around points
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.stroke();
        });

        this.drawAxes(padding, chartWidth, chartHeight, maxValue, 'Number of Submissions');
    }

    drawBottomLabels(labels) {
        const ctx = this.ctx;
        const canvas = this.ctx.canvas;
        const padding = { top: 60, right: 60, bottom: 80, left: 80 };
        const chartWidth = canvas.width - padding.left - padding.right;
        const chartHeight = canvas.height - padding.top - padding.bottom;

        // Draw bottom labels
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#8f9aa3';
        ctx.font = '12px Arial';
        
        if (this.type === 'bar') {
            const barWidth = (chartWidth / labels.length) * 0.6;
            
            labels.forEach((label, i) => {
                const x = padding.left + (i * chartWidth / labels.length) + (chartWidth / labels.length - barWidth) / 2;
                
                if (this.options.isSDG) {
                    // For SDG chart, show just the numbers "1", "2", etc.
                    ctx.fillText(`${i + 1}`, x + barWidth / 2, padding.top + chartHeight + 15);
                } else {
                    // For schools chart, show school names
                    ctx.fillText(label, x + barWidth / 2, padding.top + chartHeight + 15);
                }
            });
        } else if (this.type === 'line') {
            // For line chart, show month names
            labels.forEach((label, i) => {
                const x = padding.left + (i * chartWidth / (labels.length - 1));
                ctx.fillText(label, x, padding.top + chartHeight + 20);
            });
        }
    }

    drawAxes(padding, chartWidth, chartHeight, maxValue, yLabel) {
        const ctx = this.ctx;
        const canvas = this.ctx.canvas;

        // Draw Y-axis
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, padding.top + chartHeight);
        ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
        ctx.strokeStyle = '#e1e8ed';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Y-axis labels - LARGER
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#8f9aa3';
        ctx.font = '14px Arial';
        for (let i = 0; i <= 5; i++) {
            const value = Math.round((maxValue / 5) * i);
            const y = padding.top + chartHeight - (i * chartHeight / 5);
            ctx.fillText(value, padding.left - 12, y);
        }

        // Draw Y-axis title - LARGER
        ctx.save();
        ctx.translate(padding.left - 40, padding.top + chartHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#8f9aa3';
        ctx.font = '16px Arial';
        ctx.fillText(yLabel, 0, 0);
        ctx.restore();
    }

    setupInteractions() {
        const canvas = this.ctx.canvas;

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            
            this.handleHover();
        });

        canvas.addEventListener('mouseleave', () => {
            this.hoveredIndex = -1;
            this.updateHoverInfo();
        });

        canvas.addEventListener('click', () => {
            if (this.hoveredIndex >= 0) {
                this.handleClick(this.hoveredIndex);
            }
        });
    }

    handleHover() {
        let hoveredIndex = -1;

        if (this.type === 'bar' && this.barPositions) {
            this.barPositions.forEach((bar, index) => {
                if (this.mouseX >= bar.x && this.mouseX <= bar.x + bar.width &&
                    this.mouseY >= bar.y && this.mouseY <= bar.y + bar.height) {
                    hoveredIndex = index;
                }
            });
        } else if (this.type === 'line' && this.pointPositions) {
            this.pointPositions.forEach((point, index) => {
                const distance = Math.sqrt(
                    Math.pow(this.mouseX - point.x, 2) + 
                    Math.pow(this.mouseY - point.y, 2)
                );
                if (distance <= 20) {
                    hoveredIndex = index;
                }
            });
        }

        if (this.hoveredIndex !== hoveredIndex) {
            this.hoveredIndex = hoveredIndex;
            this.updateHoverInfo();
        }
    }

    updateHoverInfo() {
        if (!this.hoverInfo) return;

        if (this.hoveredIndex >= 0 && !this.isAnimating) {
            let hoverData;
            if (this.type === 'bar') {
                hoverData = this.barPositions[this.hoveredIndex];
            } else {
                hoverData = this.pointPositions[this.hoveredIndex];
            }

            // For SDG chart, show full SDG name on hover
            let displayLabel = hoverData.label;
            if (this.options.isSDG && this.data.fullLabels) {
                displayLabel = this.data.fullLabels[this.hoveredIndex];
            }

            this.hoverInfo.textContent = `${displayLabel}: ${hoverData.value} events`;
            this.hoverInfo.style.left = (this.mouseX + 15) + 'px';
            this.hoverInfo.style.top = (this.mouseY - 40) + 'px';
            this.hoverInfo.classList.add('active');
        } else {
            this.hoverInfo.classList.remove('active');
        }
    }

    handleClick(index) {
        console.log(`Clicked on ${this.data.labels[index]}: ${this.data.datasets[0].data[index]} events`);
    }
}

// Data Processing Functions - FIXED FOR CORRECT DATA STRUCTURE
class AnalyticsDataProcessor {
    static processSubmissionsData(submissions, organizations) {
        // Create a mapping from organization ID to school
        const orgToSchoolMap = this.createOrgToSchoolMap(organizations);
        
        // Extract all events from submissions and map organizations to schools
        const allEvents = this.extractAllEvents(submissions, orgToSchoolMap);
        
        const stats = {
            totalSubmissions: submissions.length,
            totalEvents: allEvents.length
        };

        // Group by month using submission date
        const monthlyData = this.groupByMonth(submissions);
        
        // Group by SDG - USING EVENTS DATA
        const sdgData = this.groupBySDG(allEvents);
        
        // Group by school - NOW USING THE MAPPED SCHOOL DATA
        const schoolData = this.groupBySchool(submissions, orgToSchoolMap);
        
        // Group by organization - TOP 5 ONLY
        const orgData = this.groupByOrganization(submissions, orgToSchoolMap);

        return {
            stats,
            monthlyData,
            sdgData,
            schoolData,
            orgData
        };
    }

    // Create mapping from organization ID to school
    static createOrgToSchoolMap(organizations) {
        const orgMap = {};
        organizations.forEach(org => {
            orgMap[org._id] = org.school;
        });
        return orgMap;
    }

    // Extract all events from all submissions and add school information
    static extractAllEvents(submissions, orgToSchoolMap) {
        const allEvents = [];
        submissions.forEach(submission => {
            // Each submission has a single event object, not an array
            if (submission.event) {
                // Get the school from the organization mapping
                const orgId = submission.orgInfo?.orgId;
                const school = orgToSchoolMap[orgId] || 'Unknown School';
                
                allEvents.push({
                    ...submission.event,
                    submissionId: submission._id,
                    orgInfo: submission.orgInfo,
                    school: school,
                    submittedAt: submission.submittedAt
                });
            }
        });
        return allEvents;
    }

    static groupByMonth(submissions) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyCounts = new Array(12).fill(0);
        
        submissions.forEach(submission => {
            // Use event date if available, otherwise fallback to submission date or current date
            let date;
            if (submission.event?.eventDate) {
                date = new Date(submission.event.eventDate);
            } else if (submission.submittedAt) {
                date = new Date(submission.submittedAt);
            } else {
                date = new Date(); // fallback to current date
            }
            
            const month = date.getMonth();
            monthlyCounts[month]++;
        });
        
        return {
            labels: months,
            data: monthlyCounts
        };
    }

    static groupBySDG(events) {
        // Initialize all SDG categories with 0 - INCLUDING ALL SDGs
        const sdgMap = {};
        Object.keys(SDG_CATEGORIES).forEach(sdg => {
            sdgMap[sdg] = 0;
        });

        // Count events per SDG
        events.forEach(event => {
            if (event.eventSDG && Array.isArray(event.eventSDG)) {
                event.eventSDG.forEach(sdg => {
                    const sdgName = sdg.trim();
                    
                    // Direct match with your format
                    if (SDG_CATEGORIES[sdgName]) {
                        sdgMap[sdgName]++;
                    } else {
                        // Try to find closest match
                        for (const validSDG in SDG_CATEGORIES) {
                            if (sdgName.toLowerCase().includes(validSDG.toLowerCase()) || 
                                validSDG.toLowerCase().includes(sdgName.toLowerCase())) {
                                sdgMap[validSDG]++;
                                break;
                            }
                        }
                    }
                });
            }
        });

        // Include ALL SDGs in ascending order (SDG 1 to SDG 17)
        const allSDGs = Object.entries(sdgMap)
            .sort(([a], [b]) => {
                const numA = parseInt(a.match(/^(\d+)\./)?.[1] || 0);
                const numB = parseInt(b.match(/^(\d+)\./)?.[1] || 0);
                return numA - numB;
            });

        // Use simple labels for display (just numbers 1-17)
        const labels = Array.from({length: 17}, (_, i) => (i + 1).toString());
        const data = allSDGs.map(([_, count]) => count);
        const colors = allSDGs.map(([sdg]) => SDG_COLORS[sdg] || '#666666');
        
        return {
            labels,
            data,
            colors,
            fullLabels: allSDGs.map(([sdg]) => sdg),
            totalEvents: data.reduce((sum, count) => sum + count, 0),
            activeGoals: data.filter(count => count > 0).length
        };
    }

    static groupBySchool(submissions, orgToSchoolMap) {
        const schoolMap = {};
        
        submissions.forEach(submission => {
            const orgId = submission.orgInfo?.orgId;
            const school = orgToSchoolMap[orgId] || 'Unknown School';
            schoolMap[school] = (schoolMap[school] || 0) + 1;
        });

        const labels = Object.keys(schoolMap);
        const data = Object.values(schoolMap);
        // Generate colors based on school names
        const colors = labels.map(school => SCHOOL_COLORS[school] || '#666666');
        
        return { 
            labels, 
            data, 
            colors 
        };
    }

    static groupByOrganization(submissions, orgToSchoolMap) {
        const orgMap = {};
        
        submissions.forEach(submission => {
            const orgName = submission.orgInfo?.acronym || submission.orgInfo?.name || 'Unknown Organization';
            const orgId = submission.orgInfo?.orgId;
            const school = orgToSchoolMap[orgId] || 'Unknown School';
            
            if (!orgMap[orgName]) {
                orgMap[orgName] = {
                    name: orgName,
                    submissions: 0,
                    school: school
                };
            }
            orgMap[orgName].submissions++;
        });

        // Convert to array and sort by submissions - TOP 5 ONLY
        return Object.values(orgMap)
            .sort((a, b) => b.submissions - a.submissions)
            .slice(0, 5);
    }
}

// Main Analytics Dashboard - FIXED DATA PROCESSING
class AnalyticsDashboard {
    constructor() {
        this.submissions = [];
        this.organizations = [];
        this.processedData = null;
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.renderStats();
            this.renderCharts();
            this.renderOrganizations();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.showError('Failed to load analytics data');
        }
    }

    async loadData() {
        try {
            // Load both submissions and organizations in parallel
            const [submissionsResponse, organizationsResponse] = await Promise.all([
                fetch(`../dataFetch/fetchSubmissions.php`),
                fetch(`../dataFetch/fetchDatabase.php`)
            ]);

            if (!submissionsResponse.ok) {
                throw new Error(`HTTP error! status: ${submissionsResponse.status}`);
            }
            if (!organizationsResponse.ok) {
                throw new Error(`HTTP error! status: ${organizationsResponse.status}`);
            }

            this.submissions = await submissionsResponse.json();
            this.organizations = await organizationsResponse.json();
            
            console.log('Loaded submissions:', this.submissions);
            console.log('Loaded organizations:', this.organizations);
            
            // Process data by combining both datasets
            this.processedData = AnalyticsDataProcessor.processSubmissionsData(this.submissions, this.organizations);
            
            console.log('Processed data:', this.processedData);
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    renderStats() {
        if (!this.processedData) return;

        const { stats, sdgData } = this.processedData;

        document.getElementById('sdgSubmissions').textContent = `${sdgData.totalEvents} Events`;
        document.getElementById('sdgGoals').textContent = `${sdgData.activeGoals} Goals`;
    }

    renderCharts() {
        if (!this.processedData) return;

        console.log('Rendering charts with data:', this.processedData);

        // Monthly Submissions Chart
        const submissionsCtx = document.getElementById('submissionsChart').getContext('2d');
        const submissionsData = {
            labels: this.processedData.monthlyData.labels,
            datasets: [{
                data: this.processedData.monthlyData.data,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)'
            }]
        };
        new LargeChart(submissionsCtx, 'line', submissionsData, { 
            hoverId: 'submissionsHover'
        });

        // SDG Chart - With SDG numbers (1-17) at bottom
        const sdgCtx = document.getElementById('sdgChart').getContext('2d');
        const sdgData = {
            labels: this.processedData.sdgData.labels,
            datasets: [{
                data: this.processedData.sdgData.data,
                backgroundColor: this.processedData.sdgData.colors
            }],
            fullLabels: this.processedData.sdgData.fullLabels
        };
        new LargeChart(sdgCtx, 'bar', sdgData, { 
            isSDG: true, 
            hoverId: 'sdgHover'
        });

        // Schools Chart - WITH COLOR CODING FROM ORGANIZATIONS DATA
        const schoolsCtx = document.getElementById('schoolsChart').getContext('2d');
        const schoolsData = {
            labels: this.processedData.schoolData.labels,
            datasets: [{
                data: this.processedData.schoolData.data,
                backgroundColor: this.processedData.schoolData.colors
            }]
        };
        new LargeChart(schoolsCtx, 'bar', schoolsData, { 
            hoverId: 'schoolsHover'
        });
    }

    renderOrganizations() {
        const orgsList = document.getElementById('orgsList');
        orgsList.innerHTML = '';

        if (!this.processedData || this.processedData.orgData.length === 0) {
            orgsList.innerHTML = '<div class="no-data">No organization data available</div>';
            return;
        }

        this.processedData.orgData.forEach((org, index) => {
            const orgItem = document.createElement('div');
            orgItem.className = 'org-item';
            
            // Get school color for the organization
            const schoolColor = SCHOOL_COLORS[org.school] || '#666666';
            
            orgItem.innerHTML = `
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
            `;
            orgsList.appendChild(orgItem);
        });
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const searchClear = document.getElementById('searchClear');

        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const orgItems = document.querySelectorAll('.org-item');
            
            orgItems.forEach(item => {
                const orgName = item.querySelector('.org-name').textContent.toLowerCase();
                item.style.display = orgName.includes(searchTerm) ? 'flex' : 'none';
            });
        });

        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            document.querySelectorAll('.org-item').forEach(item => {
                item.style.display = 'flex';
            });
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            setTimeout(() => {
                console.log('Please refresh the page for optimal chart sizing');
            }, 100);
        });
    }

    showError(message) {
        console.error('Dashboard Error:', message);
        alert(`Analytics Dashboard Error: ${message}`);
    }
}

// DOM Elements
const mobileProfileBtn = document.getElementById('mobileProfileBtn');
const profileModal = document.getElementById('profileModal');
const profileModalClose = document.getElementById('profileModalClose');
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const logoutModalClose = document.getElementById('logoutModalClose');
const logoutCancel = document.getElementById('logoutCancel');
const logoutConfirm = document.getElementById('logoutConfirm');

// Show/Hide Modal Functions
function showLogoutModal() {
    logoutModal.classList.add('show');
    logoutModal.setAttribute('aria-hidden', 'false');
}

function hideLogoutModal() {
    logoutModal.classList.remove('show');
    logoutModal.setAttribute('aria-hidden', 'true');
}

// Profile Modal Functions
function showProfileModal() {
    profileModal.classList.add('show');
    profileModal.setAttribute('aria-hidden', 'false');
    
    const modalContent = `
        <div class="profile-info">
            <div class="profile-large">M</div>
            <div class="profile-details">
                <h4>Hello, OSAS</h4>
                <div class="profile-logout">
                    <button id="profileLogoutBtn" class="btn-logout">
                        <img src="../Images/logout.png" alt="Logout" class="nav-icon">
                        Logout
                    </button>
                </div>
            </div>
        </div>
    `;
    
    profileModal.querySelector('.modal-body').innerHTML = modalContent;
    
    // Add logout event listener
    document.getElementById('profileLogoutBtn').addEventListener('click', () => {
        window.location.href = "../index.html";
    });
}

function hideProfileModal() {
    profileModal.classList.remove('show');
    profileModal.setAttribute('aria-hidden', 'true');
}

// Logout function
function performLogout() {
    window.location.href = "../index.html";
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Profile modal events
    mobileProfileBtn.addEventListener('click', showProfileModal);
    profileModalClose.addEventListener('click', hideProfileModal);
    
    // Logout modal events
    logoutBtn.addEventListener('click', showLogoutModal);
    logoutModalClose.addEventListener('click', hideLogoutModal);
    logoutCancel.addEventListener('click', hideLogoutModal);
    logoutConfirm.addEventListener('click', performLogout);
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === logoutModal) {
            hideLogoutModal();
        }
        if (e.target === profileModal) {
            hideProfileModal();
        }
    });
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new AnalyticsDashboard();
});