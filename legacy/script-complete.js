// ─── Constants ────────────────────────────────────────────────────────────────
const center   = { x: 400, y: 400 };
const minOrbit = 94;
const maxOrbit = 330;

const typeColors = {
  inner:    "#ff8cc6",
  creative: "#ffd166",
  steady:   "#8fd3ff",
  growing:  "#9cffac",
};

// ─── State ────────────────────────────────────────────────────────────────────
let friends           = [];
let selectedFriendId  = null;
let editingFriendId   = null;
let pendingAvatar     = null;
let pendingEditAvatar = null;
let userAvatar        = localStorage.getItem("friendship-orbit-user-avatar") || null;

// ─── Drag State ───────────────────────────────────────────────────────────────
let dragState = null; // { id, moved, startX, startY }

// ─── Starfield ────────────────────────────────────────────────────────────────
function buildStarfield() {
  const field = document.getElementById("starfield");
  if (!field) return;
  for (let i = 0; i < 180; i++) {
    const s    = document.createElement("div");
    s.className = "star";
    const size  = Math.random() * 2.2 + 0.4;
    s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;width:${size}px;height:${size}px;--dur:${(Math.random()*4+2).toFixed(1)}s;--delay:${(Math.random()*6).toFixed(1)}s;`;
    field.append(s);
  }
  for (let i = 0; i < 5; i++) {
    const ss   = document.createElement("div");
    ss.className = "shooting-star";
    ss.style.cssText = `left:${Math.random()*40}%;top:${Math.random()*50}%;width:${(Math.random()*100+80).toFixed(0)}px;--sdur:${(Math.random()*8+6).toFixed(1)}s;--sdelay:${(Math.random()*14).toFixed(1)}s;`;
    field.append(ss);
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function createId() {
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str ?? "";
  return d.innerHTML;
}

function showToast(msg) {
  document.querySelector(".toast")?.remove();
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 2600);
}

function ns(type, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", type);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

// Color helpers
function darkenHex(hex, amt) {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map(x => x+x).join("");
  const n = parseInt(c, 16);
  const r = Math.max(0, (n >> 16)         - Math.floor(255 * amt));
  const g = Math.max(0, ((n >> 8) & 0xFF) - Math.floor(255 * amt));
  const b = Math.max(0, (n & 0xFF)        - Math.floor(255 * amt));
  return `rgb(${r},${g},${b})`;
}

function lightenHex(hex, amt) {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map(x => x+x).join("");
  const n = parseInt(c, 16);
  const r = Math.min(255, (n >> 16)         + Math.floor(255 * amt));
  const g = Math.min(255, ((n >> 8) & 0xFF) + Math.floor(255 * amt));
  const b = Math.min(255, (n & 0xFF)        + Math.floor(255 * amt));
  return `rgb(${r},${g},${b})`;
}

// ─── Storage ──────────────────────────────────────────────────────────────────
function saveFriends() {
  localStorage.setItem("friendship-orbit-friends", JSON.stringify(friends));
}

function loadFriends() {
  const saved = localStorage.getItem("friendship-orbit-friends");
  if (saved) {
    try {
      friends = JSON.parse(saved);
      friends.forEach(f => {
        if (!f.createdAt)      f.createdAt = Date.now();
        if (!f.history)        f.history   = [];
        if (!("avatar" in f))  f.avatar    = null;
        if (!("status" in f))  f.status    = "normal";
      });
    } catch {
      friends = getDefaultFriends();
      saveFriends();
    }
  } else {
    friends = getDefaultFriends();
    saveFriends();
  }
}

function getDefaultFriends() {
  return [
    { id: createId(), name: "Maya",  tag: "best friend",  closeness: 92, importance: 96, type: "inner",    color: "#ff8cc6", notes: "Texts back with memes, always there when it matters", createdAt: Date.now(), history: [], angle: -35,  avatar: null, status: "normal"  },
    { id: createId(), name: "Theo",  tag: "collaborator", closeness: 68, importance: 78, type: "creative", color: "#ffd166", notes: "Best brainstorming energy, ambitious together",          createdAt: Date.now(), history: [], angle: 38,   avatar: null, status: "normal"  },
    { id: createId(), name: "Sarah", tag: "mentor",       closeness: 75, importance: 85, type: "steady",   color: "#8fd3ff", notes: "Grounded advice, calming presence",                      createdAt: Date.now(), history: [], angle: 110,  avatar: null, status: "normal"  },
  ];
}

// ─── Tab Navigation ───────────────────────────────────────────────────────────
function switchTab(tabName) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  document.getElementById(tabName).classList.add("active");
  event.target.classList.add("active");
  if (tabName === "analytics")     renderAnalytics();
  if (tabName === "timeline")      renderTimeline();
  if (tabName === "insights")      renderInsights();
  if (tabName === "friends")       renderFriendsTab();
  if (tabName === "constellations") renderConstellations();
}

// ─── Avatar Helpers ───────────────────────────────────────────────────────────
function readFileAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = e => res(e.target.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function setAvatarPreview(el, url) {
  el.innerHTML = "";
  const img = document.createElement("img");
  img.src = url;
  el.append(img);
}

document.getElementById("user-avatar")?.addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  userAvatar = await readFileAsDataURL(file);
  localStorage.setItem("friendship-orbit-user-avatar", userAvatar);
  renderOrbit();
  showToast("Your profile photo updated! 🌟");
  e.target.value = "";
});

document.getElementById("friend-avatar")?.addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  pendingAvatar = await readFileAsDataURL(file);
  setAvatarPreview(document.getElementById("add-avatar-preview"), pendingAvatar);
});

document.getElementById("edit-avatar")?.addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  pendingEditAvatar = await readFileAsDataURL(file);
  setAvatarPreview(document.getElementById("edit-avatar-preview"), pendingEditAvatar);
});

// ─── Friend Form Submit ───────────────────────────────────────────────────────
document.getElementById("friend-form")?.addEventListener("submit", e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const friend = {
    id:         createId(),
    name:       fd.get("name").trim(),
    tag:        fd.get("tag").trim(),
    notes:      fd.get("notes").trim(),
    closeness:  Number(fd.get("closeness")),
    importance: Number(fd.get("importance")),
    type:       fd.get("type"),
    status:     fd.get("status") || "normal",
    color:      typeColors[fd.get("type")],
    createdAt:  Date.now(),
    history:    [],
    angle:      friends.length * 72,
    avatar:     pendingAvatar,
  };
  if (!friend.name) { showToast("Please enter a name"); return; }

  friends.push(friend);
  saveFriends();
  e.target.reset();
  pendingAvatar = null;
  document.getElementById("add-avatar-preview").innerHTML = "📷";
  renderOrbit();
  renderComparisons();
  showToast(`${friend.name} added! ✨`);
});

// ─── Coordinate helpers ───────────────────────────────────────────────────────
function distanceFromCloseness(closeness) {
  return maxOrbit - ((closeness - 5) / 95) * (maxOrbit - minOrbit);
}

function distanceToCloseness(dist) {
  return Math.max(5, Math.min(100, ((maxOrbit - dist) * 95 / (maxOrbit - minOrbit)) + 5));
}

function polarToPoint(angleDeg, radius) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: center.x + Math.cos(a) * radius, y: center.y + Math.sin(a) * radius };
}

function svgPoint(e) {
  const svg = document.getElementById("orbit-svg");
  const pt  = svg.createSVGPoint();
  const src = e.touches ? e.touches[0] : e;
  pt.x = src.clientX; pt.y = src.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

// ─── Drag ─────────────────────────────────────────────────────────────────────
function startDrag(e, friendId) {
  e.preventDefault();
  e.stopPropagation();
  const src = e.touches ? e.touches[0] : e;
  dragState = { id: friendId, moved: false, startX: src.clientX, startY: src.clientY };
  document.getElementById("orbit-svg").classList.add("dragging");
}

function onDragMove(e) {
  if (!dragState) return;
  e.preventDefault();
  const src = e.touches ? e.touches[0] : e;
  const dx  = src.clientX - dragState.startX;
  const dy  = src.clientY - dragState.startY;
  if (!dragState.moved && Math.sqrt(dx*dx + dy*dy) < 4) return;
  dragState.moved = true;

  const sp   = svgPoint(e);
  const relX = sp.x - center.x;
  const relY = sp.y - center.y;
  const dist = Math.sqrt(relX*relX + relY*relY);

  const friend = friends.find(f => f.id === dragState.id);
  if (friend) {
    friend.angle     = Math.atan2(relY, relX) * 180 / Math.PI;
    friend.closeness = Math.round(distanceToCloseness(dist));
    renderOrbit();
    showDragTooltip(sp, friend);
  }
}

function onDragEnd() {
  if (!dragState) return;
  if (dragState.moved) {
    saveFriends();
    hideDragTooltip();
  } else {
    selectFriend(dragState.id);
  }
  document.getElementById("orbit-svg").classList.remove("dragging");
  dragState = null;
}

// ─── Drag Tooltip ─────────────────────────────────────────────────────────────
function showDragTooltip(svgPt, friend) {
  const layer = document.getElementById("drag-tooltip");
  const px = svgPt.x + 16, py = svgPt.y - 26;
  const icon = friend.status === "toxic" ? "☣" : friend.status === "cutoff" ? "✂" : "⬤";
  layer.innerHTML = `
    <rect x="${px}" y="${py}" width="140" height="26" rx="7"
      fill="rgba(10,12,28,0.88)" stroke="rgba(123,97,255,0.45)" stroke-width="1"/>
    <text x="${px + 70}" y="${py + 17}" text-anchor="middle" font-size="11"
      fill="white" font-family="Inter,sans-serif" font-weight="700">
      ${icon} ${escapeHtml(friend.name)} · ${friend.closeness}
    </text>
  `;
}

function hideDragTooltip() {
  const layer = document.getElementById("drag-tooltip");
  if (layer) layer.innerHTML = "";
}

// ─── 3D Planet Gradient ───────────────────────────────────────────────────────
function ensurePlanet3DGradient(defs, gradId, color) {
  if (defs.querySelector(`#${gradId}`)) return;
  const grad = ns("radialGradient", { id: gradId, cx: "30%", cy: "24%", r: "78%" });
  [
    [0,   "rgba(255,255,255,0.88)"],
    [18,  lightenHex(color, 0.35)],
    [45,  color],
    [75,  darkenHex(color, 0.25)],
    [100, darkenHex(color, 0.62)],
  ].forEach(([off, c]) => grad.append(ns("stop", { offset: `${off}%`, "stop-color": c })));
  defs.append(grad);
}

// ─── Render 3D Planet Node ────────────────────────────────────────────────────
function render3DPlanetNode(g, point, friend, defs, idx) {
  const r      = 21;
  const gradId = `planet3d-${friend.id}`;
  ensurePlanet3DGradient(defs, gradId, friend.color);

  // Atmosphere glow
  g.append(ns("circle", { cx: point.x, cy: point.y, r: r + 10, fill: friend.color, opacity: "0.18", filter: "url(#soft-glow)", "pointer-events": "none" }));

  // Sphere body
  g.append(ns("circle", { cx: point.x, cy: point.y, r, fill: `url(#${gradId})`, stroke: "rgba(255,255,255,0.18)", "stroke-width": "1" }));

  // Specular highlight (top-left bright spot)
  g.append(ns("circle", { cx: point.x - r*0.28, cy: point.y - r*0.32, r: r*0.22, fill: "rgba(255,255,255,0.52)", "pointer-events": "none" }));

  // Avatar or initials
  if (friend.avatar) {
    const clipId   = `clip-${friend.id}`;
    const clipPath = ns("clipPath", { id: clipId });
    clipPath.append(ns("circle", { cx: point.x, cy: point.y, r }));
    defs.append(clipPath);
    g.append(ns("image", {
      href: friend.avatar, x: point.x - r, y: point.y - r, width: r*2, height: r*2,
      "clip-path": `url(#${clipId})`, preserveAspectRatio: "xMidYMid slice",
    }));
  } else {
    const txt = ns("text", {
      x: point.x, y: point.y + 5, "text-anchor": "middle",
      "font-size": "11", "font-weight": "800", fill: "white",
      "pointer-events": "none", "font-family": "Inter,sans-serif",
    });
    txt.textContent = friend.name.slice(0, 2).toUpperCase();
    g.append(txt);
  }

  // Name label
  const lbl = ns("text", {
    x: point.x, y: point.y + r + 14, "text-anchor": "middle",
    "font-size": "10", fill: "rgba(255,255,255,0.62)",
    "pointer-events": "none", "font-family": "Inter,sans-serif",
  });
  lbl.textContent = friend.name.length > 8 ? friend.name.slice(0, 7) + "…" : friend.name;
  g.append(lbl);

  // Pulse ring
  const pulse = ns("circle", { cx: point.x, cy: point.y, r, fill: "none", stroke: friend.color, "stroke-width": "2", opacity: "0", "pointer-events": "none" });
  pulse.innerHTML = `
    <animate attributeName="r"       from="${r}" to="${r+20}" dur="3s" repeatCount="indefinite" begin="${idx*0.35}s"/>
    <animate attributeName="opacity" from="0.55" to="0"       dur="3s" repeatCount="indefinite" begin="${idx*0.35}s"/>`;
  g.append(pulse);
}

// ─── Render Black Hole Node ───────────────────────────────────────────────────
function renderBlackHoleNode(g, point, friend) {
  const r        = 19;
  const isToxic  = friend.status === "toxic";
  const c1       = isToxic ? "#ff5500" : "#7700ff";
  const c2       = isToxic ? "#ff0022" : "#0055ff";
  const c3       = isToxic ? "#ff9900" : "#00bbff";
  const dur1     = isToxic ? "3.2"     : "4.8";
  const dur2     = isToxic ? "5.1"     : "7.2";
  const glowCol  = isToxic ? "rgba(255,60,0,0.15)"   : "rgba(110,0,255,0.14)";
  const lensCol  = isToxic ? "rgba(255,140,60,0.75)" : "rgba(160,100,255,0.75)";

  // Outer gravitational glow
  g.append(ns("circle", { cx: point.x, cy: point.y, r: r + 32, fill: glowCol, filter: "url(#blur-glow)", "pointer-events": "none" }));

  // Accretion disk — 3 rotating ellipses at different speeds/tilts
  const disk = ns("g", { "pointer-events": "none" });
  disk.innerHTML = `
    <g>
      <ellipse cx="${point.x}" cy="${point.y}" rx="${r+15}" ry="${Math.round((r+15)*0.30)}"
        fill="none" stroke="${c1}" stroke-width="5.5" opacity="0.90"/>
      <animateTransform attributeName="transform" type="rotate"
        from="0 ${point.x} ${point.y}" to="360 ${point.x} ${point.y}"
        dur="${dur1}s" repeatCount="indefinite"/>
    </g>
    <g>
      <ellipse cx="${point.x}" cy="${point.y}" rx="${r+23}" ry="${Math.round((r+23)*0.19)}"
        fill="none" stroke="${c2}" stroke-width="3" opacity="0.60"/>
      <animateTransform attributeName="transform" type="rotate"
        from="22 ${point.x} ${point.y}" to="382 ${point.x} ${point.y}"
        dur="${dur2}s" repeatCount="indefinite"/>
    </g>
    <g>
      <ellipse cx="${point.x}" cy="${point.y}" rx="${r+9}" ry="${Math.round((r+9)*0.18)}"
        fill="none" stroke="${c3}" stroke-width="7" opacity="0.42"/>
      <animateTransform attributeName="transform" type="rotate"
        from="-14 ${point.x} ${point.y}" to="346 ${point.x} ${point.y}"
        dur="${(parseFloat(dur1)*0.65).toFixed(1)}s" repeatCount="indefinite"/>
    </g>`;
  g.append(disk);

  // Event horizon (pure black)
  g.append(ns("circle", { cx: point.x, cy: point.y, r, fill: "#000000" }));

  // Photon sphere ring just outside event horizon
  g.append(ns("circle", { cx: point.x, cy: point.y, r: r + 2.5, fill: "none", stroke: lensCol, "stroke-width": "1.8", "pointer-events": "none" }));

  // Small swirling particles
  const icoEl = ns("text", {
    x: point.x, y: point.y + 6, "text-anchor": "middle",
    "font-size": "13", fill: "rgba(255,255,255,0.25)",
    "pointer-events": "none", "font-family": "Inter,sans-serif",
  });
  icoEl.textContent = isToxic ? "☣" : "✂";
  g.append(icoEl);

  // Name label
  const labelColor = isToxic ? "rgba(255,130,80,0.8)" : "rgba(160,120,255,0.8)";
  const lbl = ns("text", {
    x: point.x, y: point.y + r + 16, "text-anchor": "middle",
    "font-size": "10", fill: labelColor,
    "pointer-events": "none", "font-family": "Inter,sans-serif",
  });
  lbl.textContent = friend.name.length > 8 ? friend.name.slice(0, 7) + "…" : friend.name;
  g.append(lbl);

  // Distortion shimmer on the event horizon
  const shimmer = ns("circle", { cx: point.x, cy: point.y, r, fill: "none", stroke: c1, "stroke-width": "1.5", opacity: "0", "pointer-events": "none" });
  shimmer.innerHTML = `
    <animate attributeName="r"       from="${r}" to="${r+14}" dur="2.4s" repeatCount="indefinite"/>
    <animate attributeName="opacity" from="0.6"  to="0"       dur="2.4s" repeatCount="indefinite"/>`;
  g.append(shimmer);
}

// ─── Orbit Render ─────────────────────────────────────────────────────────────
function renderOrbit() {
  const svg         = document.getElementById("orbit-svg");
  const ringsLayer  = document.getElementById("orbit-rings");
  const starLayer   = document.getElementById("friend-stars");
  const planetLayer = document.getElementById("center-planet");
  const defs        = svg.querySelector("defs");

  // Clean up per-render dynamic defs
  defs.querySelectorAll("[id^='planet3d-']").forEach(n => n.remove());
  defs.querySelectorAll("clipPath[id^='clip-']").forEach(n => n.remove());
  defs.querySelector("#clip-you")?.remove();

  // ── Orbit rings ──
  ringsLayer.replaceChildren();
  [
    { r: minOrbit, label: "closest" },
    { r: 175,      label: "steady"  },
    { r: 252,      label: "growing" },
    { r: maxOrbit, label: "distant" },
  ].forEach(ring => {
    ringsLayer.append(ns("circle", {
      class: "orbit-ring", cx: center.x, cy: center.y, r: ring.r,
      stroke: "rgba(255,255,255,0.22)", "stroke-width": "1",
      "stroke-dasharray": "4 7", fill: "none",
    }));
    const lbl = ns("text", { x: center.x + ring.r - 42, y: center.y - 10, "font-size": "10", fill: "rgba(255,255,255,0.28)", "font-family": "Inter,sans-serif" });
    lbl.textContent = ring.label;
    ringsLayer.append(lbl);
  });

  // ── Center planet ──
  planetLayer.replaceChildren();
  const avgImp = friends.reduce((t, f) => t + f.importance, 0) / Math.max(friends.length, 1);
  const pr     = 52 + avgImp * 0.22;

  // Decoration 1: atmospheric glow
  planetLayer.append(ns("circle", { cx: center.x, cy: center.y, r: pr + 30, fill: "url(#glow-gradient)", filter: "url(#blur-glow)", opacity: "0.9" }));

  // Ring back half (before planet body)
  const rx = pr + 38, ry = (pr + 38) * 0.22;
  planetLayer.append(ns("ellipse", {
    cx: center.x, cy: center.y, rx, ry, fill: "none",
    stroke: "rgba(210,190,255,0.32)", "stroke-width": "5",
    "stroke-dasharray": `${Math.PI * rx} ${Math.PI * rx}`, "stroke-dashoffset": "0", opacity: "0.5",
  }));

  // Planet body (3D gradient)
  const planetBody = ns("circle", { cx: center.x, cy: center.y, r: pr, fill: "url(#planet-gradient)", filter: "url(#soft-glow)", cursor: "pointer" });
  planetBody.addEventListener("click", () => document.getElementById("user-avatar").click());
  planetLayer.append(planetBody);

  // User avatar clipped to planet circle
  if (userAvatar) {
    const clipId   = "clip-you";
    const clipPath = ns("clipPath", { id: clipId });
    clipPath.append(ns("circle", { cx: center.x, cy: center.y, r: pr }));
    defs.append(clipPath);
    const img = ns("image", {
      href: userAvatar,
      x: center.x - pr, y: center.y - pr,
      width: pr * 2, height: pr * 2,
      "clip-path": `url(#${clipId})`,
      preserveAspectRatio: "xMidYMid slice",
      cursor: "pointer",
    });
    img.addEventListener("click", () => document.getElementById("user-avatar").click());
    planetLayer.append(img);
  }

  // Specular highlight on center planet (always on top of avatar)
  planetLayer.append(ns("circle", { cx: center.x - pr*0.26, cy: center.y - pr*0.30, r: pr*0.20, fill: "rgba(255,255,255,0.35)", "pointer-events": "none" }));

  // Decoration 2: ring front half (after planet body)
  planetLayer.append(ns("ellipse", {
    cx: center.x, cy: center.y, rx, ry, fill: "none",
    stroke: "rgba(210,190,255,0.55)", "stroke-width": "5",
    "stroke-dasharray": `${Math.PI * rx} ${Math.PI * rx}`, "stroke-dashoffset": `${Math.PI * rx}`, opacity: "0.88",
  }));

  // "You" label — moves to bottom edge when avatar is set, stays centred otherwise
  const lblY = userAvatar ? center.y + pr - 10 : center.y + 5;
  const lbl  = ns("text", { x: center.x, y: lblY, "text-anchor": "middle", "font-size": userAvatar ? "11" : "14", "font-weight": "700", fill: userAvatar ? "rgba(255,255,255,0.75)" : "white", "font-family": "Inter,sans-serif", "pointer-events": "none" });
  lbl.textContent = "You";
  planetLayer.append(lbl);

  // Camera hint when no avatar set
  if (!userAvatar) {
    const hint = ns("text", { x: center.x, y: center.y + pr - 10, "text-anchor": "middle", "font-size": "11", fill: "rgba(255,255,255,0.38)", "font-family": "Inter,sans-serif", "pointer-events": "none" });
    hint.textContent = "📷 tap";
    planetLayer.append(hint);
  }

  // Decoration 3: orbiting satellite moon
  const satDist = pr + 56;
  const satG    = ns("g");
  satG.innerHTML = `
    <circle cx="${center.x + satDist}" cy="${center.y}" r="5.5" fill="#5ce1e6" opacity="0.94" filter="url(#soft-glow)"/>
    <circle cx="${center.x + satDist}" cy="${center.y}" r="9"   fill="none" stroke="rgba(92,225,230,0.22)" stroke-width="1.5"/>
    <animateTransform attributeName="transform" type="rotate"
      from="0 ${center.x} ${center.y}" to="360 ${center.x} ${center.y}"
      dur="13s" repeatCount="indefinite"/>`;
  planetLayer.append(satG);

  // ── Friend nodes ──
  starLayer.replaceChildren();
  friends.forEach((friend, i) => {
    const point = polarToPoint(friend.angle, distanceFromCloseness(friend.closeness));
    const g     = ns("g", { class: "friend-star-group", "data-id": friend.id, style: `animation-delay:${i*55}ms` });

    // Drag events
    g.addEventListener("mousedown",  e => startDrag(e, friend.id));
    g.addEventListener("touchstart", e => startDrag(e, friend.id), { passive: false });

    const isBlackHole = friend.status === "toxic" || friend.status === "cutoff";
    if (isBlackHole) {
      renderBlackHoleNode(g, point, friend);
    } else {
      render3DPlanetNode(g, point, friend, defs, i);
    }

    // Selected indicator
    if (selectedFriendId === friend.id) {
      const sel = ns("circle", { cx: point.x, cy: point.y, r: 28, fill: "none", stroke: "rgba(255,255,255,0.7)", "stroke-width": "2", "pointer-events": "none" });
      sel.innerHTML = `<animate attributeName="stroke-opacity" from="0.7" to="0.2" dur="1.2s" repeatCount="indefinite" direction="alternate"/>`;
      g.append(sel);
    }

    starLayer.append(g);
  });

  // Attach SVG-level drag/touch handlers once
  if (!svg._dragBound) {
    svg.addEventListener("mousemove",  onDragMove);
    svg.addEventListener("mouseup",    onDragEnd);
    svg.addEventListener("mouseleave", onDragEnd);
    svg.addEventListener("touchmove",  onDragMove, { passive: false });
    svg.addEventListener("touchend",   onDragEnd);
    svg._dragBound = true;
  }
}

// ─── Friend Selection ─────────────────────────────────────────────────────────
function selectFriend(id) {
  selectedFriendId = id;
  renderOrbit();
  renderFriendsTab();
  switchTabDirect("friends");
}

function switchTabDirect(tabName) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  document.getElementById(tabName).classList.add("active");
  document.querySelectorAll(".tab-btn").forEach(b => { if (b.textContent.toLowerCase().includes(tabName)) b.classList.add("active"); });
  if (tabName === "friends") renderFriendsTab();
}

// ─── Friends Tab ──────────────────────────────────────────────────────────────
function renderFriendsTab() {
  const list  = document.getElementById("friend-list");
  const panel = document.getElementById("friend-detail-panel");

  list.replaceChildren();
  friends.forEach(f => {
    const div = document.createElement("div");
    div.className = `list-item${selectedFriendId === f.id ? " selected" : ""}`;

    const av = document.createElement("div");
    av.className = "list-avatar";
    const isBlackHole = f.status === "toxic" || f.status === "cutoff";
    if (isBlackHole) {
      av.style.background = f.status === "toxic" ? "#330800" : "#1a0040";
      av.style.border = `2px solid ${f.status === "toxic" ? "#ff5500" : "#7700ff"}`;
      av.textContent = f.status === "toxic" ? "☣" : "✂";
    } else if (f.avatar) {
      av.style.background = f.color;
      const img = document.createElement("img"); img.src = f.avatar; av.append(img);
    } else {
      av.style.background = f.color;
      av.textContent = f.name.slice(0, 2).toUpperCase();
    }

    const info = document.createElement("div");
    const statusBadge = isBlackHole
      ? `<span class="status-${f.status}">${f.status === "toxic" ? "☣️ Toxic" : "✂️ Cut Off"}</span>`
      : "";
    info.innerHTML = `<strong>${escapeHtml(f.name)}</strong><div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">${escapeHtml(f.tag)} ${statusBadge}</div>`;

    div.append(av, info);
    div.addEventListener("click", () => { selectedFriendId = f.id; renderFriendsTab(); });
    list.append(div);
  });

  const friend = friends.find(f => f.id === selectedFriendId);
  if (!friend) { panel.innerHTML = `<p style="color:var(--text-secondary);margin-top:8px;">Select a friend to view details</p>`; return; }

  const health = getHealthStatus(friend);
  const isBlackHole = friend.status === "toxic" || friend.status === "cutoff";

  const avatarHtml = isBlackHole
    ? `<div style="width:72px;height:72px;border-radius:50%;background:${friend.status==="toxic"?"#1a0500":"#0e0020"};border:3px solid ${friend.status==="toxic"?"#ff5500":"#7700ff"};display:flex;align-items:center;justify-content:center;font-size:28px;box-shadow:0 0 24px ${friend.status==="toxic"?"rgba(255,85,0,0.5)":"rgba(119,0,255,0.5)"};">${friend.status==="toxic"?"☣":"✂"}</div>`
    : friend.avatar
      ? `<img src="${escapeHtml(friend.avatar)}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid ${friend.color};box-shadow:0 0 20px ${friend.color}55;" />`
      : `<div style="width:72px;height:72px;border-radius:50%;background:${friend.color};display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:white;border:3px solid rgba(255,255,255,0.2);">${escapeHtml(friend.name.slice(0,2).toUpperCase())}</div>`;

  const statusBanner = isBlackHole ? `
    <div style="padding:10px 14px;background:${friend.status==="toxic"?"rgba(255,40,0,0.1)":"rgba(100,0,255,0.1)"};border:1px solid ${friend.status==="toxic"?"rgba(255,40,0,0.25)":"rgba(100,0,255,0.25)"};border-radius:10px;margin-bottom:14px;font-size:13px;">
      ${friend.status==="toxic"
        ? `☣️ <strong>Marked Toxic</strong> — This person has been a harmful presence in your orbit.`
        : `✂️ <strong>Cut Off</strong> — This connection has been severed. Black hole mode active.`}
    </div>` : "";

  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:18px;">
      <div style="display:flex;align-items:center;gap:14px;">
        ${avatarHtml}
        <div>
          <h2 style="margin-bottom:3px;font-size:20px;">${escapeHtml(friend.name)}</h2>
          <p style="margin:0;font-size:12px;color:var(--text-secondary);">${escapeHtml(friend.tag)}</p>
        </div>
      </div>
      <button class="btn btn-secondary" onclick="openEditModal('${friend.id}')">Edit</button>
    </div>
    ${statusBanner}
    <div style="padding:12px;background:rgba(255,255,255,0.03);border-radius:10px;margin-bottom:14px;border:1px solid var(--border);">
      <span class="health-badge health-${health.class}">${health.icon} ${health.name}</span>
      <p style="margin:8px 0 0;font-size:12px;color:var(--text-secondary);">${health.description}</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
      <div style="background:rgba(123,97,255,0.08);padding:12px;border-radius:10px;border:1px solid rgba(123,97,255,0.12);">
        <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;">Closeness</div>
        <div style="font-size:22px;font-weight:800;color:var(--accent);">${friend.closeness}</div>
        <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${friend.closeness}%;"></div></div>
      </div>
      <div style="background:rgba(92,225,230,0.06);padding:12px;border-radius:10px;border:1px solid rgba(92,225,230,0.1);">
        <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;">Importance</div>
        <div style="font-size:22px;font-weight:800;color:var(--accent-2);">${friend.importance}</div>
        <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${friend.importance}%;background:linear-gradient(90deg,var(--accent-2),#5bf5cb);"></div></div>
      </div>
    </div>
    ${friend.notes ? `<div style="margin-bottom:14px;"><p style="font-size:12px;font-weight:600;margin-bottom:6px;color:var(--text-secondary);">Notes</p><p style="font-size:13px;line-height:1.6;">${escapeHtml(friend.notes)}</p></div>` : ""}
    <div style="font-size:11px;color:var(--text-secondary);padding-top:12px;border-top:1px solid var(--border);">Added ${new Date(friend.createdAt).toLocaleDateString()}</div>
  `;
}

// ─── Health Status ─────────────────────────────────────────────────────────────
function getHealthStatus(friend) {
  const diff = friend.closeness - friend.importance, gap = Math.abs(diff);
  if (gap < 10)  return { name: "Balanced",  class: "balanced",  icon: "✓", description: "Closeness matches importance" };
  if (diff > 0)  return { name: "Growing",   class: "growing",   icon: "↑", description: "You're closer than expected" };
  return           { name: "One-sided", class: "onesided", icon: "→", description: "You invest more than received" };
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────
function openEditModal(friendId) {
  editingFriendId = friendId;
  const friend = friends.find(f => f.id === friendId);
  if (!friend) return;

  document.getElementById("edit-name").value       = friend.name;
  document.getElementById("edit-tag").value        = friend.tag;
  document.getElementById("edit-notes").value      = friend.notes;
  document.getElementById("edit-closeness").value  = friend.closeness;
  document.getElementById("edit-importance").value = friend.importance;
  document.getElementById("edit-type").value       = friend.type;
  document.getElementById("edit-status").value     = friend.status || "normal";
  document.getElementById("edit-closeness-value").textContent  = friend.closeness;
  document.getElementById("edit-importance-value").textContent = friend.importance;

  pendingEditAvatar = null;
  const prev = document.getElementById("edit-avatar-preview");
  friend.avatar ? setAvatarPreview(prev, friend.avatar) : (prev.innerHTML = "📷");

  document.getElementById("edit-modal").classList.add("active");
}

function closeEditModal() {
  document.getElementById("edit-modal").classList.remove("active");
  editingFriendId = null; pendingEditAvatar = null;
}

document.getElementById("edit-form")?.addEventListener("submit", e => {
  e.preventDefault();
  const friend = friends.find(f => f.id === editingFriendId);
  if (!friend) return;

  const oldC = friend.closeness, oldI = friend.importance;
  friend.name       = document.getElementById("edit-name").value;
  friend.tag        = document.getElementById("edit-tag").value;
  friend.notes      = document.getElementById("edit-notes").value;
  friend.closeness  = Number(document.getElementById("edit-closeness").value);
  friend.importance = Number(document.getElementById("edit-importance").value);
  friend.type       = document.getElementById("edit-type").value;
  friend.status     = document.getElementById("edit-status").value;
  friend.color      = typeColors[friend.type];
  if (pendingEditAvatar !== null) friend.avatar = pendingEditAvatar;

  if (oldC !== friend.closeness || oldI !== friend.importance) {
    friend.history.push({ date: Date.now(), closeness: oldC, importance: oldI });
  }

  saveFriends();
  closeEditModal();
  renderOrbit();
  renderFriendsTab();
  showToast(friend.status !== "normal"
    ? `${friend.name} sent to the black hole 🕳️`
    : `${friend.name} updated! ✨`);
});

function deleteSelectedFriend() {
  if (!editingFriendId) return;
  const friend = friends.find(f => f.id === editingFriendId);
  if (!friend) return;
  if (confirm(`Delete ${friend.name}? This cannot be undone.`)) {
    friends = friends.filter(f => f.id !== editingFriendId);
    saveFriends(); closeEditModal();
    selectedFriendId = null; renderOrbit(); renderFriendsTab();
    showToast("Friend deleted");
  }
}

// ─── Range Inputs ─────────────────────────────────────────────────────────────
document.getElementById("friend-closeness")?.addEventListener("input",  e => document.getElementById("closeness-value").textContent       = e.target.value);
document.getElementById("friend-importance")?.addEventListener("input", e => document.getElementById("importance-value").textContent      = e.target.value);
document.getElementById("edit-closeness")?.addEventListener("input",   e => document.getElementById("edit-closeness-value").textContent   = e.target.value);
document.getElementById("edit-importance")?.addEventListener("input",  e => document.getElementById("edit-importance-value").textContent  = e.target.value);

// ─── Analytics ─────────────────────────────────────────────────────────────────
function renderAnalytics() {
  if (!friends.length) return;
  const avgC = Math.round(friends.reduce((t, f) => t + f.closeness,  0) / friends.length);
  const avgI = Math.round(friends.reduce((t, f) => t + f.importance, 0) / friends.length);
  document.getElementById("stat-total").textContent          = friends.length;
  document.getElementById("stat-avg-closeness").textContent  = avgC;
  document.getElementById("stat-avg-importance").textContent = avgI;

  const row = (f, v) => `<div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:12px;"><div style="display:flex;justify-content:space-between;margin-bottom:4px;"><strong>${escapeHtml(f.name)}</strong><span>${v}/100</span></div><div class="progress-bar-track"><div class="progress-bar-fill" style="width:${v}%;"></div></div></div>`;
  document.getElementById("closest-friends").innerHTML   = [...friends].sort((a,b)=>b.closeness -a.closeness).slice(0,3).map(f=>row(f,f.closeness)).join("");
  document.getElementById("important-friends").innerHTML = [...friends].sort((a,b)=>b.importance-a.importance).slice(0,3).map(f=>row(f,f.importance)).join("");

  document.getElementById("health-balanced").textContent = friends.filter(f=>Math.abs(f.closeness-f.importance)<10).length;
  document.getElementById("health-growing").textContent  = friends.filter(f=>f.closeness>f.importance).length;
  document.getElementById("health-onesided").textContent = friends.filter(f=>f.closeness<f.importance-10).length;
  document.getElementById("health-drifting").textContent = friends.filter(f=>f.closeness<f.importance&&Math.abs(f.closeness-f.importance)>=10).length;

  const byType = {};
  friends.forEach(f => { byType[f.type] = (byType[f.type]||0)+1; });
  document.getElementById("by-type").innerHTML = Object.entries(byType)
    .map(([t,c]) => `<div style="font-size:12px;margin-bottom:8px;display:flex;justify-content:space-between;"><span style="color:${typeColors[t]};font-weight:600;">${t}</span><strong>${c}</strong></div>`).join("");

  const most = [...friends].sort((a,b) =>
    friends.filter(f=>Math.abs(f.closeness-b.closeness)<15).length -
    friends.filter(f=>Math.abs(f.closeness-a.closeness)<15).length
  )[0];
  const blackHoles = friends.filter(f => f.status !== "normal");
  document.getElementById("network-summary").innerHTML = `
    <div style="margin-bottom:6px;">You have <strong>${friends.length}</strong> friend${friends.length!==1?"s":""}</div>
    <div style="margin-bottom:6px;">${friends.filter(f=>Math.abs(f.closeness-f.importance)<10).length} balanced relationships</div>
    ${blackHoles.length ? `<div style="margin-bottom:6px;color:#ff8060;">⚫ ${blackHoles.length} black hole${blackHoles.length>1?"s":""}</div>` : ""}
    <div>Most central: <strong>${most ? escapeHtml(most.name) : "N/A"}</strong></div>`;
}

// ─── Timeline ──────────────────────────────────────────────────────────────────
function renderTimeline() {
  const c = document.getElementById("timeline-container");
  const events = [];
  friends.forEach(f => {
    (f.history||[]).forEach(h => events.push({ date: h.date, friendName: f.name, oldC: h.closeness, newC: f.closeness, change: f.closeness - h.closeness }));
  });
  events.sort((a,b) => b.date - a.date);
  if (!events.length) { c.innerHTML = "<p style='color:var(--text-secondary);'>No history yet. Update a friend to start tracking.</p>"; return; }
  c.innerHTML = events.map(e => `
    <div class="timeline-item">
      <div class="timeline-date">${new Date(e.date).toLocaleDateString()}</div>
      <div style="font-size:13px;margin-bottom:4px;"><strong>${escapeHtml(e.friendName)}</strong>${e.change>0?`<span style="color:var(--success);font-weight:700;"> ↑ +${e.change}</span>`:`<span style="color:var(--danger);font-weight:700;"> ↓ ${e.change}</span>`}</div>
      <div style="font-size:11px;color:var(--text-secondary);">Closeness: ${e.oldC} → ${e.newC}</div>
    </div>`).join("");
}

// ─── Insights ──────────────────────────────────────────────────────────────────
function renderInsights() {
  const c   = document.getElementById("insights-container");
  const bsc = document.getElementById("blind-spots-container");
  const ai  = document.getElementById("ai-recommendations");

  c.innerHTML = friends.map(f => {
    const h = getHealthStatus(f), gap = Math.abs(f.closeness - f.importance);
    const text = h.name === "Balanced" ? `${escapeHtml(f.name)} is well-balanced.`
      : h.name === "Growing" ? `${escapeHtml(f.name)} is closer than expected.`
      : `You invest more in ${escapeHtml(f.name)} (gap: ${gap}).`;
    return `<div class="insight-box"><strong>${escapeHtml(f.name)}</strong> <span class="health-badge health-${h.class}" style="font-size:10px;">${h.name}</span><br><span style="color:var(--text-secondary);">${text}</span></div>`;
  }).join("");

  const spots = friends.filter(f => Math.abs(f.closeness-f.importance)>20);
  bsc.innerHTML = spots.length
    ? spots.map(f => { const g=f.importance-f.closeness; return `<div class="blind-spot-warning"><strong>⚠️ ${escapeHtml(f.name)}</strong><br>Gap of ${Math.abs(g)} points. ${g>0?"You see this person as less important than they might be.":"You value this person more than they might realize."}</div>`; }).join("")
    : "<p style='color:var(--text-secondary);'>No significant blind spots detected.</p>";

  const recs = [];
  const drifting   = friends.filter(f => f.closeness < f.importance - 10 && f.status === "normal");
  const blackHoles = friends.filter(f => f.status !== "normal");
  const unbalanced = friends.filter(f => Math.abs(f.closeness-f.importance)>15);
  const growing    = friends.filter(f => f.closeness>f.importance && f.closeness>70);
  const types      = {};
  friends.forEach(f => { types[f.type] = (types[f.type]||0)+1; });

  if (blackHoles.length) recs.push(`<div class="insight-box" style="border-color:rgba(255,60,0,0.2);">⚫ <strong>Black Hole Orbit</strong><br>${blackHoles.map(f=>escapeHtml(f.name)).join(", ")} ${blackHoles.length===1?"has":"have"} been removed from your active orbit. Their gravitational pull may still be felt.</div>`);
  if (drifting.length)   recs.push(`<div class="insight-box">💡 <strong>Reconnect with Drifting Relationships</strong><br>${drifting.map(f=>escapeHtml(f.name)).join(", ")} ${drifting.length===1?"has":"have"} drifted. Consider reaching out soon.</div>`);
  if (unbalanced.length) recs.push(`<div class="insight-box">💡 <strong>Rebalance Your Energy</strong><br>You have ${unbalanced.length} unbalanced relationship(s). Consider whether your investment matches their value.</div>`);
  if (growing.length)    recs.push(`<div class="insight-box">💡 <strong>Strengthen Growing Bonds</strong><br>${growing.map(f=>escapeHtml(f.name)).join(", ")} ${growing.length===1?"is":"are"} close — worth investing in long-term.</div>`);
  if (Object.keys(types).length < 3) recs.push(`<div class="insight-box">💡 <strong>Diversify Your Circle</strong><br>A diverse support network is healthier. Consider adding different friend types.</div>`);

  ai.innerHTML = recs.join("") || "<p style='color:var(--text-secondary);'>Your network looks healthy! 🌟</p>";
}

// ─── Comparisons ───────────────────────────────────────────────────────────────
function renderComparisons() {
  [document.getElementById("friend1-select"), document.getElementById("friend2-select")].forEach(sel => {
    if (!sel) return;
    const v = sel.value;
    sel.innerHTML = '<option value="">Select friend...</option>';
    friends.forEach(f => { const o = document.createElement("option"); o.value = f.id; o.textContent = f.name; sel.append(o); });
    sel.value = v;
  });
}

document.getElementById("compare-form")?.addEventListener("submit", e => {
  e.preventDefault();
  const id1 = document.getElementById("friend1-select").value;
  const id2 = document.getElementById("friend2-select").value;
  if (!id1 || !id2 || id1 === id2) { showToast("Select two different friends"); return; }

  const f1 = friends.find(f => f.id === id1);
  const f2 = friends.find(f => f.id === id2);

  const avEl = f => f.avatar
    ? `<img src="${escapeHtml(f.avatar)}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid ${f.color};" />`
    : `<div style="width:48px;height:48px;border-radius:50%;background:${f.color};display:flex;align-items:center;justify-content:center;font-weight:700;color:white;">${f.name.slice(0,2).toUpperCase()}</div>`;

  document.getElementById("comparison-result").innerHTML = `
    <div class="comparison-grid">
      <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">${avEl(f1)}<h3>${escapeHtml(f1.name)}</h3></div>
        <div class="stat-box"><div class="stat-label">Closeness</div><div class="stat-value">${f1.closeness}</div><div class="progress-bar-track"><div class="progress-bar-fill" style="width:${f1.closeness}%;"></div></div></div>
        <div class="stat-box"><div class="stat-label">Importance</div><div class="stat-value">${f1.importance}</div><div class="progress-bar-track"><div class="progress-bar-fill" style="width:${f1.importance}%;"></div></div></div>
        <div class="stat-box"><div class="stat-label">Type</div><div style="font-size:13px;margin-top:4px;color:${typeColors[f1.type]};font-weight:600;">${f1.type}</div></div>
      </div>
      <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">${avEl(f2)}<h3>${escapeHtml(f2.name)}</h3></div>
        <div class="stat-box"><div class="stat-label">Closeness</div><div class="stat-value">${f2.closeness}</div><div class="progress-bar-track"><div class="progress-bar-fill" style="width:${f2.closeness}%;"></div></div></div>
        <div class="stat-box"><div class="stat-label">Importance</div><div class="stat-value">${f2.importance}</div><div class="progress-bar-track"><div class="progress-bar-fill" style="width:${f2.importance}%;"></div></div></div>
        <div class="stat-box"><div class="stat-label">Type</div><div style="font-size:13px;margin-top:4px;color:${typeColors[f2.type]};font-weight:600;">${f2.type}</div></div>
      </div>
    </div>
    <div class="card" style="margin-top:16px;">
      <h3>Comparison Insights</h3>
      <div class="insight-box"><strong>Closeness Difference:</strong> ${Math.abs(f1.closeness-f2.closeness)} pts — ${f1.closeness>f2.closeness?`Closer to ${escapeHtml(f1.name)}`:`Closer to ${escapeHtml(f2.name)}`}</div>
      <div class="insight-box"><strong>Importance Difference:</strong> ${Math.abs(f1.importance-f2.importance)} pts — ${f1.importance>f2.importance?`${escapeHtml(f1.name)} more important`:`${escapeHtml(f2.name)} more important`}</div>
    </div>`;
});

// ─── Export ────────────────────────────────────────────────────────────────────
function exportData() {
  const data = {
    exported: new Date().toISOString(),
    friends:  friends.map(f => ({ ...f, avatar: f.avatar ? "[base64]" : null })),
    groups:   groups.map(g => ({ id: g.id, name: g.name, purpose: g.purpose, icon: g.icon, color: g.color, memberIds: g.memberIds, createdAt: g.createdAt })),
    stats: { total: friends.length,
      avgCloseness:  Math.round(friends.reduce((t,f)=>t+f.closeness, 0)/friends.length||0),
      avgImportance: Math.round(friends.reduce((t,f)=>t+f.importance,0)/friends.length||0) },
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)], { type: "application/json" }));
  const a   = Object.assign(document.createElement("a"), { href: url, download: `friendship-orbit-${Date.now()}.json` });
  a.click(); URL.revokeObjectURL(url);
  showToast("Data exported! 📥");
}

// ─── Clear All ─────────────────────────────────────────────────────────────────
function clearAllData() {
  if (confirm("Delete ALL data? This cannot be undone.")) {
    friends = []; selectedFriendId = null;
    saveFriends(); renderOrbit();
    showToast("All data cleared");
  }
}

// ─── Modal backdrop ────────────────────────────────────────────────────────────
document.getElementById("edit-modal")?.addEventListener("click", e => {
  if (e.target === e.currentTarget) closeEditModal();
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTELLATION GROUPS
// ═══════════════════════════════════════════════════════════════════════════════

const GROUP_COLORS = ["#ff8cc6","#ffd166","#8fd3ff","#9cffac","#a78bfa","#fb7185","#5ce1e6","#f97316"];

let groups         = [];
let editingGroupId = null;
let selIcon        = "💪";
let selColor       = GROUP_COLORS[0];

// ─── Storage ──────────────────────────────────────────────────────────────────
function loadGroups() {
  try {
    const s = localStorage.getItem("friendship-orbit-groups");
    groups = s ? JSON.parse(s) : [];
  } catch { groups = []; }
}

function saveGroups() {
  localStorage.setItem("friendship-orbit-groups", JSON.stringify(groups));
}

// ─── Stats & Health ───────────────────────────────────────────────────────────
function enrichGroups() {
  groups.forEach(g => {
    g.members = (g.memberIds || []).map(id => friends.find(f => f.id === id)).filter(Boolean);
    g.stats   = calcGroupStats(g);
  });
}

function calcGroupStats(g) {
  const m = g.members || [];
  if (!m.length) return { count: 0, avgCloseness: 0, avgImportance: 0, health: "balanced", healthScore: 0, breakdown: { balanced: 0, growing: 0, onesided: 0 } };
  const avgC = Math.round(m.reduce((t, f) => t + f.closeness,  0) / m.length);
  const avgI = Math.round(m.reduce((t, f) => t + f.importance, 0) / m.length);
  const bal  = m.filter(f => Math.abs(f.closeness - f.importance) < 10).length;
  const gr   = m.filter(f => f.closeness > f.importance).length;
  const os   = m.filter(f => f.closeness < f.importance - 10).length;
  const ratio = bal / m.length;
  const health = ratio > 0.7 ? "balanced" : ratio > 0.5 ? "growing" : ratio > 0.3 ? "onesided" : "drifting";
  const score  = Math.round(m.reduce((t, f) => t + Math.max(0, 100 - Math.abs(f.closeness - f.importance) * 1.5), 0) / m.length);
  return { count: m.length, avgCloseness: avgC, avgImportance: avgI, health, healthScore: score, breakdown: { balanced: bal, growing: gr, onesided: os } };
}

function groupHealthIcon(h) { return { balanced: "✓", growing: "↑", onesided: "→", drifting: "↓" }[h] ?? "?"; }

function groupInsights(g) {
  const m = g.members || [], s = g.stats, out = [];
  if (!m.length) return out;
  const healthMsg = { balanced: `"${escapeHtml(g.name)}" is well-balanced — you invest appropriately and receive similarly in return.`, growing: `This group is growing. Strong momentum — keep nurturing it.`, onesided: `You invest more in this group than they return. Consider whether the energy is sustainable.`, drifting: `This group is drifting. Consider reaching out and reinvesting in these connections.` };
  out.push(healthMsg[s.health]);
  const drifting = m.filter(f => f.closeness < f.importance - 15);
  if (drifting.length) out.push(`${drifting.map(f => escapeHtml(f.name)).join(", ")} ${drifting.length === 1 ? "is" : "are"} drifting. Consider reconnecting one-on-one.`);
  const growing = m.filter(f => f.closeness > f.importance && f.closeness > 60);
  if (growing.length) out.push(`Strong growth potential here. Consider organising a group activity.`);
  if (new Set(m.map(f => f.type)).size === 1) out.push(`All members share the same type. Adding diverse friend types could strengthen this constellation.`);
  const bh = m.filter(f => f.status !== "normal");
  if (bh.length) out.push(`⚠️ ${bh.map(f => escapeHtml(f.name)).join(", ")} ${bh.length === 1 ? "has" : "have"} been marked toxic or cut off — consider removing them from this group.`);
  return out;
}

// ─── Render Grid ─────────────────────────────────────────────────────────────
function renderConstellations() {
  enrichGroups();
  const c = document.getElementById("groups-container");
  if (!c) return;

  if (!groups.length) {
    c.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px 24px;color:var(--text-secondary);">
      <div style="font-size:52px;margin-bottom:14px;">⭐</div>
      <p style="font-size:15px;font-weight:600;margin-bottom:6px;">No constellations yet</p>
      <p style="font-size:13px;">Create a group to organise friends by shared purpose.</p>
    </div>`;
    return;
  }

  c.innerHTML = groups.map(g => {
    const preview = g.members.slice(0, 4).map(m =>
      m.avatar
        ? `<img src="${escapeHtml(m.avatar)}" style="width:26px;height:26px;border-radius:50%;object-fit:cover;border:2px solid ${g.color};margin-left:-6px;" />`
        : `<div style="width:26px;height:26px;border-radius:50%;background:${m.color};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:white;border:2px solid ${g.color};margin-left:-6px;flex-shrink:0;">${m.name.slice(0,2).toUpperCase()}</div>`
    ).join("");
    const extra = g.members.length > 4 ? `<div style="width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:var(--text-secondary);border:2px solid ${g.color};margin-left:-6px;">+${g.members.length - 4}</div>` : "";
    return `
    <div class="group-card" style="border-left:4px solid ${g.color};">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:14px;">
        <div style="flex:1;min-width:0;">
          <h3 style="font-size:16px;font-weight:800;margin-bottom:4px;">${g.icon} ${escapeHtml(g.name)}</h3>
          <p style="font-size:12px;color:var(--text-secondary);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(g.purpose)}</p>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0;margin-left:10px;">
          <button type="button" class="btn btn-secondary" style="padding:5px 10px;font-size:11px;" onclick="openEditGroupModal('${g.id}')">Edit</button>
          <button type="button" class="btn btn-danger"    style="padding:5px 10px;font-size:11px;" onclick="confirmDeleteGroup('${g.id}')">✕</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">
        <div class="stat-box" style="margin:0;padding:10px;">
          <div class="stat-label">Members</div>
          <div class="stat-value" style="font-size:20px;">${g.stats.count}</div>
        </div>
        <div class="stat-box" style="margin:0;padding:10px;">
          <div class="stat-label">Closeness</div>
          <div class="stat-value" style="font-size:20px;">${g.stats.avgCloseness}</div>
        </div>
        <div class="stat-box" style="margin:0;padding:10px;">
          <div class="stat-label">Health</div>
          <div style="margin-top:5px;"><span class="health-badge health-${g.stats.health}" style="font-size:11px;">${groupHealthIcon(g.stats.health)} ${g.stats.health}</span></div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px;padding-left:6px;">
        ${preview}${extra}
        <span style="font-size:11px;color:var(--text-secondary);margin-left:10px;">
          ${g.members.map(m => escapeHtml(m.name)).join(", ") || "No members"}
        </span>
      </div>

      <button type="button" class="btn btn-primary" style="width:100%;font-size:12px;padding:9px;" onclick="openGroupDetail('${g.id}')">
        View Details →
      </button>
    </div>`;
  }).join("");
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
function openCreateGroupModal() {
  editingGroupId = null;
  selIcon  = "💪";
  selColor = GROUP_COLORS[0];
  document.getElementById("group-modal-title").textContent = "Create Constellation";
  document.getElementById("group-submit-btn").textContent  = "Create Group";
  document.getElementById("group-name").value    = "";
  document.getElementById("group-purpose").value = "";
  syncIconPicker();
  buildColorPicker();
  buildMembersSelect([]);
  document.getElementById("group-modal").classList.add("active");
}

function openEditGroupModal(groupId) {
  const g = groups.find(x => x.id === groupId);
  if (!g) return;
  editingGroupId = groupId;
  selIcon  = g.icon;
  selColor = g.color;
  document.getElementById("group-modal-title").textContent = "Edit Constellation";
  document.getElementById("group-submit-btn").textContent  = "Save Changes";
  document.getElementById("group-name").value    = g.name;
  document.getElementById("group-purpose").value = g.purpose;
  syncIconPicker();
  buildColorPicker();
  buildMembersSelect(g.memberIds || []);
  document.getElementById("group-modal").classList.add("active");
}

function closeGroupModal() {
  document.getElementById("group-modal").classList.remove("active");
  editingGroupId = null;
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function openGroupDetail(groupId) {
  enrichGroups();
  const g = groups.find(x => x.id === groupId);
  if (!g) return;

  document.getElementById("detail-group-title").textContent = `${g.icon} ${g.name}`;
  const insights = groupInsights(g);

  document.getElementById("group-detail-content").innerHTML = `
    <div style="padding:12px 14px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid var(--border);margin-bottom:16px;">
      <p style="font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px;">Purpose</p>
      <p style="font-size:14px;line-height:1.65;font-style:italic;">"${escapeHtml(g.purpose)}"</p>
    </div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">
      <div class="stat-box"><div class="stat-label">Members</div><div class="stat-value">${g.stats.count}</div></div>
      <div class="stat-box"><div class="stat-label">Avg Closeness</div><div class="stat-value">${g.stats.avgCloseness}</div></div>
      <div class="stat-box"><div class="stat-label">Avg Importance</div><div class="stat-value">${g.stats.avgImportance}</div></div>
      <div class="stat-box"><div class="stat-label">Health Score</div><div class="stat-value">${g.stats.healthScore}</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;">
      <div style="padding:10px 12px;background:rgba(111,230,168,0.08);border-radius:8px;border:1px solid rgba(111,230,168,0.15);text-align:center;">
        <div style="font-size:11px;color:var(--success);font-weight:700;">Balanced</div>
        <div style="font-size:20px;font-weight:800;color:white;">${g.stats.breakdown.balanced}</div>
      </div>
      <div style="padding:10px 12px;background:rgba(92,225,230,0.07);border-radius:8px;border:1px solid rgba(92,225,230,0.12);text-align:center;">
        <div style="font-size:11px;color:var(--accent-2);font-weight:700;">Growing</div>
        <div style="font-size:20px;font-weight:800;color:white;">${g.stats.breakdown.growing}</div>
      </div>
      <div style="padding:10px 12px;background:rgba(255,209,102,0.07);border-radius:8px;border:1px solid rgba(255,209,102,0.12);text-align:center;">
        <div style="font-size:11px;color:var(--warning);font-weight:700;">One-sided</div>
        <div style="font-size:20px;font-weight:800;color:white;">${g.stats.breakdown.onesided}</div>
      </div>
    </div>

    <h4 style="font-size:13px;font-weight:700;margin-bottom:10px;">Members (${g.members.length})</h4>
    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
      ${g.members.map(m => {
        const h  = getHealthStatus(m);
        const av = m.avatar
          ? `<img src="${escapeHtml(m.avatar)}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid ${m.color};flex-shrink:0;" />`
          : `<div style="width:34px;height:34px;border-radius:50%;background:${m.color};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:white;flex-shrink:0;">${m.name.slice(0,2).toUpperCase()}</div>`;
        return `<div class="group-detail-member">
          ${av}
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:700;">${escapeHtml(m.name)}</div>
            <div style="font-size:11px;color:var(--text-secondary);">${escapeHtml(m.tag)}</div>
          </div>
          <div style="display:flex;gap:12px;align-items:center;">
            <div style="text-align:right;">
              <div style="font-size:10px;color:var(--text-secondary);">Closeness</div>
              <div style="font-size:16px;font-weight:800;color:var(--accent);">${m.closeness}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:10px;color:var(--text-secondary);">Importance</div>
              <div style="font-size:16px;font-weight:800;color:var(--accent-2);">${m.importance}</div>
            </div>
            <span class="health-badge health-${h.class}" style="font-size:11px;">${h.icon} ${h.name}</span>
          </div>
        </div>`;
      }).join("")}
    </div>

    <h4 style="font-size:13px;font-weight:700;margin-bottom:10px;">Group Insights</h4>
    <div style="margin-bottom:16px;">
      ${insights.map(i => `<div class="insight-box">${i}</div>`).join("") || "<p style='color:var(--text-secondary);font-size:13px;'>Looking good! Keep nurturing this constellation. 🌟</p>"}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <button type="button" class="btn btn-secondary" onclick="closeDetailModal();openEditGroupModal('${g.id}')">Edit Group</button>
      <button type="button" class="btn btn-danger"    onclick="closeDetailModal();confirmDeleteGroup('${g.id}')">Delete Group</button>
    </div>`;

  document.getElementById("group-detail-modal").classList.add("active");
}

function closeDetailModal() {
  document.getElementById("group-detail-modal").classList.remove("active");
}

// ─── Picker Helpers ───────────────────────────────────────────────────────────
function syncIconPicker() {
  document.querySelectorAll("#icon-picker .icon-btn").forEach(b => b.classList.toggle("active", b.dataset.icon === selIcon));
}

function buildColorPicker() {
  const el = document.getElementById("color-picker");
  if (!el) return;
  el.innerHTML = GROUP_COLORS.map(c =>
    `<button type="button" class="color-btn${c === selColor ? " active" : ""}" data-color="${c}" style="background:${c};"></button>`
  ).join("");
}

function buildMembersSelect(checkedIds = []) {
  const el = document.getElementById("group-members-select");
  if (!el) return;
  if (!friends.length) { el.innerHTML = `<p style="color:var(--text-secondary);font-size:13px;grid-column:1/-1;">No friends added yet.</p>`; return; }
  el.innerHTML = friends.map(f => `
    <label class="member-check-row${checkedIds.includes(f.id) ? " active" : ""}">
      <input type="checkbox" value="${f.id}" ${checkedIds.includes(f.id) ? "checked" : ""} />
      <div style="width:26px;height:26px;border-radius:50%;background:${f.color};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:white;flex-shrink:0;">${f.name.slice(0,2).toUpperCase()}</div>
      <span>${escapeHtml(f.name)}</span>
    </label>`).join("");
  el.querySelectorAll("input[type='checkbox']").forEach(cb =>
    cb.addEventListener("change", () => cb.closest(".member-check-row").classList.toggle("active", cb.checked))
  );
}

// ─── Picker Click Delegates ───────────────────────────────────────────────────
document.getElementById("icon-picker")?.addEventListener("click", e => {
  const b = e.target.closest(".icon-btn");
  if (!b) return;
  selIcon = b.dataset.icon;
  syncIconPicker();
});

document.getElementById("color-picker")?.addEventListener("click", e => {
  const b = e.target.closest(".color-btn");
  if (!b) return;
  selColor = b.dataset.color;
  document.querySelectorAll("#color-picker .color-btn").forEach(x => x.classList.toggle("active", x.dataset.color === selColor));
});

// ─── Form Submit ──────────────────────────────────────────────────────────────
document.getElementById("group-form")?.addEventListener("submit", e => {
  e.preventDefault();
  const name      = document.getElementById("group-name").value.trim();
  const purpose   = document.getElementById("group-purpose").value.trim();
  const memberIds = [...document.querySelectorAll("#group-members-select input:checked")].map(cb => cb.value);

  if (!name)              { showToast("Please enter a group name"); return; }
  if (!purpose)           { showToast("Please describe the group's purpose"); return; }
  if (!memberIds.length)  { showToast("Select at least 1 member"); return; }
  if (memberIds.length > 20) { showToast("Max 20 members per group"); return; }

  const dupe = groups.find(g => g.name.toLowerCase() === name.toLowerCase() && g.id !== editingGroupId);
  if (dupe) { showToast("A group with this name already exists"); return; }

  if (editingGroupId) {
    const g = groups.find(x => x.id === editingGroupId);
    Object.assign(g, { name, purpose, icon: selIcon, color: selColor, memberIds, updatedAt: Date.now() });
    showToast(`${name} updated! ⭐`);
  } else {
    groups.push({ id: createId(), name, purpose, icon: selIcon, color: selColor, memberIds, createdAt: Date.now(), updatedAt: Date.now() });
    showToast(`${name} created! ⭐`);
  }

  saveGroups();
  closeGroupModal();
  renderConstellations();
});

// ─── Delete ───────────────────────────────────────────────────────────────────
function confirmDeleteGroup(groupId) {
  const g = groups.find(x => x.id === groupId);
  if (!g || !confirm(`Delete "${g.name}"? Your friends won't be affected.`)) return;
  groups = groups.filter(x => x.id !== groupId);
  saveGroups();
  renderConstellations();
  showToast("Constellation deleted");
}

// ─── Backdrop closes ──────────────────────────────────────────────────────────
document.getElementById("group-modal")?.addEventListener("click",        e => { if (e.target === e.currentTarget) closeGroupModal(); });
document.getElementById("group-detail-modal")?.addEventListener("click", e => { if (e.target === e.currentTarget) closeDetailModal(); });

// ─── Init ──────────────────────────────────────────────────────────────────────
buildStarfield();
loadFriends();
loadGroups();
renderOrbit();
renderComparisons();
buildColorPicker();
