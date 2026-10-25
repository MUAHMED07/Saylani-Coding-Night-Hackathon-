
"use strict";

const KEY = "hcmLiteSettings";
const $ = id => document.getElementById(id);

const defaults = {
    orgName: "Spotlitech",
    adminName: "Administrator",
    adminEmail: "",
    timezone: "Asia/Karachi",
    currency: "PKR",
    dateFormat: "DD-MM-YYYY",
    workWeek: "Monday-Friday",
    defaultLeave: 14,
    emailNotifications: true,
    payrollApproval: true
};

function loadSettings() {
    try {
        return {...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}")};
    } catch {
        return {...defaults};
    }
}

function getFormSettings() {
    return {
        orgName: $("orgName").value.trim(),
        adminName: $("adminName").value.trim(),
        adminEmail: $("adminEmail").value.trim(),
        timezone: $("timezone").value,
        currency: $("currency").value,
        dateFormat: $("dateFormat").value,
        workWeek: $("workWeek").value,
        defaultLeave: Number($("defaultLeave").value),
        emailNotifications: $("emailNotifications").checked,
        payrollApproval: $("payrollApproval").checked
    };
}

function updateSummary(settings) {
    $("settingOrgSummary").textContent = settings.orgName || "Spotlitech";
    $("settingCurrencySummary").textContent = settings.currency;
    $("settingDateSummary").textContent = settings.dateFormat;
    $("settingNotifySummary").textContent =
        settings.emailNotifications ? "Enabled" : "Disabled";
}

function applySettings(settings) {
    Object.keys(defaults).forEach(key => {
        const element = $(key);
        if (!element) return;

        if (element.type === "checkbox") {
            element.checked = Boolean(settings[key]);
        } else {
            element.value = settings[key] ?? defaults[key];
        }
    });

    updateSummary(settings);
}

function saveSettings(settings) {
    try {
        localStorage.setItem(KEY, JSON.stringify(settings));
        return true;
    } catch {
        alert("Settings could not be saved in this browser.");
        return false;
    }
}

$("settingsForm").addEventListener("submit", e => {
    e.preventDefault();
    if (!e.currentTarget.reportValidity()) return;

    const settings = getFormSettings();
    if (!settings.orgName || !settings.adminName) {
        alert("Organization and administrator names are required.");
        return;
    }

    if (saveSettings(settings)) {
        updateSummary(settings);
        $("settingsMessage").textContent = "Settings saved successfully.";
    }
});

$("settingsRefresh").addEventListener("click", () => {
    applySettings(loadSettings());
    $("settingsMessage").textContent = "Saved settings reloaded.";
});

$("resetSettings").addEventListener("click", () => {
    if (!confirm("Reset all settings to defaults?")) return;

    applySettings({...defaults});
    if (saveSettings({...defaults})) {
        $("settingsMessage").textContent = "Default settings saved.";
    }
});

applySettings(loadSettings());
