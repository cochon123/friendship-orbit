export type FriendType = "inner" | "creative" | "steady" | "growing";

export type FriendStatus = "normal" | "toxic" | "cutoff";

export type FriendHistoryEntry = {
  date: number;
  closeness: number;
  importance: number;
};

export type Friend = {
  id: string;
  name: string;
  tag: string;
  notes: string;
  closeness: number;
  importance: number;
  type: FriendType;
  status: FriendStatus;
  color: string;
  angle: number;
  avatar: string | null;
  createdAt: number;
  history: FriendHistoryEntry[];
};

export type GroupRow = {
  id: string;
  name: string;
  purpose: string;
  icon: string;
  color: string;
  memberIds: string[];
  createdAt: number;
  updatedAt: number;
};

export type Profile = {
  userAvatar: string | null;
};

export type AppState = {
  profile: Profile;
  friends: Friend[];
  groups: GroupRow[];
};

/** Used when `/api/app` falls back or client cannot parse/sync. */
export const EMPTY_APP_STATE: AppState = {
  profile: { userAvatar: null },
  friends: [],
  groups: [],
};
