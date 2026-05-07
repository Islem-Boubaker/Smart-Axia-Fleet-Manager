import BackButton from "@/shared/components/ui/BackButton";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";
import RefreshButton from "@/shared/components/ui/RefreshButton";
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useReclamation } from "../hooks/useReclamation";
import { useTranslation } from "react-i18next";
import { getStatusTranslationKey } from "@/shared/utils/translateStatus";

const { width } = Dimensions.get("window");
const IMAGE_WIDTH = width;

type ReclamationStatus = "pending" | "resolved" | "rejected" | "in_progress";

type ReclamationItem = {
  id: string;
  subject: string;
  message: string;
  status: ReclamationStatus;
  type?: string;
  driverName?: string | null;
  vehicleName?: string | null;
  vehiclePlate?: string | null;
  images: string[];
  createdAt: string;
};

type ReclamationDetailScreenProps = {
  route?: {
    params?: {
      id?: string;
      reclamation?: Partial<ReclamationItem> | string;
    };
  };
  navigation?: {
    goBack?: () => void;
  };
};

const STATUS_CONFIG: Record<
  ReclamationStatus,
  { bg: string; text: string; dot: string }
> = {
  pending: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  resolved: {
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  rejected: {
    bg: "bg-red-100",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  in_progress: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
};

function normalizeStatus(status: unknown): ReclamationStatus {
  if (typeof status !== "string") return "pending";
  const s = status.trim().toLowerCase();
  if (s === "resolved") return "resolved";
  if (s === "rejected") return "rejected";
  if (s === "in_progress" || s === "in progress") return "in_progress";
  return "pending";
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseRouteReclamation(
  value: unknown,
): Partial<ReclamationItem> | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object"
        ? (parsed as Partial<ReclamationItem>)
        : null;
    } catch {
      return null;
    }
  }
  return typeof value === "object" ? (value as Partial<ReclamationItem>) : null;
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReclamationStatus }) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <View
      className={`flex-row items-center px-3 py-1.5 rounded-full ${config.bg}`}
    >
      <View className={`w-2 h-2 rounded-full mr-2 ${config.dot}`} />
      <Text className={`text-xs font-semibold ${config.text}`}>
        {t(getStatusTranslationKey(status))}
      </Text>
    </View>
  );
}

// ─── Image Carousel ──────────────────────────────────────────────────────────

function ImageCarousel({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <View>
      <FlatList
        data={images}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / IMAGE_WIDTH);
          setActiveIndex(index);
        }}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width: IMAGE_WIDTH - 40, height: 260 }}
            resizeMode="cover"
            className="rounded-2xl items-center justify-center mx-5"
          />
        )}
      />

      {images.length > 1 && (
        <View className="flex-row justify-center mt-3" style={{ gap: 6 }}>
          {images.map((_, i) => (
            <View
              key={i}
              style={{
                height: 6,
                width: i === activeIndex ? 20 : 6,
                borderRadius: 99,
                backgroundColor: i === activeIndex ? "#1e293b" : "#cbd5e1",
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ReclamationDetailScreen({
  route,
  navigation,
}: ReclamationDetailScreenProps) {
  const { getReclamationDetail } = useReclamation();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const routeId =
    typeof route?.params?.id === "string" && route.params.id.trim().length > 0
      ? route.params.id
      : undefined;

  const routeReclamation = parseRouteReclamation(route?.params?.reclamation);

  const [reclamation, setReclamation] = useState<ReclamationItem>({
    ...DEMO,
    ...routeReclamation,
    id: routeId ?? routeReclamation?.id ?? DEMO.id,
    status: normalizeStatus(routeReclamation?.status ?? DEMO.status),
    images: Array.isArray(routeReclamation?.images)
      ? routeReclamation.images.filter(
          (img): img is string =>
            typeof img === "string" && img.trim().length > 0,
        )
      : [...DEMO.images],
  });

  const { subject, message, status, images, createdAt } = reclamation;
  const hasImages = images.length > 0;
  const vehicleContext = reclamation.vehicleName || reclamation.vehiclePlate
    ? `${reclamation.vehicleName || "Vehicle"}${reclamation.vehiclePlate ? ` (${reclamation.vehiclePlate})` : ""}`
    : null;

  const mapToReclamationItem = useCallback((value: any): ReclamationItem => {
    const safeImages = Array.isArray(value?.images)
      ? value.images.filter(
          (img: unknown): img is string =>
            typeof img === "string" && img.trim().length > 0,
        )
      : [];

    return {
      id: String(value?.id ?? reclamation.id),
      subject:
        typeof value?.subject === "string" && value.subject.trim().length > 0
          ? value.subject
          : reclamation.subject,
      message:
        typeof value?.message === "string" && value.message.trim().length > 0
          ? value.message
          : reclamation.message,
      status: normalizeStatus(value?.status),
      images: safeImages,
      createdAt:
        typeof value?.createdAt === "string" && value.createdAt.trim().length > 0
          ? value.createdAt
          : reclamation.createdAt,
      type: typeof value?.type === "string" ? value.type : reclamation.type,
      driverName:
        typeof value?.driverName === "string"
          ? value.driverName
          : value?.driver?.name || reclamation.driverName,
      vehicleName:
        typeof value?.vehicleName === "string"
          ? value.vehicleName
          : value?.vehicle?.name || value?.vehicle?.model || reclamation.vehicleName,
      vehiclePlate:
        typeof value?.vehiclePlate === "string"
          ? value.vehiclePlate
          : value?.vehicle?.plaque_immatriculation || reclamation.vehiclePlate,
    };
  }, [
    reclamation.createdAt,
    reclamation.driverName,
    reclamation.id,
    reclamation.message,
    reclamation.subject,
    reclamation.type,
    reclamation.vehicleName,
    reclamation.vehiclePlate,
  ]);

  const fetchDetails = useCallback(async () => {
    if (!routeId) return;
    setIsLoading(true);
    setError(null);

    try {
      const details = await getReclamationDetail(routeId);
      setReclamation(mapToReclamationItem(details));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
            : t("reclamations.failedToLoadDetails"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [getReclamationDetail, mapToReclamationItem, routeId]);

  useEffect(() => {
    void fetchDetails();
  }, [fetchDetails]);

  // ── Refresh ────────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    await fetchDetails();
  }, [fetchDetails]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0B1220]">
      {/* ── Header ── */}
      <View
        className="border-b border-slate-100 dark:border-slate-700"
        style={{
          paddingTop: Platform.OS === "ios" ? 8 : 20,
          paddingBottom: 12,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {/* Left: back button — fixed width so title can center */}
        <View style={{ width: 40 }}>
          <BackButton />
        </View>

        {/* Center: title */}
        <Text
          className="text-base font-semibold text-slate-800 dark:text-gray-50"
          style={{ flex: 1, textAlign: "center" }}
          numberOfLines={1}
        >
          {t("reclamations.detailTitle")}
        </Text>

        {/* Right: refresh button — fixed width to mirror left side */}
        <View style={{ width: 40, alignItems: "flex-end" }}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#64748b" />
          ) : (
            <RefreshButton onRefresh={handleRefresh} />
          )}
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {error ? (
          <View className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
            <Text className="text-xs text-red-600">{error}</Text>
          </View>
        ) : null}

        {/* Images */}
        {hasImages ? (
          <ImageCarousel images={images} />
        ) : (
          <View
            className="h-40 bg-slate-50 dark:bg-slate-800 items-center justify-center mx-4 mt-4 rounded-2xl border border-slate-200 dark:border-slate-700"
            style={{ borderStyle: "dashed" }}
          >
            <Text className="text-3xl mb-1">📋</Text>
            <Text className="text-xs text-slate-400 dark:text-slate-300">{t("reclamations.noAttachments")}</Text>
          </View>
        )}

        {/* Content */}
        <View className="px-5 pt-5 pb-10">
          {/* Status + Date */}
          <View className="flex-row items-center justify-between mb-4">
            <StatusBadge status={status} />
            <Text className="text-xs text-slate-400 dark:text-slate-400">
              {formatDate(createdAt)}
            </Text>
          </View>

          {/* Subject */}
          <Text className="text-xl font-bold text-slate-900 dark:text-gray-50 mb-3">
            {subject}
          </Text>

          {/* Divider */}
          <View className="h-px bg-slate-100 dark:bg-slate-700 mb-4" />

          {(reclamation.type || reclamation.driverName || vehicleContext) ? (
            <View className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              {reclamation.type ? (
                <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                  {t(`reclamations.types.${reclamation.type}`, { defaultValue: String(reclamation.type).replace(/_/g, " ") })}
                </Text>
              ) : null}
              {reclamation.driverName ? (
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t("reclamations.driver")}: {reclamation.driverName}
                </Text>
              ) : null}
              {vehicleContext ? (
                <Text className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t("reclamations.vehicle")}: {vehicleContext}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Message */}
          <Text
            className="text-lg font-semibold text-slate-400 dark:text-slate-400 uppercase mb-2"
            style={{ letterSpacing: 1 }}
          >
            {t("reclamations.description")}
          </Text>
          <Text className="text-base text-slate-700 dark:text-slate-300 leading-6 ">{message}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Demo fallback ───────────────────────────────────────────────────────────

const DEMO: ReclamationItem = {
  id: "ab256860",
  subject: "Véhicule panne",
  message:
    "Véhicule essance — le véhicule s'est arrêté sur la route nationale 1 à cause d'une panne moteur. Intervention urgente requise.",
  status: "pending",
  images: [
    "https://res.cloudinary.com/dfggwowpb/image/upload/v1776344562/smartaxia/reclamations/nfs34xetniayqcejqgim.jpg",
    "https://res.cloudinary.com/dfggwowpb/image/upload/v1775477700/smartaxia/reclamations/crbbmxtbapk6c3bkvjil.jpg",
    "https://res.cloudinary.com/dfggwowpb/image/upload/v1775477700/smartaxia/reclamations/crbbmxtbapk6c3bkvjil.jpg",

  ],
  createdAt: "2026-04-16T13:02:42.195Z",
};

ReclamationDetailScreen.displayName = "ReclamationDetailScreen";
