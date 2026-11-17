import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, type CameraType } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from './ui';

export function CameraCaptureModal({
  visible,
  glove,
  onCapture,
  onClose,
}: {
  visible: boolean;
  glove: boolean;
  onCapture: (uri: string) => void;
  onClose: () => void;
}) {
  const cameraRef = useRef<CameraView | null>(null);
  const insets = useSafeAreaInsets();
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturing, setCapturing] = useState(false);

  async function takePicture() {
    if (capturing || !cameraRef.current) return;

    setCapturing(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      onCapture(picture.uri);
    } catch {
      Alert.alert(
        'Photo not taken',
        'The camera was not ready. Keep Eco Note open and try the shutter again.',
      );
    } finally {
      setCapturing(false);
    }
  }

  function handleMountError() {
    Alert.alert(
      'Camera unavailable',
      'Eco Note could not start the camera preview. Close other apps using the camera, then try again.',
      [{ text: 'Close', onPress: onClose }],
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {visible ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            active
            animateShutter
            facing={facing}
            mode="picture"
            onMountError={handleMountError}
          />
        ) : null}

        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close camera"
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [
              styles.roundButton,
              glove && styles.roundButtonGlove,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.closeText, glove && styles.controlTextGlove]}>×</Text>
          </Pressable>
          <View style={styles.titlePill}>
            <Text style={[styles.title, glove && styles.titleGlove]}>Take field photo</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Switch camera"
            hitSlop={8}
            onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
            style={({ pressed }) => [
              styles.roundButton,
              glove && styles.roundButtonGlove,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.flipText, glove && styles.controlTextGlove]}>↻</Text>
          </Pressable>
        </View>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            disabled={capturing}
            onPress={takePicture}
            style={({ pressed }) => [
              styles.shutterOuter,
              glove && styles.shutterOuterGlove,
              pressed && styles.pressed,
              capturing && styles.disabled,
            ]}
          >
            <View style={[styles.shutterInner, glove && styles.shutterInnerGlove]}>
              {capturing ? <ActivityIndicator color="#102109" size="large" /> : null}
            </View>
          </Pressable>
          <Text style={[styles.hint, glove && styles.hintGlove]}>Photo stays on this phone</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  roundButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(3,19,13,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  roundButtonGlove: { width: 64, height: 64, borderRadius: 32 },
  closeText: { color: COLORS.text, fontSize: 38, lineHeight: 40, fontWeight: '300' },
  flipText: { color: COLORS.text, fontSize: 31, lineHeight: 34, fontWeight: '700' },
  controlTextGlove: { fontSize: 42, lineHeight: 44 },
  titlePill: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(3,19,13,0.82)',
  },
  title: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  titleGlove: { fontSize: 19 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 18,
    backgroundColor: 'rgba(0,0,0,0.46)',
  },
  shutterOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  shutterOuterGlove: { width: 96, height: 96, borderRadius: 48 },
  shutterInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lime,
  },
  shutterInnerGlove: { width: 78, height: 78, borderRadius: 39 },
  hint: { color: COLORS.text, fontSize: 13, marginTop: 10, fontWeight: '600' },
  hintGlove: { fontSize: 16, marginTop: 12 },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.55 },
});
