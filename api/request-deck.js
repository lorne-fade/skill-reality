// Vercel serverless function (Node.js runtime) — email-gated investor deck.
//
// Zero dependencies: uses the global `fetch` / `AbortSignal` in the Vercel Node
// runtime. Lives at /api/request-deck.js so Vercel serves it as a function
// alongside the static site — no framework, no build step.
//
// Required env vars (Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY  – from resend.com (verify skillreality.com as sending domain)
//   DECK_URL        – unguessable Vercel Blob URL of the PDF. Server-side only —
//                     never sent to the client or exposed in any response.
//   FROM_EMAIL      – e.g. "Skill Reality <hello@skillreality.com>"
//   HUBSPOT_TOKEN   – optional: private-app token with crm.objects.contacts.write

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Naive in-memory rate limit. Fine for a landing page; resets on cold start and
// is per-instance, so it's a speed bump against bursts, not a hard guarantee.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.ts > 60000) {
    hits.set(ip, { count: 1, ts: now });
    return false;
  }
  rec.count += 1;
  return rec.count > 5; // max 5 requests/min per IP
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Vercel auto-parses JSON bodies, but be defensive about raw strings / missing.
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = null;
    }
  }
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Invalid request" });
  }

  // Honeypot: real users never fill the hidden "website" field. Pretend success.
  if (body.website) return res.status(200).json({ ok: true });

  const email = String(body.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email." });
  }

  const fwd = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests. Try again in a minute." });
  }

  const deckUrl = process.env.DECK_URL;
  const from = process.env.FROM_EMAIL || "Skill Reality <hello@skillreality.com>";
  if (!deckUrl || !process.env.RESEND_API_KEY) {
    console.error("request-deck: missing DECK_URL or RESEND_API_KEY env var");
    return res.status(500).json({ error: "Server not configured. Please try again later." });
  }

  // 1) Send the deck via Resend — a LINK, never an attachment. Better
  //    deliverability, and the PDF can be swapped without touching code.
  let sendRes;
  try {
    sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: "Skill Reality — Investor Deck",
        html: `
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;color:#0d1218">
          <h2 style="margin:24px 0 6px;font-size:22px;letter-spacing:-0.5px">Skill Reality</h2>
          <p style="font-size:15px;line-height:1.6;color:#333">Thanks for your interest. Here's the investor deck:</p>
          <p style="margin:26px 0">
            <a href="${deckUrl}"
               style="background:#1B74BC;color:#ffffff;padding:13px 26px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:700;font-size:15px">
              Download the deck (PDF)
            </a>
          </p>
          <p style="font-size:15px;line-height:1.6;color:#333">If you'd like a walkthrough, just reply to this email — it goes straight to the founders.</p>
          <p style="color:#8a94a6;font-size:12.5px;margin-top:32px">Skill Reality · skillreality.com · Launching 2027</p>
        </div>`,
      }),
    });
  } catch (e) {
    console.error("request-deck: Resend request failed:", e);
    return res.status(502).json({ error: "Couldn't send the email. Try again." });
  }

  if (!sendRes.ok) {
    console.error("request-deck: Resend error:", await sendRes.text().catch(() => ""));
    return res.status(502).json({ error: "Couldn't send the email. Try again." });
  }

  // 2) Log the lead to HubSpot — best-effort. We await (a fire-and-forget call
  //    can be dropped when the serverless function freezes) but wrap in
  //    try/catch and a short timeout so it can never fail or stall the user.
  if (process.env.HUBSPOT_TOKEN) {
    try {
      await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            email,
            ...(body.name ? { firstname: String(body.name) } : {}),
            ...(body.company ? { company: String(body.company) } : {}),
            lifecyclestage: "lead",
            hs_lead_status: "NEW",
          },
        }),
        signal: AbortSignal.timeout(4000),
      });
    } catch (e) {
      console.error("request-deck: HubSpot log failed (non-blocking):", e);
    }
  }

  return res.status(200).json({ ok: true });
}
