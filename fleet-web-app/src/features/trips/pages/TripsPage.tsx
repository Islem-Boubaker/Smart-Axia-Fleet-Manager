import { useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import TripsHeader from '../components/TripsHeader';
import TripsFilters from '../components/TripsFilters';
import TripsList from '../components/TripsList';
import TripForm from '../components/TripForm';
import TripDetailsView from '../components/TripDetailsView';
import { useTrips } from '../hooks/useTrips';
import { tripsService, type RankedRecommendationItem } from '../services/trips.service';
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

const buildVehicleLabel = (vehicle: Vehicle) => (
  vehicle.plaque_immatriculation ? `${vehicle.name} (${vehicle.plaque_immatriculation})` : vehicle.name
);

const TripsPage = () => {
  const { dark } = useOutletContext<ThemeContext>();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialStatusParam = searchParams.get('status');
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
  const [recommendations, setRecommendations] = useState<{ drivers: RankedRecommendationItem[]; vehicles: RankedRecommendationItem[] } | null>(null);
  const [isFetchingRecs, setIsFetchingRecs] = useState(false);

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
    startLatitude?: number;
    startLongitude?: number;
    endLocation: string;
    endLatitude?: number;
    endLongitude?: number;
    startTime: string;
    endTime?: string;
    region?: string;
    requiredCapacity?: number;
    loadType?: 'general' | 'cold' | 'fragile' | 'heavy';
    distance: number;
    distance_in_meters?: number;
    estimated_duration_seconds?: number;
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
      setSubmitError(detailed || message || t('trips.errors.createFailed'));
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
    if (!editValues.vehicleId) nextErrors.vehicleId = t('trips.form.errors.vehicleRequired');
    if (!editValues.userId) nextErrors.userId = t('trips.form.errors.driverRequired');
    if (editValues.startLocation.trim().length < 2) nextErrors.startLocation = t('trips.form.errors.startRequired');
    if (editValues.endLocation.trim().length < 2) nextErrors.endLocation = t('trips.form.errors.destinationRequired');
    if (!editValues.startTime) nextErrors.startTime = t('trips.form.errors.startTimeRequired');
    if (!editValues.region) nextErrors.region = t('trips.form.errors.regionRequired');
    if (!editValues.requiredCapacity || Number(editValues.requiredCapacity) <= 0) {
      nextErrors.requiredCapacity = t('trips.form.errors.capacityPositive');
    }

    const distance = Number(editValues.distance);
    if (Number.isNaN(distance) || distance <= 0) {
      nextErrors.distance = t('trips.form.errors.distancePositive');
    }

    if (editValues.endTime) {
      const startDate = new Date(editValues.startTime);
      const endDate = new Date(editValues.endTime);
      if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate <= startDate) {
        nextErrors.endTime = t('trips.errors.endAfterStart');
      }
    }

    if (editValues.fuel.trim().length > 0) {
      const fuel = Number(editValues.fuel);
      if (Number.isNaN(fuel) || fuel < 0) nextErrors.fuel = t('trips.errors.fuelInvalid');
    }

    if (editValues.revenue.trim().length > 0) {
      const revenue = Number(editValues.revenue);
      if (Number.isNaN(revenue) || revenue < 0) nextErrors.revenue = t('trips.form.errors.revenueInvalid');
    }

    if (editValues.notes.trim().length === 1) {
      nextErrors.notes = t('trips.form.errors.notesLength');
    }

    const hasInvalidStop = editStops.some((stop) => stop.locationName.trim().length < 2);
    if (hasInvalidStop) {
      setEditStopsError(t('trips.edit.stopNameLength'));
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
      setEditError(detailed || message || t('trips.errors.updateFailed'));
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleGetEditRecommendations = async () => {
    if (!editValues?.startTime || !editValues?.region) {
      setEditError(t('trips.errors.recStartRegion'));
      return;
    }

    const distanceValue = Number(editValues.distance);
    if (!Number.isFinite(distanceValue) || distanceValue <= 0) {
      setEditError(t('trips.errors.recDistance'));
      return;
    }

    const capacityValue = Number(editValues.requiredCapacity);
    if (!Number.isFinite(capacityValue) || capacityValue <= 0) {
      setEditError(t('trips.errors.recCapacity'));
      return;
    }

    try {
      setIsFetchingRecs(true);
      setEditError(null);
      
      const recs = await tripsService.getTripRecommendations({
        action: 'assignment',
        startTime: new Date(editValues.startTime).toISOString(),
        endTime: editValues.endTime ? new Date(editValues.endTime).toISOString() : undefined,
        region: editValues.region.trim(),
        distance: distanceValue,
        requiredCapacity: capacityValue,
        loadType: 'general',
      });

      setRecommendations(recs);

      // Auto-select the best ones if none are selected
      setEditValues(prev => prev ? ({
        ...prev,
        vehicleId: prev.vehicleId || recs.vehicles[0]?.id || '',
        userId: prev.userId || recs.drivers[0]?.id || ''
      }) : null);

    } catch (err) {
      setEditError(t('trips.errors.recFailed'));
    } finally {
      setIsFetchingRecs(false);
    }
  };

  const vehicleOptions = recommendations?.vehicles?.length
    ? [
        { value: '', label: t('trips.form.selectVehicle') },
        ...[...recommendations.vehicles]
          .map((vehicle) => {
            const score = vehicle.score;
            const baseLabel = vehicle.name || t('common.vehicleDefaultName');
            const scoreLabel = score ? t('common.scoreLabel', { score: Math.round(score) }) : '';
            return {
              value: vehicle.id,
              label: `${baseLabel}${scoreLabel}`,
              score: score || 0,
            };
          })
          .sort((a, b) => b.score - a.score || (a.label || '').localeCompare(b.label || '')),
      ]
    : [
        { value: '', label: t('trips.form.selectVehicle') },
        ...[...vehicles]
          .map((vehicle) => ({
            value: vehicle.id,
            label: buildVehicleLabel(vehicle),
            score: 0,
          }))
          .sort((a, b) => (a.label || '').localeCompare(b.label || '')),
      ];

  const driverOptions = recommendations?.drivers?.length
    ? [
        { value: '', label: t('trips.form.selectDriver') },
        ...[...recommendations.drivers]
          .map((driver) => {
            const score = driver.score;
            const scoreLabel = score ? t('common.scoreLabel', { score: Math.round(score) }) : '';
            return {
              value: driver.id,
              label: `${driver.name}${scoreLabel}`,
              score: score || 0,
            };
          })
          .sort((a, b) => b.score - a.score || (a.label || '').localeCompare(b.label || '')),
      ]
    : [
        { value: '', label: t('trips.form.selectDriver') },
        ...[...drivers]
          .map((driver) => ({
            value: driver.id,
            label: driver.name,
            score: 0,
          }))
          .sort((a, b) => (a.label || '').localeCompare(b.label || '')),
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
              {t('trips.loading')}
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
        title={t('trips.header.scheduleTrip')}
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
        onClose={() => setSelectedTrip(null)}
        title={
          selectedTrip
            ? t('trips.modals.detailsTitleWithId', { id: selectedTrip.id })
            : t('trips.modals.detailsTitle')
        }
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
        title={
          editingTrip
            ? t('trips.modals.editTitleWithId', { id: editingTrip.id })
            : t('trips.modals.editTitle')
        }
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
                <p className={`text-sm font-semibold ${dark ? 'text-indigo-300' : 'text-indigo-700'}`}>{t('trips.form.smartRecTitle')}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{t('trips.form.smartRecHint')}</p>
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
                {recommendations ? t('trips.form.refreshSuggestions') : t('trips.form.getMlSuggestions')}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">{t('trips.form.vehicleLabel')}</label>
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
                <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">{t('trips.form.driverLabel')}</label>
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
                label={t('trips.form.startLocation')}
                value={editValues.startLocation}
                onChange={(e) => handleEditField('startLocation', e.target.value)}
                error={editErrors.startLocation}
              />
              <Input
                label={t('trips.form.finalDestination')}
                value={editValues.endLocation}
                onChange={(e) => handleEditField('endLocation', e.target.value)}
                error={editErrors.endLocation}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('trips.form.startDateTime')}
                type="datetime-local"
                value={editValues.startTime}
                onChange={(e) => handleEditField('startTime', e.target.value)}
                error={editErrors.startTime}
              />
              <Input
                label={t('trips.form.endDateTime')}
                type="datetime-local"
                value={editValues.endTime}
                onChange={(e) => handleEditField('endTime', e.target.value)}
                error={editErrors.endTime}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label={t('trips.form.distanceKm')}
                type="number"
                min="0.1"
                step="0.1"
                value={editValues.distance}
                onChange={(e) => handleEditField('distance', e.target.value)}
                error={editErrors.distance}
              />
              <Input
                label={t('trips.edit.fuelLabel')}
                type="number"
                min="0"
                step="0.1"
                value={editValues.fuel}
                onChange={(e) => handleEditField('fuel', e.target.value)}
                error={editErrors.fuel}
              />
              <Input
                label={t('trips.form.revenueTnd')}
                type="number"
                min="0"
                step="0.1"
                value={editValues.revenue}
                onChange={(e) => handleEditField('revenue', e.target.value)}
                error={editErrors.revenue}
              />
              <Input
                label={t('common.region')}
                value={editValues.region}
                onChange={(e) => handleEditField('region', e.target.value)}
                error={editErrors.region}
              />
              <Input
                label={t('trips.form.reqCapacity')}
                type="number"
                min="1"
                value={editValues.requiredCapacity}
                onChange={(e) => handleEditField('requiredCapacity', e.target.value)}
                error={editErrors.requiredCapacity}
              />
            </div>

            <div>
              <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">{t('trips.form.notesOptional')}</label>
              <textarea
                value={editValues.notes}
                onChange={(e) => handleEditField('notes', e.target.value)}
                rows={3}
                className={`w-full px-4 py-2.5 border text-sm rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand ${
                  dark
                    ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 hover:border-slate-600'
                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 hover:border-gray-300'
                } ${editErrors.notes ? 'border-red-500' : ''}`}
                placeholder={t('trips.form.notesPlaceholder')}
              />
              {editErrors.notes && <p className="mt-1 text-sm text-red-600">{editErrors.notes}</p>}
            </div>

            <div className={`rounded-2xl border p-4 space-y-3 ${dark ? 'border-slate-700/80 bg-slate-900/30' : 'border-slate-200/90 bg-white/70'}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                    <p className={`text-sm font-semibold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{t('trips.edit.stopsTitle')}</p>
                    <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t('trips.edit.stopsHint')}
                    </p>
                </div>
                <Button type="button" size="sm" variant="secondary" onClick={handleAddEditStop} disabled={isEditSubmitting}>
                    {t('trips.form.addStop')}
                </Button>
              </div>

              {editStopsError && <p className="text-sm text-red-600">{editStopsError}</p>}

              <div className="space-y-3">
                {editStops.length === 0 ? (
                    <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t('trips.edit.noStops')}</p>
                ) : (
                  editStops.map((stop, index) => (
                    <div key={stop.tempId} className={`rounded-xl border p-3 ${dark ? 'border-slate-700 bg-slate-800/40' : 'border-slate-200 bg-slate-50/80'}`}>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {t('trips.edit.stopNumber', { n: index + 1 })}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => moveEditStop(index, index - 1)}
                            disabled={isEditSubmitting || editingTrip?.status !== 'scheduled' || index === 0}
                          >
                              {t('trips.edit.moveUp')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => moveEditStop(index, index + 1)}
                            disabled={isEditSubmitting || editingTrip?.status !== 'scheduled' || index === editStops.length - 1}
                          >
                              {t('trips.edit.moveDown')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => handleRemoveEditStop(stop.tempId)}
                            disabled={isEditSubmitting}
                          >
                              {t('common.remove')}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                            label={t('trips.edit.stopName')}
                          value={stop.locationName}
                          onChange={(e) => handleEditStopField(stop.tempId, 'locationName', e.target.value)}
                        />
                        <Input
                            label={t('trips.edit.estimatedArrival')}
                          type="datetime-local"
                          value={stop.estimatedArrival}
                          onChange={(e) => handleEditStopField(stop.tempId, 'estimatedArrival', e.target.value)}
                        />
                      </div>

                      <div className="mt-3">
                          <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">{t('trips.edit.stopNotesLabel')}</label>
                        <textarea
                          value={stop.notes}
                          onChange={(e) => handleEditStopField(stop.tempId, 'notes', e.target.value)}
                          rows={2}
                          className={`w-full px-4 py-2.5 border text-sm rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand ${
                            dark
                              ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 hover:border-slate-600'
                              : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 hover:border-gray-300'
                          }`}
                            placeholder={t('trips.edit.stopNotesPlaceholder')}
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
                {t('common.cancel')}
              </Button>
              <Button type="button" onClick={handleSaveEdit} isLoading={isEditSubmitting}>
                {t('common.saveChanges')}
              </Button>
            </div>
          </div>
        )}
      </GlobalCard>
    </>
  );
};

export default TripsPage;