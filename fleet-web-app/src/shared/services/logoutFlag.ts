// ── In-memory flag ────────────────────────────────────────────────────────────
// Tells the axios 401 interceptor not to attempt a token refresh while a
// logout is in flight. Resets automatically on page reload (in-memory only).
let logoutInProgress = false;

export const setLogoutInProgress = (v: boolean): void => {
  logoutInProgress = v;
};

export const isLogoutInProgress = (): boolean => logoutInProgress;

// ── Persistent logout marker (localStorage) ───────────────────────────────────
// Written on every logout. Survives:
//   • Manual page refresh (F5) — same tab
//   • Opening the app in a new tab after logout
//   • React StrictMode double useEffect invocation (dev mode)
//
// Intentionally NOT removed during the /me bootstrap.
// Cleared only by a new successful ADMIN login (useAuth.ts → signIn).
//
// This file has ZERO imports so it can be safely imported by api.ts without
// creating a circular dependency through notificationSlice → notification.api → api.
// ─────────────────────────────────────────────────────────────────────────────
export const LOGOUT_MARKER_KEY = 'axia.logged_out';
export const LOGIN_MARKER_KEY = 'axia.logged_in';

export function markLoggedIn(): void {
  try {
    localStorage.setItem(LOGIN_MARKER_KEY, '1');
  } catch { /* non-fatal */ }
}

export function clearLoginMarker(): void {
  try {
    localStorage.removeItem(LOGIN_MARKER_KEY);
  } catch { /* non-fatal */ }
}

export function isLoggedInLocally(): boolean {
  try {
    return localStorage.getItem(LOGIN_MARKER_KEY) === '1';
  } catch {
    return false;
  }
}

export function markLoggedOut(): void {
  try {
    localStorage.setItem(LOGOUT_MARKER_KEY, '1');
  } catch {
    // localStorage quota errors — non-fatal
  }
}

export function clearLogoutMarker(): void {
  try {
    localStorage.removeItem(LOGOUT_MARKER_KEY);
  } catch {
    // Non-fatal
  }
}

export function isLoggedOutLocally(): boolean {
  try {
    return localStorage.getItem(LOGOUT_MARKER_KEY) === '1';
  } catch {
    return false;
  }
}
