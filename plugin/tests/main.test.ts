import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { applyRenames } from '../src/main/rename.ts';
import { scanSelection } from '../src/main/scan.ts';
import { exportScreenshots } from '../src/main/screenshots.ts';

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

test('screenshots are capped by longest edge and limited to three selected nodes', async () => {
  const constraints: { type: string; value: number }[] = [];
  const selection = [
    node('1', 'FRAME', {
      width: 1200,
      height: 600,
      exportAsync: async ({ constraint }: { constraint: { type: string; value: number } }) => {
        constraints.push(constraint);
        return new Uint8Array([1]);
      },
    }),
    node('2', 'FRAME', {
      width: 300,
      height: 900,
      exportAsync: async ({ constraint }: { constraint: { type: string; value: number } }) => {
        constraints.push(constraint);
        return new Uint8Array([2]);
      },
    }),
    node('3', 'FRAME', {
      width: 200,
      height: 100,
      exportAsync: async ({ constraint }: { constraint: { type: string; value: number } }) => {
        constraints.push(constraint);
        return new Uint8Array([3]);
      },
    }),
    node('4', 'FRAME', {
      width: 500,
      height: 500,
      exportAsync: async () => {
        throw new Error('This node should not be exported.');
      },
    }),
  ];
  const images = await exportScreenshots(selection as unknown as SceneNode[]);
  assert.deepEqual(constraints, [
    { type: 'WIDTH', value: 512 },
    { type: 'HEIGHT', value: 512 },
    { type: 'WIDTH', value: 200 },
  ]);
  assert.deepEqual(images, ['1', '2', '3']);
});

let undoCommits = 0;
const nodes = new Map<string, FakeNode>();

beforeEach(() => {
  undoCommits = 0;
  nodes.clear();
  (globalThis as unknown as { figma: unknown }).figma = {
    getNodeByIdAsync: async (id: string) => nodes.get(id) ?? null,
    commitUndo: () => undoCommits++,
    base64Encode: (bytes: Uint8Array) => Array.from(bytes).join(','),
  };
});

test('rename only applies scanned IDs, skips missing, removed and locked layers, and commits one undo step', async () => {
  nodes.set('1', node('1', 'FRAME'));
  nodes.set('2', node('2', 'FRAME', { locked: true }));
  nodes.set('3', node('3', 'FRAME', { removed: true }));
  nodes.set('10', node('10', 'FRAME'));
  const result = await applyRenames(
    [
      { id: '1', newName: 'Card' },
      { id: '2', newName: 'Locked' },
      { id: '3', newName: 'Removed' },
      { id: '9', newName: 'Missing' },
      { id: '10', newName: 'Outside scan' },
    ],
    new Set(['1', '2', '3', '9']),
  );
  assert.deepEqual(result, { renamedCount: 1, missedCount: 4 });
  assert.equal(nodes.get('1')?.name, 'Card');
  assert.equal(nodes.get('2')?.name, 'FRAME 2');
  assert.equal(nodes.get('10')?.name, 'FRAME 10');
  assert.equal(undoCommits, 1);
});

test('rename caps names at 80 characters', async () => {
  nodes.set('1', node('1', 'FRAME'));
  await applyRenames([{ id: '1', newName: 'a'.repeat(100) }], new Set(['1']));
  assert.equal(String(nodes.get('1')?.name).length, 80);
});

test('rename ignores blank and duplicate names without creating an undo step', async () => {
  nodes.set('1', node('1', 'FRAME'));
  const result = await applyRenames(
    [
      { id: '1', newName: '  ' },
      { id: '1', newName: 'Second name' },
    ],
    new Set(['1']),
  );
  assert.deepEqual(result, { renamedCount: 0, missedCount: 2 });
  assert.equal(nodes.get('1')?.name, 'FRAME 1');
  assert.equal(undoCommits, 0);
});
