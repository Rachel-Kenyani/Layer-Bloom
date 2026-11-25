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

test('does not expose raw provider error details', async (context) => {
  context.mock.method(
    globalThis,
    'fetch',
    async () => new Response(JSON.stringify({ error: { message: 'Incorrect API key: private detail' } }), { status: 401 }),
  );
  await assert.rejects(
    postJson('https://api.openai.com/v1/chat/completions', {}, {}, new AbortController().signal),
    (error: unknown) => error instanceof Error && /rejected.*401/.test(error.message) && !error.message.includes('private detail'),
  );
});

test('blocks requests to hosts outside the provider allowlist', async (context) => {
  let fetchCalled = false;
  context.mock.method(globalThis, 'fetch', async () => {
    fetchCalled = true;
    return new Response('{}');
  });
  await assert.rejects(
    postJson('https://api.openai.com.attacker.test/v1/chat/completions', {}, {}, new AbortController().signal),
    /approved AI provider host/,
  );
  assert.equal(fetchCalled, false);
});

test('rejects custom ports on provider hosts', async (context) => {
  let fetchCalled = false;
  context.mock.method(globalThis, 'fetch', async () => {
    fetchCalled = true;
    return new Response('{}');
  });
  await assert.rejects(
    postJson('https://api.openai.com:8443/v1/chat/completions', {}, {}, new AbortController().signal),
    /approved AI provider host/,
  );
  assert.equal(fetchCalled, false);
});

test('prevents redirects from provider endpoints', async (context) => {
  let redirect: RequestRedirect | undefined;
  context.mock.method(globalThis, 'fetch', async (_input: RequestInfo | URL, init?: RequestInit) => {
    redirect = init?.redirect;
    return new Response('{}');
  });
  await postJson('https://api.openai.com/v1/chat/completions', {}, {}, new AbortController().signal);
  assert.equal(redirect, 'error');
});

test('explains network failures', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('Failed to fetch');
  });
  await assert.rejects(postJson('https://api.openai.com/v1/chat/completions', {}, {}, new AbortController().signal), /internet connection/);
});

test('passes cancellation through unchanged', async (context) => {
  const controller = new AbortController();
  controller.abort();
  context.mock.method(globalThis, 'fetch', async () => {
    throw new DOMException('Aborted', 'AbortError');
  });
  await assert.rejects(postJson('https://api.openai.com/v1/chat/completions', {}, {}, controller.signal), { name: 'AbortError' });
});
