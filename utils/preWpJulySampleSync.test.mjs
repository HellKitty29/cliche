import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const preWpJuly = readFileSync(new URL('../components/PreWpJuly.tsx', import.meta.url), 'utf8');
const methodPlanMatrixJuly = readFileSync(
  new URL('../components/MethodPlanMatrixJuly.tsx', import.meta.url),
  'utf8'
);
const renderedMethodPlanMatrixJuly = methodPlanMatrixJuly.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const inventoryMatrixJuly = readFileSync(
  new URL('../components/InventoryMatrixJuly.tsx', import.meta.url),
  'utf8'
);

assert.match(
  methodPlanMatrixJuly,
  /const BULK_IMPORT_HEADER_ITEMS = \[[\s\S]*id: 'companyName'[\s\S]*id: 'intervieweeName'[\s\S]*id: 'category'[\s\S]*id: 'endingBalanceConfirmation'[\s\S]*id: 'systemType'[\s\S]*id: 'thirdPartyStorage'[\s\S]*id: 'inventoryCountPlan'[\s\S]*id: 'countMethod'[\s\S]*id: 'useExpert'[\s\S]*id: 'selectedAsSample'[\s\S]*id: 'priorBalance'[\s\S]*id: 'priorInterimPlannedBalance'[\s\S]*id: 'interimPlannedBalance'[\s\S]*id: 'finalBalance'/,
  'table-one bulk import headers should omit location and keep balance columns at the far right'
);

for (const label of [
  '被审计单位是如何确认期末存货余额的？',
  '期末存货余额通过存货出入库和移动的记录来确认',
  '期末存货余额通过期末实施的实地盘点结果来确定',
]) {
  assert.ok(
    methodPlanMatrixJuly.includes(label),
    `table-one bulk import should expose: ${label}`
  );
}

for (const label of [
  '被审计单位是如何具体计划存货盘点的？',
  '在期末实施的、盘点对象为整个存货总体的实地存货盘点',
  '在期末以外的特定日期实施的、盘点对象为整个存货总体的实地存货盘点',
  '在整个会计期间内，定期进行的存货盘点',
  '在一年中不同时间实施的、盘点对象为每一存放地点实施的实地存货盘点',
  '在一年中不同时间实施的、按存货项目储位 (如存储箱、分隔间、货架、行) 为每一存放单位实施的实地存货盘点',
]) {
  assert.ok(methodPlanMatrixJuly.includes(label), `table-one bulk import should expose: ${label}`);
}

assert.match(
  methodPlanMatrixJuly,
  /getCountMethodFromInventoryCountPlan[\s\S]*在期末完成盘点[\s\S]*在非期末时点完成盘点[\s\S]*循环盘点[\s\S]*synchronizeInventoryCountPlanMethod/,
  'the detailed inventory count plan should automatically derive the count method'
);

assert.match(
  methodPlanMatrixJuly,
  /getSystemTypeFromEndingBalanceConfirmation[\s\S]*存货出入库和移动的记录[\s\S]*PERPETUAL_SYSTEM_TYPE[\s\S]*期末实施的实地盘点结果[\s\S]*PERIODIC_SYSTEM_TYPE[\s\S]*synchronizeEndingBalanceSystemType/,
  'ending-balance confirmation should automatically derive the inventory system type'
);

assert.match(
  inventoryMatrixJuly,
  /被审计单位是如何确认期末存货余额的？[\s\S]*被审计单位是否使用[\s\S]*被审计单位是如何具体计划存货盘点的？[\s\S]*被审计单位的存货盘点方法/,
  'table one should visibly render both detailed planning columns before their derived columns'
);

assert.match(
  inventoryMatrixJuly,
  /handleEndingBalanceConfirmationChange[\s\S]*endingBalanceConfirmation: value, systemType[\s\S]*handleInventoryCountPlanChange[\s\S]*inventoryCountPlan: value, countMethod/,
  'visible table-one selections should continue to update their derived system and count-method columns'
);

assert.doesNotMatch(
  methodPlanMatrixJuly,
  /id: 'location-list'|label: '地点'/,
  'table-one bulk import should remove the location column from its schema and upload window'
);

assert.match(
  preWpJuly,
  /const hasInventoryImportContent[\s\S]*row\.companyName[\s\S]*row\.intervieweeName[\s\S]*const isEmptyInventoryImportTarget[\s\S]*filter\(hasInventoryImportContent\)[\s\S]*findIndex\(isEmptyInventoryImportTarget\)[\s\S]*return nextRows\.filter\(hasInventoryImportContent\)/,
  'table-one import merge should use visible business fields and remove unused placeholder rows'
);

assert.match(
  methodPlanMatrixJuly,
  /case 'systemType':[\s\S]*return row\.importedSystemType[\s\S]*case 'thirdPartyStorage':[\s\S]*return row\.importedThirdPartyStorage[\s\S]*case 'countMethod':[\s\S]*return row\.countMethod[\s\S]*case 'useExpert':[\s\S]*return row\.importedUseExpert[\s\S]*case 'selectedAsSample':[\s\S]*return row\.selectedAsSample/,
  'bulk import serialization should include the table-one answer fields and selectedAsSample'
);

assert.match(
  methodPlanMatrixJuly,
  /derivedSystemType = getSystemTypeFromEndingBalanceConfirmation[\s\S]*derivedCountMethod = getCountMethodFromInventoryCountPlan[\s\S]*countMethod: derivedCountMethod \|\| record\.countMethod \|\| '在期末完成盘点'[\s\S]*importedSystemType: derivedSystemType \|\| record\.systemType \|\| ''[\s\S]*importedThirdPartyStorage: record\.thirdPartyStorage \?\? ''[\s\S]*importedUseExpert: record\.useExpert \?\? ''[\s\S]*selectedAsSample: record\.selectedAsSample \?\? '否'/,
  'bulk import parsing should preserve table-one answer fields and treat empty selectedAsSample as no'
);

assert.match(
  methodPlanMatrixJuly,
  /const LOCKED_LOCATION_BULK_IMPORT_HEADER_IDS = \['companyName', 'intervieweeName'\] as const;[\s\S]*const \[lockedBulkImportHeaderIds, setLockedBulkImportHeaderIds\] = useState<string\[\]>\(\[\]\);[\s\S]*setLockedBulkImportHeaderIds\(\[\.\.\.LOCKED_LOCATION_BULK_IMPORT_HEADER_IDS\]\)/,
  'location bulk import should lock the first two data columns after saving'
);

assert.match(
  methodPlanMatrixJuly,
  /readOnly=\{[\s\S]*header\.id === 'index'[\s\S]*isBulkImportHeaderLocked\(header\.id\)[\s\S]*read-only:bg-gray-50/,
  'locked bulk import columns should render as gray read-only inputs'
);

assert.match(
  methodPlanMatrixJuly,
  /sampleQuantity: string;/,
  'method plan rows should include sample quantity'
);

assert.match(
  methodPlanMatrixJuly,
  /selectedAsSample: '是'[\s\S]*sampleQuantity: ''/,
  'new method plan rows should default sample quantity to empty'
);

assert.doesNotMatch(
  renderedMethodPlanMatrixJuly,
  />是否被毕马威选为盘点对象<\/th>/,
  'method plan table should not display sample selection header'
);

assert.doesNotMatch(
  renderedMethodPlanMatrixJuly,
  /value=\{row\.selectedAsSample\}[\s\S]*updateRow\(row\.id, 'selectedAsSample', value\)/,
  'method plan table should not display sample selection cells'
);

assert.match(
  renderedMethodPlanMatrixJuly,
  /本期期末余额（百万元）[\s\S]*本期预审阶段余额（百万元）[\s\S]*>样本数量<\/th>[\s\S]*formatMethodPlanWebAmount\(row\.importedFinalBalance\)[\s\S]*formatMethodPlanWebAmount\(row\.importedInterimPlannedBalance\)[\s\S]*value=\{row\.sampleQuantity\}/,
  'method plan table should replace visible address columns with the two scaled balance columns before sample quantity'
);

assert.doesNotMatch(
  renderedMethodPlanMatrixJuly,
  />计划的监盘日期<\/th>[\s\S]*>提交底稿日期<\/th>/,
  'method plan table should not display planned count and workpaper submission date headers'
);

assert.doesNotMatch(
  renderedMethodPlanMatrixJuly,
  /value=\{row\.plannedDate\}[\s\S]*updateRow\(row\.id, 'plannedDate'[\s\S]*value=\{row\.submissionDate\}[\s\S]*updateRow\(row\.id, 'submissionDate'/,
  'method plan table should not display planned count and workpaper submission date cells'
);

assert.match(
  methodPlanMatrixJuly,
  /function MethodPlanKButton[\s\S]*h-4 w-4[\s\S]*border border-\[#00338D\] bg-\[#00338D\][\s\S]*text-\[10px\] font-semibold[\s\S]*text-white[\s\S]*毕马威就监盘而计划的审计方案[\s\S]*<MethodPlanKButton[\s\S]*className="ml-1 align-middle"[\s\S]*label=\{METHOD_PLAN_AUDIT_APPROACH_KAEG_REFERENCE\}/,
  'method plan K buttons should use the larger original blue inline style'
);

assert.match(
  methodPlanMatrixJuly,
  /METHOD_PLAN_AUDIT_APPROACH_KAEG_REFERENCE[\s\S]*项目组不可以采取实质性方案，对管理层的循环盘点结果进行测试[\s\S]*如果项目组在应对存货数量和状况的重大错报风险[\s\S]*独立盘点方案实施程序。 \[ISA \| 7746\.8389\]/,
  'method plan audit approach K button should include the full audit approach guidance'
);

assert.match(
  methodPlanMatrixJuly,
  /METHOD_PLAN_NON_SIGNIFICANT_RISK_INFO[\s\S]*当与存货的数量和状况相关的风险未被评估为重大错报风险[\s\S]*存货监盘过程中实施程序”\[7749\]/,
  'method plan should define the non-significant risk i button guidance'
);

assert.match(
  methodPlanMatrixJuly,
  /METHOD_PLAN_MONITOR_MODE_INFO[\s\S]*在允许使用实时视频技术的情况下[\s\S]*司法管辖区是否允许使用实时视频技术[\s\S]*“在确定现场监盘与远程监盘的存货盘点场次时，考虑哪些因素？”\[7746\.9174\][\s\S]*现场监盘或视频执行存货监盘时需要考虑的因素的进一步信息/,
  'method plan should define the on-site versus remote monitoring i button guidance'
);

assert.match(
  methodPlanMatrixJuly,
  /METHOD_PLAN_EXPERTS_INFO[\s\S]*KPMG Clara workflow 的1\.1\.2“战略和审计计划”[\s\S]*METHOD_PLAN_INTERNAL_AUDIT_INFO[\s\S]*KPMG Clara workflow的1\.1\.4“内部审计”/,
  'method plan should define expert and internal audit i button guidance'
);

assert.match(
  methodPlanMatrixJuly,
  /function MethodPlanInfoButton[\s\S]*group\/info[\s\S]*rounded-full[\s\S]*>\s*i\s*<span/,
  'method plan should render reusable i buttons'
);

assert.match(
  methodPlanMatrixJuly,
  /const \[isHomogeneousLocationPopupOpen, setIsHomogeneousLocationPopupOpen\] = useState\(false\);[\s\S]*const \[pendingMethodPlanAction, setPendingMethodPlanAction\] = useState<'bulkImport' \| null>\(null\);[\s\S]*const \[hasTriggeredHomogeneousLocationPopup, setHasTriggeredHomogeneousLocationPopup\] = useState\(false\);/,
  'method plan table should keep homogeneous-location popup state, pending bulk import action, and first-trigger state'
);

assert.match(
  methodPlanMatrixJuly,
  /const METHOD_PLAN_POPUP_FIELD_CONFIGS[\s\S]*field: 'auditApproach'[\s\S]*毕马威就监盘而计划的审计方案[\s\S]*field: 'useInternalAudit'[\s\S]*项目组是否计划利用内部审计工作获取审计证据/,
  'homogeneous-location popup should expose the remaining table-two answer fields'
);

assert.doesNotMatch(
  methodPlanMatrixJuly,
  /const METHOD_PLAN_POPUP_FIELD_CONFIGS[\s\S]*field: 'countMethod'/,
  'homogeneous-location popup should not ask for inventory count method'
);

assert.doesNotMatch(
  methodPlanMatrixJuly,
  /const METHOD_PLAN_POPUP_FIELD_CONFIGS[\s\S]*field: 'feasibility'/,
  'homogeneous-location popup should not ask whether physical observation is feasible'
);

assert.doesNotMatch(
  renderedMethodPlanMatrixJuly,
  /选择存货监盘方法|inventoryObservationMethod/,
  'method plan table and homogeneous-location popup should not display inventory observation method'
);

assert.doesNotMatch(
  renderedMethodPlanMatrixJuly,
  />被审计单位的存货盘点方法<\/th>[\s\S]*value=\{row\.countMethod\}/,
  'method plan table should not display inventory count method header or cells'
);

assert.match(
  methodPlanMatrixJuly,
  /const stickyLeftCellClassNames = \[[\s\S]*'sticky left-0 z-30 bg-clip-padding'[\s\S]*'sticky left-\[32px\] z-30 bg-clip-padding'[\s\S]*'sticky left-\[137px\] z-30 bg-clip-padding shadow-\[10px_0_14px_-10px_rgba\(15,23,42,0\.45\)\]'[\s\S]*\] as const;[\s\S]*const stickyRightCellClassName = 'sticky right-0 z-30 bg-clip-padding shadow-\[-10px_0_14px_-10px_rgba\(15,23,42,0\.45\)\]';/,
  'method plan fixed columns should be index, company name, interviewee name, and operation only'
);

assert.match(
  methodPlanMatrixJuly,
  /className="overflow-x-auto overflow-y-hidden overscroll-x-none \[scrollbar-width:thin\] \[&::-webkit-scrollbar\]:h-1\.5"[\s\S]*<table className="w-full min-w-\[1095px\] table-fixed border-separate border-spacing-0 text-\[13px\]"[\s\S]*<col className="w-\[32px\]" \/>[\s\S]*<col className="w-\[105px\]" \/>[\s\S]*<col className="w-\[120px\]" \/>[\s\S]*<col className="w-\[105px\]" \/>[\s\S]*<col className="w-\[115px\]" \/>[\s\S]*<col className="w-\[55px\]" \/>[\s\S]*<col className="w-\[155px\]" \/>[\s\S]*<col className="w-\[120px\]" \/>[\s\S]*<col className="w-\[120px\]" \/>[\s\S]*<col className="w-\[120px\]" \/>[\s\S]*<col className="w-\[48px\]" \/>/,
  'method plan table should size the two balance columns and keep a matching minimum width'
);

assert.match(
  methodPlanMatrixJuly,
  /const METHOD_PLAN_WEB_AMOUNT_SCALE = 0\.0000001;[\s\S]*function formatMethodPlanWebAmount[\s\S]*amount \* METHOD_PLAN_WEB_AMOUNT_SCALE/,
  'method plan balance columns should use the same web-only amount scale as table one'
);

assert.match(
  methodPlanMatrixJuly,
  /const \[methodPlanSearchTerm, setMethodPlanSearchTerm\] = useState\(''\);[\s\S]*const normalizedMethodPlanSearchTerm = methodPlanSearchTerm\.trim\(\)\.toLowerCase\(\);[\s\S]*const filteredMethodPlanRows = normalizedMethodPlanSearchTerm[\s\S]*row\.companyName[\s\S]*row\.companyOwner[\s\S]*row\.province[\s\S]*row\.city[\s\S]*row\.district[\s\S]*row\.address/,
  'method plan table should keep a search term and filter by company, interviewee, and location fields'
);

assert.match(
  methodPlanMatrixJuly,
  /import \{[\s\S]*Search[\s\S]*\} from 'lucide-react';[\s\S]*const renderTable = \(\) => \([\s\S]*<div className="mb-2 mt-2 flex flex-wrap items-center justify-between gap-3 px-1">[\s\S]*type="search"[\s\S]*value=\{methodPlanSearchTerm\}[\s\S]*placeholder="搜索所属公司名称、受访单位名称、地点"[\s\S]*<div\s+className="overflow-x-auto overflow-y-hidden overscroll-x-none/,
  'method plan table should render the search bar at the upper-left before the table like table one'
);

assert.match(
  methodPlanMatrixJuly,
  /const METHOD_PLAN_PAGE_SIZE = 15;[\s\S]*const shouldShowMethodPlanPagination = filteredMethodPlanRows\.length > METHOD_PLAN_PAGE_SIZE;[\s\S]*const methodPlanTotalPages = Math\.max\(1, Math\.ceil\(filteredMethodPlanRows\.length \/ METHOD_PLAN_PAGE_SIZE\)\);[\s\S]*filteredMethodPlanRows\.slice/,
  'method plan pagination should use filtered search results'
);

assert.match(
  methodPlanMatrixJuly,
  /<td className=\{`\$\{grayCell\} group-hover:bg-slate-100 \$\{stickyLeftCellClassNames\[1\]\}`\}>[\s\S]*value=\{row\.companyName\}[\s\S]*readOnly[\s\S]*<td className=\{`\$\{grayCell\} group-hover:bg-slate-100 \$\{stickyLeftCellClassNames\[2\]\}`\}>[\s\S]*value=\{row\.companyOwner\}[\s\S]*readOnly/,
  'method plan first two data columns should be gray and read-only'
);

assert.doesNotMatch(
  renderedMethodPlanMatrixJuly,
  /当前共 \{rows\.length\} 条记录/,
  'method plan footer should not show the current record count'
);

assert.match(
  methodPlanMatrixJuly,
  /<th className=\{whiteHeaderCell\}>[\s\S]*<span className="inline-flex items-center whitespace-nowrap">[\s\S]*现场监盘 vs 远程监盘[\s\S]*<MethodPlanInfoButton label=\{METHOD_PLAN_MONITOR_MODE_INFO\} \/>[\s\S]*<\/span>/,
  'method plan monitor-mode header should keep its i button on the same line'
);

assert.doesNotMatch(
  renderedMethodPlanMatrixJuly,
  />是否可实施实地监盘<\/th>[\s\S]*value=\{row\.feasibility\}/,
  'method plan table should not display feasibility header or cells'
);

assert.match(
  methodPlanMatrixJuly,
  /handleMethodPlanTableInteraction[\s\S]*hasTriggeredHomogeneousLocationPopup[\s\S]*openHomogeneousLocationPopup\(null\)[\s\S]*onMouseDownCapture=\{handleMethodPlanTableInteraction\}/,
  'ordinary method plan table clicks should trigger the homogeneous-location popup only before the first popup trigger'
);

assert.match(
  methodPlanMatrixJuly,
  /handleBulkImportRequest[\s\S]*openHomogeneousLocationPopup\('bulkImport'\)[\s\S]*onClick=\{handleBulkImportRequest\}/,
  'clicking bulk import should open the homogeneous-location popup before the import modal'
);

assert.match(
  methodPlanMatrixJuly,
  /bulkImportMode\?: 'locations' \| 'methodPlan';[\s\S]*const METHOD_PLAN_IMPORT_HEADER_ITEMS[\s\S]*所属公司名称[\s\S]*受访单位名称[\s\S]*地点详细地址[\s\S]*样本数量[\s\S]*向第三方函证存货的数量和状况[\s\S]*毕马威就监盘而计划的审计方案[\s\S]*项目组是否计划利用内部审计工作获取审计证据[\s\S]*bulkImportMode = 'methodPlan'/,
  'method plan matrix should support a full table-two import mode with all visible table-two headers'
);

assert.doesNotMatch(
  methodPlanMatrixJuly,
  /METHOD_PLAN_IMPORT_HEADER_ITEMS[\s\S]*id: 'feasibility'|METHOD_PLAN_IMPORT_HEADER_ITEMS[\s\S]*id: 'countMethod'/,
  'method plan import mode should not include hidden feasibility or count-method columns'
);

assert.match(
  methodPlanMatrixJuly,
  /const getBulkImportRowFromMethodPlanFullRow[\s\S]*case 'companyOwner':[\s\S]*return row\.companyOwner[\s\S]*case 'sampleQuantity':[\s\S]*return row\.sampleQuantity[\s\S]*case 'useInternalAudit':[\s\S]*return row\.useInternalAudit/,
  'method plan import mode should serialize all visible table-two row values'
);

assert.doesNotMatch(
  methodPlanMatrixJuly,
  /const getBulkImportRowFromMethodPlanFullRow[\s\S]*case 'countMethod':/,
  'method plan import mode should not serialize hidden count-method values'
);

assert.match(
  methodPlanMatrixJuly,
  /handleBulkImportRequest[\s\S]*bulkImportMode === 'locations'[\s\S]*openHomogeneousLocationPopup\('bulkImport'\)[\s\S]*openBulkImportModal\(\)/,
  'table-two bulk import should open the import modal directly while location imports keep the homogeneity popup'
);

assert.match(
  methodPlanMatrixJuly,
  /import \{[\s\S]*Pencil[\s\S]*\} from 'lucide-react';[\s\S]*<th className=\{`\$\{whiteHeaderCell\} \$\{stickyRightCellClassName\}`\}>操作<\/th>[\s\S]*className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition hover:bg-blue-50 hover:text-\[#00338D\] focus:outline-none focus:ring-2 focus:ring-blue-200"[\s\S]*aria-label="打开同质性地点设置"[\s\S]*<Pencil size=\{13\} \/>/,
  'method plan operation column should be fixed and show a borderless pen button'
);

assert.doesNotMatch(
  methodPlanMatrixJuly,
  /上传的地点中是否有同质性地点|setHomogeneousLocationMode|homogeneousLocationMode === 'yes' \? 'checkbox' : 'radio'/,
  'homogeneous-location popup should not ask yes/no before showing the plan and homogeneous-location selector'
);

assert.match(
  methodPlanMatrixJuly,
  /确认监盘计划[\s\S]*METHOD_PLAN_POPUP_FIELD_CONFIGS\.map[\s\S]*选择同质性地点/,
  'homogeneous-location popup should show plan fields on the left and homogeneous-location selection on the right'
);

assert.match(
  methodPlanMatrixJuly,
  /const \[homogeneousSampleQuantity, setHomogeneousSampleQuantity\] = useState\(''\);[\s\S]*nextRow\.sampleQuantity = homogeneousSampleQuantity[\s\S]*确认监盘计划[\s\S]*>样本数量<\/span>[\s\S]*value=\{homogeneousSampleQuantity\}[\s\S]*setHomogeneousSampleQuantity/,
  'confirmation popup should provide sample quantity on the left and apply it to selected rows'
);

assert.match(
  methodPlanMatrixJuly,
  /field: 'confirmThirdPartyInventory'[\s\S]*是否执行向持有被审计单位存货的第三方函证存货的数量和状况等其他程序[\s\S]*options: YES_NO_OPTIONS[\s\S]*field: 'auditApproach'/,
  'the plan confirmation popup should show the third-party confirmation question below sample quantity and before audit approach'
);

assert.match(
  methodPlanMatrixJuly,
  /isHomogeneousLocationPopupOpen[\s\S]*onClick=\{closeHomogeneousLocationPopup\}[\s\S]*aria-label="关闭确认监盘计划"/,
  'homogeneous-location popup close icon should close the homogeneous-location popup'
);

assert.match(
  methodPlanMatrixJuly,
  /renderMethodPlanPopupFieldLabel[\s\S]*config\.field === 'auditApproach'[\s\S]*<MethodPlanKButton[\s\S]*className="ml-1 align-middle"[\s\S]*label=\{METHOD_PLAN_AUDIT_APPROACH_KAEG_REFERENCE\}[\s\S]*<MethodPlanInfoButton[\s\S]*label=\{METHOD_PLAN_NON_SIGNIFICANT_RISK_INFO\}/,
  'homogeneous-location popup should keep the audit approach K and i buttons like the table header'
);

assert.match(
  methodPlanMatrixJuly,
  /renderMethodPlanPopupFieldLabel[\s\S]*config\.field === 'monitorMode'[\s\S]*<MethodPlanInfoButton label=\{METHOD_PLAN_MONITOR_MODE_INFO\} \/>[\s\S]*config\.field === 'useExperts'[\s\S]*<MethodPlanInfoButton label=\{METHOD_PLAN_EXPERTS_INFO\} \/>[\s\S]*config\.field === 'useInternalAudit'[\s\S]*<MethodPlanInfoButton label=\{METHOD_PLAN_INTERNAL_AUDIT_INFO\} \/>/,
  'homogeneous-location popup should keep the same i buttons as the table headers for monitor mode, experts, and internal audit'
);

assert.match(
  methodPlanMatrixJuly,
  /毕马威就监盘而计划的审计方案[\s\S]*<MethodPlanKButton[\s\S]*label=\{METHOD_PLAN_AUDIT_APPROACH_KAEG_REFERENCE\}[\s\S]*<MethodPlanInfoButton[\s\S]*label=\{METHOD_PLAN_NON_SIGNIFICANT_RISK_INFO\}/,
  'method plan audit approach header should include the new i button while keeping K'
);

assert.match(
  methodPlanMatrixJuly,
  /现场监盘 vs 远程监盘[\s\S]*<MethodPlanInfoButton[\s\S]*label=\{METHOD_PLAN_MONITOR_MODE_INFO\}/,
  'method plan monitor mode header should include an i button'
);

assert.match(
  methodPlanMatrixJuly,
  /项目组是否计划引入专家和\/或特定项目组成员[\s\S]*<MethodPlanInfoButton[\s\S]*label=\{METHOD_PLAN_EXPERTS_INFO\}/,
  'method plan experts header should include an i button'
);

assert.match(
  methodPlanMatrixJuly,
  /项目组是否计划利用内部审计工作获取审计证据[\s\S]*<MethodPlanInfoButton[\s\S]*label=\{METHOD_PLAN_INTERNAL_AUDIT_INFO\}/,
  'method plan internal audit header should include an i button'
);

assert.match(
  methodPlanMatrixJuly,
  /<div className="flex items-center justify-between gap-3 px-4 py-3">[\s\S]*group\/table-fullscreen/,
  'method plan table should keep its header toolbar'
);

assert.doesNotMatch(
  methodPlanMatrixJuly,
  /模板下载[\s\S]*group\/table-fullscreen/,
  'method plan table should not show the upper-right template download button'
);

assert.match(
  methodPlanMatrixJuly,
  /type="checkbox"[\s\S]*checked=\{selectedHomogeneousLocationIds\.length > 0 && selectedHomogeneousLocationIds\.length === homogeneousLocationRows\.length\}[\s\S]*onChange=\{toggleAllHomogeneousLocations\}[\s\S]*全选/,
  'homogeneous-location popup should include a select-all checkbox'
);

assert.match(
  methodPlanMatrixJuly,
  /homogeneousLocationRows\.map\(\(row\)[\s\S]*type="checkbox"[\s\S]*checked=\{selectedHomogeneousLocationIds\.includes\(row\.id\)\}[\s\S]*onChange=\{\(\) => toggleHomogeneousLocationSelection\(row\.id\)\}/,
  'homogeneous-location popup should render every location as a checkbox'
);

assert.match(
  methodPlanMatrixJuly,
  /applyHomogeneousLocationSetup[\s\S]*METHOD_PLAN_POPUP_FIELD_CONFIGS\.forEach[\s\S]*nextRow\[config\.field\] = homogeneousPopupValues\[config\.field\][\s\S]*pendingMethodPlanAction === 'bulkImport'[\s\S]*openBulkImportModal\(\)/,
  'homogeneous-location popup should apply selected field values and continue to bulk import when requested'
);

assert.match(
  methodPlanMatrixJuly,
  /<button\s+type="button"[\s\S]*onClick=\{\(\) => bulkImportExcelInputRef\.current\?\.click\(\)\}[\s\S]*>\s*上传\s*<\/button>[\s\S]*onClick=\{closeBulkImportModal\}/,
  'bulk import modal should show an upload button to the left of cancel'
);

assert.match(
  methodPlanMatrixJuly,
  /downloadBulkImportWorkbook[\s\S]*XLSX\.utils\.aoa_to_sheet\(\[headerLabels, \.\.\.dataRows\]\)[\s\S]*XLSX\.writeFile/,
  'bulk import modal download should export the currently displayed import grid data'
);

assert.match(
  preWpJuly,
  /renderTableContent=\{false\}[\s\S]*bulkImportMode="locations"[\s\S]*bulkImportMode="methodPlan"/,
  'hidden inventory import host should use location mode while visible table two keeps method-plan mode'
);

assert.doesNotMatch(
  preWpJuly,
  /批量导入 \| 下载/,
  'table two should not render the lower-left bulk import and download button'
);

assert.match(
  methodPlanMatrixJuly,
  /const METHOD_PLAN_KOIC_GROUPS[\s\S]*id: 1, label: INVENTORY_PROCEDURE_METHOD_LABELS\[1\][\s\S]*id: 2, label: INVENTORY_PROCEDURE_METHOD_LABELS\[2\][\s\S]*id: 7, label: INVENTORY_PROCEDURE_METHOD_LABELS\[7\]/,
  'method plan KOIC groups should use the shared concise inventory monitoring method labels'
);

assert.match(
  methodPlanMatrixJuly,
  /const getKoicGroupIdsForAuditApproach[\s\S]*includes\('双重目的方案'\)[\s\S]*return \[1, 2\][\s\S]*includes\('第三方地点'\)[\s\S]*return \[3\]/,
  'KOIC push should map dual-purpose to groups 1 and 2 and third-party locations to group 3'
);

assert.match(
  methodPlanMatrixJuly,
  /const koicPushGroups = METHOD_PLAN_KOIC_GROUPS\.map[\s\S]*rows\.filter[\s\S]*getKoicGroupIdsForAuditApproach\(row\.auditApproach\)\.includes\(group\.id\)[\s\S]*isKoicPushModalOpen/,
  'KOIC modal should group current table-two rows by audit approach'
);

assert.match(
  methodPlanMatrixJuly,
  /const \[expandedKoicGroupIds, setExpandedKoicGroupIds\] = useState<number\[\]>\(\[\]\);/,
  'KOIC modal should keep expansion state for method groups'
);

assert.match(
  methodPlanMatrixJuly,
  /const isGroupExpanded = expandedKoicGroupIds\.includes\(group\.id\);[\s\S]*aria-label=\{`\$\{isGroupExpanded \? '收起' : '展开'\}\$\{group\.label\}`\}[\s\S]*\{isGroupExpanded && \([\s\S]*\{group\.rows\.length > 0 \? \([\s\S]*group\.rows\.map\(\(row\)[\s\S]*所属公司名称[\s\S]*受访单位名称/,
  'KOIC modal should keep tables collapsed initially and show every row after expansion'
);

assert.doesNotMatch(
  methodPlanMatrixJuly,
  /KOIC_GROUP_PREVIEW_LIMIT|group\.rows\.slice\(/,
  'expanded KOIC method groups should not truncate locations'
);

assert.match(
  methodPlanMatrixJuly,
  /<div className="mt-4 space-y-2">[\s\S]*<section key=\{group\.id\} className="rounded-xl border border-slate-200 bg-slate-50\/70 p-3">/,
  'KOIC modal should use tighter spacing between method sections'
);

assert.match(
  methodPlanMatrixJuly,
  />\s*推送至KOIC\s*<\/button>[\s\S]*isKoicPushModalOpen[\s\S]*推送至KOIC[\s\S]*所属公司名称[\s\S]*受访单位名称[\s\S]*bg-blue-50[\s\S]*text-rose-500[\s\S]*识别到的异常/,
  'method plan footer should include a KOIC push button, expandable grouped locations, and styled exception section'
);

assert.match(
  methodPlanMatrixJuly,
  /onClick=\{\(\) => setIsKoicPushModalOpen\(true\)\}[\s\S]*>\s*推送至KOIC\s*<\/button>/,
  'method plan KOIC push button should open the KOIC modal'
);

assert.doesNotMatch(
  preWpJuly,
  /发送地点至KOIC|aria-label="发送地点至KOIC"/,
  'stage three page should not show the send-locations-to-KOIC button'
);

assert.match(
  methodPlanMatrixJuly,
  /import \* as XLSX from 'xlsx';/,
  'bulk import modal should use xlsx to parse uploaded Excel files'
);

assert.match(
  methodPlanMatrixJuly,
  /const bulkImportExcelInputRef = useRef<HTMLInputElement>\(null\);/,
  'bulk import modal should keep a hidden Excel file input ref'
);

assert.match(
  methodPlanMatrixJuly,
  /const getBulkImportCellRowsFromWorksheet[\s\S]*XLSX\.utils\.decode_range[\s\S]*emptyPrimaryRowCount[\s\S]*break/,
  'Excel upload should stop reading after consecutive empty primary rows instead of scanning the full worksheet range'
);

assert.match(
  methodPlanMatrixJuly,
  /handleBulkImportExcelUpload[\s\S]*XLSX\.read[\s\S]*getBulkImportCellRowsFromWorksheet\(worksheet\)[\s\S]*const nextValue = serializeBulkImportSheetRows[\s\S]*setBulkImportValue\(nextValue\)/,
  'uploading an Excel file should map the first sheet into the bulk import grid'
);

assert.doesNotMatch(
  methodPlanMatrixJuly,
  /sheet_to_json/,
  'Excel upload should not use sheet_to_json because templates can have a 1048576-row range'
);

assert.match(
  methodPlanMatrixJuly,
  /setBulkImportUploadStatus\('正在读取 Excel，请稍候'\)[\s\S]*requestAnimationFrame[\s\S]*try\s*\{[\s\S]*await file\.arrayBuffer\(\)[\s\S]*\}\s*catch[\s\S]*setBulkImportUploadError[\s\S]*finally\s*\{[\s\S]*input\.value = ''/,
  'Excel upload should show a reading status before parsing and show an error if parsing fails'
);

assert.match(
  methodPlanMatrixJuly,
  /BULK_IMPORT_HEADER_ALIASES[\s\S]*上期预审阶段余额[\s\S]*priorInterimPlannedBalance/,
  'Excel upload should recognize the current template header aliases'
);

assert.match(
  methodPlanMatrixJuly,
  /accept="\.xlsx,\.xls"[\s\S]*onChange=\{handleBulkImportExcelUpload\}/,
  'bulk import modal upload input should accept Excel files'
);

assert.match(
  preWpJuly,
  /inventoryRows[\s\S]*\.filter\(\(inventoryRow\) => isYesValue\(inventoryRow\.selectedAsSample\)\)/,
  'method plan sync should only include inventory rows selected as samples'
);

assert.match(
  preWpJuly,
  /countMethod: inventoryRow\.countMethod/,
  'method plan sync should copy inventory count method from table one into table two'
);

assert.match(
  methodPlanMatrixJuly,
  /companyOwner: record\.intervieweeName \?\? record\.companyOwner \?\? ''/,
  'location bulk import should preserve interviewee name from either table-one or table-two header ids'
);

assert.match(
  methodPlanMatrixJuly,
  /BULK_IMPORT_HEADER_ALIASES[\s\S]*受访单位名称[\s\S]*intervieweeName[\s\S]*受访单位[\s\S]*intervieweeName[\s\S]*被访单位名称[\s\S]*intervieweeName/,
  'Excel upload should recognize common interviewee-name header variants'
);

assert.match(
  methodPlanMatrixJuly,
  /const headerLookup = new Map<string, BulkImportHeaderId>\(\s*headers\.map\(\(item\) => \[normalizeBulkImportHeaderLabel\(item\.label\), item\.id\]\)\s*\)[\s\S]*allowedHeaderIds\.has\('companyOwner'\)[\s\S]*headerLookup\.set\(label, 'companyOwner'\)/,
  'Excel upload header matching should be scoped to the active import mode'
);

assert.match(
  preWpJuly,
  /const buildInventoryRowFromMethodPlanRow[\s\S]*intervieweeName: row\.companyOwner \?\? ''[\s\S]*const buildMethodPlanRowFromInventoryRow[\s\S]*companyOwner: inventoryRow\.intervieweeName/,
  'bulk imported interviewee name should flow into table one and then back into table two'
);

assert.match(
  preWpJuly,
  /const handleInventoryMatrixRowsChange = \(nextRows: InventoryMatrixRow\[\]\) => \{[\s\S]*setInventoryMatrixRows\(nextRows\)[\s\S]*syncMethodPlanRowsFromInventoryRows\(nextRows, currentRows\)/,
  'editing inventory rows should immediately resync method plan rows'
);

assert.match(
  preWpJuly,
  /const handleMethodPlanBulkImport = \(importedRows: MethodPlanRow\[\]\) => \{[\s\S]*mergeImportedLocationsIntoInventoryRows\(currentRows, importedRows\)[\s\S]*syncMethodPlanRowsFromInventoryRows\(nextInventoryRows, currentMethodRows\)/,
  'bulk importing inventory rows should resync method plan rows from imported sample selections'
);

assert.match(
  preWpJuly,
  /const methodPlanKoicGroupIds = useMemo\(\(\) =>[\s\S]*methodPlanRows\.forEach[\s\S]*getKoicGroupIdsForAuditApproach\(row\.auditApproach\)[\s\S]*const visibleAttachmentSteps = attachmentSteps\.filter\(\(item\) => methodPlanKoicGroupIds\.includes\(item\.id\)\)/,
  'inventory monitoring method section should only show methods that have KOIC locations'
);

assert.match(
  preWpJuly,
  /visibleAttachmentSteps\.map\(\(item\)[\s\S]*<td className="px-4 py-6 align-top">[\s\S]*<a[\s\S]*<LoginOutlined \/>/,
  'visible monitoring methods should render an enter link without yes/no radio options'
);

assert.match(
  preWpJuly,
  /const handleKoicPushConfirm = \(\) => \{\s*setHasConfirmedKoicPush\(true\);\s*setIsWorkpaperIntroCollapsed\(true\);\s*setIsPlanSetupCollapsed\(true\);\s*\};/,
  'confirming KOIC push should collapse the workpaper intro without changing the stage-two program collapse state'
);

assert.match(
  preWpJuly,
  /ref=\{methodPlanProgramSectionRef\}[\s\S]*activePreWpJulyStage === 'plan' && isPlanSetupCollapsed && 'hidden'[\s\S]*aria-hidden=\{activePreWpJulyStage === 'plan' && isPlanSetupCollapsed\}[\s\S]*hasConfirmedKoicPush && isPlanSetupCollapsed[\s\S]*setIsPlanSetupCollapsed\(false\)[\s\S]*展开表格二[\s\S]*activePreWpJulyStage === 'plan' && hasConfirmedKoicPush && \([\s\S]*选择存货监盘方法/,
  'KOIC confirmation should collapse only the stage-three setup and leave its inventory monitoring method selection visible'
);

assert.match(
  preWpJuly,
  /step\.id <= 2 && <div className="space-y-0\.5">[\s\S]*KAEG[\s\S]*item\.name[\s\S]*activePreWpJulyStage === 'method'[\s\S]*text-\[10px\] font-normal tracking-normal text-gray-400[\s\S]*3\.1 业务流程 - 了解有关情况/,
  'stage two should move the shared KAEG 3.1 reference from steps 3-8 into a lighter program header label'
);

assert.match(
  preWpJuly,
  /activePreWpJulyStage !== 'understand' && \([\s\S]*<MethodPlanMatrix[\s\S]*renderTableContent=\{activePreWpJulyStage === 'plan'\}[\s\S]*onKoicPushConfirm=\{handleKoicPushConfirm\}[\s\S]*activePreWpJulyStage === 'plan' && hasConfirmedKoicPush && \(/,
  'inventory monitoring method selections should stay hidden until KOIC push is confirmed'
);

assert.match(
  preWpJuly,
  /visibleAttachmentSteps\.map\(\(item\)[\s\S]*<a[\s\S]*aria-label=\{`Open link for attachment \$\{item\.id\}`\}[\s\S]*<LoginOutlined \/>/,
  'every visible inventory monitoring method should render an enter link'
);

assert.doesNotMatch(
  preWpJuly,
  /visibleAttachmentSteps\.map\(\(item\)[\s\S]*<RetroRadio[\s\S]*label="是 Yes"[\s\S]*<RetroRadio[\s\S]*label="否 No"/,
  'monitoring method section should remove the yes/no options'
);

assert.match(
  preWpJuly,
  /const openInventoryBulkImport = \(\) => \{[\s\S]*methodPlanMatrixRef\.current\?\.openBulkImportModal\(\)/,
  'inventory bulk import should open the mounted method plan import modal'
);

assert.match(
  preWpJuly,
  /onRowsChange=\{handleInventoryMatrixRowsChange\}/,
  'inventory matrix should use the syncing row change handler'
);

assert.match(
  preWpJuly,
  /<InventoryMatrix[\s\S]*rows=\{inventoryMatrixRows\}[\s\S]*onRowsChange=\{handleInventoryMatrixRowsChange\}[\s\S]*lockIdentityColumns=\{inventoryStepsSaved\}/,
  'inventory matrix should lock identity columns from the existing outer save state'
);

assert.match(
  preWpJuly,
  /const handleInventoryMatrixSave = \(\) => \{[\s\S]*setInventoryStepsSaved\(true\)[\s\S]*syncMethodPlanRowsFromInventoryRows\(inventoryMatrixRows, currentRows\)[\s\S]*onClick=\{handleInventoryMatrixSave\}/,
  'saving table one should immediately sync both current balance fields into table two rows'
);

assert.match(
  preWpJuly,
  /<InventoryMatrix[\s\S]*toolbarActions=\{[\s\S]*onClick=\{openInventoryBulkImport\}[\s\S]*下载模板 \| 导入[\s\S]*Roll-forward[\s\S]*<div className="mt-4 flex items-center justify-end">/,
  'table one import and roll-forward actions should move to the upper-right toolbar while save remains below'
);

assert.match(
  preWpJuly,
  /onClick=\{openInventoryBulkImport\}/,
  'inventory bulk import button should use the mounted-aware open handler'
);

assert.match(
  preWpJuly,
  /renderTableContent=\{activePreWpJulyStage === 'plan'\}/,
  'method plan matrix should stay mounted and available after KOIC push confirmation'
);

assert.match(
  methodPlanMatrixJuly,
  /const \[isTableCollapsed, setIsTableCollapsed\] = useState\(false\);[\s\S]*confirmKoicPush[\s\S]*onKoicPushConfirm\?\.\(\)[\s\S]*aria-expanded=\{!isTableCollapsed\}[\s\S]*isTableCollapsed \? '展开' : '收起'/,
  'KOIC push should keep table two open while retaining its manual collapse control'
);

assert.doesNotMatch(
  methodPlanMatrixJuly,
  /confirmKoicPush[\s\S]{0,160}setIsTableCollapsed\(true\)/,
  'confirming KOIC push should not automatically collapse table two'
);

assert.match(
  preWpJuly,
  /activePreWpJulyStage === 'understand' && \([\s\S]*<MethodPlanMatrix[\s\S]*renderTableContent=\{false\}/,
  'understand stage should mount a hidden method plan import host for inventory bulk import'
);

assert.match(
  methodPlanMatrixJuly,
  /renderTableContent\?: boolean;/,
  'method plan matrix should support mounting only the bulk import modal host'
);

assert.match(
  methodPlanMatrixJuly,
  /renderTableContent = true/,
  'method plan matrix table content should render by default'
);

assert.match(
  inventoryMatrixJuly,
  /const \[pendingSampleChange, setPendingSampleChange\][\s\S]*handleSelectedAsSampleChange[\s\S]*isSampleYesValue\(row\.selectedAsSample\)[\s\S]*isSampleNoValue\(nextValue\)[\s\S]*setPendingSampleChange/,
  'changing inventory sample selection from yes to no should open a confirmation dialog first'
);

assert.match(
  inventoryMatrixJuly,
  /sampleChangeReason: string;[\s\S]*sampleChangeReason: '',[\s\S]*confirmPendingSampleChange[\s\S]*sampleChangeReason: pendingSampleChange\.reason\.trim\(\)[\s\S]*记录样本变更的原因[\s\S]*<textarea[\s\S]*value=\{pendingSampleChange\.reason\}/,
  'sample-change dialog should store the confirmed reason on the inventory row'
);

assert.match(
  inventoryMatrixJuly,
  /pendingSampleChange &&[\s\S]*max-w-\[460px\][\s\S]*<textarea[\s\S]*w-full/,
  'sample-change dialog should give the reason textbox a wider popup width'
);

assert.match(
  preWpJuly,
  /const sampleChangeRows = useMemo\([\s\S]*inventoryMatrixRows\.filter\(\(row\) => isNoValue\(row\.selectedAsSample\) && row\.sampleChangeReason\.trim\(\)\)[\s\S]*样本变更原因[\s\S]*\{row\.intervieweeName \|\| '-'\}[\s\S]*\{row\.sampleChangeReason \|\| '-'\}/,
  'confirmed sample-change reasons should display below table two under the sample-change reason heading'
);

assert.doesNotMatch(
  preWpJuly,
  /activePreWpJulyStage === 'plan' && sampleChangeRows\.length > 0[\s\S]*对应地址[\s\S]*\{row\.location \|\| '-'\}/,
  'sample-change reason display should not include the address column'
);

assert.match(
  renderedMethodPlanMatrixJuly,
  /value=\{row\.sampleQuantity\}[\s\S]*value=\{row\.confirmThirdPartyInventory\}[\s\S]*value=\{row\.auditApproach\}/,
  'table two should render third-party confirmation between sample quantity and audit approach'
);

assert.match(
  methodPlanMatrixJuly,
  /initialLocationId\?: string[\s\S]*setSelectedHomogeneousLocationIds\(initialLocationId \? \[initialLocationId\] : \[\]\)[\s\S]*onClick=\{\(\) => openHomogeneousLocationPopup\(null, row\.id\)\}/,
  'opening the homogeneous-location dialog from a row action should select that location by default'
);

assert.match(
  methodPlanMatrixJuly,
  /grid-cols-\[minmax\(0,1fr\)_72px_24px\][\s\S]*\{group\.rows\.length\} 个地点[\s\S]*<div className="h-6 w-6">/,
  'KOIC method rows should align location counts and always reserve space for the expand button'
);

const koicModalSource = methodPlanMatrixJuly.slice(methodPlanMatrixJuly.indexOf('{isKoicPushModalOpen && ('));
assert.doesNotMatch(
  koicModalSource,
  /地点详细地址|row\.address\.trim\(\)|缺失详细地址/,
  'KOIC preview should omit the detailed-address column and its missing-address logic'
);

console.log('check passed: PreWpJuly sample-based sync');
