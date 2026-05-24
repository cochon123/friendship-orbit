"use client";

import { useRef } from "react";

import { IconMouseDrag, IconSparkles, TitleWithIcon } from "@/components/icons/Icon";
import { OrbitVisualizer } from "@/components/orbit/OrbitVisualizer";
import { useAppData } from "@/components/providers/AppDataProvider";
import type { FriendType, FriendStatus } from "@/lib/types";

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function OrbitPage() {
  const {
    loading,
    friends,
    profile,
    addFriend,
    persistOrbit,
    selectedFriendId,
    setSelectedFriendId,
    setAvatar,
  } = useAppData();

  const userInput = useRef<HTMLInputElement>(null);
  const friendAvatarInput = useRef<HTMLInputElement>(null);
  const pendingAvatarRef = useRef<string | null>(null);

  if (loading) {
    return (
      <div className="fo-card text-center text-[var(--fo-text-muted)]">Loading your orbit…</div>
    );
  }

  async function onUserPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataURL(file);
    await setAvatar(dataUrl);
    e.target.value = "";
  }

  async function onAddFriend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    if (!name) return;
    await addFriend({
      name,
      tag: String(fd.get("tag") ?? ""),
      notes: String(fd.get("notes") ?? ""),
      closeness: Number(fd.get("closeness")),
      importance: Number(fd.get("importance")),
      type: String(fd.get("type")) as FriendType,
      status: (String(fd.get("status")) as FriendStatus) || "normal",
      avatar: pendingAvatarRef.current,
    });
    pendingAvatarRef.current = null;
    e.currentTarget.reset();
  }

  function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    void readFileAsDataURL(file).then((u) => {
      pendingAvatarRef.current = u;
    });
  }

  return (
    <>
      <input
        ref={userInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onUserPick(e)}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_270px]">
        <div>
          <div className="fo-orbit-shell">
            <OrbitVisualizer
              friends={friends}
              profile={profile}
              selectedFriendId={selectedFriendId}
              onSelectFriendId={setSelectedFriendId}
              onPersistOrbit={(id, angle, closeness) => persistOrbit(id, angle, closeness)}
              onOpenUserAvatar={() => userInput.current?.click()}
            />
          </div>
          <p className="fo-drag-hint inline-flex flex-wrap items-center gap-2 justify-center md:justify-start">
            <IconMouseDrag size={22} className="shrink-0 text-purple-400" aria-hidden />
            <span>Drag any planet to reposition and adjust closeness</span>
          </p>
        </div>

        <aside className="fo-card min-h-0 max-h-[min(720px,calc(100vh-220px))] overflow-y-auto overscroll-contain lg:sticky lg:top-6 lg:self-start">
          <TitleWithIcon icon={IconSparkles} className="mb-3.5">
            Add Friend
          </TitleWithIcon>
          <form className="flex flex-col gap-2.5" onSubmit={(e) => void onAddFriend(e)}>
            <label className="fo-form-label">
              Profile photo (optional)
              <input
                ref={friendAvatarInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarChange}
              />
              <button
                type="button"
                className="fo-form-input mt-2 text-left"
                onClick={() => friendAvatarInput.current?.click()}
              >
                Choose photo
              </button>
            </label>
            <label className="fo-form-label">
              Name*
              <input name="name" className="fo-form-input" placeholder="e.g., Maya" required />
            </label>
            <label className="fo-form-label">
              Tag
              <input name="tag" className="fo-form-input" placeholder="best friend" />
            </label>
            <label className="fo-form-label">
              Notes
              <textarea name="notes" className="fo-form-input min-h-[80px]" />
            </label>
            <label className="fo-form-label">
              Closeness
              <input name="closeness" type="range" min={5} max={100} defaultValue={72} />
              <span className="text-[11px] font-bold text-[var(--fo-accent-2)]">drag slider →</span>
            </label>
            <label className="fo-form-label">
              Importance
              <input name="importance" type="range" min={20} max={100} defaultValue={70} />
            </label>
            <label className="fo-form-label">
              Type
              <select name="type" className="fo-form-input">
                <option value="inner">Inner Circle</option>
                <option value="creative">Creative Spark</option>
                <option value="steady">Steady Anchor</option>
                <option value="growing">Growing Bond</option>
              </select>
            </label>
            <label className="fo-form-label">
              Status
              <select name="status" className="fo-form-input">
                <option value="normal">Normal</option>
                <option value="toxic">Toxic</option>
                <option value="cutoff">Cut off</option>
              </select>
            </label>
            <button type="submit" className="fo-btn fo-btn-primary mt-1">
              Add Friend
            </button>
          </form>
        </aside>
      </div>
    </>
  );
}
