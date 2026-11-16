import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Image, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { DateField } from '../components/DateField';
import { Button, Card, Chips, confirmAsync, Empty, Field, H2, Label, notify, Row, Screen, Sub } from '../components/ui';
import { deleteFile, fileUri, openFile, shareFile, storeFile } from '../files/storage';
import { useNav } from '../nav';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { ReportCategory, ReportFile } from '../types';
import { isValidDate, prettyDate, today, uid } from '../utils';

export const CATEGORIES: ReportCategory[] = ['Lab report', 'Prescription', 'Scan / X-ray', 'Discharge summary', 'Vaccination', 'Insurance', 'Bill', 'Other'];
const catIcon: Record<ReportCategory, string> = {
  'Lab report': '🧪',
  Prescription: '📝',
  'Scan / X-ray': '🩻',
  'Discharge summary': '🏥',
  Vaccination: '💉',
  Insurance: '🛡️',
  Bill: '🧾',
  Other: '📎',
};

const fmtSize = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);

function Thumb({ r }: { r: ReportFile }) {
  const t = useTheme();
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    if (r.mime.startsWith('image/')) fileUri(r.storageKey).then(setUri).catch(() => {});
  }, [r.storageKey, r.mime]);
  return (
    <View style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', backgroundColor: t.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
      {uri ? <Image source={{ uri }} style={{ width: 52, height: 52 }} /> : <Text style={{ fontSize: 24 }}>{r.mime === 'application/pdf' ? '📄' : catIcon[r.category]}</Text>}
    </View>
  );
}

export default function Reports() {
  const t = useTheme();
  const nav = useNav();
  const { data, remove } = useStore();
  const [cat, setCat] = useState<'All' | ReportCategory>('All');
  const [q, setQ] = useState('');
  const list = data.reports
    .filter((r) => cat === 'All' || r.category === cat)
    .filter((r) => !q || `${r.title} ${r.doctor} ${r.notes} ${r.fileName}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Screen title="Reports vault" onBack={nav.back} right={<Button small title="+ Upload" onPress={() => nav.push({ name: 'reportEdit' })} />}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="🔍  Search title, doctor, notes…"
        placeholderTextColor={t.sub}
        style={{ backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 14, padding: 12, color: t.text, marginBottom: 12 }}
      />
      <Chips options={['All', ...CATEGORIES] as const} value={cat} onChange={setCat} />
      <Card>
        {list.length === 0 && <Empty text={data.reports.length ? 'No matches.' : 'No reports yet. Upload PDFs or photos of lab reports, prescriptions and scans.'} />}
        {list.map((r) => (
          <View key={r.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border }}>
            <Pressable onPress={() => openFile(r.storageKey, r.mime).catch(() => notify('File not found on this device.'))}>
              <Thumb r={r} />
            </Pressable>
            <Pressable style={{ flex: 1 }} onPress={() => nav.push({ name: 'reportEdit', id: r.id })}>
              <Text style={{ color: t.text, fontWeight: '700' }}>{r.title}</Text>
              <Sub>
                {catIcon[r.category]} {r.category} · {prettyDate(r.date)}
                {r.doctor ? ` · ${r.doctor}` : ''}
              </Sub>
              <Sub style={{ fontSize: 11 }}>
                {r.fileName} · {fmtSize(r.size)}
              </Sub>
            </Pressable>
            <View style={{ gap: 6 }}>
              <Button small variant="soft" title="Open" onPress={() => openFile(r.storageKey, r.mime).catch(() => notify('File not found on this device.'))} />
              <Button
                small
                variant="ghost"
                title="🗑"
                onPress={async () => {
                  if (!(await confirmAsync(`Delete “${r.title}”?`, 'The file is removed from this device.'))) return;
                  await deleteFile(r.storageKey);
                  remove('reports', r.id);
                }}
              />
            </View>
          </View>
        ))}
      </Card>
      <Sub style={{ textAlign: 'center' }}>
        Files are stored privately on this device{Platform.OS === 'web' ? ' (browser storage)' : ''}. They are not part of the JSON backup — keep originals in Google Drive / iCloud too.
      </Sub>
    </Screen>
  );
}

export function ReportEdit({ id }: { id?: string }) {
  const t = useTheme();
  const nav = useNav();
  const { data, add, update } = useStore();
  const existing = data.reports.find((r) => r.id === id);
  const [r, setR] = useState<ReportFile>(
    existing ?? { id: uid(), date: today(), title: '', category: 'Lab report', doctor: '', notes: '', fileName: '', mime: '', size: 0, storageKey: '', createdAt: Date.now() },
  );
  const [picked, setPicked] = useState<{ uri: string; name: string; mime: string; size: number; file?: Blob } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (p: Partial<ReportFile>) => setR((x) => ({ ...x, ...p }));

  useEffect(() => {
    if (picked?.mime.startsWith('image/')) setPreview(picked.uri);
    else if (!picked && existing?.mime.startsWith('image/')) fileUri(existing.storageKey).then(setPreview);
    else setPreview(null);
  }, [picked, existing]);

  const pickDoc = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (res.canceled) return;
    const a = res.assets[0];
    setPicked({ uri: a.uri, name: a.name, mime: a.mimeType ?? 'application/octet-stream', size: a.size ?? 0, file: a.file });
    if (!r.title) set({ title: a.name.replace(/\.[^.]+$/, '') });
  };

  const pickImage = async (camera: boolean) => {
    if (camera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return notify('Camera permission is needed to photograph a report.');
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled) return;
    const a = res.assets[0];
    const name = a.fileName ?? `report-${today()}.jpg`;
    setPicked({ uri: a.uri, name, mime: a.mimeType ?? 'image/jpeg', size: a.fileSize ?? 0, file: a.file });
    if (!r.title) set({ title: `${r.category} ${today()}` });
  };

  const save = async () => {
    if (!r.title.trim()) return notify('Give the report a title.');
    if (!isValidDate(r.date)) return notify('Enter a valid date.');
    if (!existing && !picked) return notify('Choose a file or take a photo first.');
    setBusy(true);
    try {
      let out = { ...r, title: r.title.trim() };
      if (picked) {
        const storageKey = await storeFile(picked);
        if (existing?.storageKey) await deleteFile(existing.storageKey);
        out = { ...out, storageKey, fileName: picked.name, mime: picked.mime, size: picked.size || picked.file?.size || 0 };
      }
      existing ? update('reports', out) : add('reports', out);
      nav.back();
    } catch (e: any) {
      notify('Could not save the file', String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={existing ? 'Edit report' : 'Upload report'} onBack={nav.back}>
      <Card>
        <H2>File</H2>
        {preview ? <Image source={{ uri: preview }} style={{ width: '100%', height: 220, borderRadius: 12, marginBottom: 10 }} resizeMode="contain" /> : null}
        <Sub style={{ marginBottom: 10 }}>{picked ? `Selected: ${picked.name}` : existing ? `Current: ${existing.fileName}` : 'PDF or image, e.g. a lab report from the lab’s app or WhatsApp.'}</Sub>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          <Button small title="📄 Choose PDF / file" onPress={pickDoc} />
          <Button small variant="soft" title="🖼 From gallery" onPress={() => pickImage(false)} />
          {Platform.OS !== 'web' && <Button small variant="soft" title="📷 Take photo" onPress={() => pickImage(true)} />}
        </Row>
        {existing && (
          <Row gap={8} style={{ marginTop: 10 }}>
            <Button small variant="ghost" title="Open" onPress={() => openFile(existing.storageKey, existing.mime).catch(() => notify('File not found.'))} />
            <Button small variant="ghost" title="Share" onPress={() => shareFile(existing.storageKey, existing.mime).catch(() => {})} />
          </Row>
        )}
      </Card>
      <Card>
        <Field label="Title" value={r.title} onChangeText={(title) => set({ title })} placeholder="e.g. Annual check-up – Apollo" />
        <Label>Category</Label>
        <Chips options={CATEGORIES} value={r.category} onChange={(category) => set({ category })} />
        <DateField label="Report date" value={r.date} onChange={(date) => set({ date })} />
        <Field label="Doctor / lab / hospital" value={r.doctor} onChangeText={(doctor) => set({ doctor })} />
        <Field label="Notes" value={r.notes} onChangeText={(notes) => set({ notes })} multiline placeholder="Key findings, doctor’s advice…" />
      </Card>
      <Button title={busy ? 'Saving…' : 'Save report'} disabled={busy} onPress={save} />
      {r.category === 'Lab report' && (
        <Button
          title="🧪 Enter values from this report as a check-up"
          variant="ghost"
          color={t.accent.weight}
          style={{ marginTop: 10 }}
          onPress={() => nav.push({ name: 'checkupEdit' })}
        />
      )}
    </Screen>
  );
}
