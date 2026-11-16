import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LineChart } from '../components/charts';
import { DateField } from '../components/DateField';
import { Body, Button, Card, Chips, confirmAsync, Empty, Field, H2, Label, notify, Row, Screen, Stat, Sub } from '../components/ui';
import { openFile } from '../files/storage';
import { Flag, flagFor, LAB_TESTS, PANELS, rangeFor, rangeText, testByKey } from '../labs';
import { useNav } from '../nav';
import { abnormalLabs, labHistory, latestLabValues } from '../selectors';
import { useStore } from '../store';
import { Theme, useTheme } from '../theme';
import { Checkup, Sex } from '../types';
import { isValidDate, num, prettyDate, today, uid } from '../utils';

const flagColor = (t: Theme, f: Flag) => (f === 'high' ? t.danger : f === 'low' ? t.warning : f === 'normal' ? t.success : t.sub);
const flagLabel: Record<Flag, string> = { high: '▲ High', low: '▼ Low', normal: '✓ Normal', unknown: '' };

function RangeBar({ testKey, value, sex }: { testKey: string; value: number; sex: Sex }) {
  const t = useTheme();
  const { low, high } = rangeFor(testByKey[testKey], sex);
  const lo = low ?? 0;
  const hi = high ?? (low ?? value) * 2;
  const min = Math.min(lo * 0.5, value);
  const max = Math.max(hi * 1.5, value) || 1;
  const pos = (v: number) => `${((v - min) / (max - min)) * 100}%` as const;
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: t.cardAlt, marginTop: 6, overflow: 'visible' }}>
      <View style={{ position: 'absolute', left: pos(lo), width: `${((hi - lo) / (max - min)) * 100}%`, height: 8, backgroundColor: t.success + '55', borderRadius: 4 }} />
      <View style={{ position: 'absolute', left: pos(value), marginLeft: -6, top: -3, width: 14, height: 14, borderRadius: 7, backgroundColor: flagColor(t, flagFor(testKey, value, sex)), borderWidth: 2, borderColor: t.card }} />
    </View>
  );
}

export default function Checkups() {
  const t = useTheme();
  const nav = useNav();
  const { profile, data } = useStore();
  if (!profile) return null;
  const latest = latestLabValues(data);
  const flagged = abnormalLabs(data, profile.sex);
  const tracked = Object.keys(latest).filter((k) => testByKey[k]);

  return (
    <Screen title="Check-ups & labs" onBack={nav.back} right={<Button small title="+ New" onPress={() => nav.push({ name: 'checkupEdit' })} />}>
      <Card>
        <Row>
          <Stat label="Check-ups" value={`${data.checkups.length}`} />
          <Stat label="Tests tracked" value={`${tracked.length}`} />
          <Stat label="Out of range" value={`${flagged.length}`} color={flagged.length ? t.danger : t.success} />
        </Row>
      </Card>

      {flagged.length > 0 && (
        <Card>
          <H2>Needs attention (latest values)</H2>
          {flagged.map((f) => (
            <Pressable key={f.key} onPress={() => nav.push({ name: 'labTrend', key: f.key })} style={{ paddingVertical: 8 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Body style={{ fontWeight: '600' }}>{testByKey[f.key].name}</Body>
                <Text style={{ color: flagColor(t, f.flag), fontWeight: '800' }}>
                  {f.value} {testByKey[f.key].unit} {flagLabel[f.flag]}
                </Text>
              </Row>
              <Sub>
                Normal {rangeText(testByKey[f.key], profile.sex)} · {prettyDate(f.date)}
              </Sub>
            </Pressable>
          ))}
        </Card>
      )}

      <Card>
        <H2>History</H2>
        {data.checkups.length === 0 && <Empty text="Add your latest health check-up — enter values from the lab report to track trends." />}
        {[...data.checkups]
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((c) => {
            const n = Object.entries(c.values).filter(([k, v]) => ['low', 'high'].includes(flagFor(k, v, profile.sex))).length;
            return (
              <Pressable key={c.id} onPress={() => nav.push({ name: 'checkupView', id: c.id })} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Body style={{ fontWeight: '700', flex: 1 }}>{c.title || 'Health check-up'}</Body>
                  <Text style={{ color: n ? t.danger : t.success, fontWeight: '700', fontSize: 13 }}>{n ? `${n} flagged` : 'All normal'}</Text>
                </Row>
                <Sub>
                  {prettyDate(c.date)}
                  {c.lab ? ` · ${c.lab}` : ''} · {Object.keys(c.values).length} tests{c.reportIds.length ? ` · 📎 ${c.reportIds.length}` : ''}
                </Sub>
              </Pressable>
            );
          })}
      </Card>

      {tracked.length > 0 && (
        <Card>
          <H2>Trends by test</H2>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {tracked.map((k) => (
              <Button key={k} small variant="soft" color={flagColor(t, flagFor(k, latest[k].value, profile.sex))} title={testByKey[k].name} onPress={() => nav.push({ name: 'labTrend', key: k })} />
            ))}
          </View>
        </Card>
      )}
    </Screen>
  );
}

export function CheckupEdit({ id }: { id?: string }) {
  const t = useTheme();
  const nav = useNav();
  const { profile, data, add, update } = useStore();
  const existing = data.checkups.find((c) => c.id === id);
  const [c, setC] = useState<Checkup>(existing ?? { id: uid(), date: today(), title: 'Full body check-up', lab: '', doctor: '', values: {}, reportIds: [], notes: '' });
  const [vals, setVals] = useState<Record<string, string>>(Object.fromEntries(Object.entries(c.values).map(([k, v]) => [k, String(v)])));
  const initialPanels = existing ? [...new Set(Object.keys(existing.values).map((k) => testByKey[k]?.panel).filter(Boolean))] : ['Diabetes', 'Lipid profile', 'Blood count (CBC)', 'Thyroid'];
  const [panels, setPanels] = useState<string[]>(initialPanels as string[]);
  if (!profile) return null;
  const visiblePanels = PANELS.filter((p) => panels.includes(p));

  const save = () => {
    if (!isValidDate(c.date)) return notify('Enter a valid date.');
    const values: Record<string, number> = {};
    for (const [k, v] of Object.entries(vals)) if (v.trim() && num(v) > 0) values[k] = num(v);
    if (!Object.keys(values).length) return notify('Enter at least one test value.');
    const out = { ...c, values };
    existing ? update('checkups', out) : add('checkups', out);
    nav.back();
  };

  return (
    <Screen title={existing ? 'Edit check-up' : 'New check-up'} onBack={nav.back}>
      <Card>
        <Field label="Title" value={c.title} onChangeText={(title) => setC({ ...c, title })} />
        <DateField label="Test date" value={c.date} onChange={(date) => setC({ ...c, date })} />
        <Row>
          <Field label="Lab / hospital" value={c.lab} onChangeText={(lab) => setC({ ...c, lab })} />
          <Field label="Doctor" value={c.doctor} onChangeText={(doctor) => setC({ ...c, doctor })} />
        </Row>
      </Card>

      <Card>
        <H2>Panels in this report</H2>
        <Chips options={PANELS} value={panels} multi onChange={setPanels} color={t.accent.weight} />
        <Sub>Leave a test blank if it wasn’t done. Ranges shown are typical adult ranges for {profile.sex === 'other' ? 'adults' : profile.sex + 's'}.</Sub>
      </Card>

      {visiblePanels.map((p) => (
        <Card key={p}>
          <H2>{p}</H2>
          {LAB_TESTS.filter((x) => x.panel === p).map((x) => {
            const v = vals[x.key] ?? '';
            const f = v ? flagFor(x.key, num(v), profile.sex) : 'unknown';
            return (
              <Row key={x.key} style={{ alignItems: 'center', marginBottom: 2 }}>
                <View style={{ flex: 1.4 }}>
                  <Body style={{ fontSize: 14, fontWeight: '600' }}>{x.name}</Body>
                  <Sub style={{ fontSize: 11 }}>
                    {rangeText(x, profile.sex)} {x.unit}
                    {f !== 'unknown' && <Text style={{ color: flagColor(t, f), fontWeight: '700' }}>  {flagLabel[f]}</Text>}
                  </Sub>
                </View>
                <Field label="" value={v} onChangeText={(s) => setVals({ ...vals, [x.key]: s })} keyboardType="decimal-pad" placeholder="—" style={{ flex: 0.8, marginBottom: 6 }} />
              </Row>
            );
          })}
        </Card>
      ))}

      <Card>
        <H2>Attach report files</H2>
        {data.reports.length === 0 ? (
          <Sub>Upload the PDF in the Reports vault, then attach it here.</Sub>
        ) : (
          <Chips
            options={data.reports.map((r) => ({ value: r.id, label: `📎 ${r.title}` }))}
            value={c.reportIds}
            multi
            onChange={(reportIds: string[]) => setC({ ...c, reportIds })}
          />
        )}
        <Button small variant="ghost" title="+ Upload a new report" onPress={() => nav.push({ name: 'reportEdit' })} />
        <Field label="Doctor’s notes" value={c.notes} onChangeText={(notes) => setC({ ...c, notes })} multiline style={{ marginTop: 12 }} />
      </Card>

      <Button title="Save check-up" color={t.accent.weight} onPress={save} />
    </Screen>
  );
}

export function CheckupView({ id }: { id: string }) {
  const t = useTheme();
  const nav = useNav();
  const { profile, data, remove } = useStore();
  const c = data.checkups.find((x) => x.id === id);
  if (!profile || !c) return null;
  const entries = Object.entries(c.values).filter(([k]) => testByKey[k]);
  const byPanel = PANELS.map((p) => [p, entries.filter(([k]) => testByKey[k].panel === p)] as const).filter(([, e]) => e.length);
  const flagged = entries.filter(([k, v]) => ['low', 'high'].includes(flagFor(k, v, profile.sex))).length;

  return (
    <Screen title={c.title || 'Check-up'} subtitle={`${prettyDate(c.date)}${c.lab ? ' · ' + c.lab : ''}${c.doctor ? ' · ' + c.doctor : ''}`} onBack={nav.back}>
      <Card>
        <Row>
          <Stat label="Tests" value={`${entries.length}`} />
          <Stat label="Normal" value={`${entries.length - flagged}`} color={t.success} />
          <Stat label="Flagged" value={`${flagged}`} color={flagged ? t.danger : t.success} />
        </Row>
      </Card>
      {byPanel.map(([p, e]) => (
        <Card key={p}>
          <H2>{p}</H2>
          {e.map(([k, v]) => {
            const test = testByKey[k];
            const f = flagFor(k, v, profile.sex);
            return (
              <Pressable key={k} onPress={() => nav.push({ name: 'labTrend', key: k })} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Body style={{ fontWeight: '600', flex: 1 }}>{test.name}</Body>
                  <Text style={{ color: flagColor(t, f), fontWeight: '800' }}>
                    {v} <Text style={{ fontWeight: '500', fontSize: 12 }}>{test.unit}</Text>
                  </Text>
                </Row>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Sub style={{ fontSize: 11 }}>Normal {rangeText(test, profile.sex)}</Sub>
                  <Sub style={{ fontSize: 11, color: flagColor(t, f), fontWeight: '700' }}>{flagLabel[f]}</Sub>
                </Row>
                <RangeBar testKey={k} value={v} sex={profile.sex} />
              </Pressable>
            );
          })}
        </Card>
      ))}
      {(c.reportIds.length > 0 || c.notes) && (
        <Card>
          {c.notes ? (
            <>
              <Label>Notes</Label>
              <Body style={{ marginBottom: 10 }}>{c.notes}</Body>
            </>
          ) : null}
          {c.reportIds
            .map((rid) => data.reports.find((r) => r.id === rid))
            .filter(Boolean)
            .map((r) => (
              <Button key={r!.id} small variant="soft" title={`📎 Open ${r!.title}`} style={{ marginBottom: 6 }} onPress={() => openFile(r!.storageKey, r!.mime).catch(() => notify('File not found.'))} />
            ))}
        </Card>
      )}
      <Row gap={10}>
        <Button title="Edit" variant="soft" style={{ flex: 1 }} onPress={() => nav.push({ name: 'checkupEdit', id: c.id })} />
        <Button
          title="Delete"
          variant="danger"
          style={{ flex: 1 }}
          onPress={async () => {
            if (await confirmAsync('Delete this check-up?')) {
              remove('checkups', c.id);
              nav.back();
            }
          }}
        />
      </Row>
    </Screen>
  );
}

export function LabTrend({ testKey }: { testKey: string }) {
  const t = useTheme();
  const nav = useNav();
  const { profile, data } = useStore();
  const test = testByKey[testKey];
  if (!profile || !test) return null;
  const h = labHistory(data, testKey);
  const { low, high } = rangeFor(test, profile.sex);
  const last = h[h.length - 1];
  const prev = h[h.length - 2];
  return (
    <Screen title={test.name} subtitle={`${test.panel} · normal ${rangeText(test, profile.sex)} ${test.unit}`} onBack={nav.back}>
      <Card>
        <Row>
          <Stat label="Latest" value={last ? `${last.value}` : '—'} color={last ? flagColor(t, flagFor(testKey, last.value, profile.sex)) : undefined} />
          <Stat label="Previous" value={prev ? `${prev.value}` : '—'} />
          <Stat label="Change" value={last && prev ? `${last.value - prev.value >= 0 ? '+' : ''}${(last.value - prev.value).toFixed(2).replace(/\.?0+$/, '')}` : '—'} />
        </Row>
      </Card>
      <Card>
        <H2>Trend</H2>
        <LineChart points={h.map((p) => ({ x: p.date, y: p.value }))} target={high ?? low} color={t.accent.weight} unit={` ${high != null ? '(upper)' : '(lower)'}`} />
      </Card>
      <Card>
        <H2>All results</H2>
        {[...h].reverse().map((p, i) => {
          const f = flagFor(testKey, p.value, profile.sex);
          return (
            <Row key={i} style={{ justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.border }}>
              <View>
                <Body>{prettyDate(p.date)}</Body>
                <Sub>{p.source}</Sub>
              </View>
              <Text style={{ color: flagColor(t, f), fontWeight: '800' }}>
                {p.value} {test.unit} {flagLabel[f]}
              </Text>
            </Row>
          );
        })}
      </Card>
    </Screen>
  );
}
