// Events Chart
const eventsCtx = document.getElementById('eventsChart').getContext('2d');

const eventsData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [{
    label: 'Events',
    data: [8, 12, 10, 15, 18, 22, 20, 25, 18, 15, 12, 10],
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderColor: 'rgba(37, 99, 235, 1)',
    borderWidth: 2,
    tension: 0.4,
    fill: true
  }]
};

const eventsChart = new Chart(eventsCtx, {
  type: 'line',
  data: eventsData,
  options: {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Monthly Events'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Events'
        }
      }
    }
  }
});

// SDG Chart
const sdgCtx = document.getElementById('sdgChart').getContext('2d');

// SDG data - submissions per SDG
const sdgData = {
  labels: [
    'No Poverty', 'Zero Hunger', 'Good Health', 'Quality Education', 
    'Gender Equality', 'Clean Water', 'Affordable Energy', 'Decent Work', 
    'Industry & Innovation', 'Reduced Inequality', 'Sustainable Cities', 
    'Responsible Consumption', 'Climate Action', 'Life Below Water', 
    'Life on Land', 'Peace & Justice', 'Partnerships'
  ],
  datasets: [{
    label: 'SDG Submissions',
    data: [12, 8, 15, 22, 10, 7, 9, 18, 11, 6, 14, 13, 16, 5, 8, 9, 12],
    backgroundColor: [
      '#E5243B', '#DDA63A', '#4C9F38', '#C5192D', '#FF3A21', 
      '#26BDE2', '#FCC30B', '#A21942', '#FD6925', '#DD1367', 
      '#FD9D24', '#BF8B2E', '#3F7E44', '#0A97D9', '#56C02B', 
      '#00689D', '#19486A'
    ],
    borderWidth: 1
  }]
};

const sdgChart = new Chart(sdgCtx, {
  type: 'bar',
  data: sdgData,
  options: {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'SDG Submissions by Goal'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Submissions'
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  }
});

// Top Active Organizations (Top 5 only)
const orgsList = document.getElementById('orgsList');

const organizations = [
  { name: 'Student Council', events: 15, members: 45, submissions: 22 },
  { name: 'Environmental Club', events: 12, members: 32, submissions: 18 },
  { name: 'Tech Society', events: 10, members: 28, submissions: 15 },
  { name: 'Cultural Association', events: 8, members: 40, submissions: 12 },
  { name: 'Sports Club', events: 14, members: 35, submissions: 10 },
  { name: 'Debate Team', events: 7, members: 20, submissions: 9 },
  { name: 'Arts Society', events: 9, members: 25, submissions: 8 },
  { name: 'Volunteer Group', events: 11, members: 38, submissions: 14 }
];

// Sort organizations by activity (events + submissions) and take top 5
const topOrganizations = organizations
  .sort((a, b) => (b.events + b.submissions) - (a.events + a.submissions))
  .slice(0, 5);

// Populate organizations list with top 5
topOrganizations.forEach((org, index) => {
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
    if (orgName.includes(searchTerm)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
});

searchClear.addEventListener('click', function() {
  searchInput.value = '';
  const orgItems = document.querySelectorAll('.org-item');
  orgItems.forEach(item => {
    item.style.display = 'flex';
  });
});