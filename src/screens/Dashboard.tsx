import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BarChart } from '../components/charts';
import { Body, Button, Card, H2, Progress, Ring, Row, Screen, Sub } from '../components/ui';
import { useNav } from '../nav';
import { adherence, cycleStats, dosesOn, insights, kcalOn, latestVital, latestWeight, series, sleepOn, stepsOn, upcomingAppointments, waterOn, weekWorkoutMin } from '../selectors';
import { classifyVital, formatVital, VITALS } from '../vitals';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { bmi, nowTime, prettyDate, today, uid } from '../utils';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function Dashboard() {
  const t = useTheme();
  const nav = useNav();
  const { profile, data, add, remove, state, setActiveProfile } = useStore();
  if (!profile) return null;
  const tg = profile.targets;
  const d = today();
  const steps = stepsOn(data, d);
  const water = waterOn(data, d);
  const kcal = kcalOn(data, d);
  const sleep = sleepOn(data, d);
  const weight = latestWeight(data);
  const workout = weekWorkoutMin(data);
  const doses = dosesOn(data, d);
  const nextDose = doses.find((x) => !x.taken && x.slot >= nowTime()) ?? doses.find((x) => !x.taken);
  const hasCond = (s: string) => profile.conditions.some((c) => c.toLowerCase().includes(s));
  const thyroidMeds = data.medicines.filter((m) => m.tag === 'thyroid');
  const showThyroid = hasCond('thyroid') || thyroidMeds.length > 0;
  const showPcos = hasCond('pcos') || data.cycles.length > 0;
  const cyc = cycleStats(data.cycles);
  const lastTsh = [...data.labs].sort((a, b) => b.date.localeCompare(a.date))[0];
  const tips = insights(profile, data);
  const nextAppt = upcomingAppointments(data)[0];
  const bp = latestVital(data, 'bp');
  const sugar = latestVital(data, 'sugar');
  const levelColor = (l: string) => (l === 'good' ? t.success : l === 'warn' ? t.warning : t.danger);

  const rings = [
    { key: 'steps', label: 'Steps', value: steps, target: tg.steps, fmt: steps.toLocaleString(), color: t.accent.steps, icon: '👟' },
    { key: 'water', label: 'Water', value: water, target: tg.waterMl, fmt: `${(water / 1000).toFixed(1)}L`, color: t.accent.water, icon: '💧' },
    { key: 'calories', label: 'Calories', value: kcal, target: tg.calories, fmt: `${kcal}`, color: t.accent.calories, icon: '🔥' },
    { key: 'sleep', label: 'Sleep', value: sleep, target: tg.sleepHours, fmt: `${sleep}h`, color: t.accent.sleep, icon: '😴' },
  ] as const;

  return (
    <Screen title={`${greeting()}, ${profile.name.split(' ')[0]}`} subtitle={new Date().toDateString()}>
      {state.profiles.length > 1 && (
        <Row style={{ marginBottom: 14, flexWrap: 'wrap' }} gap={8}>
          {state.profiles.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setActiveProfile(p.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: p.id === profile.id ? p.color : t.card,
                borderWidth: 1,
                borderColor: p.id === profile.id ? p.color : t.border,
              }}
            >
              <Text style={{ color: p.id === profile.id ? '#fff' : t.text, fontWeight: '600' }}>{p.name}</Text>
            </Pressable>
          ))}
        </Row>
      )}

      <Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 }}>
          {rings.map((r) => (
            <Pressable key={r.key} onPress={() => nav.push({ name: r.key })} style={{ width: '25%', minWidth: 76, alignItems: 'center' }}>
              <Ring progress={r.value / r.target} color={r.color} size={72} stroke={8}>
                <Text style={{ fontSize: 16 }}>{r.icon}</Text>
                <Text style={{ color: t.sub, fontSize: 11, fontWeight: '700' }}>{Math.round((r.value / r.target) * 100) || 0}%</Text>
              </Ring>
              <Text style={{ color: t.text, fontWeight: '800', marginTop: 6 }}>{r.fmt}</Text>
              <Sub>{r.label}</Sub>
            </Pressable>
          ))}
        </View>
        <Row style={{ marginTop: 16 }} gap={8}>
          <Button
            small
            variant="soft"
            color={t.accent.water}
            title={`+ ${tg.glassMl} ml`}
            style={{ flex: 1 }}
            onPress={() => add('water', { id: uid(), date: d, time: nowTime(), ml: tg.glassMl })}
          />
          <Button small variant="soft" color={t.accent.calories} title="+ Food" style={{ flex: 1 }} onPress={() => nav.push({ name: 'calories' })} />
          <Button small variant="soft" color={t.accent.steps} title="+ Steps" style={{ flex: 1 }} onPress={() => nav.push({ name: 'steps' })} />
        </Row>
      </Card>

      {tips.length > 0 && (
        <Card>
          <H2>✨ Today’s insights</H2>
          {tips.slice(0, 5).map((x, i) => (
            <Row key={i} style={{ alignItems: 'flex-start', marginBottom: 8 }} gap={10}>
              <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: levelColor(x.level) }} />
              <Text style={{ fontSize: 16 }}>{x.icon}</Text>
              <Body style={{ flex: 1, fontSize: 14 }}>{x.text}</Body>
            </Row>
          ))}
        </Card>
      )}

      {(nextAppt || bp || sugar) && (
        <Row gap={12} style={{ alignItems: 'stretch' }}>
          {nextAppt && (
            <Card style={{ flex: 1 }} onPress={() => nav.push({ name: 'appointments' })}>
              <Sub>📅 Next appointment</Sub>
              <Body style={{ fontWeight: '800', marginTop: 4 }}>{prettyDate(nextAppt.date)} · {nextAppt.time}</Body>
              <Sub>{nextAppt.doctor || nextAppt.specialty}</Sub>
            </Card>
          )}
          {(bp || sugar) && (
            <Card style={{ flex: 1 }} onPress={() => nav.push({ name: 'vitals' })}>
              <Sub>🩺 Latest vitals</Sub>
              {[bp, sugar].filter(Boolean).map((v) => (
                <Body key={v!.id} style={{ fontWeight: '700', marginTop: 4, color: levelColor(classifyVital(v!).level) }}>
                  {VITALS[v!.type].icon} {formatVital(v!)} <Text style={{ fontSize: 11, color: t.sub }}>{VITALS[v!.type].unit}</Text>
                </Body>
              ))}
            </Card>
          )}
        </Row>
      )}

      <Card onPress={() => nav.setTab('meds')}>
        <Row style={{ justifyContent: 'space-between' }}>
          <H2 style={{ marginBottom: 4 }}>💊 Medicines today</H2>
          <Sub>
            {doses.filter((x) => x.taken).length}/{doses.length} taken
          </Sub>
        </Row>
        {doses.length === 0 ? (
          <Sub>No medicines yet. Tap to add tablets or eye drops with reminder times.</Sub>
        ) : (
          <>
            {nextDose && (
              <Sub style={{ marginBottom: 8 }}>
                Next: <Text style={{ color: t.accent.meds, fontWeight: '700' }}>{nextDose.med.name}</Text> at {nextDose.slot}
              </Sub>
            )}
            {doses.map((x) => (
              <Pressable
                key={x.med.id + x.slot}
                onPress={() =>
                  x.taken && x.logId
                    ? remove('medLogs', x.logId)
                    : add('medLogs', { id: uid(), medId: x.med.id, date: d, time: nowTime(), slot: x.slot })
                }
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 }}
              >
                <Text style={{ fontSize: 18 }}>{x.taken ? '✅' : '⬜'}</Text>
                <Text style={{ color: t.sub, width: 48, fontVariant: ['tabular-nums'] }}>{x.slot}</Text>
                <Body style={{ flex: 1, textDecorationLine: x.taken ? 'line-through' : 'none', opacity: x.taken ? 0.6 : 1 }}>
                  {x.med.name} <Text style={{ color: t.sub }}>{x.med.dose}</Text>
                </Body>
              </Pressable>
            ))}
          </>
        )}
      </Card>

      <Row gap={12} style={{ alignItems: 'stretch' }}>
        <Card style={{ flex: 1 }} onPress={() => nav.push({ name: 'weight' })}>
          <Sub>⚖️ Weight</Sub>
          <Text style={{ color: t.text, fontSize: 24, fontWeight: '800', marginVertical: 4 }}>{weight ? `${weight} kg` : '—'}</Text>
          <Sub>
            Target {tg.weightKg} kg{weight ? ` · ${weight > tg.weightKg ? '-' : '+'}${Math.abs(weight - tg.weightKg).toFixed(1)} to go` : ''}
          </Sub>
          {weight ? <Sub style={{ marginTop: 2 }}>BMI {bmi(weight, profile.heightCm).toFixed(1)}</Sub> : null}
        </Card>
        <Card style={{ flex: 1 }} onPress={() => nav.push({ name: 'workout' })}>
          <Sub>🏋️ Workouts (7 days)</Sub>
          <Text style={{ color: t.text, fontSize: 24, fontWeight: '800', marginVertical: 4 }}>{workout} min</Text>
          <Progress value={workout / tg.workoutMinPerWeek} color={t.accent.workout} />
          <Sub style={{ marginTop: 6 }}>Goal {tg.workoutMinPerWeek} min / week</Sub>
        </Card>
      </Row>

      {showThyroid && (
        <Card onPress={() => nav.push({ name: 'thyroid' })}>
          <H2 style={{ marginBottom: 4 }}>🦋 Thyroid</H2>
          <Row style={{ justifyContent: 'space-between' }}>
            <View>
              <Sub>Last TSH</Sub>
              <Body style={{ fontWeight: '700' }}>{lastTsh ? `${lastTsh.tsh} mIU/L · ${prettyDate(lastTsh.date)}` : 'No lab values yet'}</Body>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Sub>Tablet adherence (7d)</Sub>
              <Body style={{ fontWeight: '700', color: t.accent.thyroid }}>{Math.round(adherence(data, thyroidMeds) * 100)}%</Body>
            </View>
          </Row>
        </Card>
      )}

      {showPcos && (
        <Card onPress={() => nav.push({ name: 'pcos' })}>
          <H2 style={{ marginBottom: 4 }}>🌸 Cycle (PCOS)</H2>
          {cyc.lastStart ? (
            <Row style={{ justifyContent: 'space-between' }}>
              <View>
                <Sub>Cycle day</Sub>
                <Body style={{ fontWeight: '700' }}>Day {cyc.cycleDay}</Body>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Sub>Next period (est.)</Sub>
                <Body style={{ fontWeight: '700', color: t.accent.pcos }}>
                  {prettyDate(cyc.nextStart!)}
                  {cyc.daysUntilNext! >= 0 ? ` · in ${cyc.daysUntilNext}d` : ` · ${-cyc.daysUntilNext!}d late`}
                </Body>
              </View>
            </Row>
          ) : (
            <Sub>Log your period start dates to see cycle length and predictions.</Sub>
          )}
        </Card>
      )}

      <Card onPress={() => nav.push({ name: 'steps' })}>
        <H2>Steps this week</H2>
        <BarChart data={series(7, (date) => stepsOn(data, date))} target={tg.steps} color={t.accent.steps} />
      </Card>
    </Screen>
  );
}
