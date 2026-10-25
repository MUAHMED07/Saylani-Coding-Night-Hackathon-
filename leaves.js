const LEAVE_KEY = "hcmLeaves";
const EMPLOYEE_KEY = "hcmEmployees";
const ACTIVITY_KEY = "hcmActivity";

const form = document.getElementById("leaveForm");
const employeeSelect = document.getElementById("employeeSelect");
const leaveTypeInput = document.getElementById("leaveType");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const leaveStatusInput = document.getElementById("leaveStatus");
const leaveReasonInput = document.getElementById("leaveReason");
const leaveIdInput = document.getElementById("leaveId");

const tableBody = document.getElementById("leaveTableBody");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const filterType = document.getElementById("filterType");
const message = document.getElementById("message");
const formTitle = document.getElementById("formTitle");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");

function getRecords(key) {
  try {
    const records = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

function saveRecords(key, records) {
  localStorage.setItem(key, JSON.stringify(records));
}

function makeId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Date.now().toString(36) +
    Math.random().toString(36).slice(2);
}

function getEmployeeKey(employee) {
  return String(
    employee.id ??
    employee._key ??
    employee.employeeId ??
    employee.regNo ??
    ""
  );
}

function getEmployeeName(employee) {
  return employee.fullName ||
    employee.name ||
    employee.employeeName ||
    employee.employeeId ||
    "Unnamed Employee";
}

function showMessage(text, type = "success") {
  message.textContent = text;
  message.className = "message " + type;
}

function addActivity(action, details) {
  const activities = getRecords(ACTIVITY_KEY);

  activities.unshift({
    id: makeId(),
    action,
    details,
    date: new Date().toISOString()
  });

  saveRecords(ACTIVITY_KEY, activities.slice(0, 100));
}

function getLeaveDays(startDate, endDate) {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  const difference = end.getTime() - start.getTime();

  return Math.round(difference / 86400000) + 1;
}

function formatDate(dateString) {
  if (!dateString) return "—";

  const parts = dateString.split("-");

  if (parts.length !== 3) return dateString;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function populateEmployees(selectedKey = "") {
  const employees = getRecords(EMPLOYEE_KEY);

  employeeSelect.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = employees.length
    ? "Select an employee"
    : "No employees added yet";

  employeeSelect.appendChild(placeholder);

  employees.forEach(employee => {
    const key = getEmployeeKey(employee);
    if (!key) return;

    const option = document.createElement("option");
    option.value = key;
    option.textContent = getEmployeeName(employee);

    if (key === String(selectedKey)) {
      option.selected = true;
    }

    employeeSelect.appendChild(option);
  });
}

function getStatusClass(status) {
  const classes = {
    Pending: "status-pending",
    Approved: "status-approved",
    Rejected: "status-rejected"
  };

  return classes[status] || "";
}

function appendCell(row, text) {
  const cell = document.createElement("td");
  cell.textContent = text || "—";
  row.appendChild(cell);
  return cell;
}

function renderLeaves() {
  const leaves = getRecords(LEAVE_KEY);
  const employees = getRecords(EMPLOYEE_KEY);

  document.getElementById("totalLeaves").textContent = leaves.length;

  document.getElementById("pendingLeaves").textContent =
    leaves.filter(leave => leave.status === "Pending").length;

  document.getElementById("approvedLeaves").textContent =
    leaves.filter(leave => leave.status === "Approved").length;

  document.getElementById("rejectedLeaves").textContent =
    leaves.filter(leave => leave.status === "Rejected").length;

  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedStatus = filterStatus.value;
  const selectedType = filterType.value;

  const filteredLeaves = leaves.filter(leave => {
    const employee = employees.find(item =>
      getEmployeeKey(item) === String(leave.employeeId)
    );

    const employeeName = employee
      ? getEmployeeName(employee)
      : (leave.employeeName || "Unknown Employee");

    return employeeName.toLowerCase().includes(searchTerm) &&
      (!selectedStatus || leave.status === selectedStatus) &&
      (!selectedType || leave.leaveType === selectedType);
  });

  filteredLeaves.sort((a, b) =>
    String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
  );

  tableBody.replaceChildren();

  filteredLeaves.forEach(leave => {
    const row = document.createElement("tr");

    const employee = employees.find(item =>
      getEmployeeKey(item) === String(leave.employeeId)
    );

    const employeeCell = document.createElement("td");
    const employeeName = document.createElement("span");
    employeeName.className = "employee-name";
    employeeName.textContent = employee
      ? getEmployeeName(employee)
      : (leave.employeeName || "Unknown Employee");

    employeeCell.appendChild(employeeName);

    const employeeSubtitle = document.createElement("span");
    employeeSubtitle.className = "employee-subtitle";
    employeeSubtitle.textContent = employee
      ? (employee.employeeId || employee.department || "")
      : "";

    employeeCell.appendChild(employeeSubtitle);
    row.appendChild(employeeCell);

    appendCell(row, leave.leaveType);
    appendCell(row, formatDate(leave.startDate));
    appendCell(row, formatDate(leave.endDate));

    const days = getLeaveDays(leave.startDate, leave.endDate);
    appendCell(row, Number.isFinite(days) && days > 0 ? days : "—");

    appendCell(row, leave.reason);

    const statusCell = document.createElement("td");
    const statusBadge = document.createElement("span");
    statusBadge.className =
      "status-badge " + getStatusClass(leave.status);
    statusBadge.textContent = leave.status;
    statusCell.appendChild(statusBadge);
    row.appendChild(statusCell);

    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "action-group";

    if (leave.status === "Pending") {
      const approveButton = document.createElement("button");
      approveButton.type = "button";
      approveButton.className = "action-btn approve";
      approveButton.textContent = "Approve";
      approveButton.addEventListener("click", () => {
        changeLeaveStatus(leave.id, "Approved");
      });

      const rejectButton = document.createElement("button");
      rejectButton.type = "button";
      rejectButton.className = "action-btn reject";
      rejectButton.textContent = "Reject";
      rejectButton.addEventListener("click", () => {
        changeLeaveStatus(leave.id, "Rejected");
      });

      actions.append(approveButton, rejectButton);
    }

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "action-btn edit";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => {
      editLeave(leave.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "action-btn delete";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      deleteLeave(leave.id);
    });

    actions.append(editButton, deleteButton);
    actionsCell.appendChild(actions);
    row.appendChild(actionsCell);

    tableBody.appendChild(row);
  });

  document.getElementById("tableCount").textContent =
    filteredLeaves.length + " request" +
    (filteredLeaves.length === 1 ? "" : "s");

  emptyState.hidden = filteredLeaves.length > 0;

  if (leaves.length === 0) {
    emptyState.querySelector("h3").textContent =
      "No leave requests yet";
    emptyState.querySelector("p").textContent =
      employees.length
        ? "Add your first leave request using the form above."
        : "First add an employee on the Employees page.";
  } else if (filteredLeaves.length === 0) {
    emptyState.querySelector("h3").textContent =
      "No matching requests";
    emptyState.querySelector("p").textContent =
      "Try changing the search or filters.";
  }
}

function resetForm() {
  form.reset();
  leaveIdInput.value = "";
  formTitle.textContent = "New Leave Request";
  saveBtn.textContent = "Save Leave Request";
  cancelBtn.hidden = true;
  message.textContent = "";
  message.className = "message";
}

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const employeeId = employeeSelect.value;
  const leaveType = leaveTypeInput.value;
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;
  const status = leaveStatusInput.value;
  const reason = leaveReasonInput.value.trim();
  const editingId = leaveIdInput.value;

  if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
    showMessage("Please complete all required fields.", "error");
    return;
  }

  if (endDate < startDate) {
    showMessage(
      "End date cannot be earlier than start date.",
      "error"
    );
    return;
  }

  const employees = getRecords(EMPLOYEE_KEY);
  const employee = employees.find(item =>
    getEmployeeKey(item) === employeeId
  );

  if (!employee) {
    showMessage(
      "Employee not found. Please refresh and select again.",
      "error"
    );
    return;
  }

  const leaves = getRecords(LEAVE_KEY);

  const duplicate = leaves.find(leave =>
    String(leave.employeeId) === employeeId &&
    leave.startDate === startDate &&
    leave.endDate === endDate &&
    leave.id !== editingId
  );

  if (duplicate) {
    showMessage(
      "This employee already has a request for these exact dates.",
      "error"
    );
    return;
  }

  const leaveData = {
    employeeId,
    employeeName: getEmployeeName(employee),
    leaveType,
    startDate,
    endDate,
    status,
    reason
  };

  if (editingId) {
    const index = leaves.findIndex(leave =>
      leave.id === editingId
    );

    if (index === -1) {
      showMessage("Leave request not found.", "error");
      return;
    }

    leaves[index] = {
      ...leaves[index],
      ...leaveData,
      updatedAt: new Date().toISOString()
    };

    saveRecords(LEAVE_KEY, leaves);
    addActivity("Leave request updated", leaveData.employeeName);

    resetForm();
    renderLeaves();
    showMessage("Leave request updated successfully.");
    return;
  }

  leaves.push({
    id: makeId(),
    ...leaveData,
    createdAt: new Date().toISOString()
  });

  saveRecords(LEAVE_KEY, leaves);
  addActivity("Leave request added", leaveData.employeeName);

  resetForm();
  renderLeaves();
  showMessage("Leave request saved successfully.");
});

function editLeave(id) {
  const leave = getRecords(LEAVE_KEY).find(item =>
    item.id === id
  );

  if (!leave) {
    showMessage("Leave request not found.", "error");
    return;
  }

  populateEmployees(leave.employeeId);

  leaveIdInput.value = leave.id;
  employeeSelect.value = String(leave.employeeId);
  leaveTypeInput.value = leave.leaveType;
  startDateInput.value = leave.startDate;
  endDateInput.value = leave.endDate;
  leaveStatusInput.value = leave.status;
  leaveReasonInput.value = leave.reason;

  formTitle.textContent = "Edit Leave Request";
  saveBtn.textContent = "Update Leave Request";
  cancelBtn.hidden = false;

  showMessage("Update the details and click Update Leave Request.");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function changeLeaveStatus(id, status) {
  const leaves = getRecords(LEAVE_KEY);
  const index = leaves.findIndex(leave => leave.id === id);

  if (index === -1) return;

  leaves[index] = {
    ...leaves[index],
    status,
    updatedAt: new Date().toISOString()
  };

  saveRecords(LEAVE_KEY, leaves);

  addActivity(
    "Leave request " + status.toLowerCase(),
    leaves[index].employeeName || "Employee"
  );

  renderLeaves();
  showMessage("Leave request marked " + status.toLowerCase() + ".");
}

function deleteLeave(id) {
  const leaves = getRecords(LEAVE_KEY);
  const leave = leaves.find(item => item.id === id);

  if (!leave) return;

  if (!confirm("Are you sure you want to delete this leave request?")) {
    return;
  }

  saveRecords(
    LEAVE_KEY,
    leaves.filter(item => item.id !== id)
  );

  addActivity(
    "Leave request deleted",
    leave.employeeName || "Employee"
  );

  if (leaveIdInput.value === id) {
    resetForm();
  }

  renderLeaves();
  showMessage("Leave request deleted successfully.");
}

searchInput.addEventListener("input", renderLeaves);
filterStatus.addEventListener("change", renderLeaves);
filterType.addEventListener("change", renderLeaves);

document.getElementById("clearFilters").addEventListener("click", () => {
  searchInput.value = "";
  filterStatus.value = "";
  filterType.value = "";
  renderLeaves();
});

cancelBtn.addEventListener("click", resetForm);

document.getElementById("resetBtn").addEventListener("click", () => {
  setTimeout(() => {
    leaveIdInput.value = "";
    formTitle.textContent = "New Leave Request";
    saveBtn.textContent = "Save Leave Request";
    cancelBtn.hidden = true;
    message.textContent = "";
    message.className = "message";
  }, 0);
});

window.addEventListener("storage", event => {
  if (
    event.key === LEAVE_KEY ||
    event.key === EMPLOYEE_KEY ||
    event.key === null
  ) {
    populateEmployees(employeeSelect.value);
    renderLeaves();
  }
});

populateEmployees();
renderLeaves();