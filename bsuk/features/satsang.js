// ============================================================
//  features/satsang.js
//  React component: SatsangBookingForm
//  Handles booking a Satsang gathering.
//  Props: { onBooked }
// ============================================================

"use strict";

const { createElement: h, useState } = React;

window.SatsangBookingForm = function SatsangBookingForm({ api, onBooked }) {
  const [form, setForm] = useState({
    name:"", mobile:"", venue:"", date:"", time:"", hostedBy:"", mapsLink:"", occasion:"",
  });
  const [error,      setError]      = useState("");
  const [shake,      setShake]      = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const triggerError = (msg) => {
    setError(msg); setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async () => {
    const { name, mobile, venue, date, time } = form;
    if (!name.trim())   { triggerError("⚠️ Please enter the host's name."); return; }
    if (!mobile.trim()) { triggerError("⚠️ Please enter the mobile number."); return; }
    if (!/^[0-9]{10}$/.test(mobile.trim())) { triggerError("⚠️ Valid 10-digit mobile required."); return; }
    if (!date)          { triggerError("⚠️ Please select a date."); return; }
    if (date < window.getTodayStr()) { triggerError("⚠️ Please select today or a future date."); return; }
    if (!time.trim())   { triggerError("⚠️ Please enter the time."); return; }
    if (!venue.trim())  { triggerError("⚠️ Please enter the venue."); return; }
    if (!window.isConfigured()) { triggerError("⚠️ Please configure the Script URL."); return; }

    setSubmitting(true);
    try {
      const result = await api.satsang.book({
        action: "add",
        name:     name.trim(),
        mobile:   mobile.trim(),
        venue:    venue.trim(),
        date,
        time:     time.trim(),
        hostedBy: form.hostedBy.trim() || (window.ACTIVE_SUK ? window.sukLabel(window.ACTIVE_SUK) : "SUK"),
        mapsLink: form.mapsLink.trim(),
        occasion: form.occasion.trim(),
        day:      window.getDayName(date),
      });
      if (result.success) {
        onBooked({ ...form, id: result.id, day: window.getDayName(date) });
        setForm({ name:"", mobile:"", venue:"", date:"", time:"", hostedBy:"", mapsLink:"", occasion:"" });
      } else { triggerError(result.message || "⚠️ Booking failed. Please try again."); }
    } catch(e) { triggerError("⚠️ Network error. Please try again."); }
    setSubmitting(false);
  };

  const labelStyle  = { color:"rgba(120,53,15,0.7)" };
  const borderStyle = { borderColor:"rgba(217,119,6,0.3)" };

  const field = (label, key, placeholder, extras = {}) =>
    h("div", null,
      h("label", { className:"divine-label", style:labelStyle }, label),
      h("input", {
        className: "divine-input",
        placeholder,
        value: form[key],
        style: borderStyle,
        onChange: e => setForm(f => ({ ...f, [key]: extras.numeric ? e.target.value.replace(/[^0-9]/g,"") : e.target.value })),
        ...extras,
      })
    );

  return h("div", { style:{ display:"flex", flexDirection:"column", gap:13 } },

    h("div", { style:{ textAlign:"center", marginBottom:4 } },
      h("div", { style:{ fontFamily:"'Cinzel',serif", color:"#78350f", fontSize:16, fontWeight:700 } },
        "Book a Satsang Gathering"),
      h("div", { style:{ height:1, background:"linear-gradient(90deg,transparent,rgba(217,119,6,0.5),transparent)", marginTop:10 } })
    ),

    error && h("div", { className:shake?"shake":"",
      style:{ padding:"11px 14px", borderRadius:10, fontSize:13, fontWeight:600,
        background:"#fef3c7", color:"#92400e", whiteSpace:"pre-line" } }, error),

    field("👤 Host Name", "name", "Name of the person hosting"),

    h("div", null,
      h("label", { className:"divine-label", style:labelStyle }, "📱 Mobile Number"),
      h("input", { className:"divine-input", placeholder:"10-digit mobile", type:"tel", maxLength:10,
        value:form.mobile, style:borderStyle,
        onChange: e => setForm(f => ({ ...f, mobile:e.target.value.replace(/[^0-9]/g,"") })) })
    ),

    h("div", null,
      h("label", { className:"divine-label", style:labelStyle }, "📅 Date"),
      h("input", { type:"date", className:"divine-input", value:form.date, min:window.getTodayStr(),
        style:{ fontSize:13, width:"100%", cursor:"pointer", ...borderStyle },
        onChange: e => setForm(f => ({ ...f, date:e.target.value })) })
    ),

    field("⏰ Time", "time", "e.g. 4:30 PM onwards"),
    field("📍 Venue / Address", "venue", "Full address of the Satsang venue"),
    field("📌 Google Maps Link (optional)", "mapsLink", "Paste Google Maps link"),

    h("div", null,
      h("label", { className:"divine-label", style:labelStyle }, "🪔 Occasion (optional)"),
      h("input", { className:"divine-input",
        placeholder:"e.g. Birthday, Anniversary, Gratitude, Monthly Satsang",
        value:form.occasion, style:borderStyle,
        onChange: e => setForm(f => ({ ...f, occasion:e.target.value })) }),
      h("div", { style:{ fontSize:10, color:"rgba(120,53,15,0.4)", marginTop:4, paddingLeft:2 } },
        "The reason or purpose of this Satsang gathering")
    ),

    field("🙏 Hosted By (optional)", "hostedBy", "e.g. Bannerghatta SUK"),

    h("div", { style:{ marginTop:8 } },
      h("button", {
        onClick: handleSubmit,
        disabled: submitting,
        style:{
          width:"100%", padding:"15px", border:"none", borderRadius:13,
          background:"linear-gradient(135deg,#78350f 0%,#d97706 50%,#fbbf24 100%)",
          color:"#fff", fontWeight:900, fontSize:16, cursor:"pointer",
          fontFamily:"'Cinzel',serif", letterSpacing:"0.5px",
          boxShadow:"0 5px 22px rgba(120,53,15,0.35)",
          opacity:submitting?0.7:1, transition:"all 0.3s",
        },
      }, submitting ? "⏳ Booking..." : "🪔  Book This Satsang")
    )
  );
};
