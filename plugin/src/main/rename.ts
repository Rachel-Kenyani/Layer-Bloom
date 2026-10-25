import type { ApprovedRename } from '../shared/messages.ts';

export async function applyRenames(renames: ApprovedRename[]): Promise<{ renamedCount: number; missedCount: number }> {
  let renamedCount = 0;
  for (const rename of renames) {
    const node = await figma.getNodeByIdAsync(rename.id);
    if (node && !node.removed && node.type !== 'DOCUMENT' && node.type !== 'PAGE' && !node.locked) {
      node.name = rename.newName.slice(0, 80);
      renamedCount++;
    }
  }
  // One undo step for the whole batch.
  figma.commitUndo();
  return { renamedCount, missedCount: renames.length - renamedCount };
}
