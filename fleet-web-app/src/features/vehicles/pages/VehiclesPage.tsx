import { useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { useVehicles } from '../hooks/useVehicles';
import { Button, toast } from '../../../shared/components';
import { FiPlus } from 'react-icons/fi';
import VehicleModal from '../components/VehicleModal';
import type { Vehicle } from '../../../types';
import { pageShellClasses, pageShellInnerSpacing } from '../../../shared/utils/pageShell';
import PageHeader from '../components/PageHeader';
import Toolbar from '../components/Toolbar';
import VehiclesTable from '../components/VehiclesTable';
import VehicleDetailsModal from '../components/VehicleDetailsModal';

interface ThemeContext {
  dark: boolean;
}

const VehiclesPage = () => {
  const { dark } = useOutletContext<ThemeContext>();
  const {
    filteredVehicles,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    selectedVehicleRow,
    selectedVehicleDetails,
    openVehicleDetails,
    closeVehicleDetails,
    isDetailsLoading,
    detailsError,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    generateMaintenanceRecommendations,
  } = useVehicles();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVehicleForEdit, setSelectedVehicleForEdit] = useState<Vehicle | null>(null);
  const [formError, setFormError] = useState('');

  const extractErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      return err.response?.data?.message || err.message;
    }
    return err instanceof Error ? err.message : 'An unexpected error occurred';
  };

  const handleAddVehicle = useCallback(
    async (data: Partial<Vehicle> | FormData) => {
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
    setSelectedVehicleForEdit(vehicle);
    setFormError('');
    setIsEditModalOpen(true);
  }, []);

  const handleUpdateVehicle = useCallback(
    async (data: Partial<Vehicle> | FormData) => {
      if (!selectedVehicleForEdit) return;
      const loadingId = toast.loading('Updating vehicle…');
      try {
        setFormError('');
        await updateVehicle(selectedVehicleForEdit.id, data);
        toast.update(loadingId, { type: 'success', title: 'Success', message: 'Vehicle updated successfully!' });
        setIsEditModalOpen(false);
        setSelectedVehicleForEdit(null);
      } catch (err) {
        const msg = extractErrorMessage(err);
        toast.update(loadingId, { type: 'error', title: 'Error', message: msg });
        setFormError(msg);
      }
    },
    [selectedVehicleForEdit, updateVehicle],
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

  const detailsVehicle = selectedVehicleDetails ?? selectedVehicleRow?.vehicle ?? null;

  return (
    <>
      <div className={`${pageShellClasses(dark)} ${pageShellInnerSpacing} animate-fade-in`}>
        <PageHeader
          title="Vehicles"
          description="Your full fleet inventory and live status."
          dark={dark}
          actions={
            <Button onClick={() => setIsAddModalOpen(true)} className="rounded-xl">
              <FiPlus className="mr-2" />
              Add Vehicle
            </Button>
          }
        />

        <Toolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          dark={dark}
        />

        <VehiclesTable
          rows={filteredVehicles}
          isLoading={isLoading}
          error={error}
          dark={dark}
          onView={openVehicleDetails}
          onEdit={handleEditVehicle}
          onDelete={handleDeleteVehicle}
        />
      </div>

      <VehicleModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setFormError(''); }}
        title="Add New Vehicle"
        dark={dark}
        onSubmit={handleAddVehicle}
        error={formError}
      />

      <VehicleModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedVehicleForEdit(null);
          setFormError('');
        }}
        title="Edit Vehicle"
        dark={dark}
        vehicle={selectedVehicleForEdit ?? undefined}
        onSubmit={handleUpdateVehicle}
        error={formError}
      />

      <VehicleDetailsModal
        isOpen={Boolean(selectedVehicleRow || selectedVehicleDetails || isDetailsLoading || detailsError)}
        dark={dark}
        onClose={closeVehicleDetails}
        onEdit={() => {
          if (!detailsVehicle) return;
          setSelectedVehicleForEdit(detailsVehicle);
          setFormError('');
          setIsEditModalOpen(true);
        }}
        onGenerateRecommendations={generateMaintenanceRecommendations}
        onRecommendationsGenerated={fetchVehicles}
        vehicle={detailsVehicle}
        assignment={selectedVehicleRow?.currentAssignment ?? null}
        maintenanceHistory={
          (selectedVehicleRow?.maintenanceHistory ?? []).map((record) => ({
            id: record.id,
            scheduledDate: record.scheduledDate,
            status: record.status,
            priority: record.priority,
            cost: record.cost,
            description: record.description,
          }))
        }
        isLoading={isDetailsLoading}
        error={detailsError}
      />
    </>
  );
};

export default VehiclesPage;

