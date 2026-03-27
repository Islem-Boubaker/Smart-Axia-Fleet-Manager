import axios from 'axios';
import { buildCookieHeader, syncCookiesFromServer } from './cookieJar';

const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

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
  const cookie = await buildCookieHeader();
  if (cookie) config.headers['Cookie'] = cookie;
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