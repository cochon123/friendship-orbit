"use client";

import Link from "next/link";

import { emitToast, useAppData } from "@/components/providers/AppDataProvider";

export function SiteHeader() {
  const { exportJsonUrl, clearEverything } = useAppData();

  function onExport() {
    window.location.href = exportJsonUrl();
    emitToast("Export started (avatars redacted in JSON)");
  }

  async function onClear() {
    if (!window.confirm("Delete ALL data? This cannot be undone.")) return;
    await clearEverything();
  }

  return (
    <header className="fo-header-wrap mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-purple-400/25 bg-gradient-to-br from-purple-600/15 to-cyan-400/10 px-[22px] py-[18px] shadow-xl backdrop-blur-[12px]">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tight">
          🌌 <Link href="/orbit">Friendship Orbit</Link>
        </h1>
        <p className="mt-1 text-[13px] text-[var(--fo-text-muted)]">
          SQLite-backed Next.js rewrite — organise your inner circle visually
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="fo-btn fo-btn-secondary" onClick={onExport}>
          📥 Export
        </button>
        <button type="button" className="fo-btn fo-btn-secondary" onClick={() => void onClear()}>
          🗑️ Clear All
        </button>
      </div>
    </header>
  );
}
