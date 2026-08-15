const PRODUCT_KEY = "products";
const INVENTORY_KEY = "inventory";
const CURRENT_USER_KEY = "currentuser";


// -----------------------------
// Get current logged-in user
// -----------------------------

function getCurrentUser() {

    const savedUser =
        localStorage.getItem(CURRENT_USER_KEY);

    if (!savedUser) {

        window.location.href = "login.html";

        return null;
    }

    return JSON.parse(savedUser);
}


// -----------------------------
// Get products
// -----------------------------

function getProducts() {

    const savedProducts =
        localStorage.getItem(PRODUCT_KEY);

    if (savedProducts) {

        return JSON.parse(savedProducts);
    }

    return [];
}


// -----------------------------
// Get inventory
// -----------------------------

function getInventory() {

    const savedInventory =
        localStorage.getItem(INVENTORY_KEY);

    if (savedInventory) {

        return JSON.parse(savedInventory);
    }

    return [];
}


// -----------------------------
// Load dashboard
// -----------------------------

function loadDashboard() {

    const currentUser = getCurrentUser();

    if (!currentUser) {
        return;
    }


    // Display user name

    document.getElementById("welcomeUser").innerText =
        "Welcome, " + currentUser.name;


    // Get all data

    const allProducts = getProducts();

    const allInventory = getInventory();


    // Only show current user's products

    const products = allProducts.filter(
        function (product) {

            return product.userEmail === currentUser.email;
        }
    );


    // Only show current user's inventory

    const inventory = allInventory.filter(
        function (item) {

            const product = products.find(
                function (product) {

                    return product.id === item.productId;
                }
            );

            return product !== undefined;
        }
    );


    // -----------------------------
    // Product calculations
    // -----------------------------

    const totalProducts = products.length;


    const totalQuantity = products.reduce(
        function (total, product) {

            return total + Number(product.quantity || 0);

        },
        0
    );


    const totalWeight = products.reduce(
        function (total, product) {

            return total + Number(product.weight || 0);

        },
        0
    );


    // -----------------------------
    // Inventory calculations
    // -----------------------------

    const inventoryEntries = inventory.length;


    const occupiedSlots = inventory.length;


    // Temporary warehouse capacity

    const TOTAL_SLOTS = 0;


    const availableSlots =
        Math.max(TOTAL_SLOTS - occupiedSlots, 0);


    // Space percentage

    const usedPercentage =
        Math.min(
            (occupiedSlots / TOTAL_SLOTS) * 100,
            100
        );


    const freePercentage =
        100 - usedPercentage;


    // -----------------------------
    // Display statistics
    // -----------------------------

    document.getElementById("totalProducts")
        .innerText = totalProducts;


    document.getElementById("totalQuantity")
        .innerText = totalQuantity;


    document.getElementById("totalWeight")
        .innerText =
        totalWeight.toFixed(2) + " kg";


    document.getElementById("inventoryEntries")
        .innerText = inventoryEntries;


    document.getElementById("occupiedSlots")
        .innerText = occupiedSlots;


    document.getElementById("availableSlots")
        .innerText = availableSlots;


    // -----------------------------
    // Space analysis
    // -----------------------------

    document.getElementById("usedSpace")
        .innerText =
        usedPercentage.toFixed(1) + "%";


    document.getElementById("freeSpace")
        .innerText =
        freePercentage.toFixed(1) + "%";


    document.getElementById("spaceProgress")
        .style.width =
        usedPercentage + "%";


    // -----------------------------
    // Display inventory
    // -----------------------------

    displayInventory(inventory);
}


// -----------------------------
// Display inventory
// -----------------------------

function displayInventory(inventory) {

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

            const inventoryItem =
                document.createElement("div");

            inventoryItem.className =
                "inventory-row";


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

            `;


            inventoryList.appendChild(
                inventoryItem
            );
        }
    );
}


// -----------------------------
// Logout
// -----------------------------

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


// -----------------------------
// Start dashboard
// -----------------------------

loadDashboard();