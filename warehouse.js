const SLOT_KEY = "warehouseSlots";


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


// ==========================================
// GET SLOTS
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
// CREATE SLOT BOX
// ==========================================

function createSlotBox(slot) {

    const slotBox =
        document.createElement("div");


    slotBox.className =
        "warehouse-slot";


    // Determine slot status

    const capacity =
        Number(slot.capacity || 0);

    const used =
        Number(slot.used || 0);


    let status = "empty";


    if (used >= capacity && capacity > 0) {

        status = "full";

    }

    else if (used > 0) {

        status = "occupied";

    }


    slotBox.classList.add(status);


    slotBox.innerHTML = `

        <div class="slot-id">
            ${slot.id}
        </div>

        <div class="slot-size">
            ${slot.size}
        </div>

    `;


    // Click slot

    slotBox.addEventListener(
        "click",
        function () {

            showSlotDetails(slot);

        }
    );


    return slotBox;
}


// ==========================================
// DISPLAY ALL SLOTS
// ==========================================

function displaySlots() {

    const slots = getSlots();


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


    slots.forEach(
        function (slot) {

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

        }
    );
}


// ==========================================
// SHOW SLOT DETAILS
// ==========================================

function showSlotDetails(slot) {

    const capacity =
        Number(slot.capacity || 0);

    const used =
        Number(slot.used || 0);


    const available =
        Math.max(
            capacity - used,
            0
        );


    // Slot ID

    document.getElementById(
        "modalSlotId"
    ).innerText =
        slot.id;


    // Size

    document.getElementById(
        "modalSize"
    ).innerText =
        slot.size;


    // Capacity

    document.getElementById(
        "modalCapacity"
    ).innerText =
        capacity + " units";


    // Used

    document.getElementById(
        "modalUsed"
    ).innerText =
        used + " units";


    // Available

    document.getElementById(
        "modalAvailable"
    ).innerText =
        available + " units";


    // ======================================
    // PRODUCT INFORMATION
    // ======================================

    const modalProduct =
        document.getElementById(
            "modalProduct"
        );


    if (modalProduct) {

        modalProduct.innerText =
            slot.productName ||
            "Empty";

    }


    // ======================================
    // PRODUCT QUANTITY
    // ======================================

    const modalQuantity =
        document.getElementById(
            "modalQuantity"
        );


    if (modalQuantity) {

        modalQuantity.innerText =
            slot.quantity ||
            "0";

    }


    // ======================================
    // STATUS
    // ======================================

    let status;


    if (capacity === 0) {

        status = "No Capacity";

    }

    else if (used >= capacity) {

        status = "Full";

    }

    else if (used === 0) {

        status = "Empty";

    }

    else {

        status = "Available";

    }


    document.getElementById(
        "modalStatus"
    ).innerText =
        status;


    // ======================================
    // PROGRESS BAR
    // ======================================

    let percentage = 0;


    if (capacity > 0) {

        percentage =
            (used / capacity) * 100;

    }


    percentage =
        Math.min(
            Math.max(percentage, 0),
            100
        );


    document.getElementById(
        "modalProgress"
    ).style.width =
        percentage + "%";


    // ======================================
    // OPEN MODAL
    // ======================================

    slotModal.classList.add("show");
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


// ==========================================
// CLOSE WHEN CLICKING OUTSIDE
// ==========================================

slotModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target === slotModal
        ) {

            slotModal.classList.remove(
                "show"
            );

        }

    }
);


// ==========================================
// REFRESH WHEN TAB BECOMES ACTIVE
// ==========================================

window.addEventListener(
    "storage",
    function (event) {

        if (
            event.key === SLOT_KEY
        ) {

            displaySlots();

        }

    }
);


// ==========================================
// INITIAL LOAD
// ==========================================

displaySlots();