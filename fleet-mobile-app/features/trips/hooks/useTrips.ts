import { useEffect } from 'react';

import { useSelector } from 'react-redux';
import { useRouter, useSegments } from 'expo-router';
import type { RootState } from '@/store';

export function useAuthGuard() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const router   = useRouter();
  const segments = useSegments(); // ['(tabs)', 'home'] for example

  useEffect(() => {
    if (isLoading) return; // wait until we know auth state

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // not logged in → send to login
      router.replace('/(auth)/login');
    }

    if (isAuthenticated && inAuthGroup) {
      // already logged in → send to app
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isLoading, segments]);
}