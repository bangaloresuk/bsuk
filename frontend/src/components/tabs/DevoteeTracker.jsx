// ============================================================
//  DevoteeTracker — Production ready, zero overflow bugs
//  Props: bookings[] from App.jsx (live Google Sheets data)
// ============================================================
import React from 'react'

// ── Constants ─────────────────────────────────────────────────
const SC = { active:'#15803d', 'at-risk':'#b45309', inactive:'#dc2626' }
const SB = { active:'#dcfce7', 'at-risk':'#fef3c7', inactive:'#fee2e2' }
const AV_BG   = ['#bfdbfe','#a7f3d0','#fed7aa','#ddd6fe','#fecaca','#d1fae5','#fde68a','#e0e7ff']
const AV_TEXT = ['#1e40af','#065f46','#92400e','#4c1d95','#991b1b','#064e3b','#78350f','#3730a3']

// ── Pure helpers ──────────────────────────────────────────────
const ci  = n => { let h=0; for(const c of n) h=(h*31+c.charCodeAt(0))&0xffff; return h%8 }
const ini = n => { const p=n.trim().split(/\s+/); return (p[0][0]+(p[1]?p[1][0]:'')).toUpperCase() }

function localToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function daysSince(dateStr) {
  const now = new Date(); now.setHours(0,0,0,0)
  return Math.round((now - new Date(dateStr + 'T00:00:00')) / 86400000)
}
function monthLabel(ym) {
  return new Date(ym + '-01T00:00:00').toLocaleDateString('en-IN', { month: 'short' })
}

// ── Build devotees ────────────────────────────────────────────
function buildDevotees(bookings) {
  const NOW = localToday()
  const map = {}
  bookings.forEach(b => {
    const mob  = (b.mobile || '').trim()
    const name = (b.name   || '').trim()
    const date = (b.date   || '').slice(0, 10)
    if (!mob || date.length < 10) return
    if (!map[mob]) map[mob] = { name, mobile: mob, past: new Set(), future: new Set() }
    map[mob].name = name
    date <= NOW ? map[mob].past.add(date) : map[mob].future.add(date)
  })

  return Object.values(map).map(d => {
    const past    = [...d.past].sort()
    const future  = [...d.future].sort()
    const last    = past.length ? past[past.length - 1] : null
    const ds      = last ? daysSince(last) : 9999
    const status  = ds <= 30 ? 'active' : ds <= 90 ? 'at-risk' : 'inactive'
    const bPts    = Math.min(50, past.length * 5)
    const sPts    = status === 'active' ? 30 : status === 'at-risk' ? 15 : 0
    const rPts    = ds <= 90 ? Math.round(20 * (1 - ds / 90)) : 0
    const score   = bPts + sPts + rPts
    const tier    = past.length >= 5 ? 'core' : past.length >= 2 ? 'regular' : 'one-time'
    const monthMap = {}
    past.forEach(dt => { const ym = dt.slice(0,7); monthMap[ym] = (monthMap[ym]||0)+1 })
    return { name:d.name, mobile:d.mobile, total:past.length, futureCount:future.length,
      past, future, last:last||'', ds, status, score, tier, monthMap }
  }).sort((a,b) => b.total - a.total)
}

function allMonths(devs) {
  const s = new Set()
  devs.forEach(d => Object.keys(d.monthMap).forEach(ym => s.add(ym)))
  return [...s].sort()
}

// ── Chart.js ──────────────────────────────────────────────────
function useChart() {
  const [ok, setOk] = React.useState(!!window.Chart)
  React.useEffect(() => {
    if (window.Chart) return
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
    s.onload = () => setOk(true)
    document.head.appendChild(s)
  }, [])
  return ok
}

function Chart({ make, watch, h = 220 }) {
  const ref = React.useRef(); const ok = useChart()
  React.useEffect(() => {
    if (!ok || !ref.current) return
    const c = new window.Chart(ref.current, make())
    return () => c.destroy()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok, ...watch])
  return ok
    ? <div style={{position:'relative',width:'100%',height:h}}><canvas ref={ref}/></div>
    : <div style={{height:h,display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(29,78,216,0.3)',fontSize:12}}>Loading…</div>
}

// ── Atoms ─────────────────────────────────────────────────────
function Av({ name, sz = 32 }) {
  const i = ci(name)
  return (
    <div style={{
      width:sz, height:sz, borderRadius:'50%', flexShrink:0,
      background:AV_BG[i], color:AV_TEXT[i],
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:sz*0.35, fontWeight:800,
      // critical: prevent bleed
      minWidth:sz, overflow:'hidden',
    }}>{ini(name)}</div>
  )
}

function Badge({ s }) {
  return <span style={{fontSize:10,fontWeight:800,padding:'2px 7px',borderRadius:20,
    background:SB[s]||'#f3f4f6',color:SC[s]||'#6b7280',
    textTransform:'uppercase',letterSpacing:'0.4px',flexShrink:0}}>{s}</span>
}

// ── Attention strip ───────────────────────────────────────────
function Attention({ devs }) {
  const list = devs.filter(d => d.status !== 'active').sort((a,b) => b.ds - a.ds).slice(0, 5)
  if (!list.length) return null
  return (
    <div style={{background:'#fef9c3',border:'1.5px solid #fcd34d',borderRadius:14,
      padding:'14px 16px',marginBottom:0}}>
      <div style={{fontSize:13,fontWeight:800,color:'#92400e',marginBottom:10}}>
        ⚠️ Needs your attention
      </div>
      {list.map(d => (
        <div key={d.mobile} style={{display:'flex',alignItems:'center',gap:10,
          flexWrap:'wrap',fontSize:13,marginBottom:8,
          // prevent avatar overflow
          overflow:'hidden'}}>
          <Av name={d.name} sz={24}/>
          <span style={{fontWeight:700,color:'#78350f',flexShrink:0}}>{d.name}</span>
          <span style={{color:'rgba(120,53,15,0.65)',fontSize:12}}>
            — last seen <b>{d.ds === 9999 ? '—' : d.ds + 'd ago'}</b>
            {d.last ? ` (${d.last})` : ''}
          </span>
          <Badge s={d.status}/>
        </div>
      ))}
    </div>
  )
}

// ── Tier card ─────────────────────────────────────────────────
function TierCard({ id, label, list, open, onToggle, onSelect }) {
  return (
    // position:relative + overflow:visible so dropdown doesn't clip
    <div style={{position:'relative'}}>
      <div onClick={onToggle} style={{
        background:'rgba(255,255,255,0.82)',
        border:`2px solid ${open ? 'rgba(29,78,216,0.45)' : 'rgba(59,130,246,0.18)'}`,
        borderRadius:14, padding:'12px 14px', cursor:'pointer',
        textAlign:'center', transition:'border-color .15s', userSelect:'none',
      }}>
        <div style={{fontSize:10,color:'rgba(29,78,216,0.5)',fontWeight:800,
          textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:4}}>{label}</div>
        <div style={{fontSize:30,fontWeight:900,color:'#1e3a8a',
          fontFamily:"'Cinzel',serif",lineHeight:1}}>{list.length}</div>
        <div style={{fontSize:10,color:'rgba(29,78,216,0.4)',marginTop:4}}>
          {open ? '▲ Hide' : '▼ Show members'}
        </div>
      </div>

      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', left:0,
          minWidth:200, width:'max-content', maxWidth:'90vw',
          background:'#ffffff',
          border:'1.5px solid rgba(59,130,246,0.25)',
          borderRadius:12, padding:'10px 12px',
          display:'flex', flexDirection:'column', gap:8,
          zIndex:200,
          boxShadow:'0 8px 24px rgba(29,78,216,0.12)',
          maxHeight:320, overflowY:'auto',
        }}>
          {list.map(d => (
            <div key={d.mobile}
              onClick={() => onSelect(d)}
              style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',
                padding:'6px 4px',borderRadius:8,
                transition:'background .1s'}}
              onMouseEnter={e => e.currentTarget.style.background='rgba(239,246,255,0.8)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <Av name={d.name} sz={28}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:'#1e3a8a',
                  whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{d.name}</div>
                <div style={{fontSize:10,color:'rgba(29,78,216,0.5)',
                  display:'flex',alignItems:'center',gap:5,marginTop:1}}>
                  {d.total} bookings · <Badge s={d.status}/>
                </div>
              </div>
              <span style={{fontSize:14,fontWeight:900,color:'#1e3a8a',flexShrink:0}}>{d.total}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Detail drawer ─────────────────────────────────────────────
function Drawer({ dev, onClose }) {
  const cols   = Object.keys(dev.monthMap).sort()
  const labels = cols.map(monthLabel)
  const counts = cols.map(ym => dev.monthMap[ym])
  const c      = ci(dev.name)

  // weekly heatmap
  const start = dev.past[0] ? new Date(dev.past[0]+'T00:00:00') : new Date()
  const end   = new Date(); end.setHours(0,0,0,0)
  const weeks=[], wlbls=[]
  let prevM=''
  for (let w=0; w<80; w++) {
    const ws = new Date(start); ws.setDate(start.getDate()+w*7)
    if (ws > end) break
    const ym = ws.toISOString().slice(0,7)
    const mn = monthLabel(ym)
    wlbls.push(mn!==prevM?mn:''); if(mn) prevM=mn
    const has = dev.past.some(dt=>{const d=new Date(dt+'T00:00:00');return d>=ws&&d<new Date(ws.getTime()+604800000)})
    weeks.push({has,label:ws.toISOString().slice(0,10)})
  }

  return (
    <div style={{background:'rgba(239,246,255,0.75)',border:'1.5px solid rgba(59,130,246,0.2)',
      borderRadius:16,padding:18,marginBottom:4}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,
        flexWrap:'wrap'}}>
        <Av name={dev.name} sz={46}/>
        <div>
          <div style={{fontFamily:"'Cinzel',serif",fontWeight:800,color:'#1e3a8a',fontSize:16}}>{dev.name}</div>
          <div style={{fontSize:12,color:'rgba(29,78,216,0.5)',marginTop:2}}>📱 {dev.mobile}</div>
          <div style={{marginTop:6}}><Badge s={dev.status}/></div>
        </div>
        <button onClick={onClose} style={{marginLeft:'auto',width:32,height:32,
          borderRadius:'50%',border:'none',background:'rgba(29,78,216,0.1)',
          cursor:'pointer',fontSize:16,color:'#1e3a8a',fontWeight:900,flexShrink:0}}>✕</button>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(90px,1fr))',
        gap:8,marginBottom:16}}>
        {[['Past bookings',dev.total],['Upcoming',dev.futureCount],
          ['Days since',dev.ds===9999?'—':dev.ds+'d'],
          ['Next booking',dev.future[0]||'—'],
          ['Seva score',dev.score+'/100']
        ].map(([l,v])=>(
          <div key={l} style={{background:'rgba(255,255,255,0.85)',borderRadius:10,padding:'9px 12px'}}>
            <div style={{fontSize:10,color:'rgba(29,78,216,0.45)',fontWeight:700,
              textTransform:'uppercase',marginBottom:3}}>{l}</div>
            <div style={{fontSize:16,fontWeight:900,color:'#1e3a8a'}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Monthly chart */}
      {cols.length > 0 && (
        <Chart h={160} watch={[dev.mobile]} make={()=>({
          type:'bar',
          data:{labels,datasets:[{data:counts,
            backgroundColor:counts.map(v=>v>0?AV_BG[c]:'rgba(239,246,255,0.5)'),
            borderColor:counts.map(v=>v>0?AV_TEXT[c]:'rgba(59,130,246,0.15)'),
            borderWidth:1,borderRadius:3}]},
          options:{responsive:true,maintainAspectRatio:false,
            plugins:{legend:{display:false},
              title:{display:true,text:'Monthly past bookings',font:{size:12},color:'#6b7280'}},
            scales:{x:{ticks:{font:{size:10}},grid:{display:false}},
              y:{beginAtZero:true,ticks:{font:{size:10},stepSize:1},
                grid:{color:'rgba(0,0,0,0.05)'}}}}
        })}/>
      )}

      {/* Weekly heatmap */}
      {weeks.length > 0 && (
        <div style={{marginTop:14}}>
          <div style={{fontSize:11,color:'rgba(29,78,216,0.45)',fontWeight:700,marginBottom:6}}>
            Week-by-week activity
          </div>
          <div style={{display:'flex',gap:2,overflowX:'auto',paddingBottom:4}}>
            {weeks.map((w,i)=>(
              <div key={i} title={`${w.label}${w.has?' — booked':''}`}
                style={{width:13,height:13,borderRadius:2,flexShrink:0,
                  background:w.has?AV_TEXT[c]:'#e0e7ff'}}/>
            ))}
          </div>
          <div style={{display:'flex',gap:2,marginTop:2}}>
            {wlbls.map((l,i)=>(
              <div key={i} style={{width:13,fontSize:8,color:'rgba(29,78,216,0.35)',
                textAlign:'center',flexShrink:0}}>{l}</div>
            ))}
          </div>
        </div>
      )}

      {/* Booking history */}
      <div style={{marginTop:14}}>
        <div style={{fontSize:11,color:'rgba(29,78,216,0.45)',fontWeight:700,marginBottom:6}}>
          Booking history
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:220,overflowY:'auto'}}>
          {[...dev.past].reverse().map(dt=>(
            <div key={'p'+dt} style={{display:'flex',alignItems:'center',gap:8,
              fontSize:12,padding:'5px 10px',borderRadius:8,
              background:'rgba(255,255,255,0.8)'}}>
              <span style={{fontSize:10,padding:'1px 7px',borderRadius:20,fontWeight:800,
                background:'#dcfce7',color:'#065f46',flexShrink:0}}>Done</span>
              <span style={{fontWeight:700,color:'#1e3a8a'}}>{dt}</span>
              <span style={{color:'rgba(29,78,216,0.35)',fontSize:10,marginLeft:'auto'}}>
                {new Date(dt+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short'})}
              </span>
            </div>
          ))}
          {dev.future.map(dt=>(
            <div key={'f'+dt} style={{display:'flex',alignItems:'center',gap:8,
              fontSize:12,padding:'5px 10px',borderRadius:8,
              background:'rgba(219,234,254,0.5)'}}>
              <span style={{fontSize:10,padding:'1px 7px',borderRadius:20,fontWeight:800,
                background:'#dbeafe',color:'#1e40af',flexShrink:0}}>Upcoming</span>
              <span style={{fontWeight:700,color:'#1e3a8a'}}>{dt}</span>
              <span style={{color:'rgba(29,78,216,0.35)',fontSize:10,marginLeft:'auto'}}>
                {new Date(dt+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short'})}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Heatmap table ─────────────────────────────────────────────
function HeatGrid({ devs }) {
  const months = allMonths(devs)
  if (!months.length) return <div style={{color:'rgba(29,78,216,0.3)',fontSize:12,padding:12}}>No data</div>
  return (
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:400}}>
        <thead>
          <tr>
            <th style={{textAlign:'left',padding:'6px 10px',color:'rgba(29,78,216,0.5)',
              fontWeight:800,fontSize:10,textTransform:'uppercase',
              borderBottom:'1px solid rgba(59,130,246,0.15)',whiteSpace:'nowrap'}}>Devotee</th>
            {months.map(ym=>(
              <th key={ym} style={{padding:'6px 4px',color:'rgba(29,78,216,0.5)',fontWeight:800,
                fontSize:10,textAlign:'center',
                borderBottom:'1px solid rgba(59,130,246,0.15)',whiteSpace:'nowrap'}}>
                {monthLabel(ym)}
              </th>
            ))}
            <th style={{padding:'6px 4px',color:'rgba(29,78,216,0.5)',fontWeight:800,
              fontSize:10,textAlign:'center',
              borderBottom:'1px solid rgba(59,130,246,0.15)'}}>Total</th>
          </tr>
        </thead>
        <tbody>
          {devs.map(d=>(
            <tr key={d.mobile}>
              <td style={{padding:'5px 10px',borderBottom:'1px solid rgba(59,130,246,0.07)',
                whiteSpace:'nowrap'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <Av name={d.name} sz={22}/>
                  <span style={{fontSize:12,color:'#1e3a8a',fontWeight:600}}>{d.name}</span>
                </div>
              </td>
              {months.map(ym=>{
                const n = d.monthMap[ym]||0
                return (
                  <td key={ym} style={{padding:'3px 2px',textAlign:'center',
                    borderBottom:'1px solid rgba(59,130,246,0.07)'}}>
                    <div style={{width:26,height:26,borderRadius:5,margin:'0 auto',
                      background:n>0?SC[d.status]:'rgba(239,246,255,0.5)',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:10,color:n>0?'#fff':'transparent',fontWeight:800}}>
                      {n>0?n:''}
                    </div>
                  </td>
                )
              })}
              <td style={{padding:'5px 4px',textAlign:'center',fontWeight:800,
                color:'#1e3a8a',fontSize:13,
                borderBottom:'1px solid rgba(59,130,246,0.07)'}}>{d.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════
export default function DevoteeTracker({ bookings = [] }) {
  const [search,  setSearch]  = React.useState('')
  const [filter,  setFilter]  = React.useState('all')
  const [page,    setPage]    = React.useState('overview')
  const [sel,     setSel]     = React.useState(null)
  const [tierOpen,setTierOpen]= React.useState(null)

  const ALL = React.useMemo(() => buildDevotees(bookings), [bookings])

  const devs = React.useMemo(() => {
    let d = ALL
    if (search.trim()) d = d.filter(x =>
      x.name.toLowerCase().includes(search.toLowerCase()) || x.mobile.includes(search))
    if (filter !== 'all') d = d.filter(x => x.status === filter)
    return d
  }, [ALL, search, filter])

  const active   = ALL.filter(d=>d.status==='active').length
  const atRisk   = ALL.filter(d=>d.status==='at-risk').length
  const inactive = ALL.filter(d=>d.status==='inactive').length
  const core     = ALL.filter(d=>d.tier==='core')
  const regular  = ALL.filter(d=>d.tier==='regular')
  const oneTime  = ALL.filter(d=>d.tier==='one-time')

  const months     = allMonths(ALL)
  const mLabels    = months.map(monthLabel)
  const mCounts    = months.map(ym => {
    const now = localToday()
    return bookings.filter(b=>(b.date||'').slice(0,7)===ym && b.date<=now).length
  })

  const navSt = id => ({
    flex:1, padding:'8px 4px', border:'none', borderRadius:10, cursor:'pointer',
    fontFamily:"'Cinzel',serif", fontSize:10, fontWeight:800,
    whiteSpace:'nowrap', transition:'all .15s',
    background: page===id ? 'linear-gradient(135deg,#1e3a8a,#3b82f6)' : 'rgba(239,246,255,0.7)',
    color:      page===id ? '#fff' : 'rgba(29,78,216,0.55)',
    boxShadow:  page===id ? '0 2px 8px rgba(29,78,216,0.2)' : 'none',
  })

  // close tier dropdown when clicking elsewhere
  React.useEffect(() => {
    const h = () => setTierOpen(null)
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [])

  if (!bookings.length) return (
    <div style={{textAlign:'center',padding:'60px 20px',
      color:'rgba(29,78,216,0.35)',fontSize:13}}>
      <div style={{fontSize:36,marginBottom:8}}>🪷</div>
      Loading devotee data…
    </div>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>

      {/* ── KPI cards ── */}
      <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
        {[['Total devotees',ALL.length,'#1d4ed8'],
          ['Active',active,'#15803d'],
          ['At risk',atRisk,'#b45309'],
          ['Inactive',inactive,'#dc2626'],
          ['Total bookings',bookings.length,'#6d28d9']
        ].map(([l,v,c])=>(
          <div key={l} style={{flex:'1 1 100px',background:'rgba(255,255,255,0.82)',
            borderRadius:14,padding:'14px 16px',
            border:'1px solid rgba(59,130,246,0.15)'}}>
            <div style={{fontSize:10,color:'rgba(29,78,216,0.45)',fontWeight:700,
              textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:6}}>{l}</div>
            <div style={{fontSize:28,fontWeight:900,color:c,
              fontFamily:"'Cinzel',serif",lineHeight:1}}>{v}</div>
          </div>
        ))}
      </div>

      {/* ── Tier cards — each is position:relative so dropdown stacks correctly ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))',gap:10,
        overflow:'visible'}}>
        {[['core','Core (5+)',core],
          ['regular','Regular (2–4)',regular],
          ['one-time','One-time',oneTime]
        ].map(([id,label,list])=>(
          <TierCard key={id} id={id} label={label} list={list}
            open={tierOpen===id}
            onToggle={e=>{e.stopPropagation();setTierOpen(tierOpen===id?null:id)}}
            onSelect={d=>{setSel(d);setPage('table');setTierOpen(null);window.scrollTo({top:0,behavior:'smooth'})}}
          />
        ))}
      </div>

      {/* ── Attention strip ── */}
      <Attention devs={ALL}/>

      {/* ── Sub-nav ── */}
      <div style={{display:'flex',gap:5,background:'rgba(255,255,255,0.6)',
        borderRadius:12,padding:4,border:'1px solid rgba(59,130,246,0.12)',
        overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
        {[['overview','📊 Overview'],['charts','📈 Charts'],
          ['heatmap','🗓️ Heatmap'],['table','🪷 All Devotees']
        ].map(([id,lbl])=>(
          <button key={id} style={navSt(id)}
            onClick={()=>{setPage(id);setSel(null)}}>{lbl}</button>
        ))}
      </div>

      {/* ── Search + filter ── */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <input placeholder="🔍 Search name or mobile…"
          value={search} onChange={e=>setSearch(e.target.value)}
          style={{flex:'1 1 180px',padding:'9px 12px',borderRadius:10,
            border:'1px solid rgba(59,130,246,0.2)',
            background:'rgba(239,246,255,0.8)',fontSize:13,outline:'none'}}/>
        <select value={filter} onChange={e=>setFilter(e.target.value)}
          style={{padding:'9px 12px',borderRadius:10,
            border:'1px solid rgba(59,130,246,0.2)',
            background:'rgba(239,246,255,0.8)',fontSize:13,cursor:'pointer'}}>
          <option value="all">All devotees</option>
          <option value="active">Active (≤30d)</option>
          <option value="at-risk">At risk (31–90d)</option>
          <option value="inactive">Inactive (90d+)</option>
        </select>
      </div>

      {/* ── Detail drawer ── */}
      {sel && <Drawer dev={sel} onClose={()=>setSel(null)}/>}

      {/* ── Legend ── */}
      <div style={{display:'flex',gap:14,flexWrap:'wrap',fontSize:11,
        color:'rgba(29,78,216,0.55)'}}>
        {[['Active ≤30d','#15803d'],['At risk 31–90d','#b45309'],['Inactive 90d+','#dc2626']].map(([l,c])=>(
          <span key={l} style={{display:'flex',alignItems:'center',gap:5}}>
            <span style={{width:10,height:10,borderRadius:2,background:c}}/>{l}
          </span>
        ))}
      </div>

      {/* ══ OVERVIEW ══ */}
      {page==='overview' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14}}>

            {/* Donut */}
            <div style={{background:'rgba(255,255,255,0.82)',borderRadius:16,
              padding:'14px 16px',border:'1px solid rgba(59,130,246,0.15)'}}>
              <div style={{fontSize:10,fontWeight:800,color:'rgba(29,78,216,0.45)',
                textTransform:'uppercase',letterSpacing:'1px',marginBottom:10}}>Status breakdown</div>
              <Chart h={170} watch={[active,atRisk,inactive]} make={()=>({
                type:'doughnut',
                data:{labels:['Active','At risk','Inactive'],
                  datasets:[{data:[active,atRisk,inactive],
                    backgroundColor:['#15803d','#b45309','#dc2626'],borderWidth:0}]},
                options:{responsive:true,maintainAspectRatio:false,cutout:'65%',
                  plugins:{legend:{display:false}}}
              })}/>
              <div style={{marginTop:10}}>
                {[['Active',active,'#15803d'],['At risk',atRisk,'#b45309'],['Inactive',inactive,'#dc2626']].map(([l,v,c])=>(
                  <div key={l} style={{display:'flex',alignItems:'center',gap:8,
                    fontSize:13,marginBottom:5}}>
                    <span style={{width:10,height:10,borderRadius:2,background:c,flexShrink:0}}/>
                    <span style={{color:'#1e3a8a'}}>{l}</span>
                    <span style={{marginLeft:'auto',fontWeight:800,color:'#1e3a8a'}}>{v}</span>
                    <span style={{color:'rgba(29,78,216,0.4)',fontSize:11}}>
                      {ALL.length?Math.round(v/ALL.length*100):0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly line */}
            <div style={{background:'rgba(255,255,255,0.82)',borderRadius:16,
              padding:'14px 16px',border:'1px solid rgba(59,130,246,0.15)'}}>
              <div style={{fontSize:10,fontWeight:800,color:'rgba(29,78,216,0.45)',
                textTransform:'uppercase',letterSpacing:'1px',marginBottom:10}}>
                Monthly past bookings
              </div>
              <Chart h={170} watch={[mCounts.join(',')]} make={()=>({
                type:'line',
                data:{labels:mLabels,datasets:[{data:mCounts,borderColor:'#1d4ed8',
                  backgroundColor:'rgba(29,78,216,0.08)',borderWidth:2,
                  tension:0.4,fill:true,pointRadius:4,pointBackgroundColor:'#1d4ed8'}]},
                options:{responsive:true,maintainAspectRatio:false,
                  plugins:{legend:{display:false}},
                  scales:{x:{ticks:{font:{size:11}},grid:{display:false}},
                    y:{beginAtZero:true,ticks:{font:{size:11},stepSize:5},
                      grid:{color:'rgba(0,0,0,0.05)'}}}}
              })}/>
            </div>
          </div>

          {/* Top bar */}
          <div style={{background:'rgba(255,255,255,0.82)',borderRadius:16,
            padding:'14px 16px',border:'1px solid rgba(59,130,246,0.15)'}}>
            <div style={{fontSize:10,fontWeight:800,color:'rgba(29,78,216,0.45)',
              textTransform:'uppercase',letterSpacing:'1px',marginBottom:10}}>
              Top devotees by past bookings
            </div>
            <Chart
              h={Math.max(260, Math.min(devs.length,14)*34+60)}
              watch={[devs.slice(0,14).map(d=>d.total).join(',')]}
              make={()=>({
                type:'bar',
                data:{
                  labels:devs.slice(0,14).map(d=>d.name.length>16?d.name.slice(0,14)+'…':d.name),
                  datasets:[{data:devs.slice(0,14).map(d=>d.total),
                    backgroundColor:devs.slice(0,14).map(d=>SC[d.status]),
                    borderWidth:0,borderRadius:4}]},
                options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,
                  plugins:{legend:{display:false},
                    tooltip:{callbacks:{label:c=>` ${c.raw} past bookings`}}},
                  scales:{x:{beginAtZero:true,grid:{color:'rgba(0,0,0,0.05)'},
                    ticks:{font:{size:11},stepSize:2}},
                    y:{ticks:{font:{size:11}},grid:{display:false}}}}
              })}
            />
          </div>
        </div>
      )}

      {/* ══ CHARTS ══ */}
      {page==='charts' && (
        <div style={{background:'rgba(255,255,255,0.82)',borderRadius:16,
          padding:'14px 16px',border:'1px solid rgba(59,130,246,0.15)'}}>
          <div style={{fontSize:10,fontWeight:800,color:'rgba(29,78,216,0.45)',
            textTransform:'uppercase',letterSpacing:'1px',marginBottom:10}}>
            Days since last booking — longer bar = needs follow-up first
          </div>
          <Chart
            h={Math.max(300, devs.length*30+60)}
            watch={[devs.map(d=>d.ds).join(',')]}
            make={()=>{
              const s=[...devs].sort((a,b)=>b.ds-a.ds)
              return {
                type:'bar',
                data:{labels:s.map(d=>d.name.length>14?d.name.slice(0,12)+'…':d.name),
                  datasets:[{data:s.map(d=>d.ds===9999?0:d.ds),
                    backgroundColor:s.map(d=>SC[d.status]),borderWidth:0,borderRadius:4}]},
                options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,
                  plugins:{legend:{display:false},
                    tooltip:{callbacks:{label:c=>` ${c.raw} days since last booking`}}},
                  scales:{x:{beginAtZero:true,grid:{color:'rgba(0,0,0,0.05)'},
                    ticks:{font:{size:11}}},
                    y:{ticks:{font:{size:11}},grid:{display:false}}}}
              }
            }}
          />
        </div>
      )}

      {/* ══ HEATMAP ══ */}
      {page==='heatmap' && (
        <div style={{background:'rgba(255,255,255,0.82)',borderRadius:16,
          padding:'14px 16px',border:'1px solid rgba(59,130,246,0.15)'}}>
          <div style={{fontSize:10,fontWeight:800,color:'rgba(29,78,216,0.45)',
            textTransform:'uppercase',letterSpacing:'1px',marginBottom:10}}>
            Month-by-month past bookings
          </div>
          <HeatGrid devs={devs}/>
        </div>
      )}

      {/* ══ ALL DEVOTEES ══ */}
      {page==='table' && (
        <div style={{background:'rgba(255,255,255,0.82)',borderRadius:16,
          padding:'14px 16px',border:'1px solid rgba(59,130,246,0.15)'}}>
          <div style={{fontSize:10,fontWeight:800,color:'rgba(29,78,216,0.45)',
            textTransform:'uppercase',letterSpacing:'1px',marginBottom:10}}>
            {devs.length} devotee{devs.length!==1?'s':''} · click a row to see details
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr>
                  {['Devotee','Mobile','Past bookings','Upcoming',
                    'Last booking','Days since','Score','Status'].map(h=>(
                    <th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:10,
                      fontWeight:800,color:'rgba(29,78,216,0.5)',textTransform:'uppercase',
                      letterSpacing:'0.8px',borderBottom:'1px solid rgba(59,130,246,0.15)',
                      whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {devs.map(d=>(
                  <tr key={d.mobile}
                    onClick={()=>{setSel(d);window.scrollTo({top:0,behavior:'smooth'})}}
                    style={{cursor:'pointer'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(239,246,255,0.6)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{padding:'9px 10px',
                      borderBottom:'1px solid rgba(59,130,246,0.08)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <Av name={d.name} sz={28}/>
                        <span style={{fontFamily:"'Cinzel',serif",fontWeight:700,
                          color:'#1e3a8a',fontSize:12}}>{d.name}</span>
                      </div>
                    </td>
                    <td style={{padding:'9px 10px',color:'rgba(29,78,216,0.45)',fontSize:11,
                      borderBottom:'1px solid rgba(59,130,246,0.08)'}}>{d.mobile}</td>
                    <td style={{padding:'9px 10px',fontWeight:900,color:'#1e3a8a',fontSize:14,
                      borderBottom:'1px solid rgba(59,130,246,0.08)'}}>{d.total}</td>
                    <td style={{padding:'9px 10px',
                      borderBottom:'1px solid rgba(59,130,246,0.08)'}}>
                      {d.futureCount>0
                        ? <span style={{background:'#dbeafe',color:'#1e40af',
                            padding:'1px 7px',borderRadius:20,fontWeight:700,fontSize:11}}>
                            {d.futureCount} upcoming
                          </span>
                        : '—'}
                    </td>
                    <td style={{padding:'9px 10px',color:'rgba(29,78,216,0.5)',fontSize:11,
                      borderBottom:'1px solid rgba(59,130,246,0.08)'}}>{d.last||'—'}</td>
                    <td style={{padding:'9px 10px',fontWeight:800,fontSize:13,
                      borderBottom:'1px solid rgba(59,130,246,0.08)',
                      color:d.ds>90?'#dc2626':d.ds>30?'#b45309':'#15803d'}}>
                      {d.ds===9999?'—':d.ds+'d'}
                    </td>
                    <td style={{padding:'9px 10px',
                      borderBottom:'1px solid rgba(59,130,246,0.08)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:5}}>
                        <div style={{flex:1,height:5,borderRadius:3,
                          background:'rgba(239,246,255,0.9)',overflow:'hidden'}}>
                          <div style={{height:5,borderRadius:3,
                            background:SC[d.status],width:d.score+'%'}}/>
                        </div>
                        <span style={{fontSize:10,color:'rgba(29,78,216,0.4)',minWidth:22}}>{d.score}</span>
                      </div>
                    </td>
                    <td style={{padding:'9px 10px',
                      borderBottom:'1px solid rgba(59,130,246,0.08)'}}>
                      <Badge s={d.status}/>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
