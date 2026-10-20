import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../components/InventoryMatrixJuly.tsx', import.meta.url), 'utf8');
const extract = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const compile = (snippet, result, dependencies) => new Function(
  ...Object.keys(dependencies),
  ts.transpile(snippet, { target: ts.ScriptTarget.ES2022 }) + `\nreturn ${result};`
)(...Object.values(dependencies));

let rows;
let pending;
const dependencies = (createdIds = []) => ({
  createdTaskRowIdSet: new Set(createdIds),
  isSampleYesValue: (value) => value === '是',
  isSampleNoValue: (value) => value === '否',
  setPendingSampleChange: (value) => { pending = value; },
  updateRow: (id, field, value) => { rows = rows.map((row) => row.id === id ? { ...row, [field]: value } : row); },
  commitRows: (update) => { rows = update(rows); },
});
const makeSingle = (createdIds) => compile(
  extract('  const handleSelectedAsSampleChange =', '  const confirmPendingSampleChange ='),
  'handleSelectedAsSampleChange', dependencies(createdIds)
);

for (const createdIds of [[], ['another-row']]) {
  rows = [{ id: 'a', selectedAsSample: '是' }];
  pending = null;
  makeSingle(createdIds)(rows[0], '否');
  assert.equal(rows[0].selectedAsSample, '否', 'unpublished objects can be deselected immediately');
  assert.equal(pending, null);
}
rows = [{ id: 'a', selectedAsSample: '是' }];
pending = null;
makeSingle(['a'])(rows[0], '否');
assert.equal(rows[0].selectedAsSample, '是', 'published objects remain selected until the reason is confirmed');
assert.deepEqual(pending, { rowIds: ['a'], nextValue: '否', reason: '' });

rows = [{ id: 'a', selectedAsSample: '否' }];
pending = null;
makeSingle(['a'])(rows[0], '是');
assert.equal(rows[0].selectedAsSample, '是');
assert.equal(pending, null, 'reselection does not require a reason');

rows = [{ id: 'a', selectedAsSample: '是' }, { id: 'b', selectedAsSample: '是' }];
pending = null;
const bulk = compile(
  extract('  const handleBulkSampleSelectionChange =', '  const openBulkEditModal ='),
  'handleBulkSampleSelectionChange',
  { ...dependencies(['a']), selectedRowsForBulkEdit: rows, selectedRowIdSet: new Set(['a', 'b']) }
);
bulk(false);
assert.equal(rows[0].selectedAsSample, '是');
assert.equal(rows[1].selectedAsSample, '否');
assert.deepEqual(pending.rowIds, ['a'], 'mixed bulk edits request a reason only for published objects');
pending.reason = ' 调整监盘范围 ';
compile(
  extract('  const confirmPendingSampleChange =', '  const totalPriorBalance ='),
  'confirmPendingSampleChange', { ...dependencies(['a']), pendingSampleChange: pending }
)();
assert.equal(rows[0].selectedAsSample, '否');
assert.equal(rows[0].sampleChangeReason, '调整监盘范围');
assert.equal(rows[1].sampleChangeReason, undefined);

const create = compile(
  extract('export const createInventoryMatrixRow =', 'export const INITIAL_INVENTORY_MATRIX_ROWS').replace('export const', 'const'),
  'createInventoryMatrixRow', { SELECT_PLACEHOLDER: '从下拉菜单选择' }
);
const empty = create('empty');
for (const field of ['selectedAsSample', 'thirdPartyStorage', 'useExpert', 'plannedAttendancePrimary', 'plannedAttendanceSecondary', 'confirmThirdPartyInventory', 'useExperts', 'useInternalAudit']) {
  assert.equal(empty[field], '', `${field} should start without a yes/no selection`);
}
console.log('Passed published-object reason gating, mixed bulk edits, reason confirmation and empty yes/no defaults.');
