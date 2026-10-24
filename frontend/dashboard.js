// ============================================================
// STORVIA - DASHBOARD
// MongoDB backend integration
// ============================================================

const API_URL = "http://localhost:5000/api";
const CURRENT_USER_KEY = "currentuser";

function getCurrentUser() {
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);

    if (!savedUser) {
        window.location.href = "login.html";
        return null;
    }

    try {
        const user = JSON.parse(savedUser);

        if (!user || !user.email) {
            localStorage.removeItem(CURRENT_USER_KEY);
            window.location.href = "login.html";
            return null;
        }

        return user;
    } catch (error) {
        console.error("Invalid current user data:", error);
        localStorage.removeItem(CURRENT_USER_KEY);
        window.location.href = "login.html";
        return null;
    }
}

async function apiGet(url) {
    const response = await fetch(url);
    const result = await response.json();

    if (!response.ok || result.success === false) {
        throw new Error(
            result.message || `API request failed (${response.status})`
        );
    }

    return result;
}

function extractRecords(response, key) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response[key])) return response[key];

    return null;
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function showError(message) {
    const inventoryList = document.getElementById("inventoryList");

    if (inventoryList) {
        inventoryList.textContent = message;
    }

    console.error(message);
}

// ============================================================
// LOAD DASHBOARD DATA
// ============================================================

async function loadDashboard() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    setText(
        "welcomeUser",
        `Welcome, ${currentUser.name || currentUser.email}`
    );

    const inventoryList = document.getElementById("inventoryList");

    if (inventoryList) {
        inventoryList.textContent = "Loading dashboard data...";
    }

    try {
        const email = encodeURIComponent(
            currentUser.email.trim().toLowerCase()
        );

        const [productsResponse, slotsResponse] = await Promise.all([
            apiGet(`${API_URL}/products?userEmail=${email}`),
            apiGet(`${API_URL}/slots?userEmail=${email}`)
        ]);

        const products = extractRecords(productsResponse, "products");
        const slots = extractRecords(slotsResponse, "slots");

        if (!products || !slots) {
            console.error("Unexpected API response:", {
                productsResponse,
                slotsResponse
            });

            throw new Error(
                "Unexpected response format from the products or slots API."
            );
        }

        updateDashboard(products, slots);
    } catch (error) {
        console.error("Unable to load dashboard:", error);

        showError(
            "Could not load dashboard data. Check that the backend is running and both GET /api/products and GET /api/slots are working."
        );
    }
}

// ============================================================
// UPDATE DASHBOARD STATISTICS
// ============================================================

function updateDashboard(products, slots) {
    const totalProducts = products.length;

    const totalQuantity = products.reduce(
        (total, product) =>
            total + Number(product.quantity || 0),
        0
    );

    const totalWeight = products.reduce(
        (total, product) =>
            total +
            Number(product.quantity || 0) *
            Number(product.weight || 0),
        0
    );

    const occupiedSlots = slots.filter(
        slot => Number(slot.usedVolume || 0) > 0
    ).length;

    const availableSlots = slots.filter(
        slot => Number(slot.usedVolume || 0) < Number(slot.volume || 0)
    ).length;

    const allocatedProducts = products.filter(
        product =>
            String(product.allocationStatus || "").toLowerCase() ===
            "allocated"
    );

    const totalCapacity = slots.reduce(
        (total, slot) => total + Number(slot.volume || 0),
        0
    );

    const usedCapacity = slots.reduce(
        (total, slot) => total + Number(slot.usedVolume || 0),
        0
    );

    const usedPercentage = totalCapacity > 0
        ? Math.min(
            100,
            Math.max(0, (usedCapacity / totalCapacity) * 100)
        )
        : 0;

    const freePercentage = 100 - usedPercentage;

    setText("totalProducts", totalProducts);
    setText("totalQuantity", totalQuantity);
    setText("totalWeight", `${totalWeight.toFixed(2)} kg`);
    setText("occupiedSlots", occupiedSlots);
    setText("availableSlots", availableSlots);
    setText("inventoryEntries", allocatedProducts.length);
    setText("usedSpace", `${usedPercentage.toFixed(1)}%`);
    setText("freeSpace", `${freePercentage.toFixed(1)}%`);

    const progress = document.getElementById("spaceProgress");

    if (progress) {
        progress.style.width = `${usedPercentage}%`;
    }

    displayInventory(allocatedProducts, slots);
}

// ============================================================
// INVENTORY SUMMARY
// Shows products whose allocation status is Allocated.
// ============================================================

function displayInventory(products, slots) {
    const inventoryList = document.getElementById("inventoryList");
    if (!inventoryList) return;

    inventoryList.replaceChildren();

    if (products.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-message";
        empty.textContent = "No allocated inventory available yet.";
        inventoryList.appendChild(empty);
        return;
    }

    products.forEach(product => {
        const productSlots = slots.filter(
            slot => String(slot.productId) === String(product.id)
        );

        const slotText = productSlots.length
            ? productSlots.map(slot =>
                `${slot.id || "Slot"} (${Number(
                    slot.productQuantity || 0
                )} ${product.unit || ""})`
            ).join(", ")
            : "Not assigned";

        const row = document.createElement("div");
        row.className = "inventory-row";

        const name = document.createElement("div");
        const strong = document.createElement("strong");
        strong.textContent = product.name || "Unnamed product";
        name.appendChild(strong);

        const category = document.createElement("div");
        category.textContent =
            `Category: ${product.category || "—"}`;

        const quantity = document.createElement("div");
        quantity.textContent =
            `Quantity: ${Number(product.quantity || 0)} ${product.unit || ""}`;

        const weight = document.createElement("div");
        weight.textContent =
            `Weight: ${Number(product.weight || 0)} kg/unit`;

        const slotInfo = document.createElement("div");
        slotInfo.textContent = `Slot: ${slotText}`;

        row.append(name, category, quantity, weight, slotInfo);
        inventoryList.appendChild(row);
    });
}

// ============================================================
// LOGOUT
// ============================================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
        localStorage.removeItem(CURRENT_USER_KEY);
        window.location.href = "login.html";
    });
}

// ============================================================
// INITIALIZE
// ============================================================

loadDashboard();