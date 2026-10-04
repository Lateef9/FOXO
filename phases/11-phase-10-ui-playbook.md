# Phase 10 — UI: playbook, approve, print

**Time:** ~1:15  
**Status:** ☐ Not started  
**Depends on:** [Phase 9](./10-phase-9-ui-overview-findings.md)  
**Next:** [Phase 11 — Audit + README](./12-phase-11-audit-readme.md)

← [All phases](../PHASES.md) · Spec: [`projects.md`](../projects.md) §4.7, §4.10 · Prompt: §7 P10

---

## Build

- Draft playbook button; 12-week timeline + item list
- Accept / Edit / Reject; unscheduled list
- Approve disabled while pending remain; locks after approval
- `/print/:playbookId` print CSS + reviewer line

---

## Cursor prompt

```
Read @PROJECT.md sections 4.7 and 4.10. Build the Playbook tab: a Draft playbook button (POST /playbook), then a 12-week timeline plus an item list. Each item shows title, weeks, linked finding, why_this, source, evidence label, warning (if any) and a "dose set by doctor" note where requires_doctor_dose is true. Buttons: Accept, Edit (inline text edit), Reject. Show the unscheduled items in a "Not scheduled" list. The Approve button is disabled while any item is pending and shows how many remain. After approval all controls lock. Add /print/:playbookId: a print-friendly page (no navigation, print CSS) with member pseudo_id, items with sources, "Reviewed by {doctor} on {date}", and a Print button calling window.print().
```

---

## Verify

- [ ] Approve disabled with pending; counter drops as decisions are made
- [ ] Edit persists across refresh
- [ ] After approve: controls locked; list status = Approved
- [ ] Print/PDF clean; sources + “Reviewed by …” line present
- [ ] Rohan shows iron-related warning where applicable

---

## Gate

Full review → approve → print → open [Phase 11](./12-phase-11-audit-readme.md).
