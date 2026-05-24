

import type { Friend, GroupRow } from "@/lib/types";

export type EnrichedGroup = GroupRow & {
  members: Friend[];
  stats: {
    count: number;
    avgCloseness: number;
    avgImportance: number;
    health: "balanced" | "growing" | "onesided" | "drifting";
    healthScore: number;
    breakdown: { balanced: number; growing: number; onesided: number };
  };
};

function calcStats(members: Friend[]): EnrichedGroup["stats"] {
  if (!members.length) {
    return {
      count: 0,
      avgCloseness: 0,
      avgImportance: 0,
      health: "balanced" as const,
      healthScore: 0,
      breakdown: { balanced: 0, growing: 0, onesided: 0 },
    };
  }

  const avgC = Math.round(members.reduce((t, f) => t + f.closeness, 0) / members.length);
  const avgI = Math.round(members.reduce((t, f) => t + f.importance, 0) / members.length);
  const bal = members.filter((f) => Math.abs(f.closeness - f.importance) < 10).length;
  const gr = members.filter((f) => f.closeness > f.importance).length;
  const os = members.filter((f) => f.closeness < f.importance - 10).length;
  const ratio = bal / members.length;
  const health =
    ratio > 0.7 ? "balanced"
    : ratio > 0.5 ? "growing"
    : ratio > 0.3 ? "onesided"
    : "drifting";
  const score = Math.round(
    members.reduce(
      (t, f) => t + Math.max(0, 100 - Math.abs(f.closeness - f.importance) * 1.5),
      0,
    ) / members.length,
  );

  return {
    count: members.length,
    avgCloseness: avgC,
    avgImportance: avgI,
    health,
    healthScore: score,
    breakdown: { balanced: bal, growing: gr, onesided: os },
  };
}

export function enrichGroups(friends: Friend[], groups: GroupRow[]): EnrichedGroup[] {
  return groups.map((g) => {
    const members = g.memberIds
      .map((id) => friends.find((f) => f.id === id))
      .filter((x): x is Friend => Boolean(x));

    return { ...g, members, stats: calcStats(members) };
  });
}

export function groupInsightLines(g: EnrichedGroup): string[] {
  const m = g.members;
  const s = g.stats;
  const lines: string[] = [];
  if (!m.length) return lines;

  const healthTxt: Record<string, string> = {
    balanced: `"${g.name}" mixes closeness & importance sustainably.`,
    growing: "Momentum-heavy — rituals help keep reciprocity tracked.",
    onesided:
      "You’re lighting more burners than peers here — revisit whether that still fits your season.",
    drifting: "Time for warm reach-outs — small pings beat big resets.",
  };
  lines.push(healthTxt[s.health] ?? healthTxt.drifting);

  const driftingPeople = m.filter((f) => f.closeness < f.importance - 15);
  if (driftingPeople.length) {
    lines.push(
      `${driftingPeople.map((f) => f.name).join(", ")} may need intentional 1:1 time.`,
    );
  }

  const growingBonds = m.filter((f) => f.closeness > f.importance && f.closeness > 60);
  if (growingBonds.length) lines.push("Some seats here are deepening fast — nourish them consciously.");

  if (new Set(m.map((f) => f.type)).size === 1) {
    lines.push("Everyone shares one archetype — diversity could reduce blind spots.");
  }

  const holes = m.filter((f) => f.status !== "normal");
  if (holes.length) {
    lines.push(
      `${holes.map((f) => f.name).join(", ")} marked toxic/cut off — consider removing them from this constellation.`,
    );
  }

  return lines;
}

