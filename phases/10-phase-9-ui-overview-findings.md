# Phase 9 — UI: overview + findings

**Time:** ~1:00  
**Status:** ☐ Not started  
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

## Cursor prompt

```
Read @PROJECT.md section 4.10. Build the member page at /members/:id with tabs Overview, Findings and Playbook (Playbook can be a placeholder for now). Overview: 9 system cards with a stage chip (Healthy, Compensating, Strained, Not assessed), the reason line, and a legend that also lists Diseased and Comorbid marked "doctor-assessed". Findings: ranked cluster cards showing the doctor_summary; expanding a card shows the reasoning chain: each marker with value, unit and status, the rule title, the inference text, evidence_strength and source. Show a red UNVERIFIED SOURCE badge where source is TODO, and a small "template" tag where wording fell back. Add the label "Suggested placement. Doctor decides." on the overview.
```

---

## Verify

- [ ] Meera: Cognition + Metabolic Compensating; Endurance + Musculoskeletal Not assessed
- [ ] Arjun: Strained on Metabolic, Cardiovascular, Immunity
- [ ] Findings order matches §8; expanded cards show real marker values
- [ ] Unverified badges present until sourcing done
- [ ] Layout OK at laptop width and ~800px

---

## Gate

UI matches §8 for Meera + Arjun → open [Phase 10](./11-phase-10-ui-playbook.md).
