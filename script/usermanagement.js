// Global variables
let users = [];
let currentPage = 1;
let rowsPerPage = 10;
let currentFilters = {
    search: '',
    role: '',
    school: ''
};
let userToDelete = null;
let currentViewport = isMobile() ? 'mobile' : 'desktop';
let selectedRole = '';

// DOM Elements
const userTableBody = document.getElementById('userTableBody');
const userCardList = document.getElementById('userCardList');
const roleModal = document.getElementById('roleModal');
const userModal = document.getElementById('userModal');
const deleteModal = document.getElementById('deleteModal');
const userForm = document.getElementById('userForm');
const searchInput = document.getElementById('searchInput');
const filterToggle = document.getElementById('filterToggle');
const filterMenu = document.querySelector('.filter-menu');
const rowsPerPageSelect = document.getElementById('rowsPerPage');
const addUserBtn = document.getElementById('addUserBtn');

// Ensure modals are hidden by default
roleModal.style.display = 'none';
userModal.style.display = 'none';
deleteModal.style.display = 'none';

// Event Listeners
document.addEventListener('DOMContentLoaded', initialize);
addUserBtn.addEventListener('click', openRoleModal);
userForm.addEventListener('submit', handleSubmit);
searchInput.addEventListener('input', handleSearch);
filterToggle.addEventListener('click', toggleFilterMenu);
document.getElementById('clearFilterBtn').addEventListener('click', clearFilters);
rowsPerPageSelect.addEventListener('change', handleRowsPerPageChange);

// Role selection event listeners
document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        selectedRole = e.target.closest('.role-btn').dataset.role;
        openUserFormModal(selectedRole);
    });
});

// Event delegation for filter buttons (role and school)
filterMenu?.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-item');
    if (!btn) return;
    const type = btn.dataset.type; // 'role' or 'school'
    const value = btn.dataset.filter || '';

    if (type === 'role') {
        currentFilters.role = value;
        // mark active state
        document.querySelectorAll('#filterMenu .filter-item[data-type="role"]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    if (type === 'school') {
        currentFilters.school = value;
        document.querySelectorAll('#filterMenu .filter-item[data-type="school"]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    currentPage = 1;
    updateTable();
    // close menu on mobile after select
    filterMenu.classList.add('hidden');
});

// Check for viewport changes periodically (for DevTools)
function checkViewportChange() {
    const nowMobile = isMobile();
    const nowViewport = nowMobile ? 'mobile' : 'desktop';
    
    if (nowViewport !== currentViewport) {
        currentViewport = nowViewport;
        renderUserCardsOrTable();
        updateTable(); // Re-render with current data
    }
}

// Check every 500ms for viewport changes
setInterval(checkViewportChange, 500);

// Also check when DevTools might be opened/closed
window.addEventListener('resize', () => {
    checkViewportChange();
});

// Initialize the page
async function initialize() {
    try {
        users = await fetchUsers();
        if (users && users.length > 0) {
            updateTable();
            // mark default 'All' filters as active
            const defaultRoleBtn = document.querySelector('#filterMenu .filter-item[data-type="role"][data-filter=""]');
            const defaultSchoolBtn = document.querySelector('#filterMenu .filter-item[data-type="school"][data-filter=""]');
            defaultRoleBtn?.classList.add('active');
            defaultSchoolBtn?.classList.add('active');
        } else {
            userTableBody.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
            userCardList.innerHTML = '<div style="text-align:center;color:#888;padding:20px;">No users found</div>';
        }
    } catch (error) {
        console.error('Error initializing:', error);
        userTableBody.innerHTML = '<tr><td colspan="6">Error loading users</td></tr>';
        userCardList.innerHTML = '<div style="text-align:center;color:#888;padding:20px;">Error loading users</div>';
    }

    // Initial render for mobile/desktop - force both to render
    renderUserCardsOrTable();
    
    // More frequent viewport checking
    window.addEventListener('resize', renderUserCardsOrTable);
    
    // Initial viewport state
    currentViewport = isMobile() ? 'mobile' : 'desktop';
}

// Fetch users from MongoDB
async function fetchUsers() {
    try {
        const apiBase = "../dataFetch/fetchUsers.php";  // Update this URL to match your MongoDB API endpoint
        console.log('Fetching users from:', apiBase);
        const response = await fetch(apiBase);
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Fetched data:', data);
        users = data;
        return users;
    } catch (err) {
        console.error("Error fetching users:", err);
        userTableBody.innerHTML = `<tr><td colspan="6">Error loading data. Please make sure the server is running at ${apiBase}</td></tr>`;
        return [];
    }
}

// Filter users based on current filters
function filterUsers() {
    return users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
                            user.email.toLowerCase().includes(currentFilters.search.toLowerCase());
        const matchesRole = !currentFilters.role || user.role === currentFilters.role;
        const matchesSchool = !currentFilters.school || user.school === currentFilters.school;
        return matchesSearch && matchesRole && matchesSchool;
    });
}

// Update table with filtered and paginated data
function updateTable() {
    const filteredUsers = filterUsers();
    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedUsers = filteredUsers.slice(start, end);

    userTableBody.innerHTML = paginatedUsers.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>${user.school || '-'}</td>
            <td>
                <span class="status-badge ${user.isActive ? 'status-active' : 'status-inactive'}">
                    ${user.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td class="action-buttons">
                <button class="action-icon" onclick="openEditModal('${user._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-icon" onclick="openDeleteModal('${user._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    renderUserCardsOrTable();
    updatePagination(totalPages);
}

// Detect mobile screen
function isMobile() {
    return window.innerWidth <= 768;
}

// Render user cards for mobile, table for desktop
function renderUserCardsOrTable() {
    if (!userCardList) return;
    
    const mobile = isMobile();
    
    if (mobile) {
        userCardList.style.display = 'flex';
        if (userTableBody.parentElement && userTableBody.parentElement.parentElement) {
            userTableBody.parentElement.parentElement.style.display = 'none';
        }
        renderUserCards(); // Make sure this is called
    } else {
        userCardList.style.display = 'none';
        if (userTableBody.parentElement && userTableBody.parentElement.parentElement) {
            userTableBody.parentElement.parentElement.style.display = '';
        }
    }
}

function renderUserCards() {
    userCardList.innerHTML = '';
    let filteredUsers = filterUsers();
    if (!filteredUsers.length) {
        userCardList.innerHTML = `<div style='text-align:center;color:#888;padding:20px;'>No users found.</div>`;
        return;
    }
    
    // Pagination
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filteredUsers.slice(start, end);
    
    pageData.forEach(user => {
        userCardList.innerHTML += `
        <div class="card-item">
            <div class="card-header">
                <div class="card-logo"><i class="fas fa-user"></i></div>
                <div>
                    <div class="card-title">${user.name}</div>
                    <div class="card-email">${user.email}</div>
                </div>
            </div>
            <div class="card-meta">
                <span><b>Role:</b> ${user.role}</span>
                <span><b>School:</b> ${user.school || '-'}</span>
                <span><b>Status:</b> ${user.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div class="card-actions">
                <button class="action-icon" title="Edit" onclick="openEditModal('${user._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-icon" title="Delete" onclick="openDeleteModal('${user._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        `;
    });
}

// Update pagination controls
function updatePagination(totalPages) {
    const pagination = document.getElementById('pagination');
    let html = '';

    if (totalPages > 1) {
        html += `<button onclick="changePage(1)" ${currentPage === 1 ? 'disabled' : ''}>«</button>`;
        html += `<button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                html += `<button onclick="changePage(${i})" class="${currentPage === i ? 'active-page' : ''}">${i}</button>`;
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                html += '<span>...</span>';
            }
        }

        html += `<button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
        html += `<button onclick="changePage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>»</button>`;
    }

    pagination.innerHTML = html;
}

// Modal functions
function openRoleModal() {
    roleModal.style.display = 'flex';
    selectedRole = '';
}

function closeRoleModal() {
    roleModal.style.display = 'none';
}

function openUserFormModal(role) {
    closeRoleModal();
    selectedRole = role;
    
    const modalTitle = document.getElementById('modalTitle');
    modalTitle.textContent = `Add ${role} User`;
    
    // Set the role in the form and disable it
    const roleSelect = document.getElementById('role');
    roleSelect.value = role;
    
    // Show/hide role-specific fields
    hideAllRoleSpecificFields();
    
    switch(role) {
        case 'Organization':
            document.getElementById('organizationFields').classList.add('show');
            break;
        case 'OSAS':
            document.getElementById('osasFields').classList.add('show');
            break;
        case 'Admin':
            document.getElementById('adminFields').classList.add('show');
            break;
    }
    
    userModal.style.display = 'flex';
}

function hideAllRoleSpecificFields() {
    document.querySelectorAll('.role-specific-fields').forEach(field => {
        field.classList.remove('show');
    });
}

function openEditModal(userId) {
    const user = users.find(u => u._id === userId);
    if (!user) return;
    
    const modalTitle = document.getElementById('modalTitle');
    modalTitle.textContent = 'Edit User';
    
    // Populate the form
    document.getElementById('name').value = user.name;
    document.getElementById('email').value = user.email;
    document.getElementById('password').value = ''; // Don't populate password
    document.getElementById('role').value = user.role;
    
    // Show/hide role-specific fields based on user's role
    hideAllRoleSpecificFields();
    
    switch(user.role) {
        case 'Organization':
            document.getElementById('organizationFields').classList.add('show');
            document.getElementById('logoURL').value = user.logoURL || '';
            document.getElementById('school').value = user.school || '';
            break;
        case 'OSAS':
            document.getElementById('osasFields').classList.add('show');
            break;
        case 'Admin':
            document.getElementById('adminFields').classList.add('show');
            break;
    }
    
    userForm.dataset.userId = userId;
    userModal.style.display = 'flex';
}

function closeUserModal() {
    userModal.style.display = 'none';
    userForm.reset();
    hideAllRoleSpecificFields();
    selectedRole = '';
}

function openDeleteModal(userId) {
    userToDelete = userId;
    deleteModal.style.display = 'flex';
}

function closeDeleteModal() {
    deleteModal.style.display = 'none';
    userToDelete = null;
}

// Form submission handler (temporary - only updates UI)
async function handleSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = Object.fromEntries(formData.entries());
    
    // Add isActive field
    userData.isActive = true;
    
    const userId = event.target.dataset.userId;
    
    if (userId) {
        // Edit existing user in local array
        const userIndex = users.findIndex(u => u._id === userId);
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...userData };
        }
    } else {
        // Add new user to local array with temporary ID
        userData._id = 'temp_' + Date.now();
        users.unshift(userData); // Add to beginning of array
    }
    
    // Update UI only
    updateTable();
    closeUserModal();
}

// Delete user (temporary - only updates UI)
async function confirmDelete() {
    if (!userToDelete) return;
    
    // Find the user to "delete" in the local array
    const userIndex = users.findIndex(u => u._id === userToDelete);
    if (userIndex !== -1) {
        // Temporarily remove from local array only
        users.splice(userIndex, 1);
        // Update the UI
        updateTable();
        closeDeleteModal();
    }
}

// Filter and search handlers
function handleSearch(event) {
    currentFilters.search = event.target.value;
    currentPage = 1;
    updateTable();
}

function clearFilters() {
    currentFilters = { search: '', role: '', school: '' };
    searchInput.value = '';
    // remove active classes from filter buttons
    document.querySelectorAll('#filterMenu .filter-item').forEach(b => b.classList.remove('active'));
    currentPage = 1;
    updateTable();
}

function toggleFilterMenu() {
    filterMenu.classList.toggle('hidden');
}

// Pagination handlers
function handleRowsPerPageChange(event) {
    rowsPerPage = parseInt(event.target.value);
    currentPage = 1;
    updateTable();
}

function changePage(page) {
    currentPage = page;
    updateTable();
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === roleModal) {
        closeRoleModal();
    }
    if (event.target === userModal) {
        closeUserModal();
    }
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
});