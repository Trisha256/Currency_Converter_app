// Currency converter logic (Netlify Function proxy)
// Frontend calls: /.netlify/functions/convert?from=USD&to=EUR&amount=10
// The Netlify Function calls the external rates provider using an API key stored on Netlify.

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
  if (!statusEl) return;
  statusEl.textContent = text || '';
  statusEl.className = isError ? 'status status-error' : 'status';
}

function toggleLoading(isLoading) {
  if (convertBtn) convertBtn.disabled = Boolean(isLoading);
  if (swapBtn) swapBtn.disabled = Boolean(isLoading);
  setStatus(isLoading ? 'Loading…' : '');
}

function formatNumber(value, currency) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch (e) {
    const n = Number(value);
    return `${Number.isFinite(n) ? n.toFixed(2) : value} ${currency}`;
  }
}

function parseAmount(raw) {
  const amount = Number.parseFloat(raw);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

// --- History (localStorage, max 5) ---
function loadHistory() {
  try {
    const raw = localStorage.getItem('conversion_history');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveHistory(entry) {
  try {
    const list = loadHistory();
    list.unshift(entry);
    while (list.length > 5) list.pop();
    localStorage.setItem('conversion_history', JSON.stringify(list));
  } catch (e) {
    // ignore storage errors
  }
}

function renderHistory() {
  if (!historyEl) return;

  const list = loadHistory();
  if (!Array.isArray(list) || list.length === 0) {
    historyEl.textContent = '';
    return;
  }

  historyEl.innerHTML =
    '<h3>Recent conversions</h3>' +
    '<ul>' +
    list
      .map((i) => {
        const when = i?.date ? new Date(i.date).toLocaleString() : '';
        const a = i?.amount ?? '';
        const f = i?.from ?? '';
        const c = typeof i?.converted === 'number' ? i.converted.toFixed(2) : i?.converted ?? '';
        const t = i?.to ?? '';
        return `<li>${when}: ${a} ${f} → ${c} ${t}</li>`;
      })
      .join('') +
    '</ul>';
}

// --- Core actions ---
function swapCurrencies() {
  if (!fromSelect || !toSelect) return;
  const a = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = a;
}

async function fetchConversion({ amount, from, to }) {
  // Call your Netlify Function (same-origin, avoids CORS)
  const url =
    `/.netlify/functions/convert` +
    `?from=${encodeURIComponent(from)}` +
    `&to=${encodeURIComponent(to)}` +
    `&amount=${encodeURIComponent(amount)}`;

  const resp = await fetch(url, { headers: { Accept: 'application/json' } });

  // Read JSON if possible; otherwise read text for a meaningful error.
  let data = null;
  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await resp.json().catch(() => null);
  } else {
    const text = await resp.text().catch(() => '');
    data = { error: text || `HTTP ${resp.status}` };
  }

  if (!resp.ok) {
    throw new Error(data?.error || `HTTP ${resp.status}`);
  }

  // Expected Netlify function response: { ok: true, rate: number, result: number, ... }
  if (!data || typeof data.result !== 'number' || typeof data.rate !== 'number') {
    throw new Error('Unexpected response from conversion service.');
  }

  return data;
}

async function convertCurrency() {
  const amount = parseAmount(amountInput?.value);
  const from = fromSelect?.value;
  const to = toSelect?.value;

  if (resultCard) resultCard.hidden = true;

  if (!amount) {
    setStatus('Please enter a valid amount.', true);
    return;
  }

  if (!from || !to) {
    setStatus('Please select both currencies.', true);
    return;
  }

  if (from === to) {
    const now = new Date();
    const converted = amount;
    const rate = 1;

    if (resultText) resultText.textContent = `${formatNumber(amount, from)} = ${formatNumber(converted, to)}`;
    if (rateText) rateText.textContent = `Rate: 1 ${from} = 1 ${to}`;
    if (dateText) dateText.textContent = `As of ${now.toLocaleString()}`;
    if (resultCard) resultCard.hidden = false;

    saveHistory({ amount, from, to, rate, converted, date: now.toISOString() });
    renderHistory();
    return;
  }

  toggleLoading(true);

  try {
    const data = await fetchConversion({ amount, from, to });

    const converted = data.result;
    const rate = data.rate;

    // Use any timestamp the function returns, otherwise current time.
    const date =
      data.time_last_update_utc
        ? new Date(data.time_last_update_utc)
        : data.date
          ? new Date(data.date)
          : new Date();

    if (resultText) resultText.textContent = `${formatNumber(amount, from)} = ${formatNumber(converted, to)}`;
    if (rateText) rateText.textContent = `Rate: 1 ${from} = ${rate.toFixed(6)} ${to}`;
    if (dateText) dateText.textContent = `As of ${date.toLocaleString()}`;
    if (resultCard) resultCard.hidden = false;

    saveHistory({ amount, from, to, rate, converted, date: date.toISOString() });
    renderHistory();
  } catch (err) {
    console.error(err);
    setStatus(`Conversion failed: ${err?.message || err}`, true);
  } finally {
    toggleLoading(false);
  }
}

// --- Event listeners ---
if (convertBtn) convertBtn.addEventListener('click', convertCurrency);
if (swapBtn) swapBtn.addEventListener('click', () => {
  swapCurrencies();
  amountInput?.focus();
});

if (amountInput) {
  amountInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') convertCurrency();
  });
}

// Initial render
renderHistory();