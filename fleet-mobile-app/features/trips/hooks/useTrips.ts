import { useEffect } from 'react';

import { useSelector } from 'react-redux';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import type { RootState } from '@/store';

export function useAuthGuard() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const router   = useRouter();
  const segments = useSegments(); // ['(tabs)', 'home'] for example
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (isLoading) return; // wait until we know auth state
    if (!navigationState?.key) return;
    if (segments.length === 0) return;

    const inAuthGroup = segments[0] === '(auth)';

    const target = !isAuthenticated && !inAuthGroup
      ? '/(auth)/login'
      : isAuthenticated && inAuthGroup
        ? '/(tabs)/home'
        : null;

    if (!target) return;

    const timeout = setTimeout(() => {
      router.replace(target);
    }, 0);

    return () => clearTimeout(timeout);
  }, [isAuthenticated, isLoading, segments, router, navigationState?.key]);
}