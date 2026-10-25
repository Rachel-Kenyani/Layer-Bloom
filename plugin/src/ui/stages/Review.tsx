import { useState } from 'preact/hooks';
import { Crosshair, X } from 'lucide-preact';
import type { LayerInfo } from '../../shared/messages.ts';
import { MAX_NAME_LENGTH } from '../ai/parse.ts';
import { Banner } from '../components/Banner.tsx';
import { Button, IconButton, LinkButton } from '../components/Button.tsx';
import { Checkbox } from '../components/Checkbox.tsx';
import { availableFilters, FILTER_LABELS, type Filter, groupByParent, matchesFilter } from '../reviewGroups.ts';
import type { ReviewItem } from '../state.ts';
import { plural } from '../text.ts';

type ReviewProps = {
  items: ReviewItem[];
  layers: LayerInfo[];
  /** Takes a function so quick successive edits each build on the latest list. */
  onItemsChange: (change: (items: ReviewItem[]) => ReviewItem[]) => void;
  applying: boolean;
  error: string | null;
  onApply: () => void;
  onStartOver: () => void;
  onFocusLayer: (id: string) => void;
};

export function approvedItems(items: ReviewItem[]): ReviewItem[] {
  return items.filter((item) => item.checked && item.newName.trim() !== '');
}

function selectAllState(tickedCount: number, total: number): boolean | 'mixed' {
  if (tickedCount === 0) {
    return false;
  }
  return tickedCount === total ? true : 'mixed';
}

function applyLabel(applying: boolean, readyCount: number): string {
  if (applying) {
    return 'Renaming…';
  }
  if (readyCount === 0) {
    return 'Tick at least one suggestion';
  }
  return `Rename ${plural(readyCount, 'layer')}`;
}

type RowProps = {
  item: ReviewItem;
  onChange: (change: Partial<ReviewItem>) => void;
  onFocusLayer: (id: string) => void;
};

function SuggestionRow({ item, onChange, onFocusLayer }: Readonly<RowProps>) {
  const [showReason, setShowReason] = useState(false);
  const empty = item.newName.trim() === '';

  return (
    <li class={item.checked ? 'suggestion' : 'suggestion suggestion-off'}>
      <Checkbox checked={item.checked} onChange={(checked) => onChange({ checked })} ariaLabel={`Rename ${item.oldName}`} />
      <div class="suggestion-body">
        <button type="button" class="old-name" onClick={() => onFocusLayer(item.id)} title="Show this layer in Figma">
          <span>{item.oldName}</span>
          <Crosshair size={12} />
        </button>
        <input
          type="text"
          class={empty ? 'input-invalid' : ''}
          value={item.newName}
          maxLength={MAX_NAME_LENGTH}
          aria-label={`New name for ${item.oldName}`}
          onInput={(event) => onChange({ newName: event.currentTarget.value })}
        />
        {empty && <span class="field-error">Type a name, or untick this row.</span>}
        {!empty && item.reason && (
          <span class="reason">
            <LinkButton onClick={() => setShowReason(!showReason)}>{showReason ? 'Hide reason' : 'Why?'}</LinkButton>
            {showReason && <span class="muted"> {item.reason}</span>}
          </span>
        )}
      </div>
    </li>
  );
}

export function Review({ items, layers, onItemsChange, applying, error, onApply, onStartOver, onFocusLayer }: Readonly<ReviewProps>) {
  const [filter, setFilter] = useState<Filter>('all');
  const filters = availableFilters(items);
  const visible = items.filter((item) => matchesFilter(item, filter));
  const visibleIds = new Set(visible.map((item) => item.id));
  const tickedCount = items.filter((item) => item.checked).length;
  const visibleTicked = visible.filter((item) => item.checked).length;
  const readyCount = approvedItems(items).length;
  const allState = selectAllState(visibleTicked, visible.length);
  const groups = groupByParent(visible, new Map(layers.map((layer) => [layer.id, layer.name])));

  const setVisible = (checked: boolean) =>
    onItemsChange((current) => current.map((item) => (visibleIds.has(item.id) ? { ...item, checked } : item)));
  const update = (id: string, change: Partial<ReviewItem>) =>
    onItemsChange((current) => current.map((item) => (item.id === id ? { ...item, ...change } : item)));

  return (
    <div class="review">
      <div class="selection-bar">
        <Checkbox
          checked={allState}
          onChange={() => setVisible(allState !== true)}
          ariaLabel={allState === true ? 'Untick all shown' : 'Tick all shown'}
        />
        <span>
          {tickedCount} of {items.length} selected
        </span>
        {tickedCount > 0 && (
          <IconButton label="Untick all" onClick={() => onItemsChange((current) => current.map((item) => ({ ...item, checked: false })))}>
            <X size={16} />
          </IconButton>
        )}
      </div>

      {filters.length > 0 && (
        <div class="chips">
          {filters.map((option) => (
            <button key={option} type="button" class="chip" aria-pressed={filter === option} onClick={() => setFilter(option)}>
              {FILTER_LABELS[option]}
            </button>
          ))}
        </div>
      )}

      {error ? (
        <Banner tone="error">{error}</Banner>
      ) : (
        <Banner tone="info">Nothing has been renamed yet. Untick or edit any suggestion, or click a layer name to see it in Figma.</Banner>
      )}

      {groups.map((group) => (
        <section key={group.key} class="group">
          <h2 class="group-title">{group.title}</h2>
          <ul class="suggestions">
            {group.items.map((item) => (
              <SuggestionRow key={item.id} item={item} onChange={(change) => update(item.id, change)} onFocusLayer={onFocusLayer} />
            ))}
          </ul>
        </section>
      ))}

      <div class="footer">
        <Button onClick={onApply} disabled={readyCount === 0 || applying}>
          {applyLabel(applying, readyCount)}
        </Button>
        <Button variant="secondary" onClick={onStartOver}>
          Start over
        </Button>
      </div>
    </div>
  );
}
