import type { AiSettings, LayerInfo, NamingStyle } from '../../shared/messages.ts';
import { PROVIDERS } from '../providers.ts';
import { ADAPTERS } from './adapters.ts';
import { parseRenames, type RenameSuggestion } from './parse.ts';
import { renameInstructions } from './prompt.ts';
import { ProviderError } from './request.ts';

/** Small enough that the AI's reply never hits its output limit. */
export const BATCH_SIZE = 80;

export type SuggestRequest = {
  settings: AiSettings;
  namingStyle: NamingStyle;
  layers: LayerInfo[];
  images: string[];
  signal: AbortSignal;
  onBatch: (batchNumber: number, batchCount: number) => void;
};

export function toBatches<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    batches.push(items.slice(start, start + size));
  }
  return batches;
}

/** Adds each layer's parent name, since a batch may not contain the parent itself. */
function withParentNames(layers: LayerInfo[], allLayers: LayerInfo[]) {
  const names = new Map(allLayers.map((layer) => [layer.id, layer.name]));
  return layers.map((layer) => ({ ...layer, parentName: layer.parentId ? names.get(layer.parentId) : undefined }));
}

export async function suggestNames({
  settings,
  namingStyle,
  layers,
  images,
  signal,
  onBatch,
}: SuggestRequest): Promise<RenameSuggestion[]> {
  const provider = PROVIDERS[settings.provider];
  const instructions = renameInstructions(namingStyle);
  const batches = toBatches(layers, BATCH_SIZE);
  let model = provider.model;
  const suggestions: RenameSuggestion[] = [];

  for (const [index, batch] of batches.entries()) {
    onBatch(index + 1, batches.length);
    const call = {
      apiKey: settings.apiKey,
      instructions,
      layerList: JSON.stringify(withParentNames(batch, layers)),
      // Screenshots show the whole selection, so they only need sending once.
      images: index === 0 ? images : [],
      signal,
    };
    let reply: string;
    try {
      reply = await ADAPTERS[settings.provider]({ ...call, model });
    } catch (error) {
      if (!(error instanceof ProviderError) || error.status !== 404 || model === provider.fallbackModel) {
        throw error;
      }
      model = provider.fallbackModel;
      reply = await ADAPTERS[settings.provider]({ ...call, model });
    }
    suggestions.push(...parseRenames(reply, batch));
  }
  return suggestions;
}
