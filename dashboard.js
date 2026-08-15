const PRODUCT_KEY = "products";
const INVENTORY_KEY = "inventory";
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

    return JSON.parse(savedUser);
}


// ==========================================
// GET PRODUCTS
// ==========================================

function getProducts() {

    const savedProducts =
        localStorage.getItem(PRODUCT_KEY);

    if (savedProducts) {

        return JSON.parse(savedProducts);
    }

    return [];
}


// ==========================================
// GET INVENTORY
// ==========================================

function getInventory() {

    const savedInventory =
        localStorage.getItem(INVENTORY_KEY);

    if (savedInventory) {

        return JSON.parse(savedInventory);
    }

    return [];
}


// ==========================================
// GET WAREHOUSE SLOTS
// ==========================================

function getSlots() {

    const savedSlots =
        localStorage.getItem(SLOT_KEY);

    if (savedSlots) {

        return JSON.parse(savedSlots);
    }

    return [];
}


// ==========================================
// LOAD DASHBOARD
// ==========================================

function loadDashboard() {

    const currentUser = getCurrentUser();

    if (!currentUser) {
        return;
    }


    // --------------------------------------
    // Welcome message
    // --------------------------------------

    document.getElementById("welcomeUser").innerText =
        "Welcome, " + currentUser.name;


    // --------------------------------------
    // Get all data
    // --------------------------------------

    const allProducts = getProducts();

    const allInventory = getInventory();

    const allSlots = getSlots();


    // --------------------------------------
    // Current user's products
    // --------------------------------------

    const products = allProducts.filter(
        function (product) {

            return (
                product.userEmail === currentUser.email
            );

        }
    );


    // --------------------------------------
    // Current user's inventory
    // --------------------------------------

    const inventory = allInventory.filter(
        function (item) {

            const product = products.find(
                function (product) {

                    return (
                        product.id === item.productId
                    );

                }
            );

            return product !== undefined;

        }
    );


    // ======================================
    // PRODUCT CALCULATIONS
    // ======================================

    const totalProducts =
        products.length;


    const totalQuantity =
        products.reduce(
            function (total, product) {

                return (
                    total +
                    Number(product.quantity || 0)
                );

            },
            0
        );


    /*
        IMPORTANT:

        Weight is weight PER UNIT.

        Therefore:

        quantity × weight
    */

    const totalWeight =
        products.reduce(
            function (total, product) {

                return (
                    total +
                    (
                        Number(product.quantity || 0) *
                        Number(product.weight || 0)
                    )
                );

            },
            0
        );


    // ======================================
    // WAREHOUSE SLOT CALCULATIONS
    // ======================================

    const totalSlots =
        allSlots.length;


    const occupiedSlots =
        allSlots.filter(
            function (slot) {

                return Number(slot.used || 0) > 0;

            }
        ).length;


    const availableSlots =
        allSlots.filter(
            function (slot) {

                return Number(slot.used || 0) <
                       Number(slot.capacity || 0);

            }
        ).length;


    const emptySlots =
        allSlots.filter(
            function (slot) {

                return Number(slot.used || 0) === 0;

            }
        ).length;


    // ======================================
    // TOTAL WAREHOUSE CAPACITY
    // ======================================

    const totalCapacity =
        allSlots.reduce(
            function (total, slot) {

                return (
                    total +
                    Number(slot.capacity || 0)
                );

            },
            0
        );


    // ======================================
    // TOTAL USED CAPACITY
    // ======================================

    const usedCapacity =
        allSlots.reduce(
            function (total, slot) {

                return (
                    total +
                    Number(slot.used || 0)
                );

            },
            0
        );


    // ======================================
    // SPACE UTILIZATION
    // ======================================

    let usedPercentage = 0;

    if (totalCapacity > 0) {

        usedPercentage =
            (
                usedCapacity /
                totalCapacity
            ) * 100;

    }


    usedPercentage =
        Math.min(
            Math.max(usedPercentage, 0),
            100
        );


    const freePercentage =
        100 - usedPercentage;


    // ======================================
    // DISPLAY STATISTICS
    // ======================================

    document.getElementById(
        "totalProducts"
    ).innerText =
        totalProducts;


    document.getElementById(
        "totalQuantity"
    ).innerText =
        totalQuantity;


    document.getElementById(
        "totalWeight"
    ).innerText =
        totalWeight.toFixed(2) + " kg";


    document.getElementById(
        "inventoryEntries"
    ).innerText =
        inventory.length;


    document.getElementById(
        "occupiedSlots"
    ).innerText =
        occupiedSlots;


    document.getElementById(
        "availableSlots"
    ).innerText =
        availableSlots;


    // ======================================
    // SPACE ANALYSIS
    // ======================================

    document.getElementById(
        "usedSpace"
    ).innerText =
        usedPercentage.toFixed(1) + "%";


    document.getElementById(
        "freeSpace"
    ).innerText =
        freePercentage.toFixed(1) + "%";


    document.getElementById(
        "spaceProgress"
    ).style.width =
        usedPercentage + "%";


    // ======================================
    // DISPLAY INVENTORY
    // ======================================

    displayInventory(inventory, allSlots);
}


// ==========================================
// DISPLAY INVENTORY
// ==========================================

function displayInventory(inventory, slots) {

    const inventoryList =
        document.getElementById("inventoryList");


    if (inventory.length === 0) {

        inventoryList.innerHTML = `
            <p class="empty-message">
                No inventory available.
            </p>
        `;

        return;
    }


    inventoryList.innerHTML = "";


    inventory.forEach(
        function (item) {


            // --------------------------------
            // Find slot containing product
            // --------------------------------

            const slot =
                slots.find(
                    function (slot) {

                        return (
                            slot.productId ===
                            item.productId
                        );

                    }
                );


            const inventoryItem =
                document.createElement("div");


            inventoryItem.className =
                "inventory-row";


            // --------------------------------
            // Slot information
            // --------------------------------

            let slotText =
                "Not assigned";


            if (slot) {

                slotText =
                    slot.id;

            }


            inventoryItem.innerHTML = `

                <div>
                    <strong>
                        ${item.productName}
                    </strong>
                </div>

                <div>
                    Size: ${item.size}
                </div>

                <div>
                    Quantity: ${item.quantity}
                </div>

                <div>
                    Slot:
                    <strong>
                        ${slotText}
                    </strong>
                </div>

            `;


            inventoryList.appendChild(
                inventoryItem
            );

        }
    );
}


// ==========================================
// LOGOUT
// ==========================================

document.getElementById("logoutBtn")
    .addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                CURRENT_USER_KEY
            );

            window.location.href =
                "login.html";

        }
    );


// ==========================================
// START
// ==========================================

loadDashboard();