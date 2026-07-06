# On-Glasses Hazard Vision — Build Map

*Published: https://www.skillreality.com/roadmap/build-map/*

Today's Hazard Watch web app reads motion sensors and simulates the camera view.
Making the vision *real* — the camera actually spotting a missing guard or a
spill — means stepping off the web platform and onto Meta's native **Device
Access Toolkit**. This is the route, the pieces, and the unknowns to pin down first.

## The platform shift

| | Today — Web App | Next — Device Access Toolkit |
|---|---|---|
| **Delivery** | Instant URL, loads on the glasses from a link | Native iOS/Android app paired via the Meta AI app |
| **Access** | Motion, orientation, geolocation, local storage | Hands-free POV camera capture, open-ear audio, display output |
| **Camera** | **None** — hard platform limit | POV camera stream |
| **Distribution** | Public URL now | Own testers now; public listing gated to 2026 |

The web app is instant and needs nothing but a URL; it can never touch the
camera. The camera app is a native mobile build that pairs with the glasses —
more capable, but review-gated until Meta opens general publishing in 2026.

## Architecture

The detection app does **not** run on the glasses — it runs on a paired phone,
with the Meta AI app as the link layer.

```
Meta Ray-Ban Display  ⇄  Meta AI App  ⇄  Hazard Watch App (phone)  ⇄  Cloud (optional)
  POV camera               pairing/auth      frame pipeline             model training
  HUD glanceable alert     Device Access API on-device detector         alert log / dashboard
  open-ear audio           capture indicator hazard rules + UX          OTA model updates
```

- **Camera + control** flow out to the phone/cloud.
- **Alerts + models** flow back to the worker (HUD + open-ear audio).

## Three subsystems

1. **Capture** — pull POV frames off the glasses via the Toolkit; design for
   periodic frame-grab (a few fps) before assuming full video. *(preview SDK access)*
2. **Detect** — lightweight object detector on the phone so nothing leaves the
   device: YOLOv8n–v12n, Core ML / TFLite, INT8 quantization. *(new model + dataset)*
3. **Alert** — one calm, glanceable warning: hazard, severity, one action —
   mirrored to open-ear audio, reusing Hazard Watch's status language. *(display richness TBD)*

## Phases (~3–4 months to a field pilot)

| # | Phase | Duration | Goal | Exit criteria |
|---|-------|----------|------|---------------|
| 0 | Access & de-risk spike | 1–2 wk | Answer the unknowns the docs don't | Know FPS, latency, display capability. Go/no-go on "real-time." |
| 1 | Thin vertical slice | 2–3 wk | One hazard end-to-end on real hardware | Bare head → hard-hat alert on the glasses within a second or two. |
| 2 | The detection model | 3–5 wk | Purpose-built, on-device detector | Quantized model hits recall target on held-out set for 4–6 classes at target FPS. |
| 3 | Hazard logic & on-glasses UX | 2–3 wk | Severity, debouncing, calm output | Tester runs a task; timely, uncluttered alerts, low false-alarm rate. |
| 4 | Field pilot | 3–4 wk | Real heads, real site, tune to ground truth | Signed-off pilot: measured detection rate, acceptable false-alarms, safety sign-off. |
| 5 | Harden & path to publish | ongoing → 2026 GA | Fleet dashboard, OTA models, privacy, publish | Publishable build, documented privacy stance, repeatable path to add classes. |

## Validate first (the Phase 0 spike exists for this)

Meta's docs confirm camera, audio, and display access on a paired phone — but
don't publish the numbers that decide whether "real-time hazard vision" is a
product or a science project.

| Unknown | Why it decides the design | Severity |
|---|---|---|
| Camera cadence & latency | Continuous video vs. periodic capture changes everything | **Critical** |
| Display overlay richness | Cards/text vs. registered boxes → alert on glass vs. boxes in review | **Critical** |
| Battery & thermal | Continuous capture + inference is a power draw | High |
| Detection recall in the field | A missed hazard is a safety failure, not a bug | High |
| Publishing & privacy path | Partner-gated to 2026; always-on POV camera = consent obligations | High |

## What carries over

- **Brand system** — palette, type, dark-safe tile logo.
- **Hazard taxonomy & advisory copy** — classes and "one action" wording already written.
- **Alert UX** — status banner, severity colors, glanceable layout → the HUD language.
- **Sensor monitor ships now** — incline / vibration / man-down needs no camera, so it
  can launch inside the native app on day one.

## Team & effort

- 1 native mobile engineer (iOS or Android to start)
- 1 ML engineer (dataset, training, quantization, on-device eval)
- ~0.5 designer (adapt alert UX to the HUD's real constraints)
- Safety SME, part-time (hazard classes, severity, sign-off)

**Bottom line:** working prototype ≈ 1 month (gated on preview access + Phase 0
answers); tuned, safety-reviewed field pilot ≈ 3–4 months; public distribution
waits on Meta's 2026 GA.

---

*Durations and team sizes are planning estimates. Camera FPS, latency,
display-overlay capability, and battery figures are **not** published by Meta —
they are Phase 0 spike outputs, not knowns. Sources: Meta Wearables Device Access
Toolkit & Web Apps developer docs.*
