const PRODUCT_KEY = "products";
const SLOT_KEY = "warehouseSlots";
const CURRENT_USER_KEY = "currentuser";


// ==========================================
// GET CURRENT USER
// ==========================================

function getCurrentUser() {

    const savedUser =
        localStorage.getItem(CURRENT_USER_KEY);

    if (!savedUser) {

        window.location.href = "login.html";

        return null;
    }

    try {

        return JSON.parse(savedUser);

    }

    catch (error) {

        console.error("Invalid current user:", error);

        localStorage.removeItem(CURRENT_USER_KEY);

        window.location.href = "login.html";

        return null;
    }
}


// ==========================================
// GET PRODUCTS
// ==========================================

function getProducts() {

    const savedProducts =
        localStorage.getItem(PRODUCT_KEY);

    if (!savedProducts) {

        return [];
    }

    try {

        return JSON.parse(savedProducts);

    }

    catch (error) {

        console.error(
            "Invalid products data:",
            error
        );

        return [];
    }
}


// ==========================================
// GET SLOTS
// ==========================================

function getSlots() {

    const savedSlots =
        localStorage.getItem(SLOT_KEY);

    if (!savedSlots) {

        return [];
    }

    try {

        return JSON.parse(savedSlots);

    }

    catch (error) {

        console.error(
            "Invalid warehouse slots data:",
            error
        );

        return [];
    }
}


// ==========================================
// SET HTML VALUE
// ==========================================

function setValue(
    elementId,
    value
) {

    const element =
        document.getElementById(elementId);

    if (element) {

        element.innerText = value;

    }

}


// ==========================================
// LOAD ANALYTICS
// ==========================================

function loadAnalytics() {

    console.log("Analytics page loaded");


    // ======================================
    // CURRENT USER
    // ======================================

    const currentUser =
        getCurrentUser();

    if (!currentUser) {

        return;
    }


    // ======================================
    // WELCOME USER
    // ======================================

    const welcomeUser =
        document.getElementById("welcomeUser");

    if (welcomeUser) {

        welcomeUser.innerText =
            "Welcome, " +
            currentUser.name;

    }


    // ======================================
    // GET DATA
    // ======================================

    const allProducts =
        getProducts();

    const allSlots =
        getSlots();


    // ======================================
    // FILTER CURRENT USER DATA
    // ======================================

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


    console.log(
        "Current user products:",
        products
    );

    console.log(
        "Current user slots:",
        slots
    );


    // ======================================
    // PRODUCT ANALYSIS
    // ======================================

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


    // ======================================
    // SLOT ANALYSIS
    // ======================================

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


    // ======================================
    // SPACE ANALYSIS
    // ======================================

    displaySpaceAnalysis(
        slots
    );


    // ======================================
    // PENDING PRODUCTS
    // ======================================

    displayPendingProducts(
        products
    );


    // ======================================
    // INSIGHTS
    // ======================================

    generateInsights(
        products,
        slots
    );

}


// ==========================================
// CATEGORY DISTRIBUTION
// ==========================================

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
                product.category ||
                "Other";


            if (!categories[category]) {

                categories[category] = 0;

            }


            categories[category]++;

        }
    );


    container.innerHTML = "";


    Object.keys(categories).forEach(
        function (category) {

            const item =
                document.createElement("div");

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


// ==========================================
// QUANTITY BY CATEGORY
// ==========================================

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
                document.createElement("div");

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


// ==========================================
// ALLOCATION ANALYSIS
// ==========================================

function displayAllocationAnalysis(
    products
) {

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
                Number(
                    product.allocatedQuantity || 0
                );


            if (allocatedQuantity === 0) {

                notAllocated++;

            }

            else if (
                allocatedQuantity <
                quantity
            ) {

                pending++;

            }

            else {

                allocated++;

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


// ==========================================
// PRODUCT CHARACTERISTICS
// ==========================================

function displayProductCharacteristics(
    products
) {

    let fragile = 0;
    let nonFragile = 0;


    let totalWeight = 0;


    products.forEach(
        function (product) {

            const fragileValue =
                String(
                    product.fragile || ""
                ).toLowerCase();


            if (
                fragileValue === "yes" ||
                fragileValue === "true"
            ) {

                fragile++;

            }

            else {

                nonFragile++;

            }


            totalWeight +=

                Number(
                    product.quantity || 0
                )

                *

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


// ==========================================
// SLOT ANALYSIS
// ==========================================

function displaySlotAnalysis(
    slots,
    size
) {

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


// ==========================================
// SPACE ANALYSIS
// ==========================================

function displaySpaceAnalysis(
    slots
) {

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


    // ======================================
    // MOST UTILIZED SLOT TYPE
    // ======================================

    const sizes = [
        "Large",
        "Medium",
        "Small",
        "Custom"
    ];


    let mostUtilized =
        "-";

    let highestUtilization =
        -1;


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


// ==========================================
// PENDING PRODUCTS
// ==========================================

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
                quantity -
                allocated;


            const item =
                document.createElement("div");


            item.className =
                "pending-product-item";


            item.innerHTML = `

                <div>

                    <strong>
                        ${product.name}
                    </strong>

                    <p>
                        Category:
                        ${product.category || "Other"}
                    </p>

                </div>


                <div>

                    <strong>
                        ${remaining}
                    </strong>

                    remaining

                </div>

            `;


            container.appendChild(item);

        }
    );

}


// ==========================================
// WAREHOUSE INSIGHTS
// ==========================================

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


    // ======================================
    // NO DATA
    // ======================================

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


    // ======================================
    // UTILIZATION
    // ======================================

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
            title: "Warehouse is highly utilized",
            text:
                "Your warehouse is using more than 80% of its available volume."
        });

    }

    else if (utilization >= 50) {

        insights.push({
            title: "Warehouse utilization is moderate",
            text:
                "Your warehouse has a balanced level of space usage."
        });

    }

    else {

        insights.push({
            title: "Warehouse has available space",
            text:
                "A significant amount of warehouse volume is still available."
        });

    }


    // ======================================
    // PENDING PRODUCTS
    // ======================================

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

        insights.push({

            title:
                "Pending allocation detected",

            text:
                pendingProducts.length +
                " product(s) still require warehouse space."

        });

    }

    else {

        insights.push({

            title:
                "All products allocated",

            text:
                "All your current products have been successfully allocated."

        });

    }


    // ======================================
    // EMPTY SLOTS
    // ======================================

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


    // ======================================
    // MOST USED SLOT
    // ======================================

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


    // ======================================
    // DISPLAY
    // ======================================

    container.innerHTML = "";


    insights.forEach(
        function (insight) {

            const card =
                document.createElement("div");


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


// ==========================================
// LOGOUT
// ==========================================

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


// ==========================================
// REFRESH ANALYTICS
// ==========================================

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


// ==========================================
// START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadAnalytics();

    }
);