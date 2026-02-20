import { useState, useCallback } from 'react';
import DashboardLayout from '../../../shared/components/DashboardLayout';
import { Card, Button, Input, GlobalCard } from '../../../shared/components';
import VehicleCard from '../components/VehicleCard';
import VehicleForm from '../components/VehicleForm';
import { useVehicles } from '../hooks/useVehicles';
import { FiPlus, FiSearch } from 'react-icons/fi';

const VehiclesPage = () => {
  const { vehicles, isLoading } = useVehicles();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fuelFilter, setFuelFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch = `${vehicle.make} ${vehicle.model} ${vehicle.licensePlate}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    const matchesFuel = fuelFilter === 'all' || vehicle.fuelType?.toLowerCase() === fuelFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesFuel;
  });

  const handleAddVehicle = useCallback((data: any) => {
    console.log('Add vehicle:', data);
    // TODO: Implement add vehicle API call
    setIsAddModalOpen(false);
  }, []);

  const handleEditVehicle = useCallback((vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsEditModalOpen(true);
  }, []);

  const handleUpdateVehicle = useCallback((data: any) => {
    console.log('Update vehicle:', data);
    // TODO: Implement update vehicle API call
    setIsEditModalOpen(false);
    setSelectedVehicle(null);
  }, []);

  const handleDeleteVehicle = useCallback((vehicleId: string) => {
    console.log('Delete vehicle:', vehicleId);
    // TODO: Implement delete vehicle functionality
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
            <p className="text-gray-600 mt-1">Manage your fleet vehicles</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={fuelFilter}
                onChange={(e) => setFuelFilter(e.target.value)}
              >
                <option value="all">Tous Types Carburant</option>
                <option value="essence">Essence</option>
                <option value="diesel">Diesel</option>
                <option value="électrique">Électrique</option>
                <option value="hybride">Hybride</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Vehicles Grid */}
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <Card key={vehicle.id} padding="md">
                <VehicleCard
                  vehicle={vehicle}
                  onEdit={handleEditVehicle}
                  onDelete={handleDeleteVehicle}
                />
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">No vehicles found matching your search.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Add Vehicle Modal */}
      <GlobalCard
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Vehicle"
        maxWidth="2xl"
      >
        <VehicleForm
          onSubmit={handleAddVehicle}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </GlobalCard>

      {/* Edit Vehicle Modal */}
      <GlobalCard
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedVehicle(null);
        }}
        title="Edit Vehicle"
        maxWidth="2xl"
      >
        <VehicleForm
          vehicle={selectedVehicle}
          onSubmit={handleUpdateVehicle}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedVehicle(null);
          }}
        />
      </GlobalCard>
    </DashboardLayout>
  );
};

export default VehiclesPage;
