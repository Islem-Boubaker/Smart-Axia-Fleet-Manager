import { useState } from 'react';
import type { FormEvent } from 'react';
import { FiTruck, FiPlus } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Input, Select } from '../../../shared/components';
import type { Vehicle } from '../../../types';

interface VehicleFormProps {
  vehicle?: Partial<Vehicle>;
  dark?: boolean;
  onSubmit: (data: Partial<Vehicle> | FormData) => void;
  onCancel: () => void;
  error?: string;
}

const labelClass = 'block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5';

const SectionHeader = ({ label }: { label: string }) => (
  <div className="col-span-2 flex items-center gap-3 pt-2">
    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 whitespace-nowrap">
      {label}
    </span>
    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
  </div>
);

// Returns a numeric string only when the value is a finite number; otherwise the fallback.
const safeNumStr = (v: unknown, fallback = ''): string => {
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : fallback;
};

// Returns the value only if it's one of the allowed options; otherwise the fallback.
const safeEnum = <T extends string>(v: unknown, allowed: T[], fallback: T | ''): T | '' => {
  if (typeof v === 'string' && (allowed as string[]).includes(v)) return v as T;
  return fallback;
};

const firstPhoto = (photos: unknown): string | null => {
  if (Array.isArray(photos) && photos.length > 0 && typeof photos[0] === 'string') return photos[0];
  if (typeof photos === 'string' && photos.trim().length > 0) return photos;
  return null;
};

const resolveInitialStatus = (vehicle?: Partial<Vehicle>): Vehicle['status'] => {
  if (vehicle?.status) return vehicle.status;
  if (vehicle?.Need_Maintenance) return 'IN_MAINTENANCE';
  if (vehicle?.Active === false) return 'OUT_OF_SERVICE';
  return 'AVAILABLE';
};

const resolveVehicleType = (vehicle?: Partial<Vehicle>): string => {
  if (vehicle?.type) return vehicle.type;
  const vt = (vehicle?.vehicle_type ?? vehicle?.Vehicle_Model ?? '').toLowerCase();
  if (vt === 'suv') return 'suv';
  if (vt === 'van') return 'van';
  if (vt === 'truck') return 'truck';
  if (vt === 'bus') return 'bus';
  if (vt === 'motorcycle') return 'motorcycle';
  return 'car';
};

const VehicleForm = ({ vehicle, dark = false, onSubmit, onCancel, error }: VehicleFormProps) => {
  const { t } = useTranslation();
  const isEdit = Boolean(vehicle?.id);

  const [formData, setFormData] = useState({
    // ── Identity ────────────────────────────────────────────────────────────
    name: vehicle?.name ?? '',
    vin: vehicle?.vin ?? '',
    plaque_immatriculation: vehicle?.plaque_immatriculation ?? '',
    brand: vehicle?.brand ?? '',
    model: vehicle?.model ?? '',
    year: vehicle?.year != null ? String(vehicle.year) : '',

    // ── Type & Specs ─────────────────────────────────────────────────────────
    vehicle_type: resolveVehicleType(vehicle),
    fuel_type: safeEnum(vehicle?.fuel_type, ['gasoline', 'diesel', 'electric', 'hybrid', 'lpg'], ''),
    transmission_type: safeEnum(vehicle?.transmission_type, ['manual', 'automatic', 'cvt', 'dct'], ''),
    engine_size: safeNumStr(vehicle?.engine_size ?? vehicle?.Engine_Size),
    fuel_efficiency: safeNumStr(vehicle?.fuel_efficiency),
    capacity: safeNumStr(vehicle?.capacity ?? vehicle?.max_load),
    loadType: safeEnum(vehicle?.loadType, ['general', 'cold', 'fragile', 'heavy'], 'general') || 'general',

    // ── Status & Compliance ──────────────────────────────────────────────────
    status: resolveInitialStatus(vehicle),
    insurance_expiry_date: vehicle?.insurance_expiry_date ?? '',
    tech_visit_expiry_date: vehicle?.tech_visit_expiry_date ?? '',

    // ── Usage & Condition ────────────────────────────────────────────────────
    mileage: safeNumStr(vehicle?.mileage ?? vehicle?.Mileage, '0'),
    avg_daily_km: safeNumStr(vehicle?.avg_daily_km),
    driving_profile: safeEnum(vehicle?.driving_profile, ['city', 'highway', 'mixed', 'off_road'], 'mixed') || 'mixed',
    climate_zone: safeEnum(vehicle?.climate_zone, ['hot_dry', 'cold', 'humid', 'temperate'], 'hot_dry') || 'hot_dry',
    conditionRating: safeNumStr(vehicle?.conditionRating, '7'),
    accident_count: safeNumStr(vehicle?.accident_count, '0'),

    // ── Component Ages ───────────────────────────────────────────────────────
    tire_age: safeNumStr(vehicle?.tire_age),
    brake_age: safeNumStr(vehicle?.brake_age),
    battery_status: safeNumStr(vehicle?.battery_status),

    // ── Service History ──────────────────────────────────────────────────────
    last_service_date: vehicle?.last_service_date ?? '',
    last_oil_change_mileage: safeNumStr(vehicle?.last_oil_change_mileage),
    last_tire_change_mileage: safeNumStr(vehicle?.last_tire_change_mileage),
    last_brake_change_mileage: safeNumStr(vehicle?.last_brake_change_mileage),
    last_battery_change_date: vehicle?.last_battery_change_date ?? '',
    ac_last_service_date: vehicle?.ac_last_service_date ?? '',
    coolant_last_change_date: vehicle?.coolant_last_change_date ?? '',

    // ── Reported Issues ──────────────────────────────────────────────────────
    reported_issues_text: Array.isArray(vehicle?.reported_issues_text)
      ? vehicle.reported_issues_text.join(', ')
      : '',
  });

  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(firstPhoto(vehicle?.photos));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const toNum = (v: string): number | null => {
    if (v === '' || v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const toStr = (v: string): string | null => (v.trim() === '' ? null : v.trim());

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Map vehicle_type string back to proper enum
    const vehicleTypeMap: Record<string, string> = {
      car: 'Car', suv: 'SUV', van: 'Van', truck: 'Truck', bus: 'Bus', motorcycle: 'Motorcycle',
    };

    const payload: Record<string, unknown> = {
      name: formData.name.trim(),
      vin: toStr(formData.vin),
      plaque_immatriculation: toStr(formData.plaque_immatriculation),
      brand: toStr(formData.brand),
      model: toStr(formData.model),
      year: toNum(formData.year),

      vehicle_type: vehicleTypeMap[formData.vehicle_type] ?? 'Car',
      fuel_type: toStr(formData.fuel_type),
      transmission_type: toStr(formData.transmission_type),
      engine_size: toNum(formData.engine_size),
      fuel_efficiency: toNum(formData.fuel_efficiency),
      capacity: toNum(formData.capacity),
      loadType: formData.loadType || 'general',

      status: formData.status,
      insurance_expiry_date: toStr(formData.insurance_expiry_date),
      tech_visit_expiry_date: toStr(formData.tech_visit_expiry_date),

      mileage: toNum(formData.mileage) ?? 0,
      avg_daily_km: toNum(formData.avg_daily_km),
      driving_profile: toStr(formData.driving_profile),
      climate_zone: toStr(formData.climate_zone),
      conditionRating: toNum(formData.conditionRating) ?? 7,
      accident_count: toNum(formData.accident_count) ?? 0,

      tire_age: toNum(formData.tire_age),
      brake_age: toNum(formData.brake_age),
      battery_status: toNum(formData.battery_status),

      last_service_date: toStr(formData.last_service_date),
      last_oil_change_mileage: toNum(formData.last_oil_change_mileage),
      last_tire_change_mileage: toNum(formData.last_tire_change_mileage),
      last_brake_change_mileage: toNum(formData.last_brake_change_mileage),
      last_battery_change_date: toStr(formData.last_battery_change_date),
      ac_last_service_date: toStr(formData.ac_last_service_date),
      coolant_last_change_date: toStr(formData.coolant_last_change_date),

      reported_issues_text: formData.reported_issues_text
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    if (selectedPhoto) {
      const form = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        if (Array.isArray(value)) {
          value.forEach((item) => form.append(`${key}[]`, String(item)));
        } else {
          form.append(key, value as string | Blob);
        }
      });
      form.append('photos', selectedPhoto);
      onSubmit(form);
    } else {
      onSubmit(payload as Partial<Vehicle>);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Photo + name header */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-brand/10 text-brand ring-[3px] ring-white shadow-md dark:ring-slate-800">
            {previewUrl ? (
              <img src={previewUrl} alt={t('common.vehiclePhotoAlt')} className="h-full w-full object-cover" />
            ) : (
              <FiTruck className="h-7 w-7" />
            )}
          </div>
          <input type="file" accept="image/*" id="vehicle-photo-upload" className="hidden" onChange={handlePhotoChange} />
          <label
            htmlFor="vehicle-photo-upload"
            className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-brand text-white shadow-sm transition-colors hover:bg-brand-deep dark:border-slate-800"
            title={t('common.uploadPhoto')}
          >
            <FiPlus className="h-4 w-4" />
          </label>
        </div>
        <div>
          {formData.name ? (
            <h3 className="text-xl font-bold leading-tight text-gray-900 dark:text-white">{formData.name}</h3>
          ) : (
            <h3 className="text-lg font-medium italic leading-tight text-gray-400 dark:text-slate-500">{t('vehicles.form.newTitle')}</h3>
          )}
          <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">{t('common.vehicleProfile')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">

        {/* ── IDENTIFICATION ─────────────────────────────────────────── */}
        <SectionHeader label={t('vehicles.form.sectionIdentity')} />

        <div className="md:col-span-2">
          <Input label={t('common.name')} name="name" value={formData.name} onChange={handleChange} placeholder={t('common.vehicleName')} required />
        </div>
        <div>
          <Input label={t('common.vin')} name="vin" value={formData.vin} onChange={handleChange} placeholder={t('common.vinPlaceholder')} maxLength={17} />
        </div>
        <div>
          <Input label={t('common.licensePlate')} name="plaque_immatriculation" value={formData.plaque_immatriculation} onChange={handleChange} placeholder={t('common.platePlaceholder')} />
        </div>
        <div>
          <Input label={t('vehicles.form.brand')} name="brand" value={formData.brand} onChange={handleChange} placeholder={t('vehicles.form.brandPlaceholder')} />
        </div>
        <div>
          <Input label={t('vehicles.form.vehicleModel')} name="model" value={formData.model} onChange={handleChange} placeholder={t('vehicles.form.modelPlaceholder')} />
        </div>
        <div>
          <Input label={t('vehicles.form.year')} type="number" name="year" value={formData.year} onChange={handleChange} min="1900" max={new Date().getFullYear() + 1} placeholder="e.g. 2020" />
        </div>

        {/* ── SPECS ──────────────────────────────────────────────────── */}
        <SectionHeader label={t('vehicles.form.sectionSpecs')} />

        <div>
          <label className={labelClass}>{t('common.type')}</label>
          <Select
            value={formData.vehicle_type}
            onChange={(v) => handleSelectChange('vehicle_type', v)}
            dark={dark}
            options={[
              { value: 'car', label: t('vehicles.types.car') },
              { value: 'suv', label: t('vehicles.types.suv') },
              { value: 'van', label: t('vehicles.types.van') },
              { value: 'truck', label: t('vehicles.types.truck') },
              { value: 'bus', label: t('vehicles.types.bus') },
              { value: 'motorcycle', label: t('vehicles.types.motorcycle') },
            ]}
          />
        </div>
        <div>
          <label className={labelClass}>{t('vehicles.form.fuelType')}</label>
          <Select
            value={formData.fuel_type}
            onChange={(v) => handleSelectChange('fuel_type', v)}
            dark={dark}
            options={[
              { value: '', label: t('common.selectType') },
              { value: 'diesel', label: t('vehicles.form.fuelDiesel') },
              { value: 'gasoline', label: t('vehicles.form.fuelGasoline') },
              { value: 'electric', label: t('vehicles.form.fuelElectric') },
              { value: 'hybrid', label: t('vehicles.form.fuelHybrid') },
              { value: 'lpg', label: t('vehicles.form.fuelLpg') },
            ]}
          />
        </div>
        <div>
          <label className={labelClass}>{t('vehicles.form.transmissionType')}</label>
          <Select
            value={formData.transmission_type}
            onChange={(v) => handleSelectChange('transmission_type', v)}
            dark={dark}
            options={[
              { value: '', label: t('common.selectType') },
              { value: 'manual', label: t('vehicles.form.transManual') },
              { value: 'automatic', label: t('vehicles.form.transAutomatic') },
              { value: 'cvt', label: t('vehicles.form.transCvt') },
              { value: 'dct', label: t('vehicles.form.transDct') },
            ]}
          />
        </div>
        <div>
          <Input label={t('common.engineSizeCc')} type="number" name="engine_size" value={formData.engine_size} onChange={handleChange} min="0" placeholder="e.g. 2000" />
        </div>
        <div>
          <Input label={t('vehicles.form.fuelEfficiency')} type="number" name="fuel_efficiency" value={formData.fuel_efficiency} onChange={handleChange} min="0" step="0.1" placeholder="km/L" />
        </div>
        <div>
          <Input label={t('vehicles.form.capacityKg')} type="number" name="capacity" value={formData.capacity} onChange={handleChange} min="0" placeholder="kg" />
        </div>
        <div>
          <label className={labelClass}>{t('vehicles.form.loadType')}</label>
          <Select
            value={formData.loadType}
            onChange={(v) => handleSelectChange('loadType', v)}
            dark={dark}
            options={[
              { value: 'general', label: t('vehicles.form.loadGeneral') },
              { value: 'cold', label: t('vehicles.form.loadCold') },
              { value: 'fragile', label: t('vehicles.form.loadFragile') },
              { value: 'heavy', label: t('vehicles.form.loadHeavy') },
            ]}
          />
        </div>

        {/* ── STATUS & COMPLIANCE ────────────────────────────────────── */}
        <SectionHeader label={t('vehicles.form.sectionCompliance')} />

        <div className="md:col-span-2">
          <label className={labelClass}>{t('vehicles.form.operationalStatus')}</label>
          <Select
            value={formData.status}
            onChange={(v) => handleSelectChange('status', v)}
            dark={dark}
            options={[
              { value: 'AVAILABLE', label: t('status.available') },
              { value: 'IN_MAINTENANCE', label: t('status.maintenance') },
              { value: 'OUT_OF_SERVICE', label: t('status.inactive') },
            ]}
          />
        </div>
        <div>
          <Input label={t('common.insuranceExpiry')} type="date" name="insurance_expiry_date" value={formData.insurance_expiry_date ?? ''} onChange={handleChange} />
        </div>
        <div>
          <Input label={t('common.techVisitExpiry')} type="date" name="tech_visit_expiry_date" value={formData.tech_visit_expiry_date ?? ''} onChange={handleChange} />
        </div>

        {/* ── USAGE & CONDITION ──────────────────────────────────────── */}
        <SectionHeader label={t('vehicles.form.sectionUsage')} />

        <div>
          <Input label={t('common.mileageKm')} type="number" name="mileage" value={formData.mileage} onChange={handleChange} min="0" />
        </div>
        <div>
          <Input label={t('vehicles.form.avgDailyKm')} type="number" name="avg_daily_km" value={formData.avg_daily_km} onChange={handleChange} min="0" placeholder="km/day" />
        </div>
        <div>
          <label className={labelClass}>{t('vehicles.form.drivingProfile')}</label>
          <Select
            value={formData.driving_profile}
            onChange={(v) => handleSelectChange('driving_profile', v)}
            dark={dark}
            options={[
              { value: 'mixed', label: t('vehicles.form.profileMixed') },
              { value: 'city', label: t('vehicles.form.profileCity') },
              { value: 'highway', label: t('vehicles.form.profileHighway') },
              { value: 'off_road', label: t('vehicles.form.profileOffRoad') },
            ]}
          />
        </div>
        <div>
          <label className={labelClass}>{t('vehicles.form.climateZone')}</label>
          <Select
            value={formData.climate_zone}
            onChange={(v) => handleSelectChange('climate_zone', v)}
            dark={dark}
            options={[
              { value: 'hot_dry', label: t('vehicles.form.climateHotDry') },
              { value: 'humid', label: t('vehicles.form.climateHumid') },
              { value: 'temperate', label: t('vehicles.form.climateTemperate') },
              { value: 'cold', label: t('vehicles.form.climateCold') },
            ]}
          />
        </div>
        <div>
          <Input label={t('vehicles.form.conditionRating')} type="number" name="conditionRating" value={formData.conditionRating} onChange={handleChange} min="1" max="10" placeholder="1–10" />
        </div>
        <div>
          <Input label={t('vehicles.form.accidentCount')} type="number" name="accident_count" value={formData.accident_count} onChange={handleChange} min="0" />
        </div>

        {/* ── COMPONENT AGES ─────────────────────────────────────────── */}
        <SectionHeader label={t('vehicles.form.sectionComponentAges')} />

        <div>
          <Input label={t('vehicles.form.tireAge')} type="number" name="tire_age" value={formData.tire_age} onChange={handleChange} min="0" placeholder={t('vehicles.form.yearsPlaceholder')} />
        </div>
        <div>
          <Input label={t('vehicles.form.brakeAge')} type="number" name="brake_age" value={formData.brake_age} onChange={handleChange} min="0" placeholder={t('vehicles.form.yearsPlaceholder')} />
        </div>
        <div>
          <Input label={t('vehicles.form.batteryHealth')} type="number" name="battery_status" value={formData.battery_status} onChange={handleChange} min="0" max="100" placeholder="0–100 %" />
        </div>

        {/* ── SERVICE HISTORY ────────────────────────────────────────── */}
        <SectionHeader label={t('vehicles.form.sectionServiceHistory')} />

        <div>
          <Input label={t('vehicles.form.lastServiceDate')} type="date" name="last_service_date" value={formData.last_service_date ?? ''} onChange={handleChange} />
        </div>
        <div>
          <Input label={t('vehicles.form.lastBatteryChangeDate')} type="date" name="last_battery_change_date" value={formData.last_battery_change_date ?? ''} onChange={handleChange} />
        </div>
        <div>
          <Input label={t('vehicles.form.lastOilChangeMileage')} type="number" name="last_oil_change_mileage" value={formData.last_oil_change_mileage} onChange={handleChange} min="0" placeholder="km" />
        </div>
        <div>
          <Input label={t('vehicles.form.lastTireChangeMileage')} type="number" name="last_tire_change_mileage" value={formData.last_tire_change_mileage} onChange={handleChange} min="0" placeholder="km" />
        </div>
        <div>
          <Input label={t('vehicles.form.lastBrakeChangeMileage')} type="number" name="last_brake_change_mileage" value={formData.last_brake_change_mileage} onChange={handleChange} min="0" placeholder="km" />
        </div>
        <div>
          <Input label={t('vehicles.form.acLastServiceDate')} type="date" name="ac_last_service_date" value={formData.ac_last_service_date ?? ''} onChange={handleChange} />
        </div>
        <div>
          <Input label={t('vehicles.form.coolantLastChangeDate')} type="date" name="coolant_last_change_date" value={formData.coolant_last_change_date ?? ''} onChange={handleChange} />
        </div>

        {/* ── REPORTED ISSUES ────────────────────────────────────────── */}
        <SectionHeader label={t('vehicles.form.sectionIssues')} />

        <div className="md:col-span-2">
          <label className={labelClass}>{t('vehicles.form.reportedIssues')}</label>
          <textarea
            name="reported_issues_text"
            value={formData.reported_issues_text}
            onChange={handleChange}
            rows={2}
            placeholder={t('vehicles.form.reportedIssuesPlaceholder')}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
          <p className="mt-1 text-[11px] text-slate-400">{t('vehicles.form.reportedIssuesHint')}</p>
        </div>

      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-between pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-900"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 dark:bg-brand dark:hover:bg-brand-deep dark:focus:ring-brand dark:focus:ring-offset-slate-900"
        >
          {isEdit ? t('vehicles.form.submitUpdate') : t('vehicles.form.submitCreate')}
        </button>
      </div>
    </form>
  );
};

export default VehicleForm;
