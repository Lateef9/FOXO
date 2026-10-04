# Phase 5 — Playbook generator

**Time:** ~1:15  
**Status:** ✅ Done  
**Depends on:** [Phase 3](./04-phase-3-spectrum-clusters.md) (clusters); [Phase 4](./05-phase-4-anonymiser.md) optional  
**Next:** [Phase 6 — LLM wording](./07-phase-6-llm-wording.md)

← [All phases](../PHASES.md) · Spec: [`projects.md`](../projects.md) §4.7 · Prompt: §7 P5

---

## Build

- Order interventions by cluster rank then `order`
- Phase windows: foundation 1–2; nutrition/movement 3–6; supplement/review 7–12; testing uses own `weeks`
- Cap: ≤2 items *start* per week; overflow → next week in window or `unscheduled`
- Week-12 Retest from cluster `retest_markers`
- Interaction warnings on overlapping tagged pairs
- No doses in any item

---

## What was done

- [x] `server/src/playbook/generate.ts` — `generatePlaybook`
- [x] `server/tests/playbook.test.ts` — caps, phases, Meera, Rohan iron/zinc, unscheduled overflow, retest

---

## Verify

- [x] Tests pass
- [x] Never more than 2 starts in any week
- [x] Foundation in 1–2; supplements in 7–12
- [x] Rohan: no overlapping iron/zinc without warning
- [x] Items beyond capacity in `unscheduled`, not dropped
- [x] Meera plan includes `m_foods`, `m_review_meds`, and shared foundation items
- [x] Every item has `source`; no dose strings

---

## Gate

Schedule + interaction tests green → open [Phase 6](./07-phase-6-llm-wording.md).
