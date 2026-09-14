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
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import TableFullscreenFrame from './TableFullscreenFrameJuly';

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
  sampleChangeReason: string;
};

type InventoryMatrixProps = {
  title?: string;
  embedded?: boolean;
  hideNoteLabels?: boolean;
  lockIdentityColumns?: boolean;
  toolbarActions?: React.ReactNode;
  rows?: InventoryMatrixRow[];
  onRowsChange?: (rows: InventoryMatrixRow[]) => void;
};

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

const SYSTEM_OPTIONS = ['定期盘存系统', '永续盘存系统'];
const ENDING_BALANCE_CONFIRMATION_OPTIONS = [
  '期末存货余额通过存货出入库和移动的记录来确认',
  '期末存货余额通过期末实施的实地盘点结果来确定',
];
const YES_NO_OPTIONS = ['否', '是'];
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
  'border border-slate-300 bg-white p-0 align-middle text-[12px] leading-[1.1] text-[#1f1f1f]';

const yellowCellClassName = `${bodyCellClassName} bg-white`;
const neutralCellClassName = `${bodyCellClassName} bg-white`;
const grayCellClassName = `${bodyCellClassName} bg-[#f7f9fa]`;

const inputClassName =
  'h-[21px] w-full border-0 bg-transparent px-2 text-center text-[12px] text-[#1f1f1f] outline-none';
const amountInputClassName =
  'h-[21px] w-full border-0 bg-transparent px-2 text-right text-[12px] text-[#1f1f1f] outline-none';

const selectClassName =
  'h-[21px] w-full appearance-none border-0 bg-transparent px-2 text-center text-[12px] text-[#1f1f1f] outline-none';

const calculatedCellClassName =
  'border border-slate-300 bg-black px-2 py-1 align-middle text-center text-[12px] font-semibold text-white';
const derivedCellClassName =
  'border border-slate-300 bg-[#f7f9fa] px-2 py-1 align-middle text-center text-[12px] font-semibold text-[#1f1f1f]';
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
  align = 'center',
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  className?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={`relative min-h-[38px] w-full ${className}`}>
      <span
        className={`flex min-h-[38px] items-center whitespace-normal break-words px-1 py-1 text-[10px] leading-[1.2] text-gray-700 ${
          align === 'left' ? 'justify-start text-left' : 'justify-center text-center'
        }`}
      >
        {value}
      </span>
      <select
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
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
  rows: controlledRows,
  onRowsChange,
}: InventoryMatrixProps) {
  const [uncontrolledRows, setUncontrolledRows] = useState<InventoryMatrixRow[]>(
    controlledRows ?? INITIAL_INVENTORY_MATRIX_ROWS
  );
  const [phaseView, setPhaseView] = useState<'balance' | 'interim'>('balance');
  const [isExplanationColumnsExpanded, setIsExplanationColumnsExpanded] = useState(false);
  const [matrixScrollLeft, setMatrixScrollLeft] = useState(0);
  const [isCategoryTooltipVisible, setIsCategoryTooltipVisible] = useState(false);
  const [inventoryPageSize, setInventoryPageSize] = useState<(typeof INVENTORY_PAGE_SIZE_OPTIONS)[number]>(15);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [inventoryAmountSort, setInventoryAmountSort] = useState<InventoryAmountSort>(null);
  const [pendingSampleChange, setPendingSampleChange] = useState<{
    rowId: string;
    nextValue: string;
    reason: string;
  } | null>(null);
  const [, setMatrixLayoutVersion] = useState(0);
  const categoryHeaderRef = useRef<HTMLTableCellElement>(null);
  const countMethodHeaderRef = useRef<HTMLTableCellElement>(null);
  const rows = controlledRows ?? uncontrolledRows;
  const isControlled = controlledRows !== undefined;
  const normalizedInventorySearchTerm = inventorySearchTerm.trim().toLowerCase();
  const filteredRows = normalizedInventorySearchTerm
    ? rows.filter((row) =>
        [row.companyName, row.intervieweeName, row.category].some((value) =>
          value.toLowerCase().includes(normalizedInventorySearchTerm)
        )
      )
    : rows;
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

  useLayoutEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setMatrixLayoutVersion((version) => version + 1);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [phaseView, isExplanationColumnsExpanded, displayRows.length, inventoryPage, inventoryPageSize]);

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

  const handleSelectedAsSampleChange = (row: InventoryMatrixRow, nextValue: string) => {
    if (isSampleYesValue(row.selectedAsSample) && isSampleNoValue(nextValue)) {
      setPendingSampleChange({ rowId: row.id, nextValue, reason: '' });
      return;
    }

    updateRow(row.id, 'selectedAsSample', nextValue);
  };

  const confirmPendingSampleChange = () => {
    if (!pendingSampleChange) {
      return;
    }

    commitRows((currentRows) =>
      currentRows.map((row) =>
        row.id === pendingSampleChange.rowId
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
  const isBalanceView = phaseView === 'balance';
  const isInterimView = phaseView === 'interim';
  const showAmountColumns = !isExplanationColumnsExpanded;
  const handleInventoryMatrixWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const canScrollHorizontally = container.scrollWidth > container.clientWidth;

    if (!canScrollHorizontally) {
      return;
    }

    const horizontalDelta = event.deltaX !== 0 ? event.deltaX : event.deltaY;
    container.scrollLeft += horizontalDelta;
    event.preventDefault();
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
      <div className="flex min-h-[38px] w-full flex-col items-center justify-center gap-0.5 leading-tight">
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
        <div className="mb-2 mt-2 flex flex-wrap items-center justify-between gap-3 px-1">
          <label className="relative block w-[260px]">
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
          <div className="flex flex-wrap items-center justify-end gap-3">
            {toolbarActions}
            <div
              className="flex items-center overflow-hidden rounded-full border border-blue-200 bg-blue-50 p-0.5 text-[11px] font-medium shadow-sm"
              role="switch"
              aria-checked={phaseView === 'interim'}
              aria-label="期末预审显示切换"
            >
              <button
                type="button"
                onClick={() => setPhaseView('balance')}
                className={`rounded-full px-3 py-1 transition ${
                  phaseView === 'balance'
                    ? 'bg-[#143f97] text-white shadow-sm'
                    : 'text-[#143f97] hover:bg-white/70'
                }`}
              >
                期末余额
              </button>
              <button
                type="button"
                onClick={() => setPhaseView('interim')}
                className={`rounded-full px-3 py-1 transition ${
                  phaseView === 'interim'
                    ? 'bg-[#143f97] text-white shadow-sm'
                    : 'text-[#143f97] hover:bg-white/70'
                }`}
              >
                预审余额
              </button>
            </div>
          </div>
        </div>
        <div
          className="overflow-x-auto overscroll-none rounded-lg"
          onScroll={(event) => setMatrixScrollLeft(event.currentTarget.scrollLeft)}
          onWheel={handleInventoryMatrixWheel}
        >
          <table className="w-full table-fixed border-collapse bg-white [&_td]:border-slate-300 [&_th]:border-slate-300">
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
                      className={selectClassName}
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
                      align="left"
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
                      className={selectClassName}
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
                      align="left"
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
                      className={selectClassName}
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
                <td className="border border-[#2b2b2b] bg-black px-2 py-1 text-center text-[12px] font-semibold leading-[1.1] text-white">
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
