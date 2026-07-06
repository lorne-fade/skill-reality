# Phase 0 — The De-Risk Spike

*Published: https://www.skillreality.com/roadmap/phase-0/*

One to two weeks, a throwaway harness, and five measurements that decide the
whole architecture. Meta ships the camera, audio, and display access — but not
the numbers. This spike gets the numbers before a line of product code is written.

## Two tracks

- **Track A · days 1–2 — Mock Device Kit.** Stand up the SDK against Meta's
  simulated device before hardware is in hand. Learn the real API surface
  (frame subscription, display push, permissions) and build the logging harness.
- **Track B · days 3–7 — Physical unit.** The same harness on a real Meta
  Ray-Ban Display + paired phone. This is where the numbers come from. Trust only
  the physical numbers for go/no-go — Mock fidelity is itself an unknown (M5).

## Before you start

**Access & accounts**
- [ ] Meta developer account approved for the wearables preview
- [ ] Developer Mode on (tap version 5× in App Info, then toggle)
- [ ] Glasses paired to the Meta AI app; joined an invite-only release channel
- [ ] Confirm the tester cap and any approval lead time

**Hardware & tooling**
- [ ] Meta Ray-Ban Display unit, fully charged (+ a spare if possible)
- [ ] Paired iPhone (iOS 15.2+) or Android 10+ phone
- [ ] Xcode 14+ or Android Studio Flamingo+; DAT SDK from GitHub
- [ ] Firmware + Meta AI app versions aligned to the SDK's dependency table

## The five measurements

Run **M1 and M2 first** — either can end the "continuous real-time overlay" dream.

### M1 · How fast can we get frames off the glasses?
- **Method:** subscribe to the camera stream; log arrival timestamps for 60s.
  Compute mean & 95th-percentile FPS, jitter, resolution, pixel format. Note
  push-stream vs. pull-per-capture.
- **Target:** ≥ 5 fps sustained (≥ 15 ideal), short side ≥ 640 px. Record format
  (JPEG vs. raw YUV changes the pipeline).
- **No-go:** under ~2 fps → "continuous real-time" is off the table; reframe as a
  periodic scan and design the UX around that.

### M2 · What's the glass-to-alert latency, end to end?
- **Method:** timestamp three legs — frame captured → frame ready on phone →
  alert visible on the HUD. Film the display leg with a high-FPS camera against
  an on-screen millisecond clock.
- **Target:** < 1.5 s capture-to-alert (< 0.7 s excellent). Budget ~30–60 ms for
  on-device inference inside that.
- **No-go:** over ~3 s → alerts are advisory, not "avoid-it-now" → points to
  on-demand scanning, not always-on.

### M3 · What can the HUD actually draw?
- **Method:** attempt three outputs — (a) text card, (b) icon + text alert,
  (c) positioned box / free graphic. Record which succeed + max refresh, dwell
  time, color depth, safe-area limits.
- **Target:** classify the surface: notification-only / card / free-draw overlay.
- **Constraint:** if card-only (likely), on-glasses UX is a glanceable alert; the
  bounding-box view moves to the phone companion and post-shift review.

### M4 · How long does continuous capture last?
- **Method:** from full charge, run capture + stub inference at target FPS
  continuously. Log battery %/min on glasses and phone; note thermal throttling.
- **Target:** ≥ 45–60 min continuous on the glasses for demo viability.
- **No-go:** under ~20 min → design capture to duty-cycle (wake on gesture/context).

### M5 · What do access, privacy, and the Mock Kit really impose?
- **Method:** log approval lead time and tester cap. Observe the capture-indicator
  LED and consent prompts. Diff one Mock Device Kit run against the physical unit.
- **Target:** a known tester ceiling, documented capture-consent behavior, and a
  sense of how far the Mock Kit can be trusted without hardware.
- **Watch:** always-on POV camera carries real consent obligations — start the
  data-handling stance now, not at pilot.

## Record your numbers

| Measurement | Target | Measured | Verdict |
|---|---|---|---|
| M1 · Frame cadence | ≥ 5 fps · ≥ 640px | ___ fps | ___ |
| M2 · Capture → alert | < 1.5 s | ___ s | ___ |
| M3 · Display surface | free-draw preferred | ___ | ___ |
| M4 · Continuous runtime | ≥ 45 min | ___ min | ___ |
| M5 · Tester cap / privacy | documented | ___ | ___ |

## Day by day

- **Days 1–2:** Access + Mock Kit + harness (timestamps → CSV, a few toggles).
- **Days 3–4:** M1 + M2 on hardware — the two answers that can end the continuous path.
- **Days 5–6:** M3 + M4 — display probe; battery + thermal soak with stub inference.
- **Day 7:** M5 + edges — access mechanics, capture-consent, Mock-vs-real diff.
- **Days 8–9:** Analyze + decide — fill the table, run the matrix, write the memo,
  lock the Phase 1 architecture variant.

## Decision matrix (outcome → what Phase 1 builds)

The spike doesn't pass or fail — it **selects a design**. Every branch is still a
valuable product; the only failure is not knowing which one you're in.

| If the numbers say… | …then Phase 1 builds | |
|---|---|---|
| ≥ 10 fps, < 1.5 s, free-draw display | Continuous live overlay — full vision as demoed | Ideal |
| 3–10 fps, or card-only display | Periodic scan + glanceable alert cards; boxes in phone/review | Likely |
| < 2 fps or > 3 s latency | On-demand scan — worker triggers a look; not always-on | Reframe |
| < 20 min battery | Duty-cycled capture — wake on gesture/context; pair with sensor monitor | Adapt |

## What the spike ships

A one-page findings memo with the five measured numbers, the selected design
variant, and the Phase 0 risk chips recolored from unknown to known — the input
Phase 1 needs to build the right thin slice instead of the wrong one.

---

*Target thresholds are Skill Reality planning defaults for a usable frontline
warning, not Meta specifications. Meta does not publish camera FPS, latency,
display-overlay capability, or battery-under-load — every number in the results
table is a spike output, measured on hardware.*
