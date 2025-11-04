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

    // auto-set currentOrgId
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

/* ==============================
   NAVBAR PROFILE + ORG TABLE
   ============================== */
document.addEventListener("DOMContentLoaded", () => {
  const navbarProfilePic = document.getElementById("nav-profile-pic");

  if (navbarProfilePic) {
    const user = getLoggedInUser();
    if (user && user.picture) {
      navbarProfilePic.src = user.picture;
      navbarProfilePic.style.borderRadius = "50%";
    }
  }
});

/* ==============================
   CAROUSEL & GALLERY HANDLER
   ============================== */
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
