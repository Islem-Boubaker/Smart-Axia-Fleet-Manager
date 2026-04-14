import { useState, useCallback } from "react";
import { useOutletContext } from 'react-router-dom';

import { useDrivers } from "../hooks/useDrivers";
import { toast } from "../../../shared/components";
import DriversHeader from "../components/DriversHeader";
import DriversSearch from "../components/DriversSearch";
import DriversGrid from "../components/DriversGrid";
import DriverModal from "../components/DriverModal";
import { useVehicles } from "../../vehicles/hooks/useVehicles";
import type { Driver } from "../../../types";
import { pageShellClasses, pageShellInnerSpacing } from "../../../shared/utils/pageShell";

interface ThemeContext {
  dark: boolean;
}

const DriversPage = () => {
  const { dark } = useOutletContext<ThemeContext>();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const { drivers, isLoading, addDriver, updateDriver, deleteDriver } = useDrivers();
  const { vehicles } = useVehicles();

  const filteredDrivers = drivers.filter((driver) =>
    `${driver.name} ${driver.email} ${driver.licenseNumber ?? ""}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  const handleAddDriver = useCallback(
    async (data: any, photo: File | null) => {
      const loadingId = toast.loading('Adding driver…');
      try {
        await addDriver({ ...data, role: "DRIVER" }, photo);
        toast.update(loadingId, { type: 'success', title: 'Success', message: 'Driver added successfully!' });
        setIsAddModalOpen(false);
      } catch (err: any) {
        toast.update(loadingId, { type: 'error', title: 'Error', message: err.message || 'Failed to add driver' });
      }
    },
    [addDriver],
  );

  const handleEditDriver = useCallback((driver: Driver) => {
    setSelectedDriver(driver);
    setIsEditModalOpen(true);
  }, []);

  const handleUpdateDriver = useCallback(
    async (data: any, photo: File | null) => {
      if (!selectedDriver?.id) return;
      const loadingId = toast.loading('Updating driver…');
      try {
        await updateDriver(selectedDriver.id, data, photo);
        toast.update(loadingId, { type: 'success', title: 'Success', message: 'Driver updated successfully!' });
        setIsEditModalOpen(false);
        setSelectedDriver(null);
      } catch (err: any) {
        toast.update(loadingId, { type: 'error', title: 'Error', message: err.message || 'Failed to update driver' });
      }
    },
    [selectedDriver, updateDriver],
  );

  const handleDeleteDriver = useCallback(
    async (driverId: string) => {
      if (!window.confirm("Are you sure you want to delete this driver?"))
        return;
      const loadingId = toast.loading('Deleting driver…');
      try {
        await deleteDriver(driverId);
        toast.update(loadingId, { type: 'success', title: 'Deleted', message: 'Driver deleted successfully.' });
      } catch (err: any) {
        toast.update(loadingId, { type: 'error', title: 'Error', message: err.message || 'Failed to delete driver' });
      }
    },
    [deleteDriver],
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
        title="Add New Driver"
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
        title="Edit Driver"
        dark={dark}
        driver={selectedDriver}
        vehicles={vehicles}
        onSubmit={handleUpdateDriver}
      />
    </>
  );
};

export default DriversPage;
