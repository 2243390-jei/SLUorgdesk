document.addEventListener('DOMContentLoaded', () => {
  let submissions = [];

  const submissionList = document.getElementById('submissionList');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const searchInput = document.getElementById('searchInput');
  const timeFilter = document.getElementById('timeFilter');

  async function loadForms() {
    try {
      const res = await fetch('http://localhost:3000/api/forms');
      if (!res.ok) throw new Error('Network response was not ok');
      submissions = await res.json();
      renderSubmissions(submissions);
    } catch (err) {
      console.error(err);
      submissionList.innerHTML = '<p style="text-align:center; opacity:0.7;">Unable to load forms from server.</p>';
    }
  }

  function shortDate(d) {
    try {
      const dt = new Date(d);
      return isNaN(dt) ? '' : dt.toLocaleDateString();
    } catch (e) { return ''; }
  }

  function renderSubmissions(list) {
    submissionList.innerHTML = '';
    if (!list || list.length === 0) {
      submissionList.innerHTML = '<p style="text-align:center; opacity:0.7;">No submissions found.</p>';
      return;
    }

    list.forEach(item => {
      const id = item._id || item.id;
      const status = item.status || 'pending';
      const submittedOn = shortDate(item.createdAt) || '';
      const title = item.completeName || item.organizationName || 'Untitled';
      const applicant = item.applicantName || '';
      const school = item.school || '';

      const st = (status || '').toLowerCase();
      const editDisabled = st === 'accepted' || st === 'approved';
      const editBtn = editDisabled
        ? '<button class="btn-disabled" disabled>Edit</button>'
        : `<button class="btn-edit" onclick="editSubmission('${id}')">Edit</button>`;

      submissionList.innerHTML += `
        <div class="submission-card" data-status="${status}">
          <div class="submission-details">
            <div class="submission-header">
              <span class="submitted-on">${submittedOn}</span>
              <span class="status-badge status-${status}">${status}</span>
            </div>

            <div class="details-body">
              <h3 class="event-name">${escapeHtml(title)}</h3>
              <p class="sd-small">${escapeHtml(applicant)}${school ? ' • ' + escapeHtml(school) : ''}</p>
            </div>

            <div class="manage-dropdown">
              ${editBtn}
              <button class="btn-view" onclick="viewDetails('${id}')">View</button>
            </div>
          </div>
        </div>
      `;
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s]);
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const status = btn.dataset.status;
      if (status === 'all') renderSubmissions(submissions);
      else renderSubmissions(submissions.filter(s => (s.status || '').toLowerCase() === status));
    });
  });

  searchInput.addEventListener('input', () => {
    const term = searchInput.value.trim().toLowerCase();
    if (!term) return renderSubmissions(submissions);
    renderSubmissions(submissions.filter(s => (s.completeName || '').toLowerCase().includes(term) || (s.applicantName || '').toLowerCase().includes(term)));
  });

  timeFilter.addEventListener('change', () => {
    renderSubmissions(submissions);
  });

  function openSubmissionModal(mode, item) {
    const modal = document.getElementById('submissionModal');
    const titleEl = document.getElementById('modalTitle');

    const fCompleteName = document.getElementById('modalCompleteName');
    const fAcronym = document.getElementById('modalAcronym');
    const fOfficialEmail = document.getElementById('modalOfficialEmail');
    const fApplicantName = document.getElementById('modalApplicantName');
    const fAdviserNames = document.getElementById('modalAdviserNames');
    const fSchool = document.getElementById('modalSchool');
    const fCategory = document.getElementById('modalCategory');
    const fOrganizationType = document.getElementById('modalOrganizationType');
    const fApplicantPosition = document.getElementById('modalApplicantPosition');
    const fApplicantEmail = document.getElementById('modalApplicantEmail');
    const fVideoLink = document.getElementById('modalVideoLink');
    const fStatus = document.getElementById('modalStatus');
    const fRemarks = document.getElementById('modalRemarks');
    const fCreatedAt = document.getElementById('modalCreatedAt');

    fCompleteName.value = item.completeName || '';
    fAcronym.value = item.acronym || '';
    fOfficialEmail.value = item.officialEmail || '';
    fApplicantName.value = item.applicantName || '';
    fAdviserNames.value = (item.adviserNames || []).join(', ');
    fSchool.value = item.school || '';
    fCategory.value = item.category || '';
    fOrganizationType.value = item.organizationType || '';
    fApplicantPosition.value = item.applicantPosition || '';
    fApplicantEmail.value = item.applicantEmail || '';
    fVideoLink.value = item.videoLink || '';
    fStatus.value = item.status || 'pending';
    fRemarks.value = item.remarks || '';
    fCreatedAt.value = shortDate(item.createdAt) || '';

    if (mode === 'view') {
      titleEl.textContent = 'View Form';
      [fCompleteName,fAcronym,fOfficialEmail,fApplicantName,fAdviserNames,fSchool,fCategory,fOrganizationType,fApplicantPosition,fApplicantEmail,fVideoLink,fStatus,fRemarks].forEach(i => i.setAttribute('disabled','true'));
      document.getElementById('modalSave').style.display = 'none';
    } else {
      titleEl.textContent = 'Edit Form';
      [fCompleteName,fAcronym,fOfficialEmail,fApplicantName,fAdviserNames,fSchool,fCategory,fOrganizationType,fApplicantPosition,fApplicantEmail,fVideoLink,fStatus,fRemarks].forEach(i => i.removeAttribute('disabled'));
      document.getElementById('modalSave').style.display = 'inline-block';
    }

    modal.setAttribute('aria-hidden','false');
    modal.classList.add('open');

    document.getElementById('modalClose').onclick = closeSubmissionModal;
    document.getElementById('modalCloseBtn').onclick = closeSubmissionModal;

    const saveBtn = document.getElementById('modalSave');
    saveBtn.onclick = async function () {
      const updated = {
        completeName: fCompleteName.value,
        acronym: fAcronym.value,
        officialEmail: fOfficialEmail.value,
        applicantName: fApplicantName.value,
        adviserNames: fAdviserNames.value.split(',').map(s => s.trim()).filter(Boolean),
        school: fSchool.value,
        category: fCategory.value,
        organizationType: fOrganizationType.value,
        applicantPosition: fApplicantPosition.value,
        applicantEmail: fApplicantEmail.value,
        videoLink: fVideoLink.value,
        status: fStatus.value,
        remarks: fRemarks.value
      };

      const id = item._id || item.id;
      try {
        const res = await fetch(`http://localhost:3000/api/forms/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
        if (res.ok) {
          const saved = await res.json();
          const idx = submissions.findIndex(s => (s._id || s.id) === id);
          if (idx !== -1) submissions[idx] = saved;
          renderSubmissions(submissions);
        } else {
          const idx = submissions.findIndex(s => (s._id || s.id) === id);
          if (idx !== -1) Object.assign(submissions[idx], updated);
          renderSubmissions(submissions);
          alert('Saved locally; server did not accept update.');
        }
      } catch (err) {
        const idx = submissions.findIndex(s => (s._id || s.id) === id);
        if (idx !== -1) Object.assign(submissions[idx], updated);
        renderSubmissions(submissions);
        alert('Saved locally; could not reach server.');
      }

      closeSubmissionModal();
    };
  }

  function closeSubmissionModal() {
    const modal = document.getElementById('submissionModal');
    modal.setAttribute('aria-hidden','true');
    modal.classList.remove('open');
  }

  function editSubmission(id) {
    const data = submissions.find(s => (s._id || s.id) === id);
  if (!data) return alert('Not found');
  const st = (data.status || '').toLowerCase();
  if (st === 'accepted' || st === 'approved') return alert('Approved/accepted forms cannot be edited.');
    openSubmissionModal('edit', data);
  }

  function viewDetails(id) {
    const data = submissions.find(s => (s._id || s.id) === id);
    if (!data) return alert('Not found');
    openSubmissionModal('view', data);
  }

  window.editSubmission = editSubmission;
  window.viewDetails = viewDetails;

  loadForms();
});

