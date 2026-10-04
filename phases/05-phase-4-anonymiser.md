# Phase 4 — Anonymiser

**Time:** ~0:30  
**Status:** ✅ Done  
**Depends on:** [Phase 3](./04-phase-3-spectrum-clusters.md)  
**Next:** [Phase 5 — Playbook](./06-phase-5-playbook.md)

← [All phases](../PHASES.md) · Spec: [`projects.md`](../projects.md) §4.6 · Prompt: §7 P4

---

## Build

- `anonymise(text, member)` → `{clean, removed}`
- `pseudoId` = `P-` + first 6 hex of sha256(id + salt)
- Replace name parts, city, email, phone, dates; keep age
- Case-insensitive matching

---

## What was done

- [x] `server/src/privacy/anonymise.ts` — `anonymise`, `pseudoId`
- [x] `server/tests/anonymise.test.ts` — all 3 members, dates, case, stability

---

## Verify

- [x] Tests pass for all three members
- [x] Meera cleaned text: no name, no Bengaluru, no phone, no email; still readable; age kept
- [x] `pseudoId` stable across runs and different per member

---

## Gate

No identifiers in clean text → open [Phase 5](./06-phase-5-playbook.md).
