// ---------------------------
// Global submissions array
// ---------------------------
let submissions = [];

document.addEventListener('DOMContentLoaded', () => {
    const submissionList = document.getElementById('submissionList');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('searchInput');

    // ---------------------------
    // Load submissions from server
    // ---------------------------
    async function loadSubmissions() {
        try {
            const res = await fetch('http://localhost:3000/api/Submissions'); 
            if (!res.ok) throw new Error('Network response was not ok');
            submissions = await res.json(); // updates global array
            renderSubmissions(submissions);
        } catch (err) {
            console.error(err);
            submissionList.innerHTML = '<p style="text-align:center; opacity:0.7;">Unable to load submissions from server.</p>';
        }
    }

    // ---------------------------
    // Helper functions
    // ---------------------------
    function shortDate(d) {
        const dt = new Date(d);
        return isNaN(dt) ? '' : dt.toLocaleDateString();
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s]);
    }

    function groupBySemester(submissions) {
        const grouped = {};
        submissions.forEach(sub => {
            const year = sub.academicYear || 'Unknown Year';
            const sem = sub.semester || 'Unknown Semester';
            const key = `${year} - ${sem}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(sub);
        });
        return grouped;
    }

    // ---------------------------
    // Render submissions
    // ---------------------------
    function renderSubmissions(list) {
        submissionList.innerHTML = '';
        if (!list || list.length === 0) {
            submissionList.innerHTML = '<p style="text-align:center; opacity:0.7;">No submissions found.</p>';
            return;
        }

        const grouped = groupBySemester(list);

        Object.keys(grouped).forEach(group => {
            submissionList.innerHTML += `
                <div class="semester-group">
                    <h2 class="semester-title">${escapeHtml(group)}</h2>
                    <div class="semester-submissions" id="group-${group.replace(/\s+/g,'')}"></div>
                </div>
            `;

            const groupContainer = document.getElementById(`group-${group.replace(/\s+/g,'')}`);
            grouped[group].forEach(item => {
                const id = item._id;
                const status = item.status || 'PENDING';
                const submittedOn = shortDate(item.submittedAt) || '';
                const orgName = item.organizationInfo?.org_name || 'Untitled Org';
                const applicant = item.applicantInfo?.applicant_name || '';
                const school = item.organizationInfo?.org_category || '';
                const academicYear = item.academicYear || 'Unknown';
                const semester = item.semester || 'Unknown';

                const st = status.toLowerCase();
                const editDisabled = st === 'accepted';
                const editBtn = editDisabled
                    ? '<button class="btn-disabled" disabled>Edit</button>'
                    : `<button class="btn-edit" onclick="editSubmission('${id}')">Edit</button>`;

                const eventList = item.events?.map(e => `<li>${escapeHtml(e.eventName)} 
                    <button class="btn-small" onclick="viewActivity('${id}','${e._id}')">View/Edit</button>
                </li>`).join('') || '<li>No activities submitted</li>';

                groupContainer.innerHTML += `
                    <div class="submission-card" data-status="${status}">
                        <div class="submission-details">
                            <div class="submission-header">
                                <span class="submitted-on">${submittedOn}</span>
                                <span class="status-badge status-${st}">${status}</span>
                            </div>
                            <div class="details-body">
                                <h3>${escapeHtml(orgName)}</h3>
                                <p class="sd-small">
                                    ${escapeHtml(applicant)}${school ? ' • ' + escapeHtml(school) : ''}<br>
                                    <strong>Academic Year:</strong> ${escapeHtml(academicYear)} • 
                                    <strong>Semester:</strong> ${escapeHtml(semester)}
                                </p>
                                <ul class="events-list">${eventList}</ul>
                            </div>
                            <div class="manage-dropdown">
                                ${editBtn}
                                <button class="btn-view" onclick="viewDetails('${id}')">View Submission</button>
                            </div>
                        </div>
                    </div>
                `;
            });
        });
    }

    // ---------------------------
    // Filter buttons
    // ---------------------------
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const status = btn.dataset.status;
            if (status === 'all') renderSubmissions(submissions);
            else renderSubmissions(submissions.filter(s => (s.status || '').toLowerCase() === status));
        });
    });

    // ---------------------------
    // Search input
    // ---------------------------
    searchInput.addEventListener('input', () => {
        const term = searchInput.value.trim().toLowerCase();
        if (!term) return renderSubmissions(submissions);
        renderSubmissions(submissions.filter(s =>
            (s.organizationInfo?.org_name || '').toLowerCase().includes(term) ||
            (s.applicantInfo?.applicant_name || '').toLowerCase().includes(term) ||
            (s.events?.some(e => e.eventName.toLowerCase().includes(term)))
        ));
    });

    // ---------------------------
    // Submission modal helpers
    // ---------------------------
    function openSubmissionModal(mode, item) {
        const modal = document.getElementById('submissionModal');
        const titleEl = document.getElementById('modalTitle');

        const fields = {
            fCompleteName: document.getElementById('modalCompleteName'),
            fAcronym: document.getElementById('modalAcronym'),
            fOfficialEmail: document.getElementById('modalOfficialEmail'),
            fApplicantName: document.getElementById('modalApplicantName'),
            fAdviserNames: document.getElementById('modalAdviserNames'),
            fSchool: document.getElementById('modalSchool'),
            fCategory: document.getElementById('modalCategory'),
            fOrganizationType: document.getElementById('modalOrganizationType'),
            fApplicantPosition: document.getElementById('modalApplicantPosition'),
            fApplicantEmail: document.getElementById('modalApplicantEmail'),
            fVideoLink: document.getElementById('modalVideoLink'),
            fStatus: document.getElementById('modalStatus'),
            fRemarks: document.getElementById('modalRemarks'),
            fCreatedAt: document.getElementById('modalCreatedAt'),
        };

        fields.fCompleteName.value = item.organizationInfo?.org_name || '';
        fields.fAcronym.value = item.organizationInfo?.org_acronym || '';
        fields.fOfficialEmail.value = item.organizationInfo?.org_email || '';
        fields.fApplicantName.value = item.applicantInfo?.applicant_name || '';
        fields.fAdviserNames.value = (item.adviserInfo?.adviser_name || []).join(', ');
        fields.fSchool.value = item.organizationInfo?.org_category || '';
        fields.fCategory.value = item.organizationInfo?.org_type || '';
        fields.fOrganizationType.value = item.organizationInfo?.org_type || '';
        fields.fApplicantPosition.value = item.applicantInfo?.applicant_position || '';
        fields.fApplicantEmail.value = item.applicantInfo?.applicant_email || '';
        fields.fVideoLink.value = item.documentUploads?.video_link || '';
        fields.fStatus.value = item.status || 'PENDING';
        fields.fRemarks.value = item.remarks || '';
        fields.fCreatedAt.value = shortDate(item.submittedAt) || '';

        const saveBtn = document.getElementById('modalSave');
        saveBtn.onclick = null;

        if (mode === 'view') {
            titleEl.textContent = 'View Submission';
            Object.values(fields).forEach(f => f.setAttribute('disabled', 'true'));
            saveBtn.style.display = 'none';
        } else {
            titleEl.textContent = 'Edit Submission';
            Object.values(fields).forEach(f => f.removeAttribute('disabled'));
            saveBtn.style.display = 'inline-block';
            saveBtn.onclick = () => {
                alert('Changes saved (mock)');
                closeSubmissionModal();
            };
        }

        modal.setAttribute('aria-hidden', 'false');
        modal.classList.add('open');
        document.getElementById('modalClose').onclick = closeSubmissionModal;
        document.getElementById('modalCloseBtn').onclick = closeSubmissionModal;
    }

    function closeSubmissionModal() {
        const modal = document.getElementById('submissionModal');
        modal.setAttribute('aria-hidden','true');
        modal.classList.remove('open');
    }

    function editSubmission(id) {
        const data = submissions.find(s => s._id === id);
        if (!data) return alert('Not found');
        if ((data.status || '').toLowerCase() === 'accepted') return alert('Approved submissions cannot be edited.');
        openSubmissionModal('edit', data);
    }

    function viewDetails(id) {
        const data = submissions.find(s => s._id === id);
        if (!data) return alert('Not found');
        openSubmissionModal('view', data);
    }

    window.editSubmission = editSubmission;
    window.viewDetails = viewDetails;

    // Load data initially
    loadSubmissions();
});

// ---------------------------
// Activity modal
// ---------------------------
function openActivityModal(mode, submissionId, activityId) {
    const modal = document.getElementById('activityModal');
    const titleEl = document.getElementById('activityModalTitle');

    // Find submission and activity
    const submission = submissions.find(s => s._id === submissionId);
    if (!submission) return alert('Submission not found');
    const activity = submission.events?.find(e => e._id === activityId);
    if (!activity) return alert('Activity not found');

    const fields = {
        name: document.getElementById('activityName'),
        description: document.getElementById('activityDescription'),
        type: document.getElementById('activityType'),
        date: document.getElementById('activityDate'),
        startTime: document.getElementById('activityStartTime'),
        startPeriod: document.getElementById('activityStartPeriod'),
        endTime: document.getElementById('activityEndTime'),
        endPeriod: document.getElementById('activityEndPeriod'),
        venue: document.getElementById('activityVenue'),
        attendees: document.getElementById('activityAttendees'),
        proof: document.getElementById('activityProof'),
        sdg: document.getElementById('activitySDG'),
    };

   fields.name.value = activity.eventName || '';
fields.description.value = ''; // if you have no separate description, leave blank or use eventType
fields.type.value = activity.eventType || '';
fields.date.value = activity.eventDate || '';

// Split startTime like "1:00 PM" into time and period
if (activity.startTime) {
    const parts = activity.startTime.split(' ');
    fields.startTime.value = parts[0] || '';
    fields.startPeriod.value = parts[1] || 'AM';
} else {
    fields.startTime.value = '';
    fields.startPeriod.value = 'AM';
}

// Split endTime like "3:00 PM"
if (activity.endTime) {
    const parts = activity.endTime.split(' ');
    fields.endTime.value = parts[0] || '';
    fields.endPeriod.value = parts[1] || 'PM';
} else {
    fields.endTime.value = '';
    fields.endPeriod.value = 'AM';
}

// Venue
fields.venue.value = activity.eventVenue || '';

// Attendees: handle MongoDB $numberInt wrapper
if (activity.eventAttendees) {
    if (typeof activity.eventAttendees === 'object' && activity.eventAttendees.$numberInt) {
        fields.attendees.value = activity.eventAttendees.$numberInt;
    } else {
        fields.attendees.value = activity.eventAttendees;
    }
} else fields.attendees.value = '';

// Proof
fields.proof.value = activity.eventProof || '';

// SDGs: join array into comma-separated string
fields.sdg.value = Array.isArray(activity.eventSDG) ? activity.eventSDG.join(', ') : '';


    const saveBtn = document.getElementById('activitySave');
    saveBtn.onclick = null;

    if (mode === 'view') {
        titleEl.textContent = 'View Activity';
        Object.values(fields).forEach(f => f.setAttribute('disabled', 'true'));
        saveBtn.style.display = 'none';
    } else {
        titleEl.textContent = 'Edit Activity';
        Object.values(fields).forEach(f => f.removeAttribute('disabled'));
        saveBtn.style.display = 'inline-block';
        saveBtn.onclick = () => {
            activity.eventName = fields.name.value;
            activity.description = fields.description.value;
            alert('Activity updated (mock)');
            closeActivityModal();
        };
    }

    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('open');
    document.getElementById('activityClose').onclick = closeActivityModal;
    document.getElementById('activityCloseBtn').onclick = closeActivityModal;
}

function closeActivityModal() {
    const modal = document.getElementById('activityModal');
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('open');
}

// Expose globally for onclick
window.viewActivity = function(submissionId, activityId) {
    openActivityModal('view', submissionId, activityId);
};
