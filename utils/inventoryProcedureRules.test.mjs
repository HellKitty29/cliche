import assert from 'node:assert/strict';
import {
  getInventoryProcedureDecision as decide,
  getInventoryProcedureDisplayGroupIds,
  getInventoryProcedureDisplayLabels,
  normalizeThirdPartyEvidence,
  getPublishableInventoryRows,
  isInventorySampleExcluded,
} from './inventoryProcedureRules.ts';

assert.deepEqual(getInventoryProcedureDisplayLabels([1, 3]), ['存货盘点-循环盘点', '盘点-第三方地点']);
assert.deepEqual(getInventoryProcedureDisplayGroupIds([5, 4]), [5]);
assert.deepEqual(getInventoryProcedureDisplayLabels([5, 4]), ['存货盘点-无法现场实施监盘的情形 & 独立盘点']);

const approaches = ['控制测试方案', '双重目的方案', '实质性程序方案', '独立盘点方案', '由于不可预见的情况无法实施监盘，实施的独立盘点方案等程序', '由于存货的性质、存放地点等因素，实施存货监盘不可行时，实施的替代程序', '未识别出重大错报风险（仅限ISA项目）'];
const counts = ['循环盘点', '在期末完成盘点', '在非期末时点完成盘点'];
let checked = 0;
for (const [a, auditApproach] of approaches.entries()) {
  for (const importedSystemType of ['永续盘存系统', '定期盘存系统']) {
    for (const [c, countMethod] of counts.entries()) {
      for (const confirmThirdPartyInventory of ['是', '否']) {
        const row = { auditApproach, importedSystemType, countMethod, confirmThirdPartyInventory };
        const result = decide(row);
        const blocked = a === 2 && c === 0;
        const expected = blocked ? [] : a <= 2 ? [c === 0 ? 1 : 2] : a === 3 ? [4] : a === 4 ? [5, 4] : a === 5 ? [6] : [7];
        if (expected.length && a !== 4 && a !== 5 && confirmThirdPartyInventory === '是') expected.push(3);
        assert.deepEqual(result.groupIds, expected, JSON.stringify(row));
        assert.equal(result.blocked, blocked);
        assert.equal(result.thirdPartyAllowed, a !== 4 && a !== 5);
        assert.deepEqual(result.independentSections, a === 4 ? ['4.1', '4.4', '4.5'] : []);
        const codes = [];
        if (blocked) codes.push('7765.8393');
        if ((a < 2 || a === 3) && c === 0 && importedSystemType === '定期盘存系统') codes.push('7765.8396');
        if (a === 3 && c === 1) codes.push('7765.8384');
        if (a === 3 && c === 2 && importedSystemType === '定期盘存系统') codes.push('7765.8402');
        if (a === 4) codes.push('7799.7442');
        if (a === 5) codes.push('7746.6862');
        assert.deepEqual(result.warnings.map(w => w.code), codes);
        assert.ok(result.warnings.every(w => w.blocking === blocked));
        assert.equal(normalizeThirdPartyEvidence(row).confirmThirdPartyInventory, a === 4 || a === 5 ? '否' : confirmThirdPartyInventory);
        checked++;
      }
    }
  }
}
// Switching away from a restricted approach must not restore a stale Yes selection.
const restricted = normalizeThirdPartyEvidence({ auditApproach: approaches[4], countMethod: counts[0], confirmThirdPartyInventory: '是' });
assert.equal(normalizeThirdPartyEvidence({ ...restricted, auditApproach: approaches[0] }).confirmThirdPartyInventory, '否');
assert.deepEqual(decide({ ...restricted, auditApproach: '从下拉菜单选择' }).groupIds, []);
console.log(`Passed ${checked} routing/warning/third-party combinations and selection transitions.`);

const publicationRows = [
  { id: 'normal', selectedAsSample: '是', auditApproach: approaches[0], countMethod: counts[1], confirmThirdPartyInventory: '否' },
  { id: 'warning', auditApproach: approaches[0], countMethod: counts[0], importedSystemType: '定期盘存系统', confirmThirdPartyInventory: '是' },
  { id: 'blocked', auditApproach: approaches[2], countMethod: counts[0], confirmThirdPartyInventory: '是' },
  { id: 'unplanned', auditApproach: '从下拉菜单选择', countMethod: counts[0], confirmThirdPartyInventory: '否' },
  { id: 'not-sampled', selectedAsSample: '否', auditApproach: approaches[0], countMethod: counts[1], confirmThirdPartyInventory: '否' },
];
const publishedIds = (selected, rows = publicationRows) => getPublishableInventoryRows(rows, selected).map(row => row.id);
assert.deepEqual(publishedIds([]), ['normal'], 'Normal tasks publish without selecting warnings');
assert.deepEqual(publishedIds(['warning-7765.8396']), ['normal', 'warning'], 'Selected warning tasks publish with normal tasks');
assert.deepEqual(publishedIds(['blocked-7765.8393', 'warning-7765.8396']), ['normal', 'warning'], 'Blocked tasks stay excluded even if a stale or forged selection contains them');
assert.deepEqual(publishedIds(['unrelated-7765.8396']), ['normal'], 'Selection must match the task and warning');
assert.deepEqual(publishedIds([], publicationRows.slice(1)), [], 'No eligible tasks means nothing to publish');
assert.deepEqual(publishedIds(['warning-7765.8396'], [{ ...publicationRows[1], auditApproach: approaches[3], countMethod: counts[2] }]), [], 'Changed warnings require a new selection');
assert.equal(isInventorySampleExcluded('否'), true);
assert.equal(isInventorySampleExcluded('是'), false);
assert.deepEqual(publishedIds([], [publicationRows[4]]), [], 'Locations not selected for counting cannot publish tasks');
console.log('Passed mixed-task publication, selection, blocked-task and stale-selection checks.');
