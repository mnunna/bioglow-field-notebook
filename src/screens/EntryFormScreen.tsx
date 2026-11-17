import React, { useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
} from 'expo-audio';
import { GLOW_COLOURS } from '../templates';
import type { FieldEntry, TemplateDef } from '../types';
import { BigButton, COLORS, Chip, GlossyCard } from '../components/ui';
import { FIELD_ENTRY_SCHEMA_VERSION } from '../entryModel';
import { newId } from '../storage';
import { resolveMediaUri } from '../media';

export function EntryFormScreen({
  template,
  initialEntry,
  glove,
  onSave,
  onCancel,
}: {
  template: TemplateDef;
  initialEntry?: FieldEntry;
  glove: boolean;
  onSave: (entry: FieldEntry) => Promise<void>;
  onCancel: () => void;
}) {
  const entryId = useRef(initialEntry?.id ?? newId()).current;
  const [title, setTitle] = useState(initialEntry?.title ?? '');
  const [values, setValues] = useState<Record<string, string>>(
    initialEntry?.values ?? (template.fields.some((field) => field.type === 'brightness') ? { brightness: '3' } : {}),
  );
  const [notes, setNotes] = useState(initialEntry?.notes ?? '');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    initialEntry?.latitude != null && initialEntry.longitude != null
      ? { latitude: initialEntry.latitude, longitude: initialEntry.longitude }
      : null,
  );
  const [horizontalAccuracy, setHorizontalAccuracy] = useState<number | null>(
    initialEntry?.horizontalAccuracy ?? null,
  );
  const [locationLabel, setLocationLabel] = useState(initialEntry?.locationLabel ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(initialEntry?.photoUri ?? null);
  const [voiceUri, setVoiceUri] = useState<string | null>(initialEntry?.voiceUri ?? null);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoActionPending, setPhotoActionPending] = useState(false);
  const photoActionPendingRef = useRef(false);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const audioPlayer = useAudioPlayer(voiceUri ? resolveMediaUri(voiceUri) : null);

  const setValue = (k: string, v: string) => setValues((prev) => ({ ...prev, [k]: v }));
  const labelSize = glove ? 18 : 15;
  const inputSize = glove ? 18 : 15;

  async function useLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location off', 'Permission was not given. You can still type the place name below.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      setHorizontalAccuracy(pos.coords.accuracy);
      if (!locationLabel) {
        setLocationLabel(
          `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        );
      }
    } catch {
      Alert.alert('Location unavailable', 'GPS did not respond (common under thick canopy). Type the place name instead.');
    }
  }

  async function attachPhoto(fromCamera: boolean) {
    if (photoActionPendingRef.current) return;

    photoActionPendingRef.current = true;
    setPhotoActionPending(true);
    Keyboard.dismiss();

    try {
      let perm = fromCamera
        ? await ImagePicker.getCameraPermissionsAsync()
        : await ImagePicker.getMediaLibraryPermissionsAsync();

      if (!perm.granted && perm.canAskAgain) {
        perm = fromCamera
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (!perm.granted) {
        const source = fromCamera ? 'camera' : 'photo library';
        const buttons = perm.canAskAgain
          ? undefined
          : [
              { text: 'Not now', style: 'cancel' as const },
              { text: 'Open Settings', onPress: () => void Linking.openSettings() },
            ];
        Alert.alert(
          'Photo access is off',
          perm.canAskAgain
            ? `Permission to use the ${source} was not given, so no photo was attached.`
            : `Enable ${source} access for BioGlow in Settings, then try again.`,
          buttons,
        );
        return;
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Photo unavailable', 'The camera / photo library did not open on this device.');
    } finally {
      photoActionPendingRef.current = false;
      setPhotoActionPending(false);
    }
  }

  async function toggleVoiceRecording() {
    try {
      if (recording) {
        await audioRecorder.stop();
        setRecording(false);
        setVoiceUri(audioRecorder.uri);
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        return;
      }
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Microphone off', 'Permission was not given, so the voice note was not recorded. You can type notes instead.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setRecording(true);
    } catch {
      setRecording(false);
      Alert.alert('Voice note unavailable', 'Recording did not start on this device. You can type notes instead.');
    }
  }

  async function playVoice() {
    if (!voiceUri) return;
    try {
      await audioPlayer.seekTo(0);
      audioPlayer.play();
    } catch {
      Alert.alert('Playback unavailable', 'The voice note could not be played on this device.');
    }
  }

  async function save() {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert('Add a title', 'Give this finding a short title so you can find it later.');
      return;
    }
    if (recording) {
      Alert.alert('Stop the recording first', 'Finish the voice note before saving this entry.');
      return;
    }
    const now = new Date().toISOString();
    setSaving(true);
    try {
      await onSave({
        schemaVersion: FIELD_ENTRY_SCHEMA_VERSION,
        id: entryId,
        templateKey: template.key,
        notebookKey: initialEntry?.notebookKey ?? template.defaultNotebook,
        title: trimmed,
        values,
        notes: notes.trim(),
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        horizontalAccuracy,
        locationLabel: locationLabel.trim(),
        photoUri,
        voiceUri,
        starred: initialEntry?.starred ?? false,
        createdAt: initialEntry?.createdAt ?? now,
        updatedAt: now,
      });
    } catch (error) {
      Alert.alert(
        'Not saved',
        error instanceof Error ? error.message : 'This entry could not be saved. Try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function cancel() {
    if (recording) {
      try {
        await audioRecorder.stop();
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      } catch {
        // The form is closing; there is no saved recording to recover here.
      }
      setRecording(false);
    }
    onCancel();
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>
        {template.icon} {initialEntry ? `Edit ${template.title}` : template.title}
      </Text>
      <Text style={styles.auto}>
        🕒 {new Date().toLocaleString()} · auto-filled, saved offline on this phone
      </Text>

      <Text style={[styles.label, { fontSize: labelSize }]}>Title *</Text>
      <TextInput
        style={[styles.input, { fontSize: inputSize }]}
        placeholder="Short name for this finding"
        placeholderTextColor={COLORS.muted}
        value={title}
        onChangeText={setTitle}
      />

      {template.fields.map((f) => (
        <View key={f.key}>
          <Text style={[styles.label, { fontSize: labelSize }]}>{f.label}</Text>
          {f.type === 'text' && (
            <TextInput
              style={[styles.input, { fontSize: inputSize }]}
              placeholder={f.placeholder}
              placeholderTextColor={COLORS.muted}
              value={values[f.key] ?? ''}
              onChangeText={(v) => setValue(f.key, v)}
            />
          )}
          {f.type === 'multiline' && (
            <TextInput
              style={[styles.input, styles.multiline, { fontSize: inputSize }]}
              placeholder={f.placeholder}
              placeholderTextColor={COLORS.muted}
              value={values[f.key] ?? ''}
              onChangeText={(v) => setValue(f.key, v)}
              multiline
            />
          )}
          {f.type === 'chips' && (
            <View style={styles.chipRow}>
              {(f.options ?? []).map((opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  glove={glove}
                  selected={values[f.key] === opt}
                  onPress={() => setValue(f.key, opt)}
                />
              ))}
            </View>
          )}
          {f.type === 'glowColour' && (
            <View style={styles.chipRow}>
              {GLOW_COLOURS.map((c) => {
                const selected = values[f.key] === c.name;
                return (
                  <Pressable
                    key={c.name}
                    onPress={() => setValue(f.key, c.name)}
                    style={[styles.swatchWrap, selected && styles.swatchSelected]}
                  >
                    <View style={[styles.swatch, { backgroundColor: c.hex }]} />
                    <Text style={styles.swatchLabel}>{c.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {f.type === 'brightness' && (
            <View style={styles.chipRow}>
              {['1', '2', '3', '4', '5'].map((n) => (
                <Chip
                  key={n}
                  label={`${n}${n === '1' ? ' faint' : n === '5' ? ' bright' : ''}`}
                  glove={glove}
                  selected={(values[f.key] ?? '3') === n}
                  onPress={() => setValue(f.key, n)}
                />
              ))}
            </View>
          )}
        </View>
      ))}

      <Text style={[styles.label, { fontSize: labelSize }]}>Location</Text>
      <BigButton title="📍 Use my location (GPS)" glove={glove} variant="ghost" onPress={useLocation} />
      {coords ? (
        <Text style={styles.okText}>
          GPS saved: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
          {horizontalAccuracy != null ? ` · ±${Math.round(horizontalAccuracy)} m` : ''}
        </Text>
      ) : null}
      <TextInput
        style={[styles.input, { fontSize: inputSize, marginTop: 8 }]}
        placeholder="Or type the place — e.g. trail marker 4, near stream"
        placeholderTextColor={COLORS.muted}
        value={locationLabel}
        onChangeText={setLocationLabel}
      />

      <Text style={[styles.label, { fontSize: labelSize }]}>Photo</Text>
      <View style={styles.buttonRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <BigButton
            title={photoActionPending ? 'Opening…' : '📷 Take photo'}
            glove={glove}
            variant="ghost"
            onPress={() => attachPhoto(true)}
            disabled={photoActionPending}
          />
        </View>
        <View style={{ flex: 1 }}>
          <BigButton
            title={photoActionPending ? 'Opening…' : '🖼️ Pick photo'}
            glove={glove}
            variant="ghost"
            onPress={() => attachPhoto(false)}
            disabled={photoActionPending}
          />
        </View>
      </View>
      {photoUri ? <Image source={{ uri: resolveMediaUri(photoUri) }} style={styles.photo} /> : null}
      {photoUri ? (
        <View style={{ marginTop: 8 }}>
          <BigButton title="Remove photo" glove={glove} variant="ghost" onPress={() => setPhotoUri(null)} />
        </View>
      ) : null}

      <Text style={[styles.label, { fontSize: labelSize }]}>Voice note (real recording, stored on phone)</Text>
      <BigButton
        title={recording ? '⏹️ Stop recording' : voiceUri ? '🎙️ Re-record voice note' : '🎙️ Record voice note'}
        glove={glove}
        variant="ghost"
        onPress={toggleVoiceRecording}
      />
      {voiceUri && !recording ? (
        <View style={{ marginTop: 8 }}>
          <BigButton title="▶️ Play voice note" glove={glove} variant="ghost" onPress={playVoice} />
          <View style={{ height: 8 }} />
          <BigButton title="Remove voice note" glove={glove} variant="ghost" onPress={() => setVoiceUri(null)} />
        </View>
      ) : null}

      <Text style={[styles.label, { fontSize: labelSize }]}>Extra notes</Text>
      <TextInput
        style={[styles.input, styles.multiline, { fontSize: inputSize }]}
        placeholder="Anything else worth remembering…"
        placeholderTextColor={COLORS.muted}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <GlossyCard style={{ marginTop: 20 }}>
        <BigButton
          title={saving ? 'Saving to this phone…' : initialEntry ? '💾 Save changes' : '💾 Save offline'}
          glove={glove}
          onPress={save}
          disabled={saving}
        />
        <View style={{ height: 10 }} />
        <BigButton title="Cancel" glove={glove} variant="ghost" onPress={cancel} disabled={saving} />
      </GlossyCard>
      <View style={{ height: 28 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16 },
  heading: { color: COLORS.text, fontSize: 24, fontWeight: '900' },
  auto: { color: COLORS.muted, fontSize: 13, marginTop: 6, marginBottom: 6 },
  label: { color: COLORS.text, fontWeight: '700', marginTop: 18, marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 14,
    color: COLORS.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multiline: { minHeight: 84, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  swatchWrap: {
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 8,
    padding: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: { borderColor: COLORS.lime },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  swatchLabel: { color: COLORS.text, fontSize: 12, marginTop: 4 },
  okText: { color: COLORS.lime, fontSize: 13, marginTop: 8 },
  buttonRow: { flexDirection: 'row' },
  photo: { width: '100%', height: 220, borderRadius: 16, marginTop: 12 },
});
