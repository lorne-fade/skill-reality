# Phase 5 — Harden & Publish: From Pilot to Product

*Published: https://www.skillreality.com/roadmap/phase-5/*

The pilot proves one crew, one site, one build. Phase 5 makes that repeatable: a
fleet you can operate, a model you can update over the air, a hazard vocabulary
you can extend without re-architecting, and the compliance posture that lets
procurement say yes — all pointed at Meta's 2026 general availability.

## Three tracks, run in parallel

### Fleet — the operator's view (what a safety manager buys)
- **Dashboard** — alerts, hazard heatmap by zone/shift, trend lines; reads the Phase 3 event schema as-is
- **Audit trail** — every alert *and every suppression*, with the policy version that produced it
- **OTA updates** — signed model + policy bundles, staged rollout, one-tap rollback
- **Device management** — enrollment, health, battery, per-site policy assignment

### Platform — the engineering debt the slice deferred
- **Crash + telemetry** — anonymous, opt-in, no frame content ever
- **Battery duty-cycling** — productize whatever mode Phase 0/4 forced
- **Android port** — TFLite path, reusing the pipeline seams
- **Per-site policy config** — the SME table becomes deployable, versioned data
- **Degraded modes** — sensor-only fallback (the original Hazard Watch) when camera or phone drops

### Compliance — what lets procurement and legal say yes
- **Data-handling whitepaper** — on-device inference, what leaves, retention, deletion
- **DPA + consent templates** — the pilot pack, productized per jurisdiction
- **No-surveillance commitment** — published, versioned, contractual
- **Regional review** — GDPR / works-council playbook from the pilot experience

## The repeatability test: adding a hazard class must be a process, not a project

Tier 2/3 classes and every site-specific request go through one standing
pipeline. If adding a class requires an architecture conversation, Phase 5 isn't
done. **Gate: a new class ships end-to-end in under two weeks without touching
pipeline code.**

```
Collect (flywheel + synthetic) → Label vs. ontology → Train + eval vs. recall floor
  → SME writes the policy row → OTA staged rollout → Field-monitor 2 weeks
```

## The Meta publish path (the one clock we don't control)

| Stage | What it means for us |
|---|---|
| Now — invite-only channels | Distribute to our org and pilot testers via release channels. Every pilot and early customer runs this way — a deployment constraint (named testers, per-channel builds), not a blocker. |
| Select partners | Meta publishes some partner integrations ahead of GA. The pilot report + reference customer are the application material — apply as soon as both exist. |
| 2026 — general availability | Public listing opens. Target: arrive with a hardened fleet product, N pilot-proven sites, and the compliance pack — not a prototype scrambling to productize. |

Strategy note: enterprise safety sells B2B through pilots anyway, so the gated
period costs little — invite-only channels cover paid deployments with named
crews. GA matters most for scale and for procurement teams that require
"published app" status.

## Milestones, not weeks (each gated on the one before)

| # | Milestone | Gate |
|---|-----------|------|
| M1 | **Fleet MVP** — dashboard + audit trail on pilot logs; second site onboarded with the templated pack | a safety manager reviews a week of real data without our help |
| M2 | **OTA + policy-as-data** — signed bundles, staged rollout, rollback; per-site policy as data | a model update ships to a live site with zero on-site touch |
| M3 | **Class factory proven** — first Tier 2 class (missing machine guard) dataset-to-field | class shipped in < 2 weeks, no pipeline code changes |
| M4 | **Android parity** — TFLite build passing the Phase 1 and Phase 3 protocols | same pass bars, second platform |
| M5 | **Publish application** — partner/GA submission with pilot report + compliance pack + reference customer | submitted — the rest is Meta's clock |

## Definition of "product" (the checklist that ends the roadmap)

- A new site deploys in days — templated pack, policy config, enrollment, no engineers on site
- A new hazard class ships in weeks — through the class factory
- Models update over the air — staged, signed, reversible
- The safety manager self-serves — dashboard + audit trail answer their questions
- Compliance is a pack, not a negotiation
- Degrades gracefully — camera loss falls back to the sensor monitor; nothing fails silent
- Two platforms, one pass bar — iOS and Android identical protocol results
- Publish-ready — Meta application submitted with proof attached

## The through-line, closed

The roadmap opened with a web demo that simulated a camera it couldn't have. It
closes with a fleet product where the same brand system, hazard vocabulary,
alert language, and event schema run from the first sensor demo to the operator
dashboard — and where every deployed pair of glasses feeds the data flywheel.
Phases 0–4 bought certainty; Phase 5 buys repeatability. When M5 is submitted,
the roadmap's job is done and the product's job begins.

---

*Milestone scope assumes the Phase 4 pilot passed; a partial pass reorders M1–M3
around the classes that fell short. Meta's partner criteria, GA timing, and
publishing requirements are Meta's to define — re-check their docs at execution
time. Pricing/packaging deliberately out of scope; it feeds from the pilot
report and belongs to the commercial plan.*
