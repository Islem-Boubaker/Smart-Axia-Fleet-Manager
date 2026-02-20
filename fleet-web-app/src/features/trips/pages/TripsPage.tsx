import { useState } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { Card, Button, Input } from '../../../shared/components';
import DashboardLayout from '../../../shared/components/DashboardLayout';
import TripCard from '../components/TripCard';

const TripsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data - replace with useTrips hook when API is ready
  const trips = [
    {
      id: '1',
      driver: 'Mohamed Ben Salah',
      vehicle: 'Toyota Camry (123 TU 4567)',
      startLocation: 'Tunis',
      endLocation: 'Sfax',
      startTime: '2026-02-16 08:00',
      endTime: '2026-02-16 12:30',
      distance: '270 km',
      status: 'ongoing',
      fuel: '25L',
      cost: '65 TND',
    },
    {
      id: '2',
      driver: 'Fatma Chaabani',
      vehicle: 'Ford F-150 (234 TU 8912)',
      startLocation: 'Sousse',
      endLocation: 'Kairouan',
      startTime: '2026-02-15 09:15',
      endTime: '2026-02-15 14:45',
      distance: '115 km',
      status: 'completed',
      fuel: '15L',
      cost: '38 TND',
    },
    {
      id: '3',
      driver: 'Ahmed Trabelsi',
      vehicle: 'Chevrolet Malibu (156 TU 3421)',
      startLocation: 'Bizerte',
      endLocation: 'Nabeul',
      startTime: '2026-02-16 07:30',
      endTime: '2026-02-16 09:45',
      distance: '95 km',
      status: 'ongoing',
      fuel: '10L',
      cost: '25 TND',
    },
    {
      id: '4',
      driver: 'Sarra Hamdi',
      vehicle: 'Tesla Model 3 (189 TU 6754)',
      startLocation: 'Monastir',
      endLocation: 'Mahdia',
      startTime: '2026-02-14 10:00',
      endTime: '2026-02-14 13:15',
      distance: '85 km',
      status: 'completed',
      fuel: '0 kWh',
      cost: '12 TND',
    },
    {
      id: '5',
      driver: 'Mohamed Ben Salah',
      vehicle: 'Toyota Camry (123 TU 4567)',
      startLocation: 'Gabès',
      endLocation: 'Médenine',
      startTime: '2026-02-13 06:45',
      endTime: '2026-02-13 10:30',
      distance: '145 km',
      status: 'completed',
      fuel: '18L',
      cost: '45 TND',
    },
    {
      id: '6',
      driver: 'Fatma Chaabani',
      vehicle: 'Ford F-150 (234 TU 8912)',
      startLocation: 'Tunis',
      endLocation: 'Béja',
      startTime: '2026-02-17 08:00',
      endTime: null,
      distance: '105 km',
      status: 'scheduled',
      fuel: 'N/A',
      cost: 'N/A',
    },
  ];

  const filteredTrips = trips.filter((trip) => {
    const matchesSearch = `${trip.driver} ${trip.vehicle} ${trip.startLocation} ${trip.endLocation}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trips</h1>
            <p className="text-gray-600 mt-1">Track and manage trips</p>
          </div>
          <Button>
            <FiPlus className="mr-2" />
            Schedule Trip
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
                  placeholder="Search trips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </Card>

        {/* Trips List */}
        {filteredTrips.length > 0 ? (
          <div className="space-y-4">
            {filteredTrips.map((trip) => (
              <Card key={trip.id} padding="md">
                <TripCard trip={trip} />
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">No trips found.</p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TripsPage;
