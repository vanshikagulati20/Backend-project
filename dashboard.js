const PRODUCT_KEY = "products";
const SLOT_KEY = "warehouseSlots";
const CURRENT_USER_KEY = "currentuser";


// ==========================================
// CURRENT USER
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

        console.error(
            "Invalid current user data",
            error
        );

        localStorage.removeItem(
            CURRENT_USER_KEY
        );

        window.location.href = "login.html";

        return null;
    }
}


// ==========================================
// PRODUCTS
// ==========================================

function getProducts() {

    const saved =
        localStorage.getItem(PRODUCT_KEY);

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
        localStorage.getItem(SLOT_KEY);

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
    // WELCOME
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
    // DATA
    // ======================================

    const allProducts =
        getProducts();

    const allSlots =
        getSlots();


    // ======================================
    // CURRENT USER PRODUCTS
    // ======================================

    const products =
        allProducts.filter(function (product) {

            return (
                product.userEmail ===
                currentUser.email
            );

        });


    // ======================================
    // CURRENT USER SLOTS
    //
    // IMPORTANT:
    // Older slots may not have userEmail.
    // Because localStorage was created before
    // user ownership was added, we treat
    // missing userEmail slots as belonging
    // to the current user.
    // ======================================

    const slots =
        allSlots.filter(function (slot) {

            return (
                !slot.userEmail ||
                slot.userEmail ===
                currentUser.email
            );

        });


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
                        ) *
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
        slots.filter(function (slot) {

            return (
                Number(slot.used || 0) > 0
            );

        }).length;


    const availableSlots =
        slots.filter(function (slot) {

            return (
                Number(slot.used || 0) <
                Number(slot.capacity || 0)
            );

        }).length;


    // ======================================
    // INVENTORY ENTRIES
    //
    // An inventory entry means a product
    // that has been successfully allocated.
    // ======================================

    const allocatedProducts =
        products.filter(function (product) {

            return (
                product.allocationStatus ===
                "Allocated"
            );

        });


    const inventoryEntries =
        allocatedProducts.length;


    // ======================================
    // CAPACITY
    // ======================================

    const totalCapacity =
        slots.reduce(
            function (total, slot) {

                return (
                    total +
                    Number(
                        slot.capacity || 0
                    )
                );

            },
            0
        );


    const usedCapacity =
        slots.reduce(
            function (total, slot) {

                return (
                    total +
                    Number(
                        slot.used || 0
                    )
                );

            },
            0
        );


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
        totalWeight.toFixed(2) +
        " kg";


    document.getElementById(
        "occupiedSlots"
    ).innerText =
        occupiedSlots;


    document.getElementById(
        "availableSlots"
    ).innerText =
        availableSlots;


    document.getElementById(
        "inventoryEntries"
    ).innerText =
        inventoryEntries;


    document.getElementById(
        "usedSpace"
    ).innerText =
        usedPercentage.toFixed(1) +
        "%";


    document.getElementById(
        "freeSpace"
    ).innerText =
        freePercentage.toFixed(1) +
        "%";


    document.getElementById(
        "spaceProgress"
    ).style.width =
        usedPercentage +
        "%";


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


    products.forEach(function (product) {


        const productSlots =
            slots.filter(function (slot) {

                return (
                    slot.productId ===
                    product.id
                );

            });


        let slotText =
            "Not assigned";


        if (
            productSlots.length > 0
        ) {

            slotText =
                productSlots
                    .map(function (slot) {

                        return (
                            slot.id +
                            " (" +
                            slot.used +
                            " units)"
                        );

                    })
                    .join(", ");

        }


        const row =
            document.createElement("div");


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

    });

}


// ==========================================
// LOGOUT
// ==========================================

document.getElementById(
    "logoutBtn"
).addEventListener(
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