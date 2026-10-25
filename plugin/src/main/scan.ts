import type { LayerInfo, ScanResult } from '../shared/messages.ts';

export const MAX_LAYERS = 300;

async function describe(node: SceneNode, depth: number, parentId: string | undefined): Promise<LayerInfo> {
  const info: LayerInfo = { id: node.id, type: node.type, name: node.name, depth };

  if (parentId) {
    info.parentId = parentId;
  }
  if ('width' in node) {
    info.width = Math.round(node.width);
    info.height = Math.round(node.height);
  }
  if (node.type === 'TEXT') {
    info.text = node.characters.slice(0, 120);
  }
  if ('children' in node) {
    info.childCount = node.children.length;
  }
  if ('layoutMode' in node && node.layoutMode !== 'NONE') {
    info.layout = node.layoutMode;
  }
  if (node.type === 'INSTANCE') {
    const mainComponent = await node.getMainComponentAsync();
    if (mainComponent) {
      info.componentName = mainComponent.name;
    }
  }

  return info;
}

async function collect(nodes: readonly SceneNode[], depth: number, parentId: string | undefined, result: ScanResult): Promise<void> {
  for (const node of nodes) {
    if (result.layers.length >= MAX_LAYERS) {
      result.limitReached = true;
      return;
    }
    if (node.locked || !node.visible) {
      result.skippedCount++;
      continue;
    }
    result.layers.push(await describe(node, depth, parentId));
    // Renaming inside an instance creates overrides, so instances are named but never entered.
    if ('children' in node && node.type !== 'INSTANCE') {
      await collect(node.children, depth + 1, node.id, result);
    }
  }
}

export async function scanSelection(selection: readonly SceneNode[]): Promise<ScanResult> {
  const result: ScanResult = { layers: [], skippedCount: 0, limitReached: false };
  await collect(selection, 0, undefined, result);
  return result;
}
