import { strToU8, zipSync, type Zippable } from 'fflate';
import { entriesToCsv, entriesToDarwinCoreCsv, mediaArchivePath } from './export';
import type { FieldEntry } from './types';

export interface MissingArchiveMedia {
  entryId: string;
  title: string;
  kind: 'photo' | 'voice';
}

export interface ResearchArchive {
  bytes: Uint8Array;
  missingMedia: MissingArchiveMedia[];
}

type MediaReader = (uri: string) => Promise<Uint8Array>;

/**
 * Build an archive without allowing an expired attachment URI to discard the
 * observation itself. The injected reader keeps this policy unit-testable.
 */
export async function assembleResearchArchive(
  entries: FieldEntry[],
  readMedia: MediaReader,
): Promise<ResearchArchive> {
  const files: Zippable = {};
  const missingMedia: MissingArchiveMedia[] = [];
  const exportableEntries: FieldEntry[] = [];

  for (const entry of entries) {
    let photoUri = entry.photoUri;
    let voiceUri = entry.voiceUri;

    for (const kind of ['photo', 'voice'] as const) {
      const uri = kind === 'photo' ? photoUri : voiceUri;
      const path = mediaArchivePath(entry, kind);
      if (!uri || !path) continue;

      try {
        files[path] = [await readMedia(uri), { level: 0 }];
      } catch {
        missingMedia.push({ entryId: entry.id, title: entry.title, kind });
        if (kind === 'photo') photoUri = null;
        else voiceUri = null;
      }
    }

    exportableEntries.push({ ...entry, photoUri, voiceUri });
  }

  files['bioglow-field-notes.csv'] = strToU8(entriesToCsv(exportableEntries));
  files['darwin-core-occurrences.csv'] = strToU8(
    entriesToDarwinCoreCsv(exportableEntries, true),
  );

  if (missingMedia.length > 0) {
    const lines = [
      'BioGlow export attachment warning',
      '',
      'The observations and their text data are included in this archive, but these older attachment files were no longer available on the phone:',
      '',
      ...missingMedia.map(
        (item) => `- ${item.entryId} (${item.title}): ${item.kind}`,
      ),
      '',
    ];
    files['missing-attachments.txt'] = strToU8(lines.join('\n'));
  }

  return { bytes: zipSync(files), missingMedia };
}
