import React, { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { DateField } from '../components/DateField';
import { Body, Button, Card, Chips, Empty, Field, H2, ListItem, notify, Row, Screen, Sub } from '../components/ui';
import { useNav } from '../nav';
import { upcomingAppointments } from '../selectors';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { Appointment, Vaccine } from '../types';
import { addDays, daysBetween, isValidDate, isValidTime, normalizeTime, prettyDate, today, uid } from '../utils';

const SPECIALTIES = ['General physician', 'Endocrinologist', 'Gynaecologist', 'Ophthalmologist', 'Cardiologist', 'Dentist', 'Paediatrician', 'Dermatologist', 'Orthopaedic', 'Other'];

export default function Appointments() {
  const t = useTheme();
  const nav = useNav();
  const { profile, data, add, update, remove } = useStore();
  const blank = (): Appointment => ({ id: uid(), date: addDays(today(), 7), time: '10:00', doctor: '', specialty: 'General physician', place: '', reason: '', notes: '', done: false });
  const [a, setA] = useState<Appointment>(blank);
  const [open, setOpen] = useState(false);
  if (!profile) return null;
  const upcoming = upcomingAppointments(data);
  const past = data.appointments.filter((x) => x.done || x.date < today()).sort((x, y) => y.date.localeCompare(x.date));

  const save = () => {
    const time = normalizeTime(a.time);
    if (!isValidDate(a.date) || !isValidTime(time)) return notify('Enter a valid date and time.');
    const out = { ...a, time };
    data.appointments.some((x) => x.id === a.id) ? update('appointments', out) : add('appointments', out);
    setA(blank());
    setOpen(false);
  };

  const doctors = profile.medical.doctors;

  return (
    <Screen title="Appointments" onBack={nav.back} right={!open ? <Button small title="+ Add" onPress={() => setOpen(true)} /> : undefined}>
      {open && (
        <Card>
          <H2>{data.appointments.some((x) => x.id === a.id) ? 'Edit appointment' : 'New appointment'}</H2>
          {doctors.length > 0 && (
            <Chips
              options={doctors.map((d) => ({ value: d.id, label: `👨‍⚕️ ${d.name}` }))}
              value={doctors.find((d) => d.name === a.doctor)?.id ?? ''}
              onChange={(id: string) => {
                const d = doctors.find((x) => x.id === id);
                if (d) setA({ ...a, doctor: d.name, specialty: d.role || a.specialty });
              }}
            />
          )}
          <Row>
            <Field label="Doctor" value={a.doctor} onChangeText={(doctor) => setA({ ...a, doctor })} placeholder="Dr. …" />
            <Field label="Hospital / clinic" value={a.place} onChangeText={(place) => setA({ ...a, place })} />
          </Row>
          <Chips options={SPECIALTIES} value={a.specialty} onChange={(specialty) => setA({ ...a, specialty })} />
          <Row style={{ alignItems: 'flex-start' }}>
            <DateField value={a.date} onChange={(date) => setA({ ...a, date })} />
            <Field label="Time" value={a.time} onChangeText={(time) => setA({ ...a, time })} maxLength={5} style={{ flexGrow: 0, flexBasis: 92 }} />
          </Row>
          <Field label="Reason" value={a.reason} onChangeText={(reason) => setA({ ...a, reason })} placeholder="e.g. Thyroid review, bring TSH report" />
          <Field label="Notes / outcome" value={a.notes} onChangeText={(notes) => setA({ ...a, notes })} multiline />
          <Row gap={8}>
            <Button title="Save" style={{ flex: 1 }} onPress={save} />
            <Button title="Cancel" variant="ghost" style={{ flex: 1 }} onPress={() => { setOpen(false); setA(blank()); }} />
          </Row>
          <Sub style={{ marginTop: 8 }}>You’ll be reminded the evening before and 2 hours before.</Sub>
        </Card>
      )}

      <Card>
        <H2>Upcoming</H2>
        {upcoming.length === 0 && <Empty text="No upcoming appointments." />}
        {upcoming.map((x) => {
          const days = daysBetween(today(), x.date);
          return (
            <View key={x.id} style={{ flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border }}>
              <View style={{ width: 54, alignItems: 'center', backgroundColor: t.primarySoft, borderRadius: 12, paddingVertical: 6 }}>
                <Text style={{ color: t.primary, fontWeight: '800', fontSize: 18 }}>{x.date.slice(8)}</Text>
                <Text style={{ color: t.primary, fontSize: 11 }}>{new Date(x.date).toLocaleDateString(undefined, { month: 'short' })}</Text>
              </View>
              <Pressable style={{ flex: 1 }} onPress={() => { setA(x); setOpen(true); }}>
                <Body style={{ fontWeight: '700' }}>{x.doctor || x.specialty}</Body>
                <Sub>
                  {x.time} · {x.specialty}
                  {x.place ? ` · ${x.place}` : ''}
                </Sub>
                {x.reason ? <Sub>{x.reason}</Sub> : null}
                <Sub style={{ color: days <= 1 ? t.warning : t.sub, fontWeight: '700' }}>{days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}</Sub>
              </Pressable>
              <Button small variant="soft" color={t.success} title="✓ Done" onPress={() => update('appointments', { ...x, done: true })} />
            </View>
          );
        })}
      </Card>

      <Card>
        <H2>Past visits</H2>
        {past.length === 0 && <Empty text="No past visits." />}
        {past.slice(0, 30).map((x) => (
          <ListItem
            key={x.id}
            title={`${x.doctor || x.specialty}`}
            subtitle={`${prettyDate(x.date)} · ${x.specialty}${x.notes ? ' · ' + x.notes : ''}`}
            onPress={() => { setA(x); setOpen(true); }}
            onDelete={() => remove('appointments', x.id)}
          />
        ))}
      </Card>

      {doctors.length > 0 && (
        <Card>
          <H2>My doctors</H2>
          {doctors.map((d) => (
            <Row key={d.id} style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
              <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: '600' }}>{d.name}</Body>
                <Sub>{d.role}</Sub>
              </View>
              {d.phone ? <Button small variant="soft" title={`📞 ${d.phone}`} onPress={() => Linking.openURL(`tel:${d.phone}`)} /> : null}
            </Row>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const COMMON_VACCINES = ['COVID-19', 'Influenza (flu)', 'Tetanus (Td/Tdap)', 'Hepatitis B', 'HPV', 'Typhoid', 'MMR', 'Pneumococcal', 'Chickenpox', 'Rabies'];

export function Vaccines() {
  const nav = useNav();
  const { data, add, remove } = useStore();
  const [v, setV] = useState<Vaccine>({ id: uid(), date: today(), name: '', dose: '', nextDue: '', notes: '' });

  const save = () => {
    if (!v.name.trim() || !isValidDate(v.date)) return notify('Enter the vaccine name and date.');
    if (v.nextDue && !isValidDate(v.nextDue)) return notify('Next due date must be YYYY-MM-DD.');
    add('vaccines', { ...v, name: v.name.trim() });
    setV({ id: uid(), date: today(), name: '', dose: '', nextDue: '', notes: '' });
  };

  return (
    <Screen title="Vaccinations" onBack={nav.back}>
      <Card>
        <H2>Add vaccination</H2>
        <Chips options={COMMON_VACCINES} value={v.name} onChange={(name) => setV({ ...v, name })} />
        <Row>
          <Field label="Vaccine" value={v.name} onChangeText={(name) => setV({ ...v, name })} />
          <Field label="Dose" value={v.dose} onChangeText={(dose) => setV({ ...v, dose })} placeholder="e.g. Booster / Dose 2" />
        </Row>
        <DateField label="Given on" value={v.date} onChange={(date) => setV({ ...v, date })} />
        <Field label="Next dose due (optional, YYYY-MM-DD)" value={v.nextDue} onChangeText={(nextDue) => setV({ ...v, nextDue })} maxLength={10} />
        <Row gap={6} style={{ marginTop: -6, marginBottom: 12, flexWrap: 'wrap' }}>
          {[['+1 month', 30], ['+6 months', 182], ['+1 year', 365], ['+10 years', 3650]].map(([l, d]) => (
            <Button key={l} small variant="ghost" title={String(l)} onPress={() => setV({ ...v, nextDue: addDays(isValidDate(v.date) ? v.date : today(), Number(d)) })} />
          ))}
        </Row>
        <Button title="Save" onPress={save} />
      </Card>
      <Card>
        <H2>Record</H2>
        {data.vaccines.length === 0 && <Empty text="No vaccinations recorded." />}
        {[...data.vaccines]
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((x) => (
            <ListItem
              key={x.id}
              title={`${x.name}${x.dose ? ' · ' + x.dose : ''}`}
              subtitle={`Given ${prettyDate(x.date)}${x.nextDue ? ` · next due ${x.nextDue}` : ''}`}
              onDelete={() => remove('vaccines', x.id)}
            />
          ))}
      </Card>
    </Screen>
  );
}

