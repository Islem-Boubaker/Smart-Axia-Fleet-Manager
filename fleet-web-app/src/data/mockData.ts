import type { Vehicle, Driver, Trip, Maintenance } from '../types';

export const mockVehicles: Vehicle[] = [
  
];

export const mockDrivers: Driver[] = [
  {
    id: '1',
    name: 'Mohamed Ben Salah',
    email: 'mohamed.bensalah@example.com',
    phone: '+216 22 345 678',
    licenseNumber: 'TN-123456',
    licenseExpiry: '2026-08-15',
    status: 'active',
    assignedVehicle: 'Toyota Camry (123 TU 4567)',
    totalTrips: 145,
    rating: 4.8,
  },
  {
    id: '2',
    name: 'Fatma Chaabani',
    email: 'fatma.chaabani@example.com',
    phone: '+216 54 678 912',
    licenseNumber: 'TN-234567',
    licenseExpiry: '2025-12-10',
    status: 'active',
    assignedVehicle: 'Ford F-150 (234 TU 8912)',
    totalTrips: 98,
    rating: 4.9,
  },
  {
    id: '3',
    name: 'Ahmed Trabelsi',
    email: 'ahmed.trabelsi@example.com',
    phone: '+216 98 234 567',
    licenseNumber: 'TN-345678',
    licenseExpiry: '2026-03-22',
    status: 'active',
    assignedVehicle: 'Chevrolet Malibu (156 TU 3421)',
    totalTrips: 76,
    rating: 4.7,
  },
  {
    id: '4',
    name: 'Sarra Hamdi',
    email: 'sarra.hamdi@example.com',
    phone: '+216 29 876 543',
    licenseNumber: 'TN-456789',
    licenseExpiry: '2026-11-05',
    status: 'active',
    assignedVehicle: 'Tesla Model 3 (189 TU 6754)',
    totalTrips: 52,
    rating: 5.0,
  },
  {
    id: '5',
    name: 'Karim Sassi',
    email: 'karim.sassi@example.com',
    phone: '+216 52 123 456',
    licenseNumber: 'TN-567890',
    licenseExpiry: '2024-09-18',
    status: 'inactive',
    assignedVehicle: 'N/A',
    totalTrips: 23,
    rating: 4.5,
  },
];

export const mockTrips: Trip[] = [
  {
    id: '1',
    userId: 'Mohamed Ben Salah', // Just string
    vehicleId: '123 TU 4567',
    startLocation: 'Tunis',
    endLocation: 'Sfax',
    startTime: '2024-03-15T08:00:00',
    distance: 270,
    status: 'ongoing',
    revenue: 85,
    stops: [],
    createdAt: '2024-03-10T00:00:00',
    updatedAt: '2024-03-10T00:00:00',
  },
  {
    id: '2',
    userId: 'Fatma Chaabani',
    vehicleId: '234 TU 8912',
    startLocation: 'Sousse',
    endLocation: 'Kairouan',
    startTime: '2024-03-14T09:00:00',
    endTime: '2024-03-14T11:30:00',
    distance: 155,
    status: 'completed',
    revenue: 55,
    stops: [],
    createdAt: '2024-03-10T00:00:00',
    updatedAt: '2024-03-10T00:00:00',
  },
  {
    id: '3',
    userId: 'Ahmed Trabelsi',
    vehicleId: '156 TU 3421',
    startLocation: 'Bizerte',
    endLocation: 'Nabeul',
    startTime: '2024-03-15T10:00:00',
    distance: 98,
    status: 'ongoing',
    revenue: 42,
    stops: [],
    createdAt: '2024-03-10T00:00:00',
    updatedAt: '2024-03-10T00:00:00',
  },
];

export interface DashboardStat {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

export const mockDashboardStats: DashboardStat[] = [
  {
    title: 'Total Vehicles',
    value: '48',
    change: '+12%',
    changeType: 'increase',
    icon: 'truck',
    color: 'blue',
  },
  {
    title: 'Active Drivers',
    value: '32',
    change: '+5%',
    changeType: 'increase',
    icon: 'users',
    color: 'green',
  },
  {
    title: 'Ongoing Trips',
    value: '15',
    change: '-3%',
    changeType: 'decrease',
    icon: 'map',
    color: 'purple',
  },
  {
    title: 'Total Distance',
    value: '12.5K km',
    change: '+8%',
    changeType: 'increase',
    icon: 'trending',
    color: 'orange',
  },
];

export const mockMaintenance: Maintenance[] = [
  {
    id: '1',
    vehiclePlate: '123 TU 4567',
    type: 'routine',
    description: 'Oil change and filter replacement',
    scheduledDate: '2024-03-15',
    status: 'scheduled',
    mileage: 45230,
    cost: 150,
    technician: 'Ali Mechanic',
    priority: 'medium',
    attachments: [],
    createdAt: '2024-03-10T00:00:00Z',
    updatedAt: '2024-03-10T00:00:00Z',
  },
  {
    id: '2',
    vehiclePlate: '167 TU 2389',
    type: 'repair',
    description: 'Brake pad replacement',
    scheduledDate: '2024-03-10',
    completedAt: '2024-03-10',
    status: 'completed',
    mileage: 58920,
    cost: 280,
    technician: 'Mohamed Mechanic',
    priority: 'high',
    attachments: [],
    createdAt: '2024-03-05T00:00:00Z',
    updatedAt: '2024-03-05T00:00:00Z',
  },
  {
    id: '3',
    vehiclePlate: '234 TU 8912',
    type: 'inspection',
    description: 'Annual vehicle inspection',
    scheduledDate: '2024-03-20',
    status: 'scheduled',
    mileage: 12450,
    cost: 100,
    technician: 'Karim Inspector',
    priority: 'low',
    attachments: [],
    createdAt: '2024-03-15T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z',
  },
  {
    id: '4',
    vehiclePlate: '156 TU 3421',
    type: 'repair',
    description: 'Transmission service',
    scheduledDate: '2024-03-12',
    status: 'in_progress',
    mileage: 32100,
    cost: 450,
    technician: 'Youssef Mechanic',
    priority: 'high',
    attachments: [],
    createdAt: '2024-03-10T00:00:00Z',
    updatedAt: '2024-03-10T00:00:00Z',
  },
  {
    id: '5',
    vehiclePlate: '189 TU 6754',
    type: 'routine',
    description: 'Battery check and tire rotation',
    scheduledDate: '2024-03-08',
    completedAt: '2024-03-08',
    status: 'completed',
    mileage: 8750,
    cost: 120,
    technician: 'Ahmed Mechanic',
    priority: 'medium',
    attachments: [],
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },
];

// Reports Page Data
export const overviewStats = [
  {
    title: 'Total Vehicles',
    value: '48',
    change: '+3 this month',
    trend: 'up' as const,
    icon: 'FiTruck',
    color: 'blue',
  },
  {
    title: 'Active Vehicles',
    value: '42',
    change: '+5 from last month',
    trend: 'up' as const,
    icon: 'FiCheckCircle',
    color: 'green',
  },
  {
    title: 'Total Distance',
    value: '125,450 km',
    change: '+12% vs last month',
    trend: 'up' as const,
    icon: 'FiNavigation',
    color: 'purple',
  },
  {
    title: 'Total Fuel Cost',
    value: '45,230 TND',
    change: '+8% vs last month',
    trend: 'down' as const,
    icon: 'FiDollarSign',
    color: 'orange',
  },
];

export const vehiclePerformance = [
  { vehicle: 'Toyota Camry', trips: 145, distance: '12,450 km', fuel: '1,058 L', efficiency: '8.5 L/100km', revenue: '4,350 TND' },
  { vehicle: 'Honda Accord', trips: 132, distance: '15,320 km', fuel: '1,225 L', efficiency: '8.0 L/100km', revenue: '5,120 TND' },
  { vehicle: 'Ford F-150', trips: 98, distance: '8,750 km', fuel: '1,050 L', efficiency: '12.0 L/100km', revenue: '3,280 TND' },
  { vehicle: 'Chevrolet Malibu', trips: 76, distance: '10,230 km', fuel: '870 L', efficiency: '8.5 L/100km', revenue: '2,950 TND' },
  { vehicle: 'Tesla Model 3', trips: 52, distance: '6,500 km', fuel: '0 L', efficiency: '0 L/100km', revenue: '1,890 TND' },
];

export const fuelAnalysis = [
  { type: 'Essence', vehicles: 22, consumption: '9,467 L', fuel: '20,354 L', percentage: 45 },
  { type: 'Diesel', vehicles: 17, consumption: '7,363 L', fuel: '15,831 L', percentage: 35 },
  { type: 'Hybride', vehicles: 7, consumption: '3,156 L', fuel: '6,785 L', percentage: 15 },
  { type: 'Électrique', vehicles: 2, consumption: '1,048 kWh', fuel: '2,260 kWh', percentage: 5 },
];

export const maintenanceSummary = [
  { category: 'Routine', count: 15, cost: '4,250 TND', avgCost: '283 TND' },
  { category: 'Repair', count: 12, cost: '6,890 TND', avgCost: '574 TND' },
  { category: 'Inspection', count: 8, cost: '1,200 TND', avgCost: '150 TND' },
];

export const monthlyTrends = [
  { month: 'Jan', trips: 145, distance: 18500, revenue: 5670 },
  { month: 'Feb', trips: 132, distance: 17200, revenue: 6050 },
  { month: 'Mar', trips: 156, distance: 21400, revenue: 5800 },
  { month: 'Apr', trips: 142, distance: 19800, revenue: 6120 },
  { month: 'May', trips: 168, distance: 22500, revenue: 5910 },
  { month: 'Jun', trips: 175, distance: 23800, revenue: 6860 },
];
