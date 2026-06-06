import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from "react-native";
import * as Updates from "expo-updates";
import { useTranslation } from "react-i18next";

type UpdateState = "idle" | "available" | "downloading" | "failed";

export function RequiredUpdateGate() {
  const { t } = useTranslation();
  const [state, setState] = useState<UpdateState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    let cancelled = false;

    async function checkForRequiredUpdate() {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (!cancelled && (result.isAvailable || result.isRollBackToEmbedded)) {
          setState("available");
        }
      } catch (err) {
        console.warn("[updates] update check failed", err);
      }
    }

    void checkForRequiredUpdate();

    return () => {
      cancelled = true;
    };
  }, []);

  const applyUpdate = useCallback(async () => {
    setState("downloading");
    setError(null);

    try {
      const result = await Updates.fetchUpdateAsync();
      if (result.isNew || result.isRollBackToEmbedded) {
        await Updates.reloadAsync();
        return;
      }

      setState("idle");
    } catch (err) {
      console.warn("[updates] update download failed", err);
      setError(t("updates.failed"));
      setState("failed");
    }
  }, [t]);

  const visible = state === "available" || state === "downloading" || state === "failed";
  const isDownloading = state === "downloading";

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/80 px-6">
        <View className="w-full max-w-[360px] rounded-2xl border border-slate-700 bg-slate-950 p-6">
          <Text className="text-xl font-extrabold text-white">{t("updates.title")}</Text>
          <Text className="mt-3 text-sm leading-5 text-slate-300">{t("updates.message")}</Text>

          {error ? <Text className="mt-3 text-sm font-semibold text-red-400">{error}</Text> : null}

          <TouchableOpacity
            disabled={isDownloading}
            onPress={applyUpdate}
            className="mt-6 h-12 items-center justify-center rounded-xl bg-blue-600"
            activeOpacity={0.8}
          >
            {isDownloading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="font-bold text-white">{t("updates.confirm")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
