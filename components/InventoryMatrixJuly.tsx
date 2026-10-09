/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowDownWideNarrow,
  ArrowLeft,
  ArrowRight,
  ArrowUpNarrowWide,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Pencil,
  Trash2,
} from 'lucide-react';
import TableFullscreenFrame from './TableFullscreenFrameJuly';
import {
  allowsThirdPartyEvidence,
  getInventoryProcedureDecision,
  getInventoryProcedureDisplayLabels,
} from '../utils/inventoryProcedureRules';
import {
  INDEPENDENT_ATTENDANCE_VALUE,
  INDEPENDENT_AUDIT_APPROACH,
  isAuditApproachOptionDisabled,
  resolveAuditApproachForAttendanceDay,
} from '../utils/inventoryAttendanceRules';

export type InventoryMatrixRow = {
  id: string;
  location: string;
  companyName: string;
  intervieweeName: string;
  selectedAsSample: string;
  category: string;
  priorBalance: string;
  currentInterimStage: string;
  priorShare: string;
  interimPlannedBalance: string;
  interimShare: string;
  interimChange: string;
  finalPlannedBalance: string;
  finalShare: string;
  finalChange: string;
  endingBalanceConfirmation: string;
  systemType: string;
  thirdPartyStorage: string;
  inventoryCountPlan: string;
  countMethod: string;
  useExpert: string;
  plannedAttendancePrimary: string;
  plannedAttendanceSecondary: string;
  auditApproach: string;
  sampleQuantity: string;
  confirmedInventoryMethod: string;
  confirmThirdPartyInventory: string;
  monitorMode: string;
  useExperts: string;
  useInternalAudit: string;
  sampleChangeReason: string;
};

type InventoryMatrixProps = {
  title?: string;
  embedded?: boolean;
  hideNoteLabels?: boolean;
  lockIdentityColumns?: boolean;
  toolbarActions?: React.ReactNode;
  footerRightContent?: React.ReactNode;
  rows?: InventoryMatrixRow[];
  onRowsChange?: (rows: InventoryMatrixRow[]) => void;
  onCreateTasks?: () => void;
  onOpenLocationSettings?: (rowId: string) => void;
};

type InventoryMatrixView = 'balance' | 'management' | 'monitoring' | 'arrangements' | 'all';
type SampleSelectionFilter = 'all' | 'yes' | 'no';
type BulkEditableInventoryField =
  | 'endingBalanceConfirmation'
  | 'inventoryCountPlan'
  | 'useExpert'
  | 'plannedAttendancePrimary'
  | 'plannedAttendanceSecondary'
  | 'auditApproach'
  | 'sampleQuantity';

type InventorySortDirection = 'ascending' | 'descending';
type InventoryAmountSortField =
  | 'priorBalance'
  | 'currentInterimStage'
  | 'interimPlannedBalance'
  | 'finalPlannedBalance';
type InventoryAmountSort = {
  field: InventoryAmountSortField;
  direction: InventorySortDirection;
} | null;
const INVENTORY_PAGE_SIZE_OPTIONS = [15, 30, 50] as const;
const INVENTORY_WEB_AMOUNT_SCALE = 0.000001;
const ALL_VIEW_TABLE_WIDTH = 2811;
const ALL_VIEW_SCROLL_COLUMN_WIDTHS = [
  101, 46, 54, 88, 46, 92, 46, 54, 92, 46,
  120, 150, 125, 170, 82, 92,
  105, 105, 170, 72,
  155, 125, 145,
  120,
] as const;
const SELECT_PLACEHOLDER = '从下拉菜单选择';
const INVENTORY_MATRIX_VIEWS: Array<{ value: InventoryMatrixView; label: string }> = [
  { value: 'balance', label: '存货余额' },
  { value: 'management', label: '存货管理方式' },
  { value: 'monitoring', label: '存货监盘方法' },
  { value: 'arrangements', label: '其他安排' },
  { value: 'all', label: '显示全部' },
];

const SYSTEM_OPTIONS = ['定期盘存系统', '永续盘存系统'];
const ENDING_BALANCE_CONFIRMATION_OPTIONS = [
  '期末存货余额通过存货出入库和移动的记录来确认',
  '期末存货余额通过期末实施的实地盘点结果来确定',
];
const YES_NO_OPTIONS = ['否', '是'];
const ATTENDANCE_DAY_OPTIONS = ['是', INDEPENDENT_ATTENDANCE_VALUE];
const ATTENDANCE_FEASIBILITY_OPTIONS = [
  '是',
  '否，存在因不可预见的情况，而无法现场实施监盘的情形',
  '否，存货盘点现场实施存货监盘不可行',
] as const;
const AUDIT_APPROACH_OPTIONS = [
  SELECT_PLACEHOLDER,
  INDEPENDENT_AUDIT_APPROACH,
  '双重目的方案',
  '实质性程序方案',
  '控制测试方案',
  '未识别出重大错报风险（仅限ISA项目）',
];
export const CONFIRMED_INVENTORY_METHOD_OPTIONS = [
  SELECT_PLACEHOLDER,
  '采取控制测试方案或双重目的的方案对管理层的循环盘点实施程序',
  '采取实质性方案、控制测试方案或双重目的的方案对管理层的全面实地盘点实施程序',
  '就存放于第三方地点的存货获取证据',
  '存货盘点-独立盘点（不可预见情形仅适用 4.1、4.4、4.5）',
  '当项目组因不可预见的情况而无法在管理层存货盘点现场实施监盘时，实施的程序',
  '如果在存货盘点现场实施存货监盘不可行时，实施的替代程序',
  '仅限于 ISA 项目，当与存货数量和状况有关的风险未被评估为重大错报风险但存货对财务报表重要时，参加管理层存货盘点时实施的程序',
] as const;
const MONITOR_MODE_OPTIONS = [SELECT_PLACEHOLDER, '现场监盘', '远程监盘', '不适用'];
const INVENTORY_MONITORING_NOT_PRACTICABLE = '由存货的性质、存放地点等因素，实施存货监盘不可行';
const COUNT_METHOD_OPTIONS = [
  '循环盘点',
  '在期末完成盘点',
  '在非期末时点完成盘点',
];
const INVENTORY_COUNT_PLAN_OPTIONS = [
  '在期末实施的、盘点对象为整个存货总体的实地存货盘点',
  '在期末以外的特定日期实施的、盘点对象为整个存货总体的实地存货盘点',
  '在整个会计期间内，定期进行的存货盘点',
  '在一年中不同时间实施的、盘点对象为每一存放地点实施的实地存货盘点',
  '在一年中不同时间实施的、按存货项目储位 (如存储箱、分隔间、货架、行) 为每一存放单位实施的实地存货盘点',
];
const BULK_EDIT_FIELD_CONFIGS: Array<{
  field: BulkEditableInventoryField;
  label: string;
  side: 'left' | 'right';
  options?: readonly string[];
}> = [
  { field: 'endingBalanceConfirmation', label: '被审计单位如何确认期末存货余额', side: 'left', options: ENDING_BALANCE_CONFIRMATION_OPTIONS },
  { field: 'inventoryCountPlan', label: '被审计单位如何计划具体存货盘点', side: 'left', options: INVENTORY_COUNT_PLAN_OPTIONS },
  { field: 'useExpert', label: '被审计单位是否使用专家', side: 'left', options: YES_NO_OPTIONS },
  { field: 'plannedAttendancePrimary', label: '存货所在地址是否可实施监盘', side: 'right', options: ATTENDANCE_FEASIBILITY_OPTIONS },
  { field: 'plannedAttendanceSecondary', label: '项目组前往当日，客户是否开展盘点', side: 'right', options: ATTENDANCE_DAY_OPTIONS },
  { field: 'auditApproach', label: '项目组就监盘而计划的审计方案', side: 'right', options: AUDIT_APPROACH_OPTIONS },
  { field: 'sampleQuantity', label: '样本数量', side: 'right' },
];

const EMPTY_BULK_EDIT_VALUES: Record<BulkEditableInventoryField, string> = {
  endingBalanceConfirmation: SELECT_PLACEHOLDER,
  inventoryCountPlan: SELECT_PLACEHOLDER,
  useExpert: SELECT_PLACEHOLDER,
  plannedAttendancePrimary: SELECT_PLACEHOLDER,
  plannedAttendanceSecondary: SELECT_PLACEHOLDER,
  auditApproach: SELECT_PLACEHOLDER,
  sampleQuantity: '',
};

const SAMPLE_SELECTION_OPTIONS = ['是', '否'];
const MIXED_COUNT_METHOD_EXPLANATION =
  '在某些情况下，被审计单位可能对部分存货进行循环盘点，而对剩余存货进行实地全盘。';

const INVENTORY_KEYWORD_REFERENCES = {
  perpetualSystem:
    '永续盘存系统：根据一天内的存货出入库和移动，按存货的存货单位或序列号连续跟踪存货数量而设置的流程。（通常运用信息技术应用程序）',
  periodicSystem:
    '定期盘存系统：采用同一个账户来记录会计期间内所有存货采购交易。销货成本用采购总额加期初存货余额减期末存货余额在期末一次性计算。（期末存货余额通过期末实施的实地盘点结果来确定）',
  thirdPartyLocation:
    '第三方地点：存货存放在公共仓库或其他外部保管机构 （如存放于分包商的存货、寄售存货等）',
  cycleCount:
    '为统计和调整存货数量在整个会计期间内定期进行的存货盘点。很多零售商是在一年中不同时间对各个店铺进行实地全盘。项目组可把这种做法当作循环盘点法。\n\n某些情况下，被审计单位可能对部分存货进行循环盘点，而对剩余存货进行实地全盘。',
  expert:
    '专家：被审计单位使用第三方盘点人员时，第三方盘点人员是管理层的延伸，目的是为某项基础工作（清点存货）提供额外的业务能力，则他们不被视为管理层的专家。然而，如果管理层委托第三方提供实物盘点（如化学物品或贵金属）所需的专业知识，项目组将其作为管理层的专家进行评价。',
} as const;

const isSampleYesValue = (value: string) =>
  value.toLowerCase() === 'yes' || value.includes('是') || value.includes('鏄');

const isSampleNoValue = (value: string) =>
  value.toLowerCase() === 'no' || value.includes('否') || value.includes('鍚');

export const createInventoryMatrixRow = (id: string): InventoryMatrixRow => ({
  id,
  location: '',
  companyName: '',
  intervieweeName: '',
  selectedAsSample: '是',
  category: '',
  priorBalance: '',
  currentInterimStage: '',
  priorShare: '',
  interimPlannedBalance: '',
  interimShare: '',
  interimChange: '',
  finalPlannedBalance: '',
  finalShare: '',
  finalChange: '',
  endingBalanceConfirmation: ENDING_BALANCE_CONFIRMATION_OPTIONS[0],
  systemType: '永续盘存系统',
  thirdPartyStorage: '否',
  inventoryCountPlan: INVENTORY_COUNT_PLAN_OPTIONS[0],
  countMethod: '在期末完成盘点',
  useExpert: '否',
  plannedAttendancePrimary: '是',
  plannedAttendanceSecondary: '是',
  auditApproach: SELECT_PLACEHOLDER,
  sampleQuantity: '',
  confirmedInventoryMethod: SELECT_PLACEHOLDER,
  confirmThirdPartyInventory: '否',
  monitorMode: SELECT_PLACEHOLDER,
  useExperts: '否',
  useInternalAudit: '否',
  sampleChangeReason: '',
});

export const INITIAL_INVENTORY_MATRIX_ROWS: InventoryMatrixRow[] = ['1', '2', '3', '4', '5', '6'].map(createInventoryMatrixRow);
const AMOUNT_FIELDS: Array<keyof InventoryMatrixRow> = [
  'priorBalance',
  'currentInterimStage',
  'interimPlannedBalance',
  'finalPlannedBalance',
];

const headerCellClassName =
  "border border-slate-300 bg-[#F1F6FD] px-2 py-1 text-center font-['Microsoft_YaHei'] text-[11px] font-bold leading-[1.15] text-gray-700";

const lightHeaderCellClassName =
  "border border-slate-300 bg-[#F1F6FD] px-2 py-1 text-center font-['Microsoft_YaHei'] text-[11px] font-bold leading-[1.15] text-[#1f1f1f]";

const greenHeaderCellClassName =
  "border border-slate-300 bg-[#F1F6FD] px-2 py-1 text-center font-['Microsoft_YaHei'] text-[11px] font-bold leading-[1.15] text-black";

const bodyCellClassName =
  'border border-slate-300 bg-white p-0 align-middle text-center text-[11px] leading-[1.1] text-[#1f1f1f]';

const yellowCellClassName = `${bodyCellClassName} bg-white`;
const neutralCellClassName = `${bodyCellClassName} bg-white`;
const grayCellClassName = `${bodyCellClassName} bg-[#f7f9fa]`;

const inputClassName =
  'h-[21px] w-full border-0 bg-transparent px-2 text-center text-[11px] text-[#1f1f1f] outline-none';
const amountInputClassName =
  'h-[21px] w-full border-0 bg-transparent px-2 text-center text-[11px] text-[#1f1f1f] outline-none';

const selectClassName =
  'h-[21px] w-full appearance-none border-0 bg-transparent px-2 text-[11px] text-[#1f1f1f] outline-none';

const calculatedCellClassName =
  'border border-slate-300 bg-black px-2 py-1 align-middle text-center text-[11px] font-semibold text-white';

function CenteredLeftHeaderText({ children }: { children: React.ReactNode }) {
  return <span className="inline-block text-left">{children}</span>;
}

function resolveAttendanceDayValue(plannedAttendancePrimary: string) {
  return plannedAttendancePrimary === '是' ? '是' : '';
}

function getInventorySelectionAlignment(value: string) {
  const normalizedValue = value.replace(/[\s，。、“”‘’（）【】\[\]]/g, '');
  return value !== SELECT_PLACEHOLDER && normalizedValue.length > 0 && normalizedValue.length <= 8
    ? 'text-center'
    : 'text-left';
}

export function resolveInventoryAuditApproach(
  row: Pick<InventoryMatrixRow, 'plannedAttendancePrimary' | 'plannedAttendanceSecondary' | 'auditApproach'>
) {
  let auditApproach = row.auditApproach;

  if (row.plannedAttendancePrimary.includes('不可预见')) {
    return '由于不可预见的情况无法实施监盘，实施的独立盘点方案等程序';
  }

  if (row.plannedAttendancePrimary.includes('不可行')) {
    return '由于存货的性质、存放地点等因素，实施存货监盘不可行时，实施的替代程序';
  }

  if (
    row.plannedAttendancePrimary === '是' &&
    row.plannedAttendanceSecondary === '否，项目组采取独立盘点'
  ) {
    return '独立盘点方案';
  }

  if (
    row.plannedAttendancePrimary !== '是' ||
    row.plannedAttendanceSecondary !== '是' ||
    !auditApproach ||
    auditApproach === SELECT_PLACEHOLDER
  ) {
    return null;
  }

  return auditApproach;
}

function getDerivedInventoryMethods(row: InventoryMatrixRow) {
  const auditApproach = resolveInventoryAuditApproach(row);

  if (!auditApproach) {
    return [];
  }

  const decision = getInventoryProcedureDecision({
    auditApproach,
    countMethod: row.countMethod,
    importedSystemType: row.systemType,
    confirmThirdPartyInventory: row.confirmThirdPartyInventory,
  });

  return getInventoryProcedureDisplayLabels(decision.groupIds);
}

function ReadOnlyInventoryValue({ value }: { value: string }) {
  return (
    <div className="flex min-h-[21px] w-full items-center justify-center px-2 py-1 text-center text-[11px] leading-[1.25] text-slate-600">
      {value}
    </div>
  );
}

function DerivedInventoryMethodCell({ row }: { row: InventoryMatrixRow }) {
  const methods = getDerivedInventoryMethods(row);

  return (
    <div className="flex min-h-[21px] w-full flex-col items-center justify-center gap-1 px-2 py-1.5 text-center text-[11px] leading-[1.3] text-slate-700">
      {methods.map((method) => <span key={method}>{method}</span>)}
    </div>
  );
}
const derivedCellClassName =
  'border border-slate-300 bg-[#f7f9fa] px-2 py-1 align-middle text-center text-[11px] font-semibold text-[#1f1f1f]';
const stickyIndexHeaderClassName = 'sticky left-0 z-30';
const stickyIndexCellClassName = 'sticky left-0 z-20';
const stickyRightHeaderClassName =
  'sticky right-0 z-30 shadow-[-8px_0_12px_-10px_rgba(15,23,42,0.35)]';
const stickyRightCellClassName =
  'sticky right-0 z-20 shadow-[-8px_0_12px_-10px_rgba(15,23,42,0.35)]';

function InventoryKButton({ label, className = '' }: { label: string; className?: string }) {
  return (
    <button
      type="button"
      aria-label={`KAEG 索引 ${label}`}
      className={`group/kaeg relative ml-1 inline-flex h-4 w-4 flex-none items-center justify-center rounded-full border border-[#00338D] bg-[#00338D] text-[10px] font-semibold leading-none text-white shadow-sm transition hover:border-[#002b75] hover:bg-[#002b75] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 ${className}`}
    >
      K
      <span className="pointer-events-none absolute left-1/2 top-full z-[90] mt-1 w-max max-w-[300px] -translate-x-1/2 whitespace-pre-line rounded bg-gray-900 px-2 py-1 text-left text-[11px] leading-4 text-white opacity-0 shadow-lg transition-opacity group-hover/kaeg:opacity-100 group-focus-visible/kaeg:opacity-100">
        {label}
      </span>
    </button>
  );
}

function InventoryInlineInfoButton({ ariaLabel, label }: { ariaLabel: string; label: string }) {
  return (
    <button
      type="button"
      className="group/info relative ml-1 inline-flex h-3.5 w-3.5 flex-none items-center justify-center rounded-full border border-black/40 bg-white text-[9px] font-bold leading-none text-[#143f97]"
      aria-label={ariaLabel}
    >
      i
      <span className="pointer-events-none absolute left-1/2 top-full z-[90] mt-1 w-[300px] -translate-x-1/2 whitespace-pre-line rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-[11px] font-normal leading-5 text-gray-700 opacity-0 shadow-lg transition-opacity group-hover/info:opacity-100 group-focus-visible/info:opacity-100">
        {label}
      </span>
    </button>
  );
}

function ExplanationColumnsExpandButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className="group/explanation-expand relative z-[60] inline-flex cursor-pointer items-center justify-center text-[#143f97] focus:outline-none focus:ring-2 focus:ring-blue-300/40"
      aria-label="展开解释列"
    >
      <ArrowLeft className="inventory-explanation-arrow-left h-3.5 w-3.5 flex-none" strokeWidth={2} />
      <span className="mx-0.5 inline-flex flex-wrap items-center justify-center text-gray-700">{children}</span>
      <ArrowRight className="inventory-explanation-arrow-right h-3.5 w-3.5 flex-none" strokeWidth={2} />
      <span className="pointer-events-none absolute left-1/2 top-full z-[90] mt-2 w-max -translate-x-1/2 rounded bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium leading-4 text-white opacity-0 shadow-lg transition-opacity group-hover/explanation-expand:opacity-100 group-focus-visible/explanation-expand:opacity-100">
        展开解释列
      </span>
    </span>
  );
}

function parseAmount(value: string) {
  const normalizedValue = value.replace(/,/g, '').trim();
  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function formatAmount(value: number | null) {
  if (value === null) {
    return '-';
  }

  const formatter = new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(value);
}

function formatEditableAmount(value: string) {
  const amount = parseAmount(value);
  return amount === null ? value : formatAmount(amount);
}

function formatInventoryWebAmount(value: string) {
  const amount = parseAmount(value);

  if (amount === null) {
    return value;
  }

  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount * INVENTORY_WEB_AMOUNT_SCALE);
}

function formatInventoryTotalAmount(value: number | null) {
  return value === null ? '-' : formatInventoryWebAmount(String(value));
}

function convertInventoryWebAmountToRaw(value: string) {
  const amount = parseAmount(value);
  return amount === null
    ? value
    : formatEditableAmount(String(amount / INVENTORY_WEB_AMOUNT_SCALE));
}

function InventoryAmountInput({
  rawValue,
  onCommit,
}: {
  rawValue: string;
  onCommit: (value: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState('');
  const displayValue = isEditing ? draftValue : formatInventoryWebAmount(rawValue);

  return (
    <input
      className={amountInputClassName}
      value={displayValue}
      onFocus={() => {
        setDraftValue(formatInventoryWebAmount(rawValue));
        setIsEditing(true);
      }}
      onChange={(event) => setDraftValue(event.target.value)}
      onBlur={() => {
        setIsEditing(false);
        onCommit(convertInventoryWebAmountToRaw(draftValue));
      }}
    />
  );
}

function WrappedInventorySelect({
  value,
  options,
  onChange,
  className = '',
  disabled = false,
  isOptionDisabled,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  isOptionDisabled?: (option: string) => boolean;
}) {
  return (
    <div className={`relative min-h-[38px] w-full ${className}`}>
      <span
        className={`flex min-h-[38px] items-center whitespace-normal break-words px-1 py-1 text-[11px] leading-[1.2] ${getInventorySelectionAlignment(value) === 'text-center' ? 'justify-center text-center' : 'justify-start text-left'} ${disabled ? 'text-gray-400' : 'text-gray-700'}`}
      >
        {value}
      </span>
      <select
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-label={value}
      >
        {options.map((option) => (
          <option key={option} value={option} disabled={isOptionDisabled?.(option)}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function CircularSelectionCheckbox({
  checked,
  indeterminate = false,
  disabled = false,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <label className={`inline-flex shrink-0 items-center justify-center ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={ariaLabel}
      />
      <span
        className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border transition ${
          checked || indeterminate
            ? 'border-[#00338D] bg-[#00338D] text-white'
            : 'border-slate-400 bg-white text-transparent hover:border-[#00338D]'
        }`}
        aria-hidden="true"
      >
        {checked ? <Check size={10} strokeWidth={3} /> : indeterminate ? <span className="h-0.5 w-1.5 rounded bg-white" /> : null}
      </span>
    </label>
  );
}

function normalizeInventoryAmountFields(row: InventoryMatrixRow): InventoryMatrixRow {
  return AMOUNT_FIELDS.reduce(
    (normalizedRow, field) => ({
      ...normalizedRow,
      [field]: formatEditableAmount(normalizedRow[field]),
    }),
    { ...row }
  );
}

function normalizeInventoryRows(rows: InventoryMatrixRow[]) {
  return rows.map(normalizeInventoryAmountFields);
}

function formatRatio(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return '-';
  }

  return `${(value * 100).toFixed(2)}%`;
}

function calculateShare(amount: number | null, total: number | null) {
  if (amount === null || total === null || total === 0) {
    return null;
  }

  return amount / total;
}

function calculateChange(numerator: number | null, baseline: number | null) {
  if (numerator === null || baseline === null || baseline === 0) {
    return null;
  }

  return numerator / baseline;
}

export default function InventoryMatrix({
  title = '了解矩阵',
  embedded = false,
  hideNoteLabels = false,
  lockIdentityColumns = false,
  toolbarActions,
  footerRightContent,
  rows: controlledRows,
  onRowsChange,
  onCreateTasks,
  onOpenLocationSettings,
}: InventoryMatrixProps) {
  const [uncontrolledRows, setUncontrolledRows] = useState<InventoryMatrixRow[]>(
    controlledRows ?? INITIAL_INVENTORY_MATRIX_ROWS
  );
  const [matrixView, setMatrixView] = useState<InventoryMatrixView | null>(null);
  const [phaseView, setPhaseView] = useState<'balance' | 'interim'>('balance');
  const [isExplanationColumnsExpanded, setIsExplanationColumnsExpanded] = useState(false);
  const [matrixScrollLeft, setMatrixScrollLeft] = useState(0);
  const [isCategoryTooltipVisible, setIsCategoryTooltipVisible] = useState(false);
  const [inventoryPageSize, setInventoryPageSize] = useState<(typeof INVENTORY_PAGE_SIZE_OPTIONS)[number]>(15);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [sampleSelectionFilter, setSampleSelectionFilter] = useState<SampleSelectionFilter>('all');
  const [inventoryAmountSort, setInventoryAmountSort] = useState<InventoryAmountSort>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isBulkEditLocationsExpanded, setIsBulkEditLocationsExpanded] = useState(false);
  const [enabledBulkEditFields, setEnabledBulkEditFields] = useState<BulkEditableInventoryField[]>([]);
  const [bulkEditValues, setBulkEditValues] = useState<Record<BulkEditableInventoryField, string>>({
    ...EMPTY_BULK_EDIT_VALUES,
  });
  const [pendingSampleChange, setPendingSampleChange] = useState<{
    rowIds: string[];
    nextValue: string;
    reason: string;
  } | null>(null);
  const [, setMatrixLayoutVersion] = useState(0);
  const lastHorizontalWheelStepAtRef = useRef(0);
  const categoryHeaderRef = useRef<HTMLTableCellElement>(null);
  const countMethodHeaderRef = useRef<HTMLTableCellElement>(null);
  const rows = controlledRows ?? uncontrolledRows;
  const isControlled = controlledRows !== undefined;
  const normalizedInventorySearchTerm = inventorySearchTerm.trim().toLowerCase();
  const searchFilteredRows = normalizedInventorySearchTerm
    ? rows.filter((row) =>
        [row.companyName, row.intervieweeName, row.category].some((value) =>
          value.toLowerCase().includes(normalizedInventorySearchTerm)
        )
      )
    : rows;
  const filteredRows = searchFilteredRows.filter((row) => {
    if (sampleSelectionFilter === 'yes') return isSampleYesValue(row.selectedAsSample);
    if (sampleSelectionFilter === 'no') return isSampleNoValue(row.selectedAsSample);
    return true;
  });
  const displayRows = [...filteredRows].sort((firstRow, secondRow) => {
    if (!inventoryAmountSort) {
      return 0;
    }

    const firstAmount = parseAmount(firstRow[inventoryAmountSort.field]);
    const secondAmount = parseAmount(secondRow[inventoryAmountSort.field]);

    if (firstAmount === null && secondAmount === null) {
      return 0;
    }

    if (firstAmount === null) {
      return 1;
    }

    if (secondAmount === null) {
      return -1;
    }

    return inventoryAmountSort.direction === 'ascending'
      ? firstAmount - secondAmount
      : secondAmount - firstAmount;
  });

  useEffect(() => {
    if (controlledRows) {
      const normalizedRows = normalizeInventoryRows(controlledRows);
      setUncontrolledRows(normalizedRows);

      if (JSON.stringify(normalizedRows) !== JSON.stringify(controlledRows)) {
        onRowsChange?.(normalizedRows);
      }
    }
  }, [controlledRows, onRowsChange]);

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(displayRows.length / inventoryPageSize));
    setInventoryPage((currentPage) => Math.min(currentPage, nextTotalPages));
  }, [displayRows.length, inventoryPageSize]);

  useEffect(() => {
    const availableRowIds = new Set(rows.map((row) => row.id));
    setSelectedRowIds((current) => current.filter((id) => availableRowIds.has(id)));
  }, [rows]);

  useLayoutEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setMatrixLayoutVersion((version) => version + 1);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [matrixView, isExplanationColumnsExpanded, displayRows.length, inventoryPage, inventoryPageSize]);

  const commitRows = (updater: (currentRows: InventoryMatrixRow[]) => InventoryMatrixRow[]) => {
    const nextRows = updater(rows);

    if (!isControlled) {
      setUncontrolledRows(nextRows);
    }

    onRowsChange?.(nextRows);
  };

  const addRow = () => {
    commitRows((currentRows) => [
      ...currentRows,
      createInventoryMatrixRow(Math.random().toString(36).slice(2, 11)),
    ]);
  };

  const removeRow = (id: string) => {
    commitRows((currentRows) =>
      currentRows.length === 1 ? currentRows : currentRows.filter((row) => row.id !== id)
    );
  };

  const updateRow = (id: string, field: keyof InventoryMatrixRow, value: string) => {
    commitRows((currentRows) =>
      currentRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleEndingBalanceConfirmationChange = (id: string, value: string) => {
    const systemType = value.includes('期末实施的实地盘点结果')
      ? '定期盘存系统'
      : '永续盘存系统';

    commitRows((currentRows) =>
      currentRows.map((row) =>
        row.id === id ? { ...row, endingBalanceConfirmation: value, systemType } : row
      )
    );
  };

  const handleInventoryCountPlanChange = (id: string, value: string) => {
    const countMethod = value.includes('期末以外的特定日期')
      ? '在非期末时点完成盘点'
      : value.includes('在期末实施的')
        ? '在期末完成盘点'
        : '循环盘点';

    commitRows((currentRows) =>
      currentRows.map((row) =>
        row.id === id ? { ...row, inventoryCountPlan: value, countMethod } : row
      )
    );
  };

  const handleThirdPartyStorageChange = (id: string, value: string) => {
    commitRows((currentRows) =>
      currentRows.map((row) =>
        row.id === id
          ? {
              ...row,
              thirdPartyStorage: value,
              confirmThirdPartyInventory: value === '否' ? '否' : row.confirmThirdPartyInventory,
            }
          : row
      )
    );
  };

  const handleAuditApproachChange = (id: string, value: string) => {
    commitRows((currentRows) =>
      currentRows.map((row) =>
        row.id === id
          ? {
              ...row,
              auditApproach: value,
              confirmThirdPartyInventory: allowsThirdPartyEvidence(value)
                ? row.confirmThirdPartyInventory
                : '否',
            }
          : row
      )
    );
  };

  const handleAttendanceFeasibilityChange = (id: string, value: string) => {
    commitRows((currentRows) =>
      currentRows.map((row) =>
        row.id === id
          ? {
              ...row,
              plannedAttendancePrimary: value,
              plannedAttendanceSecondary: resolveAttendanceDayValue(value),
              auditApproach: value === '是' ? SELECT_PLACEHOLDER : '',
              confirmThirdPartyInventory: '否',
            }
          : row
      )
    );
  };

  const handleAttendanceDayChange = (id: string, value: string) => {
    commitRows((currentRows) =>
      currentRows.map((row) =>
        row.id === id
          ? {
              ...row,
              plannedAttendanceSecondary: value,
              auditApproach: resolveAuditApproachForAttendanceDay(value),
              confirmThirdPartyInventory: '否',
            }
          : row
      )
    );
  };

  const handleSelectedAsSampleChange = (row: InventoryMatrixRow, nextValue: string) => {
    if (isSampleYesValue(row.selectedAsSample) && isSampleNoValue(nextValue)) {
      setPendingSampleChange({ rowIds: [row.id], nextValue, reason: '' });
      return;
    }

    updateRow(row.id, 'selectedAsSample', nextValue);
  };

  const confirmPendingSampleChange = () => {
    if (!pendingSampleChange) {
      return;
    }

    const pendingRowIds = new Set(pendingSampleChange.rowIds);
    commitRows((currentRows) =>
      currentRows.map((row) =>
        pendingRowIds.has(row.id)
          ? {
              ...row,
              selectedAsSample: pendingSampleChange.nextValue,
              sampleChangeReason: pendingSampleChange.reason.trim(),
            }
          : row
      )
    );
    setPendingSampleChange(null);
  };

  const totalPriorBalance = displayRows.reduce<number | null>((sum, row) => {
    const amount = parseAmount(row.priorBalance);
    if (amount === null) {
      return sum;
    }

    return (sum ?? 0) + amount;
  }, null);

  const totalInterimPlannedBalance = displayRows.reduce<number | null>((sum, row) => {
    const amount = parseAmount(row.interimPlannedBalance);
    if (amount === null) {
      return sum;
    }

    return (sum ?? 0) + amount;
  }, null);

  const totalCurrentInterimStage = displayRows.reduce<number | null>((sum, row) => {
    const amount = parseAmount(row.currentInterimStage);
    if (amount === null) {
      return sum;
    }

    return (sum ?? 0) + amount;
  }, null);

  const totalFinalPlannedBalance = displayRows.reduce<number | null>((sum, row) => {
    const amount = parseAmount(row.finalPlannedBalance);
    if (amount === null) {
      return sum;
    }

    return (sum ?? 0) + amount;
  }, null);

  const derivedRows = displayRows.map((row) => {
    const priorBalance = parseAmount(row.priorBalance);
    const currentInterimStage = parseAmount(row.currentInterimStage);
    const interimPlannedBalance = parseAmount(row.interimPlannedBalance);
    const finalPlannedBalance = parseAmount(row.finalPlannedBalance);

    const priorShare = formatRatio(calculateShare(priorBalance, totalPriorBalance));
    const currentInterimShare = formatRatio(
      calculateShare(currentInterimStage, totalCurrentInterimStage)
    );
    const interimShare = formatRatio(
      calculateShare(interimPlannedBalance, totalInterimPlannedBalance)
    );
    const interimChange = formatRatio(
      calculateChange(
        currentInterimStage !== null && interimPlannedBalance !== null
          ? interimPlannedBalance - currentInterimStage
          : null,
        currentInterimStage
      )
    );
    const finalShare = formatRatio(calculateShare(finalPlannedBalance, totalFinalPlannedBalance));
    const finalChange = formatRatio(
      calculateChange(
        finalPlannedBalance !== null && priorBalance !== null
          ? finalPlannedBalance - priorBalance
          : null,
        priorBalance
      )
    );

    return {
      ...row,
      priorShare,
      currentInterimShare,
      interimShare,
      interimChange,
      finalShare,
      finalChange,
    };
  });

  const shouldShowInventoryPagination = displayRows.length > 15;
  const inventoryTotalPages = Math.max(1, Math.ceil(displayRows.length / inventoryPageSize));
  const inventoryPageStartIndex = (inventoryPage - 1) * inventoryPageSize;
  const paginatedRows = shouldShowInventoryPagination
    ? displayRows.slice(inventoryPageStartIndex, inventoryPageStartIndex + inventoryPageSize)
    : displayRows;
  const selectedRowIdSet = new Set(selectedRowIds);
  const selectedRowsForBulkEdit = rows.filter((row) => selectedRowIdSet.has(row.id));
  const allSelectedRowsAreSamples =
    selectedRowsForBulkEdit.length > 0 && selectedRowsForBulkEdit.every((row) => isSampleYesValue(row.selectedAsSample));
  const someSelectedRowsAreSamples =
    !allSelectedRowsAreSamples && selectedRowsForBulkEdit.some((row) => isSampleYesValue(row.selectedAsSample));
  const allFilteredRowsSelected =
    displayRows.length > 0 && displayRows.every((row) => selectedRowIdSet.has(row.id));
  const someFilteredRowsSelected =
    !allFilteredRowsSelected && displayRows.some((row) => selectedRowIdSet.has(row.id));

  const toggleRowSelection = (rowId: string, checked: boolean) => {
    setSelectedRowIds((current) =>
      checked
        ? Array.from(new Set([...current, rowId]))
        : current.filter((id) => id !== rowId)
    );
  };

  const toggleAllFilteredRows = (checked: boolean) => {
    const filteredRowIds = new Set(displayRows.map((row) => row.id));
    setSelectedRowIds((current) =>
      checked
        ? Array.from(new Set([...current, ...filteredRowIds]))
        : current.filter((id) => !filteredRowIds.has(id))
    );
  };

  const removeRowFromBulkSelection = (rowId: string) => {
    const nextSelectedRowIds = selectedRowIds.filter((id) => id !== rowId);
    setSelectedRowIds(nextSelectedRowIds);

    if (nextSelectedRowIds.length === 0) {
      setIsBulkEditOpen(false);
    }
  };

  const removeSelectedRows = () => {
    if (selectedRowIds.length === 0) return;
    const selectedIds = new Set(selectedRowIds);

    commitRows((currentRows) => {
      const remainingRows = currentRows.filter((row) => !selectedIds.has(row.id));
      return remainingRows.length > 0
        ? remainingRows
        : [createInventoryMatrixRow(Math.random().toString(36).slice(2, 11))];
    });
    setSelectedRowIds([]);
  };

  const handleBulkSampleSelectionChange = (checked: boolean) => {
    if (checked) {
      commitRows((currentRows) =>
        currentRows.map((row) =>
          selectedRowIdSet.has(row.id) ? { ...row, selectedAsSample: '是' } : row
        )
      );
      return;
    }

    const rowsChangingToNo = selectedRowsForBulkEdit.filter((row) => isSampleYesValue(row.selectedAsSample));
    if (rowsChangingToNo.length === 0) return;

    setPendingSampleChange({
      rowIds: rowsChangingToNo.map((row) => row.id),
      nextValue: '否',
      reason: '',
    });
  };

  const openBulkEditModal = () => {
    if (selectedRowIds.length === 0) return;
    setBulkEditValues({ ...EMPTY_BULK_EDIT_VALUES });

    setEnabledBulkEditFields([]);
    setIsBulkEditLocationsExpanded(false);
    setIsBulkEditOpen(true);
  };

  const applyBulkEdits = () => {
    if (enabledBulkEditFields.length === 0) return;
    const selectedIds = new Set(selectedRowIds);

    commitRows((currentRows) =>
      currentRows.map((row) => {
        if (!selectedIds.has(row.id)) return row;
        const nextRow = { ...row };

        enabledBulkEditFields.forEach((field) => {
          nextRow[field] = bulkEditValues[field];
        });

        if (enabledBulkEditFields.includes('endingBalanceConfirmation')) {
          nextRow.systemType = nextRow.endingBalanceConfirmation.includes('期末实施的实地盘点结果')
            ? '定期盘存系统'
            : '永续盘存系统';
        }

        if (enabledBulkEditFields.includes('inventoryCountPlan')) {
          nextRow.countMethod = nextRow.inventoryCountPlan.includes('期末以外的特定日期')
            ? '在非期末时点完成盘点'
            : nextRow.inventoryCountPlan.includes('在期末实施的')
              ? '在期末完成盘点'
              : '循环盘点';
        }

        if (enabledBulkEditFields.includes('plannedAttendancePrimary')) {
          if (nextRow.plannedAttendancePrimary !== '是' && nextRow.plannedAttendancePrimary !== SELECT_PLACEHOLDER) {
            nextRow.plannedAttendanceSecondary = '';
            nextRow.auditApproach = '';
          } else if (nextRow.plannedAttendancePrimary === '是') {
            nextRow.plannedAttendanceSecondary = enabledBulkEditFields.includes('plannedAttendanceSecondary')
              ? bulkEditValues.plannedAttendanceSecondary
              : '是';
          }
        }

        if (
          nextRow.thirdPartyStorage === '否' ||
          !allowsThirdPartyEvidence(nextRow.auditApproach)
        ) {
          nextRow.confirmThirdPartyInventory = '否';
        }

        return nextRow;
      })
    );
    setIsBulkEditOpen(false);
    setSelectedRowIds([]);
  };

  const getHeaderHintLeft = (
    headerRef: React.RefObject<HTMLTableCellElement | null>,
    fallbackCenterLeft: number
  ) => {
    if (!headerRef.current) {
      return fallbackCenterLeft;
    }

    return headerRef.current.offsetLeft + headerRef.current.offsetWidth / 2;
  };

  const noteLabel = (noteNumber: number) => (hideNoteLabels ? '' : ` (Note ${noteNumber})`);
  const isBalanceView = matrixView === 'balance';
  const isAllColumnsView = matrixView === 'all';
  const isInterimView = phaseView === 'interim';
  const identityColumnWidths = matrixView === null
    ? [50, 84, 100, 64, 62]
    : [50, 92, 112, 72, 82];
  const identityColumnLefts = identityColumnWidths.map((_, index) =>
    identityColumnWidths.slice(0, index).reduce((total, width) => total + width, 0)
  );
  const currentAmountColumnLeft = identityColumnWidths.reduce((total, width) => total + width, 0);
  const hasStickyCurrentAmount = matrixView === null || matrixView === 'balance' || matrixView === 'monitoring' || isAllColumnsView;
  const stickyIdentityHeaderClassName = 'sticky z-40 outline outline-1 -outline-offset-1 outline-slate-300';
  const stickyIdentityCellClassName = 'sticky z-20 outline outline-1 -outline-offset-1 outline-slate-300';
  const stickyIdentityBoundaryClassName = 'shadow-[8px_0_12px_-10px_rgba(15,23,42,0.45)]';
  const showAmountColumns = !isExplanationColumnsExpanded;
  const handleInventoryMatrixWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!isAllColumnsView) {
      return;
    }

    const container = event.currentTarget;
    const canScrollHorizontally = container.scrollWidth > container.clientWidth;

    if (!canScrollHorizontally) {
      return;
    }

    const horizontalDelta = event.deltaX !== 0 ? event.deltaX : event.deltaY;
    if (Math.abs(horizontalDelta) < 8) {
      return;
    }

    event.preventDefault();
    const now = performance.now();
    if (now - lastHorizontalWheelStepAtRef.current < 140) {
      return;
    }
    lastHorizontalWheelStepAtRef.current = now;

    const columnBoundaries = ALL_VIEW_SCROLL_COLUMN_WIDTHS.reduce<number[]>(
      (boundaries, width) => [...boundaries, boundaries[boundaries.length - 1] + width],
      [0]
    );
    const currentLeft = container.scrollLeft;
    const targetLeft = horizontalDelta > 0
      ? columnBoundaries.find((boundary) => boundary > currentLeft + 2) ?? container.scrollWidth
      : [...columnBoundaries].reverse().find((boundary) => boundary < currentLeft - 2) ?? 0;

    container.scrollTo({ left: targetLeft, behavior: 'smooth' });
  };
  const renderAmountHeader = (label: string, field: InventoryAmountSortField) => {
    const [amountLabel, amountUnit] = label.split('（');
    const isActive = inventoryAmountSort?.field === field;
    const nextDirection: InventorySortDirection =
      isActive && inventoryAmountSort.direction === 'ascending' ? 'descending' : 'ascending';
    const SortIcon = isActive && inventoryAmountSort.direction === 'ascending'
      ? ArrowUpNarrowWide
      : ArrowDownWideNarrow;

    return (
      <div className="inline-flex min-h-[38px] flex-col items-start justify-center gap-0.5 text-left leading-tight">
        <span>{amountLabel}</span>
        <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
          {amountUnit ? <span>（{amountUnit}</span> : null}
          <button
            type="button"
            onClick={() => {
              setInventoryAmountSort({ field, direction: nextDirection });
              setInventoryPage(1);
            }}
            className={`inline-flex h-4 w-4 items-center justify-center rounded transition ${
              isActive
                ? 'bg-white text-[#143f97] shadow-sm'
                : 'border border-slate-300 bg-white text-slate-500 hover:border-blue-300 hover:text-[#143f97]'
            }`}
            aria-label={`${label} ${nextDirection}`}
            title={`${label} ${nextDirection}`}
          >
            <SortIcon size={10} strokeWidth={2} />
          </button>
        </span>
      </div>
    );
  };
  const renderSelectableCurrentAmountHeader = () => {
    const label = isInterimView ? '本期预审阶段余额（百万元）' : '本期期末余额（百万元）';
    const field: InventoryAmountSortField = isInterimView
      ? 'interimPlannedBalance'
      : 'finalPlannedBalance';
    const [amountLabel, amountUnit] = label.split('（');
    const isActive = inventoryAmountSort?.field === field;
    const nextDirection: InventorySortDirection =
      isActive && inventoryAmountSort.direction === 'ascending' ? 'descending' : 'ascending';
    const SortIcon = isActive && inventoryAmountSort.direction === 'ascending'
      ? ArrowUpNarrowWide
      : ArrowDownWideNarrow;

    return (
      <div className="inline-flex min-h-[38px] flex-col items-start justify-center gap-0.5 text-left leading-tight">
        <span className="inline-flex items-center justify-center gap-0.5 whitespace-nowrap">
          {amountLabel}
          <label
            className="relative inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded text-slate-500 transition hover:bg-white/80 hover:text-[#143f97]"
            title="切换本期期末余额或本期预审阶段余额"
          >
            <ChevronDown size={11} strokeWidth={2.5} aria-hidden="true" />
            <select
              value={phaseView}
              onChange={(event) => setPhaseView(event.target.value as 'balance' | 'interim')}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="选择本期余额时点"
            >
              <option value="balance">本期期末余额</option>
              <option value="interim">本期预审阶段余额</option>
            </select>
          </label>
        </span>
        <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
          {amountUnit ? <span>（{amountUnit}</span> : null}
          <button
            type="button"
            onClick={() => {
              setInventoryAmountSort({ field, direction: nextDirection });
              setInventoryPage(1);
            }}
            className={`inline-flex h-4 w-4 items-center justify-center rounded transition ${
              isActive
                ? 'bg-white text-[#143f97] shadow-sm'
                : 'border border-slate-300 bg-white text-slate-500 hover:border-blue-300 hover:text-[#143f97]'
            }`}
            aria-label={`${label} ${nextDirection}`}
            title={`${label} ${nextDirection}`}
          >
            <SortIcon size={10} strokeWidth={2} />
          </button>
        </span>
      </div>
    );
  };

  return (
    <div className={embedded ? 'mt-8' : 'space-y-4'}>
      {!embedded && <h2 className="border-l-4 border-blue-600 pl-3 text-lg font-bold">{title}</h2>}

      <div className={`${embedded ? '' : 'ml-4'} overflow-visible rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]`}>
        <TableFullscreenFrame
          title={title}
        >
        {isCategoryTooltipVisible && (
          <div
            className="absolute top-[-118px] z-[80] w-[300px] rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-[11px] font-normal leading-5 text-gray-700 shadow-lg"
            style={{ left: getHeaderHintLeft(categoryHeaderRef, 494) - matrixScrollLeft, marginLeft: -150 }}
          >
            根据财务报告编制基础的不同，存货类别可能包括原材料、材料与物料、包装材料、在产品、产成品、持有以供转售商品、备品备件及其他。
            <span className="absolute bottom-[-5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-gray-200 bg-white" />
          </div>
        )}
        <div className="mb-2 mt-2 flex flex-wrap items-end justify-between gap-3 px-1">
          <div className="flex w-[390px] flex-col items-start gap-2">
            <label className="relative block w-full">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={inventorySearchTerm}
                onChange={(event) => {
                  setInventorySearchTerm(event.target.value);
                  setInventoryPage(1);
                }}
                placeholder="搜索所属公司名称、受访单位名称、类别"
                className="h-7 w-full rounded border border-slate-200 bg-white py-1 pl-7 pr-2 text-[11px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#143f97] focus:ring-1 focus:ring-[#143f97]/20"
              />
            </label>
            <div
              className="flex w-full items-center overflow-hidden rounded-full border border-blue-200 bg-white p-0.5 text-[11px] font-medium shadow-sm"
              role="group"
              aria-label="存货矩阵字段分组"
            >
              {INVENTORY_MATRIX_VIEWS.map((view) => (
                <button
                  key={view.value}
                  type="button"
                  aria-pressed={matrixView === view.value}
                  onClick={() => setMatrixView((current) => current === view.value ? null : view.value)}
                  className={`whitespace-nowrap rounded-full px-3 py-1 transition ${matrixView === view.value ? 'bg-[#143f97] text-white shadow-sm' : 'text-[#143f97] hover:bg-white/70'}`}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 self-end">
            <div className="flex items-center">
              <div className="flex h-8 items-center overflow-hidden rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
                {toolbarActions}
                <span className="mx-0.5 h-4 w-px bg-slate-200" aria-hidden="true" />
                <button
                  type="button"
                  onClick={openBulkEditModal}
                  disabled={selectedRowIds.length === 0}
                  className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium text-[#00338D] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                  title={selectedRowIds.length === 0 ? '请先勾选需要编辑的行' : `编辑已选择的 ${selectedRowIds.length} 行`}
                >
                  <Pencil size={12} />
                  编辑{selectedRowIds.length > 0 ? ` ${selectedRowIds.length}` : ''}
                </button>
              </div>
              {selectedRowIds.length > 0 && (
                <button
                  type="button"
                  onClick={removeSelectedRows}
                  className="ml-1 inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-md border border-red-200 bg-red-50 px-2 text-[11px] font-medium text-red-600 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200"
                  title={`删除已选择的 ${selectedRowIds.length} 行`}
                >
                  <Trash2 size={12} />
                  删除
                </button>
              )}
            </div>
            {(matrixView === null || matrixView === 'monitoring' || isAllColumnsView) && (
              <button
                type="button"
                onClick={onCreateTasks}
                className="h-8 rounded-md border border-[#00338D] bg-[#00338D] px-3 text-[11px] font-semibold text-white transition hover:bg-[#002b75]"
              >
                创建任务
              </button>
            )}
          </div>
        </div>
        <div
          className={`w-full overscroll-none rounded-lg ${isAllColumnsView ? 'overflow-x-auto' : 'overflow-x-hidden'}`}
          onScroll={(event) => setMatrixScrollLeft(event.currentTarget.scrollLeft)}
          onWheel={handleInventoryMatrixWheel}
        >
          <table
            className="w-full table-fixed border-collapse bg-white text-[11px] [&_td]:border-slate-300 [&_td]:text-center [&_th]:border-slate-300 [&_th]:text-center [&_input]:text-center"
            style={isAllColumnsView
              ? { width: `${ALL_VIEW_TABLE_WIDTH}px`, minWidth: `${ALL_VIEW_TABLE_WIDTH}px` }
              : { width: '100%', minWidth: '100%' }}
          >
            <colgroup>
              <col style={{ width: '50px' }} />
              <col style={{ width: matrixView === null ? '84px' : '92px' }} />
              <col style={{ width: matrixView === null ? '100px' : '112px' }} />
              <col style={{ width: matrixView === null ? '64px' : '72px' }} />
              <col style={{ width: matrixView === null ? '62px' : '82px' }} />
              {matrixView === null && <><col style={{ width: '94px' }} /><col style={{ width: '42px' }} /><col style={{ width: '46px' }} /><col style={{ width: '108px' }} /><col style={{ width: '112px' }} /><col style={{ width: '70px' }} /><col style={{ width: '94px' }} /><col style={{ width: '94px' }} /><col style={{ width: '110px' }} /><col style={{ width: '62px' }} /></>}
              {(matrixView === 'balance' || isAllColumnsView) && <><col style={{ width: '101px' }} /><col style={{ width: '46px' }} /><col style={{ width: '54px' }} /><col style={{ width: '88px' }} /><col style={{ width: '46px' }} /><col style={{ width: '92px' }} /><col style={{ width: '46px' }} /><col style={{ width: '54px' }} /><col style={{ width: '92px' }} /><col style={{ width: '46px' }} /></>}
              {(matrixView === 'management' || isAllColumnsView) && <><col style={{ width: '120px' }} /><col style={{ width: '150px' }} /><col style={{ width: '125px' }} /><col style={{ width: '170px' }} /><col style={{ width: '82px' }} /><col style={{ width: '92px' }} /></>}
              {matrixView === 'monitoring' && <col style={{ width: '101px' }} />}
              {(matrixView === 'monitoring' || isAllColumnsView) && <><col style={{ width: '105px' }} /><col style={{ width: '105px' }} /><col style={{ width: '170px' }} /><col style={{ width: '72px' }} /></>}
              {(matrixView === 'arrangements' || isAllColumnsView) && <><col style={{ width: '155px' }} /><col style={{ width: '125px' }} /><col style={{ width: '145px' }} /></>}
              <col style={{ width: matrixView === null ? '108px' : '120px' }} />
              {/* 操作列暂时隐藏：<col style={{ width: matrixView === null ? '60px' : '68px' }} /> */}
            </colgroup>
            <thead style={{ fontFamily: '"Microsoft YaHei", "Microsoft YaHei UI", sans-serif', fontSize: '11px' }}>
              <tr>
                <th className={`${headerCellClassName} ${stickyIdentityHeaderClassName}`} style={{ left: identityColumnLefts[0] }}>
                  <div className="flex items-center justify-center gap-1.5">
                    <CircularSelectionCheckbox
                      checked={allFilteredRowsSelected}
                      indeterminate={someFilteredRowsSelected}
                      disabled={displayRows.length === 0}
                      onChange={toggleAllFilteredRows}
                      ariaLabel="全选当前筛选结果"
                    />
                    <span>#</span>
                  </div>
                </th>
                <th className={`${headerCellClassName} ${stickyIdentityHeaderClassName}`} style={{ left: identityColumnLefts[1] }}><CenteredLeftHeaderText>所属公司名称</CenteredLeftHeaderText></th>
                <th className={`${headerCellClassName} ${stickyIdentityHeaderClassName}`} style={{ left: identityColumnLefts[2] }}><CenteredLeftHeaderText>受访单位名称</CenteredLeftHeaderText></th>
                <th ref={categoryHeaderRef} className={`${headerCellClassName} ${stickyIdentityHeaderClassName}`} style={{ left: identityColumnLefts[3] }}><CenteredLeftHeaderText>{matrixView === null ? '类别' : '存货类别'}</CenteredLeftHeaderText></th>
                <th className={`${greenHeaderCellClassName} ${stickyIdentityHeaderClassName} ${hasStickyCurrentAmount ? '' : stickyIdentityBoundaryClassName}`} style={{ left: identityColumnLefts[4] }}>
                  <div className="inline-flex items-center justify-start gap-1 text-left">
                    <span>选为盘点对象</span>
                    <label
                      className={`relative inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded transition hover:bg-white/70 ${sampleSelectionFilter === 'all' ? 'text-slate-500' : 'bg-white/70 text-[#00338D]'}`}
                      title={`筛选：${sampleSelectionFilter === 'all' ? '全部' : sampleSelectionFilter === 'yes' ? '是' : '否'}`}
                    >
                      <ChevronDown size={12} strokeWidth={2.5} aria-hidden="true" />
                      <select
                        value={sampleSelectionFilter}
                        onChange={(event) => {
                          setSampleSelectionFilter(event.target.value as SampleSelectionFilter);
                          setInventoryPage(1);
                        }}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        aria-label="筛选是否选为盘点对象"
                      >
                        <option value="all">全部</option>
                        <option value="yes">是</option>
                        <option value="no">否</option>
                      </select>
                    </label>
                  </div>
                </th>
                {matrixView === null && <>
                  <th className={`${headerCellClassName} ${stickyIdentityHeaderClassName} ${stickyIdentityBoundaryClassName}`} style={{ left: currentAmountColumnLeft }}>{renderSelectableCurrentAmountHeader()}</th>
                  <th className={lightHeaderCellClassName}><CenteredLeftHeaderText>占比</CenteredLeftHeaderText></th>
                  <th className={lightHeaderCellClassName}><CenteredLeftHeaderText>变动幅度</CenteredLeftHeaderText></th>
                  <th className={headerCellClassName}><CenteredLeftHeaderText>被审计单位的<br />存货盘存系统</CenteredLeftHeaderText></th>
                  <th className={headerCellClassName}><CenteredLeftHeaderText>被审计单位的<br />存货盘点方案</CenteredLeftHeaderText></th>
                  <th className={headerCellClassName}><CenteredLeftHeaderText>存放在<br />第三方地点？</CenteredLeftHeaderText></th>
                  <th className={headerCellClassName}><CenteredLeftHeaderText>项目组是否可以前往<br />存货所在地点实施监盘</CenteredLeftHeaderText></th>
                  <th className={headerCellClassName}><CenteredLeftHeaderText>项目组前往当日<br />客户是否开展盘点</CenteredLeftHeaderText></th>
                  <th className={headerCellClassName}><CenteredLeftHeaderText>项目组就监盘而<br />计划的审计方案</CenteredLeftHeaderText></th>
                  <th className={headerCellClassName}><CenteredLeftHeaderText>样本数量</CenteredLeftHeaderText></th>
                </>}
                {(matrixView === 'balance' || isAllColumnsView) && <>
                  <th className={`${headerCellClassName} ${stickyIdentityHeaderClassName} ${stickyIdentityBoundaryClassName}`} style={{ left: currentAmountColumnLeft }}>{isAllColumnsView ? renderSelectableCurrentAmountHeader() : renderAmountHeader('本期期末余额（百万元）', 'finalPlannedBalance')}</th>
                  <th className={lightHeaderCellClassName}><CenteredLeftHeaderText>占比</CenteredLeftHeaderText></th>
                  <th className={lightHeaderCellClassName}><CenteredLeftHeaderText>变动<br />幅度</CenteredLeftHeaderText></th>
                  <th className={headerCellClassName}>{isAllColumnsView && isInterimView ? renderAmountHeader('上期预审阶段余额（百万元）', 'currentInterimStage') : renderAmountHeader('上期期末余额（百万元）', 'priorBalance')}</th>
                  <th className={lightHeaderCellClassName}><CenteredLeftHeaderText>占比</CenteredLeftHeaderText></th>
                  <th className={headerCellClassName}>{isAllColumnsView && isInterimView ? renderAmountHeader('本期期末余额（百万元）', 'finalPlannedBalance') : renderAmountHeader('本期预审阶段余额（百万元）', 'interimPlannedBalance')}</th>
                  <th className={lightHeaderCellClassName}><CenteredLeftHeaderText>占比</CenteredLeftHeaderText></th>
                  <th className={lightHeaderCellClassName}><CenteredLeftHeaderText>变动<br />幅度</CenteredLeftHeaderText></th>
                  <th className={headerCellClassName}>{isAllColumnsView && isInterimView ? renderAmountHeader('上期期末余额（百万元）', 'priorBalance') : renderAmountHeader('上期预审阶段余额（百万元）', 'currentInterimStage')}</th>
                  <th className={lightHeaderCellClassName}><CenteredLeftHeaderText>占比</CenteredLeftHeaderText></th>
                </>}
                {(matrixView === 'management' || isAllColumnsView) && <>
                  <th className={headerCellClassName}><CenteredLeftHeaderText>被审计单位的<br />存货盘存系统</CenteredLeftHeaderText></th>
                  <th className={headerCellClassName}><CenteredLeftHeaderText>被审计单位如何确认<br />期末存货余额</CenteredLeftHeaderText></th>
                  <th className={headerCellClassName}><CenteredLeftHeaderText>被审计单位的<br />存货盘点方案</CenteredLeftHeaderText></th>
                  <th className={headerCellClassName}><CenteredLeftHeaderText>被审计单位如何计划<br />具体存货盘点</CenteredLeftHeaderText></th>
                  <th className={headerCellClassName}><CenteredLeftHeaderText>存放在<br />第三方地点？</CenteredLeftHeaderText></th>
                  <th className={headerCellClassName}><CenteredLeftHeaderText>被审计单位<br />是否使用专家</CenteredLeftHeaderText></th>
                </>}
                {(matrixView === 'monitoring' || isAllColumnsView) && <>
                  {matrixView === 'monitoring' && <th className={`${headerCellClassName} ${stickyIdentityHeaderClassName} ${stickyIdentityBoundaryClassName}`} style={{ left: currentAmountColumnLeft }}>{renderAmountHeader('本期期末余额（百万元）', 'finalPlannedBalance')}</th>}
                  <th className={headerCellClassName}><CenteredLeftHeaderText>项目组是否可以前往<br />存货所在地点实施监盘</CenteredLeftHeaderText></th>
                  <th className={headerCellClassName}><CenteredLeftHeaderText>项目组前往当日<br />客户是否开展盘点</CenteredLeftHeaderText></th>
                  <th className={headerCellClassName}><CenteredLeftHeaderText>项目组就监盘而<br />计划的审计方案</CenteredLeftHeaderText></th>
                  <th className={headerCellClassName}><CenteredLeftHeaderText>样本数量</CenteredLeftHeaderText></th>
                </>}
                {(matrixView === 'arrangements' || isAllColumnsView) && <>
                  <th className={headerCellClassName}><CenteredLeftHeaderText>发出函证</CenteredLeftHeaderText></th>
                  <th className={headerCellClassName}><CenteredLeftHeaderText>现场监盘 vs 远程监盘</CenteredLeftHeaderText></th>
                  <th className={headerCellClassName}><CenteredLeftHeaderText>利用内审<br />获取审计证据</CenteredLeftHeaderText></th>
                </>}
                <th className={`${headerCellClassName} ${stickyRightHeaderClassName}`}><CenteredLeftHeaderText>项目组决定的<br />存货监盘方法</CenteredLeftHeaderText></th>
                {/* 操作列暂时隐藏：<th className={headerCellClassName}>操作</th> */}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, pageIndex) => {
                const rowIndex = rows.findIndex((candidate) => candidate.id === row.id);
                const derivedRow = derivedRows.find((candidate) => candidate.id === row.id)!;
                return <tr key={row.id} className="hover:bg-slate-50">
                  <td className={`border bg-slate-50 px-1 py-1 text-center font-mono text-[11px] text-slate-400 ${stickyIdentityCellClassName}`} style={{ left: identityColumnLefts[0] }}>
                    <div className="flex items-center justify-center gap-1.5">
                      <CircularSelectionCheckbox
                        checked={selectedRowIdSet.has(row.id)}
                        onChange={(checked) => toggleRowSelection(row.id, checked)}
                        ariaLabel={`选择第 ${rowIndex + 1 || pageIndex + 1} 行`}
                      />
                      <span>{rowIndex + 1 || pageIndex + 1}</span>
                    </div>
                  </td>
                  <td className={`${lockIdentityColumns ? grayCellClassName : yellowCellClassName} ${stickyIdentityCellClassName}`} style={{ left: identityColumnLefts[1] }}><input className={inputClassName} value={row.companyName} readOnly={lockIdentityColumns} onChange={(event) => updateRow(row.id, 'companyName', event.target.value)} /></td>
                  <td className={`${lockIdentityColumns ? grayCellClassName : yellowCellClassName} ${stickyIdentityCellClassName}`} style={{ left: identityColumnLefts[2] }}><input className={inputClassName} value={row.intervieweeName} readOnly={lockIdentityColumns} onChange={(event) => updateRow(row.id, 'intervieweeName', event.target.value)} /></td>
                  <td className={`${yellowCellClassName} ${stickyIdentityCellClassName}`} style={{ left: identityColumnLefts[3] }}><input className={inputClassName} value={row.category} onChange={(event) => updateRow(row.id, 'category', event.target.value)} /></td>
                  <td className={`${grayCellClassName} ${stickyIdentityCellClassName} ${hasStickyCurrentAmount ? '' : stickyIdentityBoundaryClassName}`} style={{ left: identityColumnLefts[4] }}><select className={`${selectClassName} ${getInventorySelectionAlignment(row.selectedAsSample)}`} value={row.selectedAsSample} onChange={(event) => handleSelectedAsSampleChange(row, event.target.value)}>{SAMPLE_SELECTION_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></td>
                  {matrixView === null && <>
                    <td className={`${yellowCellClassName} ${stickyIdentityCellClassName} ${stickyIdentityBoundaryClassName}`} style={{ left: currentAmountColumnLeft }}><InventoryAmountInput rawValue={isInterimView ? row.interimPlannedBalance : row.finalPlannedBalance} onCommit={(value) => updateRow(row.id, isInterimView ? 'interimPlannedBalance' : 'finalPlannedBalance', value)} /></td>
                    <td className={derivedCellClassName}>{isInterimView ? derivedRow.interimShare : derivedRow.finalShare}</td>
                    <td className={derivedCellClassName}>{isInterimView ? derivedRow.interimChange : derivedRow.finalChange}</td>
                    <td className={grayCellClassName}><ReadOnlyInventoryValue value={row.systemType} /></td>
                    <td className={grayCellClassName}><ReadOnlyInventoryValue value={row.countMethod} /></td>
                    <td className={neutralCellClassName}><select className={`${selectClassName} ${getInventorySelectionAlignment(row.thirdPartyStorage)}`} value={row.thirdPartyStorage} onChange={(event) => handleThirdPartyStorageChange(row.id, event.target.value)}>{YES_NO_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></td>
                    <td className={neutralCellClassName}><WrappedInventorySelect value={row.plannedAttendancePrimary} options={ATTENDANCE_FEASIBILITY_OPTIONS} onChange={(value) => handleAttendanceFeasibilityChange(row.id, value)} /></td>
                    <td className={row.plannedAttendancePrimary === '是' ? neutralCellClassName : grayCellClassName}><select className={`${selectClassName} ${getInventorySelectionAlignment(row.plannedAttendanceSecondary)}`} value={row.plannedAttendanceSecondary} disabled={row.plannedAttendancePrimary !== '是'} onChange={(event) => handleAttendanceDayChange(row.id, event.target.value)}>{row.plannedAttendancePrimary !== '是' && <option value="" />}{ATTENDANCE_DAY_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></td>
                    <td className={grayCellClassName}><WrappedInventorySelect value={row.auditApproach} disabled={row.plannedAttendancePrimary !== '是' || row.plannedAttendanceSecondary === INDEPENDENT_ATTENDANCE_VALUE} options={AUDIT_APPROACH_OPTIONS} isOptionDisabled={(option) => isAuditApproachOptionDisabled(row.plannedAttendanceSecondary, option)} onChange={(value) => handleAuditApproachChange(row.id, value)} /></td>
                    <td className={yellowCellClassName}><input className={inputClassName} value={row.sampleQuantity} onChange={(event) => updateRow(row.id, 'sampleQuantity', event.target.value)} /></td>
                  </>}
                  {(matrixView === 'balance' || isAllColumnsView) && <>
                    <td className={`${yellowCellClassName} ${stickyIdentityCellClassName} ${stickyIdentityBoundaryClassName}`} style={{ left: currentAmountColumnLeft }}><InventoryAmountInput rawValue={isAllColumnsView && isInterimView ? row.interimPlannedBalance : row.finalPlannedBalance} onCommit={(value) => updateRow(row.id, isAllColumnsView && isInterimView ? 'interimPlannedBalance' : 'finalPlannedBalance', value)} /></td>
                    <td className={derivedCellClassName}>{isAllColumnsView && isInterimView ? derivedRow.interimShare : derivedRow.finalShare}</td><td className={derivedCellClassName}>{isAllColumnsView && isInterimView ? derivedRow.interimChange : derivedRow.finalChange}</td>
                    <td className={yellowCellClassName}><InventoryAmountInput rawValue={isAllColumnsView && isInterimView ? row.currentInterimStage : row.priorBalance} onCommit={(value) => updateRow(row.id, isAllColumnsView && isInterimView ? 'currentInterimStage' : 'priorBalance', value)} /></td>
                    <td className={derivedCellClassName}>{isAllColumnsView && isInterimView ? derivedRow.currentInterimShare : derivedRow.priorShare}</td>
                    <td className={yellowCellClassName}><InventoryAmountInput rawValue={isAllColumnsView && isInterimView ? row.finalPlannedBalance : row.interimPlannedBalance} onCommit={(value) => updateRow(row.id, isAllColumnsView && isInterimView ? 'finalPlannedBalance' : 'interimPlannedBalance', value)} /></td>
                    <td className={derivedCellClassName}>{isAllColumnsView && isInterimView ? derivedRow.finalShare : derivedRow.interimShare}</td><td className={derivedCellClassName}>{isAllColumnsView && isInterimView ? derivedRow.finalChange : derivedRow.interimChange}</td>
                    <td className={yellowCellClassName}><InventoryAmountInput rawValue={isAllColumnsView && isInterimView ? row.priorBalance : row.currentInterimStage} onCommit={(value) => updateRow(row.id, isAllColumnsView && isInterimView ? 'priorBalance' : 'currentInterimStage', value)} /></td>
                    <td className={derivedCellClassName}>{isAllColumnsView && isInterimView ? derivedRow.priorShare : derivedRow.currentInterimShare}</td>
                  </>}
                  {(matrixView === 'management' || isAllColumnsView) && <>
                    <td className={grayCellClassName}><ReadOnlyInventoryValue value={row.systemType} /></td>
                    <td className={grayCellClassName}><WrappedInventorySelect value={row.endingBalanceConfirmation} options={ENDING_BALANCE_CONFIRMATION_OPTIONS} onChange={(value) => handleEndingBalanceConfirmationChange(row.id, value)} /></td>
                    <td className={grayCellClassName}><ReadOnlyInventoryValue value={row.countMethod} /></td>
                    <td className={grayCellClassName}><WrappedInventorySelect value={row.inventoryCountPlan} options={INVENTORY_COUNT_PLAN_OPTIONS} onChange={(value) => handleInventoryCountPlanChange(row.id, value)} /></td>
                    <td className={neutralCellClassName}><select className={`${selectClassName} ${getInventorySelectionAlignment(row.thirdPartyStorage)}`} value={row.thirdPartyStorage} onChange={(event) => handleThirdPartyStorageChange(row.id, event.target.value)}>{YES_NO_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></td>
                    <td className={neutralCellClassName}><select className={`${selectClassName} ${getInventorySelectionAlignment(row.useExpert)}`} value={row.useExpert} onChange={(event) => updateRow(row.id, 'useExpert', event.target.value)}>{YES_NO_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></td>
                  </>}
                  {(matrixView === 'monitoring' || isAllColumnsView) && <>
                    {matrixView === 'monitoring' && <td className={`${yellowCellClassName} ${stickyIdentityCellClassName} ${stickyIdentityBoundaryClassName}`} style={{ left: currentAmountColumnLeft }}><InventoryAmountInput rawValue={row.finalPlannedBalance} onCommit={(value) => updateRow(row.id, 'finalPlannedBalance', value)} /></td>}
                    <td className={neutralCellClassName}><WrappedInventorySelect value={row.plannedAttendancePrimary} options={ATTENDANCE_FEASIBILITY_OPTIONS} onChange={(value) => handleAttendanceFeasibilityChange(row.id, value)} /></td>
                    <td className={row.plannedAttendancePrimary === '是' ? neutralCellClassName : grayCellClassName}><select className={`${selectClassName} ${getInventorySelectionAlignment(row.plannedAttendanceSecondary)}`} value={row.plannedAttendanceSecondary} disabled={row.plannedAttendancePrimary !== '是'} onChange={(event) => handleAttendanceDayChange(row.id, event.target.value)}>{row.plannedAttendancePrimary !== '是' && <option value="" />}{ATTENDANCE_DAY_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></td>
                    <td className={grayCellClassName}><WrappedInventorySelect value={row.auditApproach} disabled={row.plannedAttendancePrimary !== '是' || row.plannedAttendanceSecondary === INDEPENDENT_ATTENDANCE_VALUE} options={AUDIT_APPROACH_OPTIONS} isOptionDisabled={(option) => isAuditApproachOptionDisabled(row.plannedAttendanceSecondary, option)} onChange={(value) => handleAuditApproachChange(row.id, value)} /></td>
                    <td className={yellowCellClassName}><input className={inputClassName} value={row.sampleQuantity} onChange={(event) => updateRow(row.id, 'sampleQuantity', event.target.value)} /></td>
                  </>}
                  {(matrixView === 'arrangements' || isAllColumnsView) && <>
                    <td className={neutralCellClassName}><WrappedInventorySelect value={allowsThirdPartyEvidence(row.auditApproach) ? row.confirmThirdPartyInventory : '否'} disabled={!allowsThirdPartyEvidence(row.auditApproach)} options={YES_NO_OPTIONS} onChange={(value) => updateRow(row.id, 'confirmThirdPartyInventory', value)} /></td>
                    <td className={grayCellClassName}><WrappedInventorySelect value={row.monitorMode} options={MONITOR_MODE_OPTIONS} onChange={(value) => updateRow(row.id, 'monitorMode', value)} /></td>
                    <td className={neutralCellClassName}><WrappedInventorySelect value={row.useInternalAudit} options={YES_NO_OPTIONS} onChange={(value) => updateRow(row.id, 'useInternalAudit', value)} /></td>
                  </>}
                  <td className={`${grayCellClassName} ${stickyRightCellClassName}`}><DerivedInventoryMethodCell row={row} /></td>
                  {/* 操作列暂时隐藏。地点设置和删除行按钮代码保留在版本历史中。 */}
                </tr>;
              })}
              <tr>
                <td className={`border bg-white px-2 py-1 text-center ${stickyIdentityCellClassName}`} style={{ left: identityColumnLefts[0] }}><button type="button" onClick={addRow} className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:border-blue-500 hover:text-blue-600" title="新增行"><Plus size={14} /></button></td>
                {[1, 2, 3, 4].map((columnIndex) => <td key={columnIndex} className={`border bg-white px-2 py-1 ${stickyIdentityCellClassName} ${columnIndex === 4 && !hasStickyCurrentAmount ? stickyIdentityBoundaryClassName : ''}`} style={{ left: identityColumnLefts[columnIndex] }} />)}
                {hasStickyCurrentAmount && <td className={`border bg-white px-2 py-1 ${stickyIdentityCellClassName} ${stickyIdentityBoundaryClassName}`} style={{ left: currentAmountColumnLeft }} />}
                {Array.from({ length: matrixView === null ? 9 : isAllColumnsView ? 22 : matrixView === 'balance' ? 9 : matrixView === 'management' ? 6 : matrixView === 'arrangements' ? 3 : 4 }, (_, cell) => <td key={cell} className="border bg-white px-2 py-1" />)}
                <td className={`border bg-white px-2 py-1 ${stickyRightCellClassName}`} />
                {/* 操作列暂时隐藏：<td className="border bg-white px-2 py-1" /> */}
              </tr>
              <tr>
                <td className={`border bg-black px-2 py-1 ${stickyIdentityCellClassName}`} style={{ left: identityColumnLefts[0] }} />
                <td className={`border bg-black px-2 py-1 text-center text-[11px] font-semibold text-white ${stickyIdentityCellClassName}`} style={{ left: identityColumnLefts[1] }}>存货总额</td>
                {[2, 3, 4].map((columnIndex) => <td key={columnIndex} className={`border bg-black px-2 py-1 ${stickyIdentityCellClassName} ${columnIndex === 4 && !hasStickyCurrentAmount ? stickyIdentityBoundaryClassName : ''}`} style={{ left: identityColumnLefts[columnIndex] }} />)}
                {matrixView === null ? <>
                  <td className={`${calculatedCellClassName} ${stickyIdentityCellClassName} ${stickyIdentityBoundaryClassName}`} style={{ left: currentAmountColumnLeft }}>{formatInventoryTotalAmount(isInterimView ? totalInterimPlannedBalance : totalFinalPlannedBalance)}</td><td className={calculatedCellClassName}>{formatRatio(calculateShare(isInterimView ? totalInterimPlannedBalance : totalFinalPlannedBalance, isInterimView ? totalInterimPlannedBalance : totalFinalPlannedBalance))}</td><td className={calculatedCellClassName}>{formatRatio(isInterimView ? calculateChange(totalCurrentInterimStage !== null && totalInterimPlannedBalance !== null ? totalInterimPlannedBalance - totalCurrentInterimStage : null, totalCurrentInterimStage) : calculateChange(totalFinalPlannedBalance !== null && totalPriorBalance !== null ? totalFinalPlannedBalance - totalPriorBalance : null, totalPriorBalance))}</td>
                  {Array.from({ length: 7 }, (_, cell) => <td key={cell} className="border bg-black px-2 py-1" />)}
                </> : matrixView === 'balance' ? <>
                  <td className={`${calculatedCellClassName} ${stickyIdentityCellClassName} ${stickyIdentityBoundaryClassName}`} style={{ left: currentAmountColumnLeft }}>{formatInventoryTotalAmount(totalFinalPlannedBalance)}</td><td className={calculatedCellClassName}>{formatRatio(calculateShare(totalFinalPlannedBalance, totalFinalPlannedBalance))}</td><td className={calculatedCellClassName}>{formatRatio(calculateChange(totalFinalPlannedBalance !== null && totalPriorBalance !== null ? totalFinalPlannedBalance - totalPriorBalance : null, totalPriorBalance))}</td>
                  <td className={calculatedCellClassName}>{formatInventoryTotalAmount(totalPriorBalance)}</td><td className={calculatedCellClassName}>{formatRatio(calculateShare(totalPriorBalance, totalPriorBalance))}</td>
                  <td className={calculatedCellClassName}>{formatInventoryTotalAmount(totalInterimPlannedBalance)}</td><td className={calculatedCellClassName}>{formatRatio(calculateShare(totalInterimPlannedBalance, totalInterimPlannedBalance))}</td><td className={calculatedCellClassName}>{formatRatio(calculateChange(totalCurrentInterimStage !== null && totalInterimPlannedBalance !== null ? totalInterimPlannedBalance - totalCurrentInterimStage : null, totalCurrentInterimStage))}</td>
                  <td className={calculatedCellClassName}>{formatInventoryTotalAmount(totalCurrentInterimStage)}</td><td className={calculatedCellClassName}>{formatRatio(calculateShare(totalCurrentInterimStage, totalCurrentInterimStage))}</td>
                </> : isAllColumnsView ? <>
                  <td className={`${calculatedCellClassName} ${stickyIdentityCellClassName} ${stickyIdentityBoundaryClassName}`} style={{ left: currentAmountColumnLeft }}>{formatInventoryTotalAmount(isInterimView ? totalInterimPlannedBalance : totalFinalPlannedBalance)}</td><td className={calculatedCellClassName}>{formatRatio(calculateShare(isInterimView ? totalInterimPlannedBalance : totalFinalPlannedBalance, isInterimView ? totalInterimPlannedBalance : totalFinalPlannedBalance))}</td><td className={calculatedCellClassName}>{formatRatio(isInterimView ? calculateChange(totalCurrentInterimStage !== null && totalInterimPlannedBalance !== null ? totalInterimPlannedBalance - totalCurrentInterimStage : null, totalCurrentInterimStage) : calculateChange(totalFinalPlannedBalance !== null && totalPriorBalance !== null ? totalFinalPlannedBalance - totalPriorBalance : null, totalPriorBalance))}</td>
                  <td className={calculatedCellClassName}>{formatInventoryTotalAmount(isInterimView ? totalCurrentInterimStage : totalPriorBalance)}</td><td className={calculatedCellClassName}>{formatRatio(calculateShare(isInterimView ? totalCurrentInterimStage : totalPriorBalance, isInterimView ? totalCurrentInterimStage : totalPriorBalance))}</td>
                  <td className={calculatedCellClassName}>{formatInventoryTotalAmount(isInterimView ? totalFinalPlannedBalance : totalInterimPlannedBalance)}</td><td className={calculatedCellClassName}>{formatRatio(calculateShare(isInterimView ? totalFinalPlannedBalance : totalInterimPlannedBalance, isInterimView ? totalFinalPlannedBalance : totalInterimPlannedBalance))}</td><td className={calculatedCellClassName}>{formatRatio(isInterimView ? calculateChange(totalFinalPlannedBalance !== null && totalPriorBalance !== null ? totalFinalPlannedBalance - totalPriorBalance : null, totalPriorBalance) : calculateChange(totalCurrentInterimStage !== null && totalInterimPlannedBalance !== null ? totalInterimPlannedBalance - totalCurrentInterimStage : null, totalCurrentInterimStage))}</td>
                  <td className={calculatedCellClassName}>{formatInventoryTotalAmount(isInterimView ? totalPriorBalance : totalCurrentInterimStage)}</td><td className={calculatedCellClassName}>{formatRatio(calculateShare(isInterimView ? totalPriorBalance : totalCurrentInterimStage, isInterimView ? totalPriorBalance : totalCurrentInterimStage))}</td>
                  {Array.from({ length: 13 }, (_, cell) => <td key={cell} className="border bg-black px-2 py-1" />)}
                </> : matrixView === 'monitoring' ? <>
                  <td className={`${calculatedCellClassName} ${stickyIdentityCellClassName} ${stickyIdentityBoundaryClassName}`} style={{ left: currentAmountColumnLeft }}>{formatInventoryTotalAmount(totalFinalPlannedBalance)}</td>
                  {Array.from({ length: 4 }, (_, cell) => <td key={cell} className="border bg-black px-2 py-1" />)}
                </> : Array.from({ length: matrixView === 'management' ? 6 : matrixView === 'arrangements' ? 3 : 4 }, (_, cell) => <td key={cell} className="border bg-black px-2 py-1" />)}
                <td className={`border bg-black px-2 py-1 ${stickyRightCellClassName}`} />
                {/* 操作列暂时隐藏：<td className="border bg-black px-2 py-1" /> */}
              </tr>
            </tbody>
          </table>
          {false && (
          <table className="w-full table-fixed border-collapse bg-white text-[11px] [&_td]:border-slate-300 [&_td]:text-center [&_th]:border-slate-300 [&_th]:text-center [&_input]:text-center">
            <colgroup>
              <col style={{ width: '28px' }} />
              <col style={{ width: isExplanationColumnsExpanded ? '75px' : '78px' }} />
              <col style={{ width: isExplanationColumnsExpanded ? '90px' : '96px' }} />
              <col style={{ width: isExplanationColumnsExpanded ? '55px' : '56px' }} />
              {showAmountColumns && isBalanceView && <col style={{ width: '80px' }} />}
              {showAmountColumns && isInterimView && <col style={{ width: '80px' }} />}
              {showAmountColumns && isInterimView && <col style={{ width: '40px' }} />}
              {showAmountColumns && isBalanceView && <col style={{ width: '40px' }} />}
              {showAmountColumns && isInterimView && <col style={{ width: '80px' }} />}
              {showAmountColumns && isInterimView && <col style={{ width: '40px' }} />}
              {showAmountColumns && isInterimView && <col style={{ width: '48px' }} />}
              {showAmountColumns && isBalanceView && <col style={{ width: '80px' }} />}
              {showAmountColumns && isBalanceView && <col style={{ width: '40px' }} />}
              {showAmountColumns && isBalanceView && <col style={{ width: '48px' }} />}
              <col style={{ width: '74px' }} />
              {isExplanationColumnsExpanded && <col style={{ width: '145px' }} />}
              <col style={{ width: isExplanationColumnsExpanded ? '104px' : '112px' }} />
              <col style={{ width: isExplanationColumnsExpanded ? '65px' : '72px' }} />
              {isExplanationColumnsExpanded && <col style={{ width: '165px' }} />}
              <col style={{ width: isExplanationColumnsExpanded ? '98px' : '108px' }} />
              <col style={{ width: isExplanationColumnsExpanded ? '70px' : '75px' }} />
              <col style={{ width: '32px' }} />
            </colgroup>

            <thead style={{ fontFamily: '"Microsoft YaHei", "Microsoft YaHei UI", sans-serif', fontSize: '11px' }}>
              <tr>
                <th className={`${headerCellClassName} ${stickyIndexHeaderClassName}`}>#</th>
                <th className={headerCellClassName}>所属公司名称</th>
                <th className={headerCellClassName}>
                  受访单位名称
                  <InventoryInlineInfoButton
                    ariaLabel="受访单位名称说明"
                    label="将具有共同特征的地点划分为一组可能是恰当的。"
                  />
                </th>
                <th ref={categoryHeaderRef} className={headerCellClassName}>
                  <span className="inline-flex items-center justify-center gap-1">
                    类别{noteLabel(2)}
                    <button
                      type="button"
                      onMouseEnter={() => setIsCategoryTooltipVisible(true)}
                      onMouseLeave={() => setIsCategoryTooltipVisible(false)}
                      onFocus={() => setIsCategoryTooltipVisible(true)}
                      onBlur={() => setIsCategoryTooltipVisible(false)}
                      className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-black/40 bg-white text-[9px] font-bold leading-none text-[#143f97]"
                      aria-label="类别说明"
                    >
                      i
                    </button>
                  </span>
                </th>
                {showAmountColumns && (
                <>
                {isBalanceView && (
                  <th className={headerCellClassName}>
                    {renderAmountHeader('上期期末余额（百万元）', 'priorBalance')}
                  </th>
                )}
                {isInterimView && (
                  <th className={headerCellClassName}>
                    {renderAmountHeader('上期预审阶段余额（百万元）', 'currentInterimStage')}
                  </th>
                )}
                {isInterimView && (
                  <th className={lightHeaderCellClassName}>占比</th>
                )}
                {isBalanceView && (
                  <th className={lightHeaderCellClassName}>占比</th>
                )}
                {isInterimView && (
                  <th className={headerCellClassName}>
                    {renderAmountHeader('本期预审阶段余额（百万元）', 'interimPlannedBalance')}
                  </th>
                )}
                {isInterimView && (
                  <th className={lightHeaderCellClassName}>占比</th>
                )}
                {isInterimView && (
                  <th className={lightHeaderCellClassName}>
                    变动幅度
                  </th>
                )}
                {isBalanceView && (
                  <th className={headerCellClassName}>
                    {renderAmountHeader('本期期末余额（百万元）', 'finalPlannedBalance')}
                  </th>
                )}
                {isBalanceView && (
                  <th className={lightHeaderCellClassName}>占比</th>
                )}
                {isBalanceView && (
                  <th className={lightHeaderCellClassName}>
                    变动幅度
                  </th>
                )}
                </>
                )}
                <th className={greenHeaderCellClassName}>
                  <span className="whitespace-nowrap tracking-[-0.4px]">是否被毕马威</span>
                  <br />
                  <span className="whitespace-nowrap tracking-[-0.4px]">选为盘点对象</span>
                </th>
                {isExplanationColumnsExpanded && (
                <th className={`${headerCellClassName} relative`}>
                  <button
                    type="button"
                    onClick={() => setIsExplanationColumnsExpanded(false)}
                    className="absolute right-1 top-1 border-0 bg-transparent px-1 py-0.5 text-[10px] font-normal text-slate-400 transition hover:text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300"
                    title="收起解释列"
                    aria-label="收起解释列"
                  >
                    收起
                  </button>
                  被审计单位是如何确认
                  <br />
                  期末存货余额的？
                </th>
                )}
                <th className={headerCellClassName}>
                  被审计单位是否使用
                  {!isExplanationColumnsExpanded ? (
                    <ExplanationColumnsExpandButton
                      onClick={() => setIsExplanationColumnsExpanded(true)}
                    >
                      永续盘存系统
                      <span onClick={(event) => event.stopPropagation()}>
                        <InventoryKButton
                          className="ml-0.5 align-middle"
                          label={INVENTORY_KEYWORD_REFERENCES.perpetualSystem}
                        />
                      </span>
                      或定期盘存系统
                      <span onClick={(event) => event.stopPropagation()}>
                        <InventoryKButton
                          className="ml-0.5 align-middle"
                          label={INVENTORY_KEYWORD_REFERENCES.periodicSystem}
                        />
                      </span>
                    </ExplanationColumnsExpandButton>
                  ) : (
                    <>
                      <span className="inline-flex flex-wrap items-center justify-center">
                        永续盘存系统
                        <InventoryKButton
                          className="ml-1 align-middle"
                          label={INVENTORY_KEYWORD_REFERENCES.perpetualSystem}
                        />
                      </span>
                      或
                      <span className="inline-flex flex-wrap items-center justify-center">
                        定期盘存系统
                        <InventoryKButton
                          className="ml-1 align-middle"
                          label={INVENTORY_KEYWORD_REFERENCES.periodicSystem}
                        />
                      </span>
                    </>
                  )}
                   {noteLabel(3)}
                </th>
                <th className={headerCellClassName}>
                  是否存放在
                  <br />
                  第三方地点？
                  <br />
                  <InventoryKButton
                    className="ml-1 align-middle"
                    label={INVENTORY_KEYWORD_REFERENCES.thirdPartyLocation}
                  />
                  <InventoryInlineInfoButton ariaLabel="第三方地点说明" label="在适当情况下，完成附件3-就存放于第三方地点的存货获取证据" />
                  <br />
                  {noteLabel(3)}
                </th>
                {isExplanationColumnsExpanded && (
                <th className={headerCellClassName}>
                  被审计单位是如何具体
                  <br />
                  计划存货盘点的？
                </th>
                )}
                <th ref={countMethodHeaderRef} className={headerCellClassName}>
                  被审计单位的
                  <br />
                  {!isExplanationColumnsExpanded ? (
                    <ExplanationColumnsExpandButton
                      onClick={() => setIsExplanationColumnsExpanded(true)}
                    >
                      存货盘点方法
                      <span onClick={(event) => event.stopPropagation()}>
                        <InventoryKButton
                          className="ml-0.5 align-middle"
                          label={INVENTORY_KEYWORD_REFERENCES.cycleCount}
                        />
                      </span>
                    </ExplanationColumnsExpandButton>
                  ) : (
                    <span className="inline-flex flex-wrap items-center justify-center">
                      存货盘点方法
                      <InventoryKButton
                        className="ml-1 align-middle"
                        label={INVENTORY_KEYWORD_REFERENCES.cycleCount}
                      />
                    </span>
                  )}
                </th>
                <th className={headerCellClassName}>
                  被审计单位是否使用了
                  <span>专家？</span>
                  <span className="inline-flex flex-wrap items-center justify-center">
                    <InventoryKButton
                      className="ml-1 align-middle"
                      label={INVENTORY_KEYWORD_REFERENCES.expert}
                    />
                    <InventoryInlineInfoButton
                      ariaLabel="专家使用说明"
                      label="在适当情况下，在业务流程中的3.x.1“了解有关情况”中选择“管理层的专家与该流程相关”，并添加“专家”子模块。"
                    />
                  </span>
                  <br />
                  {noteLabel(4)}
                </th>
                <th className={`${headerCellClassName} ${stickyRightHeaderClassName} px-0`}>操作</th>
              </tr>
            </thead>

            <tbody>
              {paginatedRows.map((row, pageIndex) => {
                const index = shouldShowInventoryPagination ? inventoryPageStartIndex + pageIndex : pageIndex;
                const derivedRow = derivedRows[index];

                return (
                <tr key={row.id}>
                  <td className={`border border-[#2b2b2b] bg-slate-50 px-2 py-1 text-center font-mono text-[11px] text-slate-400 align-middle ${stickyIndexCellClassName}`}>
                    {index + 1}
                  </td>
                  <td className={lockIdentityColumns ? grayCellClassName : yellowCellClassName}>
                    <input
                      className={inputClassName}
                      value={row.companyName}
                      readOnly={lockIdentityColumns}
                      onChange={(event) => updateRow(row.id, 'companyName', event.target.value)}
                    />
                  </td>
                  <td className={lockIdentityColumns ? grayCellClassName : yellowCellClassName}>
                    <input
                      className={inputClassName}
                      value={row.intervieweeName}
                      readOnly={lockIdentityColumns}
                      onChange={(event) => updateRow(row.id, 'intervieweeName', event.target.value)}
                    />
                  </td>
                  <td className={yellowCellClassName}>
                    <input
                      className={inputClassName}
                      value={row.category}
                      onChange={(event) => updateRow(row.id, 'category', event.target.value)}
                    />
                  </td>
                  {showAmountColumns && (
                  <>
                  {isBalanceView && (
                    <td className={yellowCellClassName}>
                      <InventoryAmountInput
                        rawValue={row.priorBalance}
                        onCommit={(value) => updateRow(row.id, 'priorBalance', value)}
                      />
                    </td>
                  )}
                  {isInterimView && (
                    <td className={yellowCellClassName}>
                      <InventoryAmountInput
                        rawValue={row.currentInterimStage}
                        onCommit={(value) => updateRow(row.id, 'currentInterimStage', value)}
                      />
                    </td>
                  )}
                  {isInterimView && (
                    <td className={derivedCellClassName}>{derivedRow.currentInterimShare}</td>
                  )}
                  {isBalanceView && <td className={derivedCellClassName}>{derivedRow.priorShare}</td>}
                  {isInterimView && (
                    <td className={yellowCellClassName}>
                      <InventoryAmountInput
                        rawValue={row.interimPlannedBalance}
                        onCommit={(value) => updateRow(row.id, 'interimPlannedBalance', value)}
                      />
                    </td>
                  )}
                  {isInterimView && <td className={derivedCellClassName}>{derivedRow.interimShare}</td>}
                  {isInterimView && <td className={derivedCellClassName}>{derivedRow.interimChange}</td>}
                  {isBalanceView && (
                    <td className={yellowCellClassName}>
                      <InventoryAmountInput
                        rawValue={row.finalPlannedBalance}
                        onCommit={(value) => updateRow(row.id, 'finalPlannedBalance', value)}
                      />
                    </td>
                  )}
                  {isBalanceView && <td className={derivedCellClassName}>{derivedRow.finalShare}</td>}
                  {isBalanceView && <td className={derivedCellClassName}>{derivedRow.finalChange}</td>}
                  </>
                  )}
                  <td className={grayCellClassName}>
                    <select
                      className={`${selectClassName} ${getInventorySelectionAlignment(row.selectedAsSample)}`}
                      value={row.selectedAsSample}
                      onChange={(event) => handleSelectedAsSampleChange(row, event.target.value)}
                    >
                      {SAMPLE_SELECTION_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  {isExplanationColumnsExpanded && (
                  <td className={grayCellClassName}>
                    <WrappedInventorySelect
                      value={row.endingBalanceConfirmation}
                      options={ENDING_BALANCE_CONFIRMATION_OPTIONS}
                      onChange={(value) => handleEndingBalanceConfirmationChange(row.id, value)}
                    />
                  </td>
                  )}
                  <td className={grayCellClassName}>
                    <WrappedInventorySelect
                      value={row.systemType}
                      options={SYSTEM_OPTIONS}
                      onChange={(value) => updateRow(row.id, 'systemType', value)}
                    />
                  </td>
                  <td className={neutralCellClassName}>
                    <select
                      className={`${selectClassName} ${getInventorySelectionAlignment(row.thirdPartyStorage)}`}
                      value={row.thirdPartyStorage}
                      onChange={(event) =>
                        updateRow(row.id, 'thirdPartyStorage', event.target.value)
                      }
                    >
                      {YES_NO_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  {isExplanationColumnsExpanded && (
                  <td className={grayCellClassName}>
                    <WrappedInventorySelect
                      value={row.inventoryCountPlan}
                      options={INVENTORY_COUNT_PLAN_OPTIONS}
                      onChange={(value) => handleInventoryCountPlanChange(row.id, value)}
                    />
                  </td>
                  )}
                  <td className={grayCellClassName}>
                    <div className="flex min-h-[38px] items-center">
                      <WrappedInventorySelect
                        className={row.countMethod === INVENTORY_MONITORING_NOT_PRACTICABLE ? 'min-w-0 flex-1' : ''}
                        value={row.countMethod}
                        options={COUNT_METHOD_OPTIONS}
                        onChange={(value) => updateRow(row.id, 'countMethod', value)}
                      />
                      {row.countMethod === INVENTORY_MONITORING_NOT_PRACTICABLE && (
                        <InventoryInlineInfoButton
                          ariaLabel="存货监盘不可行说明"
                          label="在某些情况下，被审计单位可能对部分存货进行循环盘点，而对剩余存货进行实地全盘。"
                        />
                      )}
                    </div>
                  </td>
                  <td className={neutralCellClassName}>
                    <select
                      className={`${selectClassName} ${getInventorySelectionAlignment(row.useExpert)}`}
                      value={row.useExpert}
                      onChange={(event) => updateRow(row.id, 'useExpert', event.target.value)}
                    >
                      {YES_NO_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={`border border-[#2b2b2b] bg-white p-0 text-center align-middle ${stickyRightCellClassName}`}>
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length === 1}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                      title="删除行"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              )})}

              <tr>
                <td className={`border border-[#2b2b2b] bg-white px-2 py-1 text-center align-middle ${stickyIndexCellClassName}`}>
                  <button
                    type="button"
                    onClick={addRow}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition hover:border-blue-500 hover:text-blue-600 hover:shadow-sm active:scale-95"
                    title="新增行"
                  >
                    <Plus size={14} />
                  </button>
                </td>
                {/* .. */}
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                {showAmountColumns && (
                  <>
                    {isBalanceView && <td className="border border-[#2b2b2b] bg-white px-2 py-1" />}
                    {isInterimView && <td className="border border-[#2b2b2b] bg-white px-2 py-1" />}
                    {isInterimView && <td className="border border-[#2b2b2b] bg-white px-2 py-1" />}
                    {isBalanceView && <td className="border border-[#2b2b2b] bg-white px-2 py-1" />}
                    {isInterimView && <td className="border border-[#2b2b2b] bg-white px-2 py-1" />}
                    {isInterimView && <td className="border border-[#2b2b2b] bg-white px-2 py-1" />}
                    {isInterimView && <td className="border border-[#2b2b2b] bg-white px-2 py-1" />}
                    {isBalanceView && <td className="border border-[#2b2b2b] bg-white px-2 py-1" />}
                    {isBalanceView && <td className="border border-[#2b2b2b] bg-white px-2 py-1" />}
                    {isBalanceView && <td className="border border-[#2b2b2b] bg-white px-2 py-1" />}
                  </>
                )}
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                {isExplanationColumnsExpanded && <td className="border border-[#2b2b2b] bg-white px-2 py-1" />}
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                {isExplanationColumnsExpanded && <td className="border border-[#2b2b2b] bg-white px-2 py-1" />}
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className={`border border-[#2b2b2b] bg-white px-2 py-1 ${stickyRightCellClassName}`} />
              </tr>

              <tr>
                <td className={`border border-[#2b2b2b] bg-black px-2 py-1 ${stickyIndexCellClassName}`} />
                <td className="border border-[#2b2b2b] bg-black px-2 py-1 text-center text-[11px] font-semibold leading-[1.1] text-white">
                  存货总额
                </td>
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                {showAmountColumns && (
                <>
                {isBalanceView && (
                  <td className={calculatedCellClassName}>{formatInventoryTotalAmount(totalPriorBalance)}</td>
                )}
                {isInterimView && (
                  <td className={calculatedCellClassName}>{formatInventoryTotalAmount(totalCurrentInterimStage)}</td>
                )}
                {isInterimView && (
                  <td className={calculatedCellClassName}>
                    {formatRatio(calculateShare(totalCurrentInterimStage, totalCurrentInterimStage))}
                  </td>
                )}
                {isBalanceView && (
                  <td className={calculatedCellClassName}>
                    {formatRatio(calculateShare(totalPriorBalance, totalPriorBalance))}
                  </td>
                )}
                {isInterimView && (
                  <td className={calculatedCellClassName}>
                    {formatInventoryTotalAmount(totalInterimPlannedBalance)}
                  </td>
                )}
                {isInterimView && (
                  <td className={calculatedCellClassName}>
                    {formatRatio(calculateShare(totalInterimPlannedBalance, totalInterimPlannedBalance))}
                  </td>
                )}
                {isInterimView && (
                  <td className={calculatedCellClassName}>
                    {formatRatio(
                      calculateChange(
                        totalCurrentInterimStage !== null && totalInterimPlannedBalance !== null
                          ? totalInterimPlannedBalance - totalCurrentInterimStage
                          : null,
                        totalCurrentInterimStage
                      )
                    )}
                  </td>
                )}
                {isBalanceView && (
                  <td className={calculatedCellClassName}>{formatInventoryTotalAmount(totalFinalPlannedBalance)}</td>
                )}
                {isBalanceView && (
                  <td className={calculatedCellClassName}>
                    {formatRatio(calculateShare(totalFinalPlannedBalance, totalFinalPlannedBalance))}
                  </td>
                )}
                {isBalanceView && (
                  <td className={calculatedCellClassName}>
                    {formatRatio(
                      calculateChange(
                        totalFinalPlannedBalance !== null && totalPriorBalance !== null
                          ? totalFinalPlannedBalance - totalPriorBalance
                          : null,
                        totalPriorBalance
                      )
                    )}
                  </td>
                )}
                </>
                )}
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                {isExplanationColumnsExpanded && <td className="border border-[#2b2b2b] bg-black px-2 py-1" />}
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                {isExplanationColumnsExpanded && <td className="border border-[#2b2b2b] bg-black px-2 py-1" />}
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                <td className={`border border-[#2b2b2b] bg-black px-2 py-1 ${stickyRightCellClassName}`} />
              </tr>
            </tbody>
          </table>
          )}
        </div>
        {shouldShowInventoryPagination && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-3 py-2 text-xs text-slate-600">
            <span>
              {Math.min(inventoryPageStartIndex + inventoryPageSize, displayRows.length)} / {displayRows.length}
            </span>
            <select
              value={inventoryPageSize}
              onChange={(event) => {
                setInventoryPageSize(Number(event.target.value) as (typeof INVENTORY_PAGE_SIZE_OPTIONS)[number]);
                setInventoryPage(1);
              }}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
              aria-label="每页显示地点数量"
            >
              {INVENTORY_PAGE_SIZE_OPTIONS.map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize} / 页
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setInventoryPage((currentPage) => Math.max(1, currentPage - 1))}
              disabled={inventoryPage === 1}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white transition hover:border-blue-300 hover:text-[#143f97] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="上一页"
            >
              <ChevronLeft size={14} />
            </button>
            <span>
              {inventoryPage} / {inventoryTotalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setInventoryPage((currentPage) => Math.min(inventoryTotalPages, currentPage + 1))
              }
              disabled={inventoryPage === inventoryTotalPages}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white transition hover:border-blue-300 hover:text-[#143f97] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="下一页"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
        {footerRightContent && (
          <div className="flex items-center justify-end border-t border-gray-100 px-3 py-3">
            {footerRightContent}
          </div>
        )}
        {isBulkEditOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/35 p-4" role="presentation">
            <div
              className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="inventory-bulk-edit-title"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                <div>
                  <h3 id="inventory-bulk-edit-title" className="text-base font-semibold text-slate-900">批量编辑</h3>
                  <p className="mt-1 text-xs text-slate-500">已选择 {selectedRowIds.length} 行。仅实际修改的字段会应用到这些地点。</p>
                </div>
                <button type="button" onClick={() => setIsBulkEditOpen(false)} className="inline-flex h-7 w-7 items-center justify-center rounded text-lg leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="关闭批量编辑">×</button>
              </div>
              <div className="border-b border-slate-200 px-5 py-3">
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setIsBulkEditLocationsExpanded((current) => !current)}
                    className="flex min-w-0 items-center gap-2 text-left"
                    aria-expanded={isBulkEditLocationsExpanded}
                  >
                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      已选择的地点
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-[#00338D]">
                        {selectedRowsForBulkEdit.length} 个
                      </span>
                    </span>
                    <ChevronDown
                      size={15}
                      className={`shrink-0 text-slate-400 transition-transform ${isBulkEditLocationsExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-slate-600">
                    <CircularSelectionCheckbox
                      checked={allSelectedRowsAreSamples}
                      indeterminate={someSelectedRowsAreSamples}
                      onChange={handleBulkSampleSelectionChange}
                      ariaLabel="批量设置是否选为盘点对象"
                    />
                    <span>是否选为盘点对象</span>
                  </div>
                </div>
                {isBulkEditLocationsExpanded && (
                  <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-slate-50/70 px-3 py-1.5">
                    {selectedRowsForBulkEdit.map((row, index) => (
                      <div key={row.id} className="relative grid min-w-0 grid-cols-[18px_minmax(0,1fr)] items-center gap-2 rounded-md border border-slate-100 bg-white py-1.5 pl-2 pr-7 text-[11px] leading-4 shadow-[0_1px_1px_rgba(15,23,42,0.03)]">
                        <span className="text-[10px] text-slate-400">{index + 1}</span>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-700">
                            {row.companyName || `地点 ${index + 1}`}
                          </div>
                          <div className="truncate text-[10px] leading-3.5 text-slate-500">
                            {[row.location || '未填写地点', row.intervieweeName, row.category].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRowFromBulkSelection(row.id)}
                          className="absolute right-1.5 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded text-[13px] leading-none text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`将${row.companyName || `地点 ${index + 1}`}移出批量编辑`}
                          title="移出批量编辑"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid max-h-[62vh] grid-cols-2 gap-x-5 overflow-y-auto px-5 py-4">
                {(['left', 'right'] as const).map((side) => (
                  <section key={side} className="min-w-0">
                    <div className="space-y-3">
                      {BULK_EDIT_FIELD_CONFIGS.filter((config) => config.side === side).map((config) => {
                        const isEnabled = enabledBulkEditFields.includes(config.field);
                        const updateBulkEditValue = (value: string) => {
                          const isAttendanceUnavailable =
                            config.field === 'plannedAttendancePrimary' &&
                            value !== SELECT_PLACEHOLDER &&
                            value !== '是';
                          setBulkEditValues((current) => ({
                            ...current,
                            [config.field]: value,
                            ...(config.field === 'plannedAttendancePrimary'
                              ? {
                                  plannedAttendancePrimary: value,
                                  plannedAttendanceSecondary: isAttendanceUnavailable
                                    ? ''
                                    : value === '是'
                                      ? '是'
                                      : SELECT_PLACEHOLDER,
                                  auditApproach: isAttendanceUnavailable ? '' : SELECT_PLACEHOLDER,
                                }
                              : {}),
                            ...(config.field === 'plannedAttendanceSecondary'
                              ? { auditApproach: resolveAuditApproachForAttendanceDay(value) }
                              : {}),
                          }));
                          setEnabledBulkEditFields((current) => {
                            let nextFields = current.includes(config.field)
                              ? current
                              : [...current, config.field];

                            if (config.field === 'plannedAttendancePrimary') {
                              nextFields = nextFields.filter(
                                (field) => field !== 'plannedAttendanceSecondary' && field !== 'auditApproach'
                              );
                              if (isAttendanceUnavailable) {
                                nextFields = [...nextFields, 'plannedAttendanceSecondary', 'auditApproach'];
                              }
                            }

                            if (config.field === 'plannedAttendanceSecondary' && !nextFields.includes('auditApproach')) {
                              nextFields = [...nextFields, 'auditApproach'];
                            }

                            return nextFields;
                          });
                        };
                        const isAttendanceUnavailable =
                          bulkEditValues.plannedAttendancePrimary !== SELECT_PLACEHOLDER &&
                          bulkEditValues.plannedAttendancePrimary !== '是';
                        const isIndependentAttendance = bulkEditValues.plannedAttendanceSecondary === INDEPENDENT_ATTENDANCE_VALUE;
                        const isAttendanceDependentFieldLocked =
                          (isAttendanceUnavailable &&
                            (config.field === 'plannedAttendanceSecondary' || config.field === 'auditApproach')) ||
                          (isIndependentAttendance && config.field === 'auditApproach');
                        const linkedSelection = !isEnabled
                          ? null
                          : config.field === 'endingBalanceConfirmation'
                            ? {
                                label: '存货盘存系统',
                                value: bulkEditValues.endingBalanceConfirmation.includes('期末实施的实地盘点结果')
                                  ? '定期盘存系统'
                                  : '永续盘存系统',
                              }
                            : config.field === 'inventoryCountPlan'
                              ? {
                                  label: '存货盘点方法',
                                  value: bulkEditValues.inventoryCountPlan.includes('期末以外的特定日期')
                                    ? '在非期末时点完成盘点'
                                    : bulkEditValues.inventoryCountPlan.includes('在期末实施的')
                                      ? '在期末完成盘点'
                                      : '循环盘点',
                                }
                              : null;

                        return (
                          <div key={config.field}>
                            <label className="mb-1.5 block text-xs font-medium text-slate-700">
                              {config.label}
                            </label>
                            {config.options ? (
                              <select
                                value={bulkEditValues[config.field]}
                                disabled={isAttendanceDependentFieldLocked}
                                onChange={(event) => updateBulkEditValue(event.target.value)}
                                className={`h-8 w-full rounded-md border border-slate-300 px-2 text-left text-xs outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-100 ${isAttendanceDependentFieldLocked ? 'cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-white text-slate-700'}`}
                              >
                                {isAttendanceDependentFieldLocked && <option value="" />}
                                <option value={SELECT_PLACEHOLDER}>{SELECT_PLACEHOLDER}</option>
                                {config.options.filter((option) => option !== SELECT_PLACEHOLDER).map((option) => (
                                  <option
                                    key={option}
                                    value={option}
                                    disabled={
                                      config.field === 'auditApproach' &&
                                      isAuditApproachOptionDisabled(bulkEditValues.plannedAttendanceSecondary, option)
                                    }
                                  >
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={bulkEditValues[config.field]}
                                onChange={(event) => updateBulkEditValue(event.target.value)}
                                placeholder="请输入样本数量"
                                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                              />
                            )}
                            {linkedSelection && (
                              <div className="mt-1.5 flex items-start gap-1.5 rounded bg-blue-50/70 px-2 py-1.5 text-[11px] leading-4 text-slate-600">
                                <span className="shrink-0 text-slate-500">{linkedSelection.label}：</span>
                                <span className="font-medium text-[#00338D]">{linkedSelection.value}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
                <button type="button" onClick={() => setIsBulkEditOpen(false)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100">取消</button>
                <button type="button" onClick={applyBulkEdits} disabled={enabledBulkEditFields.length === 0} className="rounded-md border border-[#00338D] bg-[#00338D] px-4 py-2 text-xs font-medium text-white hover:bg-[#002b75] disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300">确定</button>
              </div>
            </div>
          </div>
        )}
        {pendingSampleChange && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/20 px-4">
            <div className="w-full max-w-[460px] rounded-lg border border-slate-200 bg-white p-5 text-left shadow-[0_18px_48px_rgba(15,23,42,0.22)]">
              <h3 className="text-sm font-semibold text-slate-900">记录样本变更的原因</h3>
              <textarea
                value={pendingSampleChange.reason}
                onChange={(event) =>
                  setPendingSampleChange((current) =>
                    current ? { ...current, reason: event.target.value } : current
                  )
                }
                aria-label="记录样本变更的原因"
                placeholder="请输入样本变更的原因"
                className="mt-3 min-h-[88px] w-full resize-y rounded border border-slate-200 bg-white px-3 py-2 text-sm leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#143f97] focus:ring-1 focus:ring-[#143f97]/20"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingSampleChange(null)}
                  className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={confirmPendingSampleChange}
                  className="rounded border border-[#143f97] bg-[#143f97] px-3 py-1.5 text-xs font-medium text-white transition hover:border-[#0f2f73] hover:bg-[#0f2f73]"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}
        </TableFullscreenFrame>
      </div>
      <style>{`
        .inventory-location-hint {
          transform-origin: 18px 100%;
          animation: inventoryLocationHintIn 180ms ease-out;
        }

        .inventory-location-hint-break {
          animation: inventoryLocationHintBreak 520ms cubic-bezier(0.2, 0.75, 0.35, 1) forwards;
        }

        .inventory-location-hint-chip {
          pointer-events: none;
          position: absolute;
          height: 7px;
          width: 7px;
          border-radius: 2px;
          background: #f9a8d4;
          opacity: 0;
        }

        .inventory-location-hint-chip-1 {
          left: 28px;
          top: 12px;
        }

        .inventory-location-hint-chip-2 {
          right: 38px;
          top: 18px;
          background: #fbcfe8;
        }

        .inventory-location-hint-chip-3 {
          left: 96px;
          bottom: 12px;
          background: #f472b6;
        }

        .inventory-location-hint-chip-4 {
          right: 84px;
          bottom: 16px;
        }

        .inventory-location-hint-chip-5 {
          left: 154px;
          top: 34px;
          background: #fda4af;
        }

        .inventory-location-hint-break .inventory-location-hint-chip {
          animation: inventoryLocationHintChip 520ms ease-out forwards;
        }

        .inventory-location-hint-break .inventory-location-hint-chip-1 {
          --chip-x: -44px;
          --chip-y: -24px;
          --chip-r: -48deg;
        }

        .inventory-location-hint-break .inventory-location-hint-chip-2 {
          --chip-x: 42px;
          --chip-y: -30px;
          --chip-r: 34deg;
        }

        .inventory-location-hint-break .inventory-location-hint-chip-3 {
          --chip-x: -26px;
          --chip-y: 34px;
          --chip-r: 70deg;
        }

        .inventory-location-hint-break .inventory-location-hint-chip-4 {
          --chip-x: 38px;
          --chip-y: 30px;
          --chip-r: -62deg;
        }

        .inventory-location-hint-break .inventory-location-hint-chip-5 {
          --chip-x: 8px;
          --chip-y: -44px;
          --chip-r: 112deg;
        }

        @keyframes inventoryLocationHintIn {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes inventoryLocationHintBreak {
          0% {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0) scale(1);
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          }
          45% {
            opacity: 0.95;
            transform: translateY(-2px) scale(1.01);
            clip-path: polygon(0 0, 53% 0, 48% 41%, 100% 34%, 100% 100%, 61% 83%, 36% 100%, 0 78%);
          }
          100% {
            opacity: 0;
            filter: blur(3px);
            transform: translateY(10px) scale(0.88) rotate(-1deg);
            clip-path: polygon(9% 16%, 39% 4%, 52% 45%, 93% 22%, 76% 91%, 58% 72%, 32% 96%, 18% 60%);
          }
        }

        @keyframes inventoryLocationHintChip {
          0% {
            opacity: 0;
            transform: translate(0, 0) rotate(0deg) scale(0.8);
          }
          18% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(var(--chip-x), var(--chip-y)) rotate(var(--chip-r)) scale(0.2);
          }
        }
      `}</style>
    </div>
  );
}
