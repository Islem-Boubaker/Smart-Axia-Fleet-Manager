// ─── StepIndicator ────────────────────────────────────────────────────────────
// Displays the multi-step progress header matching the screenshot design.

import React from 'react';
import { View, Text } from 'react-native';
import type { ReclamationStep } from '../types/reclamation.types';

interface StepItem {
  key: ReclamationStep;
  label: string;
}

interface StepIndicatorProps {
  steps: ReclamationStep[];
  currentStep: number;
}

const STEP_LABELS: Record<ReclamationStep, string> = {
  SUBJECT: 'SUBJECT',
  PROBLEM: 'PROBLEM',
  YOUR_DATA: 'YOUR DATA',
  SEND: 'SEND',
};

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
  return (
    <View className="flex-row items-center justify-between px-2 py-4">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step}>
            {/* Step dot + label */}
            <View className="items-center">
              {/* Dot */}
              <View
                className={`w-7 h-7 rounded-full items-center justify-center ${
                  isCompleted
                    ? 'bg-blue-500'
                    : isActive
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
                }`}
              >
                {isCompleted ? (
                  <Text className="text-white text-xs font-bold">✓</Text>
                ) : (
                  <View
                    className={`w-2.5 h-2.5 rounded-full ${
                      isActive ? 'bg-white' : 'bg-gray-400'
                    }`}
                  />
                )}
              </View>

              {/* Label */}
              <Text
                className={`text-[9px] mt-1 font-semibold tracking-wider ${
                  isActive ? 'text-blue-500' : isCompleted ? 'text-blue-400' : 'text-gray-400'
                }`}
                numberOfLines={1}
              >
                {STEP_LABELS[step]}
              </Text>
            </View>

            {/* Connector line */}
            {!isLast && (
              <View
                className={`flex-1 h-0.5 mx-1 mb-4 rounded-full ${
                  index < currentStep ? 'bg-blue-400' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};