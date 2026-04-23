import { api } from "@/shared/services/api";
import { resolveApiBaseUrl } from "@/shared/utils/apiBase";

export interface NetworkDiagnostics {
  apiUrl: string;
  isBackendReachable: boolean;
  loginEndpointExists: boolean;
  corsEnabled: boolean;
  errorMessage?: string;
  statusCode?: number;
}

/**
 * Test network connectivity and log all details
 * Call this from LoginScreen to debug connection issues
 */
export async function testNetworkConnection(): Promise<NetworkDiagnostics> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ;
  const resolvedUrl = resolveApiBaseUrl(apiUrl);
  console.log("🔍 Network Test Starting...");
  console.log("API URL from env:", process.env.EXPO_PUBLIC_API_URL);
  console.log("Using API URL:", resolvedUrl);

  const diagnostics: NetworkDiagnostics = {
    apiUrl: resolvedUrl || "NOT_CONFIGURED",
    isBackendReachable: false,
    loginEndpointExists: false,
    corsEnabled: false,
  };

  if (!resolvedUrl) {
    console.error("❌ API_URL not configured!");
    diagnostics.errorMessage = "API_URL not configured in .env";
    return diagnostics;
  }

  try {
    // Test 1: Check if baseURL is set in axios instance
    if (!api.defaults.baseURL) {
      console.warn("⚠️ WARNING: axios baseURL is undefined!");
      console.warn("This usually means .env wasn't loaded by Expo");
      console.warn("Try: npx expo start --clear");
      diagnostics.errorMessage = "Axios baseURL undefined - Try restarting with: npx expo start --clear";
      return diagnostics;
    }

    console.log("✅ Axios baseURL configured:", api.defaults.baseURL);

    // Test 2: Check if backend responds at all
    console.log("📡 Testing backend reachability...");

    try {
      const headResponse = await fetch(`${resolvedUrl}/user/login`, {
        method: "OPTIONS",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Backend is reachable!");
      diagnostics.isBackendReachable = true;

      // Test 3: Check CORS headers
      const corsHeader = headResponse.headers.get("access-control-allow-origin");
      const corsCredentials = headResponse.headers.get("access-control-allow-credentials");
      console.log("CORS Headers:", { corsHeader, corsCredentials });

      if (corsHeader && corsCredentials === "true") {
        diagnostics.corsEnabled = true;
        console.log("✅ CORS is properly configured!");
      } else {
        console.warn("⚠️ CORS might not be properly configured.");
      }
    } catch (fetchError: any) {
      console.error("❌ Backend not reachable:", fetchError.message);
      diagnostics.errorMessage = `Backend connection failed: ${fetchError.message}`;
      return diagnostics;
    }

    // Test 4: Try actual login endpoint (won't authenticate, just check it exists)
    console.log("🔐 Testing login endpoint...");
    try {
      const loginResponse = await api.post("/user/login", {
        email: "test@test.com",
        password: "test",
      }).catch((error) => {
        // We expect this to fail auth-wise, but endpoint should exist
        return error.response || null;
      });

      if (loginResponse) {
        diagnostics.loginEndpointExists = true;
        diagnostics.statusCode = loginResponse.status;
        console.log("✅ Login endpoint exists! Status:", loginResponse.status);
      } else {
        console.error("❌ Login endpoint not found or no response");
      }
    } catch (apiError: any) {
      console.error("⚠️ Login endpoint test error:", apiError.message);
      diagnostics.loginEndpointExists = false;
    }

    console.log("✅ Network diagnostics complete!");
    return diagnostics;
  } catch (error: any) {
    console.error("❌ Network test failed:", error.message);
    diagnostics.errorMessage = error.message;
    return diagnostics;
  }
}

/**
 * Log detailed error information for debugging
 */
export function logLoginError(error: any): void {
  try {
    const resolvedUrl = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);
    console.error("🔴 LOGIN ERROR DETAILS:");
    console.error("Error message:", error?.message || String(error));
    console.error("Error code:", error?.code);
    console.error("Response status:", error?.response?.status);
    console.error("Response data:", JSON.stringify(error?.response?.data, null, 2));
    console.error("Request config:", {
      baseURL: error?.config?.baseURL,
      url: error?.config?.url,
      method: error?.config?.method,
    });

    if (error?.code === "ECONNREFUSED" || error?.code === "NETWORK_ERROR") {
      console.error(
        "⚠️ Connection refused - Backend might not be running at",
        resolvedUrl || 'http://192.168.1.15:3000'
      );
    }

    if (error?.message === "Network Error" && !error?.response) {
      console.error(
        "⚠️ Generic Network Error - likely backend not reachable"
      );
      console.error(
        "💡 Solution: Make sure backend is running and check IP address"
      );
    }
  } catch (loggingError) {
    console.error("Failed to log error details:", String(loggingError));
  }
}
