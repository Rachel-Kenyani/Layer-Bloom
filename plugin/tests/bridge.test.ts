import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requestScreenshots } from '../src/ui/bridge.ts';

type PluginMessage = { pluginMessage: { type: string; requestId?: string } };
type MessageListener = (event: MessageEvent) => void;

function installMessageMocks(context: { after: (callback: () => void) => void }) {
  const listeners = new Set<MessageListener>();
  const sent: PluginMessage[] = [];
  const originals = new Map<string, PropertyDescriptor | undefined>();
  const define = (key: string, value: unknown) => {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value });
  };
  define('parent', { postMessage: (message: PluginMessage) => sent.push(message) });
  define('addEventListener', (_type: string, listener: MessageListener) => listeners.add(listener));
  define('removeEventListener', (_type: string, listener: MessageListener) => listeners.delete(listener));
  context.after(() => {
    for (const [key, descriptor] of originals) {
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor);
      } else {
        Reflect.deleteProperty(globalThis, key);
      }
    }
  });
  return {
    listeners,
    sent,
    dispatch: (pluginMessage: unknown) => {
      for (const listener of listeners) {
        listener({ data: { pluginMessage } } as MessageEvent);
      }
    },
  };
}

test('only accepts screenshot responses for the request that is waiting', async (context) => {
  const bridge = installMessageMocks(context);
  const pending = requestScreenshots(new AbortController().signal);
  const request = bridge.sent[0].pluginMessage;
  assert.equal(request.type, 'export-screenshots');
  assert.ok(request.requestId);

  bridge.dispatch({ type: 'screenshots', requestId: 'stale-request', images: ['wrong-image'] });
  bridge.dispatch({ type: 'screenshots', requestId: request.requestId, images: ['matching-image'] });

  assert.deepEqual(await pending, ['matching-image']);
  assert.equal(bridge.listeners.size, 0);
});

test('aborting a screenshot request removes its listener', async (context) => {
  const bridge = installMessageMocks(context);
  const controller = new AbortController();
  const pending = requestScreenshots(controller.signal);
  controller.abort();

  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(bridge.listeners.size, 0);
});
