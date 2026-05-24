"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  IconBiohazard,
  IconClose,
  IconScissors,
} from "@/components/icons/Icon";
import { InsightHealthTrendIcon } from "@/components/icons/InsightHealthTrendIcon";
import { emitToast, useAppData } from "@/components/providers/AppDataProvider";
import { getHealthStatus } from "@/lib/relationship";
import type { Friend, FriendStatus, FriendType } from "@/lib/types";

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function FriendsPage() {
  const {
    loading,
    friends,
    selectedFriendId,
    setSelectedFriendId,
    updateFriendPatch,
    deleteFriendById,
  } = useAppData();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [pendingAvatar, setPendingAvatar] = useState<string | null | undefined>(undefined);

  const editing = editingId ? friends.find((x) => x.id === editingId) : undefined;

  useEffect(() => {
    if (!editing || !open) return;
    setPendingAvatar(undefined);
  }, [editing, open]);

  if (loading) {
    return <div className="fo-card text-[var(--fo-text-muted)]">Loading friends…</div>;
  }

  function openModal(id: string) {
    setEditingId(id);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditingId(null);
    setPendingAvatar(undefined);
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const fd = new FormData(e.currentTarget);
    await updateFriendPatch(editing.id, {
      name: String(fd.get("name")),
      tag: String(fd.get("tag")),
      notes: String(fd.get("notes")),
      closeness: Number(fd.get("closeness")),
      importance: Number(fd.get("importance")),
      type: String(fd.get("type")) as FriendType,
      status: String(fd.get("status")) as FriendStatus,
      ...(pendingAvatar !== undefined ? { avatar: pendingAvatar } : {}),
    });

    emitToast(editing.status !== "normal" ? "Updated — black-hole mode enabled." : "Friend updated.");
    closeModal();
  }

  async function confirmDelete() {
    if (!editing) return;
    if (!window.confirm(`Delete ${editing.name}? This cannot be undone.`)) return;
    await deleteFriendById(editing.id);
    closeModal();
  }

  const sel = selectedFriendId ? friends.find((f) => f.id === selectedFriendId) : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <div className="fo-card">
        <h3 className="mb-3.5 text-[15px] font-bold">Your Friends</h3>
        {!friends.length ? (
          <p className="text-sm text-[var(--fo-text-muted)]">
            No friends yet — add some on{" "}
            <Link href="/orbit" className="text-purple-400 underline">
              Orbit
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {friends.map((f) => {
              const isBh = f.status === "toxic" || f.status === "cutoff";
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFriendId(f.id)}
                  className={`flex w-full items-center gap-2.5 rounded-[10px] border border-transparent px-3 py-[11px] text-left transition ${
                    selectedFriendId === f.id
                      ? "border-purple-600/35 bg-gradient-to-br from-purple-900/35 to-teal-900/15"
                      : "bg-white/[0.025] hover:translate-x-1 hover:bg-white/[0.05]"
                  }`}
                >
                  <div
                    className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-[12px] font-bold text-white"
                    style={{
                      background: isBh ? (f.status === "toxic" ? "#330800" : "#1a0040") : f.color,
                      border:
                        isBh ?
                          `2px solid ${f.status === "toxic" ? "#ff5500" : "#7700ff"}`
                        : undefined,
                    }}
                  >
                    {isBh ?
                      f.status === "toxic" ?
                        <IconBiohazard size={18} className="text-orange-400" aria-hidden />
                      : <IconScissors size={18} className="text-violet-300" aria-hidden />
                    : f.avatar ?
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.avatar} alt="" className="h-full w-full object-cover" />
                    : f.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <strong className="truncate text-[13px]">{f.name}</strong>
                    <div className="mt-0.5 text-[11px] text-[var(--fo-text-muted)]">
                      {f.tag}{" "}
                      {isBh && (
                        <span
                          className={
                            f.status === "toxic"
                              ? "rounded-full bg-orange-950/40 px-2 py-0.5 text-[10px] font-bold text-orange-400"
                              : "rounded-full bg-violet-950/40 px-2 py-0.5 text-[10px] font-bold text-violet-400"
                          }
                        >
                          {f.status === "toxic" ? "Toxic" : "Cut Off"}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="fo-card min-h-[260px]">
        {!sel ? (
          <p className="text-sm text-[var(--fo-text-muted)]">Select a friend to view details</p>
        ) : (
          <FriendDetail
            friend={sel}
            onEdit={() => {
              openModal(sel.id);
            }}
          />
        )}
      </div>

      {/* Edit Modal */}
      <div className={`fo-modal ${open && editing ? "fo-modal-open" : ""}`} role="presentation">
        {open && editing && (
          <div className="fo-modal-panel" role="dialog" aria-modal>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">Edit Friend</h2>
              <button
                type="button"
                className="fo-btn fo-btn-secondary inline-flex px-3 py-2"
                onClick={closeModal}
              >
                <IconClose size={18} aria-label="Close" />
              </button>
            </div>
            <form className="flex flex-col gap-2.5" onSubmit={(e) => void onSave(e)}>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  void readFileAsDataURL(f).then(setPendingAvatar);
                }}
              />
              <label className="fo-form-label">
                Profile photo
                <button
                  type="button"
                  className="fo-form-input mt-2 text-left"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  Change photo
                </button>
              </label>
              <label className="fo-form-label">
                Name*
                <input name="name" className="fo-form-input" defaultValue={editing.name} required />
              </label>
              <label className="fo-form-label">
                Tag
                <input name="tag" className="fo-form-input" defaultValue={editing.tag} />
              </label>
              <label className="fo-form-label">
                Notes
                <textarea name="notes" className="fo-form-input min-h-[80px]" defaultValue={editing.notes} />
              </label>
              <label className="fo-form-label">
                Closeness
                <input
                  name="closeness"
                  type="range"
                  min={5}
                  max={100}
                  defaultValue={editing.closeness}
                />
              </label>
              <label className="fo-form-label">
                Importance
                <input
                  name="importance"
                  type="range"
                  min={20}
                  max={100}
                  defaultValue={editing.importance}
                />
              </label>
              <label className="fo-form-label">
                Type
                <select name="type" className="fo-form-input" defaultValue={editing.type}>
                  <option value="inner">Inner Circle</option>
                  <option value="creative">Creative Spark</option>
                  <option value="steady">Steady Anchor</option>
                  <option value="growing">Growing Bond</option>
                </select>
              </label>
              <label className="fo-form-label">
                Status
                <select name="status" className="fo-form-input" defaultValue={editing.status}>
                  <option value="normal">Normal</option>
                  <option value="toxic">Toxic</option>
                  <option value="cutoff">Cut off</option>
                </select>
              </label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button type="submit" className="fo-btn fo-btn-primary">
                  Save Changes
                </button>
                <button type="button" className="fo-btn fo-btn-danger" onClick={() => void confirmDelete()}>
                  Delete Friend
                </button>
              </div>
              <button type="button" className="fo-btn fo-btn-secondary" onClick={closeModal}>
                Cancel
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function FriendDetail({ friend, onEdit }: { friend: Friend; onEdit: () => void }) {
  const health = getHealthStatus(friend);
  const isBh = friend.status === "toxic" || friend.status === "cutoff";

  const healthCls =
    health.class === "balanced" ? "fo-health-balanced"
    : health.class === "growing" ? "fo-health-growing"
    : "fo-health-onesided";

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {isBh ?
            <div
              className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full text-[28px]"
              style={{
                background: friend.status === "toxic" ? "#1a0500" : "#0e0020",
                border: `3px solid ${friend.status === "toxic" ? "#ff5500" : "#7700ff"}`,
                boxShadow:
                  friend.status === "toxic" ?
                    "0 0 24px rgba(255,85,0,0.5)"
                  : "0 0 24px rgba(119,0,255,0.5)",
              }}
            >
              {friend.status === "toxic" ?
                <IconBiohazard size={38} className="text-orange-400" aria-hidden />
              : <IconScissors size={38} className="text-violet-300" aria-hidden />}
            </div>
          : friend.avatar ?
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={friend.avatar}
              alt=""
              className="h-[72px] w-[72px] rounded-full border-[3px] object-cover shadow-lg"
              style={{ borderColor: friend.color }}
            />
          : <div
              className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-white/20 text-2xl font-extrabold text-white shadow-lg"
              style={{ background: friend.color }}
            >
              {friend.name.slice(0, 2).toUpperCase()}
            </div>
          }
          <div>
            <h2 className="mb-1 text-xl font-semibold">{friend.name}</h2>
            <p className="text-xs text-[var(--fo-text-muted)]">{friend.tag}</p>
          </div>
        </div>
        <button type="button" className="fo-btn fo-btn-secondary shrink-0" onClick={onEdit}>
          Edit
        </button>
      </div>

      {isBh && (
        <div
          className="mb-4 rounded-xl border px-3.5 py-2.5 text-[13px]"
          style={{
            background:
              friend.status === "toxic"
                ? "rgba(255,40,0,0.1)"
                : "rgba(100,0,255,0.1)",
            borderColor:
              friend.status === "toxic"
                ? "rgba(255,40,0,0.25)"
                : "rgba(100,0,255,0.25)",
          }}
        >
          {friend.status === "toxic" ?
            <span className="inline-flex items-start gap-2">
              <IconBiohazard size={20} className="mt-0.5 shrink-0 text-orange-400" aria-hidden />
              <span>
                <strong>Marked Toxic</strong> — flagged as harmful in your orbit.
              </span>
            </span>
          : <span className="inline-flex items-start gap-2">
              <IconScissors size={20} className="mt-0.5 shrink-0 text-violet-400" aria-hidden />
              <span>
                <strong>Cut Off</strong> — this connection reads as intentionally severed.
              </span>
            </span>
          }
        </div>
      )}

      <div className="mb-4 rounded-[10px] border border-[var(--fo-border)] bg-white/[0.03] p-3">
        <span className={`inline-flex items-center gap-2 ${healthCls}`}>
          <InsightHealthTrendIcon variant={health.class} size={17} aria-hidden />
          {health.name}
        </span>
        <p className="mt-2 text-xs text-[var(--fo-text-muted)]">{health.description}</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-[10px] border border-purple-900/35 bg-purple-950/30 p-3">
          <div className="mb-1 text-[11px] text-[var(--fo-text-muted)]">Closeness</div>
          <div className="text-[22px] font-extrabold text-purple-400">{friend.closeness}</div>
          <div className="fo-progress-track">
            <div className="fo-progress-fill" style={{ width: `${friend.closeness}%` }} />
          </div>
        </div>
        <div className="rounded-[10px] border border-teal-900/35 bg-teal-950/30 p-3">
          <div className="mb-1 text-[11px] text-[var(--fo-text-muted)]">Importance</div>
          <div className="text-[22px] font-extrabold text-teal-400">{friend.importance}</div>
          <div className="fo-progress-track">
            <div className="fo-progress-fill bg-gradient-to-r from-teal-400 to-teal-200" style={{ width: `${friend.importance}%` }} />
          </div>
        </div>
      </div>

      {friend.notes && (
        <div className="mb-4">
          <div className="mb-2 text-xs font-semibold uppercase text-[var(--fo-text-muted)]">Notes</div>
          <p className="text-[13px] leading-relaxed">{friend.notes}</p>
        </div>
      )}
      <p className="border-t border-[var(--fo-border)] pt-3 text-[11px] text-[var(--fo-text-muted)]">
        Added {new Date(friend.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}


