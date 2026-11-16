import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { LineChart } from '../components/charts';
import { DateField } from '../components/DateField';
import { Button, Card, Chips, Empty, Field, H2, ListItem, notify, Row, Screen, Sub } from '../components/ui';
import { useNav } from '../nav';
import { latestVital } from '../selectors';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { VitalEntry, VitalType } from '../types';
import { isValidDate, isValidTime, normalizeTime, nowTime, num, prettyDate, today, uid } from '../utils';
import { classifyVital, formatVital, Level, VITALS } from '../vitals';

const TYPES = Object.keys(VITALS) as VitalType[];
const CONTEXTS = ['fasting', 'post-meal', 'random'] as const;

export default function Vitals({ initial = 'bp' }: { initial?: VitalType }) {
  const t = useTheme();
  const nav = useNav();
  const { data, add, remove } = useStore();
  const [type, setType] = useState<VitalType>(initial);
  const [v1, setV1] = useState('');
  const [v2, setV2] = useState('');
  const [ctx, setCtx] = useState<(typeof CONTEXTS)[number]>('fasting');
  const [date, setDate] = useState(today());
  const [time, setTime] = useState(nowTime());
  const [notes, setNotes] = useState('');
  const meta = VITALS[type];
  const levelColor = (l: Level) => (l === 'good' ? t.success : l === 'warn' ? t.warning : t.danger);
  const list = data.vitals.filter((v) => v.type === type).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const chrono = [...list].reverse().slice(-30);

  const save = () => {
    const a = num(v1);
    const b = num(v2);
    const tm = normalizeTime(time);
    if (a <= 0 || (type === 'bp' && b <= 0)) return notify(type === 'bp' ? 'Enter systolic and diastolic values.' : 'Enter a value.');
    if (!isValidDate(date) || !isValidTime(tm)) return notify('Enter a valid date and time.');
    const e: VitalEntry = { id: uid(), date, time: tm, type, value: a, value2: type === 'bp' ? b : undefined, context: type === 'sugar' ? ctx : undefined, notes: notes.trim() };
    add('vitals', e);
    const c = classifyVital(e);
    if (c.level === 'bad') notify(`${meta.label}: ${c.text}`, 'This reading is outside the usual range. If you feel unwell, contact a doctor.');
    setV1('');
    setV2('');
    setNotes('');
  };

  return (
    <Screen title="Vitals" onBack={nav.back}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {TYPES.map((k) => {
          const last = latestVital(data, k);
          const on = k === type;
          return (
            <Card key={k} onPress={() => setType(k)} style={{ width: '31%', flexGrow: 1, padding: 10, marginBottom: 0, borderColor: on ? VITALS[k].color : t.border, borderWidth: on ? 2 : 1 }}>
              <Text style={{ fontSize: 18 }}>{VITALS[k].icon}</Text>
              <Text style={{ color: t.text, fontWeight: '800', marginTop: 2 }}>{last ? formatVital(last) : '—'}</Text>
              <Sub style={{ fontSize: 11 }}>{VITALS[k].label}</Sub>
            </Card>
          );
        })}
      </View>

      <Card>
        <H2>
          {meta.icon} Add {meta.label.toLowerCase()}
        </H2>
        <Row>
          <Field label={type === 'bp' ? 'Systolic' : `Value (${meta.unit})`} value={v1} onChangeText={setV1} keyboardType="decimal-pad" placeholder={type === 'bp' ? '120' : type === 'temp' ? '36.8' : ''} />
          {type === 'bp' && <Field label="Diastolic" value={v2} onChangeText={setV2} keyboardType="decimal-pad" placeholder="80" />}
        </Row>
        {type === 'sugar' && <Chips options={CONTEXTS} value={ctx} onChange={setCtx} color={meta.color} />}
        <Row style={{ alignItems: 'flex-start' }}>
          <DateField value={date} onChange={setDate} />
          <Field label="Time" value={time} onChangeText={setTime} maxLength={5} style={{ flexGrow: 0, flexBasis: 92 }} />
        </Row>
        <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="e.g. after walk, left arm" />
        <Button title="Save reading" color={meta.color} onPress={save} />
      </Card>

      <Card>
        <H2>Trend ({meta.unit})</H2>
        <LineChart points={chrono.map((v) => ({ x: v.date, y: v.value }))} color={meta.color} />
        {type === 'bp' && chrono.length > 0 && <Sub style={{ marginTop: 4 }}>Line shows systolic (top number).</Sub>}
      </Card>

      <Card>
        <H2>Readings</H2>
        {list.length === 0 && <Empty text="No readings yet." />}
        {list.slice(0, 50).map((v) => {
          const c = classifyVital(v);
          return (
            <View key={v.id}>
              <ListItem
                title={`${formatVital(v)} ${meta.unit}`}
                subtitle={`${prettyDate(v.date)} ${v.time}${v.context ? ' · ' + v.context : ''}${v.notes ? ' · ' + v.notes : ''}`}
                right={c.text}
                onDelete={() => remove('vitals', v.id)}
              />
              <View style={{ position: 'absolute', left: -16, top: 14, width: 4, height: 28, borderRadius: 2, backgroundColor: levelColor(c.level) }} />
            </View>
          );
        })}
      </Card>
      <Sub style={{ textAlign: 'center' }}>Classifications follow common guidelines (e.g. AHA for BP) and are not a diagnosis.</Sub>
    </Screen>
  );
}
