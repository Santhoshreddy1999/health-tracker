import React, { useState } from 'react';
import { LineChart } from '../components/charts';
import { DateField } from '../components/DateField';
import { Body, Button, Card, Empty, Field, H2, ListItem, notify, Row, Screen, Stat, Sub } from '../components/ui';
import { useNav } from '../nav';
import { adherence, dosesOn } from '../selectors';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { isValidDate, num, prettyDate, sortByDateDesc, today, uid, nowTime } from '../utils';

export default function Thyroid() {
  const t = useTheme();
  const nav = useNav();
  const { data, add, remove } = useStore();
  const [tsh, setTsh] = useState('');
  const [t3, setT3] = useState('');
  const [t4, setT4] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(today());
  const meds = data.medicines.filter((m) => m.tag === 'thyroid');
  const doses = dosesOn(data).filter((x) => x.med.tag === 'thyroid');
  const labs = [...data.labs].sort((a, b) => a.date.localeCompare(b.date));
  const last = labs[labs.length - 1];
  const inRange = (v: number) => v >= 0.4 && v <= 4.0;

  const save = () => {
    const v = num(tsh);
    if (v <= 0 || !isValidDate(date)) return notify('Enter a TSH value and a valid date.');
    add('labs', { id: uid(), date, tsh: v, t3: num(t3) || undefined, t4: num(t4) || undefined, notes: notes.trim() });
    setTsh('');
    setT3('');
    setT4('');
    setNotes('');
  };

  return (
    <Screen title="Thyroid" onBack={nav.back}>
      <Card>
        <Row>
          <Stat label="Last TSH (mIU/L)" value={last ? `${last.tsh}` : '—'} color={last ? (inRange(last.tsh) ? t.success : t.warning) : undefined} />
          <Stat label="Tested" value={last ? prettyDate(last.date) : '—'} />
          <Stat label="Tablet 7-day" value={meds.length ? `${Math.round(adherence(data, meds) * 100)}%` : '—'} color={t.accent.thyroid} />
        </Row>
        <Sub style={{ textAlign: 'center', marginTop: 10 }}>
          Typical adult TSH reference range is about 0.4–4.0 mIU/L; labs differ — follow your doctor’s target.
        </Sub>
      </Card>

      <Card>
        <H2>Thyroid medicine today</H2>
        {meds.length === 0 ? (
          <>
            <Sub>No thyroid medicine yet.</Sub>
            <Button
              title="+ Add thyroid tablet"
              variant="soft"
              color={t.accent.thyroid}
              style={{ marginTop: 10 }}
              onPress={() => nav.push({ name: 'medEdit', preset: 'thyroid' })}
            />
          </>
        ) : (
          doses.map((x) => (
            <Row key={x.med.id + x.slot} style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
              <Body>
                {x.slot} · {x.med.name} {x.med.dose}
              </Body>
              {x.taken ? (
                <Button small variant="soft" color={t.success} title="✓ Taken" onPress={() => x.logId && remove('medLogs', x.logId)} />
              ) : (
                <Button
                  small
                  color={t.accent.thyroid}
                  title="Mark taken"
                  onPress={() => add('medLogs', { id: uid(), medId: x.med.id, date: today(), time: nowTime(), slot: x.slot })}
                />
              )}
            </Row>
          ))
        )}
        <Sub style={{ marginTop: 8 }}>Tip: take levothyroxine on an empty stomach, apart from calcium/iron supplements, unless told otherwise.</Sub>
      </Card>

      <Card>
        <H2>TSH trend</H2>
        <LineChart points={labs.map((l) => ({ x: l.date, y: l.tsh }))} color={t.accent.thyroid} />
      </Card>

      <Card>
        <H2>Add lab result</H2>
        <Row>
          <Field label="TSH" value={tsh} onChangeText={setTsh} keyboardType="decimal-pad" placeholder="2.5" />
          <Field label="Free T3" value={t3} onChangeText={setT3} keyboardType="decimal-pad" placeholder="opt." />
          <Field label="Free T4" value={t4} onChangeText={setT4} keyboardType="decimal-pad" placeholder="opt." />
        </Row>
        <DateField label="Test date" value={date} onChange={setDate} />
        <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="e.g. dose changed to 75 mcg" />
        <Button title="Save result" color={t.accent.thyroid} onPress={save} />
      </Card>

      <Card>
        <H2>Lab history</H2>
        {labs.length === 0 && <Empty text="No lab values yet." />}
        {sortByDateDesc(labs).map((l) => (
          <ListItem
            key={l.id}
            title={`TSH ${l.tsh}${l.t3 ? ` · T3 ${l.t3}` : ''}${l.t4 ? ` · T4 ${l.t4}` : ''}`}
            subtitle={`${prettyDate(l.date)}${l.notes ? ' · ' + l.notes : ''}`}
            onDelete={() => remove('labs', l.id)}
          />
        ))}
      </Card>
    </Screen>
  );
}
