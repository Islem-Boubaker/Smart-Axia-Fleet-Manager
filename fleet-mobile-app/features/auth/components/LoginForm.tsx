import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { G, Path } from "react-native-svg";
import type { LoginCredentials } from "../types/auth.types";

type LoginFormProps = {
  credentials: LoginCredentials;
  showPassword: boolean;
  isLoading: boolean;
  loadingProvider: "google" | "apple" | "email" | null;
  error: string | null;
  linkSent: boolean;
  showApple?: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onSubmit: () => void;
  onSendMagicLink: () => void;
  onLoginWithGoogle: () => void;
  onLoginWithApple: () => void;
  onForgotPassword: () => void;
};

export function LoginForm({
  credentials,
  showPassword,
  isLoading,
  loadingProvider,
  error,
  linkSent,
  showApple = Platform.OS === "ios",
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
  onLoginWithGoogle,
  onLoginWithApple,
  onForgotPassword,
}: LoginFormProps) {
  const commonShadow = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  };

  return (
    <>
      {/* Social Buttons Container */}
      <View className="flex-row justify-center gap-3.5">
        {/* Google Button */}
        <TouchableOpacity
          onPress={onLoginWithGoogle} // Fixed: was handleGoogle
          disabled={isLoading}
          className="flex-1 h-[54px] rounded-full flex-row border border-[#E4E2F0] bg-white items-center justify-center px-4"
          style={commonShadow}
        >
          {loadingProvider === "google" ? (
            <ActivityIndicator color="#4285F4" />
          ) : (
            <>
              <Svg width={20} height={20} viewBox="0 0 512 512">
                <Path
                  fill="#FBBB00"
                  d="M113.47,309.408L95.648,375.94l-65.139,1.378C11.042,341.211,0,299.9,0,256c0-42.451,10.324-82.483,28.624-117.732h0.014l57.992,10.632l25.404,57.644c-5.317,15.501-8.215,32.141-8.215,49.456C103.821,274.792,107.225,292.797,113.47,309.408z"
                />
                <Path
                  fill="#518EF8"
                  d="M507.527,208.176C510.467,223.662,512,239.655,512,256c0,18.328-1.927,36.206-5.598,53.451c-12.462,58.683-45.025,109.925-90.134,146.187l-0.014-0.014l-73.044-3.727l-10.338-64.535c29.932-17.554,53.324-45.025,65.646-77.911h-136.89V208.176h138.887L507.527,208.176z"
                />
                <Path
                  fill="#28B446"
                  d="M416.253,455.624l0.014,0.014C372.396,490.901,316.666,512,256,512c-97.491,0-182.252-54.491-225.491-134.681l82.961-67.91c21.619,57.698,77.278,98.771,142.53,98.771c28.047,0,54.323-7.582,76.87-20.818L416.253,455.624z"
                />
                <Path
                  fill="#F14336"
                  d="M419.404,58.936l-82.933,67.896c-23.335-14.586-50.919-23.012-80.471-23.012c-66.729,0-123.429,42.957-143.965,102.724l-83.397-68.276h-0.014C71.23,56.123,157.06,0,256,0C318.115,0,375.068,22.126,419.404,58.936z"
                />
              </Svg>
              <Text className="font-bold ml-2">Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Apple Button */}
        {showApple && (
          <TouchableOpacity
            onPress={onLoginWithApple} // Fixed: was handleApple
            disabled={isLoading}
            className="flex-1 h-[54px] rounded-full border border-[#E4E2F0] bg-white flex-row items-center justify-center px-4"
            style={commonShadow}
          >
            {loadingProvider === "apple" ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Svg width={20} height={20} viewBox="0 0 22.773 22.773">
                  <G>
                    <Path
                      fill="#1a1a1a"
                      d="M15.769,0c0.053,0,0.106,0,0.162,0c0.13,1.606-0.483,2.806-1.228,3.675c-0.731,0.863-1.732,1.7-3.351,1.573c-0.108-1.583,0.506-2.694,1.25-3.561C13.292,0.879,14.557,0.16,15.769,0z"
                    />
                    <Path
                      fill="#1a1a1a"
                      d="M20.67,16.716c0,0.016,0,0.03,0,0.045c-0.455,1.378-1.104,2.559-1.896,3.655c-0.723,0.995-1.609,2.334-3.191,2.334c-1.367,0-2.275-0.879-3.676-0.903c-1.482-0.024-2.297,0.735-3.652,0.926c-0.155,0-0.31,0-0.462,0c-0.995-0.144-1.798-0.932-2.383-1.642c-1.725-2.098-3.058-4.808-3.306-8.276c0-0.34,0-0.679,0-1.019c0.105-2.482,1.311-4.5,2.914-5.478c0.846-0.52,2.009-0.963,3.304-0.765c0.555,0.086,1.122,0.276,1.619,0.464c0.471,0.181,1.06,0.502,1.618,0.485c0.378-0.011,0.754-0.208,1.135-0.347c1.116-0.403,2.21-0.865,3.652-0.648c1.733,0.262,2.963,1.032,3.723,2.22c-1.466,0.933-2.625,2.339-2.427,4.74C17.818,14.688,19.086,15.964,20.67,16.716z"
                    />
                  </G>
                </Svg>
                <Text className="font-bold ml-2">Apple</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Divider */}
      <View className="flex-row items-center my-6 gap-3">
        <View className="flex-1 h-px bg-[#E4E2F0]" />
        <Text className="text-xs text-[#8E8BA8]">Or sign in with email</Text>
        <View className="flex-1 h-px bg-[#E4E2F0]" />
      </View>

      {/* Email Input */}
      <View>
        <Text className="text-xs font-bold text-[#1A1233] mb-2 tracking-wide uppercase">
          Email
        </Text>
        <TextInput
          className="bg-[#FAFAFA] border border-[#E4E2F0] rounded-2xl px-4 py-3.5 text-sm text-[#1A1233]"
          placeholder="example@gmail.com"
          placeholderTextColor="#BDB8D4"
          keyboardType="email-address"
          autoCapitalize="none"
          value={credentials.email}
          onChangeText={onEmailChange}
          editable={!isLoading}
        />
      </View>

      {/* Password Input */}
      <View className="mt-5">
        <Text className="text-xs font-bold text-[#1A1233] mb-2 tracking-wide uppercase">
          Password
        </Text>
        <View className="relative">
          <TextInput
            className="bg-[#FAFAFA] border border-[#E4E2F0] rounded-2xl px-4 py-3.5 text-sm text-[#1A1233] pr-12"
            placeholder="••••••••••••"
            placeholderTextColor="#BDB8D4"
            secureTextEntry={!showPassword}
            value={credentials.password}
            onChangeText={onPasswordChange}
            editable={!isLoading}
          />
          <TouchableOpacity
            className="absolute right-4 top-3.5"
            onPress={onTogglePassword}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#8E8BA8"
            />
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <Text className="text-red-500 text-xs font-medium">{error}</Text>
        </View>
      )}

      {/* Actions */}
      <View className="flex-row items-center justify-between mt-3">
        <TouchableOpacity onPress={onForgotPassword} disabled={isLoading}>
          <Text className="text-[12.5px] font-bold text-blue-600">
            Forgot Password?
          </Text>
        </TouchableOpacity>
      </View>

      

      {/* Submit Button */}
      <TouchableOpacity
        className="mt-6 rounded-2xl overflow-hidden"
        onPress={onSubmit}
        activeOpacity={0.85}
        disabled={isLoading}
      >
        <LinearGradient
          colors={["#3B82F6", "#1D4ED8"]} // Blue gradient: blue-500 to blue-700
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="py-4 items-center"
        >
          {loadingProvider === "email" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-[15px] font-bold tracking-wide">
              Sign In
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </>
  );
}
