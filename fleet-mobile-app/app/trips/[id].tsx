import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

export default function TripDetailsRoute() {
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg font-bold">Trip {id}</Text>
      </View>
    </SafeAreaView>
  );
}

TripDetailsRoute.displayName = 'TripDetailsRoute';
