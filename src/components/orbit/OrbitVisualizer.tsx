"use client";

import { useRouter } from "next/navigation";
import { useCallback, useLayoutEffect, useRef } from "react";

import {
  distanceToCloseness,
  paintOrbitSvg,
  showDragTooltip,
  svgPoint,
} from "@/lib/orbit/renderScene";

import type { Friend, Profile } from "@/lib/types";

type DragState =
  | { id: string; moved: boolean; startX: number; startY: number }
  | null;

export function OrbitVisualizer(props: {
  friends: Friend[];
  profile: Profile;
  selectedFriendId: string | null;
  onSelectFriendId: (id: string | null) => void;
  onPersistOrbit: (id: string, angle: number, closeness: number) => Promise<void>;
  onOpenUserAvatar: () => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const friendsRef = useRef(props.friends);
  friendsRef.current = props.friends;

  const draftRef = useRef<Map<string, { angle: number; closeness: number }>>(new Map());
  const dragStateRef = useRef<DragState>(null);

  const paint = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const merge = friendsRef.current.map((f) => {
      const d = draftRef.current.get(f.id);
      return d ? { ...f, ...d } : f;
    });
    paintOrbitSvg(svg, {
      friends: merge,
      userAvatar: props.profile.userAvatar,
      selectedFriendId: props.selectedFriendId,
      onCenterClick: props.onOpenUserAvatar,
    });
  }, [props.profile.userAvatar, props.selectedFriendId, props.onOpenUserAvatar]);

  useLayoutEffect(() => {
    paint();
  }, [paint, props.friends]);

  const persist = props.onPersistOrbit;
  const router = useRouter();

  useLayoutEffect(() => {
    const tooltipHolder = (): Element | null => {
      const el = svgRef.current;
      return el instanceof SVGSVGElement ? el.querySelector("#drag-tooltip") : null;
    };

    function pointerDown(ev: MouseEvent | TouchEvent) {
      const svg = svgRef.current;
      if (!(svg instanceof SVGSVGElement)) return;

      const t = ev.target as Element | null;
      const g = t?.closest?.("[data-friend-id]");
      if (!g) return;
      const fid = g.getAttribute("data-friend-id");
      if (!fid) return;
      ev.preventDefault();
      ev.stopPropagation();
      const cx = "touches" in ev ? ev.touches[0]!.clientX : ev.clientX;
      const cy = "touches" in ev ? ev.touches[0]!.clientY : ev.clientY;
      dragStateRef.current = { id: fid, moved: false, startX: cx, startY: cy };
      svg.classList.add("dragging");
    }

    function pointerMove(ev: MouseEvent | TouchEvent) {
      const svg = svgRef.current;
      if (!(svg instanceof SVGSVGElement)) return;

      const dragState = dragStateRef.current;
      if (!dragState) return;

      ev.preventDefault();
      const cx = "touches" in ev ? (ev.touches[0]?.clientX ?? 0) : ev.clientX;
      const cy = "touches" in ev ? (ev.touches[0]?.clientY ?? 0) : ev.clientY;
      const dx = cx - dragState.startX;
      const dy = cy - dragState.startY;

      if (!dragState.moved && Math.sqrt(dx * dx + dy * dy) < 4) return;
      dragState.moved = true;

      const sp = svgPoint(ev, svg);
      const relX = sp.x - 400;
      const relY = sp.y - 400;
      const dist = Math.sqrt(relX * relX + relY * relY);
      const angle = (Math.atan2(relY, relX) * 180) / Math.PI;
      const closeness = Math.round(distanceToCloseness(dist));

      draftRef.current.set(dragState.id, { angle, closeness });
      paint();

      const tooltip = tooltipHolder();
      const f = friendsRef.current.find((x) => x.id === dragState.id);
      if (f && tooltip) {
        const merged = { ...f, angle, closeness };
        showDragTooltip(tooltip, sp, merged);
      }
    }

    async function pointerUp() {
      const svg = svgRef.current;
      if (!(svg instanceof SVGSVGElement)) return;

      const dragState = dragStateRef.current;
      if (!dragState) return;

      svg.classList.remove("dragging");

      if (dragState.moved) {
        const d = draftRef.current.get(dragState.id);
        const tooltip = tooltipHolder();
        if (tooltip) tooltip.innerHTML = "";
        if (d) {
          await persist(dragState.id, d.angle, d.closeness);
        }
      } else {
        props.onSelectFriendId(dragState.id);
        router.push("/friends");
      }

      dragStateRef.current = null;
      draftRef.current.delete(dragState.id);
      paint();
    }

    const svgForBind = svgRef.current;
    if (!(svgForBind instanceof SVGSVGElement)) return;

    svgForBind.addEventListener("mousedown", pointerDown);
    svgForBind.addEventListener("touchstart", pointerDown, { passive: false });
    svgForBind.addEventListener("mousemove", pointerMove);
    svgForBind.addEventListener("mouseup", pointerUp);
    svgForBind.addEventListener("mouseleave", pointerUp);
    svgForBind.addEventListener("touchmove", pointerMove, { passive: false });
    svgForBind.addEventListener("touchend", pointerUp);

    return () => {
      svgForBind.removeEventListener("mousedown", pointerDown);
      svgForBind.removeEventListener("touchstart", pointerDown);
      svgForBind.removeEventListener("mousemove", pointerMove);
      svgForBind.removeEventListener("mouseup", pointerUp);
      svgForBind.removeEventListener("mouseleave", pointerUp);
      svgForBind.removeEventListener("touchmove", pointerMove);
      svgForBind.removeEventListener("touchend", pointerUp);
    };
  }, [paint, persist, props.onSelectFriendId, router]);

  return (
    <svg ref={svgRef} id="orbit-svg" viewBox="0 0 800 800" className="h-full min-h-[480px] w-full">
      <defs>
        <radialGradient id="planet-gradient" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#e0d6ff" />
          <stop offset="40%" stopColor="#9b8cff" />
          <stop offset="100%" stopColor="#3b2d9a" />
        </radialGradient>
        <radialGradient id="glow-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(123,97,255,0.5)" />
          <stop offset="100%" stopColor="rgba(123,97,255,0)" />
        </radialGradient>
        <filter id="blur-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <filter id="soft-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="bh-distort" x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.035 0.035"
            numOctaves="4"
            seed="5"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <g id="orbit-rings" />
      <g id="center-planet" />
      <g id="friend-stars" />
      <g id="drag-tooltip" pointerEvents="none" />
    </svg>
  );
}
