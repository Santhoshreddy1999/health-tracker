import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MAX_WIDTH } from './src/components/ui';
import { demoState } from './src/demo';
import { usePedometer } from './src/hooks/usePedometer';
import { NavProvider, StackRoute, Tab, useNav } from './src/nav';
import { PlannedReminder } from './src/reminders/plan';
import { setupReminders, syncReminders } from './src/reminders/scheduler';
import Backup from './src/screens/Backup';
import Calories from './src/screens/Calories';
import Dashboard from './src/screens/Dashboard';
import MedEdit from './src/screens/MedEdit';
import Meds from './src/screens/Meds';
import Pcos from './src/screens/Pcos';
import Appointments, { Vaccines } from './src/screens/Appointments';
import Checkups, { CheckupEdit, CheckupView, LabTrend } from './src/screens/Checkups';
import Emergency, { MedicalEdit } from './src/screens/Emergency';
import Family, { Settings } from './src/screens/Profile';
import Records from './src/screens/Records';
import Reports, { ReportEdit } from './src/screens/Reports';
import Summary from './src/screens/Summary';
import Vitals from './src/screens/Vitals';
import { LockScreen } from './src/lock';
import ProfileEdit from './src/screens/ProfileEdit';
import Reminders from './src/screens/Reminders';
import Sleep from './src/screens/Sleep';
import Steps from './src/screens/Steps';
import Thyroid from './src/screens/Thyroid';
import Track from './src/screens/Track';
import Water from './src/screens/Water';
import Weight from './src/screens/Weight';
import Workout from './src/screens/Workout';
import { StoreProvider, useStore } from './src/store';
import { ThemeProvider, useTheme } from './src/theme';
import { ThemePref } from './src/types';
import { nowTime, today, uid } from './src/utils';

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: 'home', icon: '🏠', label: 'Home' },
  { key: 'track', icon: '📊', label: 'Track' },
  { key: 'meds', icon: '💊', label: 'Meds' },
  { key: 'records', icon: '📁', label: 'Records' },
  { key: 'family', icon: '👨‍👩‍👧', label: 'Family' },
];

/** Web-only deep links, e.g. ?demo=1&tab=meds&screen=weight&theme=dark (handy for previews/screenshots). */
const webParams = (() => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
})();

function TabBar() {
  const t = useTheme();
  const nav = useNav();
  return (
    <View style={{ backgroundColor: t.card, borderTopWidth: 1, borderTopColor: t.border }}>
      <View style={{ flexDirection: 'row', width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingVertical: 6 }}>
        {TABS.map((x) => {
          const on = nav.tab === x.key && nav.stack.length === 0;
          return (
            <Pressable key={x.key} onPress={() => nav.setTab(x.key)} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
              <View style={{ paddingHorizontal: 14, paddingVertical: 3, borderRadius: 14, backgroundColor: on ? t.primarySoft : 'transparent' }}>
                <Text style={{ fontSize: 20, opacity: on ? 1 : 0.6 }}>{x.icon}</Text>
              </View>
              <Text style={{ fontSize: 11, marginTop: 2, color: on ? t.primary : t.sub, fontWeight: on ? '700' : '500' }}>{x.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Banner({ r, onClose }: { r: PlannedReminder; onClose: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onClose}
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        maxWidth: MAX_WIDTH - 24,
        alignSelf: 'center',
        backgroundColor: t.card,
        borderColor: t.primary,
        borderWidth: 1.5,
        borderRadius: 16,
        padding: 14,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 10,
      }}
    >
      <Text style={{ color: t.text, fontWeight: '800', fontSize: 15 }}>{r.title}</Text>
      <Text style={{ color: t.sub, marginTop: 2 }}>{r.body}</Text>
      <Text style={{ color: t.primary, marginTop: 6, fontSize: 12, fontWeight: '700' }}>Tap to dismiss</Text>
    </Pressable>
  );
}

function renderStack(r: StackRoute, pedometer: ReturnType<typeof usePedometer>) {
  switch (r.name) {
    case 'steps':
      return <Steps pedometer={pedometer} />;
    case 'weight':
      return <Weight />;
    case 'calories':
      return <Calories />;
    case 'water':
      return <Water />;
    case 'sleep':
      return <Sleep />;
    case 'workout':
      return <Workout />;
    case 'pcos':
      return <Pcos />;
    case 'thyroid':
      return <Thyroid />;
    case 'medEdit':
      return <MedEdit key={r.id ?? r.preset ?? 'new'} id={r.id} preset={r.preset} />;
    case 'profileEdit':
      return <ProfileEdit key={r.id ?? 'new'} id={r.id} />;
    case 'backup':
      return <Backup />;
    case 'reminders':
      return <Reminders />;
    case 'settings':
      return <Settings />;
    case 'vitals':
      return <Vitals initial={r.type} />;
    case 'checkups':
      return <Checkups />;
    case 'checkupEdit':
      return <CheckupEdit key={r.id ?? 'new'} id={r.id} />;
    case 'checkupView':
      return <CheckupView id={r.id} />;
    case 'labTrend':
      return <LabTrend key={r.key} testKey={r.key} />;
    case 'reports':
      return <Reports />;
    case 'reportEdit':
      return <ReportEdit key={r.id ?? 'new'} id={r.id} />;
    case 'appointments':
      return <Appointments />;
    case 'vaccines':
      return <Vaccines />;
    case 'emergency':
      return <Emergency />;
    case 'medicalEdit':
      return <MedicalEdit />;
    case 'summary':
      return <Summary />;
  }
}

function Shell() {
  const t = useTheme();
  const nav = useNav();
  const store = useStore();
  const { ready, state, profile, mutate } = store;
  const pedometer = usePedometer();
  const [banner, setBanner] = useState<PlannedReminder | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setupReminders(
      (profileId, medId, slot) =>
        mutate((d) => ({ ...d, medLogs: [...d.medLogs, { id: uid(), medId, date: today(), time: nowTime(), slot }] }), profileId),
      (r) => {
        setBanner(r);
        if (bannerTimer.current) clearTimeout(bannerTimer.current);
        bannerTimer.current = setTimeout(() => setBanner(null), 60000);
      },
    ).catch(() => {});
  }, [mutate]);

  const reminderKey = JSON.stringify([
    state.profiles.map((p) => [p.id, p.name, p.reminders, p.targets.glassMl, p.targets.waterMl]),
    state.profiles.map((p) => [state.data[p.id]?.medicines, state.data[p.id]?.appointments, state.data[p.id]?.vaccines]),
  ]);
  useEffect(() => {
    if (!ready) return;
    const h = setTimeout(() => syncReminders(state).catch(() => {}), 800);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminderKey, ready]);

  useEffect(() => {
    if (!ready) return;
    if (webParams.get('demo') === '1' && state.profiles.length === 0) store.importJson(JSON.stringify(demoState()));
    const th = webParams.get('theme') as ThemePref | null;
    if (th && ['light', 'dark', 'system'].includes(th)) store.setTheme(th);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <ActivityIndicator color={t.primary} />
      </View>
    );

  if (state.pinHash && !unlocked) return <LockScreen pinHash={state.pinHash} onUnlock={() => setUnlocked(true)} />;

  if (!profile) return <ProfileEdit onboarding />;

  const top = nav.stack[nav.stack.length - 1];
  let content: React.ReactNode;
  if (top) content = renderStack(top, pedometer);
  else if (nav.tab === 'home') content = <Dashboard />;
  else if (nav.tab === 'track') content = <Track />;
  else if (nav.tab === 'meds') content = <Meds />;
  else if (nav.tab === 'records') content = <Records />;
  else content = <Family />;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{content}</View>
      <TabBar />
      {banner && <Banner r={banner} onClose={() => setBanner(null)} />}
    </View>
  );
}

function Themed() {
  const t = useTheme();
  const initialTab = (webParams.get('tab') as Tab) || 'home';
  const screen = webParams.get('screen') as StackRoute['name'] | null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      <NavProvider initialTab={initialTab} initialStack={screen ? [{ name: screen } as StackRoute] : []}>
        <Shell />
      </NavProvider>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <ThemeProvider>
          <Themed />
        </ThemeProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
