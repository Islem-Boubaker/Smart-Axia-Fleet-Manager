import { useEffect, useState } from "react";
import { vehicleApi } from "../services/profile.api";
import type { Vehicle } from "@/features/driver/types/driver.types";

interface ProfileState {
  vehicle: Vehicle | null;
  isLoading: boolean;
}

export function useProfile() {
  const [state, setState] = useState<ProfileState>({
    vehicle: null,
    isLoading: true,
  });

  useEffect(() => {
    const loadVehicle = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));
        const vehicle = await vehicleApi.getAssignedVehicle();
        setState({
          vehicle: vehicle || null,
          isLoading: false,
        });
      } catch {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadVehicle();
  }, []);

  return state;
}