import assert from 'node:assert/strict';
import { test } from 'node:test';
import { friendlyError, postJson } from '../src/ui/ai/request.ts';

test('turns status codes into plain advice', () => {
  assert.match(friendlyError(401), /key was rejected/);
  assert.match(friendlyError(403), /key was rejected/);
  assert.match(friendlyError(402), /Out of credit/);
  assert.match(friendlyError(429), /Out of credit/);
  assert.match(friendlyError(404), /model isn't available/);
  assert.match(friendlyError(413), /too big/);
  assert.match(friendlyError(503), /having problems/);
  assert.match(friendlyError(418), /returned an error/);
});

test('includes the provider detail in errors', async (context) => {
  context.mock.method(
    globalThis,
    'fetch',
    async () => new Response(JSON.stringify({ error: { message: 'Incorrect API key' } }), { status: 401 }),
  );
  await assert.rejects(postJson('https://example.test', {}, {}, new AbortController().signal), /rejected.*401: Incorrect API key/);
});

test('explains network failures', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('Failed to fetch');
  });
  await assert.rejects(postJson('https://example.test', {}, {}, new AbortController().signal), /internet connection/);
});

test('passes cancellation through unchanged', async (context) => {
  const controller = new AbortController();
  controller.abort();
  context.mock.method(globalThis, 'fetch', async () => {
    throw new DOMException('Aborted', 'AbortError');
  });
  await assert.rejects(postJson('https://example.test', {}, {}, controller.signal), { name: 'AbortError' });
});
