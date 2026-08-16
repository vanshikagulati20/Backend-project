const SLOT_KEY =
    "warehouseSlots";

const PRODUCT_KEY =
    "products";

const CURRENT_USER_KEY =
    "currentuser";


// ==========================================
// DOM ELEMENTS
// ==========================================

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
        localStorage.getItem(
            CURRENT_USER_KEY
        );


    if (!savedUser) {

        window.location.href =
            "login.html";

        return null;

    }


    try {

        return JSON.parse(
            savedUser
        );

    }

    catch (error) {

        console.error(
            "Invalid current user data",
            error
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

        return JSON.parse(
            saved
        );

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
        localStorage.getItem(
            SLOT_KEY
        );


    if (!saved) {

        return [];

    }


    try {

        const slots =
            JSON.parse(saved);


        /*
         * Normalize slots created
         * by the new inventory.js.
         */

        return slots.map(
            function (slot) {

                return {

                    ...slot,

                    length:
                        Number(
                            slot.length || 0
                        ),

                    breadth:
                        Number(
                            slot.breadth || 0
                        ),

                    height:
                        Number(
                            slot.height || 0
                        ),

                    volume:
                        Number(
                            slot.volume || 0
                        ),

                    usedVolume:
                        Number(
                            slot.usedVolume || 0
                        ),

                    productId:
                        slot.productId ||
                        null,

                    productName:
                        slot.productName ||
                        null,

                    productQuantity:
                        Number(
                            slot.productQuantity || 0
                        )

                };

            }
        );

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
// PRODUCT UNIT VOLUME
// ==========================================

function getProductUnitVolume(product) {

    const length =
        Number(
            product.length || 0
        );

    const breadth =
        Number(
            product.breadth || 0
        );

    const height =
        Number(
            product.height || 0
        );


    if (
        length <= 0 ||
        breadth <= 0 ||
        height <= 0
    ) {

        return 0;

    }


    /*
     * Dimensions represent ONE
     * storage unit.
     *
     * Example:
     *
     * 1 Box = 20 × 15 × 10 cm
     *
     * Volume = 3000 cm³
     */

    return (
        length *
        breadth *
        height
    );

}


// ==========================================
// CHECK WHETHER PRODUCT UNIT FITS SLOT
// ==========================================

function doesProductFitSlot(
    product,
    slot
) {

    const productDimensions = [

        Number(
            product.length || 0
        ),

        Number(
            product.breadth || 0
        ),

        Number(
            product.height || 0
        )

    ];


    const slotDimensions = [

        Number(
            slot.length || 0
        ),

        Number(
            slot.breadth || 0
        ),

        Number(
            slot.height || 0
        )

    ];


    /*
     * Sort both dimensions.
     *
     * This allows rotation.
     *
     * Example:
     *
     * Product:
     * 40 × 20 × 10
     *
     * Slot:
     * 20 × 40 × 30
     *
     * This still fits.
     */

    productDimensions.sort(
        function (a, b) {
            return a - b;
        }
    );


    slotDimensions.sort(
        function (a, b) {
            return a - b;
        }
    );


    return (

        productDimensions[0] <=
        slotDimensions[0]

        &&

        productDimensions[1] <=
        slotDimensions[1]

        &&

        productDimensions[2] <=
        slotDimensions[2]

    );

}


// ==========================================
// GET ALLOCATION STATUS
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


    if (
        allocatedQuantity === 0
    ) {

        return "Not Allocated";

    }


    if (
        allocatedQuantity <
        quantity
    ) {

        return "Pending";

    }


    return "Allocated";

}


// ==========================================
// FFD SORTING
// ==========================================

function sortProductsForFFD(products) {

    return products.sort(
        function (a, b) {

            const volumeA =
                getProductUnitVolume(a);


            const volumeB =
                getProductUnitVolume(b);


            /*
             * Largest storage unit first.
             */

            if (
                volumeA !== volumeB
            ) {

                return (
                    volumeB -
                    volumeA
                );

            }


            /*
             * If volume is same,
             * heavier product first.
             */

            return (

                Number(
                    b.weight || 0
                )

                -

                Number(
                    a.weight || 0
                )

            );

        }
    );

}


// ==========================================
// ALLOCATE PENDING PRODUCTS
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


    // ======================================
    // CURRENT USER PRODUCTS
    // ======================================

    const userProducts =
        products.filter(
            function (product) {

                return (
                    product.userEmail ===
                    currentUser.email
                );

            }
        );


    // ======================================
    // FIND PENDING PRODUCTS
    // ======================================

    const pendingProducts =
        userProducts.filter(
            function (product) {

                const quantity =
                    Number(
                        product.quantity || 0
                    );


                const allocatedQuantity =
                    Number(
                        product.allocatedQuantity || 0
                    );


                return (
                    allocatedQuantity <
                    quantity
                );

            }
        );


    if (
        pendingProducts.length === 0
    ) {

        allocationMessage.innerText =
            "There are no pending products to allocate.";


        allocationResult.innerHTML = `

            <div class="allocation-success">

                All products are already allocated.

            </div>

        `;

        return;

    }


    // ======================================
    // FFD SORTING
    // ======================================

    sortProductsForFFD(
        pendingProducts
    );


    let allocatedCount = 0;

    let failedCount = 0;

    const failedProducts = [];


    // ======================================
    // ALLOCATE EACH PRODUCT
    // ======================================

    pendingProducts.forEach(
        function (product) {

            let remainingQuantity =

                Number(
                    product.quantity || 0
                )

                -

                Number(
                    product.allocatedQuantity || 0
                );


            if (
                remainingQuantity <= 0
            ) {

                product.allocationStatus =
                    "Allocated";

                return;

            }


            // ==================================
            // VOLUME OF ONE STORAGE UNIT
            // ==================================

            const unitVolume =
                getProductUnitVolume(
                    product
                );


            if (
                unitVolume <= 0
            ) {

                product.allocationStatus =
                    "Pending";

                product.allocationMessage =
                    "Invalid product dimensions.";

                failedCount++;


                failedProducts.push({

                    name:
                        product.name,

                    requested:
                        product.quantity,

                    allocated:
                        product.allocatedQuantity || 0,

                    remaining:
                        remainingQuantity,

                    reason:
                        "Invalid product dimensions."

                });


                return;

            }


            /*
             * Find slots that can physically
             * contain ONE unit of this product.
             */

            const suitableSlots =
                slots.filter(
                    function (slot) {

                        const availableVolume =

                            Number(
                                slot.volume || 0
                            )

                            -

                            Number(
                                slot.usedVolume || 0
                            );


                        if (
                            availableVolume <
                            unitVolume
                        ) {

                            return false;

                        }


                        /*
                         * If slot already contains
                         * another product, don't use it.
                         */

                        if (
                            slot.productId &&
                            slot.productId !==
                            product.id
                        ) {

                            return false;

                        }


                        /*
                         * Physical dimension check.
                         */

                        if (
                            !doesProductFitSlot(
                                product,
                                slot
                            )
                        ) {

                            return false;

                        }


                        return true;

                    }
                );


            /*
             * First Fit Decreasing:
             *
             * Use the smallest suitable
             * slot first.
             *
             * This reduces wasted space.
             */

            suitableSlots.sort(
                function (a, b) {

                    return (
                        Number(
                            a.volume || 0
                        )

                        -

                        Number(
                            b.volume || 0
                        )
                    );

                }
            );


            // ==================================
            // PLACE PRODUCT IN SLOTS
            // ==================================

            suitableSlots.forEach(
                function (slot) {

                    if (
                        remainingQuantity <= 0
                    ) {

                        return;

                    }


                    const availableVolume =

                        Number(
                            slot.volume || 0
                        )

                        -

                        Number(
                            slot.usedVolume || 0
                        );


                    /*
                     * How many complete
                     * storage units can fit?
                     */

                    const unitsThatFit =
                        Math.floor(
                            availableVolume /
                            unitVolume
                        );


                    if (
                        unitsThatFit <= 0
                    ) {

                        return;

                    }


                    const quantityToAllocate =
                        Math.min(

                            remainingQuantity,

                            unitsThatFit

                        );


                    if (
                        quantityToAllocate <= 0
                    ) {

                        return;

                    }


                    // ==================================
                    // EMPTY SLOT
                    // ==================================

                    if (
                        !slot.productId
                    ) {

                        slot.productId =
                            product.id;

                        slot.productName =
                            product.name;

                        slot.productQuantity =
                            quantityToAllocate;

                    }


                    // ==================================
                    // SAME PRODUCT
                    // ==================================

                    else {

                        /*
                         * This should only happen
                         * when the slot already contains
                         * the same product.
                         */

                        if (
                            slot.productId !==
                            product.id
                        ) {

                            return;

                        }


                        slot.productQuantity =

                            Number(
                                slot.productQuantity ||
                                0
                            )

                            +

                            quantityToAllocate;

                    }


                    // ==================================
                    // UPDATE VOLUME
                    // ==================================

                    const addedVolume =

                        quantityToAllocate *
                        unitVolume;


                    slot.usedVolume =

                        Number(
                            slot.usedVolume || 0
                        )

                        +

                        addedVolume;


                    // ==================================
                    // UPDATE PRODUCT
                    // ==================================

                    remainingQuantity -=
                        quantityToAllocate;


                    product.allocatedQuantity =

                        Number(
                            product.allocatedQuantity ||
                            0
                        )

                        +

                        quantityToAllocate;

                }
            );


            // ==================================
            // ALLOCATION RESULT
            // ==================================

            if (
                remainingQuantity === 0
            ) {

                product.allocationStatus =
                    "Allocated";

                product.allocationMessage =
                    "Product fully allocated.";

                allocatedCount++;

            }

            else {

                product.allocationStatus =
                    "Pending";


                product.allocationMessage =
                    "Not enough suitable warehouse space.";


                failedCount++;


                failedProducts.push({

                    name:
                        product.name,

                    requested:
                        product.quantity,

                    allocated:
                        product.allocatedQuantity || 0,

                    remaining:
                        remainingQuantity,

                    reason:
                        "Not enough suitable warehouse space."

                });

            }

        }
    );


    // ======================================
    // SAVE
    // ======================================

    saveSlots(
        slots
    );


    saveProducts(
        products
    );


    // ======================================
    // RESULT MESSAGE
    // ======================================

    allocationMessage.innerText =
        "Warehouse allocation completed.";


    let resultHTML = `

        <div class="allocation-success">

            Successfully fully allocated:

            <strong>
                ${allocatedCount}
            </strong>

            product(s).

        </div>

    `;


    if (
        failedCount > 0
    ) {

        resultHTML += `

            <div class="allocation-warning">

                <strong>
                    ${failedCount}
                    product(s) still need allocation.
                </strong>

                <ul>

        `;


        failedProducts.forEach(
            function (item) {

                resultHTML += `

                    <li>

                        ${item.name}:

                        ${item.allocated}
                        allocated /

                        ${item.requested}
                        requested

                        <br>

                        ${item.reason}

                    </li>

                `;

            }
        );


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
    // REFRESH WAREHOUSE
    // ======================================

    displaySlots();

}


// ==========================================
// CREATE SLOT BOX
// ==========================================

function createSlotBox(slot) {

    const slotBox =
        document.createElement(
            "div"
        );


    slotBox.className =
        "warehouse-slot";


    const usedVolume =
        Number(
            slot.usedVolume || 0
        );


    const totalVolume =
        Number(
            slot.volume || 0
        );


    const availableVolume =
        Math.max(

            totalVolume -
            usedVolume,

            0

        );


    const percentage =

        totalVolume > 0

            ?

            Math.min(

                (
                    usedVolume /
                    totalVolume
                ) * 100,

                100

            )

            :

            0;


    // ======================================
    // STATUS
    // ======================================

    let status =
        "Empty";


    if (
        availableVolume <= 0 &&
        totalVolume > 0
    ) {

        status =
            "Full";

    }

    else if (
        usedVolume > 0
    ) {

        status =
            "Occupied";

    }


    // ======================================
    // FIND PRODUCT
    // ======================================

    const products =
        getProducts();


    const product =
        products.find(
            function (item) {

                return (
                    item.id ===
                    slot.productId
                );

            }
        );


    const productUnit =
        product
            ? product.unit
            : "units";


    // ======================================
    // HTML
    // ======================================

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


        <div class="slot-dimensions">

            ${slot.length}
            ×
            ${slot.breadth}
            ×
            ${slot.height}
            cm

        </div>


        ${
            slot.productName

                ?

                `

                    <div class="slot-product">

                        ${slot.productName}

                    </div>


                    <div class="slot-quantity">

                        ${slot.productQuantity}
                        ${productUnit}

                    </div>

                `

                :

                `

                    <div class="slot-product empty">

                        Empty

                    </div>

                `
        }


        <div class="slot-capacity">

            ${usedVolume.toFixed(2)}
            /
            ${totalVolume.toFixed(2)}
            cm³

        </div>


        <div class="slot-progress">

            <div
                class="slot-progress-bar"
                style="width:${percentage}%"
            ></div>

        </div>

    `;


    // ======================================
    // CLICK
    // ======================================

    slotBox.addEventListener(
        "click",
        function () {

            showSlotDetails(
                slot
            );

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


    largeSlots.innerHTML =
        "";

    mediumSlots.innerHTML =
        "";

    smallSlots.innerHTML =
        "";


    if (
        slots.length === 0
    ) {

        largeSlots.innerHTML = `

            <p class="empty-message">

                No slots created yet.

            </p>

        `;

        return;

    }


    slots.forEach(
        function (slot) {

            const slotBox =
                createSlotBox(
                    slot
                );


            if (
                slot.size ===
                "Large"
            ) {

                largeSlots.appendChild(
                    slotBox
                );

            }

            else if (
                slot.size ===
                "Medium"
            ) {

                mediumSlots.appendChild(
                    slotBox
                );

            }

            else if (
                slot.size ===
                "Small"
            ) {

                smallSlots.appendChild(
                    slotBox
                );

            }

        }
    );

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

        slot.length +
        " × " +
        slot.breadth +
        " × " +
        slot.height +
        " cm";


    document.getElementById(
        "modalUsed"
    ).innerText =

        Number(
            slot.usedVolume || 0
        ).toFixed(2) +

        " cm³";


    const availableVolume =

        Math.max(

            Number(
                slot.volume || 0
            )

            -

            Number(
                slot.usedVolume || 0
            ),

            0

        );


    document.getElementById(
        "modalAvailable"
    ).innerText =

        availableVolume.toFixed(2) +
        " cm³";


    // ======================================
    // PRODUCT
    // ======================================

    document.getElementById(
        "modalProduct"
    ).innerText =

        slot.productName ||
        "Empty";


    // ======================================
    // STATUS
    // ======================================

    let status =
        "Available";


    if (
        availableVolume <= 0
    ) {

        status =
            "Full";

    }

    else if (
        Number(
            slot.usedVolume || 0
        ) === 0
    ) {

        status =
            "Empty";

    }


    document.getElementById(
        "modalStatus"
    ).innerText =
        status;


    // ======================================
    // PROGRESS
    // ======================================

    const percentage =

        Number(
            slot.volume || 0
        ) > 0

            ?

            Math.min(

                (
                    Number(
                        slot.usedVolume || 0
                    )

                    /

                    Number(
                        slot.volume || 0
                    )

                ) * 100,

                100

            )

            :

            0;


    document.getElementById(
        "modalProgress"
    ).style.width =
        percentage + "%";


    // ======================================
    // SHOW MODAL
    // ======================================

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