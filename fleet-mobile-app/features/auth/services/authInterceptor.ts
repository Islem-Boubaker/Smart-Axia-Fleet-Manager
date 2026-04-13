/**
 * Legacy auth interceptor entrypoint.
 *
 * Request auth, cookie sync, CSRF headers, and bearer token injection are now
 * centralized in shared/services/api.ts to keep all features consistent.
 */
export const setupAuthInterceptors = (): void => {
  // Intentionally left blank.
};
