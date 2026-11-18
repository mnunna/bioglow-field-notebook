import type { RecordingInput, RecordingOptions } from 'expo-audio';

export const MIN_VOICE_RECORDING_SECONDS = 0.25;
export const MIN_VOICE_METERING_DBFS = -90;
const WAV_HEADER_BYTES = 44;

const HIGH_QUALITY_RECORDING: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 44_100,
  numberOfChannels: 2,
  bitRate: 128_000,
  android: {
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
  },
  ios: {
    outputFormat: 'aac ',
    audioQuality: 0x7f,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128_000,
  },
};

export function voiceRecordingOptions(platform: string): RecordingOptions {
  if (platform !== 'ios') {
    return {
      ...HIGH_QUALITY_RECORDING,
      isMeteringEnabled: true,
    };
  }

  return {
    extension: '.wav',
    sampleRate: 48_000,
    numberOfChannels: 1,
    bitRate: 768_000,
    isMeteringEnabled: true,
    android: HIGH_QUALITY_RECORDING.android,
    ios: {
      extension: '.wav',
      sampleRate: 48_000,
      outputFormat: 'lpcm',
      audioQuality: 0x7f,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: HIGH_QUALITY_RECORDING.web,
  };
}

export function findBuiltInMicrophone(inputs: RecordingInput[]): RecordingInput | undefined {
  return inputs.find((input) => {
    const type = input.type.toLowerCase().replace(/[^a-z]/g, '');
    const name = input.name.toLowerCase().replace(/[^a-z]/g, '');
    return (
      (type.includes('builtin') && (type.includes('mic') || type.includes('microphone'))) ||
      name.includes('builtinmicrophone')
    );
  });
}

export function isUsableVoiceRecording({
  duration,
  size,
  loudestMetering,
}: {
  duration: number;
  size: number;
  loudestMetering: number | null | undefined;
}): boolean {
  return (
    duration >= MIN_VOICE_RECORDING_SECONDS &&
    size > WAV_HEADER_BYTES &&
    loudestMetering != null &&
    loudestMetering > MIN_VOICE_METERING_DBFS
  );
}
