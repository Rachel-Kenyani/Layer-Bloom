import type { Provider } from '../shared/messages.ts';

type ProviderInfo = {
  label: string;
  shortLabel: string;
  model: string;
  /** Used automatically if the main model has been retired. */
  fallbackModel: string;
  keyHint: string;
  keyUrl: string;
  keyPrefix?: string;
};

/** Every model accepts images. Checked 2026-10-25; models get retired, so review this list now and then. */
export const PROVIDERS: Record<Provider, ProviderInfo> = {
  openai: {
    label: 'OpenAI',
    shortLabel: 'OpenAI',
    model: 'gpt-5.4-mini',
    fallbackModel: 'gpt-5-mini',
    keyHint: 'sk-…',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyPrefix: 'sk-',
  },
  anthropic: {
    label: 'Anthropic (Claude)',
    shortLabel: 'Claude',
    model: 'claude-haiku-5-5',
    fallbackModel: 'claude-sonnet-5-5',
    keyHint: 'sk-ant-…',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyPrefix: 'sk-ant-',
  },
  gemini: {
    label: 'Google Gemini',
    shortLabel: 'Gemini',
    model: 'gemini-3.8-flash',
    fallbackModel: 'gemini-flash-latest',
    keyHint: 'Paste your Gemini API key',
    keyUrl: 'https://aistudio.google.com/apikey',
  },
  openrouter: {
    label: 'OpenRouter',
    shortLabel: 'OpenRouter',
    model: 'anthropic/claude-haiku-5.5',
    fallbackModel: 'openrouter/auto',
    keyHint: 'sk-or-…',
    keyUrl: 'https://openrouter.ai/keys',
    keyPrefix: 'sk-or-',
  },
};

const MIN_KEY_LENGTH = 20;
const MAX_KEY_LENGTH = 512;

export function keyProblem(provider: Provider, apiKey: string): string | null {
  const { shortLabel, keyPrefix } = PROVIDERS[provider];
  if (apiKey === '') {
    return 'Paste your API key first.';
  }
  if (apiKey.length > MAX_KEY_LENGTH) {
    return 'That key is unusually long. Check that you copied only the API key.';
  }
  if (/\s/.test(apiKey)) {
    return 'The key contains spaces. Copy it again without extra characters.';
  }
  if (keyPrefix && !apiKey.startsWith(keyPrefix)) {
    return `That doesn't look like a ${shortLabel} key. It should start with "${keyPrefix}".`;
  }
  if (apiKey.length < MIN_KEY_LENGTH) {
    return `That ${shortLabel} key looks too short. Check you copied all of it.`;
  }
  return null;
}
