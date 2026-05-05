import React, { useMemo } from "react";
import { Text, View } from "react-native";
import { Award, Crown, TrendingUp, Trophy } from "lucide-react-native";

import type { DriverRankingProfile } from "../services/profile.api";

type RankingSectionProps = {
  ranking: DriverRankingProfile | null;
};

const formatDelta = (value: number) => `${value > 0 ? "+" : ""}${value}`;

export default function RankingSection({ ranking }: RankingSectionProps) {
  const trendPoints = useMemo(() => {
    if (!ranking?.trend?.length) return [];
    const maxScore = Math.max(...ranking.trend.map((point) => point.scoreAfter), 100);
    return ranking.trend.map((point) => ({
      ...point,
      height: Math.max(16, Math.round((point.scoreAfter / maxScore) * 68)),
    }));
  }, [ranking]);

  if (!ranking) {
    return null;
  }

  return (
    <View className="mx-4 mt-2 mb-2 rounded-3xl bg-white border border-gray-200 px-4 py-4 dark:bg-slate-900 dark:border-slate-700 shadow-card">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-gray-900 text-base font-semibold dark:text-gray-100">
            Driver ranking
          </Text>
          <Text className="text-gray-500 text-xs mt-0.5 dark:text-slate-400">
            Lifetime score and experience badge
          </Text>
        </View>
        <View className="rounded-2xl bg-amber-100 px-3 py-2 dark:bg-amber-500/15">
          <Text className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
            {ranking.badge.label}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-3xl bg-[#EEF4FF] px-4 py-4 dark:bg-slate-800">
          <View className="flex-row items-center gap-2">
            <Trophy size={16} color="#2563EB" />
            <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Score
            </Text>
          </View>
          <Text className="mt-3 text-3xl font-extrabold text-slate-950 dark:text-white">
            {ranking.score}/100
          </Text>
        </View>

        <View className="flex-1 rounded-3xl bg-[#F7F3FF] px-4 py-4 dark:bg-slate-800">
          <View className="flex-row items-center gap-2">
            <Crown size={16} color="#7C3AED" />
            <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Rank
            </Text>
          </View>
          <Text className="mt-3 text-3xl font-extrabold text-slate-950 dark:text-white">
            #{ranking.rank}
          </Text>
          <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            out of {ranking.leaderboardSize}
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row gap-3">
        <View className="flex-1 rounded-3xl bg-[#F8FAFC] px-4 py-4 dark:bg-slate-800">
          <View className="flex-row items-center gap-2">
            <Award size={16} color="#0F172A" />
            <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Completed trips
            </Text>
          </View>
          <Text className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">
            {ranking.completedTrips}
          </Text>
        </View>

        <View className="flex-1 rounded-3xl bg-[#F0FDF4] px-4 py-4 dark:bg-slate-800">
          <View className="flex-row items-center gap-2">
            <TrendingUp size={16} color="#16A34A" />
            <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Score events
            </Text>
          </View>
          <Text className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">
            {ranking.eventCount}
          </Text>
        </View>
      </View>

      <View className="mt-4 rounded-3xl bg-slate-50 px-4 py-4 dark:bg-slate-800/90">
        <Text className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Score trend
        </Text>
        {trendPoints.length > 0 ? (
          <View className="mt-4 flex-row items-end gap-2">
            {trendPoints.map((point) => (
              <View key={point.id} className="flex-1 items-center">
                <View
                  className="w-full rounded-t-2xl bg-blue-500"
                  style={{ height: point.height }}
                />
                <Text className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                  {point.scoreAfter}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            No score changes recorded yet.
          </Text>
        )}
      </View>

      <View className="mt-4 rounded-3xl bg-slate-50 px-4 py-4 dark:bg-slate-800/90">
        <Text className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Recent score changes
        </Text>
        {ranking.recentEvents.length > 0 ? (
          <View className="mt-3 gap-3">
            {ranking.recentEvents.map((event) => (
              <View key={event.id} className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-sm text-slate-900 dark:text-slate-100">
                    {event.reason}
                  </Text>
                  <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {new Date(event.occurredAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text className={`text-sm font-bold ${event.pointsDelta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatDelta(event.pointsDelta)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            No score changes recorded yet.
          </Text>
        )}
      </View>
    </View>
  );
}
