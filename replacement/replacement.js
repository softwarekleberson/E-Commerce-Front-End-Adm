const API_URL = 'http://localhost:8080/adm/replacement';

// Função para obter o token salvo no navegador
function getAuthHeader() {
    const token = localStorage.getItem('token'); // ou sessionStorage
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

document.addEventListener('DOMContentLoaded', () => {
    fetchReplacements();
});

async function fetchReplacements(page = 0, size = 10) {
    try {
        const response = await fetch(`${API_URL}?page=${page}&size=${size}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            }
        });

        if (response.status === 401) {
            alert('Sessão expirada. Faça login novamente.');
            window.location.href = '/login.html';
            return;
        }

        if (!response.ok) throw new Error('Falha ao carregar as solicitações.');

        const pageData = await response.json();
        const replacements = pageData.content || pageData.data || pageData;

        renderTable(replacements);
    } catch (error) {
        console.error('Erro ao buscar substituições:', error);
    }
}

function renderTable(replacements) {
    const tbody = document.getElementById('replacement-tbody');
    tbody.innerHTML = '';

    if (!replacements || replacements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Nenhuma solicitação encontrada.</td></tr>';
        return;
    }

    replacements.forEach(item => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${item.id ?? ''}</td>
            <td>${item.orderId ?? ''}</td>
            <td>${item.reservationId ?? ''}</td>
            <td>${item.reason ?? ''}</td>
            <td>${item.explain ?? ''}</td>
            <td>${item.quantity ?? ''}</td>
            <td><span class="status-badge status-${item.status}">${item.status ?? ''}</span></td>
            <td>
                <button onclick="acceptReplacement('${item.reservationId}')" class="btn-accept">Accept</button>
                <button onclick="negateReplacement('${item.reservationId}')" class="btn-negate">Reject</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

async function acceptReplacement(reservationId) {
    if (!confirm(`Deseja aceitar a troca da reserva ${reservationId}?`)) return;

    try {
        const response = await fetch(`${API_URL}/${reservationId}/accept`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            }
        });

        if (response.status === 401) {
            alert('Não autorizado. Faça login.');
            window.location.href = '/login.html';
            return;
        }

        if (response.ok) {
            alert('Troca aceita com sucesso!');
            fetchReplacements();
        } else {
            alert('Erro ao aceitar troca.');
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function negateReplacement(reservationId) {
    if (!confirm(`Deseja rejeitar a troca da reserva ${reservationId}?`)) return;

    try {
        const response = await fetch(`${API_URL}/${reservationId}/negate`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            }
        });

        if (response.status === 401) {
            alert('Não autorizado. Faça login.');
            window.location.href = 'login.html';
            return;
        }

        if (response.ok) {
            alert('Troca rejeitada com sucesso!');
            fetchReplacements();
        } else {
            alert('Erro ao rejeitar troca.');
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}