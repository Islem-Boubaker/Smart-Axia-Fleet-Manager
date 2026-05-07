import * as React from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { subscribeToastActions, type ToastType } from "./toast";

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
}

const MAX_TOASTS = 4;
const EXIT_ANIMATION_MS = 220;

const typeStyles = {
  success: {
    border: "#16A34A",
    icon: "check-circle",
    iconColor: "#16A34A",
  },
  error: {
    border: "#DC2626",
    icon: "error-outline",
    iconColor: "#DC2626",
  },
  info: {
    border: "#2563EB",
    icon: "notifications-none",
    iconColor: "#2563EB",
  },
} as const;

const defaultTitleKeys: Record<ToastType, string> = {
  success: "shared.success",
  error: "shared.error",
  info: "notifications.types.generic.title",
};

function ToastCard({
  toast,
  onRemove,
}: {
  toast: ToastItem;
  onRemove: (id: string) => void;
}) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-24)).current;
  const isClosing = React.useRef(false);

  const close = React.useCallback(() => {
    if (isClosing.current) return;
    isClosing.current = true;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: EXIT_ANIMATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -12,
        duration: EXIT_ANIMATION_MS,
        useNativeDriver: true,
      }),
    ]).start(() => onRemove(toast.id));
  }, [onRemove, opacity, toast.id, translateY]);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 16,
        stiffness: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  React.useEffect(() => {
    if (toast.duration <= 0) return;
    const timeout = setTimeout(close, toast.duration);
    return () => clearTimeout(timeout);
  }, [close, toast.duration]);

  const palette = typeStyles[toast.type];

  return (
    <Animated.View
      style={[
        styles.toast,
        { borderLeftColor: palette.border, opacity, transform: [{ translateY }] },
      ]}
    >
      <Pressable onPress={close} style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.titleWrap}>
            <MaterialIcons
              name={palette.icon}
              size={18}
              color={palette.iconColor}
              style={styles.leadingIcon}
            />
            <Text style={styles.title} numberOfLines={1}>
              {toast.title}
            </Text>
          </View>

          <TouchableOpacity onPress={close} hitSlop={10}>
            <MaterialIcons name="close" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        <Text style={styles.message}>{toast.message}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    return subscribeToastActions((action) => {
      if (action.kind === "add") {
        const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setToasts((prev) => {
          const next = [
            {
              id,
              type: action.type,
              message: action.message,
              title: action.options?.title ?? t(defaultTitleKeys[action.type]),
              duration: action.options?.duration ?? 4200,
            },
            ...prev,
          ];
          return next.slice(0, MAX_TOASTS);
        });
        return;
      }

      setToasts((prev) => prev.filter((toast) => toast.id !== action.id));
    });
  }, [t]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const topOffset = React.useMemo(() => insets.top + 8, [insets.top]);

  return (
    <View style={styles.root}>
      {children}

      <View pointerEvents="box-none" style={[styles.stack, { top: topOffset }]}> 
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  stack: {
    position: "absolute",
    left: 10,
    right: 10,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    borderLeftWidth: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  content: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    paddingRight: 6,
  },
  leadingIcon: {
    marginRight: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    flexShrink: 1,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    color: "#334155",
    marginLeft: 24,
  },
});
