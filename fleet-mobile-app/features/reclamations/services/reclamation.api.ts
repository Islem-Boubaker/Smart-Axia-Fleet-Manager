import { api } from "@/shared/services/api";
import type {
    CreateReclamationData,
    Reclamation,
    ReclamationDetails,
    UpdateReclamationData,
} from "../types/reclamation.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Reclamation (complaint/issue reporting) API service
 */
export const reclamationApi = {
  /**
   * Fetch all reclamations for the current driver
   */
  getAllReclamations: async (): Promise<Reclamation[]> => {
    const response =
      await api.get<ApiResponse<Reclamation[]>>("/my/reclamations");
    return response.data.data;
  },

  /**
   * Fetch details of a specific reclamation
   */
  getReclamationDetail: async (
    reclamationId: string,
  ): Promise<ReclamationDetails> => {
    const response = await api.get<ApiResponse<ReclamationDetails>>(
      `/my/reclamations/${reclamationId}`,
    );
    return response.data.data;
  },

  /**
   * Create a new reclamation (complaint)
   */
  createReclamation: async (
    data: CreateReclamationData,
  ): Promise<Reclamation> => {
    const endpoint = data.vehicleId ? "/reclamations/vehicle" : "/reclamations";
    const response = await api.post<ApiResponse<Reclamation>>(endpoint, data);
    return response.data.data;
  },

  /**
   * Update owned reclamation
   */
  updateReclamation: async (
    reclamationId: string,
    updates: UpdateReclamationData,
  ): Promise<Reclamation> => {
    const response = await api.put<ApiResponse<Reclamation>>(
      `/my/reclamations/${reclamationId}`,
      updates,
    );
    return response.data.data;
  },

  deleteReclamation: async (reclamationId: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/my/reclamations/${reclamationId}`);
  },

  uploadAttachments: async (
    reclamationId: string,
    images: File[],
  ): Promise<ReclamationDetails> => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append("images", image);
    });

    const response = await api.put<ApiResponse<ReclamationDetails>>(
      `/${reclamationId}/attachments`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data.data;
  },
};
