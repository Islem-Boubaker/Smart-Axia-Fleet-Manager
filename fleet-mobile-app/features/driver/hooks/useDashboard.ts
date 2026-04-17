import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { tokenStorage } from "@/features/auth/services/tokenStorage";
import { resolveApiBaseUrl } from "@/shared/utils/apiBase";
import type { RootState } from "@/store";
import { clearUser } from "@/store/slices/authSlice";

import type { DashboardData, Trip } from "../types/driver.types";

type TripsApiPayload = {
  data?: Trip[];
  meta?: {
    totalItems?: number;
  };
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

type UnreadCountPayload = {
  count?: number;
};

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Failed to load dashboard data";
}

export function useDashboard(): DashboardData {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const reduxToken = useSelector((state: RootState) => (state as RootState & { auth: { token?: string } }).auth.token);

  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [upcomingTrip, setUpcomingTrip] = useState<Trip | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const baseUrl = useMemo(() => resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL), []);

  const fetchJson = useCallback(
    async <T,>(path: string): Promise<T> => {
      const accessToken = reduxToken ?? (await tokenStorage.getAccessToken()) ?? "";
      const response = await fetch(`${baseUrl}${path}`, {
        method: "GET",
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        dispatch(clearUser());
        router.replace("/(auth)/login");
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) {
        throw new Error(`Request failed (${response.status}) for ${path}`);
      }

      const payload = (await response.json()) as ApiEnvelope<T>;
      return payload.data;
    },
    [baseUrl, dispatch, reduxToken, router],
  );

  const refetch = useCallback(async () => {
    if (!isMountedRef.current || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const [scheduledPayload, ongoingPayload, completedPayload, unreadPayload] =
        await Promise.all([
          fetchJson<TripsApiPayload>("/trips?page=1&limit=10&status=scheduled"),
          fetchJson<TripsApiPayload>("/trips?page=1&limit=5&status=ongoing"),
          fetchJson<TripsApiPayload>("/trips?page=1&limit=10&status=completed"),
          fetchJson<UnreadCountPayload>("/notifications/unread-count"),
        ]);

      if (!isMountedRef.current) return;

      const scheduled = scheduledPayload?.data ?? [];
      const ongoing = ongoingPayload?.data ?? [];
      const completed = completedPayload?.data ?? [];

      setActiveTrip(ongoing[0] ?? null);
      setUpcomingTrip(scheduled[0] ?? null);
      setRecentTrips(completed.slice(0, 5));
      setCompletedCount(completedPayload?.meta?.totalItems ?? completed.length);
      setPendingCount(scheduledPayload?.meta?.totalItems ?? scheduled.length);
      setUnreadCount(unreadPayload?.count ?? 0);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(readErrorMessage(err));
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [fetchJson]);

  useEffect(() => {
    isMountedRef.current = true;
    void refetch();
    return () => {
      isMountedRef.current = false;
    };
  }, [refetch]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  return {
    user,
    activeTrip,
    upcomingTrip,
    recentTrips,
    completedCount,
    pendingCount,
    unreadCount,
    isLoading,
    error,
    refetch,
  };
}
