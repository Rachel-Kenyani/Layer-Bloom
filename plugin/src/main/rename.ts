import type { ApprovedRename } from '../shared/messages.ts';

export async function applyRenames(
  renames: readonly ApprovedRename[],
  allowedIds: ReadonlySet<string>,
): Promise<{ renamedCount: number; missedCount: number }> {
  let renamedCount = 0;
  let missedCount = 0;
  const seenIds = new Set<string>();
  for (const rename of renames) {
    if (
      !rename ||
      typeof rename.id !== 'string' ||
      typeof rename.newName !== 'string' ||
      !allowedIds.has(rename.id) ||
      seenIds.has(rename.id)
    ) {
      missedCount++;
      continue;
    }
    seenIds.add(rename.id);
    const newName = rename.newName.trim().slice(0, 80);
    if (!newName) {
      missedCount++;
      continue;
    }
    const node = await figma.getNodeByIdAsync(rename.id);
    if (node && !node.removed && node.type !== 'DOCUMENT' && node.type !== 'PAGE' && !node.locked) {
      node.name = newName;
      renamedCount++;
    } else {
      missedCount++;
    }
  }
  if (renamedCount > 0) {
    figma.commitUndo();
  }
  return { renamedCount, missedCount };
}
