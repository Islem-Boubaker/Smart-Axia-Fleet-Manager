import { useState } from 'react';
import type { FormEvent } from 'react';
import { FiTruck, FiPlus } from 'react-icons/fi';
import { Input } from '../../../shared/components';
import type { Vehicle } from '../../../types';

interface VehicleFormProps {
  vehicle?: Partial<Vehicle>;
  onSubmit: (data: Partial<Vehicle> | FormData) => void;
  onCancel: () => void;
  error?: string;
}

const numberFields = [
  'Mileage', 'Vehicle_Age', 'Engine_Size', 'max_load'
];

const selectClass =
  'w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm text-gray-900 dark:text-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all hover:border-gray-300 dark:hover:border-slate-600';

const labelClass = "block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5";

const VehicleForm = ({ vehicle, onSubmit, onCancel, error }: VehicleFormProps) => {
  const [formData, setFormData] = useState({
    name: vehicle?.name || '',
    vin: vehicle?.vin || '',
    plaque_immatriculation: vehicle?.plaque_immatriculation || '',
    type: vehicle?.type || 'car',
    Active: vehicle?.Active ?? true,
    Vehicle_Model: vehicle?.Vehicle_Model || 'Car',
    Mileage: vehicle?.Mileage ?? 0,
    Vehicle_Age: vehicle?.Vehicle_Age ?? 0,
    Tire_Condition: vehicle?.Tire_Condition || 'New',
    Brake_Condition: vehicle?.Brake_Condition || 'New',
    Battery_Status: vehicle?.Battery_Status || 'New',
    Need_Maintenance: vehicle?.Need_Maintenance ?? false,
    Engine_Size: vehicle?.Engine_Size ?? '',
    max_load: vehicle?.max_load ?? null,
    insurance_expiry_date: vehicle?.insurance_expiry_date || '',
    tech_visit_expiry_date: vehicle?.tech_visit_expiry_date || '',
  });

  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    vehicle?.photos && vehicle.photos.length > 0 ? vehicle.photos[0] : null
  );

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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm shadow-sm mb-4">
          {error}
        </div>
      )}

      {/* Header Section */}
      <div className="flex items-center gap-4 mb-2">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center text-brand relative overflow-hidden ring-[3px] ring-white dark:ring-slate-800 shadow-md">
            {previewUrl ? (
              <img src={previewUrl} alt="Vehicle photo" className="w-full h-full object-cover" />
            ) : (
              <FiTruck className="w-8 h-8" />
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
            title="Upload photo"
          >
            <FiPlus className="w-4 h-4" />
          </label>
        </div>
        
        <div className="flex flex-col">
          {formData.name ? (
            <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{formData.name}</h3>
          ) : (
            <h3 className="text-lg font-medium text-gray-400 dark:text-slate-500 italic leading-tight">New Vehicle</h3>
          )}
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Vehicle Profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
        {/* Name */}
        <div className="md:col-span-2">
          <Input label="Name" name="name" value={formData.name} onChange={handleChange} placeholder="Vehicle name" required />
        </div>

        {/* VIN */}
        <div>
          <Input label="VIN" name="vin" value={formData.vin} onChange={handleChange} placeholder="17-char VIN" maxLength={17} />
        </div>

        {/* License Plate */}
        <div>
          <Input label="License Plate" name="plaque_immatriculation" value={formData.plaque_immatriculation} onChange={handleChange} placeholder="e.g., 123 TU 4567" />
        </div>

        {/* Type */}
        <div>
          <label className={labelClass}>Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className={selectClass} required>
            <option value="car">Car</option>
            <option value="truck">Truck</option>
            <option value="motorcycle">Motorcycle</option>
            <option value="van">Van</option>
          </select>
        </div>

        {/* Vehicle Model */}
        <div>
          <label className={labelClass}>Vehicle Model</label>
          <select name="Vehicle_Model" value={formData.Vehicle_Model} onChange={handleChange} className={selectClass} required>
            <option value="Car">Car</option>
            <option value="SUV">SUV</option>
            <option value="Van">Van</option>
            <option value="Truck">Truck</option>
            <option value="Bus">Bus</option>
            <option value="Motorcycle">Motorcycle</option>
          </select>
        </div>

        {/* Max Load */}
        <div>
          <Input label="Max Load (kg)" type="number" name="max_load" value={formData.max_load ?? ''} onChange={handleChange} min="0" />
        </div>

        {/* Mileage */}
        <div>
          <Input label="Mileage (km)" type="number" name="Mileage" value={formData.Mileage} onChange={handleChange} min="0" />
        </div>

        {/* Vehicle Age */}
        <div>
          <Input label="Vehicle Age (years)" type="number" name="Vehicle_Age" value={formData.Vehicle_Age} onChange={handleChange} min="0" />
        </div>

        {/* Engine Size */}
        <div>
          <Input label="Engine Size (cc)" type="number" name="Engine_Size" value={formData.Engine_Size} onChange={handleChange} min="0" />
        </div>

        {/* Insurance Expiry Date */}
        <div>
          <Input label="Insurance Expiry Date" type="date" name="insurance_expiry_date" value={formData.insurance_expiry_date} onChange={handleChange} />
        </div>

        {/* Tech Visit Expiry Date */}
        <div>
          <Input label="Tech Visit Expiry Date" type="date" name="tech_visit_expiry_date" value={formData.tech_visit_expiry_date} onChange={handleChange} />
        </div>

        {/* Tire Condition */}
        <div>
          <label className={labelClass}>Tire Condition</label>
          <select name="Tire_Condition" value={formData.Tire_Condition} onChange={handleChange} className={selectClass}>
            <option value="New">New</option>
            <option value="Good">Good</option>
            <option value="Worn Out">Worn Out</option>
          </select>
        </div>

        {/* Brake Condition */}
        <div>
          <label className={labelClass}>Brake Condition</label>
          <select name="Brake_Condition" value={formData.Brake_Condition} onChange={handleChange} className={selectClass}>
            <option value="New">New</option>
            <option value="Good">Good</option>
            <option value="Worn Out">Worn Out</option>
          </select>
        </div>

        {/* Battery Status */}
        <div>
          <label className={labelClass}>Battery Status</label>
          <select name="Battery_Status" value={formData.Battery_Status} onChange={handleChange} className={selectClass}>
            <option value="New">New</option>
            <option value="Good">Good</option>
            <option value="Weak">Weak</option>
          </select>
        </div>

        {/* Checkboxes */}
        <div className="md:col-span-2 flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input type="checkbox" name="Active" checked={formData.Active} onChange={handleChange} className="peer sr-only" />
              <div className="w-5 h-5 border-2 border-gray-300 dark:border-slate-600 rounded peer-checked:bg-gray-900 dark:peer-checked:bg-brand peer-checked:border-gray-900 dark:peer-checked:border-brand transition-colors"></div>
              <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" viewBox="0 0 14 10" fill="none">
                <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[13px] font-medium text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Active Status</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input type="checkbox" name="Need_Maintenance" checked={formData.Need_Maintenance} onChange={handleChange} className="peer sr-only" />
              <div className="w-5 h-5 border-2 border-gray-300 dark:border-slate-600 rounded peer-checked:bg-brand peer-checked:border-brand transition-colors"></div>
              <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" viewBox="0 0 14 10" fill="none">
                <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[13px] font-medium text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Needs Maintenance</span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 focus:ring-gray-200 dark:focus:ring-slate-700 transition-all shadow-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 text-sm font-medium text-white bg-gray-900 dark:bg-brand rounded-xl hover:bg-black dark:hover:bg-brand-deep focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 focus:ring-gray-900 dark:focus:ring-brand transition-all shadow-md"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default VehicleForm;

