import axios from 'axios';
import { buildCookieHeader, syncCookiesFromServer } from './cookieJar';
import { getCsrfToken } from './csrf';
import { resolveApiBaseUrl } from '../utils/apiBase';

const apiUrl = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);

if (!apiUrl) {
  console.warn('⚠️ WARNING: EXPO_PUBLIC_API_URL not configured! Using localhost fallback.');
}

console.log('🔧 Initializing API with baseURL:', apiUrl);

export const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  timeout: 10000,
});



api.interceptors.request.use(async (config) => {
  const headers = config.headers ?? {};
  const cookie = await buildCookieHeader();
  if (cookie) headers['Cookie'] = cookie;
  const csrfToken = getCsrfToken();
  if (csrfToken) headers['x-csrf-token'] = csrfToken;
  config.headers = headers;
  return config;
});


api.interceptors.response.use(async (response) => {
 
  const setCookieHeader = response.headers['set-cookie'];
  if (setCookieHeader) {
    const cookies = parseCookiesFromHeader(setCookieHeader);
    await syncCookiesFromServer(cookies);
  }
  return response;
});


function parseCookiesFromHeader(setCookieHeader: string | string[]): Record<string, string> {
  const cookies: Record<string, string> = {};
  const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

  for (const header of headers) {
    const [cookiePair] = header.split(';'); 
    const [name, value] = cookiePair.trim().split('=');
    if (name && value) {
      cookies[name.trim()] = decodeURIComponent(value.trim());
    }
  }

  return cookies;
}