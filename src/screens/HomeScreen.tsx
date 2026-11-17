import React, { useMemo } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { FieldEntry } from '../types';
import { templateByKey } from '../templates';
import { BigButton, COLORS, GlossyCard } from '../components/ui';
import { resolveMediaUri } from '../media';

function formatEntryTime(value: string): string {
  const date = new Date(value);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return isToday ? time : `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${time}`;
}

function JournalEntry({
  entry,
  glove,
  onOpen,
  last,
}: {
  entry: FieldEntry;
  glove: boolean;
  onOpen: () => void;
  last: boolean;
}) {
  const template = templateByKey(entry.templateKey);
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineDot, { backgroundColor: template.gradient[1] }]} />
        {!last ? <View style={styles.timelineLine} /> : null}
      </View>
      <Pressable onPress={onOpen} style={({ pressed }) => [styles.entryPressable, pressed && styles.pressed]}>
        <LinearGradient
          colors={[`${template.gradient[0]}F2`, `${template.gradient[1]}4D`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.entryCard, glove && styles.entryCardGlove]}
        >
          <View style={styles.gloss} />
          <View style={styles.entryHeader}>
            <Text style={[styles.entryMeta, glove && styles.entryMetaGlove]}>
              {formatEntryTime(entry.createdAt)} · {template.title}
            </Text>
            {entry.starred ? <Text style={styles.star}>★</Text> : null}
          </View>
          <View style={styles.entryBody}>
            {entry.photoUri ? (
              <Image source={{ uri: resolveMediaUri(entry.photoUri) }} style={[styles.thumbnail, glove && styles.thumbnailGlove]} />
            ) : (
              <View style={[styles.iconThumbnail, glove && styles.thumbnailGlove]}>
                <Text style={[styles.entryIcon, glove && styles.entryIconGlove]}>{template.icon}</Text>
              </View>
            )}
            <View style={styles.entryCopy}>
              <Text numberOfLines={2} style={[styles.entryTitle, glove && styles.entryTitleGlove]}>
                {entry.title}
              </Text>
              <Text numberOfLines={2} style={[styles.entryDetails, glove && styles.entryDetailsGlove]}>
                {entry.locationLabel || 'Location not added'}
                {entry.photoUri ? ' · Photo' : ''}
                {entry.voiceUri ? ' · Voice' : ''}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export function HomeScreen({
  entries,
  glove,
  onToggleGlove,
  onStartCapture,
  onExport,
  onOpen,
  sampleEntryCount,
  sampleDataPending,
  onLoadSampleData,
  onRemoveSampleData,
}: {
  entries: FieldEntry[];
  glove: boolean;
  onToggleGlove: (value: boolean) => void;
  onStartCapture: () => void;
  onExport: () => void;
  onOpen: (entry: FieldEntry) => void;
  sampleEntryCount: number;
  sampleDataPending: boolean;
  onLoadSampleData: () => void;
  onRemoveSampleData: () => void;
}) {
  const now = new Date();
  const historyEntries = useMemo(
    () => entries.filter((entry) => entry.exportedAt === null),
    [entries],
  );
  const recentEntries = useMemo(
    () => [...historyEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [historyEntries],
  );

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.offlineLabel}>
          <View style={styles.offlineDot} />
          <Text style={styles.offlineText}>Offline field journal</Text>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: glove }}
          accessibilityLabel="Rain and Glove Mode"
          onPress={() => onToggleGlove(!glove)}
          style={({ pressed }) => [
            styles.glovePill,
            glove && styles.glovePillActive,
            glove && styles.glovePillGlove,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="rainy-outline"
            size={glove ? 19 : 16}
            color={glove ? COLORS.text : COLORS.muted}
            style={styles.gloveIcon}
          />
          <Text style={[styles.gloveLabel, glove && styles.gloveLabelActive, glove && styles.gloveLabelGlove]}>Rain / Glove</Text>
          <View style={[styles.toggleTrack, glove && styles.toggleTrackActive, glove && styles.toggleTrackGlove]}>
            <View style={[styles.toggleThumb, glove && styles.toggleThumbActive, glove && styles.toggleThumbGlove]} />
          </View>
        </Pressable>
      </View>

      <View style={styles.dateHeader}>
        <Text style={[styles.dateNumber, glove && styles.dateNumberGlove]}>{now.getDate()}</Text>
        <View style={styles.dateCopy}>
          <Text style={styles.eyebrow}>
            {now.toLocaleDateString([], { month: 'long', weekday: 'long' }).toUpperCase()}
          </Text>
          <Text style={[styles.heading, glove && styles.headingGlove]}>History</Text>
        </View>
        <View style={styles.entryCount}>
          <Text style={styles.entryCountValue}>{historyEntries.length}</Text>
          <Text style={styles.entryCountLabel}>{historyEntries.length === 1 ? 'note' : 'notes'}</Text>
        </View>
      </View>

      <View style={styles.captureAction}>
        <BigButton title="＋ New field note" glove={glove} onPress={onStartCapture} />
        {historyEntries.length > 0 ? (
          <View style={styles.exportAction}>
            <BigButton title="⇧ Export research ZIP" glove={glove} variant="ghost" onPress={onExport} />
          </View>
        ) : null}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, glove && styles.sectionTitleGlove]}>Not yet exported</Text>
        <Text style={styles.sectionMeta}>saved on this phone</Text>
      </View>

      {recentEntries.length === 0 ? (
        <GlossyCard>
          <Text style={[styles.emptyTitle, glove && styles.emptyTitleGlove]}>
            {entries.length === 0 ? 'Your field journal is ready' : 'History is clear'}
          </Text>
          <Text style={[styles.emptyText, glove && styles.emptyTextGlove]}>
            {entries.length === 0
              ? 'Start a note when you spot something. Eco Note works without a signal and keeps observations on this device.'
              : 'All saved observations have been exported and are available in Archive.'}
          </Text>
        </GlossyCard>
      ) : (
        <View style={styles.timeline}>
          {recentEntries.map((entry, index) => (
            <JournalEntry
              key={entry.id}
              entry={entry}
              glove={glove}
              onOpen={() => onOpen(entry)}
              last={index === recentEntries.length - 1}
            />
          ))}
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, glove && styles.sectionTitleGlove]}>Demo tools</Text>
        <Text style={styles.sectionMeta}>testing only</Text>
      </View>
      <GlossyCard>
        <View style={styles.demoHeader}>
          <View style={styles.demoIcon}><Text style={styles.demoIconText}>🧪</Text></View>
          <View style={styles.demoCopy}>
            <Text style={[styles.demoTitle, glove && styles.demoTitleGlove]}>Sample observations</Text>
            <Text style={[styles.demoText, glove && styles.demoTextGlove]}>
              Add or reset six labeled notes with sample media. Your real field notes are never changed.
            </Text>
          </View>
        </View>
        <View style={styles.demoActions}>
          <BigButton
            title={
              sampleDataPending
                ? 'Loading sample data…'
                : sampleEntryCount > 0
                  ? 'Reset sample data'
                  : 'Add sample data'
            }
            glove={glove}
            variant="ghost"
            onPress={onLoadSampleData}
            disabled={sampleDataPending}
          />
          {sampleEntryCount > 0 ? (
            <View style={styles.removeAction}>
              <BigButton
                title={`Remove ${sampleEntryCount} sample entries`}
                glove={glove}
                variant="danger"
                onPress={onRemoveSampleData}
                disabled={sampleDataPending}
              />
            </View>
          ) : null}
        </View>
      </GlossyCard>
      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  offlineLabel: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  offlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.teal,
    shadowColor: COLORS.teal,
    shadowOpacity: 0.8,
    shadowRadius: 5,
    marginRight: 8,
  },
  offlineText: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  glovePill: {
    height: 42,
    paddingLeft: 12,
    paddingRight: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  glovePillActive: { backgroundColor: 'rgba(182,239,104,0.14)', borderColor: 'rgba(182,239,104,0.5)' },
  glovePillGlove: { height: 54, paddingLeft: 15, paddingRight: 8 },
  gloveIcon: { marginRight: 6 },
  gloveLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '800', marginRight: 5 },
  gloveLabelActive: { color: COLORS.text },
  gloveLabelGlove: { fontSize: 13, marginRight: 8 },
  toggleTrack: {
    width: 46,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: 'center',
    backgroundColor: 'rgba(165,197,178,0.42)',
  },
  toggleTrackActive: { backgroundColor: COLORS.lime },
  toggleTrackGlove: { width: 56, height: 34, borderRadius: 17, padding: 4 },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e9f5ed',
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  toggleThumbActive: { alignSelf: 'flex-end', backgroundColor: '#173006' },
  toggleThumbGlove: { width: 26, height: 26, borderRadius: 13 },
  dateHeader: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 18 },
  dateNumber: { color: COLORS.text, fontSize: 50, lineHeight: 50, fontWeight: '300', letterSpacing: -2 },
  dateNumberGlove: { fontSize: 56, lineHeight: 56 },
  dateCopy: { flex: 1, marginLeft: 12, paddingBottom: 2 },
  eyebrow: { color: COLORS.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  heading: { color: COLORS.text, fontSize: 29, lineHeight: 34, fontWeight: '900', letterSpacing: -0.8 },
  headingGlove: { fontSize: 33, lineHeight: 39 },
  entryCount: { alignItems: 'flex-end', paddingBottom: 4 },
  entryCountValue: { color: COLORS.lime, fontSize: 20, fontWeight: '900' },
  entryCountLabel: { color: COLORS.muted, fontSize: 11, marginTop: 1 },
  captureAction: { marginTop: 18 },
  exportAction: { marginTop: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  sectionTitleGlove: { fontSize: 21 },
  sectionMeta: { color: COLORS.muted, fontSize: 11 },
  timeline: { marginLeft: 2 },
  timelineRow: { flexDirection: 'row' },
  timelineRail: { width: 22, alignItems: 'center' },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 18,
    borderWidth: 2,
    borderColor: COLORS.bg,
    zIndex: 2,
  },
  timelineLine: { width: 1, flex: 1, backgroundColor: COLORS.cardBorder },
  entryPressable: { flex: 1, marginBottom: 12 },
  entryCard: {
    minHeight: 112,
    borderRadius: 20,
    padding: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  entryCardGlove: { minHeight: 138, padding: 17 },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  entryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entryMeta: { color: 'rgba(255,255,255,0.78)', fontSize: 10.5, fontWeight: '800', textTransform: 'uppercase' },
  entryMetaGlove: { fontSize: 13 },
  star: { color: '#fde047', fontSize: 17 },
  entryBody: { flexDirection: 'row', alignItems: 'center', marginTop: 9 },
  thumbnail: { width: 54, height: 54, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.18)' },
  thumbnailGlove: { width: 66, height: 66, borderRadius: 18 },
  iconThumbnail: {
    width: 54,
    height: 54,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  entryIcon: { fontSize: 25 },
  entryIconGlove: { fontSize: 31 },
  entryCopy: { flex: 1, paddingHorizontal: 11 },
  entryTitle: { color: '#fff', fontSize: 15, lineHeight: 19, fontWeight: '900' },
  entryTitleGlove: { fontSize: 19, lineHeight: 24 },
  entryDetails: { color: 'rgba(255,255,255,0.78)', fontSize: 11.5, lineHeight: 16, marginTop: 4 },
  entryDetailsGlove: { fontSize: 14, lineHeight: 20 },
  chevron: { color: 'rgba(255,255,255,0.78)', fontSize: 25 },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  emptyTitleGlove: { fontSize: 21 },
  emptyText: { color: COLORS.muted, fontSize: 14, lineHeight: 20, marginTop: 7 },
  emptyTextGlove: { fontSize: 17, lineHeight: 24 },
  demoHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  demoIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(56,224,193,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  demoIconText: { fontSize: 23 },
  demoCopy: { flex: 1 },
  demoTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900' },
  demoTitleGlove: { fontSize: 19 },
  demoText: { color: COLORS.muted, fontSize: 12.5, lineHeight: 18, marginTop: 4 },
  demoTextGlove: { fontSize: 15, lineHeight: 22 },
  demoActions: { marginTop: 14 },
  removeAction: { marginTop: 8 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  bottomSpace: { height: 24 },
});
