// ============================================================
//  DashboardTab — Analytics Dashboard (Admin only)
//  ─────────────────────────────────────────────────────────
//  Props:
//    bookings        — prayer bookings array from App state
//    satsangBookings — satsang bookings array from App state
//
//  Pages:
//    1. Executive Summary  — KPIs, morning/evening, day of week
//    2. Member Analytics   — top members, booking frequency
//    3. Monthly Trends     — line chart across all months
//    4. Upcoming           — next 30 days calendar view
// ============================================================

import React from 'react'

// ── Chart.js loaded via CDN in index.html — imported lazily ──
// We load it once the component mounts to avoid SSR issues

const BLUE   = '#1d4ed8'
const TEAL   = '#0f6e56'
const AMBER  = '#b45309'
const CORAL  = '#b91c1c'
const PURPLE = '#6d28d9'

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getTodayStr() {
  const t = new Date(); t.setHours(0,0,0,0)
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`
}

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatDateWithDay(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' })
}

function initials(name) {
  const parts = (name || '').trim().split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (name || '??').substring(0, 2).toUpperCase()
}

const AVATAR_BG   = ['#bfdbfe','#a7f3d0','#fed7aa','#ddd6fe','#fecaca','#d1fae5','#fde68a','#e0e7ff']
const AVATAR_TEXT = ['#1e40af','#065f46','#92400e','#4c1d95','#991b1b','#064e3b','#78350f','#3730a3']

// ── Tiny inline chart using canvas ───────────────────────────
function MiniBarChart({ data, labels, color = BLUE, height = 100 }) {
  const canvasRef = React.useRef(null)
  const chartRef  = React.useRef(null)

  React.useEffect(() => {
    if (!canvasRef.current || !window.Chart) return
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }
    chartRef.current = new window.Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: color + 'cc',
          borderRadius: 4,
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#6b7280', maxRotation: 0 } },
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 10 }, color: '#6b7280', stepSize: 1 } },
        },
      },
    })
    return () => { if (chartRef.current) chartRef.current.destroy() }
  }, [JSON.stringify(data), JSON.stringify(labels), color])

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <canvas ref={canvasRef}
        role="img"
        aria-label={`Bar chart: ${labels.join(', ')}`}
      />
    </div>
  )
}

function MiniDoughnut({ morning, evening }) {
  const canvasRef = React.useRef(null)
  const chartRef  = React.useRef(null)

  React.useEffect(() => {
    if (!canvasRef.current || !window.Chart) return
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }
    chartRef.current = new window.Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Morning', 'Evening'],
        datasets: [{
          data: [morning, evening],
          backgroundColor: ['#1d4ed8cc', '#d97706cc'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
      },
    })
    return () => { if (chartRef.current) chartRef.current.destroy() }
  }, [morning, evening])

  return (
    <div style={{ position: 'relative', width: '100%', height: 140 }}>
      <canvas ref={canvasRef} role="img" aria-label={`Morning ${morning} Evening ${evening}`} />
    </div>
  )
}

function MiniLineChart({ data, labels, color = PURPLE, height = 140 }) {
  const canvasRef = React.useRef(null)
  const chartRef  = React.useRef(null)

  React.useEffect(() => {
    if (!canvasRef.current || !window.Chart) return
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }
    chartRef.current = new window.Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: color,
          backgroundColor: color + '18',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: color,
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#6b7280' } },
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 10 }, color: '#6b7280', stepSize: 1 } },
        },
      },
    })
    return () => { if (chartRef.current) chartRef.current.destroy() }
  }, [JSON.stringify(data), JSON.stringify(labels), color])

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <canvas ref={canvasRef} role="img" aria-label={`Line chart: ${labels.join(', ')}`} />
    </div>
  )
}

// ── Load Chart.js from CDN once ───────────────────────────────
function useChartJs() {
  const [ready, setReady] = React.useState(!!window.Chart)
  React.useEffect(() => {
    if (window.Chart) { setReady(true); return }
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
    s.onload = () => setReady(true)
    document.head.appendChild(s)
  }, [])
  return ready
}

// ── KPI Card ─────────────────────────────────────────────────
function KPICard({ label, value, sub, color = BLUE }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.75)',
      borderRadius: 14,
      padding: '14px 16px',
      border: '1px solid rgba(59,130,246,0.15)',
      flex: '1 1 130px',
    }}>
      <div style={{ fontSize: 11, color: 'rgba(29,78,216,0.5)', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: "'Cinzel', serif",
        lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: 'rgba(29,78,216,0.4)', marginTop: 5 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

// ── Section header ────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(29,78,216,0.45)',
      textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 }}>
      {children}
    </div>
  )
}

// ── Card wrapper ──────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.75)',
      borderRadius: 16,
      padding: '16px',
      border: '1px solid rgba(59,130,246,0.15)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  Main DashboardTab component
// ════════════════════════════════════════════════════════════
export default function DashboardTab({ bookings = [], satsangBookings = [] }) {
  const chartReady = useChartJs()
  const [page, setPage] = React.useState('exec') // exec | members | trends | upcoming
  const today = getTodayStr()

  // ── Derived analytics ─────────────────────────────────────
  const analytics = React.useMemo(() => {
    const total   = bookings.length
    const morning = bookings.filter(b => b.time === 'Morning').length
    const evening = bookings.filter(b => b.time === 'Evening').length

    // Member map keyed by mobile
    const memberMap = {}
    bookings.forEach(b => {
      const k = b.mobile || b.name
      if (!memberMap[k]) memberMap[k] = { name: b.name, mobile: b.mobile || '', count: 0, dates: [] }
      memberMap[k].count++
      memberMap[k].dates.push(b.date)
    })
    const members = Object.values(memberMap).sort((a, b) => b.count - a.count)
    const uniqueMembers = members.length
    const avgPerMonth = (() => {
      const months = new Set(bookings.map(b => (b.date || '').slice(0, 7)).filter(Boolean))
      return months.size > 0 ? Math.round(total / months.size) : 0
    })()

    // Day of week counts (0=Sun…6=Sat)
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]
    bookings.forEach(b => {
      if (b.date) dayCounts[new Date(b.date + 'T00:00:00').getDay()]++
    })

    // Monthly counts — all months with data
    const monthMap = {}
    bookings.forEach(b => {
      const m = (b.date || '').slice(0, 7)
      if (m) monthMap[m] = (monthMap[m] || 0) + 1
    })
    const sortedMonths = Object.keys(monthMap).sort()
    const monthLabels  = sortedMonths.map(m => {
      const [, mm] = m.split('-')
      return MONTH_SHORT[parseInt(mm, 10) - 1]
    })
    const monthData = sortedMonths.map(m => monthMap[m])

    // Upcoming next 30 days
    const in30 = new Date(today); in30.setDate(in30.getDate() + 30)
    const in30Str = in30.toISOString().slice(0, 10)
    const upcoming = bookings
      .filter(b => b.date >= today && b.date <= in30Str)
      .sort((a, b) => a.date.localeCompare(b.date))

    return { total, morning, evening, uniqueMembers, avgPerMonth,
      dayCounts, monthLabels, monthData, sortedMonths, members, upcoming }
  }, [bookings, today])

  const NAV = [
    { id: 'exec',     label: '📊 Summary' },
    { id: 'members',  label: '🪷 Members' },
    { id: 'trends',   label: '📈 Trends' },
    { id: 'upcoming', label: '🗓️ Upcoming' },
  ]

  const navStyle = (id) => ({
    flex: 1,
    padding: '9px 4px',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    fontFamily: "'Cinzel', serif",
    fontSize: 11,
    fontWeight: 800,
    transition: 'all 0.18s',
    background: page === id
      ? 'linear-gradient(135deg, #1e3a8a, #3b82f6)'
      : 'rgba(239,246,255,0.7)',
    color: page === id ? '#fff' : 'rgba(29,78,216,0.55)',
    boxShadow: page === id ? '0 3px 12px rgba(29,78,216,0.25)' : 'none',
    letterSpacing: '0.3px',
    whiteSpace: 'nowrap',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Header ── */}
      <Card>
        <div style={{ textAlign: 'center', paddingBottom: 4 }}>
          <div style={{ fontSize: 36, marginBottom: 6,
            filter: 'drop-shadow(0 0 14px rgba(29,78,216,0.3))',
            animation: 'floatEmoji 3s ease-in-out infinite alternate' }}>📊</div>
          <div style={{ fontFamily: "'Cinzel', serif", color: '#1e3a8a',
            fontSize: 17, fontWeight: 800 }}>
            Devotee Analytics
          </div>
          <div style={{ fontSize: 12, color: 'rgba(29,78,216,0.45)', marginTop: 4, lineHeight: 1.6 }}>
            {bookings.length} prayer bookings · {analytics.uniqueMembers} unique devotees
          </div>
          <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(59,130,246,0.3),transparent)',
            marginTop: 14 }} />
        </div>
      </Card>

      {/* ── Nav tabs ── */}
      <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.6)',
        borderRadius: 14, padding: 5, border: '1px solid rgba(59,130,246,0.15)' }}>
        {NAV.map(n => (
          <button key={n.id} style={navStyle(n.id)} onClick={() => setPage(n.id)}>
            {n.label}
          </button>
        ))}
      </div>

      {/* ════════ EXECUTIVE SUMMARY ════════ */}
      {page === 'exec' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* KPI row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <KPICard label="Total bookings"   value={analytics.total}         sub="all time"                  color={BLUE}   />
            <KPICard label="Unique devotees"  value={analytics.uniqueMembers} sub="registered"               color={TEAL}   />
            <KPICard label="Avg / month"      value={analytics.avgPerMonth}   sub="bookings per month"        color={PURPLE} />
            <KPICard label="Upcoming"         value={analytics.upcoming.length} sub="next 30 days"             color={AMBER}  />
          </div>

          {/* Morning vs Evening */}
          <Card>
            <SectionTitle>Morning vs Evening</SectionTitle>
            {chartReady
              ? <MiniDoughnut morning={analytics.morning} evening={analytics.evening} />
              : <div style={{ height: 140, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'rgba(29,78,216,0.3)', fontSize: 13 }}>Loading chart…</div>
            }
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20,
              marginTop: 12, fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2,
                  background: '#1d4ed8', display: 'inline-block' }} />
                <span style={{ color: '#1e3a8a', fontWeight: 700 }}>
                  Morning — {analytics.morning} ({Math.round(analytics.morning / (analytics.total || 1) * 100)}%)
                </span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2,
                  background: '#d97706', display: 'inline-block' }} />
                <span style={{ color: '#92400e', fontWeight: 700 }}>
                  Evening — {analytics.evening} ({Math.round(analytics.evening / (analytics.total || 1) * 100)}%)
                </span>
              </span>
            </div>
          </Card>

          {/* Day of week */}
          <Card>
            <SectionTitle>Bookings by day of week</SectionTitle>
            {chartReady
              ? <MiniBarChart
                  data={analytics.dayCounts}
                  labels={['Sun','Mon','Tue','Wed','Thu','Fri','Sat']}
                  color={TEAL}
                  height={120}
                />
              : <div style={{ height: 120, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'rgba(29,78,216,0.3)', fontSize: 13 }}>Loading…</div>
            }
            {(() => {
              const max = Math.max(...analytics.dayCounts)
              const peak = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][analytics.dayCounts.indexOf(max)]
              return (
                <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(29,78,216,0.6)',
                  textAlign: 'center', fontWeight: 600 }}>
                  🏆 Busiest day: <span style={{ color: BLUE, fontWeight: 800 }}>{peak}</span> ({max} bookings)
                </div>
              )
            })()}
          </Card>

        </div>
      )}

      {/* ════════ MEMBER ANALYTICS ════════ */}
      {page === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <Card>
            <SectionTitle>Top active devotees</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {analytics.members.slice(0, 20).map((m, i) => {
                const ci  = i % AVATAR_BG.length
                const pct = Math.round(m.count / (analytics.members[0]?.count || 1) * 100)
                return (
                  <div key={m.mobile + m.name + i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 0',
                    borderBottom: i < Math.min(analytics.members.length - 1, 19)
                      ? '1px solid rgba(59,130,246,0.08)' : 'none',
                  }}>
                    {/* Rank */}
                    <div style={{ width: 20, fontSize: 11, fontWeight: 800,
                      color: i < 3 ? '#d97706' : 'rgba(29,78,216,0.35)',
                      textAlign: 'center', flexShrink: 0 }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                    </div>
                    {/* Avatar */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: AVATAR_BG[ci], color: AVATAR_TEXT[ci],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800,
                    }}>
                      {initials(m.name)}
                    </div>
                    {/* Name + mobile */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 700,
                        color: '#1e3a8a', fontSize: 13, whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.name}
                      </div>
                      {m.mobile && (
                        <div style={{ fontSize: 11, color: 'rgba(29,78,216,0.4)', marginTop: 2 }}>
                          📱 {m.mobile}
                        </div>
                      )}
                    </div>
                    {/* Bar */}
                    <div style={{ width: 80, flexShrink: 0 }}>
                      <div style={{ height: 5, borderRadius: 3,
                        background: 'rgba(59,130,246,0.1)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3,
                          width: pct + '%', background: AVATAR_BG[ci],
                          transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                    {/* Count */}
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#1e3a8a',
                      minWidth: 28, textAlign: 'right', flexShrink: 0 }}>
                      {m.count}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Stats summary */}
          <Card>
            <SectionTitle>Devotee stats</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {[
                { label: 'Total devotees', value: analytics.uniqueMembers },
                { label: 'Most bookings', value: analytics.members[0]?.count ?? 0,
                  sub: analytics.members[0]?.name },
                { label: 'Avg per devotee', value: analytics.uniqueMembers
                    ? Math.round(analytics.total / analytics.uniqueMembers * 10) / 10 : 0 },
                { label: '5+ bookings', value: analytics.members.filter(m => m.count >= 5).length,
                  sub: 'core devotees' },
              ].map(s => (
                <div key={s.label} style={{
                  flex: '1 1 120px', padding: '12px', borderRadius: 12,
                  background: 'rgba(239,246,255,0.7)', border: '1px solid rgba(59,130,246,0.12)',
                }}>
                  <div style={{ fontSize: 10, color: 'rgba(29,78,216,0.45)', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 6 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: BLUE,
                    fontFamily: "'Cinzel', serif" }}>
                    {s.value}
                  </div>
                  {s.sub && (
                    <div style={{ fontSize: 10, color: 'rgba(29,78,216,0.4)', marginTop: 4,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.sub}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

        </div>
      )}

      {/* ════════ MONTHLY TRENDS ════════ */}
      {page === 'trends' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <Card>
            <SectionTitle>Monthly booking trend</SectionTitle>
            {chartReady && analytics.monthData.length > 0
              ? <MiniLineChart
                  data={analytics.monthData}
                  labels={analytics.monthLabels}
                  color={PURPLE}
                  height={180}
                />
              : <div style={{ height: 180, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'rgba(29,78,216,0.3)', fontSize: 13 }}>
                  {chartReady ? 'No data yet' : 'Loading chart…'}
                </div>
            }
            {analytics.monthData.length > 0 && (() => {
              const max = Math.max(...analytics.monthData)
              const peakIdx = analytics.monthData.indexOf(max)
              return (
                <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(29,78,216,0.6)',
                  textAlign: 'center', fontWeight: 600 }}>
                  🏆 Peak month: <span style={{ color: PURPLE, fontWeight: 800 }}>
                    {analytics.monthLabels[peakIdx]}</span> ({max} bookings)
                </div>
              )
            })()}
          </Card>

          {/* Per month breakdown table */}
          <Card>
            <SectionTitle>Month-by-month breakdown</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {analytics.sortedMonths.map((m, i) => {
                const count = analytics.monthData[i]
                const maxC  = Math.max(...analytics.monthData) || 1
                const pct   = Math.round(count / maxC * 100)
                const [yr, mm] = m.split('-')
                const label = `${MONTH_SHORT[parseInt(mm, 10) - 1]} ${yr}`
                return (
                  <div key={m} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 0',
                    borderBottom: i < analytics.sortedMonths.length - 1
                      ? '1px solid rgba(59,130,246,0.07)' : 'none',
                  }}>
                    <div style={{ width: 62, fontSize: 12, fontWeight: 700,
                      color: '#1e3a8a', flexShrink: 0, fontFamily: "'Cinzel', serif",
                      fontSize: 11 }}>
                      {label}
                    </div>
                    <div style={{ flex: 1, height: 6, borderRadius: 3,
                      background: 'rgba(109,40,217,0.1)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3,
                        width: pct + '%', background: PURPLE + 'bb',
                        transition: 'width 0.4s ease' }} />
                    </div>
                    <div style={{ width: 28, fontSize: 13, fontWeight: 900,
                      color: PURPLE, textAlign: 'right', flexShrink: 0 }}>
                      {count}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

        </div>
      )}

      {/* ════════ UPCOMING ════════ */}
      {page === 'upcoming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <Card>
            <SectionTitle>Next 30 days — {analytics.upcoming.length} bookings</SectionTitle>
            {analytics.upcoming.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0',
                color: 'rgba(29,78,216,0.3)', fontSize: 13 }}>
                No upcoming bookings in the next 30 days 🙏
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {analytics.upcoming.map((b, i) => {
                  const d   = new Date(b.date + 'T00:00:00')
                  const day = d.getDate()
                  const mon = MONTH_SHORT[d.getMonth()]
                  const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]
                  const isToday = b.date === today
                  const isMorning = b.time === 'Morning'
                  return (
                    <div key={b.id || b.date + b.name + i} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 0',
                      borderBottom: i < analytics.upcoming.length - 1
                        ? '1px solid rgba(59,130,246,0.08)' : 'none',
                    }}>
                      {/* Date box */}
                      <div style={{
                        background: isToday
                          ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)'
                          : 'rgba(239,246,255,0.9)',
                        borderRadius: 12, padding: '7px 10px',
                        textAlign: 'center', minWidth: 48, flexShrink: 0,
                        border: isToday ? 'none' : '1px solid rgba(59,130,246,0.15)',
                      }}>
                        <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1,
                          color: isToday ? '#fff' : '#1e3a8a',
                          fontFamily: "'Cinzel', serif" }}>
                          {day}
                        </div>
                        <div style={{ fontSize: 9, marginTop: 2, fontWeight: 700,
                          color: isToday ? 'rgba(255,255,255,0.8)' : 'rgba(29,78,216,0.5)',
                          letterSpacing: '0.5px' }}>
                          {mon}
                        </div>
                      </div>
                      {/* Name + details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 700,
                          color: '#1e3a8a', fontSize: 13,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {b.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(29,78,216,0.45)',
                          marginTop: 2 }}>
                          {dow}{isToday ? ' · Today' : ''}
                        </div>
                      </div>
                      {/* Slot badge */}
                      <span style={{
                        fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 700,
                        flexShrink: 0,
                        background: isMorning ? '#dbeafe' : '#fef3c7',
                        color: isMorning ? '#1d4ed8' : '#92400e',
                      }}>
                        {isMorning ? '🌅' : '🌙'} {b.time}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Upcoming by month summary */}
          {(() => {
            const monthBuckets = {}
            analytics.upcoming.forEach(b => {
              const m = (b.date || '').slice(0, 7)
              if (!monthBuckets[m]) monthBuckets[m] = 0
              monthBuckets[m]++
            })
            const bucketKeys = Object.keys(monthBuckets).sort()
            if (bucketKeys.length <= 1) return null
            return (
              <Card>
                <SectionTitle>Upcoming by month</SectionTitle>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {bucketKeys.map(m => {
                    const [yr, mm] = m.split('-')
                    return (
                      <div key={m} style={{
                        padding: '8px 14px', borderRadius: 12,
                        background: 'rgba(239,246,255,0.9)',
                        border: '1px solid rgba(59,130,246,0.15)',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 11, color: 'rgba(29,78,216,0.5)',
                          fontWeight: 700, fontFamily: "'Cinzel', serif" }}>
                          {MONTH_SHORT[parseInt(mm, 10) - 1]}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: BLUE,
                          fontFamily: "'Cinzel', serif" }}>
                          {monthBuckets[m]}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })()}

        </div>
      )}

      {/* Footer ornament */}
      <div style={{ textAlign: 'center', padding: '10px 0 6px',
        color: 'rgba(29,78,216,0.25)', fontSize: 11, letterSpacing: 8 }}>
        ✦ ✦ ✦
      </div>

    </div>
  )
}
