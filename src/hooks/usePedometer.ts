import { Pedometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { AppState as RNAppState, Platform } from 'react-native';
import { useStore } from '../store';
import { ProfileData } from '../types';
import { today, uid } from '../utils';

export type PedometerStatus = 'checking' | 'active' | 'unavailable' | 'denied';

const setPedometerSteps = (d: ProfileData, date: string, fn: (prev: number) => number): ProfileData => {
  const existing = d.steps.find((s) => s.date === date && s.source === 'pedometer');
  if (existing) return { ...d, steps: d.steps.map((s) => (s === existing ? { ...s, count: fn(s.count) } : s)) };
  return { ...d, steps: [...d.steps, { id: uid(), date, count: fn(0), source: 'pedometer' }] };
};

/**
 * Keeps today's "pedometer" step entry for the active profile in sync.
 * iOS: reads the day's total from Core Motion (includes steps taken while the app was closed).
 * Android: the sensor only reports steps while the app is running, so those are added incrementally.
 */
export function usePedometer(): PedometerStatus {
  const { mutate, profile } = useStore();
  const [status, setStatus] = useState<PedometerStatus>(Platform.OS === 'web' ? 'unavailable' : 'checking');
  const profileId = profile?.id;
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' || !profileId) return;
    let sub: { remove: () => void } | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    (async () => {
      try {
        if (!(await Pedometer.isAvailableAsync())) return setStatus('unavailable');
        const perm = await Pedometer.requestPermissionsAsync();
        if (!perm.granted) return setStatus('denied');
        if (cancelled) return;
        setStatus('active');
        if (Platform.OS === 'ios') {
          const read = async () => {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const r = await Pedometer.getStepCountAsync(start, new Date());
            mutate((d) => setPedometerSteps(d, today(), () => r.steps), profileId);
          };
          await read();
          poll = setInterval(read, 60000);
          const appSub = RNAppState.addEventListener('change', (s) => s === 'active' && read());
          sub = { remove: () => appSub.remove() };
        } else {
          last.current = null;
          sub = Pedometer.watchStepCount((r) => {
            const delta = last.current == null ? r.steps : r.steps - last.current;
            last.current = r.steps;
            if (delta > 0) mutate((d) => setPedometerSteps(d, today(), (p) => p + delta), profileId);
          });
        }
      } catch {
        setStatus('unavailable');
      }
    })();

    return () => {
      cancelled = true;
      sub?.remove();
      if (poll) clearInterval(poll);
    };
  }, [profileId, mutate]);

  return status;
}
