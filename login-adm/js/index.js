document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        const credentials = {
            email: email,
            password: password
        };

        try {
            const response = await fetch("http://localhost:8080/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(credentials)
            });

            if (!response.ok) {
                throw new Error("Login failed. Please check your credentials.");
            }

            const data = await response.json();

            localStorage.setItem("token", data.token);

            alert("Login successful!");
            window.location.href = "/index.html";
        } catch (error) {
            console.error("Error:", error);
            alert("Incorrect email or password.");
        }
    });
});
