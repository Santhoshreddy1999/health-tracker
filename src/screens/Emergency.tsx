import React, { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { Body, Button, Card, Chips, Field, H2, Label, notify, Row, Screen, Sub } from '../components/ui';
import { useNav } from '../nav';
import { latestWeight } from '../selectors';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { Contact, MedicalInfo } from '../types';
import { uid } from '../utils';

const BLOOD = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RELATIONS = ['Self', 'Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Grandparent', 'Other'];

export default function Emergency() {
  const t = useTheme();
  const nav = useNav();
  const { profile, data } = useStore();
  if (!profile) return null;
  const m = profile.medical;
  const meds = data.medicines.filter((x) => x.active);
  const w = latestWeight(data);

  const Line = ({ label, value }: { label: string; value: string }) => (
    <View style={{ marginBottom: 10 }}>
      <Label>{label}</Label>
      <Body style={{ fontWeight: '600' }}>{value || '—'}</Body>
    </View>
  );

  return (
    <Screen title="Medical ID" onBack={nav.back} right={<Button small variant="soft" title="Edit" onPress={() => nav.push({ name: 'medicalEdit' })} />}>
      <Card style={{ borderColor: '#EF4444', borderWidth: 2 }}>
        <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 22, fontWeight: '800' }}>{profile.name}</Text>
            <Sub>
              {profile.age} y · {profile.sex} · {profile.heightCm} cm{w ? ` · ${w} kg` : ''}
              {m.dob ? ` · born ${m.dob}` : ''}
            </Sub>
          </View>
          <View style={{ backgroundColor: '#EF4444', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>BLOOD</Text>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>{m.bloodGroup || '?'}</Text>
          </View>
        </Row>
        <Line label="⚠️ Allergies" value={m.allergies} />
        <Line label="Conditions" value={profile.conditions.join(', ')} />
        <Line label="Current medicines" value={meds.map((x) => `${x.name} ${x.dose}`).join(', ')} />
        <Line label="Insurance" value={m.insurance} />
        {m.notes ? <Line label="Other notes" value={m.notes} /> : null}
      </Card>

      <Card>
        <H2>🚨 Emergency contacts</H2>
        {m.emergency.length === 0 && <Sub>Add family members to call in an emergency.</Sub>}
        {m.emergency.map((c) => (
          <Row key={c.id} style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: '700' }}>{c.name}</Body>
              <Sub>{c.role}</Sub>
            </View>
            {c.phone ? <Button small color="#EF4444" title={`📞 Call`} onPress={() => Linking.openURL(`tel:${c.phone}`)} /> : null}
          </Row>
        ))}
        <Button small variant="ghost" title="📞 Call ambulance (108 / 112)" style={{ marginTop: 10 }} onPress={() => Linking.openURL('tel:112')} />
      </Card>

      <Card>
        <H2>👨‍⚕️ Doctors</H2>
        {m.doctors.length === 0 && <Sub>Add your family doctor and specialists.</Sub>}
        {m.doctors.map((c) => (
          <Row key={c.id} style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: '700' }}>{c.name}</Body>
              <Sub>{c.role}</Sub>
            </View>
            {c.phone ? <Button small variant="soft" title="📞" onPress={() => Linking.openURL(`tel:${c.phone}`)} /> : null}
          </Row>
        ))}
      </Card>
      <Sub style={{ textAlign: 'center' }}>Tip: screenshot this card and set it as your lock-screen wallpaper so responders can see it.</Sub>
    </Screen>
  );
}

function ContactEditor({ title, list, onChange, rolePlaceholder }: { title: string; list: Contact[]; onChange: (l: Contact[]) => void; rolePlaceholder: string }) {
  const [c, setC] = useState<Contact>({ id: uid(), name: '', role: '', phone: '' });
  return (
    <Card>
      <H2>{title}</H2>
      {list.map((x) => (
        <Row key={x.id} style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
          <Body style={{ flex: 1 }}>
            {x.name} <Text style={{ opacity: 0.6 }}>{[x.role, x.phone].filter(Boolean).join(' · ')}</Text>
          </Body>
          <Button small variant="ghost" title="✕" onPress={() => onChange(list.filter((y) => y.id !== x.id))} />
        </Row>
      ))}
      <Row>
        <Field label="Name" value={c.name} onChangeText={(name) => setC({ ...c, name })} />
        <Field label="Role" value={c.role} onChangeText={(role) => setC({ ...c, role })} placeholder={rolePlaceholder} />
      </Row>
      <Row>
        <Field label="Phone" value={c.phone} onChangeText={(phone) => setC({ ...c, phone })} keyboardType="phone-pad" />
        <Button
          title="Add"
          variant="soft"
          style={{ marginTop: 10 }}
          onPress={() => {
            if (!c.name.trim()) return notify('Enter a name.');
            onChange([...list, { ...c, name: c.name.trim() }]);
            setC({ id: uid(), name: '', role: '', phone: '' });
          }}
        />
      </Row>
    </Card>
  );
}

export function MedicalEdit() {
  const nav = useNav();
  const { profile, saveProfile } = useStore();
  const [m, setM] = useState<MedicalInfo>(profile!.medical);
  if (!profile) return null;
  const save = () => {
    saveProfile({ ...profile, medical: m });
    nav.back();
  };
  return (
    <Screen title="Edit medical info" subtitle={profile.name} onBack={nav.back}>
      <Card>
        <Label>Relation to you</Label>
        <Chips options={RELATIONS} value={m.relation} onChange={(relation) => setM({ ...m, relation })} />
        <Label>Blood group</Label>
        <Chips options={BLOOD} value={m.bloodGroup} onChange={(bloodGroup) => setM({ ...m, bloodGroup })} color="#EF4444" />
        <Field label="Date of birth (YYYY-MM-DD)" value={m.dob} onChangeText={(dob) => setM({ ...m, dob })} maxLength={10} />
        <Field label="Allergies (medicines, food…)" value={m.allergies} onChangeText={(allergies) => setM({ ...m, allergies })} placeholder="e.g. Penicillin, peanuts" />
        <Field label="Insurance (provider, policy no.)" value={m.insurance} onChangeText={(insurance) => setM({ ...m, insurance })} />
        <Field label="Other notes (surgeries, implants…)" value={m.notes} onChangeText={(notes) => setM({ ...m, notes })} multiline />
      </Card>
      <ContactEditor title="🚨 Emergency contacts" list={m.emergency} onChange={(emergency) => setM({ ...m, emergency })} rolePlaceholder="e.g. Wife" />
      <ContactEditor title="👨‍⚕️ Doctors" list={m.doctors} onChange={(doctors) => setM({ ...m, doctors })} rolePlaceholder="e.g. Endocrinologist" />
      <Button title="Save" onPress={save} />
    </Screen>
  );
}
