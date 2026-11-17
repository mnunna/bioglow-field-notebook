import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NOTEBOOKS, templateByKey } from '../templates';
import type { FieldEntry, NotebookKey } from '../types';
import { COLORS, Chip, GlossyCard } from '../components/ui';
import { resolveMediaUri } from '../media';

interface EntryGroup {
  key: string;
  label: string;
  entries: FieldEntry[];
}

function groupEntries(entries: FieldEntry[]): EntryGroup[] {
  const groups = new Map<string, EntryGroup>();
  for (const entry of entries) {
    const date = new Date(entry.createdAt);
    const key = date.toDateString();
    const existing = groups.get(key);
    if (existing) {
      existing.entries.push(entry);
    } else {
      groups.set(key, {
        key,
        label: date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }),
        entries: [entry],
      });
    }
  }
  return [...groups.values()];
}

function ArchiveEntry({
  entry,
  glove,
  onOpen,
  onToggleStar,
}: {
  entry: FieldEntry;
  glove: boolean;
  onOpen: () => void;
  onToggleStar: () => void;
}) {
  const template = templateByKey(entry.templateKey);
  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.entryOuter, pressed && styles.pressed]}>
      <View style={[styles.entryRow, glove && styles.entryRowGlove]}>
        {entry.photoUri ? (
          <Image source={{ uri: resolveMediaUri(entry.photoUri) }} style={[styles.thumbnail, glove && styles.thumbnailGlove]} />
        ) : (
          <LinearGradient
            colors={template.gradient}
            style={[styles.iconTile, glove && styles.thumbnailGlove]}
          >
            <View style={styles.iconGloss} />
            <Text style={[styles.icon, glove && styles.iconGlove]}>{template.icon}</Text>
          </LinearGradient>
        )}
        <View style={styles.entryCopy}>
          <Text numberOfLines={2} style={[styles.entryTitle, glove && styles.entryTitleGlove]}>{entry.title}</Text>
          <Text numberOfLines={2} style={[styles.entryMeta, glove && styles.entryMetaGlove]}>
            {new Date(entry.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            {' · '}{template.title}
            {entry.locationLabel ? ` · ${entry.locationLabel}` : ''}
          </Text>
          {entry.photoUri || entry.voiceUri ? (
            <Text style={[styles.attachments, glove && styles.attachmentsGlove]}>
              {entry.photoUri ? '▣ Photo' : ''}{entry.photoUri && entry.voiceUri ? '   ' : ''}{entry.voiceUri ? '● Voice' : ''}
            </Text>
          ) : null}
        </View>
        <View style={styles.entryActions}>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onToggleStar();
            }}
            hitSlop={8}
            style={({ pressed }) => [styles.starButton, glove && styles.starButtonGlove, pressed && styles.pressed]}
          >
            <Text style={[styles.star, entry.starred && styles.starActive]}>{entry.starred ? '★' : '☆'}</Text>
          </Pressable>
          <Text style={styles.chevron}>›</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function NotebookScreen({
  entries,
  glove,
  search,
  onSearch,
  filter,
  onFilter,
  onOpen,
  onToggleStar,
  onExport,
}: {
  entries: FieldEntry[];
  glove: boolean;
  search: string;
  onSearch: (value: string) => void;
  filter: NotebookKey | 'all';
  onFilter: (key: NotebookKey | 'all') => void;
  onOpen: (entry: FieldEntry) => void;
  onToggleStar: (entry: FieldEntry) => void;
  onExport: () => void;
}) {
  const archivedEntries = useMemo(
    () => entries.filter((entry) => entry.exportedAt !== null),
    [entries],
  );
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return archivedEntries
      .filter((entry) => filter === 'all' || entry.notebookKey === filter)
      .filter(
        (entry) =>
          !query ||
          entry.title.toLowerCase().includes(query) ||
          entry.notes.toLowerCase().includes(query) ||
          entry.locationLabel.toLowerCase().includes(query) ||
          Object.values(entry.values).join(' ').toLowerCase().includes(query),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [archivedEntries, filter, search]);
  const groups = useMemo(() => groupEntries(visible), [visible]);

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>FIELD ARCHIVE</Text>
          <Text style={[styles.heading, glove && styles.headingGlove]}>Your observations</Text>
          <Text style={[styles.sub, glove && styles.subGlove]}>{archivedEntries.length} exported and saved on this phone</Text>
        </View>
        <Pressable onPress={onExport} style={({ pressed }) => [styles.exportButton, glove && styles.exportButtonGlove, pressed && styles.pressed]}>
          <Text style={[styles.exportIcon, glove && styles.exportIconGlove]}>⇧</Text>
          <Text style={[styles.exportText, glove && styles.exportTextGlove]}>Export</Text>
        </Pressable>
      </View>

      <View style={[styles.searchWrap, glove && styles.searchWrapGlove]}>
        <Text style={[styles.searchIcon, glove && styles.searchIconGlove]}>⌕</Text>
        <TextInput
          style={[styles.search, glove && styles.searchGlove]}
          placeholder="Search title, notes, or location"
          placeholderTextColor={COLORS.muted}
          value={search}
          onChangeText={onSearch}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        <Chip label={`All ${archivedEntries.length}`} glove={glove} selected={filter === 'all'} onPress={() => onFilter('all')} />
        {NOTEBOOKS.map((notebook) => (
          <Chip
            key={notebook.key}
            label={`${notebook.icon} ${notebook.title.replace(' Notebook', '').replace('Daily Field ', '')} ${archivedEntries.filter((entry) => entry.notebookKey === notebook.key).length}`}
            glove={glove}
            selected={filter === notebook.key}
            onPress={() => onFilter(notebook.key)}
          />
        ))}
      </ScrollView>

      {groups.length === 0 ? (
        <GlossyCard style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, glove && styles.emptyTitleGlove]}>No observations found</Text>
          <Text style={[styles.emptyText, glove && styles.emptyTextGlove]}>
            {archivedEntries.length === 0
              ? 'Export notes from History, then confirm Move to Archive after saving or sending the ZIP.'
              : 'Nothing matches this search or notebook filter.'}
          </Text>
        </GlossyCard>
      ) : (
        groups.map((group) => (
          <View key={group.key} style={styles.group}>
            <View style={styles.groupHeader}>
              <Text style={[styles.groupTitle, glove && styles.groupTitleGlove]}>{group.label}</Text>
              <Text style={styles.groupCount}>{group.entries.length} {group.entries.length === 1 ? 'note' : 'notes'}</Text>
            </View>
            <View style={styles.groupCard}>
              <View style={styles.groupGloss} />
              {group.entries.map((entry, index) => (
                <React.Fragment key={entry.id}>
                  <ArchiveEntry
                    entry={entry}
                    glove={glove}
                    onOpen={() => onOpen(entry)}
                    onToggleStar={() => onToggleStar(entry)}
                  />
                  {index < group.entries.length - 1 ? <View style={styles.divider} /> : null}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))
      )}
      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  eyebrow: { color: COLORS.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  heading: { color: COLORS.text, fontSize: 28, lineHeight: 33, fontWeight: '900', letterSpacing: -0.7, marginTop: 3 },
  headingGlove: { fontSize: 32, lineHeight: 38 },
  sub: { color: COLORS.muted, fontSize: 12, marginTop: 5 },
  subGlove: { fontSize: 15 },
  exportButton: {
    minHeight: 43,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  exportButtonGlove: { minHeight: 58, paddingHorizontal: 16 },
  exportIcon: { color: COLORS.teal, fontSize: 19, lineHeight: 18, fontWeight: '900' },
  exportIconGlove: { fontSize: 24 },
  exportText: { color: COLORS.text, fontSize: 10, fontWeight: '800', marginTop: 2 },
  exportTextGlove: { fontSize: 13 },
  searchWrap: {
    height: 48,
    marginTop: 18,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchWrapGlove: { height: 62, borderRadius: 18 },
  searchIcon: { color: COLORS.muted, fontSize: 23, marginRight: 8 },
  searchIconGlove: { fontSize: 27 },
  search: { flex: 1, color: COLORS.text, fontSize: 15, paddingVertical: 0 },
  searchGlove: { fontSize: 18 },
  filters: { paddingTop: 12, paddingRight: 8 },
  group: { marginTop: 18 },
  groupHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 },
  groupTitle: { color: COLORS.text, fontSize: 15, fontWeight: '900' },
  groupTitleGlove: { fontSize: 18 },
  groupCount: { color: COLORS.muted, fontSize: 11 },
  groupCard: {
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: COLORS.cardStrong,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  groupGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  entryOuter: { paddingHorizontal: 12 },
  entryRow: { minHeight: 84, flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  entryRowGlove: { minHeight: 110, paddingVertical: 16 },
  thumbnail: { width: 54, height: 54, borderRadius: 15, backgroundColor: COLORS.bg },
  thumbnailGlove: { width: 68, height: 68, borderRadius: 19 },
  iconTile: { width: 54, height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  iconGloss: { position: 'absolute', top: 0, left: 0, right: 0, height: '48%', backgroundColor: 'rgba(255,255,255,0.14)' },
  icon: { fontSize: 25 },
  iconGlove: { fontSize: 32 },
  entryCopy: { flex: 1, paddingHorizontal: 11 },
  entryTitle: { color: COLORS.text, fontSize: 14, lineHeight: 18, fontWeight: '900' },
  entryTitleGlove: { fontSize: 18, lineHeight: 23 },
  entryMeta: { color: COLORS.muted, fontSize: 11, lineHeight: 15, marginTop: 4 },
  entryMetaGlove: { fontSize: 14, lineHeight: 19 },
  attachments: { color: COLORS.teal, fontSize: 10.5, fontWeight: '700', marginTop: 4 },
  attachmentsGlove: { fontSize: 13 },
  entryActions: { alignItems: 'center', flexDirection: 'row' },
  starButton: { minWidth: 34, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  starButtonGlove: { minWidth: 48, minHeight: 58 },
  star: { color: COLORS.muted, fontSize: 24 },
  starActive: { color: '#fde047' },
  chevron: { color: COLORS.muted, fontSize: 25 },
  divider: { height: 1, backgroundColor: COLORS.cardBorder, marginLeft: 77 },
  emptyCard: { marginTop: 18 },
  emptyTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  emptyTitleGlove: { fontSize: 20 },
  emptyText: { color: COLORS.muted, fontSize: 14, lineHeight: 20, marginTop: 6 },
  emptyTextGlove: { fontSize: 17, lineHeight: 24 },
  pressed: { opacity: 0.8 },
  bottomSpace: { height: 24 },
});
