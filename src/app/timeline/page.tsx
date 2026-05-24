"use client";

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
      <h3 className="mb-4 text-[15px] font-bold">📅 Relationship timeline</h3>
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
                  <span className="font-bold text-teal-400"> ↑ +{e.change}</span>
                : <span className="font-bold text-pink-400"> ↓ {e.change}</span>}
              </div>
              <div className="text-[11px] text-[var(--fo-text-muted)]">
                Closeness snapshot: {e.oldC} → current {e.newC}
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}
