import React from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { notebookByKey, templateByKey } from '../templates';
import type { FieldEntry } from '../types';
import { BigButton, COLORS, GlossyCard } from '../components/ui';
import { resolveMediaUri } from '../media';

export function EntryDetailScreen({
  entry,
  glove,
  onEdit,
  onToggleStar,
  onDelete,
}: {
  entry: FieldEntry;
  glove: boolean;
  onEdit: (e: FieldEntry) => void;
  onToggleStar: (e: FieldEntry) => void;
  onDelete: (e: FieldEntry) => void;
}) {
  const template = templateByKey(entry.templateKey);
  const notebook = notebookByKey(entry.notebookKey);
  const audioPlayer = useAudioPlayer(entry.voiceUri ? resolveMediaUri(entry.voiceUri) : null);

  async function playVoice() {
    if (!entry.voiceUri) return;
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      await audioPlayer.seekTo(0);
      audioPlayer.play();
    } catch {
      Alert.alert('Playback unavailable', 'This voice note could not be played.');
    }
  }
  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.header}>
        <LinearGradient colors={template.gradient} style={[styles.headerIcon, glove && styles.headerIconGlove]}>
          <View style={styles.headerGloss} />
          <Text style={[styles.headerIconText, glove && styles.headerIconTextGlove]}>{template.icon}</Text>
        </LinearGradient>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{template.title.toUpperCase()}</Text>
          <Text style={[styles.heading, glove && styles.headingGlove]}>{entry.title}</Text>
          <Text style={[styles.sub, glove && styles.subGlove]}>
            {notebook.title} · {new Date(entry.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>

      {entry.photoUri ? (
        <Image source={{ uri: resolveMediaUri(entry.photoUri) }} style={styles.photo} />
      ) : null}

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit this entry"
          onPress={() => onEdit(entry)}
          style={({ pressed }) => [styles.iconAction, glove && styles.iconActionGlove, pressed && styles.pressed]}
        >
          <Ionicons name="create-outline" size={glove ? 29 : 24} color={COLORS.text} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={entry.starred ? 'Remove star from this entry' : 'Star this entry'}
          onPress={() => onToggleStar(entry)}
          style={({ pressed }) => [
            styles.iconAction,
            entry.starred && styles.iconActionStarred,
            glove && styles.iconActionGlove,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name={entry.starred ? 'star' : 'star-outline'}
            size={glove ? 29 : 24}
            color={entry.starred ? '#fde047' : COLORS.text}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete this entry"
          onPress={() => onDelete(entry)}
          style={({ pressed }) => [
            styles.iconAction,
            styles.iconActionDanger,
            glove && styles.iconActionGlove,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="trash-outline" size={glove ? 29 : 24} color={COLORS.danger} />
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, glove && styles.sectionTitleGlove]}>Observation details</Text>
      <GlossyCard>
        {template.fields.map((f) => {
          const v = entry.values[f.key];
          if (!v) return null;
          return (
            <View key={f.key} style={styles.row}>
              <Text style={styles.label}>{f.label}</Text>
              <Text style={styles.value}>{v}</Text>
            </View>
          );
        })}
        {entry.locationLabel ? (
          <View style={styles.row}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{entry.locationLabel}</Text>
          </View>
        ) : null}
        {entry.latitude != null && entry.longitude != null ? (
          <View style={styles.row}>
            <Text style={styles.label}>GPS</Text>
            <Text style={styles.value}>
              {entry.latitude.toFixed(5)}, {entry.longitude.toFixed(5)}
              {entry.horizontalAccuracy != null ? ` · ±${Math.round(entry.horizontalAccuracy)} m` : ''}
            </Text>
          </View>
        ) : null}
        {entry.voiceUri ? (
          <View style={styles.row}>
            <Text style={styles.label}>Voice note</Text>
            <Text style={styles.value}>Recorded — stored on this phone ({entry.voiceUri.split('/').pop()})</Text>
          </View>
        ) : null}
        {entry.notes ? (
          <View style={styles.row}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.value}>{entry.notes}</Text>
          </View>
        ) : null}
      </GlossyCard>

      <View style={{ height: 16 }} />
      {entry.voiceUri ? (
        <>
          <BigButton title="▶️ Play voice note" glove={glove} variant="ghost" onPress={playVoice} />
          <View style={{ height: 10 }} />
        </>
      ) : null}
      <View style={{ height: 28 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  headerIconGlove: { width: 72, height: 72, borderRadius: 21 },
  headerGloss: { position: 'absolute', top: 0, left: 0, right: 0, height: '48%', backgroundColor: 'rgba(255,255,255,0.13)' },
  headerIconText: { fontSize: 29 },
  headerIconTextGlove: { fontSize: 36 },
  headerCopy: { flex: 1, marginLeft: 13 },
  eyebrow: { color: COLORS.muted, fontSize: 10.5, fontWeight: '800', letterSpacing: 1.1 },
  heading: { color: COLORS.text, fontSize: 24, lineHeight: 29, fontWeight: '900', letterSpacing: -0.5, marginTop: 2 },
  headingGlove: { fontSize: 29, lineHeight: 35 },
  sub: { color: COLORS.muted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  subGlove: { fontSize: 14, lineHeight: 20 },
  photo: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    marginTop: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  iconAction: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardStrong,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  iconActionGlove: { width: 64, height: 64, borderRadius: 20 },
  iconActionStarred: { backgroundColor: 'rgba(253,224,71,0.12)', borderColor: 'rgba(253,224,71,0.42)' },
  iconActionDanger: { backgroundColor: 'rgba(248,113,113,0.11)', borderColor: 'rgba(248,113,113,0.38)' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900', marginTop: 20, marginBottom: 10 },
  sectionTitleGlove: { fontSize: 20 },
  row: { marginBottom: 12 },
  label: { color: COLORS.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  value: { color: COLORS.text, fontSize: 16, marginTop: 3, lineHeight: 22 },
});
