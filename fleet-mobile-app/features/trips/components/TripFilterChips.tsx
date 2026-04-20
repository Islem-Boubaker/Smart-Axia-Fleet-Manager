import { ScrollView, TouchableOpacity, Text, View } from "react-native";
import { FILTER_BUTTONS, type FilterOption } from "../config/trips.config";
import { useAppTheme } from "@/shared/theme/ThemeProvider";

interface Props {
  selected: FilterOption;
  onChange: (filter: FilterOption) => void;
}

export function TripFilterChips({ selected, onChange }: Props) {
  const { isDark } = useAppTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 25, gap: 8, alignItems: "center" }}
      style={{ flexGrow: 0, marginBottom: 14 ,paddingTop: 10 ,paddingBottom: 10 }}
  
    >
      {FILTER_BUTTONS.map((f) => {
        const isActive = selected === f.id;
        return (
          <TouchableOpacity
            key={f.id}
            onPress={() => onChange(f.id)}
            style={{
              height: 34,
              width: 99,
              paddingHorizontal: 16,

              borderRadius: 17,
              borderWidth: 1.5,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              backgroundColor: isActive ? "#2d68eb" : isDark ? "#0F172A" : "#ffffff",
              borderColor: isActive ? "#2d68eb" : isDark ? "#334155" : "#E5E7EB",
            }}
          >
            {f.dotColor && !isActive && (
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: f.dotColor,
                }}
              />
            )}
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isActive ? "#ffffff" : isDark ? "#CBD5E1" : "#6B7280",
                lineHeight: 16,
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

TripFilterChips.displayName = "TripFilterChips";