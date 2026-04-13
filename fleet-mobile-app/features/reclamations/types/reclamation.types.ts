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
export type ReclamationType = "damage" | "delay" | "technical" | "other";
export type FilterOption = "all" | ReclamationStatus;

export interface Reclamation {
  id: string;
  subject: string;
  message: string;
  status: ReclamationStatus;
  type: ReclamationType;
  createdAt: string;
  updatedAt?: string;
  vehicleId?: string;
  images?: string[];
}

export interface ReclamationDetails extends Reclamation {
  comments?: Array<{
    id: string;
    message: string;
    createdAt: string;
  }>;
}

export interface CreateReclamationData {
  subject: string;
  message: string;
  vehicleId?: string;
  images?: File[];
}

export interface UpdateReclamationData {
  subject?: string;
  message?: string;
}
