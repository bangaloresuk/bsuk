// ============================================================
//  PrayerTimesTab — Annual prayer timetable (read-only)
//  No props needed. Reads PRAYER_TIMES constant directly.
// ============================================================

import React from 'react'
import { PRAYER_TIMES, MONTH_NAMES } from '../../config/prayerTimes.js'
import { BlueDivider } from '../shared/BlueDivider.jsx'

const blueText  = { color: '#1e3a8a' }
const mutedBlue = { color: 'rgba(30,64,175,0.6)' }

export default function PrayerTimesTab() {
  const currentMonth = new Date().getMonth() + 1
  const currentTimes = PRAYER_TIMES[currentMonth]

  return (
    <div className="card">

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: "'Cinzel', serif", ...blueText, fontSize: 17, fontWeight: 700 }}>
          Bangalore Urban, Karnataka
        </div>
        <div style={{ ...mutedBlue, fontSize: 11, marginTop: 4, letterSpacing: '1px' }}>
          Annual Prayer Timetable · satsang.org.in
        </div>
        <BlueDivider />
      </div>

      {/* Current month highlight */}
      <div style={{
        background: '#eff6ff', border: '1px solid rgba(59,130,246,0.3)',
        borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center',
      }}>
        <div style={{ ...mutedBlue, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '1.5px', marginBottom: 14 }}>
          ⭐ {MONTH_NAMES[currentMonth]} — Current Month
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
          <div>
            <div style={{ fontSize: 12, color: '#d97706', fontWeight: 700, marginBottom: 6 }}>🌅 Morning</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 28, fontWeight: 900, color: '#d97706' }}>
              {currentTimes.Morning}
            </div>
          </div>
          <div style={{ width: 1, background: 'rgba(59,130,246,0.2)' }} />
          <div>
            <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 700, marginBottom: 6 }}>🌙 Evening</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 28, fontWeight: 900, color: '#7c3aed' }}>
              {currentTimes.Evening}
            </div>
          </div>
        </div>
      </div>

      {/* Full year table */}
      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(59,130,246,0.15)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          background: 'rgba(29,78,216,0.9)', padding: '10px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px' }}>Month</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#fde68a', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>🌅 Morning</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>🌙 Evening</div>
        </div>
        {Object.entries(PRAYER_TIMES).map(([month, times]) => {
          const isCurrent = parseInt(month) === currentMonth
          return (
            <div key={month} style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              padding: '11px 16px',
              background: isCurrent ? '#dbeafe' : parseInt(month) % 2 === 0 ? '#f8faff' : '#fff',
              borderBottom: '1px solid rgba(59,130,246,0.08)',
            }}>
              <div style={{ fontSize: 13, fontWeight: isCurrent ? 800 : 500, color: isCurrent ? '#1d4ed8' : '#6b7280' }}>
                {isCurrent ? '⭐ ' : ''}{MONTH_NAMES[month]}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#d97706', textAlign: 'center' }}>{times.Morning}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed', textAlign: 'center' }}>{times.Evening}</div>
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: 11, color: 'rgba(59,130,246,0.4)', marginTop: 14, textAlign: 'center', lineHeight: 1.6 }}>
        Fixed monthly times · Same every year · Source: satsang.org.in
      </p>
    </div>
  )
}
