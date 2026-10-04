# Primer Copilot: one-day build guide (Cursor)

A doctor-facing tool: a member's history and biomarker panel go in; a ranked set of findings and a drafted 12-week playbook come out; the doctor reviews every item before anything is approved.

All data is synthetic. This is a proof of approach built from public clinical knowledge, not a medical device.

---

## 0. How to use this file

1. Save this file as `PROJECT.md` in the repo root. Cursor reads it whenever you write `@PROJECT.md` in a prompt.
2. Do the sourcing work in section 5.7 yourself (citations). Cursor must never write citations or medical ranges.
3. Run the prompts in section 7 in order: P0 to P11. After each prompt, do its Check list before moving on.
4. Finish with the acceptance test in section 8.

Time budget (10-12 hours including sourcing):

| Step | Time |
|---|---|
| Sourcing (5.7), done in parallel or first | 1:30 |
| P0 scaffold + Supabase | 0:45 |
| P1 data loader | 0:30 |
| P2 classify + rules engine | 1:15 |
| P3 spectrum + clusters + ranking | 1:15 |
| P4 anonymiser | 0:30 |
| P5 playbook generator | 1:15 |
| P6 LLM wording | 0:45 |
| P7 API + persistence + audit | 1:00 |
| P8 UI: list + anonymise screen | 0:45 |
| P9 UI: overview + findings | 1:00 |
| P10 UI: playbook editor + approve + print | 1:15 |
| P11 audit page, badges, README | 0:45 |

---

## 1. What you are building

### The flow (doctor's view)

1. **Member list**: table of members with a status (Report received, Analysed, In review, Approved).
2. **Anonymisation check**: the doctor sees the member's history text next to a cleaned version with identifiers replaced by tags. Only the cleaned version may reach the LLM. Doctor clicks Confirm.
3. **Analyse** (runs on confirm): classify markers, run rules, cluster findings, rank clusters, place systems on the Health Spectrum, get LLM wording.
4. **Overview**: 9 system cards on the spectrum (Healthy, Compensating, Strained). Two systems show "Not assessed" because blood markers cannot speak to them.
5. **Findings**: 3-5 ranked clusters. Each expands to a reasoning chain: markers, rule, source, evidence label.
6. **Draft playbook**: a 12-week timeline built by code. Each item shows the finding it addresses, source, evidence label, and any interaction warning.
7. **Review**: doctor Accepts, Edits, or Rejects each item. Approve stays locked until every item has a decision.
8. **Approve and print**: status becomes Approved, a print-friendly page opens (browser Save as PDF), and an audit entry is written.
9. **Audit page**: who viewed or changed what, and when.

### The design principle

Everything is deterministic code (classification, rules, clustering, ranking, playbook scheduling) except one thing: the LLM writes readable wording around results the code has already decided. The LLM never picks findings, interventions, or numbers.

### Honest limitations (put these in the README)

- Ranges and rules are simplified and not sex- or age-specific.
- The anonymiser is regex plus known-identifier replacement: demo-grade, for synthetic data. A real deployment needs an NER-based tool.
- Spectrum placement is a suggestion; the doctor decides.
- Diseased and Comorbid stages are never auto-assigned.

---

## 2. Ground rules (non-negotiable)

1. **Cursor never invents medical content.** Marker ranges, rules, interventions, evidence labels, and citations come only from the files in section 5. If something is missing, Cursor must stop and ask, not fill it in.
2. **Cursor never edits files in `server/data/`.** Only you do.
3. **No doses anywhere.** Supplement items show "dose set by doctor".
4. **Generic ingredients only.** No brand names.
5. **No identifiers to the LLM.** Name, phone, email, city, DOB must never appear in a prompt.
6. **Tests before UI.** The engine is pure functions with tests. UI comes after.
7. **No scope creep.** No auth system, no extra libraries beyond section 3, no features not in this file.
8. A test that fails is fixed by fixing the code, never by weakening the test.

---

## 3. Stack, accounts, setup

- Node 20+, npm
- React + Vite + TypeScript + Tailwind + React Router (folder `web/`)
- Express + TypeScript + Zod + `yaml` + Vitest (folder `server/`)
- Supabase (Postgres) via `@supabase/supabase-js`, used from the server only with the service role key
- One LLM provider SDK of your choice on the server (examples assume OpenAI-style structured output). Use a small, fast model.

Checklist before P0:

- [ ] Supabase project created; you have the project URL and service role key
- [ ] LLM API key
- [ ] Cursor open on an empty repo
- [ ] `.env` values ready: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `LLM_API_KEY`, `LLM_MODEL`, `DEMO_DOCTOR="Dr. Demo"`, `PSEUDO_SALT=any-random-string`

No login. Every request is attributed to `DEMO_DOCTOR` for the audit log.

---

## 4. Specification

### 4.1 Systems and markers

Nine systems appear on the overview (names from FOXO's public site):

`gut_nutrient` (shown as "Gut and nutrient status"), `cardiovascular`, `metabolic`, `detox`, `cognition`, `immunity`, `hormonal`, `endurance`, `musculoskeletal`

`endurance` and `musculoskeletal` have no markers in this build and always render as **Not assessed**.

Markers (20) are defined in `server/data/markers.yaml` (section 5.1).

### 4.2 Classification

For each marker value, with `lab = [lab_low, lab_high]` and `optimal = [opt_low, opt_high]`, boundaries inclusive:

| Condition | Status |
|---|---|
| value < lab_low | `below_lab` |
| value > lab_high | `above_lab` |
| within lab, value < opt_low | `below_optimal` |
| within lab, value > opt_high | `above_optimal` |
| otherwise | `optimal` |

"Within lab" means `optimal`, `below_optimal`, or `above_optimal`.

### 4.3 Rules engine

Rules are in `server/data/rules.yaml` (section 5.3). A rule fires when **all** entries in its `all` list are true. Condition types:

- `{marker, status_in: [...]}`: the marker's status is in the list
- `{count_of: [markers], status_in: [...], min: N}`: at least N of those markers have a status in the list
- `{symptom_any: [...]}`: the member has at least one of those symptoms

A fired rule produces a finding: `{rule_id, title, system, cluster, inference, markers_involved, evidence_strength, source}`.

Missing markers: a condition on a missing marker is false (never throws).

### 4.4 Spectrum placement (a suggestion, labelled as such)

For each system:

1. No markers in this build for that system → `not_assessed`
2. Any of its markers `below_lab` or `above_lab` → `strained`
3. Else any marker `below_optimal` or `above_optimal`, or any rule fired in that system → `compensating`
4. Else → `healthy`

Each stage gets a one-line `reason` listing the markers or rules that caused it.

### 4.5 Clusters and ranking

Cluster metadata is in `server/data/clusters.yaml`. A cluster exists when at least one of its rules fired.

- **severity** = highest stage among systems of its fired rules (compensating = 1, strained = 2)
- **reversibility** = highest `reversibility` among its fired rules
- **findings** = distinct non-optimal markers among the `all` markers plus `supporting_markers` of its fired rules
- **symptom multiplier** = 3 if any member symptom is in the cluster's `matches_symptoms`, else 1

`score = severity × reversibility × count(findings) × symptom multiplier`

Sort descending; ties broken by reversibility, then severity. Return the top 5.

### 4.6 Anonymiser

`anonymise(text, member)` returns `{clean, removed: [{type, original}]}`.

- Replace `member.name` (full name and each name part of 3+ letters) with `[NAME]`
- Replace `member.city` with `[CITY]`
- Regex: emails → `[EMAIL]`; phone numbers (Indian formats, with or without +91 and spaces) → `[PHONE]`; dates like `12/03/1990` or `12 March 1990` → `[DATE]`
- Case-insensitive. Age stays.
- Member gets `pseudo_id = "P-" + first 6 hex chars of sha256(member.id + PSEUDO_SALT)`.

### 4.7 Playbook generator

Input: ranked clusters (top 3) and the member. Output: playbook items.

1. For each top cluster, in rank order, take interventions from `interventions.yaml` whose `clusters` include it (an intervention with `clusters: [all]` is added once). Cluster order first, then the intervention's `order` field.
2. **Phases:** foundation items → weeks 1-2; nutrition and movement → weeks 3-6; supplement and review → weeks 7-12; testing items use their own `weeks` field.
3. **Weekly cap:** no more than 2 items may *start* in any one week. If a week is full, move the item to the next week within its phase window. If the phase window is full, put the item in `unscheduled` (shown in a "Not scheduled" list).
4. **Retest:** always add a week-12 item "Retest" listing the union of `retest_markers` of the top clusters.
5. **Interactions:** for every pair of scheduled items whose week ranges overlap, if their `tags` match a pair in `interactions.yaml`, attach that warning to both items.
6. Every item carries: `title, category, week_from, week_to, cluster, finding rule ids, source, evidence_strength, warning, requires_doctor_dose`.
7. Initial state of every item: `pending`.

### 4.8 LLM wording

One batch call per analysis (and one per playbook draft). Inputs are anonymised structured objects only (cluster title, rule inference text, marker names/values/statuses, pseudo_id, anonymised history).

Output (Zod-validated):

```
{ clusters: [{ cluster_id, doctor_summary (<=60 words), member_friendly (<=60 words) }],
  items:    [{ item_key, why_this (<=25 words) }] }
```

Prompt rules: use only facts in the input; no new numbers, doses, brand names, or recommendations; plain language; no diagnosis wording.

Guards:
- Reject the response if it contains any number not present in the input payload.
- Reject if it fails the schema.
- On rejection or API error: fall back to templates (the rule's `inference` text for clusters; the intervention title for items).
- Cache by SHA-256 of the payload in `llm_cache`.
- Log whether each piece of wording came from `llm` or `template`; show a small "template" tag in the UI when it fell back.

### 4.9 API (Express, all under `/api`)

| Method | Path | Does |
|---|---|---|
| GET | `/members` | list with status |
| GET | `/members/:id` | member + markers + classification (audit: view_member) |
| GET | `/members/:id/anonymisation` | `{original, clean, removed, pseudo_id}` (audit: view_anonymisation). Never calls the LLM. |
| POST | `/members/:id/analyze` | body `{confirmed: true}` required, else 400. Runs the pipeline, stores analysis (audit: analyze) |
| GET | `/members/:id/analysis` | latest analysis |
| POST | `/members/:id/playbook` | draft from latest analysis (audit: draft_playbook) |
| GET | `/playbooks/:id` | playbook + items |
| PATCH | `/playbooks/:id/items/:itemId` | body `{state: accepted|rejected|edited, edited_text?}` (audit: edit_item). 400 if playbook already approved. |
| POST | `/playbooks/:id/approve` | 409 if any item is `pending`. Sets approved, stamps doctor and time (audit: approve) |
| GET | `/audit` | latest 200 entries (audit: view_audit) |
| GET | `/meta` | counts of rules and interventions with unverified sources |

### 4.10 Screens (React)

| Route | Content |
|---|---|
| `/` | Members table, status chips |
| `/members/:id/anonymise` | Original vs clean side by side, removed items highlighted, Confirm button |
| `/members/:id` | Tabs: Overview, Findings, Playbook |
| `/print/:playbookId` | Print-friendly approved playbook (print CSS, no nav) |
| `/audit` | Table of audit entries |

Overview: 9 system cards with stage chip (Healthy / Compensating / Strained / Not assessed), reason line, and a legend that includes Diseased and Comorbid marked "doctor-assessed".

Findings: ranked cluster cards. Expanding shows the reasoning chain: markers (value, unit, status), rule title, inference, evidence label, source. A red **UNVERIFIED SOURCE** badge appears wherever the source is `TODO`.

Playbook: a 12-column week timeline plus a list. Each item has the finding, why-this line, source, evidence label, warning, and Accept / Edit / Reject. An item awaiting a dose shows "dose set by doctor". Approve is disabled until no `pending` remain.

### 4.11 Database (Supabase SQL)

```sql
create table members (
  id text primary key,
  pseudo_id text not null,
  name text not null, age int, sex text, city text, phone text, email text,
  goals text, symptoms text[] default '{}', history_text text,
  status text not null default 'report_received'
);
create table member_markers (
  member_id text references members(id) on delete cascade,
  code text not null, value numeric not null, unit text,
  primary key (member_id, code)
);
create table analyses (
  id uuid primary key default gen_random_uuid(),
  member_id text references members(id) on delete cascade,
  result jsonb not null, created_at timestamptz default now()
);
create table playbooks (
  id uuid primary key default gen_random_uuid(),
  member_id text references members(id) on delete cascade,
  analysis_id uuid references analyses(id),
  status text not null default 'draft',
  approved_by text, approved_at timestamptz,
  unscheduled jsonb default '[]', created_at timestamptz default now()
);
create table playbook_items (
  id uuid primary key default gen_random_uuid(),
  playbook_id uuid references playbooks(id) on delete cascade,
  item_key text, week_from int, week_to int, category text, title text,
  why_this text, wording_source text, cluster text, rule_ids text[],
  source text, evidence_strength text, warning text,
  requires_doctor_dose boolean default false,
  state text not null default 'pending', edited_text text
);
create table audit_log (
  id bigserial primary key, actor text not null,
  member_id text, action text not null, at timestamptz default now()
);
create table llm_cache (hash text primary key, response jsonb not null);
```

Rules, markers, clusters, and interventions live in YAML files, not the database.

### 4.12 Folder layout

```
primer-copilot/
  PROJECT.md
  .cursor/rules/project.mdc
  server/
    data/            markers.yaml clusters.yaml rules.yaml interventions.yaml interactions.yaml members.json
    src/
      engine/        classify.ts rules.ts spectrum.ts cluster.ts analyze.ts
      privacy/       anonymise.ts
      playbook/      generate.ts
      llm/           wording.ts guard.ts
      api/           routes.ts audit.ts
      db.ts loader.ts types.ts index.ts
    tests/
    scripts/seed.ts
  web/
    src/ pages/ components/ types.ts api.ts
```

`web/src/types.ts` is a copy of `server/src/types.ts` (copy the file, no shared package).

---

## 5. Content files (you own these; Cursor must not change them)

Create each file in `server/data/` with the content below, then complete the sourcing in 5.7.

### 5.1 `markers.yaml`

Ranges are **placeholders** (adult, simplified, not sex-specific). Replace or confirm each against a reference you cite before showing this to anyone.

```yaml
- {code: glucose_fasting, name: Fasting glucose, unit: mg/dL, system: metabolic, lab: [70, 99], optimal: [75, 90]}
- {code: insulin_fasting, name: Fasting insulin, unit: uIU/mL, system: metabolic, lab: [2, 25], optimal: [2, 8]}
- {code: hba1c, name: HbA1c, unit: "%", system: metabolic, lab: [4.0, 5.6], optimal: [4.8, 5.3]}
- {code: triglycerides, name: Triglycerides, unit: mg/dL, system: metabolic, lab: [0, 149], optimal: [0, 100]}
- {code: uric_acid, name: Uric acid, unit: mg/dL, system: metabolic, lab: [3.0, 7.0], optimal: [3.5, 5.5]}
- {code: hdl, name: HDL cholesterol, unit: mg/dL, system: cardiovascular, lab: [40, 100], optimal: [50, 90]}
- {code: ldl, name: LDL cholesterol, unit: mg/dL, system: cardiovascular, lab: [0, 129], optimal: [0, 100]}
- {code: hscrp, name: hs-CRP, unit: mg/L, system: immunity, lab: [0, 3.0], optimal: [0, 1.0]}
- {code: wbc, name: White blood cells, unit: 10^3/uL, system: immunity, lab: [4.0, 11.0], optimal: [4.5, 7.5]}
- {code: homocysteine, name: Homocysteine, unit: umol/L, system: cognition, lab: [5, 15], optimal: [5, 9]}
- {code: b12, name: Vitamin B12, unit: pg/mL, system: cognition, lab: [200, 900], optimal: [500, 900]}
- {code: vitamin_d, name: Vitamin D (25-OH), unit: ng/mL, system: gut_nutrient, lab: [30, 100], optimal: [40, 60]}
- {code: ferritin, name: Ferritin, unit: ng/mL, system: gut_nutrient, lab: [30, 300], optimal: [50, 150]}
- {code: transferrin_sat, name: Transferrin saturation, unit: "%", system: gut_nutrient, lab: [20, 50], optimal: [25, 40]}
- {code: hemoglobin, name: Haemoglobin, unit: g/dL, system: gut_nutrient, lab: [12.0, 17.5], optimal: [13.0, 16.0]}
- {code: zinc, name: Zinc, unit: ug/dL, system: gut_nutrient, lab: [60, 120], optimal: [80, 110]}
- {code: magnesium_rbc, name: RBC magnesium, unit: mg/dL, system: gut_nutrient, lab: [4.2, 6.8], optimal: [5.2, 6.5]}
- {code: alt, name: ALT, unit: U/L, system: detox, lab: [7, 55], optimal: [10, 30]}
- {code: ast, name: AST, unit: U/L, system: detox, lab: [10, 40], optimal: [10, 30]}
- {code: tsh, name: TSH, unit: mIU/L, system: hormonal, lab: [0.4, 4.0], optimal: [1.0, 2.5]}
```

### 5.2 `clusters.yaml`

```yaml
- id: methylation
  title: Possible functional B12 shortfall
  matches_symptoms: [brain_fog]
  retest_markers: [b12, homocysteine]
- id: insulin_resistance
  title: Early insulin resistance pattern
  matches_symptoms: [post_meal_crash]
  retest_markers: [glucose_fasting, insulin_fasting, hba1c, triglycerides, hdl]
- id: inflammation
  title: Low-grade inflammation
  matches_symptoms: [high_crp_without_illness]
  retest_markers: [hscrp, ferritin, transferrin_sat]
- id: gut_absorption
  title: Possible nutrient absorption issue
  matches_symptoms: [bloating]
  retest_markers: [ferritin, b12, vitamin_d, zinc, magnesium_rbc, hemoglobin]
```

### 5.3 `rules.yaml`

Every `source` and `evidence_strength` must be filled by you (section 5.7). `evidence_strength` is `established` or `emerging`.

```yaml
- id: functional_b12
  title: B12 normal but homocysteine elevated
  system: cognition
  cluster: methylation
  reversibility: 3
  all:
    - {marker: b12, status_in: [optimal, below_optimal, above_optimal]}
    - {marker: homocysteine, status_in: [above_optimal, above_lab]}
  supporting_markers: []
  inference: "Serum B12 reads normal, but elevated homocysteine can indicate B12 is not working effectively at tissue level."
  evidence_strength: TODO
  source: TODO

- id: early_insulin_resistance
  title: Normal glucose with elevated fasting insulin
  system: metabolic
  cluster: insulin_resistance
  reversibility: 3
  all:
    - {marker: glucose_fasting, status_in: [optimal, below_optimal, above_optimal]}
    - {marker: insulin_fasting, status_in: [above_optimal, above_lab]}
  supporting_markers: [triglycerides, uric_acid, hba1c]
  inference: "Glucose is within range, but higher fasting insulin suggests the body may be compensating to keep glucose normal."
  evidence_strength: TODO
  source: TODO

- id: tg_hdl_pattern
  title: High triglycerides with low HDL
  system: metabolic
  cluster: insulin_resistance
  reversibility: 3
  all:
    - {marker: triglycerides, status_in: [above_optimal, above_lab]}
    - {marker: hdl, status_in: [below_optimal, below_lab]}
  supporting_markers: [uric_acid, hba1c, insulin_fasting]
  inference: "This combination often travels with insulin resistance."
  evidence_strength: TODO
  source: TODO

- id: ferritin_inflammation
  title: Ferritin high alongside raised hs-CRP
  system: immunity
  cluster: inflammation
  reversibility: 2
  all:
    - {marker: ferritin, status_in: [above_optimal, above_lab]}
    - {marker: hscrp, status_in: [above_lab]}
  supporting_markers: [transferrin_sat, wbc]
  inference: "Ferritin rises with inflammation, so it may overstate iron stores. Transferrin saturation helps interpret it."
  evidence_strength: TODO
  source: TODO

- id: chronic_low_grade_inflammation
  title: Raised hs-CRP without infection
  system: immunity
  cluster: inflammation
  reversibility: 2
  all:
    - {marker: hscrp, status_in: [above_lab]}
    - {marker: wbc, status_in: [optimal, below_optimal, above_optimal]}
    - {symptom_any: [no_infection]}
  supporting_markers: [ferritin]
  inference: "hs-CRP is raised with no sign of infection, which can reflect persistent low-grade inflammation. Likely drivers should be reviewed."
  evidence_strength: TODO
  source: TODO

- id: micronutrient_pattern
  title: Several nutrient markers below optimal despite home-cooked diet
  system: gut_nutrient
  cluster: gut_absorption
  reversibility: 2
  all:
    - {count_of: [ferritin, b12, vitamin_d, zinc, magnesium_rbc], status_in: [below_optimal, below_lab], min: 3}
    - {symptom_any: [bloating]}
  supporting_markers: [transferrin_sat, hemoglobin]
  inference: "Multiple nutrient markers sit low together with bloating, which can point to reduced absorption rather than low intake."
  evidence_strength: TODO
  source: TODO
```

### 5.4 `interventions.yaml`

No doses. Fill `source` and `evidence_strength` yourself. Several interventions may share one source.

```yaml
- {id: f_sleep, title: Fixed sleep and wake time, category: foundation, clusters: [all], order: 1, tags: [], requires_doctor_dose: false, evidence_strength: TODO, source: TODO}
- {id: f_steps, title: Daily walking target, category: movement, clusters: [all], order: 2, tags: [], requires_doctor_dose: false, evidence_strength: TODO, source: TODO}

- {id: m_foods, title: B12- and folate-rich foods in daily meals, category: nutrition, clusters: [methylation], order: 1, tags: [], requires_doctor_dose: false, evidence_strength: TODO, source: TODO}
- {id: m_review_meds, title: Doctor to review medications that can affect B12 status, category: review, clusters: [methylation], order: 2, tags: [], requires_doctor_dose: false, evidence_strength: TODO, source: TODO}
- {id: m_b12_supp, title: Doctor to decide on B12 supplementation and form, category: supplement, clusters: [methylation], order: 3, tags: [], requires_doctor_dose: true, evidence_strength: TODO, source: TODO}

- {id: i_postmeal_walk, title: Short walk after the largest meal, category: movement, clusters: [insulin_resistance], order: 1, tags: [], requires_doctor_dose: false, evidence_strength: TODO, source: TODO}
- {id: i_strength, title: Resistance training, 2-3 sessions per week, category: movement, clusters: [insulin_resistance], order: 2, tags: [], requires_doctor_dose: false, evidence_strength: TODO, source: TODO}
- {id: i_protein_fibre, title: Protein and fibre first at main meals, category: nutrition, clusters: [insulin_resistance], order: 3, tags: [], requires_doctor_dose: false, evidence_strength: TODO, source: TODO}

- {id: inf_drivers, title: "Review likely drivers: sleep, dental health, recent illness, training load, body composition", category: review, clusters: [inflammation], order: 1, tags: [], requires_doctor_dose: false, evidence_strength: TODO, source: TODO}
- {id: inf_repeat_crp, title: Repeat hs-CRP to confirm it persists, category: testing, weeks: [3, 4], clusters: [inflammation], order: 2, tags: [], requires_doctor_dose: false, evidence_strength: TODO, source: TODO}
- {id: inf_iron_check, title: Check transferrin saturation before reading ferritin as iron status, category: testing, weeks: [2, 3], clusters: [inflammation], order: 3, tags: [], requires_doctor_dose: false, evidence_strength: TODO, source: TODO}
- {id: inf_omega3_foods, title: Omega-3-rich foods, category: nutrition, clusters: [inflammation], order: 4, tags: [], requires_doctor_dose: false, evidence_strength: TODO, source: TODO}

- {id: g_food_diary, title: Two-week food and symptom diary, category: foundation, clusters: [gut_absorption], order: 1, tags: [], requires_doctor_dose: false, evidence_strength: TODO, source: TODO}
- {id: g_gut_eval, title: Doctor to consider gut evaluation for absorption, category: review, clusters: [gut_absorption], order: 2, tags: [], requires_doctor_dose: false, evidence_strength: TODO, source: TODO}
- {id: g_iron_foods, title: Iron-rich foods with a vitamin C source, category: nutrition, clusters: [gut_absorption], order: 3, tags: [iron], requires_doctor_dose: false, evidence_strength: TODO, source: TODO}
- {id: g_tea_gap, title: Keep tea and coffee away from iron-rich meals, category: nutrition, clusters: [gut_absorption], order: 4, tags: [tea_coffee], requires_doctor_dose: false, evidence_strength: TODO, source: TODO}
- {id: g_vitd, title: Doctor to decide on vitamin D supplementation, category: supplement, clusters: [gut_absorption], order: 5, tags: [], requires_doctor_dose: true, evidence_strength: TODO, source: TODO}
- {id: g_zinc, title: Doctor to decide on zinc supplementation, category: supplement, clusters: [gut_absorption], order: 6, tags: [zinc], requires_doctor_dose: true, evidence_strength: TODO, source: TODO}
- {id: g_iron_supp, title: Doctor to decide on iron supplementation, category: supplement, clusters: [gut_absorption], order: 7, tags: [iron], requires_doctor_dose: true, evidence_strength: TODO, source: TODO}
```

### 5.5 `interactions.yaml`

Verify each against a source too.

```yaml
- {a: iron, b: zinc, warning: "Iron and zinc compete for absorption. Take at separate times."}
- {a: iron, b: tea_coffee, warning: "Tea and coffee reduce iron absorption. Keep them apart from iron."}
- {a: iron, b: calcium, warning: "Calcium reduces iron absorption. Take at separate times."}
```

### 5.6 `members.json`

Synthetic. Names, phones, and emails are fictional.

```json
[
  {
    "id": "m1", "name": "Meera Nair", "age": 34, "sex": "F", "city": "Bengaluru",
    "phone": "+91 98765 00001", "email": "meera.nair@example.com",
    "goals": "Think clearly through the afternoon",
    "symptoms": ["brain_fog"],
    "history_text": "Meera Nair, 34, lives in Bengaluru (phone +91 98765 00001, email meera.nair@example.com). Software lead with long screen days. Reports brain fog since last year despite 7 hours of sleep. Previous reports said B12 and vitamin D were normal. Vegetarian, eats home-cooked meals, takes no supplements.",
    "markers": {"glucose_fasting": 88, "insulin_fasting": 14, "hba1c": 5.2, "triglycerides": 128, "hdl": 52, "ldl": 98, "uric_acid": 4.6, "hscrp": 0.8, "wbc": 6.1, "homocysteine": 12.5, "b12": 520, "vitamin_d": 44, "ferritin": 62, "transferrin_sat": 30, "hemoglobin": 13.2, "zinc": 88, "magnesium_rbc": 5.4, "alt": 22, "ast": 21, "tsh": 2.1}
  },
  {
    "id": "m2", "name": "Arjun Rao", "age": 41, "sex": "M", "city": "Hyderabad",
    "phone": "+91 98765 00002", "email": "arjun.rao@example.com",
    "goals": "Understand why CRP is high when I am not sick",
    "symptoms": ["no_infection", "high_crp_without_illness"],
    "history_text": "Arjun Rao, 41, from Hyderabad, phone +91 98765 00002, arjun.rao@example.com. Sales director who travels often. A routine report showed raised CRP; no fever, infection, or injury in the last three months. Moderate alcohol on weekends, low exercise.",
    "markers": {"glucose_fasting": 94, "insulin_fasting": 11, "hba1c": 5.5, "triglycerides": 168, "hdl": 38, "ldl": 124, "uric_acid": 7.4, "hscrp": 5.8, "wbc": 6.4, "homocysteine": 8.5, "b12": 610, "vitamin_d": 36, "ferritin": 240, "transferrin_sat": 24, "hemoglobin": 14.8, "zinc": 90, "magnesium_rbc": 5.5, "alt": 38, "ast": 29, "tsh": 2.3}
  },
  {
    "id": "m3", "name": "Rohan Iyer", "age": 38, "sex": "M", "city": "Chennai",
    "phone": "+91 98765 00003", "email": "rohan.iyer@example.com",
    "goals": "Stop feeling bloated and weak",
    "symptoms": ["bloating"],
    "history_text": "Rohan Iyer, 38, Chennai, phone +91 98765 00003, rohan.iyer@example.com. Eats home-cooked meals every day yet reports bloating after most meals for a year. Feels weak despite starting exercise. No prior diagnosis.",
    "markers": {"glucose_fasting": 90, "insulin_fasting": 6, "hba1c": 5.1, "triglycerides": 95, "hdl": 54, "ldl": 96, "uric_acid": 5.0, "hscrp": 0.7, "wbc": 6.8, "homocysteine": 8.4, "b12": 310, "vitamin_d": 22, "ferritin": 24, "transferrin_sat": 18, "hemoglobin": 13.1, "zinc": 66, "magnesium_rbc": 4.4, "alt": 20, "ast": 22, "tsh": 2.0}
  }
]
```

These values were chosen to trigger specific rules under the placeholder ranges in 5.1. If you change a range, re-check section 8.

### 5.7 Sourcing checklist (do this yourself)

For every rule and every intervention:

1. Find a real source that supports the claim: a review article, clinical guideline, or textbook chapter.
2. Write the citation as `Author, Title, Journal/Publisher, Year, URL`.
3. Open the link and confirm the content supports the specific claim. Do not ask Cursor or any LLM to produce citations; they invent them.
4. Set `evidence_strength` to `established` (consistent guideline-level support) or `emerging` (limited or mixed evidence).
5. If you cannot find a source within about 15 minutes, delete that rule or intervention. An unsourced item must not ship.
6. Confirm each marker range in 5.1 against a cited reference range, and replace placeholders you cannot support.

Done when `GET /api/meta` shows zero unverified items.

---

## 6. Cursor setup

Create `.cursor/rules/project.mdc` with this content:

```
---
alwaysApply: true
---
- Read @PROJECT.md before any task. It is the source of truth.
- Never invent medical content: ranges, rules, interventions, evidence labels, citations. Those come only from server/data/*.
- Never edit files in server/data/.
- No doses, no brand names, no identifiers sent to the LLM.
- Engine code is pure functions with Vitest tests. Do not weaken a test to make it pass.
- Do not add libraries, auth, or features that are not in PROJECT.md.
- Keep files under ~200 lines; split modules instead of growing one file.
- If the spec is ambiguous or data is missing, stop and ask.
```

Working method for every prompt below:

- Paste the prompt, let Cursor generate, then run the tests and the Check list yourself.
- Commit after each passing step so you can roll back.
- If Cursor drifts, reply with: "Re-read @PROJECT.md section X and fix only that."

---

## 7. Prompts, step by step

### P0: Scaffold and database

```
Read @PROJECT.md sections 3, 4.11 and 4.12.
Scaffold the repo exactly as the folder layout in 4.12: an Express + TypeScript server in server/ (zod, yaml, vitest, @supabase/supabase-js, dotenv) and a Vite + React + TypeScript + Tailwind + React Router app in web/. Add a server GET /api/health returning {ok:true}. Add .env.example with the variables from section 3. Put the SQL from 4.11 into server/schema.sql. Set up the Vite dev proxy so /api goes to the server. Do not create any other features.
```

Run `schema.sql` in the Supabase SQL editor yourself.

**Check:**
- [ ] `npm run dev` starts both server and web without errors
- [ ] Opening the web app shows a blank page without console errors; `/api/health` returns `{ok:true}` through the proxy
- [ ] All 7 tables exist in Supabase
- [ ] `.env` is gitignored and no key appears in any committed file

### P1: Data loader and validation

First paste your five data files from section 5 into `server/data/`.

```
Read @PROJECT.md sections 4.1, 4.3 and 5. Do NOT modify anything in server/data/.
In server/src/types.ts define TypeScript types and Zod schemas for markers, clusters, rules (with the condition types in 4.3), interventions, interactions and members. In server/src/loader.ts load and validate all YAML/JSON files at startup. Validation must fail loudly (clear error, process exits) if: a rule references an unknown marker code, a rule references an unknown cluster, an intervention references an unknown cluster, or a member has a marker code not in markers.yaml. Treat source === "TODO" as "unverified" (do not fail). Add GET /api/meta returning counts of markers, rules, interventions, and how many rules and interventions are unverified. Write Vitest tests for the loader, including one that proves an unknown marker code in a rule is rejected.
```

**Check:**
- [ ] `GET /api/meta` shows 20 markers, 6 rules, 4 clusters, 19 interventions and a non-zero unverified count (until you finish sourcing)
- [ ] Temporarily change a rule marker to `fake_marker`: the server refuses to start with a clear message; revert it
- [ ] Tests pass and `server/data/` is unchanged (`git diff server/data` is empty)

### P2: Classification and rules engine

```
Read @PROJECT.md sections 4.2 and 4.3. In server/src/engine/classify.ts implement classifyMarker exactly as the table in 4.2 (inclusive boundaries) and classifyAll(markers, dictionary). In server/src/engine/rules.ts implement evaluateRules(classified, symptoms, rules) supporting marker, count_of and symptom_any conditions. A condition on a missing marker is false and must not throw. Output findings in the shape described in 4.3. Pure functions only, no DB, no LLM. Write Vitest tests: for EVERY rule one positive case and one negative case, plus boundary-value tests for classify (value exactly equal to lab_low, lab_high, opt_low, opt_high) and a missing-marker test.
```

**Check:**
- [ ] Tests pass; the test file visibly has a positive and a negative case per rule (6 + 6)
- [ ] Boundary tests exist and assert the inclusive behaviour
- [ ] Manually run Meera's markers through the functions (a quick script or test): rules `functional_b12` and `early_insulin_resistance` fire, and `tg_hdl_pattern` does not

### P3: Spectrum, clusters, ranking, orchestrator

```
Read @PROJECT.md sections 4.4 and 4.5. Implement spectrum.ts (placement with a reason string per system, 'not_assessed' for systems with no markers), cluster.ts (build clusters from fired rules, compute severity, reversibility, findings, symptom multiplier and score exactly as specified, sort, top 5) and analyze.ts exposing analyze(member, data) -> {classified, findings, spectrum, clusters} as a pure function with no DB and no LLM. Write Vitest tests using the three members in server/data/members.json against the expected results in section 8 of PROJECT.md: fired rules, top cluster, and system stages.
```

**Check:**
- [ ] The three members' tests pass against the table in section 8 (this is the most important check in the whole build)
- [ ] Meera's top cluster is `methylation` (symptom multiplier working); Arjun's is `inflammation`; Rohan's is `gut_absorption`
- [ ] `endurance` and `musculoskeletal` are `not_assessed` for every member
- [ ] Every system has a non-empty reason string

### P4: Anonymiser

```
Read @PROJECT.md section 4.6. Implement server/src/privacy/anonymise.ts with anonymise(text, member) and pseudoId(member). Follow the replacement rules exactly. Write Vitest tests: for each of the three members in server/data/members.json, the cleaned history_text must not contain the member's name parts, city, phone digits (with or without spaces/+91) or email; removed[] must list what was replaced; the age must remain; a text with a date like 12/03/1990 gets [DATE]; matching is case-insensitive.
```

**Check:**
- [ ] Tests pass for all three members
- [ ] Print Meera's cleaned text and read it yourself: no name, no "Bengaluru", no phone, no email, still readable
- [ ] `pseudoId` is stable across runs and different per member

### P5: Playbook generator

```
Read @PROJECT.md section 4.7 and the files interventions.yaml and interactions.yaml in server/data (do not edit them). Implement server/src/playbook/generate.ts: generatePlaybook(clusters, member, data) returning {items, unscheduled}, exactly following steps 1-7 in 4.7: ordering, phase windows, the weekly cap of 2 items starting per week, items with a 'weeks' field keep their own weeks, the week-12 retest item built from the clusters' retest_markers, and interaction warnings on overlapping pairs. Pure function. Write Vitest tests: never more than 2 items start in any week; foundation items land in weeks 1-2; supplement items land in weeks 7-12; Rohan's plan has an iron/zinc warning on g_iron_supp and g_zinc or shows them in non-overlapping weeks, whichever the cap produces, and the test asserts that no overlapping iron/zinc pair exists without a warning; every item has a source field; no item contains a dose.
```

**Check:**
- [ ] Tests pass
- [ ] Print Rohan's playbook as a table (week, title, warning) and read it: it looks sensible and nothing starts week 1 beyond the cap
- [ ] Items beyond capacity appear in `unscheduled`, not silently dropped
- [ ] Meera's plan contains `m_foods`, `m_review_meds` and the shared foundation items

### P6: LLM wording with guards

```
Read @PROJECT.md section 4.8. Implement server/src/llm/wording.ts and guard.ts. Build the payload ONLY from anonymised data (cluster titles, rule inference text, marker names/values/statuses, pseudo_id, anonymised history text). Call the LLM with structured output validated by a Zod schema matching 4.8. Implement the guards: reject if the response contains any number that is not present in the payload; reject on schema failure; fall back to templates on rejection or error; cache by SHA-256 of the payload in the llm_cache table; mark each piece of wording as 'llm' or 'template'. The system prompt must forbid new facts, numbers, doses, brand names and diagnosis wording. Write Vitest tests with a mocked LLM client: a response with an invented number is rejected and falls back; a malformed response falls back; a valid response passes; the payload builder output contains none of the member's name, city, phone or email (test against all three members).
```

**Check:**
- [ ] Tests pass, including the "no identifiers in payload" test for all three members
- [ ] With a real key, run the wording once for Meera and read it: plain language, no invented numbers or doses, no diagnosis words
- [ ] Run the same call twice: the second is served from cache (no second API call)
- [ ] Set an invalid API key: the app still returns template wording and marks it `template`

### P7: API, persistence, audit, seed

```
Read @PROJECT.md sections 4.9 and 4.11. Implement server/src/db.ts (Supabase client using the service role key, server only), server/scripts/seed.ts (loads members.json into members and member_markers, computing pseudo_id), server/src/api/audit.ts (writes audit_log rows with actor = DEMO_DOCTOR) and server/src/api/routes.ts with every endpoint in 4.9 and its rules: analyze requires {confirmed:true} else 400; approve returns 409 if any item is pending; PATCH returns 400 if the playbook is approved; every listed action writes an audit entry. Update member status as the workflow advances (analysed, in_review, approved). Write API tests (supertest or direct handler tests with a mocked db) for: analyze without confirmed, approve with pending items, edit after approval, and audit entries being written.
```

**Check:**
- [ ] `npm run seed` loads 3 members; Supabase table viewer shows them with `pseudo_id` populated
- [ ] With curl or an API client: `GET /api/members/m1/anonymisation` returns original and clean text and does not call the LLM
- [ ] `POST /api/members/m1/analyze` with `{}` returns 400; with `{"confirmed":true}` returns an analysis
- [ ] Draft a playbook, try approving immediately: 409. Accept every item, then approve: 200
- [ ] `audit_log` has a row for every action you just did
- [ ] The service role key does not appear anywhere under `web/`

### P8: UI base, members list, anonymise screen

```
Read @PROJECT.md section 4.10. In web/, build routing, a simple api.ts client, the Members table at "/" (name, age, goals, status chip) and the anonymisation screen at "/members/:id/anonymise": original text on the left, clean text on the right with removed items highlighted, the pseudo_id shown, and a Confirm and analyse button that POSTs /analyze with {confirmed:true} then navigates to /members/:id. Clean, simple Tailwind styling. Show loading and error states. Do not build other screens yet.
```

**Check:**
- [ ] The list shows 3 members with status chips
- [ ] The anonymise screen visibly highlights name, city, phone and email on the left and shows tags on the right
- [ ] Confirm triggers analysis and navigates; a failed request shows an error, not a blank screen
- [ ] The browser network tab shows no request containing the LLM key

### P9: Overview and findings

```
Read @PROJECT.md section 4.10. Build the member page at /members/:id with tabs Overview, Findings and Playbook (Playbook can be a placeholder for now). Overview: 9 system cards with a stage chip (Healthy, Compensating, Strained, Not assessed), the reason line, and a legend that also lists Diseased and Comorbid marked "doctor-assessed". Findings: ranked cluster cards showing the doctor_summary; expanding a card shows the reasoning chain: each marker with value, unit and status, the rule title, the inference text, evidence_strength and source. Show a red UNVERIFIED SOURCE badge where source is TODO, and a small "template" tag where wording fell back. Add the label "Suggested placement. Doctor decides." on the overview.
```

**Check:**
- [ ] Meera's overview: Cognition and Metabolic are Compensating, others Healthy, Endurance and Musculoskeletal Not assessed
- [ ] Arjun's overview shows Strained on Metabolic, Cardiovascular and Immunity
- [ ] Findings order matches section 8; expanding a cluster shows markers with real values
- [ ] Unverified badges show until you finish sourcing, and disappear after
- [ ] Layout holds at laptop width and at about 800px wide

### P10: Playbook editor, approve, print

```
Read @PROJECT.md sections 4.7 and 4.10. Build the Playbook tab: a Draft playbook button (POST /playbook), then a 12-week timeline plus an item list. Each item shows title, weeks, linked finding, why_this, source, evidence label, warning (if any) and a "dose set by doctor" note where requires_doctor_dose is true. Buttons: Accept, Edit (inline text edit), Reject. Show the unscheduled items in a "Not scheduled" list. The Approve button is disabled while any item is pending and shows how many remain. After approval all controls lock. Add /print/:playbookId: a print-friendly page (no navigation, print CSS) with member pseudo_id, items with sources, "Reviewed by {doctor} on {date}", and a Print button calling window.print().
```

**Check:**
- [ ] Approve is disabled with pending items and the counter decreases as you decide
- [ ] Edit saves, survives a page refresh, and shows the edited text
- [ ] After approval, buttons are locked and the member status becomes Approved on the list page
- [ ] The print page prints cleanly (try Save as PDF), with sources and reviewer line
- [ ] Rohan's plan shows the iron-related warning wherever it applies

### P11: Audit page, polish, README

```
Read @PROJECT.md. Build /audit: a table of the latest audit entries (time, actor, member, action) with a link in the nav. Add a header showing the demo doctor name and a banner "Synthetic data. Educational proof of approach, not medical advice." Write README.md with: what it is, a Mermaid architecture diagram, how to run (env, schema, seed, dev), how the pipeline works, a Limitations section copied from PROJECT.md section 1, and a Testing section. Do not add features.
```

**Check:**
- [ ] The audit page lists every action from your test session in time order
- [ ] README setup steps work from a fresh clone (try them)
- [ ] The synthetic-data banner is visible on every page

---

## 8. Acceptance test (end to end)

Expected engine results under the placeholder ranges in 5.1. If you change a range, update this table.

| Member | Rules that fire | Top cluster | Stages |
|---|---|---|---|
| Meera (m1) | functional_b12, early_insulin_resistance | methylation | Cognition: compensating. Metabolic: compensating. Others: healthy. |
| Arjun (m2) | early_insulin_resistance, tg_hdl_pattern, ferritin_inflammation, chronic_low_grade_inflammation | inflammation (then insulin_resistance) | Metabolic, Cardiovascular, Immunity: strained. Gut/nutrient, Detox: compensating. Cognition, Hormonal: healthy. |
| Rohan (m3) | micronutrient_pattern | gut_absorption | Gut/nutrient: strained. Cognition: compensating. Others: healthy. |

For all three, Endurance and Musculoskeletal are Not assessed.

Run through this by hand, from a clean database (re-run the seed):

1. Open the members list: 3 members, all "Report received".
2. Open Meera, go to the anonymisation screen: identifiers are highlighted, the clean text has tags.
3. Confirm: the overview and findings match the table above; every finding has a reasoning chain.
4. Draft the playbook: the weekly cap holds, foundation items are in weeks 1-2, supplements are in weeks 7-12 with "dose set by doctor", and week 12 has a retest item.
5. Try Approve with pending items: it is blocked. Accept, edit and reject a few items; decide the rest; approve.
6. Open the print page: it looks right and every item has a source.
7. Open the audit page: all of the above are recorded.
8. Repeat steps 2-5 quickly for Arjun and Rohan.
9. Check `GET /api/meta`: zero unverified rules and interventions.
10. Run the full test suite: green.
11. Search the codebase for the three members' names, phones and emails: they appear only in `server/data/members.json`, the seed script, and tests, never in LLM payload-building code paths except through the anonymiser.

Done when every line above passes.

---

## 9. Where Cursor typically goes wrong (and the fix)

| Problem | What to say |
|---|---|
| It fills in a range, rule, or citation itself | "Revert. Medical content comes only from server/data. Ask me if something is missing." |
| It "fixes" a failing test by loosening it | "Do not change the test. Fix the code so the original assertion passes." |
| It adds auth, a state library, or other extras | "Remove it. Only what is in @PROJECT.md section 3 and 4." |
| It builds one giant file | "Split into the modules listed in section 4.12." |
| It sends raw history text to the LLM | "Payload must be built only from anonymised data (4.8). Add the identifier test." |
| It hard-codes the three members' results | "Remove special cases. Results must come from the rules engine for any member." |
| It silently mocks the LLM or database | "Use the real client. Mock only inside tests." |
| It edits `server/data/*` | "Revert your changes to server/data. Those files are mine." |

When stuck for more than 20 minutes on one step, simplify rather than push: cut a feature from the "not scheduled" list, the edit history, or the timeline graphic. The rules, the anonymiser, and the review gate are the parts that matter most.