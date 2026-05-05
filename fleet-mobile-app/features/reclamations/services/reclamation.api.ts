import { api } from "@/shared/services/api";
import { tokenStorage } from "@/features/auth/services/tokenStorage";
import { getCsrfToken } from "@/shared/services/csrf";
import { resolveApiBaseUrl } from "@/shared/utils/apiBase";
import type {
    CreateReclamationData,
    Reclamation,
    ReclamationDetails,
    UpdateReclamationData,
} from "../types/reclamation.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

type AxiosLikeError = {
  code?: string;
  message?: string;
};

/**
 * Reclamation (complaint/issue reporting) API service
 */
export const reclamationApi = {
  /**
   * Fetch all reclamations for the current driver
   */
  getAllReclamations: async (): Promise<Reclamation[]> => {
    const response =
      await api.get<ApiResponse<Reclamation[]>>("/my/reclamations");
    return response.data.data;
  },

  /**
   * Fetch details of a specific reclamation
   */
  getReclamationDetail: async (
    reclamationId: string,
  ): Promise<ReclamationDetails> => {
    const response = await api.get<ApiResponse<ReclamationDetails>>(
      `/my/reclamations/${reclamationId}`,
    );
    return response.data.data;
  },

  /**
   * Create a new reclamation (complaint)
   */
  createReclamation: async (
    data: CreateReclamationData,
  ): Promise<Reclamation> => {
    const hasImages = Boolean(data.images && data.images.length > 0);
    const endpoint = data.vehicleId || hasImages ? "/reclamations/vehicle" : "/reclamations";
    const contextPayload = {
      ...(data.type ? { type: data.type } : {}),
      ...(data.vehicleId ? { vehicleId: data.vehicleId } : {}),
      ...(data.vehicleName ? { vehicleName: data.vehicleName } : {}),
      ...(data.vehiclePlate ? { vehiclePlate: data.vehiclePlate } : {}),
      ...(data.driverName ? { driverName: data.driverName } : {}),
      ...(data.tripId ? { tripId: data.tripId } : {}),
      ...(data.reclamationTypeLabel ? { reclamationTypeLabel: data.reclamationTypeLabel } : {}),
      ...(data.metadata ? { metadata: data.metadata } : {}),
    };

    console.log("📝 Creating reclamation:", {
      subject: data.subject,
      message: data.message,
      type: data.type,
      vehicleId: data.vehicleId,
      imageCount: data.images?.length || 0,
      endpoint,
      hasImages,
    });

    if (!hasImages) {
      const payload = {
        subject: data.subject,
        message: data.message,
        ...contextPayload,
      };
      console.log("📤 Sending JSON payload:", payload);
      const response = await api.post<ApiResponse<Reclamation>>(endpoint, payload);
      return response.data.data;
    }

    const formData = new FormData();
    formData.append("subject", data.subject);
    formData.append("message", data.message);
    Object.entries(contextPayload).forEach(([key, value]) => {
      formData.append(
        key,
        typeof value === "object" ? JSON.stringify(value) : String(value),
      );
    });

    data.images?.forEach((img, index) => {
      console.log(`📷 Adding image ${index}:`, {
        uri: img.uri,
        type: img.type ?? "image/jpeg",
        name: img.name ?? `photo_${index}.jpg`,
      });
      formData.append(
        "images",
        {
          uri: img.uri,
          type: img.type ?? "image/jpeg",
          name: img.name ?? `photo_${index}.jpg`,
        } as any,
      );
    });

    console.log("📤 Sending FormData with", data.images?.length || 0, "images to", endpoint);
    try {
      // ✅ Let axios auto-detect FormData and set proper Content-Type with boundary
      const response = await api.post<ApiResponse<Reclamation>>(endpoint, formData);
      console.log("✅ Reclamation created successfully:", response.data.data);
      return response.data.data;
    } catch (error) {
      const axErr = error as AxiosLikeError;
      const isNetworkError = axErr?.code === "ERR_NETWORK" || axErr?.message === "Network Error";

      console.error("❌ FormData submission failed:", {
        error: error instanceof Error ? error.message : String(error),
        endpoint,
        hasImages: true,
        isNetworkError,
      });

      // React Native + axios may fail on multipart uploads on some Android devices.
      // Retry with fetch using the same FormData and auth headers.
      if (!isNetworkError) {
        throw error;
      }

      const baseUrl = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);
      const accessToken = await tokenStorage.getAccessToken();
      const csrfToken = getCsrfToken();

      const headers: Record<string, string> = {};
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
      if (csrfToken) headers["x-csrf-token"] = csrfToken;

      console.log("🔁 Retrying multipart upload via fetch", {
        url: `${baseUrl}${endpoint}`,
        hasAuth: Boolean(accessToken),
        hasCsrf: Boolean(csrfToken),
      });

      const fetchResponse = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers,
        body: formData,
      });

      const text = await fetchResponse.text();
      let parsed: ApiResponse<Reclamation> | null = null;
      try {
        parsed = text ? (JSON.parse(text) as ApiResponse<Reclamation>) : null;
      } catch {
        parsed = null;
      }

      if (!fetchResponse.ok || !parsed?.data) {
        throw new Error(
          parsed && "success" in parsed
            ? `Upload failed (${fetchResponse.status})`
            : `Upload failed (${fetchResponse.status}): ${text || "No response body"}`,
        );
      }

      console.log("✅ Reclamation created successfully via fetch fallback:", parsed.data);
      return parsed.data;
    }
  },

  /**
   * Update owned reclamation
   */
  updateReclamation: async (
    reclamationId: string,
    updates: UpdateReclamationData,
  ): Promise<Reclamation> => {
    const response = await api.put<ApiResponse<Reclamation>>(
      `/my/reclamations/${reclamationId}`,
      updates,
    );
    return response.data.data;
  },

  deleteReclamation: async (reclamationId: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/my/reclamations/${reclamationId}`);
  },

  uploadAttachments: async (
    reclamationId: string,
    images: File[],
  ): Promise<ReclamationDetails> => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append("images", image);
    });

    const response = await api.put<ApiResponse<ReclamationDetails>>(
      `/${reclamationId}/attachments`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data.data;
  },
};
