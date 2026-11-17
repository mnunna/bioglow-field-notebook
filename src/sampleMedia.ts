import { Asset } from 'expo-asset';
import { createSampleEntries } from './sampleData';
import { deleteManagedMedia, persistMediaFile } from './media';
import type { FieldEntry } from './types';

const TREE_FROG_PHOTO = require('../assets/sample-media/tree-frog.jpg') as number;
const BIOGLOW_FUNGI_PHOTO = require('../assets/sample-media/bioglow-fungi.jpg') as number;
const FIELD_NOTE_AUDIO = require('../assets/sample-media/field-note.wav') as number;

async function localAssetUri(moduleId: number): Promise<string> {
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('A bundled sample attachment could not be opened.');
  return asset.localUri;
}

/** Copy bundled test attachments into the same durable storage used by real entries. */
export async function createSampleEntriesWithMedia(
  now = new Date(),
): Promise<FieldEntry[]> {
  const [treeFrogPhoto, bioglowFungiPhoto, fieldNoteAudio] = await Promise.all([
    localAssetUri(TREE_FROG_PHOTO),
    localAssetUri(BIOGLOW_FUNGI_PHOTO),
    localAssetUri(FIELD_NOTE_AUDIO),
  ]);
  const createdMedia: string[] = [];

  try {
    return createSampleEntries(now).map((entry) => {
      let photoUri = entry.photoUri;
      let voiceUri = entry.voiceUri;

      if (entry.templateKey === 'animal') {
        photoUri = persistMediaFile(treeFrogPhoto, entry.id, 'photo');
        createdMedia.push(photoUri);
      } else if (entry.templateKey === 'bioglow') {
        photoUri = persistMediaFile(bioglowFungiPhoto, entry.id, 'photo');
        createdMedia.push(photoUri);
      } else if (entry.templateKey === 'quick') {
        voiceUri = persistMediaFile(fieldNoteAudio, entry.id, 'voice');
        createdMedia.push(voiceUri);
      }

      return { ...entry, photoUri, voiceUri };
    });
  } catch (error) {
    for (const uri of createdMedia) {
      try {
        deleteManagedMedia(uri);
      } catch {
        // Best-effort rollback of partially copied sample attachments.
      }
    }
    throw error;
  }
}
