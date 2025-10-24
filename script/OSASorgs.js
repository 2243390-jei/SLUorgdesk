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
        `;
        tableBody.appendChild(row);
      });
    }
  } catch (error) {
    console.error("Error loading organizations:", error);
  }
}

loadOrganizations();
