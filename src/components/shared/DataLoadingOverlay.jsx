import React from 'react'

// ============================================================
//  QUOTES — Add as many as you want here!
//  Each object has: heading, text, author
//  heading = the bold thematic word shown above the quote
// ============================================================
const QUOTES = [
  {
    heading: "TRUTH",
    text: "That which keeps our being firm and compact is true to us.",
    author: "Shree Shree Thakur Anukulchandra",
  },
  {
    heading: "THE MOTHER OF SUCCESS",
    text: "Verily, I say,doing is the mother of success !",
    author: "Shree Shree Thakur Anukulchandra",
  },
  {
    heading: "THE PULL",
    text: "Nothing has a pull more magnetic than love!",
    author: "Shree Shree Thakur Anukulchandra",
  },
  {
    heading: "THE IDLE",
    text: "The Idle are rickety abortions of ill-fated nature.",
    author: "Shree Shree Thakur Anukulchandra",
  },
]

let _lastIndex = -1
function getRandomQuote() {
  if (QUOTES.length === 1) return QUOTES[0]
  let idx
  do { idx = Math.floor(Math.random() * QUOTES.length) } while (idx === _lastIndex)
  _lastIndex = idx
  return QUOTES[idx]
}

// ── Animated "Loading…" with letter-by-letter glow wave ──────
const LOADING_LABEL = "Loading your Kendra data"

function AnimatedLoadingText() {
  const letters = LOADING_LABEL.split('')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <div style={{ display: 'flex' }}>
        {letters.map((ch, i) => (
          <span key={i} style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: ch === ' ' ? '4px' : '1.6px',
            textTransform: 'uppercase',
            display: 'inline-block',
            animation: 'letterGlow 2.4s ease-in-out infinite',
            animationDelay: (i * 0.07) + 's',
          }}>{ch === ' ' ? '\u00A0' : ch}</span>
        ))}
      </div>
      {/* Three animated dots */}
      <div style={{ display: 'flex', gap: 2, marginLeft: 3, alignItems: 'flex-end', paddingBottom: 1 }}>
        {[0,1,2].map(i => (
          <span key={i} style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 14,
            fontWeight: 900,
            animation: 'letterGlow 2.4s ease-in-out infinite',
            animationDelay: (LOADING_LABEL.length * 0.07 + i * 0.2) + 's',
            lineHeight: 1,
          }}>.</span>
        ))}
      </div>
    </div>
  )
}

/** Full-page overlay with lotus spinner and a beautifully styled spiritual quote */
export function DataLoadingOverlay() {
  const quote = React.useMemo(() => getRandomQuote(), [])
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const t = setTimeout(() => setVisible(true), 180)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #eef4ff 0%, #f5f0ff 50%, #fef9ec 100%)',
      backdropFilter: 'blur(8px)',
      animation: 'fadeSlideIn 0.3s ease-out both',
      padding: '0 24px',
    }}>

      {/* Lotus */}
      <div style={{
        fontSize: 46, marginBottom: 18,
        animation: 'floatEmoji 1.6s ease-in-out infinite alternate',
        filter: 'drop-shadow(0 0 20px rgba(255,180,0,0.6))',
      }}>🪷</div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 28 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
            animation: 'dotPulse 1.3s ease-in-out infinite',
            animationDelay: i * 0.22 + 's',
          }} />
        ))}
      </div>

      {/* Quote card */}
      <div style={{
        maxWidth: 340, width: '100%',
        background: 'rgba(255,255,255,0.82)',
        borderRadius: 20,
        padding: '0 0 22px',
        boxShadow: '0 8px 40px rgba(99,102,241,0.13), 0 1px 0 rgba(255,255,255,0.9) inset',
        border: '1px solid rgba(99,102,241,0.12)',
        textAlign: 'center',
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
        transition: 'opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1)',
        marginBottom: 22,
      }}>

        {/* Heading band */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 60%, #6366f1 100%)',
          padding: '14px 24px 12px',
          marginBottom: 18,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* subtle shimmer stripe */}
          <div style={{
            position: 'absolute', top: 0, left: '-60%', width: '40%', height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
            animation: 'shimmer 2.8s ease-in-out infinite',
          }} />
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 17,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            position: 'relative',
          }}>
            {quote.heading}
          </div>
          {/* thin gold underline */}
          <div style={{
            width: 32, height: 2,
            background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
            borderRadius: 2,
            margin: '7px auto 0',
          }} />
        </div>

        {/* Open-quote mark */}
        <div style={{
          fontFamily: 'Georgia, serif',
          fontSize: 40,
          lineHeight: 1,
          color: '#6366f1',
          opacity: 0.25,
          marginBottom: 2,
          userSelect: 'none',
        }}>❝</div>

        {/* Quote text */}
        <div style={{
          fontFamily: "'Cormorant Garamond', 'Cinzel', Georgia, serif",
          fontSize: 15,
          fontWeight: 500,
          fontStyle: 'italic',
          color: '#1e3a8a',
          lineHeight: 1.75,
          letterSpacing: '0.2px',
          padding: '0 22px',
          marginBottom: 16,
        }}>
          {quote.text}
        </div>

        {/* Divider */}
        <div style={{
          width: 40, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.35), transparent)',
          margin: '0 auto 14px',
        }} />

        {/* Author */}
        <div style={{
          fontSize: 11,
          fontWeight: 900,
          color: '#3730a3',
          letterSpacing: '1.6px',
          textTransform: 'uppercase',
          fontFamily: "'Cinzel', serif",
        }}>
          {quote.author}
        </div>

      </div>

      {/* Animated divine loading text */}
      <AnimatedLoadingText />
      <div style={{ fontSize: 13, color: 'rgba(30,58,138,0.35)', marginTop: 7, letterSpacing: '0.4px' }}>
        Jayguru 🙏
      </div>

      {/* All keyframes */}
      <style>{`
        @keyframes shimmer {
          0%   { left: -60%; }
          100% { left: 160%; }
        }
        @keyframes letterGlow {
          0%, 100% { opacity: 0.35; color: rgba(30,58,138,0.45); }
          50%       { opacity: 1;    color: #4338ca; text-shadow: 0 0 8px rgba(99,102,241,0.5); }
        }
        @keyframes omPulse {
          0%, 100% { opacity: 0.2; transform: scale(1);    }
          50%       { opacity: 0.7; transform: scale(1.18); }
        }
        @keyframes divineFade {
          0%        { opacity: 0; transform: translateY(4px); }
          15%, 85%  { opacity: 1; transform: translateY(0);   }
          100%      { opacity: 0; transform: translateY(-4px);}
        }
      `}</style>

    </div>
  )
}
