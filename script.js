const setupForm = document.getElementById("setupForm");

setupForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const companyData = {
        adminName: document.getElementById("adminName").value.trim(),
        adminEmail: document.getElementById("adminEmail").value.trim(),
        companyName: document.getElementById("companyName").value.trim(),
        companyEmail: document.getElementById("companyEmail").value.trim(),
        companyAddress: document.getElementById("companyAddress").value.trim()
    };

    localStorage.setItem(
        "hcmCompanyData",
        JSON.stringify(companyData)
    );

    alert("Setup completed successfully!");

    window.location.href = "dashboard.html";
});