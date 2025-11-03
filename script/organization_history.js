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
            // Normalized submission id string
            const submissionIdStr = normalizeId(item._id);

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
                : `<button class="btn-edit" onclick="editSubmission('${submissionIdStr}')">Edit</button>`;

            // Build event list HTML, use either e.id or e._id (normalized)
            const eventList = (item.events || []).map(e => {
                const eventIdRaw = e.id ?? e._id ?? '';
                const eventId = normalizeId(eventIdRaw); // ensure string
                return `<li>${escapeHtml(e.eventName || 'Untitled Event')} 
                    <button class="btn-small" onclick="viewActivity('${submissionIdStr}','${escapeHtml(eventId)}')">View/Edit</button>
                </li>`;
            }).join('') || '<li>No activities submitted</li>';

            groupContainer.innerHTML += `
                <div class="submission-card" data-status="${escapeHtml(status)}">
                    <div class="submission-details">
                        <div class="submission-header">
                            <span class="submitted-on">${submittedOn}</span>
                            <span class="status-badge status-${st}">${escapeHtml(status)}</span>
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
                            <button class="btn-view" onclick="viewDetails('${submissionIdStr}')">View Submission</button>
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

// normalize any id-like value to a string for safe comparisons
function normalizeId(id) {
    if (id === null || id === undefined) return '';
    // If it's an object like { $oid: "..." }
    if (typeof id === 'object') {
        if (id.$oid) return String(id.$oid);
        // if driver returned ObjectId-like with toString
        if (typeof id.toString === 'function') return id.toString();
        return JSON.stringify(id);
    }
    return String(id);
}


// ---------------------------
// Activity modal
// ---------------------------
function openActivityModal(mode, submissionId, activityId) {
    const modal = document.getElementById('activityModal');
    const titleEl = document.getElementById('activityModalTitle');

    // DEBUG: show incoming values
    console.log('openActivityModal called with:', { submissionId, activityId });

    // Find submission by normalized ID
    const submission = submissions.find(s => normalizeId(s._id) === normalizeId(submissionId));
    if (!submission) {
        console.warn('Submission not found for id:', submissionId);
        return alert('Submission not found');
    }

    // Find activity: check either e.id or e._id (normalize both sides)
    const activity = (submission.events || []).find(e => {
        const evId = e.id ?? e._id ?? '';
        return normalizeId(evId) === normalizeId(activityId);
    });

    if (!activity) {
        console.warn('Activity not found. submission.events:', submission.events, 'searchedId:', activityId);
        return alert('Activity not found');
    }

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
    fields.description.value = activity.description || '';
    fields.type.value = activity.eventType || '';
    // If your eventDate is stored as a string e.g. "2025-11-15", assign it; if it's Date object, convert to yyyy-mm-dd
    fields.date.value = activity.eventDate ? (new Date(activity.eventDate)).toISOString().slice(0,10) : '';

    // start / end time split (support both "1:00 PM" string or already-split)
    if (activity.startTime) {
        const parts = String(activity.startTime).split(' ');
        fields.startTime.value = parts[0] || '';
        fields.startPeriod.value = parts[1] || 'AM';
    } else {
        fields.startTime.value = '';
        fields.startPeriod.value = 'AM';
    }

    if (activity.endTime) {
        const parts = String(activity.endTime).split(' ');
        fields.endTime.value = parts[0] || '';
        fields.endPeriod.value = parts[1] || 'PM';
    } else {
        fields.endTime.value = '';
        fields.endPeriod.value = 'AM';
    }

    fields.venue.value = activity.eventVenue || '';

    // attendees: handle nested $numberInt object or plain number/string
    if (activity.eventAttendees) {
        if (typeof activity.eventAttendees === 'object' && activity.eventAttendees.$numberInt) {
            fields.attendees.value = activity.eventAttendees.$numberInt;
        } else {
            fields.attendees.value = activity.eventAttendees;
        }
    } else fields.attendees.value = '';

    fields.proof.value = activity.eventProof || '';

    // SDGs: join array into comma-separated string
    if (Array.isArray(activity.eventSDG)) fields.sdg.value = activity.eventSDG.join(', ');
    else fields.sdg.value = activity.eventSDG || '';

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
            // basic mock update in memory
            activity.eventName = fields.name.value;
            activity.description = fields.description.value;
            activity.eventType = fields.type.value;
            activity.eventDate = fields.date.value;
            activity.startTime = fields.startTime.value + ' ' + fields.startPeriod.value;
            activity.endTime = fields.endTime.value + ' ' + fields.endPeriod.value;
            activity.eventVenue = fields.venue.value;
            activity.eventAttendees = Number(fields.attendees.value) || fields.attendees.value;
            activity.eventProof = fields.proof.value;
            // note: eventSDG editing not implemented here
            alert('Activity updated (mock) — in-memory only');
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
