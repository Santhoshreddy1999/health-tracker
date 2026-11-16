import React, { useState } from 'react';
import { BarChart } from '../components/charts';
import { DateField } from '../components/DateField';
import { Button, Card, Chips, Empty, Field, H2, ListItem, notify, Row, Screen, Stat } from '../components/ui';
import { useNav } from '../nav';
import { series, sleepOn } from '../selectors';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { isValidDate, isValidTime, lastNDays, normalizeTime, prettyDate, sleepHours, sortByDateDesc, today, uid } from '../utils';

const QUALITY = [
  { value: '1', label: '😫 1' },
  { value: '2', label: '😕 2' },
  { value: '3', label: '😐 3' },
  { value: '4', label: '🙂 4' },
  { value: '5', label: '😄 5' },
];

export default function Sleep() {
  const t = useTheme();
  const nav = useNav();
  const { profile, data, add, remove } = useStore();
  const [bed, setBed] = useState('23:00');
  const [wake, setWake] = useState('06:30');
  const [quality, setQuality] = useState('4');
  const [date, setDate] = useState(today());
  if (!profile) return null;
  const target = profile.targets.sleepHours;
  const week = lastNDays(7).map((d) => sleepOn(data, d)).filter((h) => h > 0);
  const avg = week.length ? week.reduce((a, b) => a + b, 0) / week.length : 0;
  const recent = data.sleep.filter((s) => lastNDays(7).includes(s.date));
  const avgQ = recent.length ? recent.reduce((a, s) => a + s.quality, 0) / recent.length : 0;

  const save = () => {
    const b = normalizeTime(bed);
    const w = normalizeTime(wake);
    if (!isValidTime(b) || !isValidTime(w) || !isValidDate(date)) return notify('Use HH:MM for times and a valid date.');
    add('sleep', { id: uid(), date, bedtime: b, wake: w, hours: sleepHours(b, w), quality: Number(quality) });
  };

  return (
    <Screen title="Sleep" onBack={nav.back}>
      <Card>
        <Row>
          <Stat label="Last night" value={`${sleepOn(data, today()) || '—'}h`} color={t.accent.sleep} />
          <Stat label="7-day avg" value={avg ? `${avg.toFixed(1)}h` : '—'} />
          <Stat label="Avg quality" value={avgQ ? `${avgQ.toFixed(1)}/5` : '—'} />
          <Stat label="Goal" value={`${target}h`} color={t.success} />
        </Row>
      </Card>

      <Card>
        <H2>Log sleep</H2>
        <Row>
          <Field label="Bedtime" value={bed} onChangeText={setBed} maxLength={5} />
          <Field label="Woke up" value={wake} onChangeText={setWake} maxLength={5} />
        </Row>
        <DateField label="Wake-up date" value={date} onChange={setDate} />
        <Chips options={QUALITY} value={quality} onChange={setQuality} color={t.accent.sleep} />
        <Button title={`Save · ${isValidTime(normalizeTime(bed)) && isValidTime(normalizeTime(wake)) ? sleepHours(normalizeTime(bed), normalizeTime(wake)) : '?'} h`} color={t.accent.sleep} onPress={save} />
      </Card>

      <Card>
        <H2>Last 7 nights (hours)</H2>
        <BarChart data={series(7, (d) => sleepOn(data, d))} target={target} color={t.accent.sleep} />
      </Card>

      <Card>
        <H2>History</H2>
        {data.sleep.length === 0 && <Empty text="No sleep logged yet." />}
        {sortByDateDesc(data.sleep)
          .slice(0, 40)
          .map((s) => (
            <ListItem
              key={s.id}
              title={`${s.hours} h · quality ${s.quality}/5`}
              subtitle={`${prettyDate(s.date)} · ${s.bedtime} → ${s.wake}`}
              onDelete={() => remove('sleep', s.id)}
            />
          ))}
      </Card>
    </Screen>
  );
}
