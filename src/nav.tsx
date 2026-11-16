import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BackHandler } from 'react-native';

export type Tab = 'home' | 'track' | 'meds' | 'records' | 'family';
export type StackRoute =
  | { name: 'steps' }
  | { name: 'weight' }
  | { name: 'calories' }
  | { name: 'water' }
  | { name: 'sleep' }
  | { name: 'workout' }
  | { name: 'pcos' }
  | { name: 'thyroid' }
  | { name: 'medEdit'; id?: string; preset?: 'thyroid' | 'eye' }
  | { name: 'profileEdit'; id?: string }
  | { name: 'backup' }
  | { name: 'reminders' }
  | { name: 'settings' }
  | { name: 'vitals'; type?: import('./types').VitalType }
  | { name: 'checkups' }
  | { name: 'checkupEdit'; id?: string }
  | { name: 'checkupView'; id: string }
  | { name: 'labTrend'; key: string }
  | { name: 'reports' }
  | { name: 'reportEdit'; id?: string }
  | { name: 'appointments' }
  | { name: 'vaccines' }
  | { name: 'emergency' }
  | { name: 'medicalEdit' }
  | { name: 'summary' };

interface Nav {
  tab: Tab;
  stack: StackRoute[];
  setTab: (t: Tab) => void;
  push: (r: StackRoute) => void;
  back: () => void;
  reset: () => void;
}

const NavContext = createContext<Nav | null>(null);

export function NavProvider({ children, initialTab = 'home', initialStack = [] }: { children: React.ReactNode; initialTab?: Tab; initialStack?: StackRoute[] }) {
  const [tab, setTabState] = useState<Tab>(initialTab);
  const [stack, setStack] = useState<StackRoute[]>(initialStack);

  const back = useCallback(() => setStack((s) => s.slice(0, -1)), []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length) {
        back();
        return true;
      }
      if (tab !== 'home') {
        setTabState('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, tab, back]);

  const value = useMemo<Nav>(
    () => ({
      tab,
      stack,
      setTab: (t) => {
        setStack([]);
        setTabState(t);
      },
      push: (r) => setStack((s) => [...s, r]),
      back,
      reset: () => setStack([]),
    }),
    [tab, stack, back],
  );
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export const useNav = () => {
  const n = useContext(NavContext);
  if (!n) throw new Error('useNav outside NavProvider');
  return n;
};
