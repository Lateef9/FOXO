export const SYSTEM_LABELS: Record<string, string> = {
  gut_nutrient: "Gut and nutrient status",
  cardiovascular: "Cardiovascular",
  metabolic: "Metabolic",
  detox: "Detox",
  cognition: "Cognition",
  immunity: "Immunity",
  hormonal: "Hormonal",
  endurance: "Endurance",
  musculoskeletal: "Musculoskeletal",
};

export const STAGE_LABELS: Record<string, string> = {
  healthy: "Healthy",
  compensating: "Compensating",
  strained: "Strained",
  not_assessed: "Not assessed",
};

export function stageChipClass(stage: string): string {
  switch (stage) {
    case "healthy":
      return "bg-emerald-100 text-emerald-800";
    case "compensating":
      return "bg-amber-100 text-amber-900";
    case "strained":
      return "bg-rose-100 text-rose-800";
    case "not_assessed":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
