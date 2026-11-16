import React, { useState } from 'react';
import { Text } from 'react-native';
import { BarChart } from '../components/charts';
import { DateField } from '../components/DateField';
import { Button, Card, Chips, Empty, Field, H2, ListItem, notify, Progress, Row, Screen, Sub } from '../components/ui';
import { useNav } from '../nav';
import { kcalOn, series } from '../selectors';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { isValidDate, normalizeTime, isValidTime, nowTime, num, prettyDate, sortByDateDesc, today, uid } from '../utils';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Drink'] as const;

export default function Calories() {
  const t = useTheme();
  const nav = useNav();
  const { profile, data, add, remove } = useStore();
  const [label, setLabel] = useState('');
  const [kcal, setKcal] = useState('');
  const [meal, setMeal] = useState<string>('Breakfast');
  const [date, setDate] = useState(today());
  const [time, setTime] = useState(nowTime());
  if (!profile) return null;
  const target = profile.targets.calories;
  const todayK = kcalOn(data, today());
  const left = target - todayK;
  const recent = [...new Map(sortByDateDesc(data.calories).map((c) => [c.label.toLowerCase(), c])).values()].slice(0, 8);

  const save = () => {
    const k = Math.round(num(kcal));
    const tm = normalizeTime(time);
    if (k <= 0 || !isValidDate(date) || !isValidTime(tm)) return notify('Enter calories, a valid date and time (HH:MM).');
    add('calories', { id: uid(), date, time: tm, kcal: k, label: label.trim() || meal, meal });
    setLabel('');
    setKcal('');
  };

  return (
    <Screen title="Calories" onBack={nav.back}>
      <Card>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
          <Text style={{ color: t.text, fontSize: 32, fontWeight: '800' }}>
            {todayK} <Text style={{ color: t.sub, fontSize: 16, fontWeight: '500' }}>/ {target} kcal</Text>
          </Text>
          <Sub style={{ color: left >= 0 ? t.success : t.danger, fontWeight: '700' }}>{left >= 0 ? `${left} left` : `${-left} over`}</Sub>
        </Row>
        <Progress value={todayK / target} color={left >= 0 ? t.accent.calories : t.danger} />
      </Card>

      <Card>
        <H2>Add food</H2>
        <Chips options={MEALS} value={meal} onChange={setMeal} color={t.accent.calories} />
        <Row>
          <Field label="Food" value={label} onChangeText={setLabel} placeholder="e.g. 2 dosa" style={{ flex: 2 }} />
          <Field label="kcal" value={kcal} onChangeText={setKcal} keyboardType="number-pad" placeholder="300" />
        </Row>
        <Row style={{ alignItems: 'flex-start' }}>
          <DateField value={date} onChange={setDate} />
          <Field label="Time" value={time} onChangeText={setTime} maxLength={5} style={{ flexGrow: 0, flexBasis: 92 }} />
        </Row>
        <Button title="Add" color={t.accent.calories} onPress={save} />
        {recent.length > 0 && (
          <>
            <Sub style={{ marginTop: 14, marginBottom: 8 }}>Quick add again</Sub>
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {recent.map((r) => (
                <Button
                  key={r.id}
                  small
                  variant="soft"
                  color={t.accent.calories}
                  title={`${r.label} · ${r.kcal}`}
                  onPress={() => add('calories', { ...r, id: uid(), date: today(), time: nowTime() })}
                />
              ))}
            </Row>
          </>
        )}
      </Card>

      <Card>
        <H2>Last 7 days</H2>
        <BarChart data={series(7, (d) => kcalOn(data, d))} target={target} color={t.accent.calories} />
      </Card>

      <Card>
        <H2>Log</H2>
        {data.calories.length === 0 && <Empty text="Nothing logged yet." />}
        {sortByDateDesc(data.calories)
          .slice(0, 50)
          .map((c) => (
            <ListItem
              key={c.id}
              title={c.label}
              subtitle={`${prettyDate(c.date)} ${c.time} · ${c.meal}`}
              right={`${c.kcal} kcal`}
              onDelete={() => remove('calories', c.id)}
            />
          ))}
      </Card>
    </Screen>
  );
}
