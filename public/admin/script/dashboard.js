// ======== Users by Role Chart (Top Widget 1) ========
const ctxRoles = document.getElementById('chartRoles').getContext('2d');
const chartRoles = new Chart(ctxRoles, {
    type: 'doughnut', // You can change to 'bar', 'pie', etc.
    data: {
        labels: ['Admin', 'Staff', 'Student'],
        datasets: [{
            label: 'Users by Role',
            data: [5, 15, 30], // placeholder data
            backgroundColor: [
                '#4ea8ff',
                '#ff6b6b',
                '#f5a623'
            ],
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#fff', // make labels white for dark widgets
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                enabled: true
            }
        }
    }
});

// ======== Active Users Chart (Top Widget 2) ========
const ctxActive = document.getElementById('chartActive').getContext('2d');
const chartActive = new Chart(ctxActive, {
    type: 'bar',
    data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Active Users',
            data: [12, 19, 7, 15, 10, 8, 14], // placeholder data
            backgroundColor: '#4ea8ff'
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                ticks: { color: '#fff' }, // white x-axis labels
                grid: { color: 'rgba(255,255,255,0.1)' }
            },
            y: {
                ticks: { color: '#fff' },
                grid: { color: 'rgba(255,255,255,0.1)' }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: { enabled: true }
        }
    }
});

// ======== Users by School Chart (Bottom Large Widget) ========
const ctxSchools = document.getElementById('chartSchools').getContext('2d');
const chartSchools = new Chart(ctxSchools, {
    type: 'bar',
    data: {
        labels: ['School A', 'School B', 'School C', 'School D'],
        datasets: [{
            label: 'Users by School',
            data: [20, 15, 30, 10], // placeholder data
            backgroundColor: [
                '#4ea8ff',
                '#ff6b6b',
                '#f5a623',
                '#34d399'
            ]
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                ticks: { color: '#fff' },
                grid: { color: 'rgba(255,255,255,0.1)' }
            },
            y: {
                ticks: { color: '#fff' },
                grid: { color: 'rgba(255,255,255,0.1)' }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: { enabled: true }
        }
    }
});
