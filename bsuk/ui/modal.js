// ============================================================
//  ui/modal.js
//  React modal components:
//    • BookingConfirmModal  — prayer booking confirmed
//    • SatsangConfirmModal  — satsang booking confirmed
//  Both receive data + onClose prop.
//  Registered on window for use in app.js / features.
// ============================================================

"use strict";

const { createElement: h } = React;

// ── Shared: build plain-text prayer share message ────────────
window.buildShareMsgPlain = (c) => {
  const timeLabel   = c.time === "Morning" ? "Morning" : "Evening";
  const locationLine = c.place ||
    (window.ACTIVE_SUK
      ? window.sukLabel(window.ACTIVE_SUK) + (window.ACTIVE_SUK.location ? ", " + window.ACTIVE_SUK.location : "")
      : "Satsang Upayojana Kendra");

  return [
    "Jayguru 🙏", "",
    "You're cordially invited! 🙏", "",
    `for the *${timeLabel} Prayer*`,
    `on *${window.formatDateWithDay(c.date)}* at *${window.cleanTime(c.prayerTime)}*`, "",
    "Please join us with your family and friends 🙏", "",
    "━━━━━━━━━━━━━━━━━━━━",
    `🕐 *Prayer Time:* ${window.cleanTime(c.prayerTime)} sharp`,
    `📍 *Address:* ${locationLine}`,
    "━━━━━━━━━━━━━━━━━━━━", "",
    "*With love & Jayguru,*",
    `${c.name} 🙏`,
    `📱 ${c.mobile}`, "",
    `🙏 *${window.ACTIVE_SUK ? window.sukLabel(window.ACTIVE_SUK) + (window.ACTIVE_SUK.location ? ", " + window.ACTIVE_SUK.location : "") : "Satsang Upayojana Kendra"}*`,
  ].join("\n");
};
window.buildShareMsg = (c) => encodeURIComponent(window.buildShareMsgPlain(c));

// ── Shared: build plain-text satsang share message ───────────
window.buildSatsangShareMsgPlain = (c) => {
  const day  = c.day  || window.getDayName(c.date);
  const date = window.formatDate(c.date);
  return [
    "🙏 *Hearty Jayguru* 🙏", "",
    "Respected Dada / Maa,", "",
    "By the divine grace of",
    "*Param Premamay Sree Sree Thakur Anukulchandra*,",
    "we are humbly arranging a *Holy Satsang* at our residence.",
    c.occasion ? `\n🪔 *Occasion:* ${c.occasion}` : "", "",
    "━━━━━━━━━━━━━━━━━━━━",
    "📅 *Date & Time*",
    `      ${day}, ${date}  |  ${c.time} onwards`, "",
    "📍 *Venue*",
    `      ${c.venue}`,
    c.mapsLink ? `      📌 ${c.mapsLink}` : "",
    "━━━━━━━━━━━━━━━━━━━━", "",
    "We most cordially request your divine presence",
    "along with your *family and friends*. 🌸", "",
    "Your presence will make this Satsang truly blessed. 🪔", "",
    "*With love & Jayguru,*",
    `${c.hostedBy || (window.ACTIVE_SUK ? window.sukLabel(window.ACTIVE_SUK) : "SUK")}`,
    c.mobile ? `📱 ${c.mobile}` : "", "",
    `🙏 *${window.ACTIVE_SUK ? window.sukLabel(window.ACTIVE_SUK) + (window.ACTIVE_SUK.location ? ", " + window.ACTIVE_SUK.location : "") : "Satsang Upayojana Kendra"}* 🙏`,
  ].filter(l => l !== null && l !== undefined).join("\n");
};
window.buildSatsangShareMsg = (c) => encodeURIComponent(window.buildSatsangShareMsgPlain(c));

window.handleCopy        = (c) => window.shareCopy(window.buildShareMsgPlain(c));
window.handleSatsangCopy = (c) => window.shareCopy(window.buildSatsangShareMsgPlain(c));

// ── Prayer Booking Confirmation Modal ────────────────────────
window.BookingConfirmModal = function BookingConfirmModal({ confirmation, onClose }) {
  if (!confirmation) return null;
  const c = confirmation;

  const rows = [
    ["👤 Name",    c.name],
    [c.time === "Morning" ? "🌅 Slot" : "🌙 Slot", `${c.time} Prayer`],
    ["🗓️ Date",   window.formatDateWithDay(c.date)],
    ["🕐 Time",   window.cleanTime(c.prayerTime)],
  ];

  return h("div", {
    className: "modal-overlay",
    onClick: onClose,
  },
    h("div", { className:"modal-box", onClick: e => e.stopPropagation() },

      h("div", { style:{ fontSize:56, marginBottom:8, animation:"floatEmoji 2s ease-in-out infinite alternate" } }, "🙏"),
      h("div", { className:"modal-title" }, "Booking Confirmed!"),

      // Details card
      h("div", { style:{ background:"#eff6ff", borderRadius:14, padding:"14px 16px",
        margin:"14px 0", textAlign:"left", border:"1px solid rgba(59,130,246,0.2)" } },
        rows.map(([label, val]) =>
          h("div", {
            key: label,
            style:{ display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"5px 0", borderBottom:"1px solid rgba(59,130,246,0.08)" },
          },
            h("span", { style:{ fontSize:12, color:"rgba(29,78,216,0.55)", fontWeight:600 } }, label),
            h("span", { style:{ fontSize:13, color:"#1e3a8a", fontWeight:700 } }, val)
          )
        )
      ),

      h("div", { className:"modal-jayguru" }, "Jayguru 🙏"),

      // Share section
      h("div", { style:{ marginTop:18, padding:"14px", background:"#f0fdf4",
        borderRadius:12, border:"1px solid #bbf7d0" } },
        h("div", { style:{ fontSize:12, fontWeight:700, color:"#065f46",
          marginBottom:10, textAlign:"center", letterSpacing:"0.5px" } }, "📤 Share Booking Details"),
        h("div", { style:{ display:"flex", flexDirection:"column", gap:8 } },
          h("a", {
            href: `https://wa.me/?text=${window.buildShareMsg(c)}`,
            target:"_blank", rel:"noopener noreferrer",
            style:{ display:"flex", alignItems:"center", justifyContent:"center",
              gap:10, padding:"12px", borderRadius:11, textDecoration:"none",
              background:"linear-gradient(135deg,#25D366,#128C7E)",
              color:"#fff", fontWeight:800, fontSize:14 },
          }, h("span", { style:{ fontSize:20 } }, "💬"), "Share on WhatsApp"),
          h("a", {
            href: `sms:${c.mobile}?body=${window.buildShareMsg(c)}`,
            style:{ display:"flex", alignItems:"center", justifyContent:"center",
              gap:10, padding:"12px", borderRadius:11, textDecoration:"none",
              background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",
              color:"#fff", fontWeight:800, fontSize:14 },
          }, h("span", { style:{ fontSize:20 } }, "📱"), "Send as SMS"),
          h("button", {
            onClick: () => window.handleCopy(c),
            style:{ display:"flex", alignItems:"center", justifyContent:"center",
              gap:10, padding:"12px", borderRadius:11, border:"none",
              background:"rgba(30,64,175,0.08)", cursor:"pointer",
              color:"#1e3a8a", fontWeight:700, fontSize:14 },
          }, h("span", { style:{ fontSize:20 } }, "📋"), "Copy to Clipboard")
        ),
        h("div", { style:{ fontSize:11, color:"#6b7280", marginTop:8, textAlign:"center", lineHeight:1.5 } },
          "Tap WhatsApp to share with family · or SMS to send directly · or Copy to paste anywhere")
      ),

      h("button", {
        className: "modal-close-btn",
        style: { marginTop:14 },
        onClick: onClose,
      }, "✓ Done")
    )
  );
};

// ── Satsang Booking Confirmation Modal ───────────────────────
window.SatsangConfirmModal = function SatsangConfirmModal({ confirmation, onClose }) {
  if (!confirmation) return null;
  const c = confirmation;

  const rows = [
    ["👤 Host",    c.name],
    ["📅 Date",    (c.day || "") + ", " + window.formatDate(c.date)],
    ["⏰ Time",    c.time + " onwards"],
    ["📍 Venue",   c.venue],
    ["🪔 Occasion", c.occasion || null],
    ["🙏 Hosted",  c.hostedBy || (window.ACTIVE_SUK ? window.sukLabel(window.ACTIVE_SUK) : "SUK")],
  ].filter(([, val]) => !!val);

  return h("div", {
    className: "modal-overlay",
    onClick: onClose,
  },
    h("div", { className:"modal-box", onClick: e => e.stopPropagation() },

      h("div", { style:{ fontSize:56, marginBottom:8,
        animation:"floatEmoji 2s ease-in-out infinite alternate",
        filter:"drop-shadow(0 0 18px rgba(217,119,6,0.5))" } }, "🪔"),
      h("div", { className:"modal-title", style:{ color:"#78350f" } }, "Satsang Booked!"),

      // Details card
      h("div", { style:{ background:"#fef3c7", borderRadius:14, padding:"14px 16px",
        margin:"14px 0", textAlign:"left", border:"1px solid rgba(217,119,6,0.3)" } },
        rows.map(([label, val]) =>
          h("div", {
            key: label,
            style:{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
              padding:"5px 0", borderBottom:"1px solid rgba(217,119,6,0.1)" },
          },
            h("span", { style:{ fontSize:12, color:"rgba(120,53,15,0.6)", fontWeight:600 } }, label),
            h("span", { style:{ fontSize:13, color:"#78350f", fontWeight:700,
              textAlign:"right", maxWidth:"60%" } }, val)
          )
        )
      ),

      h("div", { style:{ fontFamily:"'Cinzel',serif", color:"#78350f",
        fontSize:14, fontWeight:700, textAlign:"center", marginBottom:4 } }, "Jayguru 🪔"),

      // Share section
      h("div", { style:{ marginTop:14, padding:"14px", background:"#fffbeb",
        borderRadius:12, border:"1px solid rgba(217,119,6,0.25)" } },
        h("div", { style:{ fontSize:12, fontWeight:700, color:"#78350f",
          marginBottom:10, textAlign:"center", letterSpacing:"0.5px" } }, "📤 Share Satsang Details"),
        h("div", { style:{ display:"flex", flexDirection:"column", gap:8 } },
          h("a", {
            href: `https://wa.me/?text=${window.buildSatsangShareMsg(c)}`,
            target:"_blank", rel:"noopener noreferrer",
            style:{ display:"flex", alignItems:"center", justifyContent:"center",
              gap:10, padding:"12px", borderRadius:11, textDecoration:"none",
              background:"linear-gradient(135deg,#25D366,#128C7E)",
              color:"#fff", fontWeight:800, fontSize:14 },
          }, h("span", { style:{ fontSize:20 } }, "💬"), "Share on WhatsApp"),
          h("a", {
            href: `sms:?body=${window.buildSatsangShareMsg(c)}`,
            style:{ display:"flex", alignItems:"center", justifyContent:"center",
              gap:10, padding:"12px", borderRadius:11, textDecoration:"none",
              background:"linear-gradient(135deg,#d97706,#fbbf24)",
              color:"#fff", fontWeight:800, fontSize:14 },
          }, h("span", { style:{ fontSize:20 } }, "📱"), "Send as SMS"),
          h("button", {
            onClick: () => window.handleSatsangCopy(c),
            style:{ display:"flex", alignItems:"center", justifyContent:"center",
              gap:10, padding:"12px", borderRadius:11, border:"none",
              background:"rgba(120,53,15,0.08)", cursor:"pointer",
              color:"#78350f", fontWeight:700, fontSize:14 },
          }, h("span", { style:{ fontSize:20 } }, "📋"), "Copy to Clipboard")
        ),
        h("div", { style:{ fontSize:11, color:"#6b7280", marginTop:8, textAlign:"center", lineHeight:1.5 } },
          "Share the invitation with family & friends 🙏")
      ),

      h("button", {
        className: "modal-close-btn",
        style:{ marginTop:14, background:"linear-gradient(135deg,#78350f,#d97706)" },
        onClick: onClose,
      }, "✓ Done")
    )
  );
};
