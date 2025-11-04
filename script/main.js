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
          case "student": window.location.href = "student/submission.html"; break;
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
      window.location.href = "student/submission.html";
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

// main.js – Desktop: Modal | Mobile: Disabled + Logout in Menu

document.addEventListener("DOMContentLoaded", () => {
  const profilePic = document.getElementById('nav-profile-pic');
  const modal      = document.getElementById('profileModal');
  const logoutBtn  = document.getElementById('logoutBtn');
  const cancelBtn  = document.getElementById('cancelBtn');

  // Only run modal logic on DESKTOP
  if (window.innerWidth > 767 && profilePic && modal && logoutBtn && cancelBtn) {
    profilePic.addEventListener('click', (e) => {
      e.stopPropagation();
      modal.style.display = 'block';
    });

    const closeModal = () => modal.style.display = 'none';
    cancelBtn.addEventListener('click', closeModal);

    document.addEventListener('click', (e) => {
      if (modal.style.display === 'block' && !modal.contains(e.target) && e.target !== profilePic) {
        closeModal();
      }
    });

    modal.addEventListener('click', (e) => e.stopPropagation());

    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '../index.html';
    });
  }

  // Google Profile Picture
  const user = JSON.parse(localStorage.getItem("googleUser"));
  if (user && user.picture && profilePic) {
    profilePic.src = user.picture;
    profilePic.style.borderRadius = "50%";
  }
});