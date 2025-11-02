// ===========================
// 📄 PRINT REQUEST FORM LOGIC (DRAG & DROP)
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  const dropZones = document.querySelectorAll(".drop-zone");

  dropZones.forEach((dropZone) => {
    const fileInput = dropZone.querySelector("input[type='file']");

    dropZone.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", () => {
      if (fileInput.files.length) updateDropZone(dropZone, fileInput.files[0]);
    });

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("drop-zone--active");
      dropZone.style.borderColor = "#3d2ee7";
      dropZone.style.backgroundColor = "#f0f0ff";
    });

    ["dragleave", "dragend"].forEach((type) =>
      dropZone.addEventListener(type, () => {
        dropZone.classList.remove("drop-zone--active");
        dropZone.style.borderColor = "#a8a8ff";
        dropZone.style.backgroundColor = "#f9f9ff";
      })
    );

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        updateDropZone(dropZone, e.dataTransfer.files[0]);
      }
      dropZone.classList.remove("drop-zone--active");
    });
  });

  function updateDropZone(dropZone, file) {
    dropZone.innerHTML = `
      <div class="file-details">
        <p><strong>${file.name}</strong> (${(file.size / 1024).toFixed(1)} KB)</p>
      </div>
    `;
  }
});


// ===========================
// 🎓 ACADEMIC YEAR SELECTOR (AUTO-GENERATE FROM CALENDAR YEAR)
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  const startYearInput = document.getElementById("startYear");
  const academicYearSelect = document.getElementById("academicYear");
  const semesterSelect = document.getElementById("semester");

  // Populate semester options
  ["1st Semester", "2nd Semester"].forEach((sem) => {
    const option = document.createElement("option");
    option.value = sem;
    option.textContent = sem;
    semesterSelect.appendChild(option);
  });

  // Generate 5 consecutive academic years from selected date
  startYearInput.addEventListener("change", () => {
    const dateValue = startYearInput.value;
    if (!dateValue) return;

    const startYear = new Date(dateValue).getFullYear();

    academicYearSelect.innerHTML = '<option value="" disabled selected>Select Academic Year</option>';

    for (let i = 0; i < 5; i++) {
      const year1 = startYear + i;
      const year2 = year1 + 1;
      const option = document.createElement("option");
      option.value = `${year1}-${year2}`;
      option.textContent = `${year1}–${year2}`;
      academicYearSelect.appendChild(option);
    }
  });
});


// ===========================
// 📅 EVENT MANAGEMENT SYSTEM
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  const eventModal = document.getElementById("eventModal");
  const openEventModalBtn = document.getElementById("openEventModalBtn");
  const closeEventBtns = document.querySelectorAll("#closeEventModal, #closeEventModalBtn, .event-modal-close");
  const saveEventBtn = document.getElementById("saveEventBtn");
  const eventList = document.getElementById("eventList");

  const inputs = {
    name: document.getElementById("eventName"),
    type: document.getElementById("eventType"),
    date: document.getElementById("eventDate"),
    startTime: document.getElementById("startTime"),
    startPeriod: document.getElementById("startPeriod"),
    endTime: document.getElementById("endTime"),
    endPeriod: document.getElementById("endPeriod"),
    venue: document.getElementById("eventVenue"),
    attendees: document.getElementById("eventAttendees"),
    proof: document.getElementById("eventProof"),
    sdgs: document.querySelectorAll(".event-sdg-options input[type='checkbox']")
  };

  let editIndex = null;
  let events = JSON.parse(localStorage.getItem("eventsData")) || [];

  renderEvents();

  openEventModalBtn.addEventListener("click", () => {
    clearForm();
    editIndex = null;
    eventModal.style.display = "flex";
  });

  closeEventBtns.forEach((btn) =>
    btn.addEventListener("click", () => (eventModal.style.display = "none"))
  );

  saveEventBtn.addEventListener("click", () => {
    const selectedSDGs = Array.from(inputs.sdgs)
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);

    const eventData = {
      name: inputs.name.value.trim(),
      type: inputs.type.value.trim(),
      date: inputs.date.value,
      startTime: `${inputs.startTime.value} ${inputs.startPeriod.value}`,
      endTime: `${inputs.endTime.value} ${inputs.endPeriod.value}`,
      venue: inputs.venue.value.trim(),
      attendees: inputs.attendees.value,
      proof: inputs.proof.value.trim(),
      sdgs: selectedSDGs
    };

    if (!eventData.name || !eventData.type || !eventData.date) {
      alert("Please fill in the required fields.");
      return;
    }

    if (editIndex !== null) {
      events[editIndex] = eventData;
    } else {
      events.push(eventData);
    }

    saveToLocalStorage();
    renderEvents();
    eventModal.style.display = "none";
    clearForm();
  });

  function renderEvents() {
    eventList.innerHTML = "";
    events.forEach((ev, i) => {
      const card = document.createElement("div");
      card.classList.add("event-card");

      card.innerHTML = `
        <div class="event-info">
          <strong>${ev.name}</strong><br>
          ${ev.type} — ${ev.date}<br>
          ${ev.startTime} to ${ev.endTime}<br>
          Venue: ${ev.venue}<br>
          SDGs: ${ev.sdgs.join(", ") || "None"}
        </div>
        <button class="removeEventBtn">Remove</button>
      `;

      card.querySelector(".removeEventBtn").addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm(`Delete event "${ev.name}"?`)) {
          events.splice(i, 1);
          saveToLocalStorage();
          renderEvents();
        }
      });

      card.addEventListener("click", () => {
        const evData = events[i];
        inputs.name.value = evData.name;
        inputs.type.value = evData.type;
        inputs.date.value = evData.date;

        const [st, sp] = evData.startTime.split(" ");
        const [et, ep] = evData.endTime.split(" ");
        inputs.startTime.value = st || "";
        inputs.startPeriod.value = sp || "AM";
        inputs.endTime.value = et || "";
        inputs.endPeriod.value = ep || "AM";

        inputs.venue.value = evData.venue;
        inputs.attendees.value = evData.attendees;
        inputs.proof.value = evData.proof;
        inputs.sdgs.forEach((cb) => (cb.checked = evData.sdgs.includes(cb.value)));

        editIndex = i;
        eventModal.style.display = "flex";
      });

      eventList.appendChild(card);
    });
  }

  function clearForm() {
    Object.values(inputs).forEach((input) => {
      if (input instanceof NodeList) input.forEach((cb) => (cb.checked = false));
      else input.value = "";
    });
  }

  function saveToLocalStorage() {
    localStorage.setItem("eventsData", JSON.stringify(events));
  }
});

document.querySelectorAll(".event-sdg-options label").forEach((label, index) => {
  label.setAttribute("data-number", index + 1);
});


// ===========================
// 🚫 DUPLICATE SUBMISSION VALIDATION
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("submissionForm");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = form.querySelector("input[name='org_email']").value.trim();
    const academicYear = document.getElementById("academicYear").value;
    const semester = document.getElementById("semester").value;

    if (!email || !academicYear || !semester) {
      alert("Please fill in all required fields, including Academic Year and Semester.");
      return;
    }

    const submissionKey = `${email}_${academicYear}_${semester}`;
    const existingSubmissions = JSON.parse(localStorage.getItem("orgSubmissions")) || {};

    if (existingSubmissions[submissionKey]) {
      alert(
        `You have already submitted a form for Academic Year ${academicYear}, ${semester}.\nPlease go to your History page to edit your previous submission instead.`
      );
      return;
    }

    existingSubmissions[submissionKey] = {
      email,
      academicYear,
      semester,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem("orgSubmissions", JSON.stringify(existingSubmissions));
    alert("✅ Submission successful!");
    form.reset();
    document.getElementById("academicYear").innerHTML = '<option value="" disabled selected>Select Academic Year</option>';
  });
});
