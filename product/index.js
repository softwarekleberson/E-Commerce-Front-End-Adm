document.getElementById('addMedia').addEventListener('click', () => {
    const container = document.getElementById('mediaContainer');
    const index = container.children.length;
    const div = document.createElement('div');
    div.className = 'media-group';
    div.innerHTML = `
      <label>Media URL</label>
      <input type="url" name="midias[${index}].url">

      <label>Media Description</label>
      <input type="text" name="midias[${index}].description">
  `;
    container.appendChild(div);
});

function formatApiError(errorBody, status) {
    if (!errorBody) return `Error registering the product (HTTP ${status}).`;
    if (typeof errorBody === 'string') return errorBody;

    if (Array.isArray(errorBody)) {
        return errorBody.map(error => formatApiError(error, status)).join('\n');
    }

    if (errorBody.errors && typeof errorBody.errors === 'object') {
        const fieldErrors = Object.entries(errorBody.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join('\n');
        if (fieldErrors) return fieldErrors;
    }

    return errorBody.message || errorBody.error || `Error registering the product (HTTP ${status}).`;
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {};

    formData.forEach((value, key) => {
        const match = key.match(/midias\[(\d+)\]\.(\w+)/);
        if (match) {
            const index = parseInt(match[1], 10);
            const field = match[2];
            data.midias = data.midias || [];
            data.midias[index] = data.midias[index] || {};
            data.midias[index][field] = value;
        } else {
            data[key] = value;
        }
    });

    if (data.pricing) data.pricing = parseFloat(data.pricing);
    if (data.page) data.page = parseInt(data.page, 10);
    if (data.height) data.height = parseFloat(data.height);
    if (data.width) data.width = parseFloat(data.width);
    if (data.length) data.length = parseFloat(data.length);
    if (data.weight) data.weight = parseFloat(data.weight);
    if (data.publisherDate) data.publisherDate = new Date(data.publisherDate).toISOString();

    console.log("Data prepared for sending:", data);

    // 🔑 Recupera o token salvo no login
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Authentication token not found. Please log in again.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch("http://localhost:8080/adm/product", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // 👉 Token JWT no header
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const responseText = await response.text();
            let errorBody = responseText;

            try {
                errorBody = responseText ? JSON.parse(responseText) : null;
            } catch {
                // Keep the plain-text response when it is not JSON.
            }

            throw new Error(formatApiError(errorBody, response.status));
        }

        alert("Product successfully registered!");
        window.location.href = "/index.html";


        e.target.reset();
        document.getElementById('mediaContainer').innerHTML = `
      <div class="media-group">
        <label>Media URL</label>
        <input type="url" name="midias[0].url">

        <label>Media Description</label>
        <input type="text" name="midias[0].description">
      </div>
    `;
    } catch (error) {
        console.error("Error sending product:", error);
        alert(error.message || "Error registering the product.");
    }
});
