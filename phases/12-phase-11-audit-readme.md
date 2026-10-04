# Phase 11 — Audit page, polish, README

**Time:** ~0:45  
**Status:** ☐ Not started  
**Depends on:** [Phase 10](./11-phase-10-ui-playbook.md)  
**Next:** [Final — Acceptance](./13-final-acceptance.md)

← [All phases](../PHASES.md) · Spec: [`projects.md`](../projects.md) · Prompt: §7 P11

---

## Build

- `/audit` table + nav link
- Demo doctor header; banner: synthetic data / not medical advice
- `README.md`: what it is, Mermaid diagram, run steps, pipeline, limitations, testing
- Do not add features beyond the spec

---

## Cursor prompt

```
Read @PROJECT.md. Build /audit: a table of the latest audit entries (time, actor, member, action) with a link in the nav. Add a header showing the demo doctor name and a banner "Synthetic data. Educational proof of approach, not medical advice." Write README.md with: what it is, a Mermaid architecture diagram, how to run (env, schema, seed, dev), how the pipeline works, a Limitations section copied from PROJECT.md section 1, and a Testing section. Do not add features.
```

---

## Verify

- [ ] Audit lists session actions in time order
- [ ] README setup steps work from a fresh clone
- [ ] Synthetic-data banner on every page

---

## Gate

Polish done → open [Final acceptance](./13-final-acceptance.md).
