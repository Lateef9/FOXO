export type MemberListItem = {
  id: string;
  name: string;
  age: number;
  goals: string;
  status: string;
  pseudo_id: string;
};

export type RemovedItem = {
  type: string;
  original: string;
};

export type AnonymisationResponse = {
  original: string;
  clean: string;
  removed: RemovedItem[];
  pseudo_id: string;
};

export type ClassifiedMarker = {
  code: string;
  value: number;
  unit: string;
  system: string;
  status: string;
  name: string;
};

export type Finding = {
  rule_id: string;
  title: string;
  system: string;
  cluster: string;
  inference: string;
  markers_involved: string[];
  evidence_strength: string;
  source: string;
};

export type SpectrumEntry = {
  system: string;
  stage: string;
  reason: string;
};

export type RankedCluster = {
  id: string;
  title: string;
  rule_ids: string[];
  severity: number;
  reversibility: number;
  findings: string[];
  symptom_multiplier: number;
  score: number;
};

export type ClusterWording = {
  cluster_id: string;
  doctor_summary: string;
  member_friendly: string;
  wording_source: "llm" | "template";
};

export type AnalysisResult = {
  classified: ClassifiedMarker[];
  findings: Finding[];
  spectrum: SpectrumEntry[];
  clusters: RankedCluster[];
  wording?: {
    clusters: ClusterWording[];
    items?: Array<{
      item_key: string;
      why_this: string;
      wording_source: "llm" | "template";
    }>;
  };
};

export type AnalysisResponse = {
  id: string;
  member_id: string;
  result: AnalysisResult;
  created_at: string;
};

export type MemberDetailResponse = {
  member: {
    id: string;
    name: string;
    age: number;
    goals: string;
    status?: string;
  };
  classified: ClassifiedMarker[];
};

export type PlaybookItemState = "pending" | "accepted" | "rejected" | "edited";

export type PlaybookItem = {
  id: string;
  playbook_id: string;
  item_key: string | null;
  week_from: number | null;
  week_to: number | null;
  category: string | null;
  title: string | null;
  why_this: string | null;
  wording_source: string | null;
  cluster: string | null;
  rule_ids: string[] | null;
  source: string | null;
  evidence_strength: string | null;
  warning: string | null;
  requires_doctor_dose: boolean | null;
  state: PlaybookItemState | string;
  edited_text: string | null;
};

export type UnscheduledItem = {
  item_key: string;
  title: string;
  category: string;
  cluster: string;
  source: string;
  evidence_strength: string;
  warning: string | null;
  requires_doctor_dose: boolean;
};

export type Playbook = {
  id: string;
  member_id: string;
  analysis_id: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  unscheduled: UnscheduledItem[] | unknown;
  created_at: string;
};

export type PlaybookResponse = {
  playbook: Playbook;
  items: PlaybookItem[];
};
