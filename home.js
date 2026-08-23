// ==========================================
// DASHBOARD BUTTON
// ==========================================

const dashboardBtn =
    document.getElementById("dashboardBtn");

const ctaDashboardBtn =
    document.getElementById("ctaDashboardBtn");


if (dashboardBtn) {

    dashboardBtn.addEventListener("click", function () {

        window.location.href = "dashBoard.html";

    });

}


if (ctaDashboardBtn) {

    ctaDashboardBtn.addEventListener("click", function () {

        window.location.href = "dashBoard.html";

    });

}


// ==========================================
// PRODUCTS BUTTON
// ==========================================

const productBtn =
    document.getElementById("productBtn");


if (productBtn) {

    productBtn.addEventListener("click", function () {

        window.location.href = "product.html";

    });

}


// ==========================================
// HEADER USER / LOGIN / LOGOUT
// ==========================================

(function () {

    const savedUser =
        localStorage.getItem("currentuser");

    const welcomeEl =
        document.getElementById("welcomeUser");

    const logoutBtnEl =
        document.getElementById("logoutBtn");


    if (!logoutBtnEl) {
        return;
    }


    // ==========================================
    // USER IS LOGGED IN
    // ==========================================

    if (savedUser) {

        try {

            const user =
                JSON.parse(savedUser);

            if (welcomeEl) {

                welcomeEl.style.display = "inline";

                welcomeEl.innerText =
                    "Welcome, " + user.name;

            }

        } catch (error) {

            console.error(
                "Invalid user data",
                error
            );

        }


        // Show Logout button
        logoutBtnEl.innerText = "Logout";


        // Logout action
        logoutBtnEl.onclick = function () {

            localStorage.removeItem("currentuser");

            // Go to Home Page
            window.location.href = "index.html";

        };


    }

    // ==========================================
    // USER IS NOT LOGGED IN
    // ==========================================

    else {

        if (welcomeEl) {

            welcomeEl.style.display = "none";

        }


        // Change button to Login
        logoutBtnEl.innerText = "Login";


        // Login action
        logoutBtnEl.onclick = function () {

            window.location.href = "login.html";

        };

    }

})();