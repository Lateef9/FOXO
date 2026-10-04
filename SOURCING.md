# Sourcing tracker (human-only)

**Do not ask Cursor or any LLM for citations.** They invent them.

For each row: find a real guideline / review / textbook, open the URL, confirm it supports the claim, then paste citation into `server/data/*.yaml` as:

`Author, Title, Journal/Publisher, Year, URL`

Set `evidence_strength` to `established` or `emerging`.  
If you cannot find a source in ~15 minutes, **delete** that rule/intervention.

Done when every box is checked and `GET /api/meta` shows zero unverified items (after Phase 1).

---

## How to edit after you find a source

In `server/data/rules.yaml` or `interventions.yaml`, replace:

```yaml
evidence_strength: TODO
source: TODO
```

with e.g.:

```yaml
evidence_strength: established
source: "Smith et al, Example Review, Journal Name, 2020, https://..."
```

---

## Rules (6)

| id | Claim to support | Link opened | strength | source written in YAML |
|---|---|---|---|---|
| `functional_b12` | Normal serum B12 + elevated homocysteine can indicate functional B12 issue | ☐ | ☐ | ☐ |
| `early_insulin_resistance` | Normal glucose + elevated fasting insulin suggests compensatory IR | ☐ | ☐ | ☐ |
| `tg_hdl_pattern` | High TG + low HDL associated with insulin resistance | ☐ | ☐ | ☐ |
| `ferritin_inflammation` | Ferritin rises with inflammation; use TSAT to interpret iron | ☐ | ☐ | ☐ |
| `chronic_low_grade_inflammation` | Raised hs-CRP without infection can reflect low-grade inflammation | ☐ | ☐ | ☐ |
| `micronutrient_pattern` | Multiple low nutrients + bloating can suggest absorption issue | ☐ | ☐ | ☐ |

---

## Interventions (19)

| id | Claim to support | Link opened | strength | source written in YAML |
|---|---|---|---|---|
| `f_sleep` | Fixed sleep/wake supports metabolic health | ☐ | ☐ | ☐ |
| `f_steps` | Daily walking target as foundational movement | ☐ | ☐ | ☐ |
| `m_foods` | B12/folate-rich foods for methylation / B12 status | ☐ | ☐ | ☐ |
| `m_review_meds` | Some meds affect B12; doctor review appropriate | ☐ | ☐ | ☐ |
| `m_b12_supp` | B12 supplementation decision is clinician-led (no dose here) | ☐ | ☐ | ☐ |
| `i_postmeal_walk` | Short post-meal walk helps glucose handling | ☐ | ☐ | ☐ |
| `i_strength` | Resistance training helps insulin sensitivity | ☐ | ☐ | ☐ |
| `i_protein_fibre` | Protein/fibre first at meals helps postprandial response | ☐ | ☐ | ☐ |
| `inf_drivers` | Review common CRP drivers (sleep, dental, illness, load, adiposity) | ☐ | ☐ | ☐ |
| `inf_repeat_crp` | Repeat hs-CRP to confirm persistence | ☐ | ☐ | ☐ |
| `inf_iron_check` | Check TSAT before reading ferritin as iron stores | ☐ | ☐ | ☐ |
| `inf_omega3_foods` | Omega-3-rich foods for inflammation context | ☐ | ☐ | ☐ |
| `g_food_diary` | Food/symptom diary for absorption workup | ☐ | ☐ | ☐ |
| `g_gut_eval` | Clinician-led gut evaluation for malabsorption | ☐ | ☐ | ☐ |
| `g_iron_foods` | Iron-rich foods + vitamin C improve absorption | ☐ | ☐ | ☐ |
| `g_tea_gap` | Tea/coffee inhibit iron absorption | ☐ | ☐ | ☐ |
| `g_vitd` | Vitamin D supplementation decision is clinician-led | ☐ | ☐ | ☐ |
| `g_zinc` | Zinc supplementation decision is clinician-led | ☐ | ☐ | ☐ |
| `g_iron_supp` | Iron supplementation decision is clinician-led | ☐ | ☐ | ☐ |

---

## Interactions (3)

| pair | Warning | Link opened | note / citation |
|---|---|---|---|
| iron ↔ zinc | Compete for absorption | ☐ | |
| iron ↔ tea_coffee | Tea/coffee reduce iron absorption | ☐ | |
| iron ↔ calcium | Calcium reduces iron absorption | ☐ | |

---

## Marker ranges (20)

Confirm each lab/optimal band against a cited adult reference. If you cannot support a placeholder, replace or remove it and re-check `projects.md` §8 acceptance table.

| code | Confirmed | Citation |
|---|---|---|
| glucose_fasting | ☐ | |
| insulin_fasting | ☐ | |
| hba1c | ☐ | |
| triglycerides | ☐ | |
| uric_acid | ☐ | |
| hdl | ☐ | |
| ldl | ☐ | |
| hscrp | ☐ | |
| wbc | ☐ | |
| homocysteine | ☐ | |
| b12 | ☐ | |
| vitamin_d | ☐ | |
| ferritin | ☐ | |
| transferrin_sat | ☐ | |
| hemoglobin | ☐ | |
| zinc | ☐ | |
| magnesium_rbc | ☐ | |
| alt | ☐ | |
| ast | ☐ | |
| tsh | ☐ | |

---

## Suggested search starting points (not citations)

Use these only as places to **look**; you must open and verify each paper/guideline yourself:

- ADA Standards of Care / AHA lipid guidance (glucose, lipids, IR patterns)
- CDC / AACE / Endocrine Society pages (TSH, vitamin D)
- WHO / NIH ODS fact sheets (B12, iron, zinc, folate foods)
- Reviews on hs-CRP and acute-phase ferritin
- Iron absorption interactions (tea/polyphenols, calcium, zinc)

Write the full citation into the YAML only after you open the link and confirm the claim.
