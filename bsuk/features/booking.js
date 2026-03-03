// ============================================================
//  features/booking.js
//  React component: PrayerBookingTab
//  Handles prayer slot booking + inline cancel section.
//  Props: { sukKey, api, calendar, onBooked, feat }
//  FIX: Removed duplicate onClick argument on cancel satsang btn
// ============================================================

"use strict";

const { createElement: h, useState, useCallback } = React;

window.PrayerBookingTab = function PrayerBookingTab({ api, calendar, onBooked, feat }) {
  const [form,          setForm]          = useState({ name:"", mobile:"", place:"", time:"", date:"" });
  const [error,         setError]         = useState("");
  const [shake,         setShake]         = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [showCancel,    setShowCancel]    = useState(false);
  const [cancelMobile,  setCancelMobile]  = useState("");
  const [cancelResults, setCancelResults] = useState(null);
  const [cancelMsg,     setCancelMsg]     = useState("");
  const [cancelling,    setCancelling]    = useState(null);

  const triggerError = (msg) => {
    setError(msg); setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const isSlotTaken    = (date, time) => (calendar||[]).some(b => b.date === date && b.time === time && b.isBooked);
  const getSlotBooking = (date, time) => (calendar||[]).find(b => b.date === date && b.time === time && b.isBooked);
  const prayerTimes    = window.getPrayerTimes(form.date);

  const handleSlotSelect = (time) => {
    if (form.date && isSlotTaken(form.date, time)) {
      const ex = getSlotBooking(form.date, time);
      triggerError(`🚫 "${time} Prayer" on ${window.formatDate(form.date)} is already booked by ${ex.name}.\n\nPlease choose a different date or slot.`);
      return;
    }
    setError("");
    setForm(f => ({ ...f, time }));
  };

  const handleBook = async () => {
    setError("");
    const { name, mobile, place, time, date } = form;
    if (!name.trim())                         { triggerError("⚠️ Please enter the person's name."); return; }
    if (!mobile.trim())                       { triggerError("⚠️ Please enter the mobile number."); return; }
    if (!/^[0-9]{10}$/.test(mobile.trim()))   { triggerError("⚠️ Please enter a valid 10-digit mobile number."); return; }
    if (!place.trim())                        { triggerError("⚠️ Please enter your location name."); return; }
    if (!date)                                { triggerError("⚠️ Please select a date."); return; }
    if (date < window.getTodayStr())          { triggerError("⚠️ You cannot book a past date. Please select today or a future date."); return; }
    if (!time)                                { triggerError("⚠️ Please select Morning or Evening slot."); return; }
    if (isSlotTaken(date, time)) {
      const ex = getSlotBooking(date, time);
      triggerError(`🚫 "${time} Prayer" on ${window.formatDate(date)} is already booked by ${ex.name}.\n\nPlease choose a different date or slot.`);
      return;
    }
    const day        = window.getDayName(date);
    const pt         = window.getPrayerTimes(date);
    const prayerTime = pt ? pt[time] : "";

    setSubmitting(true);
    try {
      const result = await api.prayer.book({ action:"add", name, mobile, place, day, time, date, prayerTime });
      if (result.success) {
        // FIX: pass full confirmation object to onBooked so modal shows
        onBooked({ name, mobile, time, date, prayerTime, id: result.id, place });
        setForm({ name:"", mobile:"", place:"", time:"", date:"" });
      } else { triggerError(result.message); }
    } catch(e) { triggerError("⚠️ Network error. Please try again."); }
    setSubmitting(false);
  };

  // ── Cancel flow ──────────────────────────────────────────
  const handleCancelLookup = async () => {
    setCancelMsg(""); setCancelResults(null);
    if (!/^[0-9]{10}$/.test(cancelMobile.trim())) {
      setCancelMsg("⚠️ Please enter a valid 10-digit mobile number."); return;
    }
    const mob = cancelMobile.trim();
    setCancelling("lookup");
    try {
      const r = await api.prayer.retrieve(mob);
      const combined = (r.data || []).sort((a,b) => (b.date||"").localeCompare(a.date||""));
      if (combined.length === 0) {
        setCancelMsg("❌ No bookings found for this mobile number."); setCancelResults([]);
      } else { setCancelResults(combined); }
    } catch { setCancelMsg("❌ Network error. Please try again."); }
    setCancelling(null);
  };

  const handleCancelBooking = async (id, date) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    setCancelling(id);
    try {
      const result = await api.prayer.cancel(id, cancelMobile.trim(), date);
      if (result.success) {
        setCancelMsg("✅ Booking cancelled successfully.");
        setCancelResults(prev => Array.isArray(prev) ? prev.filter(b => b.id !== id) : prev);
        onBooked(null);
      } else { setCancelMsg("❌ Could not cancel. Please try again."); }
    } catch(e) { setCancelMsg("❌ Network error."); }
    setCancelling(null);
  };

  // FIX: removed the duplicate {onClick:...} object that was passed as 4th arg to h()
  const handleCancelSatsang = async (id, date) => {
    if (!window.confirm("Are you sure you want to cancel this Satsang booking?")) return;
    setCancelling(id);
    try {
      const result = await api.satsang.cancel(id, cancelMobile.trim(), date);
      if (result.success) {
        setCancelMsg("✅ Satsang cancelled successfully.");
        setCancelResults(prev => Array.isArray(prev) ? prev.filter(b => b.id !== id) : prev);
        onBooked(null);
      } else { setCancelMsg("❌ Could not cancel: " + (result.message||"Please try again.")); }
    } catch(e) { setCancelMsg("❌ Network error."); }
    setCancelling(null);
  };

  // ── Date chips (next 14 days) ────────────────────────────
  const renderDateChips = () => {
    const today = new Date(); today.setHours(0,0,0,0);
    const chips = [];
    for (let i = 0; i < 14; i++) {
      const d       = new Date(today); d.setDate(today.getDate() + i);
      const y       = d.getFullYear();
      const mo      = String(d.getMonth()+1).padStart(2,"0");
      const dd      = String(d.getDate()).padStart(2,"0");
      const dateStr = `${y}-${mo}-${dd}`;
      const mTaken  = isSlotTaken(dateStr,"Morning");
      const eTaken  = isSlotTaken(dateStr,"Evening");
      const both    = mTaken && eTaken;
      const sel     = form.date === dateStr;

      chips.push(
        h("button", {
          key: dateStr,
          onClick: () => { setError(""); setForm(f => ({ ...f, date:dateStr, time:"" })); },
          disabled: both,
          style:{
            display:"flex", flexDirection:"column", alignItems:"center",
            padding:"8px 6px", borderRadius:12, flexShrink:0,
            border:`2px solid ${sel?"#1d4ed8":both?"#fca5a5":mTaken||eTaken?"#fcd34d":"rgba(59,130,246,0.18)"}`,
            background:sel?"#1d4ed8":both?"#fee2e2":mTaken||eTaken?"#fef3c7":"#f0f9ff",
            cursor:both?"not-allowed":"pointer", minWidth:48,
            opacity:both?0.6:1, transition:"all 0.15s",
            boxShadow:sel?"0 3px 12px rgba(29,78,216,0.35)":"none",
          },
        },
          h("div", { style:{ fontSize:9, fontWeight:700, textTransform:"uppercase",
            color:sel?"rgba(255,255,255,0.8)":"#6b7280", letterSpacing:"0.5px" } },
            i===0?"Today":["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]
          ),
          h("div", { style:{ fontSize:16, fontWeight:900, marginTop:2, color:sel?"#fff":"#1e3a8a" } }, dd),
          h("div", { style:{ fontSize:8, marginTop:3, fontWeight:800,
            color:sel?"rgba(255,255,255,0.9)":both?"#dc2626":mTaken||eTaken?"#d97706":"#16a34a" } },
            both?"FULL":mTaken||eTaken?"1 LEFT":"FREE"
          ),
          h("div", { style:{ display:"flex", gap:2, marginTop:4 } },
            h("div", { style:{ width:5, height:5, borderRadius:"50%", background:mTaken?"#ef4444":"#22c55e" } }),
            h("div", { style:{ width:5, height:5, borderRadius:"50%", background:eTaken?"#ef4444":"#22c55e" } })
          )
        )
      );
    }
    return h("div", { style:{ display:"flex", alignItems:"center", gap:6 } },
      h("button", {
        onClick: () => { const el=document.getElementById("dateChipScroll"); if(el) el.scrollBy({left:-160,behavior:"smooth"}); },
        style:{ flexShrink:0, width:32, height:32, borderRadius:"50%", border:"none",
          background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"#fff",
          fontSize:18, cursor:"pointer", fontWeight:900, lineHeight:1 },
      }, "‹"),
      h("div", { id:"dateChipScroll", style:{ display:"flex", gap:6, overflowX:"auto", flex:1,
        paddingBottom:6, scrollbarWidth:"none" } }, ...chips),
      h("button", {
        onClick: () => { const el=document.getElementById("dateChipScroll"); if(el) el.scrollBy({left:160,behavior:"smooth"}); },
        style:{ flexShrink:0, width:32, height:32, borderRadius:"50%", border:"none",
          background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"#fff",
          fontSize:18, cursor:"pointer", fontWeight:900, lineHeight:1 },
      }, "›")
    );
  };

  // ── Slot selector ────────────────────────────────────────
  const renderSlots = () => {
    if (!form.date) return h("div", {
      style:{ textAlign:"center", padding:"12px 0", color:"rgba(29,78,216,0.6)", fontSize:13 },
    }, "☝️ Select a date to continue");

    const pt = window.getPrayerTimes(form.date);
    return h("div", { className:"fade-in" },
      h("label", { className:"divine-label" }, "🌅 Prayer Slot"),
      h("div", { style:{ display:"flex", gap:12 } },
        ["Morning","Evening"].map(t => {
          const c      = window.SLOT_STYLE[t];
          const taken  = isSlotTaken(form.date, t);
          const sel    = form.time === t;
          const booker = taken ? getSlotBooking(form.date, t) : null;
          return h("button", {
            key: t,
            className: "slot-btn",
            onClick: () => handleSlotSelect(t),
            disabled: taken,
            style:{
              borderColor: taken?"#fca5a5":sel?c.color:"rgba(59,130,246,0.25)",
              background:  taken?"#fee2e2":sel?c.bg:"rgba(239,246,255,0.5)",
              color: taken?"#dc2626":sel?c.color:"#374151",
              opacity: taken?0.7:1,
            },
          },
            sel && !taken && h("div", { style:{ position:"absolute", top:8, right:8, width:20, height:20,
              borderRadius:"50%", background:c.color, display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:11, fontWeight:900, color:"#fff" } }, "✓"),
            h("div", { style:{ fontSize:28, marginBottom:8 } }, c.icon),
            h("div", { style:{ fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:13 } }, `${t} Prayer`),
            pt && !taken && h("div", { style:{ fontSize:12, marginTop:6, fontWeight:700, color:c.color } }, pt[t]),
            taken && booker && h("div", { style:{ fontSize:10, marginTop:6, color:"#dc2626", fontWeight:600 } },
              `🚫 Booked by ${booker.name}`),
            h("div", { style:{ fontSize:11, marginTop:8, fontWeight:600,
              color:taken?"#dc2626":sel?"#16a34a":"rgba(30,64,175,0.4)" } },
              taken?"🚫 Already Booked":sel?"✓ Selected":"Tap to select")
          );
        })
      )
    );
  };

  // ── Main render ──────────────────────────────────────────
  return h("div", { style:{ display:"flex", flexDirection:"column", gap:18 } },

    h("div", { style:{ textAlign:"center", marginBottom:4 } },
      h("div", { style:{ fontFamily:"'Cinzel',serif", color:"#1e3a8a", fontSize:16, fontWeight:700 } },
        "Reserve a Prayer Slot"),
      h("div", { className:"blue-line", style:{ marginTop:10 } })
    ),

    h("div", null,
      h("label", { className:"divine-label" }, "👤 Person's Name"),
      h("input", { className:"divine-input", placeholder:"Enter full name", value:form.name,
        onChange: e => { setError(""); setForm(f => ({ ...f, name:e.target.value })); } })
    ),

    h("div", null,
      h("label", { className:"divine-label" }, "📱 Mobile Number"),
      h("input", { className:"divine-input", placeholder:"Enter 10-digit mobile number",
        type:"tel", maxLength:"10", value:form.mobile,
        onChange: e => { setError(""); setForm(f => ({ ...f, mobile:e.target.value.replace(/[^0-9]/g,"") })); } })
    ),

    h("div", null,
      h("label", { className:"divine-label" }, "📍 Location"),
      h("div", { style:{ position:"relative" } },
        h("input", { className:"divine-input",
          placeholder:"Type location name  OR  paste Google Maps link",
          value:form.place,
          onChange: e => { setError(""); setForm(f => ({ ...f, place:e.target.value })); } }),
        (form.place.startsWith("http") || form.place.includes("maps.google") ||
         form.place.includes("goo.gl") || form.place.includes("maps.app")) &&
          h("a", { href:form.place, target:"_blank", rel:"noopener noreferrer",
            style:{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
              background:"#1d4ed8", color:"#fff", borderRadius:6, padding:"3px 8px",
              fontSize:11, fontWeight:700, textDecoration:"none", whiteSpace:"nowrap" } },
            "Open Map ↗")
      )
    ),

    h("div", null,
      h("label", { className:"divine-label" }, "📅 Date (optional — or pick below)"),
      h("input", { type:"date", className:"divine-input", value:form.date, min:window.getTodayStr(),
        style:{ fontSize:13, width:"100%", cursor:"pointer" },
        onChange: e => { setError(""); setForm(f => ({ ...f, date:e.target.value, time:"" })); } }),
      h("div", { style:{ fontSize:10, color:"rgba(29,78,216,0.4)", marginTop:5, paddingLeft:2 } },
        "☝️ Tap a chip below for quick pick, or use the calendar for any future date")
    ),

    renderDateChips(),
    renderSlots(),

    form.date && prayerTimes && form.time && h("div", { className:"fade-in",
      style:{ background:"rgba(239,246,255,0.9)", border:"1px solid rgba(59,130,246,0.25)",
        borderRadius:14, padding:"14px 16px" } },
      h("div", { style:{ fontFamily:"'Cinzel',serif", color:"#1e3a8a", fontSize:13,
        fontWeight:700, marginBottom:10 } }, `🕐 Prayer Times for ${window.formatDateWithDay(form.date)}`),
      h("div", { style:{ display:"flex", gap:12 } },
        ["Morning","Evening"].map(t => {
          const c = window.SLOT_STYLE[t];
          return h("div", { key:t, style:{ flex:1, borderRadius:10, padding:"12px",
            background:c.bg, textAlign:"center" } },
            h("div", { style:{ fontSize:20, marginBottom:4 } }, c.icon),
            h("div", { style:{ fontSize:11, color:c.color, fontWeight:700 } }, t),
            h("div", { style:{ fontSize:14, fontWeight:900, color:c.color, marginTop:4 } }, prayerTimes[t])
          );
        })
      )
    ),

    error && h("div", {
      className: `fade-in${shake?" shake":""}`,
      style:{ padding:"14px 18px", borderRadius:12, fontSize:13, lineHeight:1.7,
        whiteSpace:"pre-line", background:"#fee2e2", border:"1.5px solid #fca5a5", color:"#b91c1c" },
    }, error),

    h("div", { style:{ marginTop:8 } },
      h("button", { className:"submit-btn", onClick:handleBook, disabled:submitting },
        submitting ? "⏳ Saving..." : "🙏  Confirm Booking")
    ),

    // ── Inline Cancel ────────────────────────────────────
    feat && feat.cancelBooking !== false && h("div", { style:{ marginTop:20 } },
      h("button", {
        onClick: () => { setShowCancel(!showCancel); setCancelMsg(""); setCancelResults(null); setCancelMobile(""); },
        style:{ width:"100%", padding:"11px", border:"1px solid rgba(220,38,38,0.3)", borderRadius:11,
          background:showCancel?"#fee2e2":"rgba(254,242,242,0.6)", color:"#b91c1c",
          fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center",
          justifyContent:"center", gap:8, transition:"all 0.2s" },
      }, h("span", null, showCancel?"▲":"▼"), "Need to cancel a booking?"),

      showCancel && h("div", { className:"fade-in",
        style:{ marginTop:12, padding:"18px", borderRadius:14,
          background:"rgba(254,242,242,0.8)", border:"1px solid rgba(220,38,38,0.2)" } },
        h("div", { style:{ fontFamily:"'Cinzel',serif", color:"#991b1b", fontSize:14,
          fontWeight:700, marginBottom:14, textAlign:"center" } }, "Cancel Your Booking"),
        h("label", { className:"divine-label", style:{ color:"rgba(153,27,27,0.7)" } },
          "📱 Mobile Number Used During Booking"),
        h("div", { style:{ display:"flex", gap:8 } },
          h("input", { className:"divine-input", placeholder:"Enter 10-digit number",
            type:"tel", maxLength:"10", value:cancelMobile,
            style:{ borderColor:"rgba(220,38,38,0.3)", background:"#fff" },
            onChange: e => { setCancelMsg(""); setCancelResults(null); setCancelMobile(e.target.value.replace(/[^0-9]/g,"")); } }),
          h("button", { onClick:handleCancelLookup,
            style:{ padding:"12px 16px", border:"none", borderRadius:10,
              background:"#b91c1c", color:"#fff", fontWeight:700, fontSize:13,
              cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 } }, "🔍 Find")
        ),

        cancelMsg && h("div", { style:{ marginTop:10, padding:"10px 14px", borderRadius:9, fontSize:12,
          background:cancelMsg.startsWith("✅")?"#d1fae5":"#fee2e2",
          border:`1px solid ${cancelMsg.startsWith("✅")?"#6ee7b7":"#fca5a5"}`,
          color:cancelMsg.startsWith("✅")?"#065f46":"#b91c1c" } }, cancelMsg),

        cancelResults && cancelResults.length > 0 && h("div", { style:{ marginTop:12, display:"flex", flexDirection:"column", gap:8 } },
          cancelResults.map(b => {
            const isSatsang = b._type === "satsang";
            if (isSatsang) {
              return h("div", { key:b.id, style:{ background:"#fffbeb", borderRadius:12,
                padding:"14px", border:"1px solid rgba(217,119,6,0.25)" } },
                h("div", { style:{ fontFamily:"'Cinzel',serif", fontWeight:800, color:"#78350f", fontSize:13 } }, b.name),
                h("div", { style:{ fontSize:12, color:"#d97706", fontWeight:700, marginTop:2 } },
                  `📅 ${window.formatDateWithDay(b.date)} · ⏰ ${b.time}`),
                b.venue && h("div", { style:{ fontSize:11, color:"#6b7280", marginTop:2 } }, `📍 ${b.venue}`),
                // FIX: removed duplicate onClick as 4th positional argument
                h("button", {
                  disabled: cancelling===b.id,
                  onClick: () => handleCancelSatsang(b.id, b.date),
                  style:{ width:"100%", padding:"9px", border:"none", borderRadius:9, marginTop:10,
                    background:"linear-gradient(135deg,#92400e,#d97706)",
                    color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer",
                    opacity:cancelling===b.id?0.6:1 }
                }, cancelling===b.id?"⏳ Cancelling...":"🗑️  Cancel This Satsang")
              );
            }
            const sc = window.SLOT_STYLE[b.time] || window.SLOT_STYLE["Morning"];
            return h("div", { key:b.id, style:{ background:"#fff", borderRadius:12,
              padding:"14px", border:"1px solid rgba(220,38,38,0.2)" } },
              h("div", { style:{ fontFamily:"'Cinzel',serif", fontWeight:800, color:"#1e3a8a", fontSize:13 } }, b.name),
              h("div", { style:{ fontSize:12, color:sc.color, fontWeight:700, marginTop:2 } },
                `${sc.icon} ${b.time} Prayer · ${window.formatDateWithDay(b.date)}`),
              b.prayerTime && h("div", { style:{ fontSize:11, color:"#6b7280", marginTop:2 } },
                `🕐 ${window.cleanTime(b.prayerTime)}`),
              h("button", {
                disabled: cancelling===b.id,
                onClick: () => handleCancelBooking(b.id, b.date),
                style:{ width:"100%", padding:"9px", border:"none", borderRadius:9, marginTop:10,
                  background:"linear-gradient(135deg,#dc2626,#ef4444)",
                  color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer",
                  opacity:cancelling===b.id?0.6:1 }
              }, cancelling===b.id?"⏳ Cancelling...":"🗑️  Cancel This Booking")
            );
          })
        ),

        cancelResults && cancelResults.length===0 && h("div", { style:{ textAlign:"center",
          padding:"16px 0", color:"rgba(153,27,27,0.5)", fontSize:13 } },
          "No bookings found for this number.")
      )
    )
  );
};