
"use strict";

/* =========================================
   ROADALERT - CONFIGURATION
========================================= */

const USERS_KEY = "roadalert_users";
const AUTHORITIES_KEY = "roadalert_authorities";
const SESSION_KEY = "roadalert_session";

// Python backend address for local testing
const API_URL = "http://127.0.0.1:5000/api/reports";

let currentUser = null;
let currentLocation = null;


/* =========================================
   LOCAL STORAGE - USER ACCOUNTS
========================================= */

function readStorage(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Storage reading error:", error);
        return [];
    }
}

function writeStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("Storage saving error:", error);
        alert("Could not save account data.");
        return false;
    }
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
   BACKEND - ROAD REPORTS
========================================= */

// Read reports from Python database
async function getReports() {
    const response = await fetch(API_URL);

    if (!response.ok) {
        throw new Error("Could not load reports");
    }

    const data = await response.json();

    return data.map(report => ({
        id: report.id,
        incidentType: report.incident_type,
        incidentLocation: report.location,
        incidentDescription: report.description,
        date: report.created_at,
        status: report.status || "Pending",
        imageName: report.image || "",
        userName: report.user_name || "",
        userEmail: report.user_email || "",
        userType: report.user_type || "Passenger",
        verificationStatus: report.verification_status || "Unverified"
    }));
}


// Submit a report to Python backend
async function saveReportToBackend(report) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            incidentType: report.incidentType,
            location: report.incidentLocation,
            description: report.incidentDescription,
            image: report.imageName,
            userName: report.userName,
            userEmail: report.userEmail,
            userType: report.userType
        })
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || "Could not save report");
    }

    return result;
}


// Update report status in backend
async function updateReportInBackend(reportId, status) {
    const response = await fetch(
        `${API_URL}/${reportId}`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: status })
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || "Status update failed");
    }

    return result;
}


/* =========================================
   GENERAL HELPERS
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

    if (users.some(user => user.email.toLowerCase() === email)) {
        alert("This email is already registered.");
        return;
    }

    const account = {
        id: Date.now().toString(),
        name,
        email,
        password,
        userType: "Passenger"
    };

    users.push(account);

    if (writeStorage(USERS_KEY, users)) {
        event.target.reset();
        alert("Registration successful! Please log in.");
        showAuthScreen("userLogin");
    }
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

    // Demo-only registration code
    if (code !== "ROADALERT2026") {
        alert("Invalid authority registration code.");
        return;
    }

    const authorities = readStorage(AUTHORITIES_KEY);

    if (authorities.some(authority =>
        authority.email.toLowerCase() === email
    )) {
        alert("This authority email is already registered.");
        return;
    }

    const account = {
        id: Date.now().toString(),
        name,
        email,
        password
    };

    authorities.push(account);

    if (writeStorage(AUTHORITIES_KEY, authorities)) {
        event.target.reset();
        alert("Authority registration successful! Please log in.");
        showAuthScreen("authorityLogin");
    }
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

async function updateDashboard() {
    const total = getElement("totalReports");

    if (!total) return;

    try {
        const reports = await getReports();
        total.textContent = reports.length;
    } catch (error) {
        console.error(error);
        total.textContent = "Unavailable";
    }
}

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

    if (currentUser.role === "user" && pageId === "authority") {
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


/* =========================================
   USER TYPE
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
   IMAGE PREVIEW
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
   SUBMIT ROAD REPORT
========================================= */

async function submitReport(event) {
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

    const report = {
        incidentType: type,
        incidentLocation: location,
        incidentDescription: description,
        userName: currentUser.name,
        userEmail: currentUser.email,
        userType: currentUser.userType || "Passenger",
        imageName: ""
    };

    try {
        await saveReportToBackend(report);

        event.target.reset();

        const preview = getElement("incidentPreview");

        if (preview) {
            preview.innerHTML = "";
        }

        alert("Incident report submitted successfully!");

        await updateDashboard();
        await renderPassengerReports();

    } catch (error) {
        console.error("Report submission error:", error);
        alert("Could not submit report. Check your Python backend.");
    }
}


/* =========================================
   PASSENGER REPORTS
========================================= */

async function renderPassengerReports() {
    const container = getElement("passengerReports");

    if (!container || !currentUser) return;

    try {
        const reports = await getReports();

        const myReports = reports.filter(report =>
            report.userEmail &&
            report.userEmail.toLowerCase() ===
            currentUser.email.toLowerCase()
        );

        if (myReports.length === 0) {
            container.innerHTML =
                "<p>You have not submitted any reports yet.</p>";
            return;
        }

        container.innerHTML = myReports.map(report => `
            <article class="report-card">
                <h3>${escapeHTML(report.incidentType)}</h3>
                <p><strong>Report ID:</strong> ${escapeHTML(report.id)}</p>
                <p><strong>Location:</strong> ${escapeHTML(report.incidentLocation)}</p>
                <p><strong>Description:</strong> ${escapeHTML(report.incidentDescription)}</p>
                <p><strong>Date:</strong> ${escapeHTML(formatDate(report.date))}</p>
                <p><strong>Status:</strong> ${escapeHTML(report.status)}</p>
            </article>
        `).join("");

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p>Could not load reports.</p>";
    }
}


/* =========================================
   GPS LOCATION
========================================= */

function getGPSLocation() {
    const coordinates = getElement("gpsCoordinates");
    const map = getElement("gpsMap");

    if (!navigator.geolocation) {
        showMessage("gpsMessage", "GPS is not supported.", true);
        return;
    }

    showMessage("gpsMessage", "Getting your location...");

    navigator.geolocation.getCurrentPosition(
        position => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            currentLocation = { latitude, longitude };

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
                message = "Location permission denied.";
            } else if (error.code === 2) {
                message = "Location is unavailable.";
            } else if (error.code === 3) {
                message = "Location request timed out.";
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
   VERIFICATION REPORTS
========================================= */

async function renderVerificationReports() {
    const container = getElement("verificationReports");

    if (!container) return;

    try {
        const reports = await getReports();

        if (reports.length === 0) {
            container.innerHTML = "<p>No reports available.</p>";
            return;
        }

        container.innerHTML = reports.map(report => `
            <article class="report-card">
                <h3>${escapeHTML(report.incidentType)}</h3>
                <p><strong>Report ID:</strong> ${escapeHTML(report.id)}</p>
                <p><strong>Location:</strong> ${escapeHTML(report.incidentLocation)}</p>
                <p><strong>Status:</strong> ${escapeHTML(report.status)}</p>
                <p><strong>Verification:</strong> ${escapeHTML(report.verificationStatus)}</p>
            </article>
        `).join("");

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p>Could not load reports.</p>";
    }
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
        "Google Maps opened. Check traffic conditions there."
    );
}


/* =========================================
   MONTHLY REPORTS
========================================= */

async function renderMonthlyReport() {
    const monthInput = getElement("reportMonth");

    if (!monthInput || !monthInput.value) return;

    try {
        const month = monthInput.value;

        const reports = (await getReports()).filter(report =>
            report.date && report.date.slice(0, 7) === month
        );

        const pending = reports.filter(report =>
            report.status === "Pending"
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

    } catch (error) {
        console.error(error);
        alert("Could not load monthly reports.");
    }
}


/* =========================================
   AUTHORITY REPORT CARD
========================================= */

function authorityReportCard(report) {
    return `
        <article class="report-card">
            <h3>${escapeHTML(report.incidentType)}</h3>

            <p><strong>Report ID:</strong> ${escapeHTML(report.id)}</p>
            <p><strong>Reported by:</strong> ${escapeHTML(report.userName)}</p>
            <p><strong>User type:</strong> ${escapeHTML(report.userType)}</p>
            <p><strong>Location:</strong> ${escapeHTML(report.incidentLocation)}</p>
            <p><strong>Description:</strong> ${escapeHTML(report.incidentDescription)}</p>
            <p><strong>Date:</strong> ${escapeHTML(formatDate(report.date))}</p>
            <p><strong>Status:</strong> ${escapeHTML(report.status)}</p>

            <label for="status-${report.id}">Update status</label>

            <select
                id="status-${report.id}"
                onchange="updateReportStatus('${report.id}', this.value)"
            >
                <option value="Pending" ${report.status === "Pending" ? "selected" : ""}>
                    Pending
                </option>

                <option value="In Progress" ${report.status === "In Progress" ? "selected" : ""}>
                    In Progress
                </option>

                <option value="Resolved" ${report.status === "Resolved" ? "selected" : ""}>
                    Resolved
                </option>
            </select>
        </article>
    `;
}


/* =========================================
   AUTHORITY REPORTS
========================================= */

async function renderAuthorityReports() {
    try {
        const reports = await getReports();

        const pendingContainer = getElement("pendingReports");
        const resolvedContainer = getElement("resolvedReports");
        const allContainer = getElement("authorityReports");

        const pending = reports.filter(report =>
            report.status === "Pending"
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

    } catch (error) {
        console.error(error);
        alert("Could not load authority reports.");
    }
}


/* =========================================
   UPDATE REPORT STATUS
========================================= */

async function updateReportStatus(reportId, newStatus) {
    if (!currentUser || currentUser.role !== "authority") {
        alert("Only authorities can update report status.");
        return;
    }

    if (!["Pending", "In Progress", "Resolved"].includes(newStatus)) {
        alert("Invalid report status.");
        return;
    }

    try {
        await updateReportInBackend(reportId, newStatus);

        await renderAuthorityReports();
        await renderPassengerReports();
        await renderVerificationReports();
        await renderMonthlyReport();

        await updateDashboard();

        alert("Report status updated successfully!");

    } catch (error) {
        console.error(error);
        alert("Could not update report status.");
    }
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

    // Authentication navigation
    const showUserRegister = getElement("showUserRegister");
    const showAuthorityLogin = getElement("showAuthorityLogin");
    const showAuthorityRegister = getElement("showAuthorityRegister");

    if (showUserRegister) {
        showUserRegister.addEventListener("click", () =>
            showAuthScreen("userRegister")
        );
    }

    if (showAuthorityLogin) {
        showAuthorityLogin.addEventListener("click", () =>
            showAuthScreen("authorityLogin")
        );
    }

    if (showAuthorityRegister) {
        showAuthorityRegister.addEventListener("click", () =>
            showAuthScreen("authorityRegister")
        );
    }

    // Back buttons
    const backToUserLogin = getElement("backToUserLogin");
    const backFromRegister = getElement("backToUserLoginFromRegister");
    const backToAuthorityLogin = getElement("backToAuthorityLogin");

    if (backToUserLogin) {
        backToUserLogin.addEventListener("click", () =>
            showAuthScreen("userLogin")
        );
    }

    if (backFromRegister) {
        backFromRegister.addEventListener("click", () =>
            showAuthScreen("userLogin")
        );
    }

    if (backToAuthorityLogin) {
        backToAuthorityLogin.addEventListener("click", () =>
            showAuthScreen("authorityLogin")
        );
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

    // Report form
    const reportForm = getElement("reportForm");

    if (reportForm) {
        reportForm.addEventListener("submit", submitReport);
    }

    // Image preview
    const imageInput = getElement("incidentImage");

    if (imageInput) {
        imageInput.addEventListener("change", previewIncidentImage);
    }

    // User type
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

    // Set current month
    const monthInput = getElement("reportMonth");

    if (monthInput && !monthInput.value) {
        const now = new Date();

        monthInput.value =
            now.getFullYear() + "-" +
            String(now.getMonth() + 1).padStart(2, "0");
    }

    // Restore session
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
