const ordersSections = document.getElementById("orders-sections");
const totalOrdersElement = document.getElementById("total-pedidos");

let allOrders = [];

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

function formatCurrency(value, currency = "BRL") {
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

function formatItens(itens = [], currency = "BRL") {
    if (!Array.isArray(itens) || itens.length === 0) {
        return "No items";
    }

    return itens
        .map((item) => {
            const productId = item?.productId ?? item?.product?.id ?? "-";
            const quantity = item?.quantity ?? item?.qty ?? item?.amount ?? 0;
            const unitPrice = item?.price ?? item?.unitPrice ?? item?.value ?? 0;
            const subtotal = item?.subtotal ?? item?.total ?? 0;
            const reservationId = item?.reservationId ?? item?.stockOutId ?? item?.reservation?.id ?? "-";
            const itemCurrency = normalizeCurrencyCode(item?.currency ?? currency ?? "BRL");

            return `
                <div style="margin-bottom:8px; padding:6px 8px; border:1px solid #dfe3e8; border-radius:6px; background:#f9fafb; line-height:1.6;">
                    <strong>Product:</strong> ${productId}<br>
                    <strong>Qty:</strong> ${quantity}<br>
                    <strong>Price:</strong> ${formatCurrency(unitPrice, itemCurrency)}<br>
                    <strong>Subtotal:</strong> ${formatCurrency(subtotal, itemCurrency)}<br>
                    <strong>Reservation:</strong> ${reservationId}
                </div>
            `;
        })
        .join("");
}

function getStatusBadge(status) {
    const statusValue = String(status ?? "PENDING").trim().toUpperCase();
    const statusMap = {
        PAY: { label: "PAY", color: "#2ecc71" },
        CANCEL: { label: "CANCEL", color: "#e74c3c" },
        SHIP: { label: "SHIP", color: "#3498db" },
        PENDING: { label: "PENDING", color: "#f39c12" }
    };

    const safeStatus = statusMap[statusValue] ?? { label: statusValue || "PENDING", color: "#7f8c8d" };

    return `<span style="display:inline-block;padding:4px 8px;border-radius:999px;color:#fff;background:${safeStatus.color};font-weight:600;">${safeStatus.label}</span>`;
}

function createOrderRow(order) {
    const tr = document.createElement("tr");
    const normalizedCurrency = normalizeCurrencyCode(order.currency ?? "BRL");
    const itens = order.itens ?? order.items ?? [];
    const statusValue = order.orderStatus ?? order.status ?? "PENDING";

    tr.innerHTML = `
        <td>${order.orderId ?? "-"}</td>
        <td>${order.customerId ?? "-"}</td>
        <td>${formatItens(itens, normalizedCurrency)}</td>
        <td>${getStatusBadge(statusValue)}</td>
        <td>${formatCurrency(order.total ?? 0, normalizedCurrency)}</td>
        <td>${normalizedCurrency}</td>
    `;

    return tr;
}

function getOrderStatus(order) {
    return String(order.orderStatus ?? order.status ?? "PENDING").trim().toUpperCase() || "PENDING";
}

function createOrdersTable(status, orders) {
    const section = document.createElement("section");
    const title = document.createElement("h2");
    const table = document.createElement("table");

    title.textContent = `${status} (${orders.length})`;
    table.innerHTML = `
        <thead>
            <tr>
                <th>Order Code</th>
                <th>Customer ID</th>
                <th>Items</th>
                <th>Status</th>
                <th>Total</th>
                <th>Currency</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tableBody = table.querySelector("tbody");
    orders.forEach((order) => tableBody.appendChild(createOrderRow(order)));
    section.append(title, table);

    return section;
}

function renderOrders(orders) {
    if (!ordersSections) {
        return;
    }

    ordersSections.innerHTML = "";

    if (!Array.isArray(orders) || orders.length === 0) {
        ordersSections.innerHTML = "<p>No orders found</p>";
        if (totalOrdersElement) {
            totalOrdersElement.innerHTML = "<p>Total Orders: 0</p>";
        }
        return;
    }

    const groupedOrders = orders.reduce((groups, order) => {
        const status = getOrderStatus(order);
        (groups[status] ??= []).push(order);
        return groups;
    }, {});

    const statusOrder = ["PENDING", "PAY", "SHIP", "CANCEL"];
    const statuses = [
        ...statusOrder.filter((status) => groupedOrders[status]),
        ...Object.keys(groupedOrders).filter((status) => !statusOrder.includes(status))
    ];

    statuses.forEach((status) => {
        ordersSections.appendChild(createOrdersTable(status, groupedOrders[status]));
    });

    if (totalOrdersElement) {
        totalOrdersElement.innerHTML = `<p>Total Orders: ${orders.length}</p>`;
    }
}

async function loadOrders() {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Authentication token not found. Please log in again.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch("http://localhost:8080/adm/orders?page=0&size=10", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText || "Unable to fetch orders"}`);
        }

        const data = await response.json();
        const payload = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];

        allOrders = payload;
        renderOrders(allOrders);
    } catch (error) {
        console.error("Error loading orders:", error);

        if (ordersSections) {
            ordersSections.innerHTML = "<p>Error loading orders</p>";
        }

        if (totalOrdersElement) {
            totalOrdersElement.innerHTML = "<p>Total Orders: 0</p>";
        }
    }
}

window.addEventListener("DOMContentLoaded", loadOrders);
