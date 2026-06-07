// ============================================================
//  UTILITY FUNCTIONS — date/time helpers, formatters
// ============================================================

export function formatDate(dateStr) {
  if (!dateStr) return ""
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day:"numeric", month:"long", year:"numeric"
  })
}

export function formatDateWithDay(dateStr) {
  if (!dateStr) return ""
  const d = new Date(dateStr + "T00:00:00")
  const day = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()]
  return day + ", " + d.toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })
}

export function getDayName(dateStr) {
  const n = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
  return n[new Date(dateStr + "T00:00:00").getDay()]
}

export function getTodayStr() {
  const t = new Date()
  const y = t.getFullYear()
  const m = String(t.getMonth()+1).padStart(2,"0")
  const d = String(t.getDate()).padStart(2,"0")
  return `${y}-${m}-${d}`
}

// Handle Google Sheets time bug — "Sat Dec 30 1899 18:23:00 GMT+..." → "18:23"
export function cleanTime(val) {
  if (!val) return ""
  const s = String(val).trim()
  if (!s || s === "undefined") return ""
  if (/^\d{1,2}:\d{2}$/.test(s)) return s
  if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(s)) return s
  const m1899 = s.match(/1899.*?(\d{1,2}):(\d{2}):\d{2}/i)
  if (m1899) return String(m1899[1]).padStart(2,"0") + ":" + m1899[2]
  try {
    const d = new Date(s)
    if (!isNaN(d)) {
      return String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0")
    }
  } catch(e) {}
  const m = s.match(/(\d{1,2}:\d{2})/)
  return m ? m[1] : s
}

// Clean any date string from Google Sheets → "01 Mar 2026, 09:58"
export function cleanPhotoDate(val) {
  if (!val) return ""
  const s = String(val).trim()
  if (!s || s === "undefined") return ""
  try {
    const d = new Date(s)
    if (!isNaN(d)) {
      const datePart = d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
      const h = String(d.getHours()).padStart(2,"0")
      const m = String(d.getMinutes()).padStart(2,"0")
      return `${datePart}, ${h}:${m}`
    }
  } catch(e) {}
  return s
}

// Mask mobile for privacy — show only last 4 digits
export function maskMobile(m) {
  const s = String(m||"").replace(/\D/g,"")
  if (s.length < 4) return "••••••••••"
  return "•".repeat(s.length - 4) + s.slice(-4)
}
