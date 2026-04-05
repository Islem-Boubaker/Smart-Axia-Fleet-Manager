const COOKIE_KEYS = ['accessToken', 'refreshToken', 'session'] as const;

const cookieStore: Record<string, string> = {};

/**
 * Store cookies from server response in memory only.
 */
export const syncCookiesFromServer = async (
  cookies: Record<string, string>,
): Promise<void> => {
  for (const key of COOKIE_KEYS) {
    if (cookies[key]) {
      cookieStore[key] = cookies[key];
    }
  }
};

/**
 * Build Cookie header from in-memory cookies.
 * Called by axios request interceptor on every request.
 */
export const buildCookieHeader = async (): Promise<string> => {
  const parts: string[] = [];

  for (const key of COOKIE_KEYS) {
    const value = cookieStore[key];
    if (value) parts.push(`${key}=${value}`);
  }

  return parts.join('; ');
};

/**
 * Clear all stored cookies on logout.
 */
export const clearCookies = async (): Promise<void> => {
  for (const key of COOKIE_KEYS) {
    delete cookieStore[key];
  }
};