# Deck gate — setup (15 min)

Email-gated investor deck for skillreality.com. This is a **static site**
(`index.html` + `support.js`) deployed on Vercel, so the backend is a single
zero-config Vercel serverless function at `api/request-deck.js` — no framework,
no build step, no dependencies.

## 1. Host the PDF (2 min)
```bash
npx vercel blob put assets/Skill_Reality_Investor_Pitch_Deck.pdf
```
Copy the returned URL → this becomes `DECK_URL`. It's unguessable — that's the
access control. The PDF is **not** committed to the repo (see `.gitignore`) and
never lives in a public path.

## 2. Resend (5 min)
1. Sign up at resend.com (free tier: 100 emails/day — plenty).
2. Add and verify `skillreality.com` as a sending domain (3 DNS records).
3. Create an API key → this becomes `RESEND_API_KEY`.

## 3. Resend audience — optional (2 min)
1. Resend → Audiences → create one (or use the default).
2. Copy its ID → this becomes `RESEND_AUDIENCE_ID`.

Every deck request is added to that audience (`unsubscribed: false`) using the
same `RESEND_API_KEY`. If `RESEND_AUDIENCE_ID` is unset, this step is silently
skipped — the user still gets the deck.

## 4. Env vars (Vercel → Project → Settings → Environment Variables)
```
RESEND_API_KEY     = re_xxxx
DECK_URL           = https://xxxx.public.blob.vercel-storage.com/Skill_Reality_....pdf
FROM_EMAIL         = Skill Reality <hello@skillreality.com>
REPLY_TO_EMAIL     = founders@skillreality.com   (optional; defaults to FROM_EMAIL)
RESEND_AUDIENCE_ID = aud_xxxx                     (optional)
```
`DECK_URL` is read server-side only — it is never sent to the browser or
returned in any API response.

## 5. What's already wired
- `api/request-deck.js` — the serverless function (validation, honeypot,
  5 req/min per-IP rate limit, Resend link-email with reply-to the founders
  inbox, best-effort add to a Resend audience).
- The **"For investors"** card in `index.html` posts to it and shows
  idle → sending → sent / error states inline.

Nothing else to drop in. Vercel serves any file under `/api` as a Node
serverless function automatically.

## 6. Deploy and test
Push, then submit your own email on the live site. See the manual test
checklist in the PR / handoff notes.

## Notes
- The deck is sent as a **link, not an attachment** — attachments trip spam
  filters, and a link lets you swap the PDF without touching code.
- Honeypot field + per-IP rate limit keep bot spam out without a captcha.
- New deck version later? `vercel blob put` the new file, update `DECK_URL`,
  redeploy. Done.
