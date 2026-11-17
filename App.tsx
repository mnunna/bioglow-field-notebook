import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { FieldEntry, NotebookKey, TabKey, TemplateDef } from './src/types';
import {
  loadEntries,
  loadGloveMode,
  saveEntries,
  saveGloveMode,
} from './src/storage';
import { buildResearchArchive } from './src/exportArchive';
import {
  deleteEntryMedia,
  deleteManagedMedia,
  isManagedMediaUri,
  persistMediaFile,
} from './src/media';
import { HomeScreen } from './src/screens/HomeScreen';
import { EntryFormScreen } from './src/screens/EntryFormScreen';
import { NotebookScreen } from './src/screens/NotebookScreen';
import { EntryDetailScreen } from './src/screens/EntryDetailScreen';
import { IdeasScreen } from './src/screens/IdeasScreen';
import { COLORS } from './src/components/ui';
import { RainGloveOverlay } from './src/components/RainGloveOverlay';
import { templateByKey } from './src/templates';
import { isSampleEntry } from './src/sampleData';
import { createSampleEntriesWithMedia } from './src/sampleMedia';

type Route =
  | { name: 'tabs' }
  | { name: 'form'; template: TemplateDef; entryId?: string }
  | { name: 'detail'; entryId: string };

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'notebook', label: 'Notebook', icon: '📓' },
  { key: 'ideas', label: 'Ideas', icon: '💡' },
];

export default function App() {
  const [entries, setEntries] = useState<FieldEntry[]>([]);
  const entriesRef = useRef<FieldEntry[]>([]);
  const entryMutationQueue = useRef<Promise<void>>(Promise.resolve());
  const [glove, setGlove] = useState(false);
  const [tab, setTab] = useState<TabKey>('home');
  const [route, setRoute] = useState<Route>({ name: 'tabs' });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<NotebookKey | 'all'>('all');
  const [sampleDataPending, setSampleDataPending] = useState(false);
  const sampleDataPendingRef = useRef(false);
  const [showGloveAnim, setShowGloveAnim] = useState(false);
  const gloveAnimTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const savedEntries = await loadEntries();
      const createdMedia: string[] = [];
      let mediaReferencesChanged = false;
      let durableEntries = savedEntries;
      try {
        durableEntries = savedEntries.map((entry) => {
          let photoUri = entry.photoUri;
          let voiceUri = entry.voiceUri;
          try {
            if (photoUri) {
              const previousUri = photoUri;
              const wasManaged = isManagedMediaUri(photoUri);
              photoUri = persistMediaFile(photoUri, entry.id, 'photo');
              if (!wasManaged) createdMedia.push(photoUri);
              if (photoUri !== previousUri) mediaReferencesChanged = true;
            }
          } catch {
            // Preserve the legacy URI if it cannot be copied during startup.
          }
          try {
            if (voiceUri) {
              const previousUri = voiceUri;
              const wasManaged = isManagedMediaUri(voiceUri);
              voiceUri = persistMediaFile(voiceUri, entry.id, 'voice');
              if (!wasManaged) createdMedia.push(voiceUri);
              if (voiceUri !== previousUri) mediaReferencesChanged = true;
            }
          } catch {
            // Preserve the legacy URI if it cannot be copied during startup.
          }
          return { ...entry, photoUri, voiceUri };
        });
        if (createdMedia.length > 0 || mediaReferencesChanged) {
          await saveEntries(durableEntries);
        }
      } catch {
        for (const uri of createdMedia) {
          try {
            deleteManagedMedia(uri);
          } catch {
            // Best-effort rollback; keep loading the original notebook.
          }
        }
        durableEntries = savedEntries;
        Alert.alert(
          'Media migration incomplete',
          'Older attachments could not be moved into durable storage. Your notes are still available.',
        );
      }
      entriesRef.current = durableEntries;
      setEntries(durableEntries);
      setGlove(await loadGloveMode());
    })();
  }, []);

  const toggleGlove = useCallback((v: boolean) => {
    setGlove(v);
    void saveGloveMode(v);
    if (gloveAnimTimer.current) clearTimeout(gloveAnimTimer.current);
    if (v) {
      // Flashy rain + glove activation animation, then back to the app.
      setShowGloveAnim(true);
      gloveAnimTimer.current = setTimeout(() => setShowGloveAnim(false), 2150);
    } else {
      setShowGloveAnim(false);
    }
  }, []);

  const commitEntries = useCallback((next: FieldEntry[]) => {
    entriesRef.current = next;
    setEntries(next);
  }, []);

  const enqueueEntryMutation = useCallback((work: () => Promise<void>): Promise<void> => {
    const operation = entryMutationQueue.current.then(work);
    entryMutationQueue.current = operation.catch(() => undefined);
    return operation;
  }, []);

  const saveEntry = useCallback((draft: FieldEntry) => enqueueEntryMutation(async () => {
    const current = entriesRef.current;
    const previous = current.find((entry) => entry.id === draft.id);
    const createdMedia: string[] = [];
    try {
      let photoUri = draft.photoUri;
      let voiceUri = draft.voiceUri;
      if (photoUri) {
        const wasManaged = isManagedMediaUri(photoUri);
        photoUri = persistMediaFile(photoUri, draft.id, 'photo');
        if (!wasManaged) createdMedia.push(photoUri);
      }
      if (voiceUri) {
        const wasManaged = isManagedMediaUri(voiceUri);
        voiceUri = persistMediaFile(voiceUri, draft.id, 'voice');
        if (!wasManaged) createdMedia.push(voiceUri);
      }

      const saved = { ...draft, photoUri, voiceUri };
      const next = previous
        ? current.map((entry) => (entry.id === saved.id ? saved : entry))
        : [saved, ...current];
      await saveEntries(next);
      commitEntries(next);

      for (const [oldUri, newUri] of [
        [previous?.photoUri, photoUri],
        [previous?.voiceUri, voiceUri],
      ] as const) {
        if (oldUri && oldUri !== newUri) {
          try {
            deleteManagedMedia(oldUri);
          } catch {
            // The entry is safely updated; an orphaned file can be cleaned later.
          }
        }
      }
      setFilter('all');
      setSearch('');
      setTab('notebook');
      setRoute({ name: 'tabs' });
    } catch (error) {
      for (const uri of createdMedia) {
        try {
          deleteManagedMedia(uri);
        } catch {
          // Best-effort rollback of newly copied media.
        }
      }
      throw error;
    }
  }), [commitEntries, enqueueEntryMutation]);

  const toggleStar = useCallback((entry: FieldEntry) => {
    void enqueueEntryMutation(async () => {
      const current = entriesRef.current;
      const savedEntry = current.find((candidate) => candidate.id === entry.id);
      if (!savedEntry) return;
      const now = new Date().toISOString();
      const next = current.map((candidate) =>
        candidate.id === entry.id
          ? { ...candidate, starred: !candidate.starred, updatedAt: now }
          : candidate,
      );
      try {
        await saveEntries(next);
        commitEntries(next);
      } catch (error) {
        Alert.alert('Star not saved', error instanceof Error ? error.message : 'Try again.');
      }
    });
  }, [commitEntries, enqueueEntryMutation]);

  const deleteEntry = useCallback((entry: FieldEntry) => {
    Alert.alert('Delete this entry?', entry.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void enqueueEntryMutation(async () => {
            const next = entriesRef.current.filter((candidate) => candidate.id !== entry.id);
            try {
              await saveEntries(next);
              commitEntries(next);
              try {
                deleteEntryMedia(entry);
              } catch {
                // The notebook is correct even if an orphaned file remains.
              }
              setRoute({ name: 'tabs' });
              setTab('notebook');
            } catch (error) {
              Alert.alert('Entry not deleted', error instanceof Error ? error.message : 'Try again.');
            }
          });
        },
      },
    ]);
  }, [commitEntries, enqueueEntryMutation]);

  const loadSampleData = useCallback(() => {
    if (sampleDataPendingRef.current) return;
    sampleDataPendingRef.current = true;
    setSampleDataPending(true);

    void enqueueEntryMutation(async () => {
      const current = entriesRef.current;
      const oldSamples = current.filter(isSampleEntry);
      let samples: FieldEntry[] = [];
      try {
        samples = await createSampleEntriesWithMedia();
        const next = [...samples, ...current.filter((entry) => !isSampleEntry(entry))];
        await saveEntries(next);
        commitEntries(next);

        for (const entry of oldSamples) {
          try {
            deleteEntryMedia(entry);
          } catch {
            // The refreshed samples are saved; an older sample file can be cleaned later.
          }
        }

        setFilter('all');
        setSearch('');
        setTab('notebook');
      } catch (error) {
        for (const entry of samples) {
          try {
            deleteEntryMedia(entry);
          } catch {
            // Best-effort rollback of new sample media.
          }
        }
        Alert.alert(
          'Sample data not added',
          error instanceof Error ? error.message : 'The sample entries could not be saved.',
        );
      } finally {
        sampleDataPendingRef.current = false;
        setSampleDataPending(false);
      }
    });
  }, [commitEntries, enqueueEntryMutation]);

  const removeSampleData = useCallback(() => {
    const sampleCount = entriesRef.current.filter(isSampleEntry).length;
    if (sampleCount === 0) return;

    Alert.alert(
      'Remove sample data?',
      `This removes ${sampleCount} sample entries and their bundled attachments. Your real field notes will not be changed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove samples',
          style: 'destructive',
          onPress: () => {
            void enqueueEntryMutation(async () => {
              const samples = entriesRef.current.filter(isSampleEntry);
              const next = entriesRef.current.filter((entry) => !isSampleEntry(entry));
              try {
                await saveEntries(next);
                commitEntries(next);
                for (const entry of samples) {
                  try {
                    deleteEntryMedia(entry);
                  } catch {
                    // Sample records are gone; an orphaned attachment can be cleaned later.
                  }
                }
              } catch (error) {
                Alert.alert(
                  'Sample data not removed',
                  error instanceof Error ? error.message : 'Try again.',
                );
              }
            });
          },
        },
      ],
    );
  }, [commitEntries, enqueueEntryMutation]);

  const shareResearchArchive = useCallback(async () => {
    const current = entriesRef.current;
    if (current.length === 0) {
      Alert.alert('Nothing to export', 'Save at least one entry first.');
      return;
    }
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing unavailable', 'This device cannot share the research archive.');
        return;
      }
      const archive = await buildResearchArchive(current);
      const file = new File(Paths.cache, 'bioglow-research-export.zip');
      file.write(archive.bytes);
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/zip',
        dialogTitle: 'Export BioGlow research archive',
      });
      if (archive.missingMedia.length > 0) {
        Alert.alert(
          'Exported with missing attachments',
          `${archive.missingMedia.length} older attachment${archive.missingMedia.length === 1 ? ' was' : 's were'} no longer available. All observation text and remaining media were exported. See missing-attachments.txt in the ZIP.`,
        );
      }
    } catch (error) {
      Alert.alert(
        'Export failed',
        error instanceof Error ? error.message : 'The research archive could not be created.',
      );
    }
  }, []);

  const detailEntry =
    route.name === 'detail' ? entries.find((e) => e.id === route.entryId) : undefined;
  const formEntry =
    route.name === 'form' && route.entryId
      ? entries.find((entry) => entry.id === route.entryId)
      : undefined;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={[COLORS.bgDeep, COLORS.bg, '#0a2e1f']} style={styles.fill}>
        <View style={styles.content}>
          {route.name === 'form' ? (
            <EntryFormScreen
              template={route.template}
              initialEntry={formEntry}
              glove={glove}
              onSave={saveEntry}
              onCancel={() => setRoute({ name: 'tabs' })}
            />
          ) : route.name === 'detail' && detailEntry ? (
            <EntryDetailScreen
              entry={detailEntry}
              glove={glove}
              onBack={() => setRoute({ name: 'tabs' })}
              onEdit={(entry) => setRoute({
                name: 'form',
                template: templateByKey(entry.templateKey),
                entryId: entry.id,
              })}
              onToggleStar={toggleStar}
              onDelete={deleteEntry}
            />
          ) : tab === 'home' ? (
            <HomeScreen
              entries={entries}
              glove={glove}
              onToggleGlove={toggleGlove}
              onPickTemplate={(t) => setRoute({ name: 'form', template: t })}
              onPickNotebook={(k) => {
                setFilter(k);
                setTab('notebook');
              }}
              sampleEntryCount={entries.filter(isSampleEntry).length}
              sampleDataPending={sampleDataPending}
              onLoadSampleData={loadSampleData}
              onRemoveSampleData={removeSampleData}
            />
          ) : tab === 'notebook' ? (
            <NotebookScreen
              entries={entries}
              glove={glove}
              search={search}
              onSearch={setSearch}
              filter={filter}
              onFilter={setFilter}
              onOpen={(e) => setRoute({ name: 'detail', entryId: e.id })}
              onToggleStar={toggleStar}
              onExport={shareResearchArchive}
            />
          ) : (
            <IdeasScreen />
          )}
        </View>

        <RainGloveOverlay visible={showGloveAnim} />

        {route.name === 'tabs' && (
          <View style={styles.tabBar}>
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setTab(t.key)}
                  style={[styles.tab, glove && styles.tabGlove, active && styles.tabActive]}
                >
                  <Text style={[styles.tabIcon, glove && { fontSize: 26 }]}>{t.icon}</Text>
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive, glove && { fontSize: 14 }]}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgDeep },
  fill: { flex: 1 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(4,21,15,0.92)',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tab: { flex: 1, alignItems: 'center', borderRadius: 14, paddingVertical: 6 },
  tabGlove: { paddingVertical: 12 },
  tabActive: { backgroundColor: 'rgba(163,230,53,0.16)' },
  tabIcon: { fontSize: 21 },
  tabLabel: { color: COLORS.muted, fontSize: 12, marginTop: 2, fontWeight: '600' },
  tabLabelActive: { color: COLORS.lime },
});
