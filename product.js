const productForm =
    document.getElementById("productForm");

const productTableBody =
    document.getElementById("productTableBody");

const productName =
    document.getElementById("productName");

const category =
    document.getElementById("category");

const quantity =
    document.getElementById("quantity");

const unit =
    document.getElementById("unit");

const itemsPerUnit =
    document.getElementById("itemsPerUnit");

const itemsPerUnitLabel =
    document.getElementById("itemsPerUnitLabel");

const size =
    document.getElementById("size");

const weight =
    document.getElementById("weight");

const fragile =
    document.getElementById("fragile");

const searchInput =
    document.getElementById("searchInput");

const formTitle =
    document.getElementById("formTitle");

const submitBtn =
    document.getElementById("submitBtn");

const cancelBtn =
    document.getElementById("cancelBtn");

const customDimensions =
    document.getElementById("customDimensions");

const lengthInput =
    document.getElementById("length");

const breadthInput =
    document.getElementById("breadth");

const heightInput =
    document.getElementById("height");


// ==========================================
// STORAGE
// ==========================================

const PRODUCT_KEY =
    "products";

const SLOT_KEY =
    "warehouseSlots";

const CURRENT_USER_KEY =
    "currentuser";


// ==========================================
// CURRENT USER
// ==========================================

const currentUser =
    JSON.parse(
        localStorage.getItem(
            CURRENT_USER_KEY
        )
    );


if (!currentUser) {

    window.location.href =
        "login.html";

}


let editingProductId =
    null;


// ==========================================
// EDITING STATE
// ==========================================

let existingProductStatus =
    "Pending";

let existingAllocatedQuantity =
    0;


// ==========================================
// UNIT CHANGE
// ==========================================

unit.addEventListener(
    "change",
    function () {

        updateItemsPerUnitField();

    }
);


function updateItemsPerUnitField() {

    const selectedUnit =
        unit.value;


    if (selectedUnit === "Pieces") {

        itemsPerUnitLabel.textContent =
            "Items per Piece *";

        itemsPerUnit.value = 1;

        itemsPerUnit.readOnly = true;

    }

    else {

        itemsPerUnitLabel.textContent =
            "Items per " +
            selectedUnit.slice(0, -1) +
            " *";

        itemsPerUnit.readOnly = false;

        if (
            !itemsPerUnit.value ||
            Number(itemsPerUnit.value) < 1
        ) {

            itemsPerUnit.value = 1;

        }

    }

}


// ==========================================
// SIZE CHANGE
// ==========================================

size.addEventListener(
    "change",
    function () {

        if (size.value === "Custom") {

            customDimensions.style.display =
                "block";

            lengthInput.required = true;
            breadthInput.required = true;
            heightInput.required = true;

        }

        else {

            customDimensions.style.display =
                "none";

            lengthInput.required = false;
            breadthInput.required = false;
            heightInput.required = false;

            lengthInput.value = "";
            breadthInput.value = "";
            heightInput.value = "";

        }

    }
);


// ==========================================
// GET PRODUCTS
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
// SAVE PRODUCTS
// ==========================================

function saveProducts(products) {

    localStorage.setItem(
        PRODUCT_KEY,
        JSON.stringify(products)
    );

}


// ==========================================
// GET SLOTS
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
            "Invalid slot data",
            error
        );

        return [];
    }

}


// ==========================================
// SAVE SLOTS
// ==========================================

function saveSlots(slots) {

    localStorage.setItem(
        SLOT_KEY,
        JSON.stringify(slots)
    );

}


// ==========================================
// ALLOCATION STATUS
// ==========================================

function getAllocationStatus(product) {

    const quantity =
        Number(
            product.quantity || 0
        );

    const allocatedQuantity =
        Number(
            product.allocatedQuantity || 0
        );


    if (allocatedQuantity === 0) {

        return "Not Allocated";

    }


    if (
        allocatedQuantity < quantity
    ) {

        return "Pending";

    }


    return "Allocated";

}


// ==========================================
// DISPLAY PRODUCTS
// ==========================================

function displayProducts(products) {

    productTableBody.innerHTML = "";


    if (products.length === 0) {

        productTableBody.innerHTML = `

            <tr>

                <td
                    colspan="11"
                    class="empty-message"
                >
                    No products found.
                </td>

            </tr>

        `;

        return;
    }


    products.forEach(
        function (product) {

            let dimensions = "-";


            if (
                product.size ===
                "Custom"
            ) {

                dimensions =
                    `${product.length} ×
                     ${product.breadth} ×
                     ${product.height} cm`;

            }


            const row =
                document.createElement(
                    "tr"
                );


            const statusText =
                getAllocationStatus(
                    product
                );


            const statusClass =
                statusText === "Allocated"
                    ? "status-allocated"
                    : "status-pending";


            row.innerHTML = `

                <td>
                    ${product.name}
                </td>

                <td>
                    ${product.category}
                </td>

                <td>
                    ${product.quantity}
                </td>

                <td>
                    ${product.unit}
                </td>

                <td>
                    ${product.itemsPerUnit}
                </td>

                <td>
                    ${product.size}
                </td>

                <td>
                    ${product.weight} kg
                </td>

                <td>
                    ${product.fragile}
                </td>

                <td>
                    ${dimensions}
                </td>

                <td>
                    <span class="${statusClass}">
                        ${statusText}
                    </span>
                </td>

                <td>

                    <button
                        class="edit-btn"
                        onclick="editProduct('${product.id}')"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteProduct('${product.id}')"
                    >
                        Delete
                    </button>

                </td>

            `;


            productTableBody.appendChild(
                row
            );

        }
    );

}


// ==========================================
// SUBMIT PRODUCT
// ==========================================

productForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const products =
            getProducts();


        // ==================================
        // FIND EXISTING PRODUCT
        // ==================================

        let oldProduct = null;


        if (
            editingProductId !== null
        ) {

            oldProduct =
                products.find(
                    function (item) {

                        return (
                            item.id ===
                            editingProductId &&

                            item.userEmail ===
                            currentUser.email
                        );

                    }
                );

        }


        const product = {

            id:
                editingProductId ||
                Date.now().toString(),

            name:
                productName.value.trim(),

            category:
                category.value,

            quantity:
                Number(
                    quantity.value
                ),

            unit:
                unit.value,

            itemsPerUnit:
                unit.value === "Pieces"
                    ? 1
                    : Number(
                        itemsPerUnit.value
                    ),

            size:
                size.value,

            length:
                size.value === "Custom"
                    ? Number(
                        lengthInput.value
                    )
                    : null,

            breadth:
                size.value === "Custom"
                    ? Number(
                        breadthInput.value
                    )
                    : null,

            height:
                size.value === "Custom"
                    ? Number(
                        heightInput.value
                    )
                    : null,

            weight:
                Number(
                    weight.value
                ),

            fragile:
                fragile.value,

            allocationStatus:
                oldProduct
                    ? oldProduct.allocationStatus
                    : "Pending",

            allocatedQuantity:
                oldProduct
                    ? Number(
                        oldProduct.allocatedQuantity || 0
                    )
                    : 0,

            allocationMessage:
                oldProduct
                    ? oldProduct.allocationMessage || ""
                    : "Waiting for warehouse allocation.",

            userEmail:
                currentUser.email

        };


        // ==================================
        // VALIDATION
        // ==================================

        if (
            product.name === ""
        ) {

            alert(
                "Please enter the product name."
            );

            return;
        }


        if (
            product.category === ""
        ) {

            alert(
                "Please select a category."
            );

            return;
        }


        if (
            product.quantity <= 0
        ) {

            alert(
                "Quantity must be greater than 0."
            );

            return;
        }


        if (
            product.itemsPerUnit <= 0
        ) {

            alert(
                "Items per unit must be greater than 0."
            );

            return;
        }


        if (
            product.size === ""
        ) {

            alert(
                "Please select a product size."
            );

            return;
        }


        if (
            product.weight <= 0
        ) {

            alert(
                "Weight must be greater than 0."
            );

            return;
        }


        if (
            product.size === "Custom"
        ) {

            if (
                product.length <= 0 ||
                product.breadth <= 0 ||
                product.height <= 0
            ) {

                alert(
                    "Please enter valid dimensions."
                );

                return;
            }

        }


        // ==================================
        // EDIT
        // ==================================

        if (
            editingProductId !== null
        ) {

            const productIndex =
                products.findIndex(
                    function (item) {

                        return (
                            item.id ===
                            editingProductId &&

                            item.userEmail ===
                            currentUser.email
                        );

                    }
                );


            if (
                productIndex !== -1
            ) {

                products[
                    productIndex
                ] = product;

                saveProducts(
                    products
                );


                alert(
                    "Product updated successfully."
                );

            }

        }


        // ==================================
        // NEW PRODUCT
        // ==================================

        else {

            products.push(
                product
            );


            saveProducts(
                products
            );


            alert(
                product.name +
                " added successfully.\n\n" +
                "Status: Pending\n\n" +
                "Go to Warehouse and click " +
                "\"Allocate Pending Products\" " +
                "to run FFD."
            );

        }


        resetForm();

        displayCurrentUserProducts();

    }
);


// ==========================================
// DISPLAY CURRENT USER PRODUCTS
// ==========================================

function displayCurrentUserProducts() {

    const products =
        getProducts();


    const myProducts =
        products.filter(
            function (product) {

                return (
                    product.userEmail ===
                    currentUser.email
                );

            }
        );


    displayProducts(
        myProducts
    );

}


// ==========================================
// EDIT PRODUCT
// ==========================================

function editProduct(id) {

    const products =
        getProducts();


    const product =
        products.find(
            function (item) {

                return (
                    item.id === id &&
                    item.userEmail ===
                    currentUser.email
                );

            }
        );


    if (!product) {
        return;
    }


    productName.value =
        product.name;

    category.value =
        product.category;

    quantity.value =
        product.quantity;

    unit.value =
        product.unit;


    itemsPerUnit.value =
        Number(
            product.itemsPerUnit || 1
        );


    updateItemsPerUnitField();


    size.value =
        product.size;

    weight.value =
        product.weight;

    fragile.value =
        product.fragile;


    existingProductStatus =
        product.allocationStatus ||
        "Pending";


    existingAllocatedQuantity =
        Number(
            product.allocatedQuantity ||
            0
        );


    if (
        product.size ===
        "Custom"
    ) {

        customDimensions.style.display =
            "block";

        lengthInput.required = true;
        breadthInput.required = true;
        heightInput.required = true;

        lengthInput.value =
            product.length;

        breadthInput.value =
            product.breadth;

        heightInput.value =
            product.height;

    }

    else {

        customDimensions.style.display =
            "none";

        lengthInput.required = false;
        breadthInput.required = false;
        heightInput.required = false;

    }


    editingProductId =
        id;


    formTitle.textContent =
        "Edit Product";


    submitBtn.textContent =
        "Update Product";


    cancelBtn.style.display =
        "inline-block";


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// ==========================================
// DELETE PRODUCT
// ==========================================

function deleteProduct(id) {

    const confirmation =
        confirm(
            "Are you sure you want to delete this product?"
        );


    if (!confirmation) {
        return;
    }


    let products =
        getProducts();


    products =
        products.filter(
            function (product) {

                return !(
                    product.id === id &&
                    product.userEmail ===
                    currentUser.email
                );

            }
        );


    saveProducts(
        products
    );


    // ======================================
    // CLEAR PRODUCT FROM SLOTS
    // ======================================

    let slots =
        getSlots();


    slots =
        slots.map(
            function (slot) {

                if (
                    slot.productId === id &&
                    (
                        !slot.userEmail ||
                        slot.userEmail ===
                        currentUser.email
                    )
                ) {

                    return {

                        ...slot,

                        used: 0,

                        productId: null,

                        productName: null,

                        productQuantity: 0

                    };

                }


                return slot;

            }
        );


    saveSlots(
        slots
    );


    displayCurrentUserProducts();


    alert(
        "Product deleted successfully."
    );


    if (
        editingProductId === id
    ) {

        resetForm();

    }

}


// ==========================================
// RESET FORM
// ==========================================

function resetForm() {

    productForm.reset();


    editingProductId =
        null;


    existingProductStatus =
        "Pending";


    existingAllocatedQuantity =
        0;


    formTitle.textContent =
        "Add Product";


    submitBtn.textContent =
        "Add Product";


    cancelBtn.style.display =
        "none";


    customDimensions.style.display =
        "none";


    lengthInput.required = false;
    breadthInput.required = false;
    heightInput.required = false;


    itemsPerUnit.value = 1;

    updateItemsPerUnitField();

}


// ==========================================
// CANCEL
// ==========================================

cancelBtn.addEventListener(
    "click",
    function () {

        resetForm();

    }
);


// ==========================================
// SEARCH
// ==========================================

searchInput.addEventListener(
    "input",
    function () {

        const searchText =
            searchInput.value
                .toLowerCase()
                .trim();


        const products =
            getProducts();


        const myProducts =
            products.filter(
                function (product) {

                    return (
                        product.userEmail ===
                        currentUser.email
                    );

                }
            );


        const filteredProducts =
            myProducts.filter(
                function (product) {

                    return (

                        product.name
                            .toLowerCase()
                            .includes(
                                searchText
                            )

                        ||

                        product.category
                            .toLowerCase()
                            .includes(
                                searchText
                            )

                        ||

                        product.unit
                            .toLowerCase()
                            .includes(
                                searchText
                            )

                    );

                }
            );


        displayProducts(
            filteredProducts
        );

    }
);


// ==========================================
// INITIAL LOAD
// ==========================================

updateItemsPerUnitField();

displayCurrentUserProducts();