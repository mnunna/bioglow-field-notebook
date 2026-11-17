import { FIELD_ENTRY_SCHEMA_VERSION } from './entryModel';
import type { FieldEntry, TemplateKey } from './types';

const SAMPLE_ID_PREFIX = 'bioglow-sample-v1-';

export function isSampleEntry(entry: FieldEntry): boolean {
  return entry.id.startsWith(SAMPLE_ID_PREFIX);
}

export function createSampleEntries(now = new Date()): FieldEntry[] {
  const definitions: Array<{
    templateKey: TemplateKey;
    title: string;
    values: Record<string, string>;
    notes: string;
    locationLabel: string;
    latitude: number | null;
    longitude: number | null;
    horizontalAccuracy: number | null;
    starred?: boolean;
  }> = [
    {
      templateKey: 'plant',
      title: 'Sample: Broadleaf understory plant',
      values: { leaf: 'Broad, glossy, about 18 cm', flower: 'Small white flowers', height: 'About 80 cm', habitat: 'Forest floor', glow: 'No' },
      notes: 'Sample observation for testing the Species Notebook and CSV export.',
      locationLabel: 'North transect, marker 3',
      latitude: 9.1542,
      longitude: -79.7351,
      horizontalAccuracy: 6,
    },
    {
      templateKey: 'animal',
      title: 'Sample: Small green tree frog',
      values: { speciesGuess: 'Small green frog', size: 'About 5 cm', behaviour: 'Calling / sound', tracks: 'None seen', glow: 'Not sure' },
      notes: 'Heard calling from leaves roughly one metre above the stream.',
      locationLabel: 'Stream survey point',
      latitude: 9.1538,
      longitude: -79.7346,
      horizontalAccuracy: 9,
      starred: true,
    },
    {
      templateKey: 'bioglow',
      title: 'Sample: Green glow on fallen log',
      values: { organism: 'Fungi', glowColour: 'Green', brightness: '3', habitat: 'Fallen log', weather: 'After rain', when: 'Visible after full darkness' },
      notes: 'Several faint points of light along the underside of the bark.',
      locationLabel: 'Night trail, fallen log',
      latitude: 9.1529,
      longitude: -79.7339,
      horizontalAccuracy: 12,
      starred: true,
    },
    {
      templateKey: 'carbon',
      title: 'Sample: Well-rotted log',
      values: { stage: 'Fungi decomposing', decay: 'Well rotted', smell: 'Damp and earthy', signs: 'Fungal growth, beetles, and two seedlings' },
      notes: 'Sample carbon-cycle record for testing notebook filters.',
      locationLabel: 'Forest floor plot B',
      latitude: 9.155,
      longitude: -79.736,
      horizontalAccuracy: 7,
    },
    {
      templateKey: 'quick',
      title: 'Sample: Frog call beside stream',
      values: { what: 'Small frog calling from wet leaves beside the stream' },
      notes: 'Quick-capture sample with a bundled synthetic voice note.',
      locationLabel: 'Stream trail junction',
      latitude: null,
      longitude: null,
      horizontalAccuracy: null,
    },
    {
      templateKey: 'general',
      title: 'Sample: Survey team reminder',
      values: { category: 'Team note', detail: 'Compare night observations with the morning transect notes.' },
      notes: 'General field-note sample for search testing.',
      locationLabel: 'Field camp',
      latitude: null,
      longitude: null,
      horizontalAccuracy: null,
    },
  ];

  return definitions.map((definition, index) => {
    const createdAt = new Date(now.getTime() - index * 45 * 60 * 1000).toISOString();
    const templateKey = definition.templateKey;
    const notebookKey =
      templateKey === 'plant' || templateKey === 'animal'
        ? 'species'
        : templateKey === 'bioglow' || templateKey === 'carbon'
          ? templateKey
          : 'journal';

    return {
      schemaVersion: FIELD_ENTRY_SCHEMA_VERSION,
      id: `${SAMPLE_ID_PREFIX}${templateKey}`,
      templateKey,
      notebookKey,
      title: definition.title,
      values: definition.values,
      notes: definition.notes,
      latitude: definition.latitude,
      longitude: definition.longitude,
      horizontalAccuracy: definition.horizontalAccuracy,
      locationLabel: definition.locationLabel,
      photoUri: null,
      voiceUri: null,
      starred: definition.starred ?? false,
      createdAt,
      updatedAt: createdAt,
    };
  });
}
