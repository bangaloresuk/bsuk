// ============================================================
//  features/calendar.js
//  React component: AllBookingsView
//  Month navigator + type tabs (All/Prayer/Satsang) + search.
//  Props: { api, sukKey }
// ============================================================

"use strict";

const { createElement: h, useState, useEffect, useMemo } = React;

window.AllBookingsView = function AllBookingsView({ api, sukKey }) {

  const todayStr = window.getTodayStr();
  const nowYM    = todayStr.slice(0, 7);

  const [activeYM, setActiveYM] = useState(nowYM);
  const [typeTab,  setTypeTab]  = useState("all");
  const [search,   setSearch]   = useState("");
  const [allItems, setAllItems] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  // ── Fetch both prayer + satsang bookings ─────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const now    = new Date();
        const months = [-1, 0, 1].map(offset => {
          const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
          return d.toISOString().slice(0, 7);
        });
        const fetches = months.flatMap(m => [
          api.prayer.getCalendar(m, "prayer").catch(() => ({ data: [] })),
          api.prayer.getCalendar(m, "satsang").catch(() => ({ data: [] })),
        ]);
        const results = await Promise.all(fetches);
        if (cancelled) return;

        const prayer  = [];
        const satsang = [];
        results.forEach((r, i) => {
          const items = r.data || [];
          if (i % 2 === 0) {
            items.forEach(b => prayer.push({ ...b, _type: "prayer" }));
          } else {
            items.forEach(b => satsang.push({ ...b, _type: "satsang" }));
          }
        });

        // Deduplicate by id
        const seen = new Set();
        const combined = [...prayer, ...satsang].filter(b => {
          if (!b.id || seen.has(b.id)) return false;
          seen.add(b.id);
          return true;
        });

        setAllItems(combined);
      } catch(e) {
        if (!cancelled) setError("Could not load bookings. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [sukKey]);

  // ── Month list derived from data ─────────────────────────
  const allMonths = useMemo(() => {
    const seen = new Set(allItems.map(b => (b.date||"").slice(0,7)).filter(Boolean));
    seen.add(nowYM);
    return Array.from(seen).sort();
  }, [allItems, nowYM]);

  const monthIdx   = allMonths.indexOf(activeYM);
  const monthLabel = new Date(activeYM + "-01T00:00:00")
    .toLocaleDateString("en-IN", { month:"long", year:"numeric" });

  const isSearching = search.trim().length > 0;

  const filtered = useMemo(() => allItems.filter(b => {
    if (typeTab==="prayer"  && b._type!=="prayer")  return false;
    if (typeTab==="satsang" && b._type!=="satsang") return false;
    if (isSearching) {
      const q = search.toLowerCase();
      return (b.name||"").toLowerCase().includes(q)
          || (b.venue||"").toLowerCase().includes(q)
          || (b.hostedBy||"").toLowerCase().includes(q)
          || (b.place||"").toLowerCase().includes(q);
    }
    return (b.date||"").startsWith(activeYM);
  }).sort((a,b) => (a.date||"").localeCompare(b.date||"")), [allItems, typeTab, isSearching, search, activeYM]);

  // Group by date
  const groups = useMemo(() => {
    const g = {};
    filtered.forEach(b => { const d = b.date||"Unknown"; (g[d]=g[d]||[]).push(b); });
    return g;
  }, [filtered]);
  const sortedDates = Object.keys(groups).sort();

  const monthItems = allItems.filter(b => (b.date||"").startsWith(activeYM));
  const counts = {
    all:     monthItems.length,
    prayer:  monthItems.filter(b => b._type==="prayer").length,
    satsang: monthItems.filter(b => b._type==="satsang").length,
  };

  const TYPE_TABS = [
    { id:"all",     label:"All",     icon:"📋" },
    { id:"prayer",  label:"Prayer",  icon:"🙏" },
    { id:"satsang", label:"Satsang", icon:"🪔" },
  ];

  // ── Booking card ──────────────────────────────────────────
  const renderCard = (b) => {
    if (b._type === "prayer") {
      const sc = window.SLOT_STYLE[b.time] || window.SLOT_STYLE["Morning"];
      return h("div", {
        key: b.id,
        style:{ borderRadius:14, overflow:"hidden",
          border:"1px solid rgba(59,130,246,0.18)", background:"rgba(239,246,255,0.65)" },
      },
        h("div", { style:{ height:3, background:`linear-gradient(90deg,${sc.color},${sc.color}55)` } }),
        h("div", { style:{ padding:"12px 14px" } },
          h("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:4 } },
            h("div", { style:{ fontFamily:"'Cinzel',serif", fontWeight:800, color:"#1e3a8a", fontSize:14 } }, b.name),
            h("span", { style:{ flexShrink:0, fontSize:10, fontWeight:800, color:"#1d4ed8",
              background:"rgba(29,78,216,0.09)", padding:"2px 8px", borderRadius:20,
              textTransform:"uppercase", letterSpacing:"0.6px" } }, "🙏 Prayer")
          ),
          h("div", { style:{ fontSize:13, color:sc.color, fontWeight:700, marginBottom:3 } },
            `${sc.icon} ${b.time} · 🕐 ${window.cleanTime(b.prayerTime)}`),
          b.place && h("div", { style:{ fontSize:12, color:"#6b7280" } },
            b.place.startsWith("http")
              ? h("a", { href:b.place, target:"_blank", rel:"noopener noreferrer",
                  style:{ color:"#1d4ed8", fontWeight:600, textDecoration:"none" } }, "📍 View on Map")
              : `📍 ${b.place}`
          )
        )
      );
    }

    // Satsang card
    return h("div", {
      key: b.id,
      style:{ borderRadius:14, overflow:"hidden",
        border:"1px solid rgba(217,119,6,0.2)", background:"rgba(255,251,235,0.75)" },
    },
      h("div", { style:{ height:3, background:"linear-gradient(90deg,#d97706,#fbbf2455)" } }),
      h("div", { style:{ padding:"12px 14px" } },
        h("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:4 } },
          h("div", { style:{ fontFamily:"'Cinzel',serif", fontWeight:800, color:"#78350f", fontSize:14 } }, b.name),
          h("span", { style:{ flexShrink:0, fontSize:10, fontWeight:800, color:"#92400e",
            background:"rgba(217,119,6,0.1)", padding:"2px 8px", borderRadius:20,
            textTransform:"uppercase", letterSpacing:"0.6px" } }, "🪔 Satsang")
        ),
        h("div", { style:{ fontSize:13, color:"#d97706", fontWeight:700, marginBottom:3 } },
          `⏰ ${window.cleanTime(b.time)} onwards`),
        b.venue && h("div", { style:{ fontSize:12, color:"#6b7280" } },
          b.mapsLink
            ? h("a", { href:b.mapsLink, target:"_blank", rel:"noopener noreferrer",
                style:{ color:"#d97706", fontWeight:600, textDecoration:"none" } }, `📍 ${b.venue} · Map`)
            : `📍 ${b.venue}`
        ),
        b.hostedBy && h("div", { style:{ fontSize:12, color:"#92400e", fontWeight:600, marginTop:3 } }, `🙏 ${b.hostedBy}`),
        b.occasion && h("div", { style:{ fontSize:12, color:"#d97706", fontWeight:600, marginTop:3 } }, `🪔 ${b.occasion}`)
      )
    );
  };

  // ── Main render ──────────────────────────────────────────
  return h("div", { style:{ display:"flex", flexDirection:"column", gap:10 } },

    // Navigator card
    h("div", { className:"card", style:{ padding:"14px 16px" } },

      isSearching && h("div", { style:{ display:"flex", alignItems:"center", gap:8,
        marginBottom:12, padding:"8px 12px", borderRadius:10,
        background:"rgba(29,78,216,0.07)", border:"1px solid rgba(29,78,216,0.15)" } },
        h("span", null, "🔍"),
        h("span", { style:{ fontSize:12, color:"rgba(29,78,216,0.65)", fontWeight:700 } },
          "Searching across all months")
      ),

      !isSearching && h("div", { style:{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 } },
        h("button", {
          onClick: () => monthIdx > 0 && setActiveYM(allMonths[monthIdx-1]),
          disabled: monthIdx <= 0,
          style:{ width:36, height:36, borderRadius:"50%", border:"none",
            cursor: monthIdx<=0 ? "not-allowed" : "pointer",
            background: monthIdx<=0 ? "rgba(59,130,246,0.05)" : "rgba(29,78,216,0.1)",
            color: monthIdx<=0 ? "rgba(29,78,216,0.2)" : "#1d4ed8",
            fontSize:16, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center" },
        }, "‹"),
        h("div", { style:{ textAlign:"center" } },
          h("div", { style:{ fontFamily:"'Cinzel',serif", fontWeight:900, color:"#1e3a8a", fontSize:16 } }, monthLabel),
          h("div", { style:{ fontSize:11, color:"rgba(29,78,216,0.45)", marginTop:2 } },
            loading ? "Loading..." : `${counts.all} booking${counts.all!==1?"s":""} this month`)
        ),
        h("button", {
          onClick: () => monthIdx < allMonths.length-1 && setActiveYM(allMonths[monthIdx+1]),
          disabled: monthIdx >= allMonths.length-1,
          style:{ width:36, height:36, borderRadius:"50%", border:"none",
            cursor: monthIdx>=allMonths.length-1 ? "not-allowed" : "pointer",
            background: monthIdx>=allMonths.length-1 ? "rgba(59,130,246,0.05)" : "rgba(29,78,216,0.1)",
            color: monthIdx>=allMonths.length-1 ? "rgba(29,78,216,0.2)" : "#1d4ed8",
            fontSize:16, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center" },
        }, "›")
      ),

      h("div", { style:{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:12 } },
        TYPE_TABS.map(t => {
          const active = typeTab === t.id;
          return h("button", {
            key: t.id,
            onClick: () => setTypeTab(t.id),
            style:{ padding:"9px 0", borderRadius:12, border:active?"none":"1px solid rgba(59,130,246,0.15)",
              cursor:"pointer", fontFamily:"'Cinzel',serif", fontSize:12, fontWeight:800, transition:"all 0.18s",
              background: active
                ? t.id==="satsang" ? "linear-gradient(135deg,#78350f,#d97706)"
                  : t.id==="prayer" ? "linear-gradient(135deg,#1d4ed8,#3b82f6)"
                  : "linear-gradient(135deg,#1e3a8a,#3b82f6)"
                : "rgba(239,246,255,0.7)",
              color: active ? "#fff" : "rgba(29,78,216,0.5)",
              boxShadow: active ? "0 3px 12px rgba(29,78,216,0.2)" : "none",
            },
          },
            h("div", null, t.icon),
            h("div", { style:{ fontSize:11 } }, t.label),
            h("div", { style:{ fontSize:10, marginTop:1, opacity:active?0.85:0.55,
              color:active?"#fff":"#1d4ed8", fontFamily:"sans-serif", fontWeight:700 } },
              loading ? "…" : counts[t.id])
          );
        })
      ),

      h("div", { style:{ position:"relative" } },
        h("input", {
          className: "divine-input",
          placeholder: "🔍  Search by name or venue...",
          value: search,
          onChange: e => setSearch(e.target.value),
          style:{ paddingLeft:14, fontSize:13 },
        }),
        search && h("button", {
          onClick: () => setSearch(""),
          style:{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
            background:"none", border:"none", cursor:"pointer",
            fontSize:15, color:"rgba(29,78,216,0.4)", lineHeight:1 },
        }, "✕")
      )
    ),

    // ── Error state ───────────────────────────────────────
    error && h("div", { className:"card", style:{ textAlign:"center", padding:"20px",
      color:"#b91c1c", background:"#fef2f2", border:"1px solid #fecaca" } },
      h("div", { style:{ fontSize:24, marginBottom:8 } }, "⚠️"),
      h("div", { style:{ fontSize:13, fontWeight:600 } }, error),
      // FIX: style was a dangling argument outside the props object — now correctly inside {}
      h("button", {
        onClick: () => { setError(""); setLoading(true); },
        style:{ marginTop:10, padding:"8px 16px", border:"1px solid #fca5a5",
          borderRadius:8, background:"#fff", color:"#dc2626",
          fontWeight:700, fontSize:12, cursor:"pointer" },
      }, "Try Again")
    ),

    // ── Loading skeletons ─────────────────────────────────
    loading && !error && h("div", { style:{ display:"flex", flexDirection:"column", gap:10 } },
      h(window.SkeletonCard, { rows:3 }),
      h(window.SkeletonCard, { rows:3 }),
      h(window.SkeletonCard, { rows:2 })
    ),

    // ── Booking cards ─────────────────────────────────────
    !loading && !error && (
      filtered.length === 0
        ? h("div", { className:"card", style:{ textAlign:"center", padding:"40px 0" } },
            h("div", { style:{ fontSize:36, marginBottom:10, filter:"saturate(0) brightness(2.2)" } }, "🪷"),
            h("div", { style:{ color:"rgba(29,78,216,0.35)", fontSize:13 } },
              isSearching
                ? `No results for "${search}" across all months`
                : `No ${typeTab==="all"?"bookings":typeTab+" bookings"} in ${monthLabel}`
            ),
            search && h("button", {
              onClick: () => setSearch(""),
              style:{ marginTop:10, padding:"7px 16px", borderRadius:20,
                border:"1px solid rgba(29,78,216,0.2)", background:"transparent",
                color:"#1d4ed8", fontSize:12, fontWeight:700, cursor:"pointer" },
            }, "Clear search")
          )
        : h("div", { style:{ display:"flex", flexDirection:"column", gap:6 } },
            sortedDates.map(date => {
              const dayItems  = groups[date];
              const isToday   = date === todayStr;
              const isPast    = date < todayStr;
              const dateLabel = new Date(date+"T00:00:00")
                .toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" });
              return h("div", { key:date },
                h("div", { style:{ display:"flex", alignItems:"center", gap:8, margin:"10px 0 6px" } },
                  h("div", { style:{ padding:"3px 12px", borderRadius:20, fontSize:11, fontWeight:800, whiteSpace:"nowrap",
                    background: isToday?"rgba(29,78,216,0.12)":isPast?"rgba(107,114,128,0.09)":"rgba(16,185,129,0.09)",
                    border:`1px solid ${isToday?"rgba(29,78,216,0.25)":isPast?"rgba(107,114,128,0.18)":"rgba(16,185,129,0.22)"}`,
                    color: isToday?"#1d4ed8":isPast?"#6b7280":"#065f46",
                  } },
                    (isToday ? "⭐ Today" : dateLabel) + ` · ${dayItems.length}`
                  ),
                  h("div", { style:{ flex:1, height:1,
                    background:"linear-gradient(90deg,rgba(59,130,246,0.12),transparent)" } })
                ),
                h("div", { style:{ display:"flex", flexDirection:"column", gap:8 } },
                  dayItems.map(b => renderCard(b))
                )
              );
            })
          )
    )
  );
};