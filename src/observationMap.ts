import type { FieldEntry } from './types';

export interface MappedObservation {
  entry: FieldEntry;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

function isValidLatitude(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= -180 && value <= 180;
}

export function mappedObservations(entries: FieldEntry[]): MappedObservation[] {
  return entries
    .flatMap((entry) => {
      const { latitude, longitude } = entry;
      if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) return [];
      return [{ entry, coordinate: { latitude, longitude } }];
    })
    .sort((a, b) => b.entry.createdAt.localeCompare(a.entry.createdAt));
}
