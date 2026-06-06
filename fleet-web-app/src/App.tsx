import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import AppRouter from './app/router';
import { authAPI } from './features/auth/services/auth.service';
import { setUser, resetAuth } from './store/authSlice';
import { useAppDispatch } from './shared/hooks';
import { clearClientAuthState, isLoggedOutLocally } from './shared/services/authCleanup';
import { useWebPushRegistration } from './shared/hooks/useWebPushRegistration';

// ── i18n → document dir/lang sync ────────────────────────────────────────────
function I18nDocumentSync() {
  const { i18n } = useTranslation();
  useEffect(() => {
    const lng = (i18n.language || 'en').split('-')[0] || 'en';
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language || 'en';
  }, [i18n.language]);
  return null;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  useWebPushRegistration();
  // Guards against React StrictMode double-invocation: the ref is NOT reset
  // when React unmounts + remounts the component in dev mode, so the bootstrap
  // runs exactly once per real page load regardless of the React version or mode.
  const bootstrapRan = useRef(false);

  useEffect(() => {
    if (bootstrapRan.current) return;
    bootstrapRan.current = true;

    const restoreSession = async () => {
      // ── Logout marker check ─────────────────────────────────────────────────
      // If the user explicitly logged out (marker written by clearClientAuthState),
      // skip /me entirely. The marker lives in localStorage and is only cleared
      // by a new successful ADMIN login — not here — so it survives:
      //   • manual refresh in the same tab
      //   • opening a new tab
      //   • React StrictMode double effect invocation
      if (isLoggedOutLocally()) {
        dispatch(resetAuth());
        return;
      }

      // ── /me bootstrap ───────────────────────────────────────────────────────
      try {
        const user = await authAPI.getMe();

        // Reject non-admin users at the bootstrap level.
        if (user.role?.toLowerCase() !== 'admin') {
          await clearClientAuthState(queryClient, dispatch);
          return;
        }

        dispatch(setUser(user));
      } catch {
        // /me failed (401, network error, etc.) — user is not authenticated.
        dispatch(resetAuth());
      }
    };

    void restoreSession();
  }, [dispatch, queryClient]);

  return (
    <>
      <I18nDocumentSync />
      <AppRouter />
    </>
  );
}
