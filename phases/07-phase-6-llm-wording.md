# Phase 6 — LLM wording with guards

**Time:** ~0:45  
**Status:** ☐ Not started  
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

## Cursor prompt

```
Read @PROJECT.md section 4.8. Implement server/src/llm/wording.ts and guard.ts. Build the payload ONLY from anonymised data (cluster titles, rule inference text, marker names/values/statuses, pseudo_id, anonymised history text). Call the LLM with structured output validated by a Zod schema matching 4.8. Implement the guards: reject if the response contains any number that is not present in the payload; reject on schema failure; fall back to templates on rejection or error; cache by SHA-256 of the payload in the llm_cache table; mark each piece of wording as 'llm' or 'template'. The system prompt must forbid new facts, numbers, doses, brand names and diagnosis wording. Write Vitest tests with a mocked LLM client: a response with an invented number is rejected and falls back; a malformed response falls back; a valid response passes; the payload builder output contains none of the member's name, city, phone or email (test against all three members).
```

---

## Verify

- [ ] Mocked tests: invented number → fallback; malformed → fallback; valid → pass
- [ ] Payload contains no name/city/phone/email for all three members
- [ ] Real call for Meera: plain language, no invented numbers/doses/diagnosis
- [ ] Second identical call hits cache
- [ ] Invalid API key → template wording, tagged `template`

---

## Gate

Identifier + guard tests green → open [Phase 7](./08-phase-7-api.md).
