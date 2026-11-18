import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  dependencies: Record<string, string>;
  scripts: Record<string, string>;
};
const appJson = JSON.parse(readFileSync('app.json', 'utf8')) as {
  expo: { plugins: Array<string | [string, unknown]> };
};

test('iOS camera runtime stays on the iOS 27-compatible system picker release', () => {
  assert.match(packageJson.dependencies.expo, /58\./);
  assert.match(packageJson.dependencies['expo-image-picker'], /58\./);
  assert.equal(packageJson.dependencies['react-native'], '0.88.1');
  assert.ok(
    appJson.expo.plugins.some((plugin) =>
      Array.isArray(plugin)
        ? plugin[0] === 'expo-image-picker'
        : plugin === 'expo-image-picker',
    ),
  );
  assert.ok(!('expo-camera' in packageJson.dependencies));
});

test('normal iPhone installs are standalone builds without Metro development UI', () => {
  assert.match(packageJson.scripts['ios:device'], /--configuration Release/);
  assert.match(packageJson.scripts['ios:device'], /--no-bundler/);
  assert.ok(!packageJson.scripts['ios:device'].includes('Debug'));
});

test('Expo owns the iOS scene lifecycle on SDK 58', () => {
  assert.ok(
    !appJson.expo.plugins.some((plugin) => {
      const name = Array.isArray(plugin) ? plugin[0] : plugin;
      return name.includes('scene-lifecycle');
    }),
  );
});
