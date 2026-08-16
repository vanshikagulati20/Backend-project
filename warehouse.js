const SLOT_KEY = "warehouseSlots";
const PRODUCT_KEY = "products";
const CURRENT_USER_KEY = "currentuser";

const largeSlots =
    document.getElementById("largeSlots");

const mediumSlots =
    document.getElementById("mediumSlots");

const smallSlots =
    document.getElementById("smallSlots");

const slotModal =
    document.getElementById("slotModal");

const closeModal =
    document.getElementById("closeModal");

const allocateBtn =
    document.getElementById("allocateBtn");

const allocationMessage =
    document.getElementById("allocationMessage");

const allocationResult =
    document.getElementById("allocationResult");


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

    return JSON.parse(savedUser);
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


function saveProducts(products) {

    localStorage.setItem(
        PRODUCT_KEY,
        JSON.stringify(products)
    );
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

        const slots =
            JSON.parse(saved);

        /*
         * Normalize old slots.
         *
         * This is important because
         * older slots may not have
         * used / product information.
         */

        return slots.map(function (slot) {

            return {

                ...slot,

                capacity:
                    Number(slot.capacity || 0),

                used:
                    Number(slot.used || 0),

                productId:
                    slot.productId || null,

                productName:
                    slot.productName || null,

                productQuantity:
                    Number(slot.productQuantity || 0)

            };

        });

    }

    catch (error) {

        console.error(
            "Invalid warehouse slot data",
            error
        );

        return [];
    }
}


function saveSlots(slots) {

    localStorage.setItem(
        SLOT_KEY,
        JSON.stringify(slots)
    );
}


// ==========================================
// PRODUCT SIZE PRIORITY
// ==========================================

function getSizeRank(size) {

    if (size === "Large") {
        return 3;
    }

    if (size === "Medium") {
        return 2;
    }

    if (size === "Small") {
        return 1;
    }

    return 0;
}


// ==========================================
// FFD ALLOCATION
// ==========================================

function allocatePendingProducts() {

    const currentUser =
        getCurrentUser();

    if (!currentUser) {
        return;
    }


    let products =
        getProducts();


    let slots =
        getSlots();


    // --------------------------------------
    // Find current user's products
    // --------------------------------------

    const userProducts =
        products.filter(function (product) {

            return (
                product.userEmail ===
                currentUser.email
            );

        });


    // --------------------------------------
    // Pending products
    // --------------------------------------

    const pendingProducts =
        userProducts.filter(function (product) {

            return (
                product.allocationStatus !==
                "Allocated"
            );

        });


    if (pendingProducts.length === 0) {

        allocationMessage.innerText =
            "There are no pending products to allocate.";

        allocationResult.innerHTML = `
            <div class="allocation-success">
                All products are already allocated.
            </div>
        `;

        return;
    }


    // --------------------------------------
    // Sort products for FFD
    //
    // Largest products first
    // --------------------------------------

    pendingProducts.sort(function (a, b) {

        const sizeDifference =
            getSizeRank(b.size) -
            getSizeRank(a.size);

        if (sizeDifference !== 0) {
            return sizeDifference;
        }

        /*
         * If same size, heavier product
         * gets priority.
         */

        return (
            Number(b.weight || 0) -
            Number(a.weight || 0)
        );

    });


    let allocatedCount = 0;
    let failedCount = 0;

    const failedProducts = [];


    // ======================================
    // FFD
    // ======================================

    pendingProducts.forEach(function (product) {

        let remainingQuantity =
            Number(product.quantity || 0);


        if (remainingQuantity <= 0) {

            product.allocationStatus =
                "Allocated";

            return;
        }


        /*
         * Find suitable slots.
         *
         * FFD means:
         * first suitable slot found
         * after sorting.
         */

        const suitableSlots =
            slots.filter(function (slot) {

                const available =
                    Number(slot.capacity || 0) -
                    Number(slot.used || 0);


                return (
                    available > 0 &&
                    getSizeRank(slot.size) >=
                    getSizeRank(product.size)
                );

            });


        /*
         * Sort slots:
         *
         * smallest suitable slot first.
         *
         * This prevents wasting a Large slot
         * when a Medium slot is enough.
         */

        suitableSlots.sort(function (a, b) {

            return (
                getSizeRank(a.size) -
                getSizeRank(b.size)
            );

        });


        suitableSlots.forEach(function (slot) {

            if (remainingQuantity <= 0) {
                return;
            }


            const available =
                Number(slot.capacity || 0) -
                Number(slot.used || 0);


            if (available <= 0) {
                return;
            }


            const quantityToAllocate =
                Math.min(
                    remainingQuantity,
                    available
                );


            // --------------------------------
            // Empty slot
            // --------------------------------

            if (!slot.productId) {

                slot.productId =
                    product.id;

                slot.productName =
                    product.name;

                slot.productQuantity =
                    quantityToAllocate;

            }

            else {

                /*
                 * Don't mix products in
                 * the same slot.
                 */

                if (
                    slot.productId !==
                    product.id
                ) {

                    return;
                }

                slot.productQuantity =
                    Number(
                        slot.productQuantity || 0
                    ) +
                    quantityToAllocate;
            }


            slot.used =
                Number(slot.used || 0) +
                quantityToAllocate;


            remainingQuantity -=
                quantityToAllocate;

        });


        // ==================================
        // Allocation result
        // ==================================

        if (remainingQuantity === 0) {

            product.allocationStatus =
                "Allocated";

            product.allocatedQuantity =
                Number(product.quantity);

            allocatedCount++;

        }

        else {

            /*
             * Some quantity couldn't fit.
             */

            product.allocationStatus =
                "Pending";

            product.allocatedQuantity =
                Number(product.quantity) -
                remainingQuantity;


            product.allocationMessage =
                "Not enough suitable warehouse capacity.";

            failedCount++;


            failedProducts.push({

                name: product.name,

                requested:
                    product.quantity,

                allocated:
                    product.allocatedQuantity,

                remaining:
                    remainingQuantity

            });

        }

    });


    // ======================================
    // Save everything
    // ======================================

    saveSlots(slots);
    saveProducts(products);


    // ======================================
    // Result message
    // ======================================

    allocationMessage.innerText =
        "Warehouse allocation completed.";


    let resultHTML = `
        <div class="allocation-success">
            Successfully allocated:
            <strong>${allocatedCount}</strong>
            product(s).
        </div>
    `;


    if (failedCount > 0) {

        resultHTML += `
            <div class="allocation-warning">

                <strong>
                    ${failedCount}
                    product(s) still need allocation.
                </strong>

                <ul>
        `;


        failedProducts.forEach(function (item) {

            resultHTML += `
                <li>
                    ${item.name}:
                    ${item.allocated}
                    allocated /
                    ${item.requested}
                    requested
                </li>
            `;

        });


        resultHTML += `
                </ul>

                Create more suitable slots
                and run allocation again.

            </div>
        `;
    }


    allocationResult.innerHTML =
        resultHTML;


    // ======================================
    // Refresh warehouse UI
    // ======================================

    displaySlots();

}


// ==========================================
// CREATE SLOT BOX
// ==========================================

function createSlotBox(slot) {

    const slotBox =
        document.createElement("div");


    slotBox.className =
        "warehouse-slot";


    const used =
        Number(slot.used || 0);

    const capacity =
        Number(slot.capacity || 0);


    const percentage =
        capacity > 0
            ? Math.min(
                (used / capacity) * 100,
                100
            )
            : 0;


    let status =
        "Empty";


    if (used >= capacity && capacity > 0) {

        status = "Full";

    }

    else if (used > 0) {

        status = "Occupied";

    }


    slotBox.innerHTML = `

        <div class="slot-id">
            ${slot.id}
        </div>

        <div class="slot-size">
            ${slot.size}
        </div>

        <div class="slot-status">
            ${status}
        </div>

        ${
            slot.productName
                ? `
                    <div class="slot-product">
                        ${slot.productName}
                    </div>

                    <div class="slot-quantity">
                        ${slot.productQuantity}
                        units
                    </div>
                `
                : `
                    <div class="slot-product empty">
                        Empty
                    </div>
                `
        }

        <div class="slot-capacity">
            ${used} / ${capacity}
        </div>

        <div class="slot-progress">
            <div
                class="slot-progress-bar"
                style="width:${percentage}%"
            ></div>
        </div>

    `;


    slotBox.addEventListener(
        "click",
        function () {

            showSlotDetails(slot);

        }
    );


    return slotBox;
}


// ==========================================
// DISPLAY SLOTS
// ==========================================

function displaySlots() {

    const slots =
        getSlots();


    largeSlots.innerHTML = "";
    mediumSlots.innerHTML = "";
    smallSlots.innerHTML = "";


    if (slots.length === 0) {

        largeSlots.innerHTML = `
            <p class="empty-message">
                No slots created yet.
            </p>
        `;

        return;
    }


    slots.forEach(function (slot) {

        const slotBox =
            createSlotBox(slot);


        if (slot.size === "Large") {

            largeSlots.appendChild(
                slotBox
            );

        }

        else if (slot.size === "Medium") {

            mediumSlots.appendChild(
                slotBox
            );

        }

        else if (slot.size === "Small") {

            smallSlots.appendChild(
                slotBox
            );

        }

    });

}


// ==========================================
// SLOT DETAILS
// ==========================================

function showSlotDetails(slot) {

    document.getElementById(
        "modalSlotId"
    ).innerText =
        slot.id;


    document.getElementById(
        "modalSize"
    ).innerText =
        slot.size;


    document.getElementById(
        "modalCapacity"
    ).innerText =
        slot.capacity + " units";


    document.getElementById(
        "modalUsed"
    ).innerText =
        slot.used + " units";


    const available =
        Math.max(
            slot.capacity - slot.used,
            0
        );


    document.getElementById(
        "modalAvailable"
    ).innerText =
        available + " units";


    document.getElementById(
        "modalProduct"
    ).innerText =
        slot.productName ||
        "Empty";


    let status =
        "Available";


    if (available === 0) {

        status = "Full";

    }

    else if (slot.used === 0) {

        status = "Empty";

    }


    document.getElementById(
        "modalStatus"
    ).innerText =
        status;


    const percentage =
        slot.capacity > 0
            ? Math.min(
                (slot.used / slot.capacity) * 100,
                100
            )
            : 0;


    document.getElementById(
        "modalProgress"
    ).style.width =
        percentage + "%";


    slotModal.classList.add(
        "show"
    );

}


// ==========================================
// CLOSE MODAL
// ==========================================

closeModal.addEventListener(
    "click",
    function () {

        slotModal.classList.remove(
            "show"
        );

    }
);


slotModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            slotModal
        ) {

            slotModal.classList.remove(
                "show"
            );

        }

    }
);


// ==========================================
// ALLOCATION BUTTON
// ==========================================

if (allocateBtn) {

    allocateBtn.addEventListener(
        "click",
        function () {

            allocatePendingProducts();

        }
    );

}


// ==========================================
// INITIAL LOAD
// ==========================================

displaySlots();