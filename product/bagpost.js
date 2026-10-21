const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

const form = document.getElementById('productForm');
const addMidiaBtn = document.getElementById('addMidia');
const midiasContainer = document.getElementById('midiasContainer');

// 🧩 Adiciona nova mídia dinamicamente
addMidiaBtn.addEventListener('click', () => {
    const index = midiasContainer.querySelectorAll('.midia-group').length;

    const div = document.createElement('div');
    div.classList.add('midia-group');
    div.innerHTML = `
      <label>Media URL (${index}):</label>
      <input type="url" name="midias[${index}].url" required>

      <label>Media Description (${index}):</label>
      <input type="text" name="midias[${index}].description" required>
  `;

    midiasContainer.appendChild(div);
});

// 🧠 Monta JSON e envia via POST
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
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

    console.log("📦 Data prepared for sending:", data);

    try {
        const response = await fetch('http://localhost:8080/adm/product', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // 👉 Envia o JWT
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        // ✅ Sucesso
        alert('Product successfully registered!');
        console.log('✅ Product successfully registered!');

        // 🔄 Reseta o formulário
        form.reset();
        window.location.href = "/index.html";

        // 🧹 Restaura apenas o primeiro campo de mídia
        midiasContainer.innerHTML = `
      <div class="midia-group">
          <label>Media URL (0):</label>
          <input type="url" name="midias[0].url" required>

          <label>Media Description (0):</label>
          <input type="text" name="midias[0].description" required>
      </div>
    `;
    } catch (error) {
        console.error('❌ Error sending product:', error);
        alert('Error registering product. Check console for details.');
    }
});
