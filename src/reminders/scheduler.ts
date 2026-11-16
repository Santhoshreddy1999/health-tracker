import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AppState } from '../types';
import { MAX_SCHEDULED, planReminders, PlannedReminder } from './plan';

export type MedTakenHandler = (profileId: string, medId: string, slot: string) => void;
export type InAppHandler = (r: PlannedReminder) => void;

let medTaken: MedTakenHandler | null = null;
let initialized = false;

export const platformNote =
  'Reminders are scheduled with the phone’s notification system and fire even when the app is closed.';

export async function setupReminders(onMedTaken: MedTakenHandler, _onInApp: InAppHandler) {
  medTaken = onMedTaken;
  if (initialized) return;
  initialized = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('meds', {
      name: 'Medicine alarms',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 500, 300, 500, 300, 500],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });
    await Notifications.setNotificationChannelAsync('nudges', {
      name: 'Water & movement reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250],
    });
  }
  await Notifications.setNotificationCategoryAsync('med', [
    { identifier: 'TAKEN', buttonTitle: '✅ Taken', options: { opensAppToForeground: false } },
  ]);
  Notifications.addNotificationResponseReceivedListener((res) => {
    const data = res.notification.request.content.data as any;
    if (res.actionIdentifier === 'TAKEN' && data?.medId && medTaken) medTaken(data.profileId, data.medId, data.slot);
  });
}

export async function getPermission(): Promise<'granted' | 'denied' | 'undetermined' | 'unsupported'> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as any;
}

export async function requestPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function syncReminders(state: AppState): Promise<{ scheduled: number; skipped: number }> {
  const plan = planReminders(state);
  const { status } = await Notifications.getPermissionsAsync();
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (status !== 'granted') return { scheduled: 0, skipped: plan.length };
  const list = plan.slice(0, MAX_SCHEDULED);
  for (const r of list) {
    const [hour, minute] = r.time.split(':').map(Number);
    const channelId = r.kind === 'med' || r.kind === 'appointment' ? 'meds' : 'nudges';
    await Notifications.scheduleNotificationAsync({
      identifier: r.key,
      content: {
        title: r.title,
        body: r.body,
        data: r.data,
        sound: 'default',
        categoryIdentifier: r.kind === 'med' ? 'med' : undefined,
        priority: r.kind === 'med' ? Notifications.AndroidNotificationPriority.MAX : Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: r.at
        ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at, channelId }
        : { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId },
    });
  }
  return { scheduled: list.length, skipped: plan.length - list.length };
}

export async function testNotification() {
  await Notifications.scheduleNotificationAsync({
    content: { title: '🔔 Test reminder', body: 'Reminders are working.', sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: 'meds' },
  });
}
