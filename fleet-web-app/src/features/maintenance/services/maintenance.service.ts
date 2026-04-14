import { api } from '../../../shared/services/api';
import type { ApiResponse, Maintenance } from '../../../types';

export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface MaintenanceFilters {
  page?: number;
  limit?: number;
  status?: 'scheduled' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  vehicleId?: string;
  technician?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'scheduledDate' | 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder?: 'ASC' | 'DESC';
}

export interface MaintenanceListResponse {
  items: Maintenance[];
  meta: PaginationMeta;
}

export interface UpcomingMaintenanceResponse {
  windowDays: number;
  count: number;
  items: Maintenance[];
}

export interface OverdueMaintenanceResponse {
  count: number;
  page: number;
  limit: number;
  items: (Maintenance & { daysOverdue: number })[];
}

type BackendMaintenance = {
  id: string;
  vehicleId?: string;
  vehiclePlate: string;
  vehicle?: {
    id?: string;
    name?: string;
    plaque_immatriculation?: string;
  };
  scheduledDate: string;
  completedAt?: string;
  technician: string;
  cost: number;
  mileage: number | null;
  priority: 'low' | 'medium' | 'high';
  status: 'scheduled' | 'pending' | 'in_progress' | 'in progress' | 'completed' | 'cancelled' | null;
  type: string | null;
  description?: string;
  attachments?: string[];
  createdAt?: string;
  updatedAt?: string;
};

function unwrapApiResponse<T>(payload: ApiResponse<T> | T): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return (payload as ApiResponse<T>).data;
  }
  return payload as T;
}

function normalizeStatus(status: BackendMaintenance['status'] | string): Maintenance['status'] {
  const s = String(status).toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_');
  if (s === 'scheduled' || s === 'pending' || s === 'in_progress' || s === 'completed' || s === 'cancelled') {
    return s as Maintenance['status'];
  }
  return 'pending';
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
    vehicleId: record.vehicleId,
    vehicleName: record.vehicle?.name,
    vehiclePlate: record.vehiclePlate || record.vehicle?.plaque_immatriculation || '',
    type: record.type ?? '',
    description: record.description ?? '',
    attachments: record.attachments ?? [],
    scheduledDate: normalizeDate(record.scheduledDate),
    completedAt: record.completedAt ? normalizeDate(record.completedAt) : undefined,
    status: normalizeStatus(record.status),
    mileage: record.mileage ?? 0,
    cost: Number(record.cost ?? 0),
    technician: record.technician,
    priority: record.priority,
    createdAt: record.createdAt || '',
    updatedAt: record.updatedAt || '',
  };
}

function toBackendPayload(data: Partial<Maintenance>): Partial<BackendMaintenance> {
  const payload: Partial<BackendMaintenance> = {};

  const anyData = data as any;
  if (typeof anyData.vehicle === 'string') {
    payload.vehicleId = anyData.vehicle;
    payload.vehiclePlate = anyData.vehicle;
  }
  if (typeof data.vehicleId === 'string' && data.vehicleId.length > 0) {
    payload.vehicleId = data.vehicleId;
    payload.vehiclePlate = data.vehiclePlate || data.vehicleId;
  }
  if (typeof data.type === 'string') payload.type = data.type;
  if (typeof data.scheduledDate === 'string' && data.scheduledDate) {
    const parsedDate = new Date(data.scheduledDate);
    if (!Number.isNaN(parsedDate.getTime())) {
      payload.scheduledDate = parsedDate.toISOString();
    } else {
      payload.scheduledDate = data.scheduledDate;
    }
  }
  if (typeof data.technician === 'string') payload.technician = data.technician;
  if (typeof data.priority === 'string') payload.priority = data.priority as BackendMaintenance['priority'];
  if (typeof data.status === 'string') {
    payload.status = data.status.replace(/-/g, '_') as BackendMaintenance['status'];
  }
  if (typeof data.description === 'string') payload.description = data.description;
  if (Array.isArray(data.attachments)) payload.attachments = data.attachments;

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
  getAll: async (filters: MaintenanceFilters = {}): Promise<MaintenanceListResponse> => {
    const res = await api.get<ApiResponse<any> | any>('/maintenances', { params: filters });
    const unwrapped = unwrapApiResponse(res.data);
    const dataArray = Array.isArray(unwrapped) ? unwrapped : (unwrapped && Array.isArray(unwrapped.data) ? unwrapped.data : []);
    const meta = (!Array.isArray(unwrapped) && unwrapped?.meta)
      ? unwrapped.meta
      : {
          totalItems: dataArray.length,
          totalPages: 1,
          currentPage: filters.page ?? 1,
          pageSize: filters.limit ?? dataArray.length,
        };

    return {
      items: dataArray.map(mapBackendToUi),
      meta,
    };
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
    const res = await api.patch<ApiResponse<BackendMaintenance> | BackendMaintenance>(
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
  },

  start: async (id: string): Promise<Maintenance> => {
    const res = await api.patch<ApiResponse<BackendMaintenance> | BackendMaintenance>(
      `/maintenances/${id}/start`
    );
    const updated = unwrapApiResponse(res.data);
    return mapBackendToUi(updated as BackendMaintenance);
  },

  complete: async (
    id: string,
    data?: { cost?: number; mileage?: number; description?: string; attachments?: string[] }
  ): Promise<Maintenance> => {
    const res = await api.patch<ApiResponse<BackendMaintenance> | BackendMaintenance>(
      `/maintenances/${id}/complete`,
      data ?? {}
    );
    const updated = unwrapApiResponse(res.data);
    return mapBackendToUi(updated as BackendMaintenance);
  },

  cancel: async (id: string): Promise<Maintenance> => {
    const res = await api.patch<ApiResponse<BackendMaintenance> | BackendMaintenance>(
      `/maintenances/${id}/cancel`
    );
    const updated = unwrapApiResponse(res.data);
    return mapBackendToUi(updated as BackendMaintenance);
  },

  upcoming: async (filters: {
    days?: number;
    limit?: number;
    priority?: 'low' | 'medium' | 'high';
    vehicleId?: string;
  } = {}): Promise<UpcomingMaintenanceResponse> => {
    const res = await api.get<ApiResponse<any> | any>('/maintenances/upcoming', { params: filters });
    const unwrapped = unwrapApiResponse(res.data) as {
      windowDays: number;
      count: number;
      items: BackendMaintenance[];
    };

    return {
      windowDays: Number(unwrapped?.windowDays ?? filters.days ?? 7),
      count: Number(unwrapped?.count ?? 0),
      items: Array.isArray(unwrapped?.items) ? unwrapped.items.map(mapBackendToUi) : [],
    };
  },

  overdue: async (filters: {
    page?: number;
    limit?: number;
    priority?: 'low' | 'medium' | 'high';
    vehicleId?: string;
  } = {}): Promise<OverdueMaintenanceResponse> => {
    const res = await api.get<ApiResponse<any> | any>('/maintenances/overdue', { params: filters });
    const unwrapped = unwrapApiResponse(res.data) as {
      count: number;
      page: number;
      limit: number;
      items: (BackendMaintenance & { daysOverdue: number })[];
    };

    const mappedItems = Array.isArray(unwrapped?.items)
      ? unwrapped.items.map((item) => ({
          ...mapBackendToUi(item),
          daysOverdue: Number(item.daysOverdue ?? 0),
        }))
      : [];

    return {
      count: Number(unwrapped?.count ?? mappedItems.length),
      page: Number(unwrapped?.page ?? filters.page ?? 1),
      limit: Number(unwrapped?.limit ?? filters.limit ?? 10),
      items: mappedItems,
    };
  },
};