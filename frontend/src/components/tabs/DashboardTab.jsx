// ============================================================
//  DashboardTab v2 — Analytics Dashboard (Admin only)
//  ─────────────────────────────────────────────────────────
//  New in v2:
//  • Clickable KPI cards → drill-down detail drawer
//  • Member graph: most-active bar chart + sort/filter
//  • Trends: filters by slot (All/Morning/Evening) + month range
//  • Upcoming: filter by slot + search by name
// ============================================================

import React from 'react'

const BLUE   = '#1d4ed8'
const TEAL   = '#0f6e56'
const AMBER  = '#b45309'
const PURPLE = '#6d28d9'
const GREEN  = '#15803d'

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS_FULL   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const DAYS_SHORT  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const AVATAR_BG   = ['#bfdbfe','#a7f3d0','#fed7aa','#ddd6fe','#fecaca','#d1fae5','#fde68a','#e0e7ff','#fce7f3','#cffafe']
const AVATAR_TEXT = ['#1e40af','#065f46','#92400e','#4c1d95','#991b1b','#064e3b','#78350f','#3730a3','#831843','#164e63']

function getTodayStr() {
  const t = new Date(); t.setHours(0,0,0,0)
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`
}
function fmtDate(s) {
  if (!s) return ''
  const d = new Date(s + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' })
}
function initials(name) {
  const p = (name||'').trim().split(' ').filter(Boolean)
  if (p.length >= 2) return (p[0][0]+p[p.length-1][0]).toUpperCase()
  return (name||'??').substring(0,2).toUpperCase()
}

// ── Chart.js CDN loader ───────────────────────────────────────
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

// ── Chart components ──────────────────────────────────────────
function BarChart({ data, labels, color=BLUE, height=120, horizontal=false }) {
  const ref = React.useRef(null); const ch = React.useRef(null)
  React.useEffect(() => {
    if (!ref.current || !window.Chart) return
    if (ch.current) { ch.current.destroy(); ch.current = null }
    const type = horizontal ? 'bar' : 'bar'
    ch.current = new window.Chart(ref.current, {
      type,
      data: { labels, datasets: [{ data, backgroundColor: color+'bb', borderRadius: 5, borderWidth: 0 }] },
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
        scales: {
          x: { grid: { display: !horizontal }, ticks: { font:{size:10}, color:'#6b7280', maxRotation: horizontal?0:30 } },
          y: { beginAtZero:true, grid: { color:'rgba(0,0,0,.04)' }, ticks: { font:{size:10}, color:'#6b7280' } },
        },
      },
    })
    return () => { if (ch.current) ch.current.destroy() }
  }, [JSON.stringify(data), JSON.stringify(labels), color, horizontal])
  return <div style={{position:'relative',width:'100%',height}}><canvas ref={ref} role="img" aria-label="bar chart"/></div>
}

function LineChart({ datasets, labels, height=160 }) {
  const ref = React.useRef(null); const ch = React.useRef(null)
  React.useEffect(() => {
    if (!ref.current || !window.Chart) return
    if (ch.current) { ch.current.destroy(); ch.current = null }
    ch.current = new window.Chart(ref.current, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: datasets.length > 1 }, tooltip: { enabled: true } },
        scales: {
          x: { grid:{display:false}, ticks:{font:{size:10},color:'#6b7280'} },
          y: { beginAtZero:true, grid:{color:'rgba(0,0,0,.04)'}, ticks:{font:{size:10},color:'#6b7280',stepSize:1} },
        },
      },
    })
    return () => { if (ch.current) ch.current.destroy() }
  }, [JSON.stringify(datasets), JSON.stringify(labels)])
  return <div style={{position:'relative',width:'100%',height}}><canvas ref={ref} role="img" aria-label="line chart"/></div>
}

function Doughnut({ slices, height=130 }) {
  const ref = React.useRef(null); const ch = React.useRef(null)
  React.useEffect(() => {
    if (!ref.current || !window.Chart) return
    if (ch.current) { ch.current.destroy(); ch.current = null }
    ch.current = new window.Chart(ref.current, {
      type: 'doughnut',
      data: {
        labels: slices.map(s=>s.label),
        datasets: [{ data: slices.map(s=>s.value), backgroundColor: slices.map(s=>s.color+'bb'), borderWidth:0 }],
      },
      options: { responsive:true, maintainAspectRatio:false, cutout:'65%',
        plugins: { legend:{display:false}, tooltip:{enabled:true} } },
    })
    return () => { if (ch.current) ch.current.destroy() }
  }, [JSON.stringify(slices)])
  return <div style={{position:'relative',width:'100%',height}}><canvas ref={ref} role="img" aria-label="doughnut chart"/></div>
}

// ── UI primitives ─────────────────────────────────────────────
function Card({ children, style={} }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.78)', borderRadius:16,
      padding:'16px', border:'1px solid rgba(59,130,246,0.15)', ...style }}>
      {children}
    </div>
  )
}
function SecTitle({ children }) {
  return <div style={{ fontSize:10, fontWeight:800, color:'rgba(29,78,216,0.45)',
    textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>{children}</div>
}
function Pill({ label, active, onClick, color=BLUE }) {
  return (
    <button onClick={onClick} style={{
      padding:'6px 13px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12,
      fontWeight:700, transition:'all .15s',
      background: active ? color : 'rgba(239,246,255,0.8)',
      color: active ? '#fff' : 'rgba(29,78,216,0.55)',
      boxShadow: active ? `0 2px 8px ${color}44` : 'none',
    }}>
      {label}
    </button>
  )
}

// ── Drill-down drawer (slides up from bottom) ─────────────────
function Drawer({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:4000,
      background:'rgba(0,0,0,0.4)', backdropFilter:'blur(3px)',
      display:'flex', alignItems:'flex-end' }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:'100%', maxHeight:'82vh',
        background:'linear-gradient(160deg,#f0f6ff,#e8f0fe)',
        borderRadius:'20px 20px 0 0',
        boxShadow:'0 -8px 40px rgba(29,78,216,0.18)',
        display:'flex', flexDirection:'column',
        animation:'slideUp .25s ease',
      }}>
        <style>{`@keyframes slideUp{from{transform:translateY(60px);opacity:0}to{transform:none;opacity:1}}`}</style>
        {/* Handle */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'16px 18px 12px', borderBottom:'1px solid rgba(59,130,246,0.12)', flexShrink:0 }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800, color:'#1e3a8a', fontSize:14 }}>
            {title}
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:'50%', border:'none',
            background:'rgba(29,78,216,0.1)', cursor:'pointer', fontSize:15, color:'#1e3a8a',
            display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900 }}>✕</button>
        </div>
        <div style={{ overflowY:'auto', padding:'14px 18px 24px', flex:1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Clickable KPI card ────────────────────────────────────────
function KPICard({ label, value, sub, color=BLUE, onClick }) {
  const [hov, setHov] = React.useState(false)
  return (
    <div onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        background: hov ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.78)',
        borderRadius:14, padding:'14px 16px',
        border: hov ? `1.5px solid ${color}55` : '1px solid rgba(59,130,246,0.15)',
        flex:'1 1 130px', cursor: onClick ? 'pointer' : 'default',
        transition:'all .18s',
        boxShadow: hov ? `0 4px 18px ${color}22` : 'none',
        position:'relative',
      }}>
      {onClick && (
        <div style={{ position:'absolute', top:10, right:10, fontSize:10,
          color: color+'99', fontWeight:700 }}>↗</div>
      )}
      <div style={{ fontSize:10, color:'rgba(29,78,216,0.5)', fontWeight:700,
        textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:900, color, fontFamily:"'Cinzel',serif", lineHeight:1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize:11, color:'rgba(29,78,216,0.4)', marginTop:5 }}>{sub}</div>}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  Main component
// ════════════════════════════════════════════════════════════
export default function DashboardTab({ bookings=[], satsangBookings=[] }) {
  const chartReady = useChartJs()
  const today = getTodayStr()
  const [page,   setPage]   = React.useState('exec')
  const [drawer, setDrawer] = React.useState(null) // null | 'total'|'devotees'|'avg'|'upcoming'

  // ── Filters (used across pages) ───────────────────────────
  const [slotFilter,   setSlotFilter]   = React.useState('all')   // all|morning|evening
  const [memberSort,   setMemberSort]   = React.useState('count') // count|name|recent
  const [memberSearch, setMemberSearch] = React.useState('')
  const [upSearch,     setUpSearch]     = React.useState('')
  const [upSlot,       setUpSlot]       = React.useState('all')

  // ── Core analytics ────────────────────────────────────────
  const A = React.useMemo(() => {
    const total   = bookings.length
    const morning = bookings.filter(b=>b.time==='Morning').length
    const evening = bookings.filter(b=>b.time==='Evening').length

    // Member map keyed by mobile (fallback name)
    const mmap = {}
    bookings.forEach(b => {
      const k = b.mobile || b.name
      if (!mmap[k]) mmap[k] = { name:b.name, mobile:b.mobile||'', count:0, morningCount:0, eveningCount:0, dates:[], months:new Set() }
      mmap[k].count++
      if (b.time==='Morning') mmap[k].morningCount++
      else mmap[k].eveningCount++
      mmap[k].dates.push(b.date)
      mmap[k].months.add((b.date||'').slice(0,7))
    })
    const members = Object.values(mmap).map(m => ({
      ...m, months: m.months.size,
      lastDate: m.dates.filter(Boolean).sort().slice(-1)[0] || '',
      firstDate: m.dates.filter(Boolean).sort()[0] || '',
    }))

    // Day counts
    const dayCounts = [0,0,0,0,0,0,0]
    bookings.forEach(b => { if (b.date) dayCounts[new Date(b.date+'T00:00:00').getDay()]++ })

    // Monthly
    const monthMap = {}
    bookings.forEach(b => {
      const m = (b.date||'').slice(0,7); if (!m) return
      if (!monthMap[m]) monthMap[m] = { all:0, morning:0, evening:0 }
      monthMap[m].all++
      if (b.time==='Morning') monthMap[m].morning++; else monthMap[m].evening++
    })
    const sortedMonths = Object.keys(monthMap).sort()

    // Upcoming
    const in30 = new Date(today); in30.setDate(in30.getDate()+30)
    const in30s = in30.toISOString().slice(0,10)
    const upcoming = bookings.filter(b=>b.date>=today && b.date<=in30s).sort((a,b)=>a.date.localeCompare(b.date))

    const uniqueMembers = members.length
    const avgPerMonth   = sortedMonths.length ? Math.round(total/sortedMonths.length) : 0

    return { total, morning, evening, members, dayCounts, monthMap, sortedMonths, upcoming, uniqueMembers, avgPerMonth }
  }, [bookings, today])

  // ── Filtered members ──────────────────────────────────────
  const filteredMembers = React.useMemo(() => {
    let list = [...A.members]
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase()
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.mobile.includes(q))
    }
    if (slotFilter === 'morning') list = list.filter(m => m.morningCount > 0)
    if (slotFilter === 'evening') list = list.filter(m => m.eveningCount > 0)
    if (memberSort === 'count')  list.sort((a,b)=>b.count-a.count)
    if (memberSort === 'name')   list.sort((a,b)=>a.name.localeCompare(b.name))
    if (memberSort === 'recent') list.sort((a,b)=>b.lastDate.localeCompare(a.lastDate))
    if (memberSort === 'months') list.sort((a,b)=>b.months-a.months)
    return list
  }, [A.members, memberSearch, slotFilter, memberSort])

  // ── Trend data (filtered by slot) ────────────────────────
  const trendData = React.useMemo(() => {
    return A.sortedMonths.map(m => {
      const d = A.monthMap[m]
      if (slotFilter==='morning') return d.morning
      if (slotFilter==='evening') return d.evening
      return d.all
    })
  }, [A.monthMap, A.sortedMonths, slotFilter])

  const trendLabels = A.sortedMonths.map(m => {
    const [,mm] = m.split('-'); return MONTH_SHORT[parseInt(mm,10)-1]
  })

  // ── Upcoming filtered ─────────────────────────────────────
  const filteredUpcoming = React.useMemo(() => {
    return A.upcoming.filter(b => {
      if (upSlot==='morning' && b.time!=='Morning') return false
      if (upSlot==='evening' && b.time!=='Evening') return false
      if (upSearch.trim() && !b.name.toLowerCase().includes(upSearch.toLowerCase())) return false
      return true
    })
  }, [A.upcoming, upSlot, upSearch])

  // ── Nav ───────────────────────────────────────────────────
  const NAV = [
    { id:'exec',     label:'📊 Summary'  },
    { id:'members',  label:'🪷 Members'  },
    { id:'trends',   label:'📈 Trends'   },
    { id:'upcoming', label:'🗓️ Upcoming' },
  ]
  const navSt = id => ({
    flex:1, padding:'9px 4px', border:'none', borderRadius:12, cursor:'pointer',
    fontFamily:"'Cinzel',serif", fontSize:11, fontWeight:800, transition:'all .18s',
    whiteSpace:'nowrap',
    background: page===id ? 'linear-gradient(135deg,#1e3a8a,#3b82f6)' : 'rgba(239,246,255,0.7)',
    color: page===id ? '#fff' : 'rgba(29,78,216,0.55)',
    boxShadow: page===id ? '0 3px 12px rgba(29,78,216,0.25)' : 'none',
  })

  // ── Drawer content factories ──────────────────────────────
  function DrawerContent({ type }) {
    if (type==='total') return (
      <div>
        <div style={{fontSize:13,color:'rgba(29,78,216,0.6)',marginBottom:14}}>
          All <b style={{color:BLUE}}>{A.total}</b> prayer bookings across all time
        </div>
        <SecTitle>Breakdown by slot</SecTitle>
        <div style={{display:'flex',gap:10,marginBottom:16}}>
          {[{label:'Morning 🌅',val:A.morning,col:'#1d4ed8'},{label:'Evening 🌙',val:A.evening,col:'#d97706'}].map(s=>(
            <div key={s.label} style={{flex:1,padding:'12px',borderRadius:12,
              background:`${s.col}11`,border:`1px solid ${s.col}33`,textAlign:'center'}}>
              <div style={{fontSize:11,color:s.col,fontWeight:700,marginBottom:4}}>{s.label}</div>
              <div style={{fontSize:24,fontWeight:900,color:s.col,fontFamily:"'Cinzel',serif"}}>{s.val}</div>
              <div style={{fontSize:10,color:s.col+'99',marginTop:3}}>
                {Math.round(s.val/(A.total||1)*100)}% of total
              </div>
            </div>
          ))}
        </div>
        <SecTitle>Monthly trend</SecTitle>
        {chartReady && <LineChart
          datasets={[{data:A.sortedMonths.map(m=>A.monthMap[m].all),borderColor:BLUE,backgroundColor:BLUE+'18',fill:true,tension:.4,pointRadius:4,pointBackgroundColor:BLUE,borderWidth:2}]}
          labels={trendLabels} height={150}/>}
        <SecTitle style={{marginTop:14}}>Day of week</SecTitle>
        {chartReady && <BarChart data={A.dayCounts} labels={DAYS_SHORT} color={TEAL} height={100}/>}
      </div>
    )

    if (type==='devotees') return (
      <div>
        <div style={{fontSize:13,color:'rgba(29,78,216,0.6)',marginBottom:14}}>
          <b style={{color:TEAL}}>{A.uniqueMembers}</b> unique devotees have made bookings
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:10,marginBottom:16}}>
          {[
            {label:'Core (5+ bookings)', val:A.members.filter(m=>m.count>=5).length, col:GREEN},
            {label:'Regular (2–4)',       val:A.members.filter(m=>m.count>=2&&m.count<5).length, col:BLUE},
            {label:'One-time',            val:A.members.filter(m=>m.count===1).length, col:'#6b7280'},
          ].map(s=>(
            <div key={s.label} style={{flex:'1 1 90px',padding:'11px',borderRadius:12,
              background:`${s.col}11`,border:`1px solid ${s.col}33`,textAlign:'center'}}>
              <div style={{fontSize:10,color:s.col,fontWeight:700,marginBottom:4,lineHeight:1.3}}>{s.label}</div>
              <div style={{fontSize:22,fontWeight:900,color:s.col,fontFamily:"'Cinzel',serif"}}>{s.val}</div>
            </div>
          ))}
        </div>
        <SecTitle>Top 10 devotees</SecTitle>
        {[...A.members].sort((a,b)=>b.count-a.count).slice(0,10).map((m,i)=>{
          const ci=i%AVATAR_BG.length
          return (
            <div key={m.mobile+i} style={{display:'flex',alignItems:'center',gap:10,
              padding:'9px 0',borderBottom:i<9?'1px solid rgba(59,130,246,0.07)':'none'}}>
              <div style={{fontSize:12,fontWeight:800,color:i<3?'#d97706':'rgba(29,78,216,0.35)',
                minWidth:18,textAlign:'center'}}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</div>
              <div style={{width:32,height:32,borderRadius:'50%',background:AVATAR_BG[ci],
                color:AVATAR_TEXT[ci],display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:11,fontWeight:800,flexShrink:0}}>{initials(m.name)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:'#1e3a8a',
                  fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.name}</div>
                <div style={{fontSize:10,color:'rgba(29,78,216,0.4)',marginTop:1}}>{m.mobile}</div>
              </div>
              <div style={{fontSize:15,fontWeight:900,color:BLUE}}>{m.count}</div>
            </div>
          )
        })}
      </div>
    )

    if (type==='avg') return (
      <div>
        <div style={{fontSize:13,color:'rgba(29,78,216,0.6)',marginBottom:14}}>
          Average of <b style={{color:PURPLE}}>{A.avgPerMonth}</b> bookings per month across{' '}
          <b style={{color:PURPLE}}>{A.sortedMonths.length}</b> months
        </div>
        <SecTitle>All months</SecTitle>
        {A.sortedMonths.map((m,i)=>{
          const d=A.monthMap[m]; const maxC=Math.max(...Object.values(A.monthMap).map(x=>x.all))||1
          const [yr,mm]=m.split('-')
          return (
            <div key={m} style={{display:'flex',alignItems:'center',gap:10,
              padding:'8px 0',borderBottom:i<A.sortedMonths.length-1?'1px solid rgba(59,130,246,0.07)':'none'}}>
              <div style={{width:58,fontSize:11,fontWeight:700,color:'#1e3a8a',
                fontFamily:"'Cinzel',serif",flexShrink:0}}>
                {MONTH_SHORT[parseInt(mm,10)-1]} {yr}
              </div>
              <div style={{flex:1,height:7,borderRadius:4,background:'rgba(109,40,217,0.1)',overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:4,background:PURPLE+'99',
                  width:Math.round(d.all/maxC*100)+'%',transition:'width .4s'}}/>
              </div>
              <div style={{width:24,fontSize:13,fontWeight:900,color:PURPLE,textAlign:'right'}}>{d.all}</div>
            </div>
          )
        })}
      </div>
    )

    if (type==='upcoming') return (
      <div>
        <div style={{fontSize:13,color:'rgba(29,78,216,0.6)',marginBottom:14}}>
          <b style={{color:AMBER}}>{A.upcoming.length}</b> bookings in the next 30 days
        </div>
        {A.upcoming.map((b,i)=>{
          const isMorning=b.time==='Morning'
          return (
            <div key={b.id||i} style={{display:'flex',alignItems:'center',gap:10,
              padding:'10px 0',borderBottom:i<A.upcoming.length-1?'1px solid rgba(59,130,246,0.08)':'none'}}>
              <div style={{background:'rgba(239,246,255,0.9)',borderRadius:10,padding:'6px 9px',
                textAlign:'center',minWidth:44,flexShrink:0,border:'1px solid rgba(59,130,246,0.15)'}}>
                <div style={{fontSize:16,fontWeight:900,color:'#1e3a8a',fontFamily:"'Cinzel',serif",lineHeight:1}}>
                  {new Date(b.date+'T00:00:00').getDate()}
                </div>
                <div style={{fontSize:9,color:'rgba(29,78,216,0.5)',fontWeight:700,marginTop:2}}>
                  {MONTH_SHORT[new Date(b.date+'T00:00:00').getMonth()]}
                </div>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:'#1e3a8a',fontSize:13,
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.name}</div>
                <div style={{fontSize:11,color:'rgba(29,78,216,0.4)',marginTop:1}}>
                  {DAYS_SHORT[new Date(b.date+'T00:00:00').getDay()]}
                </div>
              </div>
              <span style={{fontSize:11,padding:'3px 8px',borderRadius:20,fontWeight:700,flexShrink:0,
                background:isMorning?'#dbeafe':'#fef3c7',color:isMorning?'#1d4ed8':'#92400e'}}>
                {isMorning?'🌅':'🌙'} {b.time}
              </span>
            </div>
          )
        })}
      </div>
    )
    return null
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>

      {/* Drawer */}
      {drawer && (
        <Drawer title={{
          total:'Total Bookings', devotees:'Unique Devotees',
          avg:'Avg / Month', upcoming:'Upcoming Bookings',
        }[drawer]} onClose={()=>setDrawer(null)}>
          <DrawerContent type={drawer}/>
        </Drawer>
      )}

      {/* Header */}
      <Card>
        <div style={{textAlign:'center',paddingBottom:4}}>
          <div style={{fontSize:34,marginBottom:6,filter:'drop-shadow(0 0 14px rgba(29,78,216,0.3))',
            animation:'floatEmoji 3s ease-in-out infinite alternate'}}>📊</div>
          <div style={{fontFamily:"'Cinzel',serif",color:'#1e3a8a',fontSize:17,fontWeight:800}}>
            Devotee Analytics
          </div>
          <div style={{fontSize:12,color:'rgba(29,78,216,0.45)',marginTop:4}}>
            Tap any card to explore details
          </div>
          <div style={{height:1,background:'linear-gradient(90deg,transparent,rgba(59,130,246,0.3),transparent)',marginTop:12}}/>
        </div>
      </Card>

      {/* Nav */}
      <div style={{display:'flex',gap:6,background:'rgba(255,255,255,0.6)',
        borderRadius:14,padding:5,border:'1px solid rgba(59,130,246,0.15)'}}>
        {NAV.map(n=><button key={n.id} style={navSt(n.id)} onClick={()=>setPage(n.id)}>{n.label}</button>)}
      </div>

      {/* ════ EXECUTIVE SUMMARY ════ */}
      {page==='exec' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>

          {/* KPI row — all clickable */}
          <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
            <KPICard label="Total Bookings"   value={A.total}          sub="all time"           color={BLUE}   onClick={()=>setDrawer('total')}/>
            <KPICard label="Unique Devotees"  value={A.uniqueMembers}  sub="registered"         color={TEAL}   onClick={()=>setDrawer('devotees')}/>
            <KPICard label="Avg / Month"      value={A.avgPerMonth}    sub="bookings per month" color={PURPLE} onClick={()=>setDrawer('avg')}/>
            <KPICard label="Upcoming"         value={A.upcoming.length} sub="next 30 days"       color={AMBER}  onClick={()=>setDrawer('upcoming')}/>
          </div>

          {/* Morning vs Evening */}
          <Card>
            <SecTitle>Morning vs Evening</SecTitle>
            {chartReady
              ? <Doughnut slices={[{label:'Morning',value:A.morning,color:'#1d4ed8'},{label:'Evening',value:A.evening,color:'#d97706'}]}/>
              : <div style={{height:130,display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(29,78,216,0.3)',fontSize:13}}>Loading…</div>}
            <div style={{display:'flex',justifyContent:'center',gap:20,marginTop:10,fontSize:12}}>
              {[{l:'Morning',v:A.morning,c:'#1d4ed8'},{l:'Evening',v:A.evening,c:'#d97706'}].map(s=>(
                <span key={s.l} style={{display:'flex',alignItems:'center',gap:5}}>
                  <span style={{width:9,height:9,borderRadius:2,background:s.c,display:'inline-block'}}/>
                  <span style={{color:s.c,fontWeight:700}}>{s.l} {s.v} ({Math.round(s.v/(A.total||1)*100)}%)</span>
                </span>
              ))}
            </div>
          </Card>

          {/* Day of week */}
          <Card>
            <SecTitle>Bookings by day of week</SecTitle>
            {chartReady
              ? <BarChart data={A.dayCounts} labels={DAYS_SHORT} color={TEAL} height={110}/>
              : <div style={{height:110,display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(29,78,216,0.3)',fontSize:13}}>Loading…</div>}
            {(() => {
              const max=Math.max(...A.dayCounts); const peak=DAYS_FULL[A.dayCounts.indexOf(max)]
              return <div style={{marginTop:10,fontSize:12,color:'rgba(29,78,216,0.6)',textAlign:'center',fontWeight:600}}>
                🏆 Busiest: <span style={{color:TEAL,fontWeight:800}}>{peak}</span> ({max} bookings)
              </div>
            })()}
          </Card>

        </div>
      )}

      {/* ════ MEMBER ANALYTICS ════ */}
      {page==='members' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>

          {/* Filters */}
          <Card style={{padding:'12px 14px'}}>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>

              {/* Search */}
              <div style={{position:'relative'}}>
                <input
                  placeholder="🔍  Search by name or mobile…"
                  value={memberSearch}
                  onChange={e=>setMemberSearch(e.target.value)}
                  style={{width:'100%',padding:'10px 36px 10px 12px',borderRadius:11,
                    border:'1px solid rgba(59,130,246,0.2)',background:'rgba(239,246,255,0.8)',
                    fontSize:13,outline:'none',boxSizing:'border-box'}}
                />
                {memberSearch && (
                  <button onClick={()=>setMemberSearch('')}
                    style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',
                      background:'none',border:'none',cursor:'pointer',fontSize:14,
                      color:'rgba(29,78,216,0.4)'}}>✕</button>
                )}
              </div>

              {/* Slot filter */}
              <div>
                <div style={{fontSize:10,fontWeight:700,color:'rgba(29,78,216,0.45)',
                  textTransform:'uppercase',letterSpacing:'1px',marginBottom:6}}>Slot</div>
                <div style={{display:'flex',gap:6}}>
                  {[{id:'all',l:'All'},{id:'morning',l:'🌅 Morning'},{id:'evening',l:'🌙 Evening'}].map(f=>(
                    <Pill key={f.id} label={f.l} active={slotFilter===f.id} onClick={()=>setSlotFilter(f.id)} color={BLUE}/>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <div style={{fontSize:10,fontWeight:700,color:'rgba(29,78,216,0.45)',
                  textTransform:'uppercase',letterSpacing:'1px',marginBottom:6}}>Sort by</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {[
                    {id:'count', l:'Most active'},
                    {id:'months',l:'Most months'},
                    {id:'recent',l:'Most recent'},
                    {id:'name',  l:'Name A–Z'},
                  ].map(s=>(
                    <Pill key={s.id} label={s.l} active={memberSort===s.id} onClick={()=>setMemberSort(s.id)} color={PURPLE}/>
                  ))}
                </div>
              </div>

            </div>
          </Card>

          {/* Member bar chart (top 15) */}
          <Card>
            <SecTitle>Activity chart — top {Math.min(filteredMembers.length,15)}</SecTitle>
            {filteredMembers.length === 0
              ? <div style={{textAlign:'center',padding:'20px 0',color:'rgba(29,78,216,0.3)',fontSize:13}}>No members match the filter</div>
              : chartReady
                ? <BarChart
                    data={filteredMembers.slice(0,15).map(m=>
                      slotFilter==='morning' ? m.morningCount :
                      slotFilter==='evening' ? m.eveningCount : m.count)}
                    labels={filteredMembers.slice(0,15).map(m=>m.name.split(' ')[0])}
                    color={PURPLE}
                    height={Math.max(120, filteredMembers.slice(0,15).length * 22)}
                    horizontal={false}
                  />
                : <div style={{height:120,display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(29,78,216,0.3)',fontSize:13}}>Loading…</div>
            }
          </Card>

          {/* Member list */}
          <Card>
            <SecTitle>{filteredMembers.length} devotee{filteredMembers.length!==1?'s':''} {slotFilter!=='all'?`(${slotFilter} only)`:''}</SecTitle>
            {filteredMembers.length === 0
              ? <div style={{textAlign:'center',padding:'20px 0',color:'rgba(29,78,216,0.3)',fontSize:13}}>No results</div>
              : filteredMembers.map((m,i) => {
                const ci=i%AVATAR_BG.length
                const total = slotFilter==='morning' ? m.morningCount : slotFilter==='evening' ? m.eveningCount : m.count
                const maxC = Math.max(...filteredMembers.map(x=>slotFilter==='morning'?x.morningCount:slotFilter==='evening'?x.eveningCount:x.count)) || 1
                const pct  = Math.round(total/maxC*100)
                return (
                  <div key={m.mobile+i} style={{display:'flex',alignItems:'center',gap:10,
                    padding:'10px 0',borderBottom:i<filteredMembers.length-1?'1px solid rgba(59,130,246,0.07)':'none'}}>
                    {/* Rank */}
                    <div style={{width:22,fontSize:11,fontWeight:800,textAlign:'center',flexShrink:0,
                      color:i<3?'#d97706':'rgba(29,78,216,0.3)'}}>
                      {i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
                    </div>
                    {/* Avatar */}
                    <div style={{width:34,height:34,borderRadius:'50%',flexShrink:0,
                      background:AVATAR_BG[ci],color:AVATAR_TEXT[ci],
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:11,fontWeight:800}}>
                      {initials(m.name)}
                    </div>
                    {/* Info */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:'#1e3a8a',
                        fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {m.name}
                      </div>
                      <div style={{display:'flex',gap:6,marginTop:2,flexWrap:'wrap'}}>
                        {m.mobile && <span style={{fontSize:10,color:'rgba(29,78,216,0.4)'}}>📱 {m.mobile}</span>}
                        <span style={{fontSize:10,color:'rgba(29,78,216,0.35)'}}>🗓️ {m.months} month{m.months!==1?'s':''}</span>
                      </div>
                      {/* Mini slot bars */}
                      <div style={{display:'flex',gap:4,marginTop:4,alignItems:'center'}}>
                        <div style={{height:4,borderRadius:2,background:'#1d4ed8bb',
                          width:Math.round(m.morningCount/(m.count||1)*80)+'px',minWidth:2,flexShrink:0}}/>
                        <span style={{fontSize:9,color:'rgba(29,78,216,0.4)'}}>🌅{m.morningCount}</span>
                        <div style={{height:4,borderRadius:2,background:'#d97706bb',
                          width:Math.round(m.eveningCount/(m.count||1)*80)+'px',minWidth:2,flexShrink:0}}/>
                        <span style={{fontSize:9,color:'rgba(217,119,6,0.6)'}}>🌙{m.eveningCount}</span>
                      </div>
                    </div>
                    {/* Bar + count */}
                    <div style={{width:70,flexShrink:0}}>
                      <div style={{height:5,borderRadius:3,background:'rgba(109,40,217,0.1)',overflow:'hidden'}}>
                        <div style={{height:'100%',borderRadius:3,background:AVATAR_BG[ci],
                          width:pct+'%',transition:'width .4s'}}/>
                      </div>
                      <div style={{fontSize:14,fontWeight:900,color:'#1e3a8a',
                        textAlign:'right',marginTop:3}}>
                        {total}
                      </div>
                    </div>
                  </div>
                )
              })
            }
          </Card>

        </div>
      )}

      {/* ════ TRENDS ════ */}
      {page==='trends' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>

          {/* Slot filter */}
          <Card style={{padding:'12px 14px'}}>
            <div style={{fontSize:10,fontWeight:700,color:'rgba(29,78,216,0.45)',
              textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Filter by slot</div>
            <div style={{display:'flex',gap:6}}>
              {[{id:'all',l:'All bookings'},{id:'morning',l:'🌅 Morning'},{id:'evening',l:'🌙 Evening'}].map(f=>(
                <Pill key={f.id} label={f.l} active={slotFilter===f.id} onClick={()=>setSlotFilter(f.id)} color={PURPLE}/>
              ))}
            </div>
          </Card>

          {/* Line chart */}
          <Card>
            <SecTitle>Monthly trend {slotFilter!=='all'?`— ${slotFilter} only`:''}</SecTitle>
            {chartReady && trendData.length > 0
              ? <LineChart
                  datasets={[{
                    data: trendData,
                    borderColor: slotFilter==='evening'?'#d97706':PURPLE,
                    backgroundColor: (slotFilter==='evening'?'#d97706':PURPLE)+'18',
                    fill:true, tension:.4, pointRadius:4,
                    pointBackgroundColor: slotFilter==='evening'?'#d97706':PURPLE,
                    borderWidth:2,
                  }]}
                  labels={trendLabels}
                  height={170}
                />
              : <div style={{height:170,display:'flex',alignItems:'center',justifyContent:'center',
                  color:'rgba(29,78,216,0.3)',fontSize:13}}>
                  {chartReady?'No data':'Loading…'}
                </div>}
            {trendData.length > 0 && (() => {
              const max=Math.max(...trendData); const peakI=trendData.indexOf(max)
              return <div style={{marginTop:10,fontSize:12,color:'rgba(29,78,216,0.6)',textAlign:'center',fontWeight:600}}>
                🏆 Peak: <span style={{color:PURPLE,fontWeight:800}}>{trendLabels[peakI]}</span> ({max} bookings)
              </div>
            })()}
          </Card>

          {/* Month breakdown */}
          <Card>
            <SecTitle>Month-by-month breakdown</SecTitle>
            {A.sortedMonths.map((m,i)=>{
              const d=A.monthMap[m]
              const val=slotFilter==='morning'?d.morning:slotFilter==='evening'?d.evening:d.all
              const maxC=Math.max(...trendData)||1
              const [yr,mm]=m.split('-')
              return (
                <div key={m} style={{display:'flex',alignItems:'center',gap:10,
                  padding:'9px 0',borderBottom:i<A.sortedMonths.length-1?'1px solid rgba(59,130,246,0.07)':'none'}}>
                  <div style={{width:58,fontSize:11,fontWeight:700,color:'#1e3a8a',
                    fontFamily:"'Cinzel',serif",flexShrink:0}}>
                    {MONTH_SHORT[parseInt(mm,10)-1]} {yr}
                  </div>
                  <div style={{flex:1,height:7,borderRadius:4,background:'rgba(109,40,217,0.1)',overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:4,background:PURPLE+'99',
                      width:Math.round(val/maxC*100)+'%',transition:'width .4s'}}/>
                  </div>
                  {slotFilter==='all' && (
                    <div style={{display:'flex',gap:4,flexShrink:0}}>
                      <span style={{fontSize:10,color:'#1d4ed8',fontWeight:700}}>🌅{d.morning}</span>
                      <span style={{fontSize:10,color:'#d97706',fontWeight:700}}>🌙{d.evening}</span>
                    </div>
                  )}
                  <div style={{width:24,fontSize:13,fontWeight:900,color:PURPLE,textAlign:'right',flexShrink:0}}>{val}</div>
                </div>
              )
            })}
          </Card>

        </div>
      )}

      {/* ════ UPCOMING ════ */}
      {page==='upcoming' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>

          {/* Filters */}
          <Card style={{padding:'12px 14px'}}>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <div style={{position:'relative'}}>
                <input
                  placeholder="🔍  Search by name…"
                  value={upSearch}
                  onChange={e=>setUpSearch(e.target.value)}
                  style={{width:'100%',padding:'10px 36px 10px 12px',borderRadius:11,
                    border:'1px solid rgba(59,130,246,0.2)',background:'rgba(239,246,255,0.8)',
                    fontSize:13,outline:'none',boxSizing:'border-box'}}
                />
                {upSearch && (
                  <button onClick={()=>setUpSearch('')}
                    style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',
                      background:'none',border:'none',cursor:'pointer',fontSize:14,color:'rgba(29,78,216,0.4)'}}>✕</button>
                )}
              </div>
              <div style={{display:'flex',gap:6}}>
                {[{id:'all',l:'All'},{id:'morning',l:'🌅 Morning'},{id:'evening',l:'🌙 Evening'}].map(f=>(
                  <Pill key={f.id} label={f.l} active={upSlot===f.id} onClick={()=>setUpSlot(f.id)} color={AMBER}/>
                ))}
              </div>
            </div>
          </Card>

          {/* List */}
          <Card>
            <SecTitle>{filteredUpcoming.length} booking{filteredUpcoming.length!==1?'s':''} · next 30 days</SecTitle>
            {filteredUpcoming.length===0
              ? <div style={{textAlign:'center',padding:'24px 0',color:'rgba(29,78,216,0.3)',fontSize:13}}>
                  No upcoming bookings match your filter 🙏
                </div>
              : filteredUpcoming.map((b,i)=>{
                const d=new Date(b.date+'T00:00:00')
                const isToday=b.date===today
                const isMorning=b.time==='Morning'
                return (
                  <div key={b.id||i} style={{display:'flex',alignItems:'center',gap:12,
                    padding:'11px 0',borderBottom:i<filteredUpcoming.length-1?'1px solid rgba(59,130,246,0.08)':'none'}}>
                    <div style={{
                      background:isToday?'linear-gradient(135deg,#1d4ed8,#3b82f6)':'rgba(239,246,255,0.9)',
                      borderRadius:12,padding:'7px 9px',textAlign:'center',minWidth:46,flexShrink:0,
                      border:isToday?'none':'1px solid rgba(59,130,246,0.15)'}}>
                      <div style={{fontSize:17,fontWeight:900,lineHeight:1,
                        color:isToday?'#fff':'#1e3a8a',fontFamily:"'Cinzel',serif"}}>{d.getDate()}</div>
                      <div style={{fontSize:9,marginTop:2,fontWeight:700,
                        color:isToday?'rgba(255,255,255,0.8)':'rgba(29,78,216,0.5)'}}>
                        {MONTH_SHORT[d.getMonth()]}
                      </div>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:'#1e3a8a',
                        fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.name}</div>
                      <div style={{fontSize:11,color:'rgba(29,78,216,0.4)',marginTop:1}}>
                        {DAYS_SHORT[d.getDay()]}{isToday?' · Today':''}
                        {b.mobile&&<span> · 📱 {b.mobile}</span>}
                      </div>
                    </div>
                    <span style={{fontSize:11,padding:'3px 8px',borderRadius:20,fontWeight:700,flexShrink:0,
                      background:isMorning?'#dbeafe':'#fef3c7',color:isMorning?'#1d4ed8':'#92400e'}}>
                      {isMorning?'🌅':'🌙'} {b.time}
                    </span>
                  </div>
                )
              })
            }
          </Card>

        </div>
      )}

      {/* Footer */}
      <div style={{textAlign:'center',padding:'10px 0 6px',
        color:'rgba(29,78,216,0.2)',fontSize:11,letterSpacing:8}}>✦ ✦ ✦</div>

    </div>
  )
}
