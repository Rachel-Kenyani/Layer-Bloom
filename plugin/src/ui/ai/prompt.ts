import type { NamingStyle } from '../../shared/messages.ts';

export const NAMING_STYLES: Record<NamingStyle, { label: string; example: string; rule: string }> = {
  title: {
    label: 'Title Case',
    example: 'Job Entry – PixelEdge',
    rule: 'Title Case, 1-4 words, e.g. "Job Entry", "Header", "Skills List". When siblings share a role, add what makes each unique after a dash: "Job Entry – PixelEdge".',
  },
  slash: {
    label: 'Slash path',
    example: 'Card/Job/PixelEdge',
    rule: 'Slash-separated paths from general to specific, Title Case parts, e.g. "Card/Job", "Nav/Item/Home", "Icon/Location". Matches Figma component naming.',
  },
  kebab: {
    label: 'kebab-case',
    example: 'job-entry-pixeledge',
    rule: 'lowercase kebab-case, 1-4 words, e.g. "job-entry", "site-header", "icon-location". Suits developer handoff.',
  },
};

export function renameInstructions(namingStyle: NamingStyle): string {
  return `You rename messy Figma layers so designers and developers can understand a file at a glance.

You get a JSON list of layers. "parentName" is the layer it sits inside. "componentName" is the component an instance comes from.

Rules:
- Rename layers with generic names like "Frame 58", "Group 12", "Rectangle 3", "Vector".
- Keep names that are already clear. Leave text layers alone unless their name is generic.
- Name format: ${NAMING_STYLES[namingStyle].rule}
- Use the text inside a layer and its children as the main clue. Use size, layout and parent as extra clues.
- For instances, prefer a name based on componentName.
- Screenshots of the selected layers may be attached. Use them to recognise things text can't show, like icons, images, buttons and cards.

Reply with JSON only, in this shape:
{"renames": [{"id": "<layer id>", "newName": "<new name>", "reason": "<short reason>"}]}
Only include layers you are renaming.`;
}
