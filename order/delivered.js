const tableBody = document.getElementById("delivered-orders-body");
const totalDeliveredOrdersElement = document.getElementById("total-delivered-orders");
const ITEM_STATUS = "DELIVERED";

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

function createOrderRow(order) {
	const currency = normalizeCurrencyCode(order.currency ?? "BRL");
	const items = order.itens ?? order.items ?? [];
	const row = document.createElement("tr");

	row.innerHTML = `
		<td>${escapeHtml(order.orderId)}</td>
		<td>${escapeHtml(order.customerId)}</td>
		<td>${formatItems(items)}</td>
		<td>${ITEM_STATUS}</td>
		<td>${formatCurrency(order.total ?? 0, currency)}</td>
		<td>${currency}</td>
	`;

	return row;
}

function renderDeliveredOrders(orders) {
	const deliveredOrders = Array.isArray(orders) ? orders : [];

	tableBody.innerHTML = deliveredOrders.length > 0
		? ""
		: '<tr><td colspan="6">No orders delivered</td></tr>';

	deliveredOrders.forEach((order) => tableBody.appendChild(createOrderRow(order)));

	if (totalDeliveredOrdersElement) {
		totalDeliveredOrdersElement.innerHTML = `<p>Orders delivered: ${deliveredOrders.length}</p>`;
	}
}

async function loadDeliveredOrders() {
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
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json"
			}
		});

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(`Error ${response.status}: ${errorBody || "Unable to fetch delivered orders"}`);
		}

		const data = await response.json();
		const orders = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
		renderDeliveredOrders(orders);
	} catch (error) {
		console.error("Error loading delivered orders:", error);
		tableBody.innerHTML = '<tr><td colspan="6">Error loading orders</td></tr>';
		if (totalDeliveredOrdersElement) {
			totalDeliveredOrdersElement.innerHTML = "<p>Orders delivered: 0</p>";
		}
	}
}

window.addEventListener("DOMContentLoaded", loadDeliveredOrders);
