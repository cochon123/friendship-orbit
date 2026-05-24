import { NextResponse } from "next/server";

import { getProfile, setUserAvatar } from "@/server/store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getProfile());
}

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const avatar =
    "userAvatar" in b
      ? typeof b.userAvatar === "string"
        ? b.userAvatar
        : b.userAvatar === null
          ? null
          : undefined
      : undefined;

  if (avatar === undefined) {
    return NextResponse.json({ error: "userAvatar is required" }, { status: 400 });
  }

  setUserAvatar(avatar);
  return NextResponse.json(getProfile());
}
