
"use strict";

const KEYS = {
    attendance: "hcmLiteAttendanceRecords",
    leave: "hcmLeaves",
    payroll: "hcmLitePayrollRecords"
};
const $ = id => document.getElementById(id);

function read(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(value) ? value : [];
    } catch { return []; }
}

// Leave records (leaves.js) use different field names and store the
// employee's internal key, so convert them to the report columns.
function readLeaves() {
    const employees = read("hcmEmployees");

    return read(KEYS.leave).map(r => {
        const employee = employees.find(e =>
            String(e.id ?? e._key ?? e.employeeId ?? "") === String(r.employeeId)
        );
        const start = new Date(r.startDate + "T00:00:00");
        const end = new Date(r.endDate + "T00:00:00");
        const days = Math.round((end - start) / 86400000) + 1;

        return {
            employeeId: employee ? employee.employeeId : "",
            name: r.employeeName,
            type: r.leaveType,
            start: r.startDate,
            end: r.endDate,
            days: Number.isFinite(days) && days > 0 ? days : "",
            reason: r.reason,
            status: r.status
        };
    });
}

function records(type) {
    return type === "leave" ? readLeaves() : read(KEYS[type]);
}

function columns(type) {
    const schemas = {
        attendance: [
            ["Employee ID","employeeId"],["Employee Name","name"],
            ["Date","date"],["Status","status"],["Check-in","checkIn"],
            ["Check-out","checkOut"],["Notes","notes"]
        ],
        leave: [
            ["Employee ID","employeeId"],["Employee Name","name"],
            ["Leave Type","type"],["Start Date","start"],["End Date","end"],
            ["Days","days"],["Reason","reason"],["Status","status"]
        ],
        payroll: [
            ["Employee ID","employeeId"],["Employee Name","name"],
            ["Month","month"],["Basic Salary","basicSalary"],
            ["Allowances","allowances"],["Bonus","bonus"],
            ["Gross Salary","gross"],["Deductions","deductions"],
            ["Net Salary","net"],["Status","status"]
        ]
    };
    return schemas[type];
}

function csvCell(value) {
    return '"' + String(value ?? "").replace(/"/g, '""') + '"';
}

function download(type, records) {
    const cols = columns(type);
    const csv = [cols.map(c => c[0]), ...records.map(r => cols.map(c => r[c[1]] ?? ""))]
        .map(row => row.map(csvCell).join(",")).join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hcm-lite-${type}-report.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function filtered(type) {
    const start = $("reportStart").value;
    const end = $("reportEnd").value;
    const query = $("reportSearch").value.trim().toLowerCase();

    return records(type).filter(r => {
        const date = type === "attendance" ? r.date :
                     type === "leave" ? r.start :
                     type === "payroll" ? `${r.month}-01` : "";

        if (start && date && date < start) return false;
        if (end && date && date > end) return false;

        return !query || [r.employeeId,r.name]
            .some(v => String(v || "").toLowerCase().includes(query));
    });
}

function updateCounts() {
    $("reportAttendanceCount").textContent = read(KEYS.attendance).length;
    $("reportLeaveCount").textContent = read(KEYS.leave).length;
    $("reportPayrollCount").textContent = read(KEYS.payroll).length;
}

$("reportForm").addEventListener("submit", e => {
    e.preventDefault();

    const start = $("reportStart").value;
    const end = $("reportEnd").value;
    if (start && end && end < start) {
        alert("End date cannot be earlier than start date.");
        return;
    }

    const types = $("reportType").value === "all"
        ? Object.keys(KEYS) : [$("reportType").value];

    const summary = [];
    types.forEach(type => {
        const rows = filtered(type);
        download(type, rows);
        summary.push({type, count:rows.length});
    });

    $("previewRows").innerHTML = summary.map(item =>
        `<tr><td>${item.type.charAt(0).toUpperCase()+item.type.slice(1)}</td><td>${item.count}</td></tr>`
    ).join("");

    $("reportDescription").textContent = "CSV report generated successfully.";
    updateCounts();
});

$("reportRefresh").addEventListener("click", updateCounts);
$("reportForm").addEventListener("reset", () => {
    setTimeout(() => {
        $("reportDescription").textContent = "Generate a report to view record counts.";
    }, 0);
});

updateCounts();
