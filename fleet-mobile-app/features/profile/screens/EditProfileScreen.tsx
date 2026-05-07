import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from "react-native";
import { Camera } from "lucide-react-native";
import { useSelector } from "react-redux";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";

import { InputField } from "../components/ui/InputField";
import { FormCard } from "../components/ui/FormCard";
import { SubmitButton } from "../components/ui/SubmitButton";
import BackButton from "@/shared/components/ui/BackButton";
import { useProfile } from "../hooks/useProfile";

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const user = useSelector((state: any) => state.auth.user);
  const { updateProfile, updateAvatar } = useProfile();

  const isSubmitting = useRef(false);
  const isMounted = useRef(true);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
  const [selectedAvatarUri, setSelectedAvatarUri] = useState<string | null>(null);

  const isLocalAvatarUri = (value: string) =>
    value.startsWith("file://") || value.startsWith("content://");

  const getFileNameFromUri = (uri: string) => {
    const parts = uri.split("/");
    const lastPart = parts[parts.length - 1];
    return lastPart && lastPart.trim() ? lastPart : `avatar-${Date.now()}.jpg`;
  };

  const getMimeTypeFromFileName = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (extension === "png") return "image/png";
    if (extension === "webp") return "image/webp";
    return "image/jpeg";
  };

  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setEmail(user?.email || "");
    setAvatar(user?.avatar || null);
    setSelectedAvatarUri(null);
  }, [user]);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ─── Image Picker ───────────────────────────────────────────────
  const handlePickImage = useCallback(async () => {
    // 1. Ask permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("editProfile.permissionNeeded"), t("editProfile.permissionMessage"));
      return;
    }

    // 2. Open picker (no compression or size issues)
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,   // lets user crop to a square
      aspect: [1, 1],        // square crop like most profile pics
      quality: 0.7,          // compress a bit to keep upload fast
    });

    // 3. User picked an image (not cancelled)
    if (!result.canceled && result.assets.length > 0) {
      const pickedUri = result.assets[0].uri;
      setAvatar(pickedUri);
      setSelectedAvatarUri(pickedUri);
    }
  }, []);
  // ────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    if (isMounted.current) setIsLoading(true);

    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });

      if (selectedAvatarUri && isLocalAvatarUri(selectedAvatarUri)) {
        const fileName = getFileNameFromUri(selectedAvatarUri);
        const mimeType = getMimeTypeFromFileName(fileName);
        const formData = new FormData();

        formData.append("avatar", {
          uri: selectedAvatarUri,
          name: fileName,
          type: mimeType,
        } as any);

        await updateAvatar(formData);
      }

      if (isMounted.current) {
        Alert.alert(t("editProfile.success"), t("editProfile.profileUpdated"));
      }
    } catch (error) {
      if (isMounted.current) {
        Alert.alert(
          t("editProfile.updateFailed"),
          error instanceof Error ? error.message : t("editProfile.couldNotUpdate"),
        );
      }
    } finally {
      isSubmitting.current = false;
      if (isMounted.current) setIsLoading(false);
    }
  }, [email, name, phone, selectedAvatarUri, updateAvatar, updateProfile]);

  // ─── Avatar block (shared between both branches) ────────────────
  const AvatarSection = (
    <TouchableOpacity
      onPress={handlePickImage}
      className="absolute bottom-1 right-1 bg-gray-500 p-2 rounded-full"
    >
      <Camera size={16} color="#fff" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA] dark:bg-[#0B1220]">
      {/* Header */}
      <View
        className="flex-row items-center mt-10 px-4 pb-4"
        style={{ paddingTop: Platform.OS === "ios" ? 8 : 0 }}
      >
        <BackButton />
        <Text className="flex-1 text-center text-lg font-bold text-gray-900 dark:text-gray-50">
          {t("editProfile.title")}
        </Text>
      </View>

      {/* Avatar */}
      <View className="items-center mt-4">
        <View className="relative">
          {avatar ? (
            <Image source={{ uri: avatar }} className="w-28 h-28 rounded-full" />
          ) : (
            <View className="w-28 h-28 rounded-full bg-blue-100 border-2 border-blue-400 items-center justify-center dark:bg-blue-950/60 dark:border-blue-500">
              <Text className="text-blue-600 text-xl font-bold dark:text-blue-300">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </Text>
            </View>
          )}
          {/* Camera button — same for both cases */}
          {AvatarSection}
        </View>
      </View>

      {/* Form */}
      <FormCard>
        <InputField label={t("editProfile.name")} value={name} onChangeText={setName} />

        <View className="mb-4">
          <Text className="text-gray-500 text-xs mb-1 dark:text-slate-400">{t("editProfile.phoneNumber")}</Text>
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 dark:bg-slate-800">
            <Text className="flex-1 text-gray-900 dark:text-gray-100">{phone}</Text>
            <TouchableOpacity onPress={() => console.log("change phone")}>
              <Text className="text-gray-500 font-medium dark:text-slate-300">{t("editProfile.change")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <InputField label={t("editProfile.email")} value={email} onChangeText={setEmail} />
      </FormCard>

      <SubmitButton
        label={isLoading ? t("editProfile.updating") : t("editProfile.update")}
        onPress={handleSubmit}
        disabled={isLoading}
        loading={isLoading}
      />
    </SafeAreaView>
  );
}
