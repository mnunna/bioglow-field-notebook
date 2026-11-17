import assert from 'node:assert/strict';
import test from 'node:test';
import { markEntriesExported, migrateFieldEntry } from '../src/entryModel';
import type { FieldEntry } from '../src/types';

test('migrates an original unversioned entry without losing its media', () => {
  const migrated = migrateFieldEntry({
    id: 'legacy-1',
    templateKey: 'quick',
    notebookKey: 'journal',
    title: 'Old note',
    values: { what: 'Glowing log' },
    notes: '',
    latitude: 1,
    longitude: 2,
    locationLabel: 'Stream',
    photoUri: 'file:///old-photo.jpg',
    voiceUri: 'file:///old-voice.m4a',
    starred: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  assert.ok(migrated);
  assert.equal(migrated.schemaVersion, 4);
  assert.equal(migrated.exportedAt, null);
  assert.equal(migrated.updatedAt, migrated.createdAt);
  assert.equal(migrated.horizontalAccuracy, null);
  assert.equal(migrated.photoUri, 'file:///old-photo.jpg');
  assert.equal(migrated.voiceUri, 'file:///old-voice.m4a');
});

test('preserves the export timestamp used to separate History from Archive', () => {
  const exportedAt = '2026-11-17T18:00:00.000Z';
  const migrated = migrateFieldEntry({
    id: 'exported-note',
    title: 'Exported note',
    createdAt: '2026-11-17T17:00:00.000Z',
    exportedAt,
  });

  assert.ok(migrated);
  assert.equal(migrated.exportedAt, exportedAt);
});

test('moves only newly exported notes from History to Archive', () => {
  const history = migrateFieldEntry({
    id: 'history-note',
    title: 'History note',
    createdAt: '2026-11-17T17:00:00.000Z',
  });
  const archived = migrateFieldEntry({
    id: 'archive-note',
    title: 'Archive note',
    createdAt: '2026-11-17T16:00:00.000Z',
    exportedAt: '2026-11-17T16:30:00.000Z',
  });
  assert.ok(history);
  assert.ok(archived);

  const movedAt = '2026-11-17T18:00:00.000Z';
  const result = markEntriesExported(
    [history, archived] satisfies FieldEntry[],
    new Set(['history-note', 'archive-note']),
    movedAt,
  );

  assert.equal(result[0]?.exportedAt, movedAt);
  assert.equal(result[1]?.exportedAt, '2026-11-17T16:30:00.000Z');
});

test('rejects records without identity fields but preserves unknown old categories', () => {
  assert.equal(migrateFieldEntry(null), null);
  assert.equal(migrateFieldEntry({ id: 'missing-most-fields' }), null);
  const migrated = migrateFieldEntry({
    id: 'old-template',
    title: 'Old category',
    createdAt: '2026-01-01T00:00:00.000Z',
    templateKey: 'retired-template',
    notebookKey: 'retired-notebook',
    notes: 'Do not discard this observation after an update.',
  });
  assert.ok(migrated);
  assert.equal(migrated.templateKey, 'general');
  assert.equal(migrated.notebookKey, 'journal');
  assert.equal(migrated.notes, 'Do not discard this observation after an update.');
});
