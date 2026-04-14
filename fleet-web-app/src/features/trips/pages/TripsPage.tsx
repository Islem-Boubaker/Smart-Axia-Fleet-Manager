import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import TripsHeader from '../components/TripsHeader';
import TripsFilters from '../components/TripsFilters';
import TripsList from '../components/TripsList';
import TripForm from '../components/TripForm';
import { useTrips } from '../hooks/useTrips';
import { GlobalCard } from '../../../shared/components';
import { vehiclesService } from '../../vehicles/services/vehicles.service';
import { driversService } from '../../drivers/services/drivers.service';
import type { Driver, Vehicle } from '../../../types';

interface ThemeContext {
  dark: boolean;
}

const TripsPage = () => {
  const { dark } = useOutletContext<ThemeContext>();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionTripId, setActionTripId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const {
    trips,
    meta,
    isLoading,
    error,
    createTrip,
    startTrip,
    completeTrip,
    cancelTrip,
  } = useTrips({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page: 1,
    limit: 50,
  });

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = `${trip.driver?.name ?? ''} ${trip.vehicle?.name ?? ''} ${trip.vehicle?.plaque_immatriculation ?? ''} ${trip.startLocation} ${trip.endLocation}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const loadFormLookups = useCallback(async () => {
    try {
      const [vehiclesData, driversData] = await Promise.all([
        vehiclesService.getVehicles(),
        driversService.getDrivers(),
      ]);
      setVehicles(vehiclesData ?? []);
      setDrivers(driversData ?? []);
    } catch {
      // Form-level errors are surfaced on submit if lookup fetch fails silently.
    }
  }, []);

  useEffect(() => {
    loadFormLookups();
  }, [loadFormLookups]);

  const handleStart = async (tripId: string) => {
    setActionTripId(tripId);
    try {
      await startTrip(tripId);
    } finally {
      setActionTripId(null);
    }
  };

  const handleComplete = async (tripId: string) => {
    setActionTripId(tripId);
    try {
      await completeTrip(tripId, { endTime: new Date().toISOString() });
    } finally {
      setActionTripId(null);
    }
  };

  const handleCancel = async (tripId: string) => {
    setActionTripId(tripId);
    try {
      await cancelTrip(tripId);
    } finally {
      setActionTripId(null);
    }
  };

  const handleCreateTrip = async (payload: {
    vehicleId: string;
    userId: string;
    startLocation: string;
    endLocation: string;
    startTime: string;
    distance: number;
    region?: string;
  }) => {
    try {
      setSubmitError(null);
      setIsSubmitting(true);
      await createTrip(payload);
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: { message?: string; errors?: string[] } } })?.response;
      const message = response?.data?.message;
      const detailed = Array.isArray(response?.data?.errors) ? response?.data?.errors.join(' | ') : null;
      setSubmitError(detailed || message || 'Failed to create trip.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-8 lg:space-y-10 animate-fade-in">
        <div
          className={`rounded-[24px] border p-6 sm:p-8 lg:p-10 space-y-8 ${
            dark ? 'border-slate-700/80 bg-slate-900/35 backdrop-blur-sm' : 'border-slate-200/90 bg-white/70 backdrop-blur-md shadow-soft'
          }`}
        >
          <TripsHeader
            dark={dark}
            tripCount={meta.totalItems || filteredTrips.length}
            onAdd={() => {
              setSubmitError(null);
              setIsAddModalOpen(true);
            }}
          />
          <TripsFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            dark={dark}
          />
          {error && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${dark ? 'border-red-900/50 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
              {error}
            </div>
          )}
          {isLoading ? (
            <div className={`text-center py-16 rounded-2xl border ${dark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
              Loading trips...
            </div>
          ) : (
            <TripsList
              trips={filteredTrips}
              dark={dark}
              onStart={handleStart}
              onComplete={handleComplete}
              onCancel={handleCancel}
              actionTripId={actionTripId}
            />
          )}
        </div>
      </div>

      <GlobalCard
        isOpen={isAddModalOpen}
        onClose={() => {
          if (isSubmitting) return;
          setIsAddModalOpen(false);
          setSubmitError(null);
        }}
        title="Schedule trip"
        maxWidth="2xl"
      >
        {submitError && (
          <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${dark ? 'border-red-900/50 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {submitError}
          </div>
        )}
        <TripForm
          vehicles={vehicles}
          drivers={drivers}
          dark={dark}
          isSubmitting={isSubmitting}
          onSubmit={handleCreateTrip}
          onCancel={() => {
            if (isSubmitting) return;
            setIsAddModalOpen(false);
            setSubmitError(null);
          }}
        />
      </GlobalCard>
    </>
  );
};

export default TripsPage;