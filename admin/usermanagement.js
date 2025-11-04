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

// DOM Elements
const userTableBody = document.getElementById('userTableBody');
const userModal = document.getElementById('userModal');
const deleteModal = document.getElementById('deleteModal');
const userForm = document.getElementById('userForm');
const searchInput = document.getElementById('searchInput');
// roleFilter and schoolFilter replaced by button-based filters inside #filterMenu
const filterToggle = document.getElementById('filterToggle');
const filterMenu = document.querySelector('.filter-menu');
const rowsPerPageSelect = document.getElementById('rowsPerPage');
const addUserBtn = document.getElementById('addUserBtn');

// Ensure modals are hidden by default
userModal.style.display = 'none';
deleteModal.style.display = 'none';

// Event Listeners
document.addEventListener('DOMContentLoaded', initialize);
addUserBtn.addEventListener('click', () => openModal());
userForm.addEventListener('submit', handleSubmit);
searchInput.addEventListener('input', handleSearch);
filterToggle.addEventListener('click', toggleFilterMenu);
document.getElementById('clearFilterBtn').addEventListener('click', clearFilters);
rowsPerPageSelect.addEventListener('change', handleRowsPerPageChange);

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
        }
    } catch (error) {
        console.error('Error initializing:', error);
        userTableBody.innerHTML = '<tr><td colspan="6">Error loading users</td></tr>';
    }
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
                <button class="action-icon" onclick="openModal('${user._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-icon" onclick="openDeleteModal('${user._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    updatePagination(totalPages);
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
function openModal(userId = null) {
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('userForm');
    
    if (userId) {
        const user = users.find(u => u._id === userId);
        if (!user) return;
        
        modalTitle.textContent = 'Edit User';
        form.elements.name.value = user.name;
        form.elements.email.value = user.email;
        form.elements.password.value = ''; // Don't populate password
        form.elements.role.value = user.role;
        form.elements.studentId.value = user.studentId || '';
        form.elements.school.value = user.school || '';
        form.elements.course.value = user.course || '';
        form.elements.yearLevel.value = user.yearLevel || '';
        form.dataset.userId = userId;
    } else {
        modalTitle.textContent = 'Add New User';
        form.reset();
        delete form.dataset.userId;
    }
    
    // use flex so the CSS flex centering rules apply
    userModal.style.display = 'flex';
}

function closeModal() {
    userModal.style.display = 'none';
    userForm.reset();
}

function openDeleteModal(userId) {
    userToDelete = userId;
    // open as flex so modal centers vertically
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
    closeModal();
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

function handleFilter(event) {
    currentFilters[event.target.id.replace('Filter', '')] = event.target.value;
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
