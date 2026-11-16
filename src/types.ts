export type Sex = 'female' | 'male' | 'other';

export interface Targets {
  steps: number;
  weightKg: number;
  calories: number;
  waterMl: number;
  glassMl: number;
  sleepHours: number;
  workoutMinPerWeek: number;
}

export interface IntervalReminder {
  enabled: boolean;
  intervalMin: number;
  start: string; // HH:MM
  end: string; // HH:MM
}

export interface ReminderSettings {
  water: IntervalReminder;
  sit: IntervalReminder;
  medicines: boolean;
  appointments: boolean;
}

export interface Contact { id: string; name: string; role: string; phone: string }

export interface MedicalInfo {
  relation: string;
  dob: string;
  bloodGroup: string;
  allergies: string;
  notes: string;
  doctors: Contact[];
  emergency: Contact[];
  insurance: string;
}

export interface Profile {
  id: string;
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  conditions: string[];
  targets: Targets;
  reminders: ReminderSettings;
  medical: MedicalInfo;
  color: string;
  createdAt: number;
}

export interface StepEntry { id: string; date: string; count: number; source: 'manual' | 'pedometer' }
export interface WeightEntry { id: string; date: string; kg: number }
export interface CalorieEntry { id: string; date: string; time: string; kcal: number; label: string; meal: string }
export interface WaterEntry { id: string; date: string; time: string; ml: number }
export interface SleepEntry { id: string; date: string; bedtime: string; wake: string; hours: number; quality: number }
export interface WorkoutEntry { id: string; date: string; type: string; minutes: number; notes: string }

export type MedKind = 'tablet' | 'eye drops' | 'capsule' | 'syrup' | 'injection' | 'other';

export interface Medicine {
  id: string;
  name: string;
  dose: string;
  kind: MedKind;
  times: string[]; // HH:MM
  notes: string;
  tag: '' | 'thyroid' | 'pcos' | 'eye';
  active: boolean;
}

export interface MedLog { id: string; medId: string; date: string; time: string; slot: string }
export interface CycleEntry { id: string; startDate: string; endDate: string; flow: 'light' | 'medium' | 'heavy'; notes: string }
export interface SymptomEntry { id: string; date: string; symptoms: string[]; notes: string }
export interface LabEntry { id: string; date: string; tsh: number; t3?: number; t4?: number; notes: string }

export type VitalType = 'bp' | 'hr' | 'sugar' | 'spo2' | 'temp';
export interface VitalEntry {
  id: string;
  date: string;
  time: string;
  type: VitalType;
  value: number;
  value2?: number; // diastolic for BP
  context?: 'fasting' | 'post-meal' | 'random';
  notes: string;
}

export interface Checkup {
  id: string;
  date: string;
  title: string;
  lab: string;
  doctor: string;
  values: Record<string, number>;
  reportIds: string[];
  notes: string;
}

export type ReportCategory = 'Lab report' | 'Prescription' | 'Scan / X-ray' | 'Discharge summary' | 'Vaccination' | 'Insurance' | 'Bill' | 'Other';
export interface ReportFile {
  id: string;
  date: string;
  title: string;
  category: ReportCategory;
  doctor: string;
  notes: string;
  fileName: string;
  mime: string;
  size: number;
  storageKey: string;
  createdAt: number;
}

export interface Appointment {
  id: string;
  date: string;
  time: string;
  doctor: string;
  specialty: string;
  place: string;
  reason: string;
  notes: string;
  done: boolean;
}

export interface Vaccine { id: string; date: string; name: string; dose: string; nextDue: string; notes: string }

export interface ProfileData {
  vitals: VitalEntry[];
  checkups: Checkup[];
  reports: ReportFile[];
  appointments: Appointment[];
  vaccines: Vaccine[];
  steps: StepEntry[];
  weight: WeightEntry[];
  calories: CalorieEntry[];
  water: WaterEntry[];
  sleep: SleepEntry[];
  workouts: WorkoutEntry[];
  medicines: Medicine[];
  medLogs: MedLog[];
  cycles: CycleEntry[];
  symptoms: SymptomEntry[];
  labs: LabEntry[];
}

export type ThemePref = 'system' | 'light' | 'dark';

export interface AppState {
  version: 1;
  profiles: Profile[];
  data: Record<string, ProfileData>;
  activeProfileId: string | null;
  theme: ThemePref;
  /** Hash of the optional app-lock PIN; empty = no lock. */
  pinHash: string;
}
