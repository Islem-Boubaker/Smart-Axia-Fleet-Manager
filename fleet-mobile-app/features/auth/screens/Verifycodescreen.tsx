import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthActions } from "../hooks/useAuth";

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string | string[] }>();
  const { sendEmailOtp, isLoading } = useAuthActions();
  const [sent, setSent] = useState(false);

  const emailValue = Array.isArray(email) ? email[0] : email ?? "example@email.com";

  const handleResend = async () => {
    if (!emailValue || !emailValue.includes("@")) {
      Alert.alert("Missing email", "Please go back and enter your email.");
      return;
    }

    try {
      await sendEmailOtp(emailValue);
      setSent(true);
    } catch (err: any) {
      Alert.alert("Resend failed", err?.message || "Please try again.");
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
        <TouchableOpacity
          className="flex-row items-center gap-2 self-start"
          onPress={() => router.back()}
        >
          <View
            className="w-9 h-9 rounded-xl bg-white items-center justify-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="arrow-back" size={18} color="#1A1233" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Icon & Title */}
      <View className="items-center px-7 mt-6">
        <View
          className="w-20 h-20 rounded-3xl items-center justify-center mb-5"
          style={{
            backgroundColor: "rgba(107,33,245,0.08)",
            borderWidth: 1.5,
            borderColor: "rgba(107,33,245,0.15)",
          }}
        >
          <Text style={{ fontSize: 36 }}>📩</Text>
        </View>

        <Text
          className="text-[26px] font-extrabold text-[#1A1233] tracking-tight text-center"
          style={{ fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" }}
        >
          Check Your Email
        </Text>
        <Text className="text-[13.5px] text-[#8E8BA8] mt-2 text-center leading-5">
          We sent you a magic link. Tap the link in your email to continue.
          {"\n"}
          <Text className="text-[#6B21F5] font-semibold">{emailValue}</Text>
        </Text>
      </View>

      {/* Resend */}
      <View className="flex-row justify-center mt-8">
        <Text className="text-[13px] text-[#8E8BA8]">{"Didn't receive it? "}</Text>
        <TouchableOpacity onPress={handleResend} disabled={isLoading}>
          <Text className="text-[13px] font-bold text-[#6B21F5]">
            Resend link
          </Text>
        </TouchableOpacity>
      </View>

      {sent ? (
        <View className="px-7 mt-4">
          <View
            className="rounded-2xl px-4 py-3.5"
            style={{
              backgroundColor: "rgba(107,33,245,0.07)",
              borderWidth: 1.5,
              borderColor: "rgba(107,33,245,0.18)",
            }}
          >
            <Text className="text-[13px] text-[#4F0DCC] font-semibold">
              Link resent. Check your inbox.
            </Text>
          </View>
        </View>
      ) : null}

      {/* Back to Sign In */}
      <View className="px-7 mt-10">
        <TouchableOpacity
          className="rounded-2xl overflow-hidden"
          activeOpacity={0.85}
          onPress={() => router.replace("/(auth)/login")}
        >
          <LinearGradient
            colors={["#6B21F5", "#8B45FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-4 items-center"
          >
            <Text className="text-white text-[15px] font-bold tracking-wide">
              Back to Sign In
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
