import { Directory, File, Paths } from 'expo-file-system';
import type { FieldEntry } from './types';
import {
  managedMediaFileName,
  managedMediaReference,
  normalizeManagedMediaUri,
} from './mediaReference';

const MEDIA_DIR_NAME = 'bioglow-media';

function mediaDirectory(): Directory {
  const directory = new Directory(Paths.document, MEDIA_DIR_NAME);
  directory.create({ idempotent: true, intermediates: true });
  return directory;
}

function safeExtension(uri: string, fallback: string): string {
  const withoutQuery = uri.split(/[?#]/, 1)[0] ?? '';
  const match = withoutQuery.match(/(\.[a-zA-Z0-9]{1,8})$/);
  return match ? match[1].toLowerCase() : fallback;
}

export function isManagedMediaUri(uri: string | null): uri is string {
  return uri ? normalizeManagedMediaUri(uri) !== null : false;
}

/** Resolve a stable reference against this installation's current app container. */
export function resolveMediaUri(uri: string): string {
  const fileName = managedMediaFileName(uri);
  return fileName ? new File(mediaDirectory(), fileName).uri : uri;
}

/** Copy picker/recorder output into durable app-owned storage. */
export function persistMediaFile(
  sourceUri: string,
  entryId: string,
  kind: 'photo' | 'voice',
): string {
  const normalized = normalizeManagedMediaUri(sourceUri);
  if (normalized) return normalized;
  const extension = safeExtension(sourceUri, kind === 'photo' ? '.jpg' : '.m4a');
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const fileName = `${entryId}-${kind}-${unique}${extension}`;
  const destination = new File(mediaDirectory(), fileName);
  new File(sourceUri).copy(destination);
  return managedMediaReference(fileName);
}

export function deleteManagedMedia(uri: string | null): void {
  if (!isManagedMediaUri(uri)) return;
  const file = new File(resolveMediaUri(uri));
  if (file.exists) file.delete();
}

export function deleteEntryMedia(entry: FieldEntry): void {
  deleteManagedMedia(entry.photoUri);
  deleteManagedMedia(entry.voiceUri);
}

export async function readMediaBytes(uri: string): Promise<Uint8Array> {
  const file = new File(resolveMediaUri(uri));
  if (!file.exists) throw new Error('An attached media file is missing from this phone.');
  return file.bytes();
}
