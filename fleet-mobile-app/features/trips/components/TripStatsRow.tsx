import { View, Text } from "react-native";
import type { Trip } from "../types/trip.types";

interface Props {
  trips: Trip[];
}

const STATS = [
  { key: "pending",   label: "PENDING",   fill: "#F59E0B", track: "#FEF3C7" },
  { key: "completed", label: "DONE",      fill: "#10B981", track: "#D1FAE5" },
] as const;

export function TripStatsRow({ trips }: Props) {
  const total = trips.length || 1;

  return (
    <View className="flex-row gap-2.5 px-5 pt-4 mb-4">
      {STATS.map(({ key, label, fill, track }) => {
        const count = trips.filter((t) => t.status === key).length;
        const pct = (count / total) * 100;

        return (
          <View
            key={key}
            className="flex-1 bg-white dark:bg-slate-900 rounded-2xl px-3  py-2.5 border border-gray-100 dark:border-slate-700"
            style={{ elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4 }}
          >
            <Text className="text-lg font-extrabold text-slate-900 dark:text-gray-50">{count}</Text>
            <Text className="text-[9px] font-bold text-gray-400 dark:text-slate-400 tracking-wide mt-0.5">
              {label}
            </Text>
            {/* Mini progress bar */}
            <View
              className="h-[3px] rounded-full mt-1.5 overflow-hidden"
              style={{ backgroundColor: track }}
            >
              <View
                style={{ width: `${pct}%`, height: "100%", backgroundColor: fill, borderRadius: 2 }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

TripStatsRow.displayName = "TripStatsRow";