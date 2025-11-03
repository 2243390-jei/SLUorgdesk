/* submission.js – COMPLETE & FINAL */

document.addEventListener("DOMContentLoaded", function () {
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
        name.textContent = f.name.length > 20 ? f.name.slice(0,17)+"..." : f.name;
        name.title = f.name;

        const rm = document.createElement("span");
        rm.textContent = "×";
        rm.className = "remove-file";
        rm.onclick = e => {
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
  const getSDGs = () => {
    const boxes = document.querySelectorAll('#eventModal input[type="checkbox"]:checked');
    return Array.from(boxes).map(b => b.value);
  };

  const formatTime = (timeInput, periodSelect) => {
    const t = timeInput.value.trim();
    const p = periodSelect.value;
    return t ? `${t} ${p}` : "";
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
      ? document.querySelectorAll(".event-hidden-container")[editingIndex]
      : document.createElement("div");

    hiddenContainer.className = "event-hidden-container";
    hiddenContainer.style.display = "none";
    hiddenContainer.innerHTML = "";

    const addHidden = (n, v) => {
      const inp = document.createElement("input");
      inp.type = "hidden";
      inp.name = n;
      inp.value = v;
      hiddenContainer.appendChild(inp);
    };

    addHidden("events[][name]", name);
    addHidden("events[][type]", type);
    addHidden("events[][date]", date);
    addHidden("events[][start]", start);
    addHidden("events[][end]", end);
    addHidden("events[][venue]", venue);
    addHidden("events[][attendees]", attendees);
    addHidden("events[][proof]", proof);
    addHidden("events[][desc]", desc);
    sdgs.forEach(s => addHidden("events[][sdgs][]", s));

    const modalFileInput = document.getElementById("modalFileInput");
    if (modalFileInput.files.length) {
      const clone = modalFileInput.cloneNode(true);
      clone.name = "events[][files][]";
      hiddenContainer.appendChild(clone);
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
      const cb = document.querySelector(`#eventModal input[value="${s}"]`);
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
});