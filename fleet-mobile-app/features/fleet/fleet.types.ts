export interface Vehicle {
  id: string;
  name: string;
  model: string;
  licensePlate: string;
  status: 'active' | 'inactive' | 'maintenance';
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface Fleet {
  id: string;
  name: string;
  vehicles: Vehicle[];
  totalVehicles: number;
}
