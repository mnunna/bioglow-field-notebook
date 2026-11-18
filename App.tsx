import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { File, Paths } from 'expo-file-system';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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
import { CaptureScreen } from './src/screens/CaptureScreen';
import { EntryFormScreen } from './src/screens/EntryFormScreen';
import { NotebookScreen } from './src/screens/NotebookScreen';
import { EntryDetailScreen } from './src/screens/EntryDetailScreen';
import { ObservationMapScreen } from './src/screens/ObservationMapScreen';
import { MoreScreen } from './src/screens/MoreScreen';
import { InfoScreen } from './src/screens/InfoScreen';
import { TriviaScreen } from './src/screens/TriviaScreen';
import { COLORS } from './src/components/ui';
import { RainGloveOverlay } from './src/components/RainGloveOverlay';
import { templateByKey } from './src/templates';
import { isSampleEntry } from './src/sampleData';
import { createSampleEntriesWithMedia } from './src/sampleMedia';
import { markEntriesExported } from './src/entryModel';

type RootStackParamList = {
  Tabs: undefined;
  Form: { template: TemplateDef; entryId?: string };
  Detail: { entryId: string };
  ObservationMap: undefined;
  Info: undefined;
  Trivia: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();
const PRIVACY_POLICY_URL = 'https://bioglow-discovery.vercel.app/privacy';
const SUPPORT_URL = 'https://bioglow-discovery.vercel.app/support';

const TABS: {
  key: TabKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { key: 'home', label: 'History', icon: 'time-outline', activeIcon: 'time' },
  { key: 'capture', label: 'New note', icon: 'add-circle-outline', activeIcon: 'add-circle' },
  { key: 'notebook', label: 'Archive', icon: 'archive-outline', activeIcon: 'archive' },
  { key: 'more', label: 'More', icon: 'ellipsis-horizontal-circle-outline', activeIcon: 'ellipsis-horizontal-circle' },
];

export default function App() {
  const [entries, setEntries] = useState<FieldEntry[]>([]);
  const entriesRef = useRef<FieldEntry[]>([]);
  const entryMutationQueue = useRef<Promise<void>>(Promise.resolve());
  const [glove, setGlove] = useState(false);
  const [tab, setTab] = useState<TabKey>('home');
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
      setTab(saved.exportedAt === null ? 'home' : 'notebook');
      if (navigationRef.isReady()) navigationRef.resetRoot({ index: 0, routes: [{ name: 'Tabs' }] });
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
              if (navigationRef.isReady() && navigationRef.canGoBack()) navigationRef.goBack();
              setTab(entry.exportedAt === null ? 'home' : 'notebook');
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
        setTab('home');
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
      const file = new File(Paths.cache, 'eco-note-research-export.zip');
      file.write(archive.bytes);
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/zip',
        dialogTitle: 'Export Eco Note research archive',
      });
      const historyIds = new Set(current.filter((entry) => entry.exportedAt === null).map((entry) => entry.id));
      const missingMessage = archive.missingMedia.length > 0
        ? ` ${archive.missingMedia.length} older attachment${archive.missingMedia.length === 1 ? ' was' : 's were'} unavailable; all observation text and remaining media are still in the ZIP.`
        : '';

      if (historyIds.size > 0) {
        Alert.alert(
          'Move exported notes to Archive?',
          `If you saved or sent the research ZIP, move ${historyIds.size} ${historyIds.size === 1 ? 'note' : 'notes'} out of History and into Archive.${missingMessage}`,
          [
            { text: 'Keep in History', style: 'cancel' },
            {
              text: 'Move to Archive',
              onPress: () => {
                void enqueueEntryMutation(async () => {
                  const archivedAt = new Date().toISOString();
                  const next = markEntriesExported(entriesRef.current, historyIds, archivedAt);
                  try {
                    await saveEntries(next);
                    commitEntries(next);
                    setTab('notebook');
                    if (navigationRef.isReady()) navigationRef.resetRoot({ index: 0, routes: [{ name: 'Tabs' }] });
                  } catch (error) {
                    Alert.alert(
                      'Export shared, but History was not updated',
                      error instanceof Error ? error.message : 'The notes remain safely in History.',
                    );
                  }
                });
              },
            },
          ],
        );
      } else if (archive.missingMedia.length > 0) {
        Alert.alert('Exported with missing attachments', missingMessage.trim());
      }
    } catch (error) {
      Alert.alert(
        'Export failed',
        error instanceof Error ? error.message : 'The research archive could not be created.',
      );
    }
  }, [commitEntries, enqueueEntryMutation]);

  const submitFeedback = useCallback(async () => {
    const subject = encodeURIComponent('BioGlow app feedback');
    const body = encodeURIComponent('What would you like us to know?\n\n');
    try {
      await Linking.openURL(`mailto:mecha_masters@icloud.com?subject=${subject}&body=${body}`);
    } catch {
      Alert.alert(
        'Email unavailable',
        'Set up an email app on this device, then try submitting feedback again.',
      );
    }
  }, []);

  const openExternalPage = useCallback(async (url: string, pageName: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        `${pageName} unavailable`,
        'Check your internet connection, then try again.',
      );
    }
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
          screenOptions={{
            contentStyle: { backgroundColor: COLORS.bgDeep },
            headerStyle: { backgroundColor: COLORS.bgDeep },
            headerTintColor: COLORS.text,
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            gestureEnabled: true,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Tabs" options={{ headerShown: false }}>
            {({ navigation }) => (
              <SafeAreaView style={styles.root}>
                <LinearGradient colors={[COLORS.bgDeep, COLORS.bg, COLORS.bgSoft]} style={styles.fill}>
                  <View style={styles.content}>
                    {tab === 'home' ? (
                      <HomeScreen
                        entries={entries}
                        glove={glove}
                        onToggleGlove={toggleGlove}
                        onStartCapture={() => setTab('capture')}
                        onExport={shareResearchArchive}
                        onOpenMap={() => navigation.navigate('ObservationMap')}
                        onOpen={(entry) => navigation.navigate('Detail', { entryId: entry.id })}
                        sampleEntryCount={entries.filter(isSampleEntry).length}
                        sampleDataPending={sampleDataPending}
                        onLoadSampleData={loadSampleData}
                        onRemoveSampleData={removeSampleData}
                      />
                    ) : tab === 'capture' ? (
                      <CaptureScreen
                        glove={glove}
                        onPickTemplate={(template) => navigation.navigate('Form', { template })}
                      />
                    ) : tab === 'notebook' ? (
                      <NotebookScreen
                        entries={entries}
                        glove={glove}
                        search={search}
                        onSearch={setSearch}
                        filter={filter}
                        onFilter={setFilter}
                        onOpen={(entry) => navigation.navigate('Detail', { entryId: entry.id })}
                        onToggleStar={toggleStar}
                        onExport={shareResearchArchive}
                        onOpenMap={() => navigation.navigate('ObservationMap')}
                      />
                    ) : (
                      <MoreScreen
                        glove={glove}
                        onOpenInfo={() => navigation.navigate('Info')}
                        onOpenTrivia={() => navigation.navigate('Trivia')}
                        onSubmitFeedback={submitFeedback}
                        onOpenPrivacyPolicy={() => openExternalPage(PRIVACY_POLICY_URL, 'Privacy policy')}
                        onOpenSupport={() => openExternalPage(SUPPORT_URL, 'Support page')}
                      />
                    )}
                  </View>

                  <RainGloveOverlay visible={showGloveAnim} />

                  <View style={styles.tabBar}>
                    {TABS.map((item) => {
                      const active = tab === item.key;
                      return (
                        <Pressable
                          key={item.key}
                          onPress={() => setTab(item.key)}
                          style={[styles.tab, glove && styles.tabGlove, active && styles.tabActive]}
                        >
                          <Ionicons
                            name={active ? item.activeIcon : item.icon}
                            size={glove ? 29 : 23}
                            color={active ? COLORS.lime : COLORS.muted}
                          />
                          <Text style={[styles.tabLabel, active && styles.tabLabelActive, glove && styles.tabLabelGlove]}>
                            {item.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </LinearGradient>
              </SafeAreaView>
            )}
          </Stack.Screen>

          <Stack.Screen name="Form" options={{ title: '' }}>
            {({ navigation, route }) => (
              <SafeAreaView style={styles.root} edges={['bottom']}>
                <LinearGradient colors={[COLORS.bgDeep, COLORS.bg, COLORS.bgSoft]} style={styles.fill}>
                  <EntryFormScreen
                    template={route.params.template}
                    initialEntry={route.params.entryId
                      ? entries.find((entry) => entry.id === route.params.entryId)
                      : undefined}
                    glove={glove}
                    onSave={saveEntry}
                    onCancel={() => navigation.goBack()}
                  />
                </LinearGradient>
              </SafeAreaView>
            )}
          </Stack.Screen>

          <Stack.Screen name="Detail" options={{ title: '' }}>
            {({ navigation, route }) => {
              const entry = entries.find((candidate) => candidate.id === route.params.entryId);
              if (!entry) {
                return (
                  <View style={styles.missingEntry}>
                    <Text style={styles.missingEntryText}>This observation is no longer available.</Text>
                  </View>
                );
              }
              return (
                <SafeAreaView style={styles.root} edges={['bottom']}>
                  <LinearGradient colors={[COLORS.bgDeep, COLORS.bg, COLORS.bgSoft]} style={styles.fill}>
                    <EntryDetailScreen
                      entry={entry}
                      glove={glove}
                      onEdit={(selected) => navigation.navigate('Form', {
                        template: templateByKey(selected.templateKey),
                        entryId: selected.id,
                      })}
                      onToggleStar={toggleStar}
                      onDelete={deleteEntry}
                    />
                  </LinearGradient>
                </SafeAreaView>
              );
            }}
          </Stack.Screen>
          <Stack.Screen name="ObservationMap" options={{ title: 'Observation Map' }}>
            {({ navigation }) => (
              <SafeAreaView style={styles.root} edges={['bottom']}>
                <ObservationMapScreen
                  entries={entries}
                  glove={glove}
                  onOpen={(entry) => navigation.navigate('Detail', { entryId: entry.id })}
                />
              </SafeAreaView>
            )}
          </Stack.Screen>
          <Stack.Screen name="Info" options={{ title: 'Info & how to use' }}>
            {() => (
              <SafeAreaView style={styles.root} edges={['bottom']}>
                <LinearGradient colors={[COLORS.bgDeep, COLORS.bg, COLORS.bgSoft]} style={styles.fill}>
                  <InfoScreen glove={glove} />
                </LinearGradient>
              </SafeAreaView>
            )}
          </Stack.Screen>
          <Stack.Screen name="Trivia" options={{ title: 'Biodiversity trivia' }}>
            {() => (
              <SafeAreaView style={styles.root} edges={['bottom']}>
                <LinearGradient colors={[COLORS.bgDeep, COLORS.bg, COLORS.bgSoft]} style={styles.fill}>
                  <TriviaScreen glove={glove} />
                </LinearGradient>
              </SafeAreaView>
            )}
          </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgDeep },
  fill: { flex: 1 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(2,19,13,0.96)',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: 7,
    paddingBottom: 8,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.26,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 15, paddingVertical: 6 },
  tabGlove: { paddingVertical: 12 },
  tabActive: { backgroundColor: 'rgba(182,239,104,0.14)' },
  tabLabel: { color: COLORS.muted, fontSize: 10.5, marginTop: 2, fontWeight: '700' },
  tabLabelActive: { color: COLORS.lime },
  tabLabelGlove: { fontSize: 14, marginTop: 4 },
  missingEntry: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgDeep, padding: 24 },
  missingEntryText: { color: COLORS.text, fontSize: 16, textAlign: 'center' },
});
