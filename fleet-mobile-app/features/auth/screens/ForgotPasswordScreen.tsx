import { useState } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LockIcon } from "../components/ui/LockIcon";
import { Input } from "../components/ui/Input";
import { PrimaryButton } from "../../../shared/components/ui/PrimaryButton";
import { FooterLink } from "../components/FooterLink";

export default function ForgotPasswordScreen() {

  const [email, setEmail] = useState("");

  const handleSendLink = () => {
    console.log("Sending reset link to:", email);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 items-center justify-center px-4">

      <View className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-8 items-center">

        <LockIcon />

        <Text className="text-xl font-medium text-gray-900 mb-2 text-center">
          Forgot your password?
        </Text>

        <Text className="text-sm text-gray-500 text-center leading-relaxed mb-7">
          Enter your email and we&apos;ll send you a reset link.
        </Text>

        <Input
          label="Email Address"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <PrimaryButton
          label="Send Reset Link"
          onPress={handleSendLink}
        />

        <FooterLink />

      </View>

    </SafeAreaView>
  );
}