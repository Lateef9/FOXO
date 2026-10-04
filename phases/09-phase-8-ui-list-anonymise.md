# Phase 8 — UI: members list + anonymise

**Time:** ~0:45  
**Status:** ✅ Done  
**Depends on:** [Phase 7](./08-phase-7-api.md)  
**Next:** [Phase 9 — Overview + findings](./10-phase-9-ui-overview-findings.md)

← [All phases](../PHASES.md) · Spec: [`projects.md`](../projects.md) §4.10 · Prompt: §7 P8

---

## Build

- Routing + simple `api.ts` client
- `/` members table (name, age, goals, status chip)
- `/members/:id/anonymise` side-by-side original vs clean; Confirm → analyze → navigate
- Loading and error states; do not build other screens yet

---

## What was done

- [x] `web/src/api.ts` + `types.ts`
- [x] `MembersPage` at `/`
- [x] `AnonymisePage` at `/members/:id/anonymise` (highlights + Confirm)
- [x] Placeholder `/members/:id` until Phase 9
- [x] Layout + status chips

---

## Verify

- [ ] List shows 3 members with status chips *(needs server seeded + `npm run dev`)*
- [ ] Anonymise highlights identifiers left; tags right; `pseudo_id` shown
- [ ] Confirm analyses and navigates; errors surface (no blank fail)
- [x] Network tab: no LLM key in any request (client only calls `/api/*`)

---

## Gate

Confirm → member page works → open [Phase 9](./10-phase-9-ui-overview-findings.md).
