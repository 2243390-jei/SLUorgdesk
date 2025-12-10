//Submission JS
document.addEventListener("DOMContentLoaded", function () {
  // Function to calculate Philippine academic year and semester
  function getPhilippineAcademicInfo() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // Philippine academic calendar: June to May
    // 1st Semester: June to November
    // 2nd Semester: December to May
    let startYear, endYear, semester;

    if (currentMonth >= 6) {
      // June onwards = 1st Semester
      startYear = currentYear;
      endYear = currentYear + 1;
      semester = "1st Semester";
    } else {
      // January to May = 2nd Semester
      startYear = currentYear - 1;
      endYear = currentYear;
      semester = "2nd Semester";
    }

    return { startYear, endYear, semester };
  }

  // Auto-fill academic year and semester
  function autoFillAcademicInfo() {
    const { startYear, endYear, semester } = getPhilippineAcademicInfo();

    const startYearInput = document.querySelector('#startYear');
    const endYearInput = document.querySelector('#endYear');
    const semesterSelect = document.querySelector('#semester');

    if (startYearInput && !startYearInput.value) {
      startYearInput.value = startYear;
    }
    if (endYearInput && !endYearInput.value) {
      endYearInput.value = endYear;
    }
    if (semesterSelect && !semesterSelect.value) {
      semesterSelect.value = semester;
    }
  }

  //Autofill Form Data
  async function autofillOrgData() {
    try {
      // Get session user to get organization ID
      const sessionRes = await fetch("../../php-server/routes/users.php?session=me");
      const sessionData = await sessionRes.json();
      
      if (sessionData.success && sessionData.data && sessionData.data.organizationId) {
        const orgId = sessionData.data.organizationId;
        
        // Fetch organization details
        const res = await fetch("../../php-server/routes/organizations.php?id=" + orgId);
        const result = await res.json();
        
        if (result.success && result.data) {
          // Handle both array and single object responses
          const org = Array.isArray(result.data) ? result.data[0] : result.data;
          
          if (org) {
            // Autofill organization fields
            if (org.name) document.querySelector('input[name="org_name"]').value = org.name;
            if (org.acronym) document.querySelector('input[name="org_acronym"]').value = org.acronym;
            if (org.email) document.querySelector('input[name="org_email"]').value = org.email;
          }
        }
      }
    } catch (err) {
      console.warn("Could not autofill organization data:", err);
    }
  }
  
  // Auto-fill on page load
  autoFillAcademicInfo();
  autofillOrgData();

  /* -----------------------------------------------------------------
   *  1. FILE DROP ZONES (inline + modal) – REMOVABLE FILES, NO ACCIDENTAL PICKER
   * ----------------------------------------------------------------- */
  const dropZones = document.querySelectorAll(".drop-zone");
  const fileInputs = document.querySelectorAll(".drop-zone-input");

  dropZones.forEach((dropZone, idx) => {
    const input = fileInputs[idx];
    const files = [];

    // ---- preview container -------------------------------------------------
    const preview = document.createElement("div");
    preview.className = "file-preview-container";
    dropZone.appendChild(preview);

    // ---- browse button ----------------------------------------------------
    const browseBtn = document.createElement("button");
    browseBtn.type = "button";
    browseBtn.textContent = "Browse File";
    browseBtn.className = "browse-btn";
    browseBtn.onclick = () => input.click();
    dropZone.appendChild(browseBtn);

    // ---- render -----------------------------------------------------------
    const render = () => {
      preview.innerHTML = "";
      if (!files.length) {
        preview.innerHTML = '<p style="margin:0;color:#888;">No files selected.</p>';
        return;
      }
      
      files.forEach((f, i) => {
        const item = document.createElement("div");
        item.className = "file-preview-item";

        const name = document.createElement("span");
        name.className = "file-name";
        name.textContent = f.name.length > 20 ? f.name.slice(0,17)+"..." : f.name;
        name.title = f.name;

        const rm = document.createElement("button");
        rm.type = "button";
        rm.textContent = "×";
        rm.className = "remove-file";
        rm.setAttribute("title", "Remove " + f.name);
        
        rm.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          files.splice(i, 1);
          render();
          sync();
        };

        item.append(name, rm);
        preview.appendChild(item);
      });
    };

    // ---- sync with <input> ------------------------------------------------
    const sync = () => {
      const dt = new DataTransfer();
      files.forEach(f => dt.items.add(f));
      input.files = dt.files;
    };

    // ---- drag-and-drop ----------------------------------------------------
    const prevent = e => { e.preventDefault(); e.stopPropagation(); };
    ["dragenter","dragover","dragleave","drop"].forEach(ev => dropZone.addEventListener(ev, prevent));

    ["dragenter","dragover"].forEach(ev => dropZone.addEventListener(ev, () => dropZone.classList.add("dragover")));
    ["dragleave","drop"].forEach(ev => dropZone.addEventListener(ev, () => dropZone.classList.remove("dragover")));

    dropZone.addEventListener("drop", e => {
      const newFiles = Array.from(e.dataTransfer.files).filter(f =>
        /\.(pdf|doc|docx|jpe?g|png)$/i.test(f.name)
      );
      files.push(...newFiles);
      render(); sync();
    });

    // ---- file input change ------------------------------------------------
    input.addEventListener("change", () => {
      const newFiles = Array.from(input.files).filter(f =>
        /\.(pdf|doc|docx|jpe?g|png)$/i.test(f.name)
      );
      files.push(...newFiles);
      render(); sync();
    });

    render(); // initial empty state
  });

  /* -----------------------------------------------------------------
   *  2. MODAL CONTROLS
   * ----------------------------------------------------------------- */
  const modal       = document.getElementById("eventModal");
  const openBtn     = document.getElementById("openEventModalBtn");
  const closeBtn    = document.getElementById("closeEventModal");
  const cancelBtn   = document.getElementById("modalCancelBtn");
  const saveBtn     = document.getElementById("modalSaveEventBtn");
  const previewList = document.getElementById("eventListPreview");

  let editingIndex = null;

  openBtn.onclick = () => {
    editingIndex = null;
    modal.style.display = "flex";
    clearModalFields();
  };

  const closeModal = () => { modal.style.display = "none"; };
  closeBtn.onclick = closeModal;
  cancelBtn.onclick = closeModal;
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

  /* -----------------------------------------------------------------
   *  3. HELPERS
   * ----------------------------------------------------------------- */
  
  // Map SDG numbers to full descriptions
  const SDG_DESCRIPTIONS = {
    "1": "1. No Poverty",
    "2": "2. Zero Hunger",
    "3": "3. Good Health & Well-being",
    "4": "4. Quality Education",
    "5": "5. Gender Equality",
    "6": "6. Clean Water & Sanitation",
    "7": "7. Affordable & Clean Energy",
    "8": "8. Decent Work & Economic Growth",
    "9": "9. Industry, Innovation & Infrastructure",
    "10": "10. Reduced Inequalities",
    "11": "11. Sustainable Cities and Communities",
    "12": "12. Responsible Consumption & Production",
    "13": "13. Climate Action",
    "14": "14. Life Below Water",
    "15": "15. Life on Land",
    "16": "16. Peace, Justice & Strong Institutions",
    "17": "17. Partnerships for the Goals"
  };
  
  const getSDGs = () => {
    const boxes = document.querySelectorAll('#eventModal input[type="checkbox"]:checked');
    return Array.from(boxes).map(b => SDG_DESCRIPTIONS[b.value] || b.value);
  };
  
  const getInlineSDGs = () => {
    const inlineContainer = document.getElementById("inlineEventForm");
    const boxes = inlineContainer.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(boxes).map(b => SDG_DESCRIPTIONS[b.value] || b.value);
  };

  const formatTime = (timeInput, periodSelect) => {
    const t = timeInput.value.trim();
    const p = periodSelect.value;
    return t ? `${t} ${p}` : "";
  };

  // Convert 24-hour HH:MM (from <input type="time">) to 12-hour with AM/PM
  const convert24To12 = (time24) => {
    if (!time24) return "";
    // time24 expected like "14:30" or "09:05"
    const parts = time24.split(":");
    if (parts.length < 2) return time24;
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${period}`;
  };

  const clearModalFields = () => {
    ["modalEventName","modalEventType","modalEventVenue","modalEventAttendees",
     "modalEventProof","modalEventDesc"].forEach(id => document.getElementById(id).value = "");
    document.getElementById("modalEventDate").value = "";
    document.getElementById("modalStartTime").value = "";
    document.getElementById("modalEndTime").value = "";
    document.querySelectorAll('#eventModal input[type="checkbox"]').forEach(c => c.checked = false);
    const modalInput = document.getElementById("modalFileInput");
    modalInput.value = "";
    const modalPrev = modalInput.closest(".drop-zone").querySelector(".file-preview-container");
    if (modalPrev) modalPrev.innerHTML = "<p>No files selected.</p>";
  };

  /* -----------------------------------------------------------------
   *  4. SAVE / UPDATE EVENT
   * ----------------------------------------------------------------- */
  saveBtn.onclick = () => {
    const name      = document.getElementById("modalEventName").value.trim();
    const type      = document.getElementById("modalEventType").value.trim();
    const date      = document.getElementById("modalEventDate").value;
    const start     = formatTime(document.getElementById("modalStartTime"), document.getElementById("modalStartPeriod"));
    const end       = formatTime(document.getElementById("modalEndTime"),   document.getElementById("modalEndPeriod"));
    const venue     = document.getElementById("modalEventVenue").value.trim();
    const attendees = document.getElementById("modalEventAttendees").value;
    const proof     = document.getElementById("modalEventProof").value.trim();
    const sdgs      = getSDGs();
    const desc      = document.getElementById("modalEventDesc").value.trim();

    if (!name || !date || !start || !end) {
      alert("Event Name, Date, Start Time and End Time are required.");
      return;
    }

    const eventData = { name, type, date, start, end, venue, attendees, proof, sdgs, desc };

    let hiddenContainer = editingIndex !== null
      ? document.querySelectorAll(".hidden-event-container")[editingIndex]
      : document.createElement("div");

    hiddenContainer.className = "hidden-event-container";
    hiddenContainer.style.display = "none";
    hiddenContainer.innerHTML = "";

    const addHidden = (className, value) => {
      const inp = document.createElement("input");
      inp.type = "hidden";
      inp.className = className;
      inp.value = value;
      hiddenContainer.appendChild(inp);
    };

    addHidden("event-name", name);
    addHidden("event-type", type);
    addHidden("event-date", date);
    addHidden("start-time", start);
    addHidden("end-time", end);
    addHidden("event-venue", venue);
    addHidden("event-attendees", attendees);
    addHidden("event-proof", proof);
    addHidden("event-desc", desc);
    
    // Store SDG checkboxes as hidden values
    const sdgContainer = document.createElement("div");
    sdgContainer.className = "event-sdg-hidden";
    sdgContainer.style.display = "none";
    sdgs.forEach(s => {
      const cbInput = document.createElement("input");
      cbInput.type = "hidden";
      cbInput.value = s;
      cbInput.className = "event-sdg-value";
      sdgContainer.appendChild(cbInput);
    });
    hiddenContainer.appendChild(sdgContainer);

    // Store file references (actual files will be uploaded separately)
    const modalFileInput = document.getElementById("modalFileInput");
    if (modalFileInput && modalFileInput.files.length) {
      Array.from(modalFileInput.files).forEach(file => {
        const fileInput = document.createElement("input");
        fileInput.type = "hidden";
        fileInput.className = "event-file-hidden";
        // We'll store placeholder; actual paths set after upload
        fileInput.value = file.name;
        hiddenContainer.appendChild(fileInput);
      });
    }

    if (editingIndex === null) {
      document.getElementById("submissionForm").appendChild(hiddenContainer);
    }

    const card = document.createElement("div");
    card.className = "event-preview-entry";
    card.style.cssText = `
      cursor:pointer; border:1px solid #ddd; border-radius:8px; padding:12px; margin-bottom:10px;
      background:#fafafa; font-size:0.95rem; position:relative;
    `;

    const title = `<strong>${name}</strong> (${type || "—"})`;
    const when  = `${date} • ${start} – ${end}`;
    const where = venue ? `Venue: ${venue}` : "";
    const nums  = attendees ? `Attendees: ${attendees}` : "";
    const sdg   = sdgs.length ? `SDGs: ${sdgs.join(", ")}` : "";
    const note  = desc ? `<em>${desc}</em>` : "";

    card.innerHTML = `
      ${title}<br>${when}<br>${where}${nums ? " • " + nums : ""}<br>${sdg}<br>${note}
      <span class="event-delete" style="position:absolute;top:8px;right:8px;color:#d32f2f;font-weight:bold;cursor:pointer;">×</span>
    `;

    card.addEventListener("click", e => {
      if (e.target.classList.contains("event-delete")) return;
      editEvent(card, hiddenContainer, eventData);
    });

    card.querySelector(".event-delete").addEventListener("click", e => {
      e.stopPropagation();
      if (confirm("Delete this event?")) {
        previewList.removeChild(card);
        hiddenContainer.remove();
        if (!previewList.children.length) previewList.innerHTML = "<p><em>No events added yet.</em></p>";
      }
    });

    if (editingIndex !== null) {
      const oldCard = previewList.children[editingIndex];
      previewList.replaceChild(card, oldCard);
    } else {
      if (previewList.querySelector("p")) previewList.innerHTML = "";
      previewList.appendChild(card);
    }

    closeModal();
    clearModalFields();
  };

  /* -----------------------------------------------------------------
   *  5. EDIT EVENT
   * ----------------------------------------------------------------- */
  function editEvent(cardElement, hiddenContainer, data) {
    editingIndex = Array.from(previewList.children).indexOf(cardElement);

    document.getElementById("modalEventName").value      = data.name;
    document.getElementById("modalEventType").value      = data.type;
    document.getElementById("modalEventDate").value      = data.date;
    document.getElementById("modalEventVenue").value     = data.venue;
    document.getElementById("modalEventAttendees").value = data.attendees;
    document.getElementById("modalEventProof").value     = data.proof;
    document.getElementById("modalEventDesc").value      = data.desc;

    const [startTime, startPeriod] = data.start.split(" ");
    const [endTime,   endPeriod]   = data.end.split(" ");
    document.getElementById("modalStartTime").value = startTime || "";
    document.getElementById("modalStartPeriod").value = startPeriod || "AM";
    document.getElementById("modalEndTime").value = endTime || "";
    document.getElementById("modalEndPeriod").value = endPeriod || "AM";

    document.querySelectorAll('#eventModal input[type="checkbox"]').forEach(c => c.checked = false);
    data.sdgs.forEach(s => {
      // Extract the number from the full description (e.g., "4. Quality Education" → "4")
      const match = s.match(/^(\d+)/);
      const sdgNumber = match ? match[1] : s;
      const cb = document.querySelector(`#eventModal input[value="${sdgNumber}"]`);
      if (cb) cb.checked = true;
    });

    const modalInput = document.getElementById("modalFileInput");
    modalInput.value = "";
    const modalPrev = modalInput.closest(".drop-zone").querySelector(".file-preview-container");
    if (modalPrev) modalPrev.innerHTML = "<p>No files selected.</p>";

    modal.style.display = "flex";
  }

  /* -----------------------------------------------------------------
   *  6. INLINE CLEAR BUTTON
   * ----------------------------------------------------------------- */
  const clearInlineBtn = document.getElementById("clearEventBtn");
  if (clearInlineBtn) {
    clearInlineBtn.onclick = () => {
      const container = document.getElementById("inlineEventForm");
      container.querySelectorAll("input[type=text], input[type=date], input[type=number], input[type=url], textarea")
              .forEach(el => el.value = "");
      container.querySelectorAll("input[type=checkbox]").forEach(c => c.checked = false);
      const inlineInput = container.querySelector(".drop-zone-input");
      inlineInput.value = "";
      const inlinePrev = inlineInput.closest(".drop-zone").querySelector(".file-preview-container");
      if (inlinePrev) inlinePrev.innerHTML = "<p>No files selected.</p>";
    };
  }

  /* -----------------------------------------------------------------
   *  7. AUTO-FILL END YEAR: End Year = Start Year + 1
   *     - Updates automatically when Start Year changes
   *     - Prevents manual edit of End Year
   * ----------------------------------------------------------------- */
  const startYearInput = document.getElementById("startYear");
  const endYearInput = document.getElementById("endYear");

  if (startYearInput && endYearInput) {
    // Auto-update End Year
    const updateEndYear = () => {
      const start = parseInt(startYearInput.value, 10);
      if (!isNaN(start) && start >= 2000) {
        endYearInput.value = start + 1;
      } else {
        endYearInput.value = "";
      }
    };

    startYearInput.addEventListener("input", updateEndYear);
    startYearInput.addEventListener("change", updateEndYear);

    // Optional: Prevent manual typing in End Year
    endYearInput.addEventListener("input", function (e) {
      e.preventDefault();
      this.value = ""; // Clear any attempt to type
    });

    endYearInput.addEventListener("keydown", function (e) {
      e.preventDefault(); // Block all keyboard input
    });

    // Make it visually read-only but still submittable
    endYearInput.readOnly = true;
    endYearInput.style.backgroundColor = "#f5f5f5";
    endYearInput.style.cursor = "not-allowed";

    // Trigger on page load (in case pre-filled)
    updateEndYear();
  }

  /* -----------------------------------------------------------------
   *  8. FORM SUBMISSION HANDLER
   * ----------------------------------------------------------------- */
  const submissionForm = document.getElementById("submissionForm");
  if (submissionForm) {
    submissionForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Get session user to determine organization
      let sessionUser = null;
      try {
        const res = await fetch("../../php-server/routes/users.php?session=me");
        const data = await res.json();
        if (data.success) sessionUser = data.data;
      } catch (err) {
        console.error("Failed to fetch session user:", err);
      }

      if (!sessionUser || !sessionUser.organizationId) {
        alert("Error: Could not determine your organization. Please log in again.");
        return;
      }

      // Collect form data
      const startYear = parseInt(document.getElementById("startYear").value) || new Date().getFullYear();
      const endYear = startYear + 1;
      const academicYear = `${startYear}-${endYear}`;
      const orgAcronym = document.querySelector('input[name="org_acronym"]').value || "unknown";

      const submissionData = {
        applicationInfo: {
          applicantName: document.querySelector('input[name="applicant_name"]').value || "",
          email: document.querySelector('input[name="applicant_email"]').value || sessionUser.email || "",
          position: document.querySelector('input[name="applicant_position"]').value || ""
        },
        orgInfo: {
          orgId: sessionUser.organizationId,
          name: document.querySelector('input[name="org_name"]').value || "",
          acronym: document.querySelector('input[name="org_acronym"]').value || "",
          email: document.querySelector('input[name="org_email"]').value || ""
        },
        academicYear: academicYear,
        semester: document.getElementById("semester").value || "",
        events: [],
        revisionComment: document.querySelector('textarea[name="add_note"]').value || "",
        confirmAccuracy: document.querySelector('input[name="confirm"]').checked || false
      };

      // Collect all event data (hidden inputs stored in form)
      const hiddenContainers = submissionForm.querySelectorAll(".hidden-event-container");
      hiddenContainers.forEach(container => {
        const sdgValues = Array.from(container.querySelectorAll('.event-sdg-value')).map(inp => inp.value);
        const eventData = {
          id: `E${Date.now()}`, // Generate unique event ID
          eventName: container.querySelector('.event-name')?.value || "",
          eventType: container.querySelector('.event-type')?.value || "",
          eventDate: container.querySelector('.event-date')?.value || "",
          startTime: container.querySelector('.start-time')?.value || "",
          endTime: container.querySelector('.end-time')?.value || "",
          eventVenue: container.querySelector('.event-venue')?.value || "",
          eventDescription: container.querySelector('.event-desc')?.value || "",
          attendance: parseInt(container.querySelector('.event-attendees')?.value || 0),
          eventProof: container.querySelector('.event-proof')?.value || "",
          eventSDG: sdgValues,
          supportingDocuments: Array.from(container.querySelectorAll('.event-file-hidden')).map(f => f.value)
        };
        submissionData.events.push(eventData);
      });

      // If no events, use inline form
      if (submissionData.events.length === 0) {
        const inlineContainer = document.getElementById("inlineEventForm");
        const eventData = {
          id: `E${Date.now()}`, // Generate unique event ID
          eventName: inlineContainer.querySelector('#eventName')?.value || "",
          eventType: inlineContainer.querySelector('#eventType')?.value || "",
          eventDate: inlineContainer.querySelector('#eventDate')?.value || "",
          // If inline uses native time inputs (HH:MM), convert to 12-hour with AM/PM
          startTime: (function(){
            const v = inlineContainer.querySelector('#startTime')?.value || "";
            return v ? convert24To12(v) : "";
          })(),
          endTime: (function(){
            const v = inlineContainer.querySelector('#endTime')?.value || "";
            return v ? convert24To12(v) : "";
          })(),
          eventVenue: inlineContainer.querySelector('#eventVenue')?.value || "",
          eventDescription: inlineContainer.querySelector('#eventDesc')?.value || "",
          attendance: parseInt(inlineContainer.querySelector('#eventAttendees')?.value || 0),
          eventProof: inlineContainer.querySelector('#eventProof')?.value || "",
          eventSDG: getInlineSDGs(),
          supportingDocuments: []
        };

        if (eventData.eventName || eventData.eventDate) {
          submissionData.events.push(eventData);
        }
      }

      // Validate required fields
      if (!submissionData.semester) {
        alert("Please select a semester.");
        return;
      }

      if (submissionData.events.length === 0) {
        alert("Please add at least one event.");
        return;
      }

      if (!submissionData.confirmAccuracy) {
        alert("Please confirm that the information is accurate.");
        return;
      }

      // Show loading state
      const submitBtn = submissionForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

      try {
        // Step 1: Create submission first
        const createResponse = await fetch("../../php-server/routes/submissions.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submissionData)
        });

        const createResult = await createResponse.json();

        if (!createResult.success) {
          throw new Error(createResult.error || "Failed to create submission");
        }

        const submissionId = createResult.id;

        // Step 2: Upload files if any exist
        const fileUploadResult = await uploadSubmissionFiles(submissionId, orgAcronym);
        
        if (!fileUploadResult.success && fileUploadResult.hasFiles) {
          throw new Error("File upload failed: " + (fileUploadResult.error || "Unknown error"));
        }

        // Success!
        alert("Submission successful! Your form has been submitted.");
        submissionForm.reset();
        
        // Redirect to history
        setTimeout(() => {
          window.location.href = "history.php";
        }, 1000);

      } catch (err) {
        console.error("Submission error:", err);
        alert("Submission failed: " + err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  /* -----------------------------------------------------------------
   *  9. FILE UPLOAD HELPER
   * ----------------------------------------------------------------- */
  async function uploadSubmissionFiles(submissionId, orgAcronym) {
    try {
      const inlineContainer = document.getElementById("inlineEventForm");
      const inlineFileInput = inlineContainer.querySelector('.drop-zone-input');

      // Collect all files from inline and modal forms
      const allFiles = new FormData();
      allFiles.append('submissionId', submissionId);
      allFiles.append('orgAcronym', orgAcronym);

      let hasFiles = false;
      const addedFiles = new Set(); // Track file names to prevent duplicates

      // Add inline form files (from single event form at top)
      if (inlineFileInput && inlineFileInput.files.length > 0) {
        Array.from(inlineFileInput.files).forEach(file => {
          const fileKey = file.name + file.size; // Unique key
          if (!addedFiles.has(fileKey)) {
            allFiles.append('files[]', file);
            addedFiles.add(fileKey);
            hasFiles = true;
          }
        });
      }

      // Add modal form files (from "Add Another Event" modal only)
      const modalFileInput = document.getElementById('modalFileInput');
      if (modalFileInput && modalFileInput.files.length > 0) {
        Array.from(modalFileInput.files).forEach(file => {
          const fileKey = file.name + file.size; // Unique key
          if (!addedFiles.has(fileKey)) {
            allFiles.append('files[]', file);
            addedFiles.add(fileKey);
            hasFiles = true;
          }
        });
      }

      if (!hasFiles) {
        return { success: true, hasFiles: false };
      }

      // Upload files
      const uploadResponse = await fetch("../../php-server/routes/upload.php", {
        method: "POST",
        body: allFiles
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        return { 
          success: false, 
          hasFiles: true,
          error: uploadResult.message || "File upload failed"
        };
      }

      return { success: true, hasFiles: true, files: uploadResult.paths };

    } catch (err) {
      console.error("File upload error:", err);
      return { 
        success: false, 
        hasFiles: true,
        error: err.message
      };
    }
  }

  /* -----------------------------------------------------------------
   *  10. TIME INPUT BUTTON-LIKE BEHAVIOR
   *      Make time inputs open picker when clicked anywhere
   * ----------------------------------------------------------------- */
  const startTimeInput = document.getElementById("startTime");
  const endTimeInput = document.getElementById("endTime");

  [startTimeInput, endTimeInput].forEach(input => {
    if (input) {
      input.addEventListener("click", () => {
        input.showPicker();
      });
    }
  });
});