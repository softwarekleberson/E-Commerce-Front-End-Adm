document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const data = {
            productId: document.getElementById("productId").value.trim(),
            newPrice: parseFloat(document.getElementById("newPrice").value.trim())
        };

        // 🔑 Recupera o token JWT
        const token = localStorage.getItem("token");

        if (!token) {
            alert("Authentication token not found. Please log in again.");
            window.location.href = "login.html";
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/adm/product/selling/price", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` // ✅ token adicionado
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                let errorMessage = "An unexpected error occurred while processing the request.";

                try {
                    const error = await response.json();
                    errorMessage = error.message || errorMessage;
                } catch {
                    const text = await response.text();
                    errorMessage = text || errorMessage;
                }

                throw new Error(errorMessage);
            }

            if (response.status === 204) {
                alert("Product price successfully updated!");
                window.location.href = "/index.html";
                form.reset();
                return;
            }

            const result = await response.json();
            alert(`Product price successfully updated!\n\nProduct ID: ${result.productId}`);
            form.reset();
            window.location.href = "/index.html";
        } catch (error) {
            alert(`Error: ${error.message}`);
            console.error("Error details:", error);
        }
    });
});
