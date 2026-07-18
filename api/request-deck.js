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
//   REPLY_TO_EMAIL  – optional: where replies go (founders inbox). Falls back to FROM_EMAIL.
//   RESEND_AUDIENCE_ID – optional: Resend audience to log deck requesters into

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
  const replyTo = process.env.REPLY_TO_EMAIL || from;
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
        reply_to: replyTo,
        subject: "Skill Reality — Investor Deck",
        html: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;margin:0;padding:0">
          <tr><td align="center" style="padding:32px 16px">
            <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif">
              <!-- wordmark + thin blue rule (light-only; dark bg breaks Gmail dark mode) -->
              <tr><td style="padding:0 8px 12px">
                <div style="font-size:17px;font-weight:700;letter-spacing:3px;color:#0d1218">SKILL REALITY</div>
              </td></tr>
              <tr><td style="padding:0 8px"><div style="height:2px;line-height:2px;font-size:0;background:#5ba8e6">&nbsp;</div></td></tr>
              <!-- intro -->
              <tr><td style="padding:26px 8px 0;font-size:16px;line-height:1.6;color:#0d1218">Thanks for your interest — here's the investor deck.</td></tr>
              <!-- proof line -->
              <tr><td style="padding:12px 8px 0;font-size:14px;line-height:1.6;color:#6b7280">A 10-year company on a brand-new platform. 100+ deployments for VR Vision clients including Toyota, Siemens, and Coca-Cola.</td></tr>
              <!-- deck cover, full width, rounded, linked to the deck -->
              <tr><td style="padding:26px 8px 0">
                <a href="${deckUrl}" style="display:block;text-decoration:none">
                  <img src="https://skillreality.com/deck-cover.jpg" alt="Skill Reality Investor Deck" width="544" style="display:block;width:100%;height:auto;border:1px solid #e6e9ee;border-radius:12px" />
                </a>
              </td></tr>
              <!-- download button -->
              <tr><td style="padding:24px 8px 0">
                <a href="${deckUrl}" style="background:#1B74BC;color:#ffffff;padding:13px 26px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:700;font-size:15px">Download the deck (PDF)</a>
              </td></tr>
              <!-- sign-off -->
              <tr><td style="padding:32px 8px 0;font-size:15px;line-height:1.6;color:#333">If you'd like a walkthrough, just reply — this goes straight to my inbox.</td></tr>
              <tr><td style="padding:18px 8px 0;font-size:14px;line-height:1.7;color:#0d1218">
                <strong>Lorne Fade</strong><br />
                Co-founder, Skill Reality <span style="color:#8a94a6">(a VR Vision company)</span><br />
                <a href="https://www.linkedin.com/in/lornefade" style="color:#1B74BC;text-decoration:none">linkedin.com/in/lornefade</a>
              </td></tr>
              <!-- footer -->
              <tr><td style="padding:28px 8px 0"><div style="height:1px;line-height:1px;font-size:0;background:#e6e9ee">&nbsp;</div></td></tr>
              <tr><td style="padding:16px 8px 0;font-size:12.5px;line-height:1.5;color:#8a94a6">Skill Reality · skillreality.com · Raising our seed round · Pilots 2026 · Commercial launch 2027</td></tr>
            </table>
          </td></tr>
        </table>`,
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

  // 2) Log the requester to a Resend audience — best-effort. We await (a
  //    fire-and-forget call can be dropped when the serverless function
  //    freezes) but wrap in try/catch and a short timeout so it can never
  //    fail or stall the user response.
  if (process.env.RESEND_AUDIENCE_ID) {
    try {
      await fetch(
        `https://api.resend.com/audiences/${process.env.RESEND_AUDIENCE_ID}/contacts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, unsubscribed: false }),
          signal: AbortSignal.timeout(4000),
        }
      );
    } catch (e) {
      console.error("request-deck: Resend audience log failed (non-blocking):", e);
    }
  }

  return res.status(200).json({ ok: true });
}
