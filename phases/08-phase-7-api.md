# Phase 7 — API, persistence, audit, seed

**Time:** ~1:00  
**Status:** ☐ Not started  
**Depends on:** [Phases 1–6](../PHASES.md)  
**Next:** [Phase 8 — UI list + anonymise](./09-phase-8-ui-list-anonymise.md)

← [All phases](../PHASES.md) · Spec: [`projects.md`](../projects.md) §4.9, §4.11 · Prompt: §7 P7

---

## Build

- All endpoints in §4.9
- Seed script; audit on every listed action
- Status flow: `report_received` → `analysed` → `in_review` → `approved`
- Analyze requires `{confirmed:true}`; approve blocks if any item pending
- PATCH returns 400 if playbook already approved
- Service role key used server-only

---

## Cursor prompt

```
Read @PROJECT.md sections 4.9 and 4.11. Implement server/src/db.ts (Supabase client using the service role key, server only), server/scripts/seed.ts (loads members.json into members and member_markers, computing pseudo_id), server/src/api/audit.ts (writes audit_log rows with actor = DEMO_DOCTOR) and server/src/api/routes.ts with every endpoint in 4.9 and its rules: analyze requires {confirmed:true} else 400; approve returns 409 if any item is pending; PATCH returns 400 if the playbook is approved; every listed action writes an audit entry. Update member status as the workflow advances (analysed, in_review, approved). Write API tests (supertest or direct handler tests with a mocked db) for: analyze without confirmed, approve with pending items, edit after approval, and audit entries being written.
```

---

## Verify

- [ ] `npm run seed` → 3 members with `pseudo_id`
- [ ] `GET /api/members/m1/anonymisation` returns original + clean; does **not** call LLM
- [ ] `POST /analyze` with `{}` → 400; with `{"confirmed":true}` → analysis
- [ ] Approve with pending → 409; after all decided → 200
- [ ] `audit_log` has a row for each action
- [ ] Service role key never appears under `web/`

---

## Gate

curl/API checks + audit rows → open [Phase 8](./09-phase-8-ui-list-anonymise.md).
