let focusedLayerId: string | null = null;

function pageOf(node: BaseNode): PageNode | null {
  let current: BaseNode | null = node;
  while (current && current.type !== 'PAGE') {
    current = current.parent;
  }
  return current;
}

/** Selects a layer and zooms to it, switching page if needed. */
export async function focusLayer(id: string): Promise<boolean> {
  const node = await figma.getNodeByIdAsync(id);
  const page = node ? pageOf(node) : null;
  if (!node || !page || node.type === 'PAGE' || node.type === 'DOCUMENT') {
    return false;
  }
  focusedLayerId = node.id;
  if (page !== figma.currentPage) {
    await figma.setCurrentPageAsync(page);
  }
  figma.currentPage.selection = [node as SceneNode];
  figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
  return true;
}

/**
 * True when a selection change was caused by focusLayer, not by the user.
 * Switching page first fires with an empty selection, so that counts as ours too.
 */
export function isOwnSelectionChange(selection: readonly SceneNode[]): boolean {
  if (focusedLayerId === null) {
    return false;
  }
  if (selection.length === 0 || (selection.length === 1 && selection[0].id === focusedLayerId)) {
    return true;
  }
  focusedLayerId = null;
  return false;
}
