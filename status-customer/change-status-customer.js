document.getElementById("form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const form = event.target;
    const customerId = document.getElementById("customerId").value.trim();
    const token = localStorage.getItem("token"); // 🔑 recupera o token

    if (!token) {
        alert("Authentication token not found. Please log in again.");
        window.location.href = "/login.html";
        return;
    }

    try {
        const response = await fetch("http://localhost:8080/adm/change-status", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // 🛡️ token JWT
            },
            body: JSON.stringify({ customerId })
        });

        if (response.ok) {
            alert("Customer status changed successfully!");
            form.reset();
        } else {
            // 🔹 tenta ler a mensagem de erro do backend
            let errorMsg = "Error changing status.";
            try {
                const errorData = await response.json();
                if (errorData.message) errorMsg = errorData.message;
            } catch {
                const text = await response.text();
                if (text) errorMsg = text;
            }
            alert(errorMsg);
        }

    } catch (error) {
        console.error("Request error:", error);
        alert("Server connection error.");
    }
});
