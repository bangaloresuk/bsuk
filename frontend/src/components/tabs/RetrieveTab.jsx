// ============================================================
//  RetrieveTab — look up + reshare bookings by mobile number
// ============================================================
import React from 'react'
import { SLOT_STYLE } from '../../config/prayerTimes.js'
import { getTodayStr, formatDateWithDay, formatDate, getDayName, cleanTime, maskMobile } from '../../utils/utils.js'
import { LocationPicker } from '../shared/LocationPicker.jsx'

const TYPE_LABELS  = { satsang:'🪔 Satsang', bhadra:'🌸 Bhadra Parikrama', matri:'🌺 Matri-Sammelan', savan:'🌿 Savan Parikrama' }
const TYPE_COLORS  = { satsang:'#92400e', bhadra:'#6d28d9', matri:'#be185d', savan:'#15803d' }
const TYPE_BGS     = { satsang:'rgba(217,119,6,0.12)', bhadra:'rgba(109,40,217,0.1)', matri:'rgba(190,24,93,0.1)', savan:'rgba(21,128,61,0.1)' }
const TYPE_BARS    = { satsang:'linear-gradient(90deg,#78350f,#d97706,#fbbf24)', bhadra:'linear-gradient(90deg,#5b21b6,#7c3aed,#a78bfa)', matri:'linear-gradient(90deg,#9d174d,#db2777,#f472b6)', savan:'linear-gradient(90deg,#14532d,#16a34a,#4ade80)' }

export default function RetrieveTab({
  feat,
  bookings, satsangBookings, bhadraBookings, matriBookings, savanBookings,
  shareMobile, setShareMobile,
  shareResults, setShareResults,
  shareMsg, setShareMsg,
  retrieveTypeFilter, setRetrieveTypeFilter,
  showRetrievePast, setShowRetrievePast,
  handleShareLookup,
  buildShareMsgPlain, buildShareMsg, handleCopy,
  buildSatsangShareMsgPlain, buildSatsangShareMsg, handleSatsangCopy,
  cancelling,
  handleCancelBooking, handleCancelSatsang, handleCancelSpecial,
  editingAddress, setEditingAddress,
  editAddressVal, setEditAddressVal,
  editMapsVal, setEditMapsVal,
  savingAddress, addressMsg,
  handleUpdateAddress,
}) {
  const todayStr = getTodayStr()

  const futureResults = (shareResults || []).filter(b => (b.date||'') >= todayStr)
  const pastResults   = (shareResults || []).filter(b => (b.date||'') <  todayStr)
    .sort((a,b) => (b.date||'').localeCompare(a.date||''))

  const TYPE_TABS = [
    { id:'prayer',  label:'Prayer',  icon:'🙏', color:'#1d4ed8' },
    feat.satsangBooking && { id:'satsang', label:'Satsang', icon:'🪔', color:'#92400e' },
    feat.bhadraBooking  && { id:'bhadra',  label:'Bhadra',  icon:'🌸', color:'#6d28d9' },
    feat.matriBooking   && { id:'matri',   label:'Matri',   icon:'🌺', color:'#be185d' },
    feat.savanBooking   && { id:'savan',   label:'Savan',   icon:'🌿', color:'#15803d' },
    { id:'all',     label:'All',     icon:'📋', color:'#1e3a8a' },
  ].filter(Boolean)

  return (
    <div className="card">
      <div style={{ textAlign:'center', marginBottom:20 }}>
        <div style={{ fontFamily:"'Cinzel',serif", color:'#1e3a8a', fontSize:17, fontWeight:700 }}>
          Retrieve Booking Details
        </div>
        <div style={{ color:'rgba(30,64,175,0.6)', fontSize:12, marginTop:4 }}>
          Enter your mobile number to find and share your booking
        </div>
        <div className="blue-line" style={{ marginTop:10 }}/>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {/* Mobile input */}
        <div>
          <label className="divine-label">📱 Your Mobile Number</label>
          <div style={{ display:'flex', gap:8 }}>
            <input className="divine-input"
              placeholder="Enter 10-digit mobile number"
              type="tel" maxLength="10"
              value={shareMobile}
              onChange={e => { setShareMsg(''); setShareResults(null); setShareMobile(e.target.value.replace(/[^0-9]/g,'')) }}
              style={{ flex:1 }}/>
            <button onClick={handleShareLookup}
              style={{ padding:'12px 16px', border:'none', borderRadius:10,
                background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',
                color:'#fff', fontWeight:700, fontSize:13,
                cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
                boxShadow:'0 3px 10px rgba(29,78,216,0.3)' }}>
              🔍 Find
            </button>
          </div>
        </div>

        {/* Type filter */}
        <div>
          <label className="divine-label">📋 Booking Type</label>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
            {TYPE_TABS.map(t => {
              const active = retrieveTypeFilter === t.id
              return (
                <button key={t.id} type="button"
                  onClick={() => { setRetrieveTypeFilter(t.id); setShareResults(null); setShareMsg('') }}
                  style={{ padding:'8px 4px', borderRadius:10, border:'none', cursor:'pointer',
                    fontFamily:"'Cinzel',serif", fontSize:10, fontWeight:800, transition:'all 0.15s',
                    background: active ? `linear-gradient(135deg,${t.color}dd,${t.color})` : 'rgba(239,246,255,0.7)',
                    color: active ? '#fff' : 'rgba(29,78,216,0.5)',
                    boxShadow: active ? `0 2px 8px ${t.color}44` : 'none',
                    outline: active ? 'none' : '1px solid rgba(59,130,246,0.15)' }}>
                  <div style={{ fontSize:14 }}>{t.icon}</div>
                  <div>{t.label}</div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Message */}
      {shareMsg && (
        <div style={{ marginTop:12, padding:'10px 14px', borderRadius:9, fontSize:13,
          background: shareMsg.startsWith('⚠️') ? '#fef3c7' : '#fee2e2',
          border:`1px solid ${shareMsg.startsWith('⚠️') ? '#fcd34d':'#fca5a5'}`,
          color: shareMsg.startsWith('⚠️') ? '#92400e':'#b91c1c' }}>
          {shareMsg}
        </div>
      )}

      {/* Results */}
      {shareResults && shareResults.length > 0 && (
        <div style={{ marginTop:18 }}>
          <div style={{ fontSize:12, color:'rgba(29,78,216,0.6)', fontWeight:700,
            textTransform:'uppercase', letterSpacing:'1px', marginBottom:12 }}>
            {shareResults.length} Booking{shareResults.length > 1 ? 's' : ''} Found
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {futureResults.map(b => (
              <BookingResultCard key={b.id} b={b}
                cancelling={cancelling}
                handleCancelBooking={handleCancelBooking}
                handleCancelSatsang={handleCancelSatsang}
                handleCancelSpecial={handleCancelSpecial}
                buildShareMsgPlain={buildShareMsgPlain} buildShareMsg={buildShareMsg} handleCopy={handleCopy}
                buildSatsangShareMsgPlain={buildSatsangShareMsgPlain} buildSatsangShareMsg={buildSatsangShareMsg} handleSatsangCopy={handleSatsangCopy}
                editingAddress={editingAddress} setEditingAddress={setEditingAddress}
                editAddressVal={editAddressVal} setEditAddressVal={setEditAddressVal}
                editMapsVal={editMapsVal} setEditMapsVal={setEditMapsVal}
                savingAddress={savingAddress} addressMsg={addressMsg}
                handleUpdateAddress={handleUpdateAddress}
                isFuture={true}
              />
            ))}
          </div>

          {/* Past bookings toggle */}
          {pastResults.length > 0 && (
            <div style={{ marginTop:14 }}>
              <button onClick={() => setShowRetrievePast(p => !p)}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center',
                  gap:8, padding:'10px 14px', borderRadius:10,
                  border:'1px solid rgba(29,78,216,0.2)',
                  background:'rgba(239,246,255,0.5)',
                  color:'rgba(29,78,216,0.6)', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                <span>{showRetrievePast ? '▲' : '▼'}</span>
                <span>{showRetrievePast ? 'Hide Past Bookings' : `Show Past Bookings (${pastResults.length})`}</span>
              </button>
              {showRetrievePast && (
                <div style={{ display:'flex', flexDirection:'column', gap:14, marginTop:8, opacity:0.75 }}>
                  {pastResults.map(b => (
                    <BookingResultCard key={b.id} b={b}
                      cancelling={cancelling}
                      handleCancelBooking={handleCancelBooking}
                      handleCancelSatsang={handleCancelSatsang}
                      handleCancelSpecial={handleCancelSpecial}
                      buildShareMsgPlain={buildShareMsgPlain} buildShareMsg={buildShareMsg} handleCopy={handleCopy}
                      buildSatsangShareMsgPlain={buildSatsangShareMsgPlain} buildSatsangShareMsg={buildSatsangShareMsg} handleSatsangCopy={handleSatsangCopy}
                      editingAddress={editingAddress} setEditingAddress={setEditingAddress}
                      editAddressVal={editAddressVal} setEditAddressVal={setEditAddressVal}
                      editMapsVal={editMapsVal} setEditMapsVal={setEditMapsVal}
                      savingAddress={savingAddress} addressMsg={addressMsg}
                      handleUpdateAddress={handleUpdateAddress}
                      isFuture={false}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {shareResults && shareResults.length === 0 && (
        <div style={{ textAlign:'center', padding:'16px 0', color:'rgba(29,78,216,0.4)', fontSize:13, marginTop:12 }}>
          No bookings found for this number.
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  BookingResultCard — single booking card in retrieve tab
// ─────────────────────────────────────────────────────────────
function BookingResultCard({ b, cancelling, handleCancelBooking, handleCancelSatsang, handleCancelSpecial,
  buildShareMsgPlain, buildShareMsg, handleCopy,
  buildSatsangShareMsgPlain, buildSatsangShareMsg, handleSatsangCopy,
  editingAddress, setEditingAddress, editAddressVal, setEditAddressVal,
  editMapsVal, setEditMapsVal, savingAddress, addressMsg, handleUpdateAddress, isFuture }) {

  const isSatsangType = ['satsang','bhadra','matri','savan'].includes(b._type)
  const color = isSatsangType ? TYPE_COLORS[b._type] : '#1d4ed8'
  const bg    = isSatsangType ? TYPE_BGS[b._type]    : 'rgba(239,246,255,0.7)'
  const bar   = isSatsangType ? TYPE_BARS[b._type]   : 'linear-gradient(90deg,#1e40af,#3b82f6,#93c5fd)'
  const label = isSatsangType ? TYPE_LABELS[b._type] : '🙏 Prayer'
  const c     = !isSatsangType ? (SLOT_STYLE[b.time] || SLOT_STYLE['Morning']) : null

  const shareMsg  = isSatsangType ? buildSatsangShareMsgPlain(b) : buildShareMsgPlain(b)
  const shareEnc  = isSatsangType ? buildSatsangShareMsg(b)       : buildShareMsg(b)
  const onCopy    = isSatsangType ? () => handleSatsangCopy(b)    : () => handleCopy(b)
  const onCancel  = () => {
    if (b._type === 'prayer' || !b._type) return handleCancelBooking(b.id)
    if (b._type === 'satsang') return handleCancelSatsang(b.id)
    return handleCancelSpecial(b.id, b._type)
  }

  return (
    <div style={{ borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(29,78,216,0.08)',
      border:`1px solid ${isSatsangType ? TYPE_BGS[b._type] : 'rgba(59,130,246,0.15)'}` }}>
      {/* Coloured top bar */}
      <div style={{ height:4, background:bar }}/>
      <div style={{ background:bg, padding:'16px' }}>
        {/* Badge */}
        <div style={{ marginBottom:6 }}>
          <span style={{ fontSize:10, fontWeight:800, color,
            background:`${color}18`, padding:'2px 8px', borderRadius:10,
            textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</span>
        </div>

        <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800, color, fontSize:14, marginBottom:4 }}>{b.name}</div>
        <div style={{ fontSize:11, color:'rgba(0,0,0,0.4)', marginBottom:8 }}>📱 {maskMobile(b.mobile)}</div>

        {isSatsangType ? (
          <>
            <div style={{ fontSize:12, fontWeight:700, color, marginBottom:2 }}>
              📅 {b.day ? b.day+', ' : ''}{formatDate(b.date)} · ⏰ {cleanTime(b.time)} onwards
            </div>
            {b.venue && <div style={{ fontSize:11, color:'#6b7280', marginBottom:2 }}>📍 {b.venue}</div>}
            {b.mapsLink && (
              <a href={b.mapsLink} target="_blank" rel="noopener noreferrer"
                style={{ fontSize:11, color, display:'block', marginBottom:2 }}>📌 View on Maps</a>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize:12, fontWeight:700, color:c?.color, marginBottom:2 }}>
              {c?.icon} {b.time} Prayer · {formatDateWithDay(b.date)}
            </div>
            {b.prayerTime && <div style={{ fontSize:11, color:'#6b7280', marginBottom:2 }}>🕐 {cleanTime(b.prayerTime)}</div>}
            {b.place && <div style={{ fontSize:11, color:'#6b7280', marginBottom:2 }}>📍 {b.place}</div>}
            {b.mapsLink && (
              <a href={b.mapsLink} target="_blank" rel="noopener noreferrer"
                style={{ fontSize:11, color:'#1d4ed8', display:'block', marginBottom:2 }}>📌 View on Maps</a>
            )}

            {/* Address edit (prayer only) */}
            {editingAddress === b.id ? (
              <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:8 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'rgba(29,78,216,0.6)',
                  textTransform:'uppercase', letterSpacing:'0.8px' }}>🌐 Find Location</div>
                <LocationPicker color="#1d4ed8"
                  placeholder="Search area, landmark, address…"
                  onPick={({ address, mapsLink }) => {
                    if (address)  setEditAddressVal(address)
                    if (mapsLink) setEditMapsVal(mapsLink)
                  }}/>
                <input className="divine-input" placeholder="Address / location name" value={editAddressVal}
                  onChange={e => setEditAddressVal(e.target.value)} style={{ fontSize:12 }}/>
                <input className="divine-input" placeholder="Google Maps link (optional)" value={editMapsVal}
                  onChange={e => setEditMapsVal(e.target.value)} style={{ fontSize:12 }}/>
                <div style={{ display:'flex', gap:6 }}>
                  <button disabled={savingAddress} onClick={() => handleUpdateAddress(b.id, editAddressVal, editMapsVal)}
                    style={{ flex:1, padding:'8px', border:'none', borderRadius:8,
                      background:'#1d4ed8', color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                    {savingAddress ? '⏳ Saving...' : '✓ Save'}
                  </button>
                  <button onClick={() => setEditingAddress(null)}
                    style={{ flex:1, padding:'8px', border:'1px solid #e5e7eb', borderRadius:8,
                      background:'#fff', color:'#374151', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                    Cancel
                  </button>
                </div>
                {addressMsg[b.id] && (
                  <div style={{ fontSize:11, color: addressMsg[b.id].startsWith('Address') ? '#065f46' : '#b91c1c' }}>
                    {addressMsg[b.id]}
                  </div>
                )}
              </div>
            ) : isFuture && (
              <button onClick={() => { setEditingAddress(b.id); setEditAddressVal(b.place||''); setEditMapsVal(b.mapsLink||'') }}
                style={{ marginTop:6, fontSize:11, color:'#1d4ed8', background:'none', border:'none',
                  cursor:'pointer', padding:0, fontWeight:600 }}>
                ✏️ Edit address
              </button>
            )}
          </>
        )}

        {/* Share buttons */}
        {isFuture && (
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <a href={`https://wa.me/?text=${shareEnc}`} target="_blank" rel="noopener noreferrer"
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                gap:6, padding:'9px', borderRadius:10, textDecoration:'none',
                background:'linear-gradient(135deg,#25D366,#128C7E)',
                color:'#fff', fontWeight:700, fontSize:12 }}>
              💬 WhatsApp
            </a>
            <button onClick={onCopy}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                gap:6, padding:'9px', borderRadius:10, border:'none',
                background:`${color}12`, color, fontWeight:700, fontSize:12, cursor:'pointer' }}>
              📋 Copy
            </button>
            {isFuture && (
              <button disabled={cancelling === b.id} onClick={onCancel}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                  gap:6, padding:'9px', borderRadius:10, border:'none',
                  background:'rgba(220,38,38,0.08)', color:'#b91c1c',
                  fontWeight:700, fontSize:12, cursor:'pointer',
                  opacity: cancelling === b.id ? 0.6 : 1 }}>
                {cancelling === b.id ? '⏳' : '🗑️'} Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
