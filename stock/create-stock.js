const form = document.getElementById('productForm');

form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const data = {
        productId: document.getElementById('productId').value.trim()
    };

    if (!data.productId) {
        alert("Please enter a valid product ID.");
        return;
    }

    // 🔑 Recupera o token do localStorage
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Authentication token not found. Please log in again.");
        window.location.href = "/login.html";
        return;
    }

    try {
        const response = await fetch("http://localhost:8080/adm/stock", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // 👉 Envia o token no header
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Error ${response.status}: Product not found.`);
        }

        // ✅ Sucesso
        alert("Inventory created successfully!");
        console.log("📦 Response from backend:", await response.text());
        window.location.href = "/index.html"; 
        form.reset();

    } catch (error) {
        console.error("❌ Backend error:", error);
        alert(error.message || " Error: Product not found or server unavailable.");
    }
});
