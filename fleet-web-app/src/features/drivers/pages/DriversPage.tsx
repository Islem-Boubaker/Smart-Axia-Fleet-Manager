import { useCallback, useState } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { Card, Button, Input, GlobalCard } from '../../../shared/components';
import DashboardLayout from '../../../shared/components/DashboardLayout';
import DriverCard from '../components/DriverCard';
import DriverForm from '../components/DriverForm';
import { mockDrivers } from '../../../data/mockData';

const DriversPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  // const { drivers, isLoading } = useDrivers(); // Uncomment when API is ready
  
  // Using mock data for now
  const drivers = mockDrivers;
  const isLoading = false;

  const filteredDrivers = drivers.filter((driver) =>
    `${driver.name} ${driver.email} ${driver.licenseNumber}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleAddDriver = useCallback((data: any) => {
    console.log('Add driver:', data);
    // TODO: Implement add driver API call
    setIsAddModalOpen(false);
  }, []);

  const handleEditDriver = useCallback((driver: any) => {
    setSelectedDriver(driver);
    setIsEditModalOpen(true);
  }, []);

  const handleUpdateDriver = useCallback((data: any) => {
    console.log('Update driver:', data);
    // TODO: Implement update driver API call
    setIsEditModalOpen(false);
    setSelectedDriver(null);
  }, []);

  const handleDeleteDriver = useCallback((driverId: string) => {
    console.log('Delete driver:', driverId);
    // TODO: Implement delete driver functionality
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
            <p className="text-gray-600 mt-1">Manage your fleet drivers</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} aria-label="Add new driver">
            <FiPlus className="mr-2" />
            Add Driver
          </Button>
        </div>

        {/* Search */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <Input
                  type="text"
                  placeholder="Search drivers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-label="Search drivers"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Drivers Grid */}
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredDrivers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrivers.map((driver) => (
              <Card key={driver.id} padding="lg">
                <DriverCard
                  driver={driver}
                  onEdit={handleEditDriver}
                  onDelete={handleDeleteDriver}
                />
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery
                  ? 'No drivers found matching your search.'
                  : 'No drivers available.'}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Add Driver Modal */}
      <GlobalCard
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Driver"
        maxWidth="2xl"
      >
        <DriverForm
          onSubmit={handleAddDriver}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </GlobalCard>

      {/* Edit Driver Modal */}
      <GlobalCard
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDriver(null);
        }}
        title="Edit Driver"
        maxWidth="2xl"
      >
        <DriverForm
          driver={selectedDriver}
          onSubmit={handleUpdateDriver}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedDriver(null);
          }}
        />
      </GlobalCard>
    </DashboardLayout>
  );
};

export default DriversPage;
