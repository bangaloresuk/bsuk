import React from 'react'

// ============================================================
//  QUOTES — Add as many as you want here!
//  Each quote shows randomly on every loading screen.
// ============================================================
const QUOTES = [
  { text: "Where action pursues desire, fulfilment appears immediately with a smile!", author: "Shree Shree Thakur Anukulchandra" },
  { text: "THE PULL Nothing has a pull more magnetic than love!", author: "Shree Shree Thakur Anukulchandra" },
]

// Remembers last shown index across mounts so we never show the same quote twice in a row
let _lastIndex = -1

function getRandomQuote() {
  if (QUOTES.length === 1) return QUOTES[0]
  let idx
  do {
    idx = Math.floor(Math.random() * QUOTES.length)
  } while (idx === _lastIndex)
  _lastIndex = idx
  return QUOTES[idx]
}

/** Full-page overlay with lotus spinner and a random spiritual quote */
export function DataLoadingOverlay() {
  // useMemo with [] runs once per mount — picks a fresh quote every time the overlay appears
  const quote = React.useMemo(() => getRandomQuote(), [])
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(232,240,254,0.92)',
      backdropFilter: 'blur(6px)',
      animation: 'fadeSlideIn 0.3s ease-out both',
      padding: '0 24px',
    }}>

      {/* Lotus spinner */}
      <div style={{
        fontSize: 44, marginBottom: 16,
        animation: 'floatEmoji 1.2s ease-in-out infinite alternate',
        filter: 'drop-shadow(0 0 18px rgba(255,180,0,0.55))',
      }}>🪷</div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 24 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 9, height: 9, borderRadius: '50%', background: '#3b82f6',
            animation: 'dotPulse 1.2s ease-in-out infinite',
            animationDelay: i * 0.2 + 's', opacity: 0.7,
          }} />
        ))}
      </div>

      {/* Quote card */}
      <div style={{
        maxWidth: 340,
        background: 'rgba(255,255,255,0.75)',
        borderRadius: 16,
        padding: '20px 24px',
        boxShadow: '0 4px 24px rgba(29,78,216,0.10)',
        border: '1px solid rgba(29,78,216,0.10)',
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 22, marginBottom: 10, opacity: 0.6 }}>❝</div>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 13,
          fontWeight: 600,
          color: '#1e3a8a',
          lineHeight: 1.7,
          letterSpacing: '0.3px',
          marginBottom: 12,
        }}>
          {quote.text}
        </div>
        <div style={{
          fontSize: 11,
          color: 'rgba(29,78,216,0.5)',
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}>
          — {quote.author}
        </div>
      </div>

      {/* Loading label */}
      <div style={{
        fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700,
        color: 'rgba(29,78,216,0.55)', letterSpacing: '1.5px',
      }}>Loading your Kendra data...</div>
      <div style={{ fontSize: 11, color: 'rgba(29,78,216,0.35)', marginTop: 6, letterSpacing: '0.5px' }}>
        Jayguru 🙏
      </div>

    </div>
  )
}
