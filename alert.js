const PRODUCT_KEY = "products";
const SLOT_KEY = "warehouseSlots";
const CURRENT_USER_KEY = "currentuser";


// ==========================================
// LOW STOCK THRESHOLD
// ==========================================

const LOW_STOCK_THRESHOLD = 10;


// ==========================================
// GET CURRENT USER
// ==========================================

function getCurrentUser() {

    const savedUser =
        localStorage.getItem(
            CURRENT_USER_KEY
        );

    if (!savedUser) {

        window.location.href =
            "login.html";

        return null;
    }

    try {

        return JSON.parse(savedUser);

    }

    catch (error) {

        console.error(
            "Invalid current user data:",
            error
        );

        localStorage.removeItem(
            CURRENT_USER_KEY
        );

        window.location.href =
            "login.html";

        return null;
    }
}


// ==========================================
// GET PRODUCTS
// ==========================================

function getProducts() {

    const savedProducts =
        localStorage.getItem(
            PRODUCT_KEY
        );

    if (!savedProducts) {

        return [];
    }

    try {

        return JSON.parse(
            savedProducts
        );

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
        localStorage.getItem(
            SLOT_KEY
        );

    if (!savedSlots) {

        return [];
    }

    try {

        return JSON.parse(
            savedSlots
        );

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
// GET CURRENT USER PRODUCTS
// ==========================================

function getCurrentUserProducts() {

    const currentUser =
        getCurrentUser();

    if (!currentUser) {

        return [];
    }

    const allProducts =
        getProducts();

    return allProducts.filter(
        function (product) {

            return (
                product.userEmail ===
                currentUser.email
            );

        }
    );
}


// ==========================================
// GET CURRENT USER SLOTS
// ==========================================

function getCurrentUserSlots() {

    const currentUser =
        getCurrentUser();

    if (!currentUser) {

        return [];
    }

    const allSlots =
        getSlots();

    return allSlots.filter(
        function (slot) {

            return (
                slot.userEmail ===
                currentUser.email
            );

        }
    );
}


// ==========================================
// CREATE ALERT
// ==========================================
function createAlert(
    type,
    title,
    message
) {

    const alert =
        document.createElement("div");


    alert.className =
        "warehouse-alert alert-" +
        type;


    let icon = "⚠️";


    if (type === "danger") {

        icon = "🔴";

    }

    else if (type === "warning") {

        icon = "🟠";

    }

    else if (type === "info") {

        icon = "🟡";

    }


    alert.innerHTML = `

        <div class="alert-icon">
            ${icon}
        </div>

        <div class="alert-content">

            <strong>
                ${title}
            </strong>

            <p>
                ${message}
            </p>

        </div>

    `;


    return alert;
}

// ==========================================
// LOW STOCK ALERTS
// ==========================================

function checkLowStock(
    products,
    container
) {

    products.forEach(
        function (product) {

            const quantity =
                Number(
                    product.quantity || 0
                );


            if (
                quantity > 0 &&
                quantity <=
                LOW_STOCK_THRESHOLD
            ) {

                const alert =
                    createAlert(

                        "danger",

                        product.name,

                        "Low stock: only " +
                        quantity +
                        " " +
                        product.unit +
                        " remaining."

                    );


                container.appendChild(
                    alert
                );

            }

        }
    );
}


// ==========================================
// PENDING ALLOCATION ALERTS
// ==========================================

function checkPendingAllocation(
    products,
    container
) {

    products.forEach(
        function (product) {

            const quantity =
                Number(
                    product.quantity || 0
                );


            const allocatedQuantity =
                Number(
                    product.allocatedQuantity ||
                    0
                );


            if (
                allocatedQuantity <
                quantity
            ) {

                const remaining =
                    quantity -
                    allocatedQuantity;


                const alert =
                    createAlert(

                        "warning",

                        product.name,

                        allocatedQuantity +
                        " / " +
                        quantity +
                        " allocated. " +
                        remaining +
                        " " +
                        product.unit +
                        " still need warehouse space."

                    );


                container.appendChild(
                    alert
                );

            }

        }
    );
}


// ==========================================
// FULL SLOT ALERTS
// ==========================================

function checkFullSlots(
    slots,
    container
) {

    slots.forEach(
        function (slot) {

            const volume =
                Number(
                    slot.volume || 0
                );


            const usedVolume =
                Number(
                    slot.usedVolume || 0
                );


            if (
                volume > 0 &&
                usedVolume >= volume
            ) {

                const alert =
                    createAlert(

                        "danger",

                        "Slot " +
                        slot.id,

                        "This warehouse slot is completely occupied."

                    );


                container.appendChild(
                    alert
                );

            }

        }
    );
}


// ==========================================
// EMPTY SLOT ALERTS
// ==========================================

function checkEmptySlots(
    slots,
    container
) {

    let emptySlots = 0;


    slots.forEach(
        function (slot) {

            const usedVolume =
                Number(
                    slot.usedVolume || 0
                );


            if (
                usedVolume === 0
            ) {

                emptySlots++;

            }

        }
    );


    if (
        emptySlots > 0
    ) {

        const alert =
            createAlert(

                "info",

                "Available Warehouse Space",

                emptySlots +
                " warehouse slot(s) are currently empty."

            );


        container.appendChild(
            alert
        );

    }
}


// ==========================================
// LOAD ALERTS
// ==========================================
function loadAlerts() {

    console.log("========== ALERT SYSTEM ==========");

    const currentUser = getCurrentUser();

    if (!currentUser) {
        return;
    }

    console.log("Current user:", currentUser.email);


    const alertContainer =
        document.getElementById("alertsList");


    if (!alertContainer) {

        console.error(
            "ERROR: alertsList element not found in HTML."
        );

        return;
    }


    alertContainer.innerHTML = "";


    // ======================================
    // GET USER DATA
    // ======================================

    const allProducts =
        getProducts();

    const allSlots =
        getSlots();


    const products =
        allProducts.filter(function (product) {

            return (
                product.userEmail ===
                currentUser.email
            );

        });


    const slots =
        allSlots.filter(function (slot) {

            return (
                slot.userEmail ===
                currentUser.email
            );

        });


    console.log(
        "User products:",
        products
    );

    console.log(
        "User slots:",
        slots
    );


    let alertCount = 0;


    // ======================================
    // CHECK PENDING ALLOCATION
    // ======================================

    products.forEach(function (product) {

        const quantity =
            Number(product.quantity || 0);


        const allocatedQuantity =
            Number(
                product.allocatedQuantity || 0
            );


        console.log(
            product.name,
            "quantity =",
            quantity,
            "allocated =",
            allocatedQuantity
        );


        if (
            allocatedQuantity <
            quantity
        ) {

            const remaining =
                quantity -
                allocatedQuantity;


            const alert =
                createAlert(

                    "warning",

                    "Pending Allocation",

                    product.name +
                    " has " +
                    remaining +
                    " " +
                    product.unit +
                    " still waiting for warehouse space."

                );


            alertContainer.appendChild(
                alert
            );


            alertCount++;

        }

    });


    // ======================================
    // LOW STOCK
    // ======================================

    products.forEach(function (product) {

        const quantity =
            Number(product.quantity || 0);


        if (
            quantity > 0 &&
            quantity <= LOW_STOCK_THRESHOLD
        ) {

            const alert =
                createAlert(

                    "danger",

                    "Low Stock",

                    product.name +
                    " has only " +
                    quantity +
                    " " +
                    product.unit +
                    " remaining."

                );


            alertContainer.appendChild(
                alert
            );


            alertCount++;

        }

    });


    // ======================================
    // FULL SLOTS
    // ======================================

    slots.forEach(function (slot) {

        const volume =
            Number(slot.volume || 0);


        const usedVolume =
            Number(slot.usedVolume || 0);


        if (
            volume > 0 &&
            usedVolume >= volume
        ) {

            const alert =
                createAlert(

                    "danger",

                    "Slot " + slot.id + " Full",

                    "This warehouse slot is completely occupied."

                );


            alertContainer.appendChild(
                alert
            );


            alertCount++;

        }

    });


    // ======================================
    // NO ALERTS
    // ======================================

    if (
        alertCount === 0
    ) {

        alertContainer.innerHTML = `

            <div class="no-alerts">

                <strong>
                    ✅ Everything looks good!
                </strong>

                <p>
                    No warehouse alerts at the moment.
                </p>

            </div>

        `;

    }


    console.log(
        "Total alerts:",
        alertCount
    );

}

    // ======================================
    // GET USER DATA
    // ======================================

    const products =
        getCurrentUserProducts();


    const slots =
        getCurrentUserSlots();


    // ======================================
    // CHECK ALERTS
    // ======================================

    checkLowStock(
        products,
        alertContainer
    );


    checkPendingAllocation(
        products,
        alertContainer
    );


    checkFullSlots(
        slots,
        alertContainer
    );


    checkEmptySlots(
        slots,
        alertContainer
    );


    // ======================================
    // NO ALERTS
    // ======================================

    if (
        alertContainer.children.length === 0
    ) {

        alertContainer.innerHTML = `

            <div class="no-alerts">

                <strong>
                    ✅ Everything looks good!
                </strong>

                <p>
                    No warehouse alerts at the moment.
                </p>

            </div>

        `;

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
// INITIAL LOADy
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadAlerts();

    }
);