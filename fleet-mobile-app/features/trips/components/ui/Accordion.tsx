// components/ui/Accordion.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useAppTheme } from "@/shared/theme/ThemeProvider";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface AccordionItemProps {
  title: string;
  content: string | null;
  isFirst?: boolean;
  isLast?: boolean;
  defaultOpen?: boolean;
}

export function AccordionItem({
  title,
  content,
  isFirst,
  isLast,
  defaultOpen = false,
}: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { isDark } = useAppTheme();

  const toggleAccordion = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
  };

  if (!content) return null;

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderColor: isDark ? "#334155" : "#E5E7EB",
        backgroundColor: isDark ? "#0F172A" : "white",
      }}
    >
      {/* Header row — title always visible at the top */}
      <TouchableOpacity
        onPress={toggleAccordion}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: 14,
          paddingHorizontal: 16,

        }}
        activeOpacity={0.7}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: isDark ? "#F8FAFC" : "#111827",
            flex: 1,
            marginRight: 12,
          }}
        >
          {title}
        </Text>
        {isOpen ? (
          <ChevronUp size={18} color={isDark ? "#94A3B8" : "#6B7280"} />
        ) : (
          <ChevronDown size={18} color={isDark ? "#94A3B8" : "#6B7280"} />
        )}
      </TouchableOpacity>

      {/* Collapsible body */}
      {isOpen && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 14,
            paddingTop: 4,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: isDark ? "#CBD5E1" : "#6B7280",
              lineHeight: 20,
            }}
          >
            {content}
          </Text>
        </View>
      )}
    </View>
  );
}

interface AccordionProps {
  items: { title: string; content: string | null }[];
  defaultOpenIndex?: number;
}

export function Accordion({ items, defaultOpenIndex }: AccordionProps) {
  const validItems = items.filter((item) => item.content);

  if (validItems.length === 0) return null;

  return (
    <View style={{ borderRadius: 12, overflow: "hidden" }}>
      {validItems.map((item, index) => (
        <AccordionItem
          key={index}
          title={item.title}
          content={item.content}
          isFirst={index === 0}
          isLast={index === validItems.length - 1}
          defaultOpen={index === defaultOpenIndex}
        />
      ))}
    </View>
  );
}
