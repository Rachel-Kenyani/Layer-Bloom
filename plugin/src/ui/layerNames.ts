const DEFAULT_LAYER_NAMES = new Set([
  'frame',
  'group',
  'section',
  'rectangle',
  'ellipse',
  'vector',
  'line',
  'polygon',
  'star',
  'image',
  'union',
  'subtract',
  'intersect',
  'exclude',
  'component',
  'instance',
]);

/** True for Figma defaults like "Frame 58" and pasted images like "Screenshot 2026-…". */
export function isGenericName(name: string): boolean {
  const trimmed = name.trim();
  const baseName = trimmed.replace(/ \d+$/, '').toLowerCase();
  return DEFAULT_LAYER_NAMES.has(baseName) || /^(screenshot|screen shot|image|img)[ _-]?\d/i.test(trimmed);
}
