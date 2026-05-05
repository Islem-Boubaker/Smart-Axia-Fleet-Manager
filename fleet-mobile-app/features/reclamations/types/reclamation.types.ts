// /**
//  * Reclamation (complaint/issue) feature type definitions
//  */

// export interface Reclamation {
//   id: string;
//   reclamationNumber: string;
//   driverId: string;
//   vehicleId: string;
//   tripId?: string;
//   title: string;
//   description: string;
//   category: 'vehicle_damage' | 'accident' | 'maintenance' | 'other';
//   severity: 'low' | 'medium' | 'high' | 'critical';
//   status: 'open' | 'in-review' | 'resolved' | 'closed';
//   attachments?: string[]; // Image URLs
//   priority: number;
//   createdAt: string;
//   updatedAt: string;
//   resolvedAt?: string;
// }

// export interface ReclamationDetails extends Reclamation {
//   // Extended information for detail view
//   notes?: string;
//   assignedTo?: string;
//   estimatedResolutionDate?: string;
//   resolution?: {
//     description: string;
//     cost?: number;
//     resolvedDate: string;
//   };
// }

// export interface CreateReclamationData {
//   title: string;
//   description: string;
//   category: 'vehicle_damage' | 'accident' | 'maintenance' | 'other';
//   severity: 'low' | 'medium' | 'high' | 'critical';
//   tripId?: string;
//   vehicleId?: string;
//   attachments?: File[];
// }

// export interface ReclamationFilter {
//   status?: string;
//   category?: string;
//   severity?: string;
//   dateFrom?: string;
//   dateTo?: string;
// }
export type ReclamationStatus =
  | "pending"
  | "in_progress"
  | "resolved"
  | "rejected";
export type ReclamationType =
  | "general"
  | "vehicle"
  | "maintenance"
  | "trip"
  | "damage"
  | "delay"
  | "technical"
  | "other";
export type FilterOption = "all" | ReclamationStatus;
export type MaintenancePriority = "low" | "medium" | "high";

export interface Reclamation {
  id: string;
  subject: string;
  message: string;
  status: ReclamationStatus;
  type: ReclamationType;
  createdAt: string;
  updatedAt?: string;
  vehicleId?: string;
  driverName?: string | null;
  vehicleName?: string | null;
  vehiclePlate?: string | null;
  metadata?: Record<string, unknown>;
  driver?: {
    id: string;
    name?: string;
    email?: string;
  } | null;
  vehicle?: {
    id: string;
    name?: string;
    plaque_immatriculation?: string;
    model?: string;
  } | null;
  images?: string[];
}

export interface ReclamationDetails extends Reclamation {
  comments?: {
    id: string;
    message: string;
    createdAt: string;
  }[];
}

export interface CreateReclamationData {
  subject: string;
  message: string;
  type?: ReclamationType;
  vehicleId?: string;
  vehicleName?: string;
  vehiclePlate?: string;
  driverName?: string;
  tripId?: string;
  reclamationTypeLabel?: string;
  metadata?: Record<string, unknown>;
  images?: ReclamationImage[];
}

export interface UpdateReclamationData {
  subject?: string;
  message?: string;
}
// ─── Reclamation Types ───────────────────────────────────────────────────────

export type ReclamationStep = "SUBJECT" | "PROBLEM" | "YOUR_DATA" | "SEND";

export interface StepConfig {
  key: ReclamationStep;
  label: string;
  index: number;
}

export interface ReclamationImage {
  uri: string;
  name?: string;
  type?: string;
}

export interface ReclamationFormData {
  type: ReclamationType;
  subject: string;
  message: string;
  date: Date | null;
  images: ReclamationImage[];
  maintenanceType?: string;
  maintenancePriority?: MaintenancePriority;
  estimatedCost?: string;
  currentMileage?: string;
  maintenanceNotes?: string;
  vehicleId?: string;
  vehicleName?: string;
  vehiclePlate?: string;
  driverName?: string;
  tripId?: string;
  reclamationTypeLabel?: string;
}

export interface ReclamationFormErrors {
  subject?: string;
  message?: string;
  maintenanceType?: string;
  estimatedCost?: string;
  currentMileage?: string;
}

export interface ReclamationPayload {
  subject: string;
  message: string;
  date: string;
  images: ReclamationImage[];
}

export interface ReclamationResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    subject: string;
    status: string;
    createdAt: string;
  };
}
