import { NextResponse } from "next/server";

import type { FriendStatus, FriendType } from "@/lib/types";
import { createFriend, getAppState } from "@/server/store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ friends: getAppState().friends });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name : "";
  if (!name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const allowedTypes = ["inner", "creative", "steady", "growing"];
  const ft = typeof b.type === "string" ? b.type : "";
  if (!allowedTypes.includes(ft)) {
    return NextResponse.json({ error: "Invalid friend type" }, { status: 400 });
  }

  const fs = typeof b.status === "string" ? b.status : "normal";
  if (!["normal", "toxic", "cutoff"].includes(fs)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const friend = createFriend({
    name,
    tag: typeof b.tag === "string" ? b.tag : "",
    notes: typeof b.notes === "string" ? b.notes : "",
    closeness: Number(b.closeness),
    importance: Number(b.importance),
    type: ft as FriendType,
    status: fs as FriendStatus,
    avatar: typeof b.avatar === "string" ? b.avatar : null,
    angle: typeof b.angle === "number" ? b.angle : undefined,
  });

  if (!Number.isFinite(friend.closeness) || !Number.isFinite(friend.importance)) {
    return NextResponse.json({ error: "Invalid closeness or importance" }, { status: 400 });
  }

  return NextResponse.json({ friend }, { status: 201 });
}
