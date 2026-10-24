
const API_URL = "http://localhost:5000/api";
const CURRENT_USER_KEY = "currentuser";
const EPSILON = 1e-8;

const largeSlots = document.getElementById("largeSlots");
const mediumSlots = document.getElementById("mediumSlots");
const smallSlots = document.getElementById("smallSlots");
const allocateBtn = document.getElementById("allocateBtn");
const allocationMessage = document.getElementById("allocationMessage");
const allocationResult = document.getElementById("allocationResult");

let currentUser = null;
let slots = [];
let products = [];

// -------------------- USER AND API --------------------

function getCurrentUser() {
    try {
        const user = JSON.parse(
            localStorage.getItem(CURRENT_USER_KEY) || "null"
        );

        if (!user || !user.email) {
            throw new Error("Login required");
        }

        return user;
    } catch {
        window.location.href = "login.html";
        return null;
    }
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, options);

    let result;
    try {
        result = await response.json();
    } catch {
        throw new Error("The server returned an invalid response.");
    }

    if (!response.ok || result.success === false) {
        throw new Error(result.message || "Request failed.");
    }

    return result;
}

function getUserEmail() {
    return String(currentUser?.email || "").trim().toLowerCase();
}

async function fetchWarehouseData() {
    const email = encodeURIComponent(getUserEmail());

    const [slotResult, productResult] = await Promise.all([
        apiRequest(`${API_URL}/slots?userEmail=${email}`),
        apiRequest(`${API_URL}/products?userEmail=${email}`)
    ]);

    return {
        slots: Array.isArray(slotResult.data) ? slotResult.data : [],
        products: Array.isArray(productResult.data)
            ? productResult.data
            : []
    };
}

async function loadWarehouseData() {
    currentUser = getCurrentUser();
    if (!currentUser) return;

    try {
        const data = await fetchWarehouseData();

        slots = data.slots;
        products = data.products;

        displaySlots();
    } catch (error) {
        console.error("Loading warehouse data failed:", error);

        showMessage(
            error.message ||
                "Could not load warehouse data. Check that the backend is running.",
            true
        );
    }
}

function showMessage(message, isError = false) {
    if (allocationMessage) {
        allocationMessage.textContent = message;
        allocationMessage.style.color = isError ? "#c0392b" : "#218838";
    }
}

// -------------------- DIMENSIONS AND CAPACITY --------------------

// Use actual stored dimensions. Do not replace them with guessed
// dimensions based only on the product's size label.
function getProductDimensions(product) {
    return [
        Number(product.length),
        Number(product.breadth),
        Number(product.height)
    ];
}

function getSlotDimensions(slot) {
    return [
        Number(slot.length),
        Number(slot.breadth),
        Number(slot.height)
    ];
}

// Rotation is allowed: compare sorted dimensions.
function fitsInSlot(product, slot) {
    const productDims = getProductDimensions(product);
    const slotDims = getSlotDimensions(slot);

    if (
        productDims.some(
            value => !Number.isFinite(value) || value <= 0
        ) ||
        slotDims.some(
            value => !Number.isFinite(value) || value <= 0
        )
    ) {
        return false;
    }

    productDims.sort((a, b) => a - b);
    slotDims.sort((a, b) => a - b);

    return productDims.every(
        (dimension, index) => dimension <= slotDims[index] + EPSILON
    );
}

function getProductUnitVolume(product) {
    const [length, breadth, height] = getProductDimensions(product);

    if (
        Number.isFinite(length) &&
        Number.isFinite(breadth) &&
        Number.isFinite(height) &&
        length > 0 &&
        breadth > 0 &&
        height > 0
    ) {
        return length * breadth * height;
    }

    // Legacy fallback: volume must represent ONE unit, not totalVolume.
    const volume = Number(product.volume);
    return Number.isFinite(volume) && volume > 0 ? volume : 0;
}

function getAvailableVolume(slot) {
    return Math.max(
        0,
        Number(slot.volume || 0) - Number(slot.usedVolume || 0)
    );
}

function getSlotProductId(slot) {
    return slot.productId == null || slot.productId === ""
        ? null
        : String(slot.productId);
}

function getProductId(product) {
    return String(product.id);
}

function slotCanAcceptProduct(product, slot) {
    const existingProductId = getSlotProductId(slot);
    const productId = getProductId(product);

    // A slot can contain only one product type.
    if (
        existingProductId !== null &&
        existingProductId !== productId
    ) {
        return false;
    }

    if (!fitsInSlot(product, slot)) {
        return false;
    }

    const unitVolume = getProductUnitVolume(product);
    const slotVolume = Number(slot.volume);
    const usedVolume = Number(slot.usedVolume || 0);

    return (
        unitVolume > 0 &&
        Number.isFinite(slotVolume) &&
        Number.isFinite(usedVolume) &&
        slotVolume - usedVolume >= unitVolume - EPSILON
    );
}

// -------------------- BFD ALLOCATION ORDER --------------------

// Best Fit Decreasing:
// 1. Products sorted by decreasing unit volume.
// 2. For each product, smallest suitable slot is chosen first.
function sortProductsForAllocation(list) {
    return [...list].sort((a, b) => {
        const difference =
            getProductUnitVolume(b) - getProductUnitVolume(a);

        if (Math.abs(difference) > EPSILON) {
            return difference;
        }

        return getProductId(a).localeCompare(getProductId(b));
    });
}

function sortSlotsForBestFit(list) {
    return [...list].sort((a, b) => {
        const difference = Number(a.volume) - Number(b.volume);

        if (Math.abs(difference) > EPSILON) {
            return difference;
        }

        return String(a.id).localeCompare(String(b.id));
    });
}

// -------------------- SAVE TO MONGODB --------------------

async function saveSlot(slot) {
    return apiRequest(
        `${API_URL}/slots/${encodeURIComponent(slot.id)}`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userEmail: getUserEmail(),
                usedVolume: Number(slot.usedVolume || 0),
                productId: slot.productId || null,
                productName: slot.productName || null,
                productQuantity: Number(slot.productQuantity || 0)
            })
        }
    );
}

async function saveProductAllocation(product) {
    return apiRequest(
        `${API_URL}/products/${encodeURIComponent(product.id)}`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userEmail: getUserEmail(),
                allocatedQuantity: Number(product.allocatedQuantity || 0),
                allocatedVolume: Number(product.allocatedVolume || 0),
                allocationStatus: product.allocationStatus,
                allocationMessage: product.allocationMessage
            })
        }
    );
}

// -------------------- ALLOCATION --------------------

async function allocatePendingProducts() {
    if (!currentUser) {
        currentUser = getCurrentUser();
        if (!currentUser) return;
    }

    if (!allocateBtn) return;

    allocateBtn.disabled = true;
    const oldButtonText = allocateBtn.textContent;
    allocateBtn.textContent = "Allocating...";

    if (allocationResult) {
        allocationResult.textContent = "";
    }

    showMessage("Checking products and available slots...");

    try {
        // Always plan from fresh MongoDB data.
        const data = await fetchWarehouseData();

        slots = data.slots.map(slot => ({ ...slot }));
        products = data.products.map(product => ({ ...product }));

        const changedSlots = new Set();
        const changedProducts = new Set();

        // Verify current allocations before making additional allocations.
        const slotByProductId = new Map();

        for (const slot of slots) {
            const used = Number(slot.usedVolume || 0);
            const capacity = Number(slot.volume || 0);
            const quantity = Number(slot.productQuantity || 0);
            const productId = getSlotProductId(slot);

            if (
                !Number.isFinite(capacity) ||
                !Number.isFinite(used) ||
                used < 0 ||
                used > capacity + EPSILON ||
                !Number.isInteger(quantity) ||
                quantity < 0
            ) {
                throw new Error(
                    `Slot ${slot.id} has invalid saved capacity or quantity.`
                );
            }

            if (quantity > 0 && !productId) {
                throw new Error(
                    `Slot ${slot.id} has a quantity but no product ID.`
                );
            }

            if (productId) {
                if (!slotByProductId.has(productId)) {
                    slotByProductId.set(productId, []);
                }
                slotByProductId.get(productId).push(slot);
            }
        }

        const productById = new Map(
            products.map(product => [getProductId(product), product])
        );

        // Do not silently overwrite a slot's occupancy if its product
        // record is missing from the current user's product list.
        for (const [productId, productSlots] of slotByProductId) {
            if (!productById.has(productId)) {
                throw new Error(
                    `An occupied slot refers to product ${productId}, ` +
                    "which was not returned by the products API. " +
                    "Please check the saved records before allocating."
                );
            }
        }

        // Normalize and validate persisted product allocation totals.
        for (const product of products) {
            const quantity = Number(product.quantity);
            const allocatedQuantity = Number(
                product.allocatedQuantity || 0
            );

            if (
                !Number.isInteger(quantity) ||
                quantity < 0 ||
                !Number.isInteger(allocatedQuantity) ||
                allocatedQuantity < 0 ||
                allocatedQuantity > quantity
            ) {
                throw new Error(
                    `Product "${product.name}" has invalid quantity data.`
                );
            }

            product.allocatedQuantity = allocatedQuantity;
            product.allocatedVolume = Number(
                product.allocatedVolume || 0
            );

            if (
                !Number.isFinite(product.allocatedVolume) ||
                product.allocatedVolume < 0
            ) {
                throw new Error(
                    `Product "${product.name}" has invalid allocated volume.`
                );
            }
        }

        const pendingProducts = sortProductsForAllocation(
            products.filter(
                product =>
                    product.allocatedQuantity < Number(product.quantity)
            )
        );

        const orderedSlots = sortSlotsForBestFit(slots);

        let newlyAllocatedUnits = 0;

        for (const product of pendingProducts) {
            const productId = getProductId(product);
            const totalQuantity = Number(product.quantity);
            const unitVolume = getProductUnitVolume(product);

            let remaining =
                totalQuantity - product.allocatedQuantity;

            if (unitVolume <= 0) {
                product.allocationStatus =
                    product.allocatedQuantity > 0
                        ? "Partially Allocated"
                        : "Pending";

                product.allocationMessage =
                    "Cannot allocate: valid unit dimensions or volume are required.";

                changedProducts.add(product);
                continue;
            }

            // Existing allocation is preserved. Only remaining units
            // are placed into empty slots or slots holding this product.
            for (const slot of orderedSlots) {
                if (remaining <= 0) break;

                if (!slotCanAcceptProduct(product, slot)) {
                    continue;
                }

                const availableVolume = getAvailableVolume(slot);

                const quantityByCapacity = Math.floor(
                    (availableVolume + EPSILON) / unitVolume
                );

                const quantityToPlace = Math.min(
                    remaining,
                    quantityByCapacity
                );

                if (quantityToPlace <= 0) continue;

                const placedVolume = quantityToPlace * unitVolume;

                slot.productId = productId;
                slot.productName = product.name;
                slot.productQuantity =
                    Number(slot.productQuantity || 0) + quantityToPlace;
                slot.usedVolume =
                    Number(slot.usedVolume || 0) + placedVolume;

                // Prevent tiny floating point excesses.
                if (
                    slot.usedVolume > Number(slot.volume) &&
                    slot.usedVolume <= Number(slot.volume) + EPSILON
                ) {
                    slot.usedVolume = Number(slot.volume);
                }

                product.allocatedQuantity += quantityToPlace;
                product.allocatedVolume += placedVolume;

                remaining -= quantityToPlace;
                newlyAllocatedUnits += quantityToPlace;

                changedSlots.add(slot);
                changedProducts.add(product);
            }

            if (product.allocatedQuantity >= totalQuantity) {
                product.allocatedQuantity = totalQuantity;
                product.allocationStatus = "Allocated";
                product.allocationMessage =
                    "All requested units have been allocated.";
            } else if (product.allocatedQuantity > 0) {
                product.allocationStatus = "Partially Allocated";
                product.allocationMessage =
                    `${product.allocatedQuantity} of ${totalQuantity} units allocated; ` +
                    `${totalQuantity - product.allocatedQuantity} remain unallocated.`;
            } else {
                product.allocationStatus = "Pending";
                product.allocationMessage =
                    "No suitable available slot found.";
            }

            changedProducts.add(product);
        }

        // Products already fully allocated remain allocated.
        for (const product of products) {
            if (
                product.allocatedQuantity === Number(product.quantity) &&
                Number(product.quantity) > 0
            ) {
                product.allocationStatus = "Allocated";
                product.allocationMessage =
                    "All requested units have been allocated.";
            }
        }

        showMessage("Saving allocation changes to MongoDB...");

        // Save only changed slots; don't rewrite every slot unnecessarily.
        // A failed request stops the process and is reported below.
        for (const slot of changedSlots) {
            await saveSlot(slot);
        }

        for (const product of changedProducts) {
            await saveProductAllocation(product);
        }

        // Reload persisted state, not just our in-memory calculation.
        const savedData = await fetchWarehouseData();
        slots = savedData.slots;
        products = savedData.products;
        displaySlots();

        const fullyAllocated = products.filter(product =>
            Number(product.quantity) > 0 &&
            Number(product.allocatedQuantity || 0) >=
                Number(product.quantity)
        ).length;

        const partiallyAllocated = products.filter(product =>
            Number(product.allocatedQuantity || 0) > 0 &&
            Number(product.allocatedQuantity || 0) <
                Number(product.quantity)
        ).length;

        const pending = products.filter(product =>
            Number(product.allocatedQuantity || 0) === 0 &&
            Number(product.quantity) > 0
        ).length;

        if (allocationResult) {
            allocationResult.textContent =
                `Newly allocated units: ${newlyAllocatedUnits}. ` +
                `Fully allocated products: ${fullyAllocated}. ` +
                `Partially allocated products: ${partiallyAllocated}. ` +
                `Pending products: ${pending}.`;
        }

        showMessage("Allocation completed and saved to MongoDB.");
    } catch (error) {
        console.error("Allocation failed:", error);

        showMessage(
            `Allocation failed: ${error.message}. ` +
            "Some earlier saves may have succeeded. Reloading saved data.",
            true
        );

        // Multi-document writes aren't atomic here. Fetch actual server
        // state so the UI doesn't pretend unsaved changes were persisted.
        try {
            const savedData = await fetchWarehouseData();
            slots = savedData.slots;
            products = savedData.products;
            displaySlots();
        } catch (reloadError) {
            console.error("Could not reload warehouse data:", reloadError);
        }
    } finally {
        allocateBtn.disabled = false;
        allocateBtn.textContent = oldButtonText;
    }
}

// -------------------- SLOT CARDS --------------------

function createSlotBox(slot) {
    const box = document.createElement("div");
    box.className = "slot-box";

    const capacity = Number(slot.volume || 0);
    const used = Number(slot.usedVolume || 0);
    const percent = capacity > 0
        ? Math.min(100, (used / capacity) * 100)
        : 0;

    let status = "Available";
    if (used > 0 && used < capacity) status = "Partially Filled";
    if (capacity > 0 && used >= capacity - EPSILON) status = "Full";

    const heading = document.createElement("h3");
    heading.textContent = slot.id;

    const sizeText = document.createElement("p");
    sizeText.textContent = `${slot.size} Slot`;

    const statusText = document.createElement("p");
    statusText.className = "slot-status";
    statusText.textContent = status;

    const progress = document.createElement("div");
    progress.className = "slot-progress";

    const progressBar = document.createElement("div");
    progressBar.className = "slot-progress-bar";
    progressBar.style.width = `${percent}%`;
    progress.appendChild(progressBar);

    const capacityText = document.createElement("p");
    capacityText.textContent =
        `${formatNumber(used)} / ${formatNumber(capacity)} cm³`;

    const productText = document.createElement("p");
    productText.textContent = slot.productName || "No product assigned";

    box.append(
        heading,
        sizeText,
        statusText,
        progress,
        capacityText,
        productText
    );

    box.addEventListener("click", () => showSlotDetails(slot));

    return box;
}

function displaySlots() {
    [largeSlots, mediumSlots, smallSlots].forEach(container => {
        if (container) container.replaceChildren();
    });

    const groups = {
        Large: largeSlots,
        Medium: mediumSlots,
        Small: smallSlots
    };

    for (const size of ["Large", "Medium", "Small"]) {
        const container = groups[size];
        if (!container) continue;

        const matchingSlots = slots.filter(slot => slot.size === size);

        if (matchingSlots.length === 0) {
            const empty = document.createElement("p");
            empty.className = "empty-slots";
            empty.textContent =
                `No ${size.toLowerCase()} slots available.`;
            container.appendChild(empty);
            continue;
        }

        matchingSlots.forEach(slot => {
            container.appendChild(createSlotBox(slot));
        });
    }
}

// -------------------- SLOT DETAILS MODAL --------------------

function showSlotDetails(slot) {
    const modal = document.getElementById("slotModal");
    if (!modal) return;

    setText("modalSlotId", slot.id);
    setText("modalSize", slot.size);
    setText("modalProduct", slot.productName || "None");
    setText("modalQuantity", slot.productQuantity || 0);
    setText("modalCapacity", `${formatNumber(slot.volume)} cm³`);
    setText("modalUsed", `${formatNumber(slot.usedVolume || 0)} cm³`);
    setText(
        "modalAvailable",
        `${formatNumber(getAvailableVolume(slot))} cm³`
    );

    const used = Number(slot.usedVolume || 0);
    const capacity = Number(slot.volume || 0);

    const percent = capacity > 0
        ? Math.min(100, (used / capacity) * 100)
        : 0;

    let status = "Available";
    if (used > 0 && used < capacity - EPSILON) {
        status = "Partially Filled";
    }
    if (capacity > 0 && used >= capacity - EPSILON) {
        status = "Full";
    }

    setText("modalStatus", status);

    const progress = document.getElementById("modalProgress");
    if (progress) {
        progress.style.width = `${percent}%`;
        progress.setAttribute(
            "aria-valuenow",
            String(Math.round(percent))
        );
    }

    modal.style.display = "flex";
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = String(value ?? "");
    }
}

function formatNumber(value) {
    return Number(value || 0).toLocaleString();
}

function closeSlotModal() {
    const modal = document.getElementById("slotModal");
    if (modal) modal.style.display = "none";
}

// -------------------- EVENT LISTENERS --------------------

if (allocateBtn) {
    allocateBtn.addEventListener("click", allocatePendingProducts);
}

const closeModalButton = document.getElementById("closeModal");
if (closeModalButton) {
    closeModalButton.addEventListener("click", closeSlotModal);
}

const slotModal = document.getElementById("slotModal");
if (slotModal) {
    slotModal.addEventListener("click", event => {
        if (event.target === slotModal) {
            closeSlotModal();
        }
    });
}

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeSlotModal();
    }
});

// -------------------- INITIALIZATION --------------------

(async function initWarehouse() {
    currentUser = getCurrentUser();
    if (!currentUser) return;

    const welcomeEl = document.getElementById("welcomeUser");
    if (welcomeEl) {
        welcomeEl.textContent = `Welcome, ${currentUser.name || ""}`;
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem(CURRENT_USER_KEY);
            window.location.href = "login.html";
        });
    }

    await loadWarehouseData();
})();
