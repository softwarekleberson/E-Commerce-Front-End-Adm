document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const data = {
            productId: document.getElementById("productId").value.trim(),
            justification: document.getElementById("justification").value.trim(),
            category: document.getElementById("category").value
        };

        // 🔑 Recupera o token JWT armazenado
        const token = localStorage.getItem("token");

        if (!token) {
            alert("Authentication token not found. Please log in again.");
            window.location.href = "login.html";
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/adm/product/activate", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` // ✅ Token incluído
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

            // Caso o backend retorne 204 No Content
            if (response.status === 204) {
                alert("Product successfully activated!");
                window.location.href = "/index.html"; // Redireciona para a página de produtos
                form.reset();
                return;
            }

            // Caso venha resposta JSON
            const result = await response.json();
            alert(`Product successfully activated!\n\nProduct ID: ${result.productId}`);
            form.reset();
            window.location.href = "/index.html";
        } catch (error) {
            alert(`Error: ${error.message}`);
            console.error("Error details:", error);
        }
    });
});
