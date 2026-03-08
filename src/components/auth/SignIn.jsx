// ============================================================
//  SignIn — Admin-only Gmail OTP sign-in via GAS
//  ─────────────────────────────────────────────────────────
//  • App is PUBLIC — this is only for admin access
//  • OTP is emailed via your existing GAS script
//  • Configure adminEmail + gasScriptUrl in adminConfig.js
// ============================================================

import React from 'react'
import { ADMIN_CONFIG } from '../../config/adminConfig.js'

// ── Send OTP via GAS (uses your existing script + API key) ───
async function sendOtpViaGas(otp) {
  const url = ADMIN_CONFIG.gasScriptUrl
  if (!url || url === 'YOUR_GAS_SCRIPT_URL_HERE') {
    throw new Error('GAS script URL not configured in adminConfig.js')
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action:  'sendAdminOtp',
      apiKey:  ADMIN_CONFIG.gasApiKey || '',
      otp,
      email:   ADMIN_CONFIG.adminEmail,
    }),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Failed to send OTP')
}

function SignIn({ onSignIn }) {
  const [step, setStep]       = React.useState('form')   // 'form' | 'otp'
  const [email, setEmail]     = React.useState('')
  const [otp, setOtp]         = React.useState('')
  const [sentOtp, setSentOtp] = React.useState('')
  const [error, setError]     = React.useState('')
  const [shake, setShake]     = React.useState(false)
  const [sending, setSending] = React.useState(false)

  const triggerError = (msg) => {
    setError(msg); setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleSendOtp = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) { triggerError('⚠️ Please enter your email address.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      triggerError('⚠️ Please enter a valid email address.'); return
    }
    if (trimmed !== ADMIN_CONFIG.adminEmail.toLowerCase()) {
      triggerError('🚫 Access restricted. Only the configured admin email can sign in.')
      return
    }
    setError('')
    setSending(true)
    const code = String(Math.floor(100000 + Math.random() * 900000))
    setSentOtp(code)
    try {
      await sendOtpViaGas(code)
      setSending(false)
      setStep('otp')
    } catch (err) {
      setSending(false)
      triggerError('❌ Could not send OTP: ' + err.message)
      console.error('[BSUK Admin OTP error]', err)
    }
  }

  const handleVerifyOtp = () => {
    if (otp.trim() !== sentOtp) {
      triggerError('❌ Incorrect OTP. Please try again.')
      return
    }
    const user = { name: 'Admin', email: email.trim().toLowerCase(), isAdmin: true, signedInAt: Date.now() }
    try { sessionStorage.setItem('bsukUser', JSON.stringify(user)) } catch(e) {}
    onSignIn(user)
  }

  const handleResend = async () => {
    setOtp('')
    setError('')
    setSending(true)
    const code = String(Math.floor(100000 + Math.random() * 900000))
    setSentOtp(code)
    try {
      await sendOtpViaGas(code)
      setSending(false)
    } catch (err) {
      setSending(false)
      triggerError('❌ Could not resend OTP: ' + err.message)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      background: 'radial-gradient(ellipse at 50% -5%, rgba(99,145,255,0.45) 0%, transparent 50%), radial-gradient(ellipse at 0% 100%, rgba(29,78,216,0.2) 0%, transparent 50%), linear-gradient(180deg, #b8ccff 0%, #cfdeff 25%, #dce9ff 55%, #eef4ff 80%, #f5f8ff 100%)',
    }}>

      {/* Glow bg */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 40%, rgba(255,220,80,0.06) 0%, transparent 60%)',
      }}/>

      <div style={{
        width: '100%', maxWidth: 380, position: 'relative', zIndex: 1,
        background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(20px)',
        borderRadius: 24, padding: '32px 28px',
        border: '1px solid rgba(59,130,246,0.2)',
        boxShadow: '0 20px 60px rgba(29,78,216,0.12), 0 4px 20px rgba(0,0,0,0.06)',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            fontSize: 60, marginBottom: 8,
            filter: 'drop-shadow(0 0 22px rgba(255,160,0,0.55))',
            animation: 'floatEmoji 3s ease-in-out infinite alternate',
            display: 'inline-block',
          }}>🪷</div>
          <div style={{
            fontFamily: "'Cinzel',serif", fontSize: 26, fontWeight: 900,
            background: 'linear-gradient(180deg,#ffe47a 0%,#ffc020 40%,#e87c00 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            letterSpacing: 4, marginBottom: 6,
          }}>Jayguru</div>
          <div style={{ fontFamily: "'Cinzel',serif", color: '#1e3a8a', fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
            {step === 'form' ? 'Admin Sign In' : 'Verify Your Identity'}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            marginTop: 8, padding: '4px 12px', borderRadius: 20,
            background: 'rgba(29,78,216,0.07)', border: '1px solid rgba(59,130,246,0.2)',
            fontSize: 11, color: 'rgba(29,78,216,0.6)', fontWeight: 700, letterSpacing: 1,
          }}>
            🔐 Authorised Admin Access Only
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, margin: '10px 16px 0',
          }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,200,60,0.5),rgba(59,130,246,0.4))' }}/>
            <span style={{ fontSize: 14, filter: 'drop-shadow(0 0 6px rgba(255,180,0,0.6))' }}>🙏</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(59,130,246,0.4),rgba(255,200,60,0.5),transparent)' }}/>
          </div>
        </div>

        {/* ── STEP 1: Email entry ── */}
        {step === 'form' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="divine-label">📧 Admin Gmail Address</label>
              <input
                className="divine-input"
                placeholder="bangaloresuk@gmail.com"
                type="email"
                value={email}
                onChange={e => { setError(''); setEmail(e.target.value) }}
                onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                autoComplete="email"
              />
            </div>

            {error && (
              <div className={shake ? 'shake' : ''} style={{
                padding: '11px 14px', borderRadius: 10, fontSize: 13,
                background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c',
              }}>{error}</div>
            )}

            <button
              onClick={handleSendOtp}
              disabled={sending}
              style={{
                width: '100%', padding: '15px', border: 'none', borderRadius: 13,
                background: 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 50%,#60a5fa 100%)',
                color: '#fff', fontWeight: 900, fontSize: 16, cursor: sending ? 'not-allowed' : 'pointer',
                fontFamily: "'Cinzel',serif", letterSpacing: '0.5px',
                boxShadow: '0 5px 22px rgba(29,78,216,0.35)',
                opacity: sending ? 0.7 : 1, transition: 'all 0.3s',
              }}>
              {sending ? '⏳ Sending OTP to Gmail...' : '📧 Send OTP to Gmail'}
            </button>

            <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(29,78,216,0.4)', lineHeight: 1.6 }}>
              OTP will be sent to your Gmail via the booking system.<br/>
              Only the configured admin email can access this area.
            </div>
          </div>
        )}

        {/* ── STEP 2: OTP verification ── */}
        {step === 'otp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Success banner */}
            <div style={{
              padding: '14px 16px', borderRadius: 12,
              background: 'rgba(209,250,229,0.9)', border: '1px solid rgba(110,231,183,0.6)',
              fontSize: 13, color: '#065f46', textAlign: 'center', lineHeight: 1.7,
            }}>
              📬 OTP sent to <strong>{email.trim()}</strong><br/>
              <span style={{ fontSize: 11, color: 'rgba(6,95,70,0.6)' }}>
                Check your Gmail inbox (also check Spam)
              </span>
            </div>

            <div>
              <label className="divine-label">🔑 Enter 6-digit OTP</label>
              <input className="divine-input"
                placeholder="······"
                type="tel" maxLength="6"
                value={otp}
                autoFocus
                onChange={e => { setError(''); setOtp(e.target.value.replace(/[^0-9]/g, '')) }}
                onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                style={{ fontSize: 28, letterSpacing: 10, textAlign: 'center', fontWeight: 900 }}
              />
            </div>

            {error && (
              <div className={shake ? 'shake' : ''} style={{
                padding: '11px 14px', borderRadius: 10, fontSize: 13,
                background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c',
              }}>{error}</div>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={otp.length < 6}
              style={{
                width: '100%', padding: '15px', border: 'none', borderRadius: 13,
                background: otp.length === 6
                  ? 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 50%,#60a5fa 100%)'
                  : 'rgba(200,210,230,0.5)',
                color: otp.length === 6 ? '#fff' : '#aaa',
                fontWeight: 900, fontSize: 16, cursor: otp.length === 6 ? 'pointer' : 'not-allowed',
                fontFamily: "'Cinzel',serif", letterSpacing: '0.5px',
                boxShadow: otp.length === 6 ? '0 5px 22px rgba(29,78,216,0.35)' : 'none',
                transition: 'all 0.3s',
              }}>
              ✅ Verify & Sign In
            </button>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
              <button
                onClick={handleResend}
                disabled={sending}
                style={{
                  background: 'none', border: 'none', cursor: sending ? 'not-allowed' : 'pointer',
                  fontSize: 12, color: '#1d4ed8', fontWeight: 700, textDecoration: 'underline',
                  opacity: sending ? 0.5 : 1,
                }}>
                {sending ? '⏳ Resending...' : '🔄 Resend OTP'}
              </button>
              <span style={{ color: 'rgba(29,78,216,0.3)', fontSize: 11 }}>·</span>
              <button onClick={() => { setStep('form'); setOtp(''); setError(''); setSentOtp('') }} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: '#6b7280', fontWeight: 600,
              }}>← Change Email</button>
            </div>
          </div>
        )}
      </div>

      {/* Public note */}
      <div style={{
        marginTop: 18, fontSize: 11, color: 'rgba(29,78,216,0.45)',
        textAlign: 'center', lineHeight: 1.8,
      }}>
        🌐 This app is publicly accessible for bookings.<br/>
        Sign-in is for admin management only.
      </div>
    </div>
  )
}

export default SignIn
