import assert from 'node:assert/strict';
import { test } from 'node:test';
import { keyProblem } from '../src/ui/providers.ts';

test('accepts well-formed keys for every provider', () => {
  assert.equal(keyProblem('openai', 'sk-proj-abcdefghijklmnopqrstuvwxyz'), null);
  assert.equal(keyProblem('anthropic', 'sk-ant-api03-abcdefghijklmnopqrstuvwxyz'), null);
  assert.equal(keyProblem('openrouter', 'sk-or-v1-abcdefghijklmnopqrstuvwxyz'), null);
});

test('accepts Gemini keys in any format', () => {
  assert.equal(keyProblem('gemini', 'AIzaSyAbcdefghijklmnopqrstuvwxyz012345'), null);
  assert.equal(keyProblem('gemini', 'AQ.Ab8RN6abcdefghijklmnopqrstuvwxyz'), null);
});

test('rejects keys with the wrong start', () => {
  assert.match(keyProblem('anthropic', 'sk-proj-abcdefghijklmnopqrstuvwxyz') ?? '', /start with "sk-ant-"/);
  assert.match(keyProblem('openrouter', 'sk-abcdefghijklmnopqrstuvwxyz') ?? '', /start with "sk-or-"/);
});

test('rejects empty, short and spaced keys', () => {
  assert.match(keyProblem('openai', '') ?? '', /Paste your API key/);
  assert.match(keyProblem('gemini', 'AIza123') ?? '', /too short/);
  assert.match(keyProblem('openai', 'sk-abc defghijklmnopqrstuvwxyz') ?? '', /spaces/);
});

test('rejects unusually long keys', () => {
  assert.match(keyProblem('gemini', 'A'.repeat(513)) ?? '', /unusually long/);
});
