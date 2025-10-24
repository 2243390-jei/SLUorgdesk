// Enhanced Chart implementation with large sizes
class LargeChart {
    constructor(ctx, type, data, options = {}) {
        this.ctx = ctx;
        this.type = type;
        this.data = data;
        this.options = options;
        this.hoverInfo = options.hoverInfo;
        this.mouseX = 0;
        this.mouseY = 0;
        this.hoveredIndex = -1;
        
        this.init();
        this.draw();
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

        // Always draw data labels
        this.drawDataLabels(labels, datasets[0]);
    }

    drawBarChart(labels, dataset) {
        const { data, backgroundColor } = dataset;
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        const padding = { top: 60, right: 60, bottom: 80, left: 80 };
        const chartWidth = canvas.width - padding.left - padding.right;
        const chartHeight = canvas.height - padding.top - padding.bottom;
        
        const maxValue = Math.max(...data);
        const barWidth = (chartWidth / labels.length) * 0.6;
        
        // Store bar positions for hover detection
        this.barPositions = [];
        
        // Draw bars
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = '14px Arial';
        
        labels.forEach((label, i) => {
            const x = padding.left + (i * chartWidth / labels.length) + (chartWidth / labels.length - barWidth) / 2;
            const barHeight = (data[i] / maxValue) * chartHeight;
            const y = padding.top + chartHeight - barHeight;
            
            // Store bar position
            this.barPositions.push({
                x: x,
                y: y,
                width: barWidth,
                height: barHeight,
                index: i,
                value: data[i],
                label: label
            });
            
            // Draw bar
            ctx.fillStyle = Array.isArray(backgroundColor) ? backgroundColor[i] : backgroundColor;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Draw label (rotated for SDG chart)
            ctx.save();
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#8f9aa3';
            ctx.font = '12px Arial';
            
            if (this.options.isSDG) {
                // Rotate labels for SDG chart
                ctx.translate(x + barWidth / 2, padding.top + chartHeight + 20);
                ctx.rotate(-Math.PI / 4);
                ctx.fillText(label, 0, 0);
            } else {
                ctx.fillText(label, x + barWidth / 2, padding.top + chartHeight + 15);
            }
            ctx.restore();
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
        
        const maxValue = Math.max(...data);
        
        // Store point positions for hover detection
        this.pointPositions = [];
        
        // Draw line
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.strokeStyle = borderColor;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        labels.forEach((label, i) => {
            const x = padding.left + (i * chartWidth / (labels.length - 1));
            const y = padding.top + chartHeight - (data[i] / maxValue) * chartHeight;
            
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
        
        // Draw points - LARGER
        ctx.fillStyle = borderColor;
        this.pointPositions.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw white border around points
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.stroke();
        });

        // Draw X-axis labels
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#8f9aa3';
        ctx.font = '14px Arial';
        labels.forEach((label, i) => {
            const x = padding.left + (i * chartWidth / (labels.length - 1));
            ctx.fillText(label, x, padding.top + chartHeight + 20);
        });

        this.drawAxes(padding, chartWidth, chartHeight, maxValue, 'Number of Events');
    }

    drawDataLabels(labels, dataset) {
        const { data } = dataset;
        const ctx = this.ctx;
        const canvas = this.ctx.canvas;
        const padding = { top: 60, right: 60, bottom: 80, left: 80 };
        const chartHeight = canvas.height - padding.top - padding.bottom;
        const maxValue = Math.max(...data);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#333';
        ctx.fontWeight = '600';

        if (this.type === 'bar') {
            // Draw values on top of bars - LARGER
            this.barPositions.forEach(bar => {
                ctx.fillText(bar.value, bar.x + bar.width / 2, bar.y - 10);
            });
        } else if (this.type === 'line') {
            // Draw values above points - LARGER
            this.pointPositions.forEach(point => {
                ctx.fillText(point.value, point.x, point.y - 20);
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
                if (distance <= 20) { // Larger hit area
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

        if (this.hoveredIndex >= 0) {
            let hoverData;
            if (this.type === 'bar') {
                hoverData = this.barPositions[this.hoveredIndex];
            } else {
                hoverData = this.pointPositions[this.hoveredIndex];
            }

            this.hoverInfo.textContent = `${hoverData.label}: ${hoverData.value} ${this.type === 'bar' ? 'submissions' : 'events'}`;
            this.hoverInfo.style.left = (hoverData.x + 15) + 'px';
            this.hoverInfo.style.top = (hoverData.y - 40) + 'px';
            this.hoverInfo.classList.add('active');
        } else {
            this.hoverInfo.classList.remove('active');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Monthly Events Chart - LARGE
    const eventsCtx = document.getElementById('eventsChart').getContext('2d');
    const eventsData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            data: [8, 12, 10, 15, 18, 22, 20, 25, 18, 15, 12, 10],
            borderColor: '#2563eb'
        }]
    };
    new LargeChart(eventsCtx, 'line', eventsData);

    // SDG Chart - EXTRA LARGE
    const sdgCtx = document.getElementById('sdgChart').getContext('2d');
    const sdgData = {
        labels: [
            'No Poverty', 'Zero Hunger', 'Good Health', 'Quality Education', 
            'Gender Equality', 'Clean Water', 'Affordable Energy', 'Decent Work',
            'Industry & Innovation', 'Reduced Inequality', 'Sustainable Cities', 
            'Responsible Consumption', 'Climate Action', 'Life Below Water', 
            'Life on Land', 'Peace & Justice', 'Partnerships'
        ],
        datasets: [{
            data: [12, 8, 15, 22, 10, 7, 9, 18, 11, 6, 14, 13, 16, 5, 8, 9, 12],
            backgroundColor: [
                '#E5243B', '#DDA63A', '#4C9F38', '#C5192D', '#FF3A21', 
                '#26BDE2', '#FCC30B', '#A21942', '#FD6925', '#DD1367', 
                '#FD9D24', '#BF8B2E', '#3F7E44', '#0A97D9', '#56C02B', 
                '#00689D', '#19486A'
            ]
        }]
    };
    new LargeChart(sdgCtx, 'bar', sdgData, { isSDG: true });

    // Top Organizations
    const orgsList = document.getElementById('orgsList');
    const organizations = [
        { name: 'Student Council', events: 15, members: 45, submissions: 22 },
        { name: 'Environmental Club', events: 12, members: 32, submissions: 18 },
        { name: 'Tech Society', events: 10, members: 28, submissions: 15 },
        { name: 'Volunteer Group', events: 11, members: 38, submissions: 14 },
        { name: 'Sports Club', events: 14, members: 35, submissions: 10 }
    ];

    organizations.forEach((org, index) => {
        const orgItem = document.createElement('div');
        orgItem.className = 'org-item';
        orgItem.innerHTML = `
            <div class="org-header">
                <div class="rank-badge">${index + 1}</div>
                <div class="org-name">${org.name}</div>
            </div>
            <div class="org-stats">
                <div class="org-stat">
                    <div class="org-stat-value">${org.events}</div>
                    <div class="org-stat-label">Events</div>
                </div>
                <div class="org-stat">
                    <div class="org-stat-value">${org.members}</div>
                    <div class="org-stat-label">Members</div>
                </div>
                <div class="org-stat">
                    <div class="org-stat-value">${org.submissions}</div>
                    <div class="org-stat-label">Submissions</div>
                </div>
            </div>
        `;
        orgsList.appendChild(orgItem);
    });

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const orgItems = document.querySelectorAll('.org-item');
        orgItems.forEach(item => {
            const orgName = item.querySelector('.org-name').textContent.toLowerCase();
            item.style.display = orgName.includes(searchTerm) ? 'flex' : 'none';
        });
    });

    searchClear.addEventListener('click', function() {
        searchInput.value = '';
        document.querySelectorAll('.org-item').forEach(item => {
            item.style.display = 'flex';
        });
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        // Re-initialize charts on resize
        setTimeout(() => {
            document.querySelectorAll('canvas').forEach(canvas => {
                const ctx = canvas.getContext('2d');
                // You would need to store chart instances and redraw them
                // For now, we'll just trigger a page refresh suggestion
                console.log('Please refresh the page for optimal chart sizing');
            });
        }, 100);
    });
});