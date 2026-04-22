import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { authAPI } from './features/auth/services/auth.service';
import { setUser, clearUser } from './store/authSlice';
import { queryKeys } from './shared/services/queryKeys';
import AppRouter from './app/router.tsx';

export default function App() {
  const dispatch = useDispatch();

  const authQuery = useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: authAPI.getCurrentUser,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (authQuery.isSuccess && authQuery.data) {
      dispatch(setUser(authQuery.data as any));
      return;
    }

    if (authQuery.isError) {
      dispatch(clearUser());
    }
  }, [authQuery.data, authQuery.isError, authQuery.isSuccess, dispatch]);

  return <AppRouter />;
}







