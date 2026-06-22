// ============================================================
//  MessagesTab — craft satsang invitations & custom messages
// ============================================================
import React from 'react'
import { LocationPicker } from '../shared/LocationPicker.jsx'

export default function MessagesTab({
  msgType, setMsgType,
  satsang, setSatsang,
  customMsg, setCustomMsg,
  buildSatsangMsg, buildCustomMsg,
  shareWhatsApp, shareSMS, shareCopy,
}) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header */}
      <div className="card" style={{ padding:'20px 16px 16px', textAlign:'center' }}>
        <div style={{ fontSize:38, marginBottom:8,
          filter:'drop-shadow(0 0 12px rgba(29,78,216,0.3))',
          animation:'floatEmoji 3s ease-in-out infinite alternate' }}>📨</div>
        <div style={{ fontFamily:"'Cinzel',serif", color:'#1e3a8a',
          fontSize:17, fontWeight:800, marginBottom:4 }}>Create a Message</div>
        <div style={{ fontSize:12, color:'rgba(29,78,216,0.45)', lineHeight:1.7 }}>
          Craft a Satsang invitation or a custom message to share
        </div>
        <div className="blue-line" style={{ marginTop:14 }}/>
      </div>

      {/* Message type selector */}
      <div className="card">
        <label className="divine-label">Select Message Type</label>
        <select className="divine-input" value={msgType}
          onChange={e => {
            setMsgType(e.target.value)
            setSatsang({ date:'', time:'', venue:'', mapsLink:'', hostedBy:'' })
            setCustomMsg({ body:'', author:'' })
          }}
          style={{ cursor:'pointer', fontSize:14, fontWeight:700 }}>
          <option value="">— Choose a type —</option>
          <option value="satsang">🪔 Satsang Invitation</option>
          <option value="custom">✍️ Custom Message</option>
        </select>
      </div>

      {/* Satsang invitation */}
      {msgType === 'satsang' && (
        <SatsangInviteForm
          satsang={satsang} setSatsang={setSatsang}
          buildSatsangMsg={buildSatsangMsg}
          shareWhatsApp={shareWhatsApp} shareSMS={shareSMS} shareCopy={shareCopy}
        />
      )}

      {/* Custom message */}
      {msgType === 'custom' && (
        <CustomMsgForm
          customMsg={customMsg} setCustomMsg={setCustomMsg}
          buildCustomMsg={buildCustomMsg}
          shareWhatsApp={shareWhatsApp} shareSMS={shareSMS} shareCopy={shareCopy}
        />
      )}

    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  SatsangInviteForm
// ─────────────────────────────────────────────────────────────
function SatsangInviteForm({ satsang, setSatsang, buildSatsangMsg, shareWhatsApp, shareSMS, shareCopy }) {
  const builtMsg = satsang.date || satsang.venue ? buildSatsangMsg() : ''
  return (
    <div className="card">
      <div style={{ fontFamily:"'Cinzel',serif", color:'#1e3a8a',
        fontSize:15, fontWeight:700, marginBottom:14 }}>
        📜 Satsang Invitation
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
        {[
          { label:'📅 Date',               key:'date',     type:'date',   placeholder:'' },
          { label:'⏰ Time',               key:'time',     type:'text',   placeholder:'e.g. 4:30 PM' },
          { label:'📍 Venue / Address',    key:'venue',    type:'text',   placeholder:'e.g. 47, Bannerghatta SUK' },
          { label:'📌 Google Maps Link (optional)', key:'mapsLink', type:'text', placeholder:'Paste Google Maps link' },
          { label:'🙏 Hosted By',          key:'hostedBy', type:'text',   placeholder:'e.g. Bannerghatta SUK' },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key}>
            <label className="divine-label">{label}</label>
            <input type={type} className="divine-input" placeholder={placeholder}
              value={satsang[key]}
              style={type==='date' ? { fontSize:13, width:'100%', cursor:'pointer' } : {}}
              onChange={e => setSatsang({...satsang, [key]:e.target.value})}/>
          </div>
        ))}

        <div>
          <label className="divine-label">🌐 Find Venue Location</label>
          <LocationPicker color="#1d4ed8"
            placeholder="Search venue — area, landmark, address…"
            onPick={({ address, mapsLink }) => setSatsang(prev => ({
              ...prev,
              venue:    address  || prev.venue,
              mapsLink: mapsLink || prev.mapsLink,
            }))}/>
        </div>

        {builtMsg ? (
          <ShareSection msg={builtMsg} shareWhatsApp={shareWhatsApp} shareSMS={shareSMS} shareCopy={shareCopy}/>
        ) : (
          <div style={{ textAlign:'center', padding:'14px 0', color:'rgba(29,78,216,0.35)', fontSize:13 }}>
            Fill in the details above to preview the message 🙏
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  CustomMsgForm
// ─────────────────────────────────────────────────────────────
function CustomMsgForm({ customMsg, setCustomMsg, buildCustomMsg, shareWhatsApp, shareSMS, shareCopy }) {
  const builtMsg = customMsg.body.trim() ? buildCustomMsg() : ''
  return (
    <div className="card">
      <div style={{ fontFamily:"'Cinzel',serif", color:'#1e3a8a',
        fontSize:15, fontWeight:700, marginBottom:14 }}>
        ✍️ Custom Message
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
        <div>
          <label className="divine-label">Your Message</label>
          <textarea className="divine-input" placeholder="Type your message here... 🙏"
            rows={6} value={customMsg.body}
            onChange={e => setCustomMsg({...customMsg, body:e.target.value})}
            style={{ resize:'vertical', fontFamily:"'Lato',sans-serif", lineHeight:1.7 }}/>
        </div>
        <div>
          <label className="divine-label">Your Name (optional)</label>
          <input className="divine-input" placeholder="e.g. Bannerghatta SUK"
            value={customMsg.author}
            onChange={e => setCustomMsg({...customMsg, author:e.target.value})}/>
        </div>
        {builtMsg && (
          <ShareSection msg={builtMsg} shareWhatsApp={shareWhatsApp} shareSMS={shareSMS} shareCopy={shareCopy}/>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  ShareSection — preview + WA / SMS / Copy
// ─────────────────────────────────────────────────────────────
function ShareSection({ msg, shareWhatsApp, shareSMS, shareCopy }) {
  return (
    <>
      <label className="divine-label">Message Preview</label>
      <div style={{ padding:'14px', borderRadius:12, fontSize:13, lineHeight:1.85,
        background:'rgba(255,251,235,0.8)', border:'1px solid rgba(217,119,6,0.2)',
        whiteSpace:'pre-wrap', color:'#1f2937', fontFamily:"'Lato',sans-serif" }}>
        {msg}
      </div>
      <div onClick={() => shareWhatsApp(msg)}
        style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          padding:'13px', borderRadius:12, textDecoration:'none', cursor:'pointer',
          background:'linear-gradient(135deg,#25D366,#128C7E)', color:'#fff',
          fontWeight:800, fontSize:14, boxShadow:'0 4px 14px rgba(37,211,102,0.3)' }}>
        💬 Share on WhatsApp
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <div onClick={() => shareSMS(msg)}
          style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
            gap:6, padding:'11px', borderRadius:12, textDecoration:'none', cursor:'pointer',
            background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', color:'#fff',
            fontWeight:700, fontSize:13 }}>📱 SMS</div>
        <button onClick={() => shareCopy(msg)}
          style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
            gap:6, padding:'11px', borderRadius:12, border:'none', cursor:'pointer',
            background:'rgba(30,64,175,0.08)', color:'#1e3a8a',
            fontWeight:700, fontSize:13 }}>📋 Copy</button>
      </div>
    </>
  )
}
