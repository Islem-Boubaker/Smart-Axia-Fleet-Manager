import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthActions } from "../hooks/useAuth";
import BackButton from "@/shared/components/ui/BackButton";
import RefreshLockIcon from "../components/ui/RefreshLockIcon";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword, isLoading } = useAuthActions();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async () => {
    setErrorMsg("");
    if (!email.includes("@")) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      setErrorMsg(err?.message || "Could not send reset link.");
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-[#F4F3FB]"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle="dark-content" />

      {/* Back Button */}
      <View className="px-6 pt-14 pb-2">
        <BackButton/>
      </View>

      {/* Icon & Title */}
      <View className="items-center px-7 mt-8">
        <RefreshLockIcon/>
        <Text
          className="text-[26px] font-extrabold text-[#1A1233] tracking-tight text-center"
          style={{ fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" }}
        >
          Forgot Password?
        </Text>
        <Text className="text-[13.5px] text-[#8E8BA8] mt-2 text-center leading-5 px-4">
          No worries! Enter your email and we'll send you reset instructions.
        </Text>
      </View>

      {/* Form */}
      <View className="px-7 mt-10">
        {/* Email field */}
        <Text className="text-xs font-bold text-[#1A1233] mb-2 tracking-wide uppercase">
          Email Address
        </Text>
        <View className="relative">
          <TextInput
            className="bg-[#FAFAFA] border border-[#E4E2F0] rounded-2xl px-4 py-3.5 text-sm text-[#1A1233] pr-12"
            placeholder="example@gmail.com"
            placeholderTextColor="#BDB8D4"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setSent(false);
              setErrorMsg("");
            }}
            editable={!isLoading}
          />
          {email.length > 0 && (
            <View className="absolute right-4 top-3.5">
              <Ionicons
                name={email.includes("@") ? "checkmark-circle" : "close-circle"}
                size={20}
                color={email.includes("@") ? "#6B21F5" : "#F04E4E"}
              />
            </View>
          )}
        </View>

        {/* Success Banner */}
        {sent && (
          <View
            className="mt-4 rounded-2xl px-4 py-3.5 flex-row items-center gap-2"
            style={{
              backgroundColor: "rgba(107,33,245,0.07)",
              borderWidth: 1.5,
              borderColor: "rgba(107,33,245,0.18)",
            }}
          >
            <Text style={{ fontSize: 18 }}>📧</Text>
            <Text className="text-[13px] text-blue-500   font-semibold flex-1">
              Reset link sent! Check your inbox.
            </Text>
          </View>
        )}

        {errorMsg ? (
          <View className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            <Text className="text-red-500 text-xs font-medium">{errorMsg}</Text>
          </View>
        ) : null}

        {/* Submit Button */}
        <TouchableOpacity
          className="mt-6 rounded-2xl overflow-hidden"
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <LinearGradient
            colors={["#3B82F6", "#1D4ED8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-4 items-center"
          >
            <Text className="text-white text-[15px] font-bold tracking-wide">
              Send Reset Link
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Back to sign in */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-[13px] text-[#8E8BA8]">
            Remember your password?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text className="text-[13px] font-bold text-blue-500">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
