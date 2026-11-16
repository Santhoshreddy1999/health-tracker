import { AppState } from '../types';
import { nowTime, today } from '../utils';
import { planReminders, PlannedReminder } from './plan';

export type MedTakenHandler = (profileId: string, medId: string, slot: string) => void;
export type InAppHandler = (r: PlannedReminder) => void;

let plan: PlannedReminder[] = [];
let inApp: InAppHandler | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const fired = new Set<string>();

export const platformNote =
  'Web / iPhone home-screen app: reminders only fire while the app is open (in the foreground or a background tab). ' +
  'Browsers cannot schedule local notifications for when the app is closed. For reliable alarms use the Android APK or Expo Go.';

const hasNotification = () => typeof window !== 'undefined' && 'Notification' in window;

async function show(r: PlannedReminder) {
  inApp?.(r);
  if (!hasNotification() || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(r.title, { body: r.body, tag: r.key, icon: '/icon-192.png' });
    else new Notification(r.title, { body: r.body, tag: r.key });
  } catch {
    // Some browsers (e.g. iOS Safari outside an installed PWA) throw here; the in-app banner still shows.
  }
}

function tick() {
  const t = nowTime();
  const d = today();
  const now = Date.now();
  for (const r of plan) {
    const id = `${d}-${r.key}`;
    const due = r.at ? now >= r.at && now - r.at < 120000 : r.time === t;
    if (due && !fired.has(id)) {
      fired.add(id);
      show(r);
    }
  }
}

export async function setupReminders(_onMedTaken: MedTakenHandler, onInApp: InAppHandler) {
  inApp = onInApp;
  if (!timer) timer = setInterval(tick, 20000);
}

export async function getPermission(): Promise<'granted' | 'denied' | 'undetermined' | 'unsupported'> {
  if (!hasNotification()) return 'unsupported';
  return Notification.permission === 'default' ? 'undetermined' : (Notification.permission as any);
}

export async function requestPermission() {
  if (!hasNotification()) return false;
  return (await Notification.requestPermission()) === 'granted';
}

export async function syncReminders(state: AppState) {
  plan = planReminders(state);
  return { scheduled: plan.length, skipped: 0 };
}

export async function testNotification() {
  setTimeout(
    () =>
      show({
        key: 'test-' + Date.now(),
        kind: 'water',
        time: nowTime(),
        title: '🔔 Test reminder',
        body: 'Reminders are working while the app is open.',
        data: { kind: 'water', profileId: '' },
      }),
    3000,
  );
}
