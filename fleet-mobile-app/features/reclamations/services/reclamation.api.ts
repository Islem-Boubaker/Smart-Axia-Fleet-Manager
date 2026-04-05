import { api } from '@/shared/services/api';
import type { Reclamation, ReclamationDetails, CreateReclamationData } from '../types/reclamation.types';

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
    const response = await api.get<ApiResponse<Reclamation[]>>('/reclamations');
    return response.data.data;
  },

  /**
   * Fetch details of a specific reclamation
   */
  getReclamationDetail: async (reclamationId: string): Promise<ReclamationDetails> => {
    const response = await api.get<ApiResponse<ReclamationDetails>>(`/reclamations/${reclamationId}`);
    return response.data.data;
  },

  /**
   * Create a new reclamation (complaint)
   */
  createReclamation: async (data: CreateReclamationData): Promise<Reclamation> => {
    const response = await api.post<ApiResponse<Reclamation>>('/reclamations', data);
    return response.data.data;
  },

  /**
   * Update reclamation status
   */
  updateReclamationStatus: async (reclamationId: string, status: string): Promise<Reclamation> => {
    const response = await api.patch<ApiResponse<Reclamation>>(`/reclamations/${reclamationId}`, {
      status,
    });
    return response.data.data;
  },
};
