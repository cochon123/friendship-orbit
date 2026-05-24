"use client";

import { useMemo, useState } from "react";

import { IconScale, TitleWithIcon } from "@/components/icons/Icon";
import { emitToast, useAppData } from "@/components/providers/AppDataProvider";
import { TYPE_COLORS } from "@/lib/constants";

export default function ComparePage() {
  const { loading, friends } = useAppData();
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  const pair = useMemo(() => {
    if (!a || !b || a === b) return null;
    return {
      f1: friends.find((x) => x.id === a),
      f2: friends.find((x) => x.id === b),
    };
  }, [a, b, friends]);

  if (loading) {
    return <div className="fo-card text-[var(--fo-text-muted)]">Loading…</div>;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pair?.f1 || !pair?.f2) emitToast("Pick two distinct friends.");
  }

  const f1 = pair?.f1;
  const f2 = pair?.f2;
  const ok = !!(f1 && f2 && f1.id !== f2.id);

  return (
    <div className="fo-card">
      <TitleWithIcon icon={IconScale} className="mb-4">
        Compare friends
      </TitleWithIcon>
      <form className="mb-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto]" onSubmit={submit}>
        <label className="fo-form-label">
          Friend A
          <select className="fo-form-input mt-2" value={a} onChange={(e) => setA(e.target.value)}>
            <option value="">Select…</option>
            {friends.map((friend) => (
              <option key={friend.id} value={friend.id}>
                {friend.name}
              </option>
            ))}
          </select>
        </label>
        <label className="fo-form-label">
          Friend B
          <select className="fo-form-input mt-2" value={b} onChange={(e) => setB(e.target.value)}>
            <option value="">Select…</option>
            {friends.map((friend) => (
              <option key={friend.id} value={friend.id}>
                {friend.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="fo-btn fo-btn-primary self-end">
          Compare
        </button>
      </form>

      {ok && f1 && f2 ?
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {[f1, f2].map((pf) => (
              <div key={pf.id}>
                <div className="mb-4 flex items-center gap-3">
                  {pf.avatar ?
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pf.avatar}
                      alt=""
                      className="h-12 w-12 rounded-full border-2 object-cover"
                      style={{ borderColor: pf.color }}
                    />
                  : <div
                      className="flex h-12 w-12 items-center justify-center rounded-full font-bold text-white"
                      style={{ background: pf.color }}
                    >
                      {pf.name.slice(0, 2).toUpperCase()}
                    </div>
                  }
                  <h4 className="text-lg font-bold">{pf.name}</h4>
                </div>
                <div className="mb-4 rounded-xl border border-purple-950/35 bg-purple-950/25 p-3">
                  <div className="mb-2 text-[11px] text-[var(--fo-text-muted)]">Closeness</div>
                  <div className="text-xl font-black text-purple-300">{pf.closeness}</div>
                  <div className="fo-progress-track">
                    <div className="fo-progress-fill" style={{ width: `${pf.closeness}%` }} />
                  </div>
                </div>
                <div className="mb-4 rounded-xl border border-teal-950/35 bg-teal-950/20 p-3">
                  <div className="mb-2 text-[11px] text-[var(--fo-text-muted)]">Importance</div>
                  <div className="text-xl font-black text-teal-300">{pf.importance}</div>
                  <div className="fo-progress-track">
                    <div
                      className="fo-progress-fill bg-gradient-to-r from-teal-400 to-cyan-200"
                      style={{ width: `${pf.importance}%` }}
                    />
                  </div>
                </div>
                <div
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs font-semibold capitalize"
                  style={{ color: TYPE_COLORS[pf.type] }}
                >
                  Type · {pf.type}
                </div>
              </div>
            ))}
          </div>

          <div className="fo-card mt-5">
            <h4 className="mb-4 text-[15px] font-bold">Readout</h4>
            <p className="mb-4 rounded-xl border border-purple-900/35 bg-purple-950/20 p-4 text-[13px]">
              Closeness spread of{" "}
              <strong>{Math.abs(f1.closeness - f2.closeness)}</strong>
              {f1.closeness > f2.closeness
                ? ` — nearer today to ${f1.name}`
                : ` — nearer today to ${f2.name}`}{" "}
              on the orbit.
            </p>
            <p className="rounded-xl border border-purple-900/35 bg-purple-950/15 p-4 text-[13px]">
              Importance spread of{" "}
              <strong>{Math.abs(f1.importance - f2.importance)}</strong>
              {f1.importance > f2.importance
                ? ` — you weight ${f1.name} higher`
                : ` — you weight ${f2.name} higher`}
              .
            </p>
          </div>
        </>
      : friends.length >= 2 ?
        <p className="text-sm text-[var(--fo-text-muted)]">
          Pick two profiles to mirror the legacy compare tab.
        </p>
      : <p className="text-[var(--fo-text-muted)]">Add two friends before comparing.</p>}
    </div>
  );
}
