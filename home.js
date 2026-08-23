
// ==========================================
// DASHBOARD BUTTON
// ==========================================

const dashboardBtn =
    document.getElementById("dashboardBtn");

const ctaDashboardBtn =
    document.getElementById("ctaDashboardBtn");


if (dashboardBtn) {

    dashboardBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "dashBoard.html";

        }
    );

}


if (ctaDashboardBtn) {

    ctaDashboardBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "dashBoard.html";

        }
    );

}


// ==========================================
// PRODUCTS BUTTON
// ==========================================

const productBtn =
    document.getElementById("productBtn");


if (productBtn) {

    productBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "product.html";

        }
    );

}


// ==========================================
// HEADER USER GREETING
// ==========================================

(function () {

    const savedUser = localStorage.getItem("currentuser");
    const welcomeEl = document.getElementById("welcomeUser");
    const logoutBtnEl = document.getElementById("logoutBtn");

    if (savedUser) {

        // User is logged in — show name and logout button
        try {
            const user = JSON.parse(savedUser);
            if (welcomeEl) welcomeEl.innerText = "Welcome, " + user.name;
        } catch (error) {
            console.error("Invalid user data", error);
        }

    } else {

        // User is NOT logged in — hide welcome text, change button to Login
        if (welcomeEl) welcomeEl.style.display = "none";

        if (logoutBtnEl) {
            logoutBtnEl.innerText = "Login";
            logoutBtnEl.onclick = function () {
                window.location.href = "login.html";
            };
        }

    }

})();


// ==========================================
// LOGOUT
// ==========================================

const logoutBtn =
    document.getElementById("logoutBtn");


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "currentuser"
            );

            window.location.href =
                "login.html";

        }
    );

}