// ============================================================
//  features/manage.js
//  React components:
//    • RetrieveBookingTab   — lookup + share + cancel by mobile
//    • PrayerTimesTab       — annual prayer timetable
// ============================================================

"use strict";

const { createElement: h, useState } = React;

// ════════════════════════════════════════════════════════════
//  RETRIEVE BOOKING TAB
// ════════════════════════════════════════════════════════════
window.RetrieveBookingTab = function RetrieveBookingTab({ api, sukKey }) {
  const [mobile,    setMobile]    = useState("");
  const [results,   setResults]   = useState(null);
  const [msg,       setMsg]       = useState("");
  const [cancelling,setCancelling]= useState(null);
  const [editingAddress, setEditingAddress] = useState(null);
  const [editAddressVal, setEditAddressVal] = useState("");
  const [savingAddress,  setSavingAddress]  = useState(false);
  const [addressMsg,     setAddressMsg]     = useState({});

  const [searching, setSearching] = useState(false);

  const handleLookup = async () => {
    setMsg(""); setResults(null);
    if (!/^[0-9]{10}$/.test(mobile.trim())) {
      setMsg("⚠️ Please enter a valid 10-digit mobile number."); return;
    }
    setSearching(true);
    try {
      const r = await api.prayer.retrieve(mobile.trim());
      const combined = (r.data || []).sort((a,b) => (b.date||"").localeCompare(a.date||""));
      if (combined.length === 0) {
        setMsg("❌ No bookings found for this mobile number."); setResults([]);
      } else { setResults(combined); }
    } catch { setMsg("❌ Network error. Please try again."); }
    setSearching(false);
  };

  const handleCancelPrayer = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    setCancelling(id);
    try {
      const b = results.find(x => x.id === id);
      const r = await api.prayer.cancel(id, mobile.trim(), b?.date);
      if (r.success) {
        setMsg("✅ Booking cancelled.");
        setResults(prev => Array.isArray(prev) ? prev.filter(b => b.id!==id) : prev);
      } else { setMsg("❌ " + (r.message||"Could not cancel.")); }
    } catch(e) { setMsg("❌ Network error."); }
    setCancelling(null);
  };

  const handleCancelSatsang = async (id) => {
    if (!window.confirm("Cancel this Satsang?")) return;
    setCancelling(id);
    try {
      const b = results.find(x => x.id === id);
      const r = await api.satsang.cancel(id, mobile.trim(), b?.date);
      if (r.success) {
        setMsg("✅ Satsang cancelled.");
        setResults(prev => Array.isArray(prev) ? prev.filter(b => b.id!==id) : prev);
      } else { setMsg("❌ " + (r.message||"Could not cancel.")); }
    } catch(e) { setMsg("❌ Network error."); }
    setCancelling(null);
  };

  const handleUpdateAddress = async (id, newAddress) => {
    setSavingAddress(true);
    try {
      const r = await api.prayer.book({ action:"updateAddress", id, place:newAddress });
      if (r.success) {
        setResults(prev => prev.map(b => b.id===id ? { ...b, place:newAddress } : b));
        setAddressMsg(prev => ({ ...prev, [id]:"✅ Address updated!" }));
        setEditingAddress(null);
        setTimeout(() => setAddressMsg(prev => { const n={...prev}; delete n[id]; return n; }), 3000);
      } else { setAddressMsg(prev => ({ ...prev, [id]:"❌ " + r.message })); }
    } catch(e) { setAddressMsg(prev => ({ ...prev, [id]:"❌ Network error." })); }
    setSavingAddress(false);
  };

  return h("div", { className:"card" },
    h("div", { style:{ textAlign:"center", marginBottom:20 } },
      h("div", { style:{ fontFamily:"'Cinzel',serif", color:"#1e3a8a", fontSize:17, fontWeight:700 } },
        "Retrieve Booking Details"),
      h("div", { style:{ color:"rgba(29,78,216,0.6)", fontSize:12, marginTop:4 } },
        "Enter your mobile number to find and share your booking"),
      h("div", { className:"blue-line", style:{ marginTop:10 } })
    ),

    h("div", { style:{ display:"flex", gap:8 } },
      h("input", { className:"divine-input", placeholder:"Enter 10-digit mobile number",
        type:"tel", maxLength:"10", value:mobile,
        onChange:e=>{ setMsg(""); setResults(null); setMobile(e.target.value.replace(/[^0-9]/g,"")); },
        style:{ flex:1 } }),
      h("button", { onClick:handleLookup, disabled:searching,
        style:{ padding:"12px 16px", border:"none", borderRadius:10,
          background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",
          color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer",
          whiteSpace:"nowrap", flexShrink:0,
          boxShadow:"0 3px 10px rgba(29,78,216,0.3)" } }, "🔍 Find")
    ),

    msg && h("div", { style:{ marginTop:12, padding:"10px 14px", borderRadius:9, fontSize:13,
      background:msg.startsWith("⚠️")?"#fef3c7":"#fee2e2",
      border:`1px solid ${msg.startsWith("⚠️")?"#fcd34d":"#fca5a5"}`,
      color:msg.startsWith("⚠️")?"#92400e":"#b91c1c" } }, msg),

    // Results
    results && results.length > 0 && h("div", { style:{ marginTop:18 } },
      h("div", { style:{ fontSize:12, color:"rgba(29,78,216,0.6)", fontWeight:700,
        textTransform:"uppercase", letterSpacing:"1px", marginBottom:12 } },
        `${results.length} Booking${results.length>1?"s":""} Found`),

      h("div", { style:{ display:"flex", flexDirection:"column", gap:14 } },
        results.map(b => {
          const isSatsang = b._type === "satsang";

          if (!isSatsang) {
            // Prayer card
            const sc = window.SLOT_STYLE[b.time] || window.SLOT_STYLE["Morning"];
            const shareConf = { ...b, prayerTime:window.cleanTime(b.prayerTime) };
            return h("div", { key:b.id, style:{ border:"1.5px solid rgba(59,130,246,0.2)",
              borderRadius:16, overflow:"hidden", background:"rgba(239,246,255,0.5)" } },
              h("div", { style:{ height:4, background:"linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)" } }),
              h("div", { style:{ padding:"14px 16px" } },
                h("div", { style:{ marginBottom:10 } },
                  h("span", { style:{ fontSize:10, fontWeight:800, color:"#1d4ed8",
                    background:"rgba(29,78,216,0.1)", padding:"3px 9px", borderRadius:20,
                    letterSpacing:"1px", textTransform:"uppercase" } }, "🌅 Prayer Booking")),
                h("div", { style:{ fontFamily:"'Cinzel',serif", fontWeight:800, color:"#1e3a8a", fontSize:14, marginBottom:4 } }, b.name),
                h("div", { style:{ fontSize:13, color:sc.color, fontWeight:700 } },
                  `${sc.icon} ${b.time} Prayer · ${window.formatDateWithDay(b.date)}`),
                h("div", { style:{ fontSize:12, color:"#6b7280", marginTop:3 } },
                  `🕐 ${window.cleanTime(b.prayerTime)}${b.place&&!b.place.startsWith("http")?" · "+b.place:""}`),

                // Address edit section
                h("div", { style:{ margin:"10px 0 0", padding:"10px 12px", borderRadius:10,
                  background:"rgba(239,246,255,0.8)", border:"1px solid rgba(59,130,246,0.15)" } },
                  h("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 } },
                    h("span", { style:{ fontSize:11, fontWeight:700, color:"rgba(29,78,216,0.6)",
                      textTransform:"uppercase", letterSpacing:"1px" } }, "📍 Address"),
                    editingAddress!==b.id && h("button", {
                      onClick:()=>{ setEditingAddress(b.id); setEditAddressVal(b.place||""); },
                      style:{ fontSize:11, fontWeight:700, color:"#1d4ed8", background:"none",
                        border:"1px solid rgba(29,78,216,0.3)", borderRadius:6, padding:"3px 8px", cursor:"pointer" } }, "✏️ Edit")
                  ),
                  editingAddress!==b.id && h("div", { style:{ fontSize:12, color:"#374151" } },
                    b.place && b.place.startsWith("http")
                      ? h("a", { href:b.place, target:"_blank", rel:"noopener noreferrer",
                          style:{ color:"#1d4ed8", fontWeight:600, textDecoration:"none" } }, "📍 View on Map")
                      : (b.place || h("span", { style:{ color:"#9ca3af", fontStyle:"italic" } }, "No address set"))
                  ),
                  editingAddress===b.id && h("div", { style:{ display:"flex", flexDirection:"column", gap:8, marginTop:4 } },
                    h("input", { className:"divine-input", placeholder:"Address or Google Maps link",
                      value:editAddressVal, autoFocus:true,
                      onChange:e=>setEditAddressVal(e.target.value),
                      style:{ fontSize:12, padding:"9px 12px" } }),
                    h("div", { style:{ display:"flex", gap:8 } },
                      h("button", { disabled:savingAddress||!editAddressVal.trim(),
                        onClick:()=>handleUpdateAddress(b.id, editAddressVal.trim()),
                        style:{ flex:1, padding:"9px", border:"none", borderRadius:8,
                          background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",
                          color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer",
                          opacity:(savingAddress||!editAddressVal.trim())?0.6:1 } },
                        savingAddress?"⏳ Saving...":"✅ Save"),
                      h("button", { onClick:()=>setEditingAddress(null),
                        style:{ padding:"9px 14px", border:"1px solid rgba(30,64,175,0.2)",
                          borderRadius:8, background:"#fff", color:"#6b7280",
                          fontWeight:600, fontSize:12, cursor:"pointer" } }, "Cancel")
                    )
                  ),
                  addressMsg[b.id] && h("div", { style:{ marginTop:6, fontSize:12, fontWeight:600,
                    color:addressMsg[b.id].startsWith("✅")?"#065f46":"#b91c1c" } }, addressMsg[b.id])
                ),

                h("div", { style:{ height:1, background:"rgba(59,130,246,0.12)", margin:"12px 0 10px" } }),

                // Share
                h("div", { style:{ fontSize:11, fontWeight:700, color:"rgba(29,78,216,0.5)",
                  textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 } }, "📤 Share Booking"),
                h("div", { style:{ display:"flex", flexDirection:"column", gap:7 } },
                  h("a", { href:`https://wa.me/?text=${window.buildShareMsg(shareConf)}`,
                    target:"_blank", rel:"noopener noreferrer",
                    style:{ display:"flex", alignItems:"center", justifyContent:"center",
                      gap:8, padding:"11px", borderRadius:10, textDecoration:"none",
                      background:"linear-gradient(135deg,#25D366,#128C7E)",
                      color:"#fff", fontWeight:800, fontSize:13 } }, "💬 Share on WhatsApp"),
                  h("a", { href:`sms:${b.mobile}?body=${window.buildShareMsg(shareConf)}`,
                    style:{ display:"flex", alignItems:"center", justifyContent:"center",
                      gap:8, padding:"11px", borderRadius:10, textDecoration:"none",
                      background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",
                      color:"#fff", fontWeight:800, fontSize:13 } }, "📱 Send as SMS"),
                  h("button", { onClick:()=>window.handleCopy(shareConf),
                    style:{ display:"flex", alignItems:"center", justifyContent:"center",
                      gap:8, padding:"11px", borderRadius:10, border:"none",
                      background:"rgba(30,64,175,0.08)", cursor:"pointer",
                      color:"#1e3a8a", fontWeight:700, fontSize:13 } }, "📋 Copy Message")
                ),

                h("div", { style:{ marginTop:10 } },
                  h("button", { disabled:cancelling===b.id, onClick:()=>handleCancelPrayer(b.id),
                    style:{ width:"100%", padding:"10px", border:"1px solid rgba(220,38,38,0.3)",
                      borderRadius:10, background:"rgba(254,242,242,0.8)",
                      color:"#b91c1c", fontWeight:700, fontSize:12, cursor:"pointer",
                      opacity:cancelling===b.id?0.6:1 } },
                    cancelling===b.id?"⏳ Cancelling...":"❌ Cancel This Booking")
                )
              )
            );
          }

          // Satsang card
          return h("div", { key:b.id, style:{ border:"1.5px solid rgba(217,119,6,0.25)",
            borderRadius:16, overflow:"hidden", background:"rgba(255,251,235,0.6)" } },
            h("div", { style:{ height:4, background:"linear-gradient(90deg,#78350f,#d97706,#fbbf24)" } }),
            h("div", { style:{ padding:"14px 16px" } },
              h("div", { style:{ marginBottom:10 } },
                h("span", { style:{ fontSize:10, fontWeight:800, color:"#92400e",
                  background:"rgba(217,119,6,0.12)", padding:"3px 9px", borderRadius:20,
                  letterSpacing:"1px", textTransform:"uppercase" } }, "🪔 Satsang Booking")),
              h("div", { style:{ fontFamily:"'Cinzel',serif", fontWeight:800, color:"#78350f", fontSize:14, marginBottom:4 } }, b.name),
              h("div", { style:{ fontSize:13, color:"#d97706", fontWeight:700 } },
                `📅 ${b.day?b.day+", ":""}${window.formatDate(b.date)}`),
              h("div", { style:{ fontSize:12, color:"#6b7280", marginTop:3 } },
                `⏰ ${window.cleanTime(b.time)} onwards${b.venue?" · 📍 "+b.venue:""}`),
              b.mapsLink && h("a", { href:b.mapsLink, target:"_blank", rel:"noopener noreferrer",
                style:{ fontSize:12, color:"#d97706", fontWeight:600, textDecoration:"none", display:"block", marginTop:3 } },
                "🗺️ View on Map"),
              b.hostedBy && h("div", { style:{ fontSize:12, color:"#92400e", marginTop:3, fontWeight:600 } }, `🙏 ${b.hostedBy}`),

              h("div", { style:{ height:1, background:"rgba(217,119,6,0.15)", margin:"12px 0 10px" } }),

              h("div", { style:{ fontSize:11, fontWeight:700, color:"rgba(120,53,15,0.6)",
                textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 } }, "📤 Share Satsang"),
              h("div", { style:{ display:"flex", flexDirection:"column", gap:7 } },
                h("a", { href:`https://wa.me/?text=${window.buildSatsangShareMsg(b)}`,
                  target:"_blank", rel:"noopener noreferrer",
                  style:{ display:"flex", alignItems:"center", justifyContent:"center",
                    gap:8, padding:"11px", borderRadius:10, textDecoration:"none",
                    background:"linear-gradient(135deg,#25D366,#128C7E)",
                    color:"#fff", fontWeight:800, fontSize:13 } }, "💬 Share on WhatsApp"),
                h("a", { href:`sms:?body=${window.buildSatsangShareMsg(b)}`,
                  style:{ display:"flex", alignItems:"center", justifyContent:"center",
                    gap:8, padding:"11px", borderRadius:10, textDecoration:"none",
                    background:"linear-gradient(135deg,#d97706,#fbbf24)",
                    color:"#fff", fontWeight:800, fontSize:13 } }, "📱 Send as SMS"),
                h("button", { onClick:()=>window.handleSatsangCopy(b),
                  style:{ display:"flex", alignItems:"center", justifyContent:"center",
                    gap:8, padding:"11px", borderRadius:10, border:"none",
                    background:"rgba(120,53,15,0.08)", cursor:"pointer",
                    color:"#78350f", fontWeight:700, fontSize:13 } }, "📋 Copy Message")
              ),

              h("div", { style:{ marginTop:10 } },
                h("button", { disabled:cancelling===b.id, onClick:()=>handleCancelSatsang(b.id),
                  style:{ width:"100%", padding:"10px", border:"1px solid rgba(217,119,6,0.3)",
                    borderRadius:10, background:"rgba(255,251,235,0.9)",
                    color:"#92400e", fontWeight:700, fontSize:12, cursor:"pointer",
                    opacity:cancelling===b.id?0.6:1 } },
                  cancelling===b.id?"⏳ Cancelling...":"❌ Cancel This Satsang")
              )
            )
          );
        })
      )
    ),

    results && results.length===0 && !msg && h("div", { style:{ textAlign:"center",
      padding:"24px 0", color:"rgba(29,78,216,0.4)", fontSize:13 } },
      "No bookings found for this number.")
  );
};

// ════════════════════════════════════════════════════════════
//  PRAYER TIMES TAB
// ════════════════════════════════════════════════════════════
window.PrayerTimesTab = function PrayerTimesTab() {
  const currentMonth = new Date().getMonth() + 1;
  const pt           = window.PRAYER_TIMES[currentMonth];

  return h("div", { className:"card" },
    h("div", { style:{ textAlign:"center", marginBottom:20 } },
      h("div", { style:{ fontFamily:"'Cinzel',serif", color:"#1e3a8a", fontSize:17, fontWeight:700 } },
        "Bangalore Urban, Karnataka"),
      h("div", { style:{ color:"rgba(29,78,216,0.6)", fontSize:11, marginTop:4, letterSpacing:"1px" } },
        "Annual Prayer Timetable · satsang.org.in"),
      h("div", { className:"blue-line" })
    ),

    // Current month highlight
    h("div", { style:{ background:"#eff6ff", border:"1px solid rgba(59,130,246,0.3)",
      borderRadius:16, padding:"20px", marginBottom:20, textAlign:"center" } },
      h("div", { style:{ color:"rgba(29,78,216,0.6)", fontSize:11, fontWeight:700,
        textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:14 } },
        `⭐ ${window.MONTH_NAMES[currentMonth]} — Current Month`),
      h("div", { style:{ display:"flex", justifyContent:"center", gap:32 } },
        h("div", null,
          h("div", { style:{ fontSize:12, color:"#d97706", fontWeight:700, marginBottom:6 } }, "🌅 Morning"),
          h("div", { style:{ fontFamily:"'Cinzel',serif", fontSize:28, fontWeight:900, color:"#d97706" } }, pt.Morning)
        ),
        h("div", { style:{ width:1, background:"rgba(59,130,246,0.2)" } }),
        h("div", null,
          h("div", { style:{ fontSize:12, color:"#7c3aed", fontWeight:700, marginBottom:6 } }, "🌙 Evening"),
          h("div", { style:{ fontFamily:"'Cinzel',serif", fontSize:28, fontWeight:900, color:"#7c3aed" } }, pt.Evening)
        )
      )
    ),

    // Full year table
    h("div", { style:{ borderRadius:12, overflow:"hidden", border:"1px solid rgba(59,130,246,0.15)" } },
      h("div", { style:{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
        background:"rgba(29,78,216,0.9)", padding:"10px 16px" } },
        h("div", { style:{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.8)", textTransform:"uppercase", letterSpacing:"1px" } }, "Month"),
        h("div", { style:{ fontSize:10, fontWeight:700, color:"#fde68a", textTransform:"uppercase", letterSpacing:"1px", textAlign:"center" } }, "🌅 Morning"),
        h("div", { style:{ fontSize:10, fontWeight:700, color:"#c4b5fd", textTransform:"uppercase", letterSpacing:"1px", textAlign:"center" } }, "🌙 Evening")
      ),
      Object.entries(window.PRAYER_TIMES).map(([month, times]) => {
        const isCurrent = parseInt(month) === currentMonth;
        return h("div", {
          key: month,
          style:{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
            padding:"11px 16px",
            background:isCurrent?"#dbeafe":parseInt(month)%2===0?"#f8faff":"#fff",
            borderBottom:"1px solid rgba(59,130,246,0.08)" },
        },
          h("div", { style:{ fontSize:13, fontWeight:isCurrent?800:500, color:isCurrent?"#1d4ed8":"#6b7280" } },
            `${isCurrent?"⭐ ":""}${window.MONTH_NAMES[month]}`),
          h("div", { style:{ fontSize:14, fontWeight:700, color:"#d97706", textAlign:"center" } }, times.Morning),
          h("div", { style:{ fontSize:14, fontWeight:700, color:"#7c3aed", textAlign:"center" } }, times.Evening)
        );
      })
    ),

    h("p", { style:{ fontSize:11, color:"rgba(59,130,246,0.4)", marginTop:14, textAlign:"center", lineHeight:1.6 } },
      "Fixed monthly times · Same every year · Source: satsang.org.in")
  );
};
