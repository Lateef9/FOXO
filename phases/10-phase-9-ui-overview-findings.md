# Phase 9 — UI: overview + findings

**Time:** ~1:00  
**Status:** ✅ Done  
**Depends on:** [Phase 8](./09-phase-8-ui-list-anonymise.md)  
**Next:** [Phase 10 — Playbook UI](./11-phase-10-ui-playbook.md)

← [All phases](../PHASES.md) · Spec: [`projects.md`](../projects.md) §4.10, §8 · Prompt: §7 P9

---

## Build

- `/members/:id` tabs: Overview, Findings, Playbook (placeholder OK)
- 9 system cards + spectrum legend (Diseased/Comorbid = doctor-assessed)
- Findings: ranked clusters, expandable reasoning chain, UNVERIFIED / template badges
- Label: “Suggested placement. Doctor decides.”

---

## What was done

- [x] `MemberPage` with Overview / Findings / Playbook tabs
- [x] `OverviewTab` — 9 systems, stage chips, legend, doctor-decides label
- [x] `FindingsTab` — ranked clusters, expand reasoning, UNVERIFIED + template badges
- [x] API helpers: `getMember`, `getAnalysis`

---

## Verify

- [x] Meera engine: Cognition + Metabolic Compensating; Endurance + Musculoskeletal Not assessed
- [x] Arjun engine: Strained on Metabolic, Cardiovascular, Immunity; top `inflammation`
- [x] Findings order matches §8 (analyze tests + probe)
- [x] Unverified badges expected (`source: TODO` still present)
- [x] Browser UI checked via `npm run dev:local` (memory DB): Members list, Meera/Arjun Overview + Findings match §8; UNVERIFIED + template badges show

**Note:** Supabase still missing tables — run `server/schema.sql` then `npm run seed` for real DB. Local check used `USE_MEMORY_DB=1`.

---

## Gate

UI matches §8 for Meera + Arjun → open [Phase 10](./11-phase-10-ui-playbook.md).
