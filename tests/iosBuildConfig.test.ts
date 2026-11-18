import assert from 'node:assert/strict';
import test from 'node:test';

const { configureBundleCommand, configureBundlePhaseScript } = require('../plugins/with-ios-deployment-target') as {
  configureBundleCommand: (shellScript: string) => string;
  configureBundlePhaseScript: (shellScript: string) => string;
};

const expoDebugBlock =
  'if [[ \\"$CONFIGURATION\\" = *Debug* ]]; then\\n  export SKIP_BUNDLING=1\\nfi';

test('physical iOS Debug builds embed a bundle for offline startup', () => {
  const configured = configureBundlePhaseScript(`before\\n${expoDebugBlock}\\nafter`);

  assert.match(configured, /Eco Note: embed an offline bundle/);
  assert.match(configured, /\\"\$PLATFORM_NAME\\" == \*simulator\*/);
  assert.match(configured, /else\\n  unset SKIP_BUNDLING/);
  assert.match(configured, /EXTRA_PACKAGER_ARGS=.*--dev false/);
  assert.ok(!configured.includes(expoDebugBlock));
  assert.equal(configureBundlePhaseScript(configured), configured);
});

test('native generation fails if Expo changes the protected bundle phase', () => {
  assert.throws(
    () => configureBundlePhaseScript('an unexpected build phase'),
    /offline JavaScript bundle/,
  );
});

test('native generation upgrades the original offline bundle guard', () => {
  const originalGuard = [
    '# Eco Note: embed an offline bundle for physical-device Debug builds',
    'if [[ \\"$CONFIGURATION\\" = *Debug* && \\"$PLATFORM_NAME\\" == *simulator* ]]; then\\n  export SKIP_BUNDLING=1\\nelse\\n  unset SKIP_BUNDLING\\nfi',
  ].join('\n');

  const configured = configureBundlePhaseScript(originalGuard);

  assert.match(configured, /EXTRA_PACKAGER_ARGS=.*--dev false/);
  assert.ok(!configured.endsWith('unset SKIP_BUNDLING\\nfi'));
});

test('iOS bundle wrapper remains executable when the repository path has spaces', () => {
  const expoCommand =
    '\\"`\\"$NODE_BINARY\\" --print \\"require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'\\"`\\"';

  const configured = configureBundleCommand(`before\\n${expoCommand}\\nafter`);

  assert.match(configured, /bash \.\.\/scripts\/run-react-native-xcode\.sh/);
  assert.ok(!configured.includes('\\"bash ../scripts/run-react-native-xcode.sh\\"'));
  assert.ok(!configured.includes('$PROJECT_ROOT/scripts/run-react-native-xcode.sh'));
  assert.equal(configureBundleCommand(configured), configured);
});

test('native generation fails if Expo changes the protected bundle command', () => {
  assert.throws(
    () => configureBundleCommand('an unexpected build phase'),
    /path-safe iOS JavaScript bundle command/,
  );
});
