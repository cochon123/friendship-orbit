"use client";

import { useMemo } from "react";

import { useAppData } from "@/components/providers/AppDataProvider";
import { TYPE_COLORS } from "@/lib/constants";
import type { FriendType } from "@/lib/types";

export default function AnalyticsPage() {
  const { loading, friends } = useAppData();

  const stats = useMemo(() => {
    if (!friends.length) return null;
    const avgC = Math.round(friends.reduce((t, f) => t + f.closeness, 0) / friends.length);
    const avgI = Math.round(friends.reduce((t, f) => t + f.importance, 0) / friends.length);
    const closest = [...friends].sort((a, b) => b.closeness - a.closeness).slice(0, 3);
    const important = [...friends].sort((a, b) => b.importance - a.importance).slice(0, 3);
    const byType = friends.reduce(
      (acc, f) => {
        acc[f.type as FriendType] = (acc[f.type as FriendType] ?? 0) + 1;
        return acc;
      },
      {} as Record<FriendType, number>,
    );
    const balanced = friends.filter((f) => Math.abs(f.closeness - f.importance) < 10).length;
    const growing = friends.filter((f) => f.closeness > f.importance).length;
    const onesided = friends.filter((f) => f.closeness < f.importance - 10).length;
    const drifting = friends.filter(
      (f) => f.closeness < f.importance && Math.abs(f.closeness - f.importance) >= 10,
    ).length;
    const most = [...friends].sort((a, b) => {
      const na = friends.filter((f) => Math.abs(f.closeness - a.closeness) < 15).length;
      const nb = friends.filter((f) => Math.abs(f.closeness - b.closeness) < 15).length;
      return nb - na;
    })[0];
    const blackHoles = friends.filter((f) => f.status !== "normal");

    const rowFn = (f: (typeof friends)[0], v: number) => (
      <div key={f.id} className="border-b border-[var(--fo-border)] py-2 text-xs last:border-none">
        <div className="mb-1 flex justify-between">
          <strong>{f.name}</strong>
          <span>{v}/100</span>
        </div>
        <div className="fo-progress-track">
          <div className="fo-progress-fill" style={{ width: `${v}%` }} />
        </div>
      </div>
    );

    return {
      avgC,
      avgI,
      closest,
      important,
      byType,
      balanced,
      growing,
      onesided,
      drifting,
      most,
      blackHoles,
      rowFn,
    };
  }, [friends]);

  if (loading) {
    return <div className="fo-card text-[var(--fo-text-muted)]">Loading analytics…</div>;
  }
  if (!stats) {
    return <div className="fo-card text-[var(--fo-text-muted)]">No friends to analyse yet.</div>;
  }

  return (
    <div className="grid gap-[18px] md:grid-cols-2 lg:grid-cols-3">
      <div className="fo-card">
        <h3 className="mb-3.5 text-[15px] font-bold">📊 Overview</h3>
        <div className="mb-3 rounded-[10px] border border-purple-900/35 bg-purple-950/25 p-3">
          <div className="text-xs text-[var(--fo-text-muted)]">Total Friends</div>
          <div className="text-2xl font-extrabold">{friends.length}</div>
        </div>
        <div className="mb-3 rounded-[10px] border border-purple-900/35 bg-purple-950/25 p-3">
          <div className="text-xs text-[var(--fo-text-muted)]">Avg Closeness</div>
          <div className="text-2xl font-extrabold">{stats.avgC}</div>
        </div>
        <div className="rounded-[10px] border border-teal-900/35 bg-teal-950/20 p-3">
          <div className="text-xs text-[var(--fo-text-muted)]">Avg Importance</div>
          <div className="text-2xl font-extrabold">{stats.avgI}</div>
        </div>
      </div>

      <div className="fo-card">
        <h3 className="mb-3.5 text-[15px] font-bold">❤️ Closest</h3>
        {stats.closest.map((f) => stats.rowFn(f, f.closeness))}
      </div>

      <div className="fo-card">
        <h3 className="mb-3.5 text-[15px] font-bold">⭐ Most important</h3>
        {stats.important.map((f) => stats.rowFn(f, f.importance))}
      </div>

      <div className="fo-card">
        <h3 className="mb-3.5 text-[15px] font-bold">✨ Health mix</h3>
        <div className="flex flex-col gap-2 text-[13px] font-bold">
          <span className="fo-health-balanced">✓ {stats.balanced} balanced</span>
          <span className="fo-health-growing">↑ {stats.growing} growing</span>
          <span className="fo-health-onesided">→ {stats.onesided} one-sided</span>
          <span className="fo-health-drifting">↓ {stats.drifting} drifting</span>
        </div>
      </div>

      <div className="fo-card">
        <h3 className="mb-3.5 text-[15px] font-bold">👥 By type</h3>
        {(Object.entries(stats.byType) as [FriendType, number][]).map(([t, c]) => (
          <div key={t} className="mb-2 flex justify-between text-xs">
            <span style={{ color: TYPE_COLORS[t] }} className="font-semibold capitalize">
              {t}
            </span>
            <strong>{c}</strong>
          </div>
        ))}
      </div>

      <div className="fo-card">
        <h3 className="mb-3.5 text-[15px] font-bold">🎯 Network</h3>
        <div className="space-y-2 text-[13px]">
          <p>
            You have <strong>{friends.length}</strong> friend{friends.length !== 1 ? "s" : ""}.
          </p>
          <p>
            <strong>{stats.balanced}</strong> balanced today.
          </p>
          {stats.blackHoles.length > 0 && (
            <p className="text-orange-400">
              ⚫ {stats.blackHoles.length} black hole{stats.blackHoles.length !== 1 ? "s" : ""}.
            </p>
          )}
          <p>
            Density anchor: <strong>{stats.most ? stats.most.name : "N/A"}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
