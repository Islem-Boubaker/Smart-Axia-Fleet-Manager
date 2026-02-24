import { useState, useCallback } from "react";

import { useDrivers } from "../hooks/useDrivers";
import DriversHeader from "../components/DriversHeader";
import DriversSearch from "../components/DriversSearch";
import DriversGrid from "../components/DriversGrid";
import DriverModal from "../components/DriverModal";
import type { Driver } from "../../../types";

const DriversPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const { drivers, isLoading, error, addDriver, updateDriver, deleteDriver } =useDrivers();

  const filteredDrivers = drivers.filter((driver) =>
    `${driver.name} ${driver.email} ${driver.licenseNumber ?? ""}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  const handleAddDriver = useCallback(
    async (data: Partial<Driver> & { password: string }) => {
      try {
        await addDriver({ ...data, role: "DRIVER" });
        setIsAddModalOpen(false);
      } catch {
        /* error already stored in hook */
      }
    },
    [addDriver],
  );

  const handleEditDriver = useCallback((driver: Driver) => {
    setSelectedDriver(driver);
    setIsEditModalOpen(true);
  }, []);

  const handleUpdateDriver = useCallback(
    async (data: Partial<Driver>) => {
      if (!selectedDriver?.id) return;
      try {
        await updateDriver(selectedDriver.id, data);
        setIsEditModalOpen(false);
        setSelectedDriver(null);
      } catch {
        /* error already stored in hook */
      }
    },
    [selectedDriver, updateDriver],
  );

  const handleDeleteDriver = useCallback(
    async (driverId: string) => {
      if (!window.confirm("Are you sure you want to delete this driver?"))
        return;
      try {
        await deleteDriver(driverId);
      } catch {
        /* error already stored in hook */
      }
    },
    [deleteDriver],
  );

  return (
    <>
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        <DriversHeader onAdd={() => setIsAddModalOpen(true)} />
        <DriversSearch value={searchQuery} onChange={setSearchQuery} />
        <DriversGrid
          drivers={filteredDrivers}
          isLoading={isLoading}
          onEdit={handleEditDriver}
          onDelete={handleDeleteDriver}
        />
      </div>
      <DriverModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Driver"
        onSubmit={handleAddDriver}
      />
      <DriverModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDriver(null);
        }}
        title="Edit Driver"
        driver={selectedDriver}
        onSubmit={handleUpdateDriver}
      />
    </>
  );
};

export default DriversPage;
