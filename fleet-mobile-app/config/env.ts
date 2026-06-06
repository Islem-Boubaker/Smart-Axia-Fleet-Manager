import { DEPLOYED_API_BASE_URL } from "@/shared/utils/apiBase";

export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || DEPLOYED_API_BASE_URL,
  APP_NAME: 'Smart Axia Fleet Manager',
};
