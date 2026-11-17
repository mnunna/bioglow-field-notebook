import { assembleResearchArchive, type ResearchArchive } from './exportArchiveCore';
import { readMediaBytes } from './media';
import type { FieldEntry } from './types';

/** Build a self-contained ZIP with both CSV formats and every attached file. */
export async function buildResearchArchive(entries: FieldEntry[]): Promise<ResearchArchive> {
  return assembleResearchArchive(entries, readMediaBytes);
}
