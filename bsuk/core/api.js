// ============================================================
//  core/api.js
//  All network calls go through the Cloudflare Worker proxy.
//  window.SCRIPT_URL = Cloudflare Worker URL (set by auth.js)
//  window.API_KEY    = SUK identifier e.g. "bannerghatta"
//                      (Worker maps this to the real Google Script URL + key)
//  Exports: window.api, window.satsangApi, window.photoApi
// ============================================================

"use strict";

// ── Prayer / main bookings ───────────────────────────────────
window.api = {
  async getAll() {
    const r = await fetch(
      `${window.SCRIPT_URL}?action=getAll&suk=${window.API_KEY}`
    );
    return r.json();
  },

  async post(body) {
    const r = await fetch(window.SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ ...body, suk: window.API_KEY }),
    });
    return r.json();
  },
};

// ── Satsang bookings (separate sheet tab) ───────────────────
window.satsangApi = {
  async getAll() {
    const r = await fetch(
      `${window.SCRIPT_URL}?action=getAll&suk=${window.API_KEY}&sheetName=${window.SATSANG_SHEET}`
    );
    return r.json();
  },

  async post(body) {
    const r = await fetch(window.SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ ...body, suk: window.API_KEY, sheetName: window.SATSANG_SHEET }),
    });
    return r.json();
  },

  async delete(id) {
    const r = await fetch(window.SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action: "delete", id, suk: window.API_KEY, sheetName: window.SATSANG_SHEET }),
    });
    return r.json();
  },
};

// ── Photo gallery (upload stored in Google Drive via Apps Script) ──
window.photoApi = {
  async upload(base64, filename, caption, uploader) {
    const r = await fetch(window.SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "uploadPhoto",
        suk: window.API_KEY,
        base64, filename, caption, uploader,
      }),
    });
    return r.json();
  },

  async getAll() {
    const r = await fetch(
      `${window.SCRIPT_URL}?action=getPhotos&suk=${window.API_KEY}`
    );
    return r.json();
  },
};

// ── isConfigured guard — call anywhere before API use ───────
window.isConfigured = () =>
  !!(window.ACTIVE_SUK &&
     window.ACTIVE_SUK.configured &&
     window.SCRIPT_URL &&
     window.SCRIPT_URL !== "" &&
     !window.SCRIPT_URL.startsWith("YOUR_"));
