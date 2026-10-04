# Phase 3 — Spectrum, clusters, ranking, analyze

**Time:** ~1:15  
**Status:** ✅ Done  
**Depends on:** [Phase 2](./03-phase-2-classify-rules.md)  
**Next:** [Phase 4 — Anonymiser](./05-phase-4-anonymiser.md)

← [All phases](../PHASES.md) · Spec: [`projects.md`](../projects.md) §4.4, §4.5, §8 · Prompt: §7 P3

> **Most important gate in the build.** Do not proceed until the acceptance table matches.

---

## Build

- `spectrum.ts`, `cluster.ts`, `analyze.ts` (pure; no DB/LLM)
- Score = severity × reversibility × findings count × symptom multiplier; top 5
- Tests against §8 expected results for all three members

---

## What was done

- [x] `server/src/engine/spectrum.ts`
- [x] `server/src/engine/cluster.ts` (tie-break: score → symptom multiplier → reversibility → severity)
- [x] `server/src/engine/analyze.ts`
- [x] `server/tests/analyze.test.ts` against §8

---

## Verify (acceptance table)

| Member | Rules that fire | Top cluster | Stages |
|---|---|---|---|
| Meera (m1) | `functional_b12`, `early_insulin_resistance` | `methylation` | Cognition + Metabolic: compensating; others healthy |
| Arjun (m2) | `early_insulin_resistance`, `tg_hdl_pattern`, `ferritin_inflammation`, `chronic_low_grade_inflammation` | `inflammation` (then `insulin_resistance`) | Metabolic, Cardiovascular, Immunity: strained; Gut/nutrient, Detox: compensating; Cognition, Hormonal: healthy |
| Rohan (m3) | `micronutrient_pattern` | `gut_absorption` | Gut/nutrient: strained; Cognition: compensating; others healthy |

- [x] All three members match the table above
- [x] Meera top = `methylation`; Arjun top = `inflammation`; Rohan top = `gut_absorption`
- [x] `endurance` and `musculoskeletal` are `not_assessed` for every member
- [x] Every system has a non-empty reason string

---

## Gate

§8 engine table fully green → open [Phase 4](./05-phase-4-anonymiser.md).
