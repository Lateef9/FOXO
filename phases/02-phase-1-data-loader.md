# Phase 1 — Data loader and validation

**Time:** ~0:30  
**Status:** ✅ Done  
**Depends on:** [Phase 0](./01-phase-0-scaffold.md)  
**Next:** [Phase 2 — Classify + rules](./03-phase-2-classify-rules.md)

← [All phases](../PHASES.md) · Spec: [`projects.md`](../projects.md) §4.1, §4.3, §5 · Prompt: §7 P1

---

## Build

1. Paste data files into `server/data/` **yourself** (do not let Cursor invent them):
   - `markers.yaml`, `clusters.yaml`, `rules.yaml`, `interventions.yaml`, `interactions.yaml`, `members.json`
2. Types + Zod schemas; loader validates at startup
3. Fail loudly on unknown marker/cluster references
4. `GET /api/meta` with counts + unverified (`source === "TODO"`)
5. Vitest: unknown marker in a rule is rejected

---

## What was done

- [x] `server/src/types.ts` — Zod schemas + types
- [x] `server/src/loader.ts` — load YAML/JSON, cross-ref validation, meta counts
- [x] `GET /api/meta` wired; bad data → process exits at startup
- [x] `server/tests/loader.test.ts` (5 tests)
- [x] `server/data/` left unchanged

---

## Verify

- [x] `GET /api/meta` → 20 markers, 6 rules, 4 clusters, 19 interventions; unverified > 0 (`6` / `19`)
- [x] `fake_marker` in a rule → clear error / refused load
- [x] Tests pass (`npm test` in `server/`)
- [x] `server/data/` unchanged

---

## Gate

Meta counts correct + loader tests green → open [Phase 2](./03-phase-2-classify-rules.md).
