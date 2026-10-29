// ============================================================
// STORVIA - PRODUCT MANAGEMENT
// ============================================================

const API_URL = window.STORVIA_API_URL ||
    ((window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
        ? "http://localhost:5000/api"
        : "https://storvia-api.onrender.com/api");

const CURRENT_USER_KEY = "currentuser";

const productForm = document.getElementById("productForm");
const productName = document.getElementById("productName");
const category = document.getElementById("category");
const quantity = document.getElementById("quantity");
const unit = document.getElementById("unit");
const itemsPerUnit = document.getElementById("itemsPerUnit");
const itemsPerUnitLabel = document.getElementById("itemsPerUnitLabel");
const size = document.getElementById("size");
const customDimensions = document.getElementById("customDimensions");
const lengthInput = document.getElementById("length");
const breadthInput = document.getElementById("breadth");
const heightInput = document.getElementById("height");
const weight = document.getElementById("weight");
const fragile = document.getElementById("fragile");

const productTableBody = document.getElementById("productTableBody");
const searchInput = document.getElementById("searchInput");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const formTitle = document.getElementById("formTitle");

let products = [];
let editingProductId = null;
let isSaving = false;

// Standard dimensions in centimetres.
const STANDARD_DIMENSIONS = {
    Small: { length: 30, breadth: 20, height: 20 },
    Medium: { length: 60, breadth: 40, height: 40 },
    Large: { length: 100, breadth: 80, height: 80 }
};

// ============================================================
// USER SESSION
// ============================================================

function getCurrentUser() {
    try {
        const savedUser = localStorage.getItem(CURRENT_USER_KEY);

        if (!savedUser) {
            window.location.href = "login.html";
            return null;
        }

        const user = JSON.parse(savedUser);

        if (!user || !user.email) {
            localStorage.removeItem(CURRENT_USER_KEY);
            window.location.href = "login.html";
            return null;
        }

        return user;
    } catch (error) {
        console.error("Unable to read current user:", error);
        localStorage.removeItem(CURRENT_USER_KEY);
        window.location.href = "login.html";
        return null;
    }
}

const currentUser = getCurrentUser();

// Stop initialization if the user is not logged in.
if (currentUser) {
    const welcomeUser = document.getElementById("welcomeUser");

    if (welcomeUser) {
        welcomeUser.textContent = `Welcome, ${currentUser.name || currentUser.email}`;
    }

    initializeProductPage();
}

// ============================================================
// INITIALIZATION
// ============================================================

function initializeProductPage() {
    setupSizeSelection();
    setupUnitLabel();
    setupForm();
    setupSearch();
    setupCancelButton();
    setupLogout();
    loadProducts();
}

// ============================================================
// SIZE AND DIMENSION HANDLING
// ============================================================

function setupSizeSelection() {
    size.addEventListener("change", function () {
        const isCustom = size.value === "Custom";

        customDimensions.style.display = isCustom ? "block" : "none";

        lengthInput.required = isCustom;
        breadthInput.required = isCustom;
        heightInput.required = isCustom;

        if (!isCustom && STANDARD_DIMENSIONS[size.value]) {
            const dimensions = STANDARD_DIMENSIONS[size.value];

            lengthInput.value = dimensions.length;
            breadthInput.value = dimensions.breadth;
            heightInput.value = dimensions.height;
        } else if (isCustom) {
            lengthInput.value = "";
            breadthInput.value = "";
            heightInput.value = "";
        }
    });
}

function setupUnitLabel() {
    function updateLabel() {
        const selectedUnit = unit.value || "Pieces";
        const singular = selectedUnit.replace(/s$/, "");

        itemsPerUnitLabel.textContent = `Items per ${singular} *`;
    }

    unit.addEventListener("change", updateLabel);
    updateLabel();
}

function getDimensions() {
    if (size.value === "Custom") {
        return {
            length: Number(lengthInput.value),
            breadth: Number(breadthInput.value),
            height: Number(heightInput.value)
        };
    }

    return STANDARD_DIMENSIONS[size.value]
        ? { ...STANDARD_DIMENSIONS[size.value] }
        : null;
}

// ============================================================
// FORM SUBMISSION
// ============================================================

function setupForm() {
    productForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!currentUser || isSaving) return;

        const validationError = validateProductForm();

        if (validationError) {
            if (typeof showAlert === "function") {
                showAlert(validationError, "warning");
            } else {
                alert(validationError);
            }
            return;
        }

        const dimensions = getDimensions();

        if (!dimensions) {
            if (typeof showAlert === "function") {
                showAlert("Please select a valid product size.", "warning");
            } else {
                alert("Please select a valid product size.");
            }
            return;
        }

        const productQuantity = Number(quantity.value);
        const items = Number(itemsPerUnit.value);
        const volume =
            dimensions.length *
            dimensions.breadth *
            dimensions.height;

        // Assumption: quantity is the number of packages,
        // and each package contains itemsPerUnit individual items.
        const totalVolume = volume * productQuantity * items;

        const productData = {
            name: productName.value.trim(),
            category: category.value,
            quantity: productQuantity,
            unit: unit.value,
            itemsPerUnit: items,
            size: size.value,
            length: dimensions.length,
            breadth: dimensions.breadth,
            height: dimensions.height,
            volume,
            totalVolume,
            weight: Number(weight.value),
            fragile: fragile.value,
            userEmail: currentUser.email.toLowerCase().trim(),
            date: editingProductId
                ? (
                    products.find(
                        product => product.id === editingProductId
                    )?.date || new Date().toISOString()
                )
                : new Date().toISOString()
        };

        isSaving = true;
        submitBtn.disabled = true;
        cancelBtn.disabled = true;
        submitBtn.textContent = editingProductId
            ? "Updating Product..."
            : "Saving Product...";

        try {
            let response;

            if (editingProductId) {
                response = await fetch(
                    `${API_URL}/products/${encodeURIComponent(editingProductId)}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(productData)
                    }
                );
            } else {
                response = await fetch(`${API_URL}/products`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(productData)
                });
            }

            const result = await readResponse(response);

            if (!response.ok || result.success === false) {
                throw new Error(
                    result.message ||
                    `Unable to ${editingProductId ? "update" : "add"} product.`
                );
            }

            const successMsg = editingProductId
                ? "Product updated successfully."
                : "Product added successfully.";

            if (typeof showAlert === "function") {
                showAlert(successMsg, "success");
            } else {
                alert(successMsg);
            }

            resetProductForm();
            await loadProducts();
        } catch (error) {
            console.error("Product save error:", error);

            const errorMsg = error.message ||
                "Could not connect to the backend. Make sure the server is running.";

            if (typeof showAlert === "function") {
                showAlert(errorMsg, "error");
            } else {
                alert(errorMsg);
            }
        } finally {
            isSaving = false;
            submitBtn.disabled = false;
            cancelBtn.disabled = false;
            updateSubmitButton();
        }
    });
}

function validateProductForm() {
    if (!productName.value.trim()) {
        return "Please enter the product name.";
    }

    if (!category.value) {
        return "Please select a product category.";
    }

    if (!Number.isInteger(Number(quantity.value)) || Number(quantity.value) < 1) {
        return "Quantity must be a positive whole number.";
    }

    if (!Number.isInteger(Number(itemsPerUnit.value)) || Number(itemsPerUnit.value) < 1) {
        return "Items per unit must be a positive whole number.";
    }

    if (!unit.value) {
        return "Please select a packaging unit.";
    }

    if (!["Small", "Medium", "Large", "Custom"].includes(size.value)) {
        return "Please select a valid product size.";
    }

    const dimensions = getDimensions();

    if (
        !dimensions ||
        !Number.isFinite(dimensions.length) ||
        !Number.isFinite(dimensions.breadth) ||
        !Number.isFinite(dimensions.height) ||
        dimensions.length <= 0 ||
        dimensions.breadth <= 0 ||
        dimensions.height <= 0
    ) {
        return "All product dimensions must be greater than zero.";
    }

    if (!Number.isFinite(Number(weight.value)) || Number(weight.value) <= 0) {
        return "Weight per unit must be greater than zero.";
    }

    if (!["Yes", "No"].includes(fragile.value)) {
        return "Please select whether the product is fragile.";
    }

    return null;
}

// ============================================================
// BACKEND RESPONSE HANDLING
// ============================================================

async function readResponse(response) {
    const text = await response.text();

    let result;

    try {
        result = text ? JSON.parse(text) : {};
    } catch {
        throw new Error(
            "The server returned an invalid response. Check backend/server.js."
        );
    }

    if (!response.ok) {
        throw new Error(
            result.message || `Server error (${response.status}).`
        );
    }

    return result;
}

// ============================================================
// LOAD PRODUCTS FROM MONGODB
// ============================================================

async function loadProducts() {
    if (!currentUser) return;

    productTableBody.innerHTML = `
        <tr>
            <td colspan="11">Loading products...</td>
        </tr>
    `;

    try {
        const response = await fetch(
            `${API_URL}/products?userEmail=${encodeURIComponent(currentUser.email)}`
        );

        const result = await readResponse(response);

              if (Array.isArray(result)) {
            products = result;
        } else if (Array.isArray(result.data)) {
            products = result.data;
        } else if (Array.isArray(result.products)) {
            products = result.products;
        } else {
            products = [];
        }

       
        renderProducts();
    } catch (error) {
        console.error("Load products error:", error);

        productTableBody.innerHTML = `
            <tr>
                <td colspan="11">
                    Unable to load products. Check that the backend is running
                    and the GET /api/products route is configured correctly.
                </td>
            </tr>
        `;
        if (typeof showAlert === "function") {
            showAlert("Unable to load products from backend. Please ensure the server is running.", "error");
        }
    }
}

// ============================================================
// DISPLAY AND SEARCH PRODUCTS
// ============================================================

function setupSearch() {
    searchInput.addEventListener("input", renderProducts);
}
function getAllocationStatus(product) {
    const totalQuantity = Number(product.quantity) || 0;
    const allocatedQuantity = Number(product.allocatedQuantity) || 0;

    if (allocatedQuantity <= 0) {
        return "Pending";
    }

    if (allocatedQuantity < totalQuantity) {
        return "Partially Allocated";
    }

    return "Allocated";
}

function renderProducts() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    const filteredProducts = products.filter(product => {
        return [
            product.name,
            product.category,
            product.unit,
            product.size,
            product.fragile,
            product.allocationStatus
        ].some(value =>
            String(value ?? "").toLowerCase().includes(searchTerm)
        );
    });

    if (filteredProducts.length === 0) {
        productTableBody.innerHTML = `
            <tr>
                <td colspan="11">
                    ${searchTerm ? "No matching products found." : "No products added yet."}
                </td>
            </tr>
        `;
        return;
    }

    productTableBody.innerHTML = "";

    filteredProducts.forEach(product => {
        const row = document.createElement("tr");

        const dimensions =
            `${formatNumber(product.length)} × ` +
            `${formatNumber(product.breadth)} × ` +
            `${formatNumber(product.height)} cm`;

        const status = getAllocationStatus(product);
        const allocated = status === "Allocated";           

        const values = [
            product.name,
            product.category,
            product.quantity,
            product.unit,
            product.itemsPerUnit,
            product.size,
            `${formatNumber(product.weight)} kg`,
            product.fragile,
            dimensions
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value ?? "—";
            row.appendChild(cell);
        });

        const statusCell = document.createElement("td");
        const statusBadge = document.createElement("span");

        statusBadge.className = allocated
            ? "status-allocated"
            : "status-pending";

        statusBadge.textContent = status;
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        const actionsCell = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-btn";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => editProduct(product.id));

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deleteProduct(product.id));

        actionsCell.append(editButton, deleteButton);
        row.appendChild(actionsCell);

        productTableBody.appendChild(row);
    });
}

function formatNumber(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) return "—";

    return Number(number.toFixed(2)).toString();
}

// ============================================================
// EDIT PRODUCT
// ============================================================

function editProduct(productId) {
    const product = products.find(item => item.id === productId);

    if (!product) {
        if (typeof showAlert === "function") {
            showAlert("Product not found.", "warning");
        } else {
            alert("Product not found.");
        }
        return;
    }

    editingProductId = product.id;

    productName.value = product.name || "";
    category.value = product.category || "";
    quantity.value = product.quantity ?? 1;
    unit.value = product.unit || "Pieces";
    itemsPerUnit.value = product.itemsPerUnit ?? 1;
    size.value = product.size || "";
    weight.value = product.weight ?? "";
    fragile.value = product.fragile || "No";

    setupCustomDimensionVisibility();

    lengthInput.value = product.length ?? "";
    breadthInput.value = product.breadth ?? "";
    heightInput.value = product.height ?? "";

    setupUnitLabel();

    formTitle.textContent = "Edit Product";
    submitBtn.textContent = "Update Product";
    cancelBtn.style.display = "inline-flex";

    productForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function setupCustomDimensionVisibility() {
    const isCustom = size.value === "Custom";

    customDimensions.style.display = isCustom ? "block" : "none";
    lengthInput.required = isCustom;
    breadthInput.required = isCustom;
    heightInput.required = isCustom;
}

// ============================================================
// DELETE PRODUCT
// ============================================================

async function deleteProduct(productId) {
    if (!currentUser) return;

    const product = products.find(item => item.id === productId);

    if (!product) {
        if (typeof showAlert === "function") {
            showAlert("Product not found.", "warning");
        } else {
            alert("Product not found.");
        }
        return;
    }

    const confirmed = window.confirm(
        `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    try {
        const response = await fetch(
            `${API_URL}/products/${encodeURIComponent(productId)}?userEmail=${encodeURIComponent(currentUser.email)}`,
            {
                method: "DELETE"
            }
        );

        const result = await readResponse(response);

        if (result.success === false) {
            throw new Error(result.message || "Unable to delete product.");
        }

        if (editingProductId === productId) {
            resetProductForm();
        }

        if (typeof showAlert === "function") {
            showAlert("Product deleted successfully.", "success");
        } else {
            alert("Product deleted successfully.");
        }
        await loadProducts();
    } catch (error) {
        console.error("Delete product error:", error);
        const errorMsg = error.message || "Unable to delete product.";
        if (typeof showAlert === "function") {
            showAlert(errorMsg, "error");
        } else {
            alert(errorMsg);
        }
    }
}

// ============================================================
// CANCEL EDIT / RESET FORM
// ============================================================

function setupCancelButton() {
    cancelBtn.addEventListener("click", resetProductForm);
}

function resetProductForm() {
    productForm.reset();
    editingProductId = null;

    customDimensions.style.display = "none";
    lengthInput.required = false;
    breadthInput.required = false;
    heightInput.required = false;

    formTitle.textContent = "Add Product";
    cancelBtn.style.display = "none";

    updateSubmitButton();
    setupUnitLabel();
}

function updateSubmitButton() {
    submitBtn.textContent = editingProductId
        ? "Update Product"
        : "Add Product";
}

// ============================================================
// LOGOUT
// ============================================================

function setupLogout() {
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            localStorage.removeItem(CURRENT_USER_KEY);
            window.location.href = "login.html";
        });
    }
}