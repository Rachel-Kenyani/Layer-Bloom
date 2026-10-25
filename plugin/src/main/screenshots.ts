const MAX_SCREENSHOTS = 3;

export async function exportScreenshots(selection: readonly SceneNode[]): Promise<string[]> {
  const images: string[] = [];
  for (const node of selection.slice(0, MAX_SCREENSHOTS)) {
    try {
      const bytes = await node.exportAsync({ format: 'PNG', constraint: { type: 'WIDTH', value: 512 } });
      images.push(figma.base64Encode(bytes));
    } catch {
      // Empty or very large layers can't be exported; the AI still gets their text facts.
    }
  }
  return images;
}
