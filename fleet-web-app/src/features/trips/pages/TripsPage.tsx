import { useEffect, useRef, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import TripsHeader from '../components/TripsHeader';
import TripsFilters from '../components/TripsFilters';
import TripsList from '../components/TripsList';
import TripForm from '../components/TripForm';
import TripDetailsView from '../components/TripDetailsView';
import { useTrips } from '../hooks/useTrips';
import { tripsService } from '../services/trips.service';
import { Button, GlobalCard, Input, Select } from '../../../shared/components';
import { vehiclesService } from '../../vehicles/services/vehicles.service';
import { driversService } from '../../drivers/services/drivers.service';
import type { Driver, Trip, TripStop, Vehicle } from '../../../types';
import { pageShellClasses, pageShellInnerSpacing } from '../../../shared/utils/pageShell';
import { queryKeys } from '../../../shared/services/queryKeys';

interface ThemeContext {
  dark: boolean;
}

type TripEditValues = {
  vehicleId: string;
  userId: string;
  startLocation: string;
  endLocation: string;
  startTime: string;
  endTime: string;
  distance: string;
  fuel: string;
  revenue: string;
  region: string;
  requiredCapacity: string;
  notes: string;
};

type EditableStop = {
  id?: string;
  tempId: string;
  locationName: string;
  estimatedArrival: string;
  notes: string;
};

const makeTempId = () => `stop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const toEditableStops = (trip: Trip): EditableStop[] => {
  const sorted = Array.isArray(trip.stops) ? [...trip.stops].sort((a, b) => a.stopOrder - b.stopOrder) : [];
  return sorted.map((stop) => ({
    id: stop.id,
    tempId: makeTempId(),
    locationName: stop.locationName || '',
    estimatedArrival: toDateTimeLocal(stop.estimatedArrival),
    notes: stop.notes || '',
  }));
};

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

const toEditValues = (trip: Trip): TripEditValues => ({
  vehicleId: trip.vehicleId || trip.vehicle?.id || '',
  userId: trip.userId || trip.driver?.id || '',
  startLocation: trip.startLocation || '',
  endLocation: trip.endLocation || '',
  startTime: toDateTimeLocal(trip.startTime),
  endTime: toDateTimeLocal(trip.endTime),
  distance: trip.distance !== undefined && trip.distance !== null ? String(trip.distance) : '',
  fuel: trip.fuel !== undefined && trip.fuel !== null ? String(trip.fuel) : '',
  revenue: trip.revenue !== undefined && trip.revenue !== null ? String(trip.revenue) : '',
  region: trip.region || '',
  requiredCapacity: trip.requiredCapacity !== undefined && trip.requiredCapacity !== null ? String(trip.requiredCapacity) : '',
  notes: trip.notes || '',
});

const TripsPage = () => {
  const { dark } = useOutletContext<ThemeContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatusParam = searchParams.get('status');
  const focusedTripId = searchParams.get('tripId');
  const initialStatus = ['all', 'scheduled', 'ongoing', 'completed', 'cancelled'].includes(initialStatusParam || '')
    ? (initialStatusParam as string)
    : 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [actionTripId, setActionTripId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [editValues, setEditValues] = useState<TripEditValues | null>(null);
  const [editStops, setEditStops] = useState<EditableStop[]>([]);
  const [editErrors, setEditErrors] = useState<Partial<Record<keyof TripEditValues, string>>>({});
  const [editStopsError, setEditStopsError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<{ drivers: Driver[]; vehicles: Vehicle[] } | null>(null);
  const [isFetchingRecs, setIsFetchingRecs] = useState(false);
  const dismissedFocusedTripIdRef = useRef<string | null>(null);

  const [editError, setEditError] = useState<string | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const vehiclesQuery = useQuery({
    queryKey: queryKeys.vehicles.lists(),
    queryFn: vehiclesService.getVehicles,
  });

  const driversQuery = useQuery({
    queryKey: queryKeys.drivers.lists(),
    queryFn: driversService.getDrivers,
  });

  const vehicles = (vehiclesQuery.data ?? []) as Vehicle[];
  const drivers = (driversQuery.data ?? []) as Driver[];

  const {
    trips,
    meta,
    isLoading,
    error,
    refetch,
    createTrip,
    updateTrip,
    startTrip,
    reachStop,
    completeTrip,
    cancelTrip,
  } = useTrips({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page: 1,
    limit: 50,
    includeStops: true,
  });

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = `${trip.driver?.name ?? ''} ${trip.vehicle?.name ?? ''} ${trip.vehicle?.plaque_immatriculation ?? ''} ${trip.startLocation} ${trip.endLocation}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  useEffect(() => {
    if (!focusedTripId) {
      dismissedFocusedTripIdRef.current = null;
      return;
    }

    if (dismissedFocusedTripIdRef.current === focusedTripId) return;
    if (!focusedTripId || selectedTrip?.id === focusedTripId) return;

    const matchedTrip = trips.find((trip) => trip.id === focusedTripId);
    if (matchedTrip) {
      setSelectedTrip(matchedTrip);
      return;
    }

    let isMounted = true;
    tripsService
      .getTripById(focusedTripId)
      .then((trip: Trip) => {
        if (isMounted) setSelectedTrip(trip);
      })
      .catch(() => {
        // If the trip was removed or the user lost access, keep the page usable.
      });

    return () => {
      isMounted = false;
    };
  }, [focusedTripId, selectedTrip?.id, trips]);

  const closeTripDetails = () => {
    dismissedFocusedTripIdRef.current = selectedTrip?.id || focusedTripId;
    setSelectedTrip(null);

    if (!searchParams.has('tripId')) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('tripId');
    setSearchParams(nextParams, { replace: true });
  };

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

  const handleReachStop = async (tripId: string, stopId: string) => {
    setActionTripId(tripId);
    try {
      await reachStop(tripId, stopId, new Date().toISOString());
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
    fuel?: number;
    revenue?: number;
    notes?: string;
    stops?: Array<{
      locationName: string;
      stopOrder: number;
      latitude?: number;
      longitude?: number;
    }>;
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

  const handleOpenEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setEditValues(toEditValues(trip));
    setEditStops(toEditableStops(trip));
    setEditErrors({});
    setEditStopsError(null);
    setEditError(null);
  };

  const handleEditField = (field: keyof TripEditValues, value: string) => {
    setEditValues((prev) => (prev ? { ...prev, [field]: value } : prev));
    setEditErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateEdit = () => {
    if (!editValues) return false;

    const nextErrors: Partial<Record<keyof TripEditValues, string>> = {};
    if (!editValues.vehicleId) nextErrors.vehicleId = 'Vehicle is required.';
    if (!editValues.userId) nextErrors.userId = 'Driver is required.';
    if (editValues.startLocation.trim().length < 2) nextErrors.startLocation = 'Start location must be at least 2 characters.';
    if (editValues.endLocation.trim().length < 2) nextErrors.endLocation = 'End location must be at least 2 characters.';
    if (!editValues.startTime) nextErrors.startTime = 'Start date/time is required.';
    if (!editValues.region) nextErrors.region = 'Region is required.';
    if (!editValues.requiredCapacity || Number(editValues.requiredCapacity) <= 0) {
      nextErrors.requiredCapacity = 'Capacity must be greater than 0.';
    }

    const distance = Number(editValues.distance);
    if (Number.isNaN(distance) || distance <= 0) {
      nextErrors.distance = 'Distance must be a positive number.';
    }

    if (editValues.endTime) {
      const startDate = new Date(editValues.startTime);
      const endDate = new Date(editValues.endTime);
      if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate <= startDate) {
        nextErrors.endTime = 'End date/time must be after start date/time.';
      }
    }

    if (editValues.fuel.trim().length > 0) {
      const fuel = Number(editValues.fuel);
      if (Number.isNaN(fuel) || fuel < 0) nextErrors.fuel = 'Fuel must be a non-negative number.';
    }

    if (editValues.revenue.trim().length > 0) {
      const revenue = Number(editValues.revenue);
      if (Number.isNaN(revenue) || revenue < 0) nextErrors.revenue = 'Revenue must be a non-negative number.';
    }

    if (editValues.notes.trim().length === 1) {
      nextErrors.notes = 'Notes must be at least 2 characters if provided.';
    }

    const hasInvalidStop = editStops.some((stop) => stop.locationName.trim().length < 2);
    if (hasInvalidStop) {
      setEditStopsError('Each stop name must be at least 2 characters.');
    } else {
      setEditStopsError(null);
    }

    setEditErrors(nextErrors);
    return Object.keys(nextErrors).length === 0 && !hasInvalidStop;
  };

  const handleEditStopField = (tempId: string, field: keyof Omit<EditableStop, 'id' | 'tempId'>, value: string) => {
    setEditStops((prev) => prev.map((stop) => (stop.tempId === tempId ? { ...stop, [field]: value } : stop)));
    setEditStopsError(null);
  };

  const handleAddEditStop = () => {
    setEditStops((prev) => [
      ...prev,
      {
        tempId: makeTempId(),
        locationName: '',
        estimatedArrival: '',
        notes: '',
      },
    ]);
    setEditStopsError(null);
  };

  const handleRemoveEditStop = (tempId: string) => {
    setEditStops((prev) => prev.filter((stop) => stop.tempId !== tempId));
    setEditStopsError(null);
  };

  const moveEditStop = (fromIndex: number, toIndex: number) => {
    setEditStops((prev) => {
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTrip || !editValues) return;
    if (!validateEdit()) return;

    try {
      setIsEditSubmitting(true);
      setEditError(null);

      await updateTrip(editingTrip.id, {
        vehicleId: editValues.vehicleId,
        userId: editValues.userId,
        startLocation: editValues.startLocation.trim(),
        endLocation: editValues.endLocation.trim(),
        startTime: new Date(editValues.startTime).toISOString(),
        endTime: editValues.endTime ? new Date(editValues.endTime).toISOString() : undefined,
        region: editValues.region.trim(),
        requiredCapacity: Number(editValues.requiredCapacity),
        distance: Number(editValues.distance),
        fuel: editValues.fuel.trim().length > 0 ? Number(editValues.fuel) : undefined,
        revenue: editValues.revenue.trim().length > 0 ? Number(editValues.revenue) : undefined,
        notes: editValues.notes.trim().length > 0 ? editValues.notes.trim() : undefined,
      });

      const originalStops = (Array.isArray(editingTrip.stops) ? [...editingTrip.stops] : []).sort((a, b) => a.stopOrder - b.stopOrder);
      const originalById = new Map(originalStops.map((stop) => [stop.id, stop]));
      const editedExistingStops = editStops.filter((stop): stop is EditableStop & { id: string } => Boolean(stop.id));
      const editedStopIds = new Set(editedExistingStops.map((stop) => stop.id));

      for (const stop of editedExistingStops) {
        const original = originalById.get(stop.id);
        if (!original) continue;

        const nextEstimatedArrival = stop.estimatedArrival ? new Date(stop.estimatedArrival).toISOString() : undefined;
        const changed =
          original.locationName !== stop.locationName.trim() ||
          (original.notes || '') !== stop.notes.trim() ||
          (original.estimatedArrival || '') !== (nextEstimatedArrival || '');

        if (changed) {
          await tripsService.updateTripStop(editingTrip.id, stop.id, {
            locationName: stop.locationName.trim(),
            notes: stop.notes.trim().length > 0 ? stop.notes.trim() : undefined,
            estimatedArrival: nextEstimatedArrival,
          });
        }
      }

      for (const originalStop of originalStops) {
        if (!editedStopIds.has(originalStop.id)) {
          await tripsService.deleteTripStop(editingTrip.id, originalStop.id);
        }
      }

      const newStops = editStops.filter((stop) => !stop.id);
      const createdStopsByTempId = new Map<string, TripStop>();
      if (newStops.length > 0) {
        const baseOrder = Math.max(0, ...originalStops.map((stop) => stop.stopOrder)) + 100;
        const createdStops = await tripsService.addTripStops(
          editingTrip.id,
          newStops.map((stop, index) => ({
            locationName: stop.locationName.trim(),
            stopOrder: baseOrder + index,
            estimatedArrival: stop.estimatedArrival ? new Date(stop.estimatedArrival).toISOString() : undefined,
            notes: stop.notes.trim().length > 0 ? stop.notes.trim() : undefined,
          }))
        );

        newStops.forEach((stop, index) => {
          const created = createdStops[index];
          if (created) createdStopsByTempId.set(stop.tempId, created);
        });
      }

      if (editingTrip.status === 'scheduled' && editStops.length > 0) {
        const orderMap = editStops
          .map((stop, index) => {
            const stopId = stop.id || createdStopsByTempId.get(stop.tempId)?.id;
            if (!stopId) return null;
            return { stopId, stopOrder: index + 1 };
          })
          .filter((entry): entry is { stopId: string; stopOrder: number } => Boolean(entry));

        if (orderMap.length > 0) {
          await tripsService.reorderTripStops(editingTrip.id, orderMap);
        }
      }

      await refetch();

      setEditingTrip(null);
      setEditValues(null);
      setEditStops([]);
      setEditErrors({});
      setEditStopsError(null);
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { message?: string; errors?: string[] } } })?.response;
      const message = response?.data?.message;
      const detailed = Array.isArray(response?.data?.errors) ? response?.data?.errors.join(' | ') : null;
      setEditError(detailed || message || 'Failed to update trip.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleGetEditRecommendations = async () => {
    if (!editValues?.startTime || !editValues?.region) {
      setEditError('Please set a start time, region, and required capacity first to get accurate recommendations.');
      return;
    }

    try {
      setIsFetchingRecs(true);
      setEditError(null);
      
      const recs = await tripsService.getTripRecommendations({
        startTime: new Date(editValues.startTime).toISOString(),
        endTime: editValues.endTime ? new Date(editValues.endTime).toISOString() : undefined,
        region: editValues.region.trim(),
        distance: Number(editValues.distance) || 0,
        requiredCapacity: Number(editValues.requiredCapacity) || 0
      });

      setRecommendations(recs);

      // Auto-select the best ones if none are selected
      setEditValues(prev => prev ? ({
        ...prev,
        vehicleId: prev.vehicleId || recs.vehicles[0]?.id || '',
        userId: prev.userId || recs.drivers[0]?.id || ''
      }) : null);

    } catch (err) {
      setEditError('Failed to fetch ML recommendations. Using standard lists.');
    } finally {
      setIsFetchingRecs(false);
    }
  };

  const vehicleOptions = [
    { value: '', label: 'Select a vehicle' },
    ...[...vehicles]
      .map((vehicle) => {
        const rec = recommendations?.vehicles?.find((v) => v.id === vehicle.id);
        const score = (rec as any)?.ml_score;
        return {
          value: vehicle.id,
          label: (vehicle.plaque_immatriculation ? `${vehicle.name} (${vehicle.plaque_immatriculation})` : vehicle.name) + (score ? ` (Score: ${Math.round(score)})` : ''),
          score: score || 0
        };
      })
      .sort((a, b) => b.score - a.score || (a.label || '').localeCompare(b.label || '')),
  ];

  const driverOptions = [
    { value: '', label: 'Select a driver' },
    ...[...drivers]
      .map((driver) => {
        const rec = recommendations?.drivers?.find((d) => d.id === driver.id);
        const score = (rec as any)?.ml_score;
        return {
          value: driver.id, 
          label: driver.name + (score ? ` (Score: ${Math.round(score)})` : ''),
          score: score || 0
        };
      })
      .sort((a, b) => b.score - a.score || (a.label || '').localeCompare(b.label || '')),
  ];


  return (
    <>
      <div className={`${pageShellClasses(dark)} ${pageShellInnerSpacing} animate-fade-in`}>
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
              onViewDetails={setSelectedTrip}
              onEdit={handleOpenEdit}
              onStart={handleStart}
              onReachStop={handleReachStop}
              onComplete={handleComplete}
              onCancel={handleCancel}
              actionTripId={actionTripId}
            />
          )}
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

      <GlobalCard
        isOpen={Boolean(selectedTrip)}
        onClose={closeTripDetails}
        title="Trip details"
        maxWidth="2xl"
      >
        {selectedTrip ? <TripDetailsView trip={selectedTrip} dark={dark} /> : null}
      </GlobalCard>

      <GlobalCard
        isOpen={Boolean(editingTrip && editValues)}
        onClose={() => {
          if (isEditSubmitting) return;
          setEditingTrip(null);
          setEditValues(null);
          setEditStops([]);
          setEditErrors({});
          setEditStopsError(null);
          setEditError(null);
        }}
        title="Edit trip"
        maxWidth="2xl"
      >
        {editError && (
          <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${dark ? 'border-red-900/50 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {editError}
          </div>
        )}

        {editValues && (
          <div className="space-y-4">
            <div className={`flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl border ${dark ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-indigo-100 bg-indigo-50/50'} gap-4`}>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${dark ? 'text-indigo-300' : 'text-indigo-700'}`}>Smart Recommendation</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Rank drivers and vehicles for this specific route.</p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleGetEditRecommendations}
                isLoading={isFetchingRecs}
                disabled={!editValues.startTime || isFetchingRecs}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm whitespace-nowrap"
              >
                {recommendations ? 'Refresh Suggestions' : 'Get ML Suggestions'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">Vehicle</label>
                <Select
                  value={editValues.vehicleId}
                  onChange={(value) => handleEditField('vehicleId', value)}
                  dark={dark}
                  options={vehicleOptions}
                  className={editErrors.vehicleId ? '[&>button]:!border-red-500' : ''}
                />
                {editErrors.vehicleId && <p className="mt-1 text-sm text-red-600">{editErrors.vehicleId}</p>}
              </div>
              <div>
                <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">Driver</label>
                <Select
                  value={editValues.userId}
                  onChange={(value) => handleEditField('userId', value)}
                  dark={dark}
                  options={driverOptions}
                  className={editErrors.userId ? '[&>button]:!border-red-500' : ''}
                />
                {editErrors.userId && <p className="mt-1 text-sm text-red-600">{editErrors.userId}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start location"
                value={editValues.startLocation}
                onChange={(e) => handleEditField('startLocation', e.target.value)}
                error={editErrors.startLocation}
              />
              <Input
                label="End location"
                value={editValues.endLocation}
                onChange={(e) => handleEditField('endLocation', e.target.value)}
                error={editErrors.endLocation}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start date/time"
                type="datetime-local"
                value={editValues.startTime}
                onChange={(e) => handleEditField('startTime', e.target.value)}
                error={editErrors.startTime}
              />
              <Input
                label="End date/time"
                type="datetime-local"
                value={editValues.endTime}
                onChange={(e) => handleEditField('endTime', e.target.value)}
                error={editErrors.endTime}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Distance (km)"
                type="number"
                min="0.1"
                step="0.1"
                value={editValues.distance}
                onChange={(e) => handleEditField('distance', e.target.value)}
                error={editErrors.distance}
              />
              <Input
                label="Fuel (L)"
                type="number"
                min="0"
                step="0.1"
                value={editValues.fuel}
                onChange={(e) => handleEditField('fuel', e.target.value)}
                error={editErrors.fuel}
              />
              <Input
                label="Revenue (TND)"
                type="number"
                min="0"
                step="0.1"
                value={editValues.revenue}
                onChange={(e) => handleEditField('revenue', e.target.value)}
                error={editErrors.revenue}
              />
              <Input
                label="Region"
                value={editValues.region}
                onChange={(e) => handleEditField('region', e.target.value)}
                error={editErrors.region}
              />
              <Input
                label="Req. Capacity (kg)"
                type="number"
                min="1"
                value={editValues.requiredCapacity}
                onChange={(e) => handleEditField('requiredCapacity', e.target.value)}
                error={editErrors.requiredCapacity}
              />
            </div>

            <div>
              <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">Notes (optional)</label>
              <textarea
                value={editValues.notes}
                onChange={(e) => handleEditField('notes', e.target.value)}
                rows={3}
                className={`w-full px-4 py-2.5 border text-sm rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand ${
                  dark
                    ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 hover:border-slate-600'
                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 hover:border-gray-300'
                } ${editErrors.notes ? 'border-red-500' : ''}`}
                placeholder="Add notes..."
              />
              {editErrors.notes && <p className="mt-1 text-sm text-red-600">{editErrors.notes}</p>}
            </div>

            <div className={`rounded-2xl border p-4 space-y-3 ${dark ? 'border-slate-700/80 bg-slate-900/30' : 'border-slate-200/90 bg-white/70'}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={`text-sm font-semibold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>Stops</p>
                  <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Edit stop names, notes, ETA, add/remove stops, and reorder when trip is scheduled.
                  </p>
                </div>
                <Button type="button" size="sm" variant="secondary" onClick={handleAddEditStop} disabled={isEditSubmitting}>
                  Add stop
                </Button>
              </div>

              {editStopsError && <p className="text-sm text-red-600">{editStopsError}</p>}

              <div className="space-y-3">
                {editStops.length === 0 ? (
                  <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>No stops yet.</p>
                ) : (
                  editStops.map((stop, index) => (
                    <div key={stop.tempId} className={`rounded-xl border p-3 ${dark ? 'border-slate-700 bg-slate-800/40' : 'border-slate-200 bg-slate-50/80'}`}>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Stop {index + 1}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => moveEditStop(index, index - 1)}
                            disabled={isEditSubmitting || editingTrip?.status !== 'scheduled' || index === 0}
                          >
                            Up
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => moveEditStop(index, index + 1)}
                            disabled={isEditSubmitting || editingTrip?.status !== 'scheduled' || index === editStops.length - 1}
                          >
                            Down
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => handleRemoveEditStop(stop.tempId)}
                            disabled={isEditSubmitting}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          label="Stop name"
                          value={stop.locationName}
                          onChange={(e) => handleEditStopField(stop.tempId, 'locationName', e.target.value)}
                        />
                        <Input
                          label="Estimated arrival"
                          type="datetime-local"
                          value={stop.estimatedArrival}
                          onChange={(e) => handleEditStopField(stop.tempId, 'estimatedArrival', e.target.value)}
                        />
                      </div>

                      <div className="mt-3">
                        <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">Stop notes (optional)</label>
                        <textarea
                          value={stop.notes}
                          onChange={(e) => handleEditStopField(stop.tempId, 'notes', e.target.value)}
                          rows={2}
                          className={`w-full px-4 py-2.5 border text-sm rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand ${
                            dark
                              ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 hover:border-slate-600'
                              : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 hover:border-gray-300'
                          }`}
                          placeholder="Optional note for this stop"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (isEditSubmitting) return;
                  setEditingTrip(null);
                  setEditValues(null);
                  setEditStops([]);
                  setEditErrors({});
                  setEditStopsError(null);
                  setEditError(null);
                }}
                disabled={isEditSubmitting}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveEdit} isLoading={isEditSubmitting}>
                Save changes
              </Button>
            </div>
          </div>
        )}
      </GlobalCard>
    </>
  );
};

export default TripsPage;
