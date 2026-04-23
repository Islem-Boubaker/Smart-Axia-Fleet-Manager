import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";

import { useImagePicker } from "./useImagePicker";
import { useReclamation } from "./useReclamation";
import type {
  ReclamationFormData,
  ReclamationFormErrors,
  ReclamationImage,
  ReclamationStep,
} from "../types/reclamation.types";

const STEPS: ReclamationStep[] = ["SUBJECT"];

const initialForm: ReclamationFormData = {
  subject: "",
  message: "",
  date: null,
  images: [],
};

function validateForm(form: ReclamationFormData): ReclamationFormErrors {
  const errors: ReclamationFormErrors = {};

  if (form.subject.trim().length < 3) {
    errors.subject = "Subject must be at least 3 characters.";
  }

  if (form.message.trim().length < 10) {
    errors.message = "Description must be at least 10 characters.";
  }

  return errors;
}

export function useReclamationForm() {
  const { createReclamation, isLoading } = useReclamation();

  const [form, setForm] = useState<ReclamationFormData>(initialForm);
  const [errors, setErrors] = useState<ReclamationFormErrors>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  const setMessage = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, message: value }));
    setErrors((prev) => ({ ...prev, message: undefined }));
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
    const nextErrors = validateForm(form);

    if (currentStep === 0 && (nextErrors.subject || nextErrors.message)) {
      setErrors(nextErrors);
      return;
    }

    setCurrentStep((prev) => Math.min(STEPS.length - 1, prev + 1));
  }, [currentStep, form]);

  const handleSubmit = useCallback(async () => {
    const nextErrors = validateForm(form);

    if (nextErrors.subject || nextErrors.message) {
      setErrors(nextErrors);
      setCurrentStep(0);
      return;
    }

    try {
      await createReclamation({
        subject: form.subject.trim(),
        message: form.message.trim(),
        images: form.images,
      });
      setIsSuccess(true);
      Alert.alert("Success", "Reclamation submitted successfully.");
    } catch (error) {
        let errorMessage = "Could not submit your reclamation. Please try again.";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === "object" && error !== null) {
          const axError = error as any;
          if (axError?.response?.status) {
            errorMessage = `Server error (${axError.response.status}): ${axError.response.data?.message || axError.message}`;
          } else if (axError?.code) {
            errorMessage = `Network error: ${axError.code} - ${axError.message}`;
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
      Alert.alert("Submission failed", errorMessage);
    }
  }, [createReclamation, form]);

  const resetForm = useCallback(() => {
    setForm(initialForm);
    setErrors({});
    setCurrentStep(0);
    setIsDatePickerVisible(false);
    setIsSuccess(false);
  }, []);

  const isFormValid = useMemo(() => {
    const nextErrors = validateForm(form);
    return !nextErrors.subject && !nextErrors.message;
  }, [form]);

  return {
    form,
    errors,
    steps: STEPS,
    currentStep,
    isDatePickerVisible,
    isSuccess,
    isLoading,
    isFormValid,
    setSubject,
    setMessage,
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
