import { ScrollView, TouchableOpacity, Text } from "react-native";

export default function FilterChips({ filters, activeFilter, setActiveFilter }: any) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 20,
        alignItems: "center",
        gap: 8,
      }}
    >
      {filters.map((f: any) => {
        const isActive = activeFilter === f.key;

        return (
          <TouchableOpacity
            key={f.key}
            onPress={() => setActiveFilter(f.key)}
            style={{
              height: 34,
              paddingHorizontal: 16,
              borderRadius: 17,
              borderWidth: 1.5,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isActive ? "#2D9B6F" : "#ffffff",
              borderColor: isActive ? "#2D9B6F" : "#E5E7EB",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isActive ? "#ffffff" : "#6B7280",
              }}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}