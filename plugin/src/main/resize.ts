const MIN_WIDTH = 320;
const MAX_WIDTH = 800;
const MIN_HEIGHT = 420;
const MAX_HEIGHT = 1000;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)));

export function resizeWindow(width: number, height: number): void {
  figma.ui.resize(clamp(width, MIN_WIDTH, MAX_WIDTH), clamp(height, MIN_HEIGHT, MAX_HEIGHT));
}
