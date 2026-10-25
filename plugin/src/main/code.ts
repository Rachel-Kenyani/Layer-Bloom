import type { MainToUi, UiToMain } from '../shared/messages.ts';
import { focusLayer, isOwnSelectionChange } from './focus.ts';
import { applyRenames } from './rename.ts';
import { resizeWindow } from './resize.ts';
import { scanSelection } from './scan.ts';
import { exportScreenshots } from './screenshots.ts';
import { forgetSettings, loadPreferences, loadSettings, savePreferences, saveSettings } from './storage.ts';

figma.showUI(__html__, { width: 380, height: 600, themeColors: true });

function post(message: MainToUi): void {
  figma.ui.postMessage(message);
}

function onSelectionChange(): void {
  const selection = figma.currentPage.selection;
  if (!isOwnSelectionChange(selection)) {
    post({ type: 'selection', count: selection.length });
  }
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
      figma.notify('Key saved on this computer.');
      break;

    case 'forget-settings':
      await forgetSettings();
      post({ type: 'saved-settings', settings: null });
      figma.notify('Key removed.');
      break;

    case 'save-preferences':
      await savePreferences(message.preferences);
      break;

    case 'scan-selection':
      post({ type: 'scan-result', ...(await scanSelection(figma.currentPage.selection)) });
      break;

    case 'export-screenshots':
      post({ type: 'screenshots', images: await exportScreenshots(figma.currentPage.selection) });
      break;

    case 'focus-layer':
      if (!(await focusLayer(message.id))) {
        figma.notify('That layer no longer exists.');
      }
      break;

    case 'resize':
      resizeWindow(message.width, message.height);
      break;

    case 'apply-renames': {
      const { renamedCount, missedCount } = await applyRenames(message.renames);
      figma.notify(`Renamed ${renamedCount} ${renamedCount === 1 ? 'layer' : 'layers'}. Press Cmd+Z to undo.`);
      post({ type: 'renames-applied', renamedCount, missedCount });
      break;
    }
  }
}

figma.on('selectionchange', onSelectionChange);
figma.on('currentpagechange', onSelectionChange);
figma.ui.onmessage = (message: UiToMain) => {
  handleMessage(message).catch((error: unknown) => {
    post({ type: 'error', during: message.type, message: error instanceof Error ? error.message : String(error) });
  });
};
