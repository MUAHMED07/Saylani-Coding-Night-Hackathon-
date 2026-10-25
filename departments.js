const DEPARTMENT_KEY = "hcmDepartments";
const EMPLOYEE_KEY = "hcmEmployees";
const ACTIVITY_KEY = "hcmActivity";

const form = document.getElementById("departmentForm");
const departmentIdInput = document.getElementById("departmentId");
const departmentNameInput = document.getElementById("departmentName");
const departmentCodeInput = document.getElementById("departmentCode");
const departmentHeadInput = document.getElementById("departmentHead");
const departmentDescriptionInput = document.getElementById("departmentDescription");

const tableBody = document.getElementById("departmentTableBody");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
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
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return Date.now().toString(36) +
    Math.random().toString(36).slice(2);
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

function getDepartmentEmployeeCount(department) {
  const employees = getRecords(EMPLOYEE_KEY);
  const departmentName = department.name.toLowerCase();
  const departmentCode = department.code.toLowerCase();

  return employees.filter(employee => {
    const employeeDepartment =
      String(employee.department || "").trim().toLowerCase();

    return employeeDepartment === departmentName ||
      employeeDepartment === departmentCode;
  }).length;
}

function renderDepartments() {
  const departments = getRecords(DEPARTMENT_KEY);
  const searchTerm = searchInput.value.trim().toLowerCase();

  const filteredDepartments = departments.filter(department => {
    const name = String(department.name || "").toLowerCase();
    const code = String(department.code || "").toLowerCase();
    const head = String(department.head || "").toLowerCase();

    return name.includes(searchTerm) ||
      code.includes(searchTerm) ||
      head.includes(searchTerm);
  });

  tableBody.replaceChildren();

  filteredDepartments.forEach(department => {
    const row = document.createElement("tr");
    const employeeCount = getDepartmentEmployeeCount(department);

    const nameCell = document.createElement("td");
    const nameText = document.createElement("span");
    nameText.className = "department-name";
    nameText.textContent = department.name;
    nameCell.appendChild(nameText);

    const codeCell = document.createElement("td");
    const codeText = document.createElement("span");
    codeText.className = "department-code";
    codeText.textContent = department.code;
    codeCell.appendChild(codeText);

    const headCell = document.createElement("td");
    headCell.textContent = department.head || "Not assigned";

    const countCell = document.createElement("td");
    const countText = document.createElement("span");
    countText.className = "employee-number";
    countText.textContent = employeeCount;
    countCell.appendChild(countText);

    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "action-group";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "action-btn edit";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => {
      editDepartment(department.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "action-btn delete";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      deleteDepartment(department.id);
    });

    actions.append(editButton, deleteButton);
    actionsCell.appendChild(actions);

    row.append(nameCell, codeCell, headCell, countCell, actionsCell);
    tableBody.appendChild(row);
  });

  document.getElementById("totalDepartments").textContent =
    departments.length;

  document.getElementById("assignedEmployees").textContent =
    getRecords(EMPLOYEE_KEY).filter(employee =>
      String(employee.department || "").trim() !== ""
    ).length;

  document.getElementById("tableCount").textContent =
    filteredDepartments.length + " department" +
    (filteredDepartments.length === 1 ? "" : "s");

  emptyState.hidden = filteredDepartments.length > 0;

  if (departments.length === 0) {
    emptyState.querySelector("h3").textContent = "No departments yet";
    emptyState.querySelector("p").textContent =
      "Add your first department using the form.";
  } else if (filteredDepartments.length === 0) {
    emptyState.querySelector("h3").textContent = "No matching departments";
    emptyState.querySelector("p").textContent =
      "Try another search term.";
  }
}

function resetForm() {
  form.reset();
  departmentIdInput.value = "";
  formTitle.textContent = "Add Department";
  saveBtn.textContent = "Save Department";
  cancelBtn.hidden = true;
  message.textContent = "";
  message.className = "message";
}

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const name = departmentNameInput.value.trim();
  const code = departmentCodeInput.value.trim().toUpperCase();
  const head = departmentHeadInput.value.trim();
  const description = departmentDescriptionInput.value.trim();
  const editingId = departmentIdInput.value;

  if (!name || !code) {
    showMessage("Department name and code are required.", "error");
    return;
  }

  const departments = getRecords(DEPARTMENT_KEY);

  const duplicate = departments.find(department => {
    if (department.id === editingId) return false;

    return String(department.name).toLowerCase() === name.toLowerCase() ||
      String(department.code).toLowerCase() === code.toLowerCase();
  });

  if (duplicate) {
    showMessage(
      "A department with this name or code already exists.",
      "error"
    );
    return;
  }

  if (editingId) {
    const index = departments.findIndex(
      department => department.id === editingId
    );

    if (index === -1) {
      showMessage("Department was not found. Please refresh and try again.", "error");
      return;
    }

    departments[index] = {
      ...departments[index],
      name,
      code,
      head,
      description,
      updatedAt: new Date().toISOString()
    };

    saveRecords(DEPARTMENT_KEY, departments);
    addActivity("Department updated", name);
    resetForm();
    renderDepartments();
    showMessage("Department updated successfully.");
    return;
  }

  const newDepartment = {
    id: makeId(),
    name,
    code,
    head,
    description,
    createdAt: new Date().toISOString()
  };

  departments.push(newDepartment);
  saveRecords(DEPARTMENT_KEY, departments);
  addActivity("Department added", name);

  resetForm();
  renderDepartments();
  showMessage("Department added successfully.");
});

function editDepartment(id) {
  const department = getRecords(DEPARTMENT_KEY).find(
    item => item.id === id
  );

  if (!department) {
    showMessage("Department not found.", "error");
    return;
  }

  departmentIdInput.value = department.id;
  departmentNameInput.value = department.name;
  departmentCodeInput.value = department.code;
  departmentHeadInput.value = department.head || "";
  departmentDescriptionInput.value = department.description || "";

  formTitle.textContent = "Edit Department";
  saveBtn.textContent = "Update Department";
  cancelBtn.hidden = false;

  showMessage("Edit the details and select Update Department.");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteDepartment(id) {
  const departments = getRecords(DEPARTMENT_KEY);
  const department = departments.find(item => item.id === id);

  if (!department) return;

  const employees = getRecords(EMPLOYEE_KEY);
  const assignedEmployees = employees.filter(employee => {
    const value = String(employee.department || "").trim().toLowerCase();

    return value === department.name.toLowerCase() ||
      value === department.code.toLowerCase();
  });

  if (assignedEmployees.length > 0) {
    alert(
      "This department has " + assignedEmployees.length +
      " assigned employee(s). Reassign those employees before deleting it."
    );
    return;
  }

  const confirmed = confirm(
    'Are you sure you want to delete "' + department.name + '"?'
  );

  if (!confirmed) return;

  saveRecords(
    DEPARTMENT_KEY,
    departments.filter(item => item.id !== id)
  );

  addActivity("Department deleted", department.name);

  if (departmentIdInput.value === id) {
    resetForm();
  }

  renderDepartments();
  showMessage("Department deleted successfully.");
}

searchInput.addEventListener("input", renderDepartments);
cancelBtn.addEventListener("click", resetForm);
document.getElementById("resetBtn").addEventListener("click", resetForm);

window.addEventListener("storage", function(event) {
  if (
    event.key === DEPARTMENT_KEY ||
    event.key === EMPLOYEE_KEY ||
    event.key === null
  ) {
    renderDepartments();
  }
});

renderDepartments();