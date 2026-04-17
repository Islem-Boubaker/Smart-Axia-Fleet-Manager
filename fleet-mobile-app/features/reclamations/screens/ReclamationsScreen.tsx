import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";
import FilterChips from "../components/FilterChips";
import ReclamationCard from "../components/ReclamationCard";
import ReclamationStats from "../components/ReclamationStats";
import SectionHeader from "../components/SectionHeader";
import { useReclamation } from "../hooks/useReclamation";
import BackButton from "@/shared/components/ui/BackButton";
import RefreshButton from "@/shared/components/ui/RefreshButton";

// ─── Types ────────────────────────────────────────────────────────
type ReclamationStatus = "pending" | "in_progress" | "resolved";
type ReclamationType = "damage" | "delay" | "technical" | "other";
type FilterOption = "all" | ReclamationStatus;

interface Reclamation {
  id: string;
  title: string;
  description: string;
  status: ReclamationStatus;
  type: ReclamationType;
  date: string;
  images: string[];
}

const toScreenReclamation = (item: any): Reclamation => ({
  id: String(item.id),
  title: item.subject ?? "Untitled",
  description: item.message ?? "",
  status:
    item.status === "resolved" ||
    item.status === "in_progress" ||
    item.status === "pending"
      ? item.status
      : "pending",
  type:
    item.type === "damage" ||
    item.type === "delay" ||
    item.type === "technical" ||
    item.type === "other"
      ? item.type
      : "other",
  date: item.createdAt ?? new Date().toISOString(),
  images: Array.isArray(item.images)
    ? item.images.filter((img: unknown): img is string => typeof img === "string" && img.trim().length > 0)
    : [],
});

// ─── Config ───────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    badgeClass: "bg-amber-100",
    textClass: "text-amber-700",
    borderColor: "#F59E0B",
  },
  in_progress: {
    label: "In Progress",
    badgeClass: "bg-blue-100",
    textClass: "text-blue-700",
    borderColor: "#3B82F6",
  },
  resolved: {
    label: "Resolved",
    badgeClass: "bg-emerald-100",
    textClass: "text-emerald-700",
    borderColor: "#10B981",
  },
};

const TYPE_CONFIG = {
  damage: { label: "Damage", icon: "directions-car" },
  delay: { label: "Delay", icon: "schedule" },
  technical: { label: "Technical", icon: "build" },
  other: { label: "Other", icon: "report-problem" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
];

// ─── Screen ───────────────────────────────────────────────────────
export default function ReclamationsScreen() {
  const router = useRouter();
  const { getAllReclamations } = useReclamation();

  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchReclamations = useCallback(async () => {
    try {
      setError(null);
      const data = await getAllReclamations();
      setReclamations((data ?? []).map(toScreenReclamation));
    } catch (err: any) {
      setError(err?.message ?? "Failed to load reclamations");
    } finally {
      // ✅ Always runs — turns off both spinner and pull-to-refresh
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [getAllReclamations]);

  // Re-fetch every time this tab is focused
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchReclamations();
    }, [fetchReclamations]),
  );

  // Pull-to-refresh — does NOT show full-screen spinner
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchReclamations();
  }, [fetchReclamations]);

  // ── Derived ────────────────────────────────────────────────────
  const filtered =
    activeFilter === "all"
      ? reclamations
      : reclamations.filter((r) => r.status === activeFilter);

  const countOf = (status: ReclamationStatus) =>
    reclamations.filter((r) => r.status === status).length;

  // ── Full-screen spinner on first load only ─────────────────────
  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />

      {/* ── Header ── */} 
      <View className="px-5  pb-3" style={{ paddingTop: Platform.OS === "ios" ? 8 : 0 }}>
        <View className="flex-row items-center justify-between">
          {/* Left: Back */}
          <BackButton />

          {/* Center: Title */}
          <View className="flex-1 items-center">
            <Text className="text-xl font-extrabold text-slate-900">
              Reports
            </Text>
            <Text className="text-xs text-gray-400 mt-0.5">
              {reclamations.length} total reclamations
            </Text>
          </View>

          <RefreshButton onRefresh={handleRefresh} />
        </View>
      </View>

      {/* ── Filters ── */}
      <View style={{ height: 52 }}>
        <FilterChips
          filters={FILTERS}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />
      </View>

      {/* ── Stats ── */}
      <ReclamationStats countOf={countOf} />

      {/* ── Section header ── */}
      <SectionHeader onViewAll={() => setActiveFilter("all")} />

      {/* ── Error banner ── */}
      {error && (
        <View className="mx-5 mb-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex-row items-center gap-2">
          <MaterialIcons name="error-outline" size={16} color="#EF4444" />
          <Text className="text-xs text-red-600 flex-1">{error}</Text>
          <TouchableOpacity onPress={fetchReclamations}>
            <Text className="text-xs font-bold text-red-500">Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── List ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 90 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#2D9B6F"
            colors={["#2D9B6F"]}
          />
        }
      >
        {filtered.length === 0 ? (
          <View className="items-center py-16">
            <MaterialIcons name="inbox" size={52} color="#D1D5DB" />
            <Text className="text-sm text-gray-400 mt-3">
              No reclamations found
            </Text>
          </View>
        ) : (
          filtered.map((item) => (
            <ReclamationCard
              key={item.id}
              item={item}
              config={STATUS_CONFIG}
              typeConfig={TYPE_CONFIG}
              onPress={() =>
                router.push({
                  pathname: "/reclamations/[id]",
                  params: {
                    id: item.id,
                    reclamation: JSON.stringify({
                      id: item.id,
                      subject: item.title,
                      message: item.description,
                      status: item.status,
                      images: item.images,
                      createdAt: item.date,
                    }),
                  },
                })
              }
            />
          ))
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        className="absolute bottom-5 right-5 w-14 h-14 rounded-full bg-emerald-500 items-center justify-center"
        style={{
          elevation: 6,
          shadowColor: "#10B981",
          shadowOpacity: 0.4,
          shadowRadius: 12,
        }}
        onPress={() => router.push("/reclamations/create")}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

ReclamationsScreen.displayName = "ReclamationsScreen";
