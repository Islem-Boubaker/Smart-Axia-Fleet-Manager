import { useState, useCallback } from 'react';
import axios from 'axios';
import { useVehicles } from '../hooks/useVehicles';
import { toast } from '../../../shared/components';
import VehiclesHeader from '../components/VehiclesHeader';
import VehiclesFilters from '../components/VehiclesFilters';
import VehiclesGrid from '../components/VehiclesGrid';
import VehicleModal from '../components/VehicleModal';
import type { Vehicle } from '../../../types';

const VehiclesPage = () => {
  const { vehicles, isLoading, createVehicle, updateVehicle, deleteVehicle } = useVehicles();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [formError, setFormError] = useState('');

  const extractErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      return err.response?.data?.message || err.message;
    }
    return err instanceof Error ? err.message : 'An unexpected error occurred';
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch = `${vehicle.name} ${vehicle.plaque_immatriculation ?? ''}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesActive =
      activeFilter === 'all' || String(vehicle.Active) === activeFilter;
    const matchesType = typeFilter === 'all' || vehicle.type === typeFilter;
    return matchesSearch && matchesActive && matchesType;
  });

  const handleAddVehicle = useCallback(
    async (data: Partial<Vehicle>) => {
      const loadingId = toast.loading('Creating vehicle…');
      try {
        setFormError('');
        await createVehicle(data);
        toast.update(loadingId, { type: 'success', title: 'Success', message: 'Vehicle created successfully!' });
        setIsAddModalOpen(false);
      } catch (err) {
        const msg = extractErrorMessage(err);
        toast.update(loadingId, { type: 'error', title: 'Error', message: msg });
        setFormError(msg);
      }
    },
    [createVehicle],
  );

  const handleEditVehicle = useCallback((vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormError('');
    setIsEditModalOpen(true);
  }, []);

  const handleUpdateVehicle = useCallback(
    async (data: Partial<Vehicle>) => {
      if (!selectedVehicle) return;
      const loadingId = toast.loading('Updating vehicle…');
      try {
        setFormError('');
        await updateVehicle(selectedVehicle.id, data);
        toast.update(loadingId, { type: 'success', title: 'Success', message: 'Vehicle updated successfully!' });
        setIsEditModalOpen(false);
        setSelectedVehicle(null);
      } catch (err) {
        const msg = extractErrorMessage(err);
        toast.update(loadingId, { type: 'error', title: 'Error', message: msg });
        setFormError(msg);
      }
    },
    [selectedVehicle, updateVehicle],
  );

  const handleDeleteVehicle = useCallback(
    async (vehicleId: string) => {
      if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
      const loadingId = toast.loading('Deleting vehicle…');
      try {
        await deleteVehicle(vehicleId);
        toast.update(loadingId, { type: 'success', title: 'Deleted', message: 'Vehicle deleted successfully.' });
      } catch (err) {
        toast.update(loadingId, { type: 'error', title: 'Error', message: extractErrorMessage(err) });
      }
    },
    [deleteVehicle],
  );

  return (
    <>
      <div className="space-y-6">
        <VehiclesHeader onAdd={() => setIsAddModalOpen(true)} />
        <VehiclesFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onActiveChange={setActiveFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
        />
        <VehiclesGrid
          vehicles={filteredVehicles}
          isLoading={isLoading}
          onEdit={handleEditVehicle}
          onDelete={handleDeleteVehicle}
        />
      </div>

      <VehicleModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setFormError(''); }}
        title="Add New Vehicle"
        onSubmit={handleAddVehicle}
        error={formError}
      />

      <VehicleModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedVehicle(null);
          setFormError('');
        }}
        title="Edit Vehicle"
        vehicle={selectedVehicle ?? undefined}
        onSubmit={handleUpdateVehicle}
        error={formError}
      />
    </>
  );
};

export default VehiclesPage;