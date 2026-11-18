const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.join(__dirname, '..');

const files = [
  {
    path: path.join(
      repositoryRoot,
      'node_modules',
      'expo-audio',
      'ios',
      'AudioModule.swift',
    ),
    label: 'ExpoAudio iOS',
    patches: [
      {
        name: 'audio mode queue',
        before: `    AsyncFunction("setAudioModeAsync") { (mode: AudioMode) in
      try setAudioMode(mode: mode)
    }`,
        after: `    AsyncFunction("setAudioModeAsync") { (mode: AudioMode) in
      try setAudioMode(mode: mode)
    }.runOnQueue(sessionQueue)`,
      },
      {
        name: 'audio active queue',
        before: `    AsyncFunction("setIsAudioActiveAsync") { (isActive: Bool) in
      try setIsAudioActive(isActive)
    }`,
        after: `    AsyncFunction("setIsAudioActiveAsync") { (isActive: Bool) in
      try setIsAudioActive(isActive)
    }.runOnQueue(sessionQueue)`,
      },
      {
        name: 'recorder preparation queue',
        before: `      AsyncFunction("prepareToRecordAsync") { (recorder, options: RecordingOptions?) in
        try AudioRecordingRequester.requireUsageDescription()
        let deactivateSessionOnFailure = sessionQueue.sync {
          !sessionIsActive && audioSessionActivityKeepers.isEmpty
        }
        try recorder.prepare(
          options: options,
          sessionOptions: sessionOptions,
          deactivateSessionOnFailure: deactivateSessionOnFailure
        )
        recordSessionActive(true)
      }`,
        after: `      AsyncFunction("prepareToRecordAsync") { (recorder, options: RecordingOptions?) in
        try AudioRecordingRequester.requireUsageDescription()
        let deactivateSessionOnFailure = !sessionIsActive && audioSessionActivityKeepers.isEmpty
        try recorder.prepare(
          options: options,
          sessionOptions: sessionOptions,
          deactivateSessionOnFailure: deactivateSessionOnFailure
        )
        recordSessionActive(true)
      }.runOnQueue(sessionQueue)`,
      },
      {
        name: 'serialized audio activation',
        before: `    do {
      try sessionQueue.sync {
        try AVAudioSession.sharedInstance().setActive(isActive, options: activationOptions(isActive: isActive))
        self.sessionIsActive = isActive
        if !isActive {
          audioSessionActivityKeepers.removeAll()
        }
      }
    } catch {`,
        after: `    do {
      try AVAudioSession.sharedInstance().setActive(isActive, options: activationOptions(isActive: isActive))
      self.sessionIsActive = isActive
      if !isActive {
        audioSessionActivityKeepers.removeAll()
      }
    } catch {`,
      },
    ],
  },
  {
    path: path.join(
      repositoryRoot,
      'node_modules',
      'expo',
      'node_modules',
      'expo-modules-core',
      'ios',
      'Core',
      'Modules',
      'CoreModule.swift',
    ),
    label: 'ExpoModulesCore iOS',
    patches: [
      {
        name: 'manual core module registration',
        before: `// The core module that describes the \`global.expo\` object.
@ExpoModule
internal final class CoreModule: Module {`,
        after: `// The core module that describes the \`global.expo\` object.
// AppContext creates this module directly, so generated autolinking must skip it.
internal final class CoreModule: Module {`,
      },
    ],
  },
];

for (const file of files) {
  if (!fs.existsSync(file.path)) {
    throw new Error(`${file.label} source was not found at ${file.path}`);
  }

  let source = fs.readFileSync(file.path, 'utf8');
  let changed = false;

  for (const patch of file.patches) {
    if (source.includes(patch.after)) {
      continue;
    }
    if (!source.includes(patch.before)) {
      throw new Error(
        `Could not apply the ${file.label} ${patch.name} patch. ` +
          'The installed Expo source has changed; review the patch before installing.',
      );
    }
    source = source.replace(patch.before, patch.after);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file.path, source);
    console.log(`Patched ${file.label}.`);
  } else {
    console.log(`${file.label} patch is already applied.`);
  }
}
