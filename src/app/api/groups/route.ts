import { NextResponse } from "next/server";

import { normalizeGroupIcon } from "@/lib/groupIconIds";
import { createGroup, getAppState } from "@/server/store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ groups: getAppState().groups });
}

export async function POST(request: Request) {
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

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!purpose) {
    return NextResponse.json({ error: "Purpose is required" }, { status: 400 });
  }
  if (!memberIds.length) {
    return NextResponse.json({ error: "At least one member is required" }, { status: 400 });
  }

  const existing = getAppState().groups.find((g) => g.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    return NextResponse.json({ error: "A group with this name already exists" }, { status: 409 });
  }

  try {
    const group = createGroup({ name, purpose, icon, color, memberIds });
    return NextResponse.json({ group }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create group" }, { status: 400 });
  }
}
