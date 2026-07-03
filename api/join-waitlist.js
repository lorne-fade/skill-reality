// Vercel serverless function (Node.js runtime) — design-partner waitlist.
//
// Zero dependencies: uses the global `fetch` in the Vercel Node runtime. Lives
// at /api/join-waitlist.js so Vercel serves it as a function alongside the
// static site — no framework, no build step.
//
// On submit it emails the founders inbox so no lead is missed. `reply_to` is set
// to the submitter, so hitting reply goes straight back to the enterprise.
//
// Required env vars (Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY  – from resend.com (verify skillreality.com as sending domain)
//   FROM_EMAIL      – e.g. "Skill Reality <hello@skillreality.com>"
//   NOTIFY_EMAIL    – optional: where signups are sent. Falls back to
//                     REPLY_TO_EMAIL, then FROM_EMAIL.
//   REPLY_TO_EMAIL  – optional: reused as the notify target if NOTIFY_EMAIL unset.

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

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
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

  const from = process.env.FROM_EMAIL || "Skill Reality <hello@skillreality.com>";
  const notifyTo =
    process.env.NOTIFY_EMAIL || process.env.REPLY_TO_EMAIL || process.env.FROM_EMAIL || "hello@skillreality.com";
  if (!process.env.RESEND_API_KEY) {
    console.error("join-waitlist: missing RESEND_API_KEY env var");
    return res.status(500).json({ error: "Server not configured. Please try again later." });
  }

  const company = body.company ? String(body.company).slice(0, 200) : "";
  const name = body.name ? String(body.name).slice(0, 200) : "";

  // Notify the founders. reply_to = the submitter, so replying reaches the lead.
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
        to: notifyTo,
        reply_to: email,
        subject: "New design-partner signup — Skill Reality",
        html: `
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;color:#0d1218">
          <h2 style="margin:24px 0 12px;font-size:20px;letter-spacing:-0.4px">New design-partner signup</h2>
          <table style="font-size:15px;line-height:1.7;color:#333;border-collapse:collapse">
            <tr><td style="color:#8a94a6;padding-right:16px">Email</td><td><a href="mailto:${esc(email)}" style="color:#1B74BC">${esc(email)}</a></td></tr>
            ${company ? `<tr><td style="color:#8a94a6;padding-right:16px">Company</td><td>${esc(company)}</td></tr>` : ""}
            ${name ? `<tr><td style="color:#8a94a6;padding-right:16px">Name</td><td>${esc(name)}</td></tr>` : ""}
          </table>
          <p style="font-size:14px;color:#667;margin-top:20px">Reply to this email to reach them directly.</p>
          <p style="color:#8a94a6;font-size:12.5px;margin-top:28px">Skill Reality · design-partner waitlist · skillreality.com</p>
        </div>`,
      }),
    });
  } catch (e) {
    console.error("join-waitlist: Resend request failed:", e);
    return res.status(502).json({ error: "Couldn't join the waitlist. Try again." });
  }

  if (!sendRes.ok) {
    console.error("join-waitlist: Resend error:", await sendRes.text().catch(() => ""));
    return res.status(502).json({ error: "Couldn't join the waitlist. Try again." });
  }

  return res.status(200).json({ ok: true });
}
