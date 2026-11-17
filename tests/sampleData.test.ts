import assert from 'node:assert/strict';
import test from 'node:test';
import { createSampleEntries, isSampleEntry } from '../src/sampleData';

test('creates one clearly labeled sample for every template', () => {
  const entries = createSampleEntries(new Date('2026-11-17T12:00:00.000Z'));

  assert.equal(entries.length, 6);
  assert.deepEqual(
    new Set(entries.map((entry) => entry.templateKey)),
    new Set(['plant', 'animal', 'bioglow', 'carbon', 'quick', 'general']),
  );
  assert.ok(entries.every(isSampleEntry));
  assert.ok(entries.every((entry) => entry.title.startsWith('Sample:')));
  assert.ok(entries.every((entry) => entry.photoUri === null && entry.voiceUri === null));
});

test('sample detection does not match a real entry', () => {
  const sample = createSampleEntries()[0];
  assert.ok(sample);
  assert.equal(isSampleEntry({ ...sample, id: 'real-field-entry' }), false);
});
