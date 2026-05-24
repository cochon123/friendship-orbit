"use client";

import { IconArrowDown, IconArrowRight, IconArrowUp, IconCalendar, TitleWithIcon } from "@/components/icons/Icon";
import { useAppData } from "@/components/providers/AppDataProvider";

export default function TimelinePage() {
  const { loading, friends } = useAppData();

  if (loading) {
    return <div className="fo-card text-[var(--fo-text-muted)]">Loading timeline…</div>;
  }

  const events: Array<{
    date: number;
    friendName: string;
    oldC: number;
    newC: number;
    change: number;
  }> = [];
  for (const f of friends) {
    for (const h of f.history ?? []) {
      events.push({
        date: h.date,
        friendName: f.name,
        oldC: h.closeness,
        newC: f.closeness,
        change: f.closeness - h.closeness,
      });
    }
  }
  events.sort((a, b) => b.date - a.date);

  return (
    <div className="fo-card">
      <TitleWithIcon icon={IconCalendar} className="mb-4">
        Relationship timeline
      </TitleWithIcon>
      {!events.length ?
        <p className="text-sm text-[var(--fo-text-muted)]">
          No history yet — edit someone’s closeness or importance from Friends to record a change.
        </p>
      : <div>
          {events.map((e) => (
            <div
              key={`${e.friendName}-${e.date}-${e.oldC}`}
              className="mb-3 rounded-lg border border-l-[3px] border-purple-500/25 bg-white/[0.03] px-3 py-3"
            >
              <div className="mb-1 text-[11px] text-[var(--fo-text-muted)]">
                {new Date(e.date).toLocaleDateString()}
              </div>
              <div className="mb-1 text-[13px]">
                <strong>{e.friendName}</strong>
                {e.change > 0 ?
                  <span className="inline-flex items-center gap-1 font-bold text-teal-400">
                    <IconArrowUp size={14} aria-hidden /> +{e.change}
                  </span>
                : <span className="inline-flex items-center gap-1 font-bold text-pink-400">
                    <IconArrowDown size={14} aria-hidden /> {e.change}
                  </span>}
              </div>
              <div className="flex flex-wrap items-center gap-1 text-[11px] text-[var(--fo-text-muted)]">
                Closeness snapshot: {e.oldC}
                <IconArrowRight size={13} aria-hidden /> current {e.newC}
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}
