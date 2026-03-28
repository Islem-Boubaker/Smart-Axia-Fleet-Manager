import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import FilterChips from "../components/FilterChips";
import ReclamationCard from "../components/ReclamationCard";
import ReclamationStats from "../components/ReclamationStats";
import SectionHeader from "../components/SectionHeader";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";

// ─── Types ────────────────────────────────────────────────────────
type ReclamationStatus = "pending" | "in_progress" | "resolved";
type ReclamationType   = "damage" | "delay" | "technical" | "other";
type FilterOption      = "all" | ReclamationStatus;

interface Reclamation {
  id: string;
  title: string;
  description: string;
  status: ReclamationStatus;
  type: ReclamationType;
  date: string;
}

// ─── Mock data (replace with API hook) ───────────────────────────
const MOCK_RECLAMATIONS: Reclamation[] = [
  { id: "1", title: "Vehicle damage", description: "Minor scratch on right door", status: "pending",     type: "damage",    date: "2026-03-15" },
  { id: "2", title: "Late arrival",   description: "Trip delayed 30 minutes",     status: "in_progress", type: "delay",     date: "2026-03-14" },
  { id: "3", title: "Fuel issue",     description: "Fuel gauge malfunction",       status: "resolved",    type: "technical", date: "2026-03-10" },
];

// ─── Config ───────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:     { label: "Pending",     badgeClass: "bg-amber-100",   textClass: "text-amber-700",   borderColor: "#F59E0B" },
  in_progress: { label: "In Progress", badgeClass: "bg-blue-100",    textClass: "text-blue-700",    borderColor: "#3B82F6" },
  resolved:    { label: "Resolved",    badgeClass: "bg-emerald-100", textClass: "text-emerald-700", borderColor: "#10B981" },
};

const TYPE_CONFIG = {
  damage:    { label: "Damage",    icon: "directions-car" },
  delay:     { label: "Delay",     icon: "schedule"       },
  technical: { label: "Technical", icon: "build"          },
  other:     { label: "Other",     icon: "report-problem" },
};

const FILTERS = [
  { key: "all",         label: "All"         },
  { key: "pending",     label: "Pending"     },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved",    label: "Resolved"    },
];

// ─── Screen ───────────────────────────────────────────────────────
export default function ReclamationsScreen() {
  const router = useRouter();

  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [isLoading, setIsLoading]       = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchReclamations = async () => {
    try {
      setError(null);

      // ── MOCK: simulate network delay ──
      await new Promise((r) => setTimeout(r, 400));
      setReclamations(MOCK_RECLAMATIONS);

      // ── REAL API (uncomment when ready) ──
      // const data = await reclamationsApi.getAll();
      // setReclamations(data ?? []);

    } catch (err: any) {
      setError(err?.message ?? "Failed to load reclamations");
    } finally {
      // ✅ Always runs — turns off both spinner and pull-to-refresh
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Re-fetch every time this tab is focused
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchReclamations();
    }, [])
  );

  // Pull-to-refresh — does NOT show full-screen spinner
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchReclamations();
  };

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
      <View className="flex-row justify-between items-center px-5 pt-10 pb-2">
        <View>
          <Text className="text-2xl font-extrabold text-slate-900">Reports</Text>
          <Text className="text-xs text-gray-400 mt-0.5">
            {reclamations.length} total reclamations
          </Text>
        </View>
        <TouchableOpacity
          className="w-9 h-9 rounded-xl bg-white items-center justify-center"
          style={{ elevation: 1, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4 }}
          onPress={handleRefresh}
        >
          <MaterialIcons name="refresh" size={20} color="#2D9B6F" />
        </TouchableOpacity>
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
            <Text className="text-sm text-gray-400 mt-3">No reclamations found</Text>
          </View>
        ) : (
          filtered.map((item) => (
            <ReclamationCard
              key={item.id}
              item={item}
              config={STATUS_CONFIG}
              typeConfig={TYPE_CONFIG}
              onPress={() => router.push(`/reclamations/${item.id}`)}
            />
          ))
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        className="absolute bottom-5 right-5 w-14 h-14 rounded-full bg-emerald-500 items-center justify-center"
        style={{ elevation: 6, shadowColor: "#10B981", shadowOpacity: 0.4, shadowRadius: 12 }}
        onPress={() => router.push("/reclamations/create")}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

ReclamationsScreen.displayName = "ReclamationsScreen";