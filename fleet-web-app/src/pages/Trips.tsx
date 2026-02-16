import { useState } from 'react';
import { FiPlus, FiMapPin, FiClock, FiTruck, FiUser, FiSearch, FiCalendar } from 'react-icons/fi';
import { Card, Button, Badge, Input } from '../components/ui';
import DashboardLayout from '../components/layout/DashboardLayout';

const Trips = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'ongoing':
        return 'warning';
      case 'scheduled':
        return 'info';
      case 'cancelled':
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
            </select>
          </div>
        </Card>

        {/* Trips List */}
        <div className="space-y-4">
          {filteredTrips.map((trip) => (
            <Card key={trip.id} padding="lg">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Trip Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={getStatusColor(trip.status)}>{trip.status}</Badge>
                    <span className="text-sm text-gray-500">Trip #{trip.id}</span>
                  </div>

                  {/* Route */}
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center pt-1">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <div className="w-0.5 h-12 bg-gray-300"></div>
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">From</p>
                        <p className="font-semibold text-gray-900">{trip.startLocation}</p>
                        <p className="text-xs text-gray-500">{trip.startTime}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">To</p>
                        <p className="font-semibold text-gray-900">{trip.endLocation}</p>
                        <p className="text-xs text-gray-500">{trip.endTime || 'In Progress'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Driver & Vehicle */}
                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <FiUser className="mr-2" />
                      <span>{trip.driver}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FiTruck className="mr-2" />
                      <span>{trip.vehicle}</span>
                    </div>
                  </div>
                </div>

                {/* Trip Stats */}
                <div className="lg:w-64 grid grid-cols-3 gap-4 lg:border-l lg:pl-6">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Distance</p>
                    <p className="font-semibold text-gray-900">{trip.distance}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Fuel</p>
                    <p className="font-semibold text-gray-900">{trip.fuel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Cost</p>
                    <p className="font-semibold text-gray-900">{trip.cost}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 lg:flex-col">
                  <Button variant="outline" size="sm" className="flex-1 lg:flex-none">
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredTrips.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">No trips found</p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Trips;
