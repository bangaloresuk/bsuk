// ============================================================
//  DashboardTab v2 — Admin Devotee Engagement Dashboard
//  Tiers based on BOOKING FREQUENCY (avg gap between bookings)
//  not just total count.
// ============================================================

import React from 'react'

// ── Frequency tiers based on average days between bookings ──
// avg gap < 14d  → Weekly
// avg gap < 35d  → Monthly
// avg gap < 100d → Quarterly
// avg gap < 200d → Half-Yearly
// only 1 booking → One-Time
const getFreqTier = (count, avgGapDays) => {
  if (count === 0) return { label: 'No Data',     short: '—',        color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.2)', icon: '⬜', bar: '#e5e7eb' }
  if (count === 1) return { label: 'One-Time',    short: '1×',       color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)', icon: '🌱', bar: '#d1d5db' }
  if (avgGapDays < 14)  return { label: 'Weekly',      short: '~weekly',  color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)', icon: '⭐', bar: '#a78bfa' }
  if (avgGapDays < 35)  return { label: 'Monthly',     short: '~monthly', color: '#16a34a', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.2)',  icon: '🙏', bar: '#4ade80' }
  if (avgGapDays < 100) return { label: 'Quarterly',   short: '~3 mths',  color: '#d97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.2)',  icon: '🌤️', bar: '#fcd34d' }
  return                        { label: 'Half-Yearly', short: '~6 mths',  color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', icon: '🌸', bar: '#93c5fd' }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  } catch { return dateStr }
}

function avgGap(sortedDates) {
  if (sortedDates.length < 2) return 9999
  let total = 0
  for (let i = 1; i < sortedDates.length; i++) {
    const d1 = new Date(sortedDates[i-1] + 'T00:00:00')
    const d2 = new Date(sortedDates[i]   + 'T00:00:00')
    total += (d2 - d1) / 86400000
  }
  return Math.round(total / (sortedDates.length - 1))
}

export default function DashboardTab({ bookings, satsangBookings }) {
  const [filterBy,  setFilterBy]  = React.useState('all')
  const [sortBy,    setSortBy]    = React.useState('count')
  const [search,    setSearch]    = React.useState('')
  const [copied,    setCopied]    = React.useState(null)
  const [expanded,  setExpanded]  = React.useState(null)

  // ── Build per-person stats from real data ────────────────
  const stats = React.useMemo(() => {
    const map = {}

    const add = (b, type) => {
      const mob  = String(b.mobile || '').trim().replace(/\D/g, '')
      const name = String(b.name   || '').trim()
      const date = String(b.date   || '').trim()
      if (!mob || mob.length < 5) return

      if (!map[mob]) {
        map[mob] = { mobile: mob, name, prayerDates: [], satsangDates: [] }
      }
      // Keep the most recently seen name (non-empty)
      if (name) map[mob].name = name

      if (type === 'prayer')  map[mob].prayerDates.push(date)
      if (type === 'satsang') map[mob].satsangDates.push(date)
    }

    bookings.forEach(b        => add(b, 'prayer'))
    satsangBookings.forEach(b => add(b, 'satsang'))

    return Object.values(map).map(p => {
      const allDates = [...p.prayerDates, ...p.satsangDates].sort()
      const gap      = avgGap(allDates)
      const tier     = getFreqTier(allDates.length, gap)
      return {
        ...p,
        total:     allDates.length,
        pCount:    p.prayerDates.length,
        sCount:    p.satsangDates.length,
        allDates,
        firstDate: allDates[0]   || '',
        lastDate:  allDates[allDates.length - 1] || '',
        avgGap:    gap,
        tier,
      }
    })
  }, [bookings, satsangBookings])

  const maxCount = Math.max(1, ...stats.map(s => s.total))

  // ── Summary numbers ──────────────────────────────────────
  const totalBookings   = bookings.length + satsangBookings.length
  const totalDevotees   = stats.length
  const activeThisMonth = React.useMemo(() => {
    const ym = new Date().toISOString().slice(0, 7)
    return stats.filter(s => s.allDates.some(d => d.startsWith(ym))).length
  }, [stats])

  // ── Tier counts ──────────────────────────────────────────
  const tierCounts = React.useMemo(() => {
    const c = { weekly: 0, monthly: 0, quarterly: 0, 'half-yearly': 0, 'one-time': 0 }
    stats.forEach(s => {
      const key = s.tier.label.toLowerCase()
      if (c[key] !== undefined) c[key]++
    })
    return c
  }, [stats])

  const FILTERS = [
    { id: 'all',          label: 'All',           count: totalDevotees },
    { id: 'weekly',       label: '⭐ Weekly',      count: tierCounts['weekly'] },
    { id: 'monthly',      label: '🙏 Monthly',     count: tierCounts['monthly'] },
    { id: 'quarterly',    label: '🌤️ Quarterly',   count: tierCounts['quarterly'] },
    { id: 'half-yearly',  label: '🌸 Half-Yearly', count: tierCounts['half-yearly'] },
    { id: 'one-time',     label: '🌱 One-Time',    count: tierCounts['one-time'] },
  ]

  // ── Filter + sort ────────────────────────────────────────
  const displayed = React.useMemo(() => {
    let list = [...stats]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.mobile.includes(q))
    }
    if (filterBy !== 'all') {
      list = list.filter(s => s.tier.label.toLowerCase() === filterBy)
    }
    if (sortBy === 'count')  list.sort((a, b) => b.total - a.total)
    if (sortBy === 'recent') list.sort((a, b) => (b.lastDate || '').localeCompare(a.lastDate || ''))
    if (sortBy === 'freq')   list.sort((a, b) => a.avgGap - b.avgGap)
    if (sortBy === 'name')   list.sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [stats, search, filterBy, sortBy])

  const copyMobile = (mob) => {
    navigator.clipboard?.writeText(mob).then(() => {
      setCopied(mob); setTimeout(() => setCopied(null), 2000)
    })
  }

  const copyAll = () => {
    const nums = displayed.map(s => s.mobile).join('\n')
    navigator.clipboard?.writeText(nums).then(() => {
      setCopied('__all__'); setTimeout(() => setCopied(null), 2500)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div className="card" style={{ textAlign: 'center', padding: '20px 16px 16px' }}>
        <div style={{ fontSize: 44, marginBottom: 6,
          filter: 'drop-shadow(0 0 14px rgba(124,58,237,0.4))',
          animation: 'floatEmoji 3s ease-in-out infinite alternate' }}>📊</div>
        <div style={{ fontFamily: "'Cinzel',serif", color: '#1e3a8a', fontSize: 17, fontWeight: 800, marginBottom: 4 }}>
          Devotee Dashboard
        </div>
        <div style={{ fontSize: 12, color: 'rgba(29,78,216,0.45)', lineHeight: 1.7 }}>
          Booking frequency per devotee — weekly, monthly, quarterly 🙏
        </div>
        <div className="blue-line" style={{ marginTop: 14 }} />
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'Total Bookings', value: totalBookings,    icon: '📖', color: '#1d4ed8', bg: 'rgba(29,78,216,0.07)' },
          { label: 'Devotees',       value: totalDevotees,    icon: '🙏', color: '#7c3aed', bg: 'rgba(124,58,237,0.07)' },
          { label: 'Active This Mo', value: activeThisMonth,  icon: '🌸', color: '#16a34a', bg: 'rgba(22,163,74,0.07)' },
        ].map(s => (
          <div key={s.label} style={{ borderRadius: 14, padding: '14px 8px', textAlign: 'center',
            background: s.bg, border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: s.color, fontFamily: "'Cinzel',serif" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: s.color, fontWeight: 700, opacity: 0.7, marginTop: 2, lineHeight: 1.3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Frequency legend */}
      <div className="card" style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 11, color: 'rgba(29,78,216,0.5)', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>
          Booking Frequency Levels
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[
            { icon: '⭐', label: 'Weekly',      color: '#7c3aed', desc: 'Books every ~1–2 weeks' },
            { icon: '🙏', label: 'Monthly',     color: '#16a34a', desc: 'Books every ~3–4 weeks' },
            { icon: '🌤️', label: 'Quarterly',   color: '#d97706', desc: 'Books every ~2–3 months' },
            { icon: '🌸', label: 'Half-Yearly', color: '#3b82f6', desc: 'Books every ~4–6 months' },
            { icon: '🌱', label: 'One-Time',    color: '#6b7280', desc: 'Booked only once so far' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{l.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: l.color, minWidth: 80 }}>{l.label}</span>
              <span style={{ fontSize: 11, color: '#6b7280' }}>{l.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilterBy(f.id)}
            style={{
              flexShrink: 0, padding: '7px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: filterBy === f.id ? '#1d4ed8' : 'rgba(239,246,255,0.9)',
              color: filterBy === f.id ? '#fff' : 'rgba(29,78,216,0.6)',
              fontWeight: 700, fontSize: 12,
              boxShadow: filterBy === f.id ? '0 3px 10px rgba(29,78,216,0.25)' : 'none',
              transition: 'all 0.18s',
            }}>
            {f.label} <span style={{ opacity: 0.7, marginLeft: 3 }}>({f.count})</span>
          </button>
        ))}
      </div>

      {/* Search + Sort + Copy All */}
      <div className="card" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <input className="divine-input"
            placeholder="🔍  Search by name or mobile..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 14, fontSize: 13 }}
          />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 15,
                color: 'rgba(29,78,216,0.4)' }}>✕</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, flex: 1 }}>
            {[['count','Most Booked'],['freq','Most Frequent'],['recent','Recent'],['name','A–Z']].map(([id, label]) => (
              <button key={id} onClick={() => setSortBy(id)}
                style={{
                  flex: 1, padding: '6px 2px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 10, fontWeight: 700,
                  background: sortBy === id ? 'rgba(29,78,216,0.1)' : 'rgba(239,246,255,0.8)',
                  color: sortBy === id ? '#1d4ed8' : 'rgba(29,78,216,0.45)',
                  borderBottom: sortBy === id ? '2px solid #1d4ed8' : '2px solid transparent',
                }}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={copyAll}
            style={{
              padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(29,78,216,0.2)',
              background: copied === '__all__' ? '#d1fae5' : 'rgba(239,246,255,0.9)',
              color: copied === '__all__' ? '#065f46' : '#1d4ed8',
              fontWeight: 700, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}>
            {copied === '__all__' ? '✅ Copied!' : `📋 Copy All (${displayed.length})`}
          </button>
        </div>
      </div>

      {/* Devotee cards */}
      {displayed.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 10, filter: 'saturate(0) brightness(2.2)' }}>🪷</div>
          <div style={{ color: 'rgba(29,78,216,0.35)', fontSize: 13 }}>No devotees found</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayed.map((s, idx) => {
            const { tier } = s
            const pct     = Math.round((s.total / maxCount) * 100)
            const isExp   = expanded === s.mobile

            return (
              <div key={s.mobile}
                onClick={() => setExpanded(isExp ? null : s.mobile)}
                style={{
                  borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                  border: `1px solid ${tier.border}`,
                  background: tier.bg,
                  boxShadow: isExp ? '0 4px 18px rgba(29,78,216,0.12)' : 'none',
                  transition: 'box-shadow 0.15s',
                }}>

                <div style={{ height: 3, background: `linear-gradient(90deg,${tier.color},${tier.color}44)` }} />

                <div style={{ padding: '12px 14px' }}>
                  {/* Row 1: rank + name + tier badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(29,78,216,0.3)',
                      minWidth: 22, textAlign: 'center' }}>#{idx+1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Cinzel',serif", fontWeight: 800,
                        color: '#1e3a8a', fontSize: 14, whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.name || '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(29,78,216,0.4)', marginTop: 1 }}>
                        📱 {s.mobile}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
                        background: `${tier.color}18`, color: tier.color,
                        border: `1px solid ${tier.color}44`, whiteSpace: 'nowrap',
                      }}>
                        {tier.icon} {tier.label}
                      </span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: tier.color }}>
                        {s.total}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 5, borderRadius: 4, background: '#e5e7eb', overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{
                      height: '100%', borderRadius: 4, width: `${pct}%`,
                      background: `linear-gradient(90deg,${tier.color},${tier.color}88)`,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>

                  {/* Row 2: mini stats */}
                  <div style={{ display: 'flex', gap: 6, fontSize: 11, flexWrap: 'wrap', alignItems: 'center' }}>
                    {s.pCount > 0 && (
                      <span style={{ background: 'rgba(29,78,216,0.07)', borderRadius: 8,
                        padding: '2px 8px', fontWeight: 700, color: '#1d4ed8' }}>
                        🙏 {s.pCount} Prayer
                      </span>
                    )}
                    {s.sCount > 0 && (
                      <span style={{ background: 'rgba(217,119,6,0.09)', borderRadius: 8,
                        padding: '2px 8px', fontWeight: 700, color: '#d97706' }}>
                        🪔 {s.sCount} Satsang
                      </span>
                    )}
                    {s.total >= 2 && (
                      <span style={{ marginLeft: 'auto', fontSize: 11,
                        color: tier.color, fontWeight: 700 }}>
                        ~{s.avgGap}d avg
                      </span>
                    )}
                    {s.lastDate && (
                      <span style={{ color: 'rgba(29,78,216,0.4)', fontWeight: 600, fontSize: 10 }}>
                        Last: {formatDate(s.lastDate)}
                      </span>
                    )}
                  </div>

                  {/* Expanded detail */}
                  {isExp && (
                    <div style={{ marginTop: 12, paddingTop: 12,
                      borderTop: `1px solid ${tier.border}` }}
                      onClick={e => e.stopPropagation()}>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                        {s.firstDate && (
                          <div style={{ fontSize: 12, color: '#6b7280' }}>
                            📅 First booking: <strong>{formatDate(s.firstDate)}</strong>
                          </div>
                        )}
                        {s.lastDate && (
                          <div style={{ fontSize: 12, color: '#6b7280' }}>
                            📅 Last booking: <strong>{formatDate(s.lastDate)}</strong>
                          </div>
                        )}
                        {s.total >= 2 && (
                          <div style={{ fontSize: 12, color: '#6b7280' }}>
                            📊 Avg gap: <strong style={{ color: tier.color }}>{s.avgGap} days ({tier.short})</strong>
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                          📖 Total: <strong>{s.total} booking{s.total !== 1 ? 's' : ''}</strong>
                          {s.pCount > 0 && s.sCount > 0 && (
                            <span style={{ color: 'rgba(29,78,216,0.45)' }}> ({s.pCount} prayer · {s.sCount} satsang)</span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => copyMobile(s.mobile)}
                          style={{
                            flex: 1, padding: '10px', border: 'none', borderRadius: 10,
                            background: copied === s.mobile ? '#d1fae5' : 'rgba(29,78,216,0.08)',
                            color: copied === s.mobile ? '#065f46' : '#1d4ed8',
                            fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
                          }}>
                          {copied === s.mobile ? '✅ Copied!' : '📋 Copy Mobile'}
                        </button>
                        <a href={`https://wa.me/91${s.mobile}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{
                            flex: 1, padding: '10px', borderRadius: 10, textDecoration: 'none',
                            background: 'linear-gradient(135deg,rgba(37,211,102,0.15),rgba(18,140,126,0.1))',
                            color: '#128C7E', fontWeight: 700, fontSize: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            border: '1px solid rgba(37,211,102,0.3)',
                          }}>
                          💬 WhatsApp
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(29,78,216,0.35)',
        padding: '8px 0 4px', lineHeight: 1.7 }}>
        Tap any card to expand · Frequency based on avg gap between bookings 🙏
      </div>
    </div>
  )
}
