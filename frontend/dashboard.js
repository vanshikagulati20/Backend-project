const PRODUCT_KEY = "products";
const SLOT_KEY = "warehouseSlots";
const CURRENT_USER_KEY = "currentuser";


// ==========================================
// CURRENT USER
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
            "Invalid current user data",
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
// PRODUCTS
// ==========================================

function getProducts() {

    const saved =
        localStorage.getItem(
            PRODUCT_KEY
        );

    if (!saved) {

        return [];

    }

    try {

        return JSON.parse(saved);

    }

    catch (error) {

        console.error(
            "Invalid products data",
            error
        );

        return [];

    }

}


// ==========================================
// SLOTS
// ==========================================

function getSlots() {

    const saved =
        localStorage.getItem(
            SLOT_KEY
        );

    if (!saved) {

        return [];

    }

    try {

        return JSON.parse(saved);

    }

    catch (error) {

        console.error(
            "Invalid warehouse slot data",
            error
        );

        return [];

    }

}


// ==========================================
// LOAD DASHBOARD
// ==========================================

function loadDashboard() {

    const currentUser =
        getCurrentUser();

    if (!currentUser) {

        return;

    }


    // ======================================
    // WELCOME USER
    // ======================================

    const welcomeUser =
        document.getElementById(
            "welcomeUser"
        );

    if (welcomeUser) {

        welcomeUser.innerText =
            "Welcome, " +
            currentUser.name;

    }


    // ======================================
    // GET ALL DATA
    // ======================================

    const allProducts =
        getProducts();

    const allSlots =
        getSlots();


    // ======================================
    // CURRENT USER PRODUCTS
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


    // ======================================
    // CURRENT USER SLOTS
    // ======================================

    const slots =
        allSlots.filter(
            function (slot) {

                return (
                    slot.userEmail ===
                    currentUser.email
                );

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

                    Number(
                        product.quantity || 0
                    )

                );

            },
            0
        );


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
    // SLOT CALCULATIONS
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


    const availableSlots =
        slots.filter(
            function (slot) {

                return (

                    Number(
                        slot.usedVolume || 0
                    )

                    <

                    Number(
                        slot.volume || 0
                    )

                );

            }
        ).length;


    // ======================================
    // ALLOCATED PRODUCTS
    // ======================================

    const allocatedProducts =
        products.filter(
            function (product) {

                return (
                    product.allocationStatus ===
                    "Allocated"
                );

            }
        );


    const inventoryEntries =
        allocatedProducts.length;


    // ======================================
    // TOTAL WAREHOUSE CAPACITY
    // ======================================

    const totalCapacity =
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
    // USED WAREHOUSE CAPACITY
    // ======================================

    const usedCapacity =
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
    // CAPACITY PERCENTAGE
    // ======================================

    let usedPercentage = 0;


    if (
        totalCapacity > 0
    ) {

        usedPercentage =

            (
                usedCapacity /
                totalCapacity
            ) * 100;

    }


    usedPercentage =
        Math.min(
            Math.max(
                usedPercentage,
                0
            ),
            100
        );


    const freePercentage =
        100 -
        usedPercentage;


    // ======================================
    // UPDATE DASHBOARD
    // ======================================

    const totalProductsElement =
        document.getElementById(
            "totalProducts"
        );

    if (totalProductsElement) {

        totalProductsElement.innerText =
            totalProducts;

    }


    const totalQuantityElement =
        document.getElementById(
            "totalQuantity"
        );

    if (totalQuantityElement) {

        totalQuantityElement.innerText =
            totalQuantity;

    }


    const totalWeightElement =
        document.getElementById(
            "totalWeight"
        );

    if (totalWeightElement) {

        totalWeightElement.innerText =
            totalWeight.toFixed(2) +
            " kg";

    }


    const occupiedSlotsElement =
        document.getElementById(
            "occupiedSlots"
        );

    if (occupiedSlotsElement) {

        occupiedSlotsElement.innerText =
            occupiedSlots;

    }


    const availableSlotsElement =
        document.getElementById(
            "availableSlots"
        );

    if (availableSlotsElement) {

        availableSlotsElement.innerText =
            availableSlots;

    }


    const inventoryEntriesElement =
        document.getElementById(
            "inventoryEntries"
        );

    if (inventoryEntriesElement) {

        inventoryEntriesElement.innerText =
            inventoryEntries;

    }


    const usedSpaceElement =
        document.getElementById(
            "usedSpace"
        );

    if (usedSpaceElement) {

        usedSpaceElement.innerText =
            usedPercentage.toFixed(1) +
            "%";

    }


    const freeSpaceElement =
        document.getElementById(
            "freeSpace"
        );

    if (freeSpaceElement) {

        freeSpaceElement.innerText =
            freePercentage.toFixed(1) +
            "%";

    }


    const spaceProgress =
        document.getElementById(
            "spaceProgress"
        );

    if (spaceProgress) {

        spaceProgress.style.width =
            usedPercentage +
            "%";

    }


    // ======================================
    // DISPLAY INVENTORY
    // ======================================

    displayInventory(
        allocatedProducts,
        slots
    );

}


// ==========================================
// DISPLAY INVENTORY
// ==========================================

function displayInventory(
    products,
    slots
) {

    const inventoryList =
        document.getElementById(
            "inventoryList"
        );


    if (!inventoryList) {

        return;

    }


    if (
        products.length === 0
    ) {

        inventoryList.innerHTML = `

            <p class="empty-message">

                No inventory available.

            </p>

        `;

        return;

    }


    inventoryList.innerHTML = "";


    products.forEach(
        function (product) {


            // ==================================
            // FIND CURRENT USER PRODUCT SLOTS
            // ==================================

            const productSlots =
                slots.filter(
                    function (slot) {

                        return (

                            slot.productId ===
                            product.id

                        );

                    }
                );


            let slotText =
                "Not assigned";


            if (
                productSlots.length > 0
            ) {

                slotText =

                    productSlots
                        .map(
                            function (slot) {

                                return (

                                    slot.id +

                                    " (" +

                                    slot.productQuantity +

                                    " " +

                                    product.unit +

                                    ")"

                                );

                            }
                        )
                        .join(", ");

            }


            // ==================================
            // CREATE ROW
            // ==================================

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "inventory-row";


            row.innerHTML = `

                <div>

                    <strong>
                        ${product.name}
                    </strong>

                </div>


                <div>

                    Category:
                    ${product.category}

                </div>


                <div>

                    Quantity:
                    ${product.quantity}
                    ${product.unit}

                </div>


                <div>

                    Weight:
                    ${product.weight}
                    kg/unit

                </div>


                <div>

                    Slot:

                    <strong>
                        ${slotText}
                    </strong>

                </div>

            `;


            inventoryList.appendChild(
                row
            );

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
// START
// ==========================================

loadDashboard();