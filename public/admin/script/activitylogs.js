
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
    }
});