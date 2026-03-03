// ============================================================
//  ui/particles.js
//  Injects background ambient animations:
//    • Light rays
//    • Floating gold / lotus particles
//  Call window.initParticles() once after DOM ready.
//  Mandalas are pure SVG in index.html (no JS needed).
// ============================================================

"use strict";

window.initParticles = () => {

  // ── Light rays ────────────────────────────────────────────
  const raysEl   = document.getElementById("rays");
  const rayCount = 18;

  if (raysEl) {
    for (let i = 0; i < rayCount; i++) {
      const r   = document.createElement("div");
      r.className = "ray";
      const pct = 10 + (i / (rayCount - 1)) * 80;
      r.style.left              = pct + "vw";
      r.style.height            = (40 + Math.random() * 25) + "vh";
      r.style.width             = (0.8 + Math.random() * 2.5) + "px";
      r.style.setProperty("--r", (Math.random() * 10 - 5) + "deg");
      r.style.animationDuration = (2.5 + Math.random() * 4) + "s";
      r.style.animationDelay    = (Math.random() * 4) + "s";
      raysEl.appendChild(r);
    }
  }

  // ── Floating particles ────────────────────────────────────
  const pc = document.getElementById("particles");
  if (!pc) return;

  const colors = [
    "rgba(255,200,50,0.7)",
    "rgba(212,175,55,0.6)",
    "rgba(59,130,246,0.5)",
    "rgba(99,165,255,0.4)",
    "rgba(255,255,255,0.75)",
    "rgba(147,197,253,0.5)",
    "rgba(255,230,130,0.55)",
  ];

  for (let i = 0; i < 55; i++) {
    const p         = document.createElement("div");
    p.style.position = "absolute";
    p.style.left     = Math.random() * 100 + "vw";
    p.style.animation = `floatUp ${14 + Math.random() * 22}s linear ${Math.random() * 20}s infinite`;

    if (i % 7 === 0) {
      // Lotus emoji particle
      p.style.fontSize = (10 + Math.random() * 10) + "px";
      p.innerText      = "🪷";
      p.style.opacity  = "0";
      p.style.filter   = Math.floor(Math.random() * 2) === 0
        ? "saturate(0) brightness(2.5) drop-shadow(0 0 6px rgba(255,255,255,0.8))"
        : "drop-shadow(0 0 8px rgba(255,180,210,0.8))";
    } else {
      p.className     = "particle";
      const sz        = Math.random() * 4 + 1;
      p.style.width   = sz + "px";
      p.style.height  = sz + "px";
      p.style.background   = colors[Math.floor(Math.random() * colors.length)];
      p.style.borderRadius = i % 3 === 0 ? "2px" : "50%";
      if (i % 3 === 0) p.style.transform = "rotate(45deg)";
    }

    pc.appendChild(p);
  }
};
