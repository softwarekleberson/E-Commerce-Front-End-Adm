const ordersSections = document.getElementById("orders-sections");
const totalOrdersElement = document.getElementById("total-pedidos");
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

function formatItems(items, orderId) {
	if (!Array.isArray(items) || items.length === 0) {
		return "No items";
	}

	return items.map((item) => {
		const productId = item?.productId ?? item?.product?.id ?? "-";
		const quantity = item?.quantity ?? item?.qty ?? item?.amount ?? 0;
		const reservationId = item?.reservationId ?? item?.stockOutId ?? item?.reservation?.id ?? "-";
		const encodedOrderId = encodeURIComponent(orderId ?? "-");
		const encodedReservationId = encodeURIComponent(reservationId);

		return `<div>
			<strong>Product:</strong> ${escapeHtml(productId)} |
			<strong>Qty:</strong> ${escapeHtml(quantity)} |
			<strong>Reservation:</strong> ${escapeHtml(reservationId)}
			<button type="button" class="transit-item-button" data-order-id="${encodedOrderId}" data-reservation-id="${encodedReservationId}">Send to transit</button>
		</div>`;
	}).join("");
}

function createOrdersTable(orders) {
	const section = document.createElement("section");
	const title = document.createElement("h2");
	const table = document.createElement("table");

	title.textContent = `${ITEM_STATUS} (${orders.length})`;
	table.innerHTML = `
		<thead>
			<tr>
				<th>Order Code</th>
				<th>Customer ID</th>
				<th>Items</th>
				<th>Status</th>
				<th>Total</th>
				<th>Currency</th>
				<th>Date</th>
			</tr>
		</thead>
		<tbody></tbody>
	`;

	const tableBody = table.querySelector("tbody");
	orders.forEach((order) => {
		const currency = normalizeCurrencyCode(order.currency);
		const row = document.createElement("tr");
		row.innerHTML = `
			<td>${escapeHtml(order.orderId)}</td>
			<td>${escapeHtml(order.customerId)}</td>
			<td>${formatItems(order.itens ?? order.items ?? [], order.orderId)}</td>
			<td>${ITEM_STATUS}</td>
			<td>${formatCurrency(order.total, currency)}</td>
			<td>${currency}</td>
			<td>${order.data ? escapeHtml(new Date(order.data).toLocaleString("pt-BR")) : "-"}</td>
		`;
		tableBody.appendChild(row);
	});

	section.append(title, table);
	return section;
}

async function transitItem(button) {
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
		const response = await fetch(`http://localhost:8080/adm/orders/${encodeURIComponent(orderId)}/transit/${encodeURIComponent(reservationId)}`, {
			method: "PUT",
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json"
			}
		});

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(`Error ${response.status}: ${errorBody || "Unable to move item to transit"}`);
		}

		await loadSeparationOrders();
	} catch (error) {
		console.error("Error moving item to transit:", error);
		alert("Unable to move item to transit.");
		button.disabled = false;
		button.textContent = "Send to transit";
	}
}

function renderOrders(orders) {
	if (!ordersSections) {
		return;
	}

	ordersSections.innerHTML = "";

	if (!Array.isArray(orders) || orders.length === 0) {
		ordersSections.innerHTML = "<p>No orders awaiting separation</p>";
	} else {
		ordersSections.appendChild(createOrdersTable(orders));
	}

	if (totalOrdersElement) {
		totalOrdersElement.innerHTML = `<p>Total Separation: ${orders.length}</p>`;
	}
}

async function loadSeparationOrders() {
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
			throw new Error(`Error ${response.status}: ${errorBody || "Unable to fetch separation transport orders"}`);
		}

		const data = await response.json();
		const orders = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
		renderOrders(orders);
	} catch (error) {
		console.error("Error loading separation transport orders:", error);
		if (ordersSections) {
			ordersSections.innerHTML = "<p>Error loading transport orders</p>";
		}
		if (totalOrdersElement) {
			totalOrdersElement.innerHTML = "<p>Total Transport: 0</p>";
		}
	}
}

window.addEventListener("DOMContentLoaded", loadSeparationOrders);

ordersSections?.addEventListener("click", (event) => {
	const button = event.target.closest(".transit-item-button");
	if (button) {
		transitItem(button);
	}
});
