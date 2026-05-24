"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  IconCalendar,
  IconChartBars,
  IconOrbitNav,
  IconPeople,
  IconScale,
  IconSearchInsights,
  IconStar,
} from "@/components/icons/Icon";
import type { ComponentType } from "react";
import type { IconProps } from "@/components/icons/Icon";

const nav: { href: string; label: string; Icon: ComponentType<IconProps> }[] = [
  { href: "/orbit", label: "Orbit", Icon: IconOrbitNav },
  { href: "/friends", label: "Friends", Icon: IconPeople },
  { href: "/analytics", label: "Analytics", Icon: IconChartBars },
  { href: "/timeline", label: "Timeline", Icon: IconCalendar },
  { href: "/insights", label: "Insights", Icon: IconSearchInsights },
  { href: "/compare", label: "Compare", Icon: IconScale },
  { href: "/groups", label: "Groups", Icon: IconStar },
];

export function AppNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fo-tabs mb-5 flex flex-wrap items-center gap-2 rounded-[14px] border border-[var(--fo-border)] bg-white/[0.02] p-1.5 backdrop-blur-[8px]">
      {nav.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={`fo-tab inline-flex items-center gap-2 whitespace-nowrap rounded-[10px] border border-transparent px-4 py-2 text-[13px] font-semibold transition ${
            pathname === href
              ? "fo-tab-active text-white"
              : "text-[var(--fo-text-muted)] hover:bg-white/[0.04] hover:text-[var(--fo-text)]"
          }`}
        >
          <Icon size={17} className="shrink-0 opacity-95" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}
