import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Chips, Field, H2, notify, Row, Screen, Sub } from '../components/ui';
import { hashPin } from '../lock';
import { useNav } from '../nav';
import { dosesOn, insights, stepsOn, upcomingAppointments, waterOn } from '../selectors';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { ThemePref } from '../types';
import { today } from '../utils';

const THEMES: { value: ThemePref; label: string }[] = [
  { value: 'system', label: '⚙️ System' },
  { value: 'light', label: '☀️ Light' },
  { value: 'dark', label: '🌙 Dark' },
];

/** Family tab: every member at a glance, plus app-wide settings. */
export default function Family() {
  const t = useTheme();
  const nav = useNav();
  const { state, profile, setActiveProfile } = useStore();
  if (!profile) return null;
  const d = today();

  return (
    <Screen title="Family" subtitle={`${state.profiles.length} member${state.profiles.length === 1 ? '' : 's'} · tap to switch`} right={<Button small title="+ Member" onPress={() => nav.push({ name: 'profileEdit' })} />}>
      {state.profiles.map((p) => {
        const data = state.data[p.id];
        if (!data) return null;
        const doses = dosesOn(data, d);
        const alerts = insights(p, data).filter((i) => i.level !== 'good');
        const next = upcomingAppointments(data)[0];
        const on = p.id === profile.id;
        return (
          <Card key={p.id} style={on ? { borderColor: p.color, borderWidth: 2 } : undefined}>
            <Pressable
              onPress={() => {
                setActiveProfile(p.id);
                nav.setTab('home');
              }}
            >
              <Row>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: p.color, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 20 }}>{p.name.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontWeight: '800', fontSize: 17 }}>
                    {p.name} <Text style={{ color: t.sub, fontWeight: '500', fontSize: 13 }}>{p.medical.relation} · {p.age} y{p.medical.bloodGroup ? ` · ${p.medical.bloodGroup}` : ''}</Text>
                  </Text>
                  <Sub>{p.conditions.join(' · ') || 'No conditions listed'}</Sub>
                </View>
                {on && <Text style={{ color: p.color, fontWeight: '800', fontSize: 12 }}>ACTIVE</Text>}
              </Row>
              <Row style={{ marginTop: 12, justifyContent: 'space-between' }}>
                <Sub>💊 {doses.filter((x) => x.taken).length}/{doses.length}</Sub>
                <Sub>👟 {stepsOn(data, d).toLocaleString()}</Sub>
                <Sub>💧 {Math.round((waterOn(data, d) / p.targets.waterMl) * 100)}%</Sub>
                <Sub>📁 {data.reports.length}</Sub>
                <Sub style={{ color: alerts.length ? t.warning : t.success, fontWeight: '700' }}>{alerts.length ? `⚠️ ${alerts.length}` : '✓ OK'}</Sub>
              </Row>
              {next && <Sub style={{ marginTop: 6 }}>📅 {next.date} {next.time} · {next.doctor || next.specialty}</Sub>}
              {alerts.slice(0, 2).map((a, i) => (
                <Sub key={i} style={{ marginTop: 4 }}>
                  {a.icon} {a.text}
                </Sub>
              ))}
            </Pressable>
            <Row gap={8} style={{ marginTop: 12 }}>
              <Button small variant="ghost" title="Profile & targets" onPress={() => nav.push({ name: 'profileEdit', id: p.id })} />
              <Button
                small
                variant="ghost"
                title="Medical ID"
                onPress={() => {
                  setActiveProfile(p.id);
                  nav.push({ name: 'emergency' });
                }}
              />
            </Row>
          </Card>
        );
      })}

      <H2 style={{ marginTop: 8 }}>Settings</H2>
      <Card onPress={() => nav.push({ name: 'reminders' })}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>⏰ Reminders</Text>
            <Sub>Medicine alarms, appointments, water, sitting too long</Sub>
          </View>
          <Text style={{ color: t.sub, fontSize: 20 }}>›</Text>
        </Row>
      </Card>
      <Card onPress={() => nav.push({ name: 'settings' })}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>🔒 App lock, theme & backup</Text>
            <Sub>{state.pinHash ? 'PIN lock on' : 'PIN lock off'} · {state.theme} theme · export / restore</Sub>
          </View>
          <Text style={{ color: t.sub, fontSize: 20 }}>›</Text>
        </Row>
      </Card>
      <Sub style={{ textAlign: 'center', marginTop: 4 }}>Personal tracker only — not medical advice. Always follow your doctor for medicines and lab targets.</Sub>
    </Screen>
  );
}

export function Settings() {
  const nav = useNav();
  const { state, setTheme, setPinHash } = useStore();
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  return (
    <Screen title="Settings" onBack={nav.back}>
      <Card>
        <H2>Appearance</H2>
        <Chips options={THEMES} value={state.theme} onChange={setTheme} />
      </Card>
      <Card>
        <H2>🔒 App lock</H2>
        <Sub style={{ marginBottom: 10 }}>
          {state.pinHash ? 'A 4-digit PIN is required when the app opens.' : 'Ask for a 4-digit PIN when the app opens, to keep family health data private on a shared phone.'}
        </Sub>
        {state.pinHash ? (
          <Button title="Remove PIN" variant="danger" onPress={() => setPinHash('')} />
        ) : (
          <>
            <Row>
              <Field label="New PIN" value={pin} onChangeText={setPin} keyboardType="number-pad" secureTextEntry maxLength={4} />
              <Field label="Repeat" value={pin2} onChangeText={setPin2} keyboardType="number-pad" secureTextEntry maxLength={4} />
            </Row>
            <Button
              title="Set PIN"
              onPress={() => {
                if (!/^\d{4}$/.test(pin)) return notify('PIN must be 4 digits.');
                if (pin !== pin2) return notify('PINs do not match.');
                setPinHash(hashPin(pin));
                setPin('');
                setPin2('');
                notify('PIN set', 'If you forget it, you will need to clear the app’s data (restore from a backup).');
              }}
            />
          </>
        )}
      </Card>
      <Card onPress={() => nav.push({ name: 'backup' })}>
        <H2 style={{ marginBottom: 2 }}>💾 Backup & restore ›</H2>
        <Sub>All data stays on this device. Export a backup before changing phones or clearing the browser.</Sub>
      </Card>
    </Screen>
  );
}
