// ============================================================
//  features/messages.js
//  React component: MessageComposerTab
//  Modes: "satsang" (invitation) | "custom" (free-form)
// ============================================================

"use strict";

const { createElement: h, useState } = React;

window.MessageComposerTab = function MessageComposerTab({ suk }) {
  const [msgType,   setMsgType]   = useState("");
  const [satsang,   setSatsang]   = useState({ date:"", time:"", venue:"", mapsLink:"", hostedBy:"" });
  const [custom,    setCustom]    = useState({ body:"", author:"" });

  const buildSatsangMsg = () => {
    const { date, time, venue, mapsLink, hostedBy } = satsang;
    const lines = [
      "🙏 *Hearty Jayguru* 🙏", "",
      "Respected Dada / Maa,", "",
      "By the divine grace of",
      "*Param Premamay Sree Sree Thakur Anukulchandra*,",
      "we are humbly arranging a *Holy Satsang* at our residence.", "",
      "━━━━━━━━━━━━━━━━━━━━",
      "📅 *Date & Time*",
    ];
    if (date) lines.push(`      ${date}${time ? "  |  " + time + " onwards" : ""}`);
    lines.push(""); lines.push("📍 *Venue*");
    if (venue) lines.push(`      ${venue}`);
    if (mapsLink) lines.push(`      📌 ${mapsLink}`);
    lines.push("━━━━━━━━━━━━━━━━━━━━", "");
    lines.push("We most cordially request your divine presence");
    lines.push("along with your *family and friends*. 🌸", "");
    lines.push("Your presence will make this Satsang truly blessed. 🪷", "");
    if (hostedBy) { lines.push("*With love & Jayguru,*"); lines.push(hostedBy); }
    lines.push(""); lines.push(`🙏 *${suk ? window.sukLabel(suk) + (suk.location ? ", " + suk.location : "") : "Satsang Upayojana Kendra"}* 🙏`);
    return lines.join("\n");
  };

  const buildCustomMsg = () => [
    "🙏 *Hearty Jayguru* 🙏", "",
    custom.body.trim(), "",
    "━━━━━━━━━━━━━━━━━━━━",
    custom.author.trim() ? `*${custom.author.trim()}*` : null,
    `🙏 *${suk ? window.sukLabel(suk) + (suk.location ? ", " + suk.location : "") : "Satsang Upayojana Kendra"}* 🙏`,
  ].filter(Boolean).join("\n");

  const getMsg = () => msgType==="satsang" ? buildSatsangMsg() : buildCustomMsg();

  const hasContent = msgType==="satsang"
    ? (satsang.date||satsang.venue)
    : custom.body.trim().length > 0;

  const previewBox = (msg) => h("div", null,
    h("label", { className:"divine-label" }, "Message Preview"),
    h("div", { style:{ padding:"14px", borderRadius:12, fontSize:13, lineHeight:1.85,
      background:msgType==="satsang"?"rgba(255,251,235,0.8)":"rgba(20,40,120,0.04)",
      border:`1px solid ${msgType==="satsang"?"rgba(217,119,6,0.2)":"rgba(59,130,246,0.15)"}`,
      whiteSpace:"pre-wrap", color:"#1f2937", fontFamily:"'Lato',sans-serif" } }, msg),

    // Share buttons
    h("a", { onClick:()=>window.shareWhatsApp(msg),
      style:{ display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        padding:"13px", borderRadius:12, textDecoration:"none", cursor:"pointer", marginTop:12,
        background:"linear-gradient(135deg,#25D366,#128C7E)", color:"#fff",
        fontWeight:800, fontSize:14, boxShadow:"0 4px 14px rgba(37,211,102,0.3)" } },
      "💬 Share on WhatsApp"),
    h("div", { style:{ display:"flex", gap:8, marginTop:8 } },
      h("a", { onClick:()=>window.shareSMS(msg),
        style:{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
          gap:6, padding:"11px", borderRadius:12, textDecoration:"none", cursor:"pointer",
          background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"#fff",
          fontWeight:700, fontSize:13 } }, "📱 SMS"),
      h("button", { onClick:()=>window.shareCopy(msg),
        style:{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
          gap:6, padding:"11px", borderRadius:12, border:"none", cursor:"pointer",
          background:"rgba(30,64,175,0.08)", color:"#1e3a8a",
          fontWeight:700, fontSize:13 } }, "📋 Copy")
    )
  );

  return h("div", { style:{ display:"flex", flexDirection:"column", gap:16 } },

    // Header card
    h("div", { className:"card", style:{ padding:"20px 16px 16px", textAlign:"center" } },
      h("div", { style:{ fontSize:38, marginBottom:8,
        filter:"drop-shadow(0 0 12px rgba(29,78,216,0.3))",
        animation:"floatEmoji 3s ease-in-out infinite alternate" } }, "📨"),
      h("div", { style:{ fontFamily:"'Cinzel',serif", color:"#1e3a8a", fontSize:17, fontWeight:800, marginBottom:4 } },
        "Create a Message"),
      h("div", { style:{ fontSize:12, color:"rgba(29,78,216,0.45)", lineHeight:1.7 } },
        "Craft a Satsang invitation or a custom message to share"),
      h("div", { className:"blue-line", style:{ marginTop:14 } })
    ),

    // Type selector
    h("div", { className:"card" },
      h("label", { className:"divine-label" }, "Select Message Type"),
      h("select", {
        className:"divine-input", value:msgType,
        onChange:e=>{ setMsgType(e.target.value); setSatsang({date:"",time:"",venue:"",mapsLink:"",hostedBy:""}); setCustom({body:"",author:""}); },
        style:{ cursor:"pointer", fontSize:14, fontWeight:700 },
      },
        h("option", { value:"" }, "— Choose a type —"),
        h("option", { value:"satsang" }, "🪔 Satsang Invitation"),
        h("option", { value:"custom" }, "✍️ Custom Message")
      )
    ),

    // ── Satsang invitation form ──
    msgType==="satsang" && h("div", { className:"card" },
      h("div", { style:{ fontFamily:"'Cinzel',serif", color:"#1e3a8a", fontSize:15, fontWeight:700, marginBottom:14 } },
        "📜 Satsang Invitation"),
      h("div", { style:{ display:"flex", flexDirection:"column", gap:13 } },
        h("div", null,
          h("label", { className:"divine-label" }, "📅 Date"),
          h("input", { type:"date", className:"divine-input", value:satsang.date,
            style:{ fontSize:13, width:"100%", cursor:"pointer" },
            onChange:e=>setSatsang(s=>({...s,date:e.target.value})) })),
        h("div", null,
          h("label", { className:"divine-label" }, "⏰ Time"),
          h("input", { className:"divine-input", placeholder:"e.g. 4:30 PM",
            value:satsang.time, onChange:e=>setSatsang(s=>({...s,time:e.target.value})) })),
        h("div", null,
          h("label", { className:"divine-label" }, "📍 Venue / Address"),
          h("input", { className:"divine-input", placeholder:"e.g. 47, Bannerghatta SUK, Bangalore",
            value:satsang.venue, onChange:e=>setSatsang(s=>({...s,venue:e.target.value})) })),
        h("div", null,
          h("label", { className:"divine-label" }, "📌 Google Maps Link (optional)"),
          h("input", { className:"divine-input", placeholder:"Paste Google Maps link",
            value:satsang.mapsLink, onChange:e=>setSatsang(s=>({...s,mapsLink:e.target.value})) })),
        h("div", null,
          h("label", { className:"divine-label" }, "🙏 Hosted By"),
          h("input", { className:"divine-input", placeholder:"e.g. Bannerghatta SUK",
            value:satsang.hostedBy, onChange:e=>setSatsang(s=>({...s,hostedBy:e.target.value})) })),
        hasContent ? previewBox(getMsg()) :
          h("div", { style:{ textAlign:"center", padding:"14px 0",
            color:"rgba(29,78,216,0.35)", fontSize:13 } }, "Fill in the details above to preview the message 🙏")
      )
    ),

    // ── Custom message form ──
    msgType==="custom" && h("div", { className:"card" },
      h("div", { style:{ fontFamily:"'Cinzel',serif", color:"#1e3a8a", fontSize:15, fontWeight:700, marginBottom:14 } },
        "✍️ Custom Message"),
      h("div", { style:{ display:"flex", flexDirection:"column", gap:13 } },
        h("div", null,
          h("label", { className:"divine-label" }, "Your Message"),
          h("textarea", {
            className:"divine-input", placeholder:"Type your message here... 🙏",
            rows:6, value:custom.body,
            onChange:e=>setCustom(c=>({...c,body:e.target.value})),
            style:{ resize:"vertical", fontFamily:"'Lato',sans-serif", lineHeight:1.7 },
          })),
        h("div", null,
          h("label", { className:"divine-label" }, "Your Name (optional)"),
          h("input", { className:"divine-input", placeholder:"e.g. Bannerghatta SUK",
            value:custom.author, onChange:e=>setCustom(c=>({...c,author:e.target.value})) })),
        hasContent && previewBox(getMsg())
      )
    )
  );
};
