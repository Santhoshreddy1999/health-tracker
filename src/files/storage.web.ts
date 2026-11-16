import { uid } from '../utils';

/** Report files are kept in IndexedDB (localStorage is too small for PDFs and photos). */
const DB = 'health-tracker-files';
const STORE = 'files';

const db = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const tx = async <T,>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) => {
  const d = await db();
  return new Promise<T>((resolve, reject) => {
    const r = fn(d.transaction(STORE, mode).objectStore(STORE));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
};

const urls = new Map<string, string>();

export async function storeFile(src: { uri: string; name: string; file?: Blob }): Promise<string> {
  const blob = src.file ?? (await (await fetch(src.uri)).blob());
  const key = uid();
  await tx('readwrite', (s) => s.put(blob, key));
  return key;
}

export async function fileUri(key: string): Promise<string | null> {
  if (urls.has(key)) return urls.get(key)!;
  const blob = await tx<Blob | undefined>('readonly', (s) => s.get(key));
  if (!blob) return null;
  const u = URL.createObjectURL(blob);
  urls.set(key, u);
  return u;
}

export async function openFile(key: string, _mime: string) {
  const u = await fileUri(key);
  if (!u) throw new Error('File missing');
  window.open(u, '_blank');
}

export async function deleteFile(key: string) {
  await tx('readwrite', (s) => s.delete(key));
  const u = urls.get(key);
  if (u) URL.revokeObjectURL(u);
  urls.delete(key);
}

export async function shareFile(key: string, mime: string) {
  const u = await fileUri(key);
  if (!u) return;
  const blob = await (await fetch(u)).blob();
  const file = new File([blob], 'report', { type: mime });
  if ((navigator as any).canShare?.({ files: [file] })) await navigator.share({ files: [file] });
  else window.open(u, '_blank');
}
