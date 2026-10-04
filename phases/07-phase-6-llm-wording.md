# Phase 6 — LLM wording with guards

**Time:** ~0:45  
**Status:** ✅ Done (mocked tests green; real LLM optional)  
**Depends on:** [Phase 4](./05-phase-4-anonymiser.md) + [Phase 5](./06-phase-5-playbook.md)  
**Next:** [Phase 7 — API](./08-phase-7-api.md)

← [All phases](../PHASES.md) · Spec: [`projects.md`](../projects.md) §4.8 · Prompt: §7 P6

---

## Build

- Payload from anonymised structured data only
- Zod schema; reject invented numbers / bad schema; template fallback
- Cache by SHA-256 in `llm_cache`; mark `llm` vs `template`
- System prompt forbids new facts, numbers, doses, brand names, diagnosis wording

---

## What was done

- [x] `server/src/llm/guard.ts` — schema + invented-number guard
- [x] `server/src/llm/wording.ts` — payload, templates, OpenAI client, generateWording
- [x] `server/src/llm/cache.ts` — memory + Supabase `llm_cache`
- [x] `server/tests/wording.test.ts` — privacy, invented number, malformed, valid, cache, 401 fallback

---

## Verify

- [x] Mocked tests: invented number → fallback; malformed → fallback; valid → pass
- [x] Payload contains no name/city/phone/email for all three members
- [ ] Real call for Meera: plain language, no invented numbers/doses/diagnosis *(run manually if key/model available)*
- [x] Second identical call hits cache (mocked + memory cache)
- [x] Invalid API key / LLM error → template wording, tagged `template`

---

## Gate

Identifier + guard tests green → open [Phase 7](./08-phase-7-api.md).
