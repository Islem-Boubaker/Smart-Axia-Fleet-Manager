// ─── FormInput ────────────────────────────────────────────────────────────────
// Reusable controlled text input with label, error state, and multiline support.

import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface FormInputProps extends Omit<TextInputProps, 'onChangeText'> {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  placeholder?: string;
  required?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChangeText,
  error,
  multiline = false,
  numberOfLines = 1,
  placeholder,
  required = false,
  ...rest
}) => {
  const hasError = Boolean(error);

  return (
    <View className="mb-5">
      {/* Label */}
      <View className="flex-row mb-2">
        <Text className="text-sm font-semibold text-gray-700 tracking-wide">
          {label}
        </Text>
        {required && (
          <Text className="text-rose-500 ml-1 text-sm font-bold">*</Text>
        )}
      </View>

      {/* Input container */}
      <View
        className={`rounded-2xl border px-4 py-1 bg-white shadow-sm ${
          hasError
            ? 'border-rose-400 bg-rose-50'
            : 'border-gray-200 focus:border-rose-400'
        }`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
          className={`text-gray-800 text-sm font-medium ${
            multiline ? 'min-h-[120px] py-3' : 'py-3'
          }`}
          style={{ fontFamily: 'System' }}
          {...rest}
        />
      </View>

      {/* Error message */}
      {hasError && (
        <View className="flex-row items-center mt-1.5 ml-1">
          <Text className="text-rose-500 text-xs font-medium">⚠ {error}</Text>
        </View>
      )}
    </View>
  );
};