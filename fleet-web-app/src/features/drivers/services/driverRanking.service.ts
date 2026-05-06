import { api } from '../../../shared/services/api';

export interface DriverExperienceBadge {
  key: string;
  label: string;
  minTrips: number;
}

export interface DriverLeaderboardEntry {
  rank: number;
  score: number;
  completedTrips: number;
  recentDelta: number;
  badge: DriverExperienceBadge;
  driver: {
    id: string;
    name: string;
    email?: string;
    avatar?: string | null;
  };
}

export interface DriverRankingEvent {
  id: string;
  eventType: string;
  pointsDelta: number;
  scoreAfter: number;
  occurredAt: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface DriverRankingProfile {
  rank: number;
  leaderboardSize: number;
  score: number;
  completedTrips: number;
  eventCount: number;
  badge: DriverExperienceBadge;
  recentEvents: DriverRankingEvent[];
  trend: DriverRankingEvent[];
  driver: {
    id: string;
    name: string;
    email?: string;
    avatar?: string | null;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const driverRankingService = {
  async getLeaderboard(limit = 10): Promise<DriverLeaderboardEntry[]> {
    const response = await api.get<ApiResponse<DriverLeaderboardEntry[]>>('/user/driver-leaderboard', {
      params: { limit },
    });
    return response.data.data ?? [];
  },
  async getMyRanking(): Promise<DriverRankingProfile> {
    const response = await api.get<ApiResponse<DriverRankingProfile>>('/user/me/ranking');
    return response.data.data;
  },
};
