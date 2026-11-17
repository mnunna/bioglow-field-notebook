import type { FieldEntry, NotebookKey, TemplateKey } from './types';

export const FIELD_ENTRY_SCHEMA_VERSION = 2 as const;

const TEMPLATE_KEYS = new Set<TemplateKey>([
  'plant',
  'animal',
  'bioglow',
  'carbon',
  'quick',
  'general',
]);

const NOTEBOOK_KEYS = new Set<NotebookKey>(['species', 'bioglow', 'carbon', 'journal']);

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function entryValues(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
}

/**
 * Upgrade persisted entries from the original unversioned shape. Invalid rows
 * are skipped rather than allowed to crash the notebook during startup.
 */
export function migrateFieldEntry(value: unknown): FieldEntry | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const id = stringValue(raw.id);
  const title = stringValue(raw.title);
  const createdAt = stringValue(raw.createdAt);
  const templateKey = raw.templateKey;
  const notebookKey = raw.notebookKey;

  if (
    !id ||
    !title ||
    !createdAt ||
    typeof templateKey !== 'string' ||
    !TEMPLATE_KEYS.has(templateKey as TemplateKey) ||
    typeof notebookKey !== 'string' ||
    !NOTEBOOK_KEYS.has(notebookKey as NotebookKey)
  ) {
    return null;
  }

  return {
    schemaVersion: FIELD_ENTRY_SCHEMA_VERSION,
    id,
    templateKey: templateKey as TemplateKey,
    notebookKey: notebookKey as NotebookKey,
    title,
    values: entryValues(raw.values),
    notes: stringValue(raw.notes),
    latitude: nullableNumber(raw.latitude),
    longitude: nullableNumber(raw.longitude),
    horizontalAccuracy: nullableNumber(raw.horizontalAccuracy),
    locationLabel: stringValue(raw.locationLabel),
    photoUri: nullableString(raw.photoUri),
    voiceUri: nullableString(raw.voiceUri),
    starred: raw.starred === true,
    createdAt,
    updatedAt: stringValue(raw.updatedAt, createdAt),
  };
}
