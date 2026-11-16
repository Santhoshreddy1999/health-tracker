import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card, H2, Screen, Sub } from '../components/ui';
import { StackRoute, useNav } from '../nav';
import { abnormalLabs, latestVital, upcomingAppointments } from '../selectors';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { formatVital } from '../vitals';

export default function Records() {
  const t = useTheme();
  const nav = useNav();
  const { profile, data } = useStore();
  if (!profile) return null;
  const bp = latestVital(data, 'bp');
  const next = upcomingAppointments(data)[0];
  const flagged = abnormalLabs(data, profile.sex).length;
  const lastCheck = [...data.checkups].sort((a, b) => b.date.localeCompare(a.date))[0];

  const items: { route: StackRoute; icon: string; title: string; sub: string; color: string }[] = [
    { route: { name: 'emergency' }, icon: '🆘', title: 'Medical ID & emergency card', sub: [profile.medical.bloodGroup && `Blood ${profile.medical.bloodGroup}`, profile.medical.allergies ? 'Allergies noted' : 'Add allergies, doctors, contacts'].filter(Boolean).join(' · '), color: '#EF4444' },
    { route: { name: 'checkups' }, icon: '🧪', title: 'Health check-ups & lab results', sub: lastCheck ? `Last: ${lastCheck.date}${flagged ? ` · ${flagged} value${flagged > 1 ? 's' : ''} out of range` : ' · all in range'}` : 'Blood sugar, lipids, CBC, thyroid, liver, kidney, vitamins, hormones', color: '#8B5CF6' },
    { route: { name: 'reports' }, icon: '📁', title: 'Reports vault', sub: `${data.reports.length} file${data.reports.length === 1 ? '' : 's'} · PDFs, photos, prescriptions, scans`, color: '#0EA5E9' },
    { route: { name: 'vitals' }, icon: '🩺', title: 'Vitals', sub: bp ? `BP ${formatVital(bp)} on ${bp.date}` : 'Blood pressure, sugar, heart rate, SpO₂, temperature', color: '#EC4899' },
    { route: { name: 'appointments' }, icon: '📅', title: 'Doctor appointments', sub: next ? `Next: ${next.date} ${next.time} · ${next.doctor || next.specialty}` : 'Plan visits with reminders', color: '#14B8A6' },
    { route: { name: 'vaccines' }, icon: '💉', title: 'Vaccinations', sub: `${data.vaccines.length} recorded`, color: '#F97316' },
    { route: { name: 'summary' }, icon: '📄', title: 'Doctor visit summary (PDF)', sub: 'One-page summary to print or share with a doctor', color: '#6366F1' },
  ];

  return (
    <Screen title="Health records" subtitle={`${profile.name}’s medical file`}>
      {items.map((x) => (
        <Pressable key={x.title} onPress={() => nav.push(x.route)}>
          {({ pressed }) => (
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, opacity: pressed ? 0.8 : 1 }}>
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: x.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24 }}>{x.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <H2 style={{ marginBottom: 2, fontSize: 16 }}>{x.title}</H2>
                <Sub>{x.sub}</Sub>
              </View>
              <Text style={{ color: t.sub, fontSize: 20 }}>›</Text>
            </Card>
          )}
        </Pressable>
      ))}
    </Screen>
  );
}
