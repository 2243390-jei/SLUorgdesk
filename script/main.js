// --- Dummy users (for manual login) ---
const users = [
  { role: "student", email: "student@slu.edu.ph", password: "student123" },
  { role: "osas",    email: "osas@slu.edu.ph",    password: "osas123" },
  { role: "admin",   email: "admin@slu.edu.ph",   password: "admin123" }
];

// --- para sa manual login pero dummy lang to ---
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        alert(`Login successful! Welcome, ${user.role.toUpperCase()}.`);

        switch (user.role) {
          case "student": window.location.href = "student/home.html"; break;
          case "osas":    window.location.href = "osas/calendar.html"; break;
          case "admin":   window.location.href = "admin/dashboard.html"; break;
        }
      } else {
        alert("Invalid email or password. Please try again.");
      }
    });
  }
});

// --- Google Identity Services (SSO) ---
window.onload = function () {
  const googleSignInBtn = document.getElementById("g_id_signin");
  if (googleSignInBtn) {
    google.accounts.id.initialize({
      client_id: "687307417693-f5v0ljfh76qpgcrk6uf70io0pe4me6d0.apps.googleusercontent.com",
      callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
      googleSignInBtn,
      { theme: "outline", size: "large", text: "signin_with" }
    );
  }
};

// --- Handle Google credential response ---
function handleCredentialResponse(response) {
  const data = JSON.parse(atob(response.credential.split('.')[1]));
  console.log("Google User Data:", data);

  localStorage.setItem("googleUser", JSON.stringify(data));

  const email = data.email.toLowerCase();
  alert(`Logged in as ${email}`);

  // --- Role detection logic based on email ---
  if (email.includes("@slu.edu.ph")) {
    if (/^\d+@slu\.edu\.ph$/.test(email)) {
      window.location.href = "student/home.html";
    } else if (email.startsWith("osas@")) {
      window.location.href = "osas/dashboard.html";
    } else if (email.startsWith("admin@")) {
      window.location.href = "admin/dashboard.html";
    } else {
      alert("Unrecognized SLU account type.");
    }
  } else {
    alert("Access denied: Please use your SLU email account.");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const images = document.querySelectorAll('.schools-section .carousel-slide img');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  let current = 0;

  function updateCarousel() {
    images.forEach(img => img.classList.remove('active', 'prev', 'next'));

    const total = images.length;
    const prevIndex = (current - 1 + total) % total;
    const nextIndex = (current + 1) % total;

    images[current].classList.add('active');
    images[prevIndex].classList.add('prev');
    images[nextIndex].classList.add('next');
  }

  prevBtn.addEventListener('click', () => {
    current = (current - 1 + images.length) % images.length;
    updateCarousel();
  });

  nextBtn.addEventListener('click', () => {
    current = (current + 1) % images.length;
    updateCarousel();
  });

  updateCarousel();
});

// --- Navbar profile + organization table ---
document.addEventListener("DOMContentLoaded", () => {
  const navbarProfilePic = document.getElementById("nav-profile-pic");

  if (navbarProfilePic) {
    const user = JSON.parse(localStorage.getItem("googleUser"));
    if (user && user.picture) {
      navbarProfilePic.src = user.picture;
      navbarProfilePic.style.borderRadius = "50%";
    } else {
      // window.location.href = "../index.html";
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  function getActiveSchool() {
    const activeImg = document.querySelector('.carousel-slide img.active');
    return activeImg ? activeImg.alt : null;
  }

  function updateGallery() {
    const school = getActiveSchool();
    const allGroups = document.querySelectorAll('.org-group');

    allGroups.forEach(group => {
      if (group.dataset.school === school) {
        group.classList.add("active");
      } else {
        group.classList.remove("active");
      }
    });
  }

  updateGallery();
  prevBtn.addEventListener("click", updateGallery);
  nextBtn.addEventListener("click", updateGallery);
});


// --- Initial Malech Part ---
// --------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {

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

  console.log("Total users loaded:", users.length);

  let currentPage = 1;
  const itemsPerPage = 10;
  let filteredUsers = [...users];
  let currentStatusFilter = 'all';
  let currentOrgFilter = 'all';
  let searchQuery = '';

  // --- Update analytics cards ---
  function updateAnalytics() {
    const activeCount = users.filter(u => u.status === 'active').length;
    const inactiveCount = users.filter(u => u.status === 'inactive').length;
    const orgs = new Set(users.map(u => u.org)).size;

    document.getElementById('totalUsers').textContent = users.length.toLocaleString();
    document.getElementById('activeUsers').textContent = activeCount.toLocaleString();
    document.getElementById('inactiveUsers').textContent = inactiveCount.toLocaleString();
    document.getElementById('totalOrgs').textContent = orgs;
  }

  // --- Filter users ---
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

  // --- Render user table ---
  function renderTable() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageUsers = filteredUsers.slice(start, end);

    tableBody.innerHTML = pageUsers.map(user => `
      <tr>
        <td class="font-medium">${user.name}</td>
        <td class="text-gray-500">${user.email}</td>
        <td class="text-gray-700">${user.org}</td>
        <td><span class="status-badge status-${user.status}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span></td>
        <td class="text-gray-500">${user.joined}</td>
        <td class="text-gray-500">${user.lastActive}</td>
      </tr>
    `).join('');

    document.getElementById('showingCount').textContent = Math.min(end, filteredUsers.length);
    document.getElementById('totalCount').textContent = filteredUsers.length;

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn && nextBtn) {
      prevBtn.disabled = currentPage === 1;
      nextBtn.disabled = end >= filteredUsers.length;
    }
  }

  // --- Setup event listeners ---
  function setupEventListeners() {
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentStatusFilter = e.target.dataset.filter;
        filterUsers();
      });
    });

    document.querySelectorAll('[data-org]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-org]').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentOrgFilter = e.target.dataset.org;
        filterUsers();
      });
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        filterUsers();
      });
    }

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderTable();
        }
      });
      nextBtn.addEventListener('click', () => {
        if (currentPage * itemsPerPage < filteredUsers.length) {
          currentPage++;
          renderTable();
        }
      });
    }
  }

  // --- Initialize dashboard ---
  function init() {
    updateAnalytics();
    renderTable();
    setupEventListeners();
  }

  init();
});
