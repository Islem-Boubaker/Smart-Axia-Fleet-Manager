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

import { InputField } from "../components/ui/InputField";
import { FormCard } from "../components/ui/FormCard";
import { SubmitButton } from "../components/ui/SubmitButton";
import BackButton from "@/shared/components/ui/BackButton";
import { useProfile } from "../hooks/useProfile";

export default function EditProfileScreen() {
  const user = useSelector((state: any) => state.auth.user);
  const { updateProfile } = useProfile();

  const isSubmitting = useRef(false);
  const isMounted = useRef(true);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);

  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setEmail(user?.email || "");
    setAvatar(user?.avatar || null);
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
      Alert.alert("Permission needed", "Please allow access to your photo library.");
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
      setAvatar(result.assets[0].uri); // preview it locally immediately
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
        avatar, // pass the new local URI — your hook/API handles upload
      });
      if (isMounted.current) {
        Alert.alert("Success", "Profile updated successfully.");
      }
    } catch (error) {
      if (isMounted.current) {
        Alert.alert(
          "Update failed",
          error instanceof Error ? error.message : "Could not update profile.",
        );
      }
    } finally {
      isSubmitting.current = false;
      if (isMounted.current) setIsLoading(false);
    }
  }, [email, name, phone, avatar, updateProfile]);

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
    <SafeAreaView className="flex-1 bg-[#F5F7FA]">
      {/* Header */}
      <View
        className="flex-row items-center mt-10 px-4 pb-4"
        style={{ paddingTop: Platform.OS === "ios" ? 8 : 0 }}
      >
        <BackButton />
        <Text className="flex-1 text-center text-lg font-bold text-gray-900">
          Edit Profile
        </Text>
      </View>

      {/* Avatar */}
      <View className="items-center mt-4">
        <View className="relative">
          {avatar ? (
            <Image source={{ uri: avatar }} className="w-28 h-28 rounded-full" />
          ) : (
            <View className="w-28 h-28 rounded-full bg-blue-100 border-2 border-blue-400 items-center justify-center">
              <Text className="text-blue-600 text-xl font-bold">
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
        <InputField label="Name" value={name} onChangeText={setName} />

        <View className="mb-4">
          <Text className="text-gray-500 text-xs mb-1">Phone Number</Text>
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
            <Text className="flex-1 text-gray-900">{phone}</Text>
            <TouchableOpacity onPress={() => console.log("change phone")}>
              <Text className="text-gray-500 font-medium">Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        <InputField label="Email" value={email} onChangeText={setEmail} />
      </FormCard>

      <SubmitButton
        label={isLoading ? "Updating..." : "Update"}
        onPress={handleSubmit}
        disabled={isLoading}
        loading={isLoading}
      />
    </SafeAreaView>
  );
}