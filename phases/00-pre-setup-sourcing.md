# Pre-phase — Setup and sourcing

**Time:** ~1:30  
**Status:** 🟨 In progress (local scaffolding done; secrets + citations need you)  
**Next:** [Phase 0 — Scaffold](./01-phase-0-scaffold.md)

← [All phases](../PHASES.md) · Spec: [`projects.md`](../projects.md) §3, §5.7 · Tracker: [`SOURCING.md`](../SOURCING.md)

---

## Ground rules

- Cursor never invents medical content (ranges, rules, citations).
- You own `server/data/` — Cursor must not invent or silently edit it.
- No secrets committed (`.env` stays local).

---

## Do

1. Create a Supabase project; copy project URL + service role key.
2. Get an LLM API key.
3. Prepare local `.env` (do not commit):

```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
LLM_API_KEY=
LLM_MODEL=
DEMO_DOCTOR="Dr. Demo"
PSEUDO_SALT=<any-random-string>
```

4. Start sourcing (`projects.md` §5.7):
   - For every rule and intervention: find a real citation, set `source` and `evidence_strength` (`established` | `emerging`).
   - Confirm each marker range in `markers.yaml` against a cited reference.
   - If you cannot source an item in ~15 minutes, delete it — do not ship unsourced content.
   - Sourcing can continue in parallel with later phases; **must be finished before Final**.

---

## What was done for you

- [x] `.gitignore` (includes `.env`)
- [x] `.env.example`
- [x] `.env` with `DEMO_DOCTOR` + generated `PSEUDO_SALT` (keys still empty)
- [x] `server/data/` pasted from `projects.md` §5 (markers, clusters, rules, interventions, interactions, members) — all `source` / `evidence_strength` left as `TODO`
- [x] [`SOURCING.md`](../SOURCING.md) checklist started for human citations

---

## What you must finish (cannot be done by Cursor)

### 1. Supabase

1. Go to [https://supabase.com](https://supabase.com) → New project.
2. Project Settings → API:
   - Project URL → `SUPABASE_URL` in `.env`
   - `service_role` key (secret) → `SUPABASE_SERVICE_KEY` in `.env`
3. Schema SQL comes in Phase 0 (`server/schema.sql`).

### 2. LLM key

1. Create an API key with your provider (e.g. OpenAI).
2. Put it in `.env` as `LLM_API_KEY`.
3. Set `LLM_MODEL` (e.g. `gpt-4o-mini` or whatever you choose).

### 3. Sourcing

Open [`SOURCING.md`](../SOURCING.md). Fill real citations into `server/data/rules.yaml` and `interventions.yaml` yourself. Do not ask an LLM for citations.

---

## Verify

- [x] Supabase project exists → URL set (`fckaczcuyfjfctshkoyn`); still need service role key in `.env`
- [ ] LLM key works (simple test call OK) → paste `LLM_API_KEY` into `.env` (`LLM_MODEL=gpt-6-luna` already set)
- [x] `.env` values ready locally and not committed *(structure + salt done; keys pending)*
- [x] Sourcing started (or finished); plan to hit zero unverified before Final *(tracker + data files ready)*

---

## Gate

When Supabase + LLM keys are in `.env` → open [Phase 0](./01-phase-0-scaffold.md).  
Sourcing can continue in parallel.
