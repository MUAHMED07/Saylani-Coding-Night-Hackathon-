// Read saved data from localStorage
function getRecords(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

// Load dashboard information
function loadDashboard() {
    // Read company and administrator information
    let company = {};

    try {
        company = JSON.parse(
            localStorage.getItem("hcmCompanyData") || "{}"
        );
    } catch (error) {
        company = {};
    }

    // Display company name
    const companyName =
        company.companyName ||
        company.name ||
        company.organizationName ||
        "Your Organization";

    document.getElementById("companyName").textContent = companyName;

    // Display administrator name
    const adminName =
        company.adminName ||
        company.fullName ||
        company.ownerName ||
        "Administrator";

    document.getElementById("adminName").textContent = adminName;

    const avatar = document.querySelector(".avatar");
    avatar.textContent = adminName.charAt(0).toUpperCase();

    // Read records from browser storage
    const employees = getRecords("hcmEmployees");
    const departments = getRecords("hcmDepartments");
    const attendance = getRecords("hcmLiteAttendanceRecords");
    const leaves = getRecords("hcmLeaves");

    // Count total employees
    document.getElementById("totalEmployees").textContent =
        employees.length;

    // Count total departments
    document.getElementById("totalDepartments").textContent =
        departments.length;

    // Get today's date in YYYY-MM-DD format
    const now = new Date();
    const today =
        now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0");

    // Count today's attendance records
    const todayRecords = attendance.filter(function (record) {
        return record.date === today;
    });

    document.getElementById("todayAttendance").textContent =
        todayRecords.length;

    // Count pending leave requests
    const pending = leaves.filter(function (leave) {
        return String(leave.status || "").toLowerCase() === "pending";
    });

    document.getElementById("pendingLeaves").textContent =
        pending.length;

    // Show saved recent activity, if available
    const activities = getRecords("hcmActivity");
    const activityList = document.getElementById("activityList");

    if (activities.length === 0) {
        activityList.className = "empty-state";

        activityList.innerHTML = `
            <div class="empty-icon">◷</div>
            <strong>No activity yet</strong>
            <p>Your activity will appear here when you start adding records.</p>
        `;
    } else {
        activityList.className = "activity-list";

        activityList.replaceChildren();

        activities.slice(-5).reverse().forEach(function (activity) {
            const item = document.createElement("div");
            item.className = "activity-item";

            const dot = document.createElement("span");
            dot.className = "activity-dot";

            const details = document.createElement("div");

            const title = document.createElement("strong");
            title.textContent = activity.title || activity.action || "Activity";

            const description = document.createElement("p");
            description.textContent =
                activity.description || activity.details || activity.date || "";

            details.append(title, description);
            item.append(dot, details);
            activityList.appendChild(item);
        });
    }
}

// Load data when the page opens
document.addEventListener("DOMContentLoaded", loadDashboard);