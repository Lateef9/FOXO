# Phase 2 — Classification and rules engine

**Time:** ~1:15  
**Status:** ✅ Done  
**Depends on:** [Phase 1](./02-phase-1-data-loader.md)  
**Next:** [Phase 3 — Spectrum + clusters](./04-phase-3-spectrum-clusters.md)

← [All phases](../PHASES.md) · Spec: [`projects.md`](../projects.md) §4.2, §4.3 · Prompt: §7 P2

---

## Build

- `classify.ts`: inclusive boundaries per status table in §4.2
- `rules.ts`: `marker`, `count_of`, `symptom_any`; missing marker → false, never throw
- Pure functions only (no DB, no LLM)
- Tests: +/− case per rule (6+6), boundary values, missing marker

---

## What was done

- [x] `server/src/engine/classify.ts` — `classifyMarker`, `classifyAll`
- [x] `server/src/engine/rules.ts` — `evaluateRules` → findings
- [x] `server/tests/classify-rules.test.ts` — boundaries, missing marker, +/− per rule, Meera smoke

---

## Verify

- [x] All rule tests pass (positive + negative per rule — 6 + 6)
- [x] Boundary tests assert inclusive lab/optimal edges
- [x] Meera’s markers: `functional_b12` and `early_insulin_resistance` fire; `tg_hdl_pattern` does not

---

## Gate

Meera smoke check + tests green → open [Phase 3](./04-phase-3-spectrum-clusters.md).
