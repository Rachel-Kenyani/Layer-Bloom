import type { MainToUi, UiToMain } from '../shared/messages.ts';

let screenshotRequestCounter = 0;

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

export function requestScreenshots(signal: AbortSignal): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      return;
    }

    const requestId = `${Date.now()}-${++screenshotRequestCounter}`;
    let stop = () => {};
    const cleanup = () => {
      stop();
      signal.removeEventListener('abort', abort);
    };
    const abort = () => {
      cleanup();
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    };
    stop = onMessage((message) => {
      if (message.type === 'screenshots' && message.requestId === requestId) {
        cleanup();
        resolve(message.images);
      } else if (message.type === 'screenshots-error' && message.requestId === requestId) {
        cleanup();
        reject(new Error(message.message));
      }
    });
    signal.addEventListener('abort', abort, { once: true });
    try {
      send({ type: 'export-screenshots', requestId });
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}
