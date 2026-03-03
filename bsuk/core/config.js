// ============================================================
//  core/config.js
//  Central config: SUK registry, feature flags, prayer times
//  Loaded first by index.html (before any other module)
// ============================================================

"use strict";

// ── Active-session globals (set at runtime by auth.js) ──────
window.SCRIPT_URL  = "";
window.API_KEY     = "";
window.ACTIVE_SUK  = null;

// ── Feature-flag defaults — all ON ──────────────────────────
window.DEFAULT_FEATURES = {
  prayerBooking:   true,
  satsangBooking:  true,
  cancelBooking:   true,
  retrieveBooking: true,
  allBookings:     true,
  prayerTimes:     true,
  messages:        true,
  photoGallery:    true,
};

// ── SUK registry ────────────────────────────────────────────
window.SUK_CONFIG = {

  // ── ACTIVE ──────────────────────────────────────────────
  "bannerghatta": {
    key:        "bannerghatta",
    name:       "Bannerghatta Satsang Upayojana Kendra",
    shortName:  "Bannerghatta SUK",
    location:   "Bangalore South",
    emoji:      "🪷",
    themeColor: "#1d4ed8",
    scriptUrl:  "https://suk-bangalore.bangaloresuk.workers.dev",
    apiKey:     "bannerghatta",   // Worker uses this as SUK identifier
    configured: true,
    features:   {},
  },
  "peenya-2nd-stage": {
    key:        "peenya-2nd-stage",
    name:       "Peenya 2nd Stage SUK",
    shortName:  "Peenya 2nd Stage SUK",
    emoji:      "🪷",
    themeColor: "#1d4ed8",
    scriptUrl:  "https://suk-bangalore.bangaloresuk.workers.dev",
    apiKey:     "peenya-2nd-stage",   // Worker uses this as SUK identifier
    configured: true,
    features:   { satsangBooking: false, messages: false },
  },
  "banashankari": {
    key:        "banashankari",
    name:       "Banashankari SUK",
    shortName:  "Banashankari SUK",
    emoji:      "🪷",
    themeColor: "#1d4ed8",
    scriptUrl:  "https://suk-bangalore.bangaloresuk.workers.dev",
    apiKey:     "banashankari",   // Worker uses this as SUK identifier
    configured: true,
    features:   { satsangBooking: false, messages: false },
  },

  // ── COMING SOON ─────────────────────────────────────────
  "itpl-main-road":            { key:"itpl-main-road",            shortName:"ITPL Main Road SUK",             emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "sidhappa-layout":           { key:"sidhappa-layout",           shortName:"Sidhappa Layout SUK",            emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "bomanahalli":               { key:"bomanahalli",               shortName:"Bomanahalli SUK",                emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "garvebhavi-palya":          { key:"garvebhavi-palya",          shortName:"Garvebhavi Palya SUK",           emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "hoskote":                   { key:"hoskote",                   shortName:"Hoskote SUK",                    emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "domlur":                    { key:"domlur",                    shortName:"Domlur SUK",                     emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "sarjapura-road":            { key:"sarjapura-road",            shortName:"Sarjapura Road SUK",             emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "jp-park":                   { key:"jp-park",                   shortName:"J P Park SUK",                   emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "marathahalli":              { key:"marathahalli",              shortName:"Marathahalli SUK",               emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "dasarahalli":               { key:"dasarahalli",               shortName:"Dasarahalli SUK",                emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "kamakshipalya":             { key:"kamakshipalya",             shortName:"Kamakshipalya / Kottigepalya SUK",emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "anantha-nagar":             { key:"anantha-nagar",             shortName:"Anantha Nagar SUK",              emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "btm-layout":                { key:"btm-layout",                shortName:"BTM Layout SUK",                 emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "ejipura":                   { key:"ejipura",                   shortName:"Ejipura SUK",                    emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "chandapura":                { key:"chandapura",                shortName:"Chandapura SUK",                 emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "hosa-road":                 { key:"hosa-road",                 shortName:"Hosa Road SUK",                  emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "murugeshpalya":             { key:"murugeshpalya",             shortName:"Murugeshpalya / HAL Area SUK",   emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "banaswadi":                 { key:"banaswadi",                 shortName:"Banaswadi SUK",                  emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "yelahanka":                 { key:"yelahanka",                 shortName:"Yelahanka SUK",                  emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "hsr-layout":                { key:"hsr-layout",                shortName:"HSR Layout SUK",                 emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "hebbagudi":                 { key:"hebbagudi",                 shortName:"Hebbagudi / Daadys Gaarden SUK", emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "electronic-city":           { key:"electronic-city",           shortName:"Electronic City SUK",            emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "horamavu":                  { key:"horamavu",                  shortName:"Horamavu SUK",                   emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "cv-raman-nagar":            { key:"cv-raman-nagar",            shortName:"C V Raman Nagar SUK",            emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "maruthi-nagar-bommasandra": { key:"maruthi-nagar-bommasandra", shortName:"Maruthi Nagar Bommasandra SUK",  emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "kadugodi":                  { key:"kadugodi",                  shortName:"Kadugodi SUK",                   emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "kumaraswamy-layout":        { key:"kumaraswamy-layout",        shortName:"Kumaraswamy Layout SUK",         emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "hmt-area":                  { key:"hmt-area",                  shortName:"HMT Area SUK",                   emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "tavarekere":                { key:"tavarekere",                shortName:"Tavarekere SUK",                 emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "anjana-nagar":              { key:"anjana-nagar",              shortName:"Anjana Nagar SUK",               emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
  "kundanahalli":              { key:"kundanahalli",              shortName:"Kundanahalli SUK",               emoji:"🪷", themeColor:"#1d4ed8", configured:false, features:{} },
};

// ── Prayer times — Bangalore Urban (satsang.org.in) ─────────
window.PRAYER_TIMES = {
  1:  { Morning:"06:44", Evening:"18:10" },
  2:  { Morning:"06:40", Evening:"18:23" },
  3:  { Morning:"06:24", Evening:"18:28" },
  4:  { Morning:"06:04", Evening:"18:31" },
  5:  { Morning:"05:52", Evening:"18:37" },
  6:  { Morning:"05:51", Evening:"18:46" },
  7:  { Morning:"05:59", Evening:"18:48" },
  8:  { Morning:"06:05", Evening:"18:38" },
  9:  { Morning:"06:06", Evening:"18:19" },
  10: { Morning:"06:09", Evening:"17:58" },
  11: { Morning:"06:18", Evening:"17:48" },
  12: { Morning:"06:34", Evening:"17:54" },
};

window.MONTH_NAMES = [
  "","January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

window.SLOT_STYLE = {
  Morning: { color:"#d97706", bg:"#fef3c7", icon:"🌅" },
  Evening: { color:"#7c3aed", bg:"#ede9fe", icon:"🌙" },
};

window.SATSANG_SHEET = "Satsang";

// ── Utility helpers — available globally ────────────────────
window.sukLabel = (suk) => (suk ? suk.shortName || suk.name : "");

window.getPrayerTimes = (dateStr) => {
  if (!dateStr) return null;
  return window.PRAYER_TIMES[parseInt(dateStr.split("-")[1], 10)];
};

window.formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day:"numeric", month:"long", year:"numeric",
  });
};

window.formatDateWithDay = (dateStr) => {
  if (!dateStr) return "";
  const d   = new Date(dateStr + "T00:00:00");
  const day = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()];
  return day + ", " + d.toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });
};

window.getDayName = (dateStr) => {
  const n = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  return n[new Date(dateStr + "T00:00:00").getDay()];
};

window.getTodayStr = () => {
  const t  = new Date();
  const y  = t.getFullYear();
  const m  = String(t.getMonth() + 1).padStart(2,"0");
  const d  = String(t.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
};

window.cleanTime = (val) => {
  if (!val) return "";
  const s = String(val).trim();
  if (!s || s === "undefined") return "";
  if (/^\d{1,2}:\d{2}$/.test(s)) return s;
  if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(s)) return s;
  const m1899 = s.match(/1899.*?(\d{1,2}):(\d{2}):\d{2}/i);
  if (m1899) return String(m1899[1]).padStart(2,"0") + ":" + m1899[2];
  try {
    const d = new Date(s);
    if (!isNaN(d)) return String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
  } catch(e) {}
  const m = s.match(/(\d{1,2}:\d{2})/);
  return m ? m[1] : s;
};

window.cleanPhotoDate = (val) => {
  if (!val) return "";
  const s = String(val).trim();
  if (!s || s === "undefined") return "";
  try {
    const d = new Date(s);
    if (!isNaN(d)) {
      const datePart = d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
      const h = String(d.getHours()).padStart(2,"0");
      const m = String(d.getMinutes()).padStart(2,"0");
      return `${datePart}, ${h}:${m}`;
    }
  } catch(e) {}
  return s;
};

window.maskMobile = (m) => {
  const s = String(m || "").replace(/\D/g,"");
  if (s.length < 4) return "••••••••••";
  return "•".repeat(s.length - 4) + s.slice(-4);
};

// Share helpers
window.shareWhatsApp = (msg) => window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
window.shareSMS      = (msg) => window.open(`sms:?body=${encodeURIComponent(msg)}`);
window.shareCopy     = (msg) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(msg)
      .then(() => alert("✅ Copied! Paste it anywhere."))
      .catch(() => prompt("Copy:", msg));
  } else { prompt("Copy:", msg); }
};

// Merge feature flags: defaults → SUK overrides
window.getFeatures = () => ({
  ...window.DEFAULT_FEATURES,
  ...(window.ACTIVE_SUK && window.ACTIVE_SUK.features ? window.ACTIVE_SUK.features : {}),
});
