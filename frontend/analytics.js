
const API_URL = "http://localhost:5000/api";
const CURRENT_USER_KEY = "currentuser";

// Latest data fetched from the backend.
// CSV exports use these same arrays.
let productsData = [];
let slotsData = [];

let categoryChartInstance = null;
let allocationChartInstance = null;
let slotUtilizationChartInstance = null;

let analyticsLoading = false;

// ==========================================
// CURRENT USER
// ==========================================

function getCurrentUser() {
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);

    if (!savedUser) {
        window.location.href = "login.html";
        return null;
    }

    try {
        const user = JSON.parse(savedUser);

        if (!user || !user.email) {
            throw new Error("User email is missing.");
        }

        return user;
    } catch (error) {
        console.error("Invalid current user:", error);
        localStorage.removeItem(CURRENT_USER_KEY);
        window.location.href = "login.html";
        return null;
    }
}

// ==========================================
// API REQUEST
// ==========================================

async function apiRequest(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`);

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error("The backend returned an invalid response.");
    }

    if (!response.ok || result.success === false) {
        throw new Error(
            result.message || `Request failed with status ${response.status}.`
        );
    }

    return result;
}

// ==========================================
// FETCH PRODUCTS AND SLOTS FROM MONGODB
// ==========================================

async function fetchAnalyticsData(userEmail) {
    const email = encodeURIComponent(userEmail);

    const [productsResult, slotsResult] = await Promise.all([
        apiRequest(`/products?userEmail=${email}`),
        apiRequest(`/slots?userEmail=${email}`)
    ]);

    if (!Array.isArray(productsResult.data)) {
        throw new Error("The products API did not return a data array.");
    }

    if (!Array.isArray(slotsResult.data)) {
        throw new Error("The slots API did not return a data array.");
    }

    // Extra client-side filtering ensures only this user's records
    // are displayed, even if the API returns unexpected records.
    const normalizedEmail = userEmail.trim().toLowerCase();

    return {
        products: productsResult.data.filter(
            product =>
                String(product.userEmail || "").trim().toLowerCase() ===
                normalizedEmail
        ),
        slots: slotsResult.data.filter(
            slot =>
                String(slot.userEmail || "").trim().toLowerCase() ===
                normalizedEmail
        )
    };
}

// ==========================================
// GENERAL HELPERS
// ==========================================

function setValue(elementId, value) {
    const element = document.getElementById(elementId);

    if (element) {
        element.textContent = value;
    }
}

function getNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function getQuantity(product) {
    return Math.max(0, getNumber(product.quantity));
}

function getAllocatedQuantity(product) {
    return Math.min(
        getQuantity(product),
        Math.max(0, getNumber(product.allocatedQuantity))
    );
}

function getRemainingQuantity(product) {
    return Math.max(
        getQuantity(product) - getAllocatedQuantity(product),
        0
    );
}

function getSlotCapacity(slot) {
    return Math.max(0, getNumber(slot.volume));
}

function getSlotUsedVolume(slot) {
    return Math.min(
        getSlotCapacity(slot),
        Math.max(0, getNumber(slot.usedVolume))
    );
}

function getSlotUtilization(slot) {
    const capacity = getSlotCapacity(slot);

    if (capacity <= 0) {
        return 0;
    }

    return Math.min(
        100,
        (getSlotUsedVolume(slot) / capacity) * 100
    );
}

function getSlotState(slot) {
    return (
        getSlotUsedVolume(slot) > 0 ||
        Boolean(slot.productId) ||
        Boolean(slot.productName) ||
        getNumber(slot.productQuantity) > 0
    ) ? "Occupied" : "Empty";
}

function formatVolume(value) {
    return `${getNumber(value).toLocaleString(undefined, {
        maximumFractionDigits: 2
    })} cm³`;
}

function showPageMessage(message, isError = false) {
    let element = document.getElementById("analyticsPageMessage");

    if (!element) {
        element = document.createElement("p");
        element.id = "analyticsPageMessage";
        element.setAttribute("role", "status");

        const main = document.querySelector("main");

        if (main) {
            main.prepend(element);
        }
    }

    element.textContent = message;
    element.style.color = isError ? "#dc2626" : "#475569";
    element.style.padding = "10px 0";
}

function clearPageMessage() {
    const element = document.getElementById("analyticsPageMessage");

    if (element) {
        element.remove();
    }
}

function setRefreshLoading(loading) {
    const button = document.getElementById("refreshAnalytics");

    if (!button) {
        return;
    }

    button.disabled = loading;
    button.textContent = loading
        ? "Loading analytics..."
        : "🔄 Refresh Analytics Data";
}

// ==========================================
// LOAD ANALYTICS
// ==========================================

async function loadAnalytics() {
    if (analyticsLoading) {
        return;
    }

    const currentUser = getCurrentUser();

    if (!currentUser) {
        return;
    }

    analyticsLoading = true;
    setRefreshLoading(true);
    showPageMessage("Loading the latest warehouse data...");

    const welcomeUser = document.getElementById("welcomeUser");

    if (welcomeUser) {
        welcomeUser.textContent = `Welcome, ${currentUser.name || currentUser.email}`;
    }

    try {
        const data = await fetchAnalyticsData(currentUser.email);

        productsData = data.products;
        slotsData = data.slots;

        displayAllocationAnalysis(productsData);
        displayProductCharacteristics(productsData);

        displaySlotAnalysis(slotsData, "Large");
        displaySlotAnalysis(slotsData, "Medium");
        displaySlotAnalysis(slotsData, "Small");
        displaySlotAnalysis(slotsData, "Custom");

        displaySpaceAnalysis(slotsData);
        displayPendingProducts(productsData);
        generateInsights(productsData, slotsData);

        displayCategoryChart(productsData);
        displayAllocationChart(productsData);
        displaySlotUtilizationChart(slotsData);

        clearPageMessage();

        console.log("Analytics loaded from backend.", {
            productCount: productsData.length,
            slotCount: slotsData.length
        });
    } catch (error) {
        console.error("Failed to load analytics:", error);

        showPageMessage(
            `Could not load analytics: ${error.message}. Make sure the backend is running and try refreshing.`,
            true
        );
    } finally {
        analyticsLoading = false;
        setRefreshLoading(false);
    }
}

// ==========================================
// PRODUCT ALLOCATION SUMMARY
// Values represent individual product units.
// ==========================================

function getAllocationTotals(products) {
    let allocated = 0;
    let pending = 0;
    let notAllocated = 0;

    products.forEach(product => {
        const quantity = getQuantity(product);
        const assigned = getAllocatedQuantity(product);
        const remaining = Math.max(quantity - assigned, 0);

        allocated += assigned;

        if (assigned === 0) {
            notAllocated += remaining;
        } else if (remaining > 0) {
            pending += remaining;
        }
    });

    return { allocated, pending, notAllocated };
}

function displayAllocationAnalysis(products) {
    const totals = getAllocationTotals(products);

    setValue("allocatedProducts", totals.allocated);
    setValue("pendingProducts", totals.pending);
    setValue("notAllocatedProducts", totals.notAllocated);
}

// ==========================================
// PRODUCT CHARACTERISTICS
// ==========================================

function displayProductCharacteristics(products) {
    let fragile = 0;
    let nonFragile = 0;
    let totalWeight = 0;

    products.forEach(product => {
        const quantity = getQuantity(product);
        const fragileValue = String(product.fragile || "").toLowerCase();

        if (fragileValue === "yes" || fragileValue === "true") {
            fragile += quantity;
        } else {
            nonFragile += quantity;
        }

        // Assumes product.weight is the weight of one unit.
        totalWeight += quantity * Math.max(0, getNumber(product.weight));
    });

    setValue("fragileProducts", fragile);
    setValue("nonFragileProducts", nonFragile);
    setValue("inventoryWeight", `${totalWeight.toFixed(2)} kg`);
}

// ==========================================
// SLOT SIZE ANALYSIS
// ==========================================

function displaySlotAnalysis(slots, size) {
    const sizeSlots = slots.filter(
        slot => String(slot.size || "").toLowerCase() === size.toLowerCase()
    );

    const total = sizeSlots.length;
    const occupied = sizeSlots.filter(
        slot => getSlotState(slot) === "Occupied"
    ).length;
    const empty = total - occupied;

    const capacity = sizeSlots.reduce(
        (sum, slot) => sum + getSlotCapacity(slot),
        0
    );

    const used = sizeSlots.reduce(
        (sum, slot) => sum + getSlotUsedVolume(slot),
        0
    );

    const utilization = capacity > 0
        ? Math.min(100, (used / capacity) * 100)
        : 0;

    const prefix = size.toLowerCase();

    setValue(`${prefix}Total`, total);
    setValue(`${prefix}Occupied`, occupied);
    setValue(`${prefix}Empty`, empty);
    setValue(`${prefix}Utilization`, `${utilization.toFixed(1)}%`);

    const progress = document.getElementById(`${prefix}Progress`);

    if (progress) {
        progress.style.width = `${utilization}%`;
        progress.setAttribute("role", "progressbar");
        progress.setAttribute("aria-valuemin", "0");
        progress.setAttribute("aria-valuemax", "100");
        progress.setAttribute("aria-valuenow", utilization.toFixed(1));
    }
}

// ==========================================
// TOTAL WAREHOUSE SPACE
// ==========================================

function displaySpaceAnalysis(slots) {
    const totalVolume = slots.reduce(
        (sum, slot) => sum + getSlotCapacity(slot),
        0
    );

    const usedVolume = slots.reduce(
        (sum, slot) => sum + getSlotUsedVolume(slot),
        0
    );

    const availableVolume = Math.max(totalVolume - usedVolume, 0);

    setValue("usedVolume", formatVolume(usedVolume));
    setValue("availableVolume", formatVolume(availableVolume));

    const sizes = ["Large", "Medium", "Small", "Custom"];
    let mostUtilized = "-";
    let highestUtilization = -1;

    sizes.forEach(size => {
        const matchingSlots = slots.filter(
            slot => String(slot.size || "").toLowerCase() === size.toLowerCase()
        );

        const capacity = matchingSlots.reduce(
            (sum, slot) => sum + getSlotCapacity(slot),
            0
        );

        const used = matchingSlots.reduce(
            (sum, slot) => sum + getSlotUsedVolume(slot),
            0
        );

        if (capacity > 0) {
            const utilization = (used / capacity) * 100;

            if (utilization > highestUtilization) {
                highestUtilization = utilization;
                mostUtilized = size;
            }
        }
    });

    setValue("mostUtilizedSlot", mostUtilized);
}

// ==========================================
// PENDING PRODUCTS
// ==========================================

function displayPendingProducts(products) {
    const container = document.getElementById("pendingProductList");

    if (!container) {
        return;
    }

    container.replaceChildren();

    const pendingProducts = products.filter(
        product => getRemainingQuantity(product) > 0
    );

    if (pendingProducts.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-message";
        message.textContent = "No pending products.";
        container.appendChild(message);
        return;
    }

    pendingProducts.forEach(product => {
        const item = document.createElement("div");
        item.className = "pending-product";

        const details = document.createElement("div");

        const name = document.createElement("strong");
        name.className = "pending-product-name";
        name.textContent = product.name || "Unnamed product";

        const category = document.createElement("p");
        category.className = "pending-product-details";
        category.textContent = `Category: ${product.category || "Other"}`;

        details.append(name, category);

        const status = document.createElement("div");
        status.className = "pending-product-status";
        status.textContent = `${getRemainingQuantity(product)} remaining`;

        item.append(details, status);
        container.appendChild(item);
    });
}

// ==========================================
// WAREHOUSE INSIGHTS
// ==========================================

function generateInsights(products, slots) {
    const container = document.getElementById("warehouseInsights");

    if (!container) {
        return;
    }

    container.replaceChildren();

    const insights = [];

    if (products.length === 0 && slots.length === 0) {
        const card = document.createElement("div");
        card.className = "insight-card";

        const title = document.createElement("strong");
        title.textContent = "No insights available";

        const description = document.createElement("p");
        description.textContent = "Add products and warehouse slots to generate insights.";

        card.append(title, description);
        container.appendChild(card);
        return;
    }

    const totalVolume = slots.reduce(
        (sum, slot) => sum + getSlotCapacity(slot),
        0
    );

    const usedVolume = slots.reduce(
        (sum, slot) => sum + getSlotUsedVolume(slot),
        0
    );

    const utilization = totalVolume > 0
        ? (usedVolume / totalVolume) * 100
        : 0;

    if (totalVolume === 0) {
        insights.push({
            title: "No slot capacity available",
            text: "Add warehouse slots to calculate space utilization."
        });
    } else if (utilization >= 80) {
        insights.push({
            title: "Warehouse is highly utilized",
            text: "Your warehouse is using at least 80% of its total volume."
        });
    } else if (utilization >= 50) {
        insights.push({
            title: "Warehouse utilization is moderate",
            text: "Your warehouse is using between 50% and 80% of its total volume."
        });
    } else {
        insights.push({
            title: "Warehouse has available space",
            text: "A significant amount of warehouse volume is still available."
        });
    }

    const pendingQuantity = products.reduce(
        (sum, product) => sum + getRemainingQuantity(product),
        0
    );

    if (pendingQuantity > 0) {
        insights.push({
            title: "Pending allocation detected",
            text: `${pendingQuantity} product unit(s) still require warehouse space.`
        });
    } else if (products.length > 0) {
        insights.push({
            title: "All products allocated",
            text: "All current product quantities are marked as allocated."
        });
    }

    const emptySlots = slots.filter(
        slot => getSlotState(slot) === "Empty"
    ).length;

    if (emptySlots > 0) {
        insights.push({
            title: "Empty slots available",
            text: `${emptySlots} warehouse slot(s) are currently empty.`
        });
    }

    let mostUtilizedSlot = null;
    let highestSlotUtilization = -1;

    slots.forEach(slot => {
        const capacity = getSlotCapacity(slot);

        if (capacity <= 0) {
            return;
        }

        const slotUtilization = getSlotUtilization(slot);

        if (slotUtilization > highestSlotUtilization) {
            highestSlotUtilization = slotUtilization;
            mostUtilizedSlot = slot;
        }
    });

    if (mostUtilizedSlot) {
        insights.push({
            title: "Most utilized slot",
            text: `${mostUtilizedSlot.id || "Unknown slot"} is using ${highestSlotUtilization.toFixed(1)}% of its capacity.`
        });
    }

    insights.forEach(insight => {
        const card = document.createElement("div");
        card.className = "insight-card";

        const title = document.createElement("strong");
        title.textContent = insight.title;

        const description = document.createElement("p");
        description.textContent = insight.text;

        card.append(title, description);
        container.appendChild(card);
    });
}

// ==========================================
// CHART HELPERS
// ==========================================

function prepareChartCanvas(canvas, height) {
    if (!canvas) {
        return;
    }

    canvas.style.width = "100%";
    canvas.style.height = `${height}px`;

    const parent = canvas.parentElement;

    if (parent) {
        parent.style.position = "relative";
        parent.style.width = "100%";
        parent.style.minHeight = `${height}px`;
    }
}

function getChartTooltipOptions() {
    return {
        backgroundColor: "#111827",
        titleColor: "#ffffff",
        bodyColor: "#f8fafc",
        borderColor: "#374151",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true
    };
}

function destroyChart(instance) {
    if (instance) {
        instance.destroy();
    }
}

// ==========================================
// CATEGORY QUANTITY CHART
// ==========================================

function displayCategoryChart(products) {
    const canvas = document.getElementById("categoryChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    prepareChartCanvas(canvas, 220);

    const categories = {};

    products.forEach(product => {
        const category = product.category || "Other";
        categories[category] = (categories[category] || 0) + getQuantity(product);
    });

    let labels = Object.keys(categories);
    let values = Object.values(categories);

    if (labels.length === 0) {
        labels = ["No Data"];
        values = [0];
    }

    destroyChart(categoryChartInstance);

    const context = canvas.getContext("2d");
    const gradient = context.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "#fbbf24");
    gradient.addColorStop(1, "#f59e0b");

    categoryChartInstance = new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Quantity",
                data: values,
                backgroundColor: gradient,
                borderColor: "#d97706",
                borderWidth: 1,
                borderRadius: 8,
                borderSkipped: false,
                barPercentage: 0.62,
                categoryPercentage: 0.72
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: getChartTooltipOptions()
            },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        color: "#64748b",
                        font: { size: 12, weight: "600" }
                    }
                },
                y: {
                    beginAtZero: true,
                    border: { display: false },
                    grid: { color: "#e5e7eb", drawTicks: false },
                    ticks: {
                        color: "#64748b",
                        padding: 10,
                        precision: 0,
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

// ==========================================
// ALLOCATION STATUS DOUGHNUT
// ==========================================

function displayAllocationChart(products) {
    const canvas = document.getElementById("allocationChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    prepareChartCanvas(canvas, 220);

    const totals = getAllocationTotals(products);

    let chartData = [
        totals.allocated,
        totals.pending,
        totals.notAllocated
    ];

    if (chartData.every(value => value === 0)) {
        chartData = [0, 0, 0];
    }

    destroyChart(allocationChartInstance);

    allocationChartInstance = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: ["Allocated Units", "Pending Units", "Not Allocated Units"],
            datasets: [{
                data: chartData,
                backgroundColor: ["#16a34a", "#f59e0b", "#ef4444"],
                borderColor: "#ffffff",
                borderWidth: 4,
                hoverOffset: 8,
                spacing: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 18,
                        color: "#475569",
                        font: { size: 12, weight: "600" }
                    }
                },
                tooltip: getChartTooltipOptions()
            }
        }
    });
}

// ==========================================
// SLOT UTILIZATION CHART
// ==========================================

function displaySlotUtilizationChart(slots) {
    const canvas = document.getElementById("slotUtilizationChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    prepareChartCanvas(canvas, 230);

    const sizes = ["Large", "Medium", "Small", "Custom"];

    const utilizationValues = sizes.map(size => {
        const sizeSlots = slots.filter(
            slot => String(slot.size || "").toLowerCase() === size.toLowerCase()
        );

        const capacity = sizeSlots.reduce(
            (sum, slot) => sum + getSlotCapacity(slot),
            0
        );

        const used = sizeSlots.reduce(
            (sum, slot) => sum + getSlotUsedVolume(slot),
            0
        );

        return capacity > 0
            ? Number(Math.min(100, (used / capacity) * 100).toFixed(1))
            : 0;
    });

    destroyChart(slotUtilizationChartInstance);

    slotUtilizationChartInstance = new Chart(canvas, {
        type: "bar",
        data: {
            labels: sizes,
            datasets: [{
                label: "Utilization",
                data: utilizationValues,
                backgroundColor: ["#f59e0b", "#fbbf24", "#fcd34d", "#fde68a"],
                borderColor: ["#d97706", "#d97706", "#d97706", "#d97706"],
                borderWidth: 1,
                borderRadius: 10,
                borderSkipped: false,
                barPercentage: 0.55,
                categoryPercentage: 0.72
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    ...getChartTooltipOptions(),
                    callbacks: {
                        label: context => ` Utilization: ${context.parsed.y}%`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        color: "#475569",
                        font: { size: 12, weight: "700" }
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    border: { display: false },
                    grid: { color: "#e5e7eb", drawTicks: false },
                    ticks: {
                        stepSize: 20,
                        color: "#64748b",
                        padding: 10,
                        callback: value => `${value}%`,
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

// ==========================================
// CSV HELPERS
// ==========================================

function csvValue(value) {
    if (value === null || value === undefined) {
        return '""';
    }

    return `"${String(value).replace(/"/g, '""')}"`;
}

function createCSV(headers, rows) {
    return [
        headers.map(csvValue).join(","),
        ...rows.map(row => row.map(csvValue).join(","))
    ].join("\r\n");
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob(
        ["\uFEFF", csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatCSVDate(dateValue) {
    if (!dateValue) {
        return "";
    }

    const date = new Date(dateValue);

    return Number.isNaN(date.getTime())
        ? String(dateValue)
        : date.toLocaleString();
}

function getProductAddedDate(product) {
    return product.addedAt || product.createdAt || product.date || "";
}

function getExportDateStamp() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// ==========================================
// EXPORT PRODUCTS CSV
// Always refreshes data from the backend first.
// ==========================================

async function exportProductsCSV() {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        return;
    }

    const button = document.getElementById("exportProductsCSV");

    if (button) {
        button.disabled = true;
    }

    try {
        const data = await fetchAnalyticsData(currentUser.email);
        productsData = data.products;

        if (productsData.length === 0) {
            alert("No products available to export.");
            return;
        }

        const headers = [
            "Product Name",
            "Category",
            "Quantity",
            "Weight (kg)",
            "Size",
            "Allocated Quantity",
            "Remaining Quantity",
            "Allocation Status",
            "Product Added Date & Time"
        ];

        const rows = productsData.map(product => {
            const quantity = getQuantity(product);
            const allocated = getAllocatedQuantity(product);
            const remaining = getRemainingQuantity(product);

            let allocationStatus = "Not Allocated";

            if (allocated > 0 && remaining > 0) {
                allocationStatus = "Partially Allocated";
            } else if (quantity > 0 && remaining === 0) {
                allocationStatus = "Fully Allocated";
            }

            return [
                product.name || "",
                product.category || "Other",
                quantity,
                getNumber(product.weight),
                product.size || "",
                allocated,
                remaining,
                allocationStatus,
                formatCSVDate(getProductAddedDate(product))
            ];
        });

        downloadCSV(
            createCSV(headers, rows),
            `storvia-products-${getExportDateStamp()}.csv`
        );
    } catch (error) {
        console.error("Product CSV export failed:", error);
        alert(`Could not export products: ${error.message}`);
    } finally {
        if (button) {
            button.disabled = false;
        }
    }
}

// ==========================================
// EXPORT WAREHOUSE SLOTS CSV
// Always refreshes data from the backend first.
// ==========================================

async function exportSlotsCSV() {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        return;
    }

    const button = document.getElementById("exportSlotsCSV");

    if (button) {
        button.disabled = true;
    }

    try {
        const data = await fetchAnalyticsData(currentUser.email);
        slotsData = data.slots;

        if (slotsData.length === 0) {
            alert("No warehouse slots available to export.");
            return;
        }

        const headers = [
            "Slot ID",
            "Slot Type",
            "Length (cm)",
            "Breadth (cm)",
            "Height (cm)",
            "Capacity (cm³)",
            "Used Space (cm³)",
            "Available Space (cm³)",
            "Utilization (%)",
            "Slot State",
            "Product ID",
            "Product Name",
            "Product Quantity"
        ];

        const rows = slotsData.map(slot => {
            const capacity = getSlotCapacity(slot);
            const used = getSlotUsedVolume(slot);
            const available = Math.max(capacity - used, 0);

            return [
                slot.id || "",
                slot.size || "",
                getNumber(slot.length),
                getNumber(slot.breadth),
                getNumber(slot.height),
                capacity,
                used,
                available,
                getSlotUtilization(slot).toFixed(1),
                getSlotState(slot),
                slot.productId || "",
                slot.productName || "",
                getNumber(slot.productQuantity)
            ];
        });

        downloadCSV(
            createCSV(headers, rows),
            `storvia-warehouse-slots-${getExportDateStamp()}.csv`
        );
    } catch (error) {
        console.error("Slot CSV export failed:", error);
        alert(`Could not export warehouse slots: ${error.message}`);
    } finally {
        if (button) {
            button.disabled = false;
        }
    }
}

// ==========================================
// BUTTON EVENTS
// ==========================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem(CURRENT_USER_KEY);
        window.location.href = "login.html";
    });
}

const refreshAnalytics = document.getElementById("refreshAnalytics");

if (refreshAnalytics) {
    refreshAnalytics.addEventListener("click", loadAnalytics);
}

const exportProductsButton = document.getElementById("exportProductsCSV");

if (exportProductsButton) {
    exportProductsButton.addEventListener("click", exportProductsCSV);
}

const exportSlotsButton = document.getElementById("exportSlotsCSV");

if (exportSlotsButton) {
    exportSlotsButton.addEventListener("click", exportSlotsCSV);
}

// ==========================================
// START
// ==========================================

document.addEventListener("DOMContentLoaded", loadAnalytics);

// ==========================================
// CENTER ACTIVE NAV LINK
// ==========================================

(function () {
    function centerActiveNavLink() {
        const nav = document.querySelector(".dashboard-nav");
        const active = nav && nav.querySelector("a.active");

        if (!nav || !active) {
            return;
        }

        const navRect = nav.getBoundingClientRect();
        const activeRect = active.getBoundingClientRect();

        const relativeLeft =
            activeRect.left - navRect.left + nav.scrollLeft;

        const targetScroll =
            relativeLeft - (nav.clientWidth - active.clientWidth) / 2;

        nav.style.scrollBehavior = "auto";
        nav.scrollLeft = Math.max(0, targetScroll);

        requestAnimationFrame(() => {
            nav.style.scrollBehavior = "";
        });
    }

    if (
        document.readyState === "complete" ||
        document.readyState === "interactive"
    ) {
        centerActiveNavLink();
    } else {
        document.addEventListener("DOMContentLoaded", centerActiveNavLink);
    }

    window.addEventListener("load", centerActiveNavLink);
})();
