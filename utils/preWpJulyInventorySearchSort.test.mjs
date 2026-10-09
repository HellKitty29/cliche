import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const inventoryMatrixJuly = readFileSync(
  new URL('../components/InventoryMatrixJuly.tsx', import.meta.url),
  'utf8'
);
const renderedInventoryMatrixJuly = inventoryMatrixJuly.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

assert.match(
  inventoryMatrixJuly,
  /const \[inventorySearchTerm, setInventorySearchTerm\] = useState\(''\);/,
  'inventory matrix should keep search input state'
);

assert.match(
  inventoryMatrixJuly,
  /filteredRows[\s\S]*row\.companyName[\s\S]*row\.intervieweeName[\s\S]*row\.category/,
  'inventory matrix search should only match company name, interviewee name, and category'
);

assert.doesNotMatch(
  inventoryMatrixJuly,
  /filteredRows[\s\S]*row\.location/,
  'inventory matrix search should not match location'
);

assert.match(
  inventoryMatrixJuly,
  /type InventorySortDirection = 'ascending' \| 'descending';[\s\S]*type InventoryAmountSortField =/,
  'inventory matrix should define amount sort fields and directions'
);

assert.match(
  inventoryMatrixJuly,
  /displayRows = \[\.\.\.filteredRows\][\s\S]*parseAmount\(.*inventoryAmountSort\.field/,
  'inventory matrix should sort a display copy instead of mutating source rows'
);

assert.match(
  inventoryMatrixJuly,
  /import \{[\s\S]*ArrowDownWideNarrow[\s\S]*ArrowUpNarrowWide[\s\S]*\} from 'lucide-react';/,
  'amount sorting should use sort icons'
);

assert.match(
  inventoryMatrixJuly,
  /renderAmountHeader[\s\S]*const nextDirection: InventorySortDirection[\s\S]*const SortIcon = isActive && inventoryAmountSort\.direction === 'ascending'[\s\S]*ArrowUpNarrowWide[\s\S]*ArrowDownWideNarrow[\s\S]*setInventoryAmountSort\(\{ field, direction: nextDirection \}\)/,
  'amount headers should expose one icon button that toggles ascending and descending'
);

assert.match(
  inventoryMatrixJuly,
  /const \[amountLabel, amountUnit\] = label\.split\('（'\)[\s\S]*min-h-\[54px\] w-full flex-col items-center justify-center[\s\S]*inline-flex flex-col items-center leading-tight[\s\S]*<span>\{amountLabel\}<\/span>[\s\S]*<span>（\{amountUnit\}<\/span>[\s\S]*<SortIcon size=\{12\}/,
  'amount header unit and sort icon should stack inside the header cell'
);

assert.match(
  inventoryMatrixJuly,
  /isBalanceView && <col style=\{\{ width: '72px' \}\} \/>[\s\S]*isInterimView && <col style=\{\{ width: '72px' \}\} \/>/,
  'amount columns should use the slightly wider compact width'
);

assert.match(
  inventoryMatrixJuly,
  /function WrappedInventorySelect[\s\S]*whitespace-normal break-words[\s\S]*absolute inset-0 h-full w-full cursor-pointer opacity-0[\s\S]*value=\{row\.endingBalanceConfirmation\}[\s\S]*value=\{row\.inventoryCountPlan\}/,
  'long table-one selections should wrap while retaining their native dropdown interaction'
);

assert.match(
  inventoryMatrixJuly,
  /上期期末余额（百万元）[\s\S]*上期预审阶段余额（百万元）[\s\S]*本期预审阶段余额（百万元）[\s\S]*本期期末余额（百万元）/,
  'web table amount headers should show the million-yuan unit'
);

assert.match(
  inventoryMatrixJuly,
  /const INVENTORY_WEB_AMOUNT_SCALE = 0\.0000001;[\s\S]*formatInventoryWebAmount[\s\S]*amount \* INVENTORY_WEB_AMOUNT_SCALE[\s\S]*convertInventoryWebAmountToRaw[\s\S]*amount \/ INVENTORY_WEB_AMOUNT_SCALE[\s\S]*function InventoryAmountInput/,
  'web amount cells should scale raw import values for display and preserve raw values when editing'
);

assert.match(
  inventoryMatrixJuly,
  /isActive[\s\S]*bg-white text-\[#143f97\] shadow-sm[\s\S]*border border-slate-300 bg-white text-slate-500/,
  'amount sort button should remain visible before and after sorting'
);

assert.doesNotMatch(
  inventoryMatrixJuly,
  /\(\['ascending', 'descending'\] as const\)\.map/,
  'amount headers should not render separate ascending and descending buttons'
);

assert.match(
  renderedInventoryMatrixJuly,
  /<select[\s\S]*value=\{row\.selectedAsSample\}[\s\S]*handleSelectedAsSampleChange\(row, event\.target\.value\)/,
  'inventory matrix table should render the restored sample-selection column'
);

assert.match(
  inventoryMatrixJuly,
  /<table className="min-w-\[1490px\][\s\S]*<col style=\{\{ width: '36px' \}\} \/>[\s\S]*<col style=\{\{ width: '120px' \}\} \/>[\s\S]*<col style=\{\{ width: '90px' \}\} \/>[\s\S]*isBalanceView && <col style=\{\{ width: '125px' \}\} \/>[\s\S]*<col style=\{\{ width: '190px' \}\} \/>[\s\S]*<col style=\{\{ width: '150px' \}\} \/>/,
  'inventory matrix columns should be widened for a more balanced table layout'
);

assert.match(
  inventoryMatrixJuly,
  /function InventoryKButton[\s\S]*aria-label=\{`KAEG 索引 \$\{label\}`\}[\s\S]*h-4 w-4[\s\S]*border border-\[#00338D\] bg-\[#00338D\][\s\S]*text-\[10px\] font-semibold[\s\S]*text-white[\s\S]*group-hover\/kaeg:opacity-100[\s\S]*\{label\}/,
  'inventory matrix keyword K buttons should use the larger original blue inline style'
);

assert.match(
  inventoryMatrixJuly,
  /<span className="inline-flex items-center whitespace-nowrap">[\s\S]*永续盘存系统[\s\S]*<InventoryKButton[\s\S]*className="ml-1 align-middle"[\s\S]*label=\{INVENTORY_KEYWORD_REFERENCES\.perpetualSystem\}[\s\S]*\/>[\s\S]*<span className="inline-flex items-center whitespace-nowrap">[\s\S]*定期盘存系统[\s\S]*<InventoryKButton[\s\S]*className="ml-1 align-middle"[\s\S]*label=\{INVENTORY_KEYWORD_REFERENCES\.periodicSystem\}/,
  'inventory system header should place K buttons inline beside the system keywords'
);

assert.doesNotMatch(
  inventoryMatrixJuly,
  /<span className="relative inline-block pr-0\.5 whitespace-nowrap">[\s\S]*循环盘点[\s\S]*<InventoryKButton[\s\S]*className="absolute -right-0\.5 -top-1"[\s\S]*label=\{INVENTORY_KEYWORD_REFERENCES\.cycleCount\}/,
  'inventory count method header should not show the extra cycle count keyword after the column title'
);

assert.match(
  inventoryMatrixJuly,
  /<th ref=\{countMethodHeaderRef\} className=\{headerCellClassName\}>[\s\S]*被审计单位的存货盘点方法[\s\S]*<InventoryKButton[\s\S]*className="ml-1 align-middle"[\s\S]*label=\{INVENTORY_KEYWORD_REFERENCES\.cycleCount\}[\s\S]*\/>[\s\S]*<\/th>/,
  'inventory count method header should keep the cycle count K button without rendering the extra keyword'
);

assert.doesNotMatch(
  inventoryMatrixJuly,
  /<InventoryKButton[\s\S]*label=\{INVENTORY_KEYWORD_REFERENCES\.cycleCount\}[\s\S]*\/>[\s\S]*aria-label="循环盘点说明"/,
  'inventory count method header should not show the cycle count i button after removing the extra keyword'
);

assert.doesNotMatch(
  inventoryMatrixJuly,
  /const \[isCycleCountTooltipVisible, setIsCycleCountTooltipVisible\] = useState\(false\);[\s\S]*在某些情况下，被审计单位可能对部分存货进行循环盘点，而对剩余存货进行实地全盘/,
  'inventory count method header should not keep a cycle count tooltip after removing the extra keyword'
);

assert.match(
  inventoryMatrixJuly,
  /row\.countMethod === INVENTORY_MONITORING_NOT_PRACTICABLE[\s\S]*ariaLabel="存货监盘不可行说明"[\s\S]*label="在某些情况下，被审计单位可能对部分存货进行循环盘点，而对剩余存货进行实地全盘。"/,
  'inventory count method cell should show an i button for the monitoring-not-practicable option'
);

assert.match(
  inventoryMatrixJuly,
  /是否存放在第三方地点？[\s\S]*ariaLabel="第三方地点说明"[\s\S]*label="在适当情况下，完成附件3"/,
  'third-party storage header should show an i button with the appendix 3 instruction'
);

assert.match(
  inventoryMatrixJuly,
  /expert:[\s\S]*第三方盘点人员[\s\S]*管理层的专家[\s\S]*被审计单位是否使用了[\s\S]*<span className="inline-flex items-center whitespace-nowrap">[\s\S]*专家[\s\S]*<InventoryKButton[\s\S]*className="ml-1 align-middle"[\s\S]*label=\{INVENTORY_KEYWORD_REFERENCES\.expert\}/,
  'inventory expert header should place an inline K button beside the expert keyword with the expert definition'
);

assert.match(
  inventoryMatrixJuly,
  /被审计单位是否使用了[\s\S]*专家[\s\S]*<InventoryKButton[\s\S]*label=\{INVENTORY_KEYWORD_REFERENCES\.expert\}[\s\S]*\/>[\s\S]*ariaLabel="专家使用说明"[\s\S]*label="在某些情况下，被审计单位可能对部分存货进行循环盘点，而对剩余存货进行实地全盘。"/,
  'inventory expert header should show an i button with the mixed count-method explanation after the question'
);

assert.doesNotMatch(
  inventoryMatrixJuly,
  /INVENTORY_OPERATION_KAEG_REFERENCE|管理层的专家与该流程相关/,
  'inventory operation header should not keep the far-right operation K button reference'
);

assert.match(
  inventoryMatrixJuly,
  /<th className=\{`\$\{headerCellClassName\} \$\{stickyRightHeaderClassName\}`\}>操作<\/th>/,
  'inventory operation header should render only the operation label'
);

assert.match(
  inventoryMatrixJuly,
  /<div className="mb-2 mt-2 flex flex-wrap items-center justify-between gap-3 px-1"[\s\S]*placeholder="搜索所属公司名称、受访单位名称、类别"[\s\S]*<div\s+className="overflow-x-auto/,
  'inventory matrix should render the search box at the upper-left of the table body'
);

assert.match(
  inventoryMatrixJuly,
  /type InventoryMatrixProps = \{[\s\S]*lockIdentityColumns\?: boolean;[\s\S]*export default function InventoryMatrix\([\s\S]*lockIdentityColumns = false/,
  'inventory matrix should receive identity-column lock state from the existing outer save action'
);

assert.match(
  inventoryMatrixJuly,
  /toolbarActions\?: React\.ReactNode;[\s\S]*<div className="flex flex-wrap items-center justify-end gap-3">\s*\{toolbarActions\}[\s\S]*aria-label="期末预审显示切换"/,
  'inventory matrix toolbar actions should render immediately before the balance-stage switch'
);

assert.match(
  inventoryMatrixJuly,
  /<td className=\{lockIdentityColumns \? grayCellClassName : yellowCellClassName\}>[\s\S]*value=\{row\.companyName\}[\s\S]*readOnly=\{lockIdentityColumns\}[\s\S]*<td className=\{lockIdentityColumns \? grayCellClassName : yellowCellClassName\}>[\s\S]*value=\{row\.intervieweeName\}[\s\S]*readOnly=\{lockIdentityColumns\}/,
  'inventory matrix should make company and interviewee columns gray and read-only after the outer save'
);

assert.doesNotMatch(
  renderedInventoryMatrixJuly,
  /onClick=\{\(\) => setIsSaved\(true\)\}|已保存/,
  'inventory matrix should not render its own extra save button below table one'
);

const searchPlaceholderIndex = inventoryMatrixJuly.indexOf('placeholder="搜索所属公司名称、受访单位名称、类别"');
const tableScrollIndex = inventoryMatrixJuly.indexOf('className="overflow-x-auto');

assert.ok(
  searchPlaceholderIndex !== -1 && tableScrollIndex !== -1,
  'inventory matrix should contain search input and table scroll container'
);

assert.ok(
  searchPlaceholderIndex < tableScrollIndex,
  'inventory matrix search box should render before the table'
);

assert.match(
  inventoryMatrixJuly,
  /displayRows\.length[\s\S]*inventoryPageSize[\s\S]*paginatedRows = shouldShowInventoryPagination[\s\S]*displayRows\.slice/,
  'inventory matrix pagination should use filtered and sorted display rows'
);

assert.match(
  inventoryMatrixJuly,
  /getHeaderHintLeft[\s\S]*fallbackCenterLeft[\s\S]*offsetLeft \+ headerRef\.current\.offsetWidth \/ 2/,
  'inventory matrix hints should align from the header center'
);

assert.match(
  inventoryMatrixJuly,
  /style=\{\{ left: centerLeft - matrixScrollLeft, marginLeft: -65 \}\}/,
  'matrix hint bubble should use a centered margin offset instead of stale left offsets'
);

console.log('check passed: PreWpJuly inventory search and sort');
