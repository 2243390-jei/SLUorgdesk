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
          case "admin":   window.location.href = "admin/admin_home.html"; break;
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
  // --- Navbar profile update (if user is logged in) ---
  const navbarProfilePic = document.getElementById("nav-profile-pic");

  if (navbarProfilePic) {
    const user = JSON.parse(localStorage.getItem("googleUser"));
    if (user && user.picture) {
      navbarProfilePic.src = user.picture;
      navbarProfilePic.style.borderRadius = "50%"; // make it round
    } else {
      // If not logged in, redirect back to login page
      // window.location.href = "../index.html";
    }
  }

  // OSAS Table Logic
  const organizations = [
    { 
      name: "ICON", 
      school: "SAMCIS", 
      programs: "BSIT, BSCS, BMMA", 
      image: "/Images/orgs/ICON.jpg" 
    },
    { 
      name: "JPIA", 
      school: "SAMCIS", 
      programs: "BSBA, BSAC", 
      image: "/Images/orgs/JPIA.jpg" 
    },
    { 
      name: "RPG", 
      school: "SAMCIS", 
      programs: "SAMCIS", 
      image: "/Images/orgs/RPG.jpg" 
    }
  ];

  const tableBody = document.getElementById("orgTableBody");

  if (tableBody) {
    tableBody.innerHTML = "";

    organizations.forEach(org => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td><img src="${org.image}" alt="${org.name} logo" class="org-logo"></td>
        <td>${org.name}</td>
        <td>${org.school}</td>
        <td>${org.programs}</td>
      `;

      tableBody.appendChild(row);
    });
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

  // Initial load
  updateGallery();

  // Update when carousel moves
  prevBtn.addEventListener("click", updateGallery);
  nextBtn.addEventListener("click", updateGallery);
});



