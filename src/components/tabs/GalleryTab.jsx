// ============================================================
//  GalleryTab — Upload & browse prayer photos
//
//  New in this version:
//  1. Tap any photo → full-screen lightbox with prev/next arrows
//  2. Share sends the actual photo file to WhatsApp AND
//     copies the rich text + gallery link to clipboard so
//     the sender can paste it in the same chat
// ============================================================

import React from 'react'
import state from '../../config/activeSuk.js'
import { sukLabel } from '../../config/sukConfig.js'
import { cleanPhotoDate } from '../../utils/utils.js'

export default function GalleryTab({
  isConfigured,
  photos, photosLoading,
  photoUpload, setPhotoUpload,
  photoMsg, setPhotoMsg,
  photoUploading,
  onUpload,
}) {

  // ── Lightbox state ─────────────────────────────────────────
  const [lightbox, setLightbox] = React.useState(null) // index or null

  const openLightbox  = (i) => setLightbox(i)
  const closeLightbox = ()  => setLightbox(null)
  const prevPhoto     = (e) => { e.stopPropagation(); setLightbox(i => Math.max(0, i - 1)) }
  const nextPhoto     = (e) => { e.stopPropagation(); setLightbox(i => Math.min(photos.length - 1, i + 1)) }

  // Keyboard nav
  React.useEffect(() => {
    if (lightbox === null) return
    const handler = (e) => {
      if (e.key === 'ArrowLeft')  setLightbox(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setLightbox(i => Math.min(photos.length - 1, i + 1))
      if (e.key === 'Escape')     closeLightbox()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, photos.length])

  // ── File picker ────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setPhotoMsg('⚠️ Photo must be under 5MB.'); return }
    setPhotoMsg('')
    const reader = new FileReader()
    reader.onload = ev => setPhotoUpload(p => ({ ...p, file, preview: ev.target.result }))
    reader.readAsDataURL(file)
  }

  // ── Gallery deep-link ──────────────────────────────────────
  const galleryUrl = (() => {
    try {
      const base   = window.location.origin + window.location.pathname
      const sukKey = state.ACTIVE_SUK ? state.ACTIVE_SUK.key : ''
      return `${base}?suk=${encodeURIComponent(sukKey)}&open=gallery`
    } catch (e) { return '' }
  })()

  // ── Share: image file + rich text copied to clipboard ──────
  const handlePhotoShare = async (p) => {
    const sukName = state.ACTIVE_SUK ? sukLabel(state.ACTIVE_SUK) : 'Satsang Upayojana Kendra'
    const dateStr = p.date ? cleanPhotoDate(p.date) : ''

    const text = [
      '🌸 *Jayguru* 🙏',
      '',
      '━━━━━━━━━━━━━━━━━━━━',
      p.caption
        ? `🪷 *${p.caption}*`
        : '🪷 *A sacred prayer moment*',
      p.uploader ? `🙏 Shared by: ${p.uploader}` : '',
      dateStr    ? `📅 ${dateStr}`                : '',
      '━━━━━━━━━━━━━━━━━━━━',
      '',
      '📸 *Tap below to view the full Prayer Photo Gallery:*',
      galleryUrl,
      '',
      `✨ Come, witness the divine moments captured by our Satsang family 🙏`,
      '',
      `🪷 *${sukName}*`,
    ].filter(l => l !== null && l !== undefined)
     .join('\n')

    // ── Step 1: copy rich text to clipboard immediately ────────
    // Must happen in the same user-gesture tick, before any async work
    try {
      await navigator.clipboard.writeText(text)
    } catch (_) {
      // Clipboard failed silently — still attempt image share
    }

    // ── Step 2: fetch image and share as a File ────────────────
    if (navigator.share && navigator.canShare) {
      try {
        const res  = await fetch(p.url)
        const blob = await res.blob()

        const ext      = blob.type.split('/')[1] || 'jpg'
        const safeName = (p.caption || 'prayer-photo')
          .replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 40)
        const file = new File([blob], `${safeName}.${ext}`, { type: blob.type })

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: '🌸 Jayguru — Prayer Gallery',
            files: [file],
          })
          // Nudge shown after share sheet closes
          alert('✅ Photo shared!\n\n📋 The message & gallery link were copied to your clipboard — paste them in the chat too 🙏')
          return
        }
      } catch (err) {
        if (err.name === 'AbortError') return // user cancelled, do nothing
        // fetch/share failed — fall through to text-only
      }
    }

    // ── Fallback: text-only share (desktop / unsupported browsers) ──
    if (navigator.share) {
      navigator.share({ title: '🌸 Jayguru — Prayer Gallery', text }).catch(() => {})
    } else if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => alert('✅ Message copied! Paste it in WhatsApp to share 🙏'))
        .catch(() => prompt('Copy this:', text))
    } else {
      prompt('Copy this:', text)
    }
  }

  const activeLightboxPhoto = lightbox !== null ? photos[lightbox] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── LIGHTBOX ── */}
      {lightbox !== null && activeLightboxPhoto && (
        <div
          onClick={closeLightbox}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(5,10,30,0.95)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)', border: 'none',
              color: '#fff', fontSize: 20, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10,
            }}>✕</button>

          {/* Counter */}
          <div style={{
            position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700,
            letterSpacing: '1px',
          }}>
            {lightbox + 1} / {photos.length}
          </div>

          {/* Prev arrow */}
          <button
            onClick={prevPhoto}
            disabled={lightbox === 0}
            style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              width: 44, height: 44, borderRadius: '50%',
              background: lightbox === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)',
              border: 'none', color: lightbox === 0 ? 'rgba(255,255,255,0.2)' : '#fff',
              fontSize: 22, cursor: lightbox === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10,
            }}>‹</button>

          {/* Photo */}
          <div onClick={e => e.stopPropagation()} style={{
            maxWidth: '100%', maxHeight: 'calc(100vh - 160px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <img
              src={activeLightboxPhoto.url}
              alt={activeLightboxPhoto.caption || 'Prayer'}
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 200px)',
                objectFit: 'contain',
                borderRadius: 14,
                boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
              }}
            />

            {/* Caption bar */}
            {(activeLightboxPhoto.caption || activeLightboxPhoto.uploader || activeLightboxPhoto.date) && (
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '10px 16px',
                textAlign: 'center', maxWidth: 400, width: '100%',
              }}>
                {activeLightboxPhoto.caption && (
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                    🪷 {activeLightboxPhoto.caption}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
                  {activeLightboxPhoto.uploader && (
                    <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                      🙏 {activeLightboxPhoto.uploader}
                    </span>
                  )}
                  {activeLightboxPhoto.date && (
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                      📅 {cleanPhotoDate(activeLightboxPhoto.date)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Share button inside lightbox */}
            <button
              onClick={() => handlePhotoShare(activeLightboxPhoto)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 28px', borderRadius: 24, border: 'none',
                background: 'linear-gradient(135deg,#25D366,#128C7E)',
                color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(37,211,102,0.4)',
              }}>
              <span style={{ fontSize: 18 }}>💬</span> Share on WhatsApp
            </button>
          </div>

          {/* Next arrow */}
          <button
            onClick={nextPhoto}
            disabled={lightbox === photos.length - 1}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              width: 44, height: 44, borderRadius: '50%',
              background: lightbox === photos.length - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)',
              border: 'none',
              color: lightbox === photos.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff',
              fontSize: 22,
              cursor: lightbox === photos.length - 1 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10,
            }}>›</button>
        </div>
      )}

      {/* Header */}
      <div className="card" style={{ textAlign: 'center', padding: '22px 16px 18px' }}>
        <div style={{
          fontSize: 44, marginBottom: 8,
          filter: 'drop-shadow(0 0 18px rgba(255,160,200,0.5))',
          animation: 'floatEmoji 3s ease-in-out infinite alternate',
        }}>🌸</div>
        <div style={{ fontFamily: "'Cinzel',serif", color: '#1e3a8a', fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
          Prayer Photo Gallery
        </div>
        <div style={{ fontSize: 12, color: 'rgba(29,78,216,0.45)', lineHeight: 1.7 }}>
          Upload & cherish sacred prayer moments
        </div>
        <div className="blue-line" style={{ marginTop: 14 }} />
      </div>

      {/* Upload form */}
      <div className="card">
        <div style={{ fontFamily: "'Cinzel',serif", color: '#1e3a8a', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
          📸 Upload a Photo
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>

          {/* File picker */}
          <div>
            <label className="divine-label">Select Photo</label>
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 8, padding: '20px 16px', borderRadius: 14,
              border: '2px dashed rgba(59,130,246,0.3)',
              background: 'rgba(239,246,255,0.5)', cursor: 'pointer', textAlign: 'center',
            }}>
              {photoUpload.preview ? (
                <img src={photoUpload.preview} alt="preview" style={{
                  maxWidth: '100%', maxHeight: 200, borderRadius: 10,
                  objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }} />
              ) : (
                <>
                  <span style={{ fontSize: 36 }}>🌸</span>
                  <span style={{ fontSize: 13, color: 'rgba(29,78,216,0.5)', fontWeight: 600 }}>
                    Tap to choose a photo
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(29,78,216,0.35)' }}>JPG, PNG up to 5MB</span>
                </>
              )}
              <input type="file" accept="image/*"
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                onChange={handleFileChange} />
            </label>
          </div>

          <div>
            <label className="divine-label">Caption (optional)</label>
            <input className="divine-input" placeholder="e.g. Morning prayer at home, Feb 2026"
              value={photoUpload.caption}
              onChange={e => setPhotoUpload(p => ({ ...p, caption: e.target.value }))} />
          </div>

          <div>
            <label className="divine-label">Your Name <span style={{ color:'#dc2626', fontSize:13 }}>*</span></label>
            <input className="divine-input" placeholder="Enter your name (required)"
              value={photoUpload.uploader}
              onChange={e => setPhotoUpload(p => ({ ...p, uploader: e.target.value }))} />
          </div>

          {photoMsg && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: photoMsg.startsWith('✅') ? '#d1fae5' : '#fef3c7',
              color: photoMsg.startsWith('✅') ? '#065f46' : '#92400e',
            }}>{photoMsg}</div>
          )}

          <button onClick={onUpload} disabled={photoUploading || !photoUpload.file || !photoUpload.uploader.trim()} className="submit-btn">
            {photoUploading ? '⏳ Uploading...' : '🌸 Upload Photo'}
          </button>

          {!isConfigured && (
            <div style={{ fontSize: 11, color: 'rgba(217,119,6,0.7)', textAlign: 'center' }}>
              ⚙️ Configure Script URL to enable uploads
            </div>
          )}
        </div>
      </div>

      {/* Photo grid */}
      <div className="card">
        <div style={{ fontFamily: "'Cinzel',serif", color: '#1e3a8a', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
          🌸 Prayer Photo Gallery
          {photos.length > 0 && (
            <span style={{ fontSize: 11, color: 'rgba(29,78,216,0.45)', fontWeight: 600, marginLeft: 8 }}>
              ({photos.length} photos)
            </span>
          )}
        </div>

        {photosLoading ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'rgba(29,78,216,0.4)', fontSize: 13 }}>
            ⏳ Loading gallery...
          </div>
        ) : photos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 10, filter: 'saturate(0) brightness(2.2)' }}>🪷</div>
            <div style={{ color: 'rgba(29,78,216,0.35)', fontSize: 13 }}>
              No photos yet — be the first to share a sacred moment 🙏
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
            {photos.map((p, i) => (
              <div key={i} style={{
                borderRadius: 12, overflow: 'hidden',
                border: '1px solid rgba(59,130,246,0.15)',
                background: 'rgba(239,246,255,0.4)',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 2px 8px rgba(29,78,216,0.07)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(29,78,216,0.14)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(29,78,216,0.07)' }}
              >
                {/* Tappable photo — opens lightbox */}
                <div
                  onClick={() => openLightbox(i)}
                  style={{ position: 'relative', cursor: 'zoom-in' }}
                >
                  <img
                    src={p.url}
                    alt={p.caption || 'Prayer'}
                    loading="lazy"
                    style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }}
                  />
                  {/* Expand hint overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 50%)',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
                    padding: '8px',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                  >
                    <span style={{
                      background: 'rgba(255,255,255,0.2)', borderRadius: 6,
                      padding: '3px 7px', fontSize: 11, color: '#fff', fontWeight: 700,
                    }}>🔍 View</span>
                  </div>
                </div>

                {/* Caption */}
                {(p.caption || p.uploader || p.date) && (
                  <div style={{ padding: '8px 10px 4px' }}>
                    {p.caption && (
                      <div style={{ fontSize: 11, color: '#1e3a8a', fontWeight: 600, lineHeight: 1.4, marginBottom: 2 }}>
                        {p.caption}
                      </div>
                    )}
                    {p.uploader && (
                      <div style={{ fontSize: 10, color: 'rgba(29,78,216,0.45)' }}>🙏 {p.uploader}</div>
                    )}
                    {p.date && (
                      <div style={{ fontSize: 10, color: 'rgba(29,78,216,0.3)', marginTop: 2 }}>
                        {cleanPhotoDate(p.date)}
                      </div>
                    )}
                  </div>
                )}

                {/* Share button — WhatsApp green */}
                <button
                  onClick={() => handlePhotoShare(p)}
                  style={{
                    marginTop: 'auto', padding: '9px 8px', border: 'none',
                    borderTop: '1px solid rgba(59,130,246,0.08)',
                    background: 'linear-gradient(135deg,rgba(37,211,102,0.12),rgba(18,140,126,0.08))',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 5, fontSize: 11, fontWeight: 800,
                    color: '#128C7E', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,211,102,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg,rgba(37,211,102,0.12),rgba(18,140,126,0.08))'}
                >
                  <span style={{ fontSize: 14 }}>💬</span> Share
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
