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

## 3. HubSpot logging — optional (3 min)
1. HubSpot → Settings → Integrations → Private Apps → create one with
   `crm.objects.contacts.write`.
2. Copy the token → this becomes `HUBSPOT_TOKEN`.

Every deck request lands in HubSpot as a new lead (`lifecyclestage=lead`,
`hs_lead_status=NEW`). If `HUBSPOT_TOKEN` is unset, this step is silently
skipped — the user still gets the deck.

## 4. Env vars (Vercel → Project → Settings → Environment Variables)
```
RESEND_API_KEY = re_xxxx
DECK_URL       = https://xxxx.public.blob.vercel-storage.com/Skill_Reality_....pdf
FROM_EMAIL     = Skill Reality <hello@skillreality.com>
HUBSPOT_TOKEN  = pat-na1-xxxx        (optional)
```
`DECK_URL` is read server-side only — it is never sent to the browser or
returned in any API response.

## 5. What's already wired
- `api/request-deck.js` — the serverless function (validation, honeypot,
  5 req/min per-IP rate limit, Resend link-email, best-effort HubSpot upsert).
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
