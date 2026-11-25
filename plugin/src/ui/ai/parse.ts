import type { LayerInfo } from '../../shared/messages.ts';

export type RenameSuggestion = { id: string; newName: string; reason: string };

export const MAX_NAME_LENGTH = 80;
const MAX_REASON_LENGTH = 160;
const MAX_REPLY_LENGTH = 100_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseSuggestion(candidate: unknown, layersById: Map<string, LayerInfo>, seenIds: Set<string>): RenameSuggestion | null {
  if (!isRecord(candidate)) {
    return null;
  }
  const layer = typeof candidate.id === 'string' ? layersById.get(candidate.id) : undefined;
  const newName = typeof candidate.newName === 'string' ? candidate.newName.trim() : '';
  if (!layer || seenIds.has(layer.id) || newName === '' || newName.length > MAX_NAME_LENGTH || newName === layer.name) {
    return null;
  }
  seenIds.add(layer.id);
  const reason = typeof candidate.reason === 'string' ? candidate.reason.trim().slice(0, MAX_REASON_LENGTH) : '';
  return { id: layer.id, newName, reason };
}

/** Reads the AI's JSON and drops anything untrustworthy: unknown IDs, empty, over-long or unchanged names. */
export function parseRenames(reply: string, layers: LayerInfo[]): RenameSuggestion[] {
  if (reply.length > MAX_REPLY_LENGTH) {
    throw new Error("The AI's reply was too large. Try selecting fewer layers.");
  }
  const jsonText = reply.slice(reply.indexOf('{'), reply.lastIndexOf('}') + 1);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("The AI's reply couldn't be read. Try again.");
  }
  if (!isRecord(parsed)) {
    throw new Error("The AI's reply couldn't be read. Try again.");
  }

  const layersById = new Map(layers.map((layer) => [layer.id, layer]));
  const items: unknown[] = Array.isArray(parsed.renames) ? parsed.renames : [];
  const suggestions: RenameSuggestion[] = [];
  const seenIds = new Set<string>();
  for (const candidate of items) {
    const suggestion = parseSuggestion(candidate, layersById, seenIds);
    if (suggestion) {
      suggestions.push(suggestion);
    }
  }
  return suggestions;
}
