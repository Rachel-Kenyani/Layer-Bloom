export type Provider = 'openai' | 'anthropic' | 'gemini' | 'openrouter';

export type AiSettings = { provider: Provider; apiKey: string };

export type Theme = 'light' | 'dark';

export type NamingStyle = 'title' | 'slash' | 'kebab';

export type Preferences = { theme: Theme | null; namingStyle: NamingStyle };

export type LayerInfo = {
  id: string;
  type: string;
  name: string;
  depth: number;
  parentId?: string;
  width?: number;
  height?: number;
  text?: string;
  childCount?: number;
  layout?: string;
  componentName?: string;
};

export type ScanResult = { layers: LayerInfo[]; skippedCount: number; limitReached: boolean };

export type ApprovedRename = { id: string; newName: string };

export type UiToMain =
  | { type: 'ready' }
  | { type: 'save-settings'; settings: AiSettings }
  | { type: 'forget-settings' }
  | { type: 'save-preferences'; preferences: Partial<Preferences> }
  | { type: 'scan-selection' }
  | { type: 'export-screenshots'; requestId: string }
  | { type: 'focus-layer'; id: string }
  | { type: 'resize'; width: number; height: number }
  | { type: 'apply-renames'; renames: ApprovedRename[] };

export type MainToUi =
  | { type: 'init'; settings: AiSettings | null; preferences: Preferences; selectionCount: number }
  | { type: 'saved-settings'; settings: AiSettings | null }
  | { type: 'selection'; count: number }
  | ({ type: 'scan-result' } & ScanResult)
  | { type: 'screenshots'; requestId: string; images: string[] }
  | { type: 'screenshots-error'; requestId: string; message: string }
  | { type: 'renames-applied'; renamedCount: number; missedCount: number }
  | { type: 'error'; during: UiToMain['type']; message: string };
