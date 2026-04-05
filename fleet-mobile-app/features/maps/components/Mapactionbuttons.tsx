import { View, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SHEET_EXPANDED } from "../hooks/useMaps";

interface Props {
  onCenterDriver: () => void;
  onFitRoute: () => void;
}

export function MapActionButtons({ onCenterDriver, onFitRoute }: Props) {
  return (
    <View
      className="absolute right-4 gap-3"
      style={{ bottom: SHEET_EXPANDED + 16 }}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        className="w-11 h-11 rounded-full bg-white items-center justify-center"
        style={{ elevation: 4, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6 }}
        onPress={onCenterDriver}
      >
        <MaterialIcons name="my-location" size={20} color="#2D9B6F" />
      </TouchableOpacity>

      <TouchableOpacity
        className="w-11 h-11 rounded-full bg-white items-center justify-center"
        style={{ elevation: 4, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6 }}
        onPress={onFitRoute}
      >
        <MaterialIcons name="fullscreen" size={20} color="#374151" />
      </TouchableOpacity>
    </View>
  );
}

MapActionButtons.displayName = "MapActionButtons";