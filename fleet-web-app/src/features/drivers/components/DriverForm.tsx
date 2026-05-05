import { useState } from "react";
import type { FormEvent } from "react";
import { FiUser, FiPlus } from "react-icons/fi";
import { useTranslation } from 'react-i18next';
import { Select } from "../../../shared/components";
import { Input } from "../../../shared/components/ui/Input";
import type { Vehicle } from "../../../types";

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
  driver?: DriverFormData & { id?: string; avatar?: string };
  vehicles?: Vehicle[];
  dark?: boolean;
  onSubmit: (data: DriverFormData, photo: File | null) => void;
  onCancel: () => void;
}

const DriverForm = ({ driver, vehicles = [], dark = false, onSubmit, onCancel }: DriverFormProps) => {
  const { t } = useTranslation();
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

  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(driver?.avatar || null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData, selectedPhoto);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "rating" ? Number(value) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const assignedVehicleOptions = [
    { value: '', label: t('common.unassigned') },
    ...vehicles.map((vehicle) => {
      const vehicleLabel = vehicle.plaque_immatriculation
        ? `${vehicle.name} (${vehicle.plaque_immatriculation})`
        : vehicle.name;
      return {
        value: vehicleLabel,
        label: vehicleLabel,
      };
    }),
  ];

  const hasAssignedVehicleOption = assignedVehicleOptions.some(
    (option) => option.value === formData.assignedVehicle
  );

  const assignedVehicleOptionsWithLegacy =
    formData.assignedVehicle && !hasAssignedVehicleOption
      ? [{ value: formData.assignedVehicle, label: formData.assignedVehicle }, ...assignedVehicleOptions]
      : assignedVehicleOptions;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Header Section */}
      <div className="flex items-center gap-4 mb-2">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center text-brand relative overflow-hidden ring-[3px] ring-white dark:ring-slate-800 shadow-md">
            {previewUrl ? (
              <img src={previewUrl} alt={t('common.driverAvatarAlt')} className="w-full h-full object-cover" />
            ) : (
              <FiUser className="w-8 h-8" />
            )}
          </div>
          
          <input
            type="file"
            accept="image/*"
            id="driver-photo-upload"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <label
            htmlFor="driver-photo-upload"
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
            <h3 className="text-lg font-medium text-gray-400 dark:text-slate-500 italic leading-tight">{t('drivers.addNew')}</h3>
          )}
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{t('common.driverProfile')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
        <div className="md:col-span-2">
          <Input
            label={t('common.name')}
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t('common.driverNamePlaceholder')}
            required
          />
        </div>

        <div>
          <Input
            label={t('common.email')}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t('common.driverEmailPlaceholder')}
            required
          />
        </div>
        
        <div>
          <Input
            label={t('common.phone')}
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder={t('common.phonePlaceholder')}
            required
          />
        </div>

        <div>
          <Input
            label={t('common.password')}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={t('common.passwordMinPlaceholder')}
            required={!driver}
            minLength={6}
          />
        </div>

        <div>
          <Input
            label={t('common.licenseNumber')}
            type="text"
            name="licenseNumber"
            value={formData.licenseNumber}
            onChange={handleChange}
            placeholder={t('common.licensePlaceholder')}
            required
          />
        </div>

        <div>
          <Input
            label={t('common.dateAppliedExpiry')}
            type="date"
            name="licenseExpiry"
            value={formData.licenseExpiry}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <div className="w-full">
            <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">{t('common.status')}</label>
            <Select
              value={formData.status}
              onChange={(value) => handleSelectChange('status', value)}
              dark={dark}
              options={[
                { value: 'active', label: t('common.active') },
                { value: 'inactive', label: t('common.inactive') },
                { value: 'on-leave', label: t('common.onLeave') },
              ]}
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">{t('common.assignedVehicle')}</label>
          <Select
            value={formData.assignedVehicle}
            onChange={(value) => handleSelectChange('assignedVehicle', value)}
            dark={dark}
            placeholder={t('common.selectVehicle')}
            options={assignedVehicleOptionsWithLegacy}
          />
        </div>

        <div>
          <Input
             label={t('common.rating')}
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

export default DriverForm;
