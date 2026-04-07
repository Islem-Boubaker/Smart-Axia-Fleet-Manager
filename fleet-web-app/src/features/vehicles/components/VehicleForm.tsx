import { useState } from 'react';
import type { FormEvent } from 'react';
import { FiTruck, FiEdit2 } from 'react-icons/fi';
import { Input } from '../../../shared/components';
import type { Vehicle } from '../../../types';

interface VehicleFormProps {
  vehicle?: Partial<Vehicle>;
  onSubmit: (data: Partial<Vehicle>) => void;
  onCancel: () => void;
  error?: string;
}

const numberFields = [
  'compteur_kilometrique', 'Mileage', 'Vehicle_Age', 'Reported_Issues',
  'Service_History', 'Accident_History', 'Fuel_Efficiency', 'Engine_Size',
  'Days_Since_Last_Service',
];

const selectClass =
  'w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm text-gray-900 dark:text-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all hover:border-gray-300 dark:hover:border-slate-600';

const labelClass = "block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5";

const VehicleForm = ({ vehicle, onSubmit, onCancel, error }: VehicleFormProps) => {
  const [formData, setFormData] = useState({
    name: vehicle?.name || '',
    vin: vehicle?.vin || '',
    plaque_immatriculation: vehicle?.plaque_immatriculation || '',
    type: vehicle?.type || 'voiture',
    compteur_kilometrique: vehicle?.compteur_kilometrique ?? 0,
    Active: vehicle?.Active ?? true,
    Vehicle_Model: vehicle?.Vehicle_Model || 'Car',
    Mileage: vehicle?.Mileage ?? 0,
    Vehicle_Age: vehicle?.Vehicle_Age ?? 0,
    Maintenance_History: vehicle?.Maintenance_History || 'Good',
    Reported_Issues: vehicle?.Reported_Issues ?? 0,
    Service_History: vehicle?.Service_History ?? 0,
    Accident_History: vehicle?.Accident_History ?? 0,
    Fuel_Efficiency: vehicle?.Fuel_Efficiency ?? '',
    Engine_Size: vehicle?.Engine_Size ?? '',
    Tire_Condition: vehicle?.Tire_Condition || 'New',
    Brake_Condition: vehicle?.Brake_Condition || 'New',
    Battery_Status: vehicle?.Battery_Status || 'New',
    Days_Since_Last_Service: vehicle?.Days_Since_Last_Service ?? 0,
    Need_Maintenance: vehicle?.Need_Maintenance ?? false,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...formData };
    // Convert empty optional-unique fields to null so PostgreSQL doesn't treat '' as a duplicate
    payload.vin = payload.vin === '' ? null : payload.vin;
    payload.plaque_immatriculation = payload.plaque_immatriculation === '' ? null : payload.plaque_immatriculation;
    payload.Fuel_Efficiency = payload.Fuel_Efficiency === '' ? null : Number(payload.Fuel_Efficiency);
    payload.Engine_Size = payload.Engine_Size === '' ? null : Number(payload.Engine_Size);
    onSubmit(payload as Partial<Vehicle>);
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
      <div className="flex items-start justify-between mb-2">
        <div className="flex flex-col gap-3">
          <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center text-brand relative overflow-hidden">
            <FiTruck className="w-8 h-8" />
          </div>
          {formData.name && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{formData.name}</h3>
          )}
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <span>Edit</span>
          <FiEdit2 className="w-3.5 h-3.5" />
        </button>
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

        {/* Plaque */}
        <div>
          <Input label="Plaque Immatriculation" name="plaque_immatriculation" value={formData.plaque_immatriculation} onChange={handleChange} placeholder="e.g., 123 TU 4567" />
        </div>

        {/* Type */}
        <div>
          <label className={labelClass}>Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className={selectClass} required>
            <option value="voiture">Voiture</option>
            <option value="camion">Camion</option>
            <option value="moto">Moto</option>
            <option value="camionnette">Camionnette</option>
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

        {/* Compteur */}
        <div>
          <Input label="Compteur Kilometrique (km)" type="number" name="compteur_kilometrique" value={formData.compteur_kilometrique} onChange={handleChange} min="0" />
        </div>

        {/* Mileage */}
        <div>
          <Input label="Mileage (km)" type="number" name="Mileage" value={formData.Mileage} onChange={handleChange} min="0" />
        </div>

        {/* Vehicle Age */}
        <div>
          <Input label="Vehicle Age (years)" type="number" name="Vehicle_Age" value={formData.Vehicle_Age} onChange={handleChange} min="0" />
        </div>

        {/* Maintenance History */}
        <div>
          <label className={labelClass}>Maintenance History</label>
          <select name="Maintenance_History" value={formData.Maintenance_History} onChange={handleChange} className={selectClass}>
            <option value="Good">Good</option>
            <option value="Average">Average</option>
            <option value="Poor">Poor</option>
          </select>
        </div>

        {/* Reported Issues */}
        <div>
          <Input label="Reported Issues" type="number" name="Reported_Issues" value={formData.Reported_Issues} onChange={handleChange} min="0" />
        </div>

        {/* Service History */}
        <div>
          <Input label="Service History" type="number" name="Service_History" value={formData.Service_History} onChange={handleChange} min="0" />
        </div>

        {/* Accident History */}
        <div>
          <Input label="Accident History" type="number" name="Accident_History" value={formData.Accident_History} onChange={handleChange} min="0" />
        </div>

        {/* Fuel Efficiency */}
        <div>
          <Input label="Fuel Efficiency (L/100km)" type="number" name="Fuel_Efficiency" value={formData.Fuel_Efficiency} onChange={handleChange} min="0" step="0.1" />
        </div>

        {/* Engine Size */}
        <div>
          <Input label="Engine Size (cc)" type="number" name="Engine_Size" value={formData.Engine_Size} onChange={handleChange} min="0" />
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

        {/* Days Since Last Service */}
        <div>
          <Input label="Days Since Last Service" type="number" name="Days_Since_Last_Service" value={formData.Days_Since_Last_Service} onChange={handleChange} min="0" />
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
