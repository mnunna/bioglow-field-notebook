import assert from 'node:assert/strict';
import test from 'node:test';
import { mappedObservations } from '../src/observationMap';
import { migrateFieldEntry } from '../src/entryModel';
import type { FieldEntry } from '../src/types';

function entry(
  id: string,
  latitude: number | null,
  longitude: number | null,
  createdAt: string,
): FieldEntry {
  const result = migrateFieldEntry({
    id,
    title: id,
    latitude,
    longitude,
    createdAt,
  });
  assert.ok(result);
  return result;
}

test('maps valid History and Archive coordinates in newest-first order', () => {
  const olderArchive = {
    ...entry('archive', 9.15, -79.73, '2026-11-17T10:00:00.000Z'),
    exportedAt: '2026-11-17T12:00:00.000Z',
  };
  const newerHistory = entry('history', 9.16, -79.74, '2026-11-18T10:00:00.000Z');

  const result = mappedObservations([olderArchive, newerHistory]);

  assert.deepEqual(result.map((observation) => observation.entry.id), ['history', 'archive']);
  assert.deepEqual(result[0]?.coordinate, { latitude: 9.16, longitude: -79.74 });
});

test('omits missing, non-finite, and out-of-range legacy coordinates', () => {
  const result = mappedObservations([
    entry('missing', null, null, '2026-11-18T10:00:00.000Z'),
    entry('north-of-pole', 91, 10, '2026-11-18T09:00:00.000Z'),
    entry('past-date-line', 10, 181, '2026-11-18T08:00:00.000Z'),
    entry('valid', -90, 180, '2026-11-18T07:00:00.000Z'),
  ]);

  assert.deepEqual(result.map((observation) => observation.entry.id), ['valid']);
});
