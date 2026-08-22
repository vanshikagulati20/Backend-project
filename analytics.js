const PRODUCT_KEY = "products";
const SLOT_KEY = "warehouseSlots";
const CURRENT_USER_KEY = "currentuser";

// *==========================================*
// *CHART INSTANCES*
// *==========================================*

let categoryChartInstance = null;
let allocationChartInstance = null;
let slotUtilizationChartInstance = null;

// *==========================================*
// *GET CURRENT USER*
// *==========================================*

function getCurrentUser() {
    const savedUser =
        localStorage.getItem(CURRENT_USER_KEY);

    if (!savedUser) {
        window.location.href = "login.html";
        return null;
    }

    try {
        return JSON.parse(savedUser);
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

// *==========================================*
// *GET PRODUCTS*
// *==========================================*

function getProducts() {
    const savedProducts =
        localStorage.getItem(PRODUCT_KEY);

    if (!savedProducts) {
        return [];
    }

    try {
        const products =
            JSON.parse(savedProducts);

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

// *==========================================*
// *GET SLOTS*
// *==========================================*

function getSlots() {
    const savedSlots =
        localStorage.getItem(SLOT_KEY);

    if (!savedSlots) {
        return [];
    }

    try {
        const slots =
            JSON.parse(savedSlots);

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

// *==========================================*
// *GET TOTAL PRODUCT QUANTITY*
// *==========================================*

function getTotalProductQuantity(products) {
    return products.reduce(
        function (total, product) {
            return total +
                Number(product.quantity || 0);
        },
        0
    );
}

// *==========================================*
// *SET HTML VALUE*
// *==========================================*

function setValue(elementId, value) {
    const element =
        document.getElementById(elementId);

    if (element) {
        element.innerText = value;
    }
}

// *==========================================*
// *LOAD ANALYTICS*
// *==========================================*

function loadAnalytics() {
    console.log(
        "Analytics page loaded"
    );

    // *======================================*
    // *CURRENT USER*
    // *======================================*

    const currentUser =
        getCurrentUser();

    if (!currentUser) {
        return;
    }

    // *======================================*
    // *WELCOME USER*
    // *======================================*

    const welcomeUser =
        document.getElementById(
            "welcomeUser"
        );

    if (welcomeUser) {
        welcomeUser.innerText =
            "Welcome, " +
            currentUser.name;
    }

    // *======================================*
    // *GET DATA*
    // *======================================*

    const allProducts =
        getProducts();

    const allSlots =
        getSlots();

    // *======================================*
    // *FILTER CURRENT USER DATA*
    // *======================================*

    const products =
        allProducts.filter(
            function (product) {
                return (
                    product.userEmail ===
                    currentUser.email
                );
            }
        );

    const slots =
        allSlots.filter(
            function (slot) {
                return (
                    slot.userEmail ===
                    currentUser.email
                );
            }
        );

    // *======================================*
    // *TOTAL ACTUAL INVENTORY*
    // *======================================*

    const totalQuantity =
        getTotalProductQuantity(products);

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

    // *======================================*
    // *PRODUCT ANALYSIS*
    // *======================================*

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

    // *======================================*
    // *SLOT ANALYSIS*
    // *======================================*

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

    // *======================================*
    // *SPACE ANALYSIS*
    // *======================================*

    displaySpaceAnalysis(
        slots
    );

    // *======================================*
    // *PENDING PRODUCTS*
    // *======================================*

    displayPendingProducts(
        products
    );

    // *======================================*
    // *INSIGHTS*
    // *======================================*

    generateInsights(
        products,
        slots
    );

    // *======================================*
    // *ANALYTICS CHARTS*
    // *======================================*

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

// *==========================================*
// *CATEGORY DISTRIBUTION*
// *==========================================*

function displayCategoryDistribution(products) {
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
                product.category ||
                "Other";

            if (!categories[category]) {
                categories[category] = 0;
            }

            categories[category] +=
                Number(
                    product.quantity || 0
                );
        }
    );

    container.innerHTML = "";

    Object.keys(categories).forEach(
        function (category) {
            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "category-item";

            item.innerHTML = `
                <span>
                    ${category}
                </span>

                <strong>
                    ${categories[category]}
                </strong>
            `;

            container.appendChild(item);
        }
    );
}

// *==========================================*
// *QUANTITY BY CATEGORY*
// *==========================================*

function displayCategoryQuantity(products) {
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
                product.category ||
                "Other";

            if (!quantities[category]) {
                quantities[category] = 0;
            }

            quantities[category] +=
                Number(
                    product.quantity || 0
                );
        }
    );

    container.innerHTML = "";

    Object.keys(quantities).forEach(
        function (category) {
            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "category-item";

            item.innerHTML = `
                <span>
                    ${category}
                </span>

                <strong>
                    ${quantities[category]}
                </strong>
            `;

            container.appendChild(item);
        }
    );
}

// *==========================================*
// *ALLOCATION ANALYSIS*
// *==========================================*

function displayAllocationAnalysis(products) {
    let allocated = 0;
    let pending = 0;
    let notAllocated = 0;

    products.forEach(
        function (product) {
            const quantity =
                Number(
                    product.quantity || 0
                );

            const allocatedQuantity =
                Math.max(
                    0,
                    Math.min(
                        Number(
                            product.allocatedQuantity || 0
                        ),
                        quantity
                    )
                );

            if (allocatedQuantity === 0) {
                notAllocated +=
                    quantity;
            } else if (
                allocatedQuantity <
                quantity
            ) {
                allocated +=
                    allocatedQuantity;

                pending +=
                    quantity -
                    allocatedQuantity;
            } else {
                allocated +=
                    quantity;
            }
        }
    );

    setValue(
        "allocatedProducts",
        allocated
    );

    setValue(
        "pendingProducts",
        pending
    );

    setValue(
        "notAllocatedProducts",
        notAllocated
    );
}

// *==========================================*
// *PRODUCT CHARACTERISTICS*
// *==========================================*

function displayProductCharacteristics(products) {
    let fragile = 0;
    let nonFragile = 0;
    let totalWeight = 0;

    products.forEach(
        function (product) {
            const quantity =
                Number(
                    product.quantity || 0
                );

            const fragileValue =
                String(
                    product.fragile || ""
                ).toLowerCase();

            if (
                fragileValue === "yes" ||
                fragileValue === "true"
            ) {
                fragile +=
                    quantity;
            } else {
                nonFragile +=
                    quantity;
            }

            totalWeight +=
                quantity *
                Number(
                    product.weight || 0
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

// *==========================================*
// *SLOT ANALYSIS*
// *==========================================*

function displaySlotAnalysis(slots, size) {
    const sizeSlots =
        slots.filter(
            function (slot) {
                return (
                    slot.size ===
                    size
                );
            }
        );

    const total =
        sizeSlots.length;

    const occupied =
        sizeSlots.filter(
            function (slot) {
                return (
                    Number(
                        slot.usedVolume || 0
                    ) > 0
                );
            }
        ).length;

    const empty =
        total -
        occupied;

    let totalVolume = 0;
    let usedVolume = 0;

    sizeSlots.forEach(
        function (slot) {
            totalVolume +=
                Number(
                    slot.volume || 0
                );

            usedVolume +=
                Number(
                    slot.usedVolume || 0
                );
        }
    );

    let utilization = 0;

    if (totalVolume > 0) {
        utilization =
            (
                usedVolume /
                totalVolume
            ) * 100;
    }

    utilization =
        Math.min(
            Math.max(
                utilization,
                0
            ),
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
    }
}

// *==========================================*
// *SPACE ANALYSIS*
// *==========================================*

function displaySpaceAnalysis(slots) {
    let totalVolume = 0;
    let usedVolume = 0;

    slots.forEach(
        function (slot) {
            totalVolume +=
                Number(
                    slot.volume || 0
                );

            usedVolume +=
                Number(
                    slot.usedVolume || 0
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

    // *======================================*
    // *MOST UTILIZED SLOT TYPE*
    // *======================================*

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
                            slot.size ===
                            size
                        );
                    }
                );

            let total = 0;
            let used = 0;

            sizeSlots.forEach(
                function (slot) {
                    total +=
                        Number(
                            slot.volume || 0
                        );

                    used +=
                        Number(
                            slot.usedVolume || 0
                        );
                }
            );

            if (total > 0) {
                const utilization =
                    (
                        used /
                        total
                    ) * 100;

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

// *==========================================*
// *PENDING PRODUCTS*
// *==========================================*

function displayPendingProducts(products) {
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
                const quantity =
                    Number(
                        product.quantity || 0
                    );

                const allocated =
                    Number(
                        product.allocatedQuantity || 0
                    );

                return (
                    allocated <
                    quantity
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
            const quantity =
                Number(
                    product.quantity || 0
                );

            const allocated =
                Number(
                    product.allocatedQuantity || 0
                );

            const remaining =
                Math.max(
                    quantity -
                    allocated,
                    0
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
                        ${product.name || ""}
                    </strong>

                    <p class="pending-product-details">
                        Category:
                        ${product.category || "Other"}
                    </p>
                </div>

                <div class="pending-product-status">
                    ${remaining} remaining
                </div>
            `;

            container.appendChild(item);
        }
    );
}

// *==========================================*
// *WAREHOUSE INSIGHTS*
// *==========================================*

function generateInsights(products, slots) {
    const container =
        document.getElementById(
            "warehouseInsights"
        );

    if (!container) {
        return;
    }

    const insights = [];

    // *======================================*
    // *NO DATA*
    // *======================================*

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

    // *======================================*
    // *UTILIZATION*
    // *======================================*

    let totalVolume = 0;
    let usedVolume = 0;

    slots.forEach(
        function (slot) {
            totalVolume +=
                Number(
                    slot.volume || 0
                );

            usedVolume +=
                Number(
                    slot.usedVolume || 0
                );
        }
    );

    let utilization = 0;

    if (totalVolume > 0) {
        utilization =
            (
                usedVolume /
                totalVolume
            ) * 100;
    }

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

    // *======================================*
    // *PENDING PRODUCTS*
    // *======================================*

    const pendingProducts =
        products.filter(
            function (product) {
                return (
                    Number(
                        product.allocatedQuantity || 0
                    )
                    <
                    Number(
                        product.quantity || 0
                    )
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
                    const quantity =
                        Number(
                            product.quantity || 0
                        );

                    const allocated =
                        Number(
                            product.allocatedQuantity || 0
                        );

                    return total +
                        Math.max(
                            quantity -
                            allocated,
                            0
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

    // *======================================*
    // *EMPTY SLOTS*
    // *======================================*

    const emptySlots =
        slots.filter(
            function (slot) {
                return (
                    Number(
                        slot.usedVolume || 0
                    ) === 0
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

    // *======================================*
    // *MOST USED SLOT*
    // *======================================*

    let mostUsedSlot = null;
    let highestPercentage = -1;

    slots.forEach(
        function (slot) {
            const volume =
                Number(
                    slot.volume || 0
                );

            const used =
                Number(
                    slot.usedVolume || 0
                );

            if (volume > 0) {
                const percentage =
                    (
                        used /
                        volume
                    ) * 100;

                if (
                    percentage >
                    highestPercentage
                ) {
                    highestPercentage =
                        percentage;

                    mostUsedSlot =
                        slot;
                }
            }
        }
    );

    if (mostUsedSlot) {
        insights.push({
            title:
                "Most utilized slot",

            text:
                mostUsedSlot.id +
                " is currently using " +
                highestPercentage.toFixed(1) +
                "% of its capacity."
        });
    }

    // *======================================*
    // *DISPLAY*
    // *======================================*

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
                    ${insight.title}
                </strong>

                <p>
                    ${insight.text}
                </p>
            `;

            container.appendChild(card);
        }
    );
}

// *==========================================*
// *CHART HELPER*
// *==========================================*

function prepareChartCanvas(canvas, height) {
    if (!canvas) {
        return;
    }

    canvas.style.width =
        "100%";

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

// *==========================================*
// *CHART TOOLTIP DEFAULTS*
// *==========================================*

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

        borderWidth:
            1,

        padding:
            12,

        cornerRadius:
            8,

        displayColors:
            true
    };
}

// *==========================================*
// *HOVER ANIMATION HELPER*
// *==========================================*

function setupChartHoverAnimation(
    chart,
    type
) {
    if (!chart) {
        return;
    }

    chart._hoverAnimating = false;

    chart.options.onHover =
        function (event, activeElements) {
            if (
                activeElements.length === 0 ||
                chart._hoverAnimating
            ) {
                return;
            }

            chart._hoverAnimating = true;

            // *==================================*
            // *SAVE ORIGINAL DATA*
            // *==================================*

            chart.data.datasets.forEach(
                function (dataset) {
                    dataset._hoverOriginalData =
                        Array.isArray(dataset.data)
                            ? [...dataset.data]
                            : [];
                }
            );

            // *==================================*
            // *STOP ALL ANIMATION*
            // *==================================*

            chart.options.animation =
                false;

            // *==================================*
            // *SET CHART TO ZERO*
            // *==================================*

            chart.data.datasets.forEach(
                function (dataset) {
                    dataset.data =
                        dataset.data.map(
                            function () {
                                return 0;
                            }
                        );
                }
            );

            // *Render immediately at zero*

            chart.update("none");

            // *==================================*
            // *RESTORE REAL VALUES*
            // *==================================*

            chart.data.datasets.forEach(
                function (dataset) {
                    dataset.data =
                        dataset._hoverOriginalData
                            ? [...dataset._hoverOriginalData]
                            : [];
                }
            );

            // *==================================*
            // *ANIMATE ZERO -> REAL VALUE*
            // *==================================*

            chart.options.animation = {
                duration: 700,
                easing: "easeOutCubic"
            };

            chart.update();

            // *==================================*
            // *RESET AFTER ANIMATION*
            // *==================================*

            setTimeout(
                function () {
                    chart.options.animation =
                        false;

                    chart._hoverAnimating =
                        false;
                },
                750
            );
        };

    chart.options.onLeave =
        function () {
            chart._hoverAnimating =
                false;
        };
}

// *==========================================*
// *CATEGORY QUANTITY CHART*
// *==========================================*

function displayCategoryChart(products) {
    const canvas =
        document.getElementById(
            "categoryChart"
        );

    if (!canvas) {
        return;
    }

    prepareChartCanvas(
        canvas,
        220
    );

    // *======================================*
    // *PREPARE DATA*
    // *======================================*

    const categories = {};

    products.forEach(
        function (product) {
            const category =
                product.category ||
                "Other";

            if (!categories[category]) {
                categories[category] = 0;
            }

            categories[category] +=
                Number(
                    product.quantity || 0
                );
        }
    );

    let labels =
        Object.keys(categories);

    let values =
        Object.values(categories);

    if (labels.length === 0) {
        labels = [
            "No Data"
        ];

        values = [
            0
        ];
    }

    // *======================================*
    // *DESTROY OLD CHART*
    // *======================================*

    if (categoryChartInstance) {
        categoryChartInstance.destroy();
        categoryChartInstance =
            null;
    }

    const context =
        canvas.getContext("2d");

    // *======================================*
    // *GRADIENT*
    // *======================================*

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

    // *======================================*
    // *CREATE CHART*
    // *======================================*

    categoryChartInstance =
        new Chart(
            canvas,
            {
                type:
                    "bar",

                data: {
                    labels:
                        labels,

                    datasets: [
                        {
                            label:
                                "Quantity",

                            data:
                                values,

                            backgroundColor:
                                gradient,

                            borderColor:
                                "#d97706",

                            borderWidth:
                                1,

                            borderRadius:
                                8,

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
                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    animation:
                        false,

                    plugins: {
                        legend: {
                            display:
                                false
                        },

                        tooltip:
                            getChartTooltipOptions()
                    },

                    scales: {
                        x: {
                            grid: {
                                display:
                                    false
                            },

                            border: {
                                display:
                                    false
                            },

                            ticks: {
                                color:
                                    "#64748b",

                                font: {
                                    size:
                                        12,

                                    weight:
                                        "600"
                                }
                            }
                        },

                        y: {
                            beginAtZero:
                                true,

                            border: {
                                display:
                                    false
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

                                padding:
                                    10,

                                precision:
                                    0,

                                font: {
                                    size:
                                        11
                                }
                            }
                        }
                    }
                }
            }
        );

    // *======================================*
    // *ENABLE HOVER ANIMATION*
    // *======================================*

    setupChartHoverAnimation(
        categoryChartInstance,
        "bar"
    );
}

// *==========================================*
// *ALLOCATION STATUS DOUGHNUT CHART*
// *==========================================*

function displayAllocationChart(products) {
    const canvas =
        document.getElementById(
            "allocationChart"
        );

    if (!canvas) {
        return;
    }

    prepareChartCanvas(
        canvas,
        220
    );

    let allocated = 0;
    let pending = 0;
    let notAllocated = 0;

    // *======================================*
    // *CALCULATE DATA*
    // *======================================*

    products.forEach(
        function (product) {
            const quantity =
                Number(
                    product.quantity || 0
                );

            const allocatedQuantity =
                Math.max(
                    0,
                    Math.min(
                        Number(
                            product.allocatedQuantity || 0
                        ),
                        quantity
                    )
                );

            if (
                allocatedQuantity === 0
            ) {
                notAllocated +=
                    quantity;
            } else if (
                allocatedQuantity <
                quantity
            ) {
                allocated +=
                    allocatedQuantity;

                pending +=
                    quantity -
                    allocatedQuantity;
            } else {
                allocated +=
                    quantity;
            }
        }
    );

    let chartData = [
        allocated,
        pending,
        notAllocated
    ];

    // *======================================*
    // *NO DATA*
    // *======================================*

    if (
        allocated === 0 &&
        pending === 0 &&
        notAllocated === 0
    ) {
        chartData = [
            1,
            0,
            0
        ];
    }

    // *======================================*
    // *DESTROY OLD CHART*
    // *======================================*

    if (allocationChartInstance) {
        allocationChartInstance.destroy();
        allocationChartInstance =
            null;
    }

    // *======================================*
    // *CREATE DOUGHNUT*
    // *======================================*

    allocationChartInstance =
        new Chart(
            canvas,
            {
                type:
                    "doughnut",

                data: {
                    labels: [
                        "Fully Allocated",
                        "Pending",
                        "Not Allocated"
                    ],

                    datasets: [
                        {
                            data:
                                chartData,

                            backgroundColor: [
                                "#16a34a",
                                "#f59e0b",
                                "#ef4444"
                            ],

                            borderColor:
                                "#ffffff",

                            borderWidth:
                                4,

                            hoverOffset:
                                8,

                            spacing:
                                3
                        }
                    ]
                },

                options: {
                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    cutout:
                        "68%",

                    animation:
                        false,

                    plugins: {
                        legend: {
                            position:
                                "bottom",

                            labels: {
                                usePointStyle:
                                    true,

                                pointStyle:
                                    "circle",

                                padding:
                                    18,

                                color:
                                    "#475569",

                                font: {
                                    size:
                                        12,

                                    weight:
                                        "600"
                                }
                            }
                        },

                        tooltip:
                            getChartTooltipOptions()
                    }
                }
            }
        );

    // *======================================*
    // *ENABLE HOVER ANIMATION*
    // *======================================*

    setupChartHoverAnimation(
        allocationChartInstance,
        "doughnut"
    );
}

// *==========================================*
// *SLOT UTILIZATION CHART*
// *==========================================*

function displaySlotUtilizationChart(slots) {
    const canvas =
        document.getElementById(
            "slotUtilizationChart"
        );

    if (!canvas) {
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

    const utilizationValues = [];

    // *======================================*
    // *CALCULATE UTILIZATION*
    // *======================================*

    sizes.forEach(
        function (size) {
            const sizeSlots =
                slots.filter(
                    function (slot) {
                        return (
                            slot.size ===
                            size
                        );
                    }
                );

            let totalVolume = 0;
            let usedVolume = 0;

            sizeSlots.forEach(
                function (slot) {
                    totalVolume +=
                        Number(
                            slot.volume || 0
                        );

                    usedVolume +=
                        Number(
                            slot.usedVolume || 0
                        );
                }
            );

            let utilization = 0;

            if (totalVolume > 0) {
                utilization =
                    (
                        usedVolume /
                        totalVolume
                    ) * 100;
            }

            utilization =
                Math.min(
                    Math.max(
                        utilization,
                        0
                    ),
                    100
                );

            utilizationValues.push(
                Number(
                    utilization.toFixed(1)
                )
            );
        }
    );

    // *======================================*
    // *DESTROY OLD CHART*
    // *======================================*

    if (slotUtilizationChartInstance) {
        slotUtilizationChartInstance.destroy();

        slotUtilizationChartInstance =
            null;
    }

    // *======================================*
    // *CREATE CHART*
    // *======================================*

    slotUtilizationChartInstance =
        new Chart(
            canvas,
            {
                type:
                    "bar",

                data: {
                    labels:
                        sizes,

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

                            borderWidth:
                                1,

                            borderRadius:
                                10,

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
                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    animation:
                        false,

                    plugins: {
                        legend: {
                            display:
                                false
                        },

                        tooltip: {
                            ...getChartTooltipOptions(),

                            callbacks: {
                                label:
                                    function (context) {
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
                                display:
                                    false
                            },

                            border: {
                                display:
                                    false
                            },

                            ticks: {
                                color:
                                    "#475569",

                                font: {
                                    size:
                                        12,

                                    weight:
                                        "700"
                                }
                            }
                        },

                        y: {
                            beginAtZero:
                                true,

                            max:
                                100,

                            border: {
                                display:
                                    false
                            },

                            grid: {
                                color:
                                    "#e5e7eb",

                                drawTicks:
                                    false
                            },

                            ticks: {
                                stepSize:
                                    20,

                                color:
                                    "#64748b",

                                padding:
                                    10,

                                callback:
                                    function (value) {
                                        return (
                                            value +
                                            "%"
                                        );
                                    },

                                font: {
                                    size:
                                        11
                                }
                            }
                        }
                    }
                }
            }
        );

    // *======================================*
    // *ENABLE HOVER ANIMATION*
    // *======================================*

    setupChartHoverAnimation(
        slotUtilizationChartInstance,
        "bar"
    );
}

// *==========================================*
// *LOGOUT*
// *==========================================*

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

// *==========================================*
// *REFRESH ANALYTICS*
// *==========================================*

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

// *==========================================*
// *CSV EXPORT*
// *==========================================*

// *==========================================*
// *CSV VALUE FORMATTER*
// *==========================================*

function csvValue(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    const stringValue =
        String(value);

    // Escape quotes and wrap every value
    // inside quotes.

    return '"' +
        stringValue
            .replace(/"/g, '""') +
        '"';
}

// *==========================================*
// *CREATE CSV*
// *==========================================*

function createCSV(headers, rows) {
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
    ].join("\n");
}

// *==========================================*
// *DOWNLOAD CSV*
// *==========================================*

function downloadCSV(
    csvContent,
    filename
) {
    // BOM helps Excel correctly recognize
    // UTF-8 CSV files.

    const BOM =
        "\uFEFF";

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
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href =
        url;

    link.download =
        filename;

    document.body.appendChild(
        link
    );

    link.click();

    document.body.removeChild(
        link
    );

    URL.revokeObjectURL(
        url
    );
}

// *==========================================*
// *CURRENT USER FOR EXPORT*
// *==========================================*

function getExportUser() {
    const savedUser =
        localStorage.getItem(
            CURRENT_USER_KEY
        );

    if (!savedUser) {
        return null;
    }

    try {
        return JSON.parse(savedUser);
    } catch (error) {
        console.error(
            "Invalid user data:",
            error
        );

        return null;
    }
}

// *==========================================*
// *FORMAT DATE FOR CSV*
// *==========================================*

function formatCSVDate(dateValue) {
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
        return String(dateValue);
    }

    return date.toLocaleString();
}

// *==========================================*
// *GET PRODUCT ADDED DATE*
// *==========================================*

function getProductAddedDate(product) {
    /*
     * IMPORTANT:
     *
     * addedAt is the preferred property.
     *
     * createdAt and date are fallback
     * properties for compatibility with
     * older product records.
     *
     * We NEVER use the CSV export date here.
     */

    return (
        product.addedAt ||
        product.createdAt ||
        product.date ||
        ""
    );
}

// *==========================================*
// *EXPORT PRODUCTS CSV*
// *==========================================*

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

    /*
     * Only export products belonging
     * to the currently logged-in user.
     */

    const products =
        allProducts.filter(
            function (product) {
                return (
                    product.userEmail ===
                    currentUser.email
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

    const rows =
        products.map(
            function (product) {
                const quantity =
                    Number(
                        product.quantity || 0
                    );

                const allocated =
                    Math.max(
                        0,
                        Math.min(
                            Number(
                                product.allocatedQuantity || 0
                            ),
                            quantity
                        )
                    );

                const remaining =
                    Math.max(
                        quantity -
                        allocated,
                        0
                    );

                let allocationStatus;

                if (allocated === 0) {
                    allocationStatus =
                        "Not Allocated";
                }
                else if (
                    allocated <
                    quantity
                ) {
                    allocationStatus =
                        "Partially Allocated";
                }
                else {
                    allocationStatus =
                        "Fully Allocated";
                }

                /*
                 * Get the ACTUAL product added
                 * date/time.
                 *
                 * This is NOT the export date.
                 */

                const addedDate =
                    getProductAddedDate(
                        product
                    );

                return [
                    product.name || "",
                    product.category || "Other",
                    quantity,
                    product.weight || 0,
                    product.size || "",
                    allocated,
                    remaining,
                    allocationStatus,
                    formatCSVDate(
                        addedDate
                    )
                ];
            }
        );

    const csv =
        createCSV(
            headers,
            rows
        );

    /*
     * The filename date is only the
     * date on which the CSV was exported.
     *
     * It does NOT appear as the
     * Product Added Date & Time column.
     */

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

// *==========================================*
// *EXPORT WAREHOUSE SLOTS CSV*
// *==========================================*

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

    /*
     * Only export slots belonging
     * to the current user.
     */

    const slots =
        allSlots.filter(
            function (slot) {
                return (
                    slot.userEmail ===
                    currentUser.email
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
                    Number(
                        slot.volume || 0
                    );

                const used =
                    Math.max(
                        Number(
                            slot.usedVolume || 0
                        ),
                        0
                    );

                const available =
                    Math.max(
                        capacity -
                        used,
                        0
                    );

                let utilization = 0;

                if (capacity > 0) {
                    utilization =
                        (
                            used /
                            capacity
                        ) * 100;
                }

                utilization =
                    Math.min(
                        Math.max(
                            utilization,
                            0
                        ),
                        100
                    );

                const hasProduct =
                    (
                        slot.productId !== null &&
                        slot.productId !== undefined &&
                        slot.productId !== ""
                    ) ||
                    (
                        slot.productName !== null &&
                        slot.productName !== undefined &&
                        slot.productName !== ""
                    ) ||
                    Number(
                        slot.productQuantity || 0
                    ) > 0;

                const slotState =
                    hasProduct
                        ? "Occupied"
                        : "Empty";

                return [
                    slot.id || "",
                    slot.size || "",
                    slot.length || 0,
                    slot.breadth || 0,
                    slot.height || 0,
                    capacity,
                    used,
                    available,
                    utilization.toFixed(1),
                    slotState,
                    slot.productId || "",
                    slot.productName || "",
                    Number(
                        slot.productQuantity || 0
                    )
                ];
            }
        );

    const csv =
        createCSV(
            headers,
            rows
        );

    /*
     * Filename date only.
     * This is NOT product added date.
     */

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

// *==========================================*
// *CSV BUTTON EVENTS*
// *==========================================*

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

// *==========================================*
// *START*
// *==========================================*

document.addEventListener(
    "DOMContentLoaded",
    function () {
        loadAnalytics();
    }
);