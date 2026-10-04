import { z } from "zod";

export const SYSTEMS = [
  "gut_nutrient",
  "cardiovascular",
  "metabolic",
  "detox",
  "cognition",
  "immunity",
  "hormonal",
  "endurance",
  "musculoskeletal",
] as const;

export const MarkerStatusSchema = z.enum([
  "below_lab",
  "above_lab",
  "below_optimal",
  "above_optimal",
  "optimal",
]);

export const MarkerSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().min(1),
  system: z.enum(SYSTEMS),
  lab: z.tuple([z.number(), z.number()]),
  optimal: z.tuple([z.number(), z.number()]),
});

export const ClusterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  matches_symptoms: z.array(z.string()),
  retest_markers: z.array(z.string()),
});

export const MarkerConditionSchema = z.object({
  marker: z.string().min(1),
  status_in: z.array(MarkerStatusSchema).min(1),
});

export const CountOfConditionSchema = z.object({
  count_of: z.array(z.string()).min(1),
  status_in: z.array(MarkerStatusSchema).min(1),
  min: z.number().int().positive(),
});

export const SymptomAnyConditionSchema = z.object({
  symptom_any: z.array(z.string()).min(1),
});

export const RuleConditionSchema = z.union([
  MarkerConditionSchema,
  CountOfConditionSchema,
  SymptomAnyConditionSchema,
]);

export const RuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  system: z.enum(SYSTEMS),
  cluster: z.string().min(1),
  reversibility: z.number().int().positive(),
  all: z.array(RuleConditionSchema).min(1),
  supporting_markers: z.array(z.string()),
  inference: z.string().min(1),
  evidence_strength: z.string().min(1),
  source: z.string().min(1),
});

export const InterventionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  clusters: z.array(z.string()).min(1),
  order: z.number().int().positive(),
  tags: z.array(z.string()),
  requires_doctor_dose: z.boolean(),
  evidence_strength: z.string().min(1),
  source: z.string().min(1),
  weeks: z.tuple([z.number().int(), z.number().int()]).optional(),
});

export const InteractionSchema = z.object({
  a: z.string().min(1),
  b: z.string().min(1),
  warning: z.string().min(1),
});

export const MemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  age: z.number().int().positive(),
  sex: z.string().min(1),
  city: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().min(1),
  goals: z.string(),
  symptoms: z.array(z.string()),
  history_text: z.string(),
  markers: z.record(z.string(), z.number()),
});

export type Marker = z.infer<typeof MarkerSchema>;
export type Cluster = z.infer<typeof ClusterSchema>;
export type RuleCondition = z.infer<typeof RuleConditionSchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type Intervention = z.infer<typeof InterventionSchema>;
export type Interaction = z.infer<typeof InteractionSchema>;
export type Member = z.infer<typeof MemberSchema>;
export type MarkerStatus = z.infer<typeof MarkerStatusSchema>;

export type AppData = {
  markers: Marker[];
  clusters: Cluster[];
  rules: Rule[];
  interventions: Intervention[];
  interactions: Interaction[];
  members: Member[];
};

export type MetaCounts = {
  markers: number;
  rules: number;
  clusters: number;
  interventions: number;
  unverified_rules: number;
  unverified_interventions: number;
};
