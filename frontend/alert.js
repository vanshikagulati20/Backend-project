(() => {
    "use strict";

    const CURRENT_USER_KEY = "currentuser";
    const LOW_STOCK_THRESHOLD = 10;
    const AUTO_DISMISS_MS = 7500;
    const MAX_VISIBLE_NOTIFICATIONS = 5;

    // Use the local API during development and the deployed API on the live site.
    const API_BASE_URL = window.STORVIA_API_URL ||
        ((window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
            ? "http://localhost:5000/api"
            : "https://storvia-api.onrender.com/api");

    let notificationContainer;
    const activeTimers = new Set();

    function getCurrentUser() {
        try {
            const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null");
            if (!user || !user.email) {
                window.location.href = "login.html";
                return null;
            }
            return user;
        } catch (error) {
            console.error("Could not read the current user:", error);
            localStorage.removeItem(CURRENT_USER_KEY);
            window.location.href = "login.html";
            return null;
        }
    }

    async function fetchRecords(resource, email) {
        const url = `${API_BASE_URL}/${resource}?userEmail=${encodeURIComponent(email)}`;
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        let payload;
        try {
            payload = await response.json();
        } catch {
            throw new Error(`The ${resource} API returned an invalid response.`);
        }
        if (!response.ok || payload?.success === false) {
            throw new Error(payload?.message || `Could not load ${resource} (${response.status}).`);
        }
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload.data)) return payload.data;
        if (Array.isArray(payload[resource])) return payload[resource];
        throw new Error(`Unexpected ${resource} response format.`);
    }

    function ensureNotificationContainer() {
        if (notificationContainer && document.body.contains(notificationContainer)) return notificationContainer;
        notificationContainer = document.getElementById("warehouseNotificationStack");
        if (!notificationContainer) {
            notificationContainer = document.createElement("div");
            notificationContainer.id = "warehouseNotificationStack";
            notificationContainer.className = "warehouse-notification-stack";
            notificationContainer.setAttribute("aria-label", "Warehouse notifications");
            notificationContainer.setAttribute("aria-live", "polite");
            notificationContainer.setAttribute("aria-relevant", "additions");
            document.body.appendChild(notificationContainer);
        }
        updateNotificationPosition();
        return notificationContainer;
    }

    // Keep the toast stack just below the page navigation/header.
    function updateNotificationPosition() {
        const header = document.querySelector(".dashboard-header, header");
        const headerBottom = header ? header.getBoundingClientRect().bottom : 80;
        const top = Math.max(80, Math.round(headerBottom + 12));
        document.documentElement.style.setProperty("--storvia-notification-top", `${top}px`);
    }

    function dismissNotification(item) {
        if (!item || item.dataset.dismissing === "true") return;
        item.dataset.dismissing = "true";
        item.classList.remove("notification-visible");
        item.classList.add("notification-hiding");
        window.setTimeout(() => item.remove(), 240);
    }

    function createNotification({ type, title, message }) {
        const item = document.createElement("article");
        item.className = `warehouse-notification notification-${type}`;
        item.setAttribute("role", type === "danger" ? "alert" : "status");

        const icon = document.createElement("span");
        icon.className = "notification-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = type === "danger" ? "!" : type === "warning" ? "⚠" : "i";

        const content = document.createElement("div");
        content.className = "notification-content";
        const heading = document.createElement("strong");
        heading.className = "notification-title";
        heading.textContent = title;
        const body = document.createElement("p");
        body.className = "notification-message";
        body.textContent = message;

        const close = document.createElement("button");
        close.className = "notification-close";
        close.type = "button";
        close.setAttribute("aria-label", "Dismiss notification");
        close.textContent = "×";
        close.addEventListener("click", () => dismissNotification(item));

        const progress = document.createElement("span");
        progress.className = "notification-progress";
        progress.style.animationDuration = `${AUTO_DISMISS_MS}ms`;

        content.append(heading, body);
        item.append(icon, content, close, progress);

        // Append new items at the bottom; older notifications remain above them.
        ensureNotificationContainer().appendChild(item);
        requestAnimationFrame(() => item.classList.add("notification-visible"));

        while (notificationContainer.children.length > MAX_VISIBLE_NOTIFICATIONS) {
            dismissNotification(notificationContainer.firstElementChild);
        }

        const timer = window.setTimeout(() => {
            activeTimers.delete(timer);
            dismissNotification(item);
        }, AUTO_DISMISS_MS);
        activeTimers.add(timer);

        item.addEventListener("mouseenter", () => {
            progress.style.animationPlayState = "paused";
        });
        item.addEventListener("mouseleave", () => {
            progress.style.animationPlayState = "running";
        });
        return item;
    }

    function buildNotifications(products, slots) {
        const notifications = [];
        products.forEach(product => {
            const quantity = Number(product.quantity || 0);
            const allocated = Number(product.allocatedQuantity || 0);
            const productName = product.name || product.productName || "Unnamed product";
            const unit = product.unit || "units";

            if (quantity > 0 && quantity <= LOW_STOCK_THRESHOLD) {
                notifications.push({ type: "danger", title: "Low stock", message: `${productName} has only ${quantity} ${unit} remaining.` });
            } else if (quantity <= 0) {
                notifications.push({ type: "danger", title: "Out of stock", message: `${productName} has no stock remaining.` });
            }
            if (allocated < quantity) {
                notifications.push({ type: "warning", title: "Pending allocation", message: `${productName}: ${quantity - allocated} ${unit} still need warehouse space.` });
            }
        });

        slots.forEach(slot => {
            const capacity = Number(slot.volume || slot.capacity || 0);
            const used = Number(slot.usedVolume || 0);
            const slotName = slot.id || slot.slotId || "Unnamed slot";
            if (capacity > 0 && used >= capacity) {
                notifications.push({ type: "danger", title: `Slot ${slotName} is full`, message: "This warehouse slot has reached its available capacity." });
            }
        });
        return notifications;
    }

    async function loadAlerts() {
        const currentUser = getCurrentUser();
        if (!currentUser) return;
        ensureNotificationContainer();

        try {
            const email = String(currentUser.email).trim().toLowerCase();
            const [products, slots] = await Promise.all([
                fetchRecords("products", email),
                fetchRecords("slots", email)
            ]);
            const userProducts = products.filter(product =>
                !product.userEmail || String(product.userEmail).trim().toLowerCase() === email
            );
            const userSlots = slots.filter(slot =>
                !slot.userEmail || String(slot.userEmail).trim().toLowerCase() === email
            );
            const notifications = buildNotifications(userProducts, userSlots);

            if (notifications.length === 0) {
                notificationContainer.dataset.state = "clear";
                return;
            }
            notificationContainer.dataset.state = "alerts";
            notifications.forEach(createNotification);
        } catch (error) {
            notificationContainer.dataset.state = "error";
            console.error("Warehouse notifications could not be loaded:", error);
            createNotification({
                type: "warning",
                title: "Notifications unavailable",
                message: "Could not load current warehouse data. Check the backend connection and refresh this page."
            });
        }
    }

    function initAlertSystem() {
        ensureNotificationContainer();
        window.addEventListener("resize", updateNotificationPosition);
        window.addEventListener("scroll", updateNotificationPosition, { passive: true });
        const logoutButton = document.getElementById("logoutBtn");
        if (logoutButton && !logoutButton.dataset.alertLogoutBound) {
            logoutButton.dataset.alertLogoutBound = "true";
            logoutButton.addEventListener("click", () => {
                activeTimers.forEach(timer => window.clearTimeout(timer));
                activeTimers.clear();
                localStorage.removeItem(CURRENT_USER_KEY);
            });
        }
        loadAlerts();
    }

    // Works whether this script loads before or after DOMContentLoaded.
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAlertSystem, { once: true });
    } else {
        initAlertSystem();
    }
})();
