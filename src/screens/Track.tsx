import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Screen, Sub } from '../components/ui';
import { StackRoute, useNav } from '../nav';
import { cycleStats, kcalOn, latestWeight, sleepOn, stepsOn, waterOn, weekWorkoutMin } from '../selectors';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { today } from '../utils';

export default function Track() {
  const t = useTheme();
  const nav = useNav();
  const { profile, data } = useStore();
  if (!profile) return null;
  const d = today();
  const lastTsh = [...data.labs].sort((a, b) => b.date.localeCompare(a.date))[0];
  const cyc = cycleStats(data.cycles);
  type Tile = { route: StackRoute['name']; icon: string; label: string; value: string; color: string };
  const all: Tile[] = [
    { route: 'steps', icon: '👟', label: 'Steps', value: `${stepsOn(data, d).toLocaleString()} / ${profile.targets.steps.toLocaleString()}`, color: t.accent.steps },
    { route: 'weight', icon: '⚖️', label: 'Weight', value: latestWeight(data) ? `${latestWeight(data)} kg` : 'Log weight', color: t.accent.weight },
    { route: 'calories', icon: '🔥', label: 'Calories', value: `${kcalOn(data, d)} / ${profile.targets.calories}`, color: t.accent.calories },
    { route: 'water', icon: '💧', label: 'Water', value: `${waterOn(data, d)} / ${profile.targets.waterMl} ml`, color: t.accent.water },
    { route: 'sleep', icon: '😴', label: 'Sleep', value: sleepOn(data, d) ? `${sleepOn(data, d)} h last night` : 'Log sleep', color: t.accent.sleep },
    { route: 'workout', icon: '🏋️', label: 'Gym / workout', value: `${weekWorkoutMin(data)} min this week`, color: t.accent.workout },
    { route: 'vitals', icon: '🩺', label: 'Vitals', value: 'BP · sugar · pulse · SpO₂', color: t.accent.workout },
    { route: 'checkups', icon: '🧪', label: 'Lab results', value: `${data.checkups.length} check-ups`, color: t.accent.weight },
    { route: 'pcos', icon: '🌸', label: 'PCOS & cycle', value: cyc.cycleDay ? `Cycle day ${cyc.cycleDay}` : 'Log cycle', color: t.accent.pcos },
    { route: 'thyroid', icon: '🦋', label: 'Thyroid', value: lastTsh ? `TSH ${lastTsh.tsh}` : 'Log TSH', color: t.accent.thyroid },
  ];
  const tiles = all.filter((x) => x.route !== 'pcos' || profile.sex === 'female' || profile.conditions.includes('PCOS') || data.cycles.length > 0);
  return (
    <Screen title="Track" subtitle="Tap a tracker to log or see trends">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {tiles.map((x) => (
          <Pressable
            key={x.route}
            onPress={() => nav.push({ name: x.route } as StackRoute)}
            style={({ pressed }) => ({
              width: '48.5%',
              backgroundColor: t.card,
              borderColor: t.border,
              borderWidth: 1,
              borderRadius: 18,
              padding: 16,
              marginBottom: 12,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: x.color + '22', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 22 }}>{x.icon}</Text>
            </View>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 16, marginTop: 10 }}>{x.label}</Text>
            <Sub style={{ marginTop: 2 }}>{x.value}</Sub>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
