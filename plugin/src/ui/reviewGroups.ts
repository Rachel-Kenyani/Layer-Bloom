import type { ReviewItem } from './state.ts';

export type Category = 'containers' | 'shapes' | 'text';
export type Filter = 'all' | Category;

export const FILTER_LABELS: Record<Filter, string> = { all: 'All', containers: 'Frames & groups', shapes: 'Shapes & icons', text: 'Text' };

const CONTAINER_TYPES = new Set(['FRAME', 'GROUP', 'SECTION', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE']);

export function categoryOf(type: string): Category {
  if (CONTAINER_TYPES.has(type)) {
    return 'containers';
  }
  return type === 'TEXT' ? 'text' : 'shapes';
}

export function matchesFilter(item: ReviewItem, filter: Filter): boolean {
  return filter === 'all' || categoryOf(item.type) === filter;
}

/** Filters that would show something, in a fixed order. "All" is only useful when there is more than one. */
export function availableFilters(items: ReviewItem[]): Filter[] {
  const present = new Set(items.map((item) => categoryOf(item.type)));
  const categories = (['containers', 'shapes', 'text'] as const).filter((category) => present.has(category));
  return categories.length > 1 ? ['all', ...categories] : [];
}

export type ReviewGroup = { key: string; title: string; items: ReviewItem[] };

/** Groups suggestions under the layer they sit in, keeping the order they were scanned in. */
export function groupByParent(items: ReviewItem[], parentNames: Map<string, string>): ReviewGroup[] {
  const groups = new Map<string, ReviewGroup>();
  for (const item of items) {
    const key = item.parentId ?? 'top';
    const parentName = item.parentId ? parentNames.get(item.parentId) : undefined;
    if (!groups.has(key)) {
      groups.set(key, { key, title: parentName ? `In ${parentName}` : 'Top level', items: [] });
    }
    groups.get(key)?.items.push(item);
  }
  return [...groups.values()];
}
