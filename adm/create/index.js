document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // 1. Recupere o token
        const token = localStorage.getItem("token"); 
        
        // 2. Se não houver token, redireciona imediatamente para login.html
        if (!token) {
            alert("Sua sessão expirou. Por favor, faça login novamente.");
            window.location.href = "login.html";
            return;
        }

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !password) {
            alert("Please fill in all fields.");
            return;
        }

        const admData = { email, password };

        try {
            const response = await fetch("http://localhost:8080/adm/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(admData)
            });

            // 3. Se o token for inválido/expirado (401/403), desloga e redireciona
            if (response.status === 401 || response.status === 403) {
                alert("Sessão inválida ou sem permissão. Faça login novamente.");
                localStorage.removeItem("token");
                window.location.href = "login.html";
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Error creating administrator.");
            }

            let result = null;
            const text = await response.text();
            if (text) {
                result = JSON.parse(text);
                console.log("Adm created:", result);
            }

            alert("Administrator created successfully!");
            form.reset();
            window.location.href = "index.html";
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to create administrator. Please try again.");
        }
    });
});