import { useState } from "react";
import type { FormEvent } from "react";
import { FiUser, FiEdit2 } from "react-icons/fi";
import { Input } from "../../../shared/components/ui/Input";

interface DriverFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: string;
  assignedVehicle: string;
  rating: number;
}

interface DriverFormProps {
  driver?: DriverFormData & { id?: string };
  onSubmit: (data: DriverFormData) => void;
  onCancel: () => void;
}

const DriverForm = ({ driver, onSubmit, onCancel }: DriverFormProps) => {
  const [formData, setFormData] = useState<DriverFormData>({
    name: driver?.name || "",
    email: driver?.email || "",
    password: "",
    phone: driver?.phone || "",
    licenseNumber: driver?.licenseNumber || "",
    licenseExpiry: driver?.licenseExpiry || "",
    status: driver?.status || "active",
    assignedVehicle: driver?.assignedVehicle || "",
    rating: driver?.rating || 4.8,
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "rating" ? Number(value) : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Header Section */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex flex-col gap-3">
          <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center text-brand relative overflow-hidden">
            <FiUser className="w-8 h-8" />
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
        <div className="md:col-span-2">
          <Input
            label="Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Mohamed Ben Salah"
            required
          />
        </div>

        <div>
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="driver@example.com"
            required
          />
        </div>
        
        <div>
          <Input
            label="Phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+216 XX XXX XXX"
            required
          />
        </div>

        <div>
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Minimum 6 characters"
            required={!driver}
            minLength={6}
          />
        </div>

        <div>
          <Input
            label="License Number"
            type="text"
            name="licenseNumber"
            value={formData.licenseNumber}
            onChange={handleChange}
            placeholder="License number"
            required
          />
        </div>

        <div>
          <Input
            label="Date Applied / Expiry"
            type="date"
            name="licenseExpiry"
            value={formData.licenseExpiry}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <div className="w-full">
            <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm text-gray-900 dark:text-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all hover:border-gray-300 dark:hover:border-slate-600"
              required
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on-leave">On Leave</option>
            </select>
          </div>
        </div>

        <div>
          <Input
            label="Assigned Vehicle (ID)"
            type="text"
            name="assignedVehicle"
            value={formData.assignedVehicle}
            onChange={handleChange}
            placeholder="Vehicle license plate (optional)"
          />
        </div>

        <div>
          <Input
             label="Rating"
             type="number"
             name="rating"
             value={formData.rating}
             onChange={handleChange}
             min="0"
             max="5"
             step="0.1"
          />
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

export default DriverForm;
