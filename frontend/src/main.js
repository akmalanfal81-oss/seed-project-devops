const API_BASE = '/api';
const HEALTH_URL = '/healthz/ready';

const $ = (sel) => document.querySelector(sel);

async function checkHealth() {
    const out = $('#health-result');
    out.textContent = 'Mengecek...';
    try {
        const res = await fetch(HEALTH_URL);
        const body = await res.json();
        out.textContent = `HTTP ${res.status}\n${JSON.stringify(body, null, 2)}`;
    } catch (err) {
        out.textContent = `Gagal: ${err.message}`;
    }
}

async function submitTransaction(event) {
    event.preventDefault();
    const form = event.target;
    const out = $('#submit-result');
    const formData = new FormData(form);

    const payload = {
        amount: Number(formData.get('amount')),
        description: formData.get('description'),
    };

    out.textContent = 'Mengirim...';
    try {
        const res = await fetch(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const body = await res.json();
        out.textContent = `HTTP ${res.status}\n${JSON.stringify(body, null, 2)}`;
        form.reset();
        setTimeout(loadTransactions, 1500);
    } catch (err) {
        out.textContent = `Gagal: ${err.message}`;
    }
}

async function loadTransactions() {
    const tbody = $('#transaction-rows');
    tbody.innerHTML = '<tr><td colspan="5">Memuat...</td></tr>';
    try {
        const res = await fetch(`${API_BASE}/transactions`);
        const body = await res.json();
        if (!body.data || body.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">Belum ada data.</td></tr>';
            return;
        }
        tbody.innerHTML = body.data
            .map(
                (t) => `
        <tr>
          <td>${t.id}</td>
          <td>${Number(t.amount).toLocaleString('id-ID')}</td>
          <td>${escapeHtml(t.description)}</td>
          <td><span class="badge ${t.status}">${t.status}</span></td>
          <td>${new Date(t.created_at).toLocaleString('id-ID')}</td>
        </tr>`
            )
            .join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5">Gagal: ${err.message}</td></tr>`;
    }
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (s) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[s]));
}

$('#btn-health').addEventListener('click', checkHealth);
$('#btn-refresh').addEventListener('click', loadTransactions);
$('#transaction-form').addEventListener('submit', submitTransaction);

loadTransactions();