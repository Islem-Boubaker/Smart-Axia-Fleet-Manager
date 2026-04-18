import { api } from '../../../shared/services/api';

export type ReclamationStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface ReclamationRecord {
  id: string;
  subject: string;
  message: string;
  status: ReclamationStatus;
  userId: string;
  vehicleId?: string | null;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

interface ReclamationsResponsePayload {
  success: boolean;
  total: number;
  page: number;
  pages: number;
  data: ReclamationRecord[];
}

interface ReclamationDetailPayload {
  success: boolean;
  data: ReclamationRecord;
}

export const reclamationsService = {
  async getAll(page = 1, limit = 50) {
    const response = await api.get<ReclamationsResponsePayload>('/reclamations', {
      params: { page, limit },
    });

    return {
      items: response.data.data ?? [],
      total: response.data.total ?? 0,
      page: response.data.page ?? page,
      pages: response.data.pages ?? 1,
    };
  },

  async getById(id: string) {
    const response = await api.get<ReclamationDetailPayload>(`/reclamations/${id}`);
    return response.data.data;
  },
};

export default reclamationsService;
