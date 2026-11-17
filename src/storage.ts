import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FieldEntry } from './types';
import { migrateFieldEntry } from './entryModel';

const STORAGE_KEY = 'bioglow.fieldEntries.v1';
const GLOVE_KEY = 'bioglow.gloveMode.v1';
let entryWriteQueue: Promise<void> = Promise.resolve();

export async function loadEntries(): Promise<FieldEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(migrateFieldEntry).filter((entry): entry is FieldEntry => entry !== null);
  } catch {
    return [];
  }
}

export async function saveEntries(entries: FieldEntry[]): Promise<void> {
  const write = entryWriteQueue.then(() =>
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries)),
  );
  // A failed write must reach the caller, but it must not poison later saves.
  entryWriteQueue = write.catch(() => undefined);
  try {
    await write;
  } catch {
    throw new Error("This entry could not be saved on the phone. Check available storage and try again.");
  }
}

export async function loadGloveMode(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(GLOVE_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function saveGloveMode(on: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(GLOVE_KEY, on ? '1' : '0');
  } catch {
    // Non-critical preference.
  }
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
