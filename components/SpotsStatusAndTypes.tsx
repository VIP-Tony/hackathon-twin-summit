import { Accessibility, Bike, Car, LucideIcon, Zap } from "lucide-react";

export const SPOT_STATUS: Record<string, { label: string, bgColor: string, glowColor: string, borderColor: string }> = {
  FREE: { 
    label: 'Disponível', 
    bgColor: 'bg-linear-to-br from-emerald-400 to-emerald-500',
    glowColor: 'shadow-emerald-400/10',
    borderColor: 'border-emerald-300'
  },
  OCCUPIED: { 
    label: 'Ocupada', 
    bgColor: 'bg-linear-to-br from-red-400 to-red-500',
    glowColor: 'shadow-red-400/10',
    borderColor: 'border-red-300'
  },
  RESERVED: { 
    label: 'Reservada', 
    bgColor: 'bg-linear-to-br from-amber-400 to-amber-500',
    glowColor: 'shadow-amber-400/10',
    borderColor: 'border-amber-300'
  },
  MAINTENANCE: { 
    label: 'Manutenção', 
    bgColor: 'bg-linear-to-br from-gray-400 to-gray-500',
    glowColor: 'shadow-gray-400/10',
    borderColor: 'border-gray-300'
  }
};

export const SPOT_TYPES: Record<string, { label: string, icon: LucideIcon, color: string }> = {
  GENERAL: { label: 'Geral', icon: Car, color: 'violet' },
  PCD: { label: 'PCD', icon: Accessibility, color: 'blue' },
  ELECTRIC: { label: 'Elétrico', icon: Zap, color: 'green' },
  MOTORCYCLE: { label: 'Moto', icon: Bike, color: 'orange' }
};
