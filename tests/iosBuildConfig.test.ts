import assert from 'node:assert/strict';
import test from 'node:test';

const { configureBundlePhaseScript } = require('../plugins/with-ios-deployment-target') as {
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
