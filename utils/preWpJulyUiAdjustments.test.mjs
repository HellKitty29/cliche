import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const preWpJuly = readFileSync(new URL('../components/PreWpJuly.tsx', import.meta.url), 'utf8');
const inventoryMatrixJuly = readFileSync(new URL('../components/InventoryMatrixJuly.tsx', import.meta.url), 'utf8');
const methodPlanMatrixJuly = readFileSync(new URL('../components/MethodPlanMatrixJuly.tsx', import.meta.url), 'utf8');

assert.match(
  preWpJuly,
  /const \[isWorkpaperIntroCollapsed, setIsWorkpaperIntroCollapsed\] = useState\(false\);/,
  'workpaper intro card should have collapse state'
);

assert.match(
  preWpJuly,
  /存货工作底稿[\s\S]*setIsWorkpaperIntroCollapsed[\s\S]*isWorkpaperIntroCollapsed \? '展开' : '收起'/,
  'workpaper intro card should render a collapse button'
);

assert.match(
  preWpJuly,
  /<h1 className="text-2xl font-bold leading-tight text-gray-900">1325146-Tech Solutions Demo & Training \(CN\)<\/h1>/,
  'PreWpJuly should show the same engagement title as the other task tabs'
);

assert.match(
  inventoryMatrixJuly,
  /function InventoryKButton[\s\S]*h-4 w-4[\s\S]*border border-\[#00338D\] bg-\[#00338D\][\s\S]*text-\[10px\] font-semibold[\s\S]*text-white[\s\S]*inline-flex items-center whitespace-nowrap[\s\S]*<InventoryKButton[\s\S]*className="ml-1 align-middle"/,
  'inventory K buttons should use the larger original blue inline style'
);

assert.match(
  inventoryMatrixJuly,
  /function InventoryInlineInfoButton[\s\S]*rounded-full border border-black\/40 bg-white[\s\S]*>\s*i\s*<span/,
  'inventory inline i buttons should have a thin black border'
);

assert.match(
  inventoryMatrixJuly,
  /onMouseEnter=\{\(\) => setIsCategoryTooltipVisible\(true\)\}[\s\S]*className="inline-flex h-3\.5 w-3\.5 items-center justify-center rounded-full border border-black\/40 bg-white/,
  'inventory category i button should have a thin black border'
);

assert.match(
  methodPlanMatrixJuly,
  /function MethodPlanInfoButton[\s\S]*rounded-full border border-black\/40 bg-white[\s\S]*>\s*i\s*<span/,
  'method plan i buttons should have a thin black border'
);

assert.doesNotMatch(
  inventoryMatrixJuly,
  /<InventoryKButton[\s\S]*className="absolute -right-0\.5 -top-1"/,
  'inventory K buttons should not sit at the upper-right corner of header text'
);

assert.doesNotMatch(
  preWpJuly,
  /activePreWpJulyStage === 'understand' && \(\s*<div className="relative space-y-4">[\s\S]*存货工作底稿/,
  'workpaper intro card should render in the same position across all three stages'
);

assert.match(
  preWpJuly,
  /const hasStepInputContent = \(stepId: number\)[\s\S]*methodPlanStepNotes\[stepId\]\?\.trim\(\)/,
  'program status should be driven by whether the related text box has content'
);

assert.match(
  preWpJuly,
  /backgroundColor: hasStepInputContent\(step\.id\) \? '#0D92F8' : '#D1D5DB'/,
  'program status dot should turn blue when the related text box has content'
);

assert.match(
  preWpJuly,
  /const inventorySectionRef = useRef<HTMLDivElement>\(null\);[\s\S]*const methodPlanProgramSectionRef = useRef<HTMLDivElement>\(null\);[\s\S]*const \[showFloatingSaveButton, setShowFloatingSaveButton\] = useState\(false\);[\s\S]*activePreWpJulyStage === 'understand'[\s\S]*setShowFloatingSaveButton\(true\)[\s\S]*const currentProgramSectionRef = methodPlanProgramSectionRef;[\s\S]*getBoundingClientRect\(\)\.top <= 24/,
  'first stage should show the floating save button immediately, while later stages show it after their program section reaches the viewport'
);

assert.match(
  preWpJuly,
  /showFloatingSaveButton && \([\s\S]*setInventoryStepsSaved\(true\)[\s\S]*fixed right-12 top-24 z-\[60\][\s\S]*h-10 w-10[\s\S]*rounded-full[\s\S]*bg-white\/60[\s\S]*hover:bg-white\/35[\s\S]*<Save size=\{18\}[\s\S]*sr-only/,
  'program save button should stay fixed as a compact circular icon button inside the content area on all stages'
);

assert.doesNotMatch(
  preWpJuly,
  /function PreWpJulyStepIndicator/,
  'PreWpJuly should remove the horizontal step bar'
);

assert.match(
  preWpJuly,
  /function PreWpJulyCompactStepIndicator[\s\S]*key: 'method'[\s\S]*key: 'understand'[\s\S]*key: 'plan'[\s\S]*aria-label="快速步骤导航"/,
  'PreWpJuly should keep method, understand, and plan in the vertical step navigation'
);

assert.match(
  preWpJuly,
  /useState<PreWpJulyStage>\('method'\)/,
  'PreWpJuly should open on the reordered first stage'
);

assert.doesNotMatch(
  preWpJuly,
  /isAlertRetracted|prewp-alert|Requirement|展开操作指引|操作指引/,
  'PreWpJuly should remove the old operation guidance alert shell'
);

assert.match(
  preWpJuly,
  /methodDeterminationSteps = steps\.filter\(\(step\) => \[1, 2, 3, 4, 5, 6\]\.includes\(step\.id\)\)[\s\S]*inventoryPlanSteps = steps\.filter\(\(step\) => step\.id === 8\)[\s\S]*visibleMethodPlanPrepSteps/,
  'PreWpJuly step indicator should split method and plan procedure steps'
);

assert.match(
  preWpJuly,
  /<h2 className="shrink-0 border-l-\[5px\] border-blue-600 pl-4 text-2xl font-bold leading-9">存货工作底稿<\/h2>[\s\S]*activePreWpJulyStage === 'understand'[\s\S]*<InventoryMatrix/,
  'all stages should show workpaper details first, and understand step should then show inventory matrix'
);

assert.match(
  preWpJuly,
  /<MethodPlanMatrix[\s\S]*renderTableContent=\{activePreWpJulyStage === 'plan' && !hasConfirmedKoicPush\}/,
  'plan step should show the method plan matrix'
);

assert.match(
  preWpJuly,
  /<MethodPlanMatrix[\s\S]*renderTableContent=\{activePreWpJulyStage === 'plan' && !hasConfirmedKoicPush\}[\s\S]*activePreWpJulyStage === 'plan' && hasConfirmedKoicPush && \([\s\S]*选择存货监盘方法/,
  'plan step should show inventory count method selection only after KOIC push is confirmed'
);

assert.match(
  preWpJuly,
  /const workpaperHeaderRef = useRef<HTMLDivElement>\(null\);[\s\S]*const \[isWorkpaperHeaderPinned, setIsWorkpaperHeaderPinned\] = useState\(false\);[\s\S]*getBoundingClientRect\(\)\.top <= 0[\s\S]*<div ref=\{workpaperHeaderRef\} className="h-\[58px\]">[\s\S]*fixed inset-x-0 top-0 z-40[\s\S]*<h2 className="shrink-0 border-l-\[5px\] border-blue-600 pl-4 text-2xl font-bold leading-9">存货工作底稿<\/h2>[\s\S]*导出底稿[\s\S]*<PreWpJulyCompactStepIndicator/,
  'workpaper title and export action should stay pinned while vertical steps remain available from first render'
);

assert.doesNotMatch(
  preWpJuly,
  /disabled=\{inventoryStepsSaved\}/,
  'realtime save should not lock text boxes or uploads after saving'
);

assert.match(
  inventoryMatrixJuly,
  /const derivedCellClassName =[\s\S]*'border border-\[#2b2b2b\] bg-\[#d9d9d9\][\s\S]*text-\[#1f1f1f\]';[\s\S]*className=\{`\$\{lightHeaderCellClassName\} bg-\[#EFF6FF\]`\}>[\s\S]*占比[\s\S]*变动幅度/,
  'inventory share and change headers should use #EFF6FF while derived cells stay gray'
);

assert.match(
  inventoryMatrixJuly,
  /const headerCellClassName =[\s\S]*bg-gray-100[\s\S]*text-gray-700/,
  'inventory matrix ordinary headers should use the gray task/check-in table header style'
);

assert.doesNotMatch(
  inventoryMatrixJuly,
  /<th[^>]*headerCellClassName[^>]*bg-\[#143f97\]/,
  'inventory matrix ordinary headers should not use the old dark blue header background'
);

assert.match(
  methodPlanMatrixJuly,
  /const headerBlue =[\s\S]*bg-gray-100[\s\S]*text-gray-700[\s\S]*const headerOrange =[\s\S]*bg-gray-100[\s\S]*text-gray-700/,
  'method plan ordinary headers should use the gray task/check-in table header style'
);

assert.doesNotMatch(
  methodPlanMatrixJuly,
  /const header(?:Blue|Orange) =\s*'[^']*bg-\[#00338D\]/,
  'method plan ordinary headers should not use the old dark blue header background'
);

assert.doesNotMatch(
  inventoryMatrixJuly,
  /href="\/templates\/inventory-count-template\.xlsx"[\s\S]*role="switch"/,
  'template download should move out of the inventory search row'
);

assert.doesNotMatch(
  preWpJuly,
  />\s*批量导入\s*<\/button>/,
  'inventory bulk import button should be renamed'
);

assert.match(
  preWpJuly,
  />\s*批量导入 \| 下载\s*<\/button>/,
  'inventory bulk import button should read bulk import and download'
);

assert.match(
  methodPlanMatrixJuly,
  /onClick=\{downloadBulkImportWorkbook\}[\s\S]*下载当前数据[\s\S]*下载模板[\s\S]*onClick=\{\(\) => bulkImportExcelInputRef\.current\?\.click\(\)\}[\s\S]*>\s*上传\s*<\/button>/,
  'bulk import modal should show data/template download to the left of upload'
);

assert.match(
  methodPlanMatrixJuly,
  /const LOCATION_BULK_IMPORT_REQUIRED_HEADER_IDS = \[[\s\S]*'companyName',[\s\S]*'intervieweeName',[\s\S]*'category',[\s\S]*'systemType',[\s\S]*'thirdPartyStorage',[\s\S]*'countMethod',[\s\S]*'useExpert',[\s\S]*'selectedAsSample',[\s\S]*10_000[\s\S]*missingHeaderIds[\s\S]*showBulkImportValidation\(missingHeaderIds\)[\s\S]*isLocationBulkImportHeaderRequired\(item\.id\)[\s\S]*text-red-500">\*<\/span>/,
  'location bulk import should mark required headers and flash incomplete columns for ten seconds on confirmation'
);

assert.match(
  preWpJuly,
  /function StepProcedureCell[\s\S]*<div className="space-y-1">[\s\S]*<div className="space-y-0\.5">[\s\S]*px-4 pb-2 pt-6 align-top/,
  'procedure text, workflow text, and text boxes should have tighter vertical spacing'
);

console.log('check passed: PreWpJuly UI adjustments');
