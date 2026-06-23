// ============================================================
//  AllBookingsTab — month navigator + date-grouped booking list
// ============================================================
import React from 'react'
import { SLOT_STYLE } from '../../config/prayerTimes.js'
import { getTodayStr, formatDateWithDay, cleanTime } from '../../utils/utils.js'

const TC = {
  satsang: { border:'rgba(217,119,6,0.2)',  bg:'rgba(255,251,235,0.75)', bar:'linear-gradient(90deg,#d97706,#fbbf2455)', name:'#78350f', time:'#d97706', badge:'#92400e', badgeBg:'rgba(217,119,6,0.1)',  adminBg:'rgba(217,119,6,0.07)',  adminBorder:'rgba(217,119,6,0.18)',  adminText:'#92400e', label:'🪔 Satsang',  cancelGrad:'linear-gradient(135deg,#92400e,#d97706)', cancelLabel:'Cancel Satsang' },
  bhadra:  { border:'rgba(109,40,217,0.2)', bg:'rgba(245,243,255,0.75)', bar:'linear-gradient(90deg,#7c3aed,#a78bfa55)', name:'#4c1d95', time:'#7c3aed', badge:'#6d28d9', badgeBg:'rgba(109,40,217,0.1)', adminBg:'rgba(109,40,217,0.07)', adminBorder:'rgba(109,40,217,0.18)', adminText:'#6d28d9', label:'🌸 Bhadra',  cancelGrad:'linear-gradient(135deg,#5b21b6,#7c3aed)', cancelLabel:'Cancel Bhadra' },
  matri:   { border:'rgba(190,24,93,0.2)',  bg:'rgba(253,242,248,0.75)', bar:'linear-gradient(90deg,#db2777,#f472b655)', name:'#831843', time:'#db2777', badge:'#be185d', badgeBg:'rgba(190,24,93,0.1)',  adminBg:'rgba(190,24,93,0.07)',  adminBorder:'rgba(190,24,93,0.18)',  adminText:'#be185d', label:'🌺 Matri',   cancelGrad:'linear-gradient(135deg,#9d174d,#db2777)', cancelLabel:'Cancel Matri' },
  savan:   { border:'rgba(21,128,61,0.2)',  bg:'rgba(240,253,244,0.75)', bar:'linear-gradient(90deg,#16a34a,#4ade8055)', name:'#14532d', time:'#16a34a', badge:'#15803d', badgeBg:'rgba(21,128,61,0.1)',  adminBg:'rgba(21,128,61,0.07)',  adminBorder:'rgba(21,128,61,0.18)',  adminText:'#15803d', label:'🌿 Savan',   cancelGrad:'linear-gradient(135deg,#14532d,#16a34a)', cancelLabel:'Cancel Savan' },
}

export default function AllBookingsTab({
  feat, currentUser,
  bookings, satsangBookings, bhadraBookings, matriBookings, savanBookings,
  allBookingsFilter, setAllBookingsFilter,
  cancelling, handleCancelBooking, handleCancelSpecial,
  buildShareMsg, buildSatsangShareMsg,
  handleCopy, handleSatsangCopy,
}) {
  const todayStr = getTodayStr()
  const nowYM    = todayStr.slice(0, 7)

  const [activeYM,  setActiveYM]  = React.useState(nowYM)
  const [typeTab,   setTypeTab]   = React.useState(allBookingsFilter || 'all')
  const [search,    setSearch]    = React.useState('')
  const [showPast,  setShowPast]  = React.useState(false)
  const [dateFrom,  setDateFrom]  = React.useState('')
  const [dateTo,    setDateTo]    = React.useState('')
  const [showRange, setShowRange] = React.useState(false)

  React.useEffect(() => {
    if (allBookingsFilter && allBookingsFilter !== 'all') {
      setTypeTab(allBookingsFilter)
      // Show all time data by activating a full date range
      setShowRange(true)
      setDateFrom('2020-01-01')
      setDateTo('2099-12-31')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allBookingsFilter])

  React.useEffect(() => {
    const id = setTimeout(() => {
      const upcomingCount = allItems.filter(b =>
        typeTab === 'all' ? true : b._type === typeTab
      ).filter(b => (b.date||'').startsWith(activeYM) && (b.date||'') >= todayStr).length
      const pastCount = allItems.filter(b =>
        typeTab === 'all' ? true : b._type === typeTab
      ).filter(b => (b.date||'').startsWith(activeYM) && (b.date||'') < todayStr).length
      setShowPast(upcomingCount === 0 && pastCount > 0)
    }, 0)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeTab, activeYM])

  const allItems = [
    ...bookings.map(b        => ({ ...b, _type:'prayer'  })),
    ...satsangBookings.map(b => ({ ...b, _type:'satsang' })),
    ...(feat.bhadraBooking ? bhadraBookings.map(b => ({ ...b, _type:'bhadra' })) : []),
    ...(feat.matriBooking  ? matriBookings.map(b  => ({ ...b, _type:'matri'  })) : []),
    ...(feat.savanBooking  ? savanBookings.map(b  => ({ ...b, _type:'savan'  })) : []),
  ]

  const allMonths = React.useMemo(() => {
    const seen = new Set(allItems.map(b => (b.date||'').slice(0,7)).filter(Boolean))
    seen.add(nowYM)
    return Array.from(seen).sort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, satsangBookings, bhadraBookings, matriBookings, savanBookings])

  const monthIdx   = allMonths.indexOf(activeYM)
  const goPrev     = () => { if (monthIdx > 0) setActiveYM(allMonths[monthIdx - 1]) }
  const goNext     = () => { if (monthIdx < allMonths.length - 1) setActiveYM(allMonths[monthIdx + 1]) }
  const monthLabel = new Date(activeYM + '-01T00:00:00').toLocaleDateString('en-IN', { month:'long', year:'numeric' })

  const isSearching   = search.trim().length > 0
  const isRangeActive = showRange && (dateFrom || dateTo)

  const typeMatch = (b) => typeTab === 'all' ? true : b._type === typeTab

  const filtered = allItems.filter(b => {
    if (!typeMatch(b)) return false
    if (isSearching) {
      const q = search.toLowerCase()
      return (b.name||'').toLowerCase().includes(q) || (b.mobile||'').includes(q)
          || (b.venue||'').toLowerCase().includes(q) || (b.place||'').toLowerCase().includes(q)
    }
    if (isRangeActive) {
      const d = b.date || ''
      if (dateFrom && d < dateFrom) return false
      if (dateTo   && d > dateTo)   return false
      return true
    }
    return (b.date||'').startsWith(activeYM) && (b.date||'') >= todayStr
  }).sort((a, b) => (a.date||'').localeCompare(b.date||''))

  const pastFiltered = (isSearching || isRangeActive) ? [] : allItems.filter(b => {
    if (!typeMatch(b)) return false
    return (b.date||'').startsWith(activeYM) && (b.date||'') < todayStr
  }).sort((a, b) => (b.date||'').localeCompare(a.date||''))

  const monthItems = allItems.filter(b => (b.date||'').startsWith(activeYM))
  const upcomingMonthItems = monthItems.filter(b => (b.date||'') >= todayStr)
  // When a date range is active, show counts for that range so they match
  // the header chips and the actual list being displayed.
  // In normal month view, show counts for the active calendar month.
  const countBase = isRangeActive
    ? allItems.filter(b => {
        const d = b.date || ''
        if (dateFrom && d < dateFrom) return false
        if (dateTo   && d > dateTo)   return false
        return true
      })
    : monthItems
  const counts = {
    all:     countBase.length,
    prayer:  countBase.filter(b => b._type==='prayer').length,
    satsang: countBase.filter(b => b._type==='satsang').length,
    bhadra:  countBase.filter(b => b._type==='bhadra').length,
    matri:   countBase.filter(b => b._type==='matri').length,
    savan:   countBase.filter(b => b._type==='savan').length,
  }

  const TYPE_TABS = [
    { id:'all',     label:'All',     icon:'📋', color:'#1e3a8a' },
    { id:'prayer',  label:'Prayer',  icon:'🙏', color:'#1d4ed8' },
    feat.satsangBooking && { id:'satsang', label:'Satsang', icon:'🪔', color:'#92400e' },
    feat.bhadraBooking  && { id:'bhadra',  label:'Bhadra',  icon:'🌸', color:'#6d28d9' },
    feat.matriBooking   && { id:'matri',   label:'Matri',   icon:'🌺', color:'#be185d' },
    feat.savanBooking   && { id:'savan',   label:'Savan',   icon:'🌿', color:'#15803d' },
  ].filter(Boolean)

  // Group upcoming by date
  const groups = {}
  filtered.forEach(b => { const d = b.date||'Unknown'; if (!groups[d]) groups[d]=[]; groups[d].push(b) })
  const sortedDates = Object.keys(groups).sort()

  // Group past by date
  const pastGroups = {}
  pastFiltered.forEach(b => { const d = b.date||'Unknown'; if (!pastGroups[d]) pastGroups[d]=[]; pastGroups[d].push(b) })
  const pastSortedDates = Object.keys(pastGroups).sort((a,b) => b.localeCompare(a))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

      {/* ── Controls card ── */}
      <div className="card" style={{ padding:'14px 16px 14px' }}>

        {/* Month navigator */}
        {isSearching ? (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12,
            padding:'8px 12px', borderRadius:10,
            background:'rgba(29,78,216,0.07)', border:'1px solid rgba(29,78,216,0.15)' }}>
            <span style={{ fontSize:13 }}>🔍</span>
            <span style={{ fontSize:12, color:'rgba(29,78,216,0.65)', fontWeight:700 }}>Searching across all months</span>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <button onClick={goPrev} disabled={monthIdx <= 0}
              style={{ width:36, height:36, borderRadius:'50%', border:'none',
                cursor: monthIdx<=0?'not-allowed':'pointer',
                background: monthIdx<=0?'rgba(59,130,246,0.05)':'rgba(29,78,216,0.1)',
                color: monthIdx<=0?'rgba(29,78,216,0.2)':'#1d4ed8',
                fontSize:16, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:"'Cinzel',serif", fontWeight:900, color:'#1e3a8a', fontSize:16 }}>{monthLabel}</div>
              <div style={{ fontSize:11, color:'rgba(29,78,216,0.45)', marginTop:2 }}>
                {counts.all} booking{counts.all!==1?'s':''} this month
              </div>
            </div>
            <button onClick={goNext} disabled={monthIdx >= allMonths.length - 1}
              style={{ width:36, height:36, borderRadius:'50%', border:'none',
                cursor: monthIdx>=allMonths.length-1?'not-allowed':'pointer',
                background: monthIdx>=allMonths.length-1?'rgba(59,130,246,0.05)':'rgba(29,78,216,0.1)',
                color: monthIdx>=allMonths.length-1?'rgba(29,78,216,0.2)':'#1d4ed8',
                fontSize:16, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
          </div>
        )}

        {/* Type filter pills */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:12 }}>
          {TYPE_TABS.map(t => {
            const active = typeTab === t.id
            return (
              <button key={t.id} onClick={() => { setTypeTab(t.id); setAllBookingsFilter(t.id) }}
                style={{ padding:'8px 4px', borderRadius:12, cursor:'pointer',
                  fontFamily:"'Cinzel',serif", fontSize:10, fontWeight:800, transition:'all 0.18s',
                  background: active ? `linear-gradient(135deg,${t.color}dd,${t.color})` : 'rgba(239,246,255,0.7)',
                  color: active ? '#fff' : 'rgba(29,78,216,0.5)',
                  boxShadow: active ? `0 3px 12px ${t.color}44` : 'none',
                  border: active ? 'none' : '1px solid rgba(59,130,246,0.15)' }}>
                <div style={{ fontSize:13 }}>{t.icon}</div>
                <div style={{ fontSize:10 }}>{t.label}</div>
                <div style={{ fontSize:10, marginTop:1, opacity:active?0.9:0.55,
                  color:active?'#fff':t.color, fontFamily:'sans-serif', fontWeight:700 }}>
                  {counts[t.id] ?? 0}
                </div>
              </button>
            )
          })}
        </div>

        {/* Date range filter */}
        <div style={{ marginBottom:10 }}>
          <button onClick={() => setShowRange(r => !r)}
            style={{ width:'100%', padding:'8px 12px', borderRadius:10,
              background: showRange?'rgba(29,78,216,0.1)':'rgba(239,246,255,0.7)',
              border:'1px solid rgba(59,130,246,0.2)', cursor:'pointer',
              fontSize:12, color:'rgba(29,78,216,0.65)', fontWeight:700,
              display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span>📅 Filter by date range {isRangeActive ? `(${dateFrom||'any'} → ${dateTo||'any'})` : ''}</span>
            <span>{showRange ? '▲' : '▼'}</span>
          </button>
          {showRange && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
              <div>
                <div style={{ fontSize:10, color:'rgba(29,78,216,0.5)', fontWeight:700, marginBottom:3 }}>FROM</div>
                <input type="date" className="divine-input" value={dateFrom}
                  style={{ fontSize:12, padding:'8px 10px' }}
                  onChange={e => setDateFrom(e.target.value)}/>
              </div>
              <div>
                <div style={{ fontSize:10, color:'rgba(29,78,216,0.5)', fontWeight:700, marginBottom:3 }}>TO</div>
                <input type="date" className="divine-input" value={dateTo}
                  style={{ fontSize:12, padding:'8px 10px' }}
                  onChange={e => setDateTo(e.target.value)}/>
              </div>
              {isRangeActive && (
                <button onClick={() => { setDateFrom(''); setDateTo('') }}
                  style={{ gridColumn:'1/-1', padding:'7px', borderRadius:8,
                    border:'1px solid rgba(220,38,38,0.3)',
                    background:'rgba(254,242,242,0.5)',
                    color:'#b91c1c', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                  ✕ Clear range
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search */}
        <input className="divine-input" placeholder="🔍 Search by name, mobile, venue…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ fontSize:13 }}/>
      </div>

      {/* ── Upcoming bookings ── */}
      {sortedDates.length === 0 ? (
        <div style={{ textAlign:'center', padding:'28px 0', color:'rgba(29,78,216,0.35)', fontSize:14 }}>
          {isSearching ? 'No bookings match your search.' : 'No bookings this month.'}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {sortedDates.map(date => {
            const dayItems  = groups[date]
            const dateLabel = new Date(date+'T00:00:00')
              .toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })
            return (
              <div key={date}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6,
                  marginBottom:6, padding:'5px 14px', borderRadius:20,
                  background:'rgba(29,78,216,0.07)', border:'1px solid rgba(59,130,246,0.15)' }}>
                  <span style={{ fontSize:12, fontWeight:800, color:'#1e3a8a', fontFamily:"'Cinzel',serif" }}>{dateLabel}</span>
                  <span style={{ fontSize:10, color:'rgba(29,78,216,0.45)', fontWeight:600 }}>· {dayItems.length}</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {dayItems.map(b => b._type === 'prayer'
                    ? <PrayerCard key={b.id} b={b} currentUser={currentUser} cancelling={cancelling}
                        todayStr={todayStr}
                        handleCancelBooking={handleCancelBooking}
                        buildShareMsg={buildShareMsg} handleCopy={handleCopy}/>
                    : <SatsangCard key={b.id} b={b} currentUser={currentUser} cancelling={cancelling}
                        todayStr={todayStr}
                        handleCancelSpecial={handleCancelSpecial}
                        buildSatsangShareMsg={buildSatsangShareMsg} handleSatsangCopy={handleSatsangCopy}/>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Past bookings toggle ── */}
      {!isSearching && pastFiltered.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <button onClick={() => setShowPast(p => !p)}
            style={{ width:'100%', padding:'13px 16px', borderRadius:14,
              border:'1.5px dashed rgba(29,78,216,0.25)',
              background:'rgba(239,246,255,0.5)', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              color:'rgba(29,78,216,0.55)', fontSize:13, fontWeight:700, transition:'all 0.2s' }}>
            <span>{showPast ? '▲' : '▼'}</span>
            <span>{showPast ? 'Hide Past Bookings' : `Show Past Bookings (${pastFiltered.length})`}</span>
          </button>
          {showPast && (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {pastSortedDates.map(date => {
                const dayItems  = pastGroups[date]
                const dateLabel = new Date(date+'T00:00:00')
                  .toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })
                return (
                  <div key={date}>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:6,
                      marginBottom:6, padding:'4px 12px', borderRadius:20,
                      background:'rgba(107,114,128,0.1)', border:'1px solid rgba(107,114,128,0.2)' }}>
                      <span style={{ fontSize:11, fontWeight:700, color:'#6b7280' }}>{dateLabel}</span>
                      <span style={{ fontSize:10, color:'rgba(107,114,128,0.6)', fontWeight:600 }}>· {dayItems.length}</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {dayItems.map(b => b._type === 'prayer'
                        ? <PastPrayerCard key={b.id} b={b} currentUser={currentUser}/>
                        : <PastSatsangCard key={b.id} b={b} currentUser={currentUser}/>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  PrayerCard — upcoming prayer booking
// ─────────────────────────────────────────────────────────────
function PrayerCard({ b, currentUser, cancelling, todayStr, handleCancelBooking, buildShareMsg, handleCopy }) {
  const c = SLOT_STYLE[b.time] || SLOT_STYLE['Morning']
  const placeStr = b.place || ''
  const urlM     = placeStr.match(/(https?:\/\/[^\s]+)/)
  const mLink    = urlM ? urlM[1] : ''
  const cPlace   = mLink ? placeStr.replace(mLink,'').trim() : placeStr
  const sc = { name:b.name, mobile:b.mobile, time:b.time, date:b.date, prayerTime:cleanTime(b.prayerTime), place:cPlace||placeStr, mapsLink:mLink, id:b.id }

  return (
    <div style={{ borderRadius:14, overflow:'hidden', border:'1px solid rgba(59,130,246,0.15)', background:'rgba(239,246,255,0.5)' }}>
      <div style={{ height:3, background:`linear-gradient(90deg,${c.color},${c.color}44)` }}/>
      <div style={{ padding:'12px 14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:4 }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800, color:'#1e3a8a', fontSize:14 }}>{b.name}</div>
          <span style={{ flexShrink:0, fontSize:10, fontWeight:800, color:'#1d4ed8',
            background:'rgba(29,78,216,0.08)', padding:'2px 8px', borderRadius:20,
            textTransform:'uppercase', letterSpacing:'0.6px' }}>🙏 Prayer</span>
        </div>
        <div style={{ fontSize:13, color:c.color, fontWeight:700, marginBottom:3 }}>
          {c.icon} {b.time} Prayer · 🕐 {cleanTime(b.prayerTime)}
        </div>
        {b.place && (
          <div style={{ fontSize:12, color:'#6b7280' }}>
            {b.place.startsWith('http')
              ? <a href={b.place} target="_blank" rel="noopener noreferrer"
                  style={{ color:'#1d4ed8', fontWeight:600, textDecoration:'none' }}>📍 View on Map</a>
              : <>📍 {b.place}</>}
          </div>
        )}
        {currentUser && (
          <div style={{ marginTop:8, padding:'8px 10px', borderRadius:10,
            background:'rgba(29,78,216,0.05)', border:'1px solid rgba(29,78,216,0.1)' }}>
            <div style={{ fontSize:11, color:'#1d4ed8', fontWeight:700, marginBottom:4,
              textTransform:'uppercase', letterSpacing:'0.8px' }}>🔐 Admin Info</div>
            <div style={{ fontSize:12, color:'#374151', fontWeight:600 }}>📱 {b.mobile}</div>
            <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>🪪 {b.id}</div>
            {b.bookedAt && <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>🕒 {b.bookedAt}</div>}
            <div style={{ marginTop:8 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(29,78,216,0.5)',
                textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>📤 Share Invitation</div>
              <div style={{ display:'flex', flexDirection:'row', gap:5 }}>
                <a href={`https://wa.me/?text=${buildShareMsg(sc)}`} target="_blank" rel="noopener noreferrer"
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:4,
                    padding:'7px 4px', borderRadius:8, textDecoration:'none',
                    background:'linear-gradient(135deg,#25D366,#128C7E)', color:'#fff', fontWeight:700, fontSize:11 }}>
                  💬 WhatsApp
                </a>
                <a href={`sms:${b.mobile}?body=${buildShareMsg(sc)}`}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:4,
                    padding:'7px 4px', borderRadius:8, textDecoration:'none',
                    background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', color:'#fff', fontWeight:700, fontSize:11 }}>
                  📱 SMS
                </a>
                <button onClick={() => handleCopy(sc)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:4,
                    padding:'7px 4px', borderRadius:8, border:'none', cursor:'pointer',
                    background:'rgba(29,78,216,0.08)', color:'#1e3a8a', fontWeight:700, fontSize:11 }}>
                  📋 Copy
                </button>
              </div>
            </div>
            {b.date >= todayStr
              ? <button disabled={cancelling === b.id} onClick={() => handleCancelBooking(b.id)}
                  style={{ marginTop:4, width:'100%', padding:'7px', border:'none', borderRadius:8,
                    background:'linear-gradient(135deg,#dc2626,#ef4444)',
                    color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer',
                    opacity: cancelling===b.id?0.6:1 }}>
                  {cancelling===b.id ? '⏳ Cancelling...' : '🗑️ Cancel Booking'}
                </button>
              : <div style={{ marginTop:6, fontSize:11, color:'#94a3b8', fontStyle:'italic', textAlign:'center' }}>
                  ✅ Prayer already passed
                </div>
            }
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  SatsangCard — upcoming satsang/special booking
// ─────────────────────────────────────────────────────────────
function SatsangCard({ b, currentUser, cancelling, todayStr, handleCancelSpecial, buildSatsangShareMsg, handleSatsangCopy }) {
  const tc = TC[b._type] || TC.satsang
  return (
    <div style={{ borderRadius:14, overflow:'hidden', border:`1px solid ${tc.border}`, background:tc.bg }}>
      <div style={{ height:3, background:tc.bar }}/>
      <div style={{ padding:'12px 14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:4 }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800, color:tc.name, fontSize:14 }}>{b.name}</div>
          <span style={{ flexShrink:0, fontSize:10, fontWeight:800, color:tc.badge, background:tc.badgeBg,
            padding:'2px 8px', borderRadius:20, textTransform:'uppercase', letterSpacing:'0.6px' }}>{tc.label}</span>
        </div>
        <div style={{ fontSize:13, color:tc.time, fontWeight:700, marginBottom:3 }}>
          📅 {formatDateWithDay(b.date)} · ⏰ {cleanTime(b.time)}
        </div>
        {b.venue && (
          <div style={{ fontSize:12, color:'#6b7280' }}>
            {b.mapsLink
              ? <a href={b.mapsLink} target="_blank" rel="noopener noreferrer"
                  style={{ color:tc.time, fontWeight:600, textDecoration:'none' }}>📍 {b.venue} · Map</a>
              : <>📍 {b.venue}</>}
          </div>
        )}
        {b.hostedBy && <div style={{ fontSize:12, color:tc.badge, fontWeight:600, marginTop:3 }}>🙏 {b.hostedBy}</div>}
        {currentUser && (
          <div style={{ marginTop:8, padding:'8px 10px', borderRadius:10,
            background:tc.adminBg, border:`1px solid ${tc.adminBorder}` }}>
            <div style={{ fontSize:11, color:tc.adminText, fontWeight:700, marginBottom:4,
              textTransform:'uppercase', letterSpacing:'0.8px' }}>🔐 Admin Info</div>
            <div style={{ fontSize:12, color:'#374151', fontWeight:600 }}>📱 {b.mobile}</div>
            <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>🪪 {b.id}</div>
            {b.bookedAt && <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>🕒 {b.bookedAt}</div>}
            <div style={{ marginTop:8 }}>
              <div style={{ fontSize:10, fontWeight:700, color:tc.adminText,
                textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>📤 Share Invitation</div>
              <div style={{ display:'flex', flexDirection:'row', gap:5 }}>
                <a href={`https://wa.me/?text=${buildSatsangShareMsg(b)}`} target="_blank" rel="noopener noreferrer"
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:4,
                    padding:'7px 4px', borderRadius:8, textDecoration:'none',
                    background:'linear-gradient(135deg,#25D366,#128C7E)', color:'#fff', fontWeight:700, fontSize:11 }}>
                  💬 WhatsApp
                </a>
                <a href={`sms:?body=${buildSatsangShareMsg(b)}`}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:4,
                    padding:'7px 4px', borderRadius:8, textDecoration:'none',
                    background:tc.cancelGrad, color:'#fff', fontWeight:700, fontSize:11 }}>
                  📱 SMS
                </a>
                <button onClick={() => handleSatsangCopy(b)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:4,
                    padding:'7px 4px', borderRadius:8, border:'none', cursor:'pointer',
                    background:tc.adminBg, color:tc.adminText, fontWeight:700, fontSize:11 }}>
                  📋 Copy
                </button>
              </div>
            </div>
            {b.date >= todayStr
              ? <button disabled={cancelling === b.id} onClick={() => handleCancelSpecial(b.id, b._type)}
                  style={{ marginTop:4, width:'100%', padding:'7px', border:'none', borderRadius:8,
                    background:tc.cancelGrad, color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer',
                    opacity: cancelling===b.id?0.6:1 }}>
                  {cancelling===b.id ? '⏳ Cancelling...' : `🗑️ ${tc.cancelLabel}`}
                </button>
              : <div style={{ marginTop:6, fontSize:11, color:'#94a3b8', fontStyle:'italic', textAlign:'center' }}>
                  ✅ Event already passed
                </div>
            }
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Past cards (no admin actions, greyed out)
// ─────────────────────────────────────────────────────────────
function PastPrayerCard({ b, currentUser }) {
  const c = SLOT_STYLE[b.time] || SLOT_STYLE['Morning']
  return (
    <div style={{ borderRadius:14, overflow:'hidden', border:'1px solid rgba(107,114,128,0.15)',
      background:'rgba(107,114,128,0.06)', opacity:0.75 }}>
      <div style={{ height:3, background:'rgba(107,114,128,0.3)' }}/>
      <div style={{ padding:'12px 14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:4 }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800, color:'#6b7280', fontSize:14 }}>{b.name}</div>
          <span style={{ flexShrink:0, fontSize:10, fontWeight:800, color:'#9ca3af',
            background:'rgba(107,114,128,0.1)', padding:'2px 8px', borderRadius:20,
            textTransform:'uppercase', letterSpacing:'0.6px' }}>🙏 Prayer</span>
        </div>
        <div style={{ fontSize:13, color:'#9ca3af', fontWeight:700, marginBottom:3 }}>
          {c.icon} {b.time} · 🕐 {cleanTime(b.prayerTime)}
        </div>
        {b.place && <div style={{ fontSize:12, color:'#9ca3af' }}>📍 {b.place}</div>}
        {currentUser && (
          <div style={{ marginTop:8, padding:'8px 10px', borderRadius:10,
            background:'rgba(107,114,128,0.08)', border:'1px solid rgba(107,114,128,0.15)' }}>
            <div style={{ fontSize:11, color:'#6b7280', fontWeight:700, marginBottom:4,
              textTransform:'uppercase', letterSpacing:'0.8px' }}>🔐 Admin Info</div>
            <div style={{ fontSize:12, color:'#374151', fontWeight:600 }}>📱 {b.mobile}</div>
            <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>🪪 {b.id}</div>
            {b.bookedAt && <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>🕒 {b.bookedAt}</div>}
          </div>
        )}
      </div>
    </div>
  )
}

function PastSatsangCard({ b, currentUser }) {
  return (
    <div style={{ borderRadius:14, overflow:'hidden', border:'1px solid rgba(107,114,128,0.15)',
      background:'rgba(107,114,128,0.06)', opacity:0.75 }}>
      <div style={{ height:3, background:'rgba(107,114,128,0.3)' }}/>
      <div style={{ padding:'12px 14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:4 }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800, color:'#6b7280', fontSize:14 }}>{b.name}</div>
          <span style={{ flexShrink:0, fontSize:10, fontWeight:800, color:'#9ca3af',
            background:'rgba(107,114,128,0.1)', padding:'2px 8px', borderRadius:20,
            textTransform:'uppercase', letterSpacing:'0.6px' }}>🪔 Satsang</span>
        </div>
        <div style={{ fontSize:13, color:'#9ca3af', fontWeight:700, marginBottom:3 }}>⏰ {cleanTime(b.time)} onwards</div>
        {b.venue    && <div style={{ fontSize:12, color:'#9ca3af' }}>📍 {b.venue}</div>}
        {b.hostedBy && <div style={{ fontSize:12, color:'#9ca3af', fontWeight:600, marginTop:3 }}>🙏 {b.hostedBy}</div>}
        {currentUser && (
          <div style={{ marginTop:8, padding:'8px 10px', borderRadius:10,
            background:'rgba(107,114,128,0.08)', border:'1px solid rgba(107,114,128,0.15)' }}>
            <div style={{ fontSize:11, color:'#6b7280', fontWeight:700, marginBottom:4,
              textTransform:'uppercase', letterSpacing:'0.8px' }}>🔐 Admin Info</div>
            <div style={{ fontSize:12, color:'#374151', fontWeight:600 }}>📱 {b.mobile}</div>
            <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>🪪 {b.id}</div>
            {b.bookedAt && <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>🕒 {b.bookedAt}</div>}
          </div>
        )}
      </div>
    </div>
  )
}