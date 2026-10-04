# Primer Copilot — Phase Index

Open **one phase file at a time**. Complete its **Verify** list before starting the next.

Full spec + data YAML: [`projects.md`](./projects.md)

**Rule:** do not skip verification. A phase is done only when every verify item is checked.

---

## Status tracker

| Phase | File | Time | Status |
|---|---|---|---|
| Pre | [00-pre-setup-sourcing.md](./phases/00-pre-setup-sourcing.md) | 1:30 | 🟨 |
| 0 | [01-phase-0-scaffold.md](./phases/01-phase-0-scaffold.md) | 0:45 | 🟨 |
| 1 | [02-phase-1-data-loader.md](./phases/02-phase-1-data-loader.md) | 0:30 | ✅ |
| 2 | [03-phase-2-classify-rules.md](./phases/03-phase-2-classify-rules.md) | 1:15 | ✅ |
| 3 | [04-phase-3-spectrum-clusters.md](./phases/04-phase-3-spectrum-clusters.md) | 1:15 | ✅ |
| 4 | [05-phase-4-anonymiser.md](./phases/05-phase-4-anonymiser.md) | 0:30 | ✅ |
| 5 | [06-phase-5-playbook.md](./phases/06-phase-5-playbook.md) | 1:15 | ✅ |
| 6 | [07-phase-6-llm-wording.md](./phases/07-phase-6-llm-wording.md) | 0:45 | ☐ |
| 7 | [08-phase-7-api.md](./phases/08-phase-7-api.md) | 1:00 | ☐ |
| 8 | [09-phase-8-ui-list-anonymise.md](./phases/09-phase-8-ui-list-anonymise.md) | 0:45 | ☐ |
| 9 | [10-phase-9-ui-overview-findings.md](./phases/10-phase-9-ui-overview-findings.md) | 1:00 | ☐ |
| 10 | [11-phase-10-ui-playbook.md](./phases/11-phase-10-ui-playbook.md) | 1:15 | ☐ |
| 11 | [12-phase-11-audit-readme.md](./phases/12-phase-11-audit-readme.md) | 0:45 | ☐ |
| Final | [13-final-acceptance.md](./phases/13-final-acceptance.md) | 0:30 | ☐ |

Total: ~10–12 hours (including sourcing).

---

## Ground rules (every phase)

- Cursor never invents medical content (ranges, rules, citations).
- Never edit `server/data/` except when *you* paste the YAML/JSON from `projects.md` §5.
- No doses, no brand names, no identifiers sent to the LLM.
- Engine is pure functions + Vitest; UI comes after the engine.
- Fix failing tests by fixing code, never by weakening tests.
- Commit after each phase that passes verification.

---

## Doctor flow (quick reference)

```
List → Anonymise (Confirm) → Analyse → Overview / Findings → Draft playbook
  → Accept/Edit/Reject each item → Approve → Print → Audit
```

Deterministic code decides findings, ranking, and schedule. LLM only rewrites wording around code decisions.

---

## If stuck

| Problem | Fix |
|---|---|
| Cursor invents medical content | Revert; content only from `server/data/` |
| Test loosened to pass | Restore assertion; fix code |
| Extra auth/libs/features | Remove; only §3 / §4 stack |
| Giant files | Split per §4.12 |
| Raw history to LLM | Anonymised payload only; add identifier tests |
| Hard-coded member results | Remove; engine must work for any member |
| Edits to `server/data/*` | Revert; those files are yours |

Stuck >20 minutes: simplify UI (timeline graphic / edit history), keep rules + anonymiser + review gate.

---

## Start here

→ [Pre-phase — Setup and sourcing](./phases/00-pre-setup-sourcing.md)
