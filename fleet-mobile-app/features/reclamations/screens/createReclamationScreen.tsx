import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import BackButton from "@/shared/components/ui/BackButton";
import { useAppTheme } from "@/shared/theme/ThemeProvider";
import { FormInput } from "../components/FormInput";
import { ImageUploader } from "../components/ImageUploader";
import { SuccessScreen } from "../components/SuccessScreen";
import { useReclamationForm } from "../hooks/useReclamationForm";
import type { MaintenancePriority, ReclamationType } from "../types/reclamation.types";

type TypeOption = {
  type: ReclamationType;
  label: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  subject: string;
};

const TYPE_OPTIONS: TypeOption[] = [
  {
    type: "vehicle",
    label: "Vehicle issue",
    description: "Damage, breakdown, missing equipment, or vehicle availability.",
    icon: "directions-car",
    subject: "Vehicle issue",
  },
  {
    type: "accident",
    label: "Accident report",
    description: "Collision, road accident, or any safety incident involving the vehicle.",
    icon: "car-crash",
    subject: "Accident report",
  },
  {
    type: "maintenance",
    label: "Maintenance needed",
    description: "Ask operations to schedule a maintenance intervention.",
    icon: "build",
    subject: "Maintenance needed",
  },
  {
    type: "trip",
    label: "Trip problem",
    description: "Delay, route problem, stop problem, or trip execution issue.",
    icon: "timeline",
    subject: "Trip problem",
  },
  {
    type: "general",
    label: "General report",
    description: "Anything else the operations team should review.",
    icon: "report-problem",
    subject: "General report",
  },
];

const MAINTENANCE_TYPE_OPTIONS = [
  "General Inspection",
  "Technical Visit",
  "Insurance Renewal",
  "Oil Change",
  "Tire Rotation",
  "Brake Inspection",
  "Engine Tune-up",
  "Battery Replacement",
  "Other",
];

const MAINTENANCE_PRIORITY_OPTIONS: {
  value: MaintenancePriority;
  label: string;
  color: string;
}[] = [
  { value: "low", label: "Low", color: "#22C55E" },
  { value: "medium", label: "Medium", color: "#F59E0B" },
  { value: "high", label: "High", color: "#EF4444" },
];

const requiresVehicleContext = (type: ReclamationType) =>
  type === "vehicle" || type === "maintenance" || type === "accident";

const vehicleLabel = (name?: string, plate?: string) => {
  if (name && plate) return `${name} (${plate})`;
  return name || plate || "No assigned vehicle found";
};

const CreateReclamationScreen: React.FC = () => {
  const hook = useReclamationForm();
  const { isDark } = useAppTheme();
  const selectedOption =
    TYPE_OPTIONS.find((option) => option.type === hook.form.type) ?? TYPE_OPTIONS[0];
  const canProceed =
    hook.form.subject.trim().length >= 3 &&
    hook.form.message.trim().length >= 10 &&
    (hook.form.type !== "maintenance" || Boolean(hook.form.maintenanceType?.trim()));
  const contextRequired = requiresVehicleContext(hook.form.type);

  if (hook.isSuccess) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-[#0B1220]">
        <SuccessScreen onReset={hook.resetForm} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0B1220]">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0B1220" : "#FFFFFF"}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View className="px-5 pt-8">
          <View className="mb-4 flex-row items-center justify-between">
            <BackButton />
            <Text className="text-base font-bold tracking-tight text-gray-800 dark:text-gray-50">
              Report an issue
            </Text>
            <View className="w-9" />
          </View>
        </View>

        <View className="mx-5 mb-2 h-px bg-gray-100 dark:bg-slate-700" />

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
        >
          <Text className="text-2xl font-black text-gray-900 dark:text-white">
            What happened?
          </Text>
          <Text className="mt-1 text-sm leading-5 text-gray-500 dark:text-slate-400">
            Choose the report type first. Vehicle and maintenance reports are
            linked automatically to your assigned vehicle.
          </Text>

          <View className="mt-5" style={{ gap: 10 }}>
            {TYPE_OPTIONS.map((option) => {
              const active = option.type === hook.form.type;
              return (
                <TouchableOpacity
                  key={option.type}
                  activeOpacity={0.88}
                  onPress={() => hook.setType(option.type, option.subject)}
                  className={`rounded-3xl border p-4 ${
                    active
                      ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/15"
                      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                  }`}
                >
                  <View className="flex-row items-start gap-3">
                    <View
                      className={`h-11 w-11 items-center justify-center rounded-2xl ${
                        active ? "bg-blue-600" : "bg-slate-100 dark:bg-slate-800"
                      }`}
                    >
                      <MaterialIcons
                        name={option.icon}
                        size={22}
                        color={active ? "#FFFFFF" : isDark ? "#CBD5E1" : "#475569"}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-sm font-extrabold ${
                          active ? "text-blue-700 dark:text-blue-200" : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {option.label}
                      </Text>
                      <Text className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {option.description}
                      </Text>
                    </View>
                    {active ? (
                      <MaterialIcons name="check-circle" size={20} color="#2563EB" />
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {contextRequired ? (
            <View className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-xs font-black uppercase tracking-[1.5px] text-slate-400">
                  Auto-filled context
                </Text>
                {hook.isContextLoading ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : null}
              </View>

              <View style={{ gap: 10 }}>
                <View className="flex-row items-center gap-3">
                  <MaterialIcons name="person" size={18} color="#64748B" />
                  <Text className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {hook.form.driverName || "Driver name unavailable"}
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <MaterialIcons name="local-shipping" size={18} color="#64748B" />
                  <Text className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {vehicleLabel(hook.form.vehicleName, hook.form.vehiclePlate)}
                  </Text>
                </View>
              </View>

              {hook.contextError ? (
                <Text className="mt-3 text-xs leading-5 text-amber-600 dark:text-amber-300">
                  {hook.contextError}
                </Text>
              ) : null}
            </View>
          ) : null}

          {hook.form.type === "maintenance" ? (
            <View className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <View className="mb-4 flex-row items-center gap-2">
                <View className="h-9 w-9 items-center justify-center rounded-2xl bg-blue-600/10">
                  <MaterialIcons name="engineering" size={20} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-black text-slate-900 dark:text-white">
                    Maintenance details
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    These fields will prefill the admin maintenance schedule.
                  </Text>
                </View>
              </View>

              <Text className="mb-2 text-xs font-black uppercase tracking-[1.5px] text-slate-400">
                Maintenance type
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {MAINTENANCE_TYPE_OPTIONS.map((option) => {
                  const active = hook.form.maintenanceType === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      activeOpacity={0.86}
                      onPress={() => hook.setMaintenanceType(option)}
                      className={`rounded-full border px-3 py-2 ${
                        active
                          ? "border-blue-500 bg-blue-600"
                          : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          active ? "text-white" : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {hook.errors.maintenanceType ? (
                <Text className="mt-2 text-xs font-medium text-rose-500">
                  {hook.errors.maintenanceType}
                </Text>
              ) : null}

              <Text className="mb-2 mt-5 text-xs font-black uppercase tracking-[1.5px] text-slate-400">
                Priority
              </Text>
              <View className="flex-row" style={{ gap: 8 }}>
                {MAINTENANCE_PRIORITY_OPTIONS.map((option) => {
                  const active = hook.form.maintenancePriority === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      activeOpacity={0.86}
                      onPress={() => hook.setMaintenancePriority(option.value)}
                      className={`flex-1 rounded-2xl border px-3 py-3 ${
                        active
                          ? "border-transparent"
                          : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                      }`}
                      style={active ? { backgroundColor: option.color } : undefined}
                    >
                      <Text
                        className={`text-center text-xs font-black ${
                          active ? "text-white" : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View className="mt-5">
                <FormInput
                  label="Estimated Cost (TND)"
                  value={hook.form.estimatedCost ?? ""}
                  onChangeText={hook.setEstimatedCost}
                  error={hook.errors.estimatedCost}
                  placeholder="e.g., 150"
                  keyboardType="numeric"
                />

                <FormInput
                  label="Current Mileage (km)"
                  value={hook.form.currentMileage ?? ""}
                  onChangeText={hook.setCurrentMileage}
                  error={hook.errors.currentMileage}
                  placeholder="e.g., 45230"
                  keyboardType="numeric"
                />

                <FormInput
                  label="Maintenance Notes"
                  value={hook.form.maintenanceNotes ?? ""}
                  onChangeText={hook.setMaintenanceNotes}
                  placeholder="Specific parts, warning lights, noises, or preferred technician..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          ) : null}

          <View className="mt-6">
            <FormInput
              label="Subject"
              value={hook.form.subject}
              onChangeText={hook.setSubject}
              error={hook.errors.subject}
              placeholder={selectedOption.subject}
              required
            />

            <FormInput
              label="Description"
              value={hook.form.message}
              onChangeText={hook.setMessage}
              error={hook.errors.message}
              placeholder={
                hook.form.type === "maintenance"
                  ? "Describe the symptom, urgency, noise, warning light, or part that needs attention..."
                  : "Describe the issue in detail..."
              }
              multiline
              numberOfLines={5}
              required
            />

            <ImageUploader
              images={hook.form.images}
              onPickImages={hook.pickImages}
              onRemoveImage={hook.removeImage}
            />
          </View>
        </ScrollView>

        <View
          className="border-t border-gray-100 bg-white px-5 pb-6 pt-3 dark:border-slate-700 dark:bg-slate-900"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 10,
            paddingBottom: Platform.OS === "ios" ? 16 : 30,
          }}
        >
          <TouchableOpacity
            onPress={hook.handleSubmit}
            disabled={!canProceed || hook.isLoading}
            className={`flex-row items-center justify-center rounded-2xl py-4 ${
              canProceed && !hook.isLoading ? "bg-blue-600" : "bg-blue-300"
            }`}
            style={{
              shadowColor: "#2563EB",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: canProceed ? 0.25 : 0,
              shadowRadius: 12,
              elevation: canProceed ? 6 : 0,
            }}
          >
            {hook.isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-bold text-white">
                Submit {selectedOption.label}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateReclamationScreen;
CreateReclamationScreen.displayName = "CreateReclamationScreen";
