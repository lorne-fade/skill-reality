# Phase 2 — The Detection Model: Classes & Data

*Published: https://www.skillreality.com/roadmap/phase-2/*

The longest pole in the build. A hazard the model never learned is a hazard it
will never flag — so the model is only ever as good as the classes we define and
the images we label. Here's the hazard vocabulary, the tiered rollout, and the
data strategy that turns the glasses themselves into the moat.

## Recall is the metric that matters

In most vision products a false positive is an annoyance and a false negative is
a shrug. Here a false negative is a hazard that walked past unflagged — a safety
failure. So we optimize for **recall** on safety-critical classes and hold a floor
per class. But recall isn't free: a model that cries wolf gets muted, and a muted
model catches nothing. The job is buying high recall without spending the
worker's trust.

## The hazard vocabulary (14 classes, 3 tiers)

Tiered by value × feasibility. Ship the tier that's high-value **and** well-served
by existing data first, then earn into the harder ones. Severity drives alert
priority; difficulty drives how much custom data each needs.

### Tier 1 — Ship first (static, high-value, public data exists) · weeks 1–3
| Class | What it detects | Severity | Difficulty |
|---|---|---|---|
| No hard hat | Head PPE absent in a work zone | Critical | Well-served |
| No hi-vis vest | High-visibility clothing absent | High | Well-served |
| No eye protection | Safety glasses absent at task | High | Medium |
| Spill / wet floor | Liquid on walking surface | High | Medium |
| Blocked exit / egress | Obstructed doorway or path | High | Medium |

### Tier 2 — Custom data (static, thinner public coverage) · after Tier 1 lands
| Class | What it detects | Severity | Difficulty |
|---|---|---|---|
| Missing machine guard | Exposed moving/rotating part | Critical | Hard |
| Exposed / damaged wiring | Live conductor or frayed cable | Critical | Hard |
| Unstable stacking | Over-height or leaning load | High | Medium |
| Trailing cable / trip | Cord across a walkway | Medium | Medium |
| Open panel / LOTO gap | Energized panel without lockout | High | Hard |

### Tier 3 — Spatial & dynamic (needs depth/motion reasoning) · research track
| Class | What it detects | Severity | Difficulty |
|---|---|---|---|
| Person–vehicle proximity | Worker in a forklift's path | Critical | Very hard |
| Person under suspended load | Worker beneath a lifted object | Critical | Very hard |
| Unguarded edge / opening | Fall exposure at height | Critical | Hard |
| No fall harness at height | Working elevated, unclipped | Critical | Hard |

## Why worksite vision is hard

| Challenge | What it does — and the answer |
|---|---|
| Small, distant objects | A hard hat at 15 m is a few pixels. Keep input resolution up, tile the frame, weight small-object recall. |
| Occlusion & clutter | PPE/guards get half-hidden. Needs varied real-world angles — what stock data lacks. |
| POV motion blur | A head-worn camera never holds still. Train on blurred frames, not only crisp stills. |
| Class imbalance | Hazards are rare — thousands of "fine" frames per violation. Mine hard negatives; oversample rare classes. |
| The domain gap | Public data is CCTV/stock; the product sees worker-POV. The core problem — and the opportunity. |

## Where the data comes from — three sources, one flywheel

1. **Public — bootstrap.** Get Tier 1 PPE moving in days. Strong open sets exist:
   - [SH17](https://github.com/ahmadmughees/SH17dataset) — 8,099 images / 75,994 instances / 17 classes. **Research-use license — vet before any commercial train.**
   - [Roboflow Universe · Construction Site Safety](https://universe.roboflow.com/roboflow-universe-projects/construction-site-safety)
   - CHV — colored hardhats / vest / safety glasses.
2. **Proprietary — the moat.** Capture POV footage from the glasses on real and
   mock sites, then label it. Closes the domain gap; no competitor has it. Starts
   with Phase 0/1 spike frames.
3. **Synthetic — the gaps.** For hazards you can't safely stage (a missing guard
   on live equipment) — render and augment with domain randomization.

## The insight worth building around: the glasses are the data flywheel

Every competitor can download the same public datasets — so a model trained only
on them isn't a moat, it's a commodity. What no one else has is *worker-POV
footage of your customers' actual hazards*, captured by the same camera that runs
inference. Wire the pipeline so every pilot frame can be reviewed, labeled, and
folded back into training:

```
Glasses capture → uncertain frames surfaced → labeled → retrain → better on-device model ↺
```

The product improves itself the more it's worn.

## Labeling pipeline

1. **Ontology first** — precise class definitions with edge cases written down
   (partial PPE, distance thresholds, "when is a cable a trip hazard").
2. **Tooling** — CVAT / Roboflow / Labelbox for bounding boxes; a shared schema.
3. **QA** — multi-annotator on a sample, measure inter-annotator agreement, adjudicate.
4. **Active learning** — model surfaces its most uncertain frames; label those next.
5. **Volume** — ~1–2k instances per class to start; more for the hard, imbalanced ones.

## Evaluation that tells the truth

- **Split by site, not at random.** Same-site frames leak; a held-out worksite is
  the only honest generalization test.
- **Headline metric: per-class recall** at fixed precision, with an agreed floor
  for critical classes (e.g. ≥ 0.90 hard-hat recall).
- **False-negatives are the review.** Every miss on a critical class gets looked
  at — that's the safety audit.
- **On-device, not lab.** Measure the quantized model at target FPS on the phone.

## People are in every frame

Detecting PPE means detecting people. Process on-device, never run face
recognition or identify individuals, keep only what training needs, get site
consent before any capture. Design this in from the first labeled frame —
retrofitting privacy is how safety tools get banned from the floor.

## What Phase 2 ships

A labeled dataset v1 (Tier 1 classes), a quantized Core ML / TFLite model
clearing the agreed recall floor on a held-out site at target FPS, an evaluation
report that leads with false-negatives, and a running capture → label → retrain
loop. The **dataset**, not the model, is the asset that compounds.

---

*Class tiers, volume targets, and recall floors are Skill Reality planning
choices to validate against pilot data, not fixed requirements. Dataset licenses
vary (SH17 is research-only) — vet before commercial use. On-device runtime per
current YOLO-n / Core ML / TFLite practice.*
