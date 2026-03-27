import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import FilterChips from "../components/FilterChips";
import ReclamationCard from "../components/ReclamationCard";
import ReclamationStats from "../components/ReclamationStats";
import SectionHeader from "../components/SectionHeader";

// ─── Types ─────────────────────────────────────────────
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
}

// ─── Mock data ─────────────────────────────────────────
const MOCK_RECLAMATIONS: Reclamation[] = [
  {
    id: "1",
    title: "Vehicle damage",
    description: "Minor scratch on right door",
    status: "pending",
    type: "damage",
    date: "2026-03-15",
  },
  {
    id: "2",
    title: "Late arrival",
    description: "Trip delayed 30 minutes",
    status: "in_progress",
    type: "delay",
    date: "2026-03-14",
  },
  {
    id: "3",
    title: "Fuel issue",
    description: "Fuel gauge malfunction",
    status: "resolved",
    type: "technical",
    date: "2026-03-10",
  },
];

// ─── Config ────────────────────────────────────────────
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

// ─── Screen ────────────────────────────────────────────
export default function ReclamationsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");

  const reclamations = MOCK_RECLAMATIONS;

  const filtered =
    activeFilter === "all"
      ? reclamations
      : reclamations.filter((r) => r.status === activeFilter);

  const countOf = (status: ReclamationStatus) =>
    reclamations.filter((r) => r.status === status).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <StatusBar barStyle="dark-content" />
      {/* HEADER */}
      <View style={{ paddingHorizontal: 20, paddingTop: 40 }}>
        <Text style={{ fontSize: 22, fontWeight: "800" }}>Reports</Text>
        <Text style={{ fontSize: 12, color: "#6B7280" }}>
          {reclamations.length} total reclamations
        </Text>
      </View>
      {/* FILTER */}
      <View style={{ height: 52 }}>
        <FilterChips
          filters={FILTERS}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />
      </View>
      {/* STATS */}
      <ReclamationStats countOf={countOf} />
      {/* SECTION HEADER */}
      <SectionHeader onViewAll={() => setActiveFilter("all")} />
      {/* LIST */}
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {filtered.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <MaterialIcons name="inbox" size={50} color="#ccc" />
            <Text>No reclamations found</Text>
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
      {/* FAB */}
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#10B981",
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={() => router.push("/reclamations/create")}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

ReclamationsScreen.displayName = 'ReclamationsScreen';
