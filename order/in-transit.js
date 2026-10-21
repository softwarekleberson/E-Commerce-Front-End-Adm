const tableBody = document.getElementById("transit-orders-body");
const totalTransitOrdersElement = document.getElementById("total-transit-orders");
const ITEM_STATUS = "SHIPPED";

function normalizeCurrencyCode(currency) {
    const value = String(currency ?? "BRL").trim().toUpperCase();
    const map = {
        BRL: "BRL",
        REAL: "BRL",
        USD: "USD",
        DOLAR: "USD",
        USDT: "USD",
        EUR: "EUR",
        EURO: "EUR",
        GBP: "GBP",
        JPY: "JPY",
        YEN: "JPY"
    };

    return map[value] ?? (value.length === 3 ? value : "BRL");
}

function formatCurrency(value, currency) {
    const numericValue = Number(value ?? 0);
    const safeCurrency = normalizeCurrencyCode(currency);

    if (!Number.isFinite(numericValue)) {
        return `0 ${safeCurrency}`;
    }

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: safeCurrency
    }).format(numericValue);
}

function escapeHtml(value) {
    return String(value ?? "-")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return "No items";
    }

    return items.map((item) => {
        const productId = item?.productId ?? item?.product?.id ?? "-";
        const quantity = item?.quantity ?? item?.qty ?? item?.amount ?? 0;
        return `<div><strong>Product:</strong> ${escapeHtml(productId)} | <strong>Qty:</strong> ${escapeHtml(quantity)}</div>`;
    }).join("");
}

function formatDeliveryActions(items, orderId) {
    if (!Array.isArray(items) || items.length === 0) {
        return "-";
    }

    const encodedOrderId = encodeURIComponent(orderId ?? "-");
    return items.map((item) => {
        const reservationId = item?.reservationId ?? item?.stockOutId ?? item?.reservation?.id ?? "-";
        const encodedReservationId = encodeURIComponent(reservationId);

        return `<button type="button" class="delivered-button" data-order-id="${encodedOrderId}" data-reservation-id="${encodedReservationId}"${reservationId === "-" ? " disabled" : ""}>Delivered</button>`;
    }).join(" ");
}

function getOrderStatus(order) {
    return String(order.orderStatus ?? order.status ?? "PENDING").trim().toUpperCase();
}

function createOrderRow(order) {
    const currency = normalizeCurrencyCode(order.currency ?? "BRL");
    const items = order.itens ?? order.items ?? [];
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${order.orderId ?? "-"}</td>
        <td>${order.customerId ?? "-"}</td>
        <td>${formatItems(items)}</td>
        <td>${ITEM_STATUS}</td>
        <td>${formatCurrency(order.total ?? 0, currency)}</td>
        <td>${currency}</td>
        <td>${formatDeliveryActions(items, order.orderId)}</td>
    `;

    return row;
}

function renderOrdersInTransit(orders) {
    const transitOrders = Array.isArray(orders) ? orders : [];

    tableBody.innerHTML = transitOrders.length > 0
        ? ""
        : '<tr><td colspan="7">No orders in transit</td></tr>';

    transitOrders.forEach((order) => tableBody.appendChild(createOrderRow(order)));

    if (totalTransitOrdersElement) {
        totalTransitOrdersElement.innerHTML = `<p>Orders in transit: ${transitOrders.length}</p>`;
    }
}

async function deliverOrder(button) {
    const orderId = decodeURIComponent(button.dataset.orderId ?? "");
    const reservationId = decodeURIComponent(button.dataset.reservationId ?? "");

    if (!orderId || !reservationId || orderId === "-" || reservationId === "-") {
        alert("Order or reservation identifier not found.");
        return;
    }

    const token = localStorage.getItem("token");
    button.disabled = true;
    button.textContent = "Sending...";

    try {
        const response = await fetch(`http://localhost:8080/adm/orders/${encodeURIComponent(orderId)}/delivery/${encodeURIComponent(reservationId)}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json"
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Error ${response.status}: ${errorBody || "Unable to deliver order"}`);
        }

        await loadOrdersInTransit();
    } catch (error) {
        console.error("Error delivering order:", error);
        alert("Unable to deliver order.");
        button.disabled = false;
        button.textContent = "Delivered";
    }
}

async function loadOrdersInTransit() {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Authentication token not found. Please log in again.");
        window.location.href = "login.html";
        return;
    }

    try {
        const params = new URLSearchParams({
            status: ITEM_STATUS,
            page: "0",
            size: "100"
        });
        const response = await fetch(`http://localhost:8080/adm/orders/itens/delivery?${params}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        const orders = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
        renderOrdersInTransit(orders);
    } catch (error) {
        console.error("Error loading orders in transit:", error);
        tableBody.innerHTML = '<tr><td colspan="7">Error loading orders</td></tr>';
        if (totalTransitOrdersElement) {
            totalTransitOrdersElement.innerHTML = "<p>Orders in transit: 0</p>";
        }
    }
}

window.addEventListener("DOMContentLoaded", loadOrdersInTransit);

tableBody?.addEventListener("click", (event) => {
    const button = event.target.closest(".delivered-button");
    if (button) {
        deliverOrder(button);
    }
});