# Phase 8 — UI: members list + anonymise

**Time:** ~0:45  
**Status:** ☐ Not started  
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

## Cursor prompt

```
Read @PROJECT.md section 4.10. In web/, build routing, a simple api.ts client, the Members table at "/" (name, age, goals, status chip) and the anonymisation screen at "/members/:id/anonymise": original text on the left, clean text on the right with removed items highlighted, the pseudo_id shown, and a Confirm and analyse button that POSTs /analyze with {confirmed:true} then navigates to /members/:id. Clean, simple Tailwind styling. Show loading and error states. Do not build other screens yet.
```

---

## Verify

- [ ] List shows 3 members with status chips
- [ ] Anonymise highlights identifiers left; tags right; `pseudo_id` shown
- [ ] Confirm analyses and navigates; errors surface (no blank fail)
- [ ] Network tab: no LLM key in any request

---

## Gate

Confirm → member page works → open [Phase 9](./10-phase-9-ui-overview-findings.md).
