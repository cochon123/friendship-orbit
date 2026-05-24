import type { Friend } from "@/lib/types";

export type HealthInsight = {
  name: string;
  class: "balanced" | "growing" | "onesided";
  icon: string;
  description: string;
};

export function getHealthStatus(friend: Friend): HealthInsight {
  const diff = friend.closeness - friend.importance;
  const gap = Math.abs(diff);
  if (gap < 10) {
    return {
      name: "Balanced",
      class: "balanced",
      icon: "✓",
      description: "Closeness matches importance",
    };
  }
  if (diff > 0) {
    return {
      name: "Growing",
      class: "growing",
      icon: "↑",
      description: "You're closer than expected",
    };
  }
  return {
    name: "One-sided",
    class: "onesided",
    icon: "→",
    description: "You invest more than received",
  };
}
