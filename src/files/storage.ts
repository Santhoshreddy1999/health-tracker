import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { uid } from '../utils';

/** Report files live in the app's private documents folder (kept until the app is uninstalled). */
const reportsDir = () => {
  const d = new Directory(Paths.document, 'reports');
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
  return d;
};

const ext = (name: string) => {
  const m = name.match(/\.[a-z0-9]{1,5}$/i);
  return m ? m[0].toLowerCase() : '';
};

export async function storeFile(src: { uri: string; name: string; file?: Blob }): Promise<string> {
  const key = uid() + ext(src.name);
  await new File(src.uri).copy(new File(reportsDir(), key));
  return key;
}

export async function fileUri(key: string): Promise<string | null> {
  const f = new File(reportsDir(), key);
  return f.exists ? f.uri : null;
}

export async function openFile(key: string, mime: string) {
  const f = new File(reportsDir(), key);
  if (!f.exists) throw new Error('File missing');
  try {
    if (await f.canPreview()) return await f.preview();
  } catch {
    // fall through to the share sheet
  }
  await Sharing.shareAsync(f.uri, { mimeType: mime, dialogTitle: 'Open report' });
}

export async function deleteFile(key: string) {
  try {
    new File(reportsDir(), key).delete();
  } catch {
    // already gone
  }
}

export async function shareFile(key: string, mime: string) {
  await Sharing.shareAsync(new File(reportsDir(), key).uri, { mimeType: mime });
}
