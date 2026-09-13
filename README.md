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
