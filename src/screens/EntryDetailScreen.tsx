import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { notebookByKey, templateByKey } from '../templates';
import type { FieldEntry } from '../types';
import { BigButton, COLORS, GlossyCard } from '../components/ui';

export function EntryDetailScreen({
  entry,
  glove,
  onBack,
  onEdit,
  onToggleStar,
  onDelete,
}: {
  entry: FieldEntry;
  glove: boolean;
  onBack: () => void;
  onEdit: (e: FieldEntry) => void;
  onToggleStar: (e: FieldEntry) => void;
  onDelete: (e: FieldEntry) => void;
}) {
  const template = templateByKey(entry.templateKey);
  const notebook = notebookByKey(entry.notebookKey);
  const audioPlayer = useAudioPlayer(entry.voiceUri);

  async function playVoice() {
    if (!entry.voiceUri) return;
    try {
      await audioPlayer.seekTo(0);
      audioPlayer.play();
    } catch {
      Alert.alert('Playback unavailable', 'This voice note could not be played.');
    }
  }
  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.heading}>
        {template.icon} {entry.title}
      </Text>
      <Text style={styles.sub}>
        {template.title} · {notebook.title}
        {'\n'}
        {new Date(entry.createdAt).toLocaleString()}
      </Text>

      {entry.photoUri ? <Image source={{ uri: entry.photoUri }} style={styles.photo} /> : null}

      <GlossyCard style={{ marginTop: 16 }}>
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
      <BigButton title="✏️ Edit this entry" glove={glove} variant="ghost" onPress={() => onEdit(entry)} />
      <View style={{ height: 10 }} />
      <BigButton
        title={entry.starred ? '★ Starred — tap to unstar' : '☆ Star this entry'}
        glove={glove}
        variant="ghost"
        onPress={() => onToggleStar(entry)}
      />
      <View style={{ height: 10 }} />
      <BigButton title="← Back to Notebook" glove={glove} onPress={onBack} />
      <View style={{ height: 10 }} />
      <BigButton title="🗑️ Delete this entry" glove={glove} variant="danger" onPress={() => onDelete(entry)} />
      <View style={{ height: 28 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16 },
  heading: { color: COLORS.text, fontSize: 24, fontWeight: '900' },
  sub: { color: COLORS.muted, fontSize: 13, marginTop: 6, lineHeight: 19 },
  photo: { width: '100%', height: 240, borderRadius: 16, marginTop: 16 },
  row: { marginBottom: 12 },
  label: { color: COLORS.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  value: { color: COLORS.text, fontSize: 16, marginTop: 3, lineHeight: 22 },
});
