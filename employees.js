const employeeForm = document.getElementById("employeeForm");
const employeeTableBody = document.getElementById("employeeTableBody");
const employeeCount = document.getElementById("employeeCount");
const emptyState = document.getElementById("emptyState");
const tableCount = document.getElementById("tableCount");
const searchInput = document.getElementById("searchInput");
const message = document.getElementById("message");

const formTitle = document.getElementById("formTitle");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const resetBtn = document.getElementById("resetBtn");

let editingKey = null;
let messageTimer;

// Read data safely from localStorage
function getEmployees() {
    try {
        const data = JSON.parse(
            localStorage.getItem("hcmEmployees") || "[]"
        );

        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

// Save employees in localStorage
function saveEmployees(employees) {
    localStorage.setItem("hcmEmployees", JSON.stringify(employees));
}

// Show a message to the user
function showMessage(text, type) {
    clearTimeout(messageTimer);

    message.textContent = text;
    message.className = "message " + type;
    message.hidden = false;

    messageTimer = setTimeout(function () {
        message.hidden = true;
    }, 4000);
}

// Save recent activity for the dashboard
function addActivity(title, description) {
    try {
        const activities = JSON.parse(
            localStorage.getItem("hcmActivity") || "[]"
        );

        const safeActivities = Array.isArray(activities)
            ? activities
            : [];

        safeActivities.push({
            title: title,
            description: description,
            date: new Date().toLocaleString()
        });

        // Keep only the latest 20 activities
        localStorage.setItem(
            "hcmActivity",
            JSON.stringify(safeActivities.slice(-20))
        );
    } catch (error) {
        console.warn("Could not save activity.", error);
    }
}

// Add one table cell safely
function addCell(row, content) {
    const cell = document.createElement("td");
    cell.textContent = content;
    row.appendChild(cell);
    return cell;
}

// Display employees in the table
function renderEmployees() {
    const employees = getEmployees();

    employeeCount.textContent = employees.length;

    const searchTerm = searchInput.value.trim().toLowerCase();

    const filteredEmployees = employees.filter(function (employee) {
        const searchableText = [
            employee.employeeId,
            employee.fullName,
            employee.email,
            employee.phone,
            employee.department,
            employee.jobTitle,
            employee.status
        ].join(" ").toLowerCase();

        return searchableText.includes(searchTerm);
    });

    employeeTableBody.replaceChildren();

    filteredEmployees.forEach(function (employee) {
        const row = document.createElement("tr");

        // Employee name and email
        const employeeCell = document.createElement("td");

        const name = document.createElement("div");
        name.className = "employee-name";
        name.textContent = employee.fullName;

        const email = document.createElement("div");
        email.className = "employee-email";
        email.textContent = employee.email;

        employeeCell.append(name, email);
        row.appendChild(employeeCell);

        addCell(row, employee.employeeId);
        addCell(row, employee.department || "—");
        addCell(row, employee.jobTitle);

        // Status badge
        const statusCell = document.createElement("td");
        const statusBadge = document.createElement("span");

        statusBadge.className =
            employee.status === "Active"
                ? "status status-active"
                : "status status-inactive";

        statusBadge.textContent = employee.status;
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        // Edit and Delete buttons
        const actionsCell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "action-buttons";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "action-btn edit-btn";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", function () {
            editEmployee(employee._key);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "action-btn delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", function () {
            deleteEmployee(employee._key);
        });

        actions.append(editButton, deleteButton);
        actionsCell.appendChild(actions);
        row.appendChild(actionsCell);

        employeeTableBody.appendChild(row);
    });

    // Show or hide the empty state
    if (employees.length === 0) {
        emptyState.hidden = false;
        emptyState.querySelector("h3").textContent = "No employees yet";
        emptyState.querySelector("p").textContent =
            "Add your first employee using the form above.";
    } else if (filteredEmployees.length === 0) {
        emptyState.hidden = false;
        emptyState.querySelector("h3").textContent = "No matching employees";
        emptyState.querySelector("p").textContent =
            "Try another name, ID, email or department.";
    } else {
        emptyState.hidden = true;
    }

    tableCount.textContent =
        filteredEmployees.length + " of " +
        employees.length + " employees";
}

// Add or update an employee
employeeForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const employee = {
        employeeId: document.getElementById("employeeId").value.trim(),
        fullName: document.getElementById("fullName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        department: document.getElementById("department").value.trim(),
        jobTitle: document.getElementById("jobTitle").value.trim(),
        joinDate: document.getElementById("joinDate").value,
        status: document.getElementById("status").value
    };

    const employees = getEmployees();

    // Check whether employee ID already exists
    const duplicateId = employees.some(function (item) {
        return (
            item.employeeId.toLowerCase() ===
                employee.employeeId.toLowerCase() &&
            item._key !== editingKey
        );
    });

    if (duplicateId) {
        showMessage("This Employee ID already exists.", "error");
        return;
    }

    // Check whether email already exists
    const duplicateEmail = employees.some(function (item) {
        return (
            item.email.toLowerCase() === employee.email.toLowerCase() &&
            item._key !== editingKey
        );
    });

    if (duplicateEmail) {
        showMessage("This email address is already registered.", "error");
        return;
    }

    try {
        if (editingKey !== null) {
            // Update existing employee
            const index = employees.findIndex(function (item) {
                return item._key === editingKey;
            });

            if (index === -1) {
                showMessage("Employee record was not found.", "error");
                resetForm();
                return;
            }

            employee._key = editingKey;
            employees[index] = employee;

            saveEmployees(employees);
            addActivity(
                "Employee updated",
                employee.fullName + " (" + employee.employeeId + ")"
            );

            showMessage("Employee updated successfully.", "success");
        } else {
            // Create a unique internal key for this record
            employee._key =
                Date.now().toString() + "-" +
                Math.random().toString(36).slice(2, 9);

            employees.push(employee);

            saveEmployees(employees);
            addActivity(
                "Employee added",
                employee.fullName + " (" + employee.employeeId + ")"
            );

            showMessage("Employee added successfully.", "success");
        }

        resetForm();
        renderEmployees();
    } catch (error) {
        showMessage(
            "Could not save the record. Browser storage may be unavailable.",
            "error"
        );
    }
});

// Load an employee into the form for editing
function editEmployee(key) {
    const employees = getEmployees();

    const employee = employees.find(function (item) {
        return item._key === key;
    });

    if (!employee) {
        showMessage("Employee record was not found.", "error");
        return;
    }

    editingKey = key;

    document.getElementById("employeeId").value = employee.employeeId;
    document.getElementById("fullName").value = employee.fullName;
    document.getElementById("email").value = employee.email;
    document.getElementById("phone").value = employee.phone || "";
    document.getElementById("department").value = employee.department || "";
    document.getElementById("jobTitle").value = employee.jobTitle;
    document.getElementById("joinDate").value = employee.joinDate;
    document.getElementById("status").value = employee.status;

    formTitle.textContent = "Edit Employee";
    saveBtn.textContent = "Save Changes";
    cancelBtn.hidden = false;

    document.getElementById("employeeId").focus();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// Delete an employee
function deleteEmployee(key) {
    const employees = getEmployees();

    const employee = employees.find(function (item) {
        return item._key === key;
    });

    if (!employee) {
        showMessage("Employee record was not found.", "error");
        return;
    }

    const confirmed = confirm(
        "Delete " + employee.fullName + " (" +
        employee.employeeId + ")? This cannot be undone."
    );

    if (!confirmed) {
        return;
    }

    try {
        const updatedEmployees = employees.filter(function (item) {
            return item._key !== key;
        });

        saveEmployees(updatedEmployees);

        addActivity(
            "Employee deleted",
            employee.fullName + " (" + employee.employeeId + ")"
        );

        if (editingKey === key) {
            resetForm();
        }

        renderEmployees();
        showMessage("Employee deleted successfully.", "success");
    } catch (error) {
        showMessage("Could not delete this employee.", "error");
    }
}

// Clear the form and exit edit mode
function resetForm() {
    employeeForm.reset();
    editingKey = null;

    formTitle.textContent = "Add New Employee";
    saveBtn.textContent = "+ Add Employee";
    cancelBtn.hidden = true;
}

// Cancel editing
cancelBtn.addEventListener("click", function () {
    resetForm();
});

// Clear form without saving
resetBtn.addEventListener("click", function () {
    resetForm();
});

// Search employees as the user types
searchInput.addEventListener("input", renderEmployees);

// Load saved records when the page opens
renderEmployees();