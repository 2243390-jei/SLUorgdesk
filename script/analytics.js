// API Configuration
const API_BASE_URL = "http://localhost:3000/api";

// Enhanced SDG Category Mapping
const SDG_CATEGORIES = {
    "No Poverty (SDG 1)": "No Poverty (SDG 1)",
    "Zero Hunger (SDG 2)": "Zero Hunger (SDG 2)",
    "Good Health and Well-being (SDG 3)": "Good Health and Well-being (SDG 3)",
    "Quality Education (SDG 4)": "Quality Education (SDG 4)",
    "Gender Equality (SDG 5)": "Gender Equality (SDG 5)",
    "Clean Water and Sanitation (SDG 6)": "Clean Water and Sanitation (SDG 6)",
    "Affordable and Clean Energy (SDG 7)": "Affordable and Clean Energy (SDG 7)",
    "Decent Work and Economic Growth (SDG 8)": "Decent Work and Economic Growth (SDG 8)",
    "Industry, Innovation and Infrastructure (SDG 9)": "Industry, Innovation and Infrastructure (SDG 9)",
    "Reduced Inequalities (SDG 10)": "Reduced Inequalities (SDG 10)",
    "Sustainable Cities and Communities (SDG 11)": "Sustainable Cities and Communities (SDG 11)",
    "Responsible Consumption and Production (SDG 12)": "Responsible Consumption and Production (SDG 12)",
    "Climate Action (SDG 13)": "Climate Action (SDG 13)",
    "Life Below Water (SDG 14)": "Life Below Water (SDG 14)",
    "Life on Land (SDG 15)": "Life on Land (SDG 15)",
    "Peace, Justice and Strong Institutions (SDG 16)": "Peace, Justice and Strong Institutions (SDG 16)",
    "Peace, Justice, and Strong Institutions (SDG 16)": "Peace, Justice and Strong Institutions (SDG 16)",
    "Partnerships for the Goals (SDG 17)": "Partnerships for the Goals (SDG 17)"
};

// SDG Color Mapping
const SDG_COLORS = {
    "No Poverty (SDG 1)": "#E5243B",
    "Zero Hunger (SDG 2)": "#DDA63A",
    "Good Health and Well-being (SDG 3)": "#4C9F38",
    "Quality Education (SDG 4)": "#C5192D",
    "Gender Equality (SDG 5)": "#FF3A21",
    "Clean Water and Sanitation (SDG 6)": "#26BDE2",
    "Affordable and Clean Energy (SDG 7)": "#FCC30B",
    "Decent Work and Economic Growth (SDG 8)": "#A21942",
    "Industry, Innovation and Infrastructure (SDG 9)": "#FD6925",
    "Reduced Inequalities (SDG 10)": "#DD1367",
    "Sustainable Cities and Communities (SDG 11)": "#FD9D24",
    "Responsible Consumption and Production (SDG 12)": "#BF8B2E",
    "Climate Action (SDG 13)": "#3F7E44",
    "Life Below Water (SDG 14)": "#0A97D9",
    "Life on Land (SDG 15)": "#56C02B",
    "Peace, Justice and Strong Institutions (SDG 16)": "#00689D",
    "Peace, Justice, and Strong Institutions (SDG 16)": "#00689D",
    "Partnerships for the Goals (SDG 17)": "#19486A"
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
            
            // Draw bar with animation
            ctx.fillStyle = Array.isArray(backgroundColor) ? backgroundColor[i] : backgroundColor;
            ctx.fillRect(x, y, barWidth, animatedHeight);
        });

        this.drawAxes(padding, chartWidth, chartHeight, maxValue, 'Number of Submissions');
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
                    // For SDG chart, show "SDG 1", "SDG 2", etc.
                    ctx.fillText(`SDG ${i + 1}`, x + barWidth / 2, padding.top + chartHeight + 15);
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

            this.hoverInfo.textContent = `${displayLabel}: ${hoverData.value} submissions`;
            this.hoverInfo.style.left = (this.mouseX + 15) + 'px';
            this.hoverInfo.style.top = (this.mouseY - 40) + 'px';
            this.hoverInfo.classList.add('active');
        } else {
            this.hoverInfo.classList.remove('active');
        }
    }

    handleClick(index) {
        console.log(`Clicked on ${this.data.labels[index]}: ${this.data.datasets[0].data[index]} submissions`);
    }
}

// Data Processing Functions
class AnalyticsDataProcessor {
    static processFormsData(forms) {
        const stats = {
            totalForms: forms.length,
            pendingForms: forms.filter(form => form.status === 'Pending Review').length,
            approvedForms: forms.filter(form => form.status === 'Approved').length,
            rejectedForms: forms.filter(form => form.status === 'Rejected').length,
            needsRevisionForms: forms.filter(form => form.status === 'Needs Revision').length
        };

        // Group by month
        const monthlyData = this.groupByMonth(forms);
        
        // Group by SDG - INCLUDING ZERO VALUES
        const sdgData = this.groupBySDG(forms);
        
        // Group by school
        const schoolData = this.groupBySchool(forms);
        
        // Group by organization - TOP 5 ONLY
        const orgData = this.groupByOrganization(forms);

        return {
            stats,
            monthlyData,
            sdgData,
            schoolData,
            orgData
        };
    }

    static groupByMonth(forms) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyCounts = new Array(12).fill(0);
        
        forms.forEach(form => {
            const date = new Date(form.createdAt);
            const month = date.getMonth();
            monthlyCounts[month]++;
        });
        
        return {
            labels: months,
            data: monthlyCounts
        };
    }

    static groupBySDG(forms) {
        // Initialize all SDG categories with 0 - INCLUDING ALL SDGs
        const sdgMap = {};
        Object.keys(SDG_CATEGORIES).forEach(sdg => {
            sdgMap[sdg] = 0;
        });

        // Count submissions per SDG
        forms.forEach(form => {
            if (form.SDGCategory && form.SDGCategory !== "Not specified") {
                const sdgName = form.SDGCategory.trim();
                
                // Direct match
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
            }
        });

        // Include ALL SDGs in ascending order (SDG 1 to SDG 17)
        const allSDGs = Object.entries(sdgMap)
            .sort(([a], [b]) => {
                const numA = parseInt(a.match(/SDG (\d+)/)?.[1] || 0);
                const numB = parseInt(b.match(/SDG (\d+)/)?.[1] || 0);
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
            totalSubmissions: data.reduce((sum, count) => sum + count, 0),
            activeGoals: data.filter(count => count > 0).length
        };
    }

    static groupBySchool(forms) {
        const schoolMap = {};
        
        forms.forEach(form => {
            const school = form.school || 'Unknown School';
            schoolMap[school] = (schoolMap[school] || 0) + 1;
        });

        const labels = Object.keys(schoolMap);
        const data = Object.values(schoolMap);
        
        return { labels, data };
    }

    static groupByOrganization(forms) {
        const orgMap = {};
        
        forms.forEach(form => {
            const orgName = form.acronym || form.completeName || 'Unknown Organization';
            if (!orgMap[orgName]) {
                orgMap[orgName] = {
                    name: orgName,
                    submissions: 0,
                    school: form.school || 'Unknown',
                    status: form.status || 'Unknown'
                };
            }
            orgMap[orgName].submissions++;
        });

        // Convert to array and sort by submissions - TOP 5 ONLY
        return Object.values(orgMap)
            .sort((a, b) => b.submissions - a.submissions)
            .slice(0, 5); // Top 5 organizations only
    }
}

// Main Analytics Dashboard
class AnalyticsDashboard {
    constructor() {
        this.forms = [];
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
            const response = await fetch(`${API_BASE_URL}/forms`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.forms = await response.json();
            this.processedData = AnalyticsDataProcessor.processFormsData(this.forms);
            console.log('✅ Loaded forms data:', this.forms.length, 'forms');
            console.log('📊 SDG Data:', this.processedData.sdgData);
        } catch (error) {
            console.error('❌ Error loading forms:', error);
            throw error;
        }
    }

    renderStats() {
        if (!this.processedData) return;

        const { stats, sdgData } = this.processedData;
        
        // Removed total organizations from stats
        document.getElementById('totalForms').textContent = stats.totalForms;
        document.getElementById('pendingForms').textContent = stats.pendingForms;
        document.getElementById('approvedForms').textContent = stats.approvedForms;
        
        document.getElementById('sdgSubmissions').textContent = `${sdgData.totalSubmissions} Submissions`;
        document.getElementById('sdgGoals').textContent = `${sdgData.activeGoals} Goals`;
    }

    renderCharts() {
        if (!this.processedData) return;

        // Monthly Submissions Chart - With month labels at bottom
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

        // Schools Chart - With school names at bottom
        const schoolsCtx = document.getElementById('schoolsChart').getContext('2d');
        const schoolsData = {
            labels: this.processedData.schoolData.labels,
            datasets: [{
                data: this.processedData.schoolData.data,
                backgroundColor: '#3498db'
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
            orgItem.innerHTML = `
                <div class="org-header">
                    <div class="rank-badge">${index + 1}</div>
                    <div class="org-name">${org.name}</div>
                </div>
                <div class="org-stats">
                    <div class="org-stat">
                        <div class="org-stat-value">${org.submissions}</div>
                        <div class="org-stat-label">Submissions</div>
                    </div>
                    <div class="org-stat">
                        <div class="org-stat-value">${org.school}</div>
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new AnalyticsDashboard();
});