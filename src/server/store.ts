import "server-only";

import { nanoid } from "nanoid";

import { TYPE_COLORS } from "@/lib/constants";
import type {
  AppState,
  Friend,
  FriendHistoryEntry,
  FriendStatus,
  FriendType,
  GroupRow,
  Profile,
} from "@/lib/types";

import { getDb } from "./db";

type FriendRow = {
  id: string;
  name: string;
  tag: string;
  notes: string;
  closeness: number;
  importance: number;
  type: string;
  status: string;
  color: string;
  angle: number;
  avatar: string | null;
  createdAt: number;
};

export function fetchFriends(db: ReturnType<typeof getDb>): Friend[] {
  const friends = db
    .prepare(
      `SELECT id, name, tag, notes, closeness, importance, type, status,
              color, angle, avatar, created_at AS createdAt
       FROM friends ORDER BY created_at ASC`,
    )
    .all() as FriendRow[];

  const historyRows = db
    .prepare(
      `SELECT friend_id AS friendId, recorded_at AS recordedAt,
              old_closeness AS oldCloseness, old_importance AS oldImportance
       FROM friend_history ORDER BY recorded_at ASC`,
    )
    .all() as Array<{
      friendId: string;
      recordedAt: number;
      oldCloseness: number;
      oldImportance: number;
    }>;

  const historyByFriend = new Map<string, FriendHistoryEntry[]>();
  for (const h of historyRows) {
    const list = historyByFriend.get(h.friendId) ?? [];
    list.push({
      date: h.recordedAt,
      closeness: h.oldCloseness,
      importance: h.oldImportance,
    });
    historyByFriend.set(h.friendId, list);
  }

  return friends.map((f) => ({
    ...f,
    type: f.type as Friend["type"],
    status: f.status as Friend["status"],
    history: historyByFriend.get(f.id) ?? [],
  }));
}

export function fetchGroups(db: ReturnType<typeof getDb>): GroupRow[] {
  const groups = db
    .prepare(
      `SELECT id, name, purpose, icon, color, created_at AS createdAt, updated_at AS updatedAt
       FROM groups ORDER BY updated_at DESC`,
    )
    .all() as Omit<GroupRow, "memberIds">[];

  const members = db
    .prepare(`SELECT group_id AS groupId, friend_id AS friendId FROM group_members`)
    .all() as { groupId: string; friendId: string }[];

  const memberMap = new Map<string, string[]>();
  for (const m of members) {
    const list = memberMap.get(m.groupId) ?? [];
    list.push(m.friendId);
    memberMap.set(m.groupId, list);
  }

  return groups.map((g) => ({ ...g, memberIds: memberMap.get(g.id) ?? [] }));
}

export function getProfile(): Profile {
  return fetchProfile(getDb());
}

export function fetchProfile(db: ReturnType<typeof getDb>): Profile {
  const row = db.prepare(`SELECT user_avatar AS userAvatar FROM profile WHERE id = 1`).get() as
    | { userAvatar: string | null }
    | undefined;
  return { userAvatar: row?.userAvatar ?? null };
}

export function getAppState(): AppState {
  const db = getDb();
  return {
    profile: fetchProfile(db),
    friends: fetchFriends(db),
    groups: fetchGroups(db),
  };
}

export function createFriend(input: {
  name: string;
  tag?: string;
  notes?: string;
  closeness: number;
  importance: number;
  type: FriendType;
  status?: FriendStatus;
  angle?: number;
  avatar?: string | null;
}): Friend {
  const db = getDb();
  const count = db.prepare(`SELECT COUNT(*) AS c FROM friends`).get() as { c: number };

  const row: Omit<Friend, "history"> = {
    id: nanoid(),
    name: input.name.trim(),
    tag: (input.tag ?? "").trim(),
    notes: (input.notes ?? "").trim(),
    closeness: input.closeness,
    importance: input.importance,
    type: input.type,
    status: input.status ?? "normal",
    color: TYPE_COLORS[input.type],
    angle: input.angle ?? count.c * 72,
    avatar: input.avatar ?? null,
    createdAt: Date.now(),
  };

  db.prepare(
    `INSERT INTO friends (
      id, name, tag, notes, closeness, importance, type, status, color, angle, avatar, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id,
    row.name,
    row.tag,
    row.notes,
    row.closeness,
    row.importance,
    row.type,
    row.status,
    row.color,
    row.angle,
    row.avatar,
    row.createdAt,
  );

  return { ...row, history: [] };
}

export function updateFriend(
  id: string,
  input: Partial<{
    name: string;
    tag: string;
    notes: string;
    closeness: number;
    importance: number;
    type: FriendType;
    status: FriendStatus;
    avatar: string | null;
    angle: number;
  }>,
): Friend | null {
  const db = getDb();
  const existing = db
    .prepare(
      `SELECT id, name, tag, notes, closeness, importance, type, status,
              color, angle, avatar, created_at AS createdAt FROM friends WHERE id = ?`,
    )
    .get(id) as FriendRow | undefined;
  if (!existing) return null;

  const nextType = input.type ?? (existing.type as FriendType);

  const next = {
    name: (input.name ?? existing.name).trim(),
    tag: (input.tag ?? existing.tag).trim(),
    notes: (input.notes ?? existing.notes).trim(),
    closeness: input.closeness ?? existing.closeness,
    importance: input.importance ?? existing.importance,
    type: nextType,
    status: (input.status ?? existing.status) as FriendStatus,
    color: TYPE_COLORS[nextType],
    angle: input.angle ?? existing.angle,
    avatar: input.avatar !== undefined ? input.avatar : existing.avatar,
  };

  const closenessChanged = next.closeness !== existing.closeness;
  const importanceChanged = next.importance !== existing.importance;

  db.prepare(
    `UPDATE friends SET
      name = ?, tag = ?, notes = ?, closeness = ?, importance = ?,
      type = ?, status = ?, color = ?, angle = ?, avatar = ?
     WHERE id = ?`,
  ).run(
    next.name,
    next.tag,
    next.notes,
    next.closeness,
    next.importance,
    next.type,
    next.status,
    next.color,
    next.angle,
    next.avatar,
    id,
  );

  if (
    (closenessChanged || importanceChanged) &&
    (input.closeness !== undefined || input.importance !== undefined)
  ) {
    db.prepare(
      `INSERT INTO friend_history (friend_id, recorded_at, old_closeness, old_importance)
       VALUES (?, ?, ?, ?)`,
    ).run(id, Date.now(), existing.closeness, existing.importance);
  }

  return fetchFriends(db).find((f) => f.id === id) ?? null;
}

export function patchFriendOrbit(
  id: string,
  orbit: { angle: number; closeness: number },
): Friend | null {
  const db = getDb();
  const existing = db.prepare(`SELECT id FROM friends WHERE id = ?`).get(id);
  if (!existing) return null;

  db.prepare(`UPDATE friends SET angle = ?, closeness = ? WHERE id = ?`).run(
    orbit.angle,
    Math.round(orbit.closeness),
    id,
  );

  return fetchFriends(db).find((f) => f.id === id) ?? null;
}

export function deleteFriend(id: string): boolean {
  const db = getDb();
  const res = db.prepare(`DELETE FROM friends WHERE id = ?`).run(id);
  db.prepare(`DELETE FROM group_members WHERE friend_id = ?`).run(id);
  return res.changes > 0;
}

export function setUserAvatar(avatar: string | null) {
  const db = getDb();
  db.prepare(`UPDATE profile SET user_avatar = ? WHERE id = 1`).run(avatar);
}

export function createGroup(input: {
  name: string;
  purpose: string;
  icon: string;
  color: string;
  memberIds: string[];
}): GroupRow {
  const db = getDb();
  const id = nanoid();
  const now = Date.now();
  db.transaction(() => {
    db.prepare(
      `INSERT INTO groups (id, name, purpose, icon, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, input.name.trim(), input.purpose.trim(), input.icon, input.color, now, now);

    const insertMember = db.prepare(
      `INSERT OR IGNORE INTO group_members (group_id, friend_id) VALUES (?, ?)`,
    );
    for (const fid of input.memberIds) {
      insertMember.run(id, fid);
    }
  })();
  return fetchGroups(db).find((g) => g.id === id)!;
}

export function updateGroup(
  id: string,
  input: { name: string; purpose: string; icon: string; color: string; memberIds: string[] },
): GroupRow | null {
  const db = getDb();
  const existing = db.prepare(`SELECT id FROM groups WHERE id = ?`).get(id);
  if (!existing) return null;

  const now = Date.now();
  db.transaction(() => {
    db.prepare(
      `UPDATE groups SET name = ?, purpose = ?, icon = ?, color = ?, updated_at = ?
       WHERE id = ?`,
    ).run(input.name.trim(), input.purpose.trim(), input.icon, input.color, now, id);

    db.prepare(`DELETE FROM group_members WHERE group_id = ?`).run(id);
    const insertMember = db.prepare(
      `INSERT INTO group_members (group_id, friend_id) VALUES (?, ?)`,
    );
    for (const fid of input.memberIds) {
      insertMember.run(id, fid);
    }
  })();

  return fetchGroups(db).find((g) => g.id === id) ?? null;
}

export function deleteGroup(id: string): boolean {
  const db = getDb();
  const res = db.prepare(`DELETE FROM groups WHERE id = ?`).run(id);
  return res.changes > 0;
}

export function clearAllData() {
  const db = getDb();
  db.exec(`
    DELETE FROM group_members;
    DELETE FROM groups;
    DELETE FROM friend_history;
    DELETE FROM friends;
    UPDATE profile SET user_avatar = NULL WHERE id = 1;
  `);
}
