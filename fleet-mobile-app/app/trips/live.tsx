import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LiveTripsRoute() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg font-bold">Live Trips</Text>
      </View>
    </SafeAreaView>
  );
}

LiveTripsRoute.displayName = 'LiveTripsRoute';
