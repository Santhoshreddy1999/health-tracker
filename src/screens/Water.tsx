import React, { useState } from 'react';
import { Text } from 'react-native';
import { BarChart } from '../components/charts';
import { Button, Card, Empty, Field, H2, ListItem, Ring, Row, Screen, Sub } from '../components/ui';
import { useNav } from '../nav';
import { series, waterOn } from '../selectors';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { nowTime, num, sortByDateDesc, today, uid } from '../utils';

export default function Water() {
  const t = useTheme();
  const nav = useNav();
  const { profile, data, add, remove } = useStore();
  const [custom, setCustom] = useState('');
  if (!profile) return null;
  const { waterMl, glassMl } = profile.targets;
  const total = waterOn(data, today());
  const glasses = Math.round(total / glassMl);
  const goalGlasses = Math.ceil(waterMl / glassMl);
  const r = profile.reminders.water;
  const log = (ml: number) => ml > 0 && add('water', { id: uid(), date: today(), time: nowTime(), ml });
  const todays = sortByDateDesc(data.water.filter((w) => w.date === today()));

  return (
    <Screen title="Water" onBack={nav.back}>
      <Card style={{ alignItems: 'center' }}>
        <Ring progress={total / waterMl} color={t.accent.water} size={160} stroke={14}>
          <Text style={{ color: t.text, fontSize: 30, fontWeight: '800' }}>{(total / 1000).toFixed(2)} L</Text>
          <Sub>of {(waterMl / 1000).toFixed(1)} L</Sub>
        </Ring>
        <Text style={{ fontSize: 22, marginTop: 12, letterSpacing: 2 }}>
          {Array.from({ length: Math.min(goalGlasses, 16) }, (_, i) => (i < glasses ? '💧' : '○')).join('')}
        </Text>
        <Sub style={{ marginTop: 4 }}>
          {glasses} of {goalGlasses} glasses
        </Sub>
        <Row style={{ marginTop: 16, alignSelf: 'stretch' }} gap={8}>
          <Button title={`+${glassMl} ml`} color={t.accent.water} style={{ flex: 1 }} onPress={() => log(glassMl)} />
          <Button title="+500 ml" variant="soft" color={t.accent.water} style={{ flex: 1 }} onPress={() => log(500)} />
          <Button title="+1 L" variant="soft" color={t.accent.water} style={{ flex: 1 }} onPress={() => log(1000)} />
        </Row>
        <Row style={{ marginTop: 12, alignSelf: 'stretch' }}>
          <Field label="Custom (ml)" value={custom} onChangeText={setCustom} keyboardType="number-pad" />
          <Button
            title="Add"
            variant="soft"
            color={t.accent.water}
            style={{ marginTop: 10 }}
            onPress={() => {
              log(Math.round(num(custom)));
              setCustom('');
            }}
          />
        </Row>
      </Card>

      <Card onPress={() => nav.push({ name: 'reminders' })}>
        <H2 style={{ marginBottom: 4 }}>⏰ Water reminders</H2>
        <Sub>
          {r.enabled ? `On · every ${r.intervalMin} min from ${r.start} to ${r.end}` : 'Off · tap to set interval reminders'}
        </Sub>
      </Card>

      <Card>
        <H2>Last 7 days (ml)</H2>
        <BarChart data={series(7, (d) => waterOn(data, d))} target={waterMl} color={t.accent.water} />
      </Card>

      <Card>
        <H2>Today</H2>
        {todays.length === 0 && <Empty text="No water logged today." />}
        {todays.map((w) => (
          <ListItem key={w.id} title={`${w.ml} ml`} subtitle={w.time} onDelete={() => remove('water', w.id)} />
        ))}
      </Card>
    </Screen>
  );
}
