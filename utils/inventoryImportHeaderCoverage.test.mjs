import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import XLSX from 'xlsx';

const source = readFileSync(new URL('../components/MethodPlanMatrixJuly.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile('MethodPlanMatrixJuly.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const names = [
  'BULK_IMPORT_HEADER_ITEMS',
  'METHOD_PLAN_IMPORT_HEADER_ITEMS',
  'normalizeBulkImportHeaderLabel',
  'BULK_IMPORT_HEADER_ALIASES',
  'normalizeBulkImportCellRows',
  'getBulkImportRowFromMethodPlanRow',
  'createLocationDownloadWorkbook',
  'getBulkImportWorksheetCellText',
  'getTemplateImportValue',
  'readTwoSheetInventoryTemplate',
];
const declarations = new Map();
for (const statement of ast.statements) {
  if (!ts.isVariableStatement(statement)) continue;
  for (const declaration of statement.declarationList.declarations) {
    if (ts.isIdentifier(declaration.name) && names.includes(declaration.name.text)) {
      declarations.set(declaration.name.text, `const ${declaration.getText(ast)};`);
    }
  }
}

const code = `${names.map((name) => declarations.get(name)).join('\n')}\n({ ${names.join(', ')} })`;
const compiled = ts.transpileModule(code, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None },
}).outputText;
const config = vm.runInNewContext(compiled, { XLSX, SELECT_PLACEHOLDER: '从下拉菜单选择' });
const resolveHeader = (name, items) => {
  const normalized = config.normalizeBulkImportHeaderLabel(name);
  const match = items.find((item) => config.normalizeBulkImportHeaderLabel(item.label) === normalized);
  return match?.id ?? config.BULK_IMPORT_HEADER_ALIASES[normalized];
};

test('both downloaded template sheets have mapped headers', () => {
  const workbook = XLSX.read(readFileSync(new URL('../public/templates/inventory-work-paper-template.xlsx', import.meta.url)), { type: 'buffer' });
  assert.equal(workbook.SheetNames.length, 2);
  for (const name of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '' });
    const unknown = rows[2].filter((header) => !resolveHeader(String(header), config.BULK_IMPORT_HEADER_ITEMS));
    assert.deepEqual(unknown, [], `Unmapped headers in ${name}`);
  }
});

test('sample quantity headings resolve to the same field in both import modes', () => {
  for (const items of [config.BULK_IMPORT_HEADER_ITEMS, config.METHOD_PLAN_IMPORT_HEADER_ITEMS]) {
    assert.equal(resolveHeader('抽盘数量', items), 'sampleQuantity');
    assert.equal(resolveHeader('样本数量', items), 'sampleQuantity');
    const rows = config.normalizeBulkImportCellRows(
      [['所属公司名称', '样本数量'], ['测试公司', '12']],
      items,
    );
    assert.equal(rows[0][items.findIndex((item) => item.id === 'sampleQuantity')], '12');
  }
});

test('blank and current list downloads keep both sheets and support importing the exported data', () => {
  const template = XLSX.read(readFileSync(new URL('../public/templates/inventory-work-paper-template.xlsx', import.meta.url)), { type: 'buffer' });
  const original = JSON.stringify(template);
  const blank = config.createLocationDownloadWorkbook(template, []);
  assert.equal(blank.SheetNames.length, 2);
  for (const name of blank.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(blank.Sheets[name], { header: 1, defval: '' });
    assert.ok(rows.slice(3).flat().every((cell) => cell === ''), 'no sample data or presets');
  }
  const data = {
    companyName: '测试公司', companyOwner: '仓库A', importedCategory: '原材料',
    importedOtherCharacteristics: '低温', importedFinalBalance: '1234567.89',
    importedInterimPlannedBalance: '1000000', importedPriorBalance: '900000',
    importedPriorInterimPlannedBalance: '800000', importedEndingBalanceConfirmation: '',
    importedInventoryCountPlan: '', countMethod: '', selectedAsSample: '否',
    importedPlannedAttendancePrimary: '是', importedPlannedAttendanceSecondary: '否，项目组采取独立盘点',
    sampleQuantity: '12', sampleChangeReason: '范围变更', auditApproach: '独立盘点方案',
    confirmThirdPartyInventory: '', monitorMode: '现场监盘', useExperts: '是', useInternalAudit: '否',
  };
  const current = config.createLocationDownloadWorkbook(template, [data, { ...data, companyOwner: '仓库B', selectedAsSample: '是' }]);
  const exported = XLSX.read(XLSX.write(current, { type: 'buffer', bookType: 'xlsx' }), { type: 'buffer' });
  const imported = config.readTwoSheetInventoryTemplate(exported);
  assert.equal(imported.sheetCount, 2);
  assert.equal(imported.rows.length, 2, 'includes unselected locations');
  const record = Object.fromEntries(imported.headers.map((header, index) => [header.id, imported.rows[0][index]]));
  for (const [field, expected] of Object.entries({ companyName: '测试公司', intervieweeName: '仓库A',
    finalBalance: '1234567.89', otherCharacteristics: '低温', selectedAsSample: '否',
    sampleQuantity: '12', sampleChangeReason: '范围变更', plannedAttendanceSecondary: '否，项目组采取独立盘点' })) {
    assert.equal(record[field], expected, field);
  }
  assert.equal(JSON.stringify(template), original, 'source template is preserved');
});
