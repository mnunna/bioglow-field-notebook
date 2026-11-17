import { notebookByKey, templateByKey } from './templates';
import type { FieldEntry } from './types';

const BOM = '\uFEFF';
const CRLF = '\r\n';

export function csvCell(value: unknown): string {
  if (value === undefined || value === null) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(columns: string[], rows: Record<string, unknown>[]): string {
  const lines = [columns.map(csvCell).join(',')];
  for (const row of rows) {
    lines.push(columns.map((column) => csvCell(row[column])).join(','));
  }
  return `${BOM}${lines.join(CRLF)}${CRLF}`;
}

function detailsForEntry(entry: FieldEntry): string {
  const template = templateByKey(entry.templateKey);
  const knownFieldKeys = new Set(template.fields.map((field) => field.key));
  const templateDetails = template.fields
    .map((field) => {
      const value = entry.values[field.key];
      return value ? `${field.label}: ${value}` : '';
    })
    .filter(Boolean);
  const legacyDetails = Object.entries(entry.values)
    .filter(([key, value]) => !knownFieldKeys.has(key) && value.length > 0)
    .map(([key, value]) => `${key}: ${value}`);
  return [...templateDetails, ...legacyDetails].join('; ');
}

function extensionFromUri(uri: string, fallback: string): string {
  const withoutQuery = uri.split(/[?#]/, 1)[0] ?? '';
  const match = withoutQuery.match(/(\.[a-zA-Z0-9]{1,8})$/);
  return match ? match[1].toLowerCase() : fallback;
}

export function mediaArchivePath(
  entry: FieldEntry,
  kind: 'photo' | 'voice',
): string | null {
  const uri = kind === 'photo' ? entry.photoUri : entry.voiceUri;
  if (!uri) return null;
  const extension = extensionFromUri(uri, kind === 'photo' ? '.jpg' : '.m4a');
  return `media/${entry.id}-${kind}${extension}`;
}

const BIOGLOW_COLUMNS = [
  'Date',
  'Updated',
  'Entry ID',
  'Title',
  'Template',
  'Notebook',
  'Starred',
  'Latitude',
  'Longitude',
  'GPS accuracy (m)',
  'Location',
  'Details',
  'Notes',
  'Photo attached',
  'Voice note attached',
];

/** Friendly spreadsheet export for people reading the notebook directly. */
export function entriesToCsv(entries: FieldEntry[]): string {
  return toCsv(
    BIOGLOW_COLUMNS,
    entries.map((entry) => ({
      Date: entry.createdAt,
      Updated: entry.updatedAt,
      'Entry ID': entry.id,
      Title: entry.title,
      Template: templateByKey(entry.templateKey).title,
      Notebook: notebookByKey(entry.notebookKey).title,
      Starred: entry.starred ? 'yes' : 'no',
      Latitude: entry.latitude ?? '',
      Longitude: entry.longitude ?? '',
      'GPS accuracy (m)': entry.horizontalAccuracy ?? '',
      Location: entry.locationLabel,
      Details: detailsForEntry(entry),
      Notes: entry.notes,
      'Photo attached': entry.photoUri ? 'yes' : 'no',
      'Voice note attached': entry.voiceUri ? 'yes' : 'no',
    })),
  );
}

export const DARWIN_CORE_COLUMNS = [
  'occurrenceID',
  'eventID',
  'samplingProtocol',
  'eventDate',
  'modified',
  'recordedBy',
  'locality',
  'verbatimIdentification',
  'individualCount',
  'lifeStage',
  'behavior',
  'habitat',
  'occurrenceRemarks',
  'decimalLatitude',
  'decimalLongitude',
  'coordinateUncertaintyInMeters',
  'geodeticDatum',
  'basisOfRecord',
  'occurrenceStatus',
  'associatedMedia',
  'bioglowGlowColour',
  'bioglowBrightness',
];

/**
 * Darwin Core-compatible occurrence export. BioGlow-specific measurements are
 * retained as namespaced extension columns at the end.
 */
export function entriesToDarwinCoreCsv(
  entries: FieldEntry[],
  includeMediaPaths = false,
): string {
  return toCsv(
    DARWIN_CORE_COLUMNS,
    entries.map((entry) => {
      const media = includeMediaPaths
        ? [mediaArchivePath(entry, 'photo'), mediaArchivePath(entry, 'voice')]
            .filter((value): value is string => value !== null)
            .join(' | ')
        : '';
      const hasCoordinates = entry.latitude !== null && entry.longitude !== null;
      return {
        occurrenceID: `bioglow:${entry.id}`,
        eventID: `bioglow-event:${entry.id}`,
        samplingProtocol: templateByKey(entry.templateKey).title,
        eventDate: entry.createdAt,
        modified: entry.updatedAt,
        recordedBy: '',
        locality: entry.locationLabel,
        verbatimIdentification: entry.values.scientificName ?? entry.values.speciesGuess ?? '',
        individualCount: entry.values.individualCount ?? '',
        lifeStage: entry.values.lifeStage ?? '',
        behavior: entry.values.behaviour ?? entry.values.behavior ?? '',
        habitat: entry.values.habitat ?? '',
        occurrenceRemarks: [detailsForEntry(entry), entry.notes].filter(Boolean).join('; '),
        decimalLatitude: entry.latitude ?? '',
        decimalLongitude: entry.longitude ?? '',
        coordinateUncertaintyInMeters:
          entry.horizontalAccuracy === null ? '' : Math.max(1, Math.round(entry.horizontalAccuracy)),
        geodeticDatum: hasCoordinates ? 'WGS84' : '',
        basisOfRecord: 'HumanObservation',
        occurrenceStatus: 'present',
        associatedMedia: media,
        bioglowGlowColour: entry.values.glowColour ?? '',
        bioglowBrightness: entry.values.brightness ?? '',
      };
    }),
  );
}
