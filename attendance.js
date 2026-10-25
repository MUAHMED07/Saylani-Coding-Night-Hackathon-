
"use strict";

const KEY = "hcmLiteAttendanceRecords";
const $ = id => document.getElementById(id);
let records = load();

function load() {
    try {
        const data = JSON.parse(localStorage.getItem(KEY) || "[]");
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function save() {
    try {
        localStorage.setItem(KEY, JSON.stringify(records));
        return true;
    } catch {
        alert("Could not save records in this browser.");
        return false;
    }
}

function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#39;"
    })[c]);
}

function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function render() {
    const todayRows = records.filter(r => r.date === today());
    $("presentCount").textContent = todayRows.filter(r => r.status === "Present").length;
    $("lateCount").textContent = todayRows.filter(r => r.status === "Late").length;
    $("absentCount").textContent = todayRows.filter(r => r.status === "Absent").length;
    $("attendanceTotal").textContent = records.length;

    const q = $("attendanceSearch").value.trim().toLowerCase();
    const filtered = records.filter(r =>
        [r.employeeId,r.name,r.date,r.status,r.notes]
            .some(v => String(v || "").toLowerCase().includes(q))
    );

    $("attendanceRows").innerHTML = filtered.length ? filtered.map(r => `
        <tr>
            <td>${esc(r.employeeId)}</td><td>${esc(r.name)}</td>
            <td>${esc(r.date)}</td><td><span class="status">${esc(r.status)}</span></td>
            <td>${esc(r.checkIn || "—")}</td><td>${esc(r.checkOut || "—")}</td>
            <td>${esc(r.notes || "—")}</td>
            <td><button class="action-btn delete-btn" data-delete="${esc(r.id)}">Delete</button></td>
        </tr>`).join("") :
        '<tr><td colspan="8" class="empty-state">No attendance records found.</td></tr>';
}

$("attDate").value = today();

$("attendanceForm").addEventListener("submit", e => {
    e.preventDefault();
    if (!e.currentTarget.reportValidity()) return;

    const [employeeId, name] = $("attEmployee").value.split("|");
    const date = $("attDate").value;
    const record = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        employeeId, name, date,
        status: $("attStatus").value,
        checkIn: $("attCheckIn").value,
        checkOut: $("attCheckOut").value,
        notes: $("attNotes").value.trim()
    };

    const index = records.findIndex(r => r.employeeId === employeeId && r.date === date);
    const oldRecord = index >= 0 ? records[index] : null;

    if (index >= 0) records[index] = record;
    else records.push(record);

    if (!save()) {
        if (index >= 0) records[index] = oldRecord;
        else records.pop();
        return;
    }

    render();
    e.currentTarget.reset();
    $("attDate").value = today();
    alert("Attendance saved successfully.");
});

$("attendanceSearch").addEventListener("input", render);
$("attendanceRefresh").addEventListener("click", () => { records = load(); render(); });

$("attendanceRows").addEventListener("click", e => {
    const button = e.target.closest("[data-delete]");
    if (!button || !confirm("Delete this attendance record?")) return;

    const old = records;
    records = records.filter(r => r.id !== button.dataset.delete);
    if (!save()) records = old;
    render();
});

render();
