import React, { useState } from "react";
import { TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type RefreshButtonProps = {
  onRefresh: () => Promise<void> | void;
};

export default function RefreshButton({ onRefresh }: RefreshButtonProps) {
  const [loading, setLoading] = useState(false);

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
      className="w-9 h-9 rounded-xl bg-white items-center justify-center"
      style={{
        elevation: 1,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 4,
      }}
      onPress={handleRefresh}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#2D9B6F" />
      ) : (
        <MaterialIcons name="refresh" size={20} color="#2D9B6F" />
      )}
    </TouchableOpacity>
  );
}