import type { User } from "@/features/auth/auth.types";
import { tripsApi } from "@/features/trips/services/trips.api";
import { api } from "@/shared/services/api";
import { clearCookies } from "@/shared/services/cookieJar";
import { clearCsrfToken } from "@/shared/services/csrf";
import { store } from "@/store";
import { clearUser } from "@/store/slices/authSlice";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const profileApi = {
  getCurrentUser: async (): Promise<User> => {
    const { data } = await api.get<ApiEnvelope<User>>("/user/me");
    return data.data;
  },
};

export const vehicleApi = {
  getAssignedVehicle: async () => {
    const active = await tripsApi.getActiveTrip();
    if (active) return { licensePlate: active.vehicle };

    const trips = await tripsApi.getAllTrips({ limit: 1, status: "scheduled" });
    if (!trips[0]) return null;

    return { licensePlate: trips[0].vehicle };
  },
};

export const logout = async (): Promise<void> => {
  await api.post<void>("/user/logout", {});

  await clearCookies();
  clearCsrfToken();
  store.dispatch(clearUser());
};
