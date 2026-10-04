# Phase 7 — API, persistence, audit, seed

**Time:** ~1:00  
**Status:** ✅ Code done — run `schema.sql` then `npm run seed` in Supabase  
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

## What was done

- [x] `server/src/db.ts` + `db.memory.ts`
- [x] `server/src/api/audit.ts` + `routes.ts` + `app.ts`
- [x] `server/scripts/seed.ts`
- [x] `server/tests/api.test.ts` (mocked db) — 5 tests green
- [x] No service role key under `web/`

---

## Your remaining step

1. Supabase → SQL Editor → run `server/schema.sql`
2. `cd server && npm run seed`
3. Optional curl checks against `npm run dev`

---

## Verify

- [x] API unit tests: analyze without confirmed → 400; approve pending → 409; edit after approve → 400; audit rows written
- [ ] `npm run seed` → 3 members with `pseudo_id` *(needs schema applied)*
- [ ] Live curl anonymisation / analyze / approve *(after seed)*
- [x] Service role key never appears under `web/`

---

## Gate

After schema + seed → open [Phase 8](./09-phase-8-ui-list-anonymise.md).
