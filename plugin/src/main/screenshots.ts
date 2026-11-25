const MAX_SCREENSHOTS = 3;
const MAX_SCREENSHOT_EDGE = 512;

export async function exportScreenshots(selection: readonly SceneNode[]): Promise<string[]> {
  const images: string[] = [];
  for (const node of selection.slice(0, MAX_SCREENSHOTS)) {
    try {
      const width = 'width' in node ? node.width : MAX_SCREENSHOT_EDGE;
      const height = 'height' in node ? node.height : MAX_SCREENSHOT_EDGE;
      const constrainByHeight = height > width;
      const dimension = Math.max(1, Math.min(MAX_SCREENSHOT_EDGE, Math.round(constrainByHeight ? height : width)));
      const bytes = await node.exportAsync({
        format: 'PNG',
        constraint: { type: constrainByHeight ? 'HEIGHT' : 'WIDTH', value: dimension },
      });
      images.push(figma.base64Encode(bytes));
    } catch {
      // Empty or very large layers can't be exported; the AI still gets their text facts.
    }
  }
  return images;
}
