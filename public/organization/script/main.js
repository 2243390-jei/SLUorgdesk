async function getSessionUser() {
  try {
    const response = await fetchWithTimeout("../../php-server/routes/users.php" + "?session=me");
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (err) {
    console.error("Failed to get session user:", err);
    return null;
  }
}

async function fetchWithTimeout(url, options = {}, timeout = 7000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * ===============================
 * MANUAL LOGIN — DB-based auth
 * ===============================
 */
async function setupManualLogin() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      return alert("Please enter your email and password.");
    }

    try {
      // First, authenticate with PHP to get user data (including role)
      const phpResp = await fetchWithTimeout("php-server/routes/users.php", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: email,
          password: password
        })
      });

      if (!phpResp.ok) throw new Error(`Server error (${phpResp.status})`);

      const result = await phpResp.json();

      if (!result.success) {
        return alert(result.error || "Authentication failed.");
      }

      const role = (result.data.role || "").toLowerCase();
      console.log('PHP login successful. User role:', role);
      
      // If admin, also authenticate with Node.js to create session
      if (role === "admin") {
        console.log('Admin user detected, attempting Node.js login...');
        try {
          console.log('Attempting Node.js login for admin user:', email);
          const nodeResp = await fetchWithTimeout(`${API_CONFIG.apiBase}/api/users/login`, {
            method: 'POST',
            credentials: 'include',  // IMPORTANT: Include cookies for session
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email,
              password: password
            })
          });

          console.log('Node.js login response status:', nodeResp.status);
          const nodeData = await nodeResp.json().catch(() => ({}));
          console.log('Node.js login response:', nodeData);

          if (!nodeResp.ok) {
            console.warn('Node.js session creation failed:', nodeData.error || 'Unknown error');
          } else {
            console.log('Node.js session created successfully');
          }
        } catch (err) {
          console.warn('Node.js login error:', err.message);
        }
      } else {
        console.log('Non-admin user, skipping Node.js login');
      }

      alert(`Login successful, welcome ${result.data.name || result.data.email}!`);

      // Small delay to allow console logs to appear before redirect
      setTimeout(() => {
        switch (role) {
          case "osas": window.location.href = "public/osas/calendar.php"; break;
          case "admin": window.location.href = "public/admin/dashboard.php"; break;
          case "organization": window.location.href = "public/organization/submission.php"; break;
          default: window.location.href = "public/organization/submission.php"; break;
        }
      }, 1000);
    } catch (err) {
      return alert("Unable to connect to server. Try again later.");
    }
  });
}

/* ==============================
   GOOGLE IDENTITY SERVICES (SSO)
   ============================== */
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

  const email = data.email.toLowerCase();
  alert(`Logged in as ${email}`);

  if (email.includes("@slu.edu.ph")) {
    if (/^\d+@slu\.edu\.ph$/.test(email)) {
      window.location.href = "public/organization/submission.php";
    } else if (email.startsWith("osas@")) {
      window.location.href = "public/osas/dashboard.php";
    } else if (email.startsWith("admin@")) {
      window.location.href = "public/admin/dashboard.php";
    } else {
      alert("Unrecognized SLU account type.");
    }
  } else {
    alert("Access denied: Please use your SLU email account.");
  }
}

/* ==============================
   NAVBAR PROFILE + ORG TABLE
   ============================== */
document.addEventListener("DOMContentLoaded", async () => {
  const navbarProfilePic = document.getElementById("nav-profile-pic");
  if (!navbarProfilePic) return;

  const user = await getSessionUser();
  if (!user) return;

  // If user has picture (Google SSO)
  if (user.picture) {
    navbarProfilePic.src = user.picture;
    navbarProfilePic.style.borderRadius = "50%";
    return;
  }

  // If organization role, fetch logo from database
  if ((user.role || "").toLowerCase() === "organization") {
    try {
      const resp = await fetch("../../php-server/routes/organizations.php");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const result = await resp.json();
      const orgs = result.success ? result.data : [];

      const orgMatch = orgs.find(
        (org) =>
          org.email?.toLowerCase() === (user.email || "").toLowerCase() ||
          org._id === user.organizationId
      );

      if (orgMatch && (orgMatch.logoUrl || orgMatch.localLogoPath)) {
        const logo = orgMatch.logoUrl || orgMatch.localLogoPath;
        console.log("Organization matched:", orgMatch, "Using logo:", logo);
        navbarProfilePic.src = logo;
        navbarProfilePic.style.borderRadius = "0"; // keep square logos
        navbarProfilePic.style.objectFit = "cover";
        return;
      }
    } catch (err) {
      console.error("Failed to load organization logo:", err);
    }
  }

  console.log("No profile picture found, using default.");
  navbarProfilePic.src = "../../images/student_img/profile.png";
  navbarProfilePic.style.borderRadius = "50%";
});


document.addEventListener("DOMContentLoaded", () => {
  const profilePic = document.getElementById('nav-profile-pic');
  const modal = document.getElementById('profileModal');
  const logoutBtn = document.getElementById('logoutBtn');
  const cancelBtn = document.getElementById('cancelBtn');

  if (window.innerWidth > 767 && profilePic && modal && logoutBtn && cancelBtn) {
    profilePic.addEventListener('click', (e) => {
      e.stopPropagation();
        // Before showing modal, populate it with session info (name + email)
        (async () => {
          try {
            const user = await getSessionUser();
            if (user) {
              const content = `
                <div class="profile-modal-body">
                  <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;">
                    <img src="${profilePic.src || '../../images/student_img/profile.png'}" alt="Profile" style="width:64px;height:64px;border-radius:50%;object-fit:cover;">
                    <div>
                      <h3 style="margin:0;font-size:1.05rem;color:#1e1362;">${user.name || user.fullname || 'Student'}</h3>
                      <p style="margin:4px 0 0 0;color:#666;">${user.email || ''}</p>
                    </div>
                  </div>
                  <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button class="logout-btn" id="logoutBtn">Logout</button>
                    <button class="cancel-btn" id="cancelBtn">Cancel</button>
                  </div>
                </div>
              `;
              modal.querySelector('.profile-modal-content').innerHTML = content;

              // re-wire buttons inside the modal
              const newLogout = modal.querySelector('#logoutBtn');
              const newCancel = modal.querySelector('#cancelBtn');
              if (newCancel) newCancel.addEventListener('click', () => modal.style.display = 'none');
              if (newLogout) {
                newLogout.addEventListener('click', async () => {
                  try { await fetch('../../php-server/routes/logout.php', { method: 'POST' }); } catch (err) { console.error('Logout error:', err); }
                  window.location.href = '../../index.php';
                });
              }
            }
          } catch (e) {
            console.error('Failed to fetch session user for modal:', e);
          }
        })();

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
  }

  // Always wire logout button if present (desktop and mobile)
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('../../php-server/routes/logout.php', { method: 'POST' });
      } catch (err) {
        console.error('Logout error:', err);
      }

      // Redirect to login
      window.location.href = '../../index.php';
    });
  }

});

/* ==============================
   INIT MANUAL LOGIN SETUP
   ============================== */
document.addEventListener("DOMContentLoaded", setupManualLogin);
