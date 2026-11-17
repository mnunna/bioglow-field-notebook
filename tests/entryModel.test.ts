import assert from 'node:assert/strict';
import test from 'node:test';
import { migrateFieldEntry } from '../src/entryModel';

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
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.updatedAt, migrated.createdAt);
  assert.equal(migrated.horizontalAccuracy, null);
  assert.equal(migrated.photoUri, 'file:///old-photo.jpg');
  assert.equal(migrated.voiceUri, 'file:///old-voice.m4a');
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
