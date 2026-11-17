import assert from 'node:assert/strict';
import test from 'node:test';
import { strFromU8, unzipSync } from 'fflate';
import { entriesToCsv, entriesToDarwinCoreCsv, mediaArchivePath } from '../src/export';
import { assembleResearchArchive } from '../src/exportArchiveCore';
import type { FieldEntry } from '../src/types';

function entry(overrides: Partial<FieldEntry> = {}): FieldEntry {
  return {
    schemaVersion: 4,
    id: 'entry-1',
    templateKey: 'animal',
    notebookKey: 'species',
    title: 'Frog, near stream',
    values: {
      speciesGuess: 'Hyla test',
      behaviour: 'Calling / sound',
      habitat: 'River bank',
    },
    notes: 'Line one\nLine "two"',
    latitude: 12.3456789,
    longitude: -45.6789123,
    horizontalAccuracy: 7.6,
    locationLabel: 'Trail 4',
    photoUri: 'file:///documents/bioglow-media/photo.jpeg',
    voiceUri: 'file:///documents/bioglow-media/voice.m4a',
    starred: true,
    exportedAt: null,
    createdAt: '2026-11-17T10:00:00.000Z',
    updatedAt: '2026-11-17T10:05:00.000Z',
    ...overrides,
  };
}

test('friendly CSV is Excel-compatible and escapes punctuation and newlines', () => {
  const csv = entriesToCsv([entry()]);
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.match(csv, /\r\n/);
  assert.match(csv, /"Frog, near stream"/);
  assert.match(csv, /"Line one\nLine ""two"""/);
  assert.match(csv, /GPS accuracy \(m\)/);
  assert.doesNotMatch(csv, /file:\/\//);
});

test('Darwin Core export keeps stable identifiers and GPS uncertainty', () => {
  const csv = entriesToDarwinCoreCsv([entry()], true);
  assert.match(csv, /bioglow:entry-1/);
  assert.match(csv, /bioglow-event:entry-1/);
  assert.match(csv, /Hyla test/);
  assert.match(csv, /HumanObservation/);
  assert.match(csv, /WGS84/);
  assert.match(csv, /,8,/);
  assert.match(csv, /media\/entry-1-photo\.jpeg \| media\/entry-1-voice\.m4a/);
});

test('friendly export retains values from a retired template field', () => {
  const csv = entriesToCsv([
    entry({
      templateKey: 'general',
      notebookKey: 'journal',
      values: { retiredSurveyField: 'Legacy measurement' },
    }),
  ]);

  assert.match(csv, /retiredSurveyField: Legacy measurement/);
});

test('media archive names are stable and do not expose device paths', () => {
  assert.equal(mediaArchivePath(entry(), 'photo'), 'media/entry-1-photo.jpeg');
  assert.equal(mediaArchivePath(entry(), 'voice'), 'media/entry-1-voice.m4a');
});

test('an expired old attachment does not prevent observation export', async () => {
  const oldEntry = entry({
    id: 'old-entry',
    title: 'Old observation survives',
    photoUri: 'file:///expired-photo.jpg',
    voiceUri: 'file:///available-voice.m4a',
  });
  const archive = await assembleResearchArchive([oldEntry], async (uri) => {
    if (uri.includes('expired')) throw new Error('File is gone');
    return new Uint8Array([1, 2, 3]);
  });
  const files = unzipSync(archive.bytes);

  assert.equal(archive.missingMedia.length, 1);
  assert.equal(archive.missingMedia[0]?.kind, 'photo');
  assert.ok(files['bioglow-field-notes.csv']);
  assert.match(strFromU8(files['bioglow-field-notes.csv']), /Old observation survives/);
  assert.equal(files['media/old-entry-photo.jpg'], undefined);
  assert.deepEqual(files['media/old-entry-voice.m4a'], new Uint8Array([1, 2, 3]));
  assert.match(strFromU8(files['missing-attachments.txt']), /old-entry.*photo/);
  assert.doesNotMatch(strFromU8(files['missing-attachments.txt']), /file:\/\//);
});
