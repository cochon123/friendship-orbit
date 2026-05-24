import type { FriendType } from "./types";

export const TYPE_COLORS: Record<FriendType, string> = {
  inner: "#ff8cc6",
  creative: "#ffd166",
  steady: "#8fd3ff",
  growing: "#9cffac",
};

export const GROUP_COLORS = [
  "#ff8cc6",
  "#ffd166",
  "#8fd3ff",
  "#9cffac",
  "#a78bfa",
  "#fb7185",
  "#5ce1e6",
  "#f97316",
];

export const ORBIT = {
  center: { x: 400, y: 400 },
  minOrbit: 94,
  maxOrbit: 330,
} as const;
