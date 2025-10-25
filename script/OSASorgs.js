// OSASorgs.js
const tableBody = document.getElementById("orgTableBody");

async function loadOrganizations() {
  try {
    const response = await fetch("http://localhost:3000/api/organizations");
    const organizations = await response.json();

    if (tableBody) {
      tableBody.innerHTML = "";

      organizations.forEach(org => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td><img src="${org.logoUrl}" alt="${org.acronym} logo" class="org-logo"></td>
          <td>${org.acronym}</td>
          <td>${org.school}</td>
          <td>
            <button class="view-btn">View Submissions</button>
          </td>
        `;

       // ✅ When button is clicked, go to submissions.html
row.querySelector(".view-btn").addEventListener("click", () => {
  window.location.href = "../osas/OSASsubmissions.html";
});


        tableBody.appendChild(row);
      });
    }
  } catch (error) {
    console.error("Error loading organizations:", error);
  }
}

loadOrganizations();
