import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiPhone, FiMail } from 'react-icons/fi';
import { Card, Button, Badge, Input } from '../components/ui';
import DashboardLayout from '../components/layout/DashboardLayout';

const Drivers = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const drivers = [
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

  const filteredDrivers = drivers.filter((driver) =>
    `${driver.name} ${driver.email} ${driver.licenseNumber}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
            <p className="text-gray-600 mt-1">Manage your fleet drivers</p>
          </div>
          <Button>
            <FiPlus className="mr-2" />
            Add Driver
          </Button>
        </div>

        {/* Search */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search drivers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Drivers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => (
            <Card key={driver.id} padding="lg">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{driver.name}</h3>
                    <Badge variant={getStatusColor(driver.status)} className="mt-1">
                      {driver.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-medium">
                    ⭐ {driver.rating}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <FiMail className="mr-2 flex-shrink-0" />
                    <span className="truncate">{driver.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FiPhone className="mr-2 flex-shrink-0" />
                    <span>{driver.phone}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">License:</span>
                    <span className="font-medium text-gray-900">{driver.licenseNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Expires:</span>
                    <span className="font-medium text-gray-900">{driver.licenseExpiry}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Trips:</span>
                    <span className="font-medium text-gray-900">{driver.totalTrips}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Assigned Vehicle:</span>
                    <span className="font-medium text-gray-900 text-right">{driver.assignedVehicle}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1">
                    <FiEdit2 className="mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" className="px-3">
                    <FiTrash2 className="text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredDrivers.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">No drivers found</p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Drivers;
