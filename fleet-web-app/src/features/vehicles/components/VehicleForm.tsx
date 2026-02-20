import { useState } from 'react';
import type { FormEvent } from 'react';
import { Input, Button } from '../../../shared/components';

interface VehicleFormProps {
  vehicle?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const VehicleForm = ({ vehicle, onSubmit, onCancel }: VehicleFormProps) => {
  const [formData, setFormData] = useState({
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    year: vehicle?.year || new Date().getFullYear(),
    licensePlate: vehicle?.licensePlate || '',
    vin: vehicle?.vin || '',
    status: vehicle?.status || 'active',
    mileage: vehicle?.mileage || 0,
    fuelType: vehicle?.fuelType || 'essence',
    driver: vehicle?.driver || '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' || name === 'mileage' ? Number(value) : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Make <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            name="make"
            value={formData.make}
            onChange={handleChange}
            placeholder="e.g., Toyota"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            placeholder="e.g., Camry"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            name="year"
            value={formData.year}
            onChange={handleChange}
            min="1900"
            max={new Date().getFullYear() + 1}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            License Plate <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            name="licensePlate"
            value={formData.licensePlate}
            onChange={handleChange}
            placeholder="e.g., 123 TU 4567"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            VIN <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            name="vin"
            value={formData.vin}
            onChange={handleChange}
            placeholder="Vehicle Identification Number"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mileage (km) <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            name="mileage"
            value={formData.mileage}
            onChange={handleChange}
            min="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fuel Type <span className="text-red-500">*</span>
          </label>
          <select
            name="fuelType"
            value={formData.fuelType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="essence">Essence</option>
            <option value="diesel">Diesel</option>
            <option value="électrique">Électrique</option>
            <option value="hybride">Hybride</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assigned Driver
          </label>
          <Input
            type="text"
            name="driver"
            value={formData.driver}
            onChange={handleChange}
            placeholder="Driver name (optional)"
          />
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
