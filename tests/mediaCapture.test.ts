import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findBuiltInMicrophone,
  isUsableVoiceRecording,
  voiceRecordingOptions,
} from '../src/mediaCapture';

test('rejects the truncated iOS recording produced by the old recorder', () => {
  assert.equal(
    isUsableVoiceRecording({ duration: 0.021769, size: 57_362, loudestMetering: -12 }),
    false,
  );
});

test('accepts a voice recording with real duration and PCM data', () => {
  assert.equal(
    isUsableVoiceRecording({ duration: 5, size: 480_044, loudestMetering: -24 }),
    true,
  );
});

test('rejects an empty WAV container', () => {
  assert.equal(
    isUsableVoiceRecording({ duration: 1, size: 44, loudestMetering: -24 }),
    false,
  );
});

test('rejects a full-size recording whose microphone metering reports silence', () => {
  assert.equal(
    isUsableVoiceRecording({ duration: 5, size: 480_044, loudestMetering: -160 }),
    false,
  );
  assert.equal(
    isUsableVoiceRecording({ duration: 5, size: 480_044, loudestMetering: undefined }),
    false,
  );
});

test('iOS uses metered mono Linear PCM while Android keeps the high-quality preset', () => {
  const ios = voiceRecordingOptions('ios');
  const android = voiceRecordingOptions('android');

  assert.equal(ios.extension, '.wav');
  assert.equal(ios.numberOfChannels, 1);
  assert.equal(ios.ios.outputFormat, 'lpcm');
  assert.equal(ios.ios.linearPCMBitDepth, 16);
  assert.equal(ios.isMeteringEnabled, true);
  assert.equal(android.extension, '.m4a');
  assert.equal(android.numberOfChannels, 2);
  assert.equal(android.android.outputFormat, 'mpeg4');
  assert.equal(android.android.audioEncoder, 'aac');
  assert.equal(android.isMeteringEnabled, true);
});

test('selects the built-in iPhone microphone instead of a connected input', () => {
  const builtIn = { name: 'iPhone Microphone', type: 'MicrophoneBuiltIn', uid: 'builtin' };
  const inputs = [
    { name: 'AirPods', type: 'BluetoothHFP', uid: 'airpods' },
    builtIn,
  ];

  assert.equal(findBuiltInMicrophone(inputs), builtIn);
  assert.equal(findBuiltInMicrophone(inputs.slice(0, 1)), undefined);
});
