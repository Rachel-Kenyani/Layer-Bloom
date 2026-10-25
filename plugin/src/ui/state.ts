import type { AiSettings, LayerInfo, MainToUi, NamingStyle, Preferences, ScanResult, Theme } from '../shared/messages.ts';
import type { RenameSuggestion } from './ai/parse.ts';

export type ReviewItem = RenameSuggestion & {
  oldName: string;
  type: string;
  parentId?: string;
  checked: boolean;
};

/** One object per stage, so impossible combinations (e.g. "applying" with no suggestions) can't exist. */
export type View =
  | { stage: 'loading' }
  | { stage: 'setup' }
  | { stage: 'ready'; message: string | null }
  | { stage: 'scanned'; scan: ScanResult; error: string | null }
  | { stage: 'working'; scan: ScanResult; message: string; previews: string[] }
  | { stage: 'review'; scan: ScanResult; items: ReviewItem[]; applying: boolean; error: string | null }
  | { stage: 'nothing'; scan: ScanResult }
  | { stage: 'done'; renamedCount: number; missedCount: number };

export type State = {
  view: View;
  settings: AiSettings | null;
  theme: Theme;
  namingStyle: NamingStyle;
  selectionCount: number;
  selectionChanged: boolean;
  includeScreenshots: boolean;
};

export type Action =
  | { type: 'message'; message: MainToUi; figmaTheme: Theme }
  | { type: 'ai-started'; message: string }
  | { type: 'ai-progress'; message: string; previews?: string[] }
  | { type: 'ai-succeeded'; suggestions: RenameSuggestion[] }
  | { type: 'ai-failed'; error: string }
  | { type: 'cancelled' }
  | { type: 'items-changed'; change: (items: ReviewItem[]) => ReviewItem[] }
  | { type: 'apply-started' }
  | { type: 'start-over' }
  | { type: 'theme-changed'; theme: Theme }
  | { type: 'naming-style-changed'; namingStyle: NamingStyle }
  | { type: 'screenshots-toggled'; include: boolean };

export function initialState(figmaTheme: Theme): State {
  return {
    view: { stage: 'loading' },
    settings: null,
    theme: figmaTheme,
    namingStyle: 'title',
    selectionCount: 0,
    selectionChanged: false,
    includeScreenshots: false,
  };
}

const SCAN_STAGES = new Set<View['stage']>(['scanned', 'working', 'review', 'nothing']);

export function isIdle(view: View): boolean {
  return view.stage === 'ready' || view.stage === 'scanned' || view.stage === 'nothing' || view.stage === 'done';
}

export function hasScanResults(view: View): boolean {
  return SCAN_STAGES.has(view.stage);
}

function emptyScanMessage(skippedCount: number): string {
  return skippedCount > 0
    ? 'Everything selected is locked or hidden, so there is nothing to rename. Unlock or show layers first.'
    : 'Nothing to scan. Select one or more frames or groups.';
}

function toReviewItems(suggestions: RenameSuggestion[], layers: LayerInfo[]): ReviewItem[] {
  const layersById = new Map(layers.map((layer) => [layer.id, layer]));
  return suggestions.map((suggestion) => {
    const layer = layersById.get(suggestion.id);
    return { ...suggestion, oldName: layer?.name ?? '', type: layer?.type ?? '', parentId: layer?.parentId, checked: true };
  });
}

function applyPreferences(state: State, preferences: Preferences, figmaTheme: Theme): State {
  return { ...state, theme: preferences.theme ?? figmaTheme, namingStyle: preferences.namingStyle };
}

function onMainError(state: State, during: string, message: string): State {
  const { view } = state;
  if (during === 'apply-renames' && view.stage === 'review') {
    return { ...state, view: { ...view, applying: false, error: `Renaming failed: ${message}` } };
  }
  if (during === 'scan-selection') {
    return { ...state, view: { stage: 'ready', message: `Scanning failed: ${message}` } };
  }
  if (during === 'export-screenshots' && view.stage === 'working') {
    return { ...state, view: { stage: 'scanned', scan: view.scan, error: `Screenshots failed: ${message}` } };
  }
  return state;
}

function onMessage(state: State, message: MainToUi, figmaTheme: Theme): State {
  switch (message.type) {
    case 'init':
      return {
        ...applyPreferences(state, message.preferences, figmaTheme),
        settings: message.settings,
        selectionCount: message.selectionCount,
        view: message.settings ? { stage: 'ready', message: null } : { stage: 'setup' },
      };
    case 'saved-settings':
      return { ...state, settings: message.settings, view: message.settings ? { stage: 'ready', message: null } : { stage: 'setup' } };
    case 'selection':
      return {
        ...state,
        selectionCount: message.count,
        selectionChanged: hasScanResults(state.view),
        view: state.view.stage === 'ready' ? { stage: 'ready', message: null } : state.view,
      };
    case 'scan-result':
      if (message.layers.length === 0) {
        return { ...state, selectionChanged: false, view: { stage: 'ready', message: emptyScanMessage(message.skippedCount) } };
      }
      return { ...state, selectionChanged: false, view: { stage: 'scanned', scan: message, error: null } };
    case 'renames-applied':
      return { ...state, view: { stage: 'done', renamedCount: message.renamedCount, missedCount: message.missedCount } };
    case 'error':
      return onMainError(state, message.during, message.message);
    case 'screenshots':
      return state;
  }
}

/** Actions that move between the scanned → working → review/nothing stages. */
function onAiAction(state: State, action: Extract<Action, { type: `ai-${string}` | 'cancelled' }>): State {
  const { view } = state;
  if (action.type === 'ai-started') {
    return view.stage === 'scanned'
      ? { ...state, view: { stage: 'working', scan: view.scan, message: action.message, previews: [] } }
      : state;
  }
  if (view.stage !== 'working') {
    return state;
  }
  switch (action.type) {
    case 'ai-progress':
      return { ...state, view: { ...view, message: action.message, previews: action.previews ?? view.previews } };
    case 'ai-succeeded':
      return action.suggestions.length === 0
        ? { ...state, view: { stage: 'nothing', scan: view.scan } }
        : {
            ...state,
            view: {
              stage: 'review',
              scan: view.scan,
              items: toReviewItems(action.suggestions, view.scan.layers),
              applying: false,
              error: null,
            },
          };
    case 'ai-failed':
      return { ...state, view: { stage: 'scanned', scan: view.scan, error: action.error } };
    case 'cancelled':
      return { ...state, view: { stage: 'scanned', scan: view.scan, error: null } };
  }
}

export function reducer(state: State, action: Action): State {
  const { view } = state;
  switch (action.type) {
    case 'message':
      return onMessage(state, action.message, action.figmaTheme);
    case 'ai-started':
    case 'ai-progress':
    case 'ai-succeeded':
    case 'ai-failed':
    case 'cancelled':
      return onAiAction(state, action);
    case 'items-changed':
      return view.stage === 'review' ? { ...state, view: { ...view, items: action.change(view.items) } } : state;
    case 'apply-started':
      return view.stage === 'review' ? { ...state, view: { ...view, applying: true, error: null } } : state;
    case 'start-over':
      return { ...state, selectionChanged: false, view: { stage: 'ready', message: null } };
    case 'theme-changed':
      return { ...state, theme: action.theme };
    case 'naming-style-changed':
      return { ...state, namingStyle: action.namingStyle };
    case 'screenshots-toggled':
      return { ...state, includeScreenshots: action.include };
  }
}
