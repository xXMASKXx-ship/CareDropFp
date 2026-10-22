export type Theme = {
  id: string;
  name: string;
  gradient: string;
  gradientButton: string;
  gradientHover: string;
  textGradient: string;
  textPrimary: string;
  textDark: string;
  textLight: string;
  bgPrimary: string;
  bgSoft: string;
  bgLight: string;
  borderSoft: string;
  borderActive: string;
  ring: string;
  shadow: string;
  shadowLg: string;
  iconSolid: string;
  iconSoft: string;
  activeTab: string;
  hoverSoft: string;
  hoverBgLight: string;
  focusBorderActive: string;
};

export const THEMES: Record<string, Theme> = {
  green: {
    id: 'green',
    name: 'Eco Green',
    gradient: 'from-emerald-500 to-teal-600',
    gradientButton: 'from-emerald-500 to-teal-500',
    gradientHover: 'hover:from-emerald-600 hover:to-teal-600',
    textGradient: 'from-emerald-600 to-teal-600',
    textPrimary: 'text-emerald-500',
    textDark: 'text-emerald-800',
    textLight: 'text-emerald-50',
    bgPrimary: 'bg-emerald-500',
    bgSoft: 'bg-emerald-50',
    bgLight: 'bg-emerald-100',
    borderSoft: 'border-emerald-200',
    borderActive: 'border-emerald-500',
    ring: 'focus:ring-emerald-500/30',
    shadow: 'shadow-emerald-500/30',
    shadowLg: 'shadow-emerald-500/50',
    iconSolid: 'bg-emerald-500 text-white shadow-emerald-500/30',
    iconSoft: 'bg-emerald-100 text-emerald-600',
    activeTab: 'bg-emerald-100 text-emerald-700 shadow-sm',
    hoverSoft: 'hover:bg-emerald-50/50 hover:border-emerald-200',
    hoverBgLight: 'hover:bg-emerald-100',
    focusBorderActive: 'focus:border-emerald-500',
  },
  blue: {
    id: 'blue',
    name: 'Ocean Blue',
    gradient: 'from-blue-500 to-cyan-600',
    gradientButton: 'from-blue-500 to-cyan-500',
    gradientHover: 'hover:from-blue-600 hover:to-cyan-600',
    textGradient: 'from-blue-600 to-cyan-600',
    textPrimary: 'text-blue-500',
    textDark: 'text-blue-800',
    textLight: 'text-blue-50',
    bgPrimary: 'bg-blue-500',
    bgSoft: 'bg-blue-50',
    bgLight: 'bg-blue-100',
    borderSoft: 'border-blue-200',
    borderActive: 'border-blue-500',
    ring: 'focus:ring-blue-500/30',
    shadow: 'shadow-blue-500/30',
    shadowLg: 'shadow-blue-500/50',
    iconSolid: 'bg-blue-500 text-white shadow-blue-500/30',
    iconSoft: 'bg-blue-100 text-blue-600',
    activeTab: 'bg-blue-100 text-blue-700 shadow-sm',
    hoverSoft: 'hover:bg-blue-50/50 hover:border-blue-200',
    hoverBgLight: 'hover:bg-blue-100',
    focusBorderActive: 'focus:border-blue-500',
  },
  rose: {
    id: 'rose',
    name: 'Care Rose',
    gradient: 'from-rose-500 to-pink-600',
    gradientButton: 'from-rose-500 to-pink-500',
    gradientHover: 'hover:from-rose-600 hover:to-pink-600',
    textGradient: 'from-rose-600 to-pink-600',
    textPrimary: 'text-rose-500',
    textDark: 'text-rose-800',
    textLight: 'text-rose-50',
    bgPrimary: 'bg-rose-500',
    bgSoft: 'bg-rose-50',
    bgLight: 'bg-rose-100',
    borderSoft: 'border-rose-200',
    borderActive: 'border-rose-500',
    ring: 'focus:ring-rose-500/30',
    shadow: 'shadow-rose-500/30',
    shadowLg: 'shadow-rose-500/50',
    iconSolid: 'bg-rose-500 text-white shadow-rose-500/30',
    iconSoft: 'bg-rose-100 text-rose-600',
    activeTab: 'bg-rose-100 text-rose-700 shadow-sm',
    hoverSoft: 'hover:bg-rose-50/50 hover:border-rose-200',
    hoverBgLight: 'hover:bg-rose-100',
    focusBorderActive: 'focus:border-rose-500',
  },
  amber: {
    id: 'amber',
    name: 'Warm Amber',
    gradient: 'from-amber-500 to-orange-600',
    gradientButton: 'from-amber-500 to-orange-500',
    gradientHover: 'hover:from-amber-600 hover:to-orange-600',
    textGradient: 'from-amber-600 to-orange-600',
    textPrimary: 'text-amber-500',
    textDark: 'text-amber-800',
    textLight: 'text-amber-50',
    bgPrimary: 'bg-amber-500',
    bgSoft: 'bg-amber-50',
    bgLight: 'bg-amber-100',
    borderSoft: 'border-amber-200',
    borderActive: 'border-amber-500',
    ring: 'focus:ring-amber-500/30',
    shadow: 'shadow-amber-500/30',
    shadowLg: 'shadow-amber-500/50',
    iconSolid: 'bg-amber-500 text-white shadow-amber-500/30',
    iconSoft: 'bg-amber-100 text-amber-600',
    activeTab: 'bg-amber-100 text-amber-700 shadow-sm',
    hoverSoft: 'hover:bg-amber-50/50 hover:border-amber-200',
    hoverBgLight: 'hover:bg-amber-100',
    focusBorderActive: 'focus:border-amber-500',
  },
};
