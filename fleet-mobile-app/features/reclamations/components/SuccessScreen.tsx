// ─── SuccessScreen ────────────────────────────────────────────────────────────
// Shown after successful submission.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

interface SuccessScreenProps {
  onReset: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ onReset }) => {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center px-8">
      {/* Icon */}
      <View
        className="w-24 h-24 rounded-full bg-rose-50 items-center justify-center mb-6"
        style={{
          shadowColor: '#F43F5E',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <Text style={{ fontSize: 44 }}>✅</Text>
      </View>

      <Text className="text-2xl font-bold text-gray-800 mb-2 text-center">
        {t("reclamations.success.title")}
      </Text>
      <Text className="text-sm text-gray-500 text-center leading-relaxed mb-8">
        {t("reclamations.success.message")}
      </Text>

      {/* Decorative reference */}
      <View className="bg-gray-50 rounded-2xl px-6 py-4 mb-8 border border-gray-100 w-full">
        <Text className="text-xs text-gray-400 text-center mb-1">{t("reclamations.success.referenceId")}</Text>
        <Text className="text-base font-bold text-blue-500 text-center tracking-widest">
          RCL-{Date.now().toString().slice(-6)}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onReset}
        className="w-full bg-blue-500 rounded-2xl py-4 items-center"
        style={{
          shadowColor: '#F43F5E',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <Text className="text-white font-bold text-base">{t("reclamations.success.submitAnother")}</Text>
      </TouchableOpacity>
    </View>
  );
};
