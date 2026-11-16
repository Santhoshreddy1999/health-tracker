import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { useStore } from './store';

export interface Theme {
  dark: boolean;
  bg: string;
  card: string;
  cardAlt: string;
  text: string;
  sub: string;
  border: string;
  primary: string;
  primarySoft: string;
  danger: string;
  success: string;
  warning: string;
  accent: Record<string, string>;
}

const accent = {
  steps: '#22C55E',
  weight: '#8B5CF6',
  calories: '#F97316',
  water: '#0EA5E9',
  sleep: '#6366F1',
  workout: '#EF4444',
  meds: '#EC4899',
  pcos: '#D946EF',
  thyroid: '#14B8A6',
  sit: '#EAB308',
};

const light: Theme = {
  dark: false,
  bg: '#F4F6FB',
  card: '#FFFFFF',
  cardAlt: '#EEF1F7',
  text: '#0F172A',
  sub: '#64748B',
  border: '#E2E8F0',
  primary: '#4F46E5',
  primarySoft: '#E0E7FF',
  danger: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
  accent,
};

const dark: Theme = {
  dark: true,
  bg: '#0B1020',
  card: '#151B2E',
  cardAlt: '#1E2640',
  text: '#F1F5F9',
  sub: '#94A3B8',
  border: '#27304A',
  primary: '#818CF8',
  primarySoft: '#272F5A',
  danger: '#F87171',
  success: '#4ADE80',
  warning: '#FBBF24',
  accent,
};

const ThemeContext = createContext<Theme>(light);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const { state } = useStore();
  const isDark = state.theme === 'system' ? scheme === 'dark' : state.theme === 'dark';
  return <ThemeContext.Provider value={isDark ? dark : light}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
