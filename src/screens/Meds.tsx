import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Body, Button, Card, Empty, H2, Row, Screen, Sub } from '../components/ui';
import { useNav } from '../nav';
import { adherence, dosesOn } from '../selectors';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { nowTime, today, uid } from '../utils';

const kindIcon: Record<string, string> = { tablet: '💊', capsule: '💊', 'eye drops': '👁️', syrup: '🥄', injection: '💉', other: '🩹' };

export default function Meds() {
  const t = useTheme();
  const nav = useNav();
  const { profile, data, add, remove } = useStore();
  if (!profile) return null;
  const d = today();
  const doses = dosesOn(data, d);
  const now = nowTime();

  return (
    <Screen
      title="Medicines"
      subtitle={`${doses.filter((x) => x.taken).length} of ${doses.length} doses taken today`}
      right={<Button small title="+ Add" onPress={() => nav.push({ name: 'medEdit' })} color={t.accent.meds} />}
    >
      <Card>
        <H2>Today’s schedule</H2>
        {doses.length === 0 && <Empty text="No doses scheduled. Add a medicine with reminder times." />}
        {doses.map((x) => {
          const overdue = !x.taken && x.slot < now;
          return (
            <Pressable
              key={x.med.id + x.slot}
              onPress={() =>
                x.taken && x.logId
                  ? remove('medLogs', x.logId)
                  : add('medLogs', { id: uid(), medId: x.med.id, date: d, time: nowTime(), slot: x.slot })
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 14,
                marginBottom: 8,
                backgroundColor: x.taken ? t.success + '18' : overdue ? t.danger + '14' : t.cardAlt,
              }}
            >
              <View style={{ alignItems: 'center', width: 46 }}>
                <Text style={{ fontSize: 20 }}>{kindIcon[x.med.kind]}</Text>
                <Text style={{ color: t.text, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{x.slot}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Body style={{ fontWeight: '700' }}>{x.med.name}</Body>
                <Sub>{[x.med.dose, x.med.notes].filter(Boolean).join(' · ')}</Sub>
              </View>
              <View style={{ alignItems: 'center', width: 56 }}>
                <Text style={{ fontSize: 22 }}>{x.taken ? '✅' : '⬜'}</Text>
                <Text style={{ color: x.taken ? t.success : overdue ? t.danger : t.sub, fontWeight: '700', fontSize: 11 }}>
                  {x.taken ? 'Taken' : overdue ? 'Missed?' : 'Pending'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <H2>My medicines</H2>
          <Sub>7-day adherence {Math.round(adherence(data, data.medicines) * 100)}%</Sub>
        </Row>
        {data.medicines.length === 0 && (
          <>
            <Empty text="Start with a common preset:" />
            <Row gap={8} style={{ justifyContent: 'center' }}>
              <Button small variant="soft" color={t.accent.thyroid} title="🦋 Thyroid tablet" onPress={() => nav.push({ name: 'medEdit', preset: 'thyroid' })} />
              <Button small variant="soft" color={t.accent.water} title="👁️ Eye drops" onPress={() => nav.push({ name: 'medEdit', preset: 'eye' })} />
            </Row>
          </>
        )}
        {data.medicines.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => nav.push({ name: 'medEdit', id: m.id })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border, opacity: m.active ? 1 : 0.5 }}
          >
            <Text style={{ fontSize: 22 }}>{kindIcon[m.kind]}</Text>
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: '700' }}>
                {m.name} {m.active ? '' : '(paused)'}
              </Body>
              <Sub>
                {m.dose} · {m.times.join(', ') || 'no times'}
              </Sub>
            </View>
            <Text style={{ color: t.sub }}>›</Text>
          </Pressable>
        ))}
      </Card>
      <Sub style={{ textAlign: 'center' }}>Reminders for each dose time can be turned on in the Reminders tab.</Sub>
    </Screen>
  );
}
