import type { AppData, Interaction, Intervention, Member } from "../types.js";
import type { RankedCluster } from "../engine/cluster.js";

export type PlaybookItem = {
  item_key: string;
  title: string;
  category: string;
  week_from: number;
  week_to: number;
  cluster: string;
  rule_ids: string[];
  source: string;
  evidence_strength: string;
  warning: string | null;
  requires_doctor_dose: boolean;
  state: "pending";
  tags: string[];
};

export type PlaybookResult = {
  items: PlaybookItem[];
  unscheduled: PlaybookItem[];
};

type Draft = Omit<PlaybookItem, "week_from" | "week_to" | "warning"> & {
  week_from?: number;
  week_to?: number;
  preferred_from: number;
  preferred_to: number;
  window_from: number;
  window_to: number;
};

function phaseWindow(category: string): [number, number] | null {
  if (category === "foundation") return [1, 2];
  if (category === "nutrition" || category === "movement") return [3, 6];
  if (category === "supplement" || category === "review") return [7, 12];
  return null;
}

function collectInterventions(
  topClusters: RankedCluster[],
  interventions: Intervention[],
): Draft[] {
  const drafts: Draft[] = [];
  const usedKeys = new Set<string>();

  for (const cluster of topClusters) {
    const matches = interventions
      .filter((iv) => {
        if (usedKeys.has(iv.id)) return false;
        return (
          iv.clusters.includes(cluster.id) || iv.clusters.includes("all")
        );
      })
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

    for (const iv of matches) {
      usedKeys.add(iv.id);
      const window = phaseWindow(iv.category);
      let preferred_from: number;
      let preferred_to: number;
      let window_from: number;
      let window_to: number;

      if (iv.weeks) {
        preferred_from = iv.weeks[0];
        preferred_to = iv.weeks[1];
        window_from = 1;
        window_to = 12;
      } else if (window) {
        preferred_from = window[0];
        preferred_to = window[1];
        window_from = window[0];
        window_to = window[1];
      } else {
        preferred_from = 1;
        preferred_to = 12;
        window_from = 1;
        window_to = 12;
      }

      drafts.push({
        item_key: iv.id,
        title: iv.title,
        category: iv.category,
        cluster: iv.clusters.includes("all") ? "all" : cluster.id,
        rule_ids: [...cluster.rule_ids],
        source: iv.source,
        evidence_strength: iv.evidence_strength,
        requires_doctor_dose: iv.requires_doctor_dose,
        state: "pending",
        tags: [...iv.tags],
        preferred_from,
        preferred_to,
        window_from,
        window_to,
      });
    }
  }

  return drafts;
}

function scheduleDrafts(drafts: Draft[]): {
  items: PlaybookItem[];
  unscheduled: PlaybookItem[];
} {
  const startsPerWeek = new Map<number, number>();
  const items: PlaybookItem[] = [];
  const unscheduled: PlaybookItem[] = [];

  const bump = (week: number) => {
    startsPerWeek.set(week, (startsPerWeek.get(week) ?? 0) + 1);
  };
  const canStart = (week: number) => (startsPerWeek.get(week) ?? 0) < 2;

  for (const draft of drafts) {
    const duration = draft.preferred_to - draft.preferred_from;
    let placed: PlaybookItem | null = null;

    for (
      let start = draft.preferred_from;
      start <= draft.window_to;
      start += 1
    ) {
      const end = Math.min(start + duration, draft.window_to);
      if (end < start) continue;
      // Keep testing/fixed-duration items from extending past their natural end
      // when sliding; for phase items preferred_to is window end so end tracks.
      if (draft.category === "testing" && end - start !== duration) continue;
      if (!canStart(start)) continue;
      if (start < draft.window_from) continue;

      placed = {
        item_key: draft.item_key,
        title: draft.title,
        category: draft.category,
        week_from: start,
        week_to: end,
        cluster: draft.cluster,
        rule_ids: draft.rule_ids,
        source: draft.source,
        evidence_strength: draft.evidence_strength,
        warning: null,
        requires_doctor_dose: draft.requires_doctor_dose,
        state: "pending",
        tags: draft.tags,
      };
      bump(start);
      break;
    }

    if (placed) items.push(placed);
    else {
      unscheduled.push({
        item_key: draft.item_key,
        title: draft.title,
        category: draft.category,
        week_from: draft.preferred_from,
        week_to: draft.preferred_to,
        cluster: draft.cluster,
        rule_ids: draft.rule_ids,
        source: draft.source,
        evidence_strength: draft.evidence_strength,
        warning: null,
        requires_doctor_dose: draft.requires_doctor_dose,
        state: "pending",
        tags: draft.tags,
      });
    }
  }

  return { items, unscheduled };
}

function rangesOverlap(
  a: PlaybookItem,
  b: PlaybookItem,
): boolean {
  return a.week_from <= b.week_to && b.week_from <= a.week_to;
}

function applyInteractions(
  items: PlaybookItem[],
  interactions: Interaction[],
): void {
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const left = items[i]!;
      const right = items[j]!;
      if (!rangesOverlap(left, right)) continue;

      for (const pair of interactions) {
        const match =
          (left.tags.includes(pair.a) && right.tags.includes(pair.b)) ||
          (left.tags.includes(pair.b) && right.tags.includes(pair.a));
        if (!match) continue;
        left.warning = left.warning
          ? `${left.warning} ${pair.warning}`
          : pair.warning;
        right.warning = right.warning
          ? `${right.warning} ${pair.warning}`
          : pair.warning;
      }
    }
  }
}

function buildRetest(
  topClusters: RankedCluster[],
  startsPerWeek: Map<number, number>,
): { item: PlaybookItem; scheduled: boolean } {
  const markers = [
    ...new Set(topClusters.flatMap((c) => c.retest_markers)),
  ].sort();
  const item: PlaybookItem = {
    item_key: "retest",
    title: `Retest: ${markers.join(", ")}`,
    category: "testing",
    week_from: 12,
    week_to: 12,
    cluster: "all",
    rule_ids: [...new Set(topClusters.flatMap((c) => c.rule_ids))],
    source: "protocol",
    evidence_strength: "established",
    warning: null,
    requires_doctor_dose: false,
    state: "pending",
    tags: [],
  };
  const count = startsPerWeek.get(12) ?? 0;
  if (count < 2) {
    startsPerWeek.set(12, count + 1);
    return { item, scheduled: true };
  }
  return { item, scheduled: false };
}

export function generatePlaybook(
  clusters: RankedCluster[],
  _member: Member,
  data: AppData,
): PlaybookResult {
  const topClusters = clusters.slice(0, 3);
  const drafts = collectInterventions(topClusters, data.interventions);
  const { items, unscheduled } = scheduleDrafts(drafts);

  const startsPerWeek = new Map<number, number>();
  for (const item of items) {
    startsPerWeek.set(
      item.week_from,
      (startsPerWeek.get(item.week_from) ?? 0) + 1,
    );
  }

  const retest = buildRetest(topClusters, startsPerWeek);
  if (retest.scheduled) items.push(retest.item);
  else unscheduled.push(retest.item);

  applyInteractions(items, data.interactions);

  return { items, unscheduled };
}
