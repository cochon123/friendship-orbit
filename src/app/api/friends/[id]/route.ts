import { NextResponse } from "next/server";

import type { FriendStatus, FriendType } from "@/lib/types";
import { deleteFriend, updateFriend } from "@/server/store";

export const runtime = "nodejs";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const avatar =
    "avatar" in b
      ? typeof b.avatar === "string"
        ? b.avatar
        : b.avatar === null
          ? null
          : undefined
      : undefined;

  const friend = updateFriend(id, {
    name: typeof b.name === "string" ? b.name : undefined,
    tag: typeof b.tag === "string" ? b.tag : undefined,
    notes: typeof b.notes === "string" ? b.notes : undefined,
    closeness: typeof b.closeness === "number" ? b.closeness : undefined,
    importance: typeof b.importance === "number" ? b.importance : undefined,
    type: typeof b.type === "string" ? (b.type as FriendType) : undefined,
    status: typeof b.status === "string" ? (b.status as FriendStatus) : undefined,
    avatar,
    angle: typeof b.angle === "number" ? b.angle : undefined,
  });

  if (!friend) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ friend });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const removed = deleteFriend(id);
  if (!removed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
