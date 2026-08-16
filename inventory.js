const slotForm =
    document.getElementById("slotForm");

const slotType =
    document.getElementById("slotType");

const slotLength =
    document.getElementById("slotLength");

const slotBreadth =
    document.getElementById("slotBreadth");

const slotHeight =
    document.getElementById("slotHeight");

const slotCount =
    document.getElementById("slotCount");


// ==========================================
// STORAGE
// ==========================================

const SLOT_KEY =
    "warehouseSlots";


// ==========================================
// SLOT PREFIX
// ==========================================

const SLOT_PREFIX = {

    Large: "A",

    Medium: "B",

    Small: "C",

    Custom: "D"

};


// ==========================================
// GET SLOTS
// ==========================================

function getSlots() {

    const savedSlots =
        localStorage.getItem(
            SLOT_KEY
        );


    if (!savedSlots) {

        return [];

    }


    try {

        return JSON.parse(
            savedSlots
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
// SUBMIT SLOT FORM
// ==========================================

slotForm.addEventListener(

    "submit",

    function (event) {

        event.preventDefault();


        // ==================================
        // GET FORM VALUES
        // ==================================

        const selectedType =
            slotType.value;


        const length =
            Number(
                slotLength.value
            );


        const breadth =
            Number(
                slotBreadth.value
            );


        const height =
            Number(
                slotHeight.value
            );


        const numberOfSlots =
            Number(
                slotCount.value
            );


        // ==================================
        // VALIDATION
        // ==================================

        if (
            selectedType === ""
        ) {

            alert(
                "Please select a slot type."
            );

            return;

        }


        if (
            length <= 0 ||
            breadth <= 0 ||
            height <= 0
        ) {

            alert(
                "Length, breadth and height must be greater than 0."
            );

            return;

        }


        if (
            numberOfSlots <= 0
        ) {

            alert(
                "Number of slots must be greater than 0."
            );

            return;

        }


        // ==================================
        // CALCULATE SLOT VOLUME
        // ==================================

        const volume =
            length *
            breadth *
            height;


        // ==================================
        // GET EXISTING SLOTS
        // ==================================

        const slots =
            getSlots();


        // ==================================
        // SLOT ID PREFIX
        // ==================================

        const prefix =
            SLOT_PREFIX[selectedType];


        // ==================================
        // FIND EXISTING COUNT
        // ==================================

        let existingCount = 0;


        slots.forEach(
            function (slot) {

                if (
                    slot.size ===
                    selectedType
                ) {

                    existingCount++;

                }

            }
        );


        // ==================================
        // CREATE SLOTS
        // ==================================

        for (
            let i = 1;
            i <= numberOfSlots;
            i++
        ) {


            const slotNumber =
                existingCount + i;


            const formattedNumber =
                String(
                    slotNumber
                ).padStart(
                    2,
                    "0"
                );


            const newSlot = {

                // --------------------------
                // BASIC INFORMATION
                // --------------------------

                id:
                    prefix +
                    "-" +
                    formattedNumber,

                size:
                    selectedType,


                // --------------------------
                // PHYSICAL DIMENSIONS
                // --------------------------

                length:
                    length,

                breadth:
                    breadth,

                height:
                    height,


                // --------------------------
                // TOTAL VOLUME
                // --------------------------

                volume:
                    volume,


                // --------------------------
                // OCCUPANCY
                // --------------------------

                usedVolume:
                    0,

                // --------------------------
                // PRODUCT INFORMATION
                // --------------------------

                productId:
                    null,

                productName:
                    null,

                productQuantity:
                    0

            };


            slots.push(
                newSlot
            );

        }


        // ==================================
        // SAVE
        // ==================================

        saveSlots(
            slots
        );


        // ==================================
        // SUCCESS MESSAGE
        // ==================================

        alert(

            numberOfSlots +
            " " +
            selectedType +
            " slot(s) added successfully.\n\n" +

            "Slot dimensions: " +
            length +
            " × " +
            breadth +
            " × " +
            height +
            " cm\n\n" +

            "Volume per slot: " +
            volume +
            " cm³"

        );


        // ==================================
        // RESET FORM
        // ==================================

        slotForm.reset();

    }

);