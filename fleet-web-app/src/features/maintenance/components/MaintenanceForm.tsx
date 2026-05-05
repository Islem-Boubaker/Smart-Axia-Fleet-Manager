import { useEffect, useState, useMemo } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Input, Button, Select } from "../../../shared/components";
import { useVehicleOptions } from "../../vehicles/hooks/useVehicles";
import type { Vehicle } from "../../../types";

interface MaintenanceFormProps {
  maintenance?: any;
  initialValues?: Partial<{
    vehicleId: string;
    reclamationId: string;
    vehiclePlate: string;
    type: string;
    scheduledDate: string;
    technician: string;
    priority: string;
    status: string;
    cost: string | number;
    mileage: string | number;
    description: string;
  }>;
  dark?: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const textareaClass =
  'w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm text-gray-900 dark:text-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all hover:border-gray-300 dark:hover:border-slate-600';

const labelClass = "block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5";

const normalizeKey = (value: string) => value.toLowerCase().replace(/[\s-]+/g, "_");

const MaintenanceForm = ({ maintenance, initialValues, dark = false, onSubmit, onCancel }: MaintenanceFormProps) => {
  const { t } = useTranslation();
  const { vehicles, isLoading: vehiclesLoading } = useVehicleOptions();
  const source = maintenance || initialValues || {};

  const [formData, setFormData] = useState({
    vehicleId: source?.vehicleId || "",
    reclamationId: source?.reclamationId || "",
    vehiclePlate: source?.vehiclePlate || "",
    type: source?.type || "",
    scheduledDate: source?.scheduledDate || "",
    technician: source?.technician || "",
    priority: source?.priority || "medium",
    status: source?.status || "scheduled",
    cost: source?.cost ?? "",
    mileage: source?.mileage ?? "",
    description: source?.description || "",
  });

  const selectableVehicles = useMemo(() => vehicles, [vehicles]);

  useEffect(() => {
    if (maintenance || vehiclesLoading || !formData.vehicleId) return;

    const stillSelectable = selectableVehicles.some((vehicle) => vehicle.id === formData.vehicleId);
    if (!stillSelectable) {
      setFormData((prev) => ({ ...prev, vehicleId: "", vehiclePlate: "" }));
    }
  }, [formData.vehicleId, maintenance, selectableVehicles, vehiclesLoading]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'vehicleId') {
      const selectedVehicle = selectableVehicles.find((v: Vehicle) => v.id === value);
      const selectedPlate = selectedVehicle?.plaque_immatriculation || '';
      setFormData((p) => ({ ...p, vehicleId: value, vehiclePlate: selectedPlate }));
      return;
    }

    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (maintenance) {
      onSubmit({
        type: formData.type,
        scheduledDate: formData.scheduledDate,
        technician: formData.technician,
        priority: formData.priority,
        cost: formData.cost,
        mileage: formData.mileage,
        description: formData.description,
        reclamationId: formData.reclamationId,
      });
      return;
    }

    onSubmit(formData);
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'vehicleId') {
      const selectedVehicle = selectableVehicles.find((v: Vehicle) => v.id === value);
      const selectedPlate = selectedVehicle?.plaque_immatriculation || '';
      setFormData((p) => ({ ...p, vehicleId: value, vehiclePlate: selectedPlate }));
      return;
    }

    setFormData((p) => ({ ...p, [name]: value }));
  };

  const vehicleLabel = useMemo(
    () => (v: Vehicle) => {
      const plate = v.plaque_immatriculation || "";
      const name = v.name || v.Vehicle_Model || t("common.vehicle");
      return plate ? `${name} (${plate})` : name;
    },
    [t]
  );

  const maintenanceTypeOptions = [
    "Oil Change",
    "Tire Rotation",
    "Brake Inspection",
    "Engine Tune-up",
    "Battery Replacement",
    "General Inspection",
    "Technical Visit",
    "Insurance Renewal",
    "Other",
  ].map((value) => ({
    value,
    label: t(`maintenance.types.${normalizeKey(value)}`, { defaultValue: value }),
  }));

  const selectVehiclePlaceholder = t('maintenance.form.selectVehicle', {
    defaultValue: t('common.selectVehicle'),
  });
  const noVehiclesPlaceholder = t('maintenance.form.noVehiclesFound', {
    defaultValue: t('common.noData'),
  });
  const selectTypePlaceholder = t('maintenance.form.selectType', {
    defaultValue: t('common.type'),
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vehicle */}
        <div>
          <label className={labelClass}>{t('common.vehicle')} *</label>
          <Select
            value={formData.vehicleId}
            onChange={(value) => handleSelectChange('vehicleId', value)}
            dark={dark}
            disabled={vehiclesLoading || selectableVehicles.length === 0}
            placeholder={
              vehiclesLoading
                ? t('vehicles.table.loading')
                : selectableVehicles.length > 0
                  ? selectVehiclePlaceholder
                  : noVehiclesPlaceholder
            }
            options={selectableVehicles.map((v: Vehicle) => ({
              value: v.id,
              label: vehicleLabel(v),
            }))}
          />
        </div>

        {/* Type */}
        <div className="md:col-span-2">
          <label className={labelClass}>
            {t('maintenance.form.type')} <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.type}
            onChange={(value) => handleSelectChange('type', value)}
            dark={dark}
            placeholder={selectTypePlaceholder}
            options={maintenanceTypeOptions}
          />
        </div>

        {/* Date */}
        <div>
          <label className={labelClass}>
            {t('maintenance.form.scheduledDate')} <span className="text-red-500">*</span>
          </label>
          <Input type="date" name="scheduledDate" value={formData.scheduledDate} onChange={handleChange} required />
        </div>

        {/* Technician */}
        <div>
          <label className={labelClass}>{t('maintenance.table.technician')} *</label>
          <Input type="text" name="technician" value={formData.technician} onChange={handleChange} placeholder={t('maintenance.form.technicianPlaceholder')} required />
        </div>

        {/* Priority */}
        <div>
          <label className={labelClass}>
            {t('common.priority')} <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.priority}
            onChange={(value) => handleSelectChange('priority', value)}
            dark={dark}
            options={[
              { value: 'low', label: t('priority.low') },
              { value: 'medium', label: t('priority.medium') },
              { value: 'high', label: t('priority.high') },
            ]}
          />
        </div>

        {/* Cost */}
        <div>
          <label className={labelClass}>{t('maintenance.form.estimatedCost')} *</label>
          <Input type="number" name="cost" value={formData.cost} onChange={handleChange} placeholder={t('maintenance.form.costPlaceholder')} required min={0} />
        </div>

        {/* Mileage */}
        <div>
          <label className={labelClass}>{t('maintenance.form.currentMileage')}</label>
          <Input type="number" name="mileage" value={formData.mileage} onChange={handleChange} placeholder={t('maintenance.form.mileagePlaceholder')} />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className={labelClass}>{t('maintenance.form.descriptionNotes')}</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className={textareaClass}
            placeholder={t('common.maintenanceDetailsPlaceholder')}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          {maintenance ? t('maintenance.form.submitUpdate') : t('maintenance.form.submit')}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
};

export default MaintenanceForm;
