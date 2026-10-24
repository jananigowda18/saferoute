const API_URL = "http://localhost:5000/api/hazards";
"use strict";

/* =========================================
   ROADALERT - SCRIPT.JS
   Matches the latest index.html and style.css
   ========================================= */

const USERS_KEY = "roadalert_users";
const AUTHORITIES_KEY = "roadalert_authorities";
const REPORTS_KEY = "roadalert_reports";
const SESSION_KEY = "roadalert_session";

let currentUser = null;
let currentLocation = null;


/* =========================================
   STORAGE HELPERS
   ========================================= */

function readStorage(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getReports() {
    return readStorage(REPORTS_KEY);
}

function getSavedSession() {
    try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY));
    } catch {
        return null;
    }
}

function saveSession(account, role) {
    currentUser = {
        name: account.name,
        email: account.email,
        role: role,
        userType: account.userType || "Passenger"
    };

    sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify(currentUser)
    );
}


/* =========================================
   HELPERS
   ========================================= */

function getElement(id) {
    return document.getElementById(id);
}

function getInputValue(id) {
    const element = getElement(id);
    return element ? element.value.trim() : "";
}

function showMessage(id, message, isError = false) {
    const element = getElement(id);

    if (!element) return;

    element.textContent = message;
    element.style.color = isError ? "#dc2626" : "#15803d";
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return replacements[character];
    });
}

function formatDate(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleString();
}


/* =========================================
   AUTHENTICATION SCREENS
   ========================================= */

function showAuthScreen(screenId) {
    document.querySelectorAll(".auth-screen").forEach(screen => {
        screen.classList.remove("active");
    });

    const selectedScreen = getElement(screenId);

    if (selectedScreen) {
        selectedScreen.classList.add("active");
    }
}


/* =========================================
   USER REGISTRATION
   ========================================= */

function registerUser(event) {
    event.preventDefault();

    const name = getInputValue("userName");
    const email = getInputValue("userEmail").toLowerCase();
    const password = getInputValue("userPassword");
    const confirmPassword = getInputValue("userConfirmPassword");

    if (!name || !email || !password || !confirmPassword) {
        alert("Please fill in all fields.");
        return;
    }

    if (password.length < 6) {
        alert("Password must contain at least 6 characters.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    const users = readStorage(USERS_KEY);

    const exists = users.some(user =>
        user.email.toLowerCase() === email
    );

    if (exists) {
        alert("This email is already registered.");
        return;
    }

    const account = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password,
        userType: "Passenger"
    };

    users.push(account);
    writeStorage(USERS_KEY, users);

    event.target.reset();

    alert("Registration successful! Please log in.");
    showAuthScreen("userLogin");
}


/* =========================================
   USER LOGIN
   ========================================= */

function loginUser(event) {
    event.preventDefault();

    const email = getInputValue("userLoginEmail").toLowerCase();
    const password = getInputValue("userLoginPassword");

    const users = readStorage(USERS_KEY);

    const account = users.find(user =>
        user.email.toLowerCase() === email &&
        user.password === password
    );

    if (!account) {
        alert("Invalid email or password. Please register first.");
        return;
    }

    saveSession(account, "user");
    openDashboard();
}


/* =========================================
   AUTHORITY REGISTRATION
   ========================================= */

function registerAuthority(event) {
    event.preventDefault();

    const name = getInputValue("authorityName");
    const email = getInputValue("authorityEmail").toLowerCase();
    const password = getInputValue("authorityPassword");
    const confirmPassword = getInputValue("authorityConfirmPassword");
    const code = getInputValue("authorityCode");

    if (!name || !email || !password || !confirmPassword || !code) {
        alert("Please fill in all fields.");
        return;
    }

    if (password.length < 6) {
        alert("Password must contain at least 6 characters.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    // Demo-only code. This is not secure for a real application.
    if (code !== "ROADALERT2026") {
        alert("Invalid authority registration code.");
        return;
    }

    const authorities = readStorage(AUTHORITIES_KEY);

    const exists = authorities.some(authority =>
        authority.email.toLowerCase() === email
    );

    if (exists) {
        alert("This authority email is already registered.");
        return;
    }

    const account = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password
    };

    authorities.push(account);
    writeStorage(AUTHORITIES_KEY, authorities);

    event.target.reset();

    alert("Authority registration successful! Please log in.");
    showAuthScreen("authorityLogin");
}


/* =========================================
   AUTHORITY LOGIN
   ========================================= */

function loginAuthority(event) {
    event.preventDefault();

    const email = getInputValue("authorityLoginEmail").toLowerCase();
    const password = getInputValue("authorityLoginPassword");

    const authorities = readStorage(AUTHORITIES_KEY);

    const account = authorities.find(authority =>
        authority.email.toLowerCase() === email &&
        authority.password === password
    );

    if (!account) {
        alert("Invalid authority email or password.");
        return;
    }

    saveSession(account, "authority");
    openDashboard();
}


/* =========================================
   DASHBOARD
   ========================================= */

function openDashboard() {
    document.querySelectorAll(".auth-screen").forEach(screen => {
        screen.classList.remove("active");
    });

    const dashboard = getElement("dashboard");

    if (dashboard) {
        dashboard.style.display = "flex";
    }

    const authorityButton = document.querySelector(
        '.nav-btn[data-page="authority"]'
    );

    if (authorityButton) {
        authorityButton.style.display =
            currentUser.role === "authority" ? "block" : "none";
    }

    const userTypeSelect = getElement("userTypeSelect");

    if (userTypeSelect && currentUser.role === "user") {
        userTypeSelect.value = currentUser.userType || "Passenger";
    }

    const userTypeMessage = getElement("userTypeMessage");

    if (userTypeMessage && currentUser.role === "user") {
        userTypeMessage.textContent =
            "Logged in as " + (currentUser.userType || "Passenger");
    }

    updateDashboard();

    if (currentUser.role === "authority") {
        showPage("authority");
    } else {
        showPage("home");
    }
}


/* =========================================
   PAGE NAVIGATION
   ========================================= */

function showPage(pageId) {
    if (!currentUser) {
        showAuthScreen("userLogin");
        return;
    }

    if (
        currentUser.role === "user" &&
        pageId === "authority"
    ) {
        alert("Only authorities can access the authority panel.");
        return;
    }

    if (
        currentUser.role === "authority" &&
        ["report", "passenger", "gps", "verification",
         "routes", "monthly"].includes(pageId)
    ) {
        alert("This page is available to road users.");
        return;
    }

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    const page = getElement(pageId);

    if (page) {
        page.classList.add("active");
    }

    document.querySelectorAll(".nav-btn[data-page]").forEach(button => {
        button.classList.remove("active");
    });

    const activeButton = document.querySelector(
        `.nav-btn[data-page="${pageId}"]`
    );

    if (activeButton) {
        activeButton.classList.add("active");
    }

    if (pageId === "home") {
        updateDashboard();
    }

    if (pageId === "passenger") {
        renderPassengerReports();
    }

    if (pageId === "authority") {
        renderAuthorityReports();
    }

    if (pageId === "verification") {
        renderVerificationReports();
    }

    if (pageId === "monthly") {
        renderMonthlyReport();
    }
}

function updateDashboard() {
    const total = getElement("totalReports");

    if (total) {
        total.textContent = getReports().length;
    }
}


/* =========================================
   PASSENGER / EMPLOYEE SELECTION
   ========================================= */

function changeUserType() {
    if (!currentUser || currentUser.role !== "user") return;

    const select = getElement("userTypeSelect");

    if (!select) return;

    const selectedType = select.value;

    currentUser.userType = selectedType;

    sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify(currentUser)
    );

    const users = readStorage(USERS_KEY);

    const index = users.findIndex(user =>
        user.email.toLowerCase() === currentUser.email.toLowerCase()
    );

    if (index !== -1) {
        users[index].userType = selectedType;
        writeStorage(USERS_KEY, users);
    }

    showMessage(
        "userTypeMessage",
        "Account type updated to " + selectedType
    );
}


/* =========================================
   INCIDENT IMAGE PREVIEW
   ========================================= */

function previewIncidentImage() {
    const input = getElement("incidentImage");
    const preview = getElement("incidentPreview");

    if (!input || !preview) return;

    preview.innerHTML = "";

    const file = input.files && input.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        input.value = "";
        return;
    }

    const image = document.createElement("img");

    image.src = URL.createObjectURL(file);
    image.alt = "Incident image preview";

    preview.appendChild(image);
}


/* =========================================
   SUBMIT INCIDENT REPORT
   ========================================= */

function submitReport(event) {
    event.preventDefault();

    if (!currentUser || currentUser.role !== "user") {
        alert("Please log in as a road user.");
        return;
    }

    const type = getInputValue("incidentType");
    const location = getInputValue("incidentLocation");
    const description = getInputValue("incidentDescription");

    if (!type || !location || !description) {
        alert("Please complete all required fields.");
        return;
    }

    const imageInput = getElement("incidentImage");
    const imageFile = imageInput && imageInput.files
        ? imageInput.files[0]
        : null;

    const report = {
        id: "RA" + Date.now(),
        userName: currentUser.name,
        userEmail: currentUser.email,
        userType: currentUser.userType || "Passenger",
        incidentType: type,
        incidentLocation: location,
        incidentDescription: description,
        imageName: imageFile ? imageFile.name : "",
        date: new Date().toISOString(),
        status: "Pending",
        verificationStatus: "Unverified"
    };

    const reports = getReports();

    reports.unshift(report);
    writeStorage(REPORTS_KEY, reports);

    event.target.reset();

    const preview = getElement("incidentPreview");

    if (preview) {
        preview.innerHTML = "";
    }

    alert("Incident report submitted successfully!");

    updateDashboard();
    showPage("passenger");
}


/* =========================================
   MY REPORTS
   ========================================= */

function renderPassengerReports() {
    const container = getElement("passengerReports");

    if (!container || !currentUser) return;

    const reports = getReports().filter(report =>
        report.userEmail &&
        report.userEmail.toLowerCase() ===
        currentUser.email.toLowerCase()
    );

    if (reports.length === 0) {
        container.innerHTML =
            "<p>You have not submitted any reports yet.</p>";
        return;git add .
    }

    container.innerHTML = reports.map(report => `
        <article class="report-card">
            <h3>${escapeHTML(report.incidentType)}</h3>

            <p><strong>Report ID:</strong>
                ${escapeHTML(report.id)}</p>

            <p><strong>Location:</strong>
                ${escapeHTML(report.incidentLocation)}</p>

            <p><strong>Description:</strong>
                ${escapeHTML(report.incidentDescription)}</p>

            <p><strong>Date:</strong>
                ${escapeHTML(formatDate(report.date))}</p>

            <p><strong>Status:</strong>
                ${escapeHTML(report.status || "Pending")}</p>

            <p><strong>Verification:</strong>
                ${escapeHTML(report.verificationStatus || "Unverified")}</p>
        </article>
    `).join("");
}


/* =========================================
   GPS LOCATION
   ========================================= */

function getGPSLocation() {
    const coordinates = getElement("gpsCoordinates");
    const map = getElement("gpsMap");

    if (!navigator.geolocation) {
        showMessage("gpsMessage", "GPS is not supported by this browser.", true);
        return;
    }

    showMessage("gpsMessage", "Getting your location...");

    navigator.geolocation.getCurrentPosition(
        position => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            currentLocation = {
                latitude: latitude,
                longitude: longitude
            };

            if (coordinates) {
                coordinates.textContent =
                    "Latitude: " + latitude.toFixed(6) +
                    " | Longitude: " + longitude.toFixed(6);
            }

            if (map) {
                const left = longitude - 0.01;
                const bottom = latitude - 0.01;
                const right = longitude + 0.01;
                const top = latitude + 0.01;

                map.src =
                    "https://www.openstreetmap.org/export/embed.html" +
                    "?bbox=" + left + "%2C" + bottom + "%2C" +
                    right + "%2C" + top +
                    "&layer=mapnik&marker=" +
                    latitude + "%2C" + longitude;

                map.style.display = "block";
            }

            showMessage("gpsMessage", "Location found successfully.");
        },
        error => {
            let message = "Unable to get your location.";

            if (error.code === 1) {
                message = "Location permission denied. Allow location access.";
            } else if (error.code === 2) {
                message = "Location is unavailable. Try again.";
            } else if (error.code === 3) {
                message = "Location request timed out. Try again.";
            }

            showMessage("gpsMessage", message, true);
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}


/* =========================================
   VERIFICATION VIEW
   ========================================= */

function renderVerificationReports() {
    const container = getElement("verificationReports");

    if (!container) return;

    const reports = getReports();

    if (reports.length === 0) {
        container.innerHTML = "<p>No reports available.</p>";
        return;
    }

    container.innerHTML = reports.map(report => `
        <article class="report-card">
            <h3>${escapeHTML(report.incidentType)}</h3>

            <p><strong>Report ID:</strong>
                ${escapeHTML(report.id)}</p>

            <p><strong>Location:</strong>
                ${escapeHTML(report.incidentLocation)}</p>

            <p><strong>Status:</strong>
                ${escapeHTML(report.status || "Pending")}</p>

            <p><strong>Verification:</strong>
                ${escapeHTML(report.verificationStatus || "Unverified")}</p>
        </article>
    `).join("");
}


/* =========================================
   GOOGLE MAPS DIRECTIONS
   ========================================= */

function openAlternativeRoute() {
    const destination = getInputValue("routeDestination");

    if (!destination) {
        showMessage("routeMessage", "Please enter a destination.", true);
        return;
    }

    let url =
        "https://www.google.com/maps/dir/?api=1" +
        "&destination=" + encodeURIComponent(destination) +
        "&travelmode=driving";

    if (currentLocation) {
        const origin =
            currentLocation.latitude + "," +
            currentLocation.longitude;

        url += "&origin=" + encodeURIComponent(origin);
    }

    window.open(url, "_blank", "noopener,noreferrer");

    showMessage(
        "routeMessage",
        "Google Maps opened. Check the route and traffic conditions there."
    );
}


/* =========================================
   MONTHLY REPORTS
   ========================================= */

function renderMonthlyReport() {
    const monthInput = getElement("reportMonth");

    if (!monthInput || !monthInput.value) return;

    const month = monthInput.value;

    const reports = getReports().filter(report =>
        report.date && report.date.slice(0, 7) === month
    );

    const pending = reports.filter(report =>
        (report.status || "Pending") === "Pending"
    ).length;

    const resolved = reports.filter(report =>
        report.status === "Resolved"
    ).length;

    const totalElement = getElement("monthlyTotal");
    const pendingElement = getElement("monthlyPending");
    const resolvedElement = getElement("monthlyResolved");
    const categoriesElement = getElement("monthlyCategories");

    if (totalElement) totalElement.textContent = reports.length;
    if (pendingElement) pendingElement.textContent = pending;
    if (resolvedElement) resolvedElement.textContent = resolved;

    if (!categoriesElement) return;

    if (reports.length === 0) {
        categoriesElement.innerHTML =
            "<p>No reports found for this month.</p>";
        return;
    }

    const counts = {};

    reports.forEach(report => {
        const type = report.incidentType || "Other";
        counts[type] = (counts[type] || 0) + 1;
    });

    categoriesElement.innerHTML = Object.entries(counts).map(
        ([type, count]) => `
            <p><strong>${escapeHTML(type)}:</strong> ${count}</p>
        `
    ).join("");
}


/* =========================================
   AUTHORITY REPORT MANAGEMENT
   ========================================= */

function authorityReportCard(report) {
    return `
        <article class="report-card">
            <h3>${escapeHTML(report.incidentType)}</h3>

            <p><strong>Report ID:</strong>
                ${escapeHTML(report.id)}</p>

            <p><strong>Reported by:</strong>
                ${escapeHTML(report.userName)}</p>

            <p><strong>User type:</strong>
                ${escapeHTML(report.userType || "Passenger")}</p>

            <p><strong>Location:</strong>
                ${escapeHTML(report.incidentLocation)}</p>

            <p><strong>Description:</strong>
                ${escapeHTML(report.incidentDescription)}</p>

            <p><strong>Date:</strong>
                ${escapeHTML(formatDate(report.date))}</p>

            <label for="status-${escapeHTML(report.id)}">
                Update status
            </label>

            <select
                id="status-${escapeHTML(report.id)}"
                onchange="updateReportStatus('${escapeHTML(report.id)}', this.value)"
            >
                <option value="Pending"
                    ${report.status === "Pending" ? "selected" : ""}>
                    Pending
                </option>

                <option value="Resolved"
                    ${report.status === "Resolved" ? "selected" : ""}>
                    Resolved
                </option>
            </select>
        </article>
    `;
}

function renderAuthorityReports() {
    const reports = getReports();

    const pendingContainer = getElement("pendingReports");
    const resolvedContainer = getElement("resolvedReports");
    const allContainer = getElement("authorityReports");

    const pending = reports.filter(report =>
        (report.status || "Pending") === "Pending"
    );

    const resolved = reports.filter(report =>
        report.status === "Resolved"
    );

    if (pendingContainer) {
        pendingContainer.innerHTML = pending.length
            ? pending.map(authorityReportCard).join("")
            : "<p>No pending reports.</p>";
    }

    if (resolvedContainer) {
        resolvedContainer.innerHTML = resolved.length
            ? resolved.map(authorityReportCard).join("")
            : "<p>No resolved reports.</p>";
    }

    if (allContainer) {
        allContainer.innerHTML = reports.length
            ? reports.map(authorityReportCard).join("")
            : "<p>No reports submitted yet.</p>";
    }
}

function updateReportStatus(reportId, newStatus) {
    if (!currentUser || currentUser.role !== "authority") {
        alert("Only authorities can update report status.");
        return;
    }

    if (!["Pending", "Resolved"].includes(newStatus)) {
        alert("Invalid report status.");
        return;
    }

    const reports = getReports();

    const index = reports.findIndex(report =>
        report.id === reportId
    );

    if (index === -1) {
        alert("Report not found.");
        return;
    }

    reports[index].status = newStatus;

    // Demo only: status update is not independent verification.
    reports[index].verificationStatus =
        newStatus === "Resolved" ? "Verified" : "Unverified";

    writeStorage(REPORTS_KEY, reports);

    renderAuthorityReports();
    renderPassengerReports();
    renderVerificationReports();
    renderMonthlyReport();
    updateDashboard();
}


/* =========================================
   LOGOUT
   ========================================= */

function logout() {
    currentUser = null;
    currentLocation = null;

    sessionStorage.removeItem(SESSION_KEY);

    const dashboard = getElement("dashboard");

    if (dashboard) {
        dashboard.style.display = "none";
    }

    showAuthScreen("userLogin");
}


/* =========================================
   CONNECT HTML EVENTS
   ========================================= */

function connectEvents() {
    // Login and registration
    const userLoginForm = getElement("userLoginForm");
    const userRegisterForm = getElement("userRegisterForm");
    const authorityLoginForm = getElement("authorityLoginForm");
    const authorityRegisterForm = getElement("authorityRegisterForm");

    if (userLoginForm) {
        userLoginForm.addEventListener("submit", loginUser);
    }

    if (userRegisterForm) {
        userRegisterForm.addEventListener("submit", registerUser);
    }

    if (authorityLoginForm) {
        authorityLoginForm.addEventListener("submit", loginAuthority);
    }

    if (authorityRegisterForm) {
        authorityRegisterForm.addEventListener("submit", registerAuthority);
    }

    // Authentication screen navigation
    const showUserRegister = getElement("showUserRegister");
    const showAuthorityLogin = getElement("showAuthorityLogin");
    const showAuthorityRegister = getElement("showAuthorityRegister");

    if (showUserRegister) {
        showUserRegister.addEventListener("click", () => {
            showAuthScreen("userRegister");
        });
    }

    if (showAuthorityLogin) {
        showAuthorityLogin.addEventListener("click", () => {
            showAuthScreen("authorityLogin");
        });
    }

    if (showAuthorityRegister) {
        showAuthorityRegister.addEventListener("click", () => {
            showAuthScreen("authorityRegister");
        });
    }

    // Back buttons
    const backToUserLogin = getElement("backToUserLogin");
    const backFromRegister = getElement("backToUserLoginFromRegister");
    const backToAuthorityLogin = getElement("backToAuthorityLogin");

    if (backToUserLogin) {
        backToUserLogin.addEventListener("click", () => {
            showAuthScreen("userLogin");
        });
    }

    if (backFromRegister) {
        backFromRegister.addEventListener("click", () => {
            showAuthScreen("userLogin");
        });
    }

    if (backToAuthorityLogin) {
        backToAuthorityLogin.addEventListener("click", () => {
            showAuthScreen("authorityLogin");
        });
    }

    // Dashboard navigation
    document.querySelectorAll(".nav-btn[data-page]").forEach(button => {
        button.addEventListener("click", () => {
            showPage(button.dataset.page);
        });
    });

    // Logout
    document.querySelectorAll(".logout-btn").forEach(button => {
        button.addEventListener("click", logout);
    });

    // Incident report
    const reportForm = getElement("reportForm");

    if (reportForm) {
        reportForm.addEventListener("submit", submitReport);
    }

    // Image preview
    const imageInput = getElement("incidentImage");

    if (imageInput) {
        imageInput.addEventListener("change", previewIncidentImage);
    }

    // Passenger / employee
    const userTypeSelect = getElement("userTypeSelect");

    if (userTypeSelect) {
        userTypeSelect.addEventListener("change", changeUserType);
    }

    // GPS
    const gpsButton = getElement("getGpsButton");

    if (gpsButton) {
        gpsButton.addEventListener("click", getGPSLocation);
    }

    // Directions
    const routeButton = getElement("openRouteButton");

    if (routeButton) {
        routeButton.addEventListener("click", openAlternativeRoute);
    }

    // Monthly reports
    const reportMonth = getElement("reportMonth");

    if (reportMonth) {
        reportMonth.addEventListener("change", renderMonthlyReport);
    }
}


/* =========================================
   APPLICATION START
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {
    connectEvents();

    // Set the current month in the monthly report input.
    const monthInput = getElement("reportMonth");

    if (monthInput && !monthInput.value) {
        const now = new Date();

        monthInput.value =
            now.getFullYear() + "-" +
            String(now.getMonth() + 1).padStart(2, "0");
    }

    // Restore the login session if available.
    const savedSession = getSavedSession();

    if (
        savedSession &&
        savedSession.email &&
        savedSession.role
    ) {
        currentUser = savedSession;
        openDashboard();
    } else {
        showAuthScreen("userLogin");
    }
});