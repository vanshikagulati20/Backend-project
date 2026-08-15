const slotForm =
    document.getElementById("slotForm");

const slotSize =
    document.getElementById("slotSize");

const slotCount =
    document.getElementById("slotCount");


const SLOT_KEY = "warehouseSlots";



const SLOT_CAPACITY = {

    Large: 100,

    Medium: 50,

    Small: 25

};



const SLOT_PREFIX = {

    Large: "A",

    Medium: "B",

    Small: "C"

};



function getSlots() {

    const savedSlots =
        localStorage.getItem(SLOT_KEY);


    if (savedSlots) {

        return JSON.parse(savedSlots);

    }


    return [];

}



function saveSlots(slots) {

    localStorage.setItem(
        SLOT_KEY,
        JSON.stringify(slots)
    );

}



slotForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const selectedSize =
            slotSize.value;


        const numberOfSlots =
            Number(slotCount.value);



        if (selectedSize === "") {

            alert("Please select a slot size.");

            return;

        }



        if (numberOfSlots <= 0) {

            alert(
                "Number of slots must be greater than 0."
            );

            return;

        }



        const slots = getSlots();


        const prefix =
            SLOT_PREFIX[selectedSize];


        const capacity =
            SLOT_CAPACITY[selectedSize];



        /*
            Find how many slots of this
            size already exist.
        */

        let existingCount = 0;


        slots.forEach(function (slot) {

            if (slot.size === selectedSize) {

                existingCount++;

            }

        });



        /*
            Create new slots.

            Example:

            Existing:
            A-01
            A-02

            Add 2 more:

            A-03
            A-04
        */

        for (
            let i = 1;
            i <= numberOfSlots;
            i++
        ) {


            const slotNumber =
                existingCount + i;


            const formattedNumber =
                String(slotNumber).padStart(2, "0");


            const newSlot = {

                id:
                    prefix + "-" + formattedNumber,

                size:
                    selectedSize,

                capacity:
                    capacity,

                used: 0

            };


            slots.push(newSlot);

        }



        saveSlots(slots);


        alert(
            numberOfSlots +
            " " +
            selectedSize +
            " slot(s) added successfully."
        );


        slotForm.reset();

    }
);