import { BlurView } from "expo-blur";
import { ArrowLeft } from "lucide-react-native";

import { TouchableOpacity } from "react-native";
import { useNavigation } from "expo-router";
export default function BackButton() {
  const navigation = useNavigation();
  const handleGoBack = () => {
    navigation.goBack();
  };
  return (
    <>
      <BlurView
        intensity={80}
        tint="light"
        style={{ borderRadius: 12, overflow: "hidden" }}
      >
        <TouchableOpacity onPress={handleGoBack} style={{ padding: 10 }}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
      </BlurView>
    </>
  );
}
