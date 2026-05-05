import { useState, useCallback } from "react";
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useDrivers } from "../hooks/useDrivers";
import { toast } from "../../../shared/components";
import DriversHeader from "../components/DriversHeader";
import DriversSearch from "../components/DriversSearch";
import DriversGrid from "../components/DriversGrid";
import DriverModal from "../components/DriverModal";
import { useVehicleOptions } from "../../vehicles/hooks/useVehicles";
import type { Driver } from "../../../types";
import { pageShellClasses, pageShellInnerSpacing } from "../../../shared/utils/pageShell";

interface ThemeContext {
  dark: boolean;
}

const DriversPage = () => {
  const { dark } = useOutletContext<ThemeContext>();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const { drivers, isLoading, addDriver, updateDriver, deleteDriver } = useDrivers();
  const { vehicles } = useVehicleOptions();

  const filteredDrivers = drivers.filter((driver) =>
    `${driver.name} ${driver.email} ${driver.licenseNumber ?? ""}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  const handleAddDriver = useCallback(
    async (data: any, photo: File | null) => {
      const loadingId = toast.loading(t('drivers.toast.creating'));
      try {
        await addDriver({ ...data, role: "DRIVER" }, photo);
        toast.update(loadingId, { type: 'success', title: t('common.success'), message: t('drivers.toast.createSuccess') });
        setIsAddModalOpen(false);
      } catch (err: any) {
        toast.update(loadingId, { type: 'error', title: t('common.error'), message: err.message || t('drivers.toast.createError') });
      }
    },
    [addDriver, t],
  );

  const handleEditDriver = useCallback((driver: Driver) => {
    setSelectedDriver(driver);
    setIsEditModalOpen(true);
  }, []);

  const handleUpdateDriver = useCallback(
    async (data: any, photo: File | null) => {
      if (!selectedDriver?.id) return;
      const loadingId = toast.loading(t('drivers.toast.updating'));
      try {
        await updateDriver(selectedDriver.id, data, photo);
        toast.update(loadingId, { type: 'success', title: t('common.success'), message: t('drivers.toast.updateSuccess') });
        setIsEditModalOpen(false);
        setSelectedDriver(null);
      } catch (err: any) {
        toast.update(loadingId, { type: 'error', title: t('common.error'), message: err.message || t('drivers.toast.deleteError') });
      }
    },
    [selectedDriver, updateDriver, t],
  );

  const handleDeleteDriver = useCallback(
    async (driverId: string) => {
      if (!window.confirm(t('drivers.toast.deleteConfirm')))
        return;
      const loadingId = toast.loading(t('drivers.toast.deleting'));
      try {
        await deleteDriver(driverId);
        toast.update(loadingId, { type: 'success', title: t('common.deleted'), message: t('drivers.toast.deleteSuccess') });
      } catch (err: any) {
        toast.update(loadingId, { type: 'error', title: t('common.error'), message: err.message || t('drivers.toast.updateError') });
      }
    },
    [deleteDriver, t],
  );

  return (
    <>
      <div className={`${pageShellClasses(dark)} ${pageShellInnerSpacing} animate-fade-in`}>
        <DriversHeader onAdd={() => setIsAddModalOpen(true)} dark={dark} />
        <DriversSearch value={searchQuery} onChange={setSearchQuery} dark={dark} />
        <DriversGrid
          drivers={filteredDrivers}
          isLoading={isLoading}
          onEdit={handleEditDriver}
          onDelete={handleDeleteDriver}
          dark={dark}
        />
      </div>
      <DriverModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t('drivers.addNew')}
        dark={dark}
        vehicles={vehicles}
        onSubmit={handleAddDriver}
      />
      <DriverModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDriver(null);
        }}
        title={t('drivers.edit')}
        dark={dark}
        driver={selectedDriver}
        vehicles={vehicles}
        onSubmit={handleUpdateDriver}
      />
    </>
  );
};

export default DriversPage;
