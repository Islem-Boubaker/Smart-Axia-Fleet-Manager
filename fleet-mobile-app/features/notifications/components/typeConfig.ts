import type { LucideIcon } from "lucide-react-native";
import {
  AlertTriangle,
  Bell,
  Bot,
  MessageSquareWarning,
  Truck,
  UserCheck,
  Wrench,
} from "lucide-react-native";
import type { NotificationType } from "../types/notification.types";

export interface TypeConfig {
  Icon: LucideIcon;
  iconColor: string;
  bgClass: string;
  darkBgClass: string;
}

export const TYPE_CONFIG: Record<NotificationType, TypeConfig> = {
  trip:        { Icon: Truck,                iconColor: "#059669", bgClass: "bg-emerald-50",  darkBgClass: "dark:bg-emerald-900/30" },
  maintenance: { Icon: Wrench,               iconColor: "#ea580c", bgClass: "bg-orange-50",   darkBgClass: "dark:bg-orange-900/30"  },
  ai:          { Icon: Bot,                  iconColor: "#7c3aed", bgClass: "bg-purple-50",   darkBgClass: "dark:bg-purple-900/30"  },
  driver:      { Icon: UserCheck,            iconColor: "#2563eb", bgClass: "bg-blue-50",     darkBgClass: "dark:bg-blue-900/30"    },
  system:      { Icon: Bell,                 iconColor: "#64748b", bgClass: "bg-slate-100",   darkBgClass: "dark:bg-slate-700/50"   },
  alert:       { Icon: AlertTriangle,        iconColor: "#dc2626", bgClass: "bg-red-50",      darkBgClass: "dark:bg-red-900/30"     },
  claim:       { Icon: MessageSquareWarning, iconColor: "#d97706", bgClass: "bg-amber-50",    darkBgClass: "dark:bg-amber-900/30"   },
};
