// ============================================================
//  PRAYER TIMES — Bangalore Urban (source: satsang.org.in)
//  Fixed monthly times, same every year.
//  Key = month number (1–12)
// ============================================================

export const PRAYER_TIMES = {
  1:  { Morning: '06:44', Evening: '18:10' },
  2:  { Morning: '06:40', Evening: '18:23' },
  3:  { Morning: '06:24', Evening: '18:28' },
  4:  { Morning: '06:04', Evening: '18:31' },
  5:  { Morning: '05:52', Evening: '18:37' },
  6:  { Morning: '05:51', Evening: '18:46' },
  7:  { Morning: '05:59', Evening: '18:48' },
  8:  { Morning: '06:05', Evening: '18:38' },
  9:  { Morning: '06:06', Evening: '18:19' },
  10: { Morning: '06:09', Evening: '17:58' },
  11: { Morning: '06:18', Evening: '17:48' },
  12: { Morning: '06:34', Evening: '17:54' },
}

export const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const SLOTS = ['Morning', 'Evening']

export const SLOT_STYLE = {
  Morning: { color: '#d97706', bg: '#fef3c7', icon: '🌅' },
  Evening: { color: '#7c3aed', bg: '#ede9fe', icon: '🌙' },
}

/** Returns { Morning, Evening } prayer times for a "YYYY-MM-DD" string */
export function getPrayerTimes(dateStr) {
  if (!dateStr) return null
  return PRAYER_TIMES[parseInt(dateStr.split('-')[1], 10)] || null
}
