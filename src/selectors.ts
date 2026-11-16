import { flagFor, testByKey } from './labs';
import { Appointment, CycleEntry, Medicine, Profile, ProfileData, Sex, VitalType } from './types';
import { addDays, daysBetween, lastNDays, nowTime, sumBy, today } from './utils';
import { classifyVital, formatVital, Level } from './vitals';

export const stepsOn = (d: ProfileData, date: string) => sumBy(d.steps.filter((s) => s.date === date), (s) => s.count);
export const kcalOn = (d: ProfileData, date: string) => sumBy(d.calories.filter((s) => s.date === date), (s) => s.kcal);
export const waterOn = (d: ProfileData, date: string) => sumBy(d.water.filter((s) => s.date === date), (s) => s.ml);
export const sleepOn = (d: ProfileData, date: string) => sumBy(d.sleep.filter((s) => s.date === date), (s) => s.hours);
export const workoutMinOn = (d: ProfileData, date: string) => sumBy(d.workouts.filter((s) => s.date === date), (s) => s.minutes);

export const series = (n: number, f: (date: string) => number) => lastNDays(n).map((date) => ({ date, value: f(date) }));

export const weekWorkoutMin = (d: ProfileData) => sumBy(lastNDays(7), (date) => workoutMinOn(d, date));

export const weightSeries = (d: ProfileData) => {
  const byDate = new Map<string, number>();
  for (const w of [...d.weight].sort((a, b) => a.date.localeCompare(b.date))) byDate.set(w.date, w.kg);
  return [...byDate.entries()].map(([x, y]) => ({ x, y }));
};

export const latestWeight = (d: ProfileData) => {
  const s = weightSeries(d);
  return s.length ? s[s.length - 1].y : null;
};

export interface Dose {
  med: Medicine;
  slot: string;
  taken: boolean;
  logId?: string;
}

export const dosesOn = (d: ProfileData, date = today()): Dose[] => {
  const out: Dose[] = [];
  for (const med of d.medicines.filter((m) => m.active)) {
    for (const slot of [...med.times].sort()) {
      const log = d.medLogs.find((l) => l.medId === med.id && l.date === date && l.slot === slot);
      out.push({ med, slot, taken: !!log, logId: log?.id });
    }
  }
  return out.sort((a, b) => a.slot.localeCompare(b.slot));
};

export const adherence = (d: ProfileData, meds: Medicine[], days = 7) => {
  let due = 0;
  let taken = 0;
  for (const date of lastNDays(days)) {
    for (const m of meds.filter((x) => x.active)) {
      for (const slot of m.times) {
        due++;
        if (d.medLogs.some((l) => l.medId === m.id && l.date === date && l.slot === slot)) taken++;
      }
    }
  }
  return due ? taken / due : 0;
};

export interface CycleStats {
  avgLength: number | null;
  lastStart: string | null;
  cycleDay: number | null;
  nextStart: string | null;
  daysUntilNext: number | null;
  lengths: number[];
}

export const cycleStats = (cycles: CycleEntry[]): CycleStats => {
  const starts = [...cycles].map((c) => c.startDate).sort();
  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i++) lengths.push(daysBetween(starts[i - 1], starts[i]));
  const recent = lengths.slice(-6);
  const avgLength = recent.length ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length) : null;
  const lastStart = starts.length ? starts[starts.length - 1] : null;
  const cycleDay = lastStart ? daysBetween(lastStart, today()) + 1 : null;
  const nextStart = lastStart ? addDays(lastStart, avgLength ?? 28) : null;
  const daysUntilNext = nextStart ? daysBetween(today(), nextStart) : null;
  return { avgLength, lastStart, cycleDay, nextStart, daysUntilNext, lengths };
};

export interface LabPoint { date: string; value: number; source: string }

/** All recorded values of one test, oldest first (check-ups plus the quick thyroid log for TSH/T3/T4). */
export const labHistory = (d: ProfileData, key: string): LabPoint[] => {
  const out: LabPoint[] = [];
  for (const c of d.checkups) if (c.values[key] != null) out.push({ date: c.date, value: c.values[key], source: c.title || 'Check-up' });
  const quick: Record<string, (l: ProfileData['labs'][number]) => number | undefined> = { tsh: (l) => l.tsh, ft3: (l) => l.t3, ft4: (l) => l.t4 };
  if (quick[key]) for (const l of d.labs) { const v = quick[key](l); if (v != null) out.push({ date: l.date, value: v, source: 'Thyroid log' }); }
  return out.sort((a, b) => a.date.localeCompare(b.date));
};

export const latestLabValues = (d: ProfileData) => {
  const latest: Record<string, LabPoint> = {};
  const keys = new Set<string>(d.checkups.flatMap((c) => Object.keys(c.values)));
  if (d.labs.length) ['tsh', 'ft3', 'ft4'].forEach((k) => keys.add(k));
  for (const k of keys) {
    const h = labHistory(d, k);
    if (h.length) latest[k] = h[h.length - 1];
  }
  return latest;
};

export const abnormalLabs = (d: ProfileData, sex: Sex) =>
  Object.entries(latestLabValues(d))
    .map(([key, p]) => ({ key, ...p, flag: flagFor(key, p.value, sex) }))
    .filter((x) => x.flag === 'low' || x.flag === 'high');

const apptTs = (a: Appointment) => `${a.date} ${a.time || '00:00'}`;
export const upcomingAppointments = (d: ProfileData) =>
  d.appointments.filter((a) => !a.done && a.date >= today()).sort((a, b) => apptTs(a).localeCompare(apptTs(b)));

export const latestVital = (d: ProfileData, type: VitalType) =>
  [...d.vitals].filter((v) => v.type === type).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0];

export interface Insight { icon: string; text: string; level: Level }

/** Simple rule-based nudges; deliberately conservative and never diagnostic. */
export const insights = (p: Profile, d: ProfileData): Insight[] => {
  const out: Insight[] = [];
  const t = today();
  const hour = new Date().getHours();
  const tg = p.targets;
  const due = dosesOn(d, t);
  const missed = due.filter((x) => !x.taken && x.slot < nowTime());
  if (missed.length) out.push({ icon: '💊', text: `${missed.length} medicine dose${missed.length > 1 ? 's' : ''} not marked as taken yet today.`, level: 'warn' });
  if (hour >= 14 && waterOn(d, t) < tg.waterMl * 0.4) out.push({ icon: '💧', text: `Only ${waterOn(d, t)} ml water so far — try a glass now.`, level: 'warn' });
  const bp = latestVital(d, 'bp');
  if (bp && daysBetween(bp.date, t) <= 14) {
    const c = classifyVital(bp);
    if (c.level !== 'good') out.push({ icon: '🩺', text: `Last BP ${formatVital(bp)} — ${c.text}. Keep monitoring and discuss with your doctor.`, level: c.level });
  }
  const sugar = latestVital(d, 'sugar');
  if (sugar && daysBetween(sugar.date, t) <= 14) {
    const c = classifyVital(sugar);
    if (c.level !== 'good') out.push({ icon: '🩸', text: `Last ${sugar.context ?? ''} sugar ${sugar.value} mg/dL — ${c.text}.`, level: c.level });
  }
  for (const a of abnormalLabs(d, p.sex).slice(0, 3)) {
    const test = testByKey[a.key];
    if (test) out.push({ icon: '🧪', text: `${test.name} was ${a.flag} (${a.value} ${test.unit}) on ${a.date}.`, level: 'warn' });
  }
  const lastCheck = [...d.checkups].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!lastCheck) out.push({ icon: '📋', text: 'No full health check-up recorded. Add your latest report to track trends.', level: 'warn' });
  else if (daysBetween(lastCheck.date, t) > 365) out.push({ icon: '📋', text: `Last full check-up was ${Math.floor(daysBetween(lastCheck.date, t) / 30)} months ago — an annual check-up is a good habit.`, level: 'warn' });
  const next = upcomingAppointments(d)[0];
  if (next && daysBetween(t, next.date) <= 3) out.push({ icon: '📅', text: `Appointment ${next.date === t ? 'today' : 'on ' + next.date} ${next.time} with ${next.doctor || 'doctor'}.`, level: 'good' });
  for (const v of d.vaccines) {
    if (v.nextDue && v.nextDue >= t && daysBetween(t, v.nextDue) <= 14) out.push({ icon: '💉', text: `${v.name} due on ${v.nextDue}.`, level: 'good' });
    else if (v.nextDue && v.nextDue < t && daysBetween(v.nextDue, t) < 180) out.push({ icon: '💉', text: `${v.name} was due on ${v.nextDue}.`, level: 'warn' });
  }
  const week = lastNDays(7);
  const avgSteps = week.reduce((a, x) => a + stepsOn(d, x), 0) / 7;
  if (avgSteps >= tg.steps) out.push({ icon: '🏆', text: `Great week — averaging ${Math.round(avgSteps).toLocaleString()} steps a day.`, level: 'good' });
  const sleeps = week.map((x) => sleepOn(d, x)).filter((h) => h > 0);
  if (sleeps.length >= 3 && sleeps.reduce((a, b) => a + b, 0) / sleeps.length < tg.sleepHours - 1)
    out.push({ icon: '😴', text: 'Averaging over an hour less sleep than your goal this week.', level: 'warn' });
  return out;
};
