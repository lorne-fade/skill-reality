# skill-reality

Skill Reality

## Checks

`index.html` is a Design Component document: the whole page lives inside a
template element and is rendered client-side by `support.js`. That runtime
re-slices the template out of the page's own source with plain regexes that
have no idea what an HTML comment is, so **writing a runtime tag name in angle
brackets inside a comment can silently wipe the rendered page** — no console
error, no failed request.

`scripts/check-html.mjs` guards against it:

```bash
node scripts/check-html.mjs
```

It reads the guarded tag names out of `support.js` rather than hardcoding
them, so it stays correct if the generated runtime is rebuilt. It runs in CI on
every push and pull request (`.github/workflows/check-html.yml`).

To run it locally before every commit as well — opt-in, not installed by
default:

```bash
printf '#!/bin/sh\nexec node scripts/check-html.mjs\n' > .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```

When it fires, the fix is always the same: describe the tag in prose instead of
angle brackets — "the helmet block", "the template element", "the title tag".

Do not edit `support.js`. It is generated, and carries a "do not edit" banner.

## Social cards

`og-card.png` (link unfurls) and `deck-cover.jpg` (the investor deck email)
carry copy **as pixels**, so no text search will find a stale claim in them.
Both previously kept an "A VR VISION COMPANY" badge live long after that claim
was removed from the page.

To change their copy, edit `BOLD` / `BADGE` in the script and re-run:

```bash
python scripts/social-cards/make-cards.py
```

```bash
python scripts/social-cards/make-cards.py --check
```

`--check` regenerates in memory and reports whether the committed images still
match, without writing anything.

The script erases only the two text regions and re-renders those in the real
site fonts, so the photo panel, wordmark and headline stay identical at the
pixel level. It always works from the pre-correction artwork in git
(`PRISTINE_REV`) rather than from the live files, so corrections never stack.
Needs Pillow, Chrome (`CHROME=` to override discovery) and network access for
the webfonts. The script's docstring explains the rest, including why the text
is rendered at 2x and downsampled.

Changing these images does not change their URLs, so Slack and LinkedIn will
serve a cached unfurl for a while afterwards.

## Logo and icons

`favicon/skill-reality-mark.svg` is the vector master for the mark. Every
raster icon on the site — the nav/footer glyph, the favicon set, the PWA and
apple-touch icons, the `-bright` set the Meta glasses menu scrapes, and the
`/coach`, `/hazard` and `/hud` app icons — is generated from it:

```bash
python scripts/make-icons.py
```

```bash
python scripts/make-icons.py --check
```

`--check` regenerates in memory and reports whether every committed icon still
matches, without writing anything. The geometry lives in the script; the SVG
is emitted from it, so edit the script rather than the SVG. Needs Pillow and
Chrome (`CHROME=` to override discovery).
