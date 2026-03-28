import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import TripsHeader from '../components/TripsHeader';
import TripsFilters from '../components/TripsFilters';
import TripsList from '../components/TripsList';

interface ThemeContext {
  dark: boolean;
}

const TripsPage = () => {
  const { dark } = useOutletContext<ThemeContext>();
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
      cost: '65 TND'
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
      cost: '38 TND'
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
      cost: '25 TND'
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
      cost: '12 TND'
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
      cost: '45 TND'
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
      cost: 'N/A'
    }
  ];

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = `${trip.driver} ${trip.vehicle} ${trip.startLocation} ${trip.endLocation}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className={`rounded-3xl border p-6 space-y-6 ${dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'}`}>
        <TripsHeader />
        <TripsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />
        <TripsList trips={filteredTrips} />
      </div>
    </>
  );
};

export default TripsPage;