import { useState, useMemo } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { Input, Button } from "../../../shared/components";
import { useVehicles } from "../../vehicles/hooks/useVehicles";

interface MaintenanceFormProps {
  maintenance?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const MaintenanceForm = ({ maintenance, onSubmit, onCancel }: MaintenanceFormProps) => {
  const { vehicles, isLoading: vehiclesLoading } = useVehicles();

  const [formData, setFormData] = useState({
    vehicleId: maintenance?.vehicleId || "",
    type: maintenance?.type || "",
    scheduledDate: maintenance?.scheduledDate || "",
    technician: maintenance?.technician || "",
    priority: maintenance?.priority || "medium",
    status: maintenance?.status || "scheduled",
    cost: maintenance?.cost || "",
    mileage: maintenance?.mileage || "",
    description: maintenance?.description || "",
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const vehicleLabel = useMemo(
    () => (v: any) => {
      const plate = v.plate || v.vehiclePlate || "";
      const name = v.name || v.model || "Vehicle";
      return plate ? `${name} (${plate})` : name;
    },
    []
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vehicle */}
        <div>
          <label className="block text-sm font-medium mb-1">Vehicle *</label>
          <select
            name="vehicleId"
            value={formData.vehicleId}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
            disabled={vehiclesLoading}
            required
          >
            <option value="">
              {vehiclesLoading ? "Loading vehicles..." : "Select vehicle"}
            </option>
            {vehicles.map((v: any) => (
              <option key={v.id} value={v.id}>
                {vehicleLabel(v)}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maintenance Type <span className="text-red-500">*</span>
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          >
            <option value="">Select type</option>
            {[
              "Oil Change",
              "Tire Rotation",
              "Brake Inspection",
              "Engine Tune-up",
              "Battery Replacement",
              "General Inspection",
              "Other",
            ].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scheduled Date <span className="text-red-500">*</span>
          </label>
          <Input type="date" name="scheduledDate" value={formData.scheduledDate} onChange={handleChange} required />
        </div>

        {/* Technician */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
          <Input type="text" name="technician" value={formData.technician} onChange={handleChange} placeholder="Technician name" />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority <span className="text-red-500">*</span>
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          >
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Cost */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost (TND)</label>
          <Input type="number" name="cost" value={formData.cost} onChange={handleChange} placeholder="e.g., 150" />
        </div>

        {/* Mileage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Mileage (km)</label>
          <Input type="number" name="mileage" value={formData.mileage} onChange={handleChange} placeholder="e.g., 45230" />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Additional details about the maintenance..."
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          {maintenance ? "Update Maintenance" : "Schedule Maintenance"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default MaintenanceForm;