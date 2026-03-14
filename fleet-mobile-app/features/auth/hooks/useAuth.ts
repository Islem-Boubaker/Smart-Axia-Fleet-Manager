import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter, useSegments } from 'expo-router';
import type { RootState } from '../../../store';

export function useAuthGuard() {
  const { isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    }

    if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isLoading, segments, router]);
}