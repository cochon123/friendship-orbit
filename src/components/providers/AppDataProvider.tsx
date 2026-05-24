"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { AppState, Friend, FriendStatus, FriendType, GroupRow } from "@/lib/types";
import { EMPTY_APP_STATE } from "@/lib/types";

type Ctx = {
  loading: boolean;
  profile: AppState["profile"];
  friends: Friend[];
  groups: GroupRow[];
  selectedFriendId: string | null;
  setSelectedFriendId: (id: string | null) => void;
  refresh: () => Promise<void>;
  addFriend: (payload: {
    name: string;
    tag?: string;
    notes?: string;
    closeness: number;
    importance: number;
    type: FriendType;
    status?: FriendStatus;
    avatar?: string | null;
    angle?: number;
  }) => Promise<void>;
  updateFriendPatch: (
    id: string,
    body: Partial<{
      name: string;
      tag: string;
      notes: string;
      closeness: number;
      importance: number;
      type: FriendType;
      status: FriendStatus;
      avatar: string | null;
      angle: number;
    }>,
  ) => Promise<Friend | undefined>;
  deleteFriendById: (id: string) => Promise<void>;
  persistOrbit: (id: string, angle: number, closeness: number) => Promise<void>;
  setAvatar: (dataUrl: string | null) => Promise<void>;
  createGroupReq: (b: {
    name: string;
    purpose: string;
    icon: string;
    color: string;
    memberIds: string[];
  }) => Promise<void>;
  updateGroupReq: (
    id: string,
    b: {
      name: string;
      purpose: string;
      icon: string;
      color: string;
      memberIds: string[];
    },
  ) => Promise<void>;
  deleteGroupById: (id: string) => Promise<void>;
  clearEverything: () => Promise<void>;
  exportJsonUrl: () => string;
};

const AppDataContext = createContext<Ctx | null>(null);

export function ToastListener() {
  useEffect(() => {
    function onEvt(ev: Event) {
      const e = ev as CustomEvent<string>;
      const msg = e.detail;
      document.querySelector(".fo-toast")?.remove();
      const t = document.createElement("div");
      t.className = "fo-toast";
      t.textContent = msg ?? "";
      document.body.append(t);
      requestAnimationFrame(() => t.classList.add("fo-toast-visible"));
      setTimeout(() => {
        t.classList.remove("fo-toast-visible");
        setTimeout(() => t.remove(), 300);
      }, 2600);
    }
    window.addEventListener("fo-toast", onEvt);
    return () => window.removeEventListener("fo-toast", onEvt);
  }, []);
  return null;
}

export function emitToast(message: string) {
  window.dispatchEvent(new CustomEvent<string>("fo-toast", { detail: message }));
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [patch, setPatch] = useState<AppState | null>(null);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    let res: Response;
    try {
      res = await fetch("/api/app", { cache: "no-store" });
    } catch {
      setPatch(EMPTY_APP_STATE);
      emitToast("Network error — check the dev server is running.");
      return;
    }

    const raw = await res.text();
    if (!raw.trim()) {
      setPatch(EMPTY_APP_STATE);
      emitToast(`Server returned an empty reply (${res.status}).`);
      return;
    }

    let data: AppState;
    try {
      data = JSON.parse(raw) as AppState;
    } catch {
      setPatch(EMPTY_APP_STATE);
      emitToast(`Invalid response (${res.status}). Is the API route crashing?`);
      console.error("[refresh] Non-JSON body:", raw.slice(0, 500));
      return;
    }

    setPatch(data);

    if (!res.ok) {
      emitToast(
        res.status === 503
          ? "Database unavailable. Run npm rebuild better-sqlite3 after switching Node.js versions."
          : `Could not sync data (${res.status}).`,
      );
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addFriend = useCallback<Ctx["addFriend"]>(
    async (payload) => {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        emitToast(j.error ?? "Could not add friend");
        throw new Error(j.error);
      }
      await refresh();
      emitToast(`${payload.name} added! ✨`);
    },
    [refresh],
  );

  const updateFriendPatch = useCallback<Ctx["updateFriendPatch"]>(
    async (id, body) => {
      const res = await fetch(`/api/friends/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json()) as { friend?: Friend; error?: string };
      if (!res.ok) {
        emitToast(j.error ?? "Update failed");
        return undefined;
      }
      await refresh();
      return j.friend;
    },
    [refresh],
  );

  const deleteFriendById = useCallback<Ctx["deleteFriendById"]>(
    async (id) => {
      const res = await fetch(`/api/friends/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) {
        emitToast("Could not delete");
        return;
      }
      await refresh();
      setSelectedFriendId((cur) => (cur === id ? null : cur));
      emitToast("Friend deleted");
    },
    [refresh],
  );

  const persistOrbit = useCallback<Ctx["persistOrbit"]>(
    async (id, angle, closeness) => {
      await fetch(`/api/friends/${encodeURIComponent(id)}/orbit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ angle, closeness }),
      });
      await refresh();
    },
    [refresh],
  );

  const setAvatar = useCallback<Ctx["setAvatar"]>(
    async (userAvatar) => {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAvatar }),
      });
      await refresh();
      emitToast("Your profile photo updated! 🌟");
    },
    [refresh],
  );

  const createGroupReq = useCallback<Ctx["createGroupReq"]>(
    async (b) => {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        emitToast(j.error ?? "Could not create group");
        return;
      }
      await refresh();
      emitToast(`${b.name} created! ⭐`);
    },
    [refresh],
  );

  const updateGroupReq = useCallback<Ctx["updateGroupReq"]>(
    async (id, b) => {
      const res = await fetch(`/api/groups/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        emitToast(j.error ?? "Could not update group");
        return;
      }
      await refresh();
      emitToast(`${b.name} updated! ⭐`);
    },
    [refresh],
  );

  const deleteGroupById = useCallback<Ctx["deleteGroupById"]>(
    async (id) => {
      await fetch(`/api/groups/${encodeURIComponent(id)}`, { method: "DELETE" });
      await refresh();
      emitToast("Group deleted");
    },
    [refresh],
  );

  const clearEverything = useCallback<Ctx["clearEverything"]>(async () => {
    await fetch("/api/reset", { method: "DELETE" });
    await refresh();
    setSelectedFriendId(null);
    emitToast("All data cleared");
  }, [refresh]);

  const exportJsonUrl = useCallback(() => "/api/export", []);

  const value = useMemo<Ctx>(
    () => ({
      loading: !patch,
      profile: patch?.profile ?? { userAvatar: null },
      friends: patch?.friends ?? [],
      groups: patch?.groups ?? [],
      selectedFriendId,
      setSelectedFriendId,
      refresh,
      addFriend,
      updateFriendPatch,
      deleteFriendById,
      persistOrbit,
      setAvatar,
      createGroupReq,
      updateGroupReq,
      deleteGroupById,
      clearEverything,
      exportJsonUrl,
    }),
    [
      patch,
      selectedFriendId,
      refresh,
      addFriend,
      updateFriendPatch,
      deleteFriendById,
      persistOrbit,
      setAvatar,
      createGroupReq,
      updateGroupReq,
      deleteGroupById,
      clearEverything,
      exportJsonUrl,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const c = useContext(AppDataContext);
  if (!c) throw new Error("useAppData must be inside AppDataProvider");
  return c;
}
