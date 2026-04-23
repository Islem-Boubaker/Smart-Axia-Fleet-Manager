// ─── ReclamationScreen ────────────────────────────────────────────────────────
// Main screen — coordinates all components using the hook.
// Zero business logic here; pure presentation orchestration.

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from "react-native";

import { useReclamationForm } from "../hooks/useReclamationForm";
import { StepIndicator } from "../components/StepIndicator";
import { FormInput } from "../components/FormInput";
import { ImageUploader } from "../components/ImageUploader";
import { SuccessScreen } from "../components/SuccessScreen";
import BackButton from "@/shared/components/ui/BackButton";


// ── Step content renderers (keeps the JSX below clean) ─────────────────────
interface StepProps {
  hook: ReturnType<typeof useReclamationForm>;
}

const CreateStep: React.FC<StepProps> = ({ hook }) => (
  <View className="flex-1">
    <Text className="text-2xl font-bold text-gray-800 mb-1 text-center">
      What&apos;s this about?
    </Text>
    <Text className="text-sm text-gray-400 mb-6 text-center">
      Add the subject and full problem details
    </Text>

    <FormInput
      label="Subject"
      value={hook.form.subject}
      onChangeText={hook.setSubject}
      error={hook.errors.subject}
      placeholder="e.g. Vehicle not available"
      required
    />

    <FormInput
      label="Description"
      value={hook.form.message}
      onChangeText={hook.setMessage}
      error={hook.errors.message}
      placeholder="Describe the issue in detail..."
      multiline
      numberOfLines={5}
      required
    />

    <ImageUploader
      images={hook.form.images}
      onPickImages={hook.pickImages}
      onRemoveImage={hook.removeImage}
    />
  </View>
);

// ── Main export ──────────────────────────────────────────────────────────────
const CreateReclamationScreen: React.FC = () => {
  const hook = useReclamationForm();

  const canProceed = (): boolean => {
    return (
      hook.form.subject.trim().length >= 3 &&
      hook.form.message.trim().length >= 10
    );
  };

  if (hook.isSuccess) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <SuccessScreen onReset={hook.resetForm} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View className="px-5 pt-8">
          {/* Top row: close + title */}
          <View className="flex-row items-center justify-between mb-4">
            {/* <TouchableOpacity
              onPress={hook.goBack}
              disabled={hook.currentStep === 0}
              className={`w-9 h-9 rounded-full bg-gray-100 items-center justify-center ${
                hook.currentStep === 0 ? "opacity-30" : ""
              }`}
            >
              <Text className="text-gray-600 font-bold text-base">‹</Text>
            </TouchableOpacity> */}

            <BackButton/>

            <Text className="text-base font-bold text-gray-800 tracking-tight">
              Report an issue
            </Text>

            {/* Spacer to balance header */}
            <View className="w-9" />
          </View>

        </View>

        {/* Divider */}
        <View className="h-px bg-gray-100 mx-5 mb-2" />

        {/* ── Scrollable form area ─────────────────────────────────────── */}
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}
        >
          <CreateStep hook={hook} />
        </ScrollView>

        {/* ── Bottom action area ──────────────────────────────────────── */}
        <View
          className="px-5 pb-6 pt-3 bg-white border-t border-gray-100"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 10,
            paddingBottom: Platform.OS === "ios" ? 0 : 30,
          }}
        >
          <TouchableOpacity
            onPress={hook.handleSubmit}
            disabled={!canProceed() || hook.isLoading}
            className={`rounded-2xl py-4 flex-row items-center justify-center ${
              canProceed() && !hook.isLoading ? "bg-blue-500" : "bg-blue-300"
            }`}
            style={{
              shadowColor: "#F43F5E",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: canProceed() ? 0.3 : 0,
              shadowRadius: 12,
              elevation: canProceed() ? 6 : 0,
           
            }}
          >
            {hook.isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">
                Submit Reclamation
              </Text>
            )}
          </TouchableOpacity>

               </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateReclamationScreen;
CreateReclamationScreen.displayName = "CreateReclamationScreen";
