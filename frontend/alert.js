/**
 * Storvia Warehouse Notification & Alert System
 * - Top-right modern rectangular toast notifications positioned directly below the navigation bar.
 * - Stacking order: Oldest at the top, newest at the bottom.
 * - Unified window.showAlert(message, type, options) API.
 * - Independent auto-dismiss timers (4-5s) with pause-on-hover & manual dismiss.
 * - In-page warehouse alert card management for dashBoard.html (#alertsList).
 */

(() => {
    "use strict";

    const DEFAULT_DURATION_MS = 4200; // 4.2 seconds (within 4-5s requirement)
    const MAX_VISIBLE_NOTIFICATIONS = 5;
    const DEDUPE_WINDOW_MS = 1500;
    const CURRENT_USER_KEY = "currentuser";
    const LOW_STOCK_THRESHOLD = 10;

    const API_BASE_URL = "https://storvia-api.onrender.com/api";

    // SVG Icons for clean, crisp rendering on all displays
    const ICONS = {
        success: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>`,
        error: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>`,
        warning: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`,
        info: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>`
    };

    const DEFAULT_TITLES = {
        success: "Success",
        error: "Error",
        warning: "Warning",
        info: "Notice"
    };

    let notificationContainer = null;
    const recentAlerts = new Map();
    const pendingAlertsQueue = [];

    /**
     * Compute and update the top offset of the toast container
     * so it never overlaps the navigation bar or top header.
     */
    function updateNotificationPosition() {
        const header = document.querySelector(".dashboard-header, header");
        const headerBottom = header ? header.getBoundingClientRect().bottom : 80;
        const top = Math.max(76, Math.round(headerBottom + 12));
        document.documentElement.style.setProperty("--storvia-notification-top", `${top}px`);
    }

    /**
     * Ensure the toast notification stack container exists in the DOM.
     * Reuses an existing container if present to avoid duplicates.
     */
    function ensureNotificationContainer() {
        if (notificationContainer && document.body && document.body.contains(notificationContainer)) {
            return notificationContainer;
        }

        notificationContainer = document.getElementById("warehouseNotificationStack") ||
            document.getElementById("storviaNotificationStack") ||
            document.querySelector(".warehouse-notification-stack");

        if (!notificationContainer && document.body) {
            notificationContainer = document.createElement("div");
            notificationContainer.id = "warehouseNotificationStack";
            notificationContainer.className = "warehouse-notification-stack";
            notificationContainer.setAttribute("aria-label", "Notifications");
            notificationContainer.setAttribute("aria-live", "polite");
            notificationContainer.setAttribute("aria-relevant", "additions");
            document.body.appendChild(notificationContainer);
        }

        updateNotificationPosition();
        return notificationContainer;
    }

    /**
     * Animate out and remove a notification item smoothly from the DOM.
     */
    function dismissNotification(item) {
        if (!item || item.dataset.dismissing === "true") return;
        item.dataset.dismissing = "true";

        if (item._autoDismissTimer) {
            clearTimeout(item._autoDismissTimer);
            item._autoDismissTimer = null;
        }

        item.classList.remove("notification-visible");
        item.classList.add("notification-hiding");

        // Wait for CSS slide-out animation to finish before removal
        const onFinish = () => {
            if (item.parentNode) {
                item.remove();
            }
        };

        item.addEventListener("animationend", onFinish, { once: true });
        // Fallback timer in case animationend does not fire
        setTimeout(onFinish, 280);
    }

    /**
     * Primary notification function: window.showAlert(message, type, options)
     *
     * @param {string|Error|Object} message - The notification message or options object
     * @param {string} [type='info'] - 'success' | 'error' | 'warning' | 'info' (or 'danger')
     * @param {Object} [options] - Optional custom title, duration, etc.
     * @returns {HTMLElement|null}
     */
    function showAlert(message, type = "info", options = {}) {
        // If called before document.body is available, queue it
        if (!document.body) {
            pendingAlertsQueue.push({ message, type, options });
            return null;
        }

        // Check if message is an Error or error-like object
        const isErrorLike = message instanceof Error ||
            (message && typeof message === "object" && ("stack" in message || message.constructor?.name?.includes("Error")));

        if (isErrorLike) {
            message = message.message || "An unexpected error occurred.";
            type = "error";
        } else if (typeof message === "object" && message !== null) {
            const config = message;
            message = config.message || config.text || "";
            type = config.type || type;
            options = { ...config, ...options };
        }

        // Handle empty or whitespace-only messages safely
        if (typeof message !== "string") {
            message = String(message ?? "");
        }
        message = message.trim();
        if (!message) {
            return null;
        }

        // Normalize alert types
        let normalizedType = String(type || "info").toLowerCase().trim();
        if (normalizedType === "danger") normalizedType = "error";
        if (normalizedType === "warn") normalizedType = "warning";
        if (!["success", "error", "warning", "info"].includes(normalizedType)) {
            normalizedType = "info";
        }

        // Prevent duplicate alerts triggered for the same event in quick succession
        const dedupeKey = `${normalizedType}:${message}`;
        const lastSeen = recentAlerts.get(dedupeKey);
        const now = Date.now();
        if (lastSeen && (now - lastSeen) < DEDUPE_WINDOW_MS) {
            return null;
        }
        recentAlerts.set(dedupeKey, now);

        // Periodically prune dedupe cache
        if (recentAlerts.size > 50) {
            for (const [key, timestamp] of recentAlerts.entries()) {
                if (now - timestamp > 10000) recentAlerts.delete(key);
            }
        }

        const duration = Number(options.duration) > 0 ? Number(options.duration) : DEFAULT_DURATION_MS;
        const title = options.title || DEFAULT_TITLES[normalizedType];

        const container = ensureNotificationContainer();
        if (!container) return null;

        // Build Toast Element
        const item = document.createElement("article");
        item.className = `warehouse-notification notification-${normalizedType}`;
        item.setAttribute("role", normalizedType === "error" ? "alert" : "status");

        // Icon
        const iconWrapper = document.createElement("div");
        iconWrapper.className = "notification-icon";
        iconWrapper.setAttribute("aria-hidden", "true");
        iconWrapper.innerHTML = ICONS[normalizedType] || ICONS.info;

        // Content
        const content = document.createElement("div");
        content.className = "notification-content";

        const titleEl = document.createElement("strong");
        titleEl.className = "notification-title";
        titleEl.textContent = title;

        const messageEl = document.createElement("p");
        messageEl.className = "notification-message";
        messageEl.textContent = message;

        content.appendChild(titleEl);
        content.appendChild(messageEl);

        // Close button
        const closeBtn = document.createElement("button");
        closeBtn.className = "notification-close";
        closeBtn.type = "button";
        closeBtn.setAttribute("aria-label", "Dismiss notification");
        closeBtn.innerHTML = "&times;";
        closeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            dismissNotification(item);
        });

        // Countdown progress bar
        const progressBar = document.createElement("div");
        progressBar.className = "notification-progress-bar";
        const progress = document.createElement("div");
        progress.className = "notification-progress";
        progress.style.animationDuration = `${duration}ms`;
        progressBar.appendChild(progress);

        item.appendChild(iconWrapper);
        item.appendChild(content);
        item.appendChild(closeBtn);
        item.appendChild(progressBar);

        // Stacking order: Oldest at the top, newest at the bottom.
        // Appending to the flex-direction: column container achieves this naturally.
        container.appendChild(item);

        // Cap maximum visible notifications to prevent screen overflow
        const nonDismissingChildren = Array.from(container.children).filter(
            el => el.dataset && el.dataset.dismissing !== "true"
        );
        if (nonDismissingChildren.length > MAX_VISIBLE_NOTIFICATIONS) {
            const overflowCount = nonDismissingChildren.length - MAX_VISIBLE_NOTIFICATIONS;
            for (let i = 0; i < overflowCount; i++) {
                dismissNotification(nonDismissingChildren[i]);
            }
        }

        // Independent timer with hover-to-pause support
        let remainingTime = duration;
        let timerStart = Date.now();

        const startTimer = () => {
            timerStart = Date.now();
            item._autoDismissTimer = setTimeout(() => {
                dismissNotification(item);
            }, remainingTime);
        };

        const pauseTimer = () => {
            if (item._autoDismissTimer) {
                clearTimeout(item._autoDismissTimer);
                item._autoDismissTimer = null;
            }
            const elapsed = Date.now() - timerStart;
            remainingTime = Math.max(0, remainingTime - elapsed);
            progress.style.animationPlayState = "paused";
        };

        const resumeTimer = () => {
            if (remainingTime > 0) {
                progress.style.animationPlayState = "running";
                startTimer();
            } else {
                dismissNotification(item);
            }
        };

        item.addEventListener("mouseenter", pauseTimer);
        item.addEventListener("mouseleave", resumeTimer);

        // Start countdown
        startTimer();

        return item;
    }

    // Expose reusable alert methods globally
    window.showAlert = showAlert;
    window.showNotification = showAlert;
    window.dismissNotification = dismissNotification;

    /**
     * Dashboard In-Page Warehouse Alerts (#alertsList on dashBoard.html)
     */
    async function loadDashboardWarehouseAlerts() {
        const alertContainer = document.getElementById("alertsList");
        if (!alertContainer) return;

        let currentUser = null;
        try {
            const storage = (typeof window !== "undefined" && window.localStorage) ? window.localStorage : (typeof localStorage !== "undefined" ? localStorage : null);
            currentUser = JSON.parse(storage?.getItem(CURRENT_USER_KEY) || "null");
        } catch {
            currentUser = null;
        }

        if (!currentUser || !currentUser.email) {
            alertContainer.innerHTML = `
                <div class="no-alerts">
                    <strong>Please log in</strong>
                    <p>Log in to view live warehouse stock and capacity alerts.</p>
                </div>
            `;
            return;
        }

        alertContainer.innerHTML = `
            <div class="no-alerts">
                <p>Loading live warehouse alerts...</p>
            </div>
        `;

        try {
            const userEmail = encodeURIComponent(String(currentUser.email).trim().toLowerCase());
            const [productsRes, slotsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/products?userEmail=${userEmail}`).then(r => r.json()),
                fetch(`${API_BASE_URL}/slots?userEmail=${userEmail}`).then(r => r.json())
            ]);

            const products = Array.isArray(productsRes) ? productsRes :
                Array.isArray(productsRes?.data) ? productsRes.data :
                Array.isArray(productsRes?.products) ? productsRes.products : [];

            const slots = Array.isArray(slotsRes) ? slotsRes :
                Array.isArray(slotsRes?.data) ? slotsRes.data :
                Array.isArray(slotsRes?.slots) ? slotsRes.slots : [];

            renderWarehouseAlertCards(products, slots, alertContainer);
        } catch (error) {
            console.error("Failed to load warehouse alerts for dashboard:", error);
            alertContainer.innerHTML = `
                <div class="no-alerts" style="border-color: #fca5a5;">
                    <strong style="color: #991b1b;">⚠️ Unable to load warehouse alerts</strong>
                    <p>Could not connect to the backend server. Make sure the server is running on port 5000.</p>
                </div>
            `;
            showAlert("Could not connect to backend to load warehouse alerts.", "error");
        }
    }

    function renderWarehouseAlertCards(products, slots, container) {
        container.innerHTML = "";
        const alerts = [];

        // 1. Low stock / Out of stock
        products.forEach(product => {
            const quantity = Number(product.quantity || 0);
            const name = product.name || "Product";
            const unit = product.unit || "units";

            if (quantity <= 0) {
                alerts.push({
                    type: "danger",
                    icon: "🔴",
                    title: `Out of Stock: ${name}`,
                    message: `This item has no remaining inventory.`
                });
            } else if (quantity <= LOW_STOCK_THRESHOLD) {
                alerts.push({
                    type: "warning",
                    icon: "⚠️",
                    title: `Low Stock: ${name}`,
                    message: `Only ${quantity} ${unit} remaining in warehouse.`
                });
            }
        });

        // 2. Pending allocation
        products.forEach(product => {
            const quantity = Number(product.quantity || 0);
            const allocated = Number(product.allocatedQuantity || 0);
            const name = product.name || "Product";
            const unit = product.unit || "units";

            if (quantity > 0 && allocated < quantity) {
                const remaining = quantity - allocated;
                alerts.push({
                    type: "warning",
                    icon: "📦",
                    title: `Pending Allocation: ${name}`,
                    message: `${remaining} ${unit} waiting for warehouse slot assignment.`
                });
            }
        });

        // 3. Full slots
        slots.forEach(slot => {
            const capacity = Number(slot.volume || slot.capacity || 0);
            const used = Number(slot.usedVolume || 0);
            const slotId = slot.id || slot.slotId || "Slot";

            if (capacity > 0 && used >= capacity) {
                alerts.push({
                    type: "danger",
                    icon: "🚫",
                    title: `Slot ${slotId} Full`,
                    message: `This slot has reached maximum capacity (${capacity} cm³).`
                });
            }
        });

        // If no alerts
        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="no-alerts">
                    <strong>✅ Everything looks good!</strong>
                    <p>No warehouse alerts at the moment.</p>
                </div>
            `;
            return;
        }

        // Render in-page cards
        alerts.forEach(item => {
            const card = document.createElement("div");
            card.className = `warehouse-alert alert-${item.type}`;

            card.innerHTML = `
                <div class="alert-icon">${item.icon}</div>
                <div class="alert-content">
                    <strong>${item.title}</strong>
                    <p>${item.message}</p>
                </div>
            `;
            container.appendChild(card);
        });

        // Also display one summary toast if there are critical warehouse issues
        const criticalCount = alerts.filter(a => a.type === "danger").length;
        if (criticalCount > 0) {
            showAlert(`Warehouse Notice: ${criticalCount} critical alert(s) requiring attention.`, "warning");
        }
    }

    /**
     * Initialization: attach event listeners and drain any queued alerts
     */
    function init() {
        ensureNotificationContainer();

        // Drain any alerts that were queued before DOM ready
        while (pendingAlertsQueue.length > 0) {
            const { message, type, options } = pendingAlertsQueue.shift();
            showAlert(message, type, options);
        }

        // Track header height for responsive placement
        window.addEventListener("resize", updateNotificationPosition);
        window.addEventListener("scroll", updateNotificationPosition, { passive: true });

        // Load dashboard in-page alerts if #alertsList exists
        if (document.getElementById("alertsList")) {
            loadDashboardWarehouseAlerts();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
