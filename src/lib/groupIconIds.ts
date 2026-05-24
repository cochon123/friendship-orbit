/** Stable constellation icon keys stored in SQLite (replacing emoji). */

export const GROUP_ICON_IDS = [
  "strength",
  "palette",
  "globe",
  "book",
  "bolt",
  "heart",
  "brain",
  "handshake",
  "rocket",
] as const;

export type GroupIconId = (typeof GROUP_ICON_IDS)[number];

const LEGACY_EMOJI: Record<string, GroupIconId> = {
  "\u{1f4aa}": "strength",
  "\u{1f3a8}": "palette",
  "\u{1f30d}": "globe",
  "\u{1f4da}": "book",
  "\u{26a1}": "bolt",
  "\u{1f496}": "heart",
  "\u{1f9e0}": "brain",
  "\u{1f91d}": "handshake",
  "\u{1f680}": "rocket",
};

export function normalizeGroupIcon(icon: string): GroupIconId {
  if (GROUP_ICON_IDS.includes(icon as GroupIconId)) return icon as GroupIconId;
  const fromEmoji = LEGACY_EMOJI[icon];
  if (fromEmoji) return fromEmoji;
  return "strength";
}
