/** Imperative orbit SVG drawer + drag math (adapted from legacy mock). */

import type { Friend } from "@/lib/types";
import { ORBIT } from "@/lib/constants";

const center = ORBIT.center;
const minOrbit = ORBIT.minOrbit;
const maxOrbit = ORBIT.maxOrbit;

export function distanceFromCloseness(closeness: number): number {
  return maxOrbit - ((closeness - 5) / 95) * (maxOrbit - minOrbit);
}

export function distanceToCloseness(dist: number): number {
  return Math.max(5, Math.min(100, ((maxOrbit - dist) * 95) / (maxOrbit - minOrbit) + 5));
}

export function polarToPoint(angleDeg: number, radius: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: center.x + Math.cos(a) * radius, y: center.y + Math.sin(a) * radius };
}

export function svgPoint(e: MouseEvent | TouchEvent, svg: SVGSVGElement) {
  const pt = svg.createSVGPoint();
  const src =
    "touches" in e ? (e.touches[0] ?? (e as TouchEvent).changedTouches[0]) : (e as MouseEvent);
  pt.x = src.clientX;
  pt.y = src.clientY;
  const inv = svg.getScreenCTM();
  if (!inv) return { x: 0, y: 0 };
  return pt.matrixTransform(inv.inverse());
}

function escapeXml(str: string) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Matches `IconBiohazard` (24px viewBox) for inline orbit SVG. */
const GLYPH_BIOHAZARD_D =
  "M12 3a7 7 0 0 1 3.6 1L12 8.5 8.4 4A7 7 0 0 1 12 3zM19.4 7.5a7 7 0 0 1 0 9L14.4 10l5-2.5zM4.6 16.5a7 7 0 0 1 0-9L9.6 14l-5 2.5zM12 21a7 7 0 0 1-3.6-1L12 15.5l3.6 4.5A7 7 0 0 1 12 21z";

function ns(tag: string, attrs: Record<string, string>) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function darkenHex(hex: string, amt: number) {
  let c = hex.replace("#", "");
  if (c.length === 3) c = [...c].map((x) => x + x).join("");
  const n = Number.parseInt(c, 16);
  const r = Math.max(0, (n >> 16) - Math.floor(255 * amt));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.floor(255 * amt));
  const b = Math.max(0, (n & 0xff) - Math.floor(255 * amt));
  return `rgb(${r},${g},${b})`;
}

function lightenHex(hex: string, amt: number) {
  let c = hex.replace("#", "");
  if (c.length === 3) c = [...c].map((x) => x + x).join("");
  const n = Number.parseInt(c, 16);
  const r = Math.min(255, (n >> 16) + Math.floor(255 * amt));
  const g = Math.min(255, ((n >> 8) & 0xff) + Math.floor(255 * amt));
  const b = Math.min(255, (n & 0xff) + Math.floor(255 * amt));
  return `rgb(${r},${g},${b})`;
}

function ensurePlanet3DGradient(defs: Element, gradId: string, color: string) {
  if (defs.querySelector(`#${CSS.escape(gradId)}`)) return;
  const grad = ns("radialGradient", { id: gradId, cx: "30%", cy: "24%", r: "78%" });
  for (const [off, cv] of [
    [0, "rgba(255,255,255,0.88)"],
    [18, lightenHex(color, 0.35)],
    [45, color],
    [75, darkenHex(color, 0.25)],
    [100, darkenHex(color, 0.62)],
  ] as const) {
    grad.append(ns("stop", { offset: `${off}%`, "stop-color": cv }));
  }
  defs.append(grad);
}

function render3DPlanetNode(
  g: SVGGElement,
  point: { x: number; y: number },
  friend: Friend,
  defs: Element,
) {
  const r = 21;
  const gradId = `planet3d-${friend.id}`;
  ensurePlanet3DGradient(defs, gradId, friend.color);

  g.append(
    ns("circle", {
      cx: String(point.x),
      cy: String(point.y),
      r: String(r + 10),
      fill: friend.color,
      opacity: "0.18",
      filter: "url(#soft-glow)",
      "pointer-events": "none",
    }),
  );
  g.append(
    ns("circle", {
      cx: String(point.x),
      cy: String(point.y),
      r: String(r),
      fill: `url(#${gradId})`,
      stroke: "rgba(255,255,255,0.18)",
      "stroke-width": "1",
    }),
  );
  g.append(
    ns("circle", {
      cx: String(point.x - r * 0.28),
      cy: String(point.y - r * 0.32),
      r: String(r * 0.22),
      fill: "rgba(255,255,255,0.52)",
      "pointer-events": "none",
    }),
  );

  if (friend.avatar) {
    const clipId = `clip-${friend.id}`;
    const clipPath = ns("clipPath", { id: clipId });
    clipPath.append(
      ns("circle", {
        cx: String(point.x),
        cy: String(point.y),
        r: String(r),
      }),
    );
    defs.append(clipPath);
    g.append(
      ns("image", {
        href: friend.avatar,
        x: String(point.x - r),
        y: String(point.y - r),
        width: String(r * 2),
        height: String(r * 2),
        "clip-path": `url(#${clipId})`,
        preserveAspectRatio: "xMidYMid slice",
      }),
    );
  } else {
    const txt = ns("text", {
      x: String(point.x),
      y: String(point.y + 5),
      "text-anchor": "middle",
      "font-size": "11",
      "font-weight": "800",
      fill: "white",
      "pointer-events": "none",
      "font-family": "Inter,sans-serif",
    });
    txt.textContent = friend.name.slice(0, 2).toUpperCase();
    g.append(txt);
  }

  const lbl = ns("text", {
    x: String(point.x),
    y: String(point.y + r + 14),
    "text-anchor": "middle",
    "font-size": "10",
    fill: "rgba(255,255,255,0.62)",
    "pointer-events": "none",
    "font-family": "Inter,sans-serif",
  });
  lbl.textContent = friend.name.length > 8 ? friend.name.slice(0, 7) + "…" : friend.name;
  g.append(lbl);
}

function renderBlackHoleNode(
  g: SVGGElement,
  point: { x: number; y: number },
  friend: Friend,
) {
  const r = 19;
  const isToxic = friend.status === "toxic";
  const c1 = isToxic ? "#ff5500" : "#7700ff";
  const c2 = isToxic ? "#ff0022" : "#0055ff";
  const c3 = isToxic ? "#ff9900" : "#00bbff";
  const dur1 = isToxic ? "3.2" : "4.8";
  const dur2 = isToxic ? "5.1" : "7.2";
  const glowCol = isToxic ? "rgba(255,60,0,0.15)" : "rgba(110,0,255,0.14)";
  const lensCol = isToxic ? "rgba(255,140,60,0.75)" : "rgba(160,100,255,0.75)";

  g.append(
    ns("circle", {
      cx: String(point.x),
      cy: String(point.y),
      r: String(r + 32),
      fill: glowCol,
      filter: "url(#blur-glow)",
      "pointer-events": "none",
    }),
  );

  const disk = ns("g", { "pointer-events": "none" });
  disk.innerHTML = `
    <g>
      <ellipse cx="${point.x}" cy="${point.y}" rx="${r + 15}" ry="${Math.round((r + 15) * 0.3)}"
        fill="none" stroke="${c1}" stroke-width="5.5" opacity="0.90"/>
      <animateTransform attributeName="transform" type="rotate"
        from="0 ${point.x} ${point.y}" to="360 ${point.x} ${point.y}"
        dur="${dur1}s" repeatCount="indefinite"/>
    </g>
    <g>
      <ellipse cx="${point.x}" cy="${point.y}" rx="${r + 23}" ry="${Math.round((r + 23) * 0.19)}"
        fill="none" stroke="${c2}" stroke-width="3" opacity="0.60"/>
      <animateTransform attributeName="transform" type="rotate"
        from="22 ${point.x} ${point.y}" to="382 ${point.x} ${point.y}"
        dur="${dur2}s" repeatCount="indefinite"/>
    </g>
    <g>
      <ellipse cx="${point.x}" cy="${point.y}" rx="${r + 9}" ry="${Math.round((r + 9) * 0.18)}"
        fill="none" stroke="${c3}" stroke-width="7" opacity="0.42"/>
      <animateTransform attributeName="transform" type="rotate"
        from="-14 ${point.x} ${point.y}" to="346 ${point.x} ${point.y}"
        dur="${(Number.parseFloat(dur1) * 0.65).toFixed(1)}s" repeatCount="indefinite"/>
    </g>`;
  g.append(disk);

  g.append(ns("circle", { cx: String(point.x), cy: String(point.y), r: String(r), fill: "#000000" }));
  g.append(
    ns("circle", {
      cx: String(point.x),
      cy: String(point.y),
      r: String(r + 2.5),
      fill: "none",
      stroke: lensCol,
      "stroke-width": "1.8",
      "pointer-events": "none",
    }),
  );

  const iconGrp = ns("g", {
    transform: `translate(${point.x - 11}, ${point.y - 11}) scale(0.65)`,
    fill: "rgba(255,255,255,0.25)",
    stroke: "none",
    "pointer-events": "none",
  });
  if (isToxic) {
    iconGrp.innerHTML = `<circle cx="12" cy="12" r="2" /><path d="${GLYPH_BIOHAZARD_D}"/>`;
  } else {
    iconGrp.setAttribute("transform", `translate(${point.x - 12}, ${point.y - 12}) scale(1)`);
    iconGrp.innerHTML =
      `<g stroke="rgba(255,255,255,0.42)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none">` +
      `<circle cx="7.5" cy="6.5" r="3"/><circle cx="7.5" cy="17.5" r="3"/>` +
      `<path d="M21 20l-6.5-6.5"/><path d="M21 8l-6.5 6.5"/></g>`;
  }
  g.append(iconGrp);

  const labelColor = isToxic ? "rgba(255,130,80,0.8)" : "rgba(160,120,255,0.8)";
  const nameLbl = ns("text", {
    x: String(point.x),
    y: String(point.y + r + 16),
    "text-anchor": "middle",
    "font-size": "10",
    fill: labelColor,
    "pointer-events": "none",
    "font-family": "Inter,sans-serif",
  });
  nameLbl.textContent = friend.name.length > 8 ? friend.name.slice(0, 7) + "…" : friend.name;
  g.append(nameLbl);

  const shimmer = ns("circle", {
    cx: String(point.x),
    cy: String(point.y),
    r: String(r),
    fill: "none",
    stroke: c1,
    "stroke-width": "1.5",
    opacity: "0",
    "pointer-events": "none",
  });
  shimmer.innerHTML = `
    <animate attributeName="r"       from="${r}" to="${r + 14}" dur="2.4s" repeatCount="indefinite"/>
    <animate attributeName="opacity" from="0.6"  to="0"       dur="2.4s" repeatCount="indefinite"/>`;
  g.append(shimmer);
}

export function showDragTooltip(
  layer: Element,
  svgPt: { x: number; y: number },
  friend: Friend,
) {
  const px = svgPt.x + 14,
    py = svgPt.y - 26;
  let glyph = `<circle cx="${px + 13}" cy="${py + 16}" r="4" fill="white"/>`;
  if (friend.status === "toxic") {
    glyph = `<g transform="translate(${px + 6}, ${py + 8}) scale(0.4)" stroke="none" fill="white">` +
      `<circle cx="12" cy="12" r="2" /><path d="${GLYPH_BIOHAZARD_D}"/></g>`;
  } else if (friend.status === "cutoff") {
    glyph =
      `<g transform="translate(${px + 6}, ${py + 7}) scale(1.05)" fill="none" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">` +
      `<circle cx="7.5" cy="6.5" r="3"/><circle cx="7.5" cy="17.5" r="3"/>` +
      `<path d="M21 20l-6.5-6.5"/><path d="M21 8l-6.5 6.5"/></g>`;
  }
  layer.innerHTML = `
    <rect x="${px}" y="${py}" width="160" height="26" rx="7"
      fill="rgba(10,12,28,0.88)" stroke="rgba(123,97,255,0.45)" stroke-width="1"/>
    ${glyph}
    <text x="${px + 90}" y="${py + 17}" text-anchor="middle" font-size="11"
      fill="white" font-family="Inter,sans-serif" font-weight="700">
      ${escapeXml(friend.name)} · ${friend.closeness}
    </text>`;
}

export type OrbitPaintOptions = {
  friends: Friend[];
  userAvatar: string | null;
  selectedFriendId: string | null;
  /** Click center planet OR avatar overlay */
  onCenterClick?: () => void;
};

/** Recreates orbit graphics; attach drag separately. Layer groups must exist in JSX. */
export function paintOrbitSvg(svg: SVGSVGElement, opts: OrbitPaintOptions): void {
  const ringsLayer = svg.querySelector("#orbit-rings");
  const starLayer = svg.querySelector("#friend-stars");
  const planetLayer = svg.querySelector("#center-planet");
  const tooltipLayer = svg.querySelector("#drag-tooltip");
  const defsEl = svg.querySelector("defs");
  if (!ringsLayer || !starLayer || !planetLayer || !defsEl || !tooltipLayer) return;

  tooltipLayer.innerHTML = "";
  const defs = defsEl;

  defs.querySelectorAll("[id^='planet3d-']").forEach((n) => n.remove());
  defs.querySelectorAll("clipPath[id^='clip-']").forEach((n) => n.remove());
  defs.querySelector("#clip-you")?.remove();

  ringsLayer.replaceChildren();
  for (const ring of [
    { r: minOrbit, label: "closest" },
    { r: 175, label: "steady" },
    { r: 252, label: "growing" },
    { r: maxOrbit, label: "distant" },
  ]) {
    ringsLayer.append(
      ns("circle", {
        class: "orbit-ring",
        cx: String(center.x),
        cy: String(center.y),
        r: String(ring.r),
        stroke: "rgba(255,255,255,0.32)",
        "stroke-width": "3.5",
        "stroke-dasharray": "12 17",
        "stroke-linecap": "round",
        fill: "none",
      }),
    );
    const lbl = ns("text", {
      x: String(center.x + ring.r - 42),
      y: String(center.y - 10),
      "font-size": "10",
      fill: "rgba(255,255,255,0.28)",
      "font-family": "Inter,sans-serif",
    });
    lbl.textContent = ring.label;
    ringsLayer.append(lbl);
  }

  planetLayer.replaceChildren();
  const friends = opts.friends;
  const avgImp = friends.reduce((t, f) => t + f.importance, 0) / Math.max(friends.length, 1);
  const pr = 52 + avgImp * 0.22;

  planetLayer.append(
    ns("circle", {
      cx: String(center.x),
      cy: String(center.y),
      r: String(pr + 30),
      fill: "url(#glow-gradient)",
      filter: "url(#blur-glow)",
      opacity: "0.9",
    }),
  );

  const rx = pr + 38,
    ry = (pr + 38) * 0.22;
  planetLayer.append(
    ns("ellipse", {
      cx: String(center.x),
      cy: String(center.y),
      rx: String(rx),
      ry: String(ry),
      fill: "none",
      stroke: "rgba(210,190,255,0.32)",
      "stroke-width": "5",
      "stroke-dasharray": `${Math.PI * rx} ${Math.PI * rx}`,
      "stroke-dashoffset": "0",
      opacity: "0.5",
    }),
  );

  const planetBody = ns("circle", {
    cx: String(center.x),
    cy: String(center.y),
    r: String(pr),
    fill: "url(#planet-gradient)",
    filter: "url(#soft-glow)",
    cursor: "pointer",
  });
  if (opts.onCenterClick)
    planetBody.addEventListener("click", () => {
      opts.onCenterClick?.();
    });
  planetLayer.append(planetBody);

  if (opts.userAvatar) {
    const clipId = "clip-you";
    const clipPath = ns("clipPath", { id: clipId });
    clipPath.append(
      ns("circle", {
        cx: String(center.x),
        cy: String(center.y),
        r: String(pr),
      }),
    );
    defs.append(clipPath);
    const img = ns("image", {
      href: opts.userAvatar,
      x: String(center.x - pr),
      y: String(center.y - pr),
      width: String(pr * 2),
      height: String(pr * 2),
      "clip-path": `url(#${clipId})`,
      preserveAspectRatio: "xMidYMid slice",
      cursor: "pointer",
    });
    if (opts.onCenterClick) img.addEventListener("click", () => opts.onCenterClick?.());
    planetLayer.append(img);
  }

  planetLayer.append(
    ns("circle", {
      cx: String(center.x - pr * 0.26),
      cy: String(center.y - pr * 0.3),
      r: String(pr * 0.2),
      fill: "rgba(255,255,255,0.35)",
      "pointer-events": "none",
    }),
  );

  planetLayer.append(
    ns("ellipse", {
      cx: String(center.x),
      cy: String(center.y),
      rx: String(rx),
      ry: String(ry),
      fill: "none",
      stroke: "rgba(210,190,255,0.55)",
      "stroke-width": "5",
      "stroke-dasharray": `${Math.PI * rx} ${Math.PI * rx}`,
      "stroke-dashoffset": `${Math.PI * rx}`,
      opacity: "0.88",
    }),
  );

  const lblY = opts.userAvatar ? center.y + pr - 10 : center.y + 5;
  const youLbl = ns("text", {
    x: String(center.x),
    y: String(lblY),
    "text-anchor": "middle",
    "font-size": opts.userAvatar ? "11" : "14",
    "font-weight": "700",
    fill: opts.userAvatar ? "rgba(255,255,255,0.75)" : "white",
    "font-family": "Inter,sans-serif",
    "pointer-events": "none",
  });
  youLbl.textContent = "You";
  planetLayer.append(youLbl);

  if (!opts.userAvatar) {
    const hint = ns("g", {
      transform: `translate(${center.x - 60}, ${center.y + pr - 30})`,
      "pointer-events": "none",
    });
    hint.innerHTML = `
      <g transform="translate(4, -2)" fill="none" stroke="rgba(255,255,255,0.36)" stroke-width="1">
        <path d="M4 10a2 2 0 0 1 2-2h1.8L9 7h6l1.2 1H17a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8z"/>
        <circle cx="12" cy="14" r="3"/>
      </g>
      <text x="30" y="12" fill="rgba(255,255,255,0.36)" font-size="11"
        font-family="Inter,sans-serif">tap photo</text>`;
    planetLayer.append(hint);
  }

  const satDist = pr + 56;
  const satG = document.createElementNS("http://www.w3.org/2000/svg", "g") as SVGGElement;
  satG.innerHTML = `
    <circle cx="${center.x + satDist}" cy="${center.y}" r="5.5" fill="#5ce1e6" opacity="0.94" filter="url(#soft-glow)"/>
    <circle cx="${center.x + satDist}" cy="${center.y}" r="9"   fill="none" stroke="rgba(92,225,230,0.22)" stroke-width="1.5"/>
    <animateTransform attributeName="transform" type="rotate"
      from="0 ${center.x} ${center.y}" to="360 ${center.x} ${center.y}"
      dur="13s" repeatCount="indefinite"/>`;
  planetLayer.append(satG);

  starLayer.replaceChildren();

  opts.friends.forEach((friend) => {
    const point = polarToPoint(friend.angle, distanceFromCloseness(friend.closeness));
    const g = ns("g", {
      class: "friend-star-group",
      "data-friend-id": friend.id,
      cursor: "grab",
    }) as SVGGElement;

    const isBlackHole = friend.status === "toxic" || friend.status === "cutoff";
    if (isBlackHole) renderBlackHoleNode(g, point, friend);
    else render3DPlanetNode(g, point, friend, defs);

    if (opts.selectedFriendId === friend.id) {
      g.append(
        ns("circle", {
          cx: String(point.x),
          cy: String(point.y),
          r: "28",
          fill: "none",
          stroke: "rgba(255,255,255,0.72)",
          "stroke-width": "2",
          "pointer-events": "none",
        }),
      );
    }

    starLayer.append(g);
  });
}
