import type { QueryClient } from '@tanstack/react-query';
import type { AppDispatch } from '../../store';
import { resetAuth } from '../../store/authSlice';
import { resetNotifications } from '../../store/notificationSlice';
import { clearCsrfToken } from './csrfToken';
import { setLogoutInProgress, markLoggedOut } from './logoutFlag';

// Re-export the helpers that callers (App.tsx, useAuth.ts) need.
export { isLoggedOutLocally, clearLogoutMarker, LOGOUT_MARKER_KEY } from './logoutFlag';

// ─── Storage scrub ────────────────────────────────────────────────────────────
// These keys may hold auth residue from past versions or third-party libraries.
// The logout marker key (axia.logged_out) is NOT in this list — it must
// survive across page loads until a new login clears it.
const AUTH_STORAGE_KEYS = [
  'axia.remember',
  'axia.user',
  'axia.token',
  'axia.csrf',
  'auth',
  'user',
  'token',
  'csrf',
];

function scrubStorage(storage: Storage): void {
  AUTH_STORAGE_KEYS.forEach((k) => {
    try {
      storage.removeItem(k);
    } catch {
      // Non-fatal
    }
  });
}

// ─── Full client teardown ─────────────────────────────────────────────────────
/**
 * Wipes all client-side auth state. Call from every logout path.
 * Navigation is the caller's responsibility.
 *
 * After this runs:
 *   - React Query cache is empty
 *   - Redux auth + notifications are reset to initial unauthenticated state
 *   - In-memory CSRF token is cleared
 *   - localStorage logout marker is set → bootstrap will skip /me until new login
 *   - 401 interceptor is blocked from attempting token refresh
 */
export async function clearClientAuthState(
  queryClient: QueryClient,
  dispatch: AppDispatch,
): Promise<void> {
  // Block the 401 interceptor from silently refreshing during teardown.
  setLogoutInProgress(true);

  // Cancel in-flight queries before clearing so they don't write stale data.
  await queryClient.cancelQueries();

  // Wipe the entire React Query cache.
  queryClient.clear();

  // Clear in-memory CSRF token.
  clearCsrfToken();

  // Remove auth residue from both storages (does NOT touch the logout marker).
  scrubStorage(localStorage);
  scrubStorage(sessionStorage);

  // Write the logout marker AFTER scrubbing so it isn't removed by scrubStorage.
  // This marker lives in localStorage and blocks /me bootstrap on next page load.
  markLoggedOut();

  // Reset Redux slices.
  dispatch(resetAuth());
  dispatch(resetNotifications());

  // Re-enable the refresh interceptor after navigation has settled.
  setTimeout(() => setLogoutInProgress(false), 2000);
}
