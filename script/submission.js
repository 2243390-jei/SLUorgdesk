// ===========================
// 📄 PRINT REQUEST FORM LOGIC
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("printRequestForm");
  const dropZone = document.querySelector(".drop-zone");
  const fileInput = document.querySelector(".drop-zone-input");

  dropZone.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) {
      updateDropZone(dropZone, fileInput.files[0]);
    }
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drop-zone--active");
    dropZone.style.borderColor = "#3d2ee7";
    dropZone.style.backgroundColor = "#f0f0ff";
  });

  ["dragleave", "dragend"].forEach((type) => {
    dropZone.addEventListener(type, () => {
      dropZone.classList.remove("drop-zone--active");
      dropZone.style.borderColor = "#a8a8ff";
      dropZone.style.backgroundColor = "#f9f9ff";
    });
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      updateDropZone(dropZone, e.dataTransfer.files[0]);
    }
    dropZone.classList.remove("drop-zone--active");
  });

  function updateDropZone(dropZone, file) {
    const prompt = dropZone.querySelector("p, span");
    dropZone.innerHTML = "";
    const fileDetails = document.createElement("div");
    fileDetails.classList.add("file-details");
    fileDetails.innerHTML = `
      <p><strong>${file.name}</strong> (${(file.size / 1024).toFixed(1)} KB)</p>
    `;
    dropZone.appendChild(fileDetails);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const isValid = form.checkValidity();
    if (!isValid) {
      alert("Please complete all required fields before submitting.");
      return;
    }
    alert("Print request submitted successfully!");
    form.reset();
    dropZone.innerHTML = `
      <p>Browse File</p>
      <span>Drag & Drop files here</span>
      <input type="file" name="document" class="drop-zone-input" required />
    `;
  });

  form.addEventListener("reset", (e) => {
    const confirmReset = confirm("Are you sure you want to reset the form?");
    if (!confirmReset) e.preventDefault();
    else {
      dropZone.innerHTML = `
        <p>Browse File</p>
        <span>Drag & Drop files here</span>
        <input type="file" name="document" class="drop-zone-input" required />
      `;
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

  // Load existing events
  renderEvents();

  // Open modal
  openEventModalBtn.addEventListener("click", () => {
    clearForm();
    editIndex = null;
    eventModal.style.display = "flex";
  });

  // Close modal
  closeEventBtns.forEach(btn =>
    btn.addEventListener("click", () => (eventModal.style.display = "none"))
  );

  // Save event
  saveEventBtn.addEventListener("click", () => {
    const selectedSDGs = Array.from(inputs.sdgs)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

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

    // Basic validation
    if (!eventData.name || !eventData.type || !eventData.date) {
      alert("Please fill in the required fields.");
      return;
    }

    // Update or add
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

  // Render event list
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

      // Remove event
      card.querySelector(".removeEventBtn").addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm(`Delete event "${ev.name}"?`)) {
          events.splice(i, 1);
          saveToLocalStorage();
          renderEvents();
        }
      });

      // Edit event
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
        inputs.sdgs.forEach(cb => cb.checked = evData.sdgs.includes(cb.value));

        editIndex = i;
        eventModal.style.display = "flex";
      });

      eventList.appendChild(card);
    });
  }

  function clearForm() {
    Object.values(inputs).forEach(input => {
      if (input instanceof NodeList) input.forEach(cb => (cb.checked = false));
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