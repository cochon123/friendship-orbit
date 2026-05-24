"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/orbit", label: "Orbit", emoji: "🪐" },
  { href: "/friends", label: "Friends", emoji: "👥" },
  { href: "/analytics", label: "Analytics", emoji: "📊" },
  { href: "/timeline", label: "Timeline", emoji: "📅" },
  { href: "/insights", label: "Insights", emoji: "🔍" },
  { href: "/compare", label: "Compare", emoji: "⚖️" },
  { href: "/groups", label: "Groups", emoji: "⭐" },
];

export function AppNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fo-tabs mb-5 flex flex-wrap items-center gap-2 rounded-[14px] border border-[var(--fo-border)] bg-white/[0.02] p-1.5 backdrop-blur-[8px]">
      {nav.map(({ href, label, emoji }) => (
        <Link
          key={href}
          href={href}
          className={`fo-tab whitespace-nowrap rounded-[10px] border border-transparent px-4 py-2 text-[13px] font-semibold transition ${
            pathname === href
              ? "fo-tab-active text-white"
              : "text-[var(--fo-text-muted)] hover:bg-white/[0.04] hover:text-[var(--fo-text)]"
          }`}
        >
          <span aria-hidden>{emoji}</span> {label}
        </Link>
      ))}
    </nav>
  );
}
