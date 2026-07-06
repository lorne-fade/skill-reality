# Hazard Vision — Roadmap Source

Canonical, editable source for the on-glasses hazard-detection roadmap. These
markdown files are the source of truth; the published team-facing HTML lives at
[`/roadmap/`](../roadmap/) and renders the same content.

| Doc | Source | Published |
|-----|--------|-----------|
| Build Map | [`hazard-vision-build-map.md`](hazard-vision-build-map.md) | https://www.skillreality.com/roadmap/build-map/ |
| Phase 0 — De-Risk Spike | [`phase-0-spike.md`](phase-0-spike.md) | https://www.skillreality.com/roadmap/phase-0/ |
| Phase 1 — Vertical Slice | [`phase-1-vertical-slice.md`](phase-1-vertical-slice.md) | https://www.skillreality.com/roadmap/phase-1/ |
| Phase 2 — Detection Model | [`phase-2-hazard-model.md`](phase-2-hazard-model.md) | https://www.skillreality.com/roadmap/phase-2/ |
| Phase 3 — Judgment Layer | [`phase-3-judgment-layer.md`](phase-3-judgment-layer.md) | https://www.skillreality.com/roadmap/phase-3/ |

Hub: https://www.skillreality.com/roadmap/ — **unlisted** (noindex, not linked
from the main site; the site has no auth, so the URL is the only gate).

## Why this exists

The Hazard Watch web app ([`/hazard/`](../hazard/)) reads the glasses' motion
sensors and *simulates* the camera view — because MRBD **web apps cannot access
the camera** ("Web Apps do not yet support: Camera"). Making the vision real
means a native app on Meta's **Device Access Toolkit**. These docs map that path.

## Live prototypes

- Field Coach — [`/coach/`](../coach/) — guided equipment procedures
- Sensor HUD — [`/hud/`](../hud/) — live compass / level / motion
- Hazard Watch — [`/hazard/`](../hazard/) — sensor hazard monitor + simulated vision scan

## Editing

Edit the markdown here, then re-render the matching `/roadmap/<page>/index.html`
if the published version needs to track the change. The HTML pages are
standalone (self-contained `<style>`, brand icons referenced from `/favicon/`).
