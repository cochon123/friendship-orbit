"use client";

import Link from "next/link";

import { IconDownload, IconGalaxy, IconTrash } from "@/components/icons/Icon";
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
        <h1 className="flex items-center gap-2.5 text-[28px] font-extrabold tracking-tight">
          <IconGalaxy size={32} className="shrink-0 text-purple-300" aria-hidden />
          <Link href="/orbit">Friendship Orbit</Link>
        </h1>
        <p className="mt-1 text-[13px] text-[var(--fo-text-muted)]">
          SQLite-backed Next.js rewrite — organise your inner circle visually
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="fo-btn fo-btn-secondary inline-flex items-center gap-2" onClick={onExport}>
          <IconDownload size={18} aria-hidden />
          Export
        </button>
        <button type="button" className="fo-btn fo-btn-secondary inline-flex items-center gap-2" onClick={() => void onClear()}>
          <IconTrash size={18} aria-hidden />
          Clear All
        </button>
      </div>
    </header>
  );
}
