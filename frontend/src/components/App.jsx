// ============================================================
//  App.jsx — slim orchestrator (~200 lines)
//  All state lives in hooks; all UI lives in tab components.
//  This file only: wires hooks together + routes tabs.
// ============================================================
import React from 'react'

// ── Config & utilities ────────────────────────────────────────
import state              from '../config/activeSuk.js'

import { DEFAULT_FEATURES, sukLabel } from '../config/sukConfig.js'
import { getTodayStr }    from '../utils/utils.js'

// ── Hooks ─────────────────────────────────────────────────────
import { useBookings }       from '../hooks/useBookings.js'
import { usePrayerBooking }  from '../hooks/usePrayerBooking.js'
import { useSatsangBooking } from '../hooks/useSatsangBooking.js'
import { useShareMessages }  from '../hooks/useShareMessages.js'
import { usePhotoGallery }   from '../hooks/usePhotoGallery.js'

// ── Shared components ─────────────────────────────────────────
import { DataLoadingOverlay } from './shared/DataLoadingOverlay.jsx'
import { PrayerConfirmModal, SatsangConfirmModal } from './shared/ConfirmationModals.jsx'

// ── Tab components ────────────────────────────────────────────
import BookTab         from './tabs/BookTab.jsx'
import CancelTab       from './tabs/CancelTab.jsx'
import RetrieveTab     from './tabs/RetrieveTab.jsx'
import AllBookingsTab  from './tabs/AllBookingsTab.jsx'
import MessagesTab     from './tabs/MessagesTab.jsx'
import DashboardTab from './tabs/DashboardTab.jsx'
import GalleryTab from './tabs/GalleryTab.jsx'
import PrayerTimesTab from './tabs/PrayerTimesTab.jsx'

export default function App({ onChangeSuk, deepLink = {}, currentUser = null, onSignOut, onRequestSignIn }) {
  // ── Feature flags ─────────────────────────────────────────
  const feat = React.useMemo(() => ({
    ...DEFAULT_FEATURES,
    ...(state.ACTIVE_SUK?.features ?? {}),
  }), [])

  const isConfigured = !!(
    state.ACTIVE_SUK &&
    state.ACTIVE_SUK.configured &&
    state.SCRIPT_URL &&
    state.SCRIPT_URL !== '' &&
    !state.SCRIPT_URL.startsWith('YOUR_')
  )

  // ── Navigation state ──────────────────────────────────────
  const [activeTab,         setActiveTab]         = React.useState('book')
  const [manageTab,         setManageTab]         = React.useState(null)
  const [allBookingsFilter, setAllBookingsFilter] = React.useState('all')
  const [bookMode,          setBookMode]          = React.useState('prayer')
  const [drawerOpen,        setDrawerOpen]        = React.useState(false)

  // Reset bookMode if feature disabled
  React.useEffect(() => {
    if (!feat.satsangBooking && bookMode === 'satsang') setBookMode('prayer')
    if (!feat.bhadraBooking  && bookMode === 'bhadra')  setBookMode('prayer')
    if (!feat.matriBooking   && bookMode === 'matri')   setBookMode('prayer')
    if (!feat.savanBooking   && bookMode === 'savan')   setBookMode('prayer')
  }, [feat, bookMode])

  // Deep-link (e.g. ?open=gallery)
  React.useEffect(() => {
    if (deepLink.open === 'gallery') {
      setActiveTab('manage'); setManageTab('gallery')
      try { window.history.replaceState({}, '', window.location.pathname) } catch(e) {}
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Data hooks ────────────────────────────────────────────
  const {
    bookings, satsangBookings, bhadraBookings, matriBookings, savanBookings,
    dataReady,
    cancelling,
    cancelMobile, setCancelMobile, cancelResults, setCancelResults, cancelMsg, setCancelMsg,
    showCancelPast, setShowCancelPast,
    handleCancelLookup, handleCancelBooking, handleCancelSatsang, handleCancelSpecial,
    shareMobile, setShareMobile, shareResults, setShareResults, shareMsg, setShareMsg,
    retrieveTypeFilter, setRetrieveTypeFilter, showRetrievePast, setShowRetrievePast,
    handleShareLookup,
    editingAddress, setEditingAddress, editAddressVal, setEditAddressVal,
    editMapsVal, setEditMapsVal, savingAddress, addressMsg, handleUpdateAddress,
    fetchBookings, fetchSatsangBookings, fetchBhadraBookings, fetchMatriBookings, fetchSavanBookings,
  } = useBookings({ isConfigured, feat })

  const {
    form, setForm, error, shake, submitting,
    confirmation, setConfirmation,
    isSlotTaken, getSlotBooking, handleSlotSelect, handleBook,
  } = usePrayerBooking({ isConfigured, bookings, fetchBookings })

  const {
    satsangForm, setSatsangForm,
    satsangError, setSatsangError, satsangShake,
    satsangSubmitting,
    satsangConfirm, setSatsangConfirm,
    handleSatsangSubmit, handleSpecialSubmit,
  } = useSatsangBooking({ isConfigured, fetchSatsangBookings, fetchBhadraBookings, fetchMatriBookings, fetchSavanBookings, satsangBookings, bhadraBookings, matriBookings, savanBookings })

  const {
    buildShareMsgPlain, buildShareMsg, handleCopy,
    buildSatsangShareMsgPlain, buildSatsangShareMsg, handleSatsangCopy,
    msgType, setMsgType,
    satsang, setSatsang,
    customMsg, setCustomMsg,
    buildSatsangMsg, buildCustomMsg,
    shareWhatsApp, shareSMS, shareCopy,
  } = useShareMessages()

  const {
    photos, photosLoading,
    photoUpload, setPhotoUpload,
    photoUploading, photoMsg, setPhotoMsg,
    handleDeletePhoto, handlePhotoUpload,
  } = usePhotoGallery({ isConfigured })

  // ── Tab / drawer config ───────────────────────────────────
  const tabs = [{ id:'book', label:'🙏 Book' }]

  const manageTabs = [
    feat.cancelBooking   && { id:'cancel',    label:'❌ Cancel Booking',       desc:'Cancel an existing booking',              icon:'❌' },
    feat.prayerTimes     && { id:'times',     label:'🙏 Prayer Timings',       desc:'View morning & evening prayer times',     icon:'🙏' },
    feat.retrieveBooking && { id:'share',     label:'🪷 Retrieve Booking',     desc:'Retrieve your booking details',           icon:'🪷' },
    feat.allBookings     && { id:'all',       label:'📖 All Bookings',         desc:'See all prayer bookings by date',         icon:'📖' },
    feat.messages        && { id:'announce',  label:'📨 Messages',             desc:'Create invitations & custom messages',    icon:'📨' },
    feat.photoGallery    && { id:'gallery',   label:'🌸 Prayer Photo Gallery', desc:'Upload & view prayer photo memories',     icon:'🌸' },
    currentUser          && { id:'dashboard', label:'📊 Devotee Dashboard',    desc:'Track bookings & engagement per devotee', icon:'📊' },
  ].filter(Boolean)

  const sukName = state.ACTIVE_SUK
    ? `${state.ACTIVE_SUK.emoji ?? ''} ${sukLabel(state.ACTIVE_SUK)}${state.ACTIVE_SUK.location ? ' · ' + state.ACTIVE_SUK.location : ''} ${state.ACTIVE_SUK.emoji ?? ''}`
    : '🪷 Satsang Upayojana Kendra 🪷'

  return (
    <div className="content">

      {/* Loading overlay */}
      {isConfigured && !dataReady && <DataLoadingOverlay />}

      {/* Confirmation modals */}
      <PrayerConfirmModal
        confirmation={confirmation}
        onClose={() => setConfirmation(null)}
        buildShareMsg={buildShareMsg}
        buildShareMsgPlain={buildShareMsgPlain}
        handleCopy={handleCopy}
      />
      <SatsangConfirmModal
        satsangConfirm={satsangConfirm}
        onClose={() => setSatsangConfirm(null)}
        buildSatsangShareMsg={buildSatsangShareMsg}
        buildSatsangShareMsgPlain={buildSatsangShareMsgPlain}
        handleSatsangCopy={handleSatsangCopy}
      />

      {/* Drawer backdrop */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)}
          style={{ position:'fixed', inset:0, zIndex:3000,
            background:'rgba(0,0,0,0.35)', backdropFilter:'blur(2px)' }}/>
      )}

      {/* Hamburger drawer */}
      <div style={{
        position:'fixed', top:0, left:0, bottom:0, zIndex:3001,
        width: drawerOpen ? 290 : 0, overflow:'hidden',
        transition:'width 0.28s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: drawerOpen ? '8px 0 40px rgba(29,78,216,0.18)' : 'none',
      }}>
        <div style={{ width:290, height:'100%',
          background:'linear-gradient(160deg,#f0f6ff 0%,#e8f0fe 60%,#dce9ff 100%)',
          display:'flex', flexDirection:'column', overflowY:'auto' }}>
          <div style={{ padding:'28px 20px 20px',
            background:'linear-gradient(135deg,rgba(29,78,216,0.07),rgba(59,130,246,0.05))',
            borderBottom:'1px solid rgba(59,130,246,0.15)', position:'relative' }}>
            <button onClick={() => setDrawerOpen(false)}
              style={{ position:'absolute', top:16, right:16, width:32, height:32,
                borderRadius:'50%', border:'none', background:'rgba(29,78,216,0.1)',
                cursor:'pointer', fontSize:16, color:'#1e3a8a',
                display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900 }}>✕</button>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom: currentUser ? 10 : 0 }}>
              <span style={{ fontSize:24 }}>🪷</span>
              <div style={{ fontFamily:"'Cinzel',serif", color:'#1e3a8a', fontSize:15, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase' }}>All Options</div>
              <span style={{ fontSize:24 }}>🙏</span>
            </div>
            {currentUser && (
              <div style={{ marginTop:10, padding:'8px 10px', borderRadius:10,
                background:'rgba(29,78,216,0.07)', border:'1px solid rgba(59,130,246,0.15)',
                fontSize:12, color:'#1e3a8a', fontWeight:600, textAlign:'center' }}>
                👤 {currentUser.name} · {currentUser.email || currentUser.mobile}
              </div>
            )}
          </div>
          <div style={{ flex:1, padding:'14px 12px' }}>
            {manageTabs.map(t => (
              <button key={t.id}
                onClick={() => { setActiveTab('manage'); setManageTab(t.id); setDrawerOpen(false) }}
                style={{ display:'flex', alignItems:'center', gap:14, width:'100%',
                  padding:'12px 14px', border:'none', borderRadius:14, cursor:'pointer',
                  background:'rgba(255,255,255,0.55)', textAlign:'left', transition:'all 0.18s',
                  marginBottom:8, boxShadow:'0 1px 4px rgba(29,78,216,0.07)',
                  borderLeft:'3px solid rgba(59,130,246,0.18)' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(29,78,216,0.08)'; e.currentTarget.style.borderLeftColor='#1d4ed8' }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.55)'; e.currentTarget.style.borderLeftColor='rgba(59,130,246,0.18)' }}>
                <div style={{ width:42, height:42, borderRadius:12, flexShrink:0,
                  background:'linear-gradient(135deg,rgba(29,78,216,0.1),rgba(59,130,246,0.07))',
                  border:'1px solid rgba(59,130,246,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{t.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, color:'#1e3a8a', fontSize:13, fontFamily:"'Cinzel',serif", letterSpacing:'0.3px', lineHeight:1.3 }}>
                    {t.label.replace(/^[^\s]+\s/, '')}
                  </div>
                  <div style={{ fontSize:11, color:'rgba(29,78,216,0.45)', marginTop:3, lineHeight:1.4 }}>{t.desc}</div>
                </div>
                <div style={{ color:'rgba(29,78,216,0.35)', fontSize:18, flexShrink:0, fontWeight:300 }}>›</div>
              </button>
            ))}
          </div>
          <div style={{ padding:'16px', borderTop:'1px solid rgba(59,130,246,0.12)' }}>
            {currentUser ? (
              <button onClick={() => { onSignOut?.(); setDrawerOpen(false) }}
                style={{ width:'100%', padding:'11px', border:'1px solid rgba(220,38,38,0.25)',
                  borderRadius:12, background:'rgba(254,242,242,0.8)', color:'#b91c1c',
                  fontWeight:700, fontSize:13, cursor:'pointer' }}>🚪 Sign Out</button>
            ) : (
              <button onClick={() => { onRequestSignIn?.(); setDrawerOpen(false) }}
                style={{ width:'100%', padding:'11px', border:'none', borderRadius:12,
                  background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', color:'#fff',
                  fontWeight:700, fontSize:13, cursor:'pointer',
                  boxShadow:'0 3px 10px rgba(29,78,216,0.25)' }}>🔐 Admin Sign In</button>
            )}
          </div>
        </div>
      </div>

      {/* ── HEADER ── */}
      <div style={{ textAlign:'center', marginBottom:4 }}>
        <div style={{ display:'flex', justifyContent:'flex-start', marginBottom:8 }}>
          <button onClick={() => setDrawerOpen(true)}
            style={{ width:40, height:40, borderRadius:12, border:'none',
              background:'linear-gradient(135deg,rgba(29,78,216,0.1),rgba(59,130,246,0.07))',
              cursor:'pointer', display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', gap:5, padding:10 }}>
            {[0,1,2].map(i => <div key={i} style={{ width:20, height:2, borderRadius:2, background:'#1d4ed8' }}/>)}
          </button>
        </div>
        <span style={{ fontSize:38, filter:'drop-shadow(0 0 12px rgba(255,180,0,0.6))',
          animation:'floatEmoji 4s ease-in-out infinite alternate', display:'inline-block' }}>🪷</span>
        <div style={{ marginTop:6 }}><span className="jayguru-title">Jayguru</span></div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, margin:'10px 16px 8px' }}>
          <div style={{ flex:1, height:1, background:'linear-gradient(90deg,transparent,rgba(255,200,60,0.5),rgba(59,130,246,0.4))' }}/>
          <span style={{ fontSize:18, filter:'drop-shadow(0 0 8px rgba(255,180,0,0.7))', animation:'floatEmoji 3s ease-in-out infinite alternate', animationDelay:'1.5s' }}>🙏</span>
          <div style={{ flex:1, height:1, background:'linear-gradient(90deg,rgba(59,130,246,0.4),rgba(255,200,60,0.5),transparent)' }}/>
        </div>
        <p style={{ fontFamily:"'Cinzel',serif", color:'#1e3a8a', fontSize:13, fontWeight:700, letterSpacing:'2px', margin:0 }}>Book Your Prayer Slot</p>
        <p style={{ fontSize:10, color:'rgba(30,64,175,0.45)', fontWeight:600, letterSpacing:'4px', textTransform:'uppercase', marginTop:5 }}>{sukName}</p>

        {/* Booking count badges */}
        {(bookings.length > 0 || satsangBookings.length > 0 || bhadraBookings.length > 0 || matriBookings.length > 0 || savanBookings.length > 0) && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:10, flexWrap:'wrap' }}>
            {[
              { count:bookings.length,        filter:'prayer',  emoji:'🌅', color:'rgba(29,78,216,',  label:'Prayer',  show:true },
              { count:satsangBookings.length, filter:'satsang', emoji:'🪔', color:'rgba(217,119,6,',  label:'Satsang', show:feat.satsangBooking },
              { count:bhadraBookings.length,  filter:'bhadra',  emoji:'🌸', color:'rgba(124,58,237,', label:'Bhadra',  show:feat.bhadraBooking },
              { count:matriBookings.length,   filter:'matri',   emoji:'🌺', color:'rgba(219,39,119,', label:'Matri',   show:feat.matriBooking },
              { count:savanBookings.length,   filter:'savan',   emoji:'🌿', color:'rgba(22,163,74,',  label:'Savan',   show:feat.savanBooking },
            ].filter(b => b.count > 0 && b.show).map(b => (
              <div key={b.filter}
                onClick={() => { setAllBookingsFilter(b.filter); setActiveTab('manage'); setManageTab('all') }}
                style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20,
                  background:`${b.color}0.07)`, border:`1px solid ${b.color}0.18)`, cursor:'pointer', transition:'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background=`${b.color}0.15)`}
                onMouseLeave={e => e.currentTarget.style.background=`${b.color}0.07)`}>
                <span style={{ fontSize:12 }}>{b.emoji}</span>
                <span style={{ fontSize:11, color:`${b.color}0.6)`, fontWeight:700, fontFamily:"'Cinzel',serif", letterSpacing:'0.5px' }}>
                  {b.count} {b.label}{b.count !== 1 ? 's' : ''}
                </span>
                <span style={{ fontSize:9, color:`${b.color}0.4)`, marginLeft:2 }}>›</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, margin:'14px 0 0' }}>
          <div style={{ width:40, height:1, background:'linear-gradient(90deg,transparent,rgba(255,200,60,0.4))' }}/>
          <span style={{ fontSize:9, color:'rgba(255,180,0,0.5)', letterSpacing:8 }}>✦ ✦ ✦</span>
          <div style={{ width:40, height:1, background:'linear-gradient(90deg,rgba(255,200,60,0.4),transparent)' }}/>
        </div>
      </div>

      <div style={{ textAlign:'center', marginBottom:18, letterSpacing:14, fontSize:13, color:'rgba(29,78,216,0.3)', animation:'haloPulse 4s ease-in-out infinite alternate' }}>✦ 🪷 ✦</div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:6, marginBottom:24, background:'rgba(255,255,255,0.7)', borderRadius:14, padding:5, border:'1px solid rgba(59,130,246,0.15)' }}>
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : 'inactive'}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Back button inside manage sub-tab */}
      {activeTab === 'manage' && manageTab && (
        <button onClick={() => { setActiveTab('book'); setManageTab(null) }}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none',
            cursor:'pointer', color:'rgba(29,78,216,0.6)', fontSize:13, fontWeight:700, padding:'0 2px 14px', letterSpacing:0.3 }}>
          ‹ Back to Book
        </button>
      )}

      {/* ════ TAB ROUTING ════ */}

      {activeTab === 'book' && (
        <BookTab
          feat={feat} isConfigured={isConfigured} dataReady={dataReady}
          form={form} setForm={setForm} error={error} shake={shake} submitting={submitting}
          isSlotTaken={isSlotTaken} getSlotBooking={getSlotBooking}
          handleSlotSelect={handleSlotSelect} handleBook={handleBook}
          bookings={bookings}
          satsangBookings={satsangBookings} bhadraBookings={bhadraBookings}
          matriBookings={matriBookings} savanBookings={savanBookings}
          satsangForm={satsangForm} setSatsangForm={setSatsangForm}
          satsangError={satsangError} setSatsangError={setSatsangError}
          satsangShake={satsangShake} satsangSubmitting={satsangSubmitting}
          handleSatsangSubmit={handleSatsangSubmit} handleSpecialSubmit={handleSpecialSubmit}
          fetchSatsangBookings={fetchSatsangBookings} fetchBhadraBookings={fetchBhadraBookings}
          fetchMatriBookings={fetchMatriBookings} fetchSavanBookings={fetchSavanBookings}
          bookMode={bookMode} setBookMode={setBookMode}
        />
      )}

      {activeTab === 'manage' && manageTab === 'cancel' && (
        <CancelTab
          cancelMobile={cancelMobile} setCancelMobile={setCancelMobile}
          cancelMsg={cancelMsg} setCancelMsg={setCancelMsg}
          cancelResults={cancelResults} setCancelResults={setCancelResults}
          showCancelPast={showCancelPast} setShowCancelPast={setShowCancelPast}
          cancelling={cancelling}
          handleCancelLookup={handleCancelLookup}
          handleCancelBooking={handleCancelBooking}
          handleCancelSpecial={handleCancelSpecial}
        />
      )}

      {activeTab === 'manage' && manageTab === 'times' && <PrayerTimesTab />}

      {activeTab === 'manage' && manageTab === 'share' && (
        <RetrieveTab
          feat={feat}
          bookings={bookings} satsangBookings={satsangBookings}
          bhadraBookings={bhadraBookings} matriBookings={matriBookings} savanBookings={savanBookings}
          shareMobile={shareMobile} setShareMobile={setShareMobile}
          shareResults={shareResults} setShareResults={setShareResults}
          shareMsg={shareMsg} setShareMsg={setShareMsg}
          retrieveTypeFilter={retrieveTypeFilter} setRetrieveTypeFilter={setRetrieveTypeFilter}
          showRetrievePast={showRetrievePast} setShowRetrievePast={setShowRetrievePast}
          handleShareLookup={handleShareLookup}
          buildShareMsgPlain={buildShareMsgPlain} buildShareMsg={buildShareMsg} handleCopy={handleCopy}
          buildSatsangShareMsgPlain={buildSatsangShareMsgPlain} buildSatsangShareMsg={buildSatsangShareMsg} handleSatsangCopy={handleSatsangCopy}
          cancelling={cancelling}
          handleCancelBooking={handleCancelBooking} handleCancelSatsang={handleCancelSatsang} handleCancelSpecial={handleCancelSpecial}
          editingAddress={editingAddress} setEditingAddress={setEditingAddress}
          editAddressVal={editAddressVal} setEditAddressVal={setEditAddressVal}
          editMapsVal={editMapsVal} setEditMapsVal={setEditMapsVal}
          savingAddress={savingAddress} addressMsg={addressMsg}
          handleUpdateAddress={handleUpdateAddress}
        />
      )}

      {activeTab === 'manage' && manageTab === 'all' && (
        <AllBookingsTab
          feat={feat} currentUser={currentUser}
          bookings={bookings} satsangBookings={satsangBookings}
          bhadraBookings={bhadraBookings} matriBookings={matriBookings} savanBookings={savanBookings}
          allBookingsFilter={allBookingsFilter} setAllBookingsFilter={setAllBookingsFilter}
          cancelling={cancelling}
          handleCancelBooking={handleCancelBooking} handleCancelSpecial={handleCancelSpecial}
          buildShareMsg={buildShareMsg} buildSatsangShareMsg={buildSatsangShareMsg}
          handleCopy={handleCopy} handleSatsangCopy={handleSatsangCopy}
        />
      )}

      {activeTab === 'manage' && manageTab === 'announce' && (
        <MessagesTab
          msgType={msgType} setMsgType={setMsgType}
          satsang={satsang} setSatsang={setSatsang}
          customMsg={customMsg} setCustomMsg={setCustomMsg}
          buildSatsangMsg={buildSatsangMsg} buildCustomMsg={buildCustomMsg}
          shareWhatsApp={shareWhatsApp} shareSMS={shareSMS} shareCopy={shareCopy}
        />
      )}

      {activeTab === 'manage' && manageTab === 'gallery' && (
        <GalleryTab
          isConfigured={isConfigured}
          photos={photos} photosLoading={photosLoading}
          photoUpload={photoUpload} setPhotoUpload={setPhotoUpload}
          photoMsg={photoMsg} setPhotoMsg={setPhotoMsg}
          photoUploading={photoUploading}
          onUpload={handlePhotoUpload}
          isAdmin={!!currentUser}
          onDeletePhoto={handleDeletePhoto}
        />
      )}

      {activeTab === 'manage' && manageTab === 'dashboard' && currentUser && (
        <DashboardTab
          bookings={bookings}
          satsangBookings={satsangBookings}
        />
      )}

    </div>
  )
}
