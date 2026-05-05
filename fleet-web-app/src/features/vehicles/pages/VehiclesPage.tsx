import { useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    return err instanceof Error ? err.message : t('common.unexpectedError');
  };

  const handleAddVehicle = useCallback(
    async (data: Partial<Vehicle> | FormData) => {
      const loadingId = toast.loading(t('vehicles.toast.creating'));
      try {
        setFormError('');
        await createVehicle(data);
        toast.update(loadingId, { type: 'success', title: t('common.success'), message: t('vehicles.toast.createSuccess') });
        setIsAddModalOpen(false);
      } catch (err) {
        const msg = extractErrorMessage(err);
        toast.update(loadingId, { type: 'error', title: t('common.error'), message: msg });
        setFormError(msg);
      }
    },
    [createVehicle, t],
  );

  const handleEditVehicle = useCallback((vehicle: Vehicle) => {
    setSelectedVehicleForEdit(vehicle);
    setFormError('');
    setIsEditModalOpen(true);
  }, []);

  const handleUpdateVehicle = useCallback(
    async (data: Partial<Vehicle> | FormData) => {
      if (!selectedVehicleForEdit) return;
      const loadingId = toast.loading(t('vehicles.toast.updating'));
      try {
        setFormError('');
        await updateVehicle(selectedVehicleForEdit.id, data);
        toast.update(loadingId, { type: 'success', title: t('common.success'), message: t('vehicles.toast.updateSuccess') });
        setIsEditModalOpen(false);
        setSelectedVehicleForEdit(null);
      } catch (err) {
        const msg = extractErrorMessage(err);
        toast.update(loadingId, { type: 'error', title: t('common.error'), message: msg });
        setFormError(msg);
      }
    },
    [selectedVehicleForEdit, updateVehicle, t],
  );

  const handleDeleteVehicle = useCallback(
    async (vehicleId: string) => {
      if (!window.confirm(t('vehicles.toast.deleteConfirm'))) return;
      const loadingId = toast.loading(t('vehicles.toast.deleting'));
      try {
        await deleteVehicle(vehicleId);
        toast.update(loadingId, { type: 'success', title: t('common.deleted'), message: t('vehicles.toast.deleteSuccess') });
      } catch (err) {
        toast.update(loadingId, { type: 'error', title: t('common.error'), message: extractErrorMessage(err) });
      }
    },
    [deleteVehicle, t],
  );

  const detailsVehicle = selectedVehicleDetails ?? selectedVehicleRow?.vehicle ?? null;

  return (
    <>
      <div className={`${pageShellClasses(dark)} ${pageShellInnerSpacing} animate-fade-in`}>
        <PageHeader
          title={t('vehicles.title')}
          description={t('vehicles.subtitle')}
          dark={dark}
          actions={
            <Button onClick={() => setIsAddModalOpen(true)} className="rounded-xl">
              <FiPlus className="mr-2" />
              {t('vehicles.add_button')}
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
        title={t('vehicles.addNew')}
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
        title={t('vehicles.edit')}
        dark={dark}
        vehicle={selectedVehicleForEdit ?? undefined}
        onSubmit={handleUpdateVehicle}
        error={formError}
      />

      <VehicleDetailsModal
        isOpen={Boolean(selectedVehicleRow || selectedVehicleDetails || isDetailsLoading || detailsError)}
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

