const API_URL = "http://localhost:5000/api/hazards";
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const SESSION_KEY = "roadalert_demo_session";
const USERS_KEY = "roadalert_demo_users";
function currentUser() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}
function updateAuthUI() {
  const user = currentUser();
  const nav = $("#siteNav");
  nav.style.display = user ? "flex" : "none";
  $("main").style.display = "block";
  if (!user) {
    $("main").querySelectorAll("section").forEach(section => section.classList.toggle("on", ["login","register"].includes(section.id) && section.id === "login"));
  }
  if (user) $("#reporterId").value = user.name || user.email;
}
function show(view) {
  if (!currentUser() && !["login","register"].includes(view)) view = "login";
  $$("main section").forEach(section => section.classList.toggle("on", section.id === view));
  $$("nav button[data-v]").forEach(button => button.setAttribute("aria-current", String(button.dataset.v === view)));
  if (view === "pass" || view === "rep" || view === "auth") loadRoadAlerts();
  window.scrollTo({top:0, behavior:"smooth"});
}
$$("nav button[data-v]").forEach(button => button.addEventListener("click", () => show(button.dataset.v)));
$$("[data-go]").forEach(button => button.addEventListener("click", () => show(button.dataset.go)));
$("#logoutButton").addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  updateAuthUI();
  show("login");
  toast("You have logged out.");
});

let toastTimer;
function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.style.display = "none", 3000);
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[character]);
}
function formatLabel(value) {
  return String(value ?? "").replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}
function lvl(element, count) {
  element.innerHTML = [1,2,3,4,5,6].map(level => `<i class="${level <= count ? "f" : ""}"></i>`).join("");
}
function setMessage(element, message, success=false) {
  element.textContent = message;
  element.style.color = success ? "var(--sign2)" : "var(--red)";
}

/* Hero message board: sample messages are demonstrations, not live alerts. */
const messages = [
  ["COMMUNITY ROAD ALERTS","Demo display · check saved reports below"],
  ["REPORT A ROAD PROBLEM","Add details and coordinates to help others"],
  ["CHECK BEFORE YOU TRAVEL","Community submissions may need verification"],
  ["ROAD SAFETY STARTS HERE","Share accurate information responsibly"]
];
let messageIndex = 0;
function updateMessageBoard() {
  $("#vms").innerHTML = `${messages[messageIndex][0]}<small>${messages[messageIndex][1]}</small>`;
  messageIndex = (messageIndex + 1) % messages.length;
}
updateMessageBoard();
setInterval(updateMessageBoard, 3500);

/* Decorative traffic animation. */
const road = $("#road");
const carColors = ["#ffc857","#e8e8d8","#7fc8a9","#ff5267","#8ab4f8"];
const cars = Array.from({length:14}, (_, index) => {
  const element = document.createElement("div");
  element.className = "car";
  element.style.background = carColors[index % carColors.length];
  element.style.top = index % 2 ? "50px" : "20px";
  road.appendChild(element);
  return {element, x:index*7 + Math.random()*5};
});
function animateCars() {
  const width = road.clientWidth || 600;
  cars.forEach(car => {
    const position = car.x / 100;
    const inJam = position > .5 && position < .78;
    car.x += inJam ? .04 : .28;
    if (car.x > 104) car.x = -4;
    car.element.style.left = `${car.x/100*width}px`;
  });
  requestAnimationFrame(animateCars);
}
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) animateCars();

/* Backend integration: GET saved hazards and render real database records. */
let cachedReports = [];
async function loadRoadAlerts() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    const reports = await response.json();
    if (!Array.isArray(reports)) throw new Error("Unexpected response from server");
    cachedReports = reports;

    $("#cnt").textContent = `${reports.length} saved report${reports.length === 1 ? "" : "s"}`;
    $("#reportList").innerHTML = reports.length ? reports.slice(0,5).map(report => `
      <article class="card" style="margin-bottom:10px">
        <h3>${escapeHTML(report.title)}</h3>
        <p>${escapeHTML(report.description || "No description provided.")}</p>
        <p class="muted">${escapeHTML(formatLabel(report.category))} · ${escapeHTML(formatLabel(report.severity))} severity</p>
      </article>
    `).join("") : "<p class='muted'>No saved reports yet.</p>";

    $("#passReports").innerHTML = reports.length ? reports.slice(0,12).map(report => `
      <article class="card">
        <h3>${escapeHTML(report.title)}</h3>
        <p>${escapeHTML(report.description || "No description provided.")}</p>
        <p class="muted">Category: ${escapeHTML(formatLabel(report.category))}</p>
        <p class="muted">Severity: ${escapeHTML(formatLabel(report.severity))} · Status: ${escapeHTML(formatLabel(report.status))}</p>
        <p class="muted">Location: ${escapeHTML(report.location?.address || `${report.location?.latitude ?? "N/A"}, ${report.location?.longitude ?? "N/A"}`)}</p>
      </article>
    `).join("") : "<div class='card'>No saved road reports yet. Use the Report page to submit one.</div>";

    const categories = {};
    reports.forEach(report => {
      const category = report.category || "other";
      categories[category] = (categories[category] || 0) + 1;
    });
    const sortedCategories = Object.entries(categories).sort((a,b) => b[1]-a[1]);
    $("#mt").innerHTML = sortedCategories.length
      ? sortedCategories.map(([category,count]) => `<tr><td>${escapeHTML(formatLabel(category))}</td><td>${count}</td></tr>`).join("")
      : "<tr><td colspan='2'>No saved reports yet</td></tr>";

    $("#authMessage").textContent = `${reports.length} report(s) retrieved from the backend. Counts reflect saved reports, not official verified statistics.`;
  } catch (error) {
    console.error("Could not load road reports:", error);
    $("#reportList").innerHTML = "<p class='muted'>Could not load reports. Start the backend and refresh.</p>";
    $("#passReports").innerHTML = "<div class='card'>Unable to connect to the backend at localhost:5000. Start the server, then refresh.</div>";
    $("#authMessage").textContent = "Could not load data. Check that the backend is running.";
  }
}
$("#refreshReports").addEventListener("click", loadRoadAlerts);
$("#gen").addEventListener("click", async () => {
  await loadRoadAlerts();
  toast("Authority summary refreshed from saved reports.");
});

/* Road incident report: sends a document to Express/MongoDB. */
const categoryMap = {
  "Accident":"other", "Road repair":"damaged_road", "Flood":"unsafe_area",
  "Landslide":"unsafe_area", "Festival":"other", "Strike":"other",
  "VIP movement":"other", "Heavy traffic":"other", "Road closed":"damaged_road",
  "Streetlight":"streetlight", "Other":"other"
};
$("#submit").addEventListener("click", async () => {
  const selectedValue = $("#reportType").value;
  const title = $("#reportTitle").value.trim();
  const reporter = $("#reporterId").value.trim();
  const address = $("#reportAddress").value.trim();
  const latitudeText = $("#reportLat").value.trim();
  const longitudeText = $("#reportLng").value.trim();
  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);
  const message = $("#reportMessage");

  if (!selectedValue || !title || !reporter || !address) {
    setMessage(message, "Please complete the problem type, title, location/address, and reporter name.");
    return;
  }
  const hasLatitude = latitudeText !== "";
  const hasLongitude = longitudeText !== "";
  if (hasLatitude !== hasLongitude) {
    setMessage(message, "Enter both latitude and longitude, or leave both blank to save the address only.");
    return;
  }
  if (hasLatitude && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
    setMessage(message, "Enter valid latitude (−90 to 90) and longitude (−180 to 180).");
    return;
  }

  const description = $("#reportDescription").value.trim();
  const location = {address};
  if (hasLatitude && hasLongitude) {
    location.latitude = latitude;
    location.longitude = longitude;
  }
  const payload = {
    title,
    description,
    category: categoryMap[selectedValue] || "other",
    severity: $("#reportSeverity").value,
    location,
    reportedBy: reporter
  };
  const button = $("#submit");
  button.disabled = true;
  button.textContent = "Submitting…";
  setMessage(message, "");

  try {
    const response = await fetch(API_URL, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || `Request failed (${response.status})`);

    setMessage(message, "Report saved successfully in the database.", true);
    $("#reportTitle").value = "";
    $("#reportDescription").value = "";
    $("#reportAddress").value = "";
    $("#reportLat").value = "";
    $("#reportLng").value = "";
    $("#reportType").value = "";
    $("#reportPhoto").value = "";
    await loadRoadAlerts();
    toast("Road report saved!");
  } catch (error) {
    console.error("Report submission failed:", error);
    setMessage(message, `${error.message}. Make sure node server.js is running.`);
  } finally {
    button.disabled = false;
    button.textContent = "Submit report";
  }
});

/* Optional location button. Browser permission is required. */
$("#getLocation").addEventListener("click", () => {
  if (!navigator.geolocation) {
    toast("Location is not supported by this browser.");
    return;
  }
  const button = $("#getLocation");
  button.disabled = true;
  button.textContent = "Getting location…";
  navigator.geolocation.getCurrentPosition(position => {
    $("#reportLat").value = position.coords.latitude.toFixed(6);
    $("#reportLng").value = position.coords.longitude.toFixed(6);
    $("#reportAddress").value = `Device location (${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)})`;
    $("#locationStatus").textContent = "Device coordinates added. You can edit the address if you know the place name.";
    button.disabled = false;
    button.textContent = "📍 Use my location";
    toast("Coordinates filled in.");
  }, error => {
    console.warn("Location permission/error:", error);
    button.disabled = false;
    button.textContent = "📍 Use my location";
    $("#locationStatus").textContent = "Could not access device location. Enter an address and coordinates manually.";
    toast("Location unavailable. Enter coordinates manually.");
  }, {enableHighAccuracy:true, timeout:10000});
});

/* Voice input: use browser speech recognition only if supported. */
$("#voice").addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    toast("Voice input is not supported in this browser. Type the description instead.");
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.onresult = event => {
    const transcript = event.results[0][0].transcript;
    $("#reportDescription").value = ($("#reportDescription").value + " " + transcript).trim();
    toast("Voice description added.");
  };
  recognition.onerror = () => toast("Voice input could not be captured. Try typing instead.");
  recognition.start();
});

/* Passenger demo actions: never claim a real route or emergency service is active. */
/* Passenger route planner */
const ROUTE_API_URL = "http://localhost:5000/api/routes";

let passengerRoutes = [];
let activeRouteIndex = 0;

function setPassengerText(id, message) {
  const element = document.getElementById(id);
  if (element) element.textContent = message;
}

function renderRouteSummary(route) {
  setPassengerText("routeDistance",
    route.distance != null ? `${route.distance} km` : "Unavailable");

  setPassengerText("routeDuration",
    route.duration != null ? `${route.duration} min` : "Unavailable");

  setPassengerText("routeIncidentCount",
    route.incidentCount != null ? route.incidentCount : "Unavailable");

  setPassengerText(
    "routeNote",
    "Route information depends on the routing service and available community reports. Verify conditions before travelling."
  );
}

function renderAlternativeRoutes() {
  const container = document.getElementById("alternativeRoutes");
  if (!container) return;

  if (!passengerRoutes.length) {
    container.textContent = "No alternative routes available.";
    return;
  }

  container.innerHTML = passengerRoutes.map((route, index) => `
    <button
      type="button"
      class="btn ${index === activeRouteIndex ? "" : "alt"}"
      data-route-index="${index}"
      style="margin:5px"
    >
      Route ${index + 1}
      ${route.distance != null ? `· ${escapeHTML(route.distance)} km` : ""}
    </button>
  `).join("");

  container.querySelectorAll("[data-route-index]").forEach(button => {
    button.addEventListener("click", () => {
      activeRouteIndex = Number(button.dataset.routeIndex);
      renderRouteSummary(passengerRoutes[activeRouteIndex]);
      renderAlternativeRoutes();
    });
  });
}

function renderMapLink(from, to) {
  const container = document.getElementById("routeMap");
  if (!container) return;

  const link = document.createElement("a");
  link.href =
    "https://www.google.com/maps/dir/" +
    encodeURIComponent(from) + "/" +
    encodeURIComponent(to);

  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Open directions in Google Maps";
  link.className = "btn";
  container.replaceChildren(link);
}

async function findPassengerRoutes() {
  const from = document.getElementById("from")?.value.trim();
  const to = document.getElementById("to")?.value.trim();

  const alertBox = document.getElementById("alertbox");
  if (alertBox) alertBox.style.display = "block";

  if (!from || !to) {
    setPassengerText("routeMessage", "Please enter both starting point and destination.");
    return;
  }

  const startButton = document.getElementById("start");
  if (startButton) {
    startButton.disabled = true;
    startButton.textContent = "Finding routes...";
  }

  setPassengerText("routeMessage", "Loading saved reports and requesting route details...");
  setPassengerText("passSummary", "Checking available community reports...");

  try {
    await loadRoadAlerts();

    setPassengerText(
      "passSummary",
      `${cachedReports.length} saved community report(s) loaded. Reports may not be verified or located directly along your route.`
    )

    
function renderMapLink(from, to) {
  const container = document.getElementById("routeMap");
  if (!container) return;

  const map = document.createElement("iframe");

  const mapUrl = new URL("https://maps.google.com/maps");
  mapUrl.searchParams.set("output", "embed");
  mapUrl.searchParams.set("saddr", from);
  mapUrl.searchParams.set("daddr", to);

  map.src = mapUrl.toString();
  map.title = `Route from ${from} to ${to}`;
  map.width = "100%";
  map.height = "400";
  map.style.border = "0";
  map.style.borderRadius = "16px";
  map.loading = "lazy";
  map.allowFullscreen = true;

  container.replaceChildren(map);
  container.style.display = "block";
}
const from = document.getElementById("from").value.trim();
const to = document.getElementById("to").value.trim();

if (!from || !to) {
  alert("Please enter both starting point and destination.");
  return;
}

renderMapLink(from, to);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `Route request failed (${response.status})`);
    }

    if (!Array.isArray(result.routes) || result.routes.length === 0) {
      throw new Error("The routing service returned no routes.");
    }

    passengerRoutes = result.routes;
    activeRouteIndex = 0;

    renderRouteSummary(passengerRoutes[activeRouteIndex]);
    renderAlternativeRoutes();

    setPassengerText(
      "routeMessage",
      "Route results loaded. Check the route details and verify current road conditions before travelling."
    );

    setPassengerText(
      "routeSummary",
      `${passengerRoutes.length} route option(s) returned for ${from} to ${to}.`
    );
  } catch (error) {
    console.error("Passenger route error:", error);

    passengerRoutes = [];
    activeRouteIndex = 0;

    setPassengerText("routeDistance", "Unavailable");
    setPassengerText("routeDuration", "Unavailable");
    setPassengerText("routeIncidentCount", "Unavailable");
    setPassengerText("routeSummary", "No route results available.");
    setPassengerText(
      "routeMessage",
      "Could not load route details. Check that your backend is running and the POST /api/routes endpoint is implemented."
    );

    const alternatives = document.getElementById("alternativeRoutes");
    if (alternatives) alternatives.textContent = "Alternative routes unavailable.";

    setPassengerText(
      "routeNote",
      "Directions can be opened in Google Maps, but this page could not calculate route details."
    );
  } finally {
    if (startButton) {
      startButton.disabled = false;
      startButton.textContent = "Find routes";
    }
  }
}

document.getElementById("start")?.addEventListener("click", findPassengerRoutes);

document.getElementById("avoid")?.addEventListener("click", () => {
  if (passengerRoutes.length > 1) {
    activeRouteIndex = (activeRouteIndex + 1) % passengerRoutes.length;
    renderRouteSummary(passengerRoutes[activeRouteIndex]);
    renderAlternativeRoutes();
  } else {
    setPassengerText(
      "routeMessage",
      "No alternative route is available yet. Find routes first."
    );
  }
});



/* Employee Travel Dashboard */

const employeeTravelForm =
  document.getElementById("employeeTravelForm");

const employeeTable = document.getElementById("et");
const employeeDetails = document.getElementById("ev");
const employeeAlerts = document.getElementById("employeeRoadAlerts");

let employeeJourneys = JSON.parse(
  localStorage.getItem("employeeJourneys") || "[]"
);

function escapeEmployeeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function renderEmployeeJourneys() {
  if (!employeeTable) return;

  employeeTable.innerHTML = employeeJourneys.map((journey, index) => `
    <tr data-journey-index="${index}" style="cursor:pointer">
      <td>${escapeEmployeeHtml(journey.name)}</td>
      <td>${escapeEmployeeHtml(journey.from)} → ${escapeEmployeeHtml(journey.to)}</td>
      <td>${escapeEmployeeHtml(journey.status)}</td>
      <td>Not available</td>
      <td>User entry</td>
    </tr>
  `).join("");

  if (employeeJourneys.length === 0) {
    employeeTable.innerHTML =
      '<tr><td colspan="5">No employee journeys added yet.</td></tr>';
  }
}

function showEmployeeRoadAlerts(journey) {
  if (!employeeAlerts) return;

  // Use the existing road reports already loaded by your app.
  const reports = Array.isArray(cachedReports) ? cachedReports : [];

  const routeWords = [journey.from, journey.to]
    .join(" ")
    .toLowerCase()
    .split(/[\s,–—-]+/)
    .filter(word => word.length > 2);

  const matches = reports.filter(report => {
    const location = typeof report.location === "string"
      ? report.location
      : report.location?.address || "";

    const reportText = [
      location,
      report.title,
      report.description,
      report.category
    ].join(" ").toLowerCase();

    return routeWords.some(word => reportText.includes(word));
  });

  if (matches.length === 0) {
    employeeAlerts.textContent =
      "No matching reports found. This does not guarantee that the route is clear.";
    return;
  }

  employeeAlerts.innerHTML = matches.map(report => {
    const location = typeof report.location === "string"
      ? report.location
      : report.location?.address || "Location not specified";

    return `
      <div class="employee-alert-item">
        <strong>${escapeEmployeeHtml(report.title || report.category || "Road incident")}</strong>
        <p>${escapeEmployeeHtml(location)}</p>
        <p>${escapeEmployeeHtml(report.severity || "Severity not specified")}</p>
      </div>
    `;
  }).join("");
}

if (employeeTravelForm) {
  employeeTravelForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const journey = {
      id: Date.now(),
      name: document.getElementById("employeeName").value.trim(),
      from: document.getElementById("travelFrom").value.trim(),
      to: document.getElementById("travelTo").value.trim(),
      mode: document.getElementById("travelMode").value,
      status: document.getElementById("travelStatus").value
    };

    if (!journey.name || !journey.from || !journey.to) {
      alert("Please enter the employee name and journey details.");
      return;
    }

    employeeJourneys.push(journey);
    localStorage.setItem(
      "employeeJourneys",
      JSON.stringify(employeeJourneys)
    );

    renderEmployeeJourneys();
    showEmployeeRoadAlerts(journey);

    employeeTravelForm.reset();
    alert("Employee journey added successfully!");
  });
}

if (employeeTable) {
  employeeTable.addEventListener("click", function(event) {
    const row = event.target.closest("tr[data-journey-index]");
    if (!row) return;

    const journey = employeeJourneys[
      Number(row.dataset.journeyIndex)
    ];
    if (!journey || !employeeDetails) return;

    employeeDetails.textContent =
      `Employee: ${journey.name} | ` +
      `Route: ${journey.from} to ${journey.to} | ` +
      `Mode: ${journey.mode} | Status: ${journey.status}`;

    showEmployeeRoadAlerts(journey);
  });
}

renderEmployeeJourneys();
/* Illustrative chart; saved category table below is populated from MongoDB. */
const demoMonthly = [["Jan",8],["Feb",11],["Mar",14],["Apr",19],["May",17]];
$("#ch").innerHTML = demoMonthly.map((item,index) => `
  <rect x="${18+index*60}" y="${140-item[1]*6.5}" width="40" height="${item[1]*6.5}" fill="${item[1]>=17 ? "#ff5267" : "#20e3a2"}" rx="3"></rect>
  <text x="${38+index*60}" y="${134-item[1]*6.5}" font-size="12" text-anchor="middle" fill="#dce5ef">${item[1]}</text>
  <text x="${38+index*60}" y="160" font-size="12" text-anchor="middle" fill="#dce5ef">${item[0]}</text>
`).join("");

/* Prototype authentication: accounts are stored in this browser only.
   Do not use real passwords; production authentication belongs on the server. */
async function passwordHash(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2,"0")).join("");
}
function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); }
  catch { return []; }
}
$("#loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  const email = $("#loginEmail").value.trim().toLowerCase();
  const password = $("#loginPassword").value;
  const user = getUsers().find(item => item.email === email);
  if (!user || user.passwordHash !== await passwordHash(password)) {
    setMessage($("#loginMessage"), "Email or password is incorrect. Register first if you do not have an account.");
    return;
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({name:user.name, email:user.email, role:user.role}));
  updateAuthUI();
  show("home");
  toast(`Welcome to RoadAlert, ${user.name}!`);
});
$("#registerForm").addEventListener("submit", async event => {
  event.preventDefault();
  const name = $("#regName").value.trim();
  const email = $("#regEmail").value.trim().toLowerCase();
  const role = $("#regRole").value;
  const password = $("#regPassword").value;
  const confirmation = $("#regConfirm").value;
  if (password.length < 8) {
    setMessage($("#registerMessage"), "Use at least 8 characters for the password."); return;
  }
  if (password !== confirmation) {
    setMessage($("#registerMessage"), "Passwords do not match."); return;
  }
  const users = getUsers();
  if (users.some(item => item.email === email)) {
    setMessage($("#registerMessage"), "An account with this email already exists. Please log in."); return;
  }
  users.push({name, email, role, passwordHash: await passwordHash(password)});
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({name, email, role}));
  updateAuthUI();
  show("home");
  toast("Account created in this browser. Welcome to RoadAlert!");
});

/* Start with login/register only. Home and other sections require a session. */
updateAuthUI();
if (currentUser()) show("home"); else show("login");
loadRoadAlerts();
