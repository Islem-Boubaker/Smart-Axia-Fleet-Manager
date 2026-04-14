import { useMemo, useState } from 'react';
import { Button, Input } from '../../../shared/components';
import type { Driver, Vehicle } from '../../../types';

type TripFormValues = {
  vehicleId: string;
  userId: string;
  startLocation: string;
  endLocation: string;
  startTime: string;
  distance: string;
  region: string;
};

interface TripFormProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  dark?: boolean;
  isSubmitting?: boolean;
  onSubmit: (data: {
    vehicleId: string;
    userId: string;
    startLocation: string;
    endLocation: string;
    startTime: string;
    distance: number;
    region?: string;
  }) => Promise<void> | void;
  onCancel: () => void;
}

const TripForm = ({ vehicles, drivers, dark = false, isSubmitting = false, onSubmit, onCancel }: TripFormProps) => {
  const [values, setValues] = useState<TripFormValues>({
    vehicleId: '',
    userId: '',
    startLocation: '',
    endLocation: '',
    startTime: '',
    distance: '',
    region: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TripFormValues, string>>>({});

  const selectClass = `w-full px-4 py-2.5 border text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand ${
    dark
      ? 'bg-slate-800/80 border-slate-700 text-slate-100'
      : 'bg-white border-gray-200 text-gray-900'
  }`;

  const sortedVehicles = useMemo(
    () => [...vehicles].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [vehicles]
  );

  const sortedDrivers = useMemo(
    () => [...drivers].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [drivers]
  );

  const onFieldChange = (field: keyof TripFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof TripFormValues, string>> = {};

    if (!values.vehicleId) nextErrors.vehicleId = 'Vehicle is required.';
    if (!values.userId) nextErrors.userId = 'Driver is required.';
    if (values.startLocation.trim().length < 2) nextErrors.startLocation = 'Start location must be at least 2 characters.';
    if (values.endLocation.trim().length < 2) nextErrors.endLocation = 'End location must be at least 2 characters.';
    if (!values.startTime) nextErrors.startTime = 'Start date/time is required.';

    const distanceValue = Number(values.distance);
    if (!values.distance || Number.isNaN(distanceValue) || distanceValue <= 0) {
      nextErrors.distance = 'Distance must be a positive number.';
    }

    if (values.region.trim().length === 1) {
      nextErrors.region = 'Region must be at least 2 characters.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    await onSubmit({
      vehicleId: values.vehicleId,
      userId: values.userId,
      startLocation: values.startLocation.trim(),
      endLocation: values.endLocation.trim(),
      startTime: new Date(values.startTime).toISOString(),
      distance: Number(values.distance),
      region: values.region.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">Vehicle</label>
          <select
            value={values.vehicleId}
            onChange={(e) => onFieldChange('vehicleId', e.target.value)}
            className={`${selectClass} ${
              errors.vehicleId ? '!border-red-500' : ''
            }`}
          >
            <option value="">Select a vehicle</option>
            {sortedVehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name}
                {vehicle.plaque_immatriculation ? ` (${vehicle.plaque_immatriculation})` : ''}
              </option>
            ))}
          </select>
          {errors.vehicleId && <p className="mt-1 text-sm text-red-600">{errors.vehicleId}</p>}
        </div>

        <div>
          <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">Driver</label>
          <select
            value={values.userId}
            onChange={(e) => onFieldChange('userId', e.target.value)}
            className={`${selectClass} ${
              errors.userId ? '!border-red-500' : ''
            }`}
          >
            <option value="">Select a driver</option>
            {sortedDrivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
          </select>
          {errors.userId && <p className="mt-1 text-sm text-red-600">{errors.userId}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Start location"
          value={values.startLocation}
          onChange={(e) => onFieldChange('startLocation', e.target.value)}
          error={errors.startLocation}
          placeholder="e.g. Tunis Center"
        />
        <Input
          label="End location"
          value={values.endLocation}
          onChange={(e) => onFieldChange('endLocation', e.target.value)}
          error={errors.endLocation}
          placeholder="e.g. Sfax Hub"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Start date/time"
          type="datetime-local"
          value={values.startTime}
          onChange={(e) => onFieldChange('startTime', e.target.value)}
          error={errors.startTime}
        />
        <Input
          label="Distance (km)"
          type="number"
          min="1"
          step="0.1"
          value={values.distance}
          onChange={(e) => onFieldChange('distance', e.target.value)}
          error={errors.distance}
          placeholder="e.g. 120"
        />
        <Input
          label="Region (optional)"
          value={values.region}
          onChange={(e) => onFieldChange('region', e.target.value)}
          error={errors.region}
          placeholder="e.g. Greater Tunis"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Create trip
        </Button>
      </div>
    </form>
  );
};

export default TripForm;
