const adminCredentials = {
  username: "admin",
  password: "admin123",
};

const dashboardCredentials = {
  username: "dashboard",
  password: "dash123",
};

const loginSection = document.getElementById("loginSection");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const adminPanel = document.getElementById("adminPanel");
const slotConfigForm = document.getElementById("slotConfigForm");
const adminMessage = document.getElementById("adminMessage");
const paymentConfigForm = document.getElementById("paymentConfigForm");
const carPerMinuteChargeInput = document.getElementById("carPerMinuteCharge");
const carMinimumEntryChargeInput = document.getElementById(
  "carMinimumEntryCharge"
);
const bikePerMinuteChargeInput = document.getElementById("bikePerMinuteCharge");
const bikeMinimumEntryChargeInput = document.getElementById(
  "bikeMinimumEntryCharge"
);
const suvPerMinuteChargeInput = document.getElementById("suvPerMinuteCharge");
const suvMinimumEntryChargeInput = document.getElementById(
  "suvMinimumEntryCharge"
);
const truckPerMinuteChargeInput = document.getElementById(
  "truckPerMinuteCharge"
);
const truckMinimumEntryChargeInput = document.getElementById(
  "truckMinimumEntryCharge"
);
const paymentMessage = document.getElementById("paymentMessage");
const reportsBtn = document.getElementById("reportsBtn");
const reportsSection = document.getElementById("reportsSection");
const reportFromDate = document.getElementById("reportFromDate");
const reportToDate = document.getElementById("reportToDate");
const applyReportFilterBtn = document.getElementById("applyReportFilterBtn");
const reportsMessage = document.getElementById("reportsMessage");
const reportsTotalAmount = document.getElementById("reportsTotalAmount");
const reportsTableBody = document.getElementById("reportsTableBody");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

const dashboardPanel = document.getElementById("dashboardPanel");
const dashboardMessage = document.getElementById("dashboardMessage");
const dashboardLogoutBtn = document.getElementById("dashboardLogoutBtn");
const dataInputBtn = document.getElementById("dataInputBtn");
const vehicleEntryForm = document.getElementById("vehicleEntryForm");
const entryMessage = document.getElementById("entryMessage");
const slotPanel = document.getElementById("slotPanel");
const slotGrid = document.getElementById("slotGrid");

const STORAGE_KEY = "smartParkingTotalSlots";
const REPORTS_STORAGE_KEY = "smartParkingReports";
const PAYMENT_STORAGE_KEY = "smartParkingPaymentConfig";
let parkingSlots = [];
let parkingReports = [];
let timerInterval = null;
let paymentConfig = {
  Car: { perMinuteCharge: 0, minimumEntryCharge: 0 },
  Bike: { perMinuteCharge: 0, minimumEntryCharge: 0 },
  SUV: { perMinuteCharge: 0, minimumEntryCharge: 0 },
  Truck: { perMinuteCharge: 0, minimumEntryCharge: 0 },
};

function getSavedSlotCount() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const parsed = Number(saved);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 0;
  }
  return parsed;
}

function loadReports() {
  const saved = localStorage.getItem(REPORTS_STORAGE_KEY);
  if (!saved) {
    parkingReports = [];
    return;
  }
  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      parkingReports = parsed;
      return;
    }
  } catch (error) {
    // Ignore invalid local storage data and reset.
  }
  parkingReports = [];
}

function saveReports() {
  localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(parkingReports));
}

function loadPaymentConfig() {
  const saved = localStorage.getItem(PAYMENT_STORAGE_KEY);
  if (!saved) {
    return;
  }
  try {
    const parsed = JSON.parse(saved);
    const types = ["Car", "Bike", "SUV", "Truck"];
    const nextConfig = {};
    let valid = true;
    types.forEach((type) => {
      const cfg = parsed[type];
      const perMinuteCharge = Number(cfg?.perMinuteCharge);
      const minimumEntryCharge = Number(cfg?.minimumEntryCharge);
      if (
        !Number.isFinite(perMinuteCharge) ||
        perMinuteCharge < 0 ||
        !Number.isFinite(minimumEntryCharge) ||
        minimumEntryCharge < 0
      ) {
        valid = false;
        return;
      }
      nextConfig[type] = {
        perMinuteCharge,
        minimumEntryCharge,
      };
    });
    if (valid) {
      paymentConfig = nextConfig;
    }
  } catch (error) {
    // Ignore invalid payment config in local storage.
  }
}

function savePaymentConfig() {
  localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(paymentConfig));
}

function showAdminMessage(text, isError = false) {
  adminMessage.textContent = text;
  adminMessage.style.color = isError ? "#b91c1c" : "#047857";
}

function showPaymentMessage(text, isError = false) {
  paymentMessage.textContent = text;
  paymentMessage.style.color = isError ? "#b91c1c" : "#047857";
}

function showReportsMessage(text, isError = false) {
  reportsMessage.textContent = text;
  reportsMessage.style.color = isError ? "#b91c1c" : "#047857";
}

function showReportsTotalAmount(text) {
  reportsTotalAmount.textContent = text;
  reportsTotalAmount.style.color = "#c7ffd8";
}

function showDashboardMessage(text, isError = false) {
  dashboardMessage.textContent = text;
  dashboardMessage.style.color = isError ? "#b91c1c" : "#047857";
}

function showEntryMessage(text, isError = false) {
  entryMessage.textContent = text;
  entryMessage.style.color = isError ? "#b91c1c" : "#047857";
}

function showLoginMessage(text, isError = false) {
  loginMessage.textContent = text;
  loginMessage.style.color = isError ? "#b91c1c" : "#047857";
}

function showLoginOnlyView() {
  loginSection.classList.remove("hidden");
  adminPanel.classList.add("hidden");
  dashboardPanel.classList.add("hidden");
  slotPanel.classList.add("hidden");
  vehicleEntryForm.classList.add("hidden");
  reportsSection.classList.add("hidden");
  showEntryMessage("");
  showReportsMessage("");
  showReportsTotalAmount("");
  stopTimer();
}

function showAdminView() {
  loginSection.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  dashboardPanel.classList.add("hidden");
  vehicleEntryForm.classList.add("hidden");
  reportsSection.classList.add("hidden");
  showEntryMessage("");
  showReportsMessage("");
  showReportsTotalAmount("");
  showPaymentMessage("");
  carPerMinuteChargeInput.value = String(paymentConfig.Car.perMinuteCharge);
  carMinimumEntryChargeInput.value = String(paymentConfig.Car.minimumEntryCharge);
  bikePerMinuteChargeInput.value = String(paymentConfig.Bike.perMinuteCharge);
  bikeMinimumEntryChargeInput.value = String(
    paymentConfig.Bike.minimumEntryCharge
  );
  suvPerMinuteChargeInput.value = String(paymentConfig.SUV.perMinuteCharge);
  suvMinimumEntryChargeInput.value = String(paymentConfig.SUV.minimumEntryCharge);
  truckPerMinuteChargeInput.value = String(paymentConfig.Truck.perMinuteCharge);
  truckMinimumEntryChargeInput.value = String(
    paymentConfig.Truck.minimumEntryCharge
  );
  stopTimer();
}

function showDashboardView() {
  loginSection.classList.add("hidden");
  dashboardPanel.classList.remove("hidden");
  adminPanel.classList.add("hidden");
  slotPanel.classList.remove("hidden");
  startTimer();
}

function initializeParkingSlots(totalSlots) {
  if (parkingSlots.length === totalSlots) {
    return;
  }
  parkingSlots = Array.from({ length: totalSlots }, (_, index) => ({
    slotNumber: index + 1,
    occupied: false,
    vehicleDetails: null,
  }));
}

function formatDuration(entryTimestamp) {
  const elapsed = Date.now() - entryTimestamp;
  const totalSeconds = Math.max(0, Math.floor(elapsed / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
    2,
    "0"
  );
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function formatDateTime(timestamp) {
  if (!timestamp) {
    return "-";
  }
  return new Date(timestamp).toLocaleString();
}

function formatAmount(amount) {
  return `Rs ${amount.toFixed(2)}`;
}

function calculateParkingCharge(entryTime, exitTime, vehicleType) {
  const elapsedMs = Math.max(0, exitTime - entryTime);
  const durationMinutes = Math.max(1, Math.ceil(elapsedMs / 60000));
  const vehiclePricing = paymentConfig[vehicleType] || {
    perMinuteCharge: 0,
    minimumEntryCharge: 0,
  };
  const byMinuteAmount = durationMinutes * vehiclePricing.perMinuteCharge;
  const payableAmount = Math.max(vehiclePricing.minimumEntryCharge, byMinuteAmount);
  return {
    durationMinutes,
    payableAmount,
  };
}

function isInSelectedRange(report) {
  if (!report.entryTime) {
    return false;
  }
  const from = reportFromDate.value ? new Date(reportFromDate.value) : null;
  const to = reportToDate.value ? new Date(reportToDate.value) : null;
  const entryDate = new Date(report.entryTime);

  if (from && entryDate < from) {
    return false;
  }
  if (to) {
    const toEnd = new Date(to);
    toEnd.setHours(23, 59, 59, 999);
    if (entryDate > toEnd) {
      return false;
    }
  }
  return true;
}

function renderReports() {
  const filteredReports = parkingReports.filter((report) =>
    isInSelectedRange(report)
  );
  const totalAmount = filteredReports.reduce((sum, report) => {
    if (typeof report.amountPaid === "number") {
      return sum + report.amountPaid;
    }
    return sum;
  }, 0);
  reportsTableBody.innerHTML = "";
  showReportsTotalAmount(`Total Amount: ${formatAmount(totalAmount)}`);

  if (filteredReports.length === 0) {
    showReportsMessage("No report records for selected date range.", true);
    return;
  }

  showReportsMessage(`Showing ${filteredReports.length} record(s).`);
  filteredReports.forEach((report) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${report.slotNumber}</td>
      <td>${report.vehicleNumber}</td>
      <td>${report.vehicleType}</td>
      <td>${report.priority}</td>
      <td>${formatDateTime(report.entryTime)}</td>
      <td>${formatDateTime(report.exitTime)}</td>
      <td>${report.durationMinutes || "-"}</td>
      <td>${
        typeof report.amountPaid === "number" ? formatAmount(report.amountPaid) : "-"
      }</td>
    `;
    reportsTableBody.appendChild(row);
  });
}

function buildOccupiedSlotMarkup(slot) {
  const details = slot.vehicleDetails;
  return `
    <div class="slot-title">Slot ${slot.slotNumber}</div>
    <div class="slot-meta">No: ${details.vehicleNumber}</div>
    <div class="slot-meta">Type: ${details.vehicleType}</div>
    <div class="slot-meta">Priority: ${details.priority}</div>
    <div class="slot-meta">Timer: ${formatDuration(details.entryTime)}</div>
    <button class="slot-small-btn" data-slot="${slot.slotNumber}">Exit</button>
  `;
}

function renderSlots(totalSlots) {
  initializeParkingSlots(totalSlots);
  slotGrid.innerHTML = "";
  for (let i = 1; i <= totalSlots; i += 1) {
    const slot = parkingSlots[i - 1];
    const slotBox = document.createElement("div");
    slotBox.className = `slot-box ${slot.occupied ? "occupied" : "available"}`;
    if (slot.occupied) {
      slotBox.innerHTML = buildOccupiedSlotMarkup(slot);
    } else {
      slotBox.innerHTML = `
        <div class="slot-title">Slot ${slot.slotNumber}</div>
        <div class="slot-meta">Available</div>
      `;
    }
    slotGrid.appendChild(slotBox);
  }
}

function findAvailableSlot() {
  for (let i = 0; i < parkingSlots.length; i += 1) {
    if (!parkingSlots[i].occupied) {
      return parkingSlots[i];
    }
  }
  return null;
}

function startTimer() {
  stopTimer();
  timerInterval = window.setInterval(() => {
    if (!dashboardPanel.classList.contains("hidden")) {
      const totalSlots = getSavedSlotCount();
      if (totalSlots > 0) {
        renderSlots(totalSlots);
      }
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval !== null) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
}

function handleSlotExit(slotNumber) {
  const slot = parkingSlots.find(
    (parkingSlot) => parkingSlot.slotNumber === slotNumber
  );
  if (!slot || !slot.occupied) {
    showEntryMessage("Slot already empty.", true);
    return;
  }
  const entryTime = slot.vehicleDetails.entryTime;
  const exitTime = Date.now();
  const billing = calculateParkingCharge(
    entryTime,
    exitTime,
    slot.vehicleDetails.vehicleType
  );

  slot.occupied = false;
  const activeReport = parkingReports
    .slice()
    .reverse()
    .find(
      (report) =>
        report.slotNumber === slotNumber &&
        report.vehicleNumber === slot.vehicleDetails.vehicleNumber &&
        !report.exitTime
    );
  if (activeReport) {
    activeReport.exitTime = exitTime;
    activeReport.durationMinutes = billing.durationMinutes;
    activeReport.amountPaid = billing.payableAmount;
    saveReports();
  }
  slot.vehicleDetails = null;
  showEntryMessage(
    `Exit done. Slot ${slotNumber} available. Duration: ${billing.durationMinutes} min. Amount: ${formatAmount(
      billing.payableAmount
    )}`
  );
  renderSlots(parkingSlots.length);
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (
    username === adminCredentials.username &&
    password === adminCredentials.password
  ) {
    showAdminView();
    showLoginMessage("Logged in as admin.");
    showAdminMessage("Admin login successful.");
    return;
  }

  if (
    username === dashboardCredentials.username &&
    password === dashboardCredentials.password
  ) {
    const totalSlots = getSavedSlotCount();
    if (totalSlots < 1) {
      showLoginMessage(
        "No parking slots assigned yet. Please login as admin first.",
        true
      );
      showLoginOnlyView();
      return;
    }

    showDashboardView();
    showLoginMessage("Logged in to dashboard.");
    showDashboardMessage("Dashboard login successful.");
    renderSlots(totalSlots);
    showEntryMessage("");
    return;
  }

  showLoginMessage("Invalid username or password.", true);
  showLoginOnlyView();
});

slotConfigForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const totalSlots = Number(document.getElementById("totalSlots").value);

  if (!Number.isInteger(totalSlots) || totalSlots < 1) {
    showAdminMessage("Please enter a valid slot count (minimum 1).", true);
    return;
  }

  localStorage.setItem(STORAGE_KEY, String(totalSlots));
  parkingSlots = [];
  showAdminMessage(`Saved: ${totalSlots} parking slots configured.`);
});

paymentConfigForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nextConfig = {
    Car: {
      perMinuteCharge: Number(carPerMinuteChargeInput.value),
      minimumEntryCharge: Number(carMinimumEntryChargeInput.value),
    },
    Bike: {
      perMinuteCharge: Number(bikePerMinuteChargeInput.value),
      minimumEntryCharge: Number(bikeMinimumEntryChargeInput.value),
    },
    SUV: {
      perMinuteCharge: Number(suvPerMinuteChargeInput.value),
      minimumEntryCharge: Number(suvMinimumEntryChargeInput.value),
    },
    Truck: {
      perMinuteCharge: Number(truckPerMinuteChargeInput.value),
      minimumEntryCharge: Number(truckMinimumEntryChargeInput.value),
    },
  };

  const hasInvalidValue = Object.values(nextConfig).some(
    (cfg) =>
      !Number.isFinite(cfg.perMinuteCharge) ||
      cfg.perMinuteCharge < 0 ||
      !Number.isFinite(cfg.minimumEntryCharge) ||
      cfg.minimumEntryCharge < 0
  );
  if (hasInvalidValue) {
    showPaymentMessage("Enter valid payment values.", true);
    return;
  }

  paymentConfig = nextConfig;
  savePaymentConfig();
  showPaymentMessage(
    `Saved type-wise charges (Car/Bike/SUV/Truck) successfully.`
  );
});

reportsBtn.addEventListener("click", () => {
  reportsSection.classList.toggle("hidden");
  if (!reportsSection.classList.contains("hidden")) {
    renderReports();
  }
});

applyReportFilterBtn.addEventListener("click", () => {
  if (
    reportFromDate.value &&
    reportToDate.value &&
    reportFromDate.value > reportToDate.value
  ) {
    showReportsMessage("From date cannot be after To date.", true);
    return;
  }
  renderReports();
});

dataInputBtn.addEventListener("click", () => {
  vehicleEntryForm.classList.toggle("hidden");
});

vehicleEntryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const vehicleNumber = document.getElementById("vehicleNumber").value.trim();
  const vehicleType = document.getElementById("vehicleType").value;
  const priority = document.getElementById("vehiclePriority").value;

  if (!vehicleNumber || !vehicleType || !priority) {
    showEntryMessage("Please enter all vehicle details.", true);
    return;
  }

  const availableSlot = findAvailableSlot();
  if (!availableSlot) {
    showEntryMessage("No slots available right now.", true);
    return;
  }

  availableSlot.occupied = true;
  availableSlot.vehicleDetails = {
    vehicleNumber,
    vehicleType,
    priority,
    entryTime: Date.now(),
  };
  parkingReports.push({
    slotNumber: availableSlot.slotNumber,
    vehicleNumber,
    vehicleType,
    priority,
    entryTime: availableSlot.vehicleDetails.entryTime,
    exitTime: null,
  });
  saveReports();

  renderSlots(parkingSlots.length);
  showEntryMessage(
    `Entry done. Assigned slot number: ${availableSlot.slotNumber}.`
  );
  vehicleEntryForm.reset();
  vehicleEntryForm.classList.add("hidden");
});

slotGrid.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  if (!target.classList.contains("slot-small-btn")) {
    return;
  }
  const slotNumber = Number(target.dataset.slot);
  if (!Number.isInteger(slotNumber)) {
    return;
  }
  handleSlotExit(slotNumber);
});

adminLogoutBtn.addEventListener("click", () => {
  showLoginOnlyView();
  showLoginMessage("Logged out.");
  loginForm.reset();
});

dashboardLogoutBtn.addEventListener("click", () => {
  showLoginOnlyView();
  showLoginMessage("Logged out.");
  loginForm.reset();
});

loadReports();
loadPaymentConfig();
