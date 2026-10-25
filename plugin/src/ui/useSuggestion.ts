import type { Dispatch } from 'preact/hooks';
import { useRef } from 'preact/hooks';
import type { AiSettings, ScanResult } from '../shared/messages.ts';
import { BATCH_SIZE, suggestNames } from './ai/suggest.ts';
import { requestScreenshots } from './bridge.ts';
import { PROVIDERS } from './providers.ts';
import type { Action, State } from './state.ts';

const TIMEOUT_PER_BATCH_MS = 90_000;

function askingMessage(providerName: string, batchNumber: number, batchCount: number): string {
  return batchCount === 1
    ? `Asking ${providerName} for names… this can take up to a minute.`
    : `Asking ${providerName} for names… batch ${batchNumber} of ${batchCount}.`;
}

export function useSuggestion(state: State, dispatch: Dispatch<Action>) {
  const request = useRef<AbortController | null>(null);

  async function run(settings: AiSettings, scan: ScanResult) {
    const providerName = PROVIDERS[settings.provider].shortLabel;
    const batchCount = Math.ceil(scan.layers.length / BATCH_SIZE);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new DOMException('Timed out', 'TimeoutError')), TIMEOUT_PER_BATCH_MS * batchCount);
    request.current = controller;
    dispatch({
      type: 'ai-started',
      message: state.includeScreenshots ? 'Taking screenshots…' : askingMessage(providerName, 1, batchCount),
    });

    try {
      const images = state.includeScreenshots ? await requestScreenshots() : [];
      const suggestions = await suggestNames({
        settings,
        namingStyle: state.namingStyle,
        layers: scan.layers,
        images,
        signal: controller.signal,
        onBatch: (batchNumber, total) =>
          dispatch({ type: 'ai-progress', message: askingMessage(providerName, batchNumber, total), previews: images }),
      });
      if (request.current === controller) {
        dispatch({ type: 'ai-succeeded', suggestions });
      }
    } catch (error) {
      if (request.current === controller) {
        const timedOut = controller.signal.reason?.name === 'TimeoutError';
        const message = error instanceof Error ? error.message : String(error);
        dispatch({
          type: 'ai-failed',
          error: timedOut ? `${providerName} took too long to answer. Try again, or select fewer layers.` : message,
        });
      }
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) {
        request.current = null;
      }
    }
  }

  function start() {
    const { settings, view } = state;
    if (settings && view.stage === 'scanned') {
      run(settings, view.scan).catch((error: unknown) => dispatch({ type: 'ai-failed', error: String(error) }));
    }
  }

  function cancel() {
    request.current?.abort();
    request.current = null;
    dispatch({ type: 'cancelled' });
  }

  return { start, cancel };
}
