import React, { useState } from 'react';
import { DateField } from '../components/DateField';
import { LineChart } from '../components/charts';
import { Button, Card, Chips, Empty, Field, H2, ListItem, notify, Row, Screen, Stat, Sub } from '../components/ui';
import { useNav } from '../nav';
import { weightSeries } from '../selectors';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { addDays, bmi, isValidDate, num, prettyDate, sortByDateDesc, today, uid } from '../utils';

const RANGES = [
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '365', label: '1 year' },
  { value: 'all', label: 'All' },
];

const bmiLabel = (b: number) => (b < 18.5 ? 'Underweight' : b < 25 ? 'Healthy' : b < 30 ? 'Overweight' : 'Obese');

export default function Weight() {
  const t = useTheme();
  const nav = useNav();
  const { profile, data, add, remove, saveProfile } = useStore();
  const [kg, setKg] = useState('');
  const [date, setDate] = useState(today());
  const [range, setRange] = useState('90');
  const [target, setTarget] = useState(String(profile?.targets.weightKg ?? ''));
  if (!profile) return null;
  const all = weightSeries(data);
  const pts = range === 'all' ? all : all.filter((p) => p.x >= addDays(today(), -Number(range)));
  const current = all.length ? all[all.length - 1].y : null;
  const first = pts.length ? pts[0].y : null;
  const goal = profile.targets.weightKg;
  const b = current ? bmi(current, profile.heightCm) : 0;

  const save = () => {
    const v = num(kg);
    if (v <= 0 || !isValidDate(date)) return notify('Enter your weight in kg and a valid date.');
    add('weight', { id: uid(), date, kg: Math.round(v * 10) / 10 });
    setKg('');
  };

  return (
    <Screen title="Weight" onBack={nav.back}>
      <Card>
        <Row>
          <Stat label="Current" value={current ? `${current} kg` : '—'} color={t.accent.weight} />
          <Stat label="Target" value={`${goal} kg`} color={t.success} />
          <Stat label="To go" value={current ? `${Math.abs(current - goal).toFixed(1)} kg` : '—'} />
        </Row>
        <Row style={{ marginTop: 12, justifyContent: 'center' }}>
          {current ? (
            <Sub>
              BMI {b.toFixed(1)} ({bmiLabel(b)}) · change in range: {first != null ? `${current - first >= 0 ? '+' : ''}${(current - first).toFixed(1)} kg` : '—'}
            </Sub>
          ) : (
            <Sub>Log your first weight below.</Sub>
          )}
        </Row>
      </Card>

      <Card>
        <H2>Trend</H2>
        <Chips options={RANGES} value={range} onChange={setRange} color={t.accent.weight} />
        <LineChart points={pts} target={goal} color={t.accent.weight} unit=" kg" />
      </Card>

      <Card>
        <H2>Log weight</H2>
        <Field label="Weight (kg)" value={kg} onChangeText={setKg} keyboardType="decimal-pad" placeholder="e.g. 72.4" />
        <DateField value={date} onChange={setDate} />
        <Button title="Save weight" color={t.accent.weight} onPress={save} />
      </Card>

      <Card>
        <H2>Target weight</H2>
        <Row>
          <Field label="Target (kg)" value={target} onChangeText={setTarget} keyboardType="decimal-pad" />
          <Button
            title="Update"
            variant="soft"
            color={t.accent.weight}
            style={{ marginTop: 10 }}
            onPress={() => num(target) > 0 && saveProfile({ ...profile, targets: { ...profile.targets, weightKg: num(target) } })}
          />
        </Row>
      </Card>

      <Card>
        <H2>History</H2>
        {data.weight.length === 0 && <Empty text="No weight entries yet." />}
        {sortByDateDesc(data.weight)
          .slice(0, 60)
          .map((w) => (
            <ListItem key={w.id} title={`${w.kg} kg`} subtitle={prettyDate(w.date)} onDelete={() => remove('weight', w.id)} />
          ))}
      </Card>
    </Screen>
  );
}
