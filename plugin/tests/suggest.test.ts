import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { LayerInfo } from '../src/shared/messages.ts';
import { BATCH_SIZE, suggestNames, toBatches } from '../src/ui/ai/suggest.ts';
import { plural } from '../src/ui/text.ts';

const layers: LayerInfo[] = Array.from({ length: BATCH_SIZE + 5 }, (_, index) => ({
  id: String(index),
  type: 'FRAME',
  name: `Frame ${index}`,
  depth: index === 0 ? 0 : 1,
  parentId: index === 0 ? undefined : '0',
}));

const openAiReply = (renames: unknown[]) =>
  new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ renames }) } }] }), { status: 200 });

test('splits into batches of the given size', () => {
  assert.deepEqual(toBatches([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(toBatches([], 2), []);
});

test('sends batches, reports progress, merges results and only sends screenshots once', async (context) => {
  const bodies: { model: string; messages: { content: unknown }[] }[] = [];
  context.mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    bodies.push(body);
    const ids = JSON.parse(body.messages[1].content.at(-1).text).map((layer: LayerInfo) => layer.id);
    return openAiReply([{ id: ids[0], newName: `Renamed ${ids[0]}`, reason: '' }]);
  });
  const progress: string[] = [];
  const result = await suggestNames({
    settings: { provider: 'openai', apiKey: 'sk-test' },
    namingStyle: 'kebab',
    layers,
    images: ['IMG'],
    signal: new AbortController().signal,
    onBatch: (number, total) => progress.push(`${number}/${total}`),
  });

  assert.deepEqual(progress, ['1/2', '2/2']);
  assert.deepEqual(
    result.map((suggestion) => suggestion.id),
    ['0', String(BATCH_SIZE)],
  );
  assert.equal(JSON.stringify(bodies[0]).includes('IMG'), true);
  assert.equal(JSON.stringify(bodies[1]).includes('IMG'), false);
  assert.match(JSON.stringify(bodies[0]), /kebab-case/);
  assert.match(JSON.stringify(bodies[1]), /parentName\\":\\"Frame 0/);
});

test('falls back to the backup model once when the main model is gone', async (context) => {
  const models: string[] = [];
  context.mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => {
    const { model } = JSON.parse(String(init.body));
    models.push(model);
    return model === 'gpt-5.4-mini'
      ? new Response(JSON.stringify({ error: { message: 'model not found' } }), { status: 404 })
      : openAiReply([]);
  });
  await suggestNames({
    settings: { provider: 'openai', apiKey: 'sk-test' },
    namingStyle: 'title',
    layers,
    images: [],
    signal: new AbortController().signal,
    onBatch: () => {},
  });
  assert.deepEqual(models, ['gpt-5.4-mini', 'gpt-5-mini', 'gpt-5-mini']);
});

test('other errors are not retried', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 401 }));
  await assert.rejects(
    suggestNames({
      settings: { provider: 'openai', apiKey: 'sk-test' },
      namingStyle: 'title',
      layers,
      images: [],
      signal: new AbortController().signal,
      onBatch: () => {},
    }),
    /key was rejected/,
  );
});

test('pluralises words', () => {
  assert.equal(plural(1, 'layer'), '1 layer');
  assert.equal(plural(3, 'layer'), '3 layers');
  assert.equal(plural(0, 'layer'), '0 layers');
});
