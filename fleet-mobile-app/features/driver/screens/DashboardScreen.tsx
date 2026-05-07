import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, StatusBar, TouchableOpacity, Modal, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import TaskCard from "../components/TaskCard";
import TripCard from "../components/TripCard";
import { router } from "expo-router";
import { useDashboard } from "../hooks/useDashboard";
import { useVehicles } from "../hooks/useVehicles";
import { useVehicleDetails } from "../hooks/useVehicleDetails";
import type { User } from "@/features/auth/types/auth.types";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";
import { useAppTheme } from "@/shared/theme/ThemeProvider";
import MainTopHeader from "@/shared/components/layout/MainTopHeader";

const getGreetingKey = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "home.greeting.morning";
  if (hour < 18) return "home.greeting.afternoon";
  return "home.greeting.evening";
};

function firstDefined<T = unknown>(...values: T[]): T | null {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function normalizePlate(value: unknown): string {
  return normalizeText(value).replace(/\s+/g, "");
}

function buildVehicleLabel(name: string | null | undefined, plate: string | null | undefined): string {
  const resolvedName = String(name ?? "").trim();
  const resolvedPlate = String(plate ?? "").trim();
  if (resolvedName && resolvedPlate) return `${resolvedName} (${resolvedPlate})`;
  return resolvedName || resolvedPlate;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeVehicleDetails(raw: any, fallbackName: string, fallbackPlate: string) {
  const vehicle = raw?.vehicle ?? raw?.data ?? raw;
  const year = toNumberOrNull(firstDefined(raw?.year, raw?.Year));
  const computedAge = year ? Math.max(0, new Date().getFullYear() - year) : null;

  const mileage = toNumberOrNull(
    firstDefined(
      vehicle?.Mileage,
      vehicle?.mileage,
      vehicle?.odometer,
      vehicle?.kilometers,
      vehicle?.km,
    ),
  );

  const vehicleAge = toNumberOrNull(
    firstDefined(
      vehicle?.Vehicle_Age,
      vehicle?.vehicleAge,
      vehicle?.age,
      computedAge,
    ),
  );

  const engineSize = toNumberOrNull(
    firstDefined(vehicle?.Engine_Size, vehicle?.engineSize, vehicle?.engine_capacity),
  );

  return {
    id: firstDefined(vehicle?.id, raw?.id),
    name: firstDefined(vehicle?.name, vehicle?.model, vehicle?.Vehicle_Model, fallbackName, "N/A"),
    plaque_immatriculation: firstDefined(
      vehicle?.plaque_immatriculation,
      vehicle?.licensePlate,
      vehicle?.plate,
      vehicle?.registration,
      fallbackPlate,
      "N/A",
    ),
    type: firstDefined(vehicle?.type, vehicle?.Vehicle_Model, vehicle?.vehicleType, vehicle?.fuelType, "N/A"),
    Mileage: mileage,
    Vehicle_Age: vehicleAge,
    Engine_Size: engineSize,
    Battery_Status: firstDefined(vehicle?.Battery_Status, vehicle?.batteryStatus, vehicle?.battery, "N/A"),
    Tire_Condition: firstDefined(vehicle?.Tire_Condition, vehicle?.tireCondition, vehicle?.tiresCondition, "N/A"),
    Brake_Condition: firstDefined(vehicle?.Brake_Condition, vehicle?.brakeCondition, vehicle?.brakesCondition, "N/A"),
    insurance_expiry_date: firstDefined(vehicle?.insurance_expiry_date, vehicle?.insuranceExpiryDate),
    tech_visit_expiry_date: firstDefined(vehicle?.tech_visit_expiry_date, vehicle?.techVisitExpiryDate),
    Active: firstDefined(vehicle?.Active, vehicle?.active, vehicle?.status === "active"),
    Need_Maintenance: Boolean(
      firstDefined(vehicle?.Need_Maintenance, vehicle?.needMaintenance, vehicle?.status === "maintenance", false),
    ),
    photos: Array.isArray(vehicle?.photos) ? vehicle.photos : [],
  };
}



function DashboardScreen() {
  const { isDark } = useAppTheme();
  const { t } = useTranslation();
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const {
    user: rawUser,
    activeTrip,
    upcomingTrip,
    recentTrips,
    completedCount,
    pendingCount,
    isLoading,
    error,
    refetch,
  } = useDashboard();
  const { vehicles } = useVehicles();
  // Cast user to correct type
  const user = rawUser as (User & { assignedVehicle?: string | null }) | null;

  const assignedVehicleRaw = user?.assignedVehicle?.trim() ?? "";
  const assignedVehicleMatch = assignedVehicleRaw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  const vehicleName = assignedVehicleMatch ? assignedVehicleMatch[1].trim() : assignedVehicleRaw || t("home.noAssignedVehicle");
  const vehiclePlate = assignedVehicleMatch ? assignedVehicleMatch[2].trim() : "-";
  const tripVehicleCandidate = activeTrip ?? upcomingTrip;
  const tripVehicleRaw =
    (tripVehicleCandidate as any)?.vehicleRecord ??
    (tripVehicleCandidate as any)?.vehicle;
  const tripVehicleId = String(
    (tripVehicleCandidate as any)?.vehicleId ??
      ((typeof tripVehicleRaw === "object" && tripVehicleRaw !== null) ? tripVehicleRaw.id : "") ??
      "",
  ).trim();
  const tripVehicleName = firstDefined(
    typeof tripVehicleRaw === "object" && tripVehicleRaw !== null ? tripVehicleRaw.name : null,
    typeof tripVehicleRaw === "object" && tripVehicleRaw !== null ? tripVehicleRaw.model : null,
    typeof tripVehicleRaw === "object" && tripVehicleRaw !== null ? tripVehicleRaw.Vehicle_Model : null,
  );
  const tripVehiclePlate = firstDefined(
    typeof tripVehicleRaw === "object" && tripVehicleRaw !== null ? tripVehicleRaw.plaque_immatriculation : null,
    typeof tripVehicleRaw === "object" && tripVehicleRaw !== null ? tripVehicleRaw.plate : null,
    typeof tripVehicleRaw === "object" && tripVehicleRaw !== null ? tripVehicleRaw.licensePlate : null,
  );

  const matchedVehicle = useMemo(() => {
    if (vehicles.length === 0) return null;

    const normalizedAssigned = normalizeText(assignedVehicleRaw);
    const extractedPlate = normalizePlate(assignedVehicleMatch?.[2]);
    const extractedName = normalizeText(assignedVehicleMatch?.[1]);

    return (
      vehicles.find((v) => {
        const id = normalizeText(v?.id);
        const plate = normalizePlate(v?.plaque_immatriculation);
        const name = normalizeText(v?.name);
        const fullLabel = normalizeText(buildVehicleLabel(v?.name, v?.plaque_immatriculation));

        return (
          (Boolean(tripVehicleId) && id === normalizeText(tripVehicleId)) ||
          (Boolean(tripVehiclePlate) && plate === normalizePlate(tripVehiclePlate)) ||
          (Boolean(tripVehicleName) && name === normalizeText(tripVehicleName)) ||
          (Boolean(normalizedAssigned) && (
            normalizedAssigned === id ||
            normalizedAssigned === normalizeText(v?.plaque_immatriculation) ||
            normalizedAssigned === name ||
            normalizedAssigned === fullLabel
          )) ||
          (Boolean(extractedPlate) && plate === extractedPlate) ||
          (Boolean(extractedName) && Boolean(extractedPlate) && name === extractedName && plate === extractedPlate)
        );
      }) ?? null
    );
  }, [assignedVehicleMatch, assignedVehicleRaw, tripVehicleId, tripVehicleName, tripVehiclePlate, vehicles]);

  const matchedVehicleId =
    (matchedVehicle?.id ? String(matchedVehicle.id) : null) ||
    tripVehicleId ||
    null;
  const selectedVehicleSummary = useMemo(
    () =>
      matchedVehicle ??
      (tripVehicleRaw
        ? {
            id: tripVehicleId || undefined,
            name: tripVehicleName ?? vehicleName,
            plaque_immatriculation: tripVehiclePlate ?? vehiclePlate,
          }
        : null),
    [matchedVehicle, tripVehicleId, tripVehicleName, tripVehiclePlate, tripVehicleRaw, vehicleName, vehiclePlate],
  );

  const shouldFetchVehicleDetails =
    vehicleModalVisible &&
    Boolean(matchedVehicleId) &&
    !matchedVehicle;

  // Fetch full vehicle details by ID only when we could not resolve the vehicle from the list
  const {
    vehicle: vehicleDetails,
    loading: vehicleDetailsLoading,
    error: vehicleDetailsError,
  } = useVehicleDetails(shouldFetchVehicleDetails ? matchedVehicleId : null);
  const vehicleDetailsToShow = useMemo(() => {
    const source = vehicleDetails ?? matchedVehicle ?? selectedVehicle ?? {};
    return normalizeVehicleDetails(source, vehicleName, vehiclePlate);
  }, [matchedVehicle, selectedVehicle, vehicleDetails, vehicleName, vehiclePlate]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const currentTask = activeTrip ?? upcomingTrip;
  const secondaryUpcoming = activeTrip ? upcomingTrip : null;

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 dark:bg-[#0B1220] px-5 items-center justify-center">
        <Text className="text-red-500 font-semibold mb-2">{t("dashboard.failedToLoad")}</Text>
        <Text className="text-gray-500 dark:text-slate-400 text-center mb-4">{error}</Text>
        <TouchableOpacity
          onPress={() => void refetch()}
          className="bg-blue-600 px-5 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">{t("dashboard.retry")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-[#0B1220]">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <MainTopHeader />

      {/* GREETING */}
      <View className="px-5 mb-3">
        <Text className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
          {t(getGreetingKey(), { name: user?.name?.split(" ")[0] ?? t("dashboard.driver") })}
        </Text>
        <Text className="text-xs text-gray-400 dark:text-slate-400">
          {t("dashboard.pendingCompleted", { pending: pendingCount, completed: completedCount })}
        </Text>
      </View>

      {/* CONTENT */}
      <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: 92 }}>

        {/* Assigned Vehicle Section */}

        <TouchableOpacity
          className="bg-white dark:bg-slate-900 rounded-3xl p-4 mb-4 border border-gray-200 dark:border-slate-700 flex-row items-center justify-between"
          style={{
            elevation: 4,
            shadowColor: "#0F172A",
            shadowOpacity: isDark ? 0.28 : 0.09,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
          }}
          onPress={() => {
            setSelectedVehicle(selectedVehicleSummary);
            setVehicleModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <View>
            <Text className="text-xs text-gray-400 dark:text-slate-400 mb-1">{t("dashboard.assignedVehicle")}</Text>
            <Text className="font-bold text-base text-gray-900 dark:text-gray-50">{vehicleName} - {vehiclePlate}</Text>
          </View>
          <MaterialIcons name="directions-car" size={32} color="#2D9B6F" />
        </TouchableOpacity>


        {/* Vehicle Details Modal */}
        <Modal
          visible={vehicleModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setVehicleModalVisible(false)}
        >
          <View className="flex-1 bg-black/70 justify-center items-center">
            <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-[90%] max-w-[400px] items-center border border-gray-100 dark:border-slate-700">
              {vehicleDetailsLoading ? (
                <Text className="text-gray-500 dark:text-slate-400">{t("dashboard.technicalDetails")}...</Text>
              ) : (
                <>
                  <Text className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-50">{vehicleDetailsToShow.name || 'N/A'} - {vehicleDetailsToShow.plaque_immatriculation || 'N/A'}</Text>
                  {Array.isArray(vehicleDetailsToShow.photos) && vehicleDetailsToShow.photos.length > 0 ? (
                    <Image source={{ uri: vehicleDetailsToShow.photos[0] }} style={{ width: 220, height: 120, borderRadius: 12 }} />
                  ) : (
                    <MaterialIcons name="directions-car" size={80} color="#2D9B6F" />
                  )}
                  <View className="mt-4 w-full">
                    <Text className="font-semibold text-base mb-2 text-gray-900 dark:text-gray-50">{t("dashboard.technicalDetails")}</Text>
                    <Text className="text-gray-700 dark:text-slate-300">{t("dashboard.mileage")}: <Text className="font-bold">{vehicleDetailsToShow.Mileage !== undefined && vehicleDetailsToShow.Mileage !== null ? vehicleDetailsToShow.Mileage.toLocaleString() : 'N/A'} {t("dashboard.km")}</Text></Text>
                    <Text className="text-gray-700 dark:text-slate-300">{t("dashboard.vehicleAge")}: <Text className="font-bold">{vehicleDetailsToShow.Vehicle_Age !== undefined && vehicleDetailsToShow.Vehicle_Age !== null ? vehicleDetailsToShow.Vehicle_Age : 'N/A'} {t("dashboard.years")}</Text></Text>
                    <Text className="text-gray-700 dark:text-slate-300">{t("dashboard.type")}: <Text className="font-bold">{vehicleDetailsToShow.type || 'N/A'}</Text></Text>
                    <Text className="text-gray-700 dark:text-slate-300">{t("dashboard.engineSize")}: <Text className="font-bold">{vehicleDetailsToShow.Engine_Size !== undefined && vehicleDetailsToShow.Engine_Size !== null ? vehicleDetailsToShow.Engine_Size : 'N/A'} {t("dashboard.cc")}</Text></Text>
                    <Text className="text-gray-700 dark:text-slate-300">{t("dashboard.batteryStatus")}: <Text className="font-bold">{vehicleDetailsToShow.Battery_Status || 'N/A'}</Text></Text>
                    <Text className="text-gray-700 dark:text-slate-300">{t("dashboard.tireCondition")}: <Text className="font-bold">{vehicleDetailsToShow.Tire_Condition || 'N/A'}</Text></Text>
                    <Text className="text-gray-700 dark:text-slate-300">{t("dashboard.brakeCondition")}: <Text className="font-bold">{vehicleDetailsToShow.Brake_Condition || 'N/A'}</Text></Text>
                    <Text className="text-gray-700 dark:text-slate-300">{t("dashboard.insuranceExpiry")}: <Text className="font-bold">{vehicleDetailsToShow.insurance_expiry_date ? new Date(vehicleDetailsToShow.insurance_expiry_date).toLocaleDateString() : 'N/A'}</Text></Text>
                    <Text className="text-gray-700 dark:text-slate-300">{t("dashboard.techVisitExpiry")}: <Text className="font-bold">{vehicleDetailsToShow.tech_visit_expiry_date ? new Date(vehicleDetailsToShow.tech_visit_expiry_date).toLocaleDateString() : 'N/A'}</Text></Text>
                    <Text className="text-gray-700 dark:text-slate-300">{t("dashboard.status")}: <Text className="font-bold">{vehicleDetailsToShow.Active === null ? 'N/A' : vehicleDetailsToShow.Active ? t("dashboard.inService") : t("dashboard.outOfService")}</Text></Text>
                    {vehicleDetailsToShow.Need_Maintenance && <Text className="text-red-500 font-bold">{t("dashboard.maintenanceRequired")}</Text>}
                    {vehicleDetailsError && (
                      <Text className="text-[11px] text-amber-600 mt-2">
                        {t("dashboard.vehicleUnavailable")}
                      </Text>
                    )}
                  </View>
                </>
              )}
              <TouchableOpacity
                className="mt-4 px-6 py-2 bg-blue-600 rounded-xl"
                onPress={() => setVehicleModalVisible(false)}
              >
                <Text className="text-white font-semibold">{t("dashboard.close")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View className="flex-row gap-3 mb-5">
          <TaskCard
            trip={currentTask}
            isCurrent
            onPress={() => {
              if (!currentTask?.id) return;
              router.push(`/trips/${currentTask.id}`);
            }}
          />
          <TaskCard
            trip={secondaryUpcoming}
            isCurrent={false}
            onPress={() => {
              if (!secondaryUpcoming?.id) return;
              router.push(`/trips/${secondaryUpcoming.id}`);
            }}
          />
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="font-bold text-gray-900 dark:text-gray-50">{t("dashboard.recentTrips")}</Text>
          <TouchableOpacity onPress={() => router.push("/trips")}>
            <Text className="text-blue-600">{t("dashboard.viewAll")}</Text>
          </TouchableOpacity>
        </View>

        {recentTrips.length === 0 ? (
          <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 mb-4 border border-gray-200 dark:border-slate-700">
            <Text className="text-gray-600 dark:text-slate-200 font-medium">{t("dashboard.noTripsFound")}</Text>
            <Text className="text-gray-400 dark:text-slate-400 text-xs mt-1">{t("dashboard.noCompletedTrips")}</Text>
          </View>
        ) : (
          recentTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)
        )}
        <View className="mb-8" />

      </ScrollView>
    </SafeAreaView>
  );
}

export { DashboardScreen };
export default DashboardScreen;
