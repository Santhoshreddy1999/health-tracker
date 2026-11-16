import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { BarChart } from '../components/charts';
import { DateField } from '../components/DateField';
import { Button, Card, Field, H2, ListItem, notify, Ring, Row, Screen, Stat, Sub, Empty } from '../components/ui';
import { PedometerStatus } from '../hooks/usePedometer';
import { useNav } from '../nav';
import { series, stepsOn } from '../selectors';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { isValidDate, lastNDays, num, prettyDate, sortByDateDesc, today, uid } from '../utils';

const statusText: Record<PedometerStatus, string> = {
  checking: 'Checking for step sensor…',
  active: 'Step sensor active — steps are counted automatically while the app runs (iPhone: whole day via Motion data).',
  unavailable: 'No step sensor here (e.g. web/desktop). Add steps manually or copy them from your phone’s health app.',
  denied: 'Motion/activity permission denied. Enable it in system settings to count steps automatically.',
};

export default function Steps({ pedometer }: { pedometer: PedometerStatus }) {
  const t = useTheme();
  const nav = useNav();
  const { profile, data, add, remove } = useStore();
  const [count, setCount] = useState('');
  const [date, setDate] = useState(today());
  if (!profile) return null;
  const target = profile.targets.steps;
  const todaySteps = stepsOn(data, today());
  const week = lastNDays(7).map((d) => stepsOn(data, d));
  const avg = Math.round(week.reduce((a, b) => a + b, 0) / 7);
  const hitDays = week.filter((s) => s >= target).length;

  const save = () => {
    const n = Math.round(num(count));
    if (n <= 0 || !isValidDate(date)) return notify('Enter a step count and a valid date.');
    add('steps', { id: uid(), date, count: n, source: 'manual' });
    setCount('');
  };

  return (
    <Screen title="Steps" onBack={nav.back}>
      <Card style={{ alignItems: 'center' }}>
        <Ring progress={todaySteps / target} color={t.accent.steps} size={160} stroke={14}>
          <Text style={{ color: t.text, fontSize: 30, fontWeight: '800' }}>{todaySteps.toLocaleString()}</Text>
          <Sub>of {target.toLocaleString()}</Sub>
        </Ring>
        <Row style={{ marginTop: 16, alignSelf: 'stretch' }}>
          <Stat label="7-day avg" value={avg.toLocaleString()} />
          <Stat label="Goal days" value={`${hitDays}/7`} color={t.success} />
          <Stat label="km (est.)" value={((todaySteps * 0.76) / 1000).toFixed(1)} />
        </Row>
        <Sub style={{ marginTop: 12, textAlign: 'center' }}>{statusText[pedometer]}</Sub>
      </Card>

      <Card>
        <H2>Add steps manually</H2>
        <Row>
          <Field label="Steps" value={count} onChangeText={setCount} keyboardType="number-pad" placeholder="e.g. 2500" />
        </Row>
        <DateField value={date} onChange={setDate} />
        <Button title="Add steps" color={t.accent.steps} onPress={save} />
      </Card>

      <Card>
        <H2>Last 7 days</H2>
        <BarChart data={series(7, (d) => stepsOn(data, d))} target={target} color={t.accent.steps} />
      </Card>

      <Card>
        <H2>History</H2>
        {data.steps.length === 0 && <Empty text="No steps logged yet." />}
        {sortByDateDesc(data.steps)
          .slice(0, 40)
          .map((s) => (
            <ListItem
              key={s.id}
              title={`${s.count.toLocaleString()} steps`}
              subtitle={`${prettyDate(s.date)} · ${s.source === 'pedometer' ? 'sensor' : 'manual'}`}
              onDelete={() => remove('steps', s.id)}
            />
          ))}
      </Card>
      <View />
    </Screen>
  );
}
