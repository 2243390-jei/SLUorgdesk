// --- Dummy users (for manual login) ---
const users = [
  { role: "student", email: "student@slu.edu.ph", password: "student123" },
  { role: "osas",    email: "osas@slu.edu.ph",    password: "osas123" },
  { role: "admin",   email: "admin@slu.edu.ph",   password: "admin123" }
];

// --- para sa manual login pero dummy lang to ---
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    alert(`Login successful! Welcome, ${user.role.toUpperCase()}.`);

    switch (user.role) {
      case "student": window.location.href = "student/home.html"; break;
      case "osas":    window.location.href = "osas/dashboard.html"; break;
      case "admin":   window.location.href = "admin/dashboard.html"; break;
    }
  } else {
    alert("Invalid email or password. Please try again.");
  }
});

// --- Google Identity Services (SSO) ---
window.onload = function () {
  google.accounts.id.initialize({
    client_id: "687307417693-f5v0ljfh76qpgcrk6uf70io0pe4me6d0.apps.googleusercontent.com",
    callback: handleCredentialResponse
  });
  google.accounts.id.renderButton(
    document.getElementById("g_id_signin"),
    { theme: "outline", size: "large", text: "signin_with" }
  );
};

// --- Handle Google credential response ---
function handleCredentialResponse(response) {
  const data = JSON.parse(atob(response.credential.split('.')[1]));
  console.log("Google User Data:", data);

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
      // Any other SLU email fallback
      alert("Unrecognized SLU account type.");
    }
  } else {
    // if hindi slu org acc niya hindi siya makakapasok
    alert("Access denied: Please use your SLU email account.");
  }
}
