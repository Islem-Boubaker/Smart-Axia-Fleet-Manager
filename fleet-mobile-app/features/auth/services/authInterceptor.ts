import type { AxiosInstance } from "axios";
import { tokenStorage } from "./tokenStorage";

/**
 * Optional per-client auth interceptor.
 * Use for secondary Axios instances created outside shared/services/api.ts.
 */
export const setupAuthInterceptors = (client: AxiosInstance): void => {
  client.interceptors.request.use(async (config) => {
    const headers = config.headers ?? {};
    const accessToken = await tokenStorage.getAccessToken();

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    config.headers = headers;
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Refresh token flow can be added here when backend contract is ready.
      return Promise.reject(error);
    },
  );
};
