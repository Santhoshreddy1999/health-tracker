import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useMemo } from 'react';
import { Platform, Text, View } from 'react-native';
import { Button, Card, Screen, Sub } from '../components/ui';
import { flagFor, rangeText, testByKey } from '../labs';
import { useNav } from '../nav';
import { cycleStats, latestLabValues, latestVital, latestWeight, upcomingAppointments, weightSeries } from '../selectors';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { Profile, ProfileData, VitalType } from '../types';
import { bmi, sortByDateDesc, today } from '../utils';
import { classifyVital, formatVital, VITALS } from '../vitals';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function buildSummaryHtml(p: Profile, d: ProfileData) {
  const m = p.medical;
  const w = latestWeight(d);
  const ws = weightSeries(d);
  const meds = d.medicines.filter((x) => x.active);
  const labs = Object.entries(latestLabValues(d)).filter(([k]) => testByKey[k]);
  const vit = (Object.keys(VITALS) as VitalType[]).map((k) => [k, latestVital(d, k)] as const).filter(([, v]) => v);
  const cyc = cycleStats(d.cycles);
  const sym = sortByDateDesc(d.symptoms).slice(0, 5);
  const row = (cells: string[]) => `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
  const section = (title: string, body: string) => (body ? `<h2>${title}</h2>${body}` : '');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Health summary – ${esc(p.name)}</title>
<style>
body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;margin:28px;font-size:12px}
h1{margin:0;font-size:22px} h2{font-size:14px;margin:18px 0 6px;border-bottom:2px solid #6366f1;padding-bottom:3px;color:#4338ca}
table{border-collapse:collapse;width:100%} td,th{border:1px solid #e2e8f0;padding:5px 7px;text-align:left;vertical-align:top}
th{background:#eef2ff} .muted{color:#64748b} .hi{color:#dc2626;font-weight:700} .lo{color:#d97706;font-weight:700} .box{display:inline-block;background:#fee2e2;color:#b91c1c;padding:4px 10px;border-radius:8px;font-weight:800}
</style></head><body>
<h1>${esc(p.name)} <span class="box">${esc(m.bloodGroup || 'Blood ?')}</span></h1>
<div class="muted">${p.age} y · ${p.sex} · ${p.heightCm} cm${w ? ` · ${w} kg · BMI ${bmi(w, p.heightCm).toFixed(1)}` : ''}${m.dob ? ` · DOB ${esc(m.dob)}` : ''} · Generated ${today()}</div>
${section('Key facts', `<table>
${row(['<b>Conditions</b>', esc(p.conditions.join(', ') || '—')])}
${row(['<b>Allergies</b>', esc(m.allergies || 'None recorded')])}
${m.notes ? row(['<b>Notes</b>', esc(m.notes)]) : ''}
${m.insurance ? row(['<b>Insurance</b>', esc(m.insurance)]) : ''}
</table>`)}
${section('Current medicines', meds.length ? `<table><tr><th>Medicine</th><th>Dose</th><th>Times</th><th>Notes</th></tr>${meds.map((x) => row([esc(x.name), esc(x.dose), x.times.join(', '), esc(x.notes)])).join('')}</table>` : '')}
${section('Latest vitals', vit.length ? `<table><tr><th>Vital</th><th>Reading</th><th>Date</th><th>Status</th></tr>${vit.map(([k, v]) => row([VITALS[k].label, `${formatVital(v!)} ${VITALS[k].unit}${v!.context ? ' (' + v!.context + ')' : ''}`, `${v!.date} ${v!.time}`, classifyVital(v!).text])).join('')}</table>` : '')}
${section('Latest lab values', labs.length ? `<table><tr><th>Test</th><th>Value</th><th>Normal range</th><th>Date</th></tr>${labs.map(([k, v]) => { const f = flagFor(k, v.value, p.sex); const cls = f === 'high' ? 'hi' : f === 'low' ? 'lo' : ''; return row([testByKey[k].name, `<span class="${cls}">${v.value} ${testByKey[k].unit}${f === 'high' ? ' ▲' : f === 'low' ? ' ▼' : ''}</span>`, rangeText(testByKey[k], p.sex), v.date]); }).join('')}</table>` : '')}
${section('Weight trend', ws.length > 1 ? `<p>${ws[0].y} kg (${ws[0].x}) → ${ws[ws.length - 1].y} kg (${ws[ws.length - 1].x}); target ${p.targets.weightKg} kg.</p>` : '')}
${section('Menstrual cycle', cyc.lastStart ? `<p>Last period ${cyc.lastStart}; average cycle ${cyc.avgLength ?? '—'} days; cycle lengths: ${cyc.lengths.join(', ') || '—'}.</p>${sym.length ? `<p>Recent symptoms: ${sym.map((s) => `${s.date}: ${esc(s.symptoms.join(', '))}`).join('; ')}</p>` : ''}` : '')}
${section('Upcoming appointments', upcomingAppointments(d).slice(0, 5).map((a) => `<div>${a.date} ${a.time} – ${esc(a.doctor || a.specialty)} ${a.reason ? '· ' + esc(a.reason) : ''}</div>`).join(''))}
${section('Doctors', m.doctors.map((c) => `<div>${esc(c.name)} – ${esc(c.role)} ${esc(c.phone)}</div>`).join(''))}
${section('Emergency contacts', m.emergency.map((c) => `<div>${esc(c.name)} – ${esc(c.role)} ${esc(c.phone)}</div>`).join(''))}
<p class="muted" style="margin-top:24px">Self-recorded data from a personal health tracker. Reference ranges are typical adult values; please refer to the original lab reports.</p>
</body></html>`;
}

export default function Summary() {
  const t = useTheme();
  const nav = useNav();
  const { profile, data } = useStore();
  const html = useMemo(() => (profile ? buildSummaryHtml(profile, data) : ''), [profile, data]);
  if (!profile) return null;

  const share = async () => {
    if (Platform.OS === 'web') {
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 400);
      return;
    }
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Health summary – ${profile.name}` });
  };

  const labs = Object.keys(latestLabValues(data)).length;
  return (
    <Screen title="Doctor visit summary" subtitle={profile.name} onBack={nav.back}>
      <Card>
        <Text style={{ color: t.text, fontSize: 15, lineHeight: 22 }}>
          Creates a one-page PDF with {profile.name}’s key facts, allergies, current medicines ({data.medicines.filter((m) => m.active).length}), latest vitals, latest lab values ({labs}) with
          out-of-range flags, weight trend, cycle summary, appointments and contacts.
        </Text>
        <Button title={Platform.OS === 'web' ? '🖨 Open & print / save as PDF' : '📄 Create PDF & share'} style={{ marginTop: 14 }} onPress={share} />
        {Platform.OS !== 'web' && <Button title="🖨 Print" variant="soft" style={{ marginTop: 8 }} onPress={() => Print.printAsync({ html })} />}
      </Card>
      <Sub style={{ textAlign: 'center' }}>Share it on WhatsApp/email before a consultation, or print it for a new doctor.</Sub>
      <View />
    </Screen>
  );
}
