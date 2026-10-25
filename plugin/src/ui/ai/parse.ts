import type { LayerInfo } from '../../shared/messages.ts';

export type RenameSuggestion = { id: string; newName: string; reason: string };

type RawRename = { id?: unknown; newName?: unknown; reason?: unknown };

export const MAX_NAME_LENGTH = 80;

/** Reads the AI's JSON and drops anything untrustworthy: unknown IDs, empty, over-long or unchanged names. */
export function parseRenames(reply: string, layers: LayerInfo[]): RenameSuggestion[] {
  const jsonText = reply.slice(reply.indexOf('{'), reply.lastIndexOf('}') + 1);
  let parsed: { renames?: unknown };
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("The AI's reply couldn't be read. Try again.");
  }

  const layersById = new Map(layers.map((layer) => [layer.id, layer]));
  const items: RawRename[] = Array.isArray(parsed.renames) ? parsed.renames : [];
  const suggestions: RenameSuggestion[] = [];
  for (const item of items) {
    const layer = typeof item?.id === 'string' ? layersById.get(item.id) : undefined;
    const newName = typeof item?.newName === 'string' ? item.newName.trim() : '';
    if (layer && newName !== '' && newName.length <= MAX_NAME_LENGTH && newName !== layer.name) {
      suggestions.push({ id: layer.id, newName, reason: typeof item.reason === 'string' ? item.reason : '' });
    }
  }
  return suggestions;
}
