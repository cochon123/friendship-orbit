import { NextResponse } from "next/server";

import { EMPTY_APP_STATE } from "@/lib/types";
import { getAppState } from "@/server/store";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(getAppState());
  } catch (err) {
    console.error("[api/app]", err);

    /** Still return JSON so clients never choke on HTML/empty 500 bodies. */
    return NextResponse.json(EMPTY_APP_STATE, {
      status: 503,
      headers: {
        "X-Friendship-Orbit-Error": "database-unavailable",
      },
    });
  }
}
