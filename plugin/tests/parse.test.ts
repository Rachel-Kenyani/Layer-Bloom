import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseRenames } from '../src/ui/ai/parse.ts';

const layers = [
  { id: '1:1', type: 'FRAME', name: 'Frame 58', depth: 0 },
  { id: '1:2', type: 'FRAME', name: 'Header', depth: 1 },
];

test('reads a reply wrapped in a code block and trims names', () => {
  const reply = '```json\n{"renames":[{"id":"1:1","newName":" Job Entry – PixelEdge ","reason":"job"}]}\n```';
  assert.deepEqual(parseRenames(reply, layers), [{ id: '1:1', newName: 'Job Entry – PixelEdge', reason: 'job' }]);
});

test('drops unknown IDs, empty, unchanged and over-long names', () => {
  const reply = JSON.stringify({
    renames: [
      { id: '9:9', newName: 'Invented' },
      { id: '1:2', newName: 'Header' },
      { id: '1:1', newName: '' },
      { id: '1:1', newName: 'a'.repeat(81) },
      { id: '1:1', newName: 42 },
    ],
  });
  assert.deepEqual(parseRenames(reply, layers), []);
});

test('keeps one suggestion per layer and bounds model-supplied reasons', () => {
  const reply = JSON.stringify({
    renames: [
      { id: '1:1', newName: 'Profile Header', reason: 'r'.repeat(200) },
      { id: '1:1', newName: 'Alternative Header', reason: 'duplicate' },
    ],
  });
  assert.deepEqual(parseRenames(reply, layers), [{ id: '1:1', newName: 'Profile Header', reason: 'r'.repeat(160) }]);
});

test('treats a missing renames list as no suggestions', () => {
  assert.deepEqual(parseRenames('{"other": true}', layers), []);
});

test('explains an unreadable reply', () => {
  assert.throws(() => parseRenames('Sorry, I cannot help.', layers), /couldn't be read/);
  assert.throws(() => parseRenames('null', layers), /couldn't be read/);
});

test('rejects oversized replies before parsing', () => {
  assert.throws(() => parseRenames(' '.repeat(100_001), layers), /reply was too large/);
});
