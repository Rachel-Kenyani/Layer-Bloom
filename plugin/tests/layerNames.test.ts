import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isGenericName } from '../src/ui/layerNames.ts';

test('flags Figma default names', () => {
  for (const name of ['Frame 54', 'Frame', 'Group 12', 'Rectangle 3', 'Vector', 'Image 4', ' Ellipse 2 ']) {
    assert.equal(isGenericName(name), true, name);
  }
});

test('flags pasted screenshot names', () => {
  assert.equal(isGenericName('Screenshot 2026-06-11 at 9.48.40 PM 1'), true);
  assert.equal(isGenericName('IMG_2041'), true);
});

test('leaves meaningful names alone', () => {
  for (const name of ['CV Header', 'RACHEL KENYANI', 'mdi:location', 'Frame Selector', 'Job Entry – PixelEdge']) {
    assert.equal(isGenericName(name), false, name);
  }
});
