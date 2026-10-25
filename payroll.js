
"use strict";

// Spotlitech Portal - Payroll Management
// Demo implementation using browser localStorage.
// Replace this storage layer with your backend API for production.

const PAYROLL_STORAGE_KEY = "hcmLitePayrollRecords";

const payrollForm = document.getElementById("payrollForm");
const employeeName = document.getElementById("employeeName");
const payrollMonth = document.getElementById("payrollMonth");
const basicSalary = document.getElementById("basicSalary");
const allowances = document.getElementById("allowances");
const bonus = document.getElementById("bonus");
const deductions = document.getElementById("deductions");
const grossSalary = document.getElementById("grossSalary");
const netSalary = document.getElementById("netSalary");
const salaryPreview = document.getElementById("salaryPreview");
const payrollTableBody = document.getElementById("payrollTableBody");
const searchPayroll = document.getElementById("searchPayroll");

let payrollRecords = loadPayrollRecords();

function loadPayrollRecords() {
    try {
        const saved = localStorage.getItem(PAYROLL_STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];

        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Unable to load payroll records:", error);
        return [];
    }
}

function savePayrollRecords() {
    try {
        localStorage.setItem(
            PAYROLL_STORAGE_KEY,
            JSON.stringify(payrollRecords)
        );
        return true;
    } catch (error) {
        console.error("Unable to save payroll records:", error);
        alert("Payroll could not be saved in this browser.");
        return false;
    }
}

function getAmount(element) {
    const value = Number(element.value);
    return Number.isFinite(value) && value >= 0 ? value : 0;
}

function formatCurrency(amount) {
    return "PKR " + Number(amount).toLocaleString("en-PK", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Fill the employee list from the Employees page records.
function populateEmployees() {
    let employees = [];

    try {
        const parsed = JSON.parse(localStorage.getItem("hcmEmployees") || "[]");
        employees = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Unable to load employees:", error);
    }

    employeeName.replaceChildren(
        new Option(employees.length ? "Select employee" : "No employees added yet", "")
    );

    employees.forEach(employee => {
        employeeName.appendChild(new Option(
            `${employee.employeeId} - ${employee.fullName}`,
            `${employee.employeeId}|${employee.fullName}`
        ));
    });
}

// Select an employee and fill in their last saved basic salary.
employeeName.addEventListener("change", function () {
    const selectedValue = this.value;

    if (!selectedValue) {
        basicSalary.value = "";
        calculateSalary();
        return;
    }

    const parts = selectedValue.split("|");
    const employeeId = parts[0];

    // Use the most recently saved salary for this employee, if available.
    const previousRecord = [...payrollRecords]
        .reverse()
        .find(record => record.employeeId === employeeId);

    basicSalary.value = previousRecord
        ? previousRecord.basicSalary
        : "";

    calculateSalary();
});

// Calculate gross and net salary whenever an amount changes.
function calculateSalary() {
    const basic = getAmount(basicSalary);
    const allowance = getAmount(allowances);
    const employeeBonus = getAmount(bonus);
    const employeeDeductions = getAmount(deductions);

    const gross = basic + allowance + employeeBonus;
    const net = gross - employeeDeductions;

    grossSalary.value = gross.toFixed(2);
    netSalary.value = net.toFixed(2);
    salaryPreview.textContent = formatCurrency(net);
}

[basicSalary, allowances, bonus, deductions].forEach(input => {
    input.addEventListener("input", calculateSalary);
});

// Create a payroll record.
payrollForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!payrollForm.reportValidity()) {
        return;
    }

    if (!employeeName.value || !payrollMonth.value) {
        alert("Please select an employee and payroll month.");
        return;
    }

    const [employeeId, name] = employeeName.value.split("|");
    const month = payrollMonth.value;

    const basic = getAmount(basicSalary);
    const allowance = getAmount(allowances);
    const employeeBonus = getAmount(bonus);
    const employeeDeductions = getAmount(deductions);

    const gross = basic + allowance + employeeBonus;
    const net = gross - employeeDeductions;

    if (net < 0) {
        alert("Deductions cannot exceed the gross salary.");
        return;
    }

    // Prevent duplicate payroll for the same employee and month.
    const duplicate = payrollRecords.some(record =>
        record.employeeId === employeeId &&
        record.month === month
    );

    if (duplicate) {
        alert("Payroll already exists for this employee and month.");
        return;
    }

    const record = {
        id: createRecordId(),
        employeeId,
        name,
        month,
        basicSalary: basic,
        allowances: allowance,
        bonus: employeeBonus,
        deductions: employeeDeductions,
        gross,
        net,
        status: "Generated",
        createdAt: new Date().toISOString()
    };

    payrollRecords.push(record);

    if (!savePayrollRecords()) {
        payrollRecords.pop();
        return;
    }

    renderPayrollRecords();
    updatePayrollSummary();

    alert("Payroll generated successfully.");

    payrollForm.reset();
    basicSalary.value = "";
    allowances.value = "0";
    bonus.value = "0";
    deductions.value = "0";

    calculateSalary();
});

function createRecordId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return Date.now().toString(36) +
        Math.random().toString(36).slice(2);
}

function renderPayrollRecords() {
    const query = searchPayroll.value.trim().toLowerCase();

    const filteredRecords = payrollRecords.filter(record => {
        return [
            record.employeeId,
            record.name,
            record.month,
            record.status
        ].some(value => String(value).toLowerCase().includes(query));
    });

    if (filteredRecords.length === 0) {
        payrollTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    No payroll records found.
                </td>
            </tr>
        `;
        return;
    }

    payrollTableBody.innerHTML = filteredRecords.map(record => `
        <tr>
            <td>${escapeHTML(record.employeeId)}</td>
            <td>${escapeHTML(record.name)}</td>
            <td>${escapeHTML(record.month)}</td>
            <td>${formatCurrency(record.gross)}</td>
            <td>${formatCurrency(record.deductions)}</td>
            <td><strong>${formatCurrency(record.net)}</strong></td>
            <td>
                <span class="status">${escapeHTML(record.status)}</span>
            </td>
            <td>
                <button
                    type="button"
                    class="action-btn"
                    data-action="view"
                    data-id="${escapeHTML(record.id)}">
                    View
                </button>
                <button
                    type="button"
                    class="action-btn delete-btn"
                    data-action="delete"
                    data-id="${escapeHTML(record.id)}">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}

function updatePayrollSummary() {
    const uniqueEmployees = new Set(
        payrollRecords.map(record => record.employeeId)
    );

    const totalGross = payrollRecords.reduce(
        (sum, record) => sum + Number(record.gross || 0), 0
    );

    const totalDeductions = payrollRecords.reduce(
        (sum, record) => sum + Number(record.deductions || 0), 0
    );

    const totalNet = payrollRecords.reduce(
        (sum, record) => sum + Number(record.net || 0), 0
    );

    document.getElementById("totalPaid").textContent =
        uniqueEmployees.size.toLocaleString("en-PK");

    document.getElementById("totalGross").textContent =
        formatCurrency(totalGross);

    document.getElementById("totalDeductions").textContent =
        formatCurrency(totalDeductions);

    document.getElementById("totalNet").textContent =
        formatCurrency(totalNet);
}

// Search records.
searchPayroll.addEventListener("input", renderPayrollRecords);

// Handle View and Delete actions.
payrollTableBody.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const record = payrollRecords.find(
        item => item.id === button.dataset.id
    );

    if (!record) return;

    if (button.dataset.action === "view") {
        alert(
            "Employee: " + record.name +
            "\nEmployee ID: " + record.employeeId +
            "\nMonth: " + record.month +
            "\nBasic Salary: " + formatCurrency(record.basicSalary) +
            "\nAllowances: " + formatCurrency(record.allowances) +
            "\nBonus: " + formatCurrency(record.bonus) +
            "\nGross Salary: " + formatCurrency(record.gross) +
            "\nDeductions: " + formatCurrency(record.deductions) +
            "\nNet Salary: " + formatCurrency(record.net)
        );
    }

    if (button.dataset.action === "delete") {
        const confirmed = window.confirm(
            "Are you sure you want to delete this payroll record?"
        );

        if (!confirmed) return;

        const originalRecords = payrollRecords;

        payrollRecords = payrollRecords.filter(
            item => item.id !== record.id
        );

        if (!savePayrollRecords()) {
            payrollRecords = originalRecords;
            return;
        }

        renderPayrollRecords();
        updatePayrollSummary();
    }
});

// Refresh the payroll display.
document.getElementById("refreshBtn").addEventListener("click", function () {
    payrollRecords = loadPayrollRecords();
    populateEmployees();
    renderPayrollRecords();
    updatePayrollSummary();
});

// Set the default payroll month to the current month.
const now = new Date();
payrollMonth.value =
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

// Initial page load.
populateEmployees();
calculateSalary();
renderPayrollRecords();
updatePayrollSummary();
