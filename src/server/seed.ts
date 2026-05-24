import type Database from "better-sqlite3";
import { nanoid } from "nanoid";

import { GROUP_COLORS, TYPE_COLORS } from "@/lib/constants";

type SeedFriend = {
  name: string;
  tag: string;
  notes: string;
  closeness: number;
  importance: number;
  type: keyof typeof TYPE_COLORS;
  status: "normal" | "toxic" | "cutoff";
  angle: number;
};

/** Rich starter set: varied orbit angles, balances, timeline history, plus groups below. */
const SAMPLE_FRIENDS: SeedFriend[] = [
  {
    name: "Maya",
    tag: "best friend",
    notes: "Texts back with memes, always there when it matters.",
    closeness: 92,
    importance: 96,
    type: "inner",
    status: "normal",
    angle: -35,
  },
  {
    name: "Theo",
    tag: "collaborator",
    notes: "Best brainstorming energy — you dream bigger together.",
    closeness: 68,
    importance: 78,
    type: "creative",
    status: "normal",
    angle: 38,
  },
  {
    name: "Sarah",
    tag: "mentor",
    notes: "Grounded advice, calming presence before big decisions.",
    closeness: 75,
    importance: 85,
    type: "steady",
    status: "normal",
    angle: 110,
  },
  {
    name: "Alex",
    tag: "game night regular",
    notes: "Reliable for plans; deepens friendships through shared rituals.",
    closeness: 72,
    importance: 65,
    type: "growing",
    status: "normal",
    angle: -160,
  },
  {
    name: "Riley",
    tag: "old roommate",
    notes: "You care a lot — contact has thinned lately; worth a honest check-in.",
    closeness: 48,
    importance: 72,
    type: "steady",
    status: "normal",
    angle: 165,
  },
  {
    name: "Jordan",
    tag: "design buddy",
    notes: "Trading feedback on side projects — creative overlap without drama.",
    closeness: 62,
    importance: 64,
    type: "creative",
    status: "normal",
    angle: 220,
  },
  {
    name: "Priya",
    tag: "running partner",
    notes: "Accountability outdoors; conversations stay light but loyal.",
    closeness: 70,
    importance: 58,
    type: "growing",
    status: "normal",
    angle: -95,
  },
  {
    name: "Casey",
    tag: "ex-coworker",
    notes: "Connection formally ended — orbit kept for closure, not re-engagement.",
    closeness: 22,
    importance: 30,
    type: "inner",
    status: "cutoff",
    angle: 280,
  },
];

type SeedGroupDef = {
  name: string;
  purpose: string;
  icon: string;
  color: string;
  memberNames: string[];
};

const SAMPLE_GROUPS: SeedGroupDef[] = [
  {
    name: "Support constellation",
    purpose: "People I lean on emotionally when stakes feel high.",
    icon: "💪",
    color: GROUP_COLORS[0]!,
    memberNames: ["Maya", "Sarah", "Riley"],
  },
  {
    name: "Builders circle",
    purpose: "Co-conspirators for projects, ideas, and messy whiteboards.",
    icon: "🚀",
    color: GROUP_COLORS[7]!,
    memberNames: ["Theo", "Alex", "Jordan"],
  },
  {
    name: "Weekday rhythm",
    purpose: "Low-key consistency — walks, coffees, predictable touchpoints.",
    icon: "🌍",
    color: GROUP_COLORS[2]!,
    memberNames: ["Priya", "Alex", "Maya"],
  },
];

/** Past snapshots shown on Timeline (friend name → prior closeness / importance). */
const SAMPLE_HISTORY: { name: string; oldCloseness: number; oldImportance: number; ageDaysAgo: number }[] = [
  { name: "Maya", oldCloseness: 84, oldImportance: 92, ageDaysAgo: 21 },
  { name: "Maya", oldCloseness: 78, oldImportance: 88, ageDaysAgo: 56 },
  { name: "Theo", oldCloseness: 58, oldImportance: 70, ageDaysAgo: 40 },
  { name: "Riley", oldCloseness: 55, oldImportance: 68, ageDaysAgo: 33 },
];

export function seedIfEmpty(db: Database.Database) {
  const friendCount = db.prepare(`SELECT COUNT(*) AS c FROM friends`).get() as { c: number };
  if (friendCount.c > 0) return;

  const insertFriend = db.prepare(
    `INSERT INTO friends (
      id, name, tag, notes, closeness, importance, type, status, color, angle, avatar, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const insertHistory = db.prepare(
    `INSERT INTO friend_history (friend_id, recorded_at, old_closeness, old_importance)
     VALUES (?, ?, ?, ?)`,
  );

  const insertGroup = db.prepare(
    `INSERT INTO groups (id, name, purpose, icon, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );

  const insertMember = db.prepare(
    `INSERT INTO group_members (group_id, friend_id) VALUES (?, ?)`,
  );

  const now = Date.now();
  /** Map display name → id for groups & history wiring */
  const nameToId = new Map<string, string>();

  db.transaction(() => {
    SAMPLE_FRIENDS.forEach((d, idx) => {
      const id = nanoid();
      nameToId.set(d.name, id);
      insertFriend.run(
        id,
        d.name,
        d.tag,
        d.notes,
        d.closeness,
        d.importance,
        d.type,
        d.status,
        TYPE_COLORS[d.type],
        d.angle,
        null,
        now - (SAMPLE_FRIENDS.length - idx) * 60_000,
      );
    });

    const dayMs = 86_400_000;
    for (const h of SAMPLE_HISTORY) {
      const fid = nameToId.get(h.name);
      if (!fid) continue;
      insertHistory.run(fid, Math.floor(now - h.ageDaysAgo * dayMs), h.oldCloseness, h.oldImportance);
    }

    SAMPLE_GROUPS.forEach((g, gIdx) => {
      const gid = nanoid();
      const ts = now - (SAMPLE_GROUPS.length - gIdx) * 120_000;
      insertGroup.run(gid, g.name, g.purpose, g.icon, g.color, ts, ts);
      for (const memberName of g.memberNames) {
        const fid = nameToId.get(memberName);
        if (fid) insertMember.run(gid, fid);
      }
    });
  })();
}
