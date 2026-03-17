// Professional currency conversion logic
// Uses the free exchangerate.host API (no API key required)
const convertBtn = document.getElementById('convertBtn');
const swapBtn = document.getElementById('swapBtn');
const amountInput = document.getElementById('amount');
const fromSelect = document.getElementById('fromCurrency');
const toSelect = document.getElementById('toCurrency');
const statusEl = document.getElementById('status');
const resultCard = document.getElementById('resultCard');
const resultText = document.getElementById('resultText');
const rateText = document.getElementById('rateText');
const dateText = document.getElementById('dateText');
const historyEl = document.getElementById('history');

function setStatus(text, isError = false) {
    statusEl.textContent = text;
    statusEl.className = isError ? 'status status-error' : 'status';
}

function toggleLoading(isLoading) {
    if (isLoading) {
        setStatus('Loading…');
        convertBtn.disabled = true;
        swapBtn.disabled = true;
    } else {
        setStatus('');
        convertBtn.disabled = false;
        swapBtn.disabled = false;
    }
}

function formatNumber(value, currency) {
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
    } catch (e) {
        return Number(value).toFixed(2) + ' ' + currency;
    }
}

async function convertCurrency() {
    const amount = parseFloat(amountInput.value);
    const from = fromSelect.value;
    const to = toSelect.value;

    resultCard.hidden = true;

    if (!amount || amount <= 0 || Number.isNaN(amount)) {
        setStatus('Please enter a valid amount.', true);
        return;
    }

    if (from === to) {
        // simple same-currency handling
        resultText.textContent = `${formatNumber(amount, from)} = ${formatNumber(amount, to)}`;
        rateText.textContent = `Rate: 1 ${from} = 1 ${to}`;
        dateText.textContent = new Date().toLocaleString();
        resultCard.hidden = false;
        saveHistory({ amount, from, to, rate: 1, converted: amount, date: new Date().toISOString() });
        return;
    }

    toggleLoading(true);

    try {
        // exchangerate.host provides a simple convert endpoint
        const url = `https://api.exchangerate.host/convert?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Network response was not ok');

        const data = await resp.json();
        if (!data || data.success === false) throw new Error('Conversion failed');

        const converted = data.result;
        const rate = data.info?.rate ?? (converted / amount);
        const date = data.date || new Date().toISOString();

        resultText.textContent = `${formatNumber(amount, from)} = ${formatNumber(converted, to)}`;
        rateText.textContent = `Rate: 1 ${from} = ${rate.toFixed(6)} ${to}`;
        dateText.textContent = `As of ${new Date(date).toLocaleString()}`;
        resultCard.hidden = false;

        saveHistory({ amount, from, to, rate, converted, date });
        renderHistory();
    } catch (err) {
        console.error(err);
        setStatus('Conversion failed. Check your connection and try again.', true);
    } finally {
        toggleLoading(false);
    }
}

function swapCurrencies() {
    const a = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = a;
}

// Simple localStorage-backed recent conversions (max 5)
function loadHistory() {
    try {
        const raw = localStorage.getItem('conversion_history');
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveHistory(entry) {
    const list = loadHistory();
    list.unshift(entry);
    while (list.length > 5) list.pop();
    localStorage.setItem('conversion_history', JSON.stringify(list));
}

function renderHistory() {
    const list = loadHistory();
    if (!list.length) {
        historyEl.textContent = '';
        return;
    }
    historyEl.innerHTML = '<h3>Recent conversions</h3>' +
        '<ul>' + list.map(i => `
            <li>
                ${new Date(i.date).toLocaleString()}: ${i.amount} ${i.from} → ${i.converted ? i.converted.toFixed(2) : ''} ${i.to}
            </li>`).join('') + '</ul>';
}

// Attach event listeners
convertBtn?.addEventListener('click', convertCurrency);
swapBtn?.addEventListener('click', () => { swapCurrencies(); amountInput.focus(); });
amountInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') convertCurrency(); });

// Initial render
renderHistory();