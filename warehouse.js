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



function getSlots() {

    const savedSlots =
        localStorage.getItem(SLOT_KEY);


    if (savedSlots) {

        return JSON.parse(savedSlots);

    }


    return [];

}



/*
    Create visual box for a slot
*/

function createSlotBox(slot) {

    const slotBox =
        document.createElement("div");


    slotBox.className =
        "warehouse-slot";


    slotBox.innerHTML = `

        <div class="slot-id">
            ${slot.id}
        </div>

        <div class="slot-size">
            ${slot.size}
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



/*
    Display all warehouse slots
*/

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



/*
    Show slot information
*/

function showSlotDetails(slot) {


    document.getElementById(
        "modalSlotId"
    ).innerText = slot.id;


    document.getElementById(
        "modalSize"
    ).innerText = slot.size;


    document.getElementById(
        "modalCapacity"
    ).innerText =
        slot.capacity + " units";


    document.getElementById(
        "modalUsed"
    ).innerText =
        slot.used + " units";



    const available =
        slot.capacity - slot.used;


    document.getElementById(
        "modalAvailable"
    ).innerText =
        available + " units";



    let status;


    if (available === 0) {

        status = "Full";

    }

    else if (slot.used === 0) {

        status = "Empty";

    }

    else {

        status = "Available";

    }


    document.getElementById(
        "modalStatus"
    ).innerText = status;



    const percentage =
        (slot.used / slot.capacity) * 100;


    document.getElementById(
        "modalProgress"
    ).style.width =
        percentage + "%";


    slotModal.classList.add("show");

}



/*
    Close popup
*/

closeModal.addEventListener(
    "click",
    function () {

        slotModal.classList.remove("show");

    }
);



/*
    Close popup by clicking
    outside the card
*/

slotModal.addEventListener(
    "click",
    function (event) {

        if (event.target === slotModal) {

            slotModal.classList.remove(
                "show"
            );

        }

    }
);



displaySlots();