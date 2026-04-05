import { api } from "@/shared/services/api";
import { clearSession } from "@/features/auth/services/auth.api";
import { store } from "@/store";
import { clearUser } from "@/store/slices/authSlice";
import {
  clearCookies,
} from "@/shared/services/cookieJar";


export const vehicleApi = {
  getAssignedVehicle: async () => {
    const { data } = await api.get("/vehicles/assigned");
    return data;
  },
};

export const logout = async (): Promise<void> => {
  await api.post<void>("/user/logout", {});

  await clearSession();
  await clearCookies(); 
  store.dispatch(clearUser());
};
