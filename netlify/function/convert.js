export default async (req, context) => {
  try {
    const url = new URL(req.url);

    const amount = Number(url.searchParams.get("amount"));
    const from = (url.searchParams.get("from") || "").toUpperCase();
    const to = (url.searchParams.get("to") || "").toUpperCase();

    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!from || !to) {
      return Response.json({ error: "Missing from/to currency" }, { status: 400 });
    }

    const API_KEY = process.env.EXCHANGE_API_KEY;
    if (!API_KEY) {
      return Response.json(
        { error: "Server missing EXCHANGE_API_KEY env var" },
        { status: 500 }
      );
    }

    // ---- Provider call (example pattern) ----
    // Replace this URL with your provider’s endpoint.
    // Example for ExchangeRate-API style:
    // const providerUrl = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${encodeURIComponent(from)}`;

    const providerUrl = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${encodeURIComponent(from)}`;

    const resp = await fetch(providerUrl, {
      headers: { "Accept": "application/json" },
    });

    const data = await resp.json().catch(() => null);

    if (!resp.ok) {
      return Response.json(
        { error: "Provider request failed", status: resp.status, data },
        { status: 502 }
      );
    }

    // ExchangeRate-API returns rates in `conversion_rates`
    const rates = data?.conversion_rates;
    const rate = rates?.[to];

    if (typeof rate !== "number") {
      return Response.json(
        { error: "Rate not found for target currency", data },
        { status: 502 }
      );
    }

    const result = amount * rate;

    return Response.json({
      ok: true,
      query: { amount, from, to },
      rate,
      result,
      // optional timestamp fields:
      time_last_update_utc: data?.time_last_update_utc || null,
    });
  } catch (err) {
    return Response.json(
      { error: "Unexpected server error", message: String(err?.message || err) },
      { status: 500 }
    );
  }
};