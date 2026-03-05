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
import { api, satsangApi, photoApi } from '../services/api.js'
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

function App({ onChangeSuk, deepLink = {} }) {
  // Merge DEFAULT_FEATURES with this SUK's overrides
  const feat = React.useMemo(() => ({
    ...DEFAULT_FEATURES,
    ...(state.ACTIVE_SUK && state.ACTIVE_SUK.features ? state.ACTIVE_SUK.features : {}),
  }), []);

  // isConfigured: reactive — true only when a real SUK is loaded with a valid URL
  const isConfigured = !!(state.ACTIVE_SUK && state.ACTIVE_SUK.configured &&
    state.SCRIPT_URL && state.SCRIPT_URL !== "" && !state.SCRIPT_URL.startsWith("YOUR_"));
  const [bookings,   setBookings]   = React.useState([]);
  const [form,       setForm]       = React.useState({ name:"", mobile:"", place:"", time:"", date:"" });

  const [error,      setError]      = React.useState("");
  const [shake,      setShake]      = React.useState(false);
  const [activeTab,  setActiveTab]  = React.useState("book");
  const [manageTab,  setManageTab]  = React.useState(null);
  const [bookMode,   setBookMode]   = React.useState("prayer"); // "prayer" | "satsang"
  // Reset bookMode if current mode is disabled for this SUK
  React.useEffect(() => {
    if (feat && !feat.satsangBooking && bookMode === "satsang") setBookMode("prayer");
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
  const [shareMobile, setShareMobile] = React.useState("");
  const [shareResults, setShareResults] = React.useState(null);
  const [shareMsg, setShareMsg] = React.useState("");
  // Announcements
  // Satsang Booking state
  const [satsangBookings, setSatsangBookings] = React.useState([]);
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
      const [bd, sd] = await Promise.all([
        api.getAll(),
        satsangApi.getAll(),
      ]);
      const freshBookings = (bd && bd.success && Array.isArray(bd.data)) ? bd.data : [];
      const freshSatsang  = (sd && sd.success && Array.isArray(sd.data)) ? sd.data : [];
      setBookings(freshBookings);
      setSatsangBookings(freshSatsang);
      const prayerFound  = freshBookings.filter(b => b.mobile === mob).map(b => ({ ...b, _type:"prayer" }));
      const satsangFound = freshSatsang.filter(b => b.mobile === mob).map(b => ({ ...b, _type:"satsang" }));
      const combined = [...prayerFound, ...satsangFound].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
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

  const handleUpdateAddress = async (bookingId, newAddress) => {
    setSavingAddress(true);
    try {
      const isLink = newAddress.startsWith("http") || newAddress.includes("maps.google") ||
                     newAddress.includes("goo.gl") || newAddress.includes("maps.app");
      const result = await api.post({
        action: "updateAddress",
        id:     bookingId,
        place:  newAddress,   // store as-is — text or maps link, all goes to Place column
      });
      if (result.success) {
        // Update local state — place field stores both text address and maps links
        setShareResults(prev => prev.map(b =>
          b.id === bookingId ? { ...b, place: newAddress } : b
        ));
        // also update bookings state so cancel section is fresh
        setAddressMsg(prev => ({ ...prev, [bookingId]: "✅ Address updated!" }));
        setEditingAddress(null);
        fetchBookings();
        setTimeout(() => setAddressMsg(prev => { const n={...prev}; delete n[bookingId]; return n; }), 3000);
      } else {
        setAddressMsg(prev => ({ ...prev, [bookingId]: "❌ " + result.message }));
      }
    } catch(e) {
      setAddressMsg(prev => ({ ...prev, [bookingId]: "❌ Network error." }));
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
    const combined = [...prayerFound, ...satsangFound]
      .sort((a,b) => (b.date||"").localeCompare(a.date||"")); // newest first
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

  React.useEffect(() => { fetchSatsangBookings(); }, [fetchSatsangBookings]);

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

  const handlePhotoUpload = async () => {
    if (!photoUpload.file) { setPhotoMsg("⚠️ Please select a photo first."); return; }
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

    setSubmitting(true);
    try {
      const result = await api.post({ action:"add", name, mobile, place, day, time, date, prayerTime });
      if (result.success) {
        // Show beautiful confirmation modal
        setConfirmation({ name, mobile, time, date, prayerTime, id: result.id, place });
        setForm({ name:"", mobile:"", place:"", time:"", date:"" });
        fetchBookings();
      } else { triggerError(result.message); }
    } catch(e) { triggerError("⚠️ Network error. Please try again."); }
    setSubmitting(false);
  };

  const tabs = [
    { id:"book",   label:"🙏 Book" },
    { id:"manage", label:"📋 More Options" },
  ];
  // Only show manage sub-tabs that are enabled for this SUK
  const manageTabs = [
    feat.prayerTimes     && { id:"times",    label:"🙏 Prayer Timings",     desc:"View morning & evening prayer times",   icon:"🙏" },
    feat.retrieveBooking && { id:"share",    label:"🪷 Retrieve Booking",    desc:"Retrieve your booking details",          icon:"🪷" },
    feat.allBookings     && { id:"all",      label:"📖 All Bookings",        desc:"See all prayer bookings by date",       icon:"📖" },
    feat.messages        && { id:"announce", label:"📨 Messages",             desc:"Create invitations & custom messages",   icon:"📨" },
    feat.photoGallery    && { id:"gallery",  label:"🌸 Prayer Photo Gallery", desc:"Upload & view prayer photo memories",   icon:"🌸" },
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

      {/* ── HEADER ── */}
      <div style={{ textAlign:"center", padding:"48px 0 30px", position:"relative" }}>
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
        {/* SUK selector row in header — dropdown to switch SUK inline */}
        {onChangeSuk && (() => {
          return (
            <div style={{ marginTop:10, display:"flex", alignItems:"center",
              justifyContent:"center", gap:8, flexWrap:"wrap", maxWidth:320, margin:"10px auto 0" }}>
              {/* Inline searchable SUK switcher */}
              <SUKSearchDropdown
                selected={state.ACTIVE_SUK ? state.ACTIVE_SUK.key : ""}
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
          );
        })()}
        {(bookings.length > 0 || satsangBookings.length > 0) && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
            gap:8, marginTop:10, flexWrap:"wrap" }}>
            {bookings.length > 0 && (
              <div style={{ display:"inline-flex", alignItems:"center", gap:5,
                padding:"5px 12px", borderRadius:20,
                background:"rgba(29,78,216,0.07)",
                border:"1px solid rgba(29,78,216,0.14)" }}>
                <span style={{ fontSize:12 }}>🌅</span>
                <span style={{ fontSize:11, color:"rgba(29,78,216,0.6)", fontWeight:700,
                  fontFamily:"'Cinzel',serif", letterSpacing:"0.5px" }}>
                  {bookings.length} Prayer{bookings.length!==1?"s":""}
                </span>
              </div>
            )}
            {feat.satsangBooking && satsangBookings.length > 0 && (
              <div style={{ display:"inline-flex", alignItems:"center", gap:5,
                padding:"5px 12px", borderRadius:20,
                background:"rgba(217,119,6,0.07)",
                border:"1px solid rgba(217,119,6,0.18)" }}>
                <span style={{ fontSize:12 }}>🪔</span>
                <span style={{ fontSize:11, color:"rgba(120,53,15,0.65)", fontWeight:700,
                  fontFamily:"'Cinzel',serif", letterSpacing:"0.5px" }}>
                  {satsangBookings.length} Satsang{satsangBookings.length!==1?"s":""}
                </span>
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

      {/* ── TABS ── */}
      <div style={{ display:"flex", gap:6, marginBottom: activeTab==="manage" ? 10 : 24,
        background:"rgba(255,255,255,0.7)", borderRadius:14,
        padding:5, border:"1px solid rgba(59,130,246,0.15)" }}>
        {tabs.map(t => (
          <button key={t.id}
            className={`tab-btn ${activeTab===t.id ? "active":"inactive"}`}
            onClick={() => { setActiveTab(t.id); if(t.id==="manage") setManageTab(null); }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── MANAGE SUB-TABS ── */}
      {activeTab === "manage" && !manageTab && (
        <div className="card" style={{ padding:"6px 8px" }}>
          <div style={{ fontFamily:"'Cinzel',serif", ...blueText, fontSize:13, fontWeight:700,
            textAlign:"center", padding:"12px 0 10px", letterSpacing:1 }}>
            What would you like to do?
          </div>
          <div className="blue-line" style={{ marginBottom:8 }}/>
          {manageTabs.map((t, i) => (
            <button key={t.id} onClick={() => {
              setManageTab(t.id);
            }}
              style={{ display:"flex", alignItems:"center", gap:14, width:"100%",
                padding:"14px 16px", border:"none", borderRadius:14, cursor:"pointer",
                background:"transparent", textAlign:"left", transition:"all 0.18s",
                marginBottom: i < manageTabs.length-1 ? 2 : 0 }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(29,78,216,0.06)"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <div style={{ width:44, height:44, borderRadius:12, flexShrink:0,
                background:"linear-gradient(135deg,rgba(29,78,216,0.1),rgba(59,130,246,0.08))",
                border:"1px solid rgba(59,130,246,0.15)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
                <span style={{ filter: t.id==="share" ? "saturate(0) brightness(2.4) drop-shadow(0 0 4px rgba(255,255,255,0.6))" : "none" }}>
                  {t.icon}
                </span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:"#1e3a8a", fontSize:14 }}>
                  {t.label.split(" ").slice(1).join(" ")}
                </div>
                <div style={{ fontSize:12, color:"rgba(29,78,216,0.45)", marginTop:2 }}>
                  {t.desc}
                </div>
              </div>
              <div style={{ color:"rgba(29,78,216,0.3)", fontSize:18 }}>›</div>
            </button>
          ))}
        </div>
      )}

      {/* Back button when inside a manage sub-tab */}
      {activeTab === "manage" && manageTab && (
        <button onClick={() => setManageTab(null)}
          style={{ display:"flex", alignItems:"center", gap:6, background:"none",
            border:"none", cursor:"pointer", color:"rgba(29,78,216,0.6)",
            fontSize:13, fontWeight:700, padding:"0 2px 14px", letterSpacing:0.3 }}>
          ‹ Back to More Options
        </button>
      )}

      {/* ════════ BOOK TAB ════════ */}
      {activeTab === "book" && (
        <div className="card">

          {/* Toggle pill — only show satsang tab if feat.satsangBooking is on */}
          {(feat.prayerBooking && feat.satsangBooking) && (
            <div style={{ display:"flex", borderRadius:14, overflow:"hidden",
              border:"1.5px solid rgba(59,130,246,0.22)", marginBottom:20,
              background:"rgba(239,246,255,0.6)" }}>
              {[
                feat.prayerBooking  && { mode:"prayer",  icon:"🙏", label:"Prayer Booking" },
                feat.satsangBooking && { mode:"satsang", icon:"🪔", label:"Satsang Booking" },
              ].filter(Boolean).map(t => (
                <button key={t.mode}
                  onClick={() => { setBookMode(t.mode); setError(""); setSatsangError(""); setSatsangConfirm(null); }}
                  style={{ flex:1, padding:"13px 8px", border:"none", cursor:"pointer",
                    fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:13,
                    transition:"all 0.2s",
                    background: bookMode===t.mode
                      ? t.mode==="prayer"
                        ? "linear-gradient(135deg,#1d4ed8,#3b82f6)"
                        : "linear-gradient(135deg,#78350f,#d97706)"
                      : "transparent",
                    color: bookMode===t.mode ? "#fff" : "rgba(29,78,216,0.5)",
                    boxShadow: bookMode===t.mode ? "0 3px 12px rgba(0,0,0,0.18)" : "none" }}>
                  <span style={{ marginRight:6 }}>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
          )}


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
                <label className="divine-label">📍 Location</label>
                <div style={{ position:"relative" }}>
                  <input className="divine-input"
                    placeholder="Type location name  OR  paste Google Maps link"
                    value={form.place}
                    onChange={e => {
                      const v = e.target.value;
                      setError("");
                      const isLink = v.startsWith("http") || v.includes("maps.google") || v.includes("goo.gl") || v.includes("maps.app");
                      setForm({...form, place:v, mapsLink: isLink ? v : form.mapsLink});
                    }}/>
                  {(form.place.startsWith("http") || form.place.includes("maps.google") || form.place.includes("goo.gl") || form.place.includes("maps.app")) && (
                    <a href={form.place} target="_blank" rel="noopener noreferrer"
                      style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                        background:"#1d4ed8", color:"#fff", borderRadius:6, padding:"3px 8px",
                        fontSize:11, fontWeight:700, textDecoration:"none", whiteSpace:"nowrap" }}>
                      Open Map ↗
                    </a>
                  )}
                </div>
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
              </div>
              <div>
                <label className="divine-label" style={{ color:"rgba(120,53,15,0.7)" }}>⏰ Time</label>
                <input className="divine-input" placeholder="e.g. 4:30 PM onwards"
                  value={satsangForm.time}
                  style={{ borderColor:"rgba(217,119,6,0.3)" }}
                  onChange={e=>setSatsangForm({...satsangForm,time:e.target.value})}/>
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

                {cancelResults && cancelResults.length > 0 && (
                  <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:8 }}>
                    {cancelResults.map(b => {
                      const isSatsang = b._type === "satsang";
                      if (isSatsang) {
                        // ── SATSANG cancel card ──
                        return (
                          <div key={b.id} style={{ background:"#fffbeb", borderRadius:12,
                            padding:"14px", border:"1px solid rgba(217,119,6,0.25)" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                              <div>
                                <div style={{ marginBottom:2 }}>
                                  <span style={{ fontSize:10, fontWeight:800, color:"#92400e",
                                    background:"rgba(217,119,6,0.12)", padding:"2px 7px",
                                    borderRadius:10, textTransform:"uppercase", letterSpacing:"0.5px" }}>🪔 Satsang</span>
                                </div>
                                <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800, color:"#78350f", fontSize:13 }}>
                                  {b.name}
                                </div>
                                <div style={{ fontSize:12, color:"#d97706", fontWeight:700, marginTop:2 }}>
                                  📅 {formatDateWithDay(b.date)} · ⏰ {cleanTime(b.time)}
                                </div>
                                {b.venue && <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>📍 {b.venue}</div>}
                              </div>
                
                            </div>
                            <button
                              disabled={cancelling === b.id}
                              onClick={() => handleCancelSatsang(b.id)}
                              style={{ width:"100%", padding:"9px", border:"none", borderRadius:9,
                                background:"linear-gradient(135deg,#92400e,#d97706)",
                                color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer",
                                opacity:cancelling === b.id ? 0.6 : 1 }}>
                              {cancelling === b.id ? "⏳ Cancelling..." : "🗑️  Cancel This Satsang"}
                            </button>
                          </div>
                        );
                      }
                      // ── PRAYER cancel card ──
                      const c = SLOT_STYLE[b.time] || SLOT_STYLE["Morning"];
                      return (
                        <div key={b.id} style={{ background:"#fff", borderRadius:12,
                          padding:"14px", border:"1px solid rgba(220,38,38,0.2)" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                            <div>
                              <div style={{ marginBottom:2 }}>
                                <span style={{ fontSize:10, fontWeight:800, color:"#1d4ed8",
                                  background:"rgba(29,78,216,0.08)", padding:"2px 7px",
                                  borderRadius:10, textTransform:"uppercase", letterSpacing:"0.5px" }}>🙏 Prayer</span>
                              </div>
                              <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800, color:"#1e3a8a", fontSize:13 }}>
                                {b.name}
                              </div>
                              <div style={{ fontSize:12, color:c.color, fontWeight:700, marginTop:2 }}>
                                {c.icon} {b.time} Prayer · {formatDateWithDay(b.date)}
                              </div>
                              {b.prayerTime && (
                                <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>🕐 {cleanTime(b.prayerTime)}</div>
                              )}
                            </div>

                          </div>
                          <button
                            disabled={cancelling === b.id}
                            onClick={() => handleCancelBooking(b.id)}
                            style={{ width:"100%", padding:"9px", border:"none", borderRadius:9,
                              background:"linear-gradient(135deg,#dc2626,#ef4444)",
                              color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer",
                              opacity:cancelling === b.id ? 0.6 : 1 }}>
                            {cancelling === b.id ? "⏳ Cancelling..." : "🗑️  Cancel This Booking"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

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
          {shareResults && shareResults.length > 0 && (
            <div style={{ marginTop:18 }}>
              <div style={{ fontSize:12, color:"rgba(29,78,216,0.6)", fontWeight:700,
                textTransform:"uppercase", letterSpacing:"1px", marginBottom:12 }}>
                {shareResults.length} Booking{shareResults.length > 1 ? "s" : ""} Found
                <span style={{ fontSize:11, color:"rgba(29,78,216,0.4)", fontWeight:400,
                  marginLeft:8, textTransform:"none" }}>
                  ({shareResults.filter(b=>b._type==="prayer").length} Prayer ·{" "}
                   {shareResults.filter(b=>b._type==="satsang").length} Satsang)
                </span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {shareResults.map(b => {
                  const isSatsang = b._type === "satsang";

                  /* ── PRAYER CARD ── */
                  if (!isSatsang) {
                    const sc = SLOT_STYLE[b.time] || SLOT_STYLE["Morning"];
                    const shareConf = { name:b.name, mobile:b.mobile, time:b.time,
                      date:b.date, prayerTime:cleanTime(b.prayerTime), place:b.place, id:b.id };
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
                                <input className="divine-input" placeholder="Address or Google Maps link"
                                  value={editAddressVal} onChange={e=>setEditAddressVal(e.target.value)}
                                  style={{ fontSize:12, padding:"9px 12px" }} autoFocus/>
                                <div style={{ display:"flex", gap:8 }}>
                                  <button disabled={savingAddress||!editAddressVal.trim()}
                                    onClick={() => handleUpdateAddress(b.id, editAddressVal.trim())}
                                    style={{ flex:1, padding:"9px", border:"none", borderRadius:8,
                                      background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",
                                      color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer",
                                      opacity:(savingAddress||!editAddressVal.trim())?0.6:1 }}>
                                    {savingAddress ? "⏳ Saving..." : "✅ Save"}
                                  </button>
                                  <button onClick={()=>setEditingAddress(null)}
                                    style={{ padding:"9px 14px", border:"1px solid rgba(30,64,175,0.2)",
                                      borderRadius:8, background:"#fff", color:"#6b7280",
                                      fontWeight:600, fontSize:12, cursor:"pointer" }}>Cancel</button>
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

                          {/* Cancel prayer */}
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
                        </div>
                      </div>
                    );
                  }

                  /* ── SATSANG CARD ── */
                  const satsangShareConf = { ...b };
                  return (
                    <div key={b.id} style={{ border:"1.5px solid rgba(217,119,6,0.25)",
                      borderRadius:16, overflow:"hidden",
                      background:"rgba(255,251,235,0.6)" }}>
                      {/* Amber top bar */}
                      <div style={{ height:4, background:"linear-gradient(90deg,#78350f,#d97706,#fbbf24)" }}/>
                      <div style={{ padding:"14px 16px" }}>
                        {/* Type badge + ID */}
                        <div style={{ marginBottom:10 }}>
                          <span style={{ fontSize:10, fontWeight:800, color:"#92400e",
                            background:"rgba(217,119,6,0.12)", padding:"3px 9px",
                            borderRadius:20, letterSpacing:"1px", textTransform:"uppercase" }}>
                            🪔 Satsang Booking
                          </span>
                        </div>
                        {/* Details */}
                        <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800,
                          color:"#78350f", fontSize:14, marginBottom:4 }}>{b.name}</div>
                        <div style={{ fontSize:13, color:"#d97706", fontWeight:700 }}>
                          📅 {b.day ? b.day+", " : ""}{formatDate ? formatDate(b.date) : b.date}
                        </div>
                        <div style={{ fontSize:12, color:"#6b7280", marginTop:3 }}>
                          ⏰ {cleanTime(b.time)} onwards
                          {b.venue && ` · 📍 ${b.venue}`}
                        </div>
                        {b.mapsLink && (
                          <a href={b.mapsLink} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize:12, color:"#d97706", fontWeight:600,
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

                        {/* Cancel satsang */}
                        <div style={{ marginTop:10 }}>
                          <button
                            disabled={cancelling === b.id}
                            onClick={() => handleCancelSatsang(b.id)}
                            style={{ width:"100%", padding:"10px", border:"1px solid rgba(217,119,6,0.3)",
                              borderRadius:10, background:"rgba(255,251,235,0.9)",
                              color:"#92400e", fontWeight:700, fontSize:12, cursor:"pointer",
                              opacity: cancelling===b.id ? 0.6 : 1 }}>
                            {cancelling===b.id ? "⏳ Cancelling..." : "❌ Cancel This Satsang"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
          const nowYM = todayStr.slice(0, 7); // "YYYY-MM"
          const [activeYM,  setActiveYM]  = React.useState(nowYM);
          const [typeTab,   setTypeTab]   = React.useState("all"); // all|prayer|satsang
          const [search,    setSearch]    = React.useState("");

          const allItems = [
            ...bookings.map(b       => ({ ...b, _type:"prayer"  })),
            ...satsangBookings.map(b => ({ ...b, _type:"satsang" })),
          ];

          // All YYYY-MM months that have data, sorted asc
          const allMonths = React.useMemo(() => {
            const seen = new Set(allItems.map(b => (b.date||"").slice(0,7)).filter(Boolean));
            // always include current month even if empty
            seen.add(nowYM);
            return Array.from(seen).sort();
          }, [bookings, satsangBookings]);

          const monthIdx = allMonths.indexOf(activeYM);

          const goPrev = () => { if (monthIdx > 0) setActiveYM(allMonths[monthIdx - 1]); };
          const goNext = () => { if (monthIdx < allMonths.length - 1) setActiveYM(allMonths[monthIdx + 1]); };

          const monthLabel = new Date(activeYM + "-01T00:00:00")
            .toLocaleDateString("en-IN", { month:"long", year:"numeric" });

          const isSearching = search.trim().length > 0;

          // When searching — spans ALL months; otherwise current month only
          const filtered = allItems.filter(b => {
            if (typeTab === "prayer"  && b._type !== "prayer")  return false;
            if (typeTab === "satsang" && b._type !== "satsang") return false;
            if (isSearching) {
              const q = search.toLowerCase();
              return (b.name||"").toLowerCase().includes(q)
                  || (b.venue||"").toLowerCase().includes(q)
                  || (b.hostedBy||"").toLowerCase().includes(q);
            }
            return (b.date||"").startsWith(activeYM);
          }).sort((a, b) => (a.date||"").localeCompare(b.date||""));

          // Group by date
          const groups = {};
          filtered.forEach(b => {
            const d = b.date || "Unknown";
            if (!groups[d]) groups[d] = [];
            groups[d].push(b);
          });
          const sortedDates = Object.keys(groups).sort();

          // Counts for type tabs
          const monthItems = allItems.filter(b => (b.date||"").startsWith(activeYM));
          const counts = {
            all:     monthItems.length,
            prayer:  monthItems.filter(b => b._type==="prayer").length,
            satsang: monthItems.filter(b => b._type==="satsang").length,
          };

          const TYPE_TABS = [
            { id:"all",     label:"All",     icon:"📋" },
            { id:"prayer",  label:"Prayer",  icon:"🙏" },
            { id:"satsang", label:"Satsang", icon:"🪔" },
          ];

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
                {/* Row 2: All | Prayer | Satsang tabs */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
                  gap:6, marginBottom:12 }}>
                  {TYPE_TABS.map(t => {
                    const active = typeTab === t.id;
                    return (
                      <button key={t.id} onClick={() => setTypeTab(t.id)}
                        style={{ padding:"9px 0", borderRadius:12, border:"none",
                          cursor:"pointer", fontFamily:"'Cinzel',serif",
                          fontSize:12, fontWeight:800, transition:"all 0.18s",
                          background: active
                            ? t.id==="satsang" ? "linear-gradient(135deg,#78350f,#d97706)"
                              : t.id==="prayer" ? "linear-gradient(135deg,#1d4ed8,#3b82f6)"
                              : "linear-gradient(135deg,#1e3a8a,#3b82f6)"
                            : "rgba(239,246,255,0.7)",
                          color: active ? "#fff" : "rgba(29,78,216,0.5)",
                          boxShadow: active ? "0 3px 12px rgba(29,78,216,0.2)" : "none",
                          border: active ? "none" : "1px solid rgba(59,130,246,0.15)" }}>
                        <div>{t.icon}</div>
                        <div style={{ fontSize:11 }}>{t.label}</div>
                        <div style={{ fontSize:10, marginTop:1,
                          opacity: active ? 0.85 : 0.55,
                          color: active ? "#fff" : "#1d4ed8",
                          fontFamily:"sans-serif", fontWeight:700 }}>
                          {counts[t.id]}
                        </div>
                      </button>
                    );
                  })}
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
                                  </div>
                                </div>
                              );
                            }
                            // Satsang
                            return (
                              <div key={b.id} style={{ borderRadius:14, overflow:"hidden",
                                border:"1px solid rgba(217,119,6,0.2)",
                                background:"rgba(255,251,235,0.75)" }}>
                                <div style={{ height:3,
                                  background:"linear-gradient(90deg,#d97706,#fbbf2455)" }}/>
                                <div style={{ padding:"12px 14px" }}>
                                  <div style={{ display:"flex", justifyContent:"space-between",
                                    alignItems:"flex-start", gap:8, marginBottom:4 }}>
                                    <div style={{ fontFamily:"'Cinzel',serif", fontWeight:800,
                                      color:"#78350f", fontSize:14 }}>{b.name}</div>
                                    <span style={{ flexShrink:0, fontSize:10, fontWeight:800,
                                      color:"#92400e", background:"rgba(217,119,6,0.1)",
                                      padding:"2px 8px", borderRadius:20,
                                      textTransform:"uppercase", letterSpacing:"0.6px" }}>
                                      🪔 Satsang
                                    </span>
                                  </div>
                                  <div style={{ fontSize:13, color:"#d97706",
                                    fontWeight:700, marginBottom:3 }}>
                                    ⏰ {cleanTime(b.time)} onwards
                                  </div>
                                  {b.venue && (
                                    <div style={{ fontSize:12, color:"#6b7280" }}>
                                      {b.mapsLink
                                        ? <a href={b.mapsLink} target="_blank" rel="noopener noreferrer"
                                            style={{ color:"#d97706", fontWeight:600, textDecoration:"none" }}>
                                            📍 {b.venue} · Map</a>
                                        : <>📍 {b.venue}</>}
                                    </div>
                                  )}
                                  {b.hostedBy && (
                                    <div style={{ fontSize:12, color:"#92400e",
                                      fontWeight:600, marginTop:3 }}>
                                      🙏 {b.hostedBy}
                                    </div>
                                  )}
                                  {b.occasion && (
                                    <div style={{ fontSize:12, color:"#d97706",
                                      fontWeight:600, marginTop:3 }}>
                                      🪔 {b.occasion}
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
