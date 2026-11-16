import { VitalEntry, VitalType } from './types';

export const VITALS: Record<VitalType, { label: string; icon: string; unit: string; color: string }> = {
  bp: { label: 'Blood pressure', icon: '🩺', unit: 'mmHg', color: '#EF4444' },
  sugar: { label: 'Blood sugar', icon: '🩸', unit: 'mg/dL', color: '#F97316' },
  hr: { label: 'Heart rate', icon: '❤️', unit: 'bpm', color: '#EC4899' },
  spo2: { label: 'SpO₂', icon: '🫁', unit: '%', color: '#0EA5E9' },
  temp: { label: 'Temperature', icon: '🌡️', unit: '°C', color: '#EAB308' },
};

export type Level = 'good' | 'warn' | 'bad';

export function classifyVital(v: VitalEntry): { text: string; level: Level } {
  switch (v.type) {
    case 'bp': {
      const s = v.value;
      const d = v.value2 ?? 0;
      if (s >= 180 || d >= 120) return { text: 'Crisis — seek care', level: 'bad' };
      if (s >= 140 || d >= 90) return { text: 'High (stage 2)', level: 'bad' };
      if (s >= 130 || d >= 80) return { text: 'High (stage 1)', level: 'warn' };
      if (s >= 120) return { text: 'Elevated', level: 'warn' };
      if (s < 90 || d < 60) return { text: 'Low', level: 'warn' };
      return { text: 'Normal', level: 'good' };
    }
    case 'sugar': {
      const x = v.value;
      if (x < 70) return { text: 'Low', level: 'bad' };
      if (v.context === 'fasting') return x <= 99 ? { text: 'Normal', level: 'good' } : x <= 125 ? { text: 'Prediabetes range', level: 'warn' } : { text: 'Diabetes range', level: 'bad' };
      if (v.context === 'post-meal') return x < 140 ? { text: 'Normal', level: 'good' } : x < 200 ? { text: 'High', level: 'warn' } : { text: 'Very high', level: 'bad' };
      return x < 140 ? { text: 'Normal', level: 'good' } : x < 200 ? { text: 'High', level: 'warn' } : { text: 'Very high', level: 'bad' };
    }
    case 'hr':
      return v.value < 50 ? { text: 'Low', level: 'warn' } : v.value > 100 ? { text: 'High', level: 'warn' } : { text: 'Normal', level: 'good' };
    case 'spo2':
      return v.value >= 95 ? { text: 'Normal', level: 'good' } : v.value >= 92 ? { text: 'Low', level: 'warn' } : { text: 'Very low — seek care', level: 'bad' };
    case 'temp':
      return v.value >= 39 ? { text: 'High fever', level: 'bad' } : v.value >= 37.5 ? { text: 'Fever', level: 'warn' } : v.value < 35.5 ? { text: 'Low', level: 'warn' } : { text: 'Normal', level: 'good' };
  }
}

export const formatVital = (v: VitalEntry) => (v.type === 'bp' ? `${v.value}/${v.value2}` : `${v.value}`);
