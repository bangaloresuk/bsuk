// ============================================================
//  core/auth.js
//  Manages which SUK is active:
//    • Reads URL ?suk= deep-link on load
//    • Persists selection to sessionStorage
//    • Exposes activateSuk() used by welcome screen & switcher
//    • Fires a custom "sukChanged" event the app shell listens to
// ============================================================

"use strict";

// ── Read deep-link params once on module load ────────────────
window.DEEP_LINK = (() => {
  try {
    const p = new URLSearchParams(window.location.search);
    return { suk: p.get("suk"), open: p.get("open") };
  } catch(e) { return {}; }
})();

// ── Activate a SUK — sets globals, persists, fires event ────
window.activateSuk = (suk) => {
  if (!suk || !suk.configured) return false;

  window.SCRIPT_URL  = suk.scriptUrl;
  window.API_KEY     = suk.apiKey;
  window.ACTIVE_SUK  = suk;

  try { sessionStorage.setItem("activeSuk", suk.key); } catch(e) {}

  // Notify the React app shell
  window.dispatchEvent(new CustomEvent("sukChanged", { detail: suk }));

  return true;
};

// ── Deactivate — back to welcome screen ─────────────────────
window.deactivateSuk = () => {
  window.SCRIPT_URL  = "";
  window.API_KEY     = "";
  window.ACTIVE_SUK  = null;

  try { sessionStorage.removeItem("activeSuk"); } catch(e) {}
  window.dispatchEvent(new CustomEvent("sukChanged", { detail: null }));
};

// ── Restore from session / deep-link on page load ───────────
window.restoreSession = () => {
  // 1. URL deep-link wins
  const dlKey = window.DEEP_LINK.suk;
  if (dlKey) {
    const suk = window.SUK_CONFIG[dlKey];
    if (suk && suk.configured) {
      window.activateSuk(suk);
      // Clean URL (removes ?suk= param so refresh shows welcome)
      try { window.history.replaceState({}, "", window.location.pathname); } catch(e) {}
      return suk;
    }
  }

  // 2. Session storage
  try {
    const saved = sessionStorage.getItem("activeSuk");
    if (saved) {
      const suk = window.SUK_CONFIG[saved];
      if (suk && suk.configured) {
        window.activateSuk(suk);
        return suk;
      }
    }
  } catch(e) {}

  return null;
};
