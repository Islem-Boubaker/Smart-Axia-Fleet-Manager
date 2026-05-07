import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "@/shared/theme/ThemeProvider";

export default function TabsLayout() {
  const { isDark } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? "#93C5FD" : "#1F63E0",
        tabBarInactiveTintColor: isDark ? "#64748B" : "#94A3B8",
        sceneStyle: {
          backgroundColor: isDark ? "#0B1220" : "#F3F4F6",
        },
        tabBarStyle: {
          position: "absolute",
          left: 20,
          right: 20,
          bottom: 10,
          borderRadius: 22,
          backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
          borderTopColor: "transparent",
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: isDark ? "#1E293B" : "#E2E8F0",
          height: 74,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 10,
          shadowColor: "#0F172A",
          shadowOpacity: isDark ? 0.35 : 0.12,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="trips"
        options={{
          title: t("tabs.trips"),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="directions-car" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="reclamations"
        options={{
          title: t("tabs.reports"),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="error-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

TabsLayout.displayName = 'TabsLayout';
