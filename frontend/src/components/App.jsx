// ============================================================
//  App — Main application (smart container)
//  ─────────────────────────────────────────────────────────
//  Owns all app state and data-fetching.
//  Renders the header, tab bar, and delegates each tab's UI
//  to a focused component in ./tabs/ or ./shared/.
//
//  Tab map:
//    "book"                         → BookTab (prayer + satsang forms)
//    "manage" / manageTab="times"   → PrayerTimesTab
//    "manage" / manageTab="share"   → RetrieveTab
//    "manage" / manageTab="all"     → AllBookingsTab
//    "manage" / manageTab="announce"→ MessagesTab
//    "manage" / manageTab="gallery" → GalleryTab
// ============================================================

import React from 'react'
import { SUK_CONFIG, DEFAULT_FEATURES, sukLabel } from '../config/sukConfig.js'
import state from '../config/activeSuk.js'
import { api, satsangApi, bhadraApi, matriApi, savanApi, photoApi } from '../services/api.js'
import {
  formatDate, formatDateWithDay, getDayName, getTodayStr,
  cleanTime, cleanPhotoDate, maskMobile,
} from '../utils/utils.js'
import { getPrayerTimes, SLOT_STYLE, SLOTS, PRAYER_TIMES, MONTH_NAMES } from '../config/prayerTimes.js'
import SUKSearchDropdown from './welcome/SUKSearchDropdown.jsx'

// ── Shared UI components ──────────────────────────────────────
import { BlueDivider }        from './shared/BlueDivider.jsx'
import { SkeletonCard }       from './shared/SkeletonCard.jsx'
import { DataLoadingOverlay } from './shared/DataLoadingOverlay.jsx'

// ── Tab components ────────────────────────────────────────────
import PrayerTimesTab from './tabs/PrayerTimesTab.jsx'
import GalleryTab     from './tabs/GalleryTab.jsx'
import DashboardTab   from './tabs/DashboardTab.jsx'

// ════════════════════════════════════════════════════════════════
//  LocationPicker — reusable "find my location" helper
//  ─────────────────────────────────────────────────────────────
//  Two free, no-API-key ways to fill an address + Google Maps link:
//   1. 📍 "Use my current location" — browser GPS (navigator.geolocation)
//      + reverse-geocode via OpenStreetMap Nominatim for a readable address.
//   2. 🔍 Search box — forward-geocode via Nominatim, shows a dropdown
//      of matching places; picking one fills both fields.
//  Both write into whatever address/maps fields the caller passes in.
// ════════════════════════════════════════════════════════════════
function LocationPicker({ onPick, color = "#1d4ed8", placeholder = "Search for a place, area or landmark…" }) {
  const [query,   setQuery]   = React.useState("");
  const [results, setResults] = React.useState([]);
  const [searching, setSearching] = React.useState(false);
  const [locating,  setLocating]  = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);
  const debounceRef = React.useRef(null);

  const doSearch = async (q) => {
    if (!q || q.trim().length < 3) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=5&q=${encodeURIComponent(q.trim())}`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
      setShowResults(true);
    } catch(e) { setResults([]); }
    setSearching(false);
  };

  const handleQueryChange = (v) => {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(v), 500);
  };

  const pickResult = (r) => {
    const lat = parseFloat(r.lat), lon = parseFloat(r.lon);
    onPick({
      address:  r.display_name,
      mapsLink: `https://maps.google.com/?q=${lat},${lon}`,
    });
    setQuery(r.display_name);
    setResults([]);
    setShowResults(false);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Your browser doesn't support location access.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
        let address = "";
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          address = data.display_name || "";
        } catch(e) { /* ignore — maps link still works without address text */ }
        onPick({ address, mapsLink });
        setLocating(false);
      },
      (err) => {
        alert("Couldn't get your location: " + (err.message || "Permission denied."));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div style={{ position:"relative" }}>
      <div style={{ display:"flex", gap:8 }}>
        <div style={{ flex:1, position:"relative" }}>
          <input className="divine-input" placeholder={placeholder}
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => { if (results.length) setShowResults(true); }}
            style={{ borderColor: `${color}33`, paddingRight: 34 }}/>
          {searching && (
            <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
              fontSize:13, color:`${color}99` }}>⏳</span>
          )}
          {showResults && results.length > 0 && (
            <div style={{
              position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:50,
              background:"#fff", border:`1px solid ${color}33`, borderRadius:10,
              boxShadow:"0 8px 24px rgba(0,0,0,0.12)", overflow:"hidden", maxHeight:220, overflowY:"auto"
            }}>
              {results.map((r,i) => (
                <div key={i} onClick={() => pickResult(r)}
                  style={{ padding:"9px 12px", fontSize:12, cursor:"pointer",
                    borderBottom: i<results.length-1 ? "1px solid #f0f0f0" : "none", color:"#374151" }}
                  onMouseDown={e => e.preventDefault()}>
                  📍 {r.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="button" onClick={useCurrentLocation} disabled={locating}
          title="Use my current location"
          style={{
            flexShrink:0, padding:"0 14px", borderRadius:10, border:`1px solid ${color}33`,
            background: locating ? "#f3f4f6" : `${color}10`, color, fontWeight:700, fontSize:12,
            cursor: locating ? "not-allowed" : "pointer", whiteSpace:"nowrap",
          }}>
          {locating ? "⏳" : "📍"} {locating ? "Locating…" : "My location"}
        </button>
      </div>
      <div style={{ fontSize:10, color:"rgba(0,0,0,0.35)", marginTop:4 }}>
        Search a place above, or tap "My location" to use your phone's GPS — both fill the address and maps link below.
      </div>
    </div>
  );
}

// ── EventDateChips — reusable date-chip picker with live availability ──
// Shows next `days` dates as scrollable chips. Each chip shows the
// day name, date number, a "FREE" / "N BOOKED" label, and a status
// dot — based on how many `bookings` exist for that date.
function EventDateChips({ bookings = [], value, onChange, color = "#1d4ed8", idPrefix = "evChips", days = 14 }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const chips = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today); d.setDate(today.getDate()+i);
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), dd = String(d.getDate()).padStart(2,"0");
    const dateStr = `${y}-${m}-${dd}`;
    const count = bookings.filter(b => b.date === dateStr).length;
    const sel = value === dateStr;
    chips.push(
      <button key={dateStr} type="button"
        onClick={() => onChange(dateStr)}
        style={{ display:"flex", flexDirection:"column", alignItems:"center",
          padding:"8px 6px", borderRadius:12, flexShrink:0,
          border:`2px solid ${sel?color:count>0?"#fcd34d":"rgba(59,130,246,0.18)"}`,
          background:sel?color:count>0?"#fef3c7":"#f0f9ff",
          cursor:"pointer", minWidth:54,
          transition:"all 0.15s",
          boxShadow:sel?`0 3px 12px ${color}55`:"none" }}>
        <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase",
          color:sel?"rgba(255,255,255,0.8)":"#6b7280", letterSpacing:"0.5px" }}>
          {i===0?"Today":["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]}
        </div>
        <div style={{ fontSize:16, fontWeight:900, marginTop:2,
          color:sel?"#fff":"#1e3a8a" }}>{dd}</div>
        <div style={{ fontSize:8, marginTop:3, fontWeight:800, whiteSpace:"nowrap",
          color:sel?"rgba(255,255,255,0.9)":count>0?"#d97706":"#16a34a" }}>
          {count>0?`${count} BOOKED`:"FREE"}
        </div>
        <div style={{ display:"flex", gap:2, marginTop:4 }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:count>0?"#f59e0b":"#22c55e" }}/>
        </div>
      </button>
    );
  }
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <button type="button" onClick={() => { const el=document.getElementById(idPrefix); if(el) el.scrollBy({left:-160,behavior:"smooth"}); }}
        style={{ flexShrink:0, width:32, height:32, borderRadius:"50%", border:"none",
          background:`linear-gradient(135deg,${color},${color}cc)`, color:"#fff",
          fontSize:18, cursor:"pointer", fontWeight:900, lineHeight:1 }}>‹</button>
      <div id={idPrefix} style={{ display:"flex", gap:6, overflowX:"auto", flex:1,
        paddingBottom:6, scrollbarWidth:"none" }}>
        {chips}
      </div>
      <button type="button" onClick={() => { const el=document.getElementById(idPrefix); if(el) el.scrollBy({left:160,behavior:"smooth"}); }}
        style={{ flexShrink:0, width:32, height:32, borderRadius:"50%", border:"none",
          background:`linear-gradient(135deg,${color},${color}cc)`, color:"#fff",
          fontSize:18, cursor:"pointer", fontWeight:900, lineHeight:1 }}>›</button>
    </div>
  );
}

function App({ onChangeSuk, deepLink = {}, currentUser = null, onSignOut, onRequestSignIn }) {
  // Merge DEFAULT_FEATURES with this SUK's overrides
  const feat = React.useMemo(() => ({
    ...DEFAULT_FEATURES,
    ...(state.ACTIVE_SUK && state.ACTIVE_SUK.features ? state.ACTIVE_SUK.features : {}),
  }), []);

  // isConfigured: reactive — true only when a real SUK is loaded with a valid URL
  const isConfigured = !!(state.ACTIVE_SUK && state.ACTIVE_SUK.configured &&
    state.SCRIPT_URL && state.SCRIPT_URL !== "" && !state.SCRIPT_URL.startsWith("YOUR_"));
  const [bookings,   setBookings]   = React.useState([]);
  const [form,       setForm]       = React.useState({ name:"", mobile:"", place:"", time:"", date:"", mapsLink:"" });

  const [error,      setError]      = React.useState("");
  const [shake,      setShake]      = React.useState(false);
  const [activeTab,  setActiveTab]  = React.useState("book");
  const [manageTab,       setManageTab]       = React.useState(null);
  const [allBookingsFilter, setAllBookingsFilter] = React.useState("all");
  const [bookMode,   setBookMode]   = React.useState("prayer"); // "prayer" | "satsang"
  // Reset bookMode if current mode is disabled for this SUK
  React.useEffect(() => {
    if (feat && !feat.satsangBooking && bookMode === "satsang") setBookMode("prayer");
    if (feat && !feat.bhadraBooking  && bookMode === "bhadra")  setBookMode("prayer");
    if (feat && !feat.matriBooking   && bookMode === "matri")   setBookMode("prayer");
    if (feat && !feat.savanBooking   && bookMode === "savan")   setBookMode("prayer");
  }, [feat, bookMode]);

  // ── Deep-link: auto-navigate to gallery if ?open=gallery in URL ──
  React.useEffect(() => {
    if (deepLink.open === "gallery") {
      setActiveTab("manage");
      setManageTab("gallery");
      // Clean the URL without reload so sharing link doesn't persist on refresh
      try {
        const clean = window.location.pathname;
        window.history.replaceState({}, "", clean);
      } catch(e) {}
    }
  }, []);
  const [loading,    setLoading]    = React.useState(false);
  // dataReady = BOTH bookings & satsang loaded — overlay stays until both finish
  const [bookingsReady, setBookingsReady] = React.useState(false);
  const [satsangReady,  setSatsangReady]  = React.useState(false);
  const dataReady = !isConfigured || (bookingsReady && satsangReady);
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState(null);
  const [showCancel, setShowCancel] = React.useState(false);
  // Cancel flow
  const [cancelMobile, setCancelMobile] = React.useState("");
  const [cancelResults, setCancelResults] = React.useState(null);
  const [cancelMsg, setCancelMsg] = React.useState("");
  const [cancelling, setCancelling] = React.useState(null); // stores the ID being cancelled
  // Retrieve & reshare
  const [shareMobile,        setShareMobile]        = React.useState("");
  const [retrieveTypeFilter, setRetrieveTypeFilter] = React.useState("prayer");
  const [shareResults, setShareResults] = React.useState(null);
  const [shareMsg, setShareMsg] = React.useState("");
  // Past-toggle state for Retrieve tab and Cancel section (component-level to obey hook rules)
  const [showRetrievePast, setShowRetrievePast] = React.useState(false);
  const [showCancelPast,   setShowCancelPast]   = React.useState(false);
  // Announcements
  // Satsang Booking state
  const [satsangBookings, setSatsangBookings] = React.useState([]);
  const [bhadraBookings, setBhadraBookings] = React.useState([]);
  const [matriBookings,  setMatriBookings]  = React.useState([]);
  const [savanBookings,  setSavanBookings]  = React.useState([]);
  const [satsangLoadingData, setSatsangLoadingData] = React.useState(false);
  const [satsangForm, setSatsangForm] = React.useState({ name:"", mobile:"", venue:"", date:"", time:"", hostedBy:"", mapsLink:"", occasion:"" });
  const [satsangError, setSatsangError] = React.useState("");
  const [satsangShake, setSatsangShake] = React.useState(false);
  const [satsangSubmitting, setSatsangSubmitting] = React.useState(false);
  const [satsangConfirm, setSatsangConfirm] = React.useState(null);
  const [satsangCalDate, setSatsangCalDate] = React.useState(() => {
    const t = new Date(); t.setHours(0,0,0,0);
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
  });

  // Satsang sub-mode: "book" | "invite" | "message"
  const [satsangMode, setSatsangMode] = React.useState("book");

  // Message Creator state
  const [msgType, setMsgType]   = React.useState("");

  // Photo gallery state
  const [photos, setPhotos]       = React.useState([]);
  const [photosLoading, setPhotosLoading] = React.useState(false);
  const [photoUpload, setPhotoUpload] = React.useState({ caption:"", uploader:"", file:null, preview:null });
  const [photoUploading, setPhotoUploading] = React.useState(false);
  const [photoMsg, setPhotoMsg]   = React.useState("");
  // Jajan experience
  const [jajan, setJajan] = React.useState({ name:"", place:"", date:"", experience:"", link:"" });
  const [satsang, setSatsang]   = React.useState({ date:"", time:"", venue:"", mapsLink:"", hostedBy:"" });
  const [customMsg, setCustomMsg] = React.useState({ body:"", author:"" });
  const [msgPreview, setMsgPreview] = React.useState("");

  // Address edit
  const [editingAddress, setEditingAddress] = React.useState(null);
  const [editAddressVal, setEditAddressVal] = React.useState("");
  const [editMapsVal,    setEditMapsVal]    = React.useState("");
  const [savingAddress, setSavingAddress] = React.useState(false);
  const [addressMsg, setAddressMsg] = React.useState({});

  const fetchBookings = React.useCallback(async () => {
    if (!isConfigured) { setBookingsReady(true); return; }
    setBookingsReady(false);  // show overlay while loading
    try {
      const d = await api.getAll();
      if (d.success && Array.isArray(d.data)) setBookings(d.data);
      else if (Array.isArray(d)) setBookings(d);
    } catch(e) { console.error('fetchBookings error:', e); }
    setBookingsReady(true);
  }, [isConfigured]);

  React.useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // ── Warm invitation share message ───────────────────────────
  const buildShareMsgPlain = (c) => {
    const timeLabel = c.time === "Morning" ? "Morning" : "Evening";
    const locationLine = c.place || (state.ACTIVE_SUK ? sukLabel(state.ACTIVE_SUK)+(state.ACTIVE_SUK.location ? ", "+state.ACTIVE_SUK.location : "") : "Satsang Upayojana Kendra");
    const lines = [
      "Jayguru 🙏",
      "",
      "You're cordially invited! 🙏",
      "",
      `for the *${timeLabel} Prayer*`,
      `on *${formatDateWithDay(c.date)}* at *${cleanTime(c.prayerTime)}*`,
      "",
      "Please join us with your family and friends 🙏",
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      `🕐 *Prayer Time:* ${cleanTime(c.prayerTime)} sharp`,
      `📍 *Address:* ${locationLine}`,
      ...(c.mapsLink ? [`📌 *Google Maps:* ${c.mapsLink}`] : []),
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "*With love & Jayguru,*",
      `${c.name} 🙏`,
      `📱 ${c.mobile}`,
      "",
      `🙏 *${state.ACTIVE_SUK ? sukLabel(state.ACTIVE_SUK)+(state.ACTIVE_SUK.location ? ", "+state.ACTIVE_SUK.location : "") : "Satsang Upayojana Kendra"}*`,
    ];
    return lines.join("\n");
  };

  const buildShareMsg = (c) => encodeURIComponent(buildShareMsgPlain(c));

  // ── Format satsang time safely (handles string and Date object) ──

  // Mask mobile for privacy — show only last 4 digits
  const maskMobile = (m) => {
    const s = String(m||"").replace(/\D/g,"");
    if (s.length < 4) return "••••••••••";
    return "•".repeat(s.length - 4) + s.slice(-4);
  };
  const fmtSatsangTime = (t) => {
    if (!t) return "";
    return cleanTime(t);  // handles 1899 Google Sheets bug, strings, Date objects
  };

  // ── Satsang booking share message ────────────────────────
  const buildSatsangShareMsgPlain = (c) => {
    const day  = c.day || getDayName(c.date);
    const date = formatDate(c.date);
    const lines = [
      "🙏 *Hearty Jayguru* 🙏",
      "",
      "Respected Dada / Maa,",
      "",
      "By the divine grace of",
      "*Param Premamay Sree Sree Thakur Anukulchandra*,",
      "we are humbly arranging a *Holy Satsang* at our residence.",
      c.occasion ? `\n🪔 *Occasion:* ${c.occasion}` : "",
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "📅 *Date & Time*",
      `      ${day}, ${date}  |  ${c.time} onwards`,
      "",
      "📍 *Venue*",
      `      ${c.venue}`,
      c.mapsLink ? `      📌 ${c.mapsLink}` : "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "We most cordially request your divine presence",
      "along with your *family and friends*. 🌸",
      "",
      "Your presence will make this Satsang truly blessed. 🪔",
      "",
      `*With love & Jayguru,*`,
      `${c.hostedBy || (state.ACTIVE_SUK ? sukLabel(state.ACTIVE_SUK) : "SUK")}`,
      c.mobile ? `📱 ${c.mobile}` : "",
      "",
      `🙏 *${state.ACTIVE_SUK ? sukLabel(state.ACTIVE_SUK)+(state.ACTIVE_SUK.location ? ", "+state.ACTIVE_SUK.location : "") : "Satsang Upayojana Kendra"}* 🙏`,
    ].filter(l => l !== null && l !== undefined);
    return lines.join("\n");
  };
  const buildSatsangShareMsg = (c) => encodeURIComponent(buildSatsangShareMsgPlain(c));

  const handleSatsangCopy = (c) => {
    const msg = buildSatsangShareMsgPlain(c);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg)
        .then(() => alert("✅ Copied! Paste it in WhatsApp, SMS or anywhere."))
        .catch(() => prompt("Copy this message:", msg));
    } else {
      prompt("Copy this message:", msg);
    }
  };

  const handleCopy = (c) => {
    const msg = buildShareMsgPlain(c);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg)
        .then(() => alert("✅ Copied! Paste it in WhatsApp, SMS or anywhere."))
        .catch(() => prompt("Copy this message:", msg));
    } else {
      prompt("Copy this message:", msg);
    }
  };

  // ── Cancel lookup by mobile ───────────────────────────────
  const handleCancelLookup = async () => {
    setCancelMsg("");
    setCancelResults(null);
    if (!/^[0-9]{10}$/.test(cancelMobile.trim())) {
      setCancelMsg("⚠️ Please enter a valid 10-digit mobile number.");
      return;
    }
    const mob = cancelMobile.trim();
    // Show full loader and fetch fresh from Google Sheets every time
    setBookingsReady(false);
    setSatsangReady(false);
    try {
      const fetches = [api.getAll(), satsangApi.getAll()];
      if (feat.bhadraBooking) fetches.push(bhadraApi.getAll());
      if (feat.matriBooking)  fetches.push(matriApi.getAll());
      if (feat.savanBooking)  fetches.push(savanApi.getAll());
      const results = await Promise.all(fetches);
      const [bd, sd] = results;
      const freshBookings = (bd && bd.success && Array.isArray(bd.data)) ? bd.data : [];
      const freshSatsang  = (sd && sd.success && Array.isArray(sd.data)) ? sd.data : [];
      const freshBhadra   = feat.bhadraBooking && results[2] ? ((results[2].success && Array.isArray(results[2].data)) ? results[2].data : []) : [];
      const freshMatri    = feat.matriBooking  && results[feat.bhadraBooking?3:2] ? ((results[feat.bhadraBooking?3:2].success && Array.isArray(results[feat.bhadraBooking?3:2].data)) ? results[feat.bhadraBooking?3:2].data : []) : [];
      const freshSavan    = feat.savanBooking  && results[results.length-1] ? ((results[results.length-1].success && Array.isArray(results[results.length-1].data)) ? results[results.length-1].data : []) : [];
      setBookings(freshBookings);
      setSatsangBookings(freshSatsang);
      if (freshBhadra.length) setBhadraBookings(freshBhadra);
      if (freshMatri.length)  setMatriBookings(freshMatri);
      if (freshSavan.length)  setSavanBookings(freshSavan);
      const prayerFound  = freshBookings.filter(b => b.mobile === mob).map(b => ({ ...b, _type:"prayer" }));
      const satsangFound = freshSatsang.filter(b => b.mobile === mob).map(b => ({ ...b, _type:"satsang" }));
      const bhadraFnd    = freshBhadra.filter(b => b.mobile === mob).map(b => ({ ...b, _type:"bhadra" }));
      const matriFnd     = freshMatri.filter(b => b.mobile === mob).map(b => ({ ...b, _type:"matri" }));
      const savanFnd     = freshSavan.filter(b => b.mobile === mob).map(b => ({ ...b, _type:"savan" }));
      const combined = [...prayerFound, ...satsangFound, ...bhadraFnd, ...matriFnd, ...savanFnd].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
      if (combined.length === 0) {
        setCancelMsg("❌ No bookings found for this mobile number.");
        setCancelResults([]);
      } else {
        setCancelResults(combined);
      }
    } catch(e) {
      setCancelMsg("❌ Network error. Please try again.");
    } finally {
      setBookingsReady(true);
      setSatsangReady(true);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    setCancelling(id);
    try {
      const result = await api.delete(id);
      if (result.success) {
        // 1. Remove from UI immediately so user sees it gone right away
        setCancelResults(prev => Array.isArray(prev) ? prev.filter(b => b.id !== id) : prev);
        setShareResults(prev => Array.isArray(prev) ? prev.filter(b => b.id !== id) : prev);
        setBookings(prev => prev.filter(b => b.id !== id));
        // 2. Show loader overlay while re-fetching confirmed fresh data from server
        setBookingsReady(false);
        const successMsg = "✅ Booking cancelled successfully.";
        setCancelMsg(successMsg);
        setShareMsg(successMsg);
        // 3. Await fresh fetch — localStorage cache already busted inside api.delete()
        await fetchBookings();
      } else {
        const errMsg = "❌ Could not cancel. Please try again.";
        setCancelMsg(errMsg);
        setShareMsg(errMsg);
      }
    } catch(e) {
      console.error("❌ Booking cancel error:", e);
      const errMsg = "❌ Could not cancel: " + (e?.message || "Please try again.");
      setCancelMsg(errMsg);
      setShareMsg(errMsg);
    }
    setCancelling(null);
  };

  const handleUpdateAddress = async (bookingId, newAddress, newMapsLink) => {
    setSavingAddress(true);
    try {
      const parts = [newAddress.trim(), (newMapsLink||"").trim()].filter(Boolean);
      const combined = parts.join("  ");
      // FIXED: use api.update (PATCH /bookings/{id}/address) not api.post
      const result = await api.update(bookingId, combined);
      if (result.success) {
        setShareResults(prev => prev.map(b =>
          b.id === bookingId ? { ...b, place: combined } : b
        ));
        setAddressMsg(prev => ({ ...prev, [bookingId]: "Address updated!" }));
        setEditingAddress(null);
        setEditAddressVal("");
        setEditMapsVal("");
        fetchBookings();
        setTimeout(() => setAddressMsg(prev => { const n={...prev}; delete n[bookingId]; return n; }), 3000);
      } else {
        setAddressMsg(prev => ({ ...prev, [bookingId]: "Error: " + (result.message || "Update failed") }));
      }
    } catch(e) {
      setAddressMsg(prev => ({ ...prev, [bookingId]: "Network error. Please try again." }));
    }
    setSavingAddress(false);
  };

  const buildSatsangMsg = () => {
    const { date, time, venue, mapsLink, hostedBy } = satsang;
    const lines = [
      "🙏 *Hearty Jayguru* 🙏",
      "",
      "Respected Dada / Maa,",
      "",
      "By the divine grace of",
      "*Param Premamay Sree Sree Thakur Anukulchandra*,",
      "we are humbly arranging a *Holy Satsang* at our residence.",
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "📅 *Date & Time*",
    ];
    if (date) lines.push(`      ${date}${time ? "  |  " + time + " onwards" : ""}`);
    lines.push("");
    lines.push("📍 *Venue*");
    if (venue) lines.push(`      ${venue}`);
    if (mapsLink) lines.push(`      📌 ${mapsLink}`);
    lines.push("━━━━━━━━━━━━━━━━━━━━");
    lines.push("");
    lines.push("We most cordially request your divine presence");
    lines.push("along with your *family and friends*. 🌸");
    lines.push("");
    lines.push("Your presence will make this Satsang truly blessed. 🪷");
    lines.push("");
    if (hostedBy) {
      lines.push("*With love & Jayguru,*");
      lines.push(hostedBy);
    }
    lines.push("");
    lines.push(`🙏 *${state.ACTIVE_SUK ? sukLabel(state.ACTIVE_SUK)+(state.ACTIVE_SUK.location ? ", "+state.ACTIVE_SUK.location : "") : "Satsang Upayojana Kendra"}* 🙏`);
    return lines.join("\n");
  };

  const buildCustomMsg = () => {
    const lines = [
      "🙏 *Hearty Jayguru* 🙏",
      "",
      customMsg.body.trim(),
      "",
      "━━━━━━━━━━━━━━━━━━━━",
    ];
    if (customMsg.author.trim()) lines.push(`*${customMsg.author.trim()}*`);
    lines.push(`🙏 *${state.ACTIVE_SUK ? sukLabel(state.ACTIVE_SUK)+(state.ACTIVE_SUK.location ? ", "+state.ACTIVE_SUK.location : "") : "Satsang Upayojana Kendra"}* 🙏`);
    return lines.join("\n");
  };

  const getBuiltMsg = () => msgType === "satsang" ? buildSatsangMsg() : buildCustomMsg();

  const buildJajanMsg = () => {
    const { name, place, date, experience } = jajan;
    return [
      "Jayguru 🙏",
      "",
      "🌸 *Jajan Experience*",
      "",
      experience.trim(),
      "",
      jajan.link.trim() ? `🔗 ${jajan.link.trim()}`                         : "",
      name.trim()    ? `— ${name.trim()}`                                    : "",
      place.trim()   ? `📍 ${place.trim()}`                                  : "",
      date           ? `📅 ${getDayName(date)}, ${formatDate(date)}`         : "",
      "",
      "─────────────────",
      `🙏 ${state.ACTIVE_SUK ? sukLabel(state.ACTIVE_SUK)+(state.ACTIVE_SUK.location ? ", "+state.ACTIVE_SUK.location : "") : "Satsang Upayojana Kendra"}`,
    ].filter((l, i, arr) => !(l === "" && arr[i-1] === "")).join("\n");
  };

  const shareWhatsApp = (msg) => window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  const shareSMS      = (msg) => window.open(`sms:?body=${encodeURIComponent(msg)}`);
  const shareCopy     = (msg) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg)
        .then(() => alert("✅ Copied! Paste it anywhere."))
        .catch(() => prompt("Copy:", msg));
    } else { prompt("Copy:", msg); }
  };

  const handleShareLookup = () => {
    setShareMsg("");
    setShareResults(null);
    if (!/^[0-9]{10}$/.test(shareMobile.trim())) {
      setShareMsg("⚠️ Please enter a valid 10-digit mobile number.");
      return;
    }
    const mob = shareMobile.trim();
    // Search BOTH prayer and satsang bookings
    const prayerFound   = bookings.filter(b => b.mobile === mob).map(b => ({ ...b, _type:"prayer" }));
    const satsangFound  = satsangBookings.filter(b => b.mobile === mob).map(b => ({ ...b, _type:"satsang" }));
    const bhadraFound   = feat.bhadraBooking ? bhadraBookings.filter(b => b.mobile === mob).map(b => ({ ...b, _type:"bhadra" })) : [];
    const matriFound    = feat.matriBooking  ? matriBookings.filter(b => b.mobile === mob).map(b => ({ ...b, _type:"matri" }))  : [];
    const savanFound    = feat.savanBooking  ? savanBookings.filter(b => b.mobile === mob).map(b => ({ ...b, _type:"savan" }))  : [];
    const allFound = [...prayerFound, ...satsangFound, ...bhadraFound, ...matriFound, ...savanFound];
    // Filter by type if not "all"
    const combined = retrieveTypeFilter === "all" ? allFound : allFound.filter(b => b._type === retrieveTypeFilter)
      .sort((a,b) => (a.date||"").localeCompare(b.date||"")); // oldest first (Jan → Feb → Mar)
    if (combined.length === 0) {
      setShareMsg("❌ No bookings found for this mobile number.");
      setShareResults([]);
    } else {
      setShareResults(combined);
    }
  };

  // Cancel a satsang booking
  const handleCancelSatsang = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this Satsang booking?")) return;
    setCancelling(id);
    try {
      const result = await satsangApi.cancel(id);
      if (result.success) {
        // 1. Remove from UI immediately so user sees it gone right away
        setCancelResults(prev => Array.isArray(prev) ? prev.filter(b => b.id !== id) : prev);
        setShareResults(prev => Array.isArray(prev) ? prev.filter(b => b.id !== id) : prev);
        setSatsangBookings(prev => prev.filter(b => b.id !== id));
        // 2. Show loader overlay while re-fetching confirmed fresh data from server
        setSatsangReady(false);
        const successMsg = "✅ Satsang cancelled successfully.";
        setCancelMsg(successMsg);
        setShareMsg(successMsg);
        // 3. Await fresh fetch — localStorage cache already busted inside satsangApi.cancel()
        await fetchSatsangBookings();
      } else {
        const errMsg = "❌ Could not cancel: " + (result.message||"Please try again.");
        setCancelMsg(errMsg);
        setShareMsg(errMsg);
      }
    } catch(e) {
      console.error("❌ Satsang cancel error:", e);
      const errMsg = "❌ Could not cancel: " + (e?.message || "Please try again.");
      setCancelMsg(errMsg);
      setShareMsg(errMsg);
    }
    setCancelling(null);
  };

  // ── Cancel Bhadra / Matri / Savan — routes to correct API ──
  const handleCancelSpecial = async (id, _type) => {
    const LABEL = { satsang:"Satsang", bhadra:"Bhadra Parikrama", matri:"Matri-Sammelan", savan:"Savan Parikrama" };
    const API   = { satsang:satsangApi, bhadra:bhadraApi, matri:matriApi, savan:savanApi };
    const FETCH = { satsang:fetchSatsangBookings, bhadra:fetchBhadraBookings, matri:fetchMatriBookings, savan:fetchSavanBookings };
    const SET   = {
      satsang: v => setSatsangBookings(v),
      bhadra:  v => setBhadraBookings(v),
      matri:   v => setMatriBookings(v),
      savan:   v => setSavanBookings(v),
    };
    const label = LABEL[_type] || "booking";
    const api   = API[_type]   || satsangApi;
    const fetch = FETCH[_type] || fetchSatsangBookings;
    const setFn = SET[_type];
    if (!window.confirm(`Are you sure you want to cancel this ${label} booking?`)) return;
    setCancelling(id);
    try {
      const result = await api.cancel(id);
      if (result.success) {
        if (setFn) setFn(prev => prev.filter(b => b.id !== id));
        setShareResults(prev => Array.isArray(prev) ? prev.filter(b => b.id !== id) : prev);
        const successMsg = `✅ ${label} cancelled successfully.`;
        setCancelMsg(successMsg); setShareMsg(successMsg);
        await fetch();
      } else {
        const errMsg = "❌ Could not cancel: " + (result.message||"Please try again.");
        setCancelMsg(errMsg); setShareMsg(errMsg);
      }
    } catch(e) {
      const errMsg = "❌ Could not cancel: " + (e?.message||"Please try again.");
      setCancelMsg(errMsg); setShareMsg(errMsg);
    }
    setCancelling(null);
  };

  // ── Fetch satsang bookings ─────────────────────────────────
  const fetchSatsangBookings = React.useCallback(async () => {
    if (!isConfigured) { setSatsangReady(true); return; }
    setSatsangReady(false);  // show overlay while loading
    try {
      const d = await satsangApi.getAll();
      if (d.success && Array.isArray(d.data)) setSatsangBookings(d.data);
      else if (Array.isArray(d)) setSatsangBookings(d);
    } catch(e) { console.error('fetchSatsang error:', e); }
    setSatsangReady(true);
  }, [isConfigured]);

  // Each special event (Bhadra / Matri / Savan) lives in its own sheet —
  // fetched the same way as Satsang so duplicate-slot checks and the
  // "already booked" cards work per-event-type.
  const fetchBhadraBookings = React.useCallback(async () => {
    if (!isConfigured || !feat.bhadraBooking) return;
    try {
      const d = await bhadraApi.getAll();
      if (d.success && Array.isArray(d.data)) setBhadraBookings(d.data);
      else if (Array.isArray(d)) setBhadraBookings(d);
    } catch(e) { console.error('fetchBhadra error:', e); }
  }, [isConfigured]);

  const fetchMatriBookings = React.useCallback(async () => {
    if (!isConfigured || !feat.matriBooking) return;
    try {
      const d = await matriApi.getAll();
      if (d.success && Array.isArray(d.data)) setMatriBookings(d.data);
      else if (Array.isArray(d)) setMatriBookings(d);
    } catch(e) { console.error('fetchMatri error:', e); }
  }, [isConfigured]);

  const fetchSavanBookings = React.useCallback(async () => {
    if (!isConfigured || !feat.savanBooking) return;
    try {
      const d = await savanApi.getAll();
      if (d.success && Array.isArray(d.data)) setSavanBookings(d.data);
      else if (Array.isArray(d)) setSavanBookings(d);
    } catch(e) { console.error('fetchSavan error:', e); }
  }, [isConfigured]);

  React.useEffect(() => { fetchSatsangBookings(); }, [fetchSatsangBookings]);
  React.useEffect(() => { fetchBhadraBookings(); }, [fetchBhadraBookings]);
  React.useEffect(() => { fetchMatriBookings();  }, [fetchMatriBookings]);
  React.useEffect(() => { fetchSavanBookings();  }, [fetchSavanBookings]);

  const triggerSatsangError = (msg) => {
    setSatsangError(msg); setSatsangShake(true);
    setTimeout(() => setSatsangShake(false), 600);
  };

  const handleSatsangSubmit = async () => {
    const { name, mobile, venue, date, time } = satsangForm;
    if (!name.trim())   { triggerSatsangError("⚠️ Please enter the host's name."); return; }
    if (!mobile.trim()) { triggerSatsangError("⚠️ Please enter the mobile number."); return; }
    if (!/^[0-9]{10}$/.test(mobile.trim())) { triggerSatsangError("⚠️ Valid 10-digit mobile required."); return; }
    if (!date)          { triggerSatsangError("⚠️ Please select a date."); return; }
    if (date < getTodayStr()) { triggerSatsangError("⚠️ Please select today or a future date."); return; }
    if (!time.trim())   { triggerSatsangError("⚠️ Please enter the time."); return; }
    if (!venue.trim())  { triggerSatsangError("⚠️ Please enter the venue."); return; }
    if (!isConfigured) { triggerSatsangError("⚠️ Please configure the Satsang Script URL."); return; }

    setSatsangSubmitting(true);
    try {
      const result = await satsangApi.post({
        action:"add",
        name: name.trim(),
        mobile: mobile.trim(),
        venue: venue.trim(),
        date, time: time.trim(),
        hostedBy: satsangForm.hostedBy.trim() || (state.ACTIVE_SUK ? sukLabel(state.ACTIVE_SUK) : "SUK"),
        mapsLink: satsangForm.mapsLink.trim(),
        occasion: satsangForm.occasion.trim(),
        day: getDayName(date),
      });
      if (result.success) {
        setSatsangConfirm({ ...satsangForm, id: result.id, day: getDayName(date) });
        setSatsangForm({ name:"", mobile:"", venue:"", date:"", time:"", hostedBy:"", mapsLink:"", occasion:"" });
        fetchSatsangBookings();
      } else { triggerSatsangError(result.message || "⚠️ Booking failed. Please try again."); }
    } catch(e) { triggerSatsangError("⚠️ Network error. Please try again."); }
    setSatsangSubmitting(false);
  };

  // ── Photo gallery ───────────────────────────────────────────
  const fetchPhotos = React.useCallback(async () => {
    if (!isConfigured) return;
    setPhotosLoading(true);
    try {
      const d = await photoApi.getAll();
      if (d.success && Array.isArray(d.data)) setPhotos(d.data);
      else if (Array.isArray(d)) setPhotos(d);
    } catch(e) {}
    setPhotosLoading(false);
  }, []);

  React.useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;
    try {
      const res = await photoApi.delete(photoId);
      if (res.success) {
        setPhotos(prev => prev.filter(p => p.id !== photoId));
        setPhotoMsg('✅ Photo deleted.');
      } else {
        setPhotoMsg('⚠️ ' + (res.message || 'Delete failed.'));
      }
    } catch (e) {
      setPhotoMsg('⚠️ Delete failed. Please try again.');
    }
  };

  const handlePhotoUpload = async () => {    if (!photoUpload.file) { setPhotoMsg("⚠️ Please select a photo first."); return; }
    if (!photoUpload.uploader.trim()) { setPhotoMsg("⚠️ Please enter your name before uploading."); return; }
    if (!isConfigured)     { setPhotoMsg("⚠️ Script URL not configured."); return; }
    setPhotoUploading(true); setPhotoMsg("");
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(",")[1];
        const res = await photoApi.upload(
          base64,
          photoUpload.file.name,
          photoUpload.caption.trim(),
          photoUpload.uploader.trim() || "Anonymous"
        );
        if (res.success) {
          const galleryUrl = (() => {
            try {
              const base = window.location.origin + window.location.pathname;
              return `${base}?suk=${encodeURIComponent(state.ACTIVE_SUK ? state.ACTIVE_SUK.key : "")}&open=gallery`;
            } catch(e) { return ""; }
          })();
          setPhotoMsg("✅ Photo uploaded! Share the gallery with family 🙏\n" + galleryUrl);
          setPhotoUpload({ caption:"", uploader:"", file:null, preview:null });
          fetchPhotos();
        } else { setPhotoMsg("⚠️ " + (res.message || "Upload failed")); }
        setPhotoUploading(false);
      };
      reader.readAsDataURL(photoUpload.file);
    } catch(e) { setPhotoMsg("⚠️ Upload failed. Please try again."); setPhotoUploading(false); }
  };

  const prayerTimes    = getPrayerTimes(form.date);
  const isSlotTaken    = (date, time) => bookings.some(b => b.date===date && b.time===time);
  const getSlotBooking = (date, time) => bookings.find(b => b.date===date && b.time===time);

  const triggerError = (msg) => {
    setError(msg); setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handleSlotSelect = (time) => {
    if (form.date && isSlotTaken(form.date, time)) {
      const ex = getSlotBooking(form.date, time);
      triggerError(`🚫 "${time} Prayer" on ${formatDate(form.date)} is already booked by ${ex.name}.\n\nPlease choose a different date or slot.`);
      return;
    }
    setError("");
    setForm(f => ({ ...f, time }));
  };

  const handleBook = async () => {
    setError("");
    const { name, mobile, place, time, date } = form;
    if (!name.trim())   { triggerError("⚠️ Please enter the person's name."); return; }
    if (!mobile.trim()) { triggerError("⚠️ Please enter the mobile number."); return; }
    if (!/^[0-9]{10}$/.test(mobile.trim())) { triggerError("⚠️ Please enter a valid 10-digit mobile number."); return; }
    if (!form.place.trim())  { triggerError("⚠️ Please enter your location name."); return; }
    if (!date)          { triggerError("⚠️ Please select a date."); return; }
    if (date < getTodayStr()) { triggerError("⚠️ You cannot book a past date. Please select today or a future date."); return; }
    if (!time)          { triggerError("⚠️ Please select Morning or Evening slot."); return; }
    if (isSlotTaken(date, time)) {
      const ex = getSlotBooking(date, time);
      triggerError(`🚫 "${time} Prayer" on ${formatDate(date)} is already booked by ${ex.name}.\n\nPlease choose a different date or slot.`);
      return;
    }
    if (!isConfigured) { triggerError("⚠️ Please add your Google Apps Script URL first."); return; }

    const day        = getDayName(date);
    const pt         = getPrayerTimes(date);
    const prayerTime = pt ? pt[time] : "";
    const mapsLink   = form.mapsLink || "";

    setSubmitting(true);
    try {
      const result = await api.post({ action:"add", name, mobile, place, mapsLink, day, time, date, prayerTime });
      if (result.success) {
        // Show beautiful confirmation modal
        setConfirmation({ name, mobile, time, date, prayerTime, id: result.id, place, mapsLink });
        setForm({ name:"", mobile:"", place:"", time:"", date:"", mapsLink:"" });
        fetchBookings();
      } else { triggerError(result.message); }
    } catch(e) { triggerError("⚠️ Network error. Please try again."); }
    setSubmitting(false);
  };

  // ── Hamburger / drawer state ──────────────────────────────
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  const tabs = [
    { id:"book", label:"🙏 Book" },
  ];
  // Only show manage sub-tabs that are enabled for this SUK
  const manageTabs = [
    feat.prayerTimes     && { id:"times",    label:"🙏 Prayer Timings",     desc:"View morning & evening prayer times",   icon:"🙏" },
    feat.retrieveBooking && { id:"share",    label:"🪷 Retrieve Booking",    desc:"Retrieve your booking details",          icon:"🪷" },
    feat.allBookings     && { id:"all",      label:"📖 All Bookings",        desc:"See all prayer bookings by date",       icon:"📖" },
    feat.messages        && { id:"announce", label:"📨 Messages",             desc:"Create invitations & custom messages",   icon:"📨" },
    feat.photoGallery    && { id:"gallery",  label:"🌸 Prayer Photo Gallery", desc:"Upload & view prayer photo memories",   icon:"🌸" },
    currentUser          && { id:"dashboard", label:"📊 Devotee Dashboard",    desc:"Track bookings & engagement per devotee", icon:"📊" },
  ].filter(Boolean);
  const [calDate,   setCalDate]   = React.useState(() => {
    const t = new Date(); t.setHours(0,0,0,0);
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
  });

  const blueText   = { color:"#1e3a8a" };
  const mutedBlue  = { color:"rgba(30,64,175,0.6)" };
  const darkText   = { color:"#1f2937" };

  return (
    <div className="content">

      {/* ── DATA LOADING OVERLAY ── */}
      {isConfigured && !dataReady && <DataLoadingOverlay />}

      {/* ── CONFIRMATION MODAL ── */}
      {confirmation && (
        <div className="modal-overlay" onClick={() => setConfirmation(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>

            {/* Animated tick */}
            <div style={{ fontSize:56, marginBottom:8,
              animation:"floatEmoji 2s ease-in-out infinite alternate" }}>🙏</div>

            <div className="modal-title">Booking Confirmed!</div>

            {/* Booking details card */}
            <div style={{ background:"#eff6ff", borderRadius:14, padding:"14px 16px",
              margin:"14px 0", textAlign:"left", border:"1px solid rgba(59,130,246,0.2)" }}>

              {[
                ["👤 Name",  confirmation.name],
                [confirmation.time==="Morning" ? "🌅 Slot" : "🌙 Slot",
                  `${confirmation.time} Prayer`],
                ["🗓️ Date",  formatDateWithDay(confirmation.date)],
                ["🕐 Time",  cleanTime(confirmation.prayerTime)],
              ].map(([label, val]) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", padding:"5px 0",
                  borderBottom:"1px solid rgba(59,130,246,0.08)" }}>
                  <span style={{ fontSize:12, color:"rgba(29,78,216,0.55)", fontWeight:600 }}>{label}</span>
                  <span style={{ fontSize:13, color:"#1e3a8a", fontWeight:700 }}>{val}</span>
                </div>
              ))}
            </div>

            <div className="modal-jayguru">Jayguru 🙏</div>

            {/* ── SHARE SECTION ── */}
            <div style={{ marginTop:18, padding:"14px", background:"#f0fdf4",
              borderRadius:12, border:"1px solid #bbf7d0" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#065f46",
                marginBottom:10, textAlign:"center", letterSpacing:"0.5px" }}>
                📤 Share Booking Details
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>

                {/* WhatsApp share */}
                <a href={`https://wa.me/?text=${buildShareMsg(confirmation)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display:"flex", alignItems:"center", justifyContent:"center",
                    gap:10, padding:"12px", borderRadius:11, textDecoration:"none",
                    background:"linear-gradient(135deg,#25D366,#128C7E)",
                    color:"#fff", fontWeight:800, fontSize:14,
                    boxShadow:"0 4px 14px rgba(37,211,102,0.35)" }}>
                  <span style={{ fontSize:20 }}>💬</span>
                  Share on WhatsApp
                </a>

                {/* SMS share — works on mobile */}
                <a href={`sms:${confirmation.mobile}?body=${buildShareMsg(confirmation)}`}
                  style={{ display:"flex", alignItems:"center", justifyContent:"center",
                    gap:10, padding:"12px", borderRadius:11, textDecoration:"none",
                    background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",
                    color:"#fff", fontWeight:800, fontSize:14,
                    boxShadow:"0 4px 14px rgba(29,78,216,0.3)" }}>
                  <span style={{ fontSize:20 }}>📱</span>
                  Send as SMS
                </a>

                {/* Copy to clipboard */}
                <button onClick={() => handleCopy(confirmation)}
                  style={{ display:"flex", alignItems:"center", justifyContent:"center",
                    gap:10, padding:"12px", borderRadius:11, border:"none",
                    background:"rgba(30,64,175,0.08)", cursor:"pointer",
                    color:"#1e3a8a", fontWeight:700, fontSize:14 }}>
                  <span style={{ fontSize:20 }}>📋</span>
                  Copy to Clipboard
                </button>

              </div>
              <div style={{ fontSize:11, color:"#6b7280", marginTop:8,
                textAlign:"center", lineHeight:1.5 }}>
                Tap WhatsApp to share with family · or SMS to send directly · or Copy to paste anywhere
              </div>
            </div>

            <button className="modal-close-btn"
              style={{ marginTop:14 }}
              onClick={() => setConfirmation(null)}>
              ✓ Done
            </button>
          </div>
        </div>
      )}

      {/* ── SATSANG CONFIRMATION MODAL ── */}
      {satsangConfirm && (
        <div className="modal-overlay" onClick={() => setSatsangConfirm(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>

            <div style={{ fontSize:56, marginBottom:8,
              animation:"floatEmoji 2s ease-in-out infinite alternate",
              filter:"drop-shadow(0 0 18px rgba(217,119,6,0.5))" }}>🪔</div>

            <div className="modal-title" style={{ color:"#78350f" }}>Satsang Booked!</div>

            {/* Details card */}
            <div style={{ background:"#fef3c7", borderRadius:14, padding:"14px 16px",
              margin:"14px 0", textAlign:"left", border:"1px solid rgba(217,119,6,0.3)" }}>

              {[
                ["👤 Host",   satsangConfirm.name],
                ["📅 Date",   (satsangConfirm.day||"")+", "+formatDate(satsangConfirm.date)],
                ["⏰ Time",   satsangConfirm.time+" onwards"],
                ["📍 Venue",  satsangConfirm.venue],
                ["🪔 Occasion", satsangConfirm.occasion||null],
                ["🙏 Hosted", satsangConfirm.hostedBy||(state.ACTIVE_SUK ? sukLabel(state.ACTIVE_SUK) : "SUK")],
              ].map(([label, val]) => val ? (
                <div key={label} style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"flex-start", padding:"5px 0",
                  borderBottom:"1px solid rgba(217,119,6,0.1)" }}>
                  <span style={{ fontSize:12, color:"rgba(120,53,15,0.6)", fontWeight:600 }}>{label}</span>
                  <span style={{ fontSize:13, color:"#78350f", fontWeight:700,
                    textAlign:"right", maxWidth:"60%" }}>{val}</span>
                </div>
              ) : null)}
            </div>

            <div style={{ fontFamily:"'Cinzel',serif", color:"#78350f",
              fontSize:14, fontWeight:700, textAlign:"center", marginBottom:4 }}>
              Jayguru 🪔
            </div>

            {/* Share section */}
            <div style={{ marginTop:14, padding:"14px", background:"#fffbeb",
              borderRadius:12, border:"1px solid rgba(217,119,6,0.25)" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#78350f",
                marginBottom:10, textAlign:"center", letterSpacing:"0.5px" }}>
                📤 Share Satsang Details
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>

                <a href={`https://wa.me/?text=${buildSatsangShareMsg(satsangConfirm)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display:"flex", alignItems:"center", justifyContent:"center",
                    gap:10, padding:"12px", borderRadius:11, textDecoration:"none",
                    background:"linear-gradient(135deg,#25D366,#128C7E)",
                    color:"#fff", fontWeight:800, fontSize:14,
                    boxShadow:"0 4px 14px rgba(37,211,102,0.35)" }}>
                  <span style={{ fontSize:20 }}>💬</span>
                  Share on WhatsApp
                </a>

                <a href={`sms:?body=${buildSatsangShareMsg(satsangConfirm)}`}
                  style={{ display:"flex", alignItems:"center", justifyContent:"center",
                    gap:10, padding:"12px", borderRadius:11, textDecoration:"none",
                    background:"linear-gradient(135deg,#d97706,#fbbf24)",
                    color:"#fff", fontWeight:800, fontSize:14,
                    boxShadow:"0 4px 14px rgba(217,119,6,0.35)" }}>
                  <span style={{ fontSize:20 }}>📱</span>
                  Send as SMS
                </a>

                <button onClick={() => handleSatsangCopy(satsangConfirm)}
                  style={{ display:"flex", alignItems:"center", justifyContent:"center",
                    gap:10, padding:"12px", borderRadius:11, border:"none",
                    background:"rgba(120,53,15,0.08)", cursor:"pointer",
                    color:"#78350f", fontWeight:700, fontSize:14 }}>
                  <span style={{ fontSize:20 }}>📋</span>
                  Copy to Clipboard
                </button>

              </div>
              <div style={{ fontSize:11, color:"#6b7280", marginTop:8,
                textAlign:"center", lineHeight:1.5 }}>
                Share the invitation with family & friends 🙏
              </div>
            </div>

            <button className="modal-close-btn"
              style={{ marginTop:14, background:"linear-gradient(135deg,#78350f,#d97706)" }}
              onClick={() => setSatsangConfirm(null)}>
              ✓ Done
            </button>
          </div>
        </div>
      )}

      {/* ── HAMBURGER DRAWER OVERLAY ── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position:"fixed", inset:0, zIndex:3000,
            background:"rgba(0,0,0,0.35)", backdropFilter:"blur(2px)",
          }}
        />
      )}

      {/* ── HAMBURGER DRAWER ── */}
      <div style={{
        position:"fixed", top:0, left:0, bottom:0, zIndex:3001,
        width: drawerOpen ? 290 : 0,
        overflow:"hidden",
        transition:"width 0.28s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: drawerOpen ? "8px 0 40px rgba(29,78,216,0.18)" : "none",
      }}>
        <div style={{
          width:290, height:"100%",
          background:"linear-gradient(160deg,#f0f6ff 0%,#e8f0fe 60%,#dce9ff 100%)",
          display:"flex", flexDirection:"column",
          overflowY:"auto",
        }}>
          {/* Drawer header */}
          <div style={{
            padding:"28px 20px 20px",
            background:"linear-gradient(135deg,rgba(29,78,216,0.07),rgba(59,130,246,0.05))",
            borderBottom:"1px solid rgba(59,130,246,0.15)",
            position:"relative",
          }}>
            <button onClick={() => setDrawerOpen(false)} style={{
              position:"absolute", top:16, right:16,
              width:32, height:32, borderRadius:"50%", border:"none",
              background:"rgba(29,78,216,0.1)", cursor:"pointer",
              fontSize:16, color:"#1e3a8a", display:"flex",
              alignItems:"center", justifyContent:"center", fontWeight:900,
            }}>✕</button>

            {/* 🪷 All Options 🙏 — one line */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:currentUser ? 10 : 0 }}>
              <span style={{ fontSize:24 }}>🪷</span>
              <div style={{ fontFamily:"'Cinzel',serif", color:"#1e3a8a", fontSize:15, fontWeight:800,
                letterSpacing:1.5, textTransform:"uppercase" }}>
                All Options
              </div>
              <span style={{ fontSize:24 }}>🙏</span>
            </div>
            {currentUser && (
              <div style={{
                marginTop:10, padding:"8px 10px", borderRadius:10,
                background:"rgba(29,78,216,0.07)", border:"1px solid rgba(59,130,246,0.15)",
                fontSize:12, color:"#1e3a8a", fontWeight:600, textAlign:"center",
              }}>
                👤 {currentUser.name} · {currentUser.email || currentUser.mobile}
              </div>
            )}
          </div>

          {/* Drawer menu items */}
          <div style={{ flex:1, padding:"14px 12px" }}>
            {manageTabs.map((t, i) => (
              <button key={t.id}
                onClick={() => {
                  setActiveTab("manage");
                  setManageTab(t.id);
                  setDrawerOpen(false);
                }}
                style={{
                  display:"flex", alignItems:"center", gap:14, width:"100%",
                  padding:"12px 14px", border:"none", borderRadius:14, cursor:"pointer",
                  background:"rgba(255,255,255,0.55)", textAlign:"left",
                  transition:"all 0.18s", marginBottom:8,
                  boxShadow:"0 1px 4px rgba(29,78,216,0.07)",
                  borderLeft:"3px solid rgba(59,130,246,0.18)",
                }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(29,78,216,0.08)"; e.currentTarget.style.borderLeftColor="#1d4ed8"; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.55)"; e.currentTarget.style.borderLeftColor="rgba(59,130,246,0.18)"; }}
              >
                {/* Icon box */}
                <div style={{
                  width:42, height:42, borderRadius:12, flexShrink:0,
                  background:"linear-gradient(135deg,rgba(29,78,216,0.1),rgba(59,130,246,0.07))",
                  border:"1px solid rgba(59,130,246,0.2)",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:20,
                }}>
                  {t.icon}
                </div>
                {/* Text */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, color:"#1e3a8a", fontSize:13, lineHeight:1.3,
                    fontFamily:"'Cinzel',serif", letterSpacing:"0.3px" }}>
                    {t.label.replace(/^[^\s]+\s/, "")}
                  </div>
                  <div style={{ fontSize:11, color:"rgba(29,78,216,0.45)", marginTop:3, lineHeight:1.4 }}>
                    {t.desc}
                  </div>
                </div>
                {/* Arrow */}
                <div style={{ color:"rgba(29,78,216,0.35)", fontSize:18, flexShrink:0, fontWeight:300 }}>›</div>
              </button>
            ))}
          </div>

          {/* Admin Sign In / Sign Out */}
          <div style={{ padding:"16px 12px", borderTop:"1px solid rgba(59,130,246,0.12)" }}>
            {currentUser ? (
              <button onClick={() => { setDrawerOpen(false); onSignOut && onSignOut(); }} style={{
                width:"100%", padding:"12px", border:"1px solid rgba(220,38,38,0.25)",
                borderRadius:11, background:"rgba(254,242,242,0.7)", cursor:"pointer",
                color:"#b91c1c", fontWeight:700, fontSize:13,
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              }}>
                🚪 Sign Out
              </button>
            ) : (
              <button onClick={() => { setDrawerOpen(false); onRequestSignIn && onRequestSignIn(); }} style={{
                width:"100%", padding:"12px", border:"1px solid rgba(29,78,216,0.25)",
                borderRadius:11, background:"rgba(239,246,255,0.8)", cursor:"pointer",
                color:"#1d4ed8", fontWeight:700, fontSize:13,
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              }}>
                🔐 Admin Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── HEADER ── */}
      <div style={{ textAlign:"center", padding:"48px 0 30px", position:"relative" }}>
        {/* ── Hamburger button — top LEFT of header ── */}
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            position:"absolute", top:14, left:14, zIndex:10,
            width:42, height:42, borderRadius:12, border:"1.5px solid rgba(59,130,246,0.22)",
            background:"rgba(255,255,255,0.85)", backdropFilter:"blur(8px)",
            cursor:"pointer", display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:5,
            boxShadow:"0 3px 12px rgba(29,78,216,0.12)",
            transition:"all 0.2s",
          }}
          title="More options"
        >
          <div style={{ width:18, height:2, borderRadius:2, background:"#1e3a8a" }}/>
          <div style={{ width:14, height:2, borderRadius:2, background:"#3b82f6" }}/>
          <div style={{ width:18, height:2, borderRadius:2, background:"#1e3a8a" }}/>
        </button>

        {/* ── SUK switcher — compact at top RIGHT ── */}
        {onChangeSuk && (
          <div style={{
            position:"absolute", top:10, right:10, zIndex:10,
            maxWidth:160,
          }}>
            <SUKSearchDropdown
              selected={state.ACTIVE_SUK ? state.ACTIVE_SUK.key : ""}
              compact={true}
              onSelect={(key) => {
                const suk = SUK_CONFIG[key];
                if (!suk || !suk.configured) return;
                state.SCRIPT_URL = suk.scriptUrl;
                state.API_KEY    = suk.apiKey;
                state.ACTIVE_SUK = suk;
                try { sessionStorage.setItem("activeSuk", suk.key); } catch(ex) {}
                onChangeSuk("switch", suk);
              }}
            />
          </div>
        )}

        {/* Outer soft aura */}
        <div style={{ position:"absolute", top:"50%", left:"50%",
          transform:"translate(-50%,-50%)", width:360, height:220, borderRadius:"50%",
          background:"radial-gradient(ellipse,rgba(255,220,80,0.07) 0%,rgba(99,145,255,0.12) 45%,transparent 70%)",
          animation:"haloPulse 5s ease-in-out infinite alternate", pointerEvents:"none" }}/>

        {/* White lotus left + Pink lotus right — flanking */}
        <div style={{ display:"flex", justifyContent:"center", alignItems:"flex-end",
          gap:0, marginBottom:2 }}>
          <span style={{ fontSize:28, opacity:0.55,
            filter:"saturate(0) brightness(2.2) drop-shadow(0 0 8px rgba(255,255,255,0.7))",
            animation:"floatEmoji 4s ease-in-out infinite alternate",
            animationDelay:"0.5s", display:"inline-block" }}>🪷</span>
          {/* Centre lotus — large */}
          <span style={{ fontSize:68, display:"inline-block", margin:"0 4px",
            filter:"drop-shadow(0 0 22px rgba(255,160,0,0.6)) drop-shadow(0 0 55px rgba(255,100,150,0.25))",
            animation:"floatEmoji 3s ease-in-out infinite alternate" }}>🪷</span>
          <span style={{ fontSize:28, opacity:0.55,
            filter:"saturate(0) brightness(2.2) drop-shadow(0 0 8px rgba(255,255,255,0.7))",
            animation:"floatEmoji 4s ease-in-out infinite alternate",
            animationDelay:"1s", display:"inline-block" }}>🪷</span>
        </div>

        {/* JAYGURU */}
        <div style={{ marginTop:6 }}>
          <span className="jayguru-title">Jayguru</span>
        </div>

        {/* Gold + blue sacred ornament line */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
          gap:8, margin:"10px 16px 8px" }}>
          <div style={{ flex:1, height:1,
            background:"linear-gradient(90deg,transparent,rgba(255,200,60,0.5),rgba(59,130,246,0.4))" }}/>
          <span style={{ fontSize:18,
            filter:"drop-shadow(0 0 8px rgba(255,180,0,0.7))",
            animation:"floatEmoji 3s ease-in-out infinite alternate",
            animationDelay:"1.5s" }}>🙏</span>
          <div style={{ flex:1, height:1,
            background:"linear-gradient(90deg,rgba(59,130,246,0.4),rgba(255,200,60,0.5),transparent)" }}/>
        </div>

        {/* Subtitle */}
        <p style={{ fontFamily:"'Cinzel',serif", color:"#1e3a8a",
          fontSize:13, fontWeight:700, letterSpacing:"2px", margin:0 }}>
          Book Your Prayer Slot
        </p>
        <p style={{ fontSize:10, color:"rgba(30,64,175,0.45)", fontWeight:600,
          letterSpacing:"4px", textTransform:"uppercase", marginTop:5 }}>
          {state.ACTIVE_SUK ? `${state.ACTIVE_SUK.emoji} ${sukLabel(state.ACTIVE_SUK)}${state.ACTIVE_SUK.location ? " · "+state.ACTIVE_SUK.location : ""} ${state.ACTIVE_SUK.emoji}` : "🪷 Satsang Upayojana Kendra 🪷"}
        </p>
        {(bookings.length > 0 || satsangBookings.length > 0 || bhadraBookings.length > 0 || matriBookings.length > 0 || savanBookings.length > 0) && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
            gap:8, marginTop:10, flexWrap:"wrap" }}>
            {bookings.length > 0 && (
              <div onClick={() => { setAllBookingsFilter("prayer"); setActiveTab("manage"); setManageTab("all"); }}
                style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:20,
                  background:"rgba(29,78,216,0.07)", border:"1px solid rgba(29,78,216,0.14)",
                  cursor:"pointer", transition:"background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(29,78,216,0.15)"}
                onMouseLeave={e => e.currentTarget.style.background="rgba(29,78,216,0.07)"}>
                <span style={{ fontSize:12 }}>🌅</span>
                <span style={{ fontSize:11, color:"rgba(29,78,216,0.6)", fontWeight:700, fontFamily:"'Cinzel',serif", letterSpacing:"0.5px" }}>
                  {bookings.length} Prayer{bookings.length!==1?"s":""}
                </span>
                <span style={{ fontSize:9, color:"rgba(29,78,216,0.4)", marginLeft:2 }}>›</span>
              </div>
            )}
            {feat.satsangBooking && satsangBookings.length > 0 && (
              <div onClick={() => { setAllBookingsFilter("satsang"); setActiveTab("manage"); setManageTab("all"); }}
                style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:20,
                  background:"rgba(217,119,6,0.07)", border:"1px solid rgba(217,119,6,0.18)",
                  cursor:"pointer", transition:"background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(217,119,6,0.18)"}
                onMouseLeave={e => e.currentTarget.style.background="rgba(217,119,6,0.07)"}>
                <span style={{ fontSize:12 }}>🪔</span>
                <span style={{ fontSize:11, color:"rgba(120,53,15,0.65)", fontWeight:700, fontFamily:"'Cinzel',serif", letterSpacing:"0.5px" }}>
                  {satsangBookings.length} Satsang{satsangBookings.length!==1?"s":""}
                </span>
                <span style={{ fontSize:9, color:"rgba(120,53,15,0.4)", marginLeft:2 }}>›</span>
              </div>
            )}
            {feat.bhadraBooking && bhadraBookings.length > 0 && (
              <div onClick={() => { setAllBookingsFilter("bhadra"); setActiveTab("manage"); setManageTab("all"); }}
                style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:20,
                  background:"rgba(124,58,237,0.07)", border:"1px solid rgba(124,58,237,0.2)",
                  cursor:"pointer", transition:"background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(124,58,237,0.18)"}
                onMouseLeave={e => e.currentTarget.style.background="rgba(124,58,237,0.07)"}>
                <span style={{ fontSize:12 }}>🌸</span>
                <span style={{ fontSize:11, color:"rgba(109,40,217,0.75)", fontWeight:700, fontFamily:"'Cinzel',serif", letterSpacing:"0.5px" }}>
                  {bhadraBookings.length} Bhadra{bhadraBookings.length!==1?"s":""}
                </span>
                <span style={{ fontSize:9, color:"rgba(109,40,217,0.4)", marginLeft:2 }}>›</span>
              </div>
            )}
            {feat.matriBooking && matriBookings.length > 0 && (
              <div onClick={() => { setAllBookingsFilter("matri"); setActiveTab("manage"); setManageTab("all"); }}
                style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:20,
                  background:"rgba(219,39,119,0.07)", border:"1px solid rgba(219,39,119,0.2)",
                  cursor:"pointer", transition:"background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(219,39,119,0.18)"}
                onMouseLeave={e => e.currentTarget.style.background="rgba(219,39,119,0.07)"}>
                <span style={{ fontSize:12 }}>🌺</span>
                <span style={{ fontSize:11, color:"rgba(190,24,93,0.75)", fontWeight:700, fontFamily:"'Cinzel',serif", letterSpacing:"0.5px" }}>
                  {matriBookings.length} Matri{matriBookings.length!==1?"s":""}
                </span>
                <span style={{ fontSize:9, color:"rgba(190,24,93,0.4)", marginLeft:2 }}>›</span>
              </div>
            )}
            {feat.savanBooking && savanBookings.length > 0 && (
              <div onClick={() => { setAllBookingsFilter("savan"); setActiveTab("manage"); setManageTab("all"); }}
                style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:20,
                  background:"rgba(22,163,74,0.07)", border:"1px solid rgba(22,163,74,0.2)",
                  cursor:"pointer", transition:"background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(22,163,74,0.18)"}
                onMouseLeave={e => e.currentTarget.style.background="rgba(22,163,74,0.07)"}>
                <span style={{ fontSize:12 }}>🌿</span>
                <span style={{ fontSize:11, color:"rgba(21,128,61,0.75)", fontWeight:700, fontFamily:"'Cinzel',serif", letterSpacing:"0.5px" }}>
                  {savanBookings.length} Savan{savanBookings.length!==1?"s":""}
                </span>
                <span style={{ fontSize:9, color:"rgba(21,128,61,0.4)", marginLeft:2 }}>›</span>
              </div>
            )}
          </div>
        )}

        {/* Triple ornament dots */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
          gap:8, margin:"14px 0 0" }}>
          <div style={{ width:40, height:1, background:"linear-gradient(90deg,transparent,rgba(255,200,60,0.4))" }}/>
          <span style={{ fontSize:9, color:"rgba(255,180,0,0.5)", letterSpacing:8 }}>✦ ✦ ✦</span>
          <div style={{ width:40, height:1, background:"linear-gradient(90deg,rgba(255,200,60,0.4),transparent)" }}/>
        </div>
      </div>

      {/* ── Divine decorative strip ── */}
      <div style={{ textAlign:"center", marginBottom:18, letterSpacing:14,
        fontSize:13, color:"rgba(29,78,216,0.3)",
        animation:"haloPulse 4s ease-in-out infinite alternate" }}>
        ✦ 🪷 ✦
      </div>

      {/* ── TABS — just the Book tab now (More Options moved to hamburger) ── */}
      <div style={{ display:"flex", gap:6, marginBottom:24,
        background:"rgba(255,255,255,0.7)", borderRadius:14,
        padding:5, border:"1px solid rgba(59,130,246,0.15)" }}>
        {tabs.map(t => (
          <button key={t.id}
            className={`tab-btn ${activeTab===t.id ? "active":"inactive"}`}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Back button when inside a manage sub-tab (navigated from hamburger drawer) */}
      {activeTab === "manage" && manageTab && (
        <button onClick={() => { setActiveTab("book"); setManageTab(null); }}
          style={{ display:"flex", alignItems:"center", gap:6, background:"none",
            border:"none", cursor:"pointer", color:"rgba(29,78,216,0.6)",
            fontSize:13, fontWeight:700, padding:"0 2px 14px", letterSpacing:0.3 }}>
          ‹ Back to Book
        </button>
      )}

      {/* ════════ BOOK TAB ════════ */}
      {activeTab === "book" && (
        <div className="card">

          {/* ── Booking Type Dropdown ── */}
          {(() => {
            const BOOKING_TYPES = [
              feat.prayerBooking  && { mode:"prayer",   icon:"🙏", label:"Prayer Booking",           color:"#1d4ed8" },
              feat.satsangBooking && { mode:"satsang",  icon:"🪔", label:"Satsang Booking",           color:"#d97706" },
              feat.bhadraBooking  && { mode:"bhadra",   icon:"🌸", label:"Bhadra Parikrama Satsang",  color:"#7c3aed" },
              feat.matriBooking   && { mode:"matri",    icon:"🌺", label:"Matri-Sammelan",            color:"#db2777" },
              feat.savanBooking   && { mode:"savan",    icon:"🌿", label:"Savan Parikrama",           color:"#16a34a" },
            ].filter(Boolean);
            const active = BOOKING_TYPES.find(t => t.mode === bookMode) || BOOKING_TYPES[0];
            return (
              <div style={{ marginBottom:20 }}>
                <label className="divine-label">📋 Booking Type</label>
                <div style={{ position:"relative" }}>
                  <select
                    value={bookMode}
                    onChange={e => { setBookMode(e.target.value); setError(""); setSatsangError(""); setSatsangConfirm(null); }}
                    style={{
                      width:"100%", padding:"13px 44px 13px 16px",
                      borderRadius:13, border:`2px solid ${active.color}44`,
                      background:`linear-gradient(135deg,${active.color}0d,${active.color}06)`,
                      color: active.color, fontFamily:"'Cinzel',serif",
                      fontWeight:800, fontSize:14, cursor:"pointer",
                      appearance:"none", WebkitAppearance:"none",
                      boxShadow:`0 3px 14px ${active.color}18`,
                      outline:"none", transition:"all 0.25s",
                    }}
                  >
                    {BOOKING_TYPES.map(t => (
                      <option key={t.mode} value={t.mode}>{t.icon}  {t.label}</option>
                    ))}
                  </select>
                  {/* Custom chevron */}
                  <div style={{
                    position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                    pointerEvents:"none", color: active.color, fontSize:14, fontWeight:900,
                  }}>▼</div>
                </div>
                {/* Coloured indicator strip */}
                <div style={{
                  height:3, borderRadius:2, marginTop:6,
                  background:`linear-gradient(90deg,${active.color},${active.color}44)`,
                  transition:"background 0.3s",
                }}/>
              </div>
            );
          })()}


          {/* ── Skeleton while initial data loads ── */}
          {isConfigured && !dataReady && (
            <div style={{ display:"flex", flexDirection:"column", gap:12, marginTop:8 }}>
              <SkeletonCard rows={3} />
              <SkeletonCard rows={2} />
            </div>
          )}

          {/* ══ PRAYER FORM ══ */}
          {dataReady && bookMode === "prayer" && (
            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

              <div style={{ textAlign:"center", marginBottom:4 }}>
                <div style={{ fontFamily:"'Cinzel',serif", ...blueText, fontSize:16, fontWeight:700 }}>
                  Reserve a Prayer Slot
                </div>
                <div className="blue-line" style={{ marginTop:10 }}/>
              </div>

              <div>
                <label className="divine-label">👤 Person's Name</label>
                <input className="divine-input" placeholder="Enter full name"
                  value={form.name}
                  onChange={e => { setError(""); setForm({...form, name:e.target.value}); }}/>
              </div>

              <div>
                <label className="divine-label">📱 Mobile Number</label>
                <input className="divine-input" placeholder="Enter 10-digit mobile number"
                  type="tel" maxLength="10"
                  value={form.mobile}
                  onChange={e => { setError(""); setForm({...form, mobile:e.target.value.replace(/[^0-9]/g,"")}); }}/>
              </div>

              <div>
                <label className="divine-label">🌐 Find My Location</label>
                <LocationPicker color="#1d4ed8"
                  placeholder="Search your area, landmark, address…"
                  onPick={({ address, mapsLink }) => setForm(prev => ({
                    ...prev,
                    place: address || prev.place,
                    mapsLink: mapsLink || prev.mapsLink,
                  }))}/>
              </div>

              <div>
                <label className="divine-label">📍 Location</label>
                <input className="divine-input"
                  placeholder="Type location name  OR  paste Google Maps link"
                  value={form.place}
                  onChange={e => {
                    const v = e.target.value;
                    setError("");
                    const isLink = v.startsWith("http") || v.includes("maps.google") || v.includes("goo.gl") || v.includes("maps.app");
                    setForm({...form, place:v, mapsLink: isLink ? v : form.mapsLink});
                  }}/>
              </div>

              <div>
                <label className="divine-label" style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:11, color:"rgba(29,78,216,0.5)" }}>✦</span>
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:"1.2px", color:"rgba(29,78,216,0.55)" }}>
                    🚀 GOOGLE MAPS LINK (OPTIONAL)
                  </span>
                </label>
                <input className="divine-input"
                  placeholder="Paste Google Maps link"
                  value={form.mapsLink || ""}
                  onChange={e => { setError(""); setForm({...form, mapsLink: e.target.value}); }}/>
              </div>

              <div>
                <label className="divine-label">📅 Date (optional — or pick below)</label>
                <input type="date" className="divine-input" value={form.date} min={getTodayStr()}
                  style={{ fontSize:13, width:"100%", cursor:"pointer" }}
                  onChange={e => { setError(""); setForm({...form, date:e.target.value, time:""}); }}/>
                <div style={{ fontSize:10, color:"rgba(29,78,216,0.4)", marginTop:5, paddingLeft:2 }}>
                  ☝️ Tap a chip below for quick pick, or use the calendar for any future date
                </div>
              </div>

              {/* Date chips */}
              {(() => {
                const today2 = new Date(); today2.setHours(0,0,0,0);
                const chips2 = [];
                for (let i = 0; i < 14; i++) {
                  const d = new Date(today2); d.setDate(today2.getDate()+i);
                  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), dd = String(d.getDate()).padStart(2,"0");
                  const dateStr = `${y}-${m}-${dd}`;
                  const mTaken = isSlotTaken(dateStr,"Morning");
                  const eTaken = isSlotTaken(dateStr,"Evening");
                  const bothTaken = mTaken && eTaken;
                  const sel = form.date === dateStr;
                  chips2.push(
                    <button key={dateStr}
                      onClick={() => {
                        setError("");
                        setForm({...form, date:dateStr, time:""});
                        if (bothTaken) { triggerError("🚫 Both Morning & Evening slots are fully booked for this date. Please choose another date.");}
                      }}
                      disabled={false}
                      style={{ display:"flex", flexDirection:"column", alignItems:"center",
                        padding:"8px 6px", borderRadius:12, flexShrink:0,
                        border:`2px solid ${sel?"#1d4ed8":bothTaken?"#fca5a5":mTaken||eTaken?"#fcd34d":"rgba(59,130,246,0.18)"}`,
                        background:sel?"#1d4ed8":bothTaken?"#fee2e2":mTaken||eTaken?"#fef3c7":"#f0f9ff",
                        cursor:bothTaken?"not-allowed":"pointer", minWidth:48,
                        opacity:bothTaken?0.6:1, transition:"all 0.15s",
                        boxShadow:sel?"0 3px 12px rgba(29,78,216,0.35)":"none" }}>
                      <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase",
                        color:sel?"rgba(255,255,255,0.8)":"#6b7280", letterSpacing:"0.5px" }}>
                        {i===0?"Today":["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]}
                      </div>
                      <div style={{ fontSize:16, fontWeight:900, marginTop:2,
                        color:sel?"#fff":"#1e3a8a" }}>{dd}</div>
                      <div style={{ fontSize:8, marginTop:3, fontWeight:800,
                        color:sel?"rgba(255,255,255,0.9)":bothTaken?"#dc2626":mTaken||eTaken?"#d97706":"#16a34a" }}>
                        {bothTaken?"FULL":mTaken||eTaken?"1 LEFT":"FREE"}
                      </div>
                      <div style={{ display:"flex", gap:2, marginTop:4 }}>
                        <div style={{ width:5, height:5, borderRadius:"50%", background:mTaken?"#ef4444":"#22c55e" }}/>
                        <div style={{ width:5, height:5, borderRadius:"50%", background:eTaken?"#ef4444":"#22c55e" }}/>
                      </div>
                    </button>
                  );
                }
                return (
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <button onClick={() => { const el=document.getElementById("dateChipScroll"); if(el) el.scrollBy({left:-160,behavior:"smooth"}); }}
                      style={{ flexShrink:0, width:32, height:32, borderRadius:"50%", border:"none",
                        background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"#fff",
                        fontSize:18, cursor:"pointer", fontWeight:900, lineHeight:1 }}>‹</button>
                    <div id="dateChipScroll" style={{ display:"flex", gap:6, overflowX:"auto", flex:1,
                      paddingBottom:6, scrollbarWidth:"none" }}>
                      {chips2}
                    </div>
                    <button onClick={() => { const el=document.getElementById("dateChipScroll"); if(el) el.scrollBy({left:160,behavior:"smooth"}); }}
                      style={{ flexShrink:0, width:32, height:32, borderRadius:"50%", border:"none",
                        background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"#fff",
                        fontSize:18, cursor:"pointer", fontWeight:900, lineHeight:1 }}>›</button>
                  </div>
                );
              })()}

              {/* Slot selector */}
              {form.date ? (() => {
                const pt = getPrayerTimes(form.date);
                return (
                  <div className="fade-in">
                    <label className="divine-label">🌅 Prayer Slot</label>
                    <div style={{ display:"flex", gap:12 }}>
                      {["Morning","Evening"].map(t => {
                        const c    = SLOT_STYLE[t];
                        const taken = isSlotTaken(form.date, t);
                        const sel   = form.time === t;
                        const booker = taken ? getSlotBooking(form.date, t) : null;
                        return (
                          <button key={t} className="slot-btn"
                            onClick={() => handleSlotSelect(t)}
                            disabled={taken}
                            style={{
                              borderColor: taken?"#fca5a5":sel?c.color:"rgba(59,130,246,0.25)",
                              background:  taken?"#fee2e2":sel?c.bg:"rgba(239,246,255,0.5)",
                              color: taken?"#dc2626":sel?c.color:"#374151",
                              opacity: taken?0.7:1 }}>
                            {sel && !taken && (
                              <div style={{ position:"absolute", top:8, right:8, width:20, height:20,
                                borderRadius:"50%", background:c.color, display:"flex",
                                alignItems:"center", justifyContent:"center", fontSize:11,
                                fontWeight:900, color:"#fff" }}>✓</div>
                            )}
                            <div style={{ fontSize:28, marginBottom:8 }}>{c.icon}</div>
                            <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:13 }}>
                              {t} Prayer
                            </div>
                            {pt && !taken && (
                              <div style={{ fontSize:12, marginTop:6, fontWeight:700, color:c.color }}>
                                {pt[t]}
                              </div>
                            )}
                            {taken && booker && (
                              <div style={{ fontSize:10, marginTop:6, color:"#dc2626", fontWeight:600 }}>
                                🚫 Booked by {booker.name}
                              </div>
                            )}
                            <div style={{ fontSize:11, marginTop:8, fontWeight:600,
                              color:taken?"#dc2626":sel?"#16a34a":"rgba(30,64,175,0.4)" }}>
                              {taken?"🚫 Already Booked":sel?"✓ Selected":"Tap to select"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })() : (
                <div style={{ textAlign:"center", padding:"12px 0", ...mutedBlue, fontSize:13 }}>
                  ☝️ Select a date to continue
                </div>
              )}

              {/* Prayer time info box */}
              {form.date && prayerTimes && form.time && (
                <div className="fade-in" style={{ background:"rgba(239,246,255,0.9)",
                  border:"1px solid rgba(59,130,246,0.25)", borderRadius:14, padding:"14px 16px" }}>
                  <div style={{ fontFamily:"'Cinzel',serif", ...blueText, fontSize:13,
                    fontWeight:700, marginBottom:10 }}>🕐 Prayer Times for {formatDateWithDay(form.date)}</div>
                  <div style={{ display:"flex", gap:12 }}>
                    {["Morning","Evening"].map(t => {
                      const c = SLOT_STYLE[t];
                      return (
                        <div key={t} style={{ flex:1, borderRadius:10, padding:"12px",
                          background:c.bg, border:`1px solid ${c.border}`, textAlign:"center" }}>
                          <div style={{ fontSize:20, marginBottom:4 }}>{c.icon}</div>
                          <div style={{ fontSize:11, color:c.color, fontWeight:700 }}>{t}</div>
                          <div style={{ fontSize:14, fontWeight:900, color:c.color, marginTop:4 }}>
                            {prayerTimes[t]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && (
                <div className={`fade-in ${shake?"shake":""}`}
                  style={{ padding:"14px 18px", borderRadius:12, fontSize:13,
                    lineHeight:1.7, whiteSpace:"pre-line",
                    background:"#fee2e2", border:"1.5px solid #fca5a5", color:"#b91c1c" }}>
                  {error}
                </div>
              )}

              <div style={{ marginTop:8 }}>
                <button className="submit-btn" onClick={handleBook} disabled={submitting}>
                  {submitting ? "⏳ Saving..." : "🙏  Confirm Booking"}
                </button>
              </div>

            </div>
          )}

          {/* ══ SATSANG FORM ══ */}
          {dataReady && feat.satsangBooking && bookMode === "satsang" && (
            <div style={{ display:"flex", flexDirection:"column", gap:13 }}>

              <div style={{ textAlign:"center", marginBottom:4 }}>
                <div style={{ fontFamily:"'Cinzel',serif", color:"#78350f", fontSize:16, fontWeight:700 }}>
                  Book a Satsang Gathering
                </div>
                <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(217,119,6,0.5),transparent)", marginTop:10 }}/>
              </div>

              {satsangError && (
                <div className={satsangShake?"shake":""} style={{ padding:"11px 14px", borderRadius:10,
                  fontSize:13, fontWeight:600, background:"#fef3c7", color:"#92400e", whiteSpace:"pre-line" }}>
                  {satsangError}
                </div>
              )}



              <div>
                <label className="divine-label" style={{ color:"rgba(120,53,15,0.7)" }}>👤 Host Name</label>
                <input className="divine-input" placeholder="Name of the person hosting"
                  value={satsangForm.name}
                  style={{ borderColor:"rgba(217,119,6,0.3)" }}
                  onChange={e=>{setSatsangError("");setSatsangForm({...satsangForm,name:e.target.value})}}/>
              </div>
              <div>
                <label className="divine-label" style={{ color:"rgba(120,53,15,0.7)" }}>📱 Mobile Number</label>
                <input className="divine-input" placeholder="10-digit mobile" type="tel" maxLength={10}
                  value={satsangForm.mobile}
                  style={{ borderColor:"rgba(217,119,6,0.3)" }}
                  onChange={e=>{setSatsangError("");setSatsangForm({...satsangForm,mobile:e.target.value.replace(/[^0-9]/g,"")})}}/>
              </div>
              <div>
                <label className="divine-label" style={{ color:"rgba(120,53,15,0.7)" }}>📅 Date</label>
                <input type="date" className="divine-input" value={satsangForm.date} min={getTodayStr()}
                  style={{ fontSize:13, width:"100%", cursor:"pointer", borderColor:"rgba(217,119,6,0.3)" }}
                  onChange={e=>{setSatsangError("");setSatsangForm({...satsangForm,date:e.target.value})}}/>
                  <div style={{ fontSize:10, color:"rgba(120,53,15,0.45)", marginTop:5, paddingLeft:2 }}>
                    ☝️ Tap a chip below for quick pick, or use the calendar above
                  </div>
                  <div style={{ marginTop:6 }}>
                    <EventDateChips
                      bookings={satsangBookings}
                      value={satsangForm.date}
                      onChange={d => { setSatsangError(""); setSatsangForm({...satsangForm, date:d}); }}
                      color="#92400e"
                      idPrefix="satChipScroll"
                      days={14}
                    />
                  </div>
              </div>
              <div>
                <label className="divine-label" style={{ color:"rgba(120,53,15,0.7)" }}>⏰ Time</label>
                <input className="divine-input" placeholder="e.g. 4:30 PM onwards"
                  value={satsangForm.time}
                  style={{ borderColor:"rgba(217,119,6,0.3)" }}
                  onChange={e=>setSatsangForm({...satsangForm,time:e.target.value})}/>
              </div>
              <div>
                <label className="divine-label" style={{ color:"rgba(120,53,15,0.7)" }}>🌐 Find Venue Location</label>
                <LocationPicker color="#92400e"
                  placeholder="Search venue — area, landmark, address…"
                  onPick={({ address, mapsLink }) => setSatsangForm(prev => ({
                    ...prev,
                    venue: address || prev.venue,
                    mapsLink: mapsLink || prev.mapsLink,
                  }))}/>
              </div>
              <div>
                <label className="divine-label" style={{ color:"rgba(120,53,15,0.7)" }}>📍 Venue / Address</label>
                <input className="divine-input" placeholder="Full address of the Satsang venue"
                  value={satsangForm.venue}
                  style={{ borderColor:"rgba(217,119,6,0.3)" }}
                  onChange={e=>setSatsangForm({...satsangForm,venue:e.target.value})}/>
              </div>
              <div>
                <label className="divine-label" style={{ color:"rgba(120,53,15,0.7)" }}>📌 Google Maps Link (optional)</label>
                <input className="divine-input" placeholder="Paste Google Maps link"
                  value={satsangForm.mapsLink}
                  style={{ borderColor:"rgba(217,119,6,0.3)" }}
                  onChange={e=>setSatsangForm({...satsangForm,mapsLink:e.target.value})}/>
              </div>
              <div>
                <label className="divine-label" style={{ color:"rgba(120,53,15,0.7)" }}>🪔 Occasion (optional)</label>
                <input className="divine-input" placeholder="e.g. Birthday, Anniversary, Gratitude, Monthly Satsang"
                  value={satsangForm.occasion}
                  style={{ borderColor:"rgba(217,119,6,0.3)" }}
                  onChange={e=>setSatsangForm({...satsangForm,occasion:e.target.value})}/>
                <div style={{ fontSize:10, color:"rgba(120,53,15,0.4)", marginTop:4, paddingLeft:2 }}>
                  The reason or purpose of this Satsang gathering
                </div>
              </div>
              <div>
                <label className="divine-label" style={{ color:"rgba(120,53,15,0.7)" }}>🙏 Hosted By (optional)</label>
                <input className="divine-input" placeholder="e.g. Bannerghatta SUK"
                  value={satsangForm.hostedBy}
                  style={{ borderColor:"rgba(217,119,6,0.3)" }}
                  onChange={e=>setSatsangForm({...satsangForm,hostedBy:e.target.value})}/>
              </div>
              <div style={{ marginTop:8 }}>
                <button onClick={handleSatsangSubmit} disabled={satsangSubmitting}
                  style={{ width:"100%", padding:"15px", border:"none", borderRadius:13,
                    background:"linear-gradient(135deg,#78350f 0%,#d97706 50%,#fbbf24 100%)",
                    color:"#fff", fontWeight:900, fontSize:16, cursor:"pointer",
                    fontFamily:"'Cinzel',serif", letterSpacing:"0.5px",
                    boxShadow:"0 5px 22px rgba(120,53,15,0.35)",
                    opacity:satsangSubmitting?0.7:1, transition:"all 0.3s" }}>
                  {satsangSubmitting ? "⏳ Booking..." : "🪔  Book This Satsang"}
                </button>
              </div>

            </div>
          )}

          {/* ══ BHADRA PARIKRAMA SATSANG / MATRI-SAMMELAN / SAVAN PARIKRAMA — Coming Soon ══ */}
          {dataReady && ((bookMode === "bhadra" && feat.bhadraBooking) || (bookMode === "matri" && feat.matriBooking) || (bookMode === "savan" && feat.savanBooking)) && (() => {
            const SPECIAL_INFO = {
              bhadra: { icon:"🌸", label:"Bhadra Parikrama Satsang", color:"#7c3aed", bg:"rgba(124,58,237,0.06)", border:"rgba(124,58,237,0.2)", btnGrad:"linear-gradient(135deg,#5b21b6,#7c3aed,#a78bfa)", shadow:"rgba(124,58,237,0.35)", api:bhadraApi, bookings:bhadraBookings, fetch:fetchBhadraBookings },
              matri:  { icon:"🌺", label:"Matri-Sammelan",           color:"#db2777", bg:"rgba(219,39,119,0.06)", border:"rgba(219,39,119,0.2)", btnGrad:"linear-gradient(135deg,#9d174d,#db2777,#f472b6)", shadow:"rgba(219,39,119,0.35)", api:matriApi,  bookings:matriBookings,  fetch:fetchMatriBookings },
              savan:  { icon:"🌿", label:"Savan Parikrama",          color:"#16a34a", bg:"rgba(22,163,74,0.06)",  border:"rgba(22,163,74,0.2)",  btnGrad:"linear-gradient(135deg,#14532d,#16a34a,#4ade80)",  shadow:"rgba(22,163,74,0.35)",  api:savanApi,  bookings:savanBookings,  fetch:fetchSavanBookings },
            };
            const t = SPECIAL_INFO[bookMode];
            // Each event type now lives in its own Google Sheet —
            // existing bookings come straight from that sheet, no
            // occasion filtering needed.
            const existingForType = t.bookings || [];
            const isDupSpecial = (date, time) => existingForType.some(b => b.date === date && b.time.trim() === time.trim());

            return (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                <div style={{ textAlign:"center", marginBottom:4 }}>
                  <div style={{ fontFamily:"'Cinzel',serif", color:t.color, fontSize:16, fontWeight:700 }}>
                    {t.icon} {t.label}
                  </div>
                  <div style={{ height:1, background:`linear-gradient(90deg,transparent,${t.color}66,transparent)`, marginTop:10 }}/>
                </div>

                {existingForType.length > 0 && (
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:t.color, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:8 }}>
                      {t.icon} {existingForType.length} slot{existingForType.length!==1?"s":""} already booked
                    </div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                      {[...existingForType].sort((a,b)=>a.date.localeCompare(b.date)).map(b => {
                        const dd = (b.date||"").slice(8,10);
                        const dayIdx = b.date ? new Date(b.date+"T00:00:00").getDay() : -1;
                        const dayN = dayIdx>=0?["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dayIdx]:"";
                        return (
                          <div key={b.id} style={{ display:"flex", flexDirection:"column", alignItems:"center",
                            padding:"7px 10px", borderRadius:12, minWidth:52,
                            background:t.bg, border:`2px solid ${t.border}` }}>
                            <div style={{ fontSize:9, fontWeight:700, color:`${t.color}99`, textTransform:"uppercase", letterSpacing:"0.4px" }}>{dayN}</div>
                            <div style={{ fontSize:15, fontWeight:900, color:t.color, lineHeight:1.2 }}>{dd}</div>
                            <div style={{ fontSize:8, fontWeight:800, color:t.color, marginTop:2, textAlign:"center", maxWidth:60, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{cleanTime(b.time)||"—"}</div>
                            <div style={{ fontSize:8, color:`${t.color}88`, marginTop:1, maxWidth:60, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{(b.name||"").split(" ")[0]}</div>
                            <div style={{ width:6, height:6, borderRadius:"50%", background:t.color, marginTop:4 }}/>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ height:1, background:`${t.color}22`, margin:"8px 0" }}/>
                  </div>
                )}

                {satsangError && (
                  <div className={satsangShake?"shake":""} style={{ padding:"11px 14px", borderRadius:10,
                    fontSize:13, fontWeight:600, background:"#fef3c7", color:"#92400e", whiteSpace:"pre-line" }}>
                    {satsangError}
                  </div>
                )}

                <div>
                  <label className="divine-label" style={{ color:`${t.color}bb` }}>👤 Host Name</label>
                  <input className="divine-input" placeholder="Name of the person hosting"
                    value={satsangForm.name} style={{ borderColor:t.border }}
                    onChange={e=>{setSatsangError("");setSatsangForm({...satsangForm,name:e.target.value})}}/>
                </div>

                <div>
                  <label className="divine-label" style={{ color:`${t.color}bb` }}>📱 Mobile Number</label>
                  <input className="divine-input" placeholder="10-digit mobile" type="tel" maxLength={10}
                    value={satsangForm.mobile} style={{ borderColor:t.border }}
                    onChange={e=>{setSatsangError("");setSatsangForm({...satsangForm,mobile:e.target.value.replace(/[^0-9]/g,"")})}}/>
                </div>

                <div>
                  <label className="divine-label" style={{ color:`${t.color}bb` }}>📅 Date</label>
                  <input type="date" className="divine-input" value={satsangForm.date} min={getTodayStr()}
                    style={{ fontSize:13, width:"100%", cursor:"pointer", borderColor:t.border }}
                    onChange={e=>{setSatsangError("");setSatsangForm({...satsangForm,date:e.target.value})}}/>
                  <div style={{ fontSize:10, color:`${t.color}77`, marginTop:5, paddingLeft:2 }}>
                    ☝️ Tap a chip below for quick pick, or use the calendar above
                  </div>
                  <div style={{ marginTop:6 }}>
                    <EventDateChips
                      bookings={t.bookings}
                      value={satsangForm.date}
                      onChange={d => { setSatsangError(""); setSatsangForm({...satsangForm, date:d}); }}
                      color={t.color}
                      idPrefix={`${bookMode}ChipScroll`}
                      days={14}
                    />
                  </div>
                </div>

                <div>
                  <label className="divine-label" style={{ color:`${t.color}bb` }}>⏰ Time</label>
                  <input className="divine-input" placeholder="e.g. 4:30 PM onwards"
                    value={satsangForm.time} style={{ borderColor:t.border }}
                    onChange={e=>{setSatsangError("");setSatsangForm({...satsangForm,time:e.target.value})}}/>
                  {satsangForm.date && satsangForm.time && isDupSpecial(satsangForm.date, satsangForm.time) && (
                    <div style={{ marginTop:5, padding:"8px 12px", borderRadius:8, fontSize:12,
                      background:"#fee2e2", border:"1px solid #fca5a5", color:"#b91c1c", fontWeight:600 }}>
                      ⚠️ This date & time is already booked for {t.label}. Please choose a different slot.
                    </div>
                  )}
                </div>

                <div>
                  <label className="divine-label" style={{ color:`${t.color}bb` }}>🌐 Find Venue Location</label>
                  <LocationPicker color={t.color}
                    placeholder="Search venue — area, landmark, address…"
                    onPick={({ address, mapsLink }) => setSatsangForm(prev => ({
                      ...prev,
                      venue: address || prev.venue,
                      mapsLink: mapsLink || prev.mapsLink,
                    }))}/>
                </div>

                <div>
                  <label className="divine-label" style={{ color:`${t.color}bb` }}>📍 Venue / Address</label>
                  <input className="divine-input" placeholder="Full address of the venue"
                    value={satsangForm.venue} style={{ borderColor:t.border }}
                    onChange={e=>setSatsangForm({...satsangForm,venue:e.target.value})}/>
                </div>

                <div>
                  <label className="divine-label" style={{ color:`${t.color}bb` }}>📌 Google Maps Link (optional)</label>
                  <input className="divine-input" placeholder="Paste Google Maps link"
                    value={satsangForm.mapsLink} style={{ borderColor:t.border }}
                    onChange={e=>setSatsangForm({...satsangForm,mapsLink:e.target.value})}/>
                </div>

                <div>
                  <label className="divine-label" style={{ color:`${t.color}bb` }}>🙏 Hosted By (optional)</label>
                  <input className="divine-input" placeholder="e.g. Bannerghatta SUK"
                    value={satsangForm.hostedBy} style={{ borderColor:t.border }}
                    onChange={e=>setSatsangForm({...satsangForm,hostedBy:e.target.value})}/>
                </div>

                <div style={{ marginTop:4 }}>
                  <button
                    disabled={satsangSubmitting || (satsangForm.date && satsangForm.time && isDupSpecial(satsangForm.date, satsangForm.time))}
                    onClick={async () => {
                      const { name, mobile, venue, date, time } = satsangForm;
                      if (!name.trim())  { triggerSatsangError("⚠️ Please enter the host name."); return; }
                      if (!/^[0-9]{10}$/.test(mobile.trim())) { triggerSatsangError("⚠️ Valid 10-digit mobile required."); return; }
                      if (!date)         { triggerSatsangError("⚠️ Please select a date."); return; }
                      if (date < getTodayStr()) { triggerSatsangError("⚠️ Please select today or a future date."); return; }
                      if (!time.trim())  { triggerSatsangError("⚠️ Please enter the time."); return; }
                      if (!venue.trim()) { triggerSatsangError("⚠️ Please enter the venue."); return; }
                      if (isDupSpecial(date, time)) { triggerSatsangError("⚠️ This date & time is already booked for " + t.label + ". Please choose a different slot."); return; }
                      if (!isConfigured) { triggerSatsangError("⚠️ Please configure the Script URL."); return; }
                      setSatsangSubmitting(true);
                      try {
                        const result = await t.api.post({
                          action:"add", name:name.trim(), mobile:mobile.trim(),
                          venue:venue.trim(), date, time:time.trim(),
                          hostedBy:satsangForm.hostedBy.trim() || (state.ACTIVE_SUK ? sukLabel(state.ACTIVE_SUK) : "SUK"),
                          mapsLink:satsangForm.mapsLink.trim(),
                          day:getDayName(date),
                        });
                        if (result.success) {
                          setSatsangConfirm({ ...satsangForm, id:result.id, day:getDayName(date), occasion:t.label });
                          setSatsangForm({ name:"", mobile:"", venue:"", date:"", time:"", hostedBy:"", mapsLink:"", occasion:"" });
                          t.fetch();
                        } else { triggerSatsangError(result.message || "⚠️ Booking failed. Please try again."); }
                      } catch(e) { triggerSatsangError("⚠️ Network error. Please try again."); }
                      setSatsangSubmitting(false);
                    }}
                    style={{
                      width:"100%", padding:"15px", border:"none", borderRadius:13,
                      background:(satsangForm.date&&satsangForm.time&&isDupSpecial(satsangForm.date,satsangForm.time))?"#e5e7eb":t.btnGrad,
                      color:(satsangForm.date&&satsangForm.time&&isDupSpecial(satsangForm.date,satsangForm.time))?"#9ca3af":"#fff",
                      fontWeight:900, fontSize:16,
                      cursor:(satsangForm.date&&satsangForm.time&&isDupSpecial(satsangForm.date,satsangForm.time))?"not-allowed":"pointer",
                      fontFamily:"'Cinzel',serif", letterSpacing:"0.5px",
                      boxShadow:`0 5px 22px ${t.shadow}`, transition:"all 0.3s",
                      opacity:satsangSubmitting?0.7:1,
                    }}>
                    {satsangSubmitting ? "⏳ Booking..." : `${t.icon}  Register for ${t.label}`}
                  </button>
                </div>

              </div>
            );
          })()}


          {/* ── Inline Cancel Section ── */}
          {feat.cancelBooking && (<div style={{ marginTop:20 }}>
            <button
              onClick={() => { setShowCancel(!showCancel); setCancelMsg(""); setCancelResults(null); setCancelMobile(""); }}
              style={{ width:"100%", padding:"11px", border:"1px solid rgba(220,38,38,0.3)",
                borderRadius:11, background: showCancel ? "#fee2e2" : "rgba(254,242,242,0.6)",
                color:"#b91c1c", fontWeight:700, fontSize:13, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all 0.2s" }}>
              <span>{showCancel ? "▲" : "▼"}</span>
              Need to cancel a booking?
            </button>

            {showCancel && (
              <div className="fade-in" style={{ marginTop:12, padding:"18px", borderRadius:14,
                background:"rgba(254,242,242,0.8)", border:"1px solid rgba(220,38,38,0.2)" }}>
                <div style={{ fontFamily:"'Cinzel',serif", color:"#991b1b", fontSize:14,
                  fontWeight:700, marginBottom:14, textAlign:"center" }}>
                  Cancel Your Booking
                </div>

                <label className="divine-label" style={{ color:"rgba(153,27,27,0.7)" }}>📱 Mobile Number Used During Booking</label>
                <div style={{ display:"flex", gap:8 }}>
                  <input className="divine-input"
                    placeholder="Enter 10-digit number"
                    type="tel" maxLength="10"
                    value={cancelMobile}
                    style={{ borderColor:"rgba(220,38,38,0.3)", background:"#fff" }}
                    onChange={e => { setCancelMsg(""); setCancelResults(null); setCancelMobile(e.target.value.replace(/[^0-9]/g,"")); }} />
                  <button onClick={handleCancelLookup}
                    style={{ padding:"12px 16px", border:"none", borderRadius:10,
                      background:"#b91c1c", color:"#fff", fontWeight:700, fontSize:13,
                      cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
                    🔍 Find
                  </button>
                </div>

                {cancelMsg && (
                  <div style={{ marginTop:10, padding:"10px 14px", borderRadius:9, fontSize:12,
                    background: cancelMsg.startsWith("✅") ? "#d1fae5" : "#fee2e2",
                    border:`1px solid ${cancelMsg.startsWith("✅") ? "#6ee7b7":"#fca5a5"}`,
                    color: cancelMsg.startsWith("✅") ? "#065f46":"#b91c1c" }}>
                    {cancelMsg}
                  </div>
                )}

                {cancelResults && cancelResults.length > 0 && (() => {
                  const _todayC = getTodayStr();
                  const futureCancelResults = cancelResults
                    .filter(b => (b.date||"") >= _todayC)
                    .sort((a,b) => (a.date||"").localeCompare(b.date||"")); // asc
                  const pastCancelResults = cancelResults
                    .filter(b => (b.date||"") < _todayC)
                    .sort((a,b) => (b.date||"").localeCompare(a.date||"")); // newest first
                  return (
                  <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:8 }}>
                    {futureCancelResults.map(b => {
                      const isPrayer = b._type === "prayer" || !b._type;
                      const TC2 = {
                        satsang:{ badge:"🪔 Satsang",  bg:"#fffbeb",               border:"rgba(217,119,6,0.25)",  name:"#78350f", time:"#d97706", grad:"linear-gradient(135deg,#92400e,#d97706)",  label:"Cancel Satsang"  },
                        bhadra: { badge:"🌸 Bhadra",   bg:"rgba(245,243,255,0.9)", border:"rgba(109,40,217,0.25)", name:"#4c1d95", time:"#7c3aed", grad:"linear-gradient(135deg,#5b21b6,#7c3aed)",  label:"Cancel Bhadra"   },
                        matri:  { badge:"🌺 Matri",    bg:"rgba(253,242,248,0.9)", border:"rgba(190,24,93,0.25)",  name:"#831843", time:"#db2777", grad:"linear-gradient(135deg,#9d174d,#db2777)",  label:"Cancel Matri"    },
                        savan:  { badge:"🌿 Savan",    bg:"rgba(240,253,244,0.9)", border:"rgba(21,128,61,0.25)",  name:"#14532d", time:"#16a34a", grad:"linear-gradient(135deg,#14532d,#16a34a)",  label:"Cancel Savan"    },
                      };
                      if (!isPrayer) {
                        const tc2 = TC2[b._type] || TC2.satsang;
                        return (
                          <div key={b.id} style={{ background:tc2.bg, borderRadius:12,
                            padding:"14px", border:`1px solid ${tc2.border}` }}>
                            <div style={{ marginBottom:2 }}>
                              <span style={{ fontSize:10, fontWeight:800, color:tc2.time,
                                background:`${tc2.border}`, padding:"2px 7px",
                                borderRadius:10, textTransform:"uppercase", letterSpacing:"0.5px" }}>{tc2.badge}</span>
                            </div>
                            <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800, color:tc2.name, fontSize:13 }}>{b.name}</div>
                            <div style={{ fontSize:12, color:tc2.time, fontWeight:700, marginTop:2 }}>
                              📅 {formatDateWithDay(b.date)} · ⏰ {cleanTime(b.time)}
                            </div>
                            {b.venue && <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>📍 {b.venue}</div>}
                            <button disabled={cancelling === b.id} onClick={() => handleCancelSpecial(b.id, b._type)}
                              style={{ marginTop:10, width:"100%", padding:"9px", border:"none", borderRadius:9,
                                background:tc2.grad, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer",
                                opacity:cancelling === b.id ? 0.6 : 1 }}>
                              {cancelling === b.id ? "⏳ Cancelling..." : `🗑️ ${tc2.label}`}
                            </button>
                          </div>
                        );
                      }
                      const c = SLOT_STYLE[b.time] || SLOT_STYLE["Morning"];
                      return (
                        <div key={b.id} style={{ background:"#fff", borderRadius:12,
                          padding:"14px", border:"1px solid rgba(220,38,38,0.2)" }}>
                          <div style={{ marginBottom:2 }}>
                            <span style={{ fontSize:10, fontWeight:800, color:"#1d4ed8",
                              background:"rgba(29,78,216,0.08)", padding:"2px 7px",
                              borderRadius:10, textTransform:"uppercase", letterSpacing:"0.5px" }}>🙏 Prayer</span>
                          </div>
                          <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800, color:"#1e3a8a", fontSize:13 }}>{b.name}</div>
                          <div style={{ fontSize:12, color:c.color, fontWeight:700, marginTop:2 }}>
                            {c.icon} {b.time} Prayer · {formatDateWithDay(b.date)}
                          </div>
                          {b.prayerTime && <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>🕐 {cleanTime(b.prayerTime)}</div>}
                          <div style={{ marginTop:8, fontSize:11, color:"#94a3b8", fontStyle:"italic", textAlign:"center" }}>
                            ✅ This prayer has already passed
                          </div>
                        </div>
                      );
                    })}
                    {pastCancelResults.length > 0 && (
                      <div style={{ marginTop:4 }}>
                        <button onClick={() => setShowCancelPast(p => !p)}
                          style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center",
                            gap:8, padding:"10px 14px", borderRadius:10,
                            border:"1px solid rgba(220,38,38,0.25)",
                            background:"rgba(254,242,242,0.5)",
                            color:"#b91c1c", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                          <span>{showCancelPast ? "▲" : "▼"}</span>
                          <span>{showCancelPast ? "Hide Past Bookings" : `Show Past Bookings (${pastCancelResults.length})`}</span>
                        </button>
                        {showCancelPast && (
                          <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:8, opacity:0.75 }}>
                            {pastCancelResults.map(b => {
                      const isPrayer2 = b._type === "prayer" || !b._type;
                      const TC3 = {
                        satsang:{ badge:"🪔 Satsang", bg:"#fffbeb",               border:"rgba(217,119,6,0.25)",  name:"#78350f", time:"#d97706" },
                        bhadra: { badge:"🌸 Bhadra",  bg:"rgba(245,243,255,0.9)", border:"rgba(109,40,217,0.25)", name:"#4c1d95", time:"#7c3aed" },
                        matri:  { badge:"🌺 Matri",   bg:"rgba(253,242,248,0.9)", border:"rgba(190,24,93,0.25)",  name:"#831843", time:"#db2777" },
                        savan:  { badge:"🌿 Savan",   bg:"rgba(240,253,244,0.9)", border:"rgba(21,128,61,0.25)",  name:"#14532d", time:"#16a34a" },
                      };
                      if (!isPrayer2) {
                        const tc3 = TC3[b._type] || TC3.satsang;
                        return (
                          <div key={b.id} style={{ background:tc3.bg, borderRadius:12,
                            padding:"14px", border:`1px solid ${tc3.border}`, opacity:0.75 }}>
                            <div style={{ marginBottom:2 }}>
                              <span style={{ fontSize:10, fontWeight:800, color:tc3.time,
                                background:tc3.border, padding:"2px 7px",
                                borderRadius:10, textTransform:"uppercase", letterSpacing:"0.5px" }}>{tc3.badge}</span>
                            </div>
                            <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800, color:tc3.name, fontSize:13 }}>{b.name}</div>
                            <div style={{ fontSize:12, color:tc3.time, fontWeight:700, marginTop:2 }}>
                              📅 {formatDateWithDay(b.date)} · ⏰ {cleanTime(b.time)}
                            </div>
                            {b.venue && <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>📍 {b.venue}</div>}
                            <div style={{ marginTop:8, fontSize:11, color:"#6b7280", fontStyle:"italic" }}>
                              ✅ This event has already passed
                            </div>
                          </div>
                        );
                      }
                      const c = SLOT_STYLE[b.time] || SLOT_STYLE["Morning"];
                      return (
                        <div key={b.id} style={{ background:"#f8fafc", borderRadius:12,
                          padding:"14px", border:"1px solid rgba(148,163,184,0.3)", opacity:0.75 }}>
                          <div style={{ marginBottom:2 }}>
                            <span style={{ fontSize:10, fontWeight:800, color:"#64748b",
                              background:"rgba(100,116,139,0.1)", padding:"2px 7px",
                              borderRadius:10, textTransform:"uppercase", letterSpacing:"0.5px" }}>🙏 Prayer (Past)</span>
                          </div>
                          <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800, color:"#475569", fontSize:13 }}>{b.name}</div>
                          <div style={{ fontSize:12, color:"#64748b", fontWeight:700, marginTop:2 }}>
                            {c.icon} {b.time} Prayer · {formatDateWithDay(b.date)}
                          </div>
                          {b.prayerTime && <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>🕐 {cleanTime(b.prayerTime)}</div>}
                          <div style={{ marginTop:8, fontSize:11, color:"#94a3b8", fontStyle:"italic" }}>
                            ✅ This prayer has already passed
                          </div>
                        </div>
                      );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })()}

                {cancelResults && cancelResults.length === 0 && (
                  <div style={{ textAlign:"center", padding:"16px 0", color:"rgba(153,27,27,0.5)", fontSize:13 }}>
                    No bookings found for this number.
                  </div>
                )}
              </div>
            )}
          </div>)}
        </div>

      )}

      {activeTab === "manage" && manageTab === "times" && <PrayerTimesTab />}

      {/* ════════ RETRIEVE & SHARE TAB ════════ */}
      {activeTab === "manage" && manageTab === "share" && (
        <div className="card">
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ fontFamily:"'Cinzel',serif", ...blueText, fontSize:17, fontWeight:700 }}>
              Retrieve Booking Details
            </div>
            <div style={{ ...mutedBlue, fontSize:12, marginTop:4 }}>
              Enter your mobile number to find and share your booking
            </div>
            <div className="blue-line" style={{ marginTop:10 }}/>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label className="divine-label">📱 Your Mobile Number</label>
              <div style={{ display:"flex", gap:8 }}>
                <input className="divine-input"
                  placeholder="Enter 10-digit mobile number"
                  type="tel" maxLength="10"
                  value={shareMobile}
                  onChange={e => { setShareMsg(""); setShareResults(null); setShareMobile(e.target.value.replace(/[^0-9]/g,"")); }}
                  style={{ flex:1 }} />
                <button onClick={handleShareLookup}
                  style={{ padding:"12px 16px", border:"none", borderRadius:10,
                    background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",
                    color:"#fff", fontWeight:700, fontSize:13,
                    cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
                    boxShadow:"0 3px 10px rgba(29,78,216,0.3)" }}>
                  🔍 Find
                </button>
              </div>
            </div>
            {/* Booking type filter */}
            <div>
              <label className="divine-label">📋 Booking Type</label>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                {[
                  { id:"prayer",  label:"Prayer",  icon:"🙏", color:"#1d4ed8" },
                  feat.satsangBooking && { id:"satsang", label:"Satsang", icon:"🪔", color:"#92400e" },
                  feat.bhadraBooking  && { id:"bhadra",  label:"Bhadra",  icon:"🌸", color:"#6d28d9" },
                  feat.matriBooking   && { id:"matri",   label:"Matri",   icon:"🌺", color:"#be185d" },
                  feat.savanBooking   && { id:"savan",   label:"Savan",   icon:"🌿", color:"#15803d" },
                  { id:"all",     label:"All",     icon:"📋", color:"#1e3a8a" },
                ].filter(Boolean).map(t => {
                  const active = retrieveTypeFilter === t.id;
                  return (
                    <button key={t.id} type="button"
                      onClick={() => { setRetrieveTypeFilter(t.id); setShareResults(null); setShareMsg(""); }}
                      style={{ padding:"8px 4px", borderRadius:10, border:"none", cursor:"pointer",
                        fontFamily:"'Cinzel',serif", fontSize:10, fontWeight:800,
                        transition:"all 0.15s",
                        background: active ? `linear-gradient(135deg,${t.color}dd,${t.color})` : "rgba(239,246,255,0.7)",
                        color: active ? "#fff" : "rgba(29,78,216,0.5)",
                        boxShadow: active ? `0 2px 8px ${t.color}44` : "none",
                        outline: active ? "none" : "1px solid rgba(59,130,246,0.15)" }}>
                      <div style={{ fontSize:14 }}>{t.icon}</div>
                      <div>{t.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Message */}
          {shareMsg && (
            <div style={{ marginTop:12, padding:"10px 14px", borderRadius:9, fontSize:13,
              background: shareMsg.startsWith("⚠️") ? "#fef3c7" : "#fee2e2",
              border:`1px solid ${shareMsg.startsWith("⚠️") ? "#fcd34d":"#fca5a5"}`,
              color: shareMsg.startsWith("⚠️") ? "#92400e":"#b91c1c" }}>
              {shareMsg}
            </div>
          )}

          {/* Results — prayer + satsang combined */}
          {shareResults && shareResults.length > 0 && (() => {
            const _todayStr = getTodayStr();
            const futureResults = shareResults.filter(b => (b.date||"") >= _todayStr);
            const pastResults   = shareResults.filter(b => (b.date||"") <  _todayStr)
              .sort((a,b) => (b.date||"").localeCompare(a.date||"")); // newest first for past
            const displayResults = futureResults; // ascending already from handleShareLookup
            return (
            <div style={{ marginTop:18 }}>
              <div style={{ fontSize:12, color:"rgba(29,78,216,0.6)", fontWeight:700,
                textTransform:"uppercase", letterSpacing:"1px", marginBottom:12 }}>
                {shareResults.length} Booking{shareResults.length > 1 ? "s" : ""} Found
                <span style={{ fontSize:11, color:"rgba(29,78,216,0.4)", fontWeight:400,
                  marginLeft:8, textTransform:"none" }}>
                  ({shareResults.filter(b=>b._type==="prayer").length} Prayer
                  {shareResults.filter(b=>b._type==="satsang").length > 0 ? ` · ${shareResults.filter(b=>b._type==="satsang").length} Satsang` : ""}
                  {shareResults.filter(b=>b._type==="bhadra").length > 0 ? ` · ${shareResults.filter(b=>b._type==="bhadra").length} Bhadra` : ""}
                  {shareResults.filter(b=>b._type==="matri").length > 0 ? ` · ${shareResults.filter(b=>b._type==="matri").length} Matri` : ""}
                  {shareResults.filter(b=>b._type==="savan").length > 0 ? ` · ${shareResults.filter(b=>b._type==="savan").length} Savan` : ""})
                </span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {displayResults.map(b => {
                  const isSatsang = (b._type === "satsang" || b._type === "bhadra" || b._type === "matri" || b._type === "savan");
                  const typeLabels = { satsang:"🪔 Satsang", bhadra:"🌸 Bhadra Parikrama", matri:"🌺 Matri-Sammelan", savan:"🌿 Savan Parikrama" };
                  const typeColors = { satsang:"#92400e", bhadra:"#6d28d9", matri:"#be185d", savan:"#15803d" };
                  const typeBgs   = { satsang:"rgba(217,119,6,0.12)", bhadra:"rgba(109,40,217,0.1)", matri:"rgba(190,24,93,0.1)", savan:"rgba(21,128,61,0.1)" };
                  const typeBars  = { satsang:"linear-gradient(90deg,#78350f,#d97706,#fbbf24)", bhadra:"linear-gradient(90deg,#5b21b6,#7c3aed,#a78bfa)", matri:"linear-gradient(90deg,#9d174d,#db2777,#f472b6)", savan:"linear-gradient(90deg,#14532d,#16a34a,#4ade80)" };
                  const typeBgCard= { satsang:"rgba(255,251,235,0.6)", bhadra:"rgba(245,243,255,0.6)", matri:"rgba(253,242,248,0.6)", savan:"rgba(240,253,244,0.6)" };

                  /* ── PRAYER CARD ── */
                  if (!isSatsang) {
                    const sc = SLOT_STYLE[b.time] || SLOT_STYLE["Morning"];
                    // Extract mapsLink from place if it was stored combined (e.g. "Address https://maps...")
                    const placeStr = b.place || "";
                    const urlMatch = placeStr.match(/(https?:\/\/[^\s]+)/);
                    const extractedMapsLink = urlMatch ? urlMatch[1] : "";
                    const cleanPlace = extractedMapsLink ? placeStr.replace(extractedMapsLink, "").trim() : placeStr;
                    const shareConf = { name:b.name, mobile:b.mobile, time:b.time,
                      date:b.date, prayerTime:cleanTime(b.prayerTime), place:cleanPlace || placeStr, mapsLink:extractedMapsLink, id:b.id };
                    return (
                      <div key={b.id} style={{ border:"1.5px solid rgba(59,130,246,0.2)",
                        borderRadius:16, overflow:"hidden",
                        background:"rgba(239,246,255,0.5)" }}>
                        {/* Blue top bar */}
                        <div style={{ height:4, background:"linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)" }}/>
                        <div style={{ padding:"14px 16px" }}>
                          {/* Type badge + ID */}
                          <div style={{ marginBottom:10 }}>
                            <span style={{ fontSize:10, fontWeight:800, color:"#1d4ed8",
                              background:"rgba(29,78,216,0.1)", padding:"3px 9px",
                              borderRadius:20, letterSpacing:"1px", textTransform:"uppercase" }}>
                              🌅 Prayer Booking
                            </span>
                          </div>
                          {/* Details */}
                          <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800,
                            color:"#1e3a8a", fontSize:14, marginBottom:4 }}>{b.name}</div>
                          <div style={{ fontSize:13, color:sc.color, fontWeight:700 }}>
                            {sc.icon} {b.time} Prayer · {formatDateWithDay(b.date)}
                          </div>
                          <div style={{ fontSize:12, color:"#6b7280", marginTop:3 }}>
                            🕐 {cleanTime(b.prayerTime)}
                            {b.place && (b.place.startsWith("http") ? (
                              <a href={b.place} target="_blank" rel="noopener noreferrer"
                                style={{ marginLeft:6, color:"#1d4ed8", fontWeight:700, textDecoration:"none" }}>
                                📍 View Map
                              </a>
                            ) : ` · ${b.place}`)}</div>

                          {/* Address edit */}
                          <div style={{ margin:"10px 0 0", padding:"10px 12px", borderRadius:10,
                            background:"rgba(239,246,255,0.8)", border:"1px solid rgba(59,130,246,0.15)" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                              <span style={{ fontSize:11, fontWeight:700, color:"rgba(29,78,216,0.6)",
                                textTransform:"uppercase", letterSpacing:"1px" }}>📍 Address</span>
                              {editingAddress !== b.id && (
                                <button onClick={() => { setEditingAddress(b.id); setEditAddressVal(b.place||""); }}
                                  style={{ fontSize:11, fontWeight:700, color:"#1d4ed8", background:"none",
                                    border:"1px solid rgba(29,78,216,0.3)", borderRadius:6,
                                    padding:"3px 8px", cursor:"pointer" }}>✏️ Edit</button>
                              )}
                            </div>
                            {editingAddress !== b.id && (
                              <div style={{ fontSize:12, color:"#374151" }}>
                                {b.place && b.place.startsWith("http") ? (
                                  <a href={b.place} target="_blank" rel="noopener noreferrer"
                                    style={{ color:"#1d4ed8", fontWeight:600, textDecoration:"none" }}>📍 View on Map</a>
                                ) : (
                                  <span>{b.place || <span style={{color:"#9ca3af",fontStyle:"italic"}}>No address set</span>}</span>
                                )}
                              </div>
                            )}
                            {editingAddress === b.id && (
                              <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:4 }}>
                                <div style={{ fontSize:11, fontWeight:700, color:"rgba(29,78,216,0.55)", textTransform:"uppercase", letterSpacing:"0.6px" }}>
                                  🌐 Find Location
                                </div>
                                <LocationPicker color="#1d4ed8"
                                  placeholder="Search a place, area or landmark…"
                                  onPick={({ address, mapsLink }) => {
                                    if (address)  setEditAddressVal(address);
                                    if (mapsLink) setEditMapsVal(mapsLink);
                                  }}/>
                                <div style={{ fontSize:11, fontWeight:700, color:"rgba(29,78,216,0.55)", textTransform:"uppercase", letterSpacing:"0.6px", marginTop:4 }}>
                                  Address / Location name
                                </div>
                                <input className="divine-input"
                                  placeholder="e.g. Flat 301, Upkar Manor, Arekere"
                                  value={editAddressVal}
                                  onChange={e => setEditAddressVal(e.target.value)}
                                  style={{ fontSize:13, padding:"10px 12px" }}
                                  autoFocus/>
                                <div style={{ fontSize:11, fontWeight:700, color:"rgba(29,78,216,0.55)", textTransform:"uppercase", letterSpacing:"0.6px", marginTop:2 }}>
                                  Google Maps link (optional)
                                </div>
                                <input className="divine-input"
                                  placeholder="Paste Google Maps link — https://maps.app.goo.gl/..."
                                  value={editMapsVal}
                                  onChange={e => setEditMapsVal(e.target.value)}
                                  style={{ fontSize:13, padding:"10px 12px" }}/>
                                <div style={{ display:"flex", gap:8 }}>
                                  <button
                                    disabled={savingAddress || (!editAddressVal.trim() && !editMapsVal.trim())}
                                    onClick={() => handleUpdateAddress(b.id, editAddressVal.trim(), editMapsVal.trim())}
                                    style={{ flex:1, padding:"10px", border:"none", borderRadius:8,
                                      background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",
                                      color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer",
                                      opacity:(savingAddress||(!editAddressVal.trim()&&!editMapsVal.trim()))?0.6:1 }}>
                                    {savingAddress ? "Saving..." : "Save address"}
                                  </button>
                                  <button
                                    onClick={() => { setEditingAddress(null); setEditAddressVal(""); setEditMapsVal(""); }}
                                    style={{ padding:"10px 16px", border:"1px solid rgba(30,64,175,0.2)",
                                      borderRadius:8, background:"#fff", color:"#6b7280",
                                      fontWeight:600, fontSize:13, cursor:"pointer" }}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                            {addressMsg[b.id] && (
                              <div style={{ marginTop:6, fontSize:12, fontWeight:600,
                                color:addressMsg[b.id].startsWith("✅")?"#065f46":"#b91c1c" }}>
                                {addressMsg[b.id]}
                              </div>
                            )}
                          </div>

                          <div style={{ height:1, background:"rgba(59,130,246,0.12)", margin:"12px 0 10px" }}/>

                          {/* Share buttons */}
                          <div style={{ fontSize:11, fontWeight:700, color:"rgba(29,78,216,0.5)",
                            textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>📤 Share Booking</div>
                          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                            <a href={`https://wa.me/?text=${buildShareMsg(shareConf)}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ display:"flex", alignItems:"center", justifyContent:"center",
                                gap:8, padding:"11px", borderRadius:10, textDecoration:"none",
                                background:"linear-gradient(135deg,#25D366,#128C7E)",
                                color:"#fff", fontWeight:800, fontSize:13 }}>
                              💬 Share on WhatsApp
                            </a>
                            <a href={`sms:${b.mobile}?body=${buildShareMsg(shareConf)}`}
                              style={{ display:"flex", alignItems:"center", justifyContent:"center",
                                gap:8, padding:"11px", borderRadius:10, textDecoration:"none",
                                background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",
                                color:"#fff", fontWeight:800, fontSize:13 }}>
                              📱 Send as SMS
                            </a>
                            <button onClick={()=>handleCopy(shareConf)}
                              style={{ display:"flex", alignItems:"center", justifyContent:"center",
                                gap:8, padding:"11px", borderRadius:10, border:"none",
                                background:"rgba(30,64,175,0.08)", cursor:"pointer",
                                color:"#1e3a8a", fontWeight:700, fontSize:13 }}>
                              📋 Copy Message
                            </button>
                          </div>

                          {/* Cancel prayer — only for future dates */}
                          {b.date >= getTodayStr() && (
                            <div style={{ marginTop:10 }}>
                              <button
                                disabled={cancelling === b.id}
                                onClick={() => handleCancelBooking(b.id)}
                                style={{ width:"100%", padding:"10px", border:"1px solid rgba(220,38,38,0.3)",
                                  borderRadius:10, background:"rgba(254,242,242,0.8)",
                                  color:"#b91c1c", fontWeight:700, fontSize:12, cursor:"pointer",
                                  opacity: cancelling===b.id ? 0.6 : 1 }}>
                                {cancelling===b.id ? "⏳ Cancelling..." : "❌ Cancel This Booking"}
                              </button>
                            </div>
                          )}
                          {b.date < getTodayStr() && (
                            <div style={{ marginTop:8, fontSize:11, color:"#94a3b8", fontStyle:"italic", textAlign:"center" }}>
                              ✅ This prayer has already passed
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  /* ── SATSANG CARD ── */
                  const satsangShareConf = { ...b };
                  return (
                    <div key={b.id} style={{ border:"1.5px solid rgba(217,119,6,0.25)",
                      borderRadius:16, overflow:"hidden",
                      background:typeBgCard[b._type]||"rgba(255,251,235,0.6)" }}>
                      {/* Type-coloured top bar */}
                      <div style={{ height:4, background:typeBars[b._type]||"linear-gradient(90deg,#78350f,#d97706,#fbbf24)" }}/>
                      <div style={{ padding:"14px 16px" }}>
                        {/* Type badge */}
                        <div style={{ marginBottom:10 }}>
                          <span style={{ fontSize:10, fontWeight:800,
                            color:typeColors[b._type]||"#92400e",
                            background:typeBgs[b._type]||"rgba(217,119,6,0.12)",
                            padding:"3px 9px", borderRadius:20,
                            letterSpacing:"1px", textTransform:"uppercase" }}>
                            {typeLabels[b._type]||"🪔 Satsang"} Booking
                          </span>
                        </div>
                        {/* Details */}
                        <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800,
                          color:typeColors[b._type]||"#78350f", fontSize:14, marginBottom:4 }}>{b.name}</div>
                        <div style={{ fontSize:13, color:typeColors[b._type]||"#d97706", fontWeight:700 }}>
                          📅 {formatDateWithDay(b.date)}
                        </div>
                        <div style={{ fontSize:12, color:"#6b7280", marginTop:3 }}>
                          ⏰ {cleanTime(b.time)} onwards
                          {b.venue && ` · 📍 ${b.venue}`}
                        </div>
                        {b.mapsLink && (
                          <a href={b.mapsLink} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize:12, color:typeColors[b._type]||"#d97706", fontWeight:600,
                              textDecoration:"none", display:"block", marginTop:3 }}>
                            🗺️ View on Map
                          </a>
                        )}
                        {b.hostedBy && (
                          <div style={{ fontSize:12, color:"#92400e", marginTop:3, fontWeight:600 }}>
                            🙏 {b.hostedBy}
                          </div>
                        )}
                        {b.occasion && (
                          <div style={{ fontSize:12, color:"#d97706", marginTop:3, fontWeight:600 }}>
                            🪔 {b.occasion}
                          </div>
                        )}

                        <div style={{ height:1, background:"rgba(217,119,6,0.15)", margin:"12px 0 10px" }}/>

                        {/* Share buttons (amber theme) */}
                        <div style={{ fontSize:11, fontWeight:700, color:"rgba(120,53,15,0.6)",
                          textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>📤 Share Satsang</div>
                        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                          <a href={`https://wa.me/?text=${buildSatsangShareMsg(satsangShareConf)}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ display:"flex", alignItems:"center", justifyContent:"center",
                              gap:8, padding:"11px", borderRadius:10, textDecoration:"none",
                              background:"linear-gradient(135deg,#25D366,#128C7E)",
                              color:"#fff", fontWeight:800, fontSize:13 }}>
                            💬 Share on WhatsApp
                          </a>
                          <a href={`sms:?body=${buildSatsangShareMsg(satsangShareConf)}`}
                            style={{ display:"flex", alignItems:"center", justifyContent:"center",
                              gap:8, padding:"11px", borderRadius:10, textDecoration:"none",
                              background:"linear-gradient(135deg,#d97706,#fbbf24)",
                              color:"#fff", fontWeight:800, fontSize:13 }}>
                            📱 Send as SMS
                          </a>
                          <button onClick={()=>handleSatsangCopy(satsangShareConf)}
                            style={{ display:"flex", alignItems:"center", justifyContent:"center",
                              gap:8, padding:"11px", borderRadius:10, border:"none",
                              background:"rgba(120,53,15,0.08)", cursor:"pointer",
                              color:"#78350f", fontWeight:700, fontSize:13 }}>
                            📋 Copy Message
                          </button>
                        </div>

                        {/* Cancel satsang/special — only for future dates */}
                        {b.date >= getTodayStr() && (
                          <div style={{ marginTop:10 }}>
                            <button
                              disabled={cancelling === b.id}
                              onClick={() => handleCancelSpecial(b.id, b._type)}
                              style={{ width:"100%", padding:"10px", border:`1px solid ${typeColors[b._type]||"#92400e"}44`,
                                borderRadius:10, background:`${typeBgCard[b._type]||"rgba(255,251,235,0.9)"}`,
                                color:typeColors[b._type]||"#92400e", fontWeight:700, fontSize:12, cursor:"pointer",
                                opacity: cancelling===b.id ? 0.6 : 1 }}>
                              {cancelling===b.id ? "⏳ Cancelling..." : `❌ Cancel This ${b._type==='bhadra'?'Bhadra':b._type==='matri'?'Matri':b._type==='savan'?'Savan':'Satsang'}`}
                            </button>
                          </div>
                        )}
                        {b.date < getTodayStr() && (
                          <div style={{ marginTop:8, fontSize:11, color:"#94a3b8", fontStyle:"italic", textAlign:"center" }}>
                            ✅ This event has already passed
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {/* ── Show Past Bookings toggle (Retrieve tab) ── */}
                {!shareResults.__searching && pastResults.length > 0 && (
                  <div style={{ marginTop:8 }}>
                    <button onClick={() => setShowRetrievePast(p => !p)}
                      style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center",
                        gap:8, padding:"11px 14px", borderRadius:12,
                        border:"1.5px solid rgba(29,78,216,0.2)",
                        background:"rgba(239,246,255,0.6)",
                        color:"#1d4ed8", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                      <span>{showRetrievePast ? "▲" : "▼"}</span>
                      <span>{showRetrievePast ? "Hide Past Bookings" : `Show Past Bookings (${pastResults.length})`}</span>
                    </button>
                    {showRetrievePast && (
                      <div style={{ display:"flex", flexDirection:"column", gap:14, marginTop:12 }}>
                        {pastResults.map(b => {
                          const isSatsang2 = (b._type === "satsang" || b._type === "bhadra" || b._type === "matri" || b._type === "savan");
                          if (!isSatsang2) {
                            const sc2 = SLOT_STYLE[b.time] || SLOT_STYLE["Morning"];
                            const placeStr2 = b.place || "";
                            const urlMatch2 = placeStr2.match(/(https?:\/\/[^\s]+)/);
                            const extractedMapsLink2 = urlMatch2 ? urlMatch2[1] : "";
                            const cleanPlace2 = extractedMapsLink2 ? placeStr2.replace(extractedMapsLink2, "").trim() : placeStr2;
                            const shareConf2 = { name:b.name, mobile:b.mobile, time:b.time,
                              date:b.date, prayerTime:cleanTime(b.prayerTime), place:cleanPlace2 || placeStr2, mapsLink:extractedMapsLink2, id:b.id };
                            return (
                              <div key={b.id} style={{ border:"1.5px solid rgba(59,130,246,0.15)",
                                borderRadius:16, overflow:"hidden", opacity:0.72,
                                background:"rgba(241,245,249,0.7)" }}>
                                <div style={{ height:4, background:"linear-gradient(90deg,#94a3b8,#cbd5e1,#e2e8f0)" }}/>
                                <div style={{ padding:"14px 16px" }}>
                                  <div style={{ marginBottom:8 }}>
                                    <span style={{ fontSize:10, fontWeight:800, color:"#64748b",
                                      background:"rgba(100,116,139,0.1)", padding:"3px 9px",
                                      borderRadius:20, letterSpacing:"1px", textTransform:"uppercase" }}>
                                      🌅 Prayer · Past
                                    </span>
                                  </div>
                                  <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800,
                                    color:"#334155", fontSize:14, marginBottom:4 }}>{b.name}</div>
                                  <div style={{ fontSize:13, color:sc2.color, fontWeight:700, opacity:0.8 }}>
                                    {sc2.icon} {b.time} Prayer · {formatDateWithDay(b.date)}
                                  </div>
                                  <div style={{ fontSize:12, color:"#6b7280", marginTop:3 }}>
                                    🕐 {cleanTime(b.prayerTime)}
                                  </div>
                                  <div style={{ marginTop:10 }}>
                                    <button disabled={cancelling === b.id} onClick={() => handleCancelBooking(b.id)}
                                      style={{ width:"100%", padding:"10px", border:"1px solid rgba(220,38,38,0.3)",
                                        borderRadius:10, background:"rgba(254,242,242,0.8)",
                                        color:"#b91c1c", fontWeight:700, fontSize:12, cursor:"pointer",
                                        opacity: cancelling===b.id ? 0.6 : 1 }}>
                                      {cancelling===b.id ? "⏳ Cancelling..." : "❌ Cancel This Booking"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div key={b.id} style={{ border:"1.5px solid rgba(217,119,6,0.15)",
                              borderRadius:16, overflow:"hidden", opacity:0.72,
                              background:"rgba(250,247,235,0.7)" }}>
                              <div style={{ height:4, background:"linear-gradient(90deg,#94a3b8,#cbd5e1,#e2e8f0)" }}/>
                              <div style={{ padding:"14px 16px" }}>
                                {(() => {
                                  const ptl = { satsang:"🪔 Satsang", bhadra:"🌸 Bhadra", matri:"🌺 Matri", savan:"🌿 Savan" };
                                  const ptc = { satsang:"#92400e", bhadra:"#6d28d9", matri:"#be185d", savan:"#15803d" };
                                  const ptb = { satsang:"rgba(217,119,6,0.1)", bhadra:"rgba(109,40,217,0.1)", matri:"rgba(190,24,93,0.1)", savan:"rgba(21,128,61,0.1)" };
                                  const lbl = ptl[b._type] || "🪔 Satsang";
                                  const clr = ptc[b._type] || "#92400e";
                                  const bg  = ptb[b._type] || "rgba(217,119,6,0.1)";
                                  return (<>
                                    <div style={{ marginBottom:8 }}>
                                      <span style={{ fontSize:10, fontWeight:800, color:clr,
                                        background:bg, padding:"3px 9px",
                                        borderRadius:20, letterSpacing:"1px", textTransform:"uppercase" }}>
                                        {lbl} · Past
                                      </span>
                                    </div>
                                    <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800,
                                      color:clr, fontSize:14, marginBottom:4 }}>{b.name}</div>
                                    <div style={{ fontSize:13, color:clr, fontWeight:700, opacity:0.8 }}>
                                      📅 {formatDateWithDay(b.date)}
                                    </div>
                                    <div style={{ fontSize:12, color:"#6b7280", marginTop:3 }}>
                                      ⏰ {cleanTime(b.time)} onwards
                                      {b.venue && ` · 📍 ${b.venue}`}
                                    </div>
                                    <div style={{ marginTop:8, fontSize:11, color:"#94a3b8", fontStyle:"italic", textAlign:"center" }}>
                                      ✅ This event has already passed
                                    </div>
                                  </>);
                                })()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            );
          })()}

          {shareResults && shareResults.length === 0 && !shareMsg && (
            <div style={{ textAlign:"center", padding:"24px 0",
              color:"rgba(29,78,216,0.4)", fontSize:13 }}>
              No bookings found for this number.
            </div>
          )}
        </div>
      )}



      {/* ════════ ALL BOOKINGS — LIST VIEW ════════ */}
      {activeTab === "manage" && manageTab === "all" && (() => {
        const todayStr = getTodayStr();

        const AllBookingsView = () => {
          const nowYM = todayStr.slice(0, 7);
          const [activeYM,  setActiveYM]  = React.useState(nowYM);
          const [typeTab,   setTypeTab]   = React.useState(allBookingsFilter || "all");
          const [search,    setSearch]    = React.useState("");
          const [showPast,  setShowPast]  = React.useState(false);
          const [dateFrom,  setDateFrom]  = React.useState("");
          const [dateTo,    setDateTo]    = React.useState("");
          const [showRange, setShowRange] = React.useState(false);

          // Sync with pill click filter
          React.useEffect(() => {
            if (allBookingsFilter && allBookingsFilter !== "all") {
              setTypeTab(allBookingsFilter);
            }
          }, [allBookingsFilter]);

          const allItems = [
            ...bookings.map(b        => ({ ...b, _type:"prayer"  })),
            ...satsangBookings.map(b => ({ ...b, _type:"satsang" })),
            ...(feat.bhadraBooking ? bhadraBookings.map(b => ({ ...b, _type:"bhadra" })) : []),
            ...(feat.matriBooking  ? matriBookings.map(b  => ({ ...b, _type:"matri"  })) : []),
            ...(feat.savanBooking  ? savanBookings.map(b  => ({ ...b, _type:"savan"  })) : []),
          ];

          const allMonths = React.useMemo(() => {
            const seen = new Set(allItems.map(b => (b.date||"").slice(0,7)).filter(Boolean));
            seen.add(nowYM);
            return Array.from(seen).sort();
          }, [bookings, satsangBookings, bhadraBookings, matriBookings, savanBookings]);

          const monthIdx = allMonths.indexOf(activeYM);
          const goPrev = () => { if (monthIdx > 0) setActiveYM(allMonths[monthIdx - 1]); };
          const goNext = () => { if (monthIdx < allMonths.length - 1) setActiveYM(allMonths[monthIdx + 1]); };
          const monthLabel = new Date(activeYM + "-01T00:00:00").toLocaleDateString("en-IN", { month:"long", year:"numeric" });

          const isSearching = search.trim().length > 0;
          const isRangeActive = showRange && (dateFrom || dateTo);

          const typeMatch = (b) => {
            if (typeTab === "all")     return true;
            return b._type === typeTab;
          };

          const filtered = allItems.filter(b => {
            if (!typeMatch(b)) return false;
            if (isSearching) {
              const q = search.toLowerCase();
              return (b.name||"").toLowerCase().includes(q)
                  || (b.mobile||"").includes(q)
                  || (b.venue||"").toLowerCase().includes(q)
                  || (b.place||"").toLowerCase().includes(q);
            }
            if (isRangeActive) {
              const d = b.date || "";
              if (dateFrom && d < dateFrom) return false;
              if (dateTo   && d > dateTo)   return false;
              return true;
            }
            return (b.date||"").startsWith(activeYM) && (b.date||"") >= todayStr;
          }).sort((a, b) => (a.date||"").localeCompare(b.date||""));

          const pastFiltered = (isSearching || isRangeActive) ? [] : allItems.filter(b => {
            if (!typeMatch(b)) return false;
            return (b.date||"").startsWith(activeYM) && (b.date||"") < todayStr;
          }).sort((a, b) => (b.date||"").localeCompare(a.date||""));

          const pastGroups = {};
          pastFiltered.forEach(b => { const d = b.date||"Unknown"; if (!pastGroups[d]) pastGroups[d]=[]; pastGroups[d].push(b); });
          const pastSortedDates = Object.keys(pastGroups).sort((a,b) => b.localeCompare(a));

          const groups = {};
          filtered.forEach(b => { const d = b.date||"Unknown"; if (!groups[d]) groups[d]=[]; groups[d].push(b); });
          const sortedDates = Object.keys(groups).sort();

          const monthItems = allItems.filter(b => (b.date||"").startsWith(activeYM));
          const counts = {
            all:     monthItems.length,
            prayer:  monthItems.filter(b => b._type==="prayer").length,
            satsang: monthItems.filter(b => b._type==="satsang").length,
            bhadra:  monthItems.filter(b => b._type==="bhadra").length,
            matri:   monthItems.filter(b => b._type==="matri").length,
            savan:   monthItems.filter(b => b._type==="savan").length,
          };

          const TYPE_TABS = [
            { id:"all",     label:"All",     icon:"📋", color:"#1e3a8a" },
            { id:"prayer",  label:"Prayer",  icon:"🙏", color:"#1d4ed8" },
            feat.satsangBooking && { id:"satsang", label:"Satsang", icon:"🪔", color:"#92400e" },
            feat.bhadraBooking  && { id:"bhadra",  label:"Bhadra",  icon:"🌸", color:"#6d28d9" },
            feat.matriBooking   && { id:"matri",   label:"Matri",   icon:"🌺", color:"#be185d" },
            feat.savanBooking   && { id:"savan",   label:"Savan",   icon:"🌿", color:"#15803d" },
          ].filter(Boolean);

          return (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

              {/* ── Month navigator ── */}
              <div className="card" style={{ padding:"14px 16px 14px" }}>

                {/* Row 1: < Month Year > — hidden while searching */}
                {isSearching && (
                  <div style={{ display:"flex", alignItems:"center", gap:8,
                    marginBottom:12, padding:"8px 12px", borderRadius:10,
                    background:"rgba(29,78,216,0.07)",
                    border:"1px solid rgba(29,78,216,0.15)" }}>
                    <span style={{ fontSize:13 }}>🔍</span>
                    <span style={{ fontSize:12, color:"rgba(29,78,216,0.65)", fontWeight:700 }}>
                      Searching across all months
                    </span>
                  </div>
                )}
                {!isSearching && (
                <div style={{ display:"flex", alignItems:"center",
                  justifyContent:"space-between", marginBottom:14 }}>
                  <button onClick={goPrev} disabled={monthIdx <= 0}
                    style={{ width:36, height:36, borderRadius:"50%", border:"none",
                      cursor: monthIdx <= 0 ? "not-allowed" : "pointer",
                      background: monthIdx <= 0 ? "rgba(59,130,246,0.05)" : "rgba(29,78,216,0.1)",
                      color:  monthIdx <= 0 ? "rgba(29,78,216,0.2)" : "#1d4ed8",
                      fontSize:16, fontWeight:900, display:"flex",
                      alignItems:"center", justifyContent:"center",
                      transition:"all 0.15s" }}>‹</button>

                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"'Cinzel',serif", fontWeight:900,
                      color:"#1e3a8a", fontSize:16, letterSpacing:"0.3px" }}>
                      {monthLabel}
                    </div>
                    <div style={{ fontSize:11, color:"rgba(29,78,216,0.45)", marginTop:2 }}>
                      {counts.all} booking{counts.all!==1?"s":""} this month
                    </div>
                  </div>

                  <button onClick={goNext} disabled={monthIdx >= allMonths.length - 1}
                    style={{ width:36, height:36, borderRadius:"50%", border:"none",
                      cursor: monthIdx >= allMonths.length-1 ? "not-allowed" : "pointer",
                      background: monthIdx >= allMonths.length-1 ? "rgba(59,130,246,0.05)" : "rgba(29,78,216,0.1)",
                      color:  monthIdx >= allMonths.length-1 ? "rgba(29,78,216,0.2)" : "#1d4ed8",
                      fontSize:16, fontWeight:900, display:"flex",
                      alignItems:"center", justifyContent:"center",
                      transition:"all 0.15s" }}>›</button>
                </div>

                )}
                {/* Row 2: All | Prayer | Satsang | Bhadra | Matri | Savan */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginBottom:12 }}>
                  {TYPE_TABS.map(t => {
                    const active = typeTab === t.id;
                    return (
                      <button key={t.id} onClick={() => { setTypeTab(t.id); setAllBookingsFilter(t.id); }}
                        style={{ padding:"8px 4px", borderRadius:12,
                          cursor:"pointer", fontFamily:"'Cinzel',serif",
                          fontSize:10, fontWeight:800, transition:"all 0.18s",
                          background: active ? `linear-gradient(135deg,${t.color}dd,${t.color})` : "rgba(239,246,255,0.7)",
                          color: active ? "#fff" : "rgba(29,78,216,0.5)",
                          boxShadow: active ? `0 3px 12px ${t.color}44` : "none",
                          border: active ? "none" : "1px solid rgba(59,130,246,0.15)" }}>
                        <div style={{ fontSize:13 }}>{t.icon}</div>
                        <div style={{ fontSize:10 }}>{t.label}</div>
                        <div style={{ fontSize:10, marginTop:1, opacity:active?0.9:0.55,
                          color:active?"#fff":t.color, fontFamily:"sans-serif", fontWeight:700 }}>
                          {counts[t.id] ?? 0}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Date range filter */}
                <div style={{ marginBottom:10 }}>
                  <button onClick={() => setShowRange(r => !r)}
                    style={{ width:"100%", padding:"8px 12px", borderRadius:10,
                      background: showRange ? "rgba(29,78,216,0.1)" : "rgba(239,246,255,0.7)",
                      border:"1px solid rgba(59,130,246,0.2)", cursor:"pointer",
                      fontSize:12, color:"rgba(29,78,216,0.65)", fontWeight:700,
                      display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span>📅 Filter by date range {isRangeActive ? `(${dateFrom||"any"} → ${dateTo||"any"})` : ""}</span>
                    <span>{showRange ? "▲" : "▼"}</span>
                  </button>
                  {showRange && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
                      <div>
                        <div style={{ fontSize:10, color:"rgba(29,78,216,0.5)", fontWeight:700, marginBottom:3 }}>FROM</div>
                        <input type="date" className="divine-input" value={dateFrom}
                          style={{ fontSize:12, padding:"8px 10px" }}
                          onChange={e => setDateFrom(e.target.value)}/>
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:"rgba(29,78,216,0.5)", fontWeight:700, marginBottom:3 }}>TO</div>
                        <input type="date" className="divine-input" value={dateTo}
                          style={{ fontSize:12, padding:"8px 10px" }}
                          onChange={e => setDateTo(e.target.value)}/>
                      </div>
                      {isRangeActive && (
                        <button onClick={() => { setDateFrom(""); setDateTo(""); }}
                          style={{ gridColumn:"1/-1", padding:"7px", borderRadius:8, border:"none",
                            background:"rgba(239,246,255,0.8)", color:"rgba(29,78,216,0.6)",
                            fontSize:12, fontWeight:700, cursor:"pointer" }}>
                          ✕ Clear date range
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Row 3: Search */}
                <div style={{ position:"relative" }}>
                  <input className="divine-input"
                    placeholder="🔍  Search by name or venue..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{ paddingLeft:14, fontSize:13 }}
                  />
                  {search && (
                    <button onClick={() => setSearch("")}
                      style={{ position:"absolute", right:10, top:"50%",
                        transform:"translateY(-50%)", background:"none", border:"none",
                        cursor:"pointer", fontSize:15,
                        color:"rgba(29,78,216,0.4)", lineHeight:1 }}>✕</button>
                  )}
                </div>
              </div>

              {/* ── Booking cards ── */}
              {!dataReady ? (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <SkeletonCard rows={3}/><SkeletonCard rows={3}/><SkeletonCard rows={2}/>
                </div>
              ) : filtered.length === 0 ? (
                <div className="card" style={{ textAlign:"center", padding:"40px 0" }}>
                  <div style={{ fontSize:36, marginBottom:10,
                    filter:"saturate(0) brightness(2.2)" }}>🪷</div>
                  <div style={{ color:"rgba(29,78,216,0.35)", fontSize:13 }}>
                    {isSearching
                      ? `No results for "${search}" across all months`
                      : `No ${typeTab==="all"?"bookings":typeTab+" bookings"} in ${monthLabel}`}
                  </div>
                  {search && (
                    <button onClick={() => setSearch("")}
                      style={{ marginTop:10, padding:"7px 16px", borderRadius:20,
                        border:"1px solid rgba(29,78,216,0.2)", background:"transparent",
                        color:"#1d4ed8", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {sortedDates.map(date => {
                    const dayItems   = groups[date];
                    const isToday    = date === todayStr;
                    const isPast     = date < todayStr;
                    const dateLabel  = new Date(date+"T00:00:00")
                      .toLocaleDateString("en-IN",{
                        weekday:"short", day:"numeric", month:"short"
                      });

                    return (
                      <div key={date}>
                        {/* Date strip */}
                        <div style={{ display:"flex", alignItems:"center", gap:8,
                          margin:"10px 0 6px" }}>
                          <div style={{ padding:"3px 12px", borderRadius:20,
                            fontSize:11, fontWeight:800, whiteSpace:"nowrap",
                            background: isToday  ? "rgba(29,78,216,0.12)"
                              : isPast ? "rgba(107,114,128,0.09)"
                              : "rgba(16,185,129,0.09)",
                            border:`1px solid ${isToday ? "rgba(29,78,216,0.25)"
                              : isPast ? "rgba(107,114,128,0.18)" : "rgba(16,185,129,0.22)"}`,
                            color: isToday ? "#1d4ed8" : isPast ? "#6b7280" : "#065f46" }}>
                            {isToday ? "⭐ Today" : dateLabel}
                            <span style={{ marginLeft:5, opacity:0.6 }}>
                              · {dayItems.length}
                            </span>
                          </div>
                          <div style={{ flex:1, height:1,
                            background:"linear-gradient(90deg,rgba(59,130,246,0.12),transparent)" }}/>
                        </div>

                        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                          {dayItems.map(b => {
                            if (b._type === "prayer") {
                              const sc = SLOT_STYLE[b.time] || SLOT_STYLE["Morning"];
                              return (
                                <div key={b.id} style={{ borderRadius:14, overflow:"hidden",
                                  border:"1px solid rgba(59,130,246,0.18)",
                                  background:"rgba(239,246,255,0.65)" }}>
                                  <div style={{ height:3,
                                    background:`linear-gradient(90deg,${sc.color},${sc.color}55)` }}/>
                                  <div style={{ padding:"12px 14px" }}>
                                    <div style={{ display:"flex", justifyContent:"space-between",
                                      alignItems:"flex-start", gap:8, marginBottom:4 }}>
                                      <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800,
                                        color:"#1e3a8a", fontSize:14 }}>{b.name}</div>
                                      <span style={{ flexShrink:0, fontSize:10, fontWeight:800,
                                        color:"#1d4ed8", background:"rgba(29,78,216,0.09)",
                                        padding:"2px 8px", borderRadius:20,
                                        textTransform:"uppercase", letterSpacing:"0.6px" }}>
                                        🙏 Prayer
                                      </span>
                                    </div>
                                    <div style={{ fontSize:13, color:sc.color,
                                      fontWeight:700, marginBottom:3 }}>
                                      {sc.icon} {b.time} · 🕐 {cleanTime(b.prayerTime)}
                                    </div>
                                    {b.place && (
                                      <div style={{ fontSize:12, color:"#6b7280" }}>
                                        {b.place.startsWith("http")
                                          ? <a href={b.place} target="_blank" rel="noopener noreferrer"
                                              style={{ color:"#1d4ed8", fontWeight:600, textDecoration:"none" }}>
                                              📍 View on Map</a>
                                          : <>📍 {b.place}</>}
                                      </div>
                                    )}
                                    {currentUser && (
                                      <div style={{ marginTop:8, padding:"8px 10px", borderRadius:10,
                                        background:"rgba(29,78,216,0.05)", border:"1px solid rgba(29,78,216,0.1)" }}>
                                        <div style={{ fontSize:11, color:"#1d4ed8", fontWeight:700, marginBottom:4,
                                          textTransform:"uppercase", letterSpacing:"0.8px" }}>🔐 Admin Info</div>
                                        <div style={{ fontSize:12, color:"#374151", fontWeight:600 }}>📱 {b.mobile}</div>
                                        <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>🪪 {b.id}</div>
                                        {b.bookedAt && <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>🕒 {b.bookedAt}</div>}
                                        {/* Share invitation */}
                                        {(() => {
                                          const placeStr = b.place || "";
                                          const urlM = placeStr.match(/(https?:\/\/[^\s]+)/);
                                          const mLink = urlM ? urlM[1] : "";
                                          const cPlace = mLink ? placeStr.replace(mLink,"").trim() : placeStr;
                                          const sc2 = { name:b.name, mobile:b.mobile, time:b.time, date:b.date, prayerTime:cleanTime(b.prayerTime), place:cPlace||placeStr, mapsLink:mLink, id:b.id };
                                          return (
                                            <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:5 }}>
                                              <div style={{ fontSize:10, fontWeight:700, color:"rgba(29,78,216,0.5)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:2 }}>📤 Share Invitation</div>
                                              <a href={`https://wa.me/?text=${buildShareMsg(sc2)}`} target="_blank" rel="noopener noreferrer"
                                                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                                                  padding:"7px", borderRadius:8, textDecoration:"none",
                                                  background:"linear-gradient(135deg,#25D366,#128C7E)",
                                                  color:"#fff", fontWeight:700, fontSize:12 }}>
                                                💬 WhatsApp
                                              </a>
                                              <a href={`sms:${b.mobile}?body=${buildShareMsg(sc2)}`}
                                                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                                                  padding:"7px", borderRadius:8, textDecoration:"none",
                                                  background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",
                                                  color:"#fff", fontWeight:700, fontSize:12 }}>
                                                📱 SMS
                                              </a>
                                              <button onClick={() => handleCopy(sc2)}
                                                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                                                  padding:"7px", borderRadius:8, border:"none", cursor:"pointer",
                                                  background:"rgba(29,78,216,0.08)",
                                                  color:"#1e3a8a", fontWeight:700, fontSize:12 }}>
                                                📋 Copy
                                              </button>
                                            </div>
                                          );
                                        })()}
                                        {b.date >= getTodayStr()
                                          ? <button
                                              disabled={cancelling === b.id}
                                              onClick={() => handleCancelBooking(b.id)}
                                              style={{ marginTop:4, width:"100%", padding:"7px", border:"none", borderRadius:8,
                                                background:"linear-gradient(135deg,#dc2626,#ef4444)",
                                                color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer",
                                                opacity: cancelling===b.id ? 0.6 : 1 }}>
                                              {cancelling===b.id ? "⏳ Cancelling..." : "🗑️ Cancel Booking"}
                                            </button>
                                          : <div style={{ marginTop:6, fontSize:11, color:"#94a3b8", fontStyle:"italic", textAlign:"center" }}>
                                              ✅ Prayer already passed
                                            </div>
                                        }
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            // Satsang / Bhadra / Matri / Savan — dynamic colours per type
                            const TC = {
                              satsang:{ border:"rgba(217,119,6,0.2)",  bg:"rgba(255,251,235,0.75)", bar:"linear-gradient(90deg,#d97706,#fbbf2455)", name:"#78350f", time:"#d97706", badge:"#92400e", badgeBg:"rgba(217,119,6,0.1)",  adminBg:"rgba(217,119,6,0.07)",  adminBorder:"rgba(217,119,6,0.18)",  adminText:"#92400e", label:"🪔 Satsang",  cancelGrad:"linear-gradient(135deg,#92400e,#d97706)", cancelLabel:"Cancel Satsang" },
                              bhadra: { border:"rgba(109,40,217,0.2)", bg:"rgba(245,243,255,0.75)", bar:"linear-gradient(90deg,#7c3aed,#a78bfa55)", name:"#4c1d95", time:"#7c3aed", badge:"#6d28d9", badgeBg:"rgba(109,40,217,0.1)", adminBg:"rgba(109,40,217,0.07)", adminBorder:"rgba(109,40,217,0.18)", adminText:"#6d28d9", label:"🌸 Bhadra",  cancelGrad:"linear-gradient(135deg,#5b21b6,#7c3aed)", cancelLabel:"Cancel Bhadra" },
                              matri:  { border:"rgba(190,24,93,0.2)",  bg:"rgba(253,242,248,0.75)", bar:"linear-gradient(90deg,#db2777,#f472b655)", name:"#831843", time:"#db2777", badge:"#be185d", badgeBg:"rgba(190,24,93,0.1)",  adminBg:"rgba(190,24,93,0.07)",  adminBorder:"rgba(190,24,93,0.18)",  adminText:"#be185d", label:"🌺 Matri",   cancelGrad:"linear-gradient(135deg,#9d174d,#db2777)", cancelLabel:"Cancel Matri" },
                              savan:  { border:"rgba(21,128,61,0.2)",  bg:"rgba(240,253,244,0.75)", bar:"linear-gradient(90deg,#16a34a,#4ade8055)", name:"#14532d", time:"#16a34a", badge:"#15803d", badgeBg:"rgba(21,128,61,0.1)",  adminBg:"rgba(21,128,61,0.07)",  adminBorder:"rgba(21,128,61,0.18)",  adminText:"#15803d", label:"🌿 Savan",   cancelGrad:"linear-gradient(135deg,#14532d,#16a34a)", cancelLabel:"Cancel Savan" },
                            };
                            const tc = TC[b._type] || TC.satsang;
                            return (
                              <div key={b.id} style={{ borderRadius:14, overflow:"hidden",
                                border:`1px solid ${tc.border}`, background:tc.bg }}>
                                <div style={{ height:3, background:tc.bar }}/>
                                <div style={{ padding:"12px 14px" }}>
                                  <div style={{ display:"flex", justifyContent:"space-between",
                                    alignItems:"flex-start", gap:8, marginBottom:4 }}>
                                    <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800,
                                      color:tc.name, fontSize:14 }}>{b.name}</div>
                                    <span style={{ flexShrink:0, fontSize:10, fontWeight:800,
                                      color:tc.badge, background:tc.badgeBg,
                                      padding:"2px 8px", borderRadius:20,
                                      textTransform:"uppercase", letterSpacing:"0.6px" }}>
                                      {tc.label}
                                    </span>
                                  </div>
                                  <div style={{ fontSize:13, color:tc.time,
                                    fontWeight:700, marginBottom:3 }}>
                                    📅 {formatDateWithDay(b.date)} · ⏰ {cleanTime(b.time)}
                                  </div>
                                  {b.venue && (
                                    <div style={{ fontSize:12, color:"#6b7280" }}>
                                      {b.mapsLink
                                        ? <a href={b.mapsLink} target="_blank" rel="noopener noreferrer"
                                            style={{ color:tc.time, fontWeight:600, textDecoration:"none" }}>
                                            📍 {b.venue} · Map</a>
                                        : <>📍 {b.venue}</>}
                                    </div>
                                  )}
                                  {b.hostedBy && (
                                    <div style={{ fontSize:12, color:tc.badge,
                                      fontWeight:600, marginTop:3 }}>
                                      🙏 {b.hostedBy}
                                    </div>
                                  )}
                                  {currentUser && (
                                    <div style={{ marginTop:8, padding:"8px 10px", borderRadius:10,
                                      background:tc.adminBg, border:`1px solid ${tc.adminBorder}` }}>
                                      <div style={{ fontSize:11, color:tc.adminText, fontWeight:700, marginBottom:4,
                                        textTransform:"uppercase", letterSpacing:"0.8px" }}>🔐 Admin Info</div>
                                      <div style={{ fontSize:12, color:"#374151", fontWeight:600 }}>📱 {b.mobile}</div>
                                      <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>🪪 {b.id}</div>
                                      {b.bookedAt && <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>🕒 {b.bookedAt}</div>}
                                      {/* Share invitation */}
                                      <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:5 }}>
                                        <div style={{ fontSize:10, fontWeight:700, color:tc.adminText, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:2 }}>📤 Share Invitation</div>
                                        <a href={`https://wa.me/?text=${buildSatsangShareMsg(b)}`} target="_blank" rel="noopener noreferrer"
                                          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                                            padding:"7px", borderRadius:8, textDecoration:"none",
                                            background:"linear-gradient(135deg,#25D366,#128C7E)",
                                            color:"#fff", fontWeight:700, fontSize:12 }}>
                                          💬 WhatsApp
                                        </a>
                                        <a href={`sms:?body=${buildSatsangShareMsg(b)}`}
                                          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                                            padding:"7px", borderRadius:8, textDecoration:"none",
                                            background:tc.cancelGrad,
                                            color:"#fff", fontWeight:700, fontSize:12 }}>
                                          📱 SMS
                                        </a>
                                        <button onClick={() => handleSatsangCopy(b)}
                                          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                                            padding:"7px", borderRadius:8, border:"none", cursor:"pointer",
                                            background:tc.adminBg,
                                            color:tc.adminText, fontWeight:700, fontSize:12 }}>
                                          📋 Copy
                                        </button>
                                      </div>
                                      {b.date >= getTodayStr()
                                        ? <button
                                            disabled={cancelling === b.id}
                                            onClick={() => handleCancelSpecial(b.id, b._type)}
                                            style={{ marginTop:4, width:"100%", padding:"7px", border:"none", borderRadius:8,
                                              background:tc.cancelGrad, color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer",
                                              opacity: cancelling===b.id ? 0.6 : 1 }}>
                                            {cancelling===b.id ? "⏳ Cancelling..." : `🗑️ ${tc.cancelLabel}`}
                                          </button>
                                        : <div style={{ marginTop:6, fontSize:11, color:"#94a3b8", fontStyle:"italic", textAlign:"center" }}>
                                            ✅ Event already passed
                                          </div>
                                      }
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Show Past Bookings toggle ── */}
              {!isSearching && pastFiltered.length > 0 && (
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <button
                    onClick={() => setShowPast(p => !p)}
                    style={{ width:"100%", padding:"13px 16px",
                      borderRadius:14, border:"1.5px dashed rgba(29,78,216,0.25)",
                      background:"rgba(239,246,255,0.5)", cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                      color:"rgba(29,78,216,0.55)", fontSize:13, fontWeight:700,
                      transition:"all 0.2s" }}>
                    <span>{showPast ? "▲" : "▼"}</span>
                    <span>{showPast ? "Hide Past Bookings" : `Show Past Bookings (${pastFiltered.length})`}</span>
                  </button>

                  {showPast && (
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {pastSortedDates.map(date => {
                        const dayItems  = pastGroups[date];
                        const dateLabel = new Date(date+"T00:00:00")
                          .toLocaleDateString("en-IN",{
                            weekday:"short", day:"numeric", month:"short"
                          });
                        return (
                          <div key={date}>
                            <div style={{ display:"inline-flex", alignItems:"center",
                              gap:6, marginBottom:6, padding:"4px 12px",
                              borderRadius:20, background:"rgba(107,114,128,0.1)",
                              border:"1px solid rgba(107,114,128,0.2)" }}>
                              <span style={{ fontSize:11, fontWeight:700,
                                color:"#6b7280" }}>{dateLabel}</span>
                              <span style={{ fontSize:10, color:"rgba(107,114,128,0.6)",
                                fontWeight:600 }}>· {dayItems.length}</span>
                            </div>
                            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                              {dayItems.map(b => {
                                if (b._type === "prayer") {
                                  const sc = SLOT_STYLE[b.time] || SLOT_STYLE["Morning"];
                                  return (
                                    <div key={b.id} style={{ borderRadius:14, overflow:"hidden",
                                      border:"1px solid rgba(107,114,128,0.15)",
                                      background:"rgba(107,114,128,0.06)", opacity:0.75 }}>
                                      <div style={{ height:3, background:"rgba(107,114,128,0.3)" }}/>
                                      <div style={{ padding:"12px 14px" }}>
                                        <div style={{ display:"flex", justifyContent:"space-between",
                                          alignItems:"flex-start", gap:8, marginBottom:4 }}>
                                          <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800,
                                            color:"#6b7280", fontSize:14 }}>{b.name}</div>
                                          <span style={{ flexShrink:0, fontSize:10, fontWeight:800,
                                            color:"#9ca3af", background:"rgba(107,114,128,0.1)",
                                            padding:"2px 8px", borderRadius:20,
                                            textTransform:"uppercase", letterSpacing:"0.6px" }}>
                                            🙏 Prayer
                                          </span>
                                        </div>
                                        <div style={{ fontSize:13, color:"#9ca3af", fontWeight:700, marginBottom:3 }}>
                                          {sc.icon} {b.time} · 🕐 {cleanTime(b.prayerTime)}
                                        </div>
                                        {b.place && (
                                          <div style={{ fontSize:12, color:"#9ca3af" }}>📍 {b.place}</div>
                                        )}
                                        {currentUser && (
                                          <div style={{ marginTop:8, padding:"8px 10px", borderRadius:10,
                                            background:"rgba(107,114,128,0.08)", border:"1px solid rgba(107,114,128,0.15)" }}>
                                            <div style={{ fontSize:11, color:"#6b7280", fontWeight:700, marginBottom:4,
                                              textTransform:"uppercase", letterSpacing:"0.8px" }}>🔐 Admin Info</div>
                                            <div style={{ fontSize:12, color:"#374151", fontWeight:600 }}>📱 {b.mobile}</div>
                                            <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>🪪 {b.id}</div>
                                            {b.bookedAt && <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>🕒 {b.bookedAt}</div>}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                                return (
                                  <div key={b.id} style={{ borderRadius:14, overflow:"hidden",
                                    border:"1px solid rgba(107,114,128,0.15)",
                                    background:"rgba(107,114,128,0.06)", opacity:0.75 }}>
                                    <div style={{ height:3, background:"rgba(107,114,128,0.3)" }}/>
                                    <div style={{ padding:"12px 14px" }}>
                                      <div style={{ display:"flex", justifyContent:"space-between",
                                        alignItems:"flex-start", gap:8, marginBottom:4 }}>
                                        <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800,
                                          color:"#6b7280", fontSize:14 }}>{b.name}</div>
                                        <span style={{ flexShrink:0, fontSize:10, fontWeight:800,
                                          color:"#9ca3af", background:"rgba(107,114,128,0.1)",
                                          padding:"2px 8px", borderRadius:20,
                                          textTransform:"uppercase", letterSpacing:"0.6px" }}>
                                          🪔 Satsang
                                        </span>
                                      </div>
                                      <div style={{ fontSize:13, color:"#9ca3af", fontWeight:700, marginBottom:3 }}>
                                        ⏰ {cleanTime(b.time)} onwards
                                      </div>
                                      {b.venue && <div style={{ fontSize:12, color:"#9ca3af" }}>📍 {b.venue}</div>}
                                      {b.hostedBy && <div style={{ fontSize:12, color:"#9ca3af", fontWeight:600, marginTop:3 }}>🙏 {b.hostedBy}</div>}
                                      {currentUser && (
                                        <div style={{ marginTop:8, padding:"8px 10px", borderRadius:10,
                                          background:"rgba(107,114,128,0.08)", border:"1px solid rgba(107,114,128,0.15)" }}>
                                          <div style={{ fontSize:11, color:"#6b7280", fontWeight:700, marginBottom:4,
                                            textTransform:"uppercase", letterSpacing:"0.8px" }}>🔐 Admin Info</div>
                                          <div style={{ fontSize:12, color:"#374151", fontWeight:600 }}>📱 {b.mobile}</div>
                                          <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>🪪 {b.id}</div>
                                          {b.bookedAt && <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>🕒 {b.bookedAt}</div>}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        };

        return <AllBookingsView />;
      })()}

      {/* ════════ SATSANG TAB — 3-MODE ════════ */}
      {activeTab === "manage" && manageTab === "announce" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Header */}
          <div className="card" style={{ padding:"20px 16px 16px", textAlign:"center" }}>
            <div style={{ fontSize:38, marginBottom:8,
              filter:"drop-shadow(0 0 12px rgba(29,78,216,0.3))",
              animation:"floatEmoji 3s ease-in-out infinite alternate" }}>📨</div>
            <div style={{ fontFamily:"'Cinzel',serif", color:"#1e3a8a",
              fontSize:17, fontWeight:800, marginBottom:4 }}>Create a Message</div>
            <div style={{ fontSize:12, color:"rgba(29,78,216,0.45)", lineHeight:1.7 }}>
              Craft a Satsang invitation or a custom message to share
            </div>
            <div className="blue-line" style={{ marginTop:14 }}/>
          </div>

          {/* Message type selector */}
          <div className="card">
            <label className="divine-label">Select Message Type</label>
            <select className="divine-input" value={msgType}
              onChange={e => {
                setMsgType(e.target.value);
                setSatsang({ date:"", time:"", venue:"", mapsLink:"", hostedBy:"" });
                setCustomMsg({ body:"", author:"" });
              }}
              style={{ cursor:"pointer", fontSize:14, fontWeight:700 }}>
              <option value="">— Choose a type —</option>
              <option value="satsang">🪔 Satsang Invitation</option>
              <option value="custom">✍️ Custom Message</option>
            </select>
          </div>

          {/* ── SATSANG INVITATION ── */}
          {msgType === "satsang" && (() => {
            const builtMsg = satsang.date||satsang.venue ? buildSatsangMsg() : "";
            return (
              <div className="card">
                <div style={{ fontFamily:"'Cinzel',serif", color:"#1e3a8a",
                  fontSize:15, fontWeight:700, marginBottom:14 }}>
                  📜 Satsang Invitation
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
                  <div><label className="divine-label">📅 Date</label>
                    <input type="date" className="divine-input" value={satsang.date}
                      style={{ fontSize:13, width:"100%", cursor:"pointer" }}
                      onChange={e=>setSatsang({...satsang,date:e.target.value})}/></div>
                  <div><label className="divine-label">⏰ Time</label>
                    <input className="divine-input" placeholder="e.g. 4:30 PM"
                      value={satsang.time} onChange={e=>setSatsang({...satsang,time:e.target.value})}/></div>
                  <div><label className="divine-label">📍 Venue / Address</label>
                    <input className="divine-input" placeholder="e.g. 47, Bannerghatta SUK, Bangalore"
                      value={satsang.venue} onChange={e=>setSatsang({...satsang,venue:e.target.value})}/></div>
                  <div><label className="divine-label">📌 Google Maps Link (optional)</label>
                    <input className="divine-input" placeholder="Paste Google Maps link"
                      value={satsang.mapsLink} onChange={e=>setSatsang({...satsang,mapsLink:e.target.value})}/></div>
                  <div><label className="divine-label">🙏 Hosted By</label>
                    <input className="divine-input" placeholder="e.g. Bannerghatta SUK"
                      value={satsang.hostedBy} onChange={e=>setSatsang({...satsang,hostedBy:e.target.value})}/></div>

                  {builtMsg ? (
                    <>
                      <label className="divine-label">Message Preview</label>
                      <div style={{ padding:"14px", borderRadius:12, fontSize:13, lineHeight:1.85,
                        background:"rgba(255,251,235,0.8)", border:"1px solid rgba(217,119,6,0.2)",
                        whiteSpace:"pre-wrap", color:"#1f2937", fontFamily:"'Lato',sans-serif" }}>
                        {builtMsg}
                      </div>
                      <a onClick={()=>shareWhatsApp(builtMsg)}
                        style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                          padding:"13px", borderRadius:12, textDecoration:"none", cursor:"pointer",
                          background:"linear-gradient(135deg,#25D366,#128C7E)", color:"#fff",
                          fontWeight:800, fontSize:14, boxShadow:"0 4px 14px rgba(37,211,102,0.3)" }}>
                        💬 Share on WhatsApp
                      </a>
                      <div style={{ display:"flex", gap:8 }}>
                        <a onClick={()=>shareSMS(builtMsg)}
                          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
                            gap:6, padding:"11px", borderRadius:12, textDecoration:"none", cursor:"pointer",
                            background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"#fff",
                            fontWeight:700, fontSize:13 }}>📱 SMS</a>
                        <button onClick={()=>shareCopy(builtMsg)}
                          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
                            gap:6, padding:"11px", borderRadius:12, border:"none", cursor:"pointer",
                            background:"rgba(30,64,175,0.08)", color:"#1e3a8a",
                            fontWeight:700, fontSize:13 }}>📋 Copy</button>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign:"center", padding:"14px 0",
                      color:"rgba(29,78,216,0.35)", fontSize:13 }}>
                      Fill in the details above to preview the message 🙏
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── CUSTOM MESSAGE ── */}
          {msgType === "custom" && (() => {
            const builtMsg = customMsg.body.trim() ? buildCustomMsg() : "";
            return (
              <div className="card">
                <div style={{ fontFamily:"'Cinzel',serif", color:"#1e3a8a",
                  fontSize:15, fontWeight:700, marginBottom:14 }}>
                  ✍️ Custom Message
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
                  <div><label className="divine-label">Your Message</label>
                    <textarea className="divine-input" placeholder="Type your message here... 🙏"
                      rows={6} value={customMsg.body}
                      onChange={e=>setCustomMsg({...customMsg,body:e.target.value})}
                      style={{ resize:"vertical", fontFamily:"'Lato',sans-serif", lineHeight:1.7 }}/></div>
                  <div><label className="divine-label">Your Name (optional)</label>
                    <input className="divine-input" placeholder="e.g. Bannerghatta SUK"
                      value={customMsg.author} onChange={e=>setCustomMsg({...customMsg,author:e.target.value})}/></div>

                  {builtMsg ? (
                    <>
                      <label className="divine-label">Message Preview</label>
                      <div style={{ padding:"14px", borderRadius:12, fontSize:13, lineHeight:1.85,
                        background:"rgba(20,40,120,0.04)", border:"1px solid rgba(59,130,246,0.15)",
                        whiteSpace:"pre-wrap", color:"#1f2937", fontFamily:"'Lato',sans-serif" }}>
                        {builtMsg}
                      </div>
                      <a onClick={()=>shareWhatsApp(builtMsg)}
                        style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                          padding:"13px", borderRadius:12, textDecoration:"none", cursor:"pointer",
                          background:"linear-gradient(135deg,#25D366,#128C7E)", color:"#fff",
                          fontWeight:800, fontSize:14, boxShadow:"0 4px 14px rgba(37,211,102,0.3)" }}>
                        💬 Share on WhatsApp
                      </a>
                      <div style={{ display:"flex", gap:8 }}>
                        <a onClick={()=>shareSMS(builtMsg)}
                          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
                            gap:6, padding:"11px", borderRadius:12, textDecoration:"none", cursor:"pointer",
                            background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"#fff",
                            fontWeight:700, fontSize:13 }}>📱 SMS</a>
                        <button onClick={()=>shareCopy(builtMsg)}
                          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
                            gap:6, padding:"11px", borderRadius:12, border:"none", cursor:"pointer",
                            background:"rgba(30,64,175,0.08)", color:"#1e3a8a",
                            fontWeight:700, fontSize:13 }}>📋 Copy</button>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })()}

        </div>
      )}


      {/* ════════ PRAYER GALLERY TAB ════════ */}
      {activeTab === "manage" && manageTab === "gallery" && (
        <GalleryTab
          isConfigured={isConfigured}
          photos={photos}
          photosLoading={photosLoading}
          photoUpload={photoUpload}
          setPhotoUpload={setPhotoUpload}
          photoMsg={photoMsg}
          setPhotoMsg={setPhotoMsg}
          photoUploading={photoUploading}
          onUpload={handlePhotoUpload}
          isAdmin={!!currentUser}
          onDeletePhoto={handleDeletePhoto}
        />
      )}



      {/* ════════ DEVOTEE DASHBOARD TAB ════════ */}
      {activeTab === "manage" && manageTab === "dashboard" && currentUser && (
        <DashboardTab
          bookings={bookings}
          satsangBookings={satsangBookings}
        />
      )}

      {/* Footer */}
      <div style={{ textAlign:"center", marginTop:36, paddingBottom:10 }}>
        <div style={{ ...mutedBlue, fontSize:11, letterSpacing:2 }}>✦ ✦ ✦</div>
        <div style={{ fontFamily:"'Cinzel', serif", color:"rgba(30,64,175,0.35)", fontSize:12, marginTop:6 }}>
          {state.ACTIVE_SUK ? sukLabel(state.ACTIVE_SUK)+(state.ACTIVE_SUK.location ? " · "+state.ACTIVE_SUK.location : "") : "Satsang Upayojana Kendra"}
        </div>
      </div>

    </div>
  );
}


// ============================================================
//  SEARCHABLE SUK DROPDOWN — beautiful, filterable, coming-soon aware
// ============================================================

export default App
