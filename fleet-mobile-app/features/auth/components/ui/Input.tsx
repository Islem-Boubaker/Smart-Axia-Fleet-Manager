import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  TextInputProps,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface InputProps extends TextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  editable?: boolean;
  isPassword?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  editable = true,
  isPassword = false,
  icon = "email",
  keyboardType,
  autoCapitalize,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const iconName = isPassword ? "lock" : icon;
  const secureTextEntry = isPassword && !showPassword;

  return (
    <View className="">
      {label && (
        <Text className="text-base font-semibold text-slate-900 mb-2.5">
          {label}
        </Text>
      )}

      <View className="flex-row items-center bg-slate-100 border border-slate-300 rounded-xl px-4 h-14">
        <MaterialCommunityIcons
          name={iconName}
          size={20}
          color="#94A3B8"
          style={{ marginRight: 12 }}
        />

        <TextInput
          className="flex-1 text-base text-slate-900"
          placeholder={placeholder}
          placeholderTextColor="#CBD5E1"
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="p-2"
            activeOpacity={0.6}
          >
            <MaterialCommunityIcons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color="#94A3B8"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
