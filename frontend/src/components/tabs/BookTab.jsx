// ============================================================
//  BookTab — prayer / satsang / special-event booking forms
//  Receives all state + handlers from App via props.
// ============================================================
import React from 'react'
import { SLOT_STYLE, SLOTS } from '../../config/prayerTimes.js'
import { getPrayerTimes } from '../../config/prayerTimes.js'
import { getTodayStr, formatDateWithDay, cleanTime } from '../../utils/utils.js'
import { SkeletonCard }    from '../shared/SkeletonCard.jsx'
import { LocationPicker }  from '../shared/LocationPicker.jsx'
import { EventDateChips }  from '../shared/EventDateChips.jsx'
import { bhadraApi, matriApi, savanApi } from '../../services/api.js'

export default function BookTab({
  feat, isConfigured, dataReady,
  // prayer
  form, setForm, error, shake, submitting,
  isSlotTaken, getSlotBooking, handleSlotSelect, handleBook,
  bookings,
  // satsang
  satsangBookings, bhadraBookings, matriBookings, savanBookings,
  satsangForm, setSatsangForm,
  satsangError, setSatsangError, satsangShake,
  satsangSubmitting,
  handleSatsangSubmit, handleSpecialSubmit,
  fetchSatsangBookings, fetchBhadraBookings, fetchMatriBookings, fetchSavanBookings,
  // booking mode
  bookMode, setBookMode,
}) {
  const blueText  = { color:'#1e3a8a' }
  const mutedBlue = { color:'rgba(30,64,175,0.6)' }

  const prayerTimes = getPrayerTimes(form.date)

  // Booking type definitions
  const BOOKING_TYPES = [
    feat.prayerBooking  && { mode:'prayer',  icon:'🙏', label:'Prayer Booking',          color:'#1d4ed8' },
    feat.satsangBooking && { mode:'satsang', icon:'🪔', label:'Satsang Booking',          color:'#d97706' },
    feat.bhadraBooking  && { mode:'bhadra',  icon:'🌸', label:'Bhadra Parikrama Satsang', color:'#7c3aed' },
    feat.matriBooking   && { mode:'matri',   icon:'🌺', label:'Matri-Sammelan',           color:'#db2777' },
    feat.savanBooking   && { mode:'savan',   icon:'🌿', label:'Savan Parikrama',          color:'#16a34a' },
  ].filter(Boolean)

  const active = BOOKING_TYPES.find(t => t.mode === bookMode) || BOOKING_TYPES[0]

  // Special event info table
  const SPECIAL_INFO = {
    bhadra: { icon:'🌸', label:'Bhadra Parikrama Satsang', color:'#7c3aed', bg:'rgba(124,58,237,0.06)', border:'rgba(124,58,237,0.2)', btnGrad:'linear-gradient(135deg,#5b21b6,#7c3aed,#a78bfa)', shadow:'rgba(124,58,237,0.35)', api:bhadraApi, bookings:bhadraBookings, fetch:fetchBhadraBookings },
    matri:  { icon:'🌺', label:'Matri-Sammelan',           color:'#db2777', bg:'rgba(219,39,119,0.06)', border:'rgba(219,39,119,0.2)', btnGrad:'linear-gradient(135deg,#9d174d,#db2777,#f472b6)', shadow:'rgba(219,39,119,0.35)', api:matriApi,  bookings:matriBookings,  fetch:fetchMatriBookings },
    savan:  { icon:'🌿', label:'Savan Parikrama',          color:'#16a34a', bg:'rgba(22,163,74,0.06)',  border:'rgba(22,163,74,0.2)',  btnGrad:'linear-gradient(135deg,#14532d,#16a34a,#4ade80)',  shadow:'rgba(22,163,74,0.35)',  api:savanApi,  bookings:savanBookings,  fetch:fetchSavanBookings },
  }

  return (
    <div className="card">

      {/* ── Booking Type Selector ── */}
      <div style={{ marginBottom:20 }}>
        <label className="divine-label">📋 Booking Type</label>
        <div style={{ position:'relative' }}>
          <select
            value={bookMode}
            onChange={e => { setBookMode(e.target.value); setSatsangError('') }}
            style={{
              width:'100%', padding:'13px 44px 13px 16px',
              borderRadius:13, border:`2px solid ${active ? active.color+'44' : '#1d4ed844'}`,
              background: active ? `linear-gradient(135deg,${active.color}0d,${active.color}06)` : '#f0f9ff',
              color: active ? active.color : '#1d4ed8',
              fontFamily:"'Cinzel',serif", fontWeight:800, fontSize:14, cursor:'pointer',
              appearance:'none', WebkitAppearance:'none',
              boxShadow: active ? `0 3px 14px ${active.color}18` : 'none',
              outline:'none', transition:'all 0.25s',
            }}>
            {BOOKING_TYPES.map(t => (
              <option key={t.mode} value={t.mode}>{t.icon}  {t.label}</option>
            ))}
          </select>
          <div style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
            pointerEvents:'none', color: active ? active.color : '#1d4ed8', fontSize:14, fontWeight:900 }}>▼</div>
        </div>
        <div style={{ height:3, borderRadius:2, marginTop:6,
          background: active ? `linear-gradient(90deg,${active.color},${active.color}44)` : 'transparent',
          transition:'background 0.3s' }}/>
      </div>

      {/* ── Skeleton while loading ── */}
      {isConfigured && !dataReady && (
        <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:8 }}>
          <SkeletonCard rows={3} /><SkeletonCard rows={2} />
        </div>
      )}

      {/* ══ PRAYER FORM ══ */}
      {dataReady && bookMode === 'prayer' && (
        <PrayerForm
          form={form} setForm={setForm}
          error={error} shake={shake}
          submitting={submitting}
          isSlotTaken={isSlotTaken} getSlotBooking={getSlotBooking}
          handleSlotSelect={handleSlotSelect} handleBook={handleBook}
          bookings={bookings} prayerTimes={prayerTimes}
          blueText={blueText} mutedBlue={mutedBlue}
        />
      )}

      {/* ══ SATSANG FORM ══ */}
      {dataReady && feat.satsangBooking && bookMode === 'satsang' && (
        <SatsangForm
          satsangForm={satsangForm} setSatsangForm={setSatsangForm}
          satsangError={satsangError} setSatsangError={setSatsangError}
          satsangShake={satsangShake}
          satsangSubmitting={satsangSubmitting}
          handleSatsangSubmit={handleSatsangSubmit}
          satsangBookings={satsangBookings}
        />
      )}

      {/* ══ SPECIAL EVENT FORMS (bhadra / matri / savan) ══ */}
      {dataReady && ['bhadra','matri','savan'].includes(bookMode) && feat[`${bookMode}Booking`] && (
        <SpecialEventForm
          bookMode={bookMode}
          info={SPECIAL_INFO[bookMode]}
          satsangForm={satsangForm} setSatsangForm={setSatsangForm}
          satsangError={satsangError} setSatsangError={setSatsangError}
          satsangShake={satsangShake}
          satsangSubmitting={satsangSubmitting}
          handleSpecialSubmit={() => handleSpecialSubmit(bookMode, SPECIAL_INFO)}
        />
      )}

    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  PrayerForm
// ─────────────────────────────────────────────────────────────
function PrayerForm({ form, setForm, error, shake, submitting, isSlotTaken, getSlotBooking, handleSlotSelect, handleBook, bookings, prayerTimes, blueText, mutedBlue }) {
  const today = new Date(); today.setHours(0,0,0,0)

  // Build prayer date chips (availability-aware)
  const chips = []
  for (let i = 0; i < 14; i++) {
    const d  = new Date(today); d.setDate(today.getDate() + i)
    const y  = d.getFullYear()
    const m  = String(d.getMonth() + 1).padStart(2,'0')
    const dd = String(d.getDate()).padStart(2,'0')
    const dateStr  = `${y}-${m}-${dd}`
    const mTaken   = isSlotTaken(dateStr, 'Morning')
    const eTaken   = isSlotTaken(dateStr, 'Evening')
    const bothTaken= mTaken && eTaken
    const sel      = form.date === dateStr
    chips.push(
      <button key={dateStr} type="button"
        onClick={() => { if (!bothTaken) { setForm(f => ({ ...f, date:dateStr, time:'' })) } }}
        disabled={bothTaken}
        style={{
          display:'flex', flexDirection:'column', alignItems:'center',
          padding:'8px 6px', borderRadius:12, flexShrink:0,
          border:`2px solid ${sel?'#1d4ed8':bothTaken?'#fca5a5':mTaken||eTaken?'#fcd34d':'rgba(59,130,246,0.18)'}`,
          background:sel?'#1d4ed8':bothTaken?'#fee2e2':mTaken||eTaken?'#fef3c7':'#f0f9ff',
          cursor:bothTaken?'not-allowed':'pointer', minWidth:48,
          opacity:bothTaken?0.6:1, transition:'all 0.15s',
          boxShadow:sel?'0 3px 12px rgba(29,78,216,0.35)':'none',
        }}>
        <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase',
          color:sel?'rgba(255,255,255,0.8)':'#6b7280', letterSpacing:'0.5px' }}>
          {i===0?'Today':['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]}
        </div>
        <div style={{ fontSize:16, fontWeight:900, marginTop:2, color:sel?'#fff':'#1e3a8a' }}>{dd}</div>
        <div style={{ fontSize:8, marginTop:3, fontWeight:800,
          color:sel?'rgba(255,255,255,0.9)':bothTaken?'#dc2626':mTaken||eTaken?'#d97706':'#16a34a' }}>
          {bothTaken?'FULL':mTaken||eTaken?'1 LEFT':'FREE'}
        </div>
        <div style={{ display:'flex', gap:2, marginTop:4 }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:mTaken?'#ef4444':'#22c55e' }}/>
          <div style={{ width:5, height:5, borderRadius:'50%', background:eTaken?'#ef4444':'#22c55e' }}/>
        </div>
      </button>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ textAlign:'center', marginBottom:4 }}>
        <div style={{ fontFamily:"'Cinzel',serif", ...blueText, fontSize:16, fontWeight:700 }}>Reserve a Prayer Slot</div>
        <div className="blue-line" style={{ marginTop:10 }}/>
      </div>

      <div>
        <label className="divine-label">👤 Person's Name</label>
        <input className="divine-input" placeholder="Enter full name"
          value={form.name}
          onChange={e => { setForm({...form, name:e.target.value}) }}/>
      </div>

      <div>
        <label className="divine-label">📱 Mobile Number</label>
        <input className="divine-input" placeholder="Enter 10-digit mobile number"
          type="tel" maxLength="10"
          value={form.mobile}
          onChange={e => { setForm({...form, mobile:e.target.value.replace(/[^0-9]/g,'')}) }}/>
      </div>

      <div>
        <label className="divine-label">🌐 Find My Location</label>
        <LocationPicker color="#1d4ed8"
          placeholder="Search your area, landmark, address…"
          onPick={({ address, mapsLink }) => setForm(prev => ({
            ...prev,
            place:    address  || prev.place,
            mapsLink: mapsLink || prev.mapsLink,
          }))}/>
      </div>

      <div>
        <label className="divine-label">📍 Address</label>
        <textarea className="divine-input"
          placeholder="Type location name  OR  paste Google Maps link"
          value={form.place}
          rows={2}
          style={{ resize:'none', fontFamily:'inherit', lineHeight:1.4 }}
          onChange={e => {
            const v = e.target.value
            const isLink = v.startsWith('http') || v.includes('maps.google') || v.includes('goo.gl') || v.includes('maps.app')
            setForm({...form, place:v, mapsLink: isLink ? v : form.mapsLink})
          }}/>
      </div>

      <div>
        <label className="divine-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'1.2px', color:'rgba(29,78,216,0.55)' }}>
            🚀 GOOGLE MAPS LINK (OPTIONAL)
          </span>
        </label>
        <input className="divine-input" placeholder="Paste Google Maps link"
          value={form.mapsLink || ''}
          onChange={e => { setForm({...form, mapsLink: e.target.value}) }}/>
      </div>

      <div>
        <label className="divine-label">📅 Date (optional — or pick below)</label>
        <input type="date" className="divine-input" value={form.date} min={getTodayStr()}
          style={{ fontSize:13, width:'100%', cursor:'pointer' }}
          onChange={e => { setForm({...form, date:e.target.value, time:''}) }}/>
        <div style={{ fontSize:10, color:'rgba(29,78,216,0.4)', marginTop:5, paddingLeft:2 }}>
          ☝️ Tap a chip below for quick pick, or use the calendar for any future date
        </div>
      </div>

      {/* Date chips */}
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <button type="button"
          onClick={() => { const el=document.getElementById('dateChipScroll'); if(el) el.scrollBy({left:-160,behavior:'smooth'}) }}
          style={{ flexShrink:0, width:32, height:32, borderRadius:'50%', border:'none',
            background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', color:'#fff',
            fontSize:18, cursor:'pointer', fontWeight:900, lineHeight:1 }}>‹</button>
        <div id="dateChipScroll" style={{ display:'flex', gap:6, overflowX:'auto', flex:1,
          paddingBottom:6, scrollbarWidth:'none' }}>{chips}</div>
        <button type="button"
          onClick={() => { const el=document.getElementById('dateChipScroll'); if(el) el.scrollBy({left:160,behavior:'smooth'}) }}
          style={{ flexShrink:0, width:32, height:32, borderRadius:'50%', border:'none',
            background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', color:'#fff',
            fontSize:18, cursor:'pointer', fontWeight:900, lineHeight:1 }}>›</button>
      </div>

      {/* Slot selector */}
      {form.date ? (
        <div className="fade-in">
          <label className="divine-label">🌅 Prayer Slot</label>
          <div style={{ display:'flex', gap:12 }}>
            {['Morning','Evening'].map(t => {
              const c      = SLOT_STYLE[t]
              const taken  = isSlotTaken(form.date, t)
              const sel    = form.time === t
              const booker = taken ? getSlotBooking(form.date, t) : null
              const pt     = getPrayerTimes(form.date)
              return (
                <button key={t} className="slot-btn"
                  onClick={() => handleSlotSelect(t)}
                  disabled={taken}
                  style={{
                    borderColor: taken?'#fca5a5':sel?c.color:'rgba(59,130,246,0.25)',
                    background:  taken?'#fee2e2':sel?c.bg:'rgba(239,246,255,0.5)',
                    color: taken?'#dc2626':sel?c.color:'#374151',
                    opacity: taken?0.7:1 }}>
                  {sel && !taken && (
                    <div style={{ position:'absolute', top:8, right:8, width:20, height:20,
                      borderRadius:'50%', background:c.color, display:'flex',
                      alignItems:'center', justifyContent:'center', fontSize:11,
                      fontWeight:900, color:'#fff' }}>✓</div>
                  )}
                  <div style={{ fontSize:28, marginBottom:8 }}>{c.icon}</div>
                  <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:13 }}>{t} Prayer</div>
                  {pt && !taken && (
                    <div style={{ fontSize:12, marginTop:6, fontWeight:700, color:c.color }}>{pt[t]}</div>
                  )}
                  {taken && booker && (
                    <div style={{ fontSize:10, marginTop:6, color:'#dc2626', fontWeight:600 }}>
                      🚫 Booked by {booker.name}
                    </div>
                  )}
                  <div style={{ fontSize:11, marginTop:8, fontWeight:600,
                    color:taken?'#dc2626':sel?'#16a34a':'rgba(30,64,175,0.4)' }}>
                    {taken?'🚫 Already Booked':sel?'✓ Selected':'Tap to select'}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{ textAlign:'center', padding:'12px 0', ...mutedBlue, fontSize:13 }}>
          ☝️ Select a date to continue
        </div>
      )}

      {/* Prayer time info */}
      {form.date && prayerTimes && form.time && (
        <div className="fade-in" style={{ background:'rgba(239,246,255,0.9)',
          border:'1px solid rgba(59,130,246,0.25)', borderRadius:14, padding:'14px 16px' }}>
          <div style={{ fontFamily:"'Cinzel',serif", ...blueText, fontSize:13, fontWeight:700, marginBottom:10 }}>
            🕐 Prayer Times for {form.date}
          </div>
          <div style={{ display:'flex', gap:12 }}>
            {['Morning','Evening'].map(t => {
              const c = SLOT_STYLE[t]
              return (
                <div key={t} style={{ flex:1, borderRadius:10, padding:'12px',
                  background:c.bg, border:`1px solid ${c.border}`, textAlign:'center' }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{c.icon}</div>
                  <div style={{ fontSize:11, color:c.color, fontWeight:700 }}>{t}</div>
                  <div style={{ fontSize:14, fontWeight:900, color:c.color, marginTop:4 }}>{prayerTimes[t]}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {error && (
        <div className={`fade-in ${shake?'shake':''}`}
          style={{ padding:'14px 18px', borderRadius:12, fontSize:13, lineHeight:1.7,
            whiteSpace:'pre-line', background:'#fee2e2', border:'1.5px solid #fca5a5', color:'#b91c1c' }}>
          {error}
        </div>
      )}

      <div style={{ marginTop:8 }}>
        <button className="submit-btn" onClick={handleBook} disabled={submitting}>
          {submitting ? '⏳ Saving...' : '🙏  Confirm Booking'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  SatsangForm
// ─────────────────────────────────────────────────────────────
function SatsangForm({ satsangForm, setSatsangForm, satsangError, setSatsangError, satsangShake, satsangSubmitting, handleSatsangSubmit, satsangBookings }) {
  const existingForType = satsangBookings || []
  const isDupSatsang = (date, time) => existingForType.some(b => b.date === date && b.time.trim().toLowerCase() === time.trim().toLowerCase())
  const dupBooker = (date, time) => existingForType.find(b => b.date === date && b.time.trim().toLowerCase() === time.trim().toLowerCase())

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
      <div style={{ textAlign:'center', marginBottom:4 }}>
        <div style={{ fontFamily:"'Cinzel',serif", color:'#78350f', fontSize:16, fontWeight:700 }}>
          Book a Satsang Gathering
        </div>
        <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(217,119,6,0.5),transparent)', marginTop:10 }}/>
      </div>

      {satsangError && (
        <div className={satsangShake?'shake':''} style={{ padding:'11px 14px', borderRadius:10,
          fontSize:13, fontWeight:600, background:'#fef3c7', color:'#92400e', whiteSpace:'pre-line' }}>
          {satsangError}
        </div>
      )}

      {[
        { label:'👤 Host Name',        key:'name',     placeholder:'Name of the person hosting',         type:'text' },
        { label:'📱 Mobile Number',    key:'mobile',   placeholder:'10-digit mobile',                    type:'tel',  maxLength:10 },
        { label:'⏰ Time',             key:'time',     placeholder:'e.g. 4:30 PM onwards',               type:'text' },
      ].map(({ label, key, placeholder, type, maxLength }) => (
        <div key={key}>
          <label className="divine-label" style={{ color:'rgba(120,53,15,0.7)' }}>{label}</label>
          <input className="divine-input" placeholder={placeholder} type={type}
            maxLength={maxLength}
            value={satsangForm[key]}
            style={{ borderColor:'rgba(217,119,6,0.3)' }}
            onChange={e => { setSatsangError(''); setSatsangForm({...satsangForm, [key]: key==='mobile' ? e.target.value.replace(/[^0-9]/g,'') : e.target.value }) }}/>
          {key === 'time' && satsangForm.date && satsangForm.time && isDupSatsang(satsangForm.date, satsangForm.time) && (
            <div style={{ marginTop:5, padding:'8px 12px', borderRadius:8, fontSize:12,
              background:'#fee2e2', border:'1px solid #fca5a5', color:'#b91c1c', fontWeight:600 }}>
              ⚠️ This date & time is already booked by {dupBooker(satsangForm.date, satsangForm.time)?.name || 'someone'}. Please choose a different time.
            </div>
          )}
        </div>
      ))}

      <div>
        <label className="divine-label" style={{ color:'rgba(120,53,15,0.7)' }}>📅 Date</label>
        <input type="date" className="divine-input" value={satsangForm.date} min={getTodayStr()}
          style={{ fontSize:13, width:'100%', cursor:'pointer', borderColor:'rgba(217,119,6,0.3)' }}
          onChange={e => { setSatsangError(''); setSatsangForm({...satsangForm, date:e.target.value}) }}/>
        <div style={{ fontSize:10, color:'rgba(120,53,15,0.45)', marginTop:5, paddingLeft:2 }}>
          ☝️ Tap a chip below for quick pick, or use the calendar above
        </div>
        <div style={{ marginTop:6 }}>
          <EventDateChips
            bookings={satsangBookings} value={satsangForm.date}
            onChange={d => { setSatsangError(''); setSatsangForm({...satsangForm, date:d}) }}
            color="#92400e" idPrefix="satChipScroll" days={14}/>
        </div>
        {satsangForm.date && existingForType.filter(b => b.date === satsangForm.date).length > 0 && (
          <div className="fade-in" style={{ marginTop:10, background:'rgba(217,119,6,0.07)',
            border:'1px solid rgba(217,119,6,0.25)', borderRadius:12, padding:'12px 14px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#92400e', marginBottom:8 }}>
              🪔 Already booked on this date:
            </div>
            {existingForType.filter(b => b.date === satsangForm.date).map(b => (
              <div key={b.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'6px 10px', borderRadius:8, marginBottom:4,
                background:'rgba(255,255,255,0.7)', border:'1px solid rgba(217,119,6,0.15)' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#78350f' }}>{b.name}</div>
                <div style={{ fontSize:12, fontWeight:600, color:'#92400e', background:'rgba(217,119,6,0.12)',
                  padding:'2px 8px', borderRadius:6 }}>{cleanTime(b.time) || b.time}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="divine-label" style={{ color:'rgba(120,53,15,0.7)' }}>🌐 Find Venue Location</label>
        <LocationPicker color="#92400e"
          placeholder="Search venue — area, landmark, address…"
          onPick={({ address, mapsLink }) => setSatsangForm(prev => ({
            ...prev,
            venue:    address  || prev.venue,
            mapsLink: mapsLink || prev.mapsLink,
          }))}/>
      </div>

      <div>
        <label className="divine-label" style={{ color:'rgba(120,53,15,0.7)' }}>📍 Venue / Address</label>
        <textarea className="divine-input" placeholder="Full address of the Satsang venue"
          value={satsangForm.venue}
          rows={2}
          style={{ borderColor:'rgba(217,119,6,0.3)', resize:'none', fontFamily:'inherit', lineHeight:1.4 }}
          onChange={e => {
            const v = e.target.value
            setSatsangError('')
            const isLink = v.startsWith('http') || v.includes('maps.google') || v.includes('goo.gl') || v.includes('maps.app')
            setSatsangForm({...satsangForm, venue:v, mapsLink: isLink ? v : satsangForm.mapsLink})
          }}/>
      </div>

      {[
        { label:'📌 Google Maps Link (optional)', key:'mapsLink', placeholder:'Paste Google Maps link', type:'text' },
        { label:'🪔 Occasion (optional)', key:'occasion', placeholder:'e.g. Birthday, Anniversary, Monthly Satsang', type:'text' },
        { label:'🙏 Hosted By (optional)', key:'hostedBy', placeholder:'e.g. Bannerghatta SUK', type:'text' },
      ].map(({ label, key, placeholder, type, maxLength }) => (
        <div key={key}>
          <label className="divine-label" style={{ color:'rgba(120,53,15,0.7)' }}>{label}</label>
          <input className="divine-input" placeholder={placeholder} type={type}
            maxLength={maxLength}
            value={satsangForm[key]}
            style={{ borderColor:'rgba(217,119,6,0.3)' }}
            onChange={e => { setSatsangError(''); setSatsangForm({...satsangForm, [key]: key==='mobile' ? e.target.value.replace(/[^0-9]/g,'') : e.target.value }) }}/>
          {key === 'occasion' && (
            <div style={{ fontSize:10, color:'rgba(120,53,15,0.4)', marginTop:4, paddingLeft:2 }}>
              The reason or purpose of this Satsang gathering
            </div>
          )}
        </div>
      ))}

      <div style={{ marginTop:8 }}>
        <button onClick={handleSatsangSubmit}
          disabled={satsangSubmitting || (satsangForm.date && satsangForm.time && isDupSatsang(satsangForm.date, satsangForm.time))}
          style={{ width:'100%', padding:'15px', border:'none', borderRadius:13,
            background:'linear-gradient(135deg,#78350f 0%,#d97706 50%,#fbbf24 100%)',
            color:'#fff', fontWeight:900, fontSize:16, cursor:'pointer',
            fontFamily:"'Cinzel',serif", letterSpacing:'0.5px',
            boxShadow:'0 5px 22px rgba(120,53,15,0.35)',
            opacity:(satsangSubmitting || (satsangForm.date && satsangForm.time && isDupSatsang(satsangForm.date, satsangForm.time)))?0.6:1, transition:'all 0.3s' }}>
          {satsangSubmitting ? '⏳ Booking...' : '🪔  Book This Satsang'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  SpecialEventForm — bhadra / matri / savan (same structure)
// ─────────────────────────────────────────────────────────────
function SpecialEventForm({ bookMode, info: t, satsangForm, setSatsangForm, satsangError, setSatsangError, satsangShake, satsangSubmitting, handleSpecialSubmit }) {
  const existingForType = t.bookings || []
  const isDupSpecial = (date, time) => existingForType.some(b => b.date === date && b.time.trim().toLowerCase() === time.trim().toLowerCase())
  const dupBookerSpecial = (date, time) => existingForType.find(b => b.date === date && b.time.trim().toLowerCase() === time.trim().toLowerCase())

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ textAlign:'center', marginBottom:4 }}>
        <div style={{ fontFamily:"'Cinzel',serif", color:t.color, fontSize:16, fontWeight:700 }}>
          {t.icon} {t.label}
        </div>
        <div style={{ height:1, background:`linear-gradient(90deg,transparent,${t.color}66,transparent)`, marginTop:10 }}/>
      </div>

      {satsangError && (
        <div className={satsangShake?'shake':''} style={{ padding:'11px 14px', borderRadius:10,
          fontSize:13, fontWeight:600, background:'#fef3c7', color:'#92400e', whiteSpace:'pre-line' }}>
          {satsangError}
        </div>
      )}

      {[
        { label:'👤 Host Name',       key:'name',   placeholder:'Name of the person hosting', type:'text' },
        { label:'📱 Mobile Number',   key:'mobile', placeholder:'10-digit mobile',             type:'tel', maxLength:10 },
        { label:'⏰ Time',            key:'time',   placeholder:'e.g. 4:30 PM onwards',        type:'text' },
      ].map(({ label, key, placeholder, type, maxLength }) => (
        <div key={key}>
          <label className="divine-label" style={{ color:`${t.color}bb` }}>{label}</label>
          <input className="divine-input" placeholder={placeholder} type={type}
            maxLength={maxLength}
            value={satsangForm[key]}
            style={{ borderColor:t.border }}
            onChange={e => { setSatsangError(''); setSatsangForm({...satsangForm, [key]: key==='mobile' ? e.target.value.replace(/[^0-9]/g,'') : e.target.value }) }}/>
          {key === 'time' && satsangForm.date && satsangForm.time && isDupSpecial(satsangForm.date, satsangForm.time) && (
            <div style={{ marginTop:5, padding:'8px 12px', borderRadius:8, fontSize:12,
              background:'#fee2e2', border:'1px solid #fca5a5', color:'#b91c1c', fontWeight:600 }}>
              ⚠️ This date & time is already booked by {dupBookerSpecial(satsangForm.date, satsangForm.time)?.name || 'someone'} for {t.label}. Please choose a different time.
            </div>
          )}
        </div>
      ))}

      <div>
        <label className="divine-label" style={{ color:`${t.color}bb` }}>📅 Date</label>
        <input type="date" className="divine-input" value={satsangForm.date} min={getTodayStr()}
          style={{ fontSize:13, width:'100%', cursor:'pointer', borderColor:t.border }}
          onChange={e => { setSatsangError(''); setSatsangForm({...satsangForm, date:e.target.value}) }}/>
        <div style={{ fontSize:10, color:`${t.color}77`, marginTop:5, paddingLeft:2 }}>
          ☝️ Tap a chip below for quick pick, or use the calendar above
        </div>
        <div style={{ marginTop:6 }}>
          <EventDateChips
            bookings={t.bookings} value={satsangForm.date}
            onChange={d => { setSatsangError(''); setSatsangForm({...satsangForm, date:d}) }}
            color={t.color} idPrefix={`${bookMode}ChipScroll`} days={14}/>
        </div>
        {satsangForm.date && existingForType.filter(b => b.date === satsangForm.date).length > 0 && (
          <div className="fade-in" style={{ marginTop:10, background:t.bg,
            border:`1px solid ${t.border}`, borderRadius:12, padding:'12px 14px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:t.color, marginBottom:8 }}>
              {t.icon} Already booked on this date:
            </div>
            {existingForType.filter(b => b.date === satsangForm.date).map(b => (
              <div key={b.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'6px 10px', borderRadius:8, marginBottom:4,
                background:'rgba(255,255,255,0.7)', border:`1px solid ${t.border}` }}>
                <div style={{ fontSize:13, fontWeight:700, color:t.color }}>{b.name}</div>
                <div style={{ fontSize:12, fontWeight:600, color:t.color, background:`${t.color}18`,
                  padding:'2px 8px', borderRadius:6 }}>{cleanTime(b.time) || b.time}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="divine-label" style={{ color:`${t.color}bb` }}>🌐 Find Venue Location</label>
        <LocationPicker color={t.color}
          placeholder="Search venue — area, landmark, address…"
          onPick={({ address, mapsLink }) => setSatsangForm(prev => ({
            ...prev,
            venue:    address  || prev.venue,
            mapsLink: mapsLink || prev.mapsLink,
          }))}/>
      </div>

      <div>
        <label className="divine-label" style={{ color:`${t.color}bb` }}>📍 Venue / Address</label>
        <textarea className="divine-input" placeholder="Full address of the venue"
          value={satsangForm.venue}
          rows={2}
          style={{ borderColor:t.border, resize:'none', fontFamily:'inherit', lineHeight:1.4 }}
          onChange={e => {
            const v = e.target.value
            setSatsangError('')
            const isLink = v.startsWith('http') || v.includes('maps.google') || v.includes('goo.gl') || v.includes('maps.app')
            setSatsangForm({...satsangForm, venue:v, mapsLink: isLink ? v : satsangForm.mapsLink})
          }}/>
      </div>

      {[
        { label:'📌 Google Maps Link (optional)', key:'mapsLink', placeholder:'Paste Google Maps link', type:'text' },
        { label:'🪔 Occasion (optional)', key:'occasion', placeholder:'e.g. Special occasion', type:'text' },
        { label:'🙏 Hosted By (optional)', key:'hostedBy', placeholder:'e.g. Bannerghatta SUK', type:'text' },
      ].map(({ label, key, placeholder, type, maxLength }) => (
        <div key={key}>
          <label className="divine-label" style={{ color:`${t.color}bb` }}>{label}</label>
          <input className="divine-input" placeholder={placeholder} type={type}
            maxLength={maxLength}
            value={satsangForm[key]}
            style={{ borderColor:t.border }}
            onChange={e => { setSatsangError(''); setSatsangForm({...satsangForm, [key]: key==='mobile' ? e.target.value.replace(/[^0-9]/g,'') : e.target.value }) }}/>
        </div>
      ))}

      <div style={{ marginTop:8 }}>
        <button onClick={handleSpecialSubmit}
          disabled={satsangSubmitting || (satsangForm.date && satsangForm.time && isDupSpecial(satsangForm.date, satsangForm.time))}
          style={{ width:'100%', padding:'15px', border:'none', borderRadius:13,
            background:t.btnGrad, color:'#fff', fontWeight:900, fontSize:16, cursor:'pointer',
            fontFamily:"'Cinzel',serif", letterSpacing:'0.5px',
            boxShadow:`0 5px 22px ${t.shadow}`,
            opacity:(satsangSubmitting || (satsangForm.date && satsangForm.time && isDupSpecial(satsangForm.date, satsangForm.time)))?0.6:1, transition:'all 0.3s' }}>
          {satsangSubmitting ? '⏳ Booking...' : `${t.icon}  Book ${t.label}`}
        </button>
      </div>
    </div>
  )
}
