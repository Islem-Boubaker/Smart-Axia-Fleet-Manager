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

import { useTranslation } from "react-i18next";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";
import FilterChips from "../components/FilterChips";
import ReclamationCard from "../components/ReclamationCard";
import ReclamationStats from "../components/ReclamationStats";
import SectionHeader from "../components/SectionHeader";
import { useReclamation } from "../hooks/useReclamation";
import { useAppTheme } from "@/shared/theme/ThemeProvider";
import MainTopHeader from "@/shared/components/layout/MainTopHeader";

// ─── Types ────────────────────────────────────────────────────────
type ReclamationStatus = "pending" | "in_progress" | "resolved";
type ReclamationType = "general" | "vehicle" | "maintenance" | "trip" | "accident" | "damage" | "delay" | "technical" | "other";
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

const toScreenReclamation = (item: any, untitled: string): Reclamation => ({
  id: String(item.id),
  title: item.subject ?? untitled,
  description: item.message ?? "",
  status:
    String(item.status ?? "").toLowerCase() === "resolved"
      ? "resolved"
      : String(item.status ?? "").toLowerCase().replace(/\s+/g, "_") === "in_progress"
        ? "in_progress"
        : String(item.status ?? "").toLowerCase() === "pending"
          ? "pending"
      : "pending",
  type:
    item.type === "general" ||
    item.type === "vehicle" ||
    item.type === "maintenance" ||
    item.type === "trip" ||
    item.type === "accident" ||
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
    badgeClass: "bg-amber-100",
    textClass: "text-amber-700",
    borderColor: "#F59E0B",
  },
  in_progress: {
    badgeClass: "bg-blue-100",
    textClass: "text-blue-700",
    borderColor: "#3B82F6",
  },
  resolved: {
    badgeClass: "bg-emerald-100",
    textClass: "text-emerald-700",
    borderColor: "#10B981",
  },
};

const TYPE_CONFIG = {
  general: { icon: "report-problem" },
  vehicle: { icon: "directions-car" },
  maintenance: { icon: "build" },
  trip: { icon: "timeline" },
  accident: { icon: "car-crash" },
  damage: { icon: "directions-car" },
  delay: { icon: "schedule" },
  technical: { icon: "build" },
  other: { icon: "report-problem" },
};

// ─── Screen ───────────────────────────────────────────────────────
export default function ReclamationsScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { t } = useTranslation();
  const { getAllReclamations } = useReclamation();

  const statusConfig = {
    pending: { ...STATUS_CONFIG.pending, label: t("reclamations.status.pending") },
    in_progress: { ...STATUS_CONFIG.in_progress, label: t("reclamations.status.in_progress") },
    resolved: { ...STATUS_CONFIG.resolved, label: t("reclamations.status.resolved") },
  };

  const typeConfig = {
    general: { ...TYPE_CONFIG.general, label: t("reclamations.types.general") },
    vehicle: { ...TYPE_CONFIG.vehicle, label: t("reclamations.types.vehicle") },
    maintenance: { ...TYPE_CONFIG.maintenance, label: t("reclamations.types.maintenance") },
    trip: { ...TYPE_CONFIG.trip, label: t("reclamations.types.trip") },
    accident: { ...TYPE_CONFIG.accident, label: t("reclamations.types.accident") },
    damage: { ...TYPE_CONFIG.damage, label: t("reclamations.types.damage") },
    delay: { ...TYPE_CONFIG.delay, label: t("reclamations.types.delay") },
    technical: { ...TYPE_CONFIG.technical, label: t("reclamations.types.technical") },
    other: { ...TYPE_CONFIG.other, label: t("reclamations.types.other") },
  };

  const filters = [
    { key: "all", label: t("reclamations.filters.all") },
    { key: "pending", label: t("reclamations.filters.pending") },
    { key: "in_progress", label: t("reclamations.filters.in_progress") },
    { key: "resolved", label: t("reclamations.filters.resolved") },
  ];

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
      setReclamations((data ?? []).map((item) => toScreenReclamation(item, t("reclamations.untitled"))));
    } catch (err: any) {
      setError(err?.message ?? t("reclamations.failedToLoad"));
    } finally {
      // ✅ Always runs — turns off both spinner and pull-to-refresh
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [getAllReclamations, t]);

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
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-[#0B1220]">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0B1220" : "#F3F4F6"}
      />

      <MainTopHeader />

      <View className="px-5 pb-2" style={{ paddingTop: Platform.OS === "ios" ? 8 : 0 }} />

      {/* ── Filters ── */}
      <View style={{ height: 52 }}>
        <FilterChips
          filters={filters}
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
        <View className="mx-5 mb-3 bg-red-50 border border-red-200 rounded-3xl px-4 py-3 flex-row items-center gap-2">
          <MaterialIcons name="error-outline" size={16} color="#EF4444" />
          <Text className="text-xs text-red-600 flex-1">{error}</Text>
          <TouchableOpacity onPress={fetchReclamations}>
            <Text className="text-xs font-bold text-red-500">{t("shared.retry")}</Text>
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
            <Text className="text-sm text-gray-400 dark:text-slate-400 mt-3">
              {t("reclamations.noReclamationsFound")}
            </Text>
          </View>
        ) : (
          filtered.map((item) => (
            <ReclamationCard
              key={item.id}
              item={item}
              config={statusConfig}
              typeConfig={typeConfig}
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
                      type: item.type,
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
        className="absolute right-6 h-14 w-14 items-center justify-center rounded-3xl border border-white/20"
        style={{
          position: "absolute",
          bottom: Platform.OS === "ios" ? 112 : 102,
          backgroundColor: "#2563EB",
          elevation: 12,
          zIndex: 999,
          shadowColor: "#0F172A",
          shadowOpacity: 0.3,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
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
