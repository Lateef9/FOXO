# Final — End-to-end acceptance

**Time:** ~0:30  
**Status:** ☐ Not started  
**Depends on:** [Phases 0–11](../PHASES.md) + finished sourcing (`projects.md` §5.7)

← [All phases](../PHASES.md) · Spec: [`projects.md`](../projects.md) §8

---

## Before you start

- [ ] Sourcing complete: every rule/intervention has real `source` + `evidence_strength`
- [ ] Re-seed a clean database (`npm run seed`)

---

## Run by hand

1. [ ] Members list: 3 members, all “Report received”
2. [ ] Meera anonymise: identifiers highlighted; clean has tags
3. [ ] Confirm: overview + findings match §8; every finding has a reasoning chain
4. [ ] Draft playbook: weekly cap holds; foundation 1–2; supplements 7–12 with “dose set by doctor”; week 12 retest
5. [ ] Approve blocked while pending; decide all items; approve
6. [ ] Print page correct; every item has a source
7. [ ] Audit page records the session
8. [ ] Repeat steps 2–5 quickly for Arjun and Rohan
9. [ ] `GET /api/meta` → **zero** unverified rules and interventions
10. [ ] Full test suite green
11. [ ] Search codebase: member names/phones/emails only in `members.json`, seed, and tests — never raw in LLM payload paths

---

## Expected engine results (§8)

| Member | Rules that fire | Top cluster | Stages |
|---|---|---|---|
| Meera (m1) | `functional_b12`, `early_insulin_resistance` | `methylation` | Cognition + Metabolic: compensating; others healthy |
| Arjun (m2) | `early_insulin_resistance`, `tg_hdl_pattern`, `ferritin_inflammation`, `chronic_low_grade_inflammation` | `inflammation` | Metabolic, Cardiovascular, Immunity: strained; Gut/nutrient, Detox: compensating; Cognition, Hormonal: healthy |
| Rohan (m3) | `micronutrient_pattern` | `gut_absorption` | Gut/nutrient: strained; Cognition: compensating; others healthy |

For all three: Endurance and Musculoskeletal = Not assessed.

---

## Done when

Every checkbox above is checked.

← Previous: [Phase 11](./12-phase-11-audit-readme.md)
