// ============================================================
//  adminConfig — Admin Access Configuration
//  ─────────────────────────────────────────────────────────
//  Step 1: Set your Gmail address below
//  Step 2: Paste your GAS Script URL (same one used for bookings)
//  Step 3: The OTP will be emailed to your Gmail via GAS
// ============================================================

export const ADMIN_CONFIG = {
  // ← Your Gmail address (must match ADMIN_EMAILS in GAS)
  adminEmail: 'bangaloresuk@gmail.com',

  // ← Your deployed GAS Script URL (same URL used for bookings)
  // e.g. 'https://script.google.com/macros/s/AKfycb.../exec'
  gasScriptUrl: 'YOUR_GAS_SCRIPT_URL_HERE',

  // Display name
  appName: 'BSUK Admin',
}
