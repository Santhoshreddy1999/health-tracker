import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, MedicalInfo, Profile, ProfileData, Targets, ReminderSettings, ThemePref } from './types';
import { uid } from './utils';

const KEY = 'health-tracker/state/v1';

export const defaultTargets = (): Targets => ({
  steps: 8000,
  weightKg: 70,
  calories: 2000,
  waterMl: 2500,
  glassMl: 250,
  sleepHours: 8,
  workoutMinPerWeek: 150,
});

export const defaultReminders = (): ReminderSettings => ({
  water: { enabled: false, intervalMin: 60, start: '08:00', end: '21:00' },
  sit: { enabled: false, intervalMin: 45, start: '09:30', end: '18:30' },
  medicines: true,
  appointments: true,
});

export const PROFILE_COLORS = ['#6366F1', '#EC4899', '#14B8A6', '#F97316', '#8B5CF6', '#0EA5E9', '#22C55E', '#EF4444'];

export const defaultMedical = (): MedicalInfo => ({
  relation: 'Self',
  dob: '',
  bloodGroup: '',
  allergies: '',
  notes: '',
  doctors: [],
  emergency: [],
  insurance: '',
});

export const emptyData = (): ProfileData => ({
  vitals: [],
  checkups: [],
  reports: [],
  appointments: [],
  vaccines: [],
  steps: [],
  weight: [],
  calories: [],
  water: [],
  sleep: [],
  workouts: [],
  medicines: [],
  medLogs: [],
  cycles: [],
  symptoms: [],
  labs: [],
});

export const newProfile = (partial: Partial<Profile> = {}): Profile => ({
  id: uid(),
  name: '',
  age: 30,
  sex: 'female',
  heightCm: 165,
  conditions: [],
  targets: defaultTargets(),
  reminders: defaultReminders(),
  medical: defaultMedical(),
  color: PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)],
  createdAt: Date.now(),
  ...partial,
});

const initialState = (): AppState => ({
  version: 1,
  profiles: [],
  data: {},
  activeProfileId: null,
  theme: 'system',
  pinHash: '',
});

/** Fill in fields that may be missing from older saves or hand-edited imports. */
const migrate = (raw: any): AppState => {
  const s: AppState = { ...initialState(), ...raw };
  s.profiles = (s.profiles ?? []).map((p: Profile) => ({
    ...newProfile(),
    ...p,
    targets: { ...defaultTargets(), ...p.targets },
    medical: { ...defaultMedical(), ...p.medical },
    reminders: {
      ...defaultReminders(),
      ...p.reminders,
      water: { ...defaultReminders().water, ...p.reminders?.water },
      sit: { ...defaultReminders().sit, ...p.reminders?.sit },
    },
  }));
  for (const p of s.profiles) s.data[p.id] = { ...emptyData(), ...s.data?.[p.id] };
  if (!s.profiles.find((p) => p.id === s.activeProfileId)) s.activeProfileId = s.profiles[0]?.id ?? null;
  return s;
};

export type ListKey = keyof ProfileData;
type Item<K extends ListKey> = ProfileData[K][number];

interface Ctx {
  ready: boolean;
  state: AppState;
  profile: Profile | null;
  data: ProfileData;
  setTheme: (t: ThemePref) => void;
  setPinHash: (h: string) => void;
  saveProfile: (p: Profile) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  add: <K extends ListKey>(key: K, item: Item<K>) => void;
  update: <K extends ListKey>(key: K, item: Item<K>) => void;
  remove: (key: ListKey, id: string) => void;
  /** Arbitrary update of the active (or given) profile's data. */
  mutate: (fn: (d: ProfileData) => ProfileData, profileId?: string) => void;
  exportJson: () => string;
  importJson: (json: string) => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((s) => {
        if (s) setState(migrate(JSON.parse(s)));
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
    }, 250);
  }, [state, ready]);

  const mutateActive = useCallback((fn: (d: ProfileData) => ProfileData, profileId?: string) => {
    setState((s) => {
      const id = profileId ?? s.activeProfileId;
      if (!id) return s;
      return { ...s, data: { ...s.data, [id]: fn(s.data[id] ?? emptyData()) } };
    });
  }, []);

  const value = useMemo<Ctx>(() => {
    const profile = state.profiles.find((p) => p.id === state.activeProfileId) ?? null;
    const data = (profile && state.data[profile.id]) || emptyData();
    return {
      ready,
      state,
      profile,
      data,
      setTheme: (theme) => setState((s) => ({ ...s, theme })),
      setPinHash: (pinHash) => setState((s) => ({ ...s, pinHash })),
      saveProfile: (p) =>
        setState((s) => {
          const exists = s.profiles.some((x) => x.id === p.id);
          return {
            ...s,
            profiles: exists ? s.profiles.map((x) => (x.id === p.id ? p : x)) : [...s.profiles, p],
            data: exists ? s.data : { ...s.data, [p.id]: emptyData() },
            activeProfileId: s.activeProfileId ?? p.id,
          };
        }),
      deleteProfile: (id) =>
        setState((s) => {
          const profiles = s.profiles.filter((p) => p.id !== id);
          const data = { ...s.data };
          delete data[id];
          return {
            ...s,
            profiles,
            data,
            activeProfileId: s.activeProfileId === id ? profiles[0]?.id ?? null : s.activeProfileId,
          };
        }),
      setActiveProfile: (id) => setState((s) => ({ ...s, activeProfileId: id })),
      add: (key, item) => mutateActive((d) => ({ ...d, [key]: [...(d[key] as any[]), item] })),
      update: (key, item) =>
        mutateActive((d) => ({
          ...d,
          [key]: (d[key] as any[]).map((x) => (x.id === (item as any).id ? item : x)),
        })),
      remove: (key, id) => mutateActive((d) => ({ ...d, [key]: (d[key] as any[]).filter((x) => x.id !== id) })),
      mutate: mutateActive,
      exportJson: () => JSON.stringify(state, null, 2),
      importJson: (json) => setState(migrate(JSON.parse(json))),
    };
  }, [state, ready, mutateActive]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => {
  const c = useContext(StoreContext);
  if (!c) throw new Error('useStore outside StoreProvider');
  return c;
};
