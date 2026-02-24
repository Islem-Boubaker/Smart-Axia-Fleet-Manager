import { useState } from 'react';
import type { FormEvent } from 'react';
import { Input, Button } from '../../../shared/components';
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
  'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';

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
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <Input name="name" value={formData.name} onChange={handleChange} placeholder="Vehicle name" required />
        </div>

        {/* VIN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
          <Input name="vin" value={formData.vin} onChange={handleChange} placeholder="17-char VIN" maxLength={17} />
        </div>

        {/* Plaque */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plaque Immatriculation</label>
          <Input name="plaque_immatriculation" value={formData.plaque_immatriculation} onChange={handleChange} placeholder="e.g., 123 TU 4567" />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
          <select name="type" value={formData.type} onChange={handleChange} className={selectClass} required>
            <option value="voiture">Voiture</option>
            <option value="camion">Camion</option>
            <option value="moto">Moto</option>
            <option value="camionnette">Camionnette</option>
          </select>
        </div>

        {/* Vehicle Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model <span className="text-red-500">*</span></label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Compteur Kilometrique (km)</label>
          <Input type="number" name="compteur_kilometrique" value={formData.compteur_kilometrique} onChange={handleChange} min="0" />
        </div>

        {/* Mileage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mileage (km)</label>
          <Input type="number" name="Mileage" value={formData.Mileage} onChange={handleChange} min="0" />
        </div>

        {/* Vehicle Age */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Age (years)</label>
          <Input type="number" name="Vehicle_Age" value={formData.Vehicle_Age} onChange={handleChange} min="0" />
        </div>

        {/* Maintenance History */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance History</label>
          <select name="Maintenance_History" value={formData.Maintenance_History} onChange={handleChange} className={selectClass}>
            <option value="Good">Good</option>
            <option value="Average">Average</option>
            <option value="Poor">Poor</option>
          </select>
        </div>

        {/* Reported Issues */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reported Issues</label>
          <Input type="number" name="Reported_Issues" value={formData.Reported_Issues} onChange={handleChange} min="0" />
        </div>

        {/* Service History */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service History</label>
          <Input type="number" name="Service_History" value={formData.Service_History} onChange={handleChange} min="0" />
        </div>

        {/* Accident History */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Accident History</label>
          <Input type="number" name="Accident_History" value={formData.Accident_History} onChange={handleChange} min="0" />
        </div>

        {/* Fuel Efficiency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Efficiency (L/100km)</label>
          <Input type="number" name="Fuel_Efficiency" value={formData.Fuel_Efficiency} onChange={handleChange} min="0" step="0.1" />
        </div>

        {/* Engine Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Engine Size (cc)</label>
          <Input type="number" name="Engine_Size" value={formData.Engine_Size} onChange={handleChange} min="0" />
        </div>

        {/* Tire Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tire Condition</label>
          <select name="Tire_Condition" value={formData.Tire_Condition} onChange={handleChange} className={selectClass}>
            <option value="New">New</option>
            <option value="Good">Good</option>
            <option value="Worn Out">Worn Out</option>
          </select>
        </div>

        {/* Brake Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brake Condition</label>
          <select name="Brake_Condition" value={formData.Brake_Condition} onChange={handleChange} className={selectClass}>
            <option value="New">New</option>
            <option value="Good">Good</option>
            <option value="Worn Out">Worn Out</option>
          </select>
        </div>

        {/* Battery Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Battery Status</label>
          <select name="Battery_Status" value={formData.Battery_Status} onChange={handleChange} className={selectClass}>
            <option value="New">New</option>
            <option value="Good">Good</option>
            <option value="Weak">Weak</option>
          </select>
        </div>

        {/* Days Since Last Service */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Days Since Last Service</label>
          <Input type="number" name="Days_Since_Last_Service" value={formData.Days_Since_Last_Service} onChange={handleChange} min="0" />
        </div>

        {/* Active */}
        <div className="flex items-center gap-2 pt-6">
          <input type="checkbox" id="Active" name="Active" checked={formData.Active} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <label htmlFor="Active" className="text-sm font-medium text-gray-700">Active</label>
        </div>

        {/* Need Maintenance */}
        <div className="flex items-center gap-2 pt-6">
          <input type="checkbox" id="Need_Maintenance" name="Need_Maintenance" checked={formData.Need_Maintenance} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <label htmlFor="Need_Maintenance" className="text-sm font-medium text-gray-700">Need Maintenance</label>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          {vehicle ? 'Update Vehicle' : 'Add Vehicle'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default VehicleForm;
