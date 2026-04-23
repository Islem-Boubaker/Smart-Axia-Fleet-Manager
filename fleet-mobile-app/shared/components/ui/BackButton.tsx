import { BlurView } from "expo-blur";
import { ArrowLeft } from "lucide-react-native";

import { TouchableOpacity } from "react-native";
import { useNavigation } from "expo-router";
import { useAppTheme } from "@/shared/theme/ThemeProvider";
export default function BackButton() {
  const navigation = useNavigation();
  const { isDark } = useAppTheme();
  const handleGoBack = () => {
    navigation.goBack();
  };
  return (
    <BlurView
      intensity={60}
      tint={isDark ? "dark" : "light"}
      style={{ borderRadius: 14, overflow: "hidden" }}
    >
      <TouchableOpacity
        onPress={handleGoBack}
        style={{
          padding: 10,
          borderWidth: 1,
          borderColor: isDark ? "#334155" : "#E2E8F0",
          backgroundColor: isDark ? "rgba(15,23,42,0.5)" : "rgba(255,255,255,0.8)",
        }}
      >
        <ArrowLeft size={20} color={isDark ? "#E2E8F0" : "#1F2937"} />
      </TouchableOpacity>
    </BlurView>
  );
}
