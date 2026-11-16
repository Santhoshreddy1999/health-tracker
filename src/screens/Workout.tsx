import React, { useState } from 'react';
import { Text } from 'react-native';
import { BarChart } from '../components/charts';
import { DateField } from '../components/DateField';
import { Button, Card, Chips, Empty, Field, H2, ListItem, notify, Progress, Row, Screen, Sub } from '../components/ui';
import { useNav } from '../nav';
import { series, weekWorkoutMin, workoutMinOn } from '../selectors';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { isValidDate, num, prettyDate, sortByDateDesc, today, uid } from '../utils';

const TYPES = ['Gym – strength', 'Cardio', 'Running', 'Walking', 'Cycling', 'Yoga', 'Swimming', 'Sports', 'Other'] as const;

export default function Workout() {
  const t = useTheme();
  const nav = useNav();
  const { profile, data, add, remove } = useStore();
  const [type, setType] = useState<string>('Gym – strength');
  const [minutes, setMinutes] = useState('45');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(today());
  if (!profile) return null;
  const goal = profile.targets.workoutMinPerWeek;
  const week = weekWorkoutMin(data);

  const save = () => {
    const m = Math.round(num(minutes));
    if (m <= 0 || !isValidDate(date)) return notify('Enter minutes and a valid date.');
    add('workouts', { id: uid(), date, type, minutes: m, notes: notes.trim() });
    setNotes('');
  };

  return (
    <Screen title="Gym & workouts" onBack={nav.back}>
      <Card>
        <Text style={{ color: t.text, fontSize: 30, fontWeight: '800' }}>
          {week} <Text style={{ color: t.sub, fontSize: 16, fontWeight: '500' }}>/ {goal} min this week</Text>
        </Text>
        <Progress value={week / goal} color={t.accent.workout} />
        <Sub style={{ marginTop: 8 }}>WHO suggests 150–300 min of moderate activity per week plus 2 strength days.</Sub>
      </Card>

      <Card>
        <H2>Log workout</H2>
        <Chips options={TYPES} value={type} onChange={setType} color={t.accent.workout} />
        <Row>
          <Field label="Minutes" value={minutes} onChangeText={setMinutes} keyboardType="number-pad" />
          <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="e.g. Chest + triceps, 3x10" style={{ flex: 2 }} />
        </Row>
        <DateField value={date} onChange={setDate} />
        <Button title="Save workout" color={t.accent.workout} onPress={save} />
      </Card>

      <Card>
        <H2>Last 7 days (min)</H2>
        <BarChart data={series(7, (d) => workoutMinOn(data, d))} color={t.accent.workout} />
      </Card>

      <Card>
        <H2>History</H2>
        {data.workouts.length === 0 && <Empty text="No workouts yet." />}
        {sortByDateDesc(data.workouts)
          .slice(0, 50)
          .map((w) => (
            <ListItem
              key={w.id}
              title={w.type}
              subtitle={`${prettyDate(w.date)}${w.notes ? ' · ' + w.notes : ''}`}
              right={`${w.minutes} min`}
              onDelete={() => remove('workouts', w.id)}
            />
          ))}
      </Card>
    </Screen>
  );
}
