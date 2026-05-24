"use client";

import { useMemo, useState } from "react";

import { emitToast, useAppData } from "@/components/providers/AppDataProvider";
import { GROUP_COLORS } from "@/lib/constants";
import { enrichGroups, groupHealthEmoji, groupInsightLines, type EnrichedGroup } from "@/lib/groupStats";
import { getHealthStatus } from "@/lib/relationship";
import type { Friend } from "@/lib/types";

const ICONS = ["💪", "🎨", "🌍", "📚", "⚡", "💖", "🧠", "🤝", "🚀"];

export default function GroupsPage() {
  const { loading, friends, groups, createGroupReq, updateGroupReq, deleteGroupById } =
    useAppData();
  const enriched = useMemo(() => enrichGroups(friends, groups), [friends, groups]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [icon, setIcon] = useState(ICONS[0]!);
  const [color, setColor] = useState(GROUP_COLORS[0]!);
  const [memberSel, setMemberSel] = useState<Record<string, boolean>>({});

  const [detail, setDetail] = useState<EnrichedGroup | null>(null);

  if (loading) {
    return <div className="fo-card text-[var(--fo-text-muted)]">Loading constellations…</div>;
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setPurpose("");
    setIcon(ICONS[0]!);
    setColor(GROUP_COLORS[0]!);
    setMemberSel({});
  }

  function openCreate() {
    resetForm();
    setModalOpen(true);
  }

  function openEdit(g: EnrichedGroup) {
    setEditingId(g.id);
    setName(g.name);
    setPurpose(g.purpose);
    setIcon(g.icon);
    setColor(g.color);
    const ids: Record<string, boolean> = {};
    friends.forEach((f) => {
      ids[f.id] = g.memberIds.includes(f.id);
    });
    setMemberSel(ids);
    setModalOpen(true);
  }

  function toggleMember(id: string) {
    setMemberSel((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function submitGroup(e: React.FormEvent) {
    e.preventDefault();
    const memberIds = Object.entries(memberSel).filter(([, ok]) => ok).map(([id]) => id);
    const dupe =
      enriched.find(
        (g) => g.name.toLowerCase() === name.trim().toLowerCase() && g.id !== editingId,
      ) !== undefined;

    if (!name.trim()) {
      emitToast("Name needed");
      return;
    }
    if (!purpose.trim()) {
      emitToast("Purpose needed");
      return;
    }
    if (!memberIds.length) {
      emitToast("Select at least one friend");
      return;
    }
    if (memberIds.length > 20) {
      emitToast("Max 20 members");
      return;
    }
    if (dupe) {
      emitToast("That group name exists");
      return;
    }

    if (editingId) await updateGroupReq(editingId, { name, purpose, icon, color, memberIds });
    else await createGroupReq({ name, purpose, icon, color, memberIds });

    setModalOpen(false);
    resetForm();
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold">⭐ Constellations</h2>
          <p className="mt-1 text-[13px] text-[var(--fo-text-muted)]">
            Themed bundles — synced to SQLite with living membership joins.
          </p>
        </div>
        <button type="button" className="fo-btn fo-btn-primary" onClick={openCreate}>
          + Create group
        </button>
      </div>

      {!enriched.length ?
        <div className="fo-card py-12 text-center text-[var(--fo-text-muted)]">
          No constellations yet — craft one whenever a cluster earns its own label.
        </div>
      : <div className="grid gap-[18px] md:grid-cols-2">
          {enriched.map((g) => (
            <div
              key={g.id}
              className="fo-card rounded-[14px]"
              style={{ borderLeft: `4px solid ${g.color}` }}
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate text-[16px] font-extrabold">
                    {g.icon} {g.name}
                  </h3>
                  <p className="truncate text-[12px] text-[var(--fo-text-muted)]">{g.purpose}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    className="fo-btn fo-btn-secondary px-2 py-1 text-[11px]"
                    onClick={() => openEdit(g)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="fo-btn fo-btn-danger px-2 py-1 text-[11px]"
                    onClick={() => {
                      if (window.confirm(`Delete ${g.name}? Friends stay untouched.`))
                        void deleteGroupById(g.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Members" val={String(g.stats.count)} />
                <MiniStat label="Closeness" val={String(g.stats.avgCloseness)} />
                <div className="rounded-[10px] border border-purple-900/35 bg-purple-950/25 p-2">
                  <div className="text-[11px] text-[var(--fo-text-muted)]">Health</div>
                  <div className="mt-1 inline-flex rounded-full px-2 py-1 text-[11px] font-bold capitalize">
                    <span
                      className={
                        g.stats.health === "balanced" ? "fo-health-balanced"
                        : g.stats.health === "growing" ? "fo-health-growing"
                        : g.stats.health === "onesided" ? "fo-health-onesided"
                        : "fo-health-drifting"
                      }
                    >
                      {groupHealthEmoji(g.stats.health)} {g.stats.health}
                    </span>
                  </div>
                </div>
              </div>

              <MemberStack members={g.members} color={g.color} />

              <button
                type="button"
                className="fo-btn fo-btn-primary mt-3 w-full py-2 text-[12px]"
                onClick={() => setDetail(g)}
              >
                View details →
              </button>
            </div>
          ))}
        </div>
      }

      <div className={`fo-modal ${modalOpen ? "fo-modal-open" : ""}`}>
        <div className="fo-modal-panel relative z-10">
          <div className="mb-6 flex justify-between gap-6">
            <h2 className="text-[18px] font-bold">{editingId ? "Edit constellation" : "Create constellation"}</h2>
            <button
              type="button"
              className="fo-btn fo-btn-secondary px-3 py-1"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            >
              ×
            </button>
          </div>
          <form className="flex flex-col gap-3" onSubmit={(e) => void submitGroup(e)}>
            <label className="fo-form-label">
              Name
              <input className="fo-form-input mt-2" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="fo-form-label">
              Purpose
              <textarea
                className="fo-form-input mt-2 min-h-[68px]"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </label>

            <div>
              <p className="fo-form-label">Icon</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    className={`h-10 w-10 rounded-[10px] border text-xl ${
                      ic === icon
                        ? "border-purple-500 bg-purple-900/35"
                        : "border-white/10 bg-white/5 hover:border-purple-600"
                    }`}
                    onClick={() => setIcon(ic)}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="fo-form-label">Colour</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {GROUP_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Pick ${c}`}
                    style={{ background: c }}
                    className={`h-8 w-8 rounded-full border-[3px] ${
                      c === color ? "border-white" : "border-transparent"
                    }`}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="fo-form-label mb-2">Members</p>
              <div className="grid max-h-[190px] grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.02] p-2">
                {friends.map((f) => (
                  <label
                    key={f.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-2 text-[13px] ${
                      memberSel[f.id]
                        ? "border-purple-500/40 bg-purple-900/35"
                        : "border-transparent bg-white/[0.03]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!memberSel[f.id]}
                      onChange={() => toggleMember(f.id)}
                      className="accent-purple-500"
                    />
                    <span>{f.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-4">
              <button type="submit" className="fo-btn fo-btn-primary">
                {editingId ? "Save changes" : "Create"}
              </button>
              <button
                type="button"
                className="fo-btn fo-btn-secondary"
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className={`fo-modal ${detail ? "fo-modal-open" : ""}`}>
        {detail ?
          <div className="fo-modal-panel z-10 relative max-w-[760px]" style={{ width: 760 }}>
            <div className="mb-4 flex justify-between gap-8">
              <h2 className="text-xl font-bold">
                {detail.icon} {detail.name}
              </h2>
              <button type="button" className="fo-btn fo-btn-secondary" onClick={() => setDetail(null)}>
                ×
              </button>
            </div>
            <blockquote className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-5 text-[13px] italic">
              "{detail.purpose}"
            </blockquote>
            <div className="mb-6 grid grid-cols-4 gap-2 text-[13px]">
              <MiniStat label="Members" val={String(detail.stats.count)} />
              <MiniStat label="Avg closeness" val={String(detail.stats.avgCloseness)} />
              <MiniStat label="Avg importance" val={String(detail.stats.avgImportance)} />
              <MiniStat label="Health score" val={String(detail.stats.healthScore)} />
            </div>
            <div className="mb-8 grid grid-cols-3 gap-2">
              <StatPill accent="balanced" title="Balanced" n={detail.stats.breakdown.balanced} />
              <StatPill accent="growing" title="Growing" n={detail.stats.breakdown.growing} />
              <StatPill accent="onesided" title="One-sided" n={detail.stats.breakdown.onesided} />
            </div>
            <h4 className="mb-2 text-[13px] font-bold">Members ({detail.members.length})</h4>
            <div className="mb-6 flex max-h-[360px] flex-col gap-2 overflow-y-auto pr-2">
              {detail.members.map((m) => {
                const hs = getHealthStatus(m);
                const badgeCls =
                  hs.class === "balanced"
                    ? "fo-health-balanced"
                    : hs.class === "growing"
                      ? "fo-health-growing"
                      : "fo-health-onesided";
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-2"
                  >
                    {m.avatar ?
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                    : <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-white"
                        style={{ background: m.color }}
                      >
                      {m.name.slice(0, 2)}
                    </div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">{m.name}</div>
                    <div className="text-[11px] text-[var(--fo-text-muted)] truncate">{m.tag}</div>
                  </div>
                  <div className="text-[11px] text-right tabular-nums">
                    <div className="text-purple-400">{m.closeness}</div>
                    <div className="text-teal-400">{m.importance}</div>
                  </div>
                  <span className={`text-[10px] capitalize ${badgeCls}`}>
                    {hs.icon} {hs.name}
                  </span>
                </div>
                );
              })}
            </div>
            <div>
              <h4 className="mb-3 text-[13px] font-bold">Signals</h4>
              {groupInsightLines(detail).map((line, i) => (
                <p
                  key={i}
                  className="mb-3 rounded-lg border border-purple-950/35 bg-purple-950/25 px-3 py-2 text-[13px]"
                >
                  {line}
                </p>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="fo-btn fo-btn-secondary"
                onClick={() => {
                  setDetail(null);
                  openEdit(detail);
                }}
              >
                Edit group
              </button>
              <button
                type="button"
                className="fo-btn fo-btn-danger"
                onClick={() => {
                  if (window.confirm(`Delete "${detail.name}"?`)) {
                    void deleteGroupById(detail.id);
                    setDetail(null);
                  }
                }}
              >
                Delete group
              </button>
            </div>
          </div>
        : null}
      </div>
    </div>
  );
}

function MiniStat({ label, val }: { label: string; val: string }) {
  return (
    <div className="rounded-[10px] border border-purple-950/35 bg-purple-950/25 p-2 text-[11px]">
      <div className="text-[var(--fo-text-muted)]">{label}</div>
      <div className="text-[20px] font-extrabold">{val}</div>
    </div>
  );
}

function StatPill({ title, n, accent }: { title: string; n: number; accent: "balanced" | "growing" | "onesided" }) {
  const cls =
    accent === "balanced" ? "border-emerald-500/25 bg-emerald-950/20 text-emerald-300"
    : accent === "growing" ? "border-teal-500/25 bg-teal-950/25 text-teal-300"
    : "border-amber-500/25 bg-amber-950/20 text-amber-300";
  return (
    <div className={`rounded-xl border px-4 py-2 text-center text-[11px] font-bold capitalize ${cls}`}>
      <div>{title}</div>
      <div className="text-[20px] font-black text-white">{n}</div>
    </div>
  );
}

function MemberStack({ members, color }: { members: Friend[]; color: string }) {
  const preview = members.slice(0, 4);
  const extra = members.length - preview.length;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--fo-text-muted)]">
      <div className="flex pl-3">
        {preview.map((m) => (
          <div
            key={m.id}
            className="-ml-3 h-8 w-8 overflow-hidden rounded-full border-[2px]"
            style={{ borderColor: color }}
          >
            {m.avatar ?
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.avatar} alt="" className="h-full w-full object-cover" />
            : <div
                className="flex h-full w-full items-center justify-center text-[9px] font-bold text-white"
                style={{ background: m.color }}
              >
                {m.name.slice(0, 2)}
              </div>}
          </div>
        ))}
        {extra > 0 && (
          <div className="-ml-3 flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-white/40 bg-black/35 text-[9px] font-bold">
            +{extra}
          </div>
        )}
      </div>
      <span className="line-clamp-1">{members.map((m) => m.name).join(", ") || "—"}</span>
    </div>
  );
}
