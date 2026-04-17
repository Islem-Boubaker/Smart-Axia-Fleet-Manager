import React, { useState } from "react";
import { Alert, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { InputField } from "../components/ui/InputField";
import { FormCard } from "../components/ui/FormCard";
import { SubmitButton } from "../components/ui/SubmitButton";
import { useProfile } from "../hooks/useProfile";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { changePassword, isSaving } = useProfile();

  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = async () => {
    if (!current || !newPwd) {
      Alert.alert("Validation", "Please fill all password fields.");
      return;
    }

    if (newPwd !== confirm) {
      Alert.alert("Validation", "New password and confirmation do not match.");
      return;
    }

    try {
      await changePassword({ currentPassword: current, newPassword: newPwd });
      setCurrent("");
      setNewPwd("");
      setConfirm("");
      Alert.alert("Success", "Password changed successfully.");
    } catch (error) {
      Alert.alert(
        "Update failed",
        error instanceof Error ? error.message : "Could not change password.",
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA]">
      {/* Header */}
      <View className="flex-row items-center mt-10 px-4 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-gray-900">
          Change Password
        </Text>
      </View>

      <FormCard>
        <InputField
          label="Current Password"
          value={current}
          onChangeText={setCurrent}
          secureTextEntry
        />
        <InputField
          label="New Password"
          value={newPwd}
          onChangeText={setNewPwd}
          secureTextEntry
        />
        <InputField
          label="Confirm Password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />
      </FormCard>

      <SubmitButton
        label={isSaving ? "Updating..." : "Update Password"}
        onPress={handleSubmit}
        disabled={isSaving}
      />
    </SafeAreaView>
  );
}
