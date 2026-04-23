export type MaintenancePriority = 'high' | 'medium' | 'low';

export interface MaintenanceRecommendation {
  priority: MaintenancePriority;
  title: string;
  description: string;
}

export const MAINTENANCE_STATIC: Record<string, MaintenanceRecommendation[]> = {
  'VL-118': [
    {
      priority: 'high',
      title: 'Oil Change Overdue',
      description: 'Last service 6 months ago',
    },
    {
      priority: 'medium',
      title: 'Tire Rotation Due',
      description: 'Every 10,000 km',
    },
  ],
  'FT-077': [
    {
      priority: 'high',
      title: 'Brake Inspection Required',
      description: 'Safety critical',
    },
  ],
  'SC-029': [
    {
      priority: 'medium',
      title: 'Filter Replacement',
      description: 'Air and cabin filters',
    },
  ],
};

export const getVehicleRecommendations = (plate?: string | null): MaintenanceRecommendation[] => {
  if (!plate) return [];
  return MAINTENANCE_STATIC[plate.trim().toUpperCase()] ?? [];
};
