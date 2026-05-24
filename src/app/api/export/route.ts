import { NextResponse } from "next/server";

import { getAppState } from "@/server/store";

export const runtime = "nodejs";

export async function GET() {
  const state = getAppState();
  const payload = {
    exported: new Date().toISOString(),
    friends: state.friends.map((f) => ({
      ...f,
      avatar: f.avatar ? "[base64]" : null,
    })),
    groups: state.groups.map((g) => ({
      id: g.id,
      name: g.name,
      purpose: g.purpose,
      icon: g.icon,
      color: g.color,
      memberIds: g.memberIds,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    })),
    stats: {
      total: state.friends.length,
      avgCloseness: state.friends.length
        ? Math.round(
            state.friends.reduce((t, f) => t + f.closeness, 0) / state.friends.length,
          )
        : 0,
      avgImportance: state.friends.length
        ? Math.round(
            state.friends.reduce((t, f) => t + f.importance, 0) / state.friends.length,
          )
        : 0,
    },
    profileNote: state.profile.userAvatar
      ? "userAvatar omitted in export stub; fetch full snapshot via SQLite backup instead"
      : null,
  };
  const body = JSON.stringify(payload, null, 2);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="friendship-orbit-export.json"`,
    },
  });
}
