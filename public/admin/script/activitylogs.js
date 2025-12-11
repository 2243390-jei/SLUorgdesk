
document.addEventListener("DOMContentLoaded", () => {
    // -------------------------
    // DOM references
    // -------------------------
    const recentActivityList = document.getElementById("recentActivityList");

    // -------------------------
    // Recent Activity DOM
    // -------------------------
    function updateRecentActivity(requests = []) {
        if (!recentActivityList) return;
        recentActivityList.innerHTML = '';
        if (!requests || requests.length === 0) {
            recentActivityList.innerHTML = `<div class="no-activity">No recent activity</div>`;
            return;
        }
        requests.forEach(r => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            const avatar = document.createElement('div');
            avatar.className = 'activity-avatar';
            avatar.textContent = (r.fullName || r.email || 'U').slice(0, 1).toUpperCase();
            const content = document.createElement('div');
            content.className = 'activity-content';
            const name = document.createElement('div');
            name.className = 'activity-text';
            name.textContent = r.fullName || r.email || 'Unknown';
            const details = document.createElement('div');
            details.className = 'activity-details muted';
            details.textContent = `${r.status || 'Pending'} • ${new Date(r.createdAt).toLocaleString()}`;
            content.appendChild(name);
            content.appendChild(details);
            item.appendChild(avatar);
            item.appendChild(content);
            recentActivityList.appendChild(item);
        });
    }
});