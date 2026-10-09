import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const inventoryMatrix = readFileSync(new URL('../components/InventoryMatrixJuly.tsx', import.meta.url), 'utf8');
const preWpJuly = readFileSync(new URL('../components/PreWpJuly.tsx', import.meta.url), 'utf8');
const methodMatrix = readFileSync(new URL('../components/MethodPlanMatrixJuly.tsx', import.meta.url), 'utf8');
const inventoryProcedureRules = readFileSync(new URL('./inventoryProcedureRules.ts', import.meta.url), 'utf8');

assert.match(inventoryMatrix, /type InventoryMatrixView = 'balance' \| 'management' \| 'monitoring' \| 'arrangements' \| 'all'/);
assert.match(inventoryMatrix, /useState<InventoryMatrixView \| null>\(null\)/);
assert.match(inventoryMatrix, /current === view\.value \? null : view\.value/);
for (const field of ['plannedAttendancePrimary', 'plannedAttendanceSecondary', 'auditApproach', 'sampleQuantity', 'confirmedInventoryMethod', 'confirmThirdPartyInventory', 'monitorMode', 'useExperts', 'useInternalAudit']) {
  assert.match(inventoryMatrix, new RegExp(`\\b${field}: string`));
}
assert.match(inventoryMatrix, /INVENTORY_MATRIX_VIEWS\.map/);
assert.match(inventoryMatrix, /aria-label="存货矩阵字段分组"/);
assert.match(inventoryMatrix, /flex flex-wrap items-end justify-between gap-3 px-1/);
assert.match(inventoryMatrix, /flex w-\[390px\] flex-col items-start gap-2/);
assert.match(inventoryMatrix, /border border-blue-200 bg-white/);
assert.match(inventoryMatrix, /whitespace-nowrap rounded-full px-3 py-1 transition/);
assert.match(inventoryMatrix, /grid grid-cols-2 gap-2 rounded-lg bg-slate-50\/70/);
assert.match(inventoryMatrix, />确定<\/button>/);
assert.match(inventoryMatrix, /aria-label="选择本期余额时点"/);
assert.match(inventoryMatrix, /<option value="balance">本期期末余额<\/option>/);
assert.match(inventoryMatrix, /<option value="interim">本期预审阶段余额<\/option>/);
assert.match(inventoryMatrix, /renderSelectableCurrentAmountHeader\(\)/);
assert.match(inventoryMatrix, /identityColumnLefts/);
assert.match(inventoryMatrix, /stickyIdentityBoundaryClassName/);
assert.match(inventoryMatrix, /ALL_VIEW_SCROLL_COLUMN_WIDTHS/);
assert.match(inventoryMatrix, /container\.scrollTo\(\{ left: targetLeft, behavior: 'smooth' \}\)/);
assert.match(inventoryMatrix, /isAllColumnsView \? 'overflow-x-auto' : 'overflow-x-hidden'/);
assert.match(inventoryMatrix, /outline-slate-300/);
assert.doesNotMatch(inventoryMatrix, /期末预审显示切换/);
assert.match(preWpJuly, /id: inventoryRow\.id/);
assert.match(preWpJuly, /currentRowsById\.get\(inventoryRow\.id\)/);
for (const mapping of ['sampleQuantity: inventoryRow.sampleQuantity', 'confirmThirdPartyInventory: inventoryRow.confirmThirdPartyInventory', 'auditApproach: resolveInventoryAuditApproach(inventoryRow) ?? inventoryRow.auditApproach', 'monitorMode: inventoryRow.monitorMode', 'useExperts: inventoryRow.useExperts', 'useInternalAudit: inventoryRow.useInternalAudit']) {
  assert.ok(preWpJuly.includes(mapping), `missing mapping: ${mapping}`);
}
for (const label of ['存货余额', '存货管理方式', '存货监盘方法', '其他安排', '显示全部', '项目组是否可以前往', '存货所在地点实施监盘', '客户是否开展盘点', '计划的审计方案', '发出函证']) {
  assert.ok(inventoryMatrix.includes(label), `missing label: ${label}`);
}
const unifiedTableSource = inventoryMatrix.slice(0, inventoryMatrix.indexOf('{false && ('));
const arrangementsColumnIndex = unifiedTableSource.indexOf('发出函证');
const confirmedMethodColumnIndex = unifiedTableSource.indexOf('项目组决定的<br />存货监盘方法');
assert.ok(confirmedMethodColumnIndex > arrangementsColumnIndex, 'confirmed method must remain after every switch-specific column');
assert.match(unifiedTableSource, /操作列暂时隐藏/);
const defaultColumnLabels = [
  '本期期末余额（百万元）',
  '存货盘存系统',
  '存货盘点方案',
  '第三方地点？',
  '项目组是否可以前往',
  '存货所在地点实施监盘',
  '客户是否开展盘点',
  '计划的审计方案',
  '样本数量',
];
let previousDefaultColumnIndex = unifiedTableSource.indexOf('{matrixView === null && <>');
for (const label of defaultColumnLabels) {
  const columnIndex = unifiedTableSource.indexOf(label, previousDefaultColumnIndex + 1);
  assert.ok(columnIndex > previousDefaultColumnIndex, `default column is missing or out of order: ${label}`);
  previousDefaultColumnIndex = columnIndex;
}
assert.match(methodMatrix, /openKoicPushModal: \(\) => void/);
assert.match(methodMatrix, /openLocationSettings: \(rowId: string\) => void/);
assert.match(inventoryMatrix, /onCreateTasks\?: \(\) => void/);
assert.match(inventoryMatrix, /onOpenLocationSettings\?: \(rowId: string\) => void/);
assert.match(inventoryMatrix, /footerRightContent\?: React\.ReactNode/);
assert.match(preWpJuly, /footerRightContent=\{/);
assert.equal((preWpJuly.match(/创建程序/g) ?? []).length, 1);
assert.doesNotMatch(preWpJuly, /renderTableContent=\{activePreWpJulyStage === 'plan'\}/);
assert.doesNotMatch(preWpJuly, />引言<\/h2>/);
assert.match(preWpJuly, /isWorkpaperIntroCollapsed \? '展开引言' : '收起引言'/);
assert.match(preWpJuly, /useState\(true\).*isWorkpaperIntroCollapsed|isWorkpaperIntroCollapsed, setIsWorkpaperIntroCollapsed\] = useState\(true\)/s);
assert.match(preWpJuly, /['"]inventory-step-note-7['"]/);
assert.match(preWpJuly, /id=\{`method-plan-step-file-\$\{step\.id\}`\}/);
assert.match(preWpJuly, /记录被审计单位的基本信息及相关存货金额/);
for (const basicField of ['存货风险等级', '所属行业', '行业细分', '本期预审阶段存货总额', '本期期末存货总额']) {
  assert.ok(preWpJuly.includes(basicField), `missing unnumbered basic inventory field: ${basicField}`);
}
assert.match(
  preWpJuly,
  /本期预审阶段存货总额[\s\S]*value=\{interimInventoryTotal\}[\s\S]*className="h-8 w-1\/2[\s\S]*本期期末存货总额[\s\S]*value=\{yearEndInventoryTotal\}[\s\S]*className="h-8 w-1\/2/,
  'the two inventory-total inputs should be half width without moving their labels'
);
for (const industry of ['房地产', '零售', '化工', '科技', '其他']) {
  assert.ok(preWpJuly.includes(`'${industry}'`), `missing industry option: ${industry}`);
}
assert.match(preWpJuly, /setIsMethodPlanPrepCollapsed\(true\)/);
assert.match(preWpJuly, /setActivePreWpJulyStage\('understand'\)/);
assert.match(preWpJuly, /inventorySectionRef\.current\?\.scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\)/);
assert.match(preWpJuly, /aria-label="快速步骤导航"/);
assert.match(
  preWpJuly,
  /function PreWpJulyCompactStepIndicator\(\{[\s\S]*showSave[\s\S]*onSave[\s\S]*saved/
);
const compactIndicatorSource = preWpJuly.slice(
  preWpJuly.indexOf('function PreWpJulyCompactStepIndicator'),
  preWpJuly.indexOf('function StepProcedureCell')
);
assert.match(
  compactIndicatorSource,
  /\{stages\.map[\s\S]*\{showSave && \([\s\S]*onClick=\{onSave\}[\s\S]*aria-label="保存"/
);
assert.match(compactIndicatorSource, /<Save size=\{15\}/);
assert.match(
  preWpJuly,
  /<PreWpJulyCompactStepIndicator[\s\S]*showSave=\{showFloatingSaveButton\}[\s\S]*onSave=\{handlePageSave\}[\s\S]*saved=\{inventoryStepsSaved\}/
);
assert.doesNotMatch(preWpJuly, /function PreWpJulyStepIndicator/);
assert.doesNotMatch(
  preWpJuly,
  /\{isWorkpaperHeaderPinned && \(\s*<PreWpJulyCompactStepIndicator/
);
assert.doesNotMatch(
  preWpJuly,
  /\{showFloatingSaveButton && \(\s*<button[\s\S]*fixed right-10 top-24/
);
assert.match(preWpJuly, /bg-white\/30.*backdrop-blur-md.*backdrop-saturate-150/);
assert.doesNotMatch(preWpJuly, /!isWorkpaperHeaderPinned && <div/);
assert.equal((preWpJuly.match(/导出底稿/g) ?? []).length, 1);
assert.match(
  preWpJuly,
  /<h2 className="shrink-0 border-l-\[5px\][\s\S]*>存货工作底稿<\/h2>[\s\S]*<Download size=\{14\}[\s\S]*导出底稿/
);
assert.match(preWpJuly, /right-full top-\[calc\([^\]]+\)\] mr-1.*text-\[9px\]/);
assert.match(preWpJuly, /order-1 -mt-3 ml-4 flex items-center justify-between/);
assert.match(preWpJuly, /\{!isMethodPlanPrepCollapsed && \(\s*<div className="ml-4 overflow-hidden rounded-lg/s);
assert.match(preWpJuly, /flex flex-col items-center leading-\[11px\]/);
assert.doesNotMatch(preWpJuly, /headerActions/);
assert.doesNotMatch(unifiedTableSource, /参与监盘①|参与监盘②|审计方案③/);
assert.match(inventoryMatrix, /confirmThirdPartyInventory: value === '否' \? '否' : row\.confirmThirdPartyInventory/);
assert.equal((inventoryMatrix.match(/handleThirdPartyStorageChange\(row\.id, event\.target\.value\)/g) ?? []).length, 2);
assert.equal((inventoryMatrix.match(/value=\{row\.auditApproach\}/g) ?? []).length, 2);
assert.match(preWpJuly, /col-span-2 grid grid-cols-3 gap-4/);
assert.doesNotMatch(inventoryMatrix, /Appendix [1-7]｜/);
for (const conciseMethodName of [
  '存货盘点-循环盘点',
  '存货盘点-全面实地盘点',
  '盘点-第三方地点',
  '存货盘点-独立盘点',
  '存货盘点-无法现场实施监盘的情形 & 独立盘点',
  '存货盘点-实地存货监盘不可行',
  '存货盘点-仅限于未识别出重大错报风险的ISA项目',
]) {
  assert.ok(inventoryProcedureRules.includes(`'${conciseMethodName}'`), `missing concise method label: ${conciseMethodName}`);
}
assert.doesNotMatch(inventoryProcedureRules, /Appendix/);
assert.match(
  inventoryProcedureRules,
  /getInventoryProcedureDisplayGroupIds[\s\S]*groupIds\.includes\(5\)[\s\S]*filter\(\(groupId\) => groupId !== 4\)/
);
assert.match(
  inventoryProcedureRules,
  /getInventoryProcedureDisplayLabels[\s\S]*getInventoryProcedureDisplayGroupIds\(groupIds\)/
);
assert.match(
  inventoryMatrix,
  /getInventoryProcedureDisplayLabels\(decision\.groupIds\)/
);
assert.match(
  methodMatrix,
  /INVENTORY_PROCEDURE_METHOD_LABELS[\s\S]*id: 1, label: INVENTORY_PROCEDURE_METHOD_LABELS\[1\][\s\S]*id: 7, label: INVENTORY_PROCEDURE_METHOD_LABELS\[7\]/
);
assert.match(
  methodMatrix,
  /getInventoryProcedureDisplayGroupIds\(getInventoryProcedureDecision\(row\)\.groupIds\)\.includes\(group\.id\)/
);
for (const methodName of [
  '采取控制测试方案或双重目的的方案对管理层的循环盘点实施程序',
  '采取实质性方案、控制测试方案或双重目的的方案对管理层的全面实地盘点实施程序',
  '就存放于第三方地点的存货获取证据',
  '存货盘点-独立盘点（不可预见情形仅适用 4.1、4.4、4.5）',
  '当项目组因不可预见的情况而无法在管理层存货盘点现场实施监盘时，实施的程序',
  '如果在存货盘点现场实施存货监盘不可行时，实施的替代程序',
  '仅限于 ISA 项目，当与存货数量和状况有关的风险未被评估为重大错报风险但存货对财务报表重要时，参加管理层存货盘点时实施的程序',
]) {
  assert.ok(inventoryMatrix.includes(`'${methodName}'`), `missing confirmed method option: ${methodName}`);
}
assert.match(inventoryMatrix, /function DerivedInventoryMethodCell/);
assert.match(inventoryMatrix, /const auditApproach = resolveInventoryAuditApproach\(row\)/);
assert.match(inventoryMatrix, /<DerivedInventoryMethodCell row=\{row\} \/>/);
assert.doesNotMatch(unifiedTableSource, /value=\{row\.confirmedInventoryMethod\} options=\{CONFIRMED_INVENTORY_METHOD_OPTIONS\}/);
assert.match(unifiedTableSource, /<ReadOnlyInventoryValue value=\{row\.systemType\} \/>/);
assert.match(unifiedTableSource, /<ReadOnlyInventoryValue value=\{row\.countMethod\} \/>/);
const defaultHeaderSource = unifiedTableSource.slice(
  unifiedTableSource.indexOf('{matrixView === null && <>', unifiedTableSource.indexOf('<thead')),
  unifiedTableSource.indexOf("{(matrixView === 'balance'", unifiedTableSource.indexOf('<thead'))
);
assert.doesNotMatch(defaultHeaderSource, /发出函证/);
assert.match(inventoryMatrix, /const isAllColumnsView = matrixView === 'all'/);
assert.match(inventoryMatrix, /isAllColumnsView \? 22/);
assert.match(
  inventoryMatrix,
  /function CenteredLeftHeaderText[\s\S]*inline-block text-left[\s\S]*\{children\}/,
  'inventory headers should center their text block while left-aligning wrapped lines'
);
assert.match(
  inventoryMatrix,
  /<CenteredLeftHeaderText>被审计单位的<br \/>存货盘存系统<\/CenteredLeftHeaderText>/,
  'multiline inventory headers should use the centered-left text wrapper'
);
assert.equal(
  (inventoryMatrix.match(/className="inline-flex min-h-\[38px\] flex-col items-start justify-center gap-0\.5 text-left leading-tight"/g) ?? []).length,
  2,
  'sortable and selectable amount headers should center an intrinsic-width group with left-aligned lines'
);
assert.match(
  inventoryMatrix,
  /const ALL_VIEW_TABLE_WIDTH = 2811;/,
  'all-columns table width should include the widened selectable current-balance column'
);
assert.match(
  inventoryMatrix,
  /const ALL_VIEW_SCROLL_COLUMN_WIDTHS = \[\s*101, 46, 54/,
  'all-columns scroll calculations should use the widened current-balance column'
);
assert.match(
  inventoryMatrix,
  /matrixView === null && <><col style=\{\{ width: '94px' \}\}/,
  'default view should widen the selectable current-balance column by 15 percent'
);
assert.match(
  inventoryMatrix,
  /\(matrixView === 'balance' \|\| isAllColumnsView\) && <><col style=\{\{ width: '101px' \}\}/,
  'balance and all-columns views should widen the selectable current-balance column by 15 percent'
);
assert.doesNotMatch(unifiedTableSource, /计划引入专家<br \/>和\/或特定项目组成员/);
assert.match(inventoryMatrix, /function CircularSelectionCheckbox/);
assert.match(inventoryMatrix, /ariaLabel="全选当前筛选结果"/);
assert.match(inventoryMatrix, /aria-label="筛选是否选为盘点对象"/);
assert.match(inventoryMatrix, /<option value="yes">是<\/option>/);
assert.match(inventoryMatrix, /<option value="no">否<\/option>/);
assert.match(inventoryMatrix, /className="absolute inset-0 h-full w-full cursor-pointer opacity-0"/);
assert.match(inventoryMatrix, /onClick=\{openBulkEditModal\}/);
assert.match(preWpJuly, /模板导入/);
assert.doesNotMatch(preWpJuly, /模板 \/ 导入/);
assert.match(inventoryMatrix, /编辑\{selectedRowIds\.length > 0/);
assert.match(inventoryMatrix, /matrixView === null \|\| matrixView === 'monitoring' \|\| isAllColumnsView/);
assert.match(inventoryMatrix, />批量编辑<\/h3>/);
assert.match(
  inventoryMatrix,
  /const removeRowFromBulkSelection = \(rowId: string\)[\s\S]*setSelectedRowIds\(nextSelectedRowIds\)/,
  'bulk edit location chips should be removable from the current selection'
);
assert.match(
  inventoryMatrix,
  /aria-label=\{`将\$\{row\.companyName \|\| `地点 \$\{index \+ 1\}`\}移出批量编辑`\}/,
  'each selected location should expose an accessible remove button'
);
assert.match(
  inventoryMatrix,
  /const handleBulkSampleSelectionChange = \(checked: boolean\)[\s\S]*rowIds: rowsChangingToNo\.map\(\(row\) => row\.id\)/,
  'the bulk sample checkbox should update every selected location through one batch flow'
);
assert.match(
  inventoryMatrix,
  /已选择的地点[\s\S]*checked=\{allSelectedRowsAreSamples\}[\s\S]*indeterminate=\{someSelectedRowsAreSamples\}[\s\S]*onChange=\{handleBulkSampleSelectionChange\}[\s\S]*是否选为盘点对象/,
  'the bulk sample checkbox should sit on the selected-locations header line'
);
assert.match(
  inventoryMatrix,
  /onClick=\{removeSelectedRows\}[\s\S]*ml-1 inline-flex h-8[\s\S]*border-red-200 bg-red-50[\s\S]*删除/,
  'the pale-red selected-row delete action should remain visibly fixed beside edit'
);
assert.doesNotMatch(inventoryMatrix, /group-hover\/edit-actions|group-focus-within\/edit-actions|group\/edit-actions/);
assert.match(inventoryMatrix, /仅实际修改的字段会应用到这些地点/);
assert.match(inventoryMatrix, /已选择的地点/);
assert.match(inventoryMatrix, /isBulkEditLocationsExpanded/);
assert.match(inventoryMatrix, /setIsBulkEditLocationsExpanded\(false\)/);
assert.doesNotMatch(inventoryMatrix, /max-h-32 divide-y divide-slate-100 overflow-y-auto/);
assert.match(inventoryMatrix, /config\.side === side/);
assert.match(inventoryMatrix, /placeholder="请输入样本数量"/);
assert.match(inventoryMatrix, /label: '存货盘存系统'/);
assert.match(inventoryMatrix, /label: '存货盘点方法'/);
assert.doesNotMatch(inventoryMatrix, /关联的第三方地点取证/);
for (const attendanceOption of [
  '是',
  '否，存在因不可预见的情况，而无法现场实施监盘的情形',
  '否，存货盘点现场实施存货监盘不可行',
]) {
  assert.ok(inventoryMatrix.includes(`'${attendanceOption}'`), `missing attendance option: ${attendanceOption}`);
}
assert.match(inventoryMatrix, /项目组前往当日<br \/>客户是否开展盘点/);
assert.match(inventoryMatrix, /被审计单位如何确认<br \/>期末存货余额/);
assert.match(inventoryMatrix, /被审计单位如何计划<br \/>具体存货盘点/);
assert.match(
  inventoryMatrix,
  /currentAmountColumnLeft[\s\S]*hasStickyCurrentAmount[\s\S]*renderSelectableCurrentAmountHeader\(\)[\s\S]*style=\{\{ left: currentAmountColumnLeft \}\}/,
  'the selectable current-period balance column should remain fixed on the left'
);
assert.match(inventoryMatrix, /hasStickyCurrentAmount = [^;]*matrixView === 'monitoring'/);
assert.ok(
  inventoryMatrix.includes("matrixView === 'monitoring' && <th className={`${headerCellClassName} ${stickyIdentityHeaderClassName} ${stickyIdentityBoundaryClassName}`} style={{ left: currentAmountColumnLeft }}>{renderAmountHeader('本期期末余额（百万元）', 'finalPlannedBalance')}</th>"),
  'the monitoring-method view should include a fixed final-balance header'
);
assert.match(
  inventoryMatrix,
  /matrixView === 'monitoring' && <td className=\{`\$\{yellowCellClassName\} \$\{stickyIdentityCellClassName\} \$\{stickyIdentityBoundaryClassName\}`\} style=\{\{ left: currentAmountColumnLeft \}\}>[\s\S]*rawValue=\{row\.finalPlannedBalance\}/,
  'the monitoring-method view should include fixed editable final-balance values'
);
assert.match(
  inventoryMatrix,
  /stickyRightHeaderClassName[\s\S]*项目组决定的<br \/>存货监盘方法[\s\S]*stickyRightCellClassName[\s\S]*DerivedInventoryMethodCell/,
  'the derived inventory-count method should remain fixed as the final right column'
);
assert.match(
  inventoryMatrix,
  /const ATTENDANCE_DAY_OPTIONS = \['是', INDEPENDENT_ATTENDANCE_VALUE\]/
);
assert.match(
  inventoryMatrix,
  /function resolveAttendanceDayValue\(plannedAttendancePrimary: string\)[\s\S]*plannedAttendancePrimary === '是' \? '是' : ''/
);
assert.match(
  inventoryMatrix,
  /plannedAttendanceSecondary: resolveAttendanceDayValue\(value\)/
);
assert.match(
  inventoryMatrix,
  /value=\{row\.plannedAttendanceSecondary\}[\s\S]*disabled=\{row\.plannedAttendancePrimary !== '是'\}/
);
assert.match(
  inventoryMatrix,
  /row\.plannedAttendancePrimary !== '是' && <option value="" \/>/
);
assert.match(inventoryMatrix, /ATTENDANCE_DAY_OPTIONS\.map/);
assert.match(
  inventoryMatrix,
  /row\.plannedAttendanceSecondary === '否，项目组采取独立盘点'/
);
assert.match(inventoryMatrix, /'独立盘点方案'/);
assert.equal(
  (inventoryMatrix.match(/handleAttendanceDayChange\(row\.id, event\.target\.value\)/g) ?? []).length,
  2,
  'both table render paths should apply the attendance-day audit approach rule'
);
assert.equal(
  (inventoryMatrix.match(/disabled=\{row\.plannedAttendancePrimary !== '是' \|\| row\.plannedAttendanceSecondary === INDEPENDENT_ATTENDANCE_VALUE\}/g) ?? []).length,
  2,
  'both table render paths should lock unavailable and generated audit approaches'
);
assert.match(
  inventoryMatrix,
  /config\.field === 'plannedAttendanceSecondary'[\s\S]*auditApproach: resolveAuditApproachForAttendanceDay\(value\)/
);
assert.match(
  inventoryMatrix,
  /const isIndependentAttendance = bulkEditValues\.plannedAttendanceSecondary === INDEPENDENT_ATTENDANCE_VALUE/
);
assert.match(
  inventoryMatrix,
  /isIndependentAttendance && config\.field === 'auditApproach'/
);
assert.match(
  preWpJuly,
  /plannedAttendanceSecondary: row\.auditApproach === '独立盘点方案' \? '否，项目组采取独立盘点' : '是'/
);
assert.match(
  inventoryMatrix,
  /nextRow\.plannedAttendancePrimary !== '是'[\s\S]*nextRow\.plannedAttendanceSecondary = ''[\s\S]*nextRow\.auditApproach = ''/
);
assert.doesNotMatch(
  inventoryMatrix,
  /plannedAttendancePrimary === '是' \? row\.plannedAttendanceSecondary : '否'/
);
assert.match(inventoryMatrix, /disabled=\{row\.plannedAttendancePrimary !== '是'\}/);
assert.match(inventoryMatrix, /const bodyCellClassName =\s*'[^']*text-center/);
assert.match(inventoryMatrix, /const amountInputClassName =\s*'[^']*text-center/);
assert.match(
  inventoryMatrix,
  /function DerivedInventoryMethodCell[\s\S]*?<div className="[^"]*items-center[^"]*text-center text-\[11px\]/
);
assert.equal(
  (inventoryMatrix.match(/\[&_td\]:text-center/g) ?? []).length,
  2,
  'both July matrix table roots should center cells'
);
assert.equal(
  (inventoryMatrix.match(/\[&_input\]:text-center/g) ?? []).length,
  2,
  'both July matrix table roots should center inputs'
);
assert.equal(
  (inventoryMatrix.match(/\[&_select\]:text-left/g) ?? []).length,
  0,
  'table roots should not override value-based select alignment'
);
assert.equal(
  (inventoryMatrix.match(/table-fixed border-collapse bg-white text-\[11px\]/g) ?? []).length,
  2,
  'both July matrix table roots should default body content to 11px'
);
assert.equal((inventoryMatrix.match(/\[&_select\]:text-center/g) ?? []).length, 0);
assert.match(inventoryMatrix, /const selectClassName =\s*'[^']*text-\[11px\]/);
assert.match(
  inventoryMatrix,
  /function WrappedInventorySelect[\s\S]*text-\[11px\][\s\S]*getInventorySelectionAlignment\(value\)/
);
assert.doesNotMatch(inventoryMatrix, /align="center"/);
assert.doesNotMatch(inventoryMatrix, /font-mono text-\[12px\]/);
assert.match(inventoryMatrix, /const calculatedCellClassName =\s*'[^']*text-\[11px\][^']*font-semibold/);
assert.match(
  inventoryMatrix,
  /function getInventorySelectionAlignment\(value: string\)[\s\S]*value !== SELECT_PLACEHOLDER[\s\S]*normalizedValue\.length <= 8[\s\S]*\? 'text-center'[\s\S]*: 'text-left'/
);
assert.match(inventoryMatrix, /className=\{`\$\{selectClassName\} \$\{getInventorySelectionAlignment\(row\.selectedAsSample\)\}`\}/);
assert.doesNotMatch(inventoryMatrix, /align="left"/);
const bulkEditDialogSource = inventoryMatrix.slice(
  inventoryMatrix.indexOf('{isBulkEditOpen && ('),
  inventoryMatrix.indexOf('{pendingSampleChange && (')
);
assert.match(
  inventoryMatrix,
  /function WrappedInventorySelect[\s\S]*isOptionDisabled\?\.\(option\)/,
  'wrapped table selects should support disabling an individual option'
);
assert.ok(
  (inventoryMatrix.match(/isAuditApproachOptionDisabled\(/g) ?? []).length >= 3,
  'the table variants and bulk edit dialog should share the audit-approach option rule'
);
assert.match(
  bulkEditDialogSource,
  /isAttendanceDependentFieldLocked && <option value="" \/>/
);
assert.match(bulkEditDialogSource, /CircularSelectionCheckbox[\s\S]*是否选为盘点对象/);
assert.doesNotMatch(bulkEditDialogSource, /被审计单位信息|项目组监盘计划/);
for (const bulkEditLabel of [
  '被审计单位如何确认期末存货余额',
  '被审计单位如何计划具体存货盘点',
  '被审计单位是否使用专家',
  '存货所在地址是否可实施监盘',
  '项目组前往当日，客户是否开展盘点',
  '项目组就监盘而计划的审计方案',
  '样本数量',
]) {
  assert.ok(inventoryMatrix.includes(`label: '${bulkEditLabel}'`), `missing bulk edit field: ${bulkEditLabel}`);
}
assert.match(inventoryMatrix, /nextRow\.thirdPartyStorage === '否'/);
const auditApproachOptionsSource = inventoryMatrix.slice(
  inventoryMatrix.indexOf('const AUDIT_APPROACH_OPTIONS'),
  inventoryMatrix.indexOf('export const CONFIRMED_INVENTORY_METHOD_OPTIONS')
);
assert.match(auditApproachOptionsSource, /INDEPENDENT_AUDIT_APPROACH/);
assert.doesNotMatch(auditApproachOptionsSource, /由于不可预见|由于存货的性质/);
assert.match(preWpJuly, /onStageClick=\{navigateToStage\}/);
assert.match(preWpJuly, /scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\)/);
assert.match(preWpJuly, /className="relative order-1 -mt-4 scroll-mt-24 space-y-4"/);
assert.match(preWpJuly, /className="order-2 -mt-4 scroll-mt-24 space-y-4"/);
assert.match(preWpJuly, /className="order-3 ml-4 scroll-mt-24"/);
assert.doesNotMatch(preWpJuly, /\{activePreWpJulyStage === 'understand' && \(/);
assert.doesNotMatch(preWpJuly, /\{activePreWpJulyStage !== 'understand' && \(/);
assert.match(
  preWpJuly,
  /const visibleMethodPlanPrepSteps = steps\.filter\(\(step\) => \[1, 2, 3, 4, 5, 6, 7, 8\]\.includes\(step\.id\)\)/
);
assert.doesNotMatch(preWpJuly, /const inventoryMatrixPrepSteps/);
assert.doesNotMatch(preWpJuly, /inventoryMatrixPrepSteps\.map/);
const understandingCardSource = preWpJuly.slice(preWpJuly.indexOf('visibleMethodPlanPrepSteps.map'));
assert.match(
  understandingCardSource,
  /\[3, 4, 7, 8\]\.includes\(step\.id\)[\s\S]*id=\{`method-plan-step-file-\$\{step\.id\}`\}/
);
assert.match(
  preWpJuly,
  /7: Object\.freeze\(\{\s*kaeg: Object\.freeze\(\['项目组对被审计单位存货的了解 \[7747\.6870\]'\]\),\s*workflow: Object\.freeze\(\[\]\),\s*\}\)/
);
assert.doesNotMatch(
  preWpJuly,
  /2\.1\.3 计划阶段的分析程序/
);
assert.match(
  understandingCardSource,
  /\[2, 3, 4, 5, 6, 7, 8\]\.includes\(step\.id\)[\s\S]*step\.id === 7 \? 'inventory-step-note-7'/
);
const understandingHeadingSource = preWpJuly.slice(
  preWpJuly.indexOf('了解被审计单位的存货\n          </h2>'),
  preWpJuly.indexOf('ref={methodPlanProgramSectionRef}')
);
assert.doesNotMatch(understandingHeadingSource, /setIsMethodPlanPrepCollapsed/);
assert.match(
  preWpJuly,
  /ref=\{methodPlanProgramSectionRef\}\s*className="relative order-1 -mt-4 scroll-mt-24 space-y-4"/
);
const understandingCardAnchorSource = preWpJuly.slice(preWpJuly.indexOf('ref={methodPlanProgramSectionRef}'));
assert.match(
  understandingCardAnchorSource,
  /setIsMethodPlanPrepCollapsed[\s\S]*className="absolute right-0 top-0 z-10 -translate-y-/
);
assert.match(
  preWpJuly,
  /shouldShowSubmit \? \([\s\S]*<button[\s\S]*onClick=\{\(\) => methodPlanMatrixRef\.current\?\.openKoicPushModal\(\)\}[\s\S]*创建程序/
);
assert.match(
  preWpJuly,
  /const visibleMethodPlanPrepSteps = steps\.filter\(\(step\) => \[1, 2, 3, 4, 5, 6, 7, 8\]\.includes\(step\.id\)\)/
);
assert.match(
  preWpJuly,
  /id: 8,[\s\S]*评价被审计单位使用抽样方法的适当性（如适用）进行存货盘点[^\n]*\[7748\]/
);
assert.match(
  preWpJuly,
  /const isMethodPlanPrepComplete =[\s\S]*entityRiskLevel[\s\S]*entityIndustry[\s\S]*entityIndustrySegment\.trim\(\)[\s\S]*interimInventoryTotal\.trim\(\)[\s\S]*yearEndInventoryTotal\.trim\(\)[\s\S]*isStepTwoComplete[\s\S]*\[2, 3, 4, 5, 6, 7, 8\]\.every/
);
assert.match(
  preWpJuly,
  /const handlePageSave = \(\) => \{[\s\S]*if \(isMethodPlanPrepComplete\) \{[\s\S]*setIsMethodPlanPrepCollapsed\(true\)/
);
assert.match(preWpJuly, /ref=\{inventorySectionRef\} className="order-2 -mt-4 scroll-mt-24 space-y-4"/);
const planHeaderSource = preWpJuly.slice(
  preWpJuly.indexOf('<div ref={planSectionRef}'),
  preWpJuly.indexOf('{hasConfirmedKoicPush && (')
);
assert.doesNotMatch(planHeaderSource, /<h2/);
assert.match(planHeaderSource, /确定项目组的存货监盘方法[^\n]*header[^\n]*hidden/);
assert.ok(
  (preWpJuly.match(/项目组选定的存货监盘方法/g) ?? []).length >= 2,
  'the selected-method heading and fullscreen title should use the new wording'
);
const inventoryMatrixPosition = preWpJuly.indexOf('<InventoryMatrix');
const sampleChangeReasonPosition = preWpJuly.indexOf('样本变更原因');
const understandingProgramPosition = preWpJuly.indexOf('ref={methodPlanProgramSectionRef}');
assert.ok(
  inventoryMatrixPosition < sampleChangeReasonPosition && sampleChangeReasonPosition < understandingProgramPosition,
  'sample change reasons should render directly below the inventory matrix and before the understanding program card'
);
assert.match(
  inventoryMatrix,
  /const EMPTY_BULK_EDIT_VALUES:[\s\S]*endingBalanceConfirmation: SELECT_PLACEHOLDER[\s\S]*inventoryCountPlan: SELECT_PLACEHOLDER[\s\S]*useExpert: SELECT_PLACEHOLDER[\s\S]*plannedAttendancePrimary: SELECT_PLACEHOLDER[\s\S]*plannedAttendanceSecondary: SELECT_PLACEHOLDER[\s\S]*auditApproach: SELECT_PLACEHOLDER[\s\S]*sampleQuantity: ''/
);
assert.match(
  inventoryMatrix,
  /const openBulkEditModal = \(\) => \{[\s\S]*setBulkEditValues\(\{ \.\.\.EMPTY_BULK_EDIT_VALUES \}\)[\s\S]*setIsBulkEditOpen\(true\)/
);
assert.match(
  bulkEditDialogSource,
  /const isAttendanceDependentFieldLocked =[\s\S]*\(config\.field === 'plannedAttendanceSecondary' \|\|[\s\S]*config\.field === 'auditApproach'\)/
);
assert.match(
  bulkEditDialogSource,
  /plannedAttendancePrimary: value[\s\S]*plannedAttendanceSecondary: isAttendanceUnavailable[\s\S]*\? ''[\s\S]*auditApproach: isAttendanceUnavailable \? ''/
);
assert.match(
  bulkEditDialogSource,
  /<option value=\{SELECT_PLACEHOLDER\}>\{SELECT_PLACEHOLDER\}<\/option>[\s\S]*config\.options\.filter\(\(option\) => option !== SELECT_PLACEHOLDER\)/
);
assert.match(
  inventoryMatrix,
  /if \(nextRow\.plannedAttendancePrimary !== '是' && nextRow\.plannedAttendancePrimary !== SELECT_PLACEHOLDER\) \{[\s\S]*nextRow\.plannedAttendanceSecondary = '';[\s\S]*nextRow\.auditApproach = '';/
);
assert.match(preWpJuly, /const openInventoryBulkImport = \(\) => \{[\s\S]*openBulkImportModal\(\)/);
assert.match(preWpJuly, /bulkImportMode="locations"/);
assert.match(methodMatrix, /\{isBulkImportOpen && \([\s\S]*onClick=\{closeBulkImportModal\}[\s\S]*onClick=\{confirmBulkImport\}/);
assert.match(methodMatrix, /const taskEligibleRows = rows\.filter\(\(row\) => !isInventorySampleExcluded\(row\.selectedAsSample\)\)/);
assert.match(methodMatrix, /const sampleExcludedLocationCount = rows\.length - taskEligibleRows\.length/);
assert.match(methodMatrix, /存在未被选为盘点对象的地点，这些地点不会发布为任务。/);
assert.match(methodMatrix, /sampleExcludedLocationCount > 0 &&/);
assert.doesNotMatch(methodMatrix, /sampleExcludedRows\.map|excludedSampleRows\.map/);
const methodPlanPrepStepsSource = preWpJuly.slice(
  preWpJuly.indexOf('const steps: StepItem[] = ['),
  preWpJuly.indexOf('const visibleMethodPlanPrepSteps')
);
assert.match(
  methodPlanPrepStepsSource,
  /id: 1,[\s\S]*根据了解到的被审计单位存货性质信息进行勾选[\s\S]*PRE_WP_JULY_STEP_REFERENCES\[2\][\s\S]*id: 2,[\s\S]*displayNumber: 1,[\s\S]*询问管理层，了解并记录被审计单位的业务背景[\s\S]*PRE_WP_JULY_STEP_REFERENCES\[1\]/
);
assert.match(preWpJuly, /step\.displayNumber !== undefined \? `\$\{step\.displayNumber\}\. ` : ''/);
assert.match(preWpJuly, /step\.id === 1 && 'font-bold'/);
assert.match(preWpJuly, /const hasStepInputContent = \(stepId: number\) =>\s*stepId === 1/);
assert.match(preWpJuly, /\{\(step\.id === 2 \|\| step\.id === 7\) && <div className="space-y-0\.5">/);
assert.equal((preWpJuly.match(/step\.id === 1 &&/g) ?? []).length, 2, 'questionnaire controls should belong to question 1');
assert.match(preWpJuly, /\{\[2, 3, 4, 5, 6, 7, 8\]\.includes\(step\.id\) && \(/);
assert.match(preWpJuly, /aria-label="存货性质问卷与审计指引卡片"/);
assert.match(preWpJuly, /aria-label="存货性质问卷卡片一"/);
assert.match(preWpJuly, /aria-label="存货性质问卷卡片二"/);
assert.match(preWpJuly, /aria-label="存货性质问卷的分题"/);
assert.match(preWpJuly, /aria-label="存货性质问卷卡片分页"/);
assert.match(preWpJuly, /请完成存货性质问卷的全部分题/);
assert.match(preWpJuly, /subquestion\.id\.split\('\.'\)\.at\(-1\)/);
for (const subquestionId of ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6']) {
  assert.ok(preWpJuly.includes(`id: '${subquestionId}'`), `missing renumbered subquestion: ${subquestionId}`);
}
assert.doesNotMatch(preWpJuly, /id: '2\.[1-6]'/);
assert.equal((inventoryMatrix.match(/项目组是否可以前往<br \/>存货所在地点实施监盘/g) ?? []).length, 2);
assert.doesNotMatch(inventoryMatrix, /<CenteredLeftHeaderText>存货所在地址<br \/>是否可实施监盘<\/CenteredLeftHeaderText>/);
