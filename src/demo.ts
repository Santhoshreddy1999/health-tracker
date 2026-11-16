import { emptyData, newProfile } from './store';
import { AppState, ProfileData } from './types';
import { addDays, lastNDays, today, uid } from './utils';

const rnd = (min: number, max: number) => Math.round(min + Math.random() * (max - min));

/** Sample data so the app can be explored before real entries exist. */
export function demoState(): AppState {
  const me = newProfile({ name: 'Santhosh', age: 32, sex: 'male', heightCm: 172, conditions: ['Thyroid (hypo)', 'Eye condition'], color: '#6366F1' });
  me.medical = {
    ...me.medical,
    relation: 'Self',
    bloodGroup: 'B+',
    allergies: 'Sulfa drugs',
    insurance: 'Star Health · Family floater',
    doctors: [
      { id: uid(), name: 'Dr. Meena Rao', role: 'Endocrinologist', phone: '+91 98450 00000' },
      { id: uid(), name: 'Dr. Arjun Shetty', role: 'Ophthalmologist', phone: '+91 98860 00000' },
    ],
    emergency: [{ id: uid(), name: 'Priya', role: 'Wife', phone: '+91 99000 00000' }],
  };
  me.targets = { ...me.targets, steps: 9000, weightKg: 72, calories: 2100, waterMl: 3000 };
  me.reminders.water.enabled = true;
  me.reminders.sit.enabled = true;
  const fam = newProfile({ name: 'Priya', age: 29, sex: 'female', heightCm: 160, conditions: ['PCOS', 'Vitamin D deficiency'], color: '#EC4899' });
  fam.medical = { ...fam.medical, relation: 'Spouse', bloodGroup: 'O+', doctors: [{ id: uid(), name: 'Dr. Kavya Iyer', role: 'Gynaecologist', phone: '' }], emergency: [{ id: uid(), name: 'Santhosh', role: 'Husband', phone: '+91 99000 11111' }] };
  const dad = newProfile({ name: 'Ramesh', age: 62, sex: 'male', heightCm: 168, conditions: ['Diabetes', 'Blood pressure', 'Cholesterol'], color: '#14B8A6' });
  dad.medical = { ...dad.medical, relation: 'Father', bloodGroup: 'B+', allergies: 'None known', notes: 'Knee replacement (2021)' };
  dad.targets = { ...dad.targets, steps: 6000, weightKg: 70, calories: 1800 };
  const mom = newProfile({ name: 'Lakshmi', age: 57, sex: 'female', heightCm: 155, conditions: ['Thyroid (hypo)', 'Arthritis'], color: '#F97316' });
  mom.medical = { ...mom.medical, relation: 'Mother', bloodGroup: 'A+' };
  fam.targets = { ...fam.targets, weightKg: 58, calories: 1700 };

  const d: ProfileData = emptyData();
  const days = lastNDays(21);
  let w = 78.4;
  days.forEach((date, i) => {
    if (i !== days.length - 1) d.steps.push({ id: uid(), date, count: rnd(5000, 12000), source: 'manual' });
    if (i % 2 === 0) {
      w -= Math.random() * 0.5 - 0.1;
      d.weight.push({ id: uid(), date, kg: Math.round(w * 10) / 10 });
    }
    if (i >= days.length - 7) {
      d.calories.push({ id: uid(), date, time: '08:30', kcal: rnd(350, 500), label: 'Idli & sambar', meal: 'Breakfast' });
      d.calories.push({ id: uid(), date, time: '13:15', kcal: rnd(600, 800), label: 'Rice, dal, curd', meal: 'Lunch' });
      if (date !== today()) d.calories.push({ id: uid(), date, time: '20:00', kcal: rnd(500, 750), label: 'Chapati & sabzi', meal: 'Dinner' });
      for (let g = 0; g < (date === today() ? 5 : rnd(7, 12)); g++) d.water.push({ id: uid(), date, time: `${8 + g}:00`, ml: 250 });
      d.sleep.push({ id: uid(), date, bedtime: '23:15', wake: '06:30', hours: Math.round((6 + Math.random() * 2.2) * 10) / 10, quality: rnd(3, 5) });
      if (i % 2 === 0) d.workouts.push({ id: uid(), date, type: ['Gym – strength', 'Running', 'Yoga'][i % 3], minutes: rnd(30, 60), notes: '' });
    }
  });
  d.steps.push({ id: uid(), date: today(), count: 6240, source: 'manual' });
  const thyro = { id: uid(), name: 'Thyronorm', dose: '50 mcg', kind: 'tablet' as const, times: ['06:30'], notes: 'Empty stomach, 30 min before food', tag: 'thyroid' as const, active: true };
  const drops = { id: uid(), name: 'Lubricating eye drops', dose: '1 drop each eye', kind: 'eye drops' as const, times: ['09:00', '14:00', '21:00'], notes: '', tag: 'eye' as const, active: true };
  const vitd = { id: uid(), name: 'Vitamin D3', dose: '1 capsule', kind: 'capsule' as const, times: ['13:30'], notes: 'After lunch', tag: '' as const, active: true };
  d.medicines.push(thyro, drops, vitd);
  for (const date of lastNDays(7)) {
    d.medLogs.push({ id: uid(), medId: thyro.id, date, time: '06:35', slot: '06:30' });
    if (date !== today()) for (const slot of drops.times) d.medLogs.push({ id: uid(), medId: drops.id, date, time: slot, slot });
  }
  d.medLogs.push({ id: uid(), medId: drops.id, date: today(), time: '09:02', slot: '09:00' });
  d.labs.push(
    { id: uid(), date: addDays(today(), -150), tsh: 7.8, t4: 0.9, notes: 'Diagnosed' },
    { id: uid(), date: addDays(today(), -90), tsh: 5.1, notes: 'Dose started' },
    { id: uid(), date: addDays(today(), -30), tsh: 3.2, t4: 1.2, notes: '' },
  );

  d.checkups.push(
    { id: uid(), date: addDays(today(), -30), title: 'Annual full body check-up', lab: 'Apollo Diagnostics', doctor: 'Dr. Meena Rao', reportIds: [], notes: 'Continue 50 mcg. Recheck TSH in 3 months.',
      values: { fbs: 96, hba1c: 5.5, chol: 212, ldl: 138, hdl: 42, tg: 165, hb: 14.6, wbc: 7.2, plt: 260, tsh: 3.2, ft4: 1.2, ast: 28, alt: 44, creat: 0.98, uric: 6.4, vitd: 21, b12: 310 } },
    { id: uid(), date: addDays(today(), -400), title: 'Full body check-up', lab: 'Apollo Diagnostics', doctor: '', reportIds: [], notes: '',
      values: { fbs: 101, hba1c: 5.7, chol: 228, ldl: 150, hdl: 39, tg: 190, hb: 14.1, tsh: 6.9, vitd: 16 } },
  );
  for (let i = 0; i < 10; i++) {
    const date = addDays(today(), -i * 3);
    d.vitals.push({ id: uid(), date, time: '08:00', type: 'bp', value: rnd(118, 132), value2: rnd(76, 86), notes: '' });
    if (i % 2 === 0) d.vitals.push({ id: uid(), date, time: '07:30', type: 'hr', value: rnd(64, 78), notes: '' });
  }
  d.appointments.push(
    { id: uid(), date: addDays(today(), 2), time: '10:30', doctor: 'Dr. Meena Rao', specialty: 'Endocrinologist', place: 'Apollo Clinic, Jayanagar', reason: 'Thyroid review — bring TSH report', notes: '', done: false },
    { id: uid(), date: addDays(today(), 25), time: '17:00', doctor: 'Dr. Arjun Shetty', specialty: 'Ophthalmologist', place: 'Narayana Nethralaya', reason: 'Dry eye follow-up', notes: '', done: false },
    { id: uid(), date: addDays(today(), -60), time: '11:00', doctor: 'Dr. Meena Rao', specialty: 'Endocrinologist', place: 'Apollo Clinic', reason: '', notes: 'Dose kept at 50 mcg', done: true },
  );
  d.vaccines.push(
    { id: uid(), date: addDays(today(), -340), name: 'Influenza (flu)', dose: 'Annual', nextDue: addDays(today(), 10), notes: '' },
    { id: uid(), date: addDays(today(), -900), name: 'Tetanus (Td/Tdap)', dose: 'Booster', nextDue: addDays(today(), 2750), notes: '' },
  );

  const f: ProfileData = emptyData();
  f.checkups.push({ id: uid(), date: addDays(today(), -45), title: 'PCOS hormone panel', lab: 'Thyrocare', doctor: 'Dr. Kavya Iyer', reportIds: [], notes: '',
    values: { lh: 14.2, fsh: 5.1, testo: 82, prl: 18, amh: 6.1, insulin: 19, fbs: 92, vitd: 14, tsh: 2.1, hb: 11.4 } });
  f.medicines.push({ id: uid(), name: 'Metformin', dose: '500 mg', kind: 'tablet', times: ['13:30', '20:30'], notes: 'After food', tag: 'pcos', active: true });
  f.medicines.push({ id: uid(), name: 'Vitamin D3 60K', dose: '1 sachet weekly', kind: 'other', times: ['09:00'], notes: 'Sundays', tag: '', active: true });
  f.appointments.push({ id: uid(), date: addDays(today(), 9), time: '16:00', doctor: 'Dr. Kavya Iyer', specialty: 'Gynaecologist', place: 'Cloudnine', reason: 'PCOS follow-up, ultrasound', notes: '', done: false });

  const g: ProfileData = emptyData();
  g.medicines.push(
    { id: uid(), name: 'Metformin', dose: '1000 mg', kind: 'tablet', times: ['08:30', '20:30'], notes: 'With food', tag: '', active: true },
    { id: uid(), name: 'Telmisartan', dose: '40 mg', kind: 'tablet', times: ['08:30'], notes: 'BP', tag: '', active: true },
    { id: uid(), name: 'Atorvastatin', dose: '10 mg', kind: 'tablet', times: ['21:30'], notes: 'Cholesterol', tag: '', active: true },
  );
  for (let i = 0; i < 8; i++) {
    const date = addDays(today(), -i * 2);
    g.vitals.push({ id: uid(), date, time: '07:00', type: 'sugar', value: rnd(112, 142), context: 'fasting', notes: '' });
    g.vitals.push({ id: uid(), date, time: '08:00', type: 'bp', value: rnd(132, 148), value2: rnd(82, 92), notes: '' });
  }
  g.checkups.push({ id: uid(), date: addDays(today(), -75), title: 'Diabetes & heart panel', lab: 'Metropolis', doctor: 'Dr. Suresh', reportIds: [], notes: '',
    values: { fbs: 138, ppbs: 212, hba1c: 7.4, chol: 182, ldl: 104, hdl: 44, tg: 168, creat: 1.2, egfr: 72, urea: 34, k: 4.6 } });
  g.appointments.push({ id: uid(), date: addDays(today(), 5), time: '09:30', doctor: 'Dr. Suresh', specialty: 'General physician', place: 'Manipal Hospital', reason: 'HbA1c review', notes: '', done: false });

  const h: ProfileData = emptyData();
  h.medicines.push({ id: uid(), name: 'Thyronorm', dose: '75 mcg', kind: 'tablet', times: ['06:00'], notes: 'Empty stomach', tag: 'thyroid', active: true });
  h.medicines.push({ id: uid(), name: 'Calcium + D3', dose: '1 tablet', kind: 'tablet', times: ['14:00'], notes: '', tag: '', active: true });
  h.labs.push({ id: uid(), date: addDays(today(), -20), tsh: 4.6, notes: '' });

  [-95, -61, -29].forEach((off) =>
    f.cycles.push({ id: uid(), startDate: addDays(today(), off), endDate: addDays(today(), off + 5), flow: 'medium', notes: '' }),
  );
  f.symptoms.push({ id: uid(), date: addDays(today(), -2), symptoms: ['Acne', 'Bloating', 'Fatigue'], notes: '' });

  return {
    version: 1,
    profiles: [me, fam, dad, mom],
    data: { [me.id]: d, [fam.id]: f, [dad.id]: g, [mom.id]: h },
    activeProfileId: me.id,
    theme: 'system',
    pinHash: '',
  };
}
