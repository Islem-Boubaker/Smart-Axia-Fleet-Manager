import { useState, useMemo } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { Input, Button } from "../../../shared/components";
import { useVehicles } from "../../vehicles/hooks/useVehicles";

interface MaintenanceFormProps {
  maintenance?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const selectClass =
  'w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm text-gray-900 dark:text-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all hover:border-gray-300 dark:hover:border-slate-600';

const textareaClass =
  'w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm text-gray-900 dark:text-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all hover:border-gray-300 dark:hover:border-slate-600';

const labelClass = "block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5";

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
          <label className={labelClass}>Vehicle *</label>
          <select
            name="vehicleId"
            value={formData.vehicleId}
            onChange={handleChange}
            className={selectClass}
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
          <label className={labelClass}>
            Maintenance Type <span className="text-red-500">*</span>
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className={selectClass}
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
          <label className={labelClass}>
            Scheduled Date <span className="text-red-500">*</span>
          </label>
          <Input type="date" name="scheduledDate" value={formData.scheduledDate} onChange={handleChange} required />
        </div>

        {/* Technician */}
        <div>
          <label className={labelClass}>Technician</label>
          <Input type="text" name="technician" value={formData.technician} onChange={handleChange} placeholder="Technician name" />
        </div>

        {/* Priority */}
        <div>
          <label className={labelClass}>
            Priority <span className="text-red-500">*</span>
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className={selectClass}
            required
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className={labelClass}>
            Status <span className="text-red-500">*</span>
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={selectClass}
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
          <label className={labelClass}>Estimated Cost (TND)</label>
          <Input type="number" name="cost" value={formData.cost} onChange={handleChange} placeholder="e.g., 150" />
        </div>

        {/* Mileage */}
        <div>
          <label className={labelClass}>Current Mileage (km)</label>
          <Input type="number" name="mileage" value={formData.mileage} onChange={handleChange} placeholder="e.g., 45230" />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className={labelClass}>Description / Notes</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className={textareaClass}
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