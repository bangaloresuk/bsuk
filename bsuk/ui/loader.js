// ============================================================
//  ui/loader.js
//  React components:
//    • SkeletonCard  — shimmer placeholder while data loads
//    • DataLoadingOverlay — full-page lotus spinner
//  Both are registered on window so app.js can use them.
// ============================================================

"use strict";

const { createElement: h } = React;

// ── Skeleton card ────────────────────────────────────────────
window.SkeletonCard = function SkeletonCard({ rows = 3, style = {} }) {
  return h("div", { className:"skeleton-card", style },
    // Header row
    h("div", { style:{ display:"flex", alignItems:"center", gap:10 } },
      h("div", { className:"skeleton", style:{ width:36, height:36, borderRadius:"50%", flexShrink:0 } }),
      h("div", { style:{ flex:1, display:"flex", flexDirection:"column", gap:6 } },
        h("div", { className:"skeleton", style:{ height:13, width:"55%", borderRadius:6 } }),
        h("div", { className:"skeleton", style:{ height:10, width:"35%", borderRadius:6 } })
      )
    ),
    // Content rows
    ...Array.from({ length: rows }).map((_, i) =>
      h("div", {
        key: i,
        className: "skeleton",
        style: {
          height: 11, borderRadius: 6,
          width: i === rows - 1 ? "45%" : i % 2 === 0 ? "80%" : "65%",
        },
      })
    ),
    // Button row
    h("div", { className:"skeleton", style:{ height:38, borderRadius:10, marginTop:4 } })
  );
};

// ── Full-page data-loading overlay ──────────────────────────
window.DataLoadingOverlay = function DataLoadingOverlay() {
  return h("div", {
    style: {
      position:"fixed", inset:0, zIndex:50,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      background:"rgba(232,240,254,0.85)",
      backdropFilter:"blur(6px)",
      animation:"fadeSlideIn 0.3s ease-out both",
    },
  },
    // Lotus spinner
    h("div", {
      style: {
        fontSize:44, marginBottom:16,
        animation:"floatEmoji 1.2s ease-in-out infinite alternate",
        filter:"drop-shadow(0 0 18px rgba(255,180,0,0.55))",
      },
    }, "🪷"),

    // Animated dots
    h("div", { style:{ display:"flex", gap:7, marginBottom:14 } },
      ...[0, 1, 2].map(i =>
        h("div", {
          key: i,
          style: {
            width:9, height:9, borderRadius:"50%",
            background:"#3b82f6",
            animation:"dotPulse 1.2s ease-in-out infinite",
            animationDelay: i * 0.2 + "s",
            opacity:0.7,
          },
        })
      )
    ),

    h("div", {
      style: {
        fontFamily:"'Cinzel',serif", fontSize:13, fontWeight:700,
        color:"rgba(29,78,216,0.65)", letterSpacing:"1.5px",
      },
    }, "Loading your Kendra data..."),

    h("div", {
      style: { fontSize:11, color:"rgba(29,78,216,0.38)", marginTop:6, letterSpacing:"0.5px" },
    }, "Jayguru 🙏")
  );
};
