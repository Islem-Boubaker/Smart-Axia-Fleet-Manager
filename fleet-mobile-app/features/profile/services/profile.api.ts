import api from "../../../services/api";

export const vehicleApi = {
  getAssignedVehicle: async () => {
    const { data } = await api.get("/vehicles/assigned");
    return data;
  },
};