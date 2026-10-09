import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const sidebar = readFileSync(new URL('../components/Sidebar.tsx', import.meta.url), 'utf8');

assert.match(app, /\|\s*'wpForJuly'/);
assert.match(app, /view === 'wpForJuly'\s*\?\s*'#\/wp-for-july'/s);
assert.match(app, /h\.startsWith\('#\/wp-for-july'\)[\s\S]*?setCurrentView\('wpForJuly'\)/);
assert.match(app, /import PreWpJuly from '\.\/components\/PreWpJuly'/);
assert.match(app, /currentView === 'wpForJuly'[\s\S]*?<PreWpJuly/);
assert.match(app, /module === 'wpForJuly'[\s\S]*?setCurrentView\('wpForJuly'\)/);

assert.match(sidebar, /'wpForJuly'/);
assert.match(sidebar, /onSelectModule\('wpForJuly'\)/);
assert.match(sidebar, /activeView === 'wpForJuly'/);
assert.match(sidebar, /wp for july/);

const preWpJuly = readFileSync(new URL('../components/PreWpJuly.tsx', import.meta.url), 'utf8');
const inventoryMatrixJuly = readFileSync(new URL('../components/InventoryMatrixJuly.tsx', import.meta.url), 'utf8');
const methodPlanMatrixJuly = readFileSync(new URL('../components/MethodPlanMatrixJuly.tsx', import.meta.url), 'utf8');

assert.match(preWpJuly, /from '\.\/InventoryMatrixJuly'/);
assert.match(preWpJuly, /from '\.\/MethodPlanMatrixJuly'/);
assert.match(preWpJuly, /from '\.\/TableFullscreenFrameJuly'/);
assert.match(
  preWpJuly,
  /methodDeterminationSteps = steps\.filter\(\(step\) => \[1, 2, 3, 4, 5, 6\]\.includes\(step\.id\)\)[\s\S]*\[1, 2, 3, 4, 5, 6, 8\]\.includes\(step\.id\)[\s\S]*id=\{`method-plan-step-note-\$\{step\.id\}`\}/
);
assert.match(
  preWpJuly,
  /visibleMethodPlanPrepSteps\.map\(\(step\) => \{[\s\S]*\[3, 4, 5, 6, 7, 8\]\.includes\(step\.id\)[\s\S]*id=\{`method-plan-step-note-\$\{step\.id\}`\}/
);
assert.match(
  preWpJuly,
  /type PreWpJulyStage = 'understand' \| 'method' \| 'plan';[\s\S]*methodDeterminationSteps = steps\.filter\(\(step\) => \[1, 2, 3, 4, 5, 6\]\.includes\(step\.id\)\)[\s\S]*inventoryPlanSteps = steps\.filter\(\(step\) => step\.id === 8\)/
);
assert.match(
  preWpJuly,
  /\[4, 5, 8\]\.includes\(step\.id\)[\s\S]*id=\{`method-plan-step-file-\$\{step\.id\}`\}/
);
assert.doesNotMatch(preWpJuly, /id=\{`completion-\$\{step\.id\}`\}/);
assert.doesNotMatch(preWpJuly, /id=\{`method-plan-prep-\$\{step\.id\}`\}/);
assert.match(preWpJuly, /const shouldShowSubmit =\s*hasUploadedRequiredFiles && hasSelectedRequiredYesOptions;/);

assert.match(inventoryMatrixJuly, /from '\.\/TableFullscreenFrameJuly'/);
assert.match(inventoryMatrixJuly, /location: string;/);
assert.match(inventoryMatrixJuly, /location: '',/);
assert.doesNotMatch(inventoryMatrixJuly, /value=\{row\.location\}[\s\S]*updateRow\(row\.id, 'location'/);
assert.match(inventoryMatrixJuly, /selectedAsSample: string;/);
assert.match(inventoryMatrixJuly, /selectedAsSample: '是'/);
assert.match(
  inventoryMatrixJuly,
  /interimChangeHeaderRef[\s\S]*finalChangeHeaderRef[\s\S]*greenHeaderCellClassName/
);
assert.match(
  inventoryMatrixJuly,
  /derivedRow\.interimChange[\s\S]*derivedRow\.finalChange[\s\S]*value=\{row\.selectedAsSample\}[\s\S]*handleSelectedAsSampleChange\(row, event\.target\.value\)/
);
assert.match(inventoryMatrixJuly, /<col style=\{\{ width: '90px' \}\} \/>[\s\S]*greenHeaderCellClassName/);
assert.match(inventoryMatrixJuly, /min-w-\[1490px\]/);
assert.match(
  preWpJuly,
  /批量导入 \| 下载/,
  'inventory matrix import entry button should use the combined import/download label'
);
assert.match(
  methodPlanMatrixJuly,
  /onClick=\{downloadBulkImportWorkbook\}[\s\S]*bulkImportMode === 'methodPlan'\s*\?\s*'下载当前数据'\s*:\s*'下载模板'[\s\S]*onClick=\{\(\) => bulkImportExcelInputRef\.current\?\.click\(\)\}[\s\S]*上传/,
  'bulk import modal download button should appear before upload and switch label by import mode'
);
assert.match(
  methodPlanMatrixJuly,
  /XLSX\.writeFile\(workbook, bulkImportMode === 'methodPlan' \? '表格二监盘计划\.xlsx' : '盘点表\.xlsx'\)/,
  'bulk import modal should download the current data workbook for the active mode'
);
assert.ok(
  existsSync(new URL('../public/templates/inventory-count-template.xlsx', import.meta.url)),
  'inventory count template should be available as a public static asset'
);

assert.doesNotMatch(methodPlanMatrixJuly, /\{ id: 'location-list', label: '[^']+', fixed: false \}/);
assert.doesNotMatch(methodPlanMatrixJuly, /record\['location-list'\]/);
assert.match(preWpJuly, /selectedAsSample: row\.selectedAsSample \?\? ''/);
assert.match(preWpJuly, /selectedAsSample: inventoryRow\.selectedAsSample/);
