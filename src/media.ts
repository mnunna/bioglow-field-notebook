import { Directory, File, Paths } from 'expo-file-system';
import type { FieldEntry } from './types';

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
  if (!uri) return false;
  return uri.startsWith(new Directory(Paths.document, MEDIA_DIR_NAME).uri);
}

/** Copy picker/recorder output into durable app-owned storage. */
export function persistMediaFile(
  sourceUri: string,
  entryId: string,
  kind: 'photo' | 'voice',
): string {
  if (isManagedMediaUri(sourceUri)) return sourceUri;
  const extension = safeExtension(sourceUri, kind === 'photo' ? '.jpg' : '.m4a');
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const destination = new File(mediaDirectory(), `${entryId}-${kind}-${unique}${extension}`);
  new File(sourceUri).copy(destination);
  return destination.uri;
}

export function deleteManagedMedia(uri: string | null): void {
  if (!isManagedMediaUri(uri)) return;
  const file = new File(uri);
  if (file.exists) file.delete();
}

export function deleteEntryMedia(entry: FieldEntry): void {
  deleteManagedMedia(entry.photoUri);
  deleteManagedMedia(entry.voiceUri);
}

export async function readMediaBytes(uri: string): Promise<Uint8Array> {
  const file = new File(uri);
  if (!file.exists) throw new Error('An attached media file is missing from this phone.');
  return file.bytes();
}
