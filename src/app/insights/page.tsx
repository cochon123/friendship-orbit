"use client";

import type { ReactNode } from "react";

import {
  IconCircleBlackHole,
  IconLightbulb,
  IconSearchInsights,
  IconStar,
  IconThoughtBubble,
  IconWarningTriangle,
  TitleWithIcon,
} from "@/components/icons/Icon";
import { InsightHealthTrendIcon } from "@/components/icons/InsightHealthTrendIcon";
import { useAppData } from "@/components/providers/AppDataProvider";
import { getHealthStatus } from "@/lib/relationship";
import type { Friend } from "@/lib/types";

export default function InsightsPage() {
  const { loading, friends } = useAppData();

  if (loading || !friends.length) {
    return (
      <div className="fo-card text-[var(--fo-text-muted)]">
        {friends.length || loading ? "Loading…" : "Add friends first."}
      </div>
    );
  }

  const spots = friends.filter((f) => Math.abs(f.closeness - f.importance) > 20);

  const drifting = friends.filter(
    (f) => f.closeness < f.importance - 10 && f.status === "normal",
  );
  const blackHoles = friends.filter((f) => f.status !== "normal");
  const unbalanced = friends.filter((f) => Math.abs(f.closeness - f.importance) > 15);
  const growingStrong = friends.filter((f) => f.closeness > f.importance && f.closeness > 70);
  const types = new Set(friends.map((f) => f.type)).size;

  const recCards: ReactNode[] = [];
  if (blackHoles.length) {
    recCards.push(
      <div
        key="bh"
        className="rounded-[10px] border border-orange-500/25 bg-orange-950/20 px-3 py-3 text-[13px]"
      >
        <strong className="inline-flex items-center gap-2 text-orange-300">
          <IconCircleBlackHole size={18} aria-hidden /> Black hole orbit
        </strong>
        <p className="mt-1">
          {blackHoles.map((f) => f.name).join(", ")} marked as draining or deliberately closed — keep tending
          to boundaries.
        </p>
      </div>,
    );
  }
  if (drifting.length) {
    recCards.push(
      <div key="dr" className="rounded-[10px] border border-purple-500/25 px-3 py-3 text-[13px]">
        <strong className="inline-flex items-center gap-2">
          <IconLightbulb size={18} className="text-amber-200" aria-hidden /> Drifting ties
        </strong>
        <p className="mt-1 text-[var(--fo-text-muted)]">
          Consider checking in soon with {drifting.map((f) => f.name).join(", ")}.
        </p>
      </div>,
    );
  }
  if (unbalanced.length) {
    recCards.push(
      <div key="un" className="rounded-[10px] border border-purple-500/25 px-3 py-3 text-[13px]">
        <strong>Rebalance energy</strong>
        <p className="mt-1">
          You have {unbalanced.length} relationship(s) where closeness diverges noticeably from rated
          importance.
        </p>
      </div>,
    );
  }
  if (growingStrong.length) {
    recCards.push(
      <div key="gr" className="rounded-[10px] border border-teal-500/25 px-3 py-3 text-[13px]">
        <strong className="inline-flex items-center gap-2 text-teal-200">
          <IconStar size={18} aria-hidden /> Deepening bonds
        </strong>
        <p className="mt-1">{growingStrong.map((f) => f.name).join(", ")}</p>
      </div>,
    );
  }
  if (types < 3) {
    recCards.push(
      <div key="mix" className="rounded-[10px] border border-blue-400/25 px-3 py-3 text-[13px]">
        <strong>Diversify circles</strong>
        <p className="mt-1">
          Only {types} friend archetypes surfaced — widening who you lean on spreads risk.
        </p>
      </div>,
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="fo-card">
        <TitleWithIcon icon={IconSearchInsights} className="mb-4">
          Per-friend snapshots
        </TitleWithIcon>
        <div className="flex flex-col gap-3">
          {friends.map((f: Friend) => {
            const h = getHealthStatus(f);
            const gap = Math.abs(f.closeness - f.importance);
            const text =
              h.name === "Balanced" ? `${f.name} looks balanced — energy in ≈ importance out.`
              : h.name === "Growing" ?
                `${f.name} sits closer day-to-day than you rated importance.`
              : `Investment gap (${gap}) for ${f.name} — you may assign more bandwidth than reciprocity proves out.`;

            const badgeCls =
              h.class === "balanced" ? "fo-health-balanced"
              : h.class === "growing" ? "fo-health-growing"
              : "fo-health-onesided";

            return (
              <div
                key={f.id}
                className="rounded-[10px] border border-purple-900/25 bg-gradient-to-br from-purple-900/25 to-teal-900/10 px-4 py-3 text-[13px]"
              >
                <strong>{f.name}</strong>{" "}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] ${badgeCls}`}>
                  <InsightHealthTrendIcon variant={h.class} size={12} aria-hidden />
                  {h.name}
                </span>
                <p className="mt-2 text-[var(--fo-text-muted)]">{text}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="fo-card">
        <TitleWithIcon icon={IconWarningTriangle} className="mb-2" iconClassName="text-amber-300">
          Blind spots
        </TitleWithIcon>
        <p className="mb-4 text-[12px] text-[var(--fo-text-muted)]">
          Larger gaps between how close you actually are and how much weight you assign the bond.
        </p>
        {spots.length === 0 ?
          <p className="text-sm text-[var(--fo-text-muted)]">Nothing huge stands out.</p>
        : spots.map((f) => {
            const g = f.importance - f.closeness;
            const msg =
              g > 0 ?
                `You rank ${f.name} as higher importance (${g} pt gap) than current closeness shows.`
              : `Staying visibly closer (${Math.abs(g)} pt gap) to ${f.name} than importance implies.`;

            return (
              <div
                key={f.id}
                className="mb-3 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-3 text-[13px]"
              >
                <strong className="inline-flex items-center gap-2 text-amber-200">
                  <IconWarningTriangle size={17} aria-hidden /> {f.name}
                </strong>
                <p className="mt-1">{msg}</p>
              </div>
            );
          })}
      </div>

      <div className="fo-card">
        <TitleWithIcon icon={IconThoughtBubble} className="mb-4">
          Suggested focus
        </TitleWithIcon>
        {recCards.length === 0 ?
          <div className="inline-flex flex-wrap items-center gap-2 text-sm text-[var(--fo-text-muted)]">
            Looks healthy overall
            <IconStar size={16} className="text-purple-400" aria-hidden />
          </div>
        : <div className="space-y-3">{recCards}</div>
        }
      </div>
    </div>
  );
}
