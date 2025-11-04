/* ======================================
   DATABASE-DRIVEN LOGIN + GOOGLE SSO
   ====================================== */

// --- API endpoint for real users from your DB ---
const USERS_API = "dataFetch/fetchUsers.php"; 

// Unified helper — gets whichever login is active (manual or Google)
function getLoggedInUser() {
  try {
    const local = localStorage.getItem("localUser");
    if (local) return JSON.parse(local);
  } catch (e) {}

  try {
    const g = localStorage.getItem("googleUser");
    if (g) return JSON.parse(g);
  } catch (e) {}

  return null;
}

// Utility: Fetch with timeout (helps prevent hang)
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

    let users = [];
    try {
      const resp = await fetchWithTimeout(USERS_API);
      if (!resp.ok) throw new Error(`Failed to load users (${resp.status})`);
      users = await resp.json();
    } catch (err) {
      console.error("Failed to fetch users:", err);
      return alert("Unable to fetch users from server. Try again later.");
    }

    const user = users.find(u => (u.email || "").toLowerCase() === email);
    if (!user) return alert("User not found. Please check your email.");

    const dbPass = user.password || "";
    const isLikelyBcrypt = typeof dbPass === "string" && dbPass.startsWith("$2");
    if (isLikelyBcrypt) {
      return alert(
        "This account uses a secure server-side password. Manual sign-in is disabled.\n\n" +
        "Please use Google SSO instead."
      );
    }

    console.log("User object from server:", user);
console.log("DB password (raw):", JSON.stringify(dbPass));
console.log("Typed password (raw):", JSON.stringify(password));
console.log("Lengths:", (dbPass||"").length, password.length);
console.log("Exact equality test:", dbPass === password);

    if (dbPass !== password) return alert("Invalid password. Please try again.");

    const normalized = {
      ...user,
      _id: user._id || user._id?._id || String(user._id),
      email: user.email,
      name: user.name || "",
      role: user.role || "",
      organization: user.organization || null,
      organizations: user.organizations || []
    };

    localStorage.setItem("localUser", JSON.stringify(normalized));

   localStorage.removeItem("currentOrgId");

// then, set based on the logged-in organization
if (normalized.role === "Organization" && normalized.organization) {
  const orgId = (typeof normalized.organization === "object" && normalized.organization.$oid)
    ? normalized.organization.$oid
    : String(normalized.organization);
  if (orgId) localStorage.setItem("currentOrgId", orgId);
    } else if (Array.isArray(normalized.organizations) && normalized.organizations.length > 0) {
      const first = normalized.organizations[0];
      const firstId = (typeof first === "object" && first.$oid) ? first.$oid : String(first);
      localStorage.setItem("currentOrgId", firstId);
    }

    const role = (normalized.role || "").toLowerCase();
    alert(`Login successful — welcome ${normalized.name || normalized.email}!`);

    switch (role) {
      case "osas": window.location.href = "osas/calendar.html"; break;
      case "admin": window.location.href = "admin/dashboard.html"; break;
      case "organization": window.location.href = "student/submission.html"; break;
      default: window.location.href = "student/home.html"; break;
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

  localStorage.setItem("googleUser", JSON.stringify(data));

  const email = data.email.toLowerCase();
  alert(`Logged in as ${email}`);

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

/* ==============================
   NAVBAR PROFILE + ORG TABLE
   ============================== */
document.addEventListener("DOMContentLoaded", async () => {
  const navbarProfilePic = document.getElementById("nav-profile-pic");
  if (!navbarProfilePic) return;

  const user = getLoggedInUser();
  if (!user) return;

  // If Google user (has picture)
  if (user.picture) {
    navbarProfilePic.src = user.picture;
    navbarProfilePic.style.borderRadius = "50%";
    return;
  }

  // If manual login and role = organization, fetch logo
  if ((user.role || "").toLowerCase() === "organization") {
    try {
      const resp = await fetch("../dataFetch/fetchDatabase.php");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const orgs = await resp.json();

      const orgMatch = orgs.find(
        (org) =>
          org.email?.toLowerCase() === (user.email || "").toLowerCase() ||
          org._id === user.organization ||
          org._id === localStorage.getItem("currentOrgId")
      );

      if (orgMatch && orgMatch.logoUrl) {
        navbarProfilePic.src = orgMatch.logoUrl;
        navbarProfilePic.style.borderRadius = "0"; // keep square logos
        navbarProfilePic.style.objectFit = "cover";
        return;
      }
    } catch (err) {
      console.error("Failed to load organization logo:", err);
    }
  }

  // Default fallback (no logo found)
  navbarProfilePic.src = "assets/default-avatar.png";
  navbarProfilePic.style.borderRadius = "50%";
});

<<<<<<< HEAD
// main.js – Desktop: Modal | Mobile: Disabled + Logout in Menu

=======
/* ==============================
   CAROUSEL & GALLERY HANDLER
   ============================== */
>>>>>>> 66f3c5caa97709aab3e5bff09b6a461119347204
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

<<<<<<< HEAD
  // Google Profile Picture
  const user = JSON.parse(localStorage.getItem("googleUser"));
  if (user && user.picture && profilePic) {
    profilePic.src = user.picture;
    profilePic.style.borderRadius = "50%";
  }
});
=======
  // Optionally attach events if prev/next exist
  if (prevBtn && nextBtn) {
    prevBtn.addEventListener("click", updateGallery);
    nextBtn.addEventListener("click", updateGallery);
  }
});

/* ==============================
   INIT MANUAL LOGIN SETUP
   ============================== */
document.addEventListener("DOMContentLoaded", setupManualLogin);
>>>>>>> 66f3c5caa97709aab3e5bff09b6a461119347204
