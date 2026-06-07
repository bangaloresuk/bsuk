// ============================================================
//  adminConfig — Admin Access Configuration
//  gasScriptUrl reads from env — never hardcoded here.
//  Safe to commit to GitHub.
// ============================================================

export const ADMIN_CONFIG = {
  gasScriptUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  appName: 'BSUK Admin',
}
