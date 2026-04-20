import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme as useNativewindColorScheme } from "nativewind";

type AppTheme = "light" | "dark";

type ThemeContextValue = {
  theme: AppTheme;
  isDark: boolean;
  setTheme: (theme: AppTheme) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const STORAGE_KEY = "fleet.app.theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { setColorScheme } = useNativewindColorScheme();
  const [theme, setThemeState] = useState<AppTheme>("light");

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedTheme === "light" || savedTheme === "dark") {
          setThemeState(savedTheme);
          setColorScheme(savedTheme);
          return;
        }
      } catch {
        // Fall back to light mode on read failures.
      }
      setThemeState("light");
      setColorScheme("light");
    };

    void loadTheme();
  }, [setColorScheme]);

  const setTheme = useCallback(
    async (nextTheme: AppTheme) => {
      setThemeState(nextTheme);
      setColorScheme(nextTheme);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, nextTheme);
      } catch {
        // App can continue even if local persistence fails.
      }
    },
    [setColorScheme],
  );

  const toggleTheme = useCallback(async () => {
    await setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used inside ThemeProvider");
  }
  return context;
}
