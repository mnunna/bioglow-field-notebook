import { strToU8, zipSync, type Zippable } from 'fflate';
import { entriesToCsv, entriesToDarwinCoreCsv, mediaArchivePath } from './export';
import { readMediaBytes } from './media';
import type { FieldEntry } from './types';

/** Build a self-contained ZIP with both CSV formats and every attached file. */
export async function buildResearchArchive(entries: FieldEntry[]): Promise<Uint8Array> {
  const files: Zippable = {
    'bioglow-field-notes.csv': strToU8(entriesToCsv(entries)),
    'darwin-core-occurrences.csv': strToU8(entriesToDarwinCoreCsv(entries, true)),
  };

  for (const entry of entries) {
    for (const kind of ['photo', 'voice'] as const) {
      const uri = kind === 'photo' ? entry.photoUri : entry.voiceUri;
      const path = mediaArchivePath(entry, kind);
      if (uri && path) files[path] = [await readMediaBytes(uri), { level: 0 }];
    }
  }

  return zipSync(files);
}
