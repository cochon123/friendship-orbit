import { NextResponse } from "next/server";

import { patchFriendOrbit } from "@/server/store";

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
  const angle = Number(b.angle);
  const closeness = Number(b.closeness);
  if (!Number.isFinite(angle) || !Number.isFinite(closeness)) {
    return NextResponse.json({ error: "Invalid angle or closeness" }, { status: 400 });
  }

  const friend = patchFriendOrbit(id, { angle, closeness });
  if (!friend) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ friend });
}
