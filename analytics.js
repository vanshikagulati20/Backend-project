"use strict";

/* =========================================================
   STORAGE KEYS
   ========================================================= */

const PRODUCT_KEY = "products";
const SLOT_KEY = "warehouseSlots";
const CURRENT_USER_KEY = "currentuser";

/* =========================================================
   CHART INSTANCES
   ========================================================= */

let categoryChartInstance = null;
let allocationChartInstance = null;
let slotUtilizationChartInstance = null;

/* =========================================================
   GENERAL HELPERS
   ========================================================= */

/**
 * Safely convert a value to a number.
 */
function toNumber(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}

/**
 * Safely escape text before inserting it into HTML.
 */
function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Set text content of an element.
 */
function setValue(elementId, value) {
    const element = document.getElementById(elementId);

    if (element) {
        element.textContent = value;
    }
}

/**
 * Clamp a number between min and max.
 */
function clamp(value, min, max) {
    return Math.min(
        Math.max(value, min),
        max
    );
}

/* =========================================================
   GET CURRENT USER
   ========================================================= */

function getCurrentUser() {
    const savedUser = localStorage.getItem(
        CURRENT_USER_KEY
    );

    if (!savedUser) {
        window.location.href = "login.html";
        return null;
    }

    try {
        const user = JSON.parse(savedUser);

        if (!user || typeof user !== "object") {
            throw new Error("Invalid user object.");
        }

        return user;
    } catch (error) {
        console.error(
            "Invalid current user:",
            error
        );

        localStorage.removeItem(
            CURRENT_USER_KEY
        );

        window.location.href = "login.html";

        return null;
    }
}

/* =========================================================
   GET PRODUCTS
   ========================================================= */

function getProducts() {
    const savedProducts = localStorage.getItem(
        PRODUCT_KEY
    );

    if (!savedProducts) {
        return [];
    }

    try {
        const products = JSON.parse(savedProducts);

        return Array.isArray(products)
            ? products
            : [];
    } catch (error) {
        console.error(
            "Invalid products data:",
            error
        );

        return [];
    }
}

/* =========================================================
   GET WAREHOUSE SLOTS
   ========================================================= */

function getSlots() {
    const savedSlots = localStorage.getItem(
        SLOT_KEY
    );

    if (!savedSlots) {
        return [];
    }

    try {
        const slots = JSON.parse(savedSlots);

        return Array.isArray(slots)
            ? slots
            : [];
    } catch (error) {
        console.error(
            "Invalid warehouse slots data:",
            error
        );

        return [];
    }
}

/* =========================================================
   GET TOTAL PRODUCT QUANTITY
   ========================================================= */

function getTotalProductQuantity(products) {
    return products.reduce(
        function (total, product) {
            return (
                total +
                Math.max(
                    toNumber(product.quantity),
                    0
                )
            );
        },
        0
    );
}

/* =========================================================
   PRODUCT ALLOCATION HELPERS
   ========================================================= */

/**
 * Get a safe allocated quantity.
 */
function getAllocatedQuantity(product) {
    const quantity = Math.max(
        toNumber(product.quantity),
        0
    );

    const allocated = Math.max(
        toNumber(product.allocatedQuantity),
        0
    );

    return Math.min(
        allocated,
        quantity
    );
}

/**
 * Get pending quantity for a product.
 */
function getPendingQuantity(product) {
    const quantity = Math.max(
        toNumber(product.quantity),
        0
    );

    const allocated = getAllocatedQuantity(
        product
    );

    return Math.max(
        quantity - allocated,
        0
    );
}

/**
 * Determine allocation status.
 */
function getAllocationStatus(product) {
    const quantity = Math.max(
        toNumber(product.quantity),
        0
    );

    const allocated = getAllocatedQuantity(
        product
    );

    if (quantity <= 0) {
        return "Not Allocated";
    }

    if (allocated <= 0) {
        return "Not Allocated";
    }

    if (allocated < quantity) {
        return "Pending";
    }

    return "Fully Allocated";
}

/* =========================================================
   SLOT HELPERS
   ========================================================= */

/**
 * Determine whether a slot is occupied.
 */
function isSlotOccupied(slot) {
    const usedVolume = Math.max(
        toNumber(slot.usedVolume),
        0
    );

    const productQuantity = Math.max(
        toNumber(slot.productQuantity),
        0
    );

    const hasProductId =
        slot.productId !== null &&
        slot.productId !== undefined &&
        String(slot.productId).trim() !== "";

    const hasProductName =
        slot.productName !== null &&
        slot.productName !== undefined &&
        String(slot.productName).trim() !== "";

    return (
        usedVolume > 0 ||
        productQuantity > 0 ||
        hasProductId ||
        hasProductName
    );
}

/**
 * Calculate slot utilization.
 */
function getSlotUtilization(slot) {
    const volume = Math.max(
        toNumber(slot.volume),
        0
    );

    const usedVolume = Math.max(
        toNumber(slot.usedVolume),
        0
    );

    if (volume <= 0) {
        return 0;
    }

    return clamp(
        (usedVolume / volume) * 100,
        0,
        100
    );
}

/* =========================================================
   LOAD ANALYTICS
   ========================================================= */

function loadAnalytics() {
    console.log("Analytics page loaded.");

    const currentUser = getCurrentUser();

    if (!currentUser) {
        return;
    }

    /* -----------------------------------------------------
       WELCOME USER
       ----------------------------------------------------- */

    const welcomeUser =
        document.getElementById(
            "welcomeUser"
        );

    if (welcomeUser) {
        welcomeUser.textContent =
            "Welcome, " +
            (currentUser.name || "User");
    }

    /* -----------------------------------------------------
       GET DATA
       ----------------------------------------------------- */

    const allProducts = getProducts();
    const allSlots = getSlots();

    /* -----------------------------------------------------
       FILTER CURRENT USER DATA
       ----------------------------------------------------- */

    const userEmail = String(
        currentUser.email || ""
    )
        .trim()
        .toLowerCase();

    const products = allProducts.filter(
        function (product) {
            return (
                String(
                    product.userEmail || ""
                )
                    .trim()
                    .toLowerCase() === userEmail
            );
        }
    );

    const slots = allSlots.filter(
        function (slot) {
            return (
                String(
                    slot.userEmail || ""
                )
                    .trim()
                    .toLowerCase() === userEmail
            );
        }
    );

    /* -----------------------------------------------------
       DEBUG
       ----------------------------------------------------- */

    const totalQuantity =
        getTotalProductQuantity(
            products
        );

    console.log(
        "Product records:",
        products.length
    );

    console.log(
        "Actual product quantity:",
        totalQuantity
    );

    console.log(
        "Current user products:",
        products
    );

    console.log(
        "Current user slots:",
        slots
    );

    /* -----------------------------------------------------
       PRODUCT ANALYSIS
       ----------------------------------------------------- */

    displayCategoryDistribution(
        products
    );

    displayCategoryQuantity(
        products
    );

    displayAllocationAnalysis(
        products
    );

    displayProductCharacteristics(
        products
    );

    /* -----------------------------------------------------
       SLOT ANALYSIS
       ----------------------------------------------------- */

    displaySlotAnalysis(
        slots,
        "Large"
    );

    displaySlotAnalysis(
        slots,
        "Medium"
    );

    displaySlotAnalysis(
        slots,
        "Small"
    );

    displaySlotAnalysis(
        slots,
        "Custom"
    );

    /* -----------------------------------------------------
       SPACE ANALYSIS
       ----------------------------------------------------- */

    displaySpaceAnalysis(
        slots
    );

    /* -----------------------------------------------------
       PENDING PRODUCTS
       ----------------------------------------------------- */

    displayPendingProducts(
        products
    );

    /* -----------------------------------------------------
       INSIGHTS
       ----------------------------------------------------- */

    generateInsights(
        products,
        slots
    );

    /* -----------------------------------------------------
       CHARTS
       ----------------------------------------------------- */

    displayCategoryChart(
        products
    );

    displayAllocationChart(
        products
    );

    displaySlotUtilizationChart(
        slots
    );
}

/* =========================================================
   CATEGORY DISTRIBUTION
   ========================================================= */

function displayCategoryDistribution(
    products
) {
    const container =
        document.getElementById(
            "categoryDistribution"
        );

    if (!container) {
        return;
    }

    if (products.length === 0) {
        container.innerHTML = `
            <p class="empty-message">
                No category data available.
            </p>
        `;

        return;
    }

    const categories = {};

    products.forEach(
        function (product) {
            const category =
                String(
                    product.category || "Other"
                ).trim() || "Other";

            if (!categories[category]) {
                categories[category] = 0;
            }

            categories[category] += Math.max(
                toNumber(product.quantity),
                0
            );
        }
    );

    container.innerHTML = "";

    Object.keys(categories)
        .sort()
        .forEach(
            function (category) {
                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "category-item";

                item.innerHTML = `
                    <span>
                        ${escapeHTML(category)}
                    </span>

                    <strong>
                        ${categories[category]}
                    </strong>
                `;

                container.appendChild(
                    item
                );
            }
        );
}

/* =========================================================
   QUANTITY BY CATEGORY
   ========================================================= */

function displayCategoryQuantity(
    products
) {
    const container =
        document.getElementById(
            "categoryQuantity"
        );

    if (!container) {
        return;
    }

    if (products.length === 0) {
        container.innerHTML = `
            <p class="empty-message">
                No quantity data available.
            </p>
        `;

        return;
    }

    const quantities = {};

    products.forEach(
        function (product) {
            const category =
                String(
                    product.category || "Other"
                ).trim() || "Other";

            if (!quantities[category]) {
                quantities[category] = 0;
            }

            quantities[category] += Math.max(
                toNumber(product.quantity),
                0
            );
        }
    );

    container.innerHTML = "";

    Object.keys(quantities)
        .sort()
        .forEach(
            function (category) {
                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "category-item";

                item.innerHTML = `
                    <span>
                        ${escapeHTML(category)}
                    </span>

                    <strong>
                        ${quantities[category]}
                    </strong>
                `;

                container.appendChild(
                    item
                );
            }
        );
}

/* =========================================================
   ALLOCATION ANALYSIS
   ========================================================= */

function calculateAllocation(
    products
) {
    let allocated = 0;
    let pending = 0;
    let notAllocated = 0;

    products.forEach(
        function (product) {
            const quantity = Math.max(
                toNumber(product.quantity),
                0
            );

            const allocatedQuantity =
                getAllocatedQuantity(
                    product
                );

            if (
                allocatedQuantity <= 0
            ) {
                notAllocated += quantity;
            } else if (
                allocatedQuantity < quantity
            ) {
                allocated +=
                    allocatedQuantity;

                pending +=
                    quantity -
                    allocatedQuantity;
            } else {
                allocated += quantity;
            }
        }
    );

    return {
        allocated,
        pending,
        notAllocated
    };
}

function displayAllocationAnalysis(
    products
) {
    const allocation =
        calculateAllocation(
            products
        );

    setValue(
        "allocatedProducts",
        allocation.allocated
    );

    setValue(
        "pendingProducts",
        allocation.pending
    );

    setValue(
        "notAllocatedProducts",
        allocation.notAllocated
    );
}

/* =========================================================
   PRODUCT CHARACTERISTICS
   ========================================================= */

function displayProductCharacteristics(
    products
) {
    let fragile = 0;
    let nonFragile = 0;
    let totalWeight = 0;

    products.forEach(
        function (product) {
            const quantity = Math.max(
                toNumber(product.quantity),
                0
            );

            const fragileValue =
                String(
                    product.fragile || ""
                )
                    .trim()
                    .toLowerCase();

            if (
                fragileValue === "yes" ||
                fragileValue === "true" ||
                fragileValue === "1"
            ) {
                fragile += quantity;
            } else {
                nonFragile += quantity;
            }

            totalWeight +=
                quantity *
                Math.max(
                    toNumber(product.weight),
                    0
                );
        }
    );

    setValue(
        "fragileProducts",
        fragile
    );

    setValue(
        "nonFragileProducts",
        nonFragile
    );

    setValue(
        "inventoryWeight",
        totalWeight.toFixed(2) +
            " kg"
    );
}

/* =========================================================
   SLOT ANALYSIS
   ========================================================= */

function displaySlotAnalysis(
    slots,
    size
) {
    const sizeSlots =
        slots.filter(
            function (slot) {
                return (
                    String(
                        slot.size || ""
                    ).toLowerCase() ===
                    size.toLowerCase()
                );
            }
        );

    const total =
        sizeSlots.length;

    const occupied =
        sizeSlots.filter(
            function (slot) {
                return isSlotOccupied(
                    slot
                );
            }
        ).length;

    const empty =
        total - occupied;

    let totalVolume = 0;
    let usedVolume = 0;

    sizeSlots.forEach(
        function (slot) {
            totalVolume += Math.max(
                toNumber(slot.volume),
                0
            );

            usedVolume += Math.max(
                toNumber(slot.usedVolume),
                0
            );
        }
    );

    let utilization = 0;

    if (totalVolume > 0) {
        utilization =
            (usedVolume /
                totalVolume) *
            100;
    }

    utilization = clamp(
        utilization,
        0,
        100
    );

    const prefix =
        size.toLowerCase();

    setValue(
        prefix + "Total",
        total
    );

    setValue(
        prefix + "Occupied",
        occupied
    );

    setValue(
        prefix + "Empty",
        empty
    );

    setValue(
        prefix + "Utilization",
        utilization.toFixed(1) +
            "%"
    );

    const progress =
        document.getElementById(
            prefix + "Progress"
        );

    if (progress) {
        progress.style.width =
            utilization + "%";

        progress.setAttribute(
            "aria-valuenow",
            utilization.toFixed(1)
        );
    }
}

/* =========================================================
   SPACE ANALYSIS
   ========================================================= */

function displaySpaceAnalysis(
    slots
) {
    let totalVolume = 0;
    let usedVolume = 0;

    slots.forEach(
        function (slot) {
            totalVolume += Math.max(
                toNumber(slot.volume),
                0
            );

            usedVolume += Math.max(
                toNumber(slot.usedVolume),
                0
            );
        }
    );

    const availableVolume =
        Math.max(
            totalVolume -
                usedVolume,
            0
        );

    setValue(
        "usedVolume",
        usedVolume.toFixed(2) +
            " cm³"
    );

    setValue(
        "availableVolume",
        availableVolume.toFixed(2) +
            " cm³"
    );

    /* -----------------------------------------------------
       MOST UTILIZED SLOT TYPE
       ----------------------------------------------------- */

    const sizes = [
        "Large",
        "Medium",
        "Small",
        "Custom"
    ];

    let mostUtilized = "-";
    let highestUtilization = -1;

    sizes.forEach(
        function (size) {
            const sizeSlots =
                slots.filter(
                    function (slot) {
                        return (
                            String(
                                slot.size || ""
                            ).toLowerCase() ===
                            size.toLowerCase()
                        );
                    }
                );

            let total = 0;
            let used = 0;

            sizeSlots.forEach(
                function (slot) {
                    total += Math.max(
                        toNumber(
                            slot.volume
                        ),
                        0
                    );

                    used += Math.max(
                        toNumber(
                            slot.usedVolume
                        ),
                        0
                    );
                }
            );

            if (total > 0) {
                const utilization =
                    (used / total) *
                    100;

                if (
                    utilization >
                    highestUtilization
                ) {
                    highestUtilization =
                        utilization;

                    mostUtilized =
                        size;
                }
            }
        }
    );

    setValue(
        "mostUtilizedSlot",
        mostUtilized
    );
}

/* =========================================================
   PENDING PRODUCTS
   ========================================================= */

function displayPendingProducts(
    products
) {
    const container =
        document.getElementById(
            "pendingProductList"
        );

    if (!container) {
        return;
    }

    const pending =
        products.filter(
            function (product) {
                return (
                    getPendingQuantity(
                        product
                    ) > 0
                );
            }
        );

    if (pending.length === 0) {
        container.innerHTML = `
            <p class="empty-message">
                No pending products.
            </p>
        `;

        return;
    }

    container.innerHTML = "";

    pending.forEach(
        function (product) {
            const remaining =
                getPendingQuantity(
                    product
                );

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "pending-product";

            item.innerHTML = `
                <div>
                    <strong class="pending-product-name">
                        ${escapeHTML(
                            product.name ||
                            "Unnamed Product"
                        )}
                    </strong>

                    <p class="pending-product-details">
                        Category:
                        ${escapeHTML(
                            product.category ||
                            "Other"
                        )}
                    </p>
                </div>

                <div class="pending-product-status">
                    ${remaining} remaining
                </div>
            `;

            container.appendChild(
                item
            );
        }
    );
}

/* =========================================================
   WAREHOUSE INSIGHTS
   ========================================================= */

function generateInsights(
    products,
    slots
) {
    const container =
        document.getElementById(
            "warehouseInsights"
        );

    if (!container) {
        return;
    }

    const insights = [];

    /* -----------------------------------------------------
       NO DATA
       ----------------------------------------------------- */

    if (
        products.length === 0 &&
        slots.length === 0
    ) {
        container.innerHTML = `
            <div class="insight-card">
                <strong>
                    No insights available
                </strong>

                <p>
                    Add products and warehouse
                    slots to generate insights.
                </p>
            </div>
        `;

        return;
    }

    /* -----------------------------------------------------
       WAREHOUSE UTILIZATION
       ----------------------------------------------------- */

    let totalVolume = 0;
    let usedVolume = 0;

    slots.forEach(
        function (slot) {
            totalVolume += Math.max(
                toNumber(slot.volume),
                0
            );

            usedVolume += Math.max(
                toNumber(slot.usedVolume),
                0
            );
        }
    );

    let utilization = 0;

    if (totalVolume > 0) {
        utilization =
            (usedVolume /
                totalVolume) *
            100;
    }

    utilization = clamp(
        utilization,
        0,
        100
    );

    if (utilization >= 80) {
        insights.push({
            title:
                "Warehouse is highly utilized",

            text:
                "Your warehouse is using more than 80% of its available volume."
        });
    } else if (utilization >= 50) {
        insights.push({
            title:
                "Warehouse utilization is moderate",

            text:
                "Your warehouse has a balanced level of space usage."
        });
    } else {
        insights.push({
            title:
                "Warehouse has available space",

            text:
                "A significant amount of warehouse volume is still available."
        });
    }

    /* -----------------------------------------------------
       PENDING PRODUCTS
       ----------------------------------------------------- */

    const pendingProducts =
        products.filter(
            function (product) {
                return (
                    getPendingQuantity(
                        product
                    ) > 0
                );
            }
        );

    if (
        pendingProducts.length > 0
    ) {
        const pendingQuantity =
            pendingProducts.reduce(
                function (
                    total,
                    product
                ) {
                    return (
                        total +
                        getPendingQuantity(
                            product
                        )
                    );
                },
                0
            );

        insights.push({
            title:
                "Pending allocation detected",

            text:
                pendingQuantity +
                " product unit(s) still require warehouse space."
        });
    } else {
        insights.push({
            title:
                "All products allocated",

            text:
                "All your current products have been successfully allocated."
        });
    }

    /* -----------------------------------------------------
       EMPTY SLOTS
       ----------------------------------------------------- */

    const emptySlots =
        slots.filter(
            function (slot) {
                return !isSlotOccupied(
                    slot
                );
            }
        ).length;

    if (emptySlots > 0) {
        insights.push({
            title:
                "Empty slots available",

            text:
                emptySlots +
                " warehouse slot(s) are currently empty."
        });
    }

    /* -----------------------------------------------------
       MOST USED SLOT
       ----------------------------------------------------- */

    let mostUsedSlot = null;
    let highestPercentage = -1;

    slots.forEach(
        function (slot) {
            const percentage =
                getSlotUtilization(
                    slot
                );

            const volume = Math.max(
                toNumber(slot.volume),
                0
            );

            if (
                volume > 0 &&
                percentage >
                    highestPercentage
            ) {
                highestPercentage =
                    percentage;

                mostUsedSlot =
                    slot;
            }
        }
    );

    if (mostUsedSlot) {
        insights.push({
            title:
                "Most utilized slot",

            text:
                String(
                    mostUsedSlot.id ||
                    "Unnamed slot"
                ) +
                " is currently using " +
                highestPercentage.toFixed(
                    1
                ) +
                "% of its capacity."
        });
    }

    /* -----------------------------------------------------
       DISPLAY INSIGHTS
       ----------------------------------------------------- */

    container.innerHTML = "";

    insights.forEach(
        function (insight) {
            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "insight-card";

            card.innerHTML = `
                <strong>
                    ${escapeHTML(
                        insight.title
                    )}
                </strong>

                <p>
                    ${escapeHTML(
                        insight.text
                    )}
                </p>
            `;

            container.appendChild(
                card
            );
        }
    );
}

/* =========================================================
   CHART HELPER
   ========================================================= */

function prepareChartCanvas(
    canvas,
    height
) {
    if (!canvas) {
        return;
    }

    canvas.style.width = "100%";
    canvas.style.height =
        height + "px";

    const parent =
        canvas.parentElement;

    if (parent) {
        parent.style.position =
            "relative";

        parent.style.width =
            "100%";

        parent.style.minHeight =
            height + "px";
    }
}

/* =========================================================
   CHART.JS AVAILABILITY
   ========================================================= */

function isChartJSAvailable() {
    if (
        typeof window.Chart ===
        "undefined"
    ) {
        console.error(
            "Chart.js is not loaded. Please include Chart.js before this analytics script."
        );

        return false;
    }

    return true;
}

/* =========================================================
   CHART TOOLTIP DEFAULTS
   ========================================================= */

function getChartTooltipOptions() {
    return {
        backgroundColor:
            "#111827",

        titleColor:
            "#ffffff",

        bodyColor:
            "#f8fafc",

        borderColor:
            "#374151",

        borderWidth: 1,

        padding: 12,

        cornerRadius: 8,

        displayColors: true
    };
}

/* =========================================================
   CHART HOVER ANIMATION
   ========================================================= */

function setupChartHoverAnimation(
    chart
) {
    if (!chart) {
        return;
    }

    chart.options.onHover =
        function (
            event,
            activeElements
        ) {
            if (
                !activeElements ||
                activeElements.length ===
                    0
            ) {
                return;
            }

            const activeElement =
                activeElements[0];

            if (!activeElement) {
                return;
            }

            const datasetIndex =
                activeElement.datasetIndex;

            const index =
                activeElement.index;

            if (
                chart.data.datasets[
                    datasetIndex
                ]
            ) {
                chart.setActiveElements([
                    {
                        datasetIndex:
                            datasetIndex,
                        index: index
                    }
                ]);

                chart.tooltip.setActiveElements(
                    [
                        {
                            datasetIndex:
                                datasetIndex,
                            index: index
                        }
                    ],
                    {
                        x: event.x,
                        y: event.y
                    }
                );

                chart.update(
                    "none"
                );
            }
        };
}

/* =========================================================
   CATEGORY QUANTITY CHART
   ========================================================= */

function displayCategoryChart(
    products
) {
    const canvas =
        document.getElementById(
            "categoryChart"
        );

    if (!canvas) {
        return;
    }

    if (!isChartJSAvailable()) {
        return;
    }

    prepareChartCanvas(
        canvas,
        220
    );

    const categories = {};

    products.forEach(
        function (product) {
            const category =
                String(
                    product.category ||
                        "Other"
                ).trim() ||
                "Other";

            if (!categories[category]) {
                categories[category] = 0;
            }

            categories[category] +=
                Math.max(
                    toNumber(
                        product.quantity
                    ),
                    0
                );
        }
    );

    let labels =
        Object.keys(
            categories
        );

    let values =
        Object.values(
            categories
        );

    if (labels.length === 0) {
        labels = ["No Data"];
        values = [0];
    }

    if (categoryChartInstance) {
        categoryChartInstance.destroy();
        categoryChartInstance = null;
    }

    const context =
        canvas.getContext("2d");

    if (!context) {
        return;
    }

    const gradient =
        context.createLinearGradient(
            0,
            0,
            0,
            300
        );

    gradient.addColorStop(
        0,
        "#fbbf24"
    );

    gradient.addColorStop(
        1,
        "#f59e0b"
    );

    categoryChartInstance =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {
                    labels: labels,

                    datasets: [
                        {
                            label:
                                "Quantity",

                            data: values,

                            backgroundColor:
                                gradient,

                            borderColor:
                                "#d97706",

                            borderWidth: 1,

                            borderRadius: 8,

                            borderSkipped:
                                false,

                            barPercentage:
                                0.62,

                            categoryPercentage:
                                0.72
                        }
                    ]
                },

                options: {
                    responsive: true,

                    maintainAspectRatio:
                        false,

                    animation: false,

                    interaction: {
                        mode: "index",
                        intersect: false
                    },

                    plugins: {
                        legend: {
                            display: false
                        },

                        tooltip:
                            getChartTooltipOptions()
                    },

                    scales: {
                        x: {
                            grid: {
                                display: false
                            },

                            border: {
                                display: false
                            },

                            ticks: {
                                color:
                                    "#64748b",

                                font: {
                                    size: 12,
                                    weight:
                                        "600"
                                }
                            }
                        },

                        y: {
                            beginAtZero:
                                true,

                            border: {
                                display: false
                            },

                            grid: {
                                color:
                                    "#e5e7eb",

                                drawTicks:
                                    false
                            },

                            ticks: {
                                color:
                                    "#64748b",

                                padding: 10,

                                precision: 0,

                                font: {
                                    size: 11
                                }
                            }
                        }
                    }
                }
            }
        );

    setupChartHoverAnimation(
        categoryChartInstance
    );
}

/* =========================================================
   ALLOCATION STATUS DOUGHNUT CHART
   ========================================================= */

function displayAllocationChart(
    products
) {
    const canvas =
        document.getElementById(
            "allocationChart"
        );

    if (!canvas) {
        return;
    }

    if (!isChartJSAvailable()) {
        return;
    }

    prepareChartCanvas(
        canvas,
        220
    );

    const allocation =
        calculateAllocation(
            products
        );

    let chartData = [
        allocation.allocated,
        allocation.pending,
        allocation.notAllocated
    ];

    let isNoData = false;

    if (
        allocation.allocated === 0 &&
        allocation.pending === 0 &&
        allocation.notAllocated === 0
    ) {
        chartData = [1, 0, 0];
        isNoData = true;
    }

    if (allocationChartInstance) {
        allocationChartInstance.destroy();

        allocationChartInstance =
            null;
    }

    allocationChartInstance =
        new Chart(
            canvas,
            {
                type: "doughnut",

                data: {
                    labels: [
                        "Fully Allocated",
                        "Pending",
                        "Not Allocated"
                    ],

                    datasets: [
                        {
                            data: chartData,

                            backgroundColor: [
                                "#16a34a",
                                "#f59e0b",
                                "#ef4444"
                            ],

                            borderColor:
                                "#ffffff",

                            borderWidth: 4,

                            hoverOffset: 8,

                            spacing: 3
                        }
                    ]
                },

                options: {
                    responsive: true,

                    maintainAspectRatio:
                        false,

                    cutout: "68%",

                    animation: false,

                    plugins: {
                        legend: {
                            position:
                                "bottom",

                            labels: {
                                usePointStyle:
                                    true,

                                pointStyle:
                                    "circle",

                                padding: 18,

                                color:
                                    "#475569",

                                font: {
                                    size: 12,

                                    weight:
                                        "600"
                                }
                            }
                        },

                        tooltip: {
                            ...getChartTooltipOptions(),

                            callbacks: {
                                label:
                                    function (
                                        context
                                    ) {
                                        if (
                                            isNoData
                                        ) {
                                            return " No data available";
                                        }

                                        return (
                                            " " +
                                            context.label +
                                            ": " +
                                            context.raw
                                        );
                                    }
                            }
                        }
                    }
                }
            }
        );

    setupChartHoverAnimation(
        allocationChartInstance
    );
}

/* =========================================================
   SLOT UTILIZATION CHART
   ========================================================= */

function displaySlotUtilizationChart(
    slots
) {
    const canvas =
        document.getElementById(
            "slotUtilizationChart"
        );

    if (!canvas) {
        return;
    }

    if (!isChartJSAvailable()) {
        return;
    }

    prepareChartCanvas(
        canvas,
        230
    );

    const sizes = [
        "Large",
        "Medium",
        "Small",
        "Custom"
    ];

    const utilizationValues =
        [];

    sizes.forEach(
        function (size) {
            const sizeSlots =
                slots.filter(
                    function (slot) {
                        return (
                            String(
                                slot.size ||
                                    ""
                            ).toLowerCase() ===
                            size.toLowerCase()
                        );
                    }
                );

            let totalVolume = 0;
            let usedVolume = 0;

            sizeSlots.forEach(
                function (slot) {
                    totalVolume +=
                        Math.max(
                            toNumber(
                                slot.volume
                            ),
                            0
                        );

                    usedVolume +=
                        Math.max(
                            toNumber(
                                slot.usedVolume
                            ),
                            0
                        );
                }
            );

            let utilization = 0;

            if (
                totalVolume > 0
            ) {
                utilization =
                    (usedVolume /
                        totalVolume) *
                    100;
            }

            utilization = clamp(
                utilization,
                0,
                100
            );

            utilizationValues.push(
                Number(
                    utilization.toFixed(
                        1
                    )
                )
            );
        }
    );

    if (
        slotUtilizationChartInstance
    ) {
        slotUtilizationChartInstance.destroy();

        slotUtilizationChartInstance =
            null;
    }

    slotUtilizationChartInstance =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {
                    labels: sizes,

                    datasets: [
                        {
                            label:
                                "Utilization",

                            data:
                                utilizationValues,

                            backgroundColor: [
                                "#f59e0b",
                                "#fbbf24",
                                "#fcd34d",
                                "#fde68a"
                            ],

                            borderColor: [
                                "#d97706",
                                "#d97706",
                                "#d97706",
                                "#d97706"
                            ],

                            borderWidth: 1,

                            borderRadius: 10,

                            borderSkipped:
                                false,

                            barPercentage:
                                0.55,

                            categoryPercentage:
                                0.72
                        }
                    ]
                },

                options: {
                    responsive: true,

                    maintainAspectRatio:
                        false,

                    animation: false,

                    interaction: {
                        mode: "index",
                        intersect: false
                    },

                    plugins: {
                        legend: {
                            display: false
                        },

                        tooltip: {
                            ...getChartTooltipOptions(),

                            callbacks: {
                                label:
                                    function (
                                        context
                                    ) {
                                        return (
                                            " Utilization: " +
                                            context.parsed.y +
                                            "%"
                                        );
                                    }
                            }
                        }
                    },

                    scales: {
                        x: {
                            grid: {
                                display: false
                            },

                            border: {
                                display: false
                            },

                            ticks: {
                                color:
                                    "#475569",

                                font: {
                                    size: 12,

                                    weight:
                                        "700"
                                }
                            }
                        },

                        y: {
                            beginAtZero:
                                true,

                            max: 100,

                            border: {
                                display: false
                            },

                            grid: {
                                color:
                                    "#e5e7eb",

                                drawTicks:
                                    false
                            },

                            ticks: {
                                stepSize: 20,

                                color:
                                    "#64748b",

                                padding: 10,

                                callback:
                                    function (
                                        value
                                    ) {
                                        return (
                                            value +
                                            "%"
                                        );
                                    },

                                font: {
                                    size: 11
                                }
                            }
                        }
                    }
                }
            }
        );

    setupChartHoverAnimation(
        slotUtilizationChartInstance
    );
}

/* =========================================================
   CSV VALUE FORMATTER
   ========================================================= */

function csvValue(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    const stringValue =
        String(value);

    return (
        '"' +
        stringValue.replace(
            /"/g,
            '""'
        ) +
        '"'
    );
}

/* =========================================================
   CREATE CSV
   ========================================================= */

function createCSV(
    headers,
    rows
) {
    const headerRow =
        headers
            .map(csvValue)
            .join(",");

    const dataRows =
        rows.map(
            function (row) {
                return row
                    .map(csvValue)
                    .join(",");
            }
        );

    return [
        headerRow,
        ...dataRows
    ].join("\r\n");
}

/* =========================================================
   DOWNLOAD CSV
   ========================================================= */

function downloadCSV(
    csvContent,
    filename
) {
    const BOM = "\uFEFF";

    const blob =
        new Blob(
            [
                BOM +
                    csvContent
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement(
            "a"
        );

    link.href = url;
    link.download = filename;

    document.body.appendChild(
        link
    );

    link.click();

    document.body.removeChild(
        link
    );

    setTimeout(
        function () {
            URL.revokeObjectURL(
                url
            );
        },
        100
    );
}

/* =========================================================
   GET EXPORT USER
   ========================================================= */

function getExportUser() {
    const savedUser =
        localStorage.getItem(
            CURRENT_USER_KEY
        );

    if (!savedUser) {
        return null;
    }

    try {
        const user =
            JSON.parse(
                savedUser
            );

        if (
            !user ||
            typeof user !== "object"
        ) {
            return null;
        }

        return user;
    } catch (error) {
        console.error(
            "Invalid user data:",
            error
        );

        return null;
    }
}

/* =========================================================
   FORMAT DATE FOR CSV
   ========================================================= */

function formatCSVDate(
    dateValue
) {
    if (!dateValue) {
        return "";
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(
            dateValue
        );
    }

    return date.toLocaleString();
}

/* =========================================================
   GET PRODUCT ADDED DATE
   ========================================================= */

function getProductAddedDate(
    product
) {
    /*
     * addedAt is preferred.
     *
     * createdAt and date are fallback
     * properties for compatibility with
     * older product records.
     *
     * The CSV export date is never used
     * as the product added date.
     */

    return (
        product.addedAt ||
        product.createdAt ||
        product.date ||
        ""
    );
}

/* =========================================================
   EXPORT PRODUCTS CSV
   ========================================================= */

function exportProductsCSV() {
    const currentUser =
        getExportUser();

    if (!currentUser) {
        alert(
            "Please log in before exporting data."
        );

        return;
    }

    const allProducts =
        getProducts();

    const userEmail =
        String(
            currentUser.email || ""
        )
            .trim()
            .toLowerCase();

    const products =
        allProducts.filter(
            function (product) {
                return (
                    String(
                        product.userEmail ||
                            ""
                    )
                        .trim()
                        .toLowerCase() ===
                    userEmail
                );
            }
        );

    if (products.length === 0) {
        alert(
            "No products available to export."
        );

        return;
    }

    const headers = [
        "Product ID",
        "Product Name",
        "Category",
        "Quantity",
        "Allocated Quantity",
        "Pending Quantity",
        "Allocation Status",
        "Fragile",
        "Weight per Unit (kg)",
        "Total Weight (kg)",
        "Added Date"
    ];

    const rows =
        products.map(
            function (product) {
                const quantity =
                    Math.max(
                        toNumber(
                            product.quantity
                        ),
                        0
                    );

                const allocated =
                    getAllocatedQuantity(
                        product
                    );

                const pending =
                    getPendingQuantity(
                        product
                    );

                const weight =
                    Math.max(
                        toNumber(
                            product.weight
                        ),
                        0
                    );

                const totalWeight =
                    quantity *
                    weight;

                return [
                    product.id ||
                        product.productId ||
                        "",

                    product.name ||
                        "",

                    product.category ||
                        "Other",

                    quantity,

                    allocated,

                    pending,

                    getAllocationStatus(
                        product
                    ),

                    product.fragile ||
                        "No",

                    weight,

                    totalWeight.toFixed(
                        2
                    ),

                    formatCSVDate(
                        getProductAddedDate(
                            product
                        )
                    )
                ];
            }
        );

    const csv =
        createCSV(
            headers,
            rows
        );

    const dateStamp =
        new Date()
            .toISOString()
            .slice(0, 10);

    downloadCSV(
        csv,
        "storvia-products-" +
            dateStamp +
            ".csv"
    );
}

/* =========================================================
   EXPORT WAREHOUSE SLOTS CSV
   ========================================================= */

function exportSlotsCSV() {
    const currentUser =
        getExportUser();

    if (!currentUser) {
        alert(
            "Please log in before exporting data."
        );

        return;
    }

    const allSlots =
        getSlots();

    const userEmail =
        String(
            currentUser.email || ""
        )
            .trim()
            .toLowerCase();

    const slots =
        allSlots.filter(
            function (slot) {
                return (
                    String(
                        slot.userEmail || ""
                    )
                        .trim()
                        .toLowerCase() ===
                    userEmail
                );
            }
        );

    if (slots.length === 0) {
        alert(
            "No warehouse slots available to export."
        );

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

    const rows =
        slots.map(
            function (slot) {
                const capacity =
                    Math.max(
                        toNumber(
                            slot.volume
                        ),
                        0
                    );

                const used =
                    Math.max(
                        toNumber(
                            slot.usedVolume
                        ),
                        0
                    );

                const available =
                    Math.max(
                        capacity -
                            used,
                        0
                    );

                const utilization =
                    getSlotUtilization(
                        slot
                    );

                const slotState =
                    isSlotOccupied(
                        slot
                    )
                        ? "Occupied"
                        : "Empty";

                return [
                    slot.id || "",

                    slot.size || "",

                    Math.max(
                        toNumber(
                            slot.length
                        ),
                        0
                    ),

                    Math.max(
                        toNumber(
                            slot.breadth
                        ),
                        0
                    ),

                    Math.max(
                        toNumber(
                            slot.height
                        ),
                        0
                    ),

                    capacity,

                    used,

                    available,

                    utilization.toFixed(
                        1
                    ),

                    slotState,

                    slot.productId ||
                        "",

                    slot.productName ||
                        "",

                    Math.max(
                        toNumber(
                            slot.productQuantity
                        ),
                        0
                    )
                ];
            }
        );

    const csv =
        createCSV(
            headers,
            rows
        );

    const dateStamp =
        new Date()
            .toISOString()
            .slice(0, 10);

    downloadCSV(
        csv,
        "storvia-warehouse-slots-" +
            dateStamp +
            ".csv"
    );
}

/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {
    /* -----------------------------------------------------
       LOGOUT
       ----------------------------------------------------- */

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );

    if (logoutBtn) {
        logoutBtn.addEventListener(
            "click",
            function () {
                localStorage.removeItem(
                    CURRENT_USER_KEY
                );

                window.location.href =
                    "login.html";
            }
        );
    }

    /* -----------------------------------------------------
       REFRESH ANALYTICS
       ----------------------------------------------------- */

    const refreshAnalytics =
        document.getElementById(
            "refreshAnalytics"
        );

    if (refreshAnalytics) {
        refreshAnalytics.addEventListener(
            "click",
            function () {
                loadAnalytics();
            }
        );
    }

    /* -----------------------------------------------------
       EXPORT PRODUCTS
       ----------------------------------------------------- */

    const exportProductsButton =
        document.getElementById(
            "exportProductsCSV"
        );

    if (exportProductsButton) {
        exportProductsButton.addEventListener(
            "click",
            exportProductsCSV
        );
    }

    /* -----------------------------------------------------
       EXPORT SLOTS
       ----------------------------------------------------- */

    const exportSlotsButton =
        document.getElementById(
            "exportSlotsCSV"
        );

    if (exportSlotsButton) {
        exportSlotsButton.addEventListener(
            "click",
            exportSlotsCSV
        );
    }
}

/* =========================================================
   START APPLICATION
   ========================================================= */

function initializeAnalytics() {
    setupEventListeners();
    loadAnalytics();
}

/* =========================================================
   DOM READY
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializeAnalytics
    );
} else {
    initializeAnalytics();
}