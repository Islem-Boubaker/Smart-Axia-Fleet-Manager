import { useState } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EnvelopeIcon } from "../components/ui/EnvelopeIcon";
import { Input } from "../components/ui/Input";
import { PrimaryButton } from "../../../shared/components/ui/PrimaryButton";
import { FooterLink } from "../components/FooterLink";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");

  const handleSendLink = () => {
    console.log("Sending reset link to:", email);
    // TODO: Call API to send password reset email
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-50 justify-center px-6">
      <View className="w-full bg-white rounded-3xl p-8 shadow-md">
        {/* Icon */}
        <View className="items-center mb-6">
          <EnvelopeIcon />
        </View>

        {/* Title */}
        <Text className="text-2xl font-bold text-slate-900 text-center mb-3">
          Forgot your password?
        </Text>

        {/* Description */}
        <Text className="text-sm text-slate-600 text-center leading-relaxed mb-8">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </Text>

        {/* Email Input */}
        <View className="mb-6">
          <Input
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Send Reset Link Button */}
        <View className="mb-5">
          <PrimaryButton
            label="Send Reset Link"
            onPress={handleSendLink}
            disabled={!email}
          />
        </View>

        {/* Footer Link */}
        <FooterLink />
      </View>
    </SafeAreaView>
  );
}