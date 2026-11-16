import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Chips, Field, H2, Label, notify, confirmAsync, Row, Screen, Sub, Toggle } from '../components/ui';
import { useNav } from '../nav';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { Medicine, MedKind } from '../types';
import { isValidTime, normalizeTime, uid } from '../utils';

const KINDS: MedKind[] = ['tablet', 'capsule', 'eye drops', 'syrup', 'injection', 'other'];
const TAGS = [
  { value: '', label: 'General' },
  { value: 'thyroid', label: '🦋 Thyroid' },
  { value: 'pcos', label: '🌸 PCOS' },
  { value: 'eye', label: '👁️ Eye' },
];

const presets: Record<'thyroid' | 'eye', Partial<Medicine>> = {
  thyroid: { name: 'Thyroid tablet (Levothyroxine)', dose: '50 mcg', kind: 'tablet', times: ['06:30'], tag: 'thyroid', notes: 'Empty stomach, 30–60 min before breakfast' },
  eye: { name: 'Eye drops', dose: '1 drop each eye', kind: 'eye drops', times: ['09:00', '14:00', '21:00'], tag: 'eye', notes: '' },
};

export default function MedEdit({ id, preset }: { id?: string; preset?: 'thyroid' | 'eye' }) {
  const t = useTheme();
  const nav = useNav();
  const { data, add, update, remove, mutate } = useStore();
  const existing = data.medicines.find((m) => m.id === id);
  const [m, setM] = useState<Medicine>(
    existing ?? { id: uid(), name: '', dose: '', kind: 'tablet', times: ['08:00'], notes: '', tag: '', active: true, ...(preset ? presets[preset] : {}) },
  );
  const [newTime, setNewTime] = useState('');
  const set = (p: Partial<Medicine>) => setM((x) => ({ ...x, ...p }));

  const addTime = () => {
    const tm = normalizeTime(newTime);
    if (!isValidTime(tm)) return notify('Enter time as HH:MM (24h), e.g. 07:30 or 21:00.');
    if (!m.times.includes(tm)) set({ times: [...m.times, tm].sort() });
    setNewTime('');
  };

  const save = () => {
    if (!m.name.trim()) return notify('Give the medicine a name.');
    const clean = { ...m, name: m.name.trim(), times: m.times.filter(isValidTime) };
    existing ? update('medicines', clean) : add('medicines', clean);
    nav.back();
  };

  const del = async () => {
    if (!(await confirmAsync(`Delete ${m.name}?`, 'Its reminders and dose history will be removed.'))) return;
    remove('medicines', m.id);
    mutate((d) => ({ ...d, medLogs: d.medLogs.filter((l) => l.medId !== m.id) }));
    nav.back();
  };

  return (
    <Screen title={existing ? 'Edit medicine' : 'Add medicine'} onBack={nav.back}>
      <Card>
        <Field label="Name" value={m.name} onChangeText={(name) => set({ name })} placeholder="e.g. Thyronorm 50" />
        <Field label="Dose" value={m.dose} onChangeText={(dose) => set({ dose })} placeholder="e.g. 1 tablet / 2 drops" />
        <Label>Type</Label>
        <Chips options={KINDS} value={m.kind} onChange={(kind) => set({ kind })} color={t.accent.meds} />
        <Label>Category</Label>
        <Chips options={TAGS} value={m.tag} onChange={(tag) => set({ tag })} color={t.accent.meds} />
        <Field label="Notes" value={m.notes} onChangeText={(notes) => set({ notes })} placeholder="e.g. before food, left eye only" />
      </Card>

      <Card>
        <H2>Dose times (daily alarms)</H2>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {m.times.map((tm) => (
            <Pressable
              key={tm}
              onPress={() => set({ times: m.times.filter((x) => x !== tm) })}
              style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: t.accent.meds + '22' }}
            >
              <Text style={{ color: t.accent.meds, fontWeight: '800' }}>⏰ {tm}</Text>
              <Text style={{ color: t.accent.meds }}>✕</Text>
            </Pressable>
          ))}
          {m.times.length === 0 && <Sub>No times — no reminders will fire.</Sub>}
        </View>
        <Row>
          <Field label="Add time (HH:MM)" value={newTime} onChangeText={setNewTime} maxLength={5} placeholder="21:00" onSubmitEditing={addTime} />
          <Button title="Add" variant="soft" color={t.accent.meds} style={{ marginTop: 10 }} onPress={addTime} />
        </Row>
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          {['07:00', '09:00', '13:00', '18:00', '21:00'].map((x) => (
            <Button key={x} small variant="ghost" title={x} onPress={() => !m.times.includes(x) && set({ times: [...m.times, x].sort() })} />
          ))}
        </Row>
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>Active</Text>
            <Sub>Pause to stop reminders without deleting history.</Sub>
          </View>
          <Toggle value={m.active} onChange={(active) => set({ active })} color={t.accent.meds} />
        </Row>
      </Card>

      <Button title="Save medicine" color={t.accent.meds} onPress={save} />
      {existing && <Button title="Delete" variant="danger" style={{ marginTop: 10 }} onPress={del} />}
    </Screen>
  );
}
