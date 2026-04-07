import { api } from '../../../shared/services/api';
import type { ApiResponse, Maintenance } from '../../../types';

type BackendMaintenance = {
  id: string;
  vehiclePlate: string;
  scheduledDate: string;
  technician: string;
  cost: number;
  mileage: number | null;
  priority: 'low' | 'medium' | 'high';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  type: string | null;
  createdAt?: string;
  updatedAt?: string;
};

function unwrapApiResponse<T>(payload: ApiResponse<T> | T): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return (payload as ApiResponse<T>).data;
  }
  return payload as T;
}

function normalizeStatus(status: BackendMaintenance['status'] | string): string {
  return String(status).replace(/_/g, '-');
}

function normalizeDate(value: string): string {
  // UI expects YYYY-MM-DD
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toISOString().slice(0, 10);
}

function mapBackendToUi(record: BackendMaintenance): Maintenance {
  return {
    id: record.id,
    vehicle: record.vehiclePlate,
    type: record.type ?? '',
    description: '',
    scheduledDate: normalizeDate(record.scheduledDate),
    completedDate: null,
    status: normalizeStatus(record.status),
    mileage: record.mileage ?? 0,
    cost: String(record.cost ?? ''),
    technician: record.technician,
    priority: record.priority,
  };
}

function toBackendPayload(data: Partial<Maintenance>): Partial<BackendMaintenance> {
  const payload: Partial<BackendMaintenance> = {};

  if (typeof data.vehicle === 'string') payload.vehiclePlate = data.vehicle;
  // @ts-ignore - map vehicleId as vehiclePlate for backward compatibility with form data
  if (typeof data.vehicleId === 'string' && data.vehicleId.length > 0) payload.vehiclePlate = data.vehicleId;
  if (typeof data.type === 'string') payload.type = data.type;
  if (typeof data.scheduledDate === 'string') payload.scheduledDate = data.scheduledDate;
  if (typeof data.technician === 'string') payload.technician = data.technician;
  if (typeof data.priority === 'string') payload.priority = data.priority as BackendMaintenance['priority'];
  if (typeof data.status === 'string') {
    payload.status = data.status.replace(/-/g, '_') as BackendMaintenance['status'];
  }

  if (data.cost !== undefined) {
    const costNum = typeof data.cost === 'number' ? data.cost : Number(String(data.cost).trim());
    if (Number.isFinite(costNum)) payload.cost = costNum;
  }

  if (data.mileage !== undefined) {
    const mileageNum = typeof data.mileage === 'number' ? data.mileage : Number.parseInt(String(data.mileage).trim(), 10);
    if (Number.isFinite(mileageNum)) payload.mileage = mileageNum;
  }

  return payload;
}

export const maintenanceService = {
  getAll: async (): Promise<Maintenance[]> => {
    const res = await api.get<ApiResponse<BackendMaintenance[]> | BackendMaintenance[]>(
      '/maintenances'
    );
    const data = unwrapApiResponse(res.data);
    return Array.isArray(data) ? data.map(mapBackendToUi) : [];
  },

  getById: async (id: string): Promise<Maintenance> => {
    const res = await api.get<ApiResponse<BackendMaintenance> | BackendMaintenance>(
      `/maintenances/${id}`
    );
    const data = unwrapApiResponse(res.data);
    return mapBackendToUi(data as BackendMaintenance);
  },

  create: async (data: Partial<Maintenance>): Promise<Maintenance> => {
    const res = await api.post<ApiResponse<BackendMaintenance> | BackendMaintenance>(
      '/maintenances',
      toBackendPayload(data)
    );
    const created = unwrapApiResponse(res.data);
    return mapBackendToUi(created as BackendMaintenance);
  },

  update: async (id: string, data: Partial<Maintenance>): Promise<Maintenance> => {
    const res = await api.put<ApiResponse<BackendMaintenance> | BackendMaintenance>(
      `/maintenances/${id}`,
      toBackendPayload(data)
    );
    const updated = unwrapApiResponse(res.data);
    return mapBackendToUi(updated as BackendMaintenance);
  },

  remove: (id: string) =>
    api.delete(`/maintenances/${id}`), 
    
  updateStatus: async (id: string, status: string): Promise<Maintenance> => {
    const res = await api.patch<ApiResponse<BackendMaintenance> | BackendMaintenance>(
      `/maintenances/${id}/status`,
      { status: status.replace(/-/g, '_') }
    );
    const updated = unwrapApiResponse(res.data);
    return mapBackendToUi(updated as BackendMaintenance);
  }
};