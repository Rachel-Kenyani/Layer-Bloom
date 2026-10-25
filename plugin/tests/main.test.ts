import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { applyRenames } from '../src/main/rename.ts';
import { scanSelection } from '../src/main/scan.ts';

type FakeNode = Record<string, unknown> & { id: string; children?: FakeNode[] };

const node = (id: string, type: string, extra: Partial<FakeNode> = {}): FakeNode => ({
  id,
  type,
  name: `${type} ${id}`,
  locked: false,
  visible: true,
  removed: false,
  width: 100.4,
  height: 40.6,
  ...extra,
});

test('scan walks children, records parents, and skips locked or hidden layers', async () => {
  const selection = [
    node('1', 'FRAME', {
      layoutMode: 'VERTICAL',
      children: [
        node('2', 'TEXT', { characters: 'Sign up' }),
        node('3', 'FRAME', { locked: true }),
        node('4', 'VECTOR', { visible: false }),
      ],
    }),
  ];
  const result = await scanSelection(selection as unknown as SceneNode[]);
  assert.equal(result.skippedCount, 2);
  assert.deepEqual(result.layers, [
    { id: '1', type: 'FRAME', name: 'FRAME 1', depth: 0, width: 100, height: 41, childCount: 3, layout: 'VERTICAL' },
    { id: '2', type: 'TEXT', name: 'TEXT 2', depth: 1, parentId: '1', width: 100, height: 41, text: 'Sign up' },
  ]);
});

test('scan names instances by their component but never goes inside them', async () => {
  const instance = node('1', 'INSTANCE', {
    children: [node('2', 'VECTOR')],
    getMainComponentAsync: async () => ({ name: 'Button/Primary' }),
  });
  const result = await scanSelection([instance] as unknown as SceneNode[]);
  assert.equal(result.layers.length, 1);
  assert.equal(result.layers[0].componentName, 'Button/Primary');
});

test('scan stops at the layer limit and says so', async () => {
  const many = Array.from({ length: 305 }, (_, index) => node(String(index), 'RECTANGLE'));
  const result = await scanSelection(many as unknown as SceneNode[]);
  assert.equal(result.layers.length, 300);
  assert.equal(result.limitReached, true);
});

let undoCommits = 0;
const nodes = new Map<string, FakeNode>();

beforeEach(() => {
  undoCommits = 0;
  nodes.clear();
  (globalThis as unknown as { figma: unknown }).figma = {
    getNodeByIdAsync: async (id: string) => nodes.get(id) ?? null,
    commitUndo: () => undoCommits++,
  };
});

test('rename applies names, skips missing, removed and locked layers, and commits one undo step', async () => {
  nodes.set('1', node('1', 'FRAME'));
  nodes.set('2', node('2', 'FRAME', { locked: true }));
  nodes.set('3', node('3', 'FRAME', { removed: true }));
  const result = await applyRenames([
    { id: '1', newName: 'Card' },
    { id: '2', newName: 'Locked' },
    { id: '3', newName: 'Removed' },
    { id: '9', newName: 'Missing' },
  ]);
  assert.deepEqual(result, { renamedCount: 1, missedCount: 3 });
  assert.equal(nodes.get('1')?.name, 'Card');
  assert.equal(nodes.get('2')?.name, 'FRAME 2');
  assert.equal(undoCommits, 1);
});

test('rename caps names at 80 characters', async () => {
  nodes.set('1', node('1', 'FRAME'));
  await applyRenames([{ id: '1', newName: 'a'.repeat(100) }]);
  assert.equal(String(nodes.get('1')?.name).length, 80);
});
