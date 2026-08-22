
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
                "dashboard.html";

        }
    );

}


if (ctaDashboardBtn) {

    ctaDashboardBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "dashboard.html";

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

    const savedUser =
        localStorage.getItem("currentuser");


    if (savedUser) {

        try {

            const user =
                JSON.parse(savedUser);


            const welcomeEl =
                document.getElementById(
                    "welcomeUser"
                );


            if (welcomeEl) {

                welcomeEl.innerText =
                    "Welcome, " + user.name;

            }

        }

        catch (error) {

            console.error(
                "Invalid user data",
                error
            );

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