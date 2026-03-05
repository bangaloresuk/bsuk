import React from 'react'
import { SUK_CONFIG, sukLabel } from '../../config/sukConfig.js'

function SUKSearchDropdown({ selected, onSelect }) {
  const allSuks = React.useMemo(() => Object.values(SUK_CONFIG), []);
  const [isOpen,      setIsOpen]      = React.useState(false);
  const [search,      setSearch]      = React.useState("");
  const [highlighted, setHighlighted] = React.useState(0);
  const [comingSoonPing, setComingSoonPing] = React.useState(null); // key of tapped coming-soon
  const inputRef    = React.useRef(null);
  const listRef     = React.useRef(null);
  const containerRef = React.useRef(null);

  const activeSuk = selected ? SUK_CONFIG[selected] : null;

  // Filter list
  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = !q ? allSuks : allSuks.filter(s =>
      (s.shortName||s.name||"").toLowerCase().includes(q) ||
      (s.location||"").toLowerCase().includes(q)
    );
    return [...list].sort((a, b) => {
      const an = (a.shortName||a.name||"").replace(/ SUK$/i,"").trim().toLowerCase();
      const bn = (b.shortName||b.name||"").replace(/ SUK$/i,"").trim().toLowerCase();
      return an.localeCompare(bn);
    });
  }, [search, allSuks]);

  React.useEffect(() => { setHighlighted(0); }, [search]);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false); setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Don't auto-focus — let user tap search manually to avoid mobile keyboard popup
  // React.useEffect(() => {
  //   if (isOpen && inputRef.current) inputRef.current.focus();
  // }, [isOpen]);

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.querySelector(`[data-idx="${highlighted}"]`);
    if (item) item.scrollIntoView({ block:"nearest", behavior:"smooth" });
  }, [highlighted]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(h => Math.min(h+1, filtered.length-1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted(h => Math.max(h-1, 0)); }
    else if (e.key === "Enter") { handlePick(filtered[highlighted]); }
    else if (e.key === "Escape") { setIsOpen(false); setSearch(""); }
  };

  const handlePick = (suk) => {
    if (!suk) return;
    if (!suk.configured) {
      setComingSoonPing(suk.key);
      setTimeout(() => setComingSoonPing(null), 2200);
      return;
    }
    onSelect(suk.key);
    setIsOpen(false); setSearch("");
  };

  // Highlight matched text
  const hilite = (text) => {
    if (!search.trim()) return text;
    const q = search.trim();
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <span>
        {text.slice(0,idx)}
        <span style={{ background:"rgba(29,78,216,0.12)", color:"#1d4ed8",
          borderRadius:3, padding:"0 2px", fontWeight:800 }}>
          {text.slice(idx, idx+q.length)}
        </span>
        {text.slice(idx+q.length)}
      </span>
    );
  };

  const liveLabel = activeSuk ? (activeSuk.shortName||activeSuk.name).replace(" SUK","").trim() : "";

  return (
    <div ref={containerRef} style={{ position:"relative", width:"100%" }}>

      {/* ── Trigger button ── */}
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{
          width:"100%", padding:"14px 16px",
          borderRadius: isOpen ? "13px 13px 0 0" : 13,
          border:`1.5px solid ${isOpen ? "rgba(29,78,216,0.45)" : "rgba(59,130,246,0.22)"}`,
          background: isOpen
            ? "rgba(239,246,255,0.95)"
            : selected ? "rgba(239,246,255,0.8)" : "rgba(239,246,255,0.6)",
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:10,
          cursor:"pointer", transition:"all 0.2s",
          boxShadow: isOpen
            ? "0 -2px 16px rgba(29,78,216,0.08)"
            : "0 2px 8px rgba(29,78,216,0.07)",
        }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, overflow:"hidden" }}>
          {/* Lotus indicator */}
          <span style={{
            fontSize:14, flexShrink:0,
            filter: selected && activeSuk && activeSuk.configured
              ? "drop-shadow(0 0 5px rgba(255,150,180,0.8))"
              : "saturate(0) brightness(1.5) opacity(0.4)",
            transition:"filter 0.3s",
          }}>🪷</span>
          <span style={{
            fontFamily:"'Cinzel',serif", fontWeight:700,
            fontSize:13, letterSpacing:"0.3px",
            color: selected ? "#1e3a8a" : "rgba(29,78,216,0.38)",
            overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
          }}>
            {selected ? liveLabel : "— Choose a Kendra —"}
          </span>
        </div>
        <div style={{
          color:"rgba(29,78,216,0.5)", fontSize:11, fontWeight:900, flexShrink:0,
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          transition:"transform 0.22s ease",
        }}>▼</div>
      </button>

      {/* ── Dropdown panel ── */}
      {isOpen && (
        <div style={{
          position:"absolute", top:"100%", left:0, right:0, zIndex:200,
          background:"rgba(248,252,255,0.98)",
          border:"1.5px solid rgba(29,78,216,0.2)",
          borderTop:"none",
          borderRadius:"0 0 16px 16px",
          boxShadow:"0 18px 48px rgba(29,78,216,0.16), 0 4px 12px rgba(0,0,0,0.06)",
          backdropFilter:"blur(16px)",
          animation:"dropDown 0.18s ease",
          overflow:"hidden",
        }}>

          {/* Search box */}
          <div style={{
            padding:"10px 12px 8px",
            borderBottom:"1px solid rgba(59,130,246,0.1)",
            background:"rgba(239,246,255,0.6)",
            position:"sticky", top:0, zIndex:10,
          }}>
            <div style={{
              display:"flex", alignItems:"center", gap:8,
              background:"#fff",
              border:"1.5px solid rgba(59,130,246,0.22)",
              borderRadius:10, padding:"8px 12px",
              boxShadow:"0 2px 8px rgba(29,78,216,0.06)",
            }}>
              <span style={{ fontSize:13, color:"rgba(29,78,216,0.45)", flexShrink:0 }}>🔍</span>
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search your location..."
                style={{
                  border:"none", outline:"none", background:"transparent",
                  fontFamily:"'Lato',sans-serif", fontSize:13, color:"#1e3a8a",
                  width:"100%",
                }}
              />
              {search && (
                <button onClick={() => setSearch("")}
                  style={{ border:"none", background:"none", cursor:"pointer",
                    color:"rgba(29,78,216,0.4)", fontSize:16, padding:0, lineHeight:1,
                    flexShrink:0 }}>×</button>
              )}
            </div>
            {/* Count row */}
            <div style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              marginTop:6, paddingInline:2,
            }}>
              <span style={{ fontSize:10, color:"rgba(29,78,216,0.4)", fontWeight:600 }}>
                {filtered.filter(s=>s.configured).length} Active · {filtered.filter(s=>!s.configured).length} Coming Soon
              </span>
              <span style={{ fontSize:10, color:"rgba(29,78,216,0.3)" }}>
                {filtered.length} centres
              </span>
            </div>
          </div>

          {/* List */}
          <div ref={listRef} style={{ maxHeight:280, overflowY:"auto", padding:"4px 0" }}>

            {filtered.length === 0 ? (
              <div style={{ padding:"24px 16px", textAlign:"center",
                color:"rgba(29,78,216,0.35)", fontSize:13 }}>
                <div style={{ fontSize:28, marginBottom:8 }}>🙏</div>
                No Kendra found for "{search}"
              </div>
            ) : (
              filtered.map((suk, i) => {
                const isActive    = suk.configured;
                const isSelected  = selected === suk.key;
                const isHigh      = highlighted === i;
                const pinging     = comingSoonPing === suk.key;
                const displayName = (suk.shortName||suk.name||"").replace(/ SUK$/,"").trim();

                return (
                  <div
                    key={suk.key}
                    data-idx={i}
                    onMouseEnter={() => setHighlighted(i)}
                    onClick={() => handlePick(suk)}
                    style={{
                      padding:"11px 16px",
                      display:"flex", alignItems:"center", gap:12,
                      cursor: isActive ? "pointer" : "not-allowed",
                      background: isHigh && isActive
                        ? "rgba(29,78,216,0.06)"
                        : pinging
                          ? "rgba(251,191,36,0.06)"
                          : "transparent",
                      borderLeft: isSelected
                        ? "3px solid #1d4ed8"
                        : "3px solid transparent",
                      transition:"all 0.12s ease",
                      userSelect:"none",
                    }}>

                    {/* Lotus */}
                    <span style={{
                      fontSize:13, flexShrink:0, lineHeight:1,
                      filter: isActive
                        ? "drop-shadow(0 0 4px rgba(255,150,180,0.7))"
                        : "saturate(0) brightness(1.4) opacity(0.25)",
                      transition:"filter 0.2s",
                    }}>🪷</span>

                    {/* Name */}
                    <span style={{
                      flex:1,
                      fontFamily:"'Lato',sans-serif",
                      fontSize:13,
                      fontWeight: isSelected ? 800 : isActive ? 600 : 400,
                      color: isActive
                        ? (isSelected ? "#1d4ed8" : "#1e3a8a")
                        : "rgba(150,163,175,0.75)",
                      whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                      letterSpacing:"0.1px",
                      textAlign:"left",
                    }}>
                      {hilite(displayName)}
                    </span>

                    {/* Right side */}
                    {isSelected ? (
                      <span style={{
                        fontSize:11, color:"#1d4ed8", fontWeight:900, flexShrink:0,
                        background:"rgba(29,78,216,0.08)", borderRadius:20, padding:"2px 9px",
                      }}>✓</span>
                    ) : !isActive ? (
                      <span style={{
                        fontSize:9, fontWeight:700, letterSpacing:"0.5px",
                        color:"rgba(180,190,200,0.7)",
                        textTransform:"uppercase", flexShrink:0,
                      }}>Soon</span>
                    ) : (
                      <span style={{ color:"rgba(29,78,216,0.2)", fontSize:14, flexShrink:0 }}>›</span>
                    )}

                    {/* Coming soon tap feedback */}
                    {pinging && (
                      <div style={{
                        position:"absolute", left:0, right:0,
                        fontSize:10, color:"rgba(180,83,9,0.8)", fontWeight:700,
                        textAlign:"center", animation:"fadeIn 0.2s ease",
                        pointerEvents:"none",
                      }}>
                        🔔 Coming soon!
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding:"8px 14px",
            borderTop:"1px solid rgba(59,130,246,0.08)",
            background:"rgba(239,246,255,0.5)",
            display:"flex", justifyContent:"space-between", alignItems:"center",
          }}>
            <span style={{ fontSize:10, color:"rgba(29,78,216,0.3)", fontStyle:"italic" }}>
              ↑↓ navigate · Enter select · Esc close
            </span>
            <span style={{ fontSize:10, color:"rgba(29,78,216,0.35)", fontWeight:700 }}>
              🙏 Bangalore
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dropDown {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}


// ============================================================
//  WELCOME SCREEN — DROPDOWN SUK SELECTOR
// ============================================================

export default SUKSearchDropdown
