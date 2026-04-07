// import { useState } from "react";
// import { View, Text } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { EnvelopeIcon } from "../components/ui/EnvelopeIcon";
// import { Input } from "../components/ui/Input";
// import { PrimaryButton } from "@/shared/components/ui/PrimaryButton";
// import { FooterLink } from "../components/FooterLink";

// export function ForgotPasswordScreen() {
//   const [email, setEmail] = useState("");

//   const handleSendLink = () => {
//     console.log("Sending reset link to:", email);
//   };

//   return (
//     <SafeAreaView className="flex-1 bg-blue-50 justify-center px-6">
//       <View className="w-full bg-white rounded-3xl p-8 shadow-md">
//         <View className="items-center mb-6">
//           <EnvelopeIcon />
//         </View>

//         <Text className="text-2xl font-bold text-slate-900 text-center mb-3">
//           Forgot your password?
//         </Text>

//         <Text className="text-sm text-slate-600 text-center leading-relaxed mb-8">
//           Enter your email address and we&apos;ll send you a link to reset your
//           password.
//         </Text>

//         <View className="mb-6">
//           <Input
//             label="Email Address"
//             placeholder="name@example.com"
//             value={email}
//             onChangeText={setEmail}
//             keyboardType="email-address"
//             autoCapitalize="none"
//           />
//         </View>

//         <View className="mb-5">
//           <PrimaryButton
//             label="Send Reset Link"
//             onPress={handleSendLink}
//             disabled={!email}
//           />
//         </View>

//         <FooterLink />
//       </View>
//     </SafeAreaView>
//   );
// }

// export default ForgotPasswordScreen;


import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthActions } from '../hooks/useAuth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword, isLoading } = useAuthActions();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not send reset link.');
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
          className="self-start"
          onPress={() => router.back()}
        >
          <View
            className="w-9 h-9 rounded-xl bg-white items-center justify-center"
            style={{
              shadowColor: '#000',
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
      <View className="items-center px-7 mt-8">
        <View
          className="w-20 h-20 rounded-3xl items-center justify-center mb-5"
          style={{
            backgroundColor: 'rgba(107,33,245,0.08)',
            borderWidth: 1.5,
            borderColor: 'rgba(107,33,245,0.15)',
          }}
        >
          <Text style={{ fontSize: 34 }}>🔐</Text>
        </View>

        <Text
          className="text-[26px] font-extrabold text-[#1A1233] tracking-tight text-center"
          style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}
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
            onChangeText={(t) => { setEmail(t); setSent(false); setErrorMsg(''); }}
            editable={!isLoading}
          />
          {email.length > 0 && (
            <View className="absolute right-4 top-3.5">
              <Ionicons
                name={email.includes('@') ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={email.includes('@') ? '#6B21F5' : '#F04E4E'}
              />
            </View>
          )}
        </View>

        {/* Success Banner */}
        {sent && (
          <View
            className="mt-4 rounded-2xl px-4 py-3.5 flex-row items-center gap-2"
            style={{
              backgroundColor: 'rgba(107,33,245,0.07)',
              borderWidth: 1.5,
              borderColor: 'rgba(107,33,245,0.18)',
            }}
          >
            <Text style={{ fontSize: 18 }}>📧</Text>
            <Text className="text-[13px] text-[#4F0DCC] font-semibold flex-1">
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
            colors={['#6B21F5', '#8B45FF']}
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
            Remember your password?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text className="text-[13px] font-bold text-[#6B21F5]">
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}