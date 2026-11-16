export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const pad = (n: number) => String(n).padStart(2, '0');

export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => toISODate(new Date());
export const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const addDays = (iso: string, days: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toISODate(dt);
};

export const daysBetween = (a: string, b: string) => {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
};

export const lastNDays = (n: number, end = today()) =>
  Array.from({ length: n }, (_, i) => addDays(end, i - (n - 1)));

export const isValidDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());
export const isValidTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

export const normalizeTime = (s: string) => {
  const m = s.trim().match(/^(\d{1,2})[:.]?(\d{2})$/);
  if (!m) return s.trim();
  return `${pad(Number(m[1]))}:${m[2]}`;
};

export const timeToMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
export const minToTime = (min: number) => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;

/** Reminder times after `start` up to and including `end`, every `interval` minutes. */
export const intervalSlots = (start: string, end: string, interval: number) => {
  const out: string[] = [];
  if (!isValidTime(start) || !isValidTime(end)) return out;
  const s = timeToMin(start);
  const e = timeToMin(end);
  if (interval < 5 || e <= s) return out;
  for (let t = s + interval; t <= e; t += interval) out.push(minToTime(t));
  return out;
};

export const sleepHours = (bed: string, wake: string) => {
  let diff = timeToMin(wake) - timeToMin(bed);
  if (diff <= 0) diff += 24 * 60;
  return Math.round((diff / 60) * 10) / 10;
};

export const prettyDate = (iso: string) => {
  const t = today();
  if (iso === t) return 'Today';
  if (iso === addDays(t, -1)) return 'Yesterday';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: y === new Date().getFullYear() ? undefined : 'numeric',
  });
};

export const shortDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'narrow' });
};

export const bmi = (kg: number, cm: number) => (cm > 0 ? kg / Math.pow(cm / 100, 2) : 0);

export const num = (s: string) => {
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? 0 : n;
};

export const sumBy = <T,>(arr: T[], f: (x: T) => number) => arr.reduce((a, x) => a + f(x), 0);

export const sortByDateDesc = <T extends { date: string; time?: string }>(arr: T[]) =>
  [...arr].sort((a, b) => (b.date + (b.time ?? '')).localeCompare(a.date + (a.time ?? '')));
