// Fetch and display current user profile in sidebar
async function loadUserProfile() {
  try {
    console.log('Attempting to fetch user profile...');
    
    const response = await fetch('../../php-server/routes/users.php?session=me', {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('Failed to fetch user profile:', response.status);
      return;
    }
    
    const text = await response.text();
    console.log('Raw response:', text);
    
    const data = JSON.parse(text);
    console.log('Parsed user data:', data);
    
    if (data.success && data.data) {
      const user = data.data;
      console.log('User found:', user);
      
      const nameEl = document.querySelector('.admin-name');
      const emailEl = document.querySelector('.admin-email');
      
      console.log('Name element:', nameEl);
      console.log('Email element:', emailEl);
      
      if (nameEl) {
        nameEl.textContent = user.name || 'OSAS';
        console.log('Updated name to:', user.name);
      }
      
      if (emailEl) {
        emailEl.textContent = user.email || 'Submissions';
        console.log('Updated email to:', user.email);
      }
    } else {
      console.warn('No user data in response or success is false:', data);
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
  }
}

// Load profile when DOM is ready or if already ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, calling loadUserProfile');
    loadUserProfile();
  });
} else {
  console.log('DOM already ready, calling loadUserProfile');
  loadUserProfile();
}
