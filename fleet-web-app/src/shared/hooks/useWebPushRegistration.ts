import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { api } from "../services/api";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function useWebPushRegistration() {
  const user = useSelector((state: RootState) => state.auth.user);
  const registeredFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      registeredFor.current = null;
      return;
    }
    if (registeredFor.current === String(user.id)) return;
    if (!VAPID_PUBLIC_KEY) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    registeredFor.current = String(user.id);

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          registeredFor.current = null;
          return;
        }

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        await api.post("/user/me/web-push-subscription", { subscription });
      } catch (err) {
        console.error("[WebPush] Registration failed:", err);
        registeredFor.current = null;
      }
    };

    void register();
  }, [user?.id]);
}
