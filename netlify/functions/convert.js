// netlify/functions/convert.js
const REQUEST_TIMEOUT_MS = 5000;

exports.handler = async (event, context) => {
  try {
    const params = event.queryStringParameters || {};
    const amount = Number(params.amount);
    const from = (params.from || '').toUpperCase();
    const to = (params.to || '').toUpperCase();

    // --- Validate input ---
    if (!Number.isFinite(amount) || amount <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid amount' }) };
    }

    if (!from || !to) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing from/to currency' }) };
    }

    // --- Get API key from environment ---
    const API_KEY = process.env.EXCHANGE_API_KEY;
    if (!API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing API key' }) };
    }

    // --- Call ExchangeRate-API with timeout ---
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const providerUrl = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${from}`;
    const resp = await fetch(providerUrl, { signal: controller.signal });
    clearTimeout(timeout);

    const data = await resp.json();

    if (!resp.ok || !data.conversion_rates) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Provider request failed' }) };
    }

    const rate = data.conversion_rates[to];
    if (typeof rate !== 'number') {
      return { statusCode: 502, body: JSON.stringify({ error: `Rate not found for ${to}` }) };
    }

    const result = amount * rate;

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        query: { amount, from, to },
        rate,
        result,
        time_last_update_utc: data.time_last_update_utc || null,
      }),
    };
  } catch (err) {
    const message = err.name === 'AbortError' ? 'Provider request timed out' : err.message;
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error', message }) };
  }
};