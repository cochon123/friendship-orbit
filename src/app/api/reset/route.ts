import { NextResponse } from "next/server";

import { clearAllData, getAppState } from "@/server/store";

export const runtime = "nodejs";

/** Clear all persisted app data while keeping migrations and empty schema. */
export async function DELETE() {
  clearAllData();
  return NextResponse.json({ ok: true, state: getAppState() });
}
