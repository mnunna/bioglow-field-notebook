import type { FieldEntry, NotebookKey, TemplateKey } from './types';

export const FIELD_ENTRY_SCHEMA_VERSION = 4 as const;

const TEMPLATE_KEYS = new Set<TemplateKey>([
  'plant',
  'animal',
  'bioglow',
  'carbon',
  'quick',
  'general',
]);

const NOTEBOOK_KEYS = new Set<NotebookKey>(['species', 'bioglow', 'carbon', 'journal']);

const DEFAULT_NOTEBOOK: Record<TemplateKey, NotebookKey> = {
  plant: 'species',
  animal: 'species',
  bioglow: 'bioglow',
  carbon: 'carbon',
  quick: 'journal',
  general: 'journal',
};

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
  const templateKey =
    typeof raw.templateKey === 'string' && TEMPLATE_KEYS.has(raw.templateKey as TemplateKey)
      ? raw.templateKey as TemplateKey
      : 'general';
  const notebookKey =
    typeof raw.notebookKey === 'string' && NOTEBOOK_KEYS.has(raw.notebookKey as NotebookKey)
      ? raw.notebookKey as NotebookKey
      : DEFAULT_NOTEBOOK[templateKey];

  if (!id || !title || !createdAt) {
    return null;
  }

  return {
    schemaVersion: FIELD_ENTRY_SCHEMA_VERSION,
    id,
    templateKey,
    notebookKey,
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
    exportedAt: nullableString(raw.exportedAt),
    createdAt,
    updatedAt: stringValue(raw.updatedAt, createdAt),
  };
}

export function markEntriesExported(
  entries: FieldEntry[],
  entryIds: ReadonlySet<string>,
  exportedAt: string,
): FieldEntry[] {
  return entries.map((entry) =>
    entryIds.has(entry.id) && entry.exportedAt === null
      ? { ...entry, exportedAt }
      : entry,
  );
}
