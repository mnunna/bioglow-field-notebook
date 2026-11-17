import assert from 'node:assert/strict';
import test from 'node:test';
import {
  managedMediaFileName,
  managedMediaReference,
  normalizeManagedMediaUri,
} from '../src/mediaReference';

test('normalizes an old iOS container URI to a stable media reference', () => {
  const oldUri =
    'file:///var/mobile/Containers/Data/Application/OLD-UUID/Documents/bioglow-media/entry-photo-abc123.jpg';

  assert.equal(
    normalizeManagedMediaUri(oldUri),
    'bioglow-media://entry-photo-abc123.jpg',
  );
  assert.equal(managedMediaFileName(oldUri), 'entry-photo-abc123.jpg');
});

test('stable media references do not contain an installation-specific path', () => {
  const reference = managedMediaReference('entry-voice-abc123.m4a');

  assert.equal(reference, 'bioglow-media://entry-voice-abc123.m4a');
  assert.equal(normalizeManagedMediaUri(reference), reference);
  assert.doesNotMatch(reference, /Containers|Documents|file:\/\//);
});

test('rejects path traversal in managed media references', () => {
  assert.equal(managedMediaFileName('bioglow-media://../private.jpg'), null);
  assert.throws(() => managedMediaReference('../private.jpg'));
});
