import { useState } from 'react';
import type { FormEvent } from 'react';
import { Input, Button } from '../../../shared/components';

interface MaintenanceFormProps {
  maintenance?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const MaintenanceForm = ({ maintenance, onSubmit, onCancel }: MaintenanceFormProps) => {
  const [formData, setFormData] = useState({
    vehicle: maintenance?.vehicle || '',
    type: maintenance?.type || '',
    scheduledDate: maintenance?.scheduledDate || '',
    technician: maintenance?.technician || '',
    priority: maintenance?.priority || 'medium',
    status: maintenance?.status || 'scheduled',
    cost: maintenance?.cost || '',
    mileage: maintenance?.mileage || '',
    description: maintenance?.description || '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            name="vehicle"
            value={formData.vehicle}
            onChange={handleChange}
            placeholder="e.g., Toyota Camry (123 TU 4567)"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maintenance Type <span className="text-red-500">*</span>
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select type</option>
            <option value="Oil Change">Oil Change</option>
            <option value="Tire Rotation">Tire Rotation</option>
            <option value="Brake Inspection">Brake Inspection</option>
            <option value="Engine Tune-up">Engine Tune-up</option>
            <option value="Battery Replacement">Battery Replacement</option>
            <option value="General Inspection">General Inspection</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scheduled Date <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            name="scheduledDate"
            value={formData.scheduledDate}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Technician
          </label>
          <Input
            type="text"
            name="technician"
            value={formData.technician}
            onChange={handleChange}
            placeholder="Technician name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority <span className="text-red-500">*</span>
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
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
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Cost (TND)
          </label>
          <Input
            type="text"
            name="cost"
            value={formData.cost}
            onChange={handleChange}
            placeholder="e.g., 150 TND"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Mileage (km)
          </label>
          <Input
            type="text"
            name="mileage"
            value={formData.mileage}
            onChange={handleChange}
            placeholder="e.g., 45,230 km"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description / Notes
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional details about the maintenance..."
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          {maintenance ? 'Update Maintenance' : 'Schedule Maintenance'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default MaintenanceForm;
