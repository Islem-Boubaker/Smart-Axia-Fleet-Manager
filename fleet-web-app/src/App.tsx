import { useEffect } from "react";
import AppRouter from "./app/router";
import { authAPI } from "./features/auth/services/auth.service";
import { clearUser, setLoading, setUser } from "./store/authSlice";
import { useAppDispatch } from "./shared/hooks";

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        dispatch(setLoading(true));
        const user = await authAPI.getMe();
        if (mounted) dispatch(setUser(user));
      } catch {
        if (mounted) dispatch(clearUser());
      } finally {
        if (mounted) dispatch(setLoading(false));
      }
    };

    void restoreSession();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  return <AppRouter />;
}
