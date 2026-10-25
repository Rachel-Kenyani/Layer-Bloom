import type { AiSettings, Preferences } from '../shared/messages.ts';

const SETTINGS_KEY = 'ai-settings';
const PREFERENCES_KEY = 'preferences';
const DEFAULT_PREFERENCES: Preferences = { theme: null, namingStyle: 'title' };

export async function loadSettings(): Promise<AiSettings | null> {
  return (await figma.clientStorage.getAsync(SETTINGS_KEY)) ?? null;
}

export function saveSettings(settings: AiSettings): Promise<void> {
  return figma.clientStorage.setAsync(SETTINGS_KEY, settings);
}

export function forgetSettings(): Promise<void> {
  return figma.clientStorage.deleteAsync(SETTINGS_KEY);
}

export async function loadPreferences(): Promise<Preferences> {
  const saved: Partial<Preferences> | undefined = await figma.clientStorage.getAsync(PREFERENCES_KEY);
  return { ...DEFAULT_PREFERENCES, ...saved };
}

export async function savePreferences(change: Partial<Preferences>): Promise<void> {
  await figma.clientStorage.setAsync(PREFERENCES_KEY, { ...(await loadPreferences()), ...change });
}
