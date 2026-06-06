import webPush from "web-push";

const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL       = process.env.VAPID_EMAIL || "mailto:admin@axiafleet.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.warn("[WebPush] VAPID keys not configured — web push disabled.");
}

export const isWebPushConfigured = () => Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

export const getVapidPublicKey = () => VAPID_PUBLIC_KEY ?? null;

export const sendWebPush = async (subscriptionJson, payload) => {
  if (!isWebPushConfigured()) return;
  if (!subscriptionJson) return;

  try {
    const sub = typeof subscriptionJson === "string"
      ? JSON.parse(subscriptionJson)
      : subscriptionJson;
    await webPush.sendNotification(sub, JSON.stringify(payload));
  } catch (error) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription expired — caller should remove it from the DB.
      const err = new Error("WEB_PUSH_SUBSCRIPTION_EXPIRED");
      err.expired = true;
      throw err;
    }
    console.error("[WebPush] Send failed:", error.message);
  }
};
