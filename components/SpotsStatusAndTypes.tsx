import { Accessibility, Bike, Car, LucideIcon, Zap } from "lucide-react";

export const SPOT_STATUS: Record<string, { label: string, bgColor: string, textColor: string, dotColor: string }> = {
  FREE: { label: 'Livre', bgColor: 'bg-green-500', textColor: 'text-green-400', dotColor: 'bg-green-400' },
  OCCUPIED: { label: 'Ocupado', bgColor: 'bg-red-500', textColor: 'text-red-400', dotColor: 'bg-red-400' },
  RESERVED: { label: 'Reservado', bgColor: 'bg-yellow-500', textColor: 'text-yellow-400', dotColor: 'bg-yellow-400' }
};

export const SPOT_TYPES: Record<string, { label: string, icon: LucideIcon, color: string }> = {
  GENERAL: { label: 'Geral', icon: Car, color: 'violet' },
  PCD: { label: 'PCD', icon: Accessibility, color: 'blue' },
  ELECTRIC: { label: 'Elétrico', icon: Zap, color: 'green' },
  MOTORCYCLE: { label: 'Moto', icon: Bike, color: 'orange' }
};
