import assert from 'node:assert/strict';
import { test } from 'node:test';
import { availableFilters, categoryOf, groupByParent, matchesFilter } from '../src/ui/reviewGroups.ts';
import type { ReviewItem } from '../src/ui/state.ts';

const item = (id: string, type: string, parentId?: string): ReviewItem => ({
  id,
  type,
  parentId,
  oldName: id,
  newName: `New ${id}`,
  reason: '',
  checked: true,
});

test('sorts layer types into categories', () => {
  assert.equal(categoryOf('FRAME'), 'containers');
  assert.equal(categoryOf('INSTANCE'), 'containers');
  assert.equal(categoryOf('TEXT'), 'text');
  assert.equal(categoryOf('VECTOR'), 'shapes');
  assert.equal(categoryOf('ELLIPSE'), 'shapes');
});

test('only offers filters when there is more than one category', () => {
  assert.deepEqual(availableFilters([item('1', 'FRAME'), item('2', 'GROUP')]), []);
  assert.deepEqual(availableFilters([item('1', 'TEXT'), item('2', 'FRAME'), item('3', 'VECTOR')]), ['all', 'containers', 'shapes', 'text']);
});

test('filters match by category', () => {
  assert.equal(matchesFilter(item('1', 'VECTOR'), 'shapes'), true);
  assert.equal(matchesFilter(item('1', 'VECTOR'), 'text'), false);
  assert.equal(matchesFilter(item('1', 'VECTOR'), 'all'), true);
});

test('groups by parent in scan order with readable titles', () => {
  const groups = groupByParent(
    [item('a', 'FRAME'), item('b', 'VECTOR', 'p1'), item('c', 'VECTOR', 'p2'), item('d', 'TEXT', 'p1')],
    new Map([
      ['p1', 'Header'],
      ['p2', 'Footer'],
    ]),
  );
  assert.deepEqual(
    groups.map((group) => [group.title, group.items.map((entry) => entry.id)]),
    [
      ['Top level', ['a']],
      ['In Header', ['b', 'd']],
      ['In Footer', ['c']],
    ],
  );
});
