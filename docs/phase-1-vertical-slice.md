# Phase 1 — The Thin Vertical Slice

*Published: https://www.skillreality.com/roadmap/phase-1/*

Before widening anything, prove the whole chain once: glasses see a bare head,
worker gets a hard-hat alert, within seconds, on real hardware. One hazard, one
platform, one alert — every stage real, nothing polished.

## Why "no hard hat," why one slice

The slice hazard is *no hard hat* because it maximizes what we prove per week:
safety-critical, the best-served class in public data (pretrained detectors
exist — zero training required), safely stageable in seconds, unambiguous
success. The point of the slice is not the hazard — after it works, every
remaining risk in the program is a *known kind* of work: more classes (Phase 2)
and better judgment (Phase 3), on a pipeline that already runs.

**One platform only — iOS first** (Core ML on the Neural Engine is the fastest
route to on-device FPS; Android/TFLite is an equally viable swap if the team's
stronger there). Porting is Phase 5 work, not slice work.

## The pipeline, stage by stage

| # | Stage | Tech | Spec |
|---|-------|------|------|
| 1 | **Capture** | Device Access SDK → frame buffer | Subscribe per M1's answer (stream or periodic pull). Timestamp every frame at arrival. **Freshest-frame policy** — drop stale frames, never queue a backlog. |
| 2 | **Preprocess** | resize · normalize | Letterbox to 640×640, normalize, convert pixel format (JPEG or YUV per M1) once, here and nowhere else. |
| 3 | **Detect** | off-the-shelf YOLOv8n → Core ML | Pretrained construction-safety checkpoint (Roboflow Universe has several with person / hardhat / no-hardhat classes), INT8-quantized, on the Neural Engine. Budget ~30–60 ms/frame. **No custom training** — mediocre accuracy is fine; the slice proves plumbing, Phase 2 buys accuracy. License-vet the checkpoint. |
| 4 | **Decide** | debounced rule | Raw per-frame detections flicker; alerting on them destroys trust in an afternoon. One explicit, tunable rule (below), with hysteresis and cooldown. The seed of Phase 3. |
| 5 | **Alert** | HUD card + audio | One alert on whatever surface M3 said exists: *"⚠ No hard hat — don a hard hat before entering."* Severity color + one action line + audio chime, copied verbatim from the Hazard Watch advisory format. |

### The decision rule (v0 — every constant is a knob, logged with every alert)

```
RAISE when:  person detected AND head region lacks hardhat
             in ≥ 3 of last 5 frames          (K-of-N confirmation)
CLEAR when:  hardhat present in ≥ 3 of last 5 (hysteresis — no flicker)
COOLDOWN:    30 s per hazard after raise      (don't nag)
CONFIDENCE:  detections count only above 0.45 (tune against false alarms)
```

Tuning these four numbers against the walk-up protocol *is* the week-3 work.
They ship in the findings memo alongside the latency numbers.

## Adapting to Phase 0's verdict

The slice absorbs Phase 0's design variant at exactly two stages — capture
cadence and alert surface. Everything else is identical across variants.

| Phase 0 said | The slice becomes | |
|---|---|---|
| ≥ 10 fps, free-draw display | Continuous watch; alert renders as a positioned callout. The full demo, for real. | Ideal |
| 3–10 fps, or card-only | Same continuous watch; glanceable card; K-of-N window widens to match FPS. | Likely |
| < 2 fps / > 3 s latency | On-demand: worker triggers a scan, gets a verdict card. Rule collapses to single-shot + confidence. | Reframe |
| < 20 min battery | Capture duty-cycles (N s on / M s off); protocol adds a battery leg per cycle mode. | Adapt |

## The walk-up protocol (acceptance is measured, not vibed)

**Protocol**
1. Two subjects — one wearing a hard hat, one bare-headed, same clothing otherwise.
2. Three distances — 3 m, 5 m, 8 m from the wearer.
3. Two conditions — indoor shop lighting and outdoor daylight.
4. 10 trials per cell, randomized order; wearer walks and turns normally — POV blur is part of the test.
5. Log everything — per-frame JSONL: timestamps per leg, detections, rule state, alert events; battery snapshot per minute.

**Pass bar (slice-grade, not product-grade)**
- ≥ 80% alert rate on bare-head trials at 3 m and 5 m.
- Median time-to-alert ≤ 2 s from bare head entering frame (or per the Phase-0-adjusted budget).
- **Zero alerts** across all hat-worn trials — false alarms are what get the product muted.
- Session survives 30 min continuous (or the duty-cycle equivalent) without a crash or thermal shutdown.

## Week by week

- **Week 1 — Skeleton flowing.** Phase 0's harness grows into the pipeline:
  frames land in a stub detector, a hardcoded alert reaches the HUD + audio.
  Latency legs instrumented from day one.
- **Week 2 — Real detector in.** Export the pretrained checkpoint to Core ML,
  hit inference budget on-device, wire the decision rule, replace the hardcoded
  alert with the real raise/clear path.
- **Week 3 — Tune + prove.** Run the walk-up protocol, tune the four knobs, fix
  what falls out, re-run to the pass bar. Record the demo, write the findings memo.

## Deliberately out of scope

- **No custom training.** Pretrained weights only; accuracy is Phase 2's job.
- **No second hazard class.** One class proves the chain; more prove nothing new.
- **No Android port.** One platform; porting is Phase 5.
- **No cloud, no fleet, no dashboard.** Logs stay on the phone as files.
- **No UI beyond the one alert.** No settings, no history screen, no onboarding.
- **No battery optimization.** Measure it, log it, fix it later — unless Phase 0 forced duty-cycling.

**Exit criteria:** walk up bare-headed, get the alert on the glasses within the
budget, zero false alarms with the hat on, 30 minutes without falling over —
measured by the protocol, on video, with the numbers in the memo.

## What Phase 1 ships

A working demo on real hardware (recorded), the measured latency table per
pipeline leg, the tuned decision-rule constants, a battery/thermal profile, and
— the real asset — a pipeline where Phase 2's custom model is a **drop-in file
replacement** at stage 3 and Phase 3's judgment layer is a **module swap** at
stage 4. The slice also starts the data flywheel: every protocol frame is
labeled-by-construction (we know who wore the hat) and becomes the first
proprietary POV training data for Phase 2.

---

*Depends on Phase 0 outputs: M1 cadence sets the capture mode and K-of-N window,
M2 sets the latency budget, M3 sets the alert surface, M4 decides duty-cycling.
Pretrained checkpoint licenses vary — vet before use (several Roboflow Universe
construction-safety models; SH17-derived weights are research-only). Pass-bar
numbers are slice-grade planning defaults, deliberately below the product-grade
recall floors defined in Phase 2.*
