import { NextResponse } from "next/server";

import { normalizeGroupIcon } from "@/lib/groupIconIds";
import { deleteGroup, getAppState, updateGroup } from "@/server/store";

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
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const purpose = typeof b.purpose === "string" ? b.purpose.trim() : "";
  const rawIcon = typeof b.icon === "string" ? b.icon : "";
  const icon = normalizeGroupIcon(rawIcon);
  const color = typeof b.color === "string" ? b.color : "#ff8cc6";
  const memberIds = Array.isArray(b.memberIds)
    ? b.memberIds.filter((x): x is string => typeof x === "string")
    : [];

  if (!name || !purpose || !memberIds.length) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const dupe = getAppState().groups.find(
    (g) => g.id !== id && g.name.toLowerCase() === name.toLowerCase(),
  );
  if (dupe) {
    return NextResponse.json({ error: "A group with this name already exists" }, { status: 409 });
  }

  const group = updateGroup(id, { name, purpose, icon, color, memberIds });
  if (!group) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ group });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const removed = deleteGroup(id);
  if (!removed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
