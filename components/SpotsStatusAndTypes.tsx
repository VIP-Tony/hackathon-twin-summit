import { Accessibility, Car, LucideIcon, Zap } from "lucide-react";

  export const SPOT_TYPES: Record<string, { label: string; color: string; icon: LucideIcon }> = {
    GENERAL: { label: "Geral", color: "#7C3AED", icon: Car },
    PCD: { label: "PCD", color: "#3B82F6", icon: Accessibility },
    ELECTRIC: { label: "Elétrico", color: "#10B981", icon: Zap },
  };

  export const SPOT_STATUS: Record<string, { label: string; color: string; bgColor: string }> = {
    FREE: { label: "Livre", color: "#10B981", bgColor: "bg-green-500" },
    OCCUPIED: { label: "Ocupado", color: "#EF4444", bgColor: "bg-red-500" },
    RESERVED: {
      label: "Reservado",
      color: "#F59E0B",
      bgColor: "bg-yellow-500",
    },
  };