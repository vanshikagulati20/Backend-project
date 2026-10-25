const slotForm = document.getElementById("slotForm");

const slotType = document.getElementById("slotType");
const slotLength = document.getElementById("slotLength");
const slotBreadth = document.getElementById("slotBreadth");
const slotHeight = document.getElementById("slotHeight");
const slotCount = document.getElementById("slotCount");

const CURRENT_USER_KEY = "currentuser";
// const API_URL = "http://localhost:5000/api";

const API_URL = "https://storvia-api.onrender.com/api";


// Get the logged-in user
function getCurrentUser() {
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);

    if (!savedUser) {
        window.location.href = "login.html";
        return null;
    }

    try {
        const user = JSON.parse(savedUser);

        if (!user || !user.email) {
            localStorage.removeItem(CURRENT_USER_KEY);
            window.location.href = "login.html";
            return null;
        }

        return user;
    } catch (error) {
        console.error("Invalid current user data:", error);
        localStorage.removeItem(CURRENT_USER_KEY);
        window.location.href = "login.html";
        return null;
    }
}

// Handle slot form submission
slotForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const currentUser = getCurrentUser();

    if (!currentUser) {
        return;
    }

    const selectedType = slotType.value;
    const length = Number(slotLength.value);
    const breadth = Number(slotBreadth.value);
    const height = Number(slotHeight.value);
    const numberOfSlots = Number(slotCount.value);

    // Validate form values
    if (!["Small", "Medium", "Large"].includes(selectedType)) {
        alert("Please select a valid slot type.");
        return;
    }

    if (
        !Number.isFinite(length) ||
        !Number.isFinite(breadth) ||
        !Number.isFinite(height) ||
        length <= 0 ||
        breadth <= 0 ||
        height <= 0
    ) {
        alert("Length, breadth and height must be greater than 0.");
        return;
    }

    if (!Number.isInteger(numberOfSlots) || numberOfSlots < 1) {
        alert("Number of slots must be a positive whole number.");
        return;
    }

    const volume = length * breadth * height;

    const submitButton = slotForm.querySelector(
        'button[type="submit"]'
    );

    const originalButtonText = submitButton.textContent;

    submitButton.disabled = true;
    submitButton.textContent = "Saving Slots...";

    try {
        const response = await fetch(`${API_URL}/slots`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                slotType: selectedType,
                length,
                breadth,
                height,
                numberOfSlots,
                userEmail: currentUser.email
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Unable to save slots."
            );
        }

        alert(
            `${result.count} ${selectedType} slot(s) added successfully.\n\n` +
            `Slot dimensions: ${length} × ${breadth} × ${height} cm\n\n` +
            `Volume per slot: ${volume} cm³\n\n` +
            "Slots have been saved to MongoDB."
        );

        slotForm.reset();

    } catch (error) {
        console.error("Save slots error:", error);

        alert(
            error.message ||
            "Could not connect to the backend. Please make sure the server is running."
        );
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
});

// Display the logged-in user's name
(function () {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        return;
    }

    const welcomeEl = document.getElementById("welcomeUser");

    if (welcomeEl) {
        welcomeEl.textContent = `Welcome, ${currentUser.name}`;
    }

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            localStorage.removeItem(CURRENT_USER_KEY);
            window.location.href = "login.html";
        });
    }
})();

// Center the active navigation link
(function () {
    function centerActiveNavLink() {
        const nav = document.querySelector(".dashboard-nav");
        const active = nav && nav.querySelector("a.active");

        if (nav && active) {
            const navRect = nav.getBoundingClientRect();
            const activeRect = active.getBoundingClientRect();

            const relativeLeft =
                activeRect.left - navRect.left + nav.scrollLeft;

            const targetScroll =
                relativeLeft -
                (nav.clientWidth - active.clientWidth) / 2;

            nav.style.scrollBehavior = "auto";
            nav.scrollLeft = Math.max(0, targetScroll);

            requestAnimationFrame(function () {
                nav.style.scrollBehavior = "";
            });
        }
    }

    if (
        document.readyState === "complete" ||
        document.readyState === "interactive"
    ) {
        centerActiveNavLink();
    } else {
        document.addEventListener(
            "DOMContentLoaded",
            centerActiveNavLink
        );
    }

    window.addEventListener("load", centerActiveNavLink);
})();