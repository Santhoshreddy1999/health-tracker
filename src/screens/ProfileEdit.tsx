import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { Button, Card, Chips, confirmAsync, Field, H2, Label, notify, Row, Screen } from '../components/ui';
import { demoState } from '../demo';
import { useNav } from '../nav';
import { newProfile, PROFILE_COLORS, useStore } from '../store';
import { useTheme } from '../theme';
import { Profile, Sex, Targets } from '../types';
import { num } from '../utils';

const RELATIONS = ['Self', 'Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Grandparent', 'Other'];
const CONDITIONS = ['PCOS', 'Thyroid (hypo)', 'Thyroid (hyper)', 'Diabetes', 'Blood pressure', 'Cholesterol', 'Heart disease', 'Asthma', 'Eye condition', 'Arthritis', 'Kidney disease', 'Fatty liver', 'Anaemia', 'Vitamin D deficiency', 'Migraine', 'Pregnancy'];
const SEXES: { value: Sex; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
];

const TARGET_FIELDS: { key: keyof Targets; label: string }[] = [
  { key: 'steps', label: 'Steps / day' },
  { key: 'weightKg', label: 'Target weight (kg)' },
  { key: 'calories', label: 'Calories / day' },
  { key: 'waterMl', label: 'Water / day (ml)' },
  { key: 'glassMl', label: 'Glass size (ml)' },
  { key: 'sleepHours', label: 'Sleep (hours)' },
  { key: 'workoutMinPerWeek', label: 'Workout min / week' },
];

export default function ProfileEdit({ id, onboarding }: { id?: string; onboarding?: boolean }) {
  const t = useTheme();
  const nav = useNav();
  const { state, saveProfile, deleteProfile, setActiveProfile, importJson } = useStore();
  const existing = state.profiles.find((p) => p.id === id);
  const [p, setP] = useState<Profile>(existing ?? (() => {
      const np = newProfile({ name: onboarding ? 'Santhosh' : '', sex: 'other' });
      return onboarding ? np : { ...np, medical: { ...np.medical, relation: 'Spouse' } };
    })());
  const [nums, setNums] = useState({
    age: String(p.age),
    height: String(p.heightCm),
    ...Object.fromEntries(TARGET_FIELDS.map((f) => [f.key, String(p.targets[f.key])])),
  } as Record<string, string>);
  const [custom, setCustom] = useState('');

  const save = () => {
    if (!p.name.trim()) return notify('Please enter a name.');
    const targets = { ...p.targets };
    for (const f of TARGET_FIELDS) {
      const v = num(nums[f.key]);
      if (v > 0) targets[f.key] = v;
    }
    const out: Profile = { ...p, name: p.name.trim(), age: Math.round(num(nums.age)) || p.age, heightCm: num(nums.height) || p.heightCm, targets };
    saveProfile(out);
    if (!existing) setActiveProfile(out.id);
    if (!onboarding) nav.back();
  };

  const del = async () => {
    if (!existing) return;
    if (await confirmAsync(`Delete ${existing.name}?`, 'All of this profile’s data will be permanently removed from this device.')) {
      deleteProfile(existing.id);
      nav.back();
    }
  };

  return (
    <Screen
      title={onboarding ? 'Welcome 👋' : existing ? `Edit ${existing.name}` : 'New profile'}
      subtitle={onboarding ? 'Set up your profile. Everything stays on this device — free, offline, no account.' : undefined}
      onBack={onboarding ? undefined : nav.back}
    >
      <Card>
        <H2>About</H2>
        <Field label="Name" value={p.name} onChangeText={(name) => setP({ ...p, name })} placeholder="Name" />
        <Row>
          <Field label="Age" value={nums.age} onChangeText={(v) => setNums({ ...nums, age: v })} keyboardType="number-pad" />
          <Field label="Height (cm)" value={nums.height} onChangeText={(v) => setNums({ ...nums, height: v })} keyboardType="decimal-pad" />
        </Row>
        <Label>Relation</Label>
        <Chips options={RELATIONS} value={p.medical.relation} onChange={(relation) => setP({ ...p, medical: { ...p.medical, relation } })} />
        <Label>Colour</Label>
        <Row gap={10} style={{ marginBottom: 14 }}>
          {PROFILE_COLORS.map((c) => (
            <Pressable key={c} onPress={() => setP({ ...p, color: c })} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, borderWidth: 3, borderColor: p.color === c ? t.text : 'transparent' }} />
          ))}
        </Row>
        <Label>Sex</Label>
        <Chips options={SEXES} value={p.sex} onChange={(sex) => setP({ ...p, sex })} />
        <Label>Conditions (shows matching trackers on the dashboard)</Label>
        <Chips
          options={[...new Set([...CONDITIONS, ...p.conditions])]}
          value={p.conditions}
          multi
          onChange={(conditions) => setP({ ...p, conditions })}
          color={t.accent.pcos}
        />
        <Row>
          <Field label="Other condition" value={custom} onChangeText={setCustom} placeholder="e.g. Migraine" />
          <Button
            title="Add"
            variant="soft"
            style={{ marginTop: 10 }}
            onPress={() => {
              if (custom.trim() && !p.conditions.includes(custom.trim())) setP({ ...p, conditions: [...p.conditions, custom.trim()] });
              setCustom('');
            }}
          />
        </Row>
      </Card>

      <Card>
        <H2>🎯 Daily targets</H2>
        <Row style={{ flexWrap: 'wrap' }} gap={10}>
          {TARGET_FIELDS.map((f) => (
            <Field
              key={f.key}
              label={f.label}
              value={nums[f.key]}
              onChangeText={(v) => setNums({ ...nums, [f.key]: v })}
              keyboardType="decimal-pad"
              style={{ flexBasis: '45%', flexGrow: 1 }}
            />
          ))}
        </Row>
      </Card>

      <Button title={onboarding ? 'Get started' : 'Save profile'} onPress={save} />
      {onboarding && (
        <Button
          title="Explore with sample data instead"
          variant="ghost"
          style={{ marginTop: 10 }}
          onPress={() => importJson(JSON.stringify(demoState()))}
        />
      )}
      {existing && state.profiles.length > 1 && <Button title="Delete profile" variant="danger" style={{ marginTop: 10 }} onPress={del} />}
    </Screen>
  );
}
