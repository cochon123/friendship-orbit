import type { ComponentType, ReactNode, SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function dim(size: number | undefined, rest: IconProps) {
  const { className, ...p } = rest;
  return {
    width: size ?? 18,
    height: size ?? 18,
    viewBox: "0 0 24 24" as const,
    className: className ?? "",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none" as const,
    stroke: "currentColor",
    ...p,
  };
}

/** Night sky curve */
export function IconGalaxy({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <path d="M4 16c4-8 14-12 17-11M6 13c6-8 17-11 17-11M12 21c8-14 13-23 13-23" />
      <circle cx="8.5" cy="8.5" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="10" r="0.65" fill="currentColor" stroke="none" />
      <circle cx="17.8" cy="17" r="0.55" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconDownload({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function IconTrash({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <path d="M4 7h16M10 11v8M14 11v8M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M6 7l1 15a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-15" />
    </svg>
  );
}

export function IconOrbitNav({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-18 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(42 12 12)" />
    </svg>
  );
}

export function IconPeople({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <circle cx="9" cy="8" r="2.5" />
      <circle cx="16" cy="9" r="2" />
      <path d="M4.5 20c0-4 4-6 9-6 2.3 0 4.6.55 6.2 2" />
      <path d="M21 20v-.5a4 4 0 0 0-5-4" />
    </svg>
  );
}

export function IconChartBars({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <path d="M4 20V10M12 20V5M20 20v-8" />
    </svg>
  );
}

export function IconCalendar({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M9 5V3M15 5V3" />
    </svg>
  );
}

export function IconSearchInsights({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <circle cx="11" cy="11" r="5.5" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function IconScale({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <path d="M12 3v3M5 21h14" />
      <path d="M7 21l3-13h7l3 13" />
      <path d="M9.5 12h5" />
    </svg>
  );
}

export function IconStrength({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <path d="M9 17V7M15 17V7" />
      <path d="M6 10h12M9 13h6" strokeWidth={1.65} />
    </svg>
  );
}

export function IconPaletteArt({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <circle cx="7.5" cy="8.5" r="2.2" />
      <path d="M19 17c-6 3-13-3-13-11a6 6 0 019-5" strokeWidth={1.65} />
      <circle cx="16" cy="10" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconGlobe({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="3.8" ry="9" opacity="0.75" strokeWidth={1.4} />
      <path d="M3 12h18M12 4c3 7 3 13 0 20" strokeWidth={1.35} />
    </svg>
  );
}

export function IconBook({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <path d="M7 19V5l5-3 5 3v14" strokeWidth={1.55} />
      <path d="M7 5l5 3 5-3M12 22V8" opacity="0.7" strokeWidth={1.4} />
    </svg>
  );
}

export function IconBolt({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden strokeWidth={1.75}>
      <path d="M13 3L4 13h8l-1 8 11-13h-7l8-10" />
    </svg>
  );
}

export function IconBrain({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden strokeWidth={1.5}>
      <path d="M10 21a4 4 0 0 1 0-7v-8a7 7 0 019 13M10 21V9M10 21H8a4 4 0 0 1-.5-8M10 21a4 4 0 0 0 0-8" />
    </svg>
  );
}

export function IconHandshake({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden strokeWidth={1.5}>
      <path d="M11 21l6-12M7 21V9l10-5M17 21V9m-13 12l10-14" />
    </svg>
  );
}

export function IconRocket({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden strokeWidth={1.55}>
      <path d="M5 21l12-13M17 21l6-17-17 7 13 13" />
      <circle cx="15" cy="8" r="1.35" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconStar({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="currentColor"
      stroke="none"
      {...rest}
    >
      <path d="M12 2.5l2.4 5.5 6 .6-4.5 4 1.4 6-6-3.2-6 3.2 1.4-6L7.6 8.6l6-.6L12 2.5z" />
    </svg>
  );
}

export function IconSparkles({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <path d="M10 5l1 6 6 1-6 1-1 6-1-6-6-1 6-1 1-6zM16.5 3l.4 3 3 .4-3 .4-.4 3-.4-3-3-.4 3-.4.4-3z" strokeWidth={1.5} />
    </svg>
  );
}

export function IconMouseDrag({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <path d="M9 13V8a4 4 0 118 5v9H9v-9z" strokeWidth={1.5} />
      <path d="M13 21V11M12 21h2M10 21h2M12 21l-3-3m3 3 3-3" />
    </svg>
  );
}

export function IconHeart({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="currentColor"
      stroke="none"
      {...rest}
    >
      <path d="M12 21s-8-5.8-8-11a5 5 0 019-3 5 5 0 019 3c0 5.2-8 11-8 11z" />
    </svg>
  );
}

export function IconCircleDot({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconCircleBlackHole({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconCheckSmall({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <path d="M20 7L10 17l-5-5.5" />
    </svg>
  );
}

export function IconArrowUp({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <path d="M12 19V6M12 6l6 6M12 6l-6 6" />
    </svg>
  );
}

export function IconArrowRight({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <path d="M5 12h13M17 12l-5-6M17 12l-5 6" />
    </svg>
  );
}

export function IconArrowDown({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <path d="M12 5v13M12 18l6-6M12 18l-6-6" />
    </svg>
  );
}

export function IconUsersGroup({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <circle cx="9" cy="7" r="2.2" />
      <circle cx="16" cy="7" r="2" />
      <path d="M4 17c1-3.5 4-6 10-6s9 2.5 10 6" />
    </svg>
  );
}

export function IconTargetNetwork({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconLightbulb({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <path d="M10 21h4M12 15a5 5 0 015-8 5 5 0 00-10 8z" strokeWidth={1.6} />
      <path d="M9 16h6" />
      <path d="M10.5 19h3" strokeWidth={1.5} />
    </svg>
  );
}

export function IconWarningTriangle({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <path d="M12 4L3 21h18L12 4zM12 9v7M12 19h0" strokeWidth={1.65} />
    </svg>
  );
}

export function IconThoughtBubble({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <path d="M9 21c-.6-4.5-.5-5.5-.5-5.5A5 5 0 019 11a5 5 0 118.5 3.9c-.2 1-.5 1.6-.5 6.1z" strokeWidth={1.6} />
      <circle cx="6.5" cy="20" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="5" cy="17" r=".75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconBiohazard({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path
        d="M12 3a7 7 0 0 1 3.6 1L12 8.5 8.4 4A7 7 0 0 1 12 3zM19.4 7.5a7 7 0 0 1 0 9L14.4 10l5-2.5zM4.6 16.5a7 7 0 0 1 0-9L9.6 14l-5 2.5zM12 21a7 7 0 0 1-3.6-1L12 15.5l3.6 4.5A7 7 0 0 1 12 21z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export function IconScissors({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <circle cx="7.5" cy="6.5" r="3" />
      <circle cx="7.5" cy="17.5" r="3" />
      <path d="M21 20l-6.5-6.5m0 0 2-13-5.5 5.5" />
      <path d="M21 8l-6.5 6.5m0 0 2 13L11 21" strokeWidth={1.5} />
    </svg>
  );
}

export function IconCameraSmall({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <path d="M4 10a2 2 0 0 1 2-2h1.8L9 7h6l1.2 1H17a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8z" />
      <circle cx="12" cy="14" r="3" />
    </svg>
  );
}

export function IconClose({ size, ...rest }: IconProps) {
  return (
    <svg {...dim(size, rest)} aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

/** Section title with icon + text */
export function TitleWithIcon({
  icon: Icon,
  children,
  className = "",
  iconClassName = "text-[var(--fo-accent-2)]",
  size = 20,
}: {
  icon: ComponentType<IconProps>;
  children: ReactNode;
  className?: string;
  iconClassName?: string;
  size?: number;
}) {
  return (
    <h3 className={`flex items-center gap-2 text-[15px] font-bold ${className}`.trim()}>
      <Icon size={size} className={`shrink-0 ${iconClassName}`.trim()} aria-hidden />
      <span>{children}</span>
    </h3>
  );
}
