# Phase 0 — Scaffold and database

**Time:** ~0:45  
**Status:** 🟨 Almost done — run `schema.sql` in Supabase  
**Depends on:** [Pre-phase](./00-pre-setup-sourcing.md)  
**Next:** [Phase 1 — Data loader](./02-phase-1-data-loader.md)

← [All phases](../PHASES.md) · Spec: [`projects.md`](../projects.md) §3, §4.11, §4.12 · Prompt: §7 P0

---

## Build

- Repo layout: `server/` (Express + TypeScript) and `web/` (Vite + React + TypeScript + Tailwind + React Router)
- `GET /api/health` → `{ok:true}`
- `.env.example`, `server/schema.sql`, Vite proxy `/api` → server
- `.cursor/rules/project.mdc` from `projects.md` §6
- Run `schema.sql` in the Supabase SQL editor yourself

---

## What was done

- [x] Root `npm run dev` (server + web via concurrently)
- [x] Express server with `GET /api/health` → `{ok:true}`
- [x] Vite + React + TS + Tailwind + React Router; blank page
- [x] Vite proxy `/api` → `http://localhost:3001`
- [x] `server/schema.sql` from §4.11
- [x] `.cursor/rules/project.mdc`
- [x] Folder layout stubs under `server/src/` and `web/src/`

---

## Your remaining step (Supabase)

1. Open Supabase → **SQL Editor**
2. Paste contents of `server/schema.sql`
3. Run it
4. Confirm tables exist: `members`, `member_markers`, `analyses`, `playbooks`, `playbook_items`, `audit_log`, `llm_cache`

---

## Verify

- [x] `npm run dev` starts server and web without errors
- [x] Web loads blank page, no console errors
- [x] `/api/health` returns `{ok:true}` through the proxy
- [ ] All 7 tables exist in Supabase (`members`, `member_markers`, `analyses`, `playbooks`, `playbook_items`, `audit_log`, `llm_cache`)
- [x] `.env` is gitignored; no secrets in committed files

---

## Gate

After schema is applied → open [Phase 1](./02-phase-1-data-loader.md).
