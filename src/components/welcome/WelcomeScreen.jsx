import React from 'react'
import { SUK_CONFIG, sukLabel } from '../../config/sukConfig.js'
import SUKSearchDropdown from './SUKSearchDropdown.jsx'

function WelcomeScreen({ onSelect, currentUser, onSignOut }) {
  const [selected, setSelected] = React.useState("");
  const [launching, setLaunching] = React.useState(false);

  const activeSuk  = selected ? SUK_CONFIG[selected] : null;
  const canLaunch  = activeSuk && activeSuk.configured;

  const handleLaunch = () => {
    if (!canLaunch) return;
    setLaunching(true);
    setTimeout(() => onSelect(activeSuk), 520);
  };

  return (
    <div style={{
      minHeight:"100vh", display:"flex", flexDirection:"column", position:"relative",
      alignItems:"center", justifyContent:"center",
      padding:"32px 16px", position:"relative", zIndex:10,
    }}>

      {/* Lotus */}
      <span style={{ fontSize:36, display:"inline-block", marginBottom:10,
        filter:"drop-shadow(0 0 18px rgba(255,180,0,0.6))",
        animation:"floatEmoji 3s ease-in-out infinite alternate" }}>🪷</span>

      {/* JAYGURU title */}
      <div style={{ fontFamily:"'Cinzel',serif", fontWeight:900,
        fontSize:"clamp(30px,8vw,50px)", letterSpacing:"8px", textAlign:"center",
        background:"linear-gradient(135deg,#1e3a8a 0%,#2563eb 50%,#d97706 100%)",
        WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
        JAYGURU
      </div>
      <div style={{ fontFamily:"'Cinzel',serif", fontSize:11, fontWeight:700,
        letterSpacing:"5px", color:"rgba(29,78,216,0.45)",
        textTransform:"uppercase", marginTop:4, textAlign:"center" }}>
        🙏 Satsang Upayojana Kendra 🙏
      </div>

      {/* Ornamental divider */}
      <div style={{ display:"flex", alignItems:"center", gap:10,
        margin:"18px 0 24px", width:"100%", maxWidth:400 }}>
        <div style={{ flex:1, height:1,
          background:"linear-gradient(90deg,transparent,rgba(255,200,60,0.45),rgba(59,130,246,0.3))" }}/>
        <span style={{ fontSize:14, color:"rgba(255,180,0,0.7)" }}>✦</span>
        <div style={{ flex:1, height:1,
          background:"linear-gradient(90deg,rgba(59,130,246,0.3),rgba(255,200,60,0.45),transparent)" }}/>
      </div>

      {/* ── DROPDOWN CARD ── */}
      <div style={{ width:"100%", maxWidth:400,
        background:"rgba(255,255,255,0.82)", borderRadius:22,
        padding:"28px 24px 24px",
        boxShadow:"0 8px 40px rgba(29,78,216,0.13), 0 2px 8px rgba(0,0,0,0.05)",
        border:"1.5px solid rgba(59,130,246,0.14)",
        backdropFilter:"blur(14px)",
        animation:"fadeSlideIn 0.5s ease-out both" }}>

        {/* Label */}
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:12, fontWeight:800,
          color:"rgba(29,78,216,0.55)", letterSpacing:"2.5px",
          textTransform:"uppercase", marginBottom:10 }}>
          Select Your Satsang Upayojana Kendra
        </div>

        {/* ── Beautiful Searchable Dropdown ── */}
        <SUKSearchDropdown selected={selected} onSelect={setSelected} />

        {/* Feature preview — shown after selection */}
        {activeSuk && activeSuk.configured && (() => {
          const tc = activeSuk.themeColor || '#1d4ed8';
          return (
          <div style={{ marginTop:16, padding:"14px 16px", borderRadius:14,
            background:`linear-gradient(135deg,${tc}0a,${tc}05)`,
            border:`1px solid ${tc}20`,
            animation:"fadeSlideIn 0.3s ease-out both" }}>

            {/* SUK header */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <div style={{ fontSize:24,
                filter:`drop-shadow(0 0 8px ${tc}60)` }}>
                {activeSuk.emoji}
              </div>
              <div>
                <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800,
                  fontSize:14, color:"#1e3a8a" }}>{sukLabel(activeSuk)}</div>
                <div style={{ fontSize:11, color:"rgba(29,78,216,0.45)",
                  fontWeight:600 }}>{activeSuk.location ? `📍 ${activeSuk.location}` : ""}</div>
              </div>
            </div>

          </div>
          );
        })()}

        {/* Launch button */}
        <button
          onClick={handleLaunch}
          disabled={!canLaunch || launching}
          style={{
            width:"100%", marginTop:18,
            padding:"15px", borderRadius:13, border:"none",
            fontFamily:"'Cinzel',serif", fontWeight:800,
            fontSize:15, letterSpacing:"1px",
            cursor: canLaunch ? "pointer" : "not-allowed",
            transition:"all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
            transform: (canLaunch && !launching) ? "scale(1)" : "scale(0.98)",
            background: canLaunch
              ? `linear-gradient(135deg,#0f2266,#1d4ed8,#3b82f6)`
              : "rgba(200,210,230,0.5)",
            color: canLaunch ? "#fff" : "#aaa",
            boxShadow: canLaunch ? "0 6px 24px rgba(29,78,216,0.3)" : "none",
          }}>
          {launching
            ? `${activeSuk.emoji || '🪷'}  Entering ${sukLabel(activeSuk)}...`
            : canLaunch
              ? `${activeSuk.emoji || '🪷'}  Open ${sukLabel(activeSuk)}`
              : "Select a Kendra to continue"}
        </button>

      </div>

      {/* Bottom tagline */}
      <div style={{ marginTop:24, textAlign:"center" }}>
        <div style={{ fontSize:10, color:"rgba(29,78,216,0.28)", fontWeight:600,
          letterSpacing:"2px", textTransform:"uppercase" }}>
          Book · Satsang · Photos · Manage
        </div>
        <div style={{ fontSize:11, color:"rgba(29,78,216,0.2)", marginTop:5,
          fontFamily:"'Cinzel',serif" }}>
          Jayguru 🙏
        </div>
      </div>

    </div>
  );
}


// ============================================================
//  APP SHELL — manages SUK selection + renders App
// ============================================================

export default WelcomeScreen
