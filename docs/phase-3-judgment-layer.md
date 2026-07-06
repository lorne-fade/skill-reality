# Phase 3 — The Judgment Layer: Detections Aren't Alerts

*Published: https://www.skillreality.com/roadmap/phase-3/*

Phase 2 hands us a model that sees hazards. Phase 3 decides what deserves the
worker's attention — because a warning system that interrupts too often gets
muted, and a muted system catches nothing. This phase builds the policy between
detection and alert, and the calm on-glasses UX it drives. It replaces Phase 1's
single decision rule as a **module swap at stage 4** of the pipeline.

## The design constraint everything follows from

**Worker attention is a budget — spend it like money.** A frontline worker
mid-task will tolerate a handful of interruptions per shift before the glasses
come off or the audio gets ignored. The judgment layer is an economist, not a
megaphone: every alert must clear a bar of *severity × confidence × novelty*;
everything that doesn't clear it gets logged silently. The log misses nothing;
the worker hears only what matters. "More alerts" is never the answer —
*better-spent* alerts is.

## Five judgments between detection and alert

| # | Judgment | Mechanism |
|---|----------|-----------|
| 1 | **Persist** | Phase 1's 3-of-5 rule generalized: per-class K-of-N windows tuned to each hazard's physics (spill = static, wide window; person entering frame = fleeting, tight window). Simple IoU tracking gives each detection an identity across frames — the system knows *this* spill from a second one. Confidence floors come from Phase 2's eval. |
| 2 | **Score** | Phase 2 taxonomy severity (critical/high/medium) is the base, adjusted by confidence and proximity cues (bigger box ≈ closer ≈ more urgent). The safety SME owns the policy table; every change is versioned and logged. |
| 3 | **Arbitrate** | A 600×600 glass shows one thing well and two things badly. Highest severity wins the single display slot; lower ones wait — and if they resolve or go stale while waiting, they drop to the log, never queue for a nag. |
| 4 | **Suppress** | Acknowledged hazards stay suppressed *for that specific tracked hazard* — acking one spill doesn't silence spills as a category. Re-alert only on real change: severity escalates, hazard moves closer, or the ack expires. |
| 5 | **Route** | Severity decides how loudly the alert arrives (matrix below). The routing is data, not code: one table the SME can read and sign. |

### Suppression policy v0 (every constant is a logged knob)

```
ACK (Enter):  suppress this tracked hazard for 10 min
RE-ARM when:  severity escalates OR proximity jumps ≥ 1 zone OR ack expires
REPEAT:       critical unacked → re-cue audio every 20 s (visual stays)
              high unacked     → one repeat at 60 s, then hold visual only
RATE CAP:     non-critical alerts ≤ 6 / hour
              — past the cap, high degrades to log+chime
NEVER:        suppress a critical class-wide · stack two alerts · scroll anything
```

The rate cap is the alert budget made mechanical. If the system wants to exceed
it, that's a signal the model or persistence windows need tuning — not that the
worker needs more noise.

## The routing matrix

| Severity | HUD | Audio | Dwell / repeat | Example |
|---|---|---|---|---|
| **Critical** | Red card, pulse, preempts anything showing | Distinct urgent tone, repeats while unacked | Holds until acked or hazard clears | Person–vehicle path, man-down, exposed wiring |
| **High** | Amber card | Single chime, one repeat at 60 s | 8 s, then compact badge while hazard persists | No hard hat, spill, blocked exit |
| **Medium** | No interruption — count badge only | None | Rolled into end-of-task summary | Trailing cable, housekeeping |
| **Log-only** | Nothing | Nothing | JSONL event, fleet review later | Sub-threshold or rate-capped events |

## The alert card, on glass — heads up, never heads down

1. **≤ 3 words of hazard, ≤ 7 of action.** Read in one glance; no sentence wraps twice.
2. **Severity is color + motion,** not more words — red pulses, amber sits still.
   Green/amber/red stay functional, per the brand system.
3. **One action verb, always.** "Step clear." "Don a hard hat." Never a paragraph,
   never two options.
4. **Enter acknowledges, Escape dismisses** — the same D-pad grammar as Field
   Coach and Hazard Watch; zero new learning.
5. **Nothing ever scrolls.** If it doesn't fit the card, it belongs in the log.

Example cards: `⚠ FORKLIFT PATH — Step clear — vehicle approaching [ENTER OK]`
(critical, red) · `△ NO HARD HAT — Don a hard hat before entering [ENTER OK]`
(high, amber).

## Trust, measured

Four proxies, logged automatically, reported per session (planning targets to
calibrate against the first real crews):

- **≤ 1 / shift** — false alarms a worker would call wrong (the metric that predicts muting)
- **≤ 5 s median** — ack latency (long latency means alerts are ignored, not read)
- **0 mute events** — glasses removed or audio disabled mid-task; any occurrence is a design failure
- **≥ 90% agree** — post-task review: alerts the tester agrees were worth an interruption

## The wear-test protocol (Phase 1 tested the pipe; this tests the judgment)

**Protocol**
1. **Real task as workload:** the tester runs a Field Coach procedure
   (valve / motor / forklift) start to finish while wearing the system — the
   distraction is the point.
2. **Staged hazards around the task:** scripted mix across Tier 1 classes —
   persistent, transient, and recurring-after-ack.
3. **Deliberate traps:** two hazards at once (arbitration), an acked spill that
   stays put (suppression), a hazard that escalates (re-arm).
4. **≥ 5 testers × 2 sessions,** counterbalanced hazard scripts; everything
   logged to the event schema.

**Pass bar**
- Task completes without removing the glasses.
- All four trust metrics hit, measured from logs.
- Arbitration correct in every two-hazard trap (higher severity showed, lower logged).
- Suppression correct: no re-alert on acked static hazards; guaranteed re-alert on escalation.

## The event log — Phase 5's seam

Every judgment writes one JSONL event on-device: detection, score, arbitration
outcome, alert shown/suppressed, ack, expiry — with the policy version that
produced it. No cloud in this phase, but the schema is designed once, here, so
the Phase 5 fleet dashboard and the Phase 2 flywheel read the same stream.
Suppressed events matter most: they're the record of what the system chose *not*
to say — exactly what a safety review wants to audit.

## Week by week

- **Week 1 — Policy engine.** Tracking + per-class persistence, severity table,
  arbitration, suppression state machine — a pure module with the event schema,
  unit-tested against recorded Phase 1/2 frame logs before touching hardware.
- **Week 2 — UX on glass.** Card component per the routing matrix, audio cues,
  ack/dismiss flow; swap the module into the live pipeline at stage 4; dry-run the traps.
- **Week 3 — Wear-test + tune.** Run the protocol, tune windows / cooldowns /
  rate cap against the trust metrics, re-run to the pass bar, ship the findings
  memo with the signed policy table.

## Deliberately out of scope

- **No new detection classes.** Judgment works on whatever Phase 2 shipped.
- **No fleet dashboard.** The schema ships; the dashboard is Phase 5.
- **No per-site configuration UI.** Policy is a reviewed table in the build, not a settings screen.
- **No voice or gesture input.** D-pad ack only.
- **No supervisor escalation path.** Man-down-style auto-escalation designs in Phase 4 with real site contacts.
- **No Android.** Same slice platform until Phase 5.

**Exit criteria:** a tester completes a real procedure wearing the system, gets
timely, uncluttered alerts they agree with, the traps all resolve correctly, and
the four trust metrics hit — measured from the event log, not impressions.

## What Phase 3 ships

The judgment module (drop-in at Phase 1's stage 4) with its versioned, SME-signed
policy table; the on-glasses alert component set in the Hazard Watch design
language; the JSONL event schema that Phase 5's fleet view and Phase 2's flywheel
both consume; wear-test results against the four trust metrics; and the tuned
constants memo. After this phase the system doesn't just see hazards — it
exercises judgment a worker can live with all shift. That's the difference
between a demo and a product, and it's what Phase 4 takes to a real site.

---

*All thresholds (ack window, rate cap, dwell times, trust targets) are planning
defaults to calibrate in the wear-test and again at pilot — the structure is the
commitment, the numbers are knobs. Severity policy is owned by the safety SME and
versioned with the build. Depends on: Phase 1's pipeline (module swap at stage 4),
Phase 2's model + per-class confidence floors, and M3's display-surface verdict.*
