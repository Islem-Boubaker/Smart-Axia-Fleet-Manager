import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import { useImagePicker } from "./useImagePicker";
import { useReclamation } from "./useReclamation";
import { tripsApi } from "@/features/trips/services/trips.api";
import type { RootState } from "@/store";
import type {
  ReclamationFormData,
  ReclamationFormErrors,
  ReclamationImage,
  ReclamationStep,
  ReclamationType,
  MaintenancePriority,
} from "../types/reclamation.types";

const STEPS: ReclamationStep[] = ["SUBJECT"];

const initialForm: ReclamationFormData = {
  type: "vehicle",
  subject: "",
  message: "",
  date: null,
  images: [],
  maintenanceType: "General Inspection",
  maintenancePriority: "medium",
  estimatedCost: "",
  currentMileage: "",
  maintenanceNotes: "",
};

const parseOptionalPositiveNumber = (value?: string) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

function validateForm(form: ReclamationFormData, t: (key: string) => string): ReclamationFormErrors {
  const errors: ReclamationFormErrors = {};

  if (form.subject.trim().length < 3) {
    errors.subject = t("reclamations.errors.subjectRequired");
  }

  if (form.message.trim().length < 10) {
    errors.message = t("reclamations.errors.descriptionRequired");
  }

  if (form.type === "maintenance") {
    if (!form.maintenanceType?.trim()) {
      errors.maintenanceType = t("reclamations.errors.maintenanceTypeRequired");
    }

    const estimatedCost = parseOptionalPositiveNumber(form.estimatedCost);
    if (estimatedCost !== null && (!Number.isFinite(estimatedCost) || estimatedCost < 0)) {
      errors.estimatedCost = t("reclamations.errors.estimatedCostInvalid");
    }

    const currentMileage = parseOptionalPositiveNumber(form.currentMileage);
    if (currentMileage !== null && (!Number.isFinite(currentMileage) || currentMileage < 0)) {
      errors.currentMileage = t("reclamations.errors.currentMileageInvalid");
    }
  }

  return errors;
}

export function useReclamationForm() {
  const { t } = useTranslation();
  const { createReclamation, isLoading } = useReclamation();
  const user = useSelector((state: RootState) => state.auth.user);

  const [form, setForm] = useState<ReclamationFormData>(initialForm);
  const [errors, setErrors] = useState<ReclamationFormErrors>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isContextLoading, setIsContextLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadContext = async () => {
      setIsContextLoading(true);
      setContextError(null);
      try {
        const [ongoing, scheduled] = await Promise.all([
          tripsApi.getTripsWithMeta({ status: "ongoing", limit: 1 }),
          tripsApi.getTripsWithMeta({ status: "scheduled", limit: 1 }),
        ]);
        if (cancelled) return;

        const trip = ongoing.items[0] ?? scheduled.items[0] ?? null;
        const vehicle = trip?.vehicleRecord;
        const vehicleName =
          vehicle?.name ||
          vehicle?.model ||
          vehicle?.Vehicle_Model ||
          trip?.vehicle ||
          "";
        const vehiclePlate = vehicle?.plaque_immatriculation || "";

        setForm((prev) => ({
          ...prev,
          driverName: user?.name || prev.driverName,
          tripId: trip?.id || prev.tripId,
          vehicleId: trip?.vehicleId || vehicle?.id || prev.vehicleId,
          vehicleName: vehicleName || prev.vehicleName,
          vehiclePlate: vehiclePlate || prev.vehiclePlate,
        }));
      } catch (error) {
        if (!cancelled) {
          setForm((prev) => ({
            ...prev,
            driverName: user?.name || prev.driverName,
          }));
          setContextError(
            error instanceof Error
              ? error.message
              : t("reclamations.errors.contextLoadFailed"),
          );
        }
      } finally {
        if (!cancelled) setIsContextLoading(false);
      }
    };

    void loadContext();

    return () => {
      cancelled = true;
    };
  }, [t, user?.name]);

  const updateImages = useCallback(
    (value: React.SetStateAction<ReclamationImage[]>) => {
      setForm((prev) => ({
        ...prev,
        images: typeof value === "function" ? value(prev.images) : value,
      }));
    },
    [],
  );

  const { showPicker, removeImage } = useImagePicker(
    form.images,
    updateImages,
  );

  const setSubject = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, subject: value }));
    setErrors((prev) => ({ ...prev, subject: undefined }));
  }, []);

  const setType = useCallback((type: ReclamationType, label?: string) => {
    setForm((prev) => ({
      ...prev,
      type,
      reclamationTypeLabel: label,
      subject:
        !prev.subject.trim() || prev.subject === prev.reclamationTypeLabel
          ? label || prev.subject
          : prev.subject,
    }));
  }, []);

  const setMessage = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, message: value }));
    setErrors((prev) => ({ ...prev, message: undefined }));
  }, []);

  const setMaintenanceType = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, maintenanceType: value }));
    setErrors((prev) => ({ ...prev, maintenanceType: undefined }));
  }, []);

  const setMaintenancePriority = useCallback((value: MaintenancePriority) => {
    setForm((prev) => ({ ...prev, maintenancePriority: value }));
  }, []);

  const setEstimatedCost = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, estimatedCost: value }));
    setErrors((prev) => ({ ...prev, estimatedCost: undefined }));
  }, []);

  const setCurrentMileage = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, currentMileage: value }));
    setErrors((prev) => ({ ...prev, currentMileage: undefined }));
  }, []);

  const setMaintenanceNotes = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, maintenanceNotes: value }));
  }, []);

  const setDate = useCallback((date: Date) => {
    setForm((prev) => ({ ...prev, date }));
    setIsDatePickerVisible(false);
  }, []);

  const openDatePicker = useCallback(() => setIsDatePickerVisible(true), []);
  const closeDatePicker = useCallback(() => setIsDatePickerVisible(false), []);

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const goNext = useCallback(() => {
    const nextErrors = validateForm(form, t);

    if (currentStep === 0 && (nextErrors.subject || nextErrors.message)) {
      setErrors(nextErrors);
      return;
    }

    setCurrentStep((prev) => Math.min(STEPS.length - 1, prev + 1));
  }, [currentStep, form, t]);

  const handleSubmit = useCallback(async () => {
    const nextErrors = validateForm(form, t);

    if (
      nextErrors.subject ||
      nextErrors.message ||
      nextErrors.maintenanceType ||
      nextErrors.estimatedCost ||
      nextErrors.currentMileage
    ) {
      setErrors(nextErrors);
      setCurrentStep(0);
      return;
    }

    try {
      const isMaintenance = form.type === "maintenance";

      await createReclamation({
        subject: form.subject.trim(),
        message: form.message.trim(),
        type: form.type,
        vehicleId:
          form.type === "vehicle" || form.type === "maintenance"
            ? form.vehicleId
            : undefined,
        vehicleName:
          form.type === "vehicle" || form.type === "maintenance"
            ? form.vehicleName
            : undefined,
        vehiclePlate:
          form.type === "vehicle" || form.type === "maintenance"
            ? form.vehiclePlate
            : undefined,
        driverName: form.driverName || user?.name || undefined,
        tripId: form.tripId,
        reclamationTypeLabel: form.reclamationTypeLabel,
        metadata: {
          source: "mobile",
          tripId: form.tripId ?? null,
          vehicleName: form.vehicleName ?? null,
          vehiclePlate: form.vehiclePlate ?? null,
          driverName: form.driverName || user?.name || null,
          maintenanceType: isMaintenance ? form.maintenanceType ?? null : null,
          maintenancePriority: isMaintenance ? form.maintenancePriority ?? null : null,
          estimatedCost: isMaintenance ? form.estimatedCost?.trim() || null : null,
          currentMileage: isMaintenance ? form.currentMileage?.trim() || null : null,
          maintenanceNotes: isMaintenance ? form.maintenanceNotes?.trim() || null : null,
        },
        images: form.images,
      });
      setIsSuccess(true);
      Alert.alert(t("shared.success"), t("reclamations.success.submittedAlert"));
    } catch (error) {
        let errorMessage = t("reclamations.errors.submitFailed");
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === "object" && error !== null) {
          const axError = error as any;
          if (axError?.response?.status) {
            errorMessage = t("shared.serverError", { status: axError.response.status, message: axError.response.data?.message || axError.message });
          } else if (axError?.code) {
            errorMessage = t("shared.networkError", { code: axError.code, message: axError.message });
          } else if (axError?.message) {
            errorMessage = axError.message;
          }
        }
        console.error("🔴 Reclamation submission error:", {
          message: errorMessage,
          fullError: error,
          hasResponse: (error as any)?.response ? true : false,
          responseStatus: (error as any)?.response?.status,
          errorCode: (error as any)?.code,
        });
      Alert.alert(t("reclamations.errors.submissionFailedTitle"), errorMessage);
    }
  }, [createReclamation, form, t, user?.name]);

  const resetForm = useCallback(() => {
    setForm(initialForm);
    setErrors({});
    setCurrentStep(0);
    setIsDatePickerVisible(false);
    setIsSuccess(false);
  }, []);

  const isFormValid = useMemo(() => {
    const nextErrors = validateForm(form, t);
    return !nextErrors.subject && !nextErrors.message;
  }, [form, t]);

  return {
    form,
    errors,
    steps: STEPS,
    currentStep,
    isDatePickerVisible,
    isSuccess,
    isLoading,
    isContextLoading,
    contextError,
    isFormValid,
    setType,
    setSubject,
    setMessage,
    setMaintenanceType,
    setMaintenancePriority,
    setEstimatedCost,
    setCurrentMileage,
    setMaintenanceNotes,
    setDate,
    openDatePicker,
    closeDatePicker,
    pickImages: showPicker,
    removeImage,
    goBack,
    goNext,
    handleSubmit,
    resetForm,
  };
}
