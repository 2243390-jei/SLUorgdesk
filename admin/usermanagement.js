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
const roleFilter = document.getElementById('roleFilter');
const schoolFilter = document.getElementById('schoolFilter');
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
roleFilter.addEventListener('change', handleFilter);
schoolFilter.addEventListener('change', handleFilter);
filterToggle.addEventListener('click', toggleFilterMenu);
document.getElementById('clearFilterBtn').addEventListener('click', clearFilters);
rowsPerPageSelect.addEventListener('change', handleRowsPerPageChange);

// Initialize the page
async function initialize() {
    await fetchUsers();
    updateTable();
}

// Initialize with sample users (no API call)
async function fetchUsers() {
    // Sample data for frontend development matching MongoDB structure
    users = [
        {
            _id: '67189c51b4c79f7a2a3e9d01',
            name: 'Juan Dela Cruz',
            email: 'juan.delacruz@slu.edu.ph',
            role: 'Student Leader',
            studentId: '2023-00001',
            school: 'SAMCIS',
            course: 'BS Information Technology',
            yearLevel: 3,
            isActive: true
        },
        {
            _id: '67189c51b4c79f7a2a3e9d02',
            name: 'Maria C. Santos',
            email: 'maria.santos@slu.edu.ph',
            role: 'OSAS',
            employeeId: 'EMP-1023',
            school: 'SAMCIS',
            department: 'Information Technology',
            isActive: true
        },
        {
            _id: '67189c51b4c79f7a2a3e9d03',
            name: 'Jose T. Torres',
            email: 'jose.torres@slu.edu.ph',
            role: 'OSAS',
            employeeId: 'EMP-1089',
            school: 'SAMCIS',
            department: 'Computer Science',
            isActive: true
        },
        {
            _id: '69084f36d7d9e21af42a510c',
            name: 'Admin User',
            email: 'admin@slu.edu.ph',
            role: 'Admin',
            school: 'SAMCIS',
            isActive: true
        }
    ];
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
    roleFilter.value = '';
    schoolFilter.value = '';
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
