import type { MainToUi, UiToMain } from '../shared/messages.ts';

export function send(message: UiToMain): void {
  globalThis.parent.postMessage({ pluginMessage: message }, '*');
}

/** Returns a function that stops listening. */
export function onMessage(handler: (message: MainToUi) => void): () => void {
  const listener = (event: MessageEvent) => {
    const message = event.data?.pluginMessage;
    if (message) {
      handler(message);
    }
  };
  globalThis.addEventListener('message', listener);
  return () => globalThis.removeEventListener('message', listener);
}

export function requestScreenshots(): Promise<string[]> {
  return new Promise((resolve) => {
    const stop = onMessage((message) => {
      if (message.type === 'screenshots') {
        stop();
        resolve(message.images);
      }
    });
    send({ type: 'export-screenshots' });
  });
}
