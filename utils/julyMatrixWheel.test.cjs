const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const source = fs.readFileSync('components/InventoryMatrixJuly.tsx', 'utf8');
const start = source.indexOf('  const handleInventoryMatrixWheel =');
const end = source.indexOf('  const renderAmountHeader =', start);
const handlerSource = ts.transpile(source.slice(start, end), { target: ts.ScriptTarget.ES2022 });
function run({ all = true, delta = 100, left = 0, scrollWidth = 1000, clientWidth = 500 } = {}) {
  let prevented = false;
  let target;
  const container = { scrollLeft: left, scrollWidth, clientWidth, scrollTo: (value) => { target = value.left; } };
  const create = new Function('isAllColumnsView', 'scrollColumnWidths', 'lastHorizontalWheelStepAtRef', 'performance', `${handlerSource}; return handleInventoryMatrixWheel;`);
  create(all, [100, 100, 100], { current: 0 }, { now: () => 1000 })({
    currentTarget: container, deltaX: 0, deltaY: delta, preventDefault: () => { prevented = true; },
  });
  return { prevented, target };
}
assert.deepEqual(run(), { prevented: true, target: 100 });
assert.deepEqual(run({ delta: -100, left: 200 }), { prevented: true, target: 100 });
assert.equal(run({ delta: -100 }).prevented, true, 'left edge must not scroll the page');
assert.equal(run({ left: 500 }).prevented, true, 'right edge must not scroll the page');
assert.equal(run({ delta: 1 }).prevented, true, 'small wheel events must not scroll the page');
assert.equal(run({ scrollWidth: 500 }).prevented, true, 'wide screens must still hold the page position');
assert.deepEqual(run({ all: false }), { prevented: false, target: undefined });
console.log('July all-fields wheel captures vertical scrolling, including small deltas and table edges.');
