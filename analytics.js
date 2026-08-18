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
// LOAD ANALYTICS
// ==========================================

function loadAnalytics() {

    console.log("Analytics JS loaded");


    // ======================================
    // CURRENT USER
    // ======================================

    const currentUser =
        getCurrentUser();

    if (!currentUser) {

        return;

    }


    console.log(
        "Current user:",
        currentUser
    );


    // ======================================
    // GET ALL DATA
    // ======================================

    const allProducts =
        getProducts();

    const allSlots =
        getSlots();


    console.log(
        "All products:",
        allProducts
    );

    console.log(
        "All slots:",
        allSlots
    );


    // ======================================
    // FILTER CURRENT USER'S DATA
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
    // TOTAL PRODUCTS
    // ======================================

    const totalProducts =
        products.length;


    // ======================================
    // TOTAL QUANTITY
    // ======================================

    const totalQuantity =
        products.reduce(
            function (total, product) {

                return (
                    total +
                    Number(
                        product.quantity || 0
                    )
                );

            },
            0
        );


    // ======================================
    // TOTAL WEIGHT
    //
    // quantity × weight per unit
    // ======================================

    const totalWeight =
        products.reduce(
            function (total, product) {

                return (
                    total +

                    (
                        Number(
                            product.quantity || 0
                        )

                        *

                        Number(
                            product.weight || 0
                        )
                    )
                );

            },
            0
        );


    // ======================================
    // TOTAL SLOTS
    // ======================================

    const totalSlots =
        slots.length;


    // ======================================
    // OCCUPIED SLOTS
    //
    // A slot is occupied when usedVolume > 0
    // ======================================

    const occupiedSlots =
        slots.filter(
            function (slot) {

                return (
                    Number(
                        slot.usedVolume || 0
                    ) > 0
                );

            }
        ).length;


    // ======================================
    // AVAILABLE SLOTS
    // ======================================

    const availableSlots =
        totalSlots -
        occupiedSlots;


    // ======================================
    // TOTAL WAREHOUSE VOLUME
    // ======================================

    const totalVolume =
        slots.reduce(
            function (total, slot) {

                return (
                    total +

                    Number(
                        slot.volume || 0
                    )
                );

            },
            0
        );


    // ======================================
    // USED WAREHOUSE VOLUME
    // ======================================

    const usedVolume =
        slots.reduce(
            function (total, slot) {

                return (
                    total +

                    Number(
                        slot.usedVolume || 0
                    )
                );

            },
            0
        );


    // ======================================
    // WAREHOUSE UTILIZATION
    // ======================================

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


    // ======================================
    // DISPLAY DATA
    // ======================================

    setValue(
        "totalProducts",
        totalProducts
    );


    setValue(
        "totalQuantity",
        totalQuantity
    );


    setValue(
        "totalWeight",
        totalWeight.toFixed(2) + " kg"
    );


    setValue(
        "totalSlots",
        totalSlots
    );


    setValue(
        "occupiedSlots",
        occupiedSlots
    );


    setValue(
        "availableSlots",
        availableSlots
    );


    setValue(
        "warehouseUtilization",
        utilization.toFixed(1) + "%"
    );


    // ======================================
    // OPTIONAL PROGRESS BAR
    // ======================================

    const progressBar =
        document.getElementById(
            "utilizationProgress"
        );


    if (progressBar) {

        progressBar.style.width =
            utilization + "%";

    }


    // ======================================
    // EXTRA ANALYTICS
    // ======================================

    displayProductBreakdown(products);

}


// ==========================================
// SET VALUE SAFELY
// ==========================================

function setValue(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        console.error(
            "Element not found:",
            elementId
        );

        return;

    }


    element.innerText =
        value;

}


// ==========================================
// PRODUCT BREAKDOWN
// ==========================================

function displayProductBreakdown(products) {

    const container =
        document.getElementById(
            "productBreakdown"
        );


    if (!container) {

        return;

    }


    if (products.length === 0) {

        container.innerHTML =
            "<p>No products available.</p>";

        return;

    }


    container.innerHTML = "";


    products.forEach(
        function (product) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "product-breakdown-item";


            item.innerHTML = `

                <strong>
                    ${product.name}
                </strong>

                <span>
                    ${product.quantity}
                    ${product.unit}
                </span>

                <span>
                    ${product.weight} kg/unit
                </span>

                <span>
                    ${product.allocationStatus}
                </span>

            `;


            container.appendChild(
                item
            );

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