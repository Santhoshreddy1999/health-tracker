import React, { useState } from 'react';
import { Body, Button, Card, Chips, Empty, Field, H2, ListItem, notify, Row, Screen, Stat, Sub } from '../components/ui';
import { DateField } from '../components/DateField';
import { useNav } from '../nav';
import { cycleStats } from '../selectors';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { CycleEntry } from '../types';
import { daysBetween, isValidDate, prettyDate, sortByDateDesc, today, uid } from '../utils';

const SYMPTOMS = [
  'Cramps', 'Acne', 'Bloating', 'Fatigue', 'Mood swings', 'Hair fall', 'Excess hair growth',
  'Cravings', 'Headache', 'Spotting', 'Breast tenderness', 'Weight gain', 'Anxiety', 'Poor sleep',
];
const FLOWS: CycleEntry['flow'][] = ['light', 'medium', 'heavy'];

export default function Pcos() {
  const t = useTheme();
  const nav = useNav();
  const { data, add, update, remove } = useStore();
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState('');
  const [flow, setFlow] = useState<CycleEntry['flow']>('medium');
  const [symDate, setSymDate] = useState(today());
  const [syms, setSyms] = useState<string[]>([]);
  const [symNotes, setSymNotes] = useState('');
  const s = cycleStats(data.cycles);
  const open = sortByDateDesc(data.cycles.map((c) => ({ ...c, date: c.startDate }))).find((c) => !c.endDate);
  const irregular = s.lengths.length >= 2 && (Math.max(...s.lengths) - Math.min(...s.lengths) > 7 || (s.avgLength ?? 28) > 35);

  const saveCycle = () => {
    if (!isValidDate(start) || (end && !isValidDate(end))) return notify('Enter valid dates (YYYY-MM-DD).');
    add('cycles', { id: uid(), startDate: start, endDate: end, flow, notes: '' });
    setEnd('');
  };
  const saveSymptoms = () => {
    if (!syms.length || !isValidDate(symDate)) return notify('Pick at least one symptom.');
    add('symptoms', { id: uid(), date: symDate, symptoms: syms, notes: symNotes.trim() });
    setSyms([]);
    setSymNotes('');
  };

  return (
    <Screen title="PCOS & cycle" onBack={nav.back}>
      <Card>
        <Row>
          <Stat label="Cycle day" value={s.cycleDay ? `${s.cycleDay}` : '—'} color={t.accent.pcos} />
          <Stat label="Avg length" value={s.avgLength ? `${s.avgLength} d` : '—'} />
          <Stat
            label="Next period (est.)"
            value={s.nextStart ? (s.daysUntilNext! >= 0 ? `in ${s.daysUntilNext} d` : `${-s.daysUntilNext!} d late`) : '—'}
          />
        </Row>
        {s.nextStart && <Sub style={{ textAlign: 'center', marginTop: 10 }}>Predicted around {prettyDate(s.nextStart)} — PCOS cycles vary, treat this as a rough guide.</Sub>}
        {irregular && <Sub style={{ textAlign: 'center', marginTop: 6, color: t.warning }}>Your cycles look irregular (long or varying). Worth sharing with your doctor.</Sub>}
      </Card>

      {open && (
        <Card>
          <Body>Period started {prettyDate(open.startDate)} — still ongoing?</Body>
          <Button
            title="Mark ended today"
            variant="soft"
            color={t.accent.pcos}
            style={{ marginTop: 10 }}
            onPress={() => {
              const { date: _d, ...c } = open;
              update('cycles', { ...c, endDate: today() });
            }}
          />
        </Card>
      )}

      <Card>
        <H2>Log period</H2>
        <DateField label="Start date" value={start} onChange={setStart} />
        <Field label="End date (optional, YYYY-MM-DD)" value={end} onChangeText={setEnd} maxLength={10} placeholder="leave blank if ongoing" />
        <Chips options={FLOWS} value={flow} onChange={setFlow} color={t.accent.pcos} />
        <Button title="Save period" color={t.accent.pcos} onPress={saveCycle} />
      </Card>

      <Card>
        <H2>Log symptoms</H2>
        <Chips options={SYMPTOMS} value={syms} onChange={setSyms} multi color={t.accent.pcos} />
        <Row style={{ alignItems: 'flex-start' }}>
          <DateField value={symDate} onChange={setSymDate} />
        </Row>
        <Field label="Notes" value={symNotes} onChangeText={setSymNotes} placeholder="optional" />
        <Button title="Save symptoms" variant="soft" color={t.accent.pcos} onPress={saveSymptoms} />
      </Card>

      <Card>
        <H2>Cycle history</H2>
        {data.cycles.length === 0 && <Empty text="No periods logged yet." />}
        {[...data.cycles]
          .sort((a, b) => b.startDate.localeCompare(a.startDate))
          .map((c, i, arr) => {
            const prev = arr[i + 1];
            const len = prev ? daysBetween(prev.startDate, c.startDate) : null;
            return (
              <ListItem
                key={c.id}
                title={`${prettyDate(c.startDate)}${c.endDate ? ' → ' + prettyDate(c.endDate) : ' (ongoing)'}`}
                subtitle={`${c.flow} flow${c.endDate ? ` · ${daysBetween(c.startDate, c.endDate) + 1} days` : ''}${len ? ` · cycle ${len} d` : ''}`}
                onDelete={() => remove('cycles', c.id)}
              />
            );
          })}
      </Card>

      <Card>
        <H2>Symptom history</H2>
        {data.symptoms.length === 0 && <Empty text="No symptoms logged yet." />}
        {sortByDateDesc(data.symptoms)
          .slice(0, 40)
          .map((x) => (
            <ListItem
              key={x.id}
              title={x.symptoms.join(', ')}
              subtitle={`${prettyDate(x.date)}${x.notes ? ' · ' + x.notes : ''}`}
              onDelete={() => remove('symptoms', x.id)}
            />
          ))}
      </Card>
    </Screen>
  );
}
