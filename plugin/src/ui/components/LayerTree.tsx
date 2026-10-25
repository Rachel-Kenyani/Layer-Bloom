import { useState } from 'preact/hooks';
import { ChevronRight, Circle, Component, Diamond, Frame, Group, Hash, PenTool, PencilLine, Shapes, Square, Type } from 'lucide-preact';
import type { LayerInfo } from '../../shared/messages.ts';
import { isGenericName } from '../layerNames.ts';

const TYPE_ICONS: Record<string, typeof Frame> = {
  FRAME: Hash,
  GROUP: Group,
  SECTION: Frame,
  TEXT: Type,
  COMPONENT: Component,
  COMPONENT_SET: Component,
  INSTANCE: Diamond,
  RECTANGLE: Square,
  ELLIPSE: Circle,
  VECTOR: PenTool,
  BOOLEAN_OPERATION: Shapes,
};

const INDENT_PX = 14;

function tooltip(layer: LayerInfo): string {
  const size = layer.width === undefined ? '' : ` · ${layer.width}×${layer.height}`;
  return `${layer.type} · ${layer.name}${size} — click to show in Figma`;
}

/** Figma names text layers after their text, so only show text that adds something. */
function extraText(layer: LayerInfo): string {
  return layer.text && layer.text.trim() !== layer.name.trim() ? layer.text : '';
}

type LayerTreeProps = { layers: LayerInfo[]; onFocusLayer: (id: string) => void };

export function LayerTree({ layers, onFocusLayer }: Readonly<LayerTreeProps>) {
  const [open, setOpen] = useState(false);

  return (
    <div class="tree-panel">
      <button type="button" class="tree-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span class={open ? 'chevron chevron-open-right' : 'chevron'}>
          <ChevronRight size={14} />
        </span>
        {open ? 'Hide scanned layers' : 'Show scanned layers'}
      </button>
      {open && (
        <>
          <p class="tree-legend">
            <span class="needs-name">
              <PencilLine size={11} />
            </span>{' '}
            needs a better name · click a row to see it in Figma
          </p>
          <ul class="tree">
            {layers.map((layer) => {
              const Icon = TYPE_ICONS[layer.type] ?? Square;
              const text = extraText(layer);
              return (
                <li key={layer.id}>
                  <button type="button" class="tree-row" title={tooltip(layer)} onClick={() => onFocusLayer(layer.id)}>
                    <span class="guides" style={{ width: `${layer.depth * INDENT_PX}px` }} />
                    <span class="tree-icon">
                      <Icon size={12} />
                    </span>
                    <span class="tree-label">
                      {layer.name}
                      {text && <span class="muted"> “{text}”</span>}
                    </span>
                    {isGenericName(layer.name) && (
                      <span class="needs-name" role="img" aria-label="needs a better name">
                        <PencilLine size={11} />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
