import type { MainToUi, UiToMain } from '../shared/messages.ts';
import { focusLayer, isOwnSelectionChange } from './focus.ts';
import { applyRenames } from './rename.ts';
import { resizeWindow } from './resize.ts';
import { scanSelection } from './scan.ts';
import { exportScreenshots } from './screenshots.ts';
import { forgetSettings, loadPreferences, loadSettings, savePreferences, saveSettings } from './storage.ts';

type ActiveScan = {
  pageId: string;
  selection: readonly SceneNode[];
  layerIds: ReadonlySet<string>;
};

let activeScan: ActiveScan | null = null;
let scanGeneration = 0;

figma.showUI(__html__, { width: 380, height: 600, themeColors: true });

function post(message: MainToUi): void {
  figma.ui.postMessage(message);
}

function onSelectionChange(): void {
  if (activeScan && activeScan.pageId !== figma.currentPage.id) {
    activeScan = null;
  }
  const selection = figma.currentPage.selection;
  if (!isOwnSelectionChange(selection)) {
    post({ type: 'selection', count: selection.length });
  }
}

async function scanCurrentSelection(): Promise<Awaited<ReturnType<typeof scanSelection>> | null> {
  activeScan = null;
  const generation = ++scanGeneration;
  const page = figma.currentPage;
  const selection = [...page.selection];
  const result = await scanSelection(selection);
  if (generation !== scanGeneration) {
    return null;
  }
  const currentSelection = [...figma.currentPage.selection];
  const selectionIsCurrent =
    page.id === figma.currentPage.id &&
    selection.length === currentSelection.length &&
    selection.every((node, index) => node.id === currentSelection[index].id);
  if (!selectionIsCurrent) {
    throw new Error('Your selection changed while scanning. Scan it again.');
  }
  activeScan = {
    pageId: page.id,
    selection,
    layerIds: new Set(result.layers.map(({ id }) => id)),
  };
  return result;
}

async function exportScannedScreenshots(requestId: string): Promise<void> {
  const scan = activeScan;
  if (!scan || scan.pageId !== figma.currentPage.id) {
    throw new Error('Scan the current page again before exporting screenshots.');
  }
  post({ type: 'screenshots', requestId, images: await exportScreenshots(scan.selection) });
}

async function focusScannedLayer(id: string): Promise<void> {
  if (!activeScan || activeScan.pageId !== figma.currentPage.id || !activeScan.layerIds.has(id)) {
    figma.notify('That layer is not in the current scan. Scan the selection again.');
    return;
  }
  if (!(await focusLayer(id))) {
    figma.notify('That layer no longer exists.');
  }
}

async function applyScannedRenames(renames: Parameters<typeof applyRenames>[0]): Promise<void> {
  const scan = activeScan;
  if (!scan || scan.pageId !== figma.currentPage.id) {
    throw new Error('Scan the current page again before renaming layers.');
  }
  const { renamedCount, missedCount } = await applyRenames(renames, scan.layerIds);
  if (activeScan === scan) {
    activeScan = null;
  }
  figma.notify(`Renamed ${renamedCount} ${renamedCount === 1 ? 'layer' : 'layers'}. Press Cmd+Z to undo.`);
  post({ type: 'renames-applied', renamedCount, missedCount });
}

async function handleMessage(message: UiToMain): Promise<void> {
  switch (message.type) {
    case 'ready':
      post({
        type: 'init',
        settings: await loadSettings(),
        preferences: await loadPreferences(),
        selectionCount: figma.currentPage.selection.length,
      });
      break;

    case 'save-settings':
      await saveSettings(message.settings);
      post({ type: 'saved-settings', settings: message.settings });
      figma.notify('Key saved in Figma plugin storage.');
      break;

    case 'forget-settings':
      await forgetSettings();
      activeScan = null;
      post({ type: 'saved-settings', settings: null });
      figma.notify('Key removed.');
      break;

    case 'save-preferences':
      await savePreferences(message.preferences);
      break;

    case 'scan-selection': {
      const result = await scanCurrentSelection();
      if (result) {
        post({ type: 'scan-result', ...result });
      }
      break;
    }

    case 'export-screenshots': {
      await exportScannedScreenshots(message.requestId);
      break;
    }

    case 'focus-layer':
      await focusScannedLayer(message.id);
      break;

    case 'resize':
      resizeWindow(message.width, message.height);
      break;

    case 'apply-renames': {
      await applyScannedRenames(message.renames);
      break;
    }
  }
}

figma.on('selectionchange', onSelectionChange);
figma.on('currentpagechange', onSelectionChange);
figma.ui.onmessage = (message: UiToMain) => {
  handleMessage(message).catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (message.type === 'export-screenshots') {
      post({ type: 'screenshots-error', requestId: message.requestId, message: errorMessage });
      return;
    }
    post({
      type: 'error',
      during: message.type,
      message: errorMessage,
    });
  });
};
