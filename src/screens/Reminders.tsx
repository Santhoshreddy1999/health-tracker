import React, { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { Button, Card, Chips, Field, H2, Label, Row, Screen, Sub, Toggle } from '../components/ui';
import { MAX_SCHEDULED, planReminders } from '../reminders/plan';
import { getPermission, platformNote, requestPermission, syncReminders, testNotification } from '../reminders/scheduler';
import { useNav } from '../nav';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { IntervalReminder } from '../types';
import { intervalSlots, isValidTime, normalizeTime } from '../utils';

const INTERVALS = ['20', '30', '45', '60', '90', '120'];

function IntervalCard({
  icon,
  title,
  desc,
  value,
  color,
  onChange,
}: {
  icon: string;
  title: string;
  desc: string;
  value: IntervalReminder;
  color: string;
  onChange: (v: IntervalReminder) => void;
}) {
  const t = useTheme();
  const [start, setStart] = useState(value.start);
  const [end, setEnd] = useState(value.end);
  useEffect(() => {
    setStart(value.start);
    setEnd(value.end);
  }, [value.start, value.end]);
  const commit = () => {
    const s = normalizeTime(start);
    const e = normalizeTime(end);
    if (isValidTime(s) && isValidTime(e)) onChange({ ...value, start: s, end: e });
  };
  const slots = intervalSlots(value.start, value.end, value.intervalMin);
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 17, fontWeight: '700' }}>
            {icon} {title}
          </Text>
          <Sub>{desc}</Sub>
        </View>
        <Toggle value={value.enabled} onChange={(enabled) => onChange({ ...value, enabled })} color={color} />
      </Row>
      {value.enabled && (
        <View style={{ marginTop: 14 }}>
          <Label>Every (minutes)</Label>
          <Chips
            options={INTERVALS}
            value={String(value.intervalMin)}
            onChange={(v: string) => onChange({ ...value, intervalMin: Number(v) })}
            color={color}
          />
          <Row>
            <Field label="From" value={start} onChangeText={setStart} onBlur={commit} onSubmitEditing={commit} maxLength={5} />
            <Field label="Until" value={end} onChangeText={setEnd} onBlur={commit} onSubmitEditing={commit} maxLength={5} />
          </Row>
          <Sub>
            {slots.length} reminders/day{slots.length ? `: ${slots.slice(0, 6).join(', ')}${slots.length > 6 ? '…' : ''}` : ' — check the hours'}
          </Sub>
        </View>
      )}
    </Card>
  );
}

export default function Reminders() {
  const t = useTheme();
  const nav = useNav();
  const { profile, saveProfile, state } = useStore();
  const [perm, setPerm] = useState<string>('…');
  const refresh = () => getPermission().then(setPerm);
  useEffect(() => {
    refresh();
  }, []);
  if (!profile) return null;
  const r = profile.reminders;
  const set = (p: Partial<typeof r>) => saveProfile({ ...profile, reminders: { ...r, ...p } });
  const total = planReminders(state).length;

  return (
    <Screen title="Reminders" subtitle="Medicines, appointments, water and movement breaks" onBack={nav.back}>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>Notifications: {perm}</Text>
            <Sub>
              {total} daily reminder{total === 1 ? '' : 's'} planned across all profiles
              {Platform.OS === 'ios' && total > MAX_SCHEDULED ? ` (iOS limit: first ${MAX_SCHEDULED} used — medicines first)` : ''}
            </Sub>
          </View>
        </Row>
        <Row style={{ marginTop: 12 }} gap={8}>
          {perm !== 'granted' && (
            <Button
              title="Allow notifications"
              style={{ flex: 1 }}
              onPress={async () => {
                await requestPermission();
                await refresh();
                await syncReminders(state);
              }}
            />
          )}
          <Button title="Send test" variant="soft" style={{ flex: 1 }} onPress={testNotification} />
        </Row>
        <Sub style={{ marginTop: 10 }}>{platformNote}</Sub>
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 17, fontWeight: '700' }}>💊 Medicine alarms</Text>
            <Sub>Alarm-style reminder at each dose time set in Medicines (high priority, sound + vibration on Android).</Sub>
          </View>
          <Toggle value={r.medicines} onChange={(medicines) => set({ medicines })} color={t.accent.meds} />
        </Row>
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 17, fontWeight: '700' }}>📅 Appointments & vaccines</Text>
            <Sub>Evening before (20:00) and 2 hours before each visit; 09:00 on a vaccine’s due date.</Sub>
          </View>
          <Toggle value={r.appointments} onChange={(appointments) => set({ appointments })} color={t.primary} />
        </Row>
      </Card>

      <IntervalCard
        icon="💧"
        title="Drink water"
        desc={`Nudge to drink a ${profile.targets.glassMl} ml glass.`}
        value={r.water}
        color={t.accent.water}
        onChange={(water) => set({ water })}
      />
      <IntervalCard
        icon="🚶"
        title="Sitting too long"
        desc="Movement break every N minutes during your work hours."
        value={r.sit}
        color={t.accent.sit}
        onChange={(sit) => set({ sit })}
      />
    </Screen>
  );
}
