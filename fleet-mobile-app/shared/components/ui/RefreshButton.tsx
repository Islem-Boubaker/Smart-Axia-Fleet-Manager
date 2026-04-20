import React, { useState } from "react";
import { TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAppTheme } from "@/shared/theme/ThemeProvider";

type RefreshButtonProps = {
  onRefresh: () => Promise<void> | void;
};

export default function RefreshButton({ onRefresh }: RefreshButtonProps) {
  const [loading, setLoading] = useState(false);
  const { isDark } = useAppTheme();

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 items-center justify-center"
      style={{
        elevation: 3,
        shadowColor: "#0F172A",
        shadowOpacity: isDark ? 0.25 : 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      }}
      onPress={handleRefresh}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isDark ? "#93C5FD" : "#1F63E0"} />
      ) : (
        <MaterialIcons name="refresh" size={20} color={isDark ? "#93C5FD" : "#1F63E0"} />
      )}
    </TouchableOpacity>
  );
}
