import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { authAPI } from './features/auth/services/auth.service';
import { setUser, clearUser } from './store/authSlice';
import AppRouter from './app/router.tsx';

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Attempt to restore user session on mount
    const restoreSession = async () => {
      try {
        const user = await authAPI.getCurrentUser();
        dispatch(setUser(user as any));
      } catch (err) {
        // If there's no valid cookie or it failed, clear user
        dispatch(clearUser());
      }
    };

    restoreSession();
  }, [dispatch]);

  return <AppRouter />;
}







