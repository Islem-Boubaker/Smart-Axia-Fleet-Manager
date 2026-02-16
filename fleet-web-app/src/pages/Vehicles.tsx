import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { Card, Button, Badge, Input } from '../components/ui';
import DashboardLayout from '../components/layout/DashboardLayout';

const Vehicles = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const vehicles = [
    {
      id: '1',
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      licensePlate: '123 TU 4567',
      vin: '1HGBH41JXMN109186',
      status: 'active',
      mileage: 45230,
      fuelType: 'essence',
      driver: 'Mohamed Ben Salah',
    },
    {
      id: '2',
      make: 'Honda',
      model: 'Accord',
      year: 2021,
      licensePlate: '167 TU 2389',
      vin: '2HGBH41JXMN109187',
      status: 'maintenance',
      mileage: 58920,
      fuelType: 'hybride',
      driver: 'N/A',
    },
    {
      id: '3',
      make: 'Ford',
      model: 'F-150',
      year: 2023,
      licensePlate: '234 TU 8912',
      vin: '3HGBH41JXMN109188',
      status: 'active',
      mileage: 12450,
      fuelType: 'diesel',
      driver: 'Fatma Chaabani',
    },
    {
      id: '4',
      make: 'Chevrolet',
      model: 'Malibu',
      year: 2022,
      licensePlate: '156 TU 3421',
      vin: '4HGBH41JXMN109189',
      status: 'active',
      mileage: 32100,
      fuelType: 'essence',
      driver: 'Ahmed Trabelsi',
    },
    {
      id: '5',
      make: 'Tesla',
      model: 'Model 3',
      year: 2023,
      licensePlate: '189 TU 6754',
      vin: '5HGBH41JXMN109190',
      status: 'active',
      mileage: 8750,
      fuelType: 'électrique',
      driver: 'Sarra Hamdi',
    },
  ];

  const filteredVehicles = vehicles.filter((vehicle) =>
    `${vehicle.make} ${vehicle.model} ${vehicle.licensePlate}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
            <p className="text-gray-600 mt-1">Manage your fleet vehicles</p>
          </div>
          <Button>
            <FiPlus className="mr-2" />
            Add Vehicle
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search vehicles..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Status</option>
                <option>Active</option>
                <option>Maintenance</option>
                <option>Inactive</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Tous Types Carburant</option>
                <option>Essence</option>
                <option>Diesel</option>
                <option>Électrique</option>
                <option>Hybride</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} padding="md">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-sm text-gray-500">{vehicle.year}</p>
                  </div>
                  <Badge
                    variant={
                      vehicle.status === 'active'
                        ? 'success'
                        : vehicle.status === 'maintenance'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {vehicle.status}
                  </Badge>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">License Plate:</span>
                    <span className="font-medium text-gray-900">{vehicle.licensePlate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mileage:</span>
                    <span className="font-medium text-gray-900">
                      {vehicle.mileage.toLocaleString()} km
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fuel Type:</span>
                    <span className="font-medium text-gray-900 capitalize">{vehicle.fuelType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Driver:</span>
                    <span className="font-medium text-gray-900">{vehicle.driver}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <Button variant="secondary" size="sm" className="flex-1">
                    <FiEdit2 className="mr-1" />
                    Edit
                  </Button>
                  <Button variant="danger" size="sm">
                    <FiTrash2 />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredVehicles.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">No vehicles found matching your search.</p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Vehicles;
