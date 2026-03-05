// ── Runtime active SUK state ─────────────────────────────────
// These are set by AppShell when a user selects a SUK.
// Exported as a mutable object so all API modules share the same reference.

const state = {
  SCRIPT_URL: "",
  API_KEY:    "",
  ACTIVE_SUK: null,
}

export default state
