import { AppState } from '../types';
import { addDays, intervalSlots, isValidDate, isValidTime } from '../utils';

const ts = (date: string, time: string) => {
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, mi).getTime();
};

export type ReminderKind = 'med' | 'water' | 'sit' | 'appointment' | 'vaccine';

export interface PlannedReminder {
  key: string;
  kind: ReminderKind;
  time: string; // HH:MM, repeats daily unless `at` is set
  /** One-off reminder at this timestamp (ms) instead of a daily repeat. */
  at?: number;
  title: string;
  body: string;
  data: { kind: ReminderKind; profileId: string; medId?: string; slot?: string };
}

/** iOS keeps at most 64 pending local notifications per app; stay under it. */
export const MAX_SCHEDULED = 60;

export function planReminders(state: AppState): PlannedReminder[] {
  const meds: PlannedReminder[] = [];
  const nudges: PlannedReminder[] = [];
  const once: PlannedReminder[] = [];
  const now = Date.now();
  const horizon = now + 60 * 86400000;
  const multi = state.profiles.length > 1;
  for (const p of state.profiles) {
    const who = multi ? ` (${p.name})` : '';
    const d = state.data[p.id];
    if (p.reminders.medicines && d) {
      for (const m of d.medicines) {
        if (!m.active) continue;
        for (const time of m.times) {
          if (!isValidTime(time)) continue;
          const verb = m.kind === 'eye drops' ? 'Put in' : 'Take';
          meds.push({
            key: `med-${p.id}-${m.id}-${time}`,
            kind: 'med',
            time,
            title: `💊 ${verb} ${m.name}${who}`,
            body: [m.dose, m.notes].filter(Boolean).join(' · ') || `Scheduled for ${time}`,
            data: { kind: 'med', profileId: p.id, medId: m.id, slot: time },
          });
        }
      }
    }
    if (p.reminders.appointments && d) {
      for (const a of d.appointments) {
        if (a.done || !isValidDate(a.date)) continue;
        const time = isValidTime(a.time) ? a.time : '09:00';
        const what = [a.doctor, a.specialty].filter(Boolean).join(' · ') || 'Doctor visit';
        const slots: [string, number, string][] = [
          ['eve', ts(addDays(a.date, -1), '20:00'), `Tomorrow ${time}`],
          ['soon', ts(a.date, time) - 2 * 3600000, `Today at ${time}`],
        ];
        for (const [tag, at, when] of slots) {
          if (at <= now || at > horizon) continue;
          once.push({
            key: `appt-${p.id}-${a.id}-${tag}`,
            kind: 'appointment',
            time,
            at,
            title: `📅 ${what}${who}`,
            body: `${when}${a.place ? ' · ' + a.place : ''}${a.reason ? ' · ' + a.reason : ''}`,
            data: { kind: 'appointment', profileId: p.id },
          });
        }
      }
      for (const v of d.vaccines) {
        if (!isValidDate(v.nextDue)) continue;
        const at = ts(v.nextDue, '09:00');
        if (at <= now || at > horizon) continue;
        once.push({
          key: `vac-${p.id}-${v.id}`,
          kind: 'vaccine',
          time: '09:00',
          at,
          title: `💉 ${v.name} due today${who}`,
          body: v.dose ? `Next dose: ${v.dose}` : 'Vaccine / booster due',
          data: { kind: 'vaccine', profileId: p.id },
        });
      }
    }
    const { water, sit } = p.reminders;
    if (water.enabled) {
      for (const time of intervalSlots(water.start, water.end, water.intervalMin)) {
        nudges.push({
          key: `water-${p.id}-${time}`,
          kind: 'water',
          time,
          title: `💧 Water break${who}`,
          body: `Have a glass of water (${p.targets.glassMl} ml). Daily goal: ${p.targets.waterMl} ml.`,
          data: { kind: 'water', profileId: p.id },
        });
      }
    }
    if (sit.enabled) {
      for (const time of intervalSlots(sit.start, sit.end, sit.intervalMin)) {
        nudges.push({
          key: `sit-${p.id}-${time}`,
          kind: 'sit',
          time,
          title: `🚶 Time to move${who}`,
          body: `You've been sitting for ${sit.intervalMin} min. Stand up, stretch or walk for 2–3 minutes.`,
          data: { kind: 'sit', profileId: p.id },
        });
      }
    }
  }
  nudges.sort((a, b) => a.time.localeCompare(b.time));
  once.sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  return [...meds, ...once, ...nudges];
}
