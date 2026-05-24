"use client";

import { useEffect } from "react";

export function Starfield() {
  useEffect(() => {
    const field = document.getElementById("starfield");
    if (!field) return;

    field.replaceChildren();

    for (let i = 0; i < 180; i++) {
      const s = document.createElement("div");
      s.className = "fo-star";
      const size = Math.random() * 2.2 + 0.4;
      s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${size}px;height:${size}px;--dur:${(
        Math.random() * 4 +
        2
      ).toFixed(1)}s;--delay:${(Math.random() * 6).toFixed(1)}s;`;
      field.append(s);
    }
    for (let i = 0; i < 5; i++) {
      const ss = document.createElement("div");
      ss.className = "fo-shooting-star";
      ss.style.cssText = `left:${Math.random() * 40}%;top:${Math.random() * 50}%;width:${(
        Math.random() * 100 +
        80
      ).toFixed(0)}px;--sdur:${(Math.random() * 8 + 6).toFixed(1)}s;--sdelay:${(Math.random() * 14).toFixed(
        1,
      )}s;`;
      field.append(ss);
    }
  }, []);

  return (
    <div id="starfield" className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden />
  );
}
