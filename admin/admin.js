  // Sample user data
    const users = [
      { id: 1, name: "Sarah Johnson", email: "sarah.j@acme.com", org: "Acme Corp", status: "active", joined: "2024-01-15", lastActive: "2 hours ago" },
      { id: 2, name: "Michael Chen", email: "m.chen@techstart.io", org: "TechStart Inc", status: "active", joined: "2024-02-20", lastActive: "5 minutes ago" },
      { id: 3, name: "Emily Rodriguez", email: "emily.r@global.com", org: "Global Solutions", status: "inactive", joined: "2023-11-10", lastActive: "3 days ago" },
      { id: 4, name: "David Kim", email: "d.kim@innovation.io", org: "Innovation Labs", status: "active", joined: "2024-03-05", lastActive: "1 hour ago" },
      { id: 5, name: "Jessica Taylor", email: "j.taylor@acme.com", org: "Acme Corp", status: "active", joined: "2024-01-22", lastActive: "30 minutes ago" },
      { id: 6, name: "Robert Martinez", email: "r.martinez@techstart.io", org: "TechStart Inc", status: "inactive", joined: "2023-12-08", lastActive: "1 week ago" },
      { id: 7, name: "Amanda White", email: "a.white@global.com", org: "Global Solutions", status: "active", joined: "2024-02-14", lastActive: "10 minutes ago" },
      { id: 8, name: "James Anderson", email: "j.anderson@innovation.io", org: "Innovation Labs", status: "active", joined: "2024-03-12", lastActive: "45 minutes ago" },
      { id: 9, name: "Lisa Brown", email: "l.brown@acme.com", org: "Acme Corp", status: "inactive", joined: "2023-10-30", lastActive: "2 weeks ago" },
      { id: 10, name: "Christopher Lee", email: "c.lee@techstart.io", org: "TechStart Inc", status: "active", joined: "2024-01-18", lastActive: "15 minutes ago" },
      { id: 11, name: "Maria Garcia", email: "m.garcia@global.com", org: "Global Solutions", status: "active", joined: "2024-02-25", lastActive: "3 hours ago" },
      { id: 12, name: "Daniel Wilson", email: "d.wilson@innovation.io", org: "Innovation Labs", status: "inactive", joined: "2023-11-20", lastActive: "5 days ago" },
      { id: 13, name: "Jennifer Davis", email: "j.davis@acme.com", org: "Acme Corp", status: "active", joined: "2024-03-01", lastActive: "20 minutes ago" },
      { id: 14, name: "Matthew Moore", email: "m.moore@techstart.io", org: "TechStart Inc", status: "active", joined: "2024-02-10", lastActive: "1 hour ago" },
      { id: 15, name: "Ashley Thomas", email: "a.thomas@global.com", org: "Global Solutions", status: "active", joined: "2024-01-28", lastActive: "25 minutes ago" }
    ];

    console.log("Total users loaded:", users.length); // Should log 15

    let currentPage = 1;
    const itemsPerPage = 10;
    let filteredUsers = [...users];
    let currentStatusFilter = 'all';
    let currentOrgFilter = 'all';
    let searchQuery = '';

    // Update analytics cards
    function updateAnalytics() {
      const activeCount = users.filter(u => u.status === 'active').length;
      const inactiveCount = users.filter(u => u.status === 'inactive').length;
      const orgs = new Set(users.map(u => u.org)).size;

      document.getElementById('totalUsers').textContent = users.length.toLocaleString();
      document.getElementById('activeUsers').textContent = activeCount.toLocaleString();
      document.getElementById('inactiveUsers').textContent = inactiveCount.toLocaleString();
      document.getElementById('totalOrgs').textContent = orgs;
    }

    // Apply filters
    function filterUsers() {
      filteredUsers = users.filter(user => {
        const matchesStatus = currentStatusFilter === 'all' || user.status === currentStatusFilter;
        const matchesOrg = currentOrgFilter === 'all' || user.org === currentOrgFilter;
        const matchesSearch = searchQuery === '' || 
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesStatus && matchesOrg && matchesSearch;
      });
      
      currentPage = 1;
      renderTable();
    }

    // Render user table rows
    function renderTable() {
      const tableBody = document.getElementById('tableBody');
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const pageUsers = filteredUsers.slice(start, end);

      tableBody.innerHTML = pageUsers.map(user => `
        <tr>
          <td class="font-medium">${user.name}</td>
          <td class="text-gray-500">${user.email}</td>
          <td class="text-gray-700">${user.org}</td>
          <td>
            <span class="status-badge status-${user.status}">
              ${user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            </span>
          </td>
          <td class="text-gray-500">${user.joined}</td>
          <td class="text-gray-500">${user.lastActive}</td>
        </tr>
      `).join('');

      // Update pagination info
      document.getElementById('showingCount').textContent = Math.min(end, filteredUsers.length);
      document.getElementById('totalCount').textContent = filteredUsers.length;
      
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');
      prevBtn.disabled = currentPage === 1;
      nextBtn.disabled = end >= filteredUsers.length;
    }

    // Set up event listeners
    function setupEventListeners() {
      // Status filters
      document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          currentStatusFilter = e.target.dataset.filter;
          filterUsers();
        });
      });

      // Organization filters
      document.querySelectorAll('[data-org]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('[data-org]').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          currentOrgFilter = e.target.dataset.org;
          filterUsers();
        });
      });

      // Search input
      document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        filterUsers();
      });

      // Pagination
      document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderTable();
        }
      });

      document.getElementById('nextBtn').addEventListener('click', () => {
        if (currentPage * itemsPerPage < filteredUsers.length) {
          currentPage++;
          renderTable();
        }
      });
    }

    // Initialize everything
    function init() {
      updateAnalytics();
      renderTable();
      setupEventListeners();
    }

    // Run on load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
