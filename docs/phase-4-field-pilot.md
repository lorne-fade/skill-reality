# Phase 4 — The Field Pilot: Ground Truth or It Didn't Happen

*Published: https://www.skillreality.com/roadmap/phase-4/*

Everything before this phase happened on our terms: staged hazards, cooperative
testers, controlled light. The pilot puts the prototype on real heads at a real
site for four weeks and measures it against what a human safety observer
actually saw. It ends with numbers and a signature, not a vibe.

## The rule that governs everything on site: augment, never replace

For the entire pilot, Hazard Watch is a *supplementary* layer. Every existing
safety control — spotters, permits, LOTO, toolbox talks — runs exactly as
before. No procedure is relaxed because "the glasses are watching," no alert
substitutes for a human judgment, and any incident follows the site's normal
protocol first, ours second. This is what makes a site willing to sign, and it
keeps failure modes survivable while the numbers are unproven.

## Before day one (the pilot doesn't start until every box is checked)

**Program inputs**
- [ ] Phases 1–3 passed — slice demo, model at recall floor, judgment layer through its wear-test
- [ ] Pilot site signed — one site, named site sponsor, agreed hazard focus (which Tier 1 classes matter there)
- [ ] Consent pack executed — every document below, signed before any capture
- [ ] Safety SME committed — owns the ground-truth observation plan and the final sign-off

**Logistics**
- [ ] Crew recruited — 3–5 volunteer workers, mixed roles, opt-in with the right to withdraw at any time
- [ ] Hardware kit — one glasses + phone pair per worker, plus one spare pair and a charging plan
- [ ] Tester channel live — pilot build distributed via Meta's invite-only release channel
- [ ] Daily data path — event logs pulled to a review machine each shift end (files, no cloud dependency)

## Four weeks, three modes: shadow → live → prove

### Week 1 — SHADOW MODE: the system watches, workers see nothing
Full pipeline runs, every detection and judgment is logged — but no alerts
render. The safety observer independently logs real hazards on paper. This week
produces the baseline with zero risk of alert fatigue poisoning the pilot early.
- Ground-truth log vs. shadow detections → field recall & false-alarm baseline per class
- Battery, comfort, and connectivity reality-check across full shifts
- Threshold + rate-cap retune on real data before anyone hears an alert

### Weeks 2–3 — LIVE ALERTS: tuning loop running
Workers get real alerts, tuned from week 1's baseline. Every evening: logs
pulled, misses and false alarms reviewed against the observer's record, hard
frames labeled and queued for retraining. One mid-point model/policy update
ships at end of week 2 — versioned, so before/after is measurable.
- Daily triage: every critical-class miss reviewed within 24 h
- Weekly worker debriefs — 15 min, structured, anonymous-comment option
- Phase 3 trust metrics tracked per worker per shift

### Week 4 — SIGN-OFF RUNS: frozen build, measured week
No more tuning. The final build runs a full week untouched while the observer
logs ground truth. **This week's numbers are the pilot's reported results.**
Ends with the SME's structured sign-off review and worker exit interviews.

## The pass bar (measured in week 4, on the frozen build)

| Metric | Measured by | Target |
|---|---|---|
| Field recall — critical classes | Detections vs. the observer's independent hazard log | ≥ 0.85 |
| Field recall — other Tier 1 | Same ground-truth comparison, per class | ≥ 0.70 |
| False alarms | Alerts the worker or observer dispositioned as wrong | ≤ 1 / worker / shift |
| Trust metrics | Phase 3's four proxies, from event logs | all four hit |
| Wearability | Runtime vs. site task blocks; comfort survey | full task blocks, no removal |
| Safety regressions | Any incident/near-miss the system contributed to negatively | **zero — hard gate** |
| Crew verdict | Exit interview: "would you keep wearing it?" | majority yes |

## The consent & privacy pack (six documents, signed before any capture)

A POV camera on a worker records colleagues who never opted in. The pack makes
that legitimate — and drafting starts *now*: legal review is the longest
lead-time item in this phase (4–8 weeks in works-council/GDPR jurisdictions).

1. **Site agreement** — scope, duration, hazard focus, the augment-never-replace clause, termination rights, report ownership.
2. **Worker opt-in** — plain-language consent: what's captured, what's inferred, right to withdraw without consequence.
3. **Bystander policy** — zone signage, crew briefing for non-wearers, capture-indicator explanation, objection path.
4. **Data handling** — on-device processing statement, what leaves the phone (reviewed labeled frames only), retention clock, deletion path.
5. **No-surveillance clause** — explicit: no individual identification, no face recognition, no performance monitoring, no disciplinary use — ever.
6. **Incident protocol** — site protocol first, preserved logs, joint review, disclosure duties.

## Who's on the ground

- **Pilot lead (us)** — on site weeks 1 and 4, daily remote triage between.
- **Safety observer** — the site's own safety person or our SME embedded; owns the ground-truth log, blind to model output during shifts.
- **Site sponsor** — access, crew scheduling, first escalation point.
- **ML engineer (remote)** — nightly triage, labels hard frames, ships the week-2 update.

## What the pilot ships

- **The pilot report** — pass-bar table, failure-mode dispositions, SME signature. The document sales and investors get.
- **Model + policy v2** — retrained on real POV footage; the flywheel now runs on customer data.
- **The consent pack as a template** — reusable per site from now on.
- **Case-study raw material** — verbatims, before/after numbers, cleared footage.

**Exit criteria:** week-4 frozen-build numbers hit the pass bar, zero safety
regressions, the SME signs the failure-mode review, and a majority of the crew
would keep wearing it. Any critical-class miss without a disposition blocks
sign-off.

**Why this phase matters commercially:** it produces the three assets a safety
product sells on — a signed report with field numbers, a reference customer, and
proprietary training data from real work. If the pass bar isn't hit, the report
still ships: it says which classes fell short and by how much, and those loop
back through Phase 2 with a month of real footage in hand.

---

*Pass-bar targets are planning defaults to ratify with the site sponsor and SME
before week 1. Ground truth assumes an observer log; reconcile against the
site's existing incident/near-miss reporting where present. Consent-pack legal
review can take 4–8 weeks — start before Phase 3 completes.*
