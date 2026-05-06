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

const numberFields = [
  'Mileage', 'Vehicle_Age', 'Engine_Size', 'max_load', 'consumption'
];

const labelClass = "block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5";

const typeToVehicleModel: Record<string, Vehicle['Vehicle_Model']> = {
  car: 'Car',
  suv: 'SUV',
  van: 'Van',
  truck: 'Truck',
  motorcycle: 'Motorcycle',
};

const resolveInitialStatus = (vehicle?: Partial<Vehicle>): Vehicle['status'] => {
  if (vehicle?.status) return vehicle.status;
  if (vehicle?.Need_Maintenance) return 'IN_MAINTENANCE';
  if (vehicle?.Active === false) return 'OUT_OF_SERVICE';
  return 'AVAILABLE';
};

const firstPhoto = (photos: unknown): string | null => {
  if (Array.isArray(photos) && photos.length > 0 && typeof photos[0] === 'string') {
    return photos[0];
  }

  if (typeof photos === 'string' && photos.trim().length > 0) {
    return photos;
  }

  return null;
};

const VehicleForm = ({ vehicle, dark = false, onSubmit, onCancel, error }: VehicleFormProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: vehicle?.name || '',
    vin: vehicle?.vin || '',
    plaque_immatriculation: vehicle?.plaque_immatriculation || '',
    type: vehicle?.type || 'car',
    status: resolveInitialStatus(vehicle),
    Active: vehicle?.Active ?? true,
    Vehicle_Model: vehicle?.Vehicle_Model || typeToVehicleModel[vehicle?.type || 'car'] || 'Car',
    Mileage: vehicle?.Mileage ?? 0,
    Vehicle_Age: vehicle?.Vehicle_Age ?? 0,
    Tire_Condition: vehicle?.Tire_Condition || 'New',
    Brake_Condition: vehicle?.Brake_Condition || 'New',
    Battery_Status: vehicle?.Battery_Status || 'New',
    Need_Maintenance: vehicle?.Need_Maintenance ?? false,
    Engine_Size: vehicle?.Engine_Size ?? '',
    consumption: vehicle?.consumption ?? '',
    max_load: vehicle?.max_load ?? null,
    insurance_expiry_date: vehicle?.insurance_expiry_date || '',
    tech_visit_expiry_date: vehicle?.tech_visit_expiry_date || '',
  });

  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(firstPhoto(vehicle?.photos));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...formData };
    // Convert empty optional-unique fields to null so PostgreSQL doesn't treat '' as a duplicate
    payload.vin = payload.vin === '' ? null : payload.vin;
    payload.plaque_immatriculation = payload.plaque_immatriculation === '' ? null : payload.plaque_immatriculation;
    payload.Engine_Size = payload.Engine_Size === '' ? null : Number(payload.Engine_Size);
    payload.consumption = payload.consumption === '' ? null : Number(payload.consumption);
    payload.Vehicle_Model = typeToVehicleModel[String(payload.type || 'car')] || 'Car';
    payload.Active = payload.status !== 'OUT_OF_SERVICE';
    payload.Need_Maintenance = payload.status === 'IN_MAINTENANCE';
    payload.max_load = payload.max_load === '' || payload.max_load === null ? null : Number(payload.max_load);
    payload.insurance_expiry_date = payload.insurance_expiry_date === '' ? null : payload.insurance_expiry_date;
    payload.tech_visit_expiry_date = payload.tech_visit_expiry_date === '' ? null : payload.tech_visit_expiry_date;
    
    if (selectedPhoto) {
      const form = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          form.append(key, value as string | Blob);
        }
      });
      form.append('photos', selectedPhoto);
      onSubmit(form);
    } else {
      onSubmit(payload as Partial<Vehicle>);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : numberFields.includes(name)
          ? value === '' ? '' : Number(value)
          : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'type') {
      const nextType = value as Vehicle['type'];
      setFormData((prev) => ({
        ...prev,
        type: nextType,
        Vehicle_Model: typeToVehicleModel[nextType] || 'Car',
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm shadow-sm mb-4">
          {error}
        </div>
      )}

      {/* Header Section */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand relative overflow-hidden ring-[3px] ring-white dark:ring-slate-800 shadow-md">
            {previewUrl ? (
              <img src={previewUrl} alt={t('common.vehiclePhotoAlt')} className="w-full h-full object-cover" />
            ) : (
              <FiTruck className="w-7 h-7" />
            )}
          </div>
          
          <input
            type="file"
            accept="image/*"
            id="vehicle-photo-upload"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <label
            htmlFor="vehicle-photo-upload"
            className="absolute bottom-0 right-0 w-7 h-7 bg-brand text-white rounded-full flex items-center justify-center cursor-pointer border-2 border-white dark:border-slate-800 shadow-sm hover:bg-brand-deep transition-colors"
            title={t('common.uploadPhoto')}
          >
            <FiPlus className="w-4 h-4" />
          </label>
        </div>
        
        <div className="flex flex-col">
          {formData.name ? (
            <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{formData.name}</h3>
          ) : (
            <h3 className="text-lg font-medium text-gray-400 dark:text-slate-500 italic leading-tight">{t('vehicles.form.newTitle')}</h3>
          )}
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{t('common.vehicleProfile')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
        {/* Name */}
        <div className="md:col-span-2">
          <Input label={t('common.name')} name="name" value={formData.name} onChange={handleChange} placeholder={t('common.vehicleName')} required />
        </div>

        {/* VIN */}
        <div>
          <Input label={t('common.vin')} name="vin" value={formData.vin} onChange={handleChange} placeholder={t('common.vinPlaceholder')} maxLength={17} />
        </div>

        {/* License Plate */}
        <div>
          <Input label={t('common.licensePlate')} name="plaque_immatriculation" value={formData.plaque_immatriculation} onChange={handleChange} placeholder={t('common.platePlaceholder')} />
        </div>

        {/* Type */}
        <div>
          <label className={labelClass}>{t('common.type')}</label>
          <Select
            value={formData.type}
            onChange={(value) => handleSelectChange('type', value)}
            dark={dark}
            options={[
              { value: 'car', label: t('vehicles.types.car') },
              { value: 'suv', label: t('vehicles.types.suv') },
              { value: 'truck', label: t('vehicles.types.truck') },
              { value: 'motorcycle', label: t('vehicles.types.motorcycle') },
              { value: 'van', label: t('vehicles.types.van') },
            ]}
          />
        </div>

        {/* Max Load */}
        <div>
          <Input label={t('common.maxLoadKg')} type="number" name="max_load" value={formData.max_load ?? ''} onChange={handleChange} min="0" />
        </div>

        {/* Operational Status */}
        <div className="md:col-span-2">
          <label className={labelClass}>{t('vehicles.form.operationalStatus')}</label>
          <Select
            value={formData.status}
            onChange={(value) => handleSelectChange('status', value)}
            dark={dark}
            options={[
              { value: 'AVAILABLE', label: t('status.available') },
              { value: 'OUT_OF_SERVICE', label: t('status.inactive') },
              { value: 'IN_MAINTENANCE', label: t('status.maintenance') },
            ]}
          />
        </div>

        {/* Mileage */}
        <div>
          <Input label={t('common.mileageKm')} type="number" name="Mileage" value={formData.Mileage} onChange={handleChange} min="0" />
        </div>

        {/* Vehicle Age */}
        <div>
          <Input label={t('common.vehicleAgeYears')} type="number" name="Vehicle_Age" value={formData.Vehicle_Age} onChange={handleChange} min="0" />
        </div>

        {/* Engine Size */}
        <div>
          <Input label={t('common.engineSizeCc')} type="number" name="Engine_Size" value={formData.Engine_Size} onChange={handleChange} min="0" />
        </div>

        {/* Consumption */}
        <div>
          <Input
            label={t('common.consumptionL100km')}
            type="number"
            name="consumption"
            value={formData.consumption}
            onChange={handleChange}
            min="0"
            step="0.1"
            placeholder={t('common.consumptionExample')}
          />
        </div>

        {/* Insurance Expiry Date */}
        <div>
          <Input label={t('common.insuranceExpiry')} type="date" name="insurance_expiry_date" value={formData.insurance_expiry_date} onChange={handleChange} />
        </div>

        {/* Tech Visit Expiry Date */}
        <div>
          <Input label={t('common.techVisitExpiry')} type="date" name="tech_visit_expiry_date" value={formData.tech_visit_expiry_date} onChange={handleChange} />
        </div>

        {/* Tire Condition */}
        <div>
          <label className={labelClass}>{t('vehicles.form.tireCondition')}</label>
          <Select
            value={formData.Tire_Condition}
            onChange={(value) => handleSelectChange('Tire_Condition', value)}
            dark={dark}
            options={[
              { value: 'New', label: t('vehicles.form.conditionNew') },
              { value: 'Good', label: t('vehicles.form.conditionGood') },
              { value: 'Worn Out', label: t('vehicles.form.conditionWornOut') },
            ]}
          />
        </div>

        {/* Brake Condition */}
        <div>
          <label className={labelClass}>{t('vehicles.form.brakeCondition')}</label>
          <Select
            value={formData.Brake_Condition}
            onChange={(value) => handleSelectChange('Brake_Condition', value)}
            dark={dark}
            options={[
              { value: 'New', label: t('vehicles.form.conditionNew') },
              { value: 'Good', label: t('vehicles.form.conditionGood') },
              { value: 'Worn Out', label: t('vehicles.form.conditionWornOut') },
            ]}
          />
        </div>

        {/* Battery Status */}
        <div>
          <label className={labelClass}>{t('vehicles.form.batteryStatus')}</label>
          <Select
            value={formData.Battery_Status}
            onChange={(value) => handleSelectChange('Battery_Status', value)}
            dark={dark}
            options={[
              { value: 'New', label: t('vehicles.form.conditionNew') },
              { value: 'Good', label: t('vehicles.form.conditionGood') },
              { value: 'Weak', label: t('vehicles.form.conditionWeak') },
            ]}
          />
        </div>

      </div>

      <div className="flex items-center justify-between pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 focus:ring-gray-200 dark:focus:ring-slate-700 transition-all shadow-sm"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 text-sm font-medium text-white bg-gray-900 dark:bg-brand rounded-xl hover:bg-black dark:hover:bg-brand-deep focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 focus:ring-gray-900 dark:focus:ring-brand transition-all shadow-md"
        >
          {t('common.save')}
        </button>
      </div>
    </form>
  );
};

export default VehicleForm;

