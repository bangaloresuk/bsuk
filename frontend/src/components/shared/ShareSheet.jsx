// ============================================================
//  ShareSheet — WhatsApp / SMS / Copy button group
//  Pass the plain-text message; component handles encoding.
// ============================================================
import React from 'react'

export function ShareSheet({ message, mobile = '', accentColor = '#25D366', onClose }) {
  const encoded = encodeURIComponent(message)

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message)
        .then(() => alert('✅ Copied! Paste it in WhatsApp, SMS or anywhere.'))
        .catch(() => prompt('Copy this message:', message))
    } else {
      prompt('Copy this message:', message)
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'row', gap:8 }}>
      {/* WhatsApp */}
      <a href={`https://wa.me/?text=${encoded}`}
        target="_blank" rel="noopener noreferrer"
        style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
          flexDirection:'column', gap:4, padding:'10px 6px', borderRadius:11, textDecoration:'none',
          background:'linear-gradient(135deg,#25D366,#128C7E)',
          color:'#fff', fontWeight:800, fontSize:12,
          boxShadow:'0 4px 14px rgba(37,211,102,0.35)' }}>
        <span style={{ fontSize:20 }}>💬</span>
        WhatsApp
      </a>

      {/* SMS */}
      <a href={mobile ? `sms:${mobile}?body=${encoded}` : `sms:?body=${encoded}`}
        style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
          flexDirection:'column', gap:4, padding:'10px 6px', borderRadius:11, textDecoration:'none',
          background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,
          color:'#fff', fontWeight:800, fontSize:12,
          boxShadow:`0 4px 14px ${accentColor}55` }}>
        <span style={{ fontSize:20 }}>📱</span>
        SMS
      </a>

      {/* Copy */}
      <button onClick={handleCopy}
        style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
          flexDirection:'column', gap:4, padding:'10px 6px', borderRadius:11, border:'none',
          background:'rgba(30,64,175,0.08)', cursor:'pointer',
          color:'#1e3a8a', fontWeight:700, fontSize:12 }}>
        <span style={{ fontSize:20 }}>📋</span>
        Copy
      </button>
    </div>
  )
}
