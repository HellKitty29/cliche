import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as XLSX from 'xlsx';
import { getWorksheetRows, readRowReference } from '../src/utils/workingPaperRows';

test('preserves Excel row numbers with leading and internal blank rows', () => {
  const worksheet: XLSX.WorkSheet = { '!ref': 'C5:C7', C5: { t: 's', v: '余额' }, C7: { t: 'n', v: 1234 } };
  assert.deepEqual(getWorksheetRows(worksheet).map(row => row.number), [5, 6, 7]);
  assert.equal(getWorksheetRows(worksheet)[2].cells[0], '1234');
});
test('keeps the sheet name and distinct sorted row numbers through message serialization', () => {
  assert.deepEqual(readRowReference(structuredClone({ sheetName: '余额表', rows: [7, 5, 7] })), { sheetName: '余额表', rows: [5, 7] });
  assert.equal(readRowReference({ sheetName: '余额表', rows: [0] }), undefined);
  assert.equal(readRowReference({ sheetName: '余额表', rows: ['5'] }), undefined);
  assert.equal(readRowReference(undefined), undefined);
});
