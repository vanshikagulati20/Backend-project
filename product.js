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
// STORAGE KEYS
// ==========================================

const PRODUCT_KEY = "products";

const SLOT_KEY = "warehouseSlots";

const PLACEMENT_KEY = "placements";

const CURRENT_USER_KEY = "currentuser";


// ==========================================
// CURRENT USER
// ==========================================

const currentUser =
    JSON.parse(
        localStorage.getItem(CURRENT_USER_KEY)
    );


if (!currentUser) {

    window.location.href = "login.html";
}


let editingProductId = null;


// ==========================================
// MODAL ELEMENTS
// ==========================================

const slotModal =
    document.getElementById("slotModal");

const slotMessage =
    document.getElementById("slotMessage");

const slotDetails =
    document.getElementById("slotDetails");

const acceptSlotBtn =
    document.getElementById("acceptSlotBtn");

const declineSlotBtn =
    document.getElementById("declineSlotBtn");


let pendingProduct = null;

let pendingSlot = null;


// ==========================================
// PRODUCT SIZE
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

    const savedProducts =
        localStorage.getItem(PRODUCT_KEY);

    if (savedProducts) {

        return JSON.parse(savedProducts);
    }

    return [];
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
// SAVE PLACEMENTS
// ==========================================

function getPlacements() {

    const savedPlacements =
        localStorage.getItem(PLACEMENT_KEY);

    if (savedPlacements) {

        return JSON.parse(savedPlacements);
    }

    return [];
}


function savePlacements(placements) {

    localStorage.setItem(
        PLACEMENT_KEY,
        JSON.stringify(placements)
    );
}


// ==========================================
// PRODUCT VOLUME
// ==========================================

function getProductVolume(product) {

    let length;
    let breadth;
    let height;


    if (product.size === "Small") {

        length = 30;
        breadth = 30;
        height = 30;
    }

    else if (product.size === "Medium") {

        length = 60;
        breadth = 60;
        height = 60;
    }

    else if (product.size === "Large") {

        length = 100;
        breadth = 100;
        height = 100;
    }

    else if (product.size === "Custom") {

        length = Number(product.length);
        breadth = Number(product.breadth);
        height = Number(product.height);
    }


    return length * breadth * height;
}


// ==========================================
// SLOT VOLUME
// ==========================================

function getSlotVolume(slot) {

    let length;
    let breadth;
    let height;


    if (slot.size === "Small") {

        length = 30;
        breadth = 30;
        height = 30;
    }

    else if (slot.size === "Medium") {

        length = 60;
        breadth = 60;
        height = 60;
    }

    else if (slot.size === "Large") {

        length = 100;
        breadth = 100;
        height = 100;
    }


    return length * breadth * height;
}


// ==========================================
// GET USED VOLUME OF SLOT
// ==========================================

function getUsedVolume(slotId) {

    const placements =
        getPlacements();


    let usedVolume = 0;


    placements.forEach(
        function (placement) {

            if (
                placement.slotId === slotId &&
                placement.userEmail === currentUser.email
            ) {

                usedVolume +=
                    Number(placement.volume || 0);
            }

        }
    );


    return usedVolume;
}


// ==========================================
// FIRST FIT DECREASING
// ==========================================

function findSlotFFD(product) {

    const slots =
        getSlots()
            .filter(
                function (slot) {

                    return (
                        slot.userEmail ===
                        currentUser.email
                    );
                }
            );


    if (slots.length === 0) {

        return {
            success: false,

            reason:
                "No warehouse slots are available. Please add slots first."
        };
    }


    const productVolume =
        getProductVolume(product);


    /*
        FFD:

        Slots are sorted from
        largest capacity to smallest.

        The product is then placed
        into the FIRST slot that
        has enough remaining space.
    */

    const sortedSlots =
        [...slots].sort(
            function (a, b) {

                return (
                    getSlotVolume(b) -
                    getSlotVolume(a)
                );

            }
        );


    for (
        let i = 0;
        i < sortedSlots.length;
        i++
    ) {

        const slot =
            sortedSlots[i];


        const slotVolume =
            getSlotVolume(slot);


        const usedVolume =
            getUsedVolume(slot.id);


        const remainingVolume =
            slotVolume - usedVolume;


        if (
            productVolume <=
            remainingVolume
        ) {

            return {

                success: true,

                slot: slot,

                productVolume:
                    productVolume,

                remainingVolume:
                    remainingVolume
            };
        }

    }


    return {

        success: false,

        reason:
            "No available slot has enough space for this product."
    };
}


// ==========================================
// SHOW SLOT POPUP
// ==========================================

function showSlotPopup(
    product,
    result
) {

    pendingProduct = product;

    pendingSlot = result.slot;


    slotMessage.innerText =
        "FFD has found a suitable warehouse slot for this product.";


    slotDetails.innerHTML = `

        <strong>Product:</strong>
        ${product.name}
        <br><br>

        <strong>Quantity:</strong>
        ${product.quantity}
        ${product.unit}
        <br><br>

        <strong>Product Size:</strong>
        ${product.size}
        <br><br>

        <strong>Recommended Slot:</strong>
        ${result.slot.name}
        <br><br>

        <strong>Slot Size:</strong>
        ${result.slot.size}
        <br><br>

        <strong>Remaining Space:</strong>
        ${result.remainingVolume.toFixed(0)}
        cm³

    `;


    slotModal.style.display =
        "flex";
}


// ==========================================
// CLOSE POPUP
// ==========================================

function closeSlotPopup() {

    slotModal.style.display =
        "none";

    pendingProduct = null;

    pendingSlot = null;
}


// ==========================================
// ACCEPT SLOT
// ==========================================

acceptSlotBtn.addEventListener(
    "click",
    function () {

        if (
            !pendingProduct ||
            !pendingSlot
        ) {

            return;
        }


        const placements =
            getPlacements();


        const placement = {

            id:
                Date.now().toString(),

            productId:
                pendingProduct.id,

            productName:
                pendingProduct.name,

            quantity:
                pendingProduct.quantity,

            unit:
                pendingProduct.unit,

            size:
                pendingProduct.size,

            slotId:
                pendingSlot.id,

            slotName:
                pendingSlot.name,

            volume:
                getProductVolume(
                    pendingProduct
                ),

            userEmail:
                currentUser.email
        };


        placements.push(
            placement
        );


        savePlacements(
            placements
        );


        closeSlotPopup();


        alert(
            pendingProduct.name +
            " assigned to slot " +
            pendingSlot.name
        );


        resetForm();

    }
);


// ==========================================
// DECLINE SLOT
// ==========================================

declineSlotBtn.addEventListener(
    "click",
    function () {

        closeSlotPopup();

        alert(
            "Product was not placed in the warehouse."
        );

    }
);


// ==========================================
// DISPLAY PRODUCTS
// ==========================================

function displayProducts(products) {

    productTableBody.innerHTML = "";


    if (products.length === 0) {

        productTableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
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
                document.createElement("tr");


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


        const product = {

            id:
                editingProductId ||
                Date.now().toString(),

            name:
                productName.value.trim(),

            category:
                category.value,

            quantity:
                Number(quantity.value),

            unit:
                unit.value,

            size:
                size.value,

            length:
                size.value === "Custom"
                    ? Number(lengthInput.value)
                    : null,

            breadth:
                size.value === "Custom"
                    ? Number(breadthInput.value)
                    : null,

            height:
                size.value === "Custom"
                    ? Number(heightInput.value)
                    : null,

            weight:
                Number(weight.value),

            fragile:
                fragile.value,

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
        // EDIT PRODUCT
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

            }


            saveProducts(
                products
            );


            alert(
                "Product updated successfully."
            );


            resetForm();

        }


        // ==================================
        // NEW PRODUCT
        // ==================================

        else {

            /*
                SAVE PRODUCT FIRST
            */

            products.push(
                product
            );


            saveProducts(
                products
            );


            /*
                RUN FFD
            */

            const result =
                findSlotFFD(
                    product
                );


            /*
                NO SLOT
            */

            if (!result.success) {

                alert(
                    result.reason
                );

                resetForm();

                displayCurrentUserProducts();

                return;
            }


            /*
                SLOT FOUND

                Ask user before
                actually placing it.
            */

            showSlotPopup(
                product,
                result
            );

        }


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

    size.value =
        product.size;

    weight.value =
        product.weight;

    fragile.value =
        product.fragile;


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


    /*
        Remove its warehouse
        placement too.
    */

    let placements =
        getPlacements();


    placements =
        placements.filter(
            function (placement) {

                return !(
                    placement.productId === id &&
                    placement.userEmail ===
                    currentUser.email
                );

            }
        );


    savePlacements(
        placements
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

displayCurrentUserProducts();