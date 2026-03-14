import "../index.css";
import { useEffect } from "react";
import { Slot } from "expo-router";
import { Provider, useDispatch, useSelector } from "react-redux";
import * as SecureStore from "expo-secure-store";
import { View, ActivityIndicator } from "react-native";

import { store } from "../store/index";
import type { RootState, AppDispatch } from "../store";
import { setUser, clearUser } from "../store/authSlice";
import { useAuthGuard } from "../features/auth/hooks/useAuth";

function AppLayout() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.auth);

  useAuthGuard();

  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        const userStr = await SecureStore.getItemAsync("user");

        if (token && userStr) {
          dispatch(setUser(JSON.parse(userStr)));
        } else {
          dispatch(clearUser());
        }
      } catch {
        dispatch(clearUser());
      }
    };

    checkAuth();
  }, [dispatch]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppLayout />
    </Provider>
  );
}