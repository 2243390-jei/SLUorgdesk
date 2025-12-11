const API_URL = "../../php-server/routes/submissions.php";
let allSubmissions = [];
let currentEditingId = null;
const modal = document.getElementById("submissionModal");
const submissionList = document.getElementById("submissionList");
const searchInput = document.getElementById("searchInput");
const academicYearFilter = document.getElementById("academicYearFilter");
const semesterFilter = document.getElementById("semesterFilter");
const modalEditBtn = document.getElementById("modalEditBtn");
let isEditMode = false;
let revisionRefreshInterval = null; // For polling revision comments

// ======================================================
// Fetch helper
// ======================================================
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}


async function initialize() {
  try {
    // Server handles session validation and returns only user's organization submissions
    const response = await fetchWithTimeout(API_URL + "?myorg=1");
    const responseData = await response.json();
    
    if (!responseData.success) {
      const errorMsg = responseData.error || "Unknown error";
      submissionList.innerHTML = `
        <div class="no-data">
          <img src="../images/student_img/no-data.png" alt="No Data" style="width:120px;margin-bottom:1rem;">
          <p>${errorMsg}</p>
        </div>`;
      return;
    }
    
    let submissions = [];
    if (responseData.success && Array.isArray(responseData.data)) {
      submissions = responseData.data;
    } else if (Array.isArray(responseData)) {
      submissions = responseData;
    }

    if (submissions.length === 0) {
      submissionList.innerHTML = `
        <div class="no-data">
          <img src="../images/student_img/no-data.png" alt="No Data" style="width:120px;margin-bottom:1rem;">
          <p>No submissions found for your organization.</p>
        </div>`;
      return;
    }

    allSubmissions = submissions;

    // populate filters only when we have submissions
    const uniqueAY = [...new Set(allSubmissions.map(s => s.academicYear))].filter(Boolean).sort().reverse();

    if (academicYearFilter) {
      academicYearFilter.innerHTML = `
        <option value="">All Academic Years</option>
        ${uniqueAY.map(ay => `<option value="${ay}">${ay}</option>`).join("")}
      `;
    }

    if (semesterFilter) {
      semesterFilter.innerHTML = `
        <option value="">All Semesters</option>
        <option value="1st Semester">1st Semester</option>
        <option value="2nd Semester">2nd Semester</option>
        <option value="Short Term">Short Term</option>
      `;
    }

    academicYearFilter?.addEventListener("change", applyFilters);
    semesterFilter?.addEventListener("change", applyFilters);
    searchInput?.addEventListener("input", debounce(applyFilters, 300));

    renderCards(allSubmissions);
  } catch (error) {
    submissionList.innerHTML = `<div class="error-message"><p>Error loading submissions: ${error.message}</p></div>`;
  }
}

document.addEventListener("DOMContentLoaded", initialize);

// ======================================================
// Filter and Render
// ======================================================
function applyFilters() {
  const searchTerm = (searchInput?.value || "").toLowerCase().trim();
  const selectedAY = (academicYearFilter?.value || "").trim();
  const selectedSemester = (semesterFilter?.value || "").trim();

  let filtered = [...allSubmissions];
  if (selectedAY) filtered = filtered.filter(sub => sub.academicYear === selectedAY);
  if (selectedSemester) filtered = filtered.filter(sub => sub.semester === selectedSemester);
  if (searchTerm) {
    filtered = filtered.filter(sub => {
      const searchable = [
        sub.orgInfo?.name,
        sub.orgInfo?.acronym,
        sub.applicationInfo?.applicantName,
        sub.event?.eventName
      ].map(f => (f || "").toLowerCase());
      return searchable.some(f => f.includes(searchTerm));
    });
  }

  renderCards(filtered);
}

function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// ======================================================
// Render cards
// ======================================================
function renderCards(subs) {
  if (!subs.length) {
    submissionList.innerHTML = `
      <div class="no-data">
        <img src="../images/student_img/no-data.png" alt="No Data" style="width:120px;margin-bottom:1rem;">
        <p>No submissions found</p>
      </div>`;
    return;
  }

  submissionList.innerHTML = "";
  subs.forEach(s => {
    const org = s.orgInfo || {};
    const event = s.event || {};
    const app = s.applicationInfo || {};
    const card = document.createElement("div");
    card.className = "submission-card";

    const eventDate = event.eventDate
      ? new Date(event.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "-";

    card.innerHTML = `
      <div class="submission-details">
        <div class="submission-header">
          <div class="org-info">
            <h3>${org.name || "Unnamed Org"}</h3>
            <span class="academic-info">${s.academicYear || "-"} | ${s.semester || "-"}</span>
          </div>
        </div>
        <div class="event-details">
          <h4>${event.eventName || "Untitled Event"}</h4>
          <div class="event-description">${(event.eventDescription || "").slice(0, 180)}${(event.eventDescription || "").length>180? '...':''}</div>
          <div class="event-meta">
            <span class="icon-calendar">${eventDate}</span>
            <span class="icon-location">${event.eventVenue || "-"}</span>
            <span class="icon-user">${app.applicantName || "-"}</span>
          </div>
          <div class="meta-badges">
            ${event.eventType ? `<span class="badge">${event.eventType}</span>` : ''}
            ${event.attendance ? `<span class="badge">Attendance: ${event.attendance}</span>`: ''}
            ${(event.supportingDocuments || []).length ? `<span class="badge docs-badge"><strong>${event.supportingDocuments.length}</strong> file${event.supportingDocuments.length !== 1 ? 's' : ''}</span>` : ''}
          </div>
        </div>
        <div class="submission-footer">
          <button class="view-btn" data-id="${s._id}"><span class="icon-eye">View Details</span></button>
        </div>
      </div>
    `;
    submissionList.appendChild(card);
  });
}

// ======================================================
// Modal handling
// ======================================================
submissionList.addEventListener("click", e => {
  const viewBtn = e.target.closest(".view-btn");
  if (!viewBtn) return;
  const id = viewBtn.dataset.id;
  const sub = allSubmissions.find(s => s._id === id);
  if (sub) fillModal(sub);
});

function fillModal(sub) {
  const org = sub.orgInfo || {};
  const app = sub.applicationInfo || {};
  const event = sub.event || {};
  currentEditingId = sub._id;

  const eventDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "";

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>
          <img src="../images/student_img/history/book.png" alt="Books Icon" width="24" height="24" class="icon">
          ${org.name || "Unknown Organization"}
          <span class="org-acronym">${org.acronym ? `(${org.acronym})` : ""}</span>
        </h2>

        <button class="modal-close" id="modalClose" aria-label="Close">
          <span class="icon-close" aria-hidden="true"></span>
        </button>

        <div class="modal-subheader">
          <img src="../images/student_img/history/calendar_blank.png" alt="Calendar Icon" width="16" height="16" class="icon">
          ${sub.academicYear || "-"} | ${sub.semester || "-"}
        </div>
      </div>

      <div class="modal-body">
        <form id="editEventForm">

          <div class="modal-section info-grid">
            <div>
              <h3>Organization Info</h3>
              <div class="detail-line"><strong>Name:</strong> ${org.name || '-'}</div>
              <div class="detail-line"><strong>Acronym:</strong> ${org.acronym || '-'}</div>
              <div class="detail-line"><strong>Org Email:</strong> ${org.email || '-'}</div>
            </div>

            <div>
              <h3>Applicant</h3>
              <div class="detail-line"><strong>Name:</strong> ${app.applicantName || '-'}</div>
              <div class="detail-line"><strong>Email:</strong> ${app.email || '-'}</div>
              <div class="detail-line"><strong>Position:</strong> ${app.position || '-'}</div>
            </div>
          </div>

          <div class="modal-section">
            <h3>Event Details</h3>

            <div class="detail-group">
              <label class="detail-label">Event Name</label>
              <input type="text" class="detail-input" name="eventName" value="${event.eventName || ""}" readonly required>
            </div>

            <div class="detail-group">
              <label class="detail-label">Description</label>
              <textarea class="detail-input detail-textarea" name="eventDescription" readonly required>${event.eventDescription || ""}</textarea>
            </div>

            <div class="info-grid">
              <div class="detail-group">
                <label class="detail-label">Date</label>
                <input type="date" class="detail-input" name="eventDate" value="${event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : ""}" readonly required>
              </div>
              <div class="detail-group">
                <label class="detail-label">Venue</label>
                <input type="text" class="detail-input" name="eventVenue" value="${event.eventVenue || ""}" readonly required>
              </div>
            </div>
            <div class="time-row">
              <div class="detail-group time-group">
                <label class="detail-label">Start Time</label>
                <input type="text" class="detail-input" value="${event.startTime || '-'}" readonly>
              </div>
              <div class="detail-group time-group">
                <label class="detail-label">End Time</label>
                <input type="text" class="detail-input" value="${event.endTime || '-'}" readonly>
              </div>
            </div>

            <div class="detail-group">
              <label class="detail-label">Event Type</label>
              <input type="text" class="detail-input" value="${event.eventType || '-'}" readonly>
            </div>

            <div class="detail-group">
              <label class="detail-label">Attendance</label>
              <input type="text" class="detail-input" value="${event.attendance || '-'}" readonly>
            </div>

            <div class="detail-group">
              <label class="detail-label">Event Proof</label>
              ${event.eventProof ? `<a href="${event.eventProof}" target="_blank" class="event-proof-link">Open proof / evidence</a>` : '<div class="no-docs">No event proof link</div>'}
            </div>

            <div class="detail-group">
              <label class="detail-label">SDG Alignment</label>
              <div class="sdg-tags">${(event.eventSDG || []).length ? (event.eventSDG || []).map(sdg => `<span class="sdg-tag">${sdg}</span>`).join('') : '<span class="no-docs">None specified</span>'}</div>
            </div>

            <div class="detail-group">
              <label class="detail-label">Supporting Documents</label>
              <div class="document-links">
                ${(event.supportingDocuments || []).length
                  ? event.supportingDocuments.map((doc, idx) => `
                      <div class="doc-item">
                        <button type="button" class="doc-preview-btn" onclick="toggleDocumentPreview(${idx})" title="View file">${doc.split('/').pop()}</button>
                        <div class="doc-preview-container" id="doc-preview-${idx}" style="display:none;">
                          <div class="doc-preview-content">
                            ${getDocumentPreviewHTML(doc)}
                            <button type="button" class="doc-close-btn" onclick="toggleDocumentPreview(${idx})">✕</button>
                          </div>
                        </div>
                      </div>
                    `).join("")
                  : '<span class="no-docs">No supporting documents</span>'}
              </div>
            </div>
          </div>

          <div class="modal-section">
            <h3>Revision / Notes</h3>
            <div class="detail-line">${sub.revisionComment || '<span class="no-docs">No revision comments</span>'}</div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="modalCancel">
              <img src="../images/student_img/history/close_modal.png" alt="Close Icon" width="16" height="16" class="icon">
              Close
            </button>
            <button type="button" class="btn btn-primary" id="modalEditBtn">
              <img src="../images/student_img/history/edit.png" alt="Edit Icon" width="16" height="16" class="icon">
              Edit Submission
            </button>
            <button type="submit" class="btn btn-primary save-btn" id="modalSaveBtn" style="display:none;">
              <img src="../images/student_img/history/save.png" alt="Save Icon" width="16" height="16" class="icon">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  modal.style.display = "flex";
  document.getElementById("modalClose").addEventListener("click", () => {
    modal.style.display = "none";
    stopRevisionPolling();
  });
  setupEditToggle();
  
  // Start polling for revision comment updates (real-time)
  startRevisionPolling(sub._id);
}

window.addEventListener("click", e => {
  if (e.target === modal) {
    modal.style.display = "none";
    stopRevisionPolling();
  }
});

// Toggle edit mode
const setupEditToggle = () => {
  const editBtn = document.getElementById('modalEditBtn');
  const saveBtn = document.getElementById('modalSaveBtn');
  const modalContent = document.querySelector('.modal-content');
  const form = document.getElementById('editEventForm');
  
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      isEditMode = true;
      const inputs = modal.querySelectorAll('.detail-input');
      
      inputs.forEach(input => {
        input.readOnly = false;
        input.classList.add('editing');
      });
      
      // Toggle button visibility
      editBtn.style.display = 'none';
      saveBtn.style.display = 'inline-flex';
      
      // Scroll to top of modal
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    });
  }
  
  if (saveBtn && form) {
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Get form data
      const eventName = form.querySelector('[name="eventName"]').value;
      const eventDescription = form.querySelector('[name="eventDescription"]').value;
      const eventDate = form.querySelector('[name="eventDate"]').value;
      const eventVenue = form.querySelector('[name="eventVenue"]').value;
      
      // Validate inputs
      if (!eventName.trim() || !eventDescription.trim() || !eventDate || !eventVenue.trim()) {
        alert('Please fill in all fields');
        return;
      }
      
      try {
        // Send update to backend
        fetch('../../php-server/routes/submissions.php?id=' + currentEditingId, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            event: {
              eventName: eventName,
              eventDescription: eventDescription,
              eventDate: eventDate,
              eventVenue: eventVenue
            }
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Update the submission in memory
            const submissionIndex = allSubmissions.findIndex(s => s._id === currentEditingId);
            if (submissionIndex >= 0) {
              allSubmissions[submissionIndex].event = {
                ...allSubmissions[submissionIndex].event,
                eventName: eventName,
                eventDescription: eventDescription,
                eventDate: eventDate,
                eventVenue: eventVenue
              };
            }

            // Refresh the cards display
            renderCards(allSubmissions);
            
            // Show success message
            const successMsg = document.createElement('div');
            successMsg.className = 'success-message';
            successMsg.innerHTML = '<span>✓</span> Edited successfully!';
            document.body.appendChild(successMsg);
            
            // Auto-remove message and close modal
            setTimeout(() => {
              successMsg.classList.add('fade-out');
              setTimeout(() => {
                successMsg.remove();
                modal.style.display = "none";
                isEditMode = false;
                
                // Reset all inputs to readonly
                const inputs = modal.querySelectorAll('.detail-input');
                inputs.forEach(input => {
                  input.readOnly = true;
                  input.classList.remove('editing');
                });
                
                // Reset button visibility
                editBtn.style.display = 'inline-flex';
                saveBtn.style.display = 'none';
              }, 300);
            }, 1500);
          } else {
            alert('Error: ' + (data.error || 'Failed to save changes'));
          }
        })
        .catch(error => {
          alert('Error saving changes: ' + error.message);
        });
        
      } catch (error) {
        alert('Error saving changes: ' + error.message);
      }
    });
  }
};

// Handle cancel button
modal.addEventListener("click", (e) => {
  if (e.target.id === "modalCancel") {
    modal.style.display = "none";
    stopRevisionPolling();
  }
});

// ======================================================
// File Preview Functions
// ======================================================
window.toggleDocumentPreview = function(idx) {
  const container = document.getElementById(`doc-preview-${idx}`);
  if (container) {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  }
};

window.getDocumentPreviewHTML = function(docPath) {
  const fileName = docPath.split('/').pop();
  const fileExt = fileName.split('.').pop().toLowerCase();
  const viewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
  
  // Convert /uploads/... to relative path from public folder
  let accessPath = docPath;
  if (docPath.startsWith('/uploads/')) {
    accessPath = '../../uploads' + docPath.substring(8); // Remove '/uploads' and add relative path
  }
  
  if (viewableTypes.includes(fileExt)) {
    if (fileExt === 'pdf') {
      return `<embed src="${accessPath}" type="application/pdf" class="doc-embed" />`;
    } else {
      return `<img src="${accessPath}" alt="${fileName}" class="doc-embed-image" />`;
    }
  } else if (['zip', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'ppt', 'pptx'].includes(fileExt)) {
    return `<div class="doc-not-viewable"><p>This file type cannot be previewed.</p><a href="${accessPath}" download="${fileName}" class="download-link">Download ${fileName}</a></div>`;
  } else {
    return `<div class="doc-not-viewable"><p>Preview not available for this file type.</p><a href="${accessPath}" download="${fileName}" class="download-link">Download ${fileName}</a></div>`;
  }
};
// ======================================================
// Real-time Revision Comment Polling
// ======================================================
function startRevisionPolling(submissionId) {
  // Clear any existing polling
  stopRevisionPolling();
  
  // Poll every 3 seconds for new revision comments
  revisionRefreshInterval = setInterval(async () => {
    try {
      const response = await fetch(`${API_URL}?id=${submissionId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const submission = result.data;
        
        // Check if revision comment section exists and update it
        // Find all modal-section elements and look for the one with "Revision / Notes" heading
        const allSections = document.querySelectorAll('.modal-content .modal-section');
        let revisionSection = null;
        
        for (let section of allSections) {
          const heading = section.querySelector('h3');
          if (heading && heading.textContent.includes('Revision')) {
            revisionSection = section;
            break;
          }
        }
        
        if (revisionSection) {
          // Find the detail-line in this section
          const revisionLine = revisionSection.querySelector('.detail-line');
          if (revisionLine) {
            const newComment = submission.revisionComment || '<span class="no-docs">No revision comments</span>';
            
            // Only update if content has changed
            if (revisionLine.innerHTML !== newComment) {
              revisionLine.innerHTML = newComment;
              
              // Add a subtle highlight animation to indicate update
              revisionSection.style.backgroundColor = '#fffacd';
              setTimeout(() => {
                revisionSection.style.backgroundColor = 'transparent';
                revisionSection.style.transition = 'background-color 0.5s ease';
              }, 100);
            }
          }
        }
        
        // Also update the submission in memory
        const submissionIndex = allSubmissions.findIndex(s => s._id === submissionId);
        if (submissionIndex >= 0) {
          allSubmissions[submissionIndex].revisionComment = submission.revisionComment;
        }
      }
    } catch (error) {
      console.error('Error polling revision updates:', error);
    }
  }, 3000);
}

function stopRevisionPolling() {
  if (revisionRefreshInterval) {
    clearInterval(revisionRefreshInterval);
    revisionRefreshInterval = null;
  }
}

// Stop polling when modal closes or window unloads
window.addEventListener("click", e => {
  if (e.target === modal) {
    modal.style.display = "none";
    stopRevisionPolling();
  }
});

window.addEventListener("beforeunload", stopRevisionPolling);