import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { MainToUi, ScanResult } from '../src/shared/messages.ts';
import { initialState, reducer, type State } from '../src/ui/state.ts';

const scan: ScanResult = {
  layers: [
    { id: '1', type: 'FRAME', name: 'Frame 1', depth: 0 },
    { id: '2', type: 'VECTOR', name: 'Vector', depth: 1, parentId: '1' },
  ],
  skippedCount: 0,
  limitReached: false,
};

const settings = { provider: 'openai' as const, apiKey: 'sk-test-0000000000000000' };

function message(state: State, payload: MainToUi): State {
  return reducer(state, { type: 'message', message: payload, figmaTheme: 'light' });
}

function scannedState(): State {
  let state = message(initialState('light'), {
    type: 'init',
    settings,
    preferences: { theme: null, namingStyle: 'title' },
    selectionCount: 1,
  });
  state = message(state, { type: 'scan-result', ...scan });
  return state;
}

test('init without a key goes to setup, with a key goes to ready', () => {
  const withoutKey = message(initialState('light'), {
    type: 'init',
    settings: null,
    preferences: { theme: null, namingStyle: 'title' },
    selectionCount: 0,
  });
  assert.equal(withoutKey.view.stage, 'setup');
  assert.equal(scannedState().view.stage, 'scanned');
});

test('init uses the saved theme and naming style, falling back to Figma theme', () => {
  const saved = message(initialState('light'), {
    type: 'init',
    settings,
    preferences: { theme: 'dark', namingStyle: 'kebab' },
    selectionCount: 0,
  });
  assert.equal(saved.theme, 'dark');
  assert.equal(saved.namingStyle, 'kebab');
  const fallback = reducer(initialState('light'), {
    type: 'message',
    message: { type: 'init', settings, preferences: { theme: null, namingStyle: 'title' }, selectionCount: 0 },
    figmaTheme: 'dark',
  });
  assert.equal(fallback.theme, 'dark');
});

test('an empty scan explains why and stays on ready', () => {
  const state = message(scannedState(), { type: 'scan-result', layers: [], skippedCount: 3, limitReached: false });
  assert.equal(state.view.stage, 'ready');
  assert.match(state.view.stage === 'ready' ? (state.view.message ?? '') : '', /locked or hidden/);
});

test('a full AI round trip reaches review with type and parent kept', () => {
  let state = reducer(scannedState(), { type: 'ai-started', message: 'Asking…' });
  assert.equal(state.view.stage, 'working');
  state = reducer(state, { type: 'ai-succeeded', suggestions: [{ id: '2', newName: 'Location Icon', reason: 'pin' }] });
  assert.equal(state.view.stage, 'review');
  if (state.view.stage === 'review') {
    assert.deepEqual(state.view.items[0], {
      id: '2',
      newName: 'Location Icon',
      reason: 'pin',
      oldName: 'Vector',
      type: 'VECTOR',
      parentId: '1',
      checked: true,
    });
  }
});

test('no suggestions shows the nothing-to-rename stage', () => {
  const state = reducer(reducer(scannedState(), { type: 'ai-started', message: '' }), { type: 'ai-succeeded', suggestions: [] });
  assert.equal(state.view.stage, 'nothing');
});

test('AI failure and cancel return to scanned', () => {
  const working = reducer(scannedState(), { type: 'ai-started', message: '' });
  const failed = reducer(working, { type: 'ai-failed', error: 'Key rejected' });
  assert.equal(failed.view.stage, 'scanned');
  assert.equal(failed.view.stage === 'scanned' && failed.view.error, 'Key rejected');
  assert.equal(reducer(working, { type: 'cancelled' }).view.stage, 'scanned');
});

test('late AI results after cancelling are ignored', () => {
  const cancelled = reducer(reducer(scannedState(), { type: 'ai-started', message: '' }), { type: 'cancelled' });
  const late = reducer(cancelled, { type: 'ai-succeeded', suggestions: [{ id: '1', newName: 'Card', reason: '' }] });
  assert.equal(late.view.stage, 'scanned');
});

test('a failed rename un-sticks the review screen and shows the error', () => {
  let state = reducer(scannedState(), { type: 'ai-started', message: '' });
  state = reducer(state, { type: 'ai-succeeded', suggestions: [{ id: '1', newName: 'Card', reason: '' }] });
  state = reducer(state, { type: 'apply-started' });
  state = message(state, { type: 'error', during: 'apply-renames', message: 'Node is read-only' });
  assert.equal(state.view.stage, 'review');
  if (state.view.stage === 'review') {
    assert.equal(state.view.applying, false);
    assert.match(state.view.error ?? '', /Renaming failed: Node is read-only/);
  }
});

test('a failed scan returns to ready with the reason', () => {
  const state = message(scannedState(), { type: 'error', during: 'scan-selection', message: 'boom' });
  assert.equal(state.view.stage, 'ready');
});

test('selection changes are flagged during work and review, not when ready', () => {
  const working = reducer(scannedState(), { type: 'ai-started', message: '' });
  assert.equal(message(working, { type: 'selection', count: 2 }).selectionChanged, true);
  const ready = reducer(working, { type: 'start-over' });
  assert.equal(message(ready, { type: 'selection', count: 2 }).selectionChanged, false);
});

test('item changes build on the latest list', () => {
  let state = reducer(scannedState(), { type: 'ai-started', message: '' });
  state = reducer(state, {
    type: 'ai-succeeded',
    suggestions: [
      { id: '1', newName: 'Card', reason: '' },
      { id: '2', newName: 'Icon', reason: '' },
    ],
  });
  state = reducer(state, {
    type: 'items-changed',
    change: (items) => items.map((item) => (item.id === '1' ? { ...item, checked: false } : item)),
  });
  state = reducer(state, {
    type: 'items-changed',
    change: (items) => items.map((item) => (item.id === '2' ? { ...item, newName: '' } : item)),
  });
  if (state.view.stage === 'review') {
    assert.deepEqual(
      state.view.items.map((item) => [item.checked, item.newName]),
      [
        [false, 'Card'],
        [true, ''],
      ],
    );
  }
});
