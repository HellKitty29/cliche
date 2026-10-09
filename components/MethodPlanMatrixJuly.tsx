/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Minimize2, Pencil, Search, TriangleAlert } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  allowsThirdPartyEvidence,
  INVENTORY_PROCEDURE_METHOD_LABELS,
  normalizeThirdPartyEvidence,
  getInventoryProcedureDecision,
  getInventoryProcedureDisplayGroupIds,
  getPublishableInventoryRows,
  isInventorySampleExcluded,
} from '../utils/inventoryProcedureRules';
import { parseChineseAddress } from '../utils/addressParser';

export type MethodPlanRow = {
  id: string;
  companyName: string;
  companyOwner: string;
  province: string;
  city: string;
  district: string;
  address: string;
  importedCategory?: string;
  importedEndingBalanceConfirmation?: string;
  importedSystemType?: string;
  importedThirdPartyStorage?: string;
  importedInventoryCountPlan?: string;
  importedUseExpert?: string;
  importedPriorBalance?: string;
  importedFinalBalance?: string;
  importedPriorInterimPlannedBalance?: string;
  importedInterimPlannedBalance?: string;
  countMethod: string;
  selectedAsSample: string;
  sampleQuantity: string;
  confirmThirdPartyInventory: string;
  auditApproach: string;
  feasibility: string;
  monitorMode: string;
  plannedDate: string;
  submissionDate: string;
  useExperts: string;
  useInternalAudit: string;
  sampleChangeReason: string;
};

type MethodPlanMatrixProps = {
  rows?: MethodPlanRow[];
  onRowsChange?: (rows: MethodPlanRow[]) => void;
  onBulkImportRows?: (rows: MethodPlanRow[]) => void;
  showBulkImportButton?: boolean;
  footerLeftContent?: React.ReactNode;
  hideNoteLabels?: boolean;
  renderTableContent?: boolean;
  bulkImportMode?: 'locations' | 'methodPlan';
  onKoicPushConfirm?: (publishedRows: MethodPlanRow[]) => void;
};

export type MethodPlanMatrixHandle = {
  openBulkImportModal: () => void;
  openKoicPushModal: () => void;
  openLocationSettings: (rowId: string) => void;
};

const SELECT_PLACEHOLDER = '从下拉菜单选择';

const COUNT_METHOD_OPTIONS = [SELECT_PLACEHOLDER, '循环盘点', '在非期末时点完成盘点', '在期末完成盘点'];
const AUDIT_APPROACH_OPTIONS = [
  SELECT_PLACEHOLDER,
  '双重目的方案',
  '实质性程序方案',
  '控制测试方案',
  '独立盘点方案',
  '由于不可预见的情况无法实施监盘，实施的独立盘点方案等程序',
  '由于存货的性质、存放地点等因素，实施存货监盘不可行时，实施的替代程序',
  '未识别出重大错报风险（仅限ISA项目）'
];
const AUDIT_APPROACH_EXPLANATIONS: Partial<Record<string, string>> = {
  实质性程序方案: '对盘点结果进行测试，以获取有关盘点记录完整性和准确性的审计证据',
  控制测试方案: '获取有关盘点指令和程序是否得到适当设计和执行的审计证据',
  双重目的方案:
    '同时获取有关盘点记录完整性和准确性的审计证据，及有关盘点指令和程序是否得到适当设计和执行的审计证据',
};
const MONITOR_MODE_OPTIONS = [SELECT_PLACEHOLDER, '现场监盘', '远程监盘', '不适用'];
const YES_NO_OPTIONS = ['是', '否'];
const BULK_IMPORT_VISIBLE_ROW_COUNT = 6;
const METHOD_PLAN_PAGE_SIZE = 15;
const METHOD_PLAN_WEB_AMOUNT_SCALE = 0.000001;
const METHOD_PLAN_AUDIT_APPROACH_KAEG_REFERENCE =
  '项目组不可以采取实质性方案对管理层的循环盘点结果进行测试。\n\n 如果项目组在应对存货数量和状况的重大错报风险，并且被审计单位采用循环盘点或在非期末以外的日期进行全面实地盘点，则项目组可采用独立盘点方案实施程序。 [ISA | 7746.8389]\n\n当与存货的数量和状况相关的风险未被评估为重大错报风险，且存货对财务报表是重要时，方案“未识别出重大错报风险”适用。项目组需参阅章节“如果在数量和状况方面未识别出重大错报风险，且存货是重要的财务报表科目，则在存货监盘过程中实施程序”[7749]了解进一步信息。;\n\n当与存货的数量和状况相关的风险未被评估为重大错报风险，且存货对财务报表是重要时，该方案适用。参阅章节“如果在数量和状况方面未识别出重大错报风险，且存货是重要的财务报表科目，则在存货监盘过程中实施程序”[7749]了解进一步信息。'
const METHOD_PLAN_NON_SIGNIFICANT_RISK_INFO =
  '当与存货的数量和状况相关的风险未被评估为重大错报风险，且存货对财务报表是重要时，该方案适用。参阅章节“如果在数量和状况方面未识别出重大错报风险，且存货是重要的财务报表科目，则在存货监盘过程中实施程序”[7749]了解进一步信息。';
const METHOD_PLAN_MONITOR_MODE_INFO =
  '在允许使用实时视频技术的情况下，项目组可以通过实时视频技术执行一些但不是所有的存货监盘。如果监盘观察是使用实时视频技术进行的，项目组将实施与现场监盘相同的程序。考虑当地法律法规，以确定司法管辖区是否允许使用实时视频技术。\n\n请参阅问题“在确定现场监盘与远程监盘的存货盘点场次时，考虑哪些因素？”[7746.9174] 了解在确定现场监盘或视频执行存货监盘时需要考虑的因素的进一步信息。';
const METHOD_PLAN_EXPERTS_INFO =
  '在KPMG Clara workflow 的1.1.2“战略和审计计划”中添加相关的专家或特定项目组成员。';
const METHOD_PLAN_INTERNAL_AUDIT_INFO =
  '完成KPMG Clara workflow的1.1.4“内部审计”中的工作屏。';
const ENDING_BALANCE_CONFIRMATION_OPTIONS = [
  '期末存货余额通过存货出入库和移动的记录来确认',
  '期末存货余额通过期末实施的实地盘点结果来确定',
] as const;
const PERPETUAL_SYSTEM_TYPE = '永续盘存系统';
const PERIODIC_SYSTEM_TYPE = '定期盘存系统';
const INVENTORY_COUNT_PLAN_OPTIONS = [
  '在期末实施的、盘点对象为整个存货总体的实地存货盘点',
  '在期末以外的特定日期实施的、盘点对象为整个存货总体的实地存货盘点',
  '在整个会计期间内，定期进行的存货盘点',
  '在一年中不同时间实施的、盘点对象为每一存放地点实施的实地存货盘点',
  '在一年中不同时间实施的、按存货项目储位 (如存储箱、分隔间、货架、行) 为每一存放单位实施的实地存货盘点',
] as const;
type MethodPlanPopupField =
  | 'confirmThirdPartyInventory'
  | 'auditApproach'
  | 'monitorMode'
  | 'useExperts'
  | 'useInternalAudit';

const METHOD_PLAN_POPUP_FIELD_CONFIGS: Array<{
  field: MethodPlanPopupField;
  label: string;
  options: string[];
}> = [
  { field: 'auditApproach', label: '毕马威就监盘而计划的审计方案', options: AUDIT_APPROACH_OPTIONS },
  {
    field: 'confirmThirdPartyInventory',
    label: '是否执行向持有被审计单位存货的第三方函证存货的数量和状况等其他程序',
    options: YES_NO_OPTIONS,
  },
  { field: 'monitorMode', label: '现场监盘 vs 远程监盘', options: MONITOR_MODE_OPTIONS },
  {
    field: 'useExperts',
    label: '计划引入专家和/或特定项目组成员，包括信息技术审计人员？',
    options: YES_NO_OPTIONS,
  },
  {
    field: 'useInternalAudit',
    label: '计划利用内部审计工作获取审计证据？',
    options: YES_NO_OPTIONS,
  },
];

const DEFAULT_METHOD_PLAN_POPUP_VALUES: Record<MethodPlanPopupField, string> = {
  confirmThirdPartyInventory: '否',
  auditApproach: SELECT_PLACEHOLDER,
  monitorMode: SELECT_PLACEHOLDER,
  useExperts: '否',
  useInternalAudit: '否',
};

const BULK_IMPORT_HEADER_ITEMS = [
  { id: 'index', label: '#', fixed: true },
  { id: 'companyName', label: '所属公司名称', fixed: false },
  { id: 'intervieweeName', label: '受访单位名称', fixed: false },
  { id: 'category', label: '类别', fixed: false },
  { id: 'endingBalanceConfirmation', label: '被审计单位是如何确认期末存货余额的？', fixed: false },
  { id: 'systemType', label: '被审计单位是否使用永续盘存系统或定期盘存系统？', fixed: false },
  { id: 'thirdPartyStorage', label: '是否存放在第三方地点', fixed: false },
  { id: 'inventoryCountPlan', label: '被审计单位是如何具体计划存货盘点的？', fixed: false },
  { id: 'countMethod', label: '被审计单位的存货盘点方法', fixed: false },
  { id: 'useExpert', label: '被审计单位是否使用了专家？', fixed: false },
  { id: 'selectedAsSample', label: '是否被毕马威选为盘点对象', fixed: false },
  { id: 'priorBalance', label: '上期期末余额', fixed: false },
  { id: 'priorInterimPlannedBalance', label: '上期预审阶段计划余额', fixed: false },
  { id: 'interimPlannedBalance', label: '预审阶段计划余额', fixed: false },
  { id: 'finalBalance', label: '期末余额', fixed: false },
] as const;

const LOCKED_LOCATION_BULK_IMPORT_HEADER_IDS = ['companyName', 'intervieweeName'] as const;
const LOCATION_BULK_IMPORT_REQUIRED_HEADER_IDS = [
  'companyName',
  'intervieweeName',
  'category',
  'endingBalanceConfirmation',
  'systemType',
  'thirdPartyStorage',
  'inventoryCountPlan',
  'countMethod',
  'useExpert',
  'selectedAsSample',
] as const;

const METHOD_PLAN_IMPORT_HEADER_ITEMS = [
  { id: 'index', label: '#', fixed: true },
  { id: 'companyName', label: '所属公司名称', fixed: true },
  { id: 'companyOwner', label: '受访单位名称', fixed: true },
  { id: 'province', label: '地点所在省 / 地区', fixed: true },
  { id: 'city', label: '地点所在市', fixed: true },
  { id: 'district', label: '地点所在区', fixed: true },
  { id: 'address', label: '地点详细地址', fixed: true },
  { id: 'sampleQuantity', label: '样本数量', fixed: true },
  { id: 'confirmThirdPartyInventory', label: '向第三方函证存货的数量和状况', fixed: true },
  { id: 'auditApproach', label: '毕马威就监盘而计划的审计方案', fixed: true },
  { id: 'monitorMode', label: '现场监盘 vs 远程监盘', fixed: true },
  { id: 'useExperts', label: '计划引入专家和/或特定项目组成员，包括信息技术审计人员？', fixed: true },
  { id: 'useInternalAudit', label: '计划利用内部审计工作获取审计证据？', fixed: true },
] as const;

const METHOD_PLAN_KOIC_GROUPS = [
  { id: 1, label: INVENTORY_PROCEDURE_METHOD_LABELS[1] },
  { id: 2, label: INVENTORY_PROCEDURE_METHOD_LABELS[2] },
  { id: 3, label: INVENTORY_PROCEDURE_METHOD_LABELS[3] },
  { id: 4, label: INVENTORY_PROCEDURE_METHOD_LABELS[4] },
  { id: 5, label: INVENTORY_PROCEDURE_METHOD_LABELS[5] },
  { id: 6, label: INVENTORY_PROCEDURE_METHOD_LABELS[6] },
  { id: 7, label: INVENTORY_PROCEDURE_METHOD_LABELS[7] },
] as const;

const headerBlue =
  "border border-slate-300 bg-[#F1F6FD] px-2 py-1 text-center font-['Microsoft_YaHei'] text-[11px] font-bold leading-[1.2] text-gray-700";
const headerOrange =
  "border border-slate-300 bg-[#F1F6FD] px-2 py-1 text-center font-['Microsoft_YaHei'] text-[11px] font-bold leading-[1.2] text-gray-700";
const whiteHeaderCell =
  "border border-slate-300 bg-[#F1F6FD] px-2 py-1 text-center font-['Microsoft_YaHei'] text-[11px] font-bold leading-[1.2] text-gray-700";
const yellowCell = 'border border-slate-300 bg-white p-0 align-middle';
const grayCell = 'border border-slate-300 bg-[#f7f9fa] p-0 align-middle';
const whiteCell = 'border border-slate-300 bg-white p-0 align-middle';
const inputClassName =
  'h-full min-h-[24px] w-full bg-transparent px-2 py-1 text-[11px] leading-4 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500';
const selectClassName =
  'h-full min-h-[24px] w-full appearance-none bg-transparent px-2 py-1 text-[11px] leading-4 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500';
const stickyLeftCellClassNames = [
  'sticky left-0 z-30 bg-clip-padding',
  'sticky left-[32px] z-30 bg-clip-padding',
  'sticky left-[137px] z-30 bg-clip-padding',
] as const;
const stickyRightCellClassName = 'sticky right-0 z-30 bg-clip-padding shadow-[-10px_0_14px_-10px_rgba(15,23,42,0.45)]';

function formatMethodPlanWebAmount(value?: string) {
  const normalizedValue = (value ?? '').replace(/,/g, '').trim();

  if (!normalizedValue) {
    return '';
  }

  const amount = Number(normalizedValue);

  if (!Number.isFinite(amount)) {
    return value ?? '';
  }

  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount * METHOD_PLAN_WEB_AMOUNT_SCALE);
}

function MethodPlanKButton({
  label,
  className = '',
}: {
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={`KAEG 索引 ${label}`}
      className={`group/kaeg relative ml-1 inline-flex h-4 w-4 flex-none items-center justify-center rounded-full border border-[#00338D] bg-[#00338D] text-[10px] font-semibold leading-none text-white shadow-sm transition hover:z-[100] hover:border-[#002b75] hover:bg-[#002b75] hover:shadow-md focus:z-[100] focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 ${className}`}
    >
      K
      <span
        className="pointer-events-none absolute left-full top-full z-[90] ml-1 mt-1 w-[320px] whitespace-pre-line rounded bg-gray-900 px-2 py-1 text-left text-[11px] leading-4 text-white opacity-0 shadow-lg transition-opacity group-hover/kaeg:opacity-100 group-focus-visible/kaeg:opacity-100"
      >
        {label}
      </span>
    </button>
  );
}

function MethodPlanInfoButton({ label, className = '' }: { label: string; className?: string }) {
  return (
    <button
      type="button"
      aria-label={`说明 ${label}`}
      className={`group/info relative ml-1 inline-flex h-3.5 w-3.5 flex-none items-center justify-center rounded-full border border-black/40 bg-white text-[9px] font-bold leading-none text-[#143f97] hover:z-[100] focus:z-[100] ${className}`}
    >
      i
      <span className="pointer-events-none absolute left-full top-full z-[90] ml-1 mt-1 w-[300px] whitespace-pre-line rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-[11px] font-normal leading-5 text-gray-700 opacity-0 shadow-lg transition-opacity group-hover/info:opacity-100 group-focus-visible/info:opacity-100">
        {label}
      </span>
    </button>
  );
}

function renderMethodPlanPopupFieldLabel(config: { field: MethodPlanPopupField; label: string }) {
  return (
    <span className="text-xs font-medium leading-5 text-slate-600">
      {config.label}
      {config.field === 'auditApproach' && (
        <>
          <MethodPlanKButton
            className="ml-1 align-middle"
            label={METHOD_PLAN_AUDIT_APPROACH_KAEG_REFERENCE}
          />
          <MethodPlanInfoButton label={METHOD_PLAN_NON_SIGNIFICANT_RISK_INFO} />
        </>
      )}
      {config.field === 'monitorMode' && <MethodPlanInfoButton label={METHOD_PLAN_MONITOR_MODE_INFO} />}
      {config.field === 'useExperts' && <MethodPlanInfoButton label={METHOD_PLAN_EXPERTS_INFO} />}
      {config.field === 'useInternalAudit' && <MethodPlanInfoButton label={METHOD_PLAN_INTERNAL_AUDIT_INFO} />}
    </span>
  );
}

export const createMethodPlanRow = (overrides: Partial<MethodPlanRow> = {}): MethodPlanRow => normalizeThirdPartyEvidence({
  id: Math.random().toString(36).slice(2, 11),
  companyName: '',
  companyOwner: '',
  province: '',
  city: '',
  district: '',
  address: '',
  countMethod: SELECT_PLACEHOLDER,
  selectedAsSample: '是',
  sampleQuantity: '',
  confirmThirdPartyInventory: '否',
  auditApproach: SELECT_PLACEHOLDER,
  feasibility: SELECT_PLACEHOLDER,
  monitorMode: SELECT_PLACEHOLDER,
  plannedDate: '',
  submissionDate: '',
  useExperts: '否',
  useInternalAudit: '否',
  sampleChangeReason: '',
  ...overrides,
});

const DEFAULT_ROWS: MethodPlanRow[] = [
  createMethodPlanRow({
    companyName: 'ABC',
    companyOwner: 'ABC Manufacturing Co., Ltd.',
  }),
  createMethodPlanRow(),
  createMethodPlanRow(),
  createMethodPlanRow(),
  createMethodPlanRow(),
  createMethodPlanRow(),
];

type LocationBulkImportHeaderId = (typeof BULK_IMPORT_HEADER_ITEMS)[number]['id'];
type MethodPlanImportHeaderId = (typeof METHOD_PLAN_IMPORT_HEADER_ITEMS)[number]['id'];
type BulkImportHeaderItem =
  | (typeof BULK_IMPORT_HEADER_ITEMS)[number]
  | (typeof METHOD_PLAN_IMPORT_HEADER_ITEMS)[number];
type BulkImportHeaderId = LocationBulkImportHeaderId | MethodPlanImportHeaderId;
type BulkImportParsedRow = Partial<Record<string, string>>;

const normalizeBulkImportHeaderLabel = (value: string) => value.replace(/\s+/g, '');
const BULK_IMPORT_HEADER_ALIASES: Record<string, BulkImportHeaderId> = {
  [normalizeBulkImportHeaderLabel('上期预审阶段余额')]: 'priorInterimPlannedBalance',
  [normalizeBulkImportHeaderLabel('受访单位名称')]: 'intervieweeName',
  [normalizeBulkImportHeaderLabel('受访单位')]: 'intervieweeName',
  [normalizeBulkImportHeaderLabel('被访单位名称')]: 'intervieweeName',
  [normalizeBulkImportHeaderLabel('被访单位')]: 'intervieweeName',
};
const BULK_IMPORT_EXCEL_EMPTY_PRIMARY_ROW_LIMIT = 20;

const parseBulkImportCells = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.split('\t').map((cell) => cell.trim()))
    .filter((cells) => cells.some(Boolean));

const getBulkImportWorksheetCellText = (worksheet: XLSX.WorkSheet, rowIndex: number, columnIndex: number) => {
  const cell = worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })];

  if (!cell) {
    return '';
  }

  return String(cell.w ?? cell.v ?? '').trim();
};

const getBulkImportCellRowsFromWorksheet = (worksheet: XLSX.WorkSheet): string[][] => {
  const rangeAddress = worksheet['!ref'];

  if (!rangeAddress) {
    return [];
  }

  const range = XLSX.utils.decode_range(rangeAddress);
  const maxColumnIndex = Math.min(range.e.c, range.s.c + BULK_IMPORT_HEADER_ITEMS.length - 1);
  const rows: string[][] = [];
  let emptyPrimaryRowCount = 0;

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    const cells = Array.from({ length: maxColumnIndex - range.s.c + 1 }, (_, columnOffset) =>
      getBulkImportWorksheetCellText(worksheet, rowIndex, range.s.c + columnOffset)
    );
    const hasAnyCell = cells.some(Boolean);
    const hasPrimaryCell = cells.slice(0, 4).some(Boolean);

    if (hasPrimaryCell || (rows.length === 0 && hasAnyCell)) {
      emptyPrimaryRowCount = 0;
      rows.push(cells);
      continue;
    }

    if (rows.length > 0) {
      emptyPrimaryRowCount += 1;

      if (emptyPrimaryRowCount >= BULK_IMPORT_EXCEL_EMPTY_PRIMARY_ROW_LIMIT) {
        break;
      }
    }
  }

  return rows.filter((cells) => cells.some(Boolean));
};

const normalizeBulkImportCellRows = (
  rows: string[][],
  headers: readonly BulkImportHeaderItem[]
): string[][] => {
  if (rows.length === 0) {
    return [];
  }

  const headerLookup = new Map<string, BulkImportHeaderId>(
    headers.map((item) => [normalizeBulkImportHeaderLabel(item.label), item.id])
  );
  const allowedHeaderIds = new Set<BulkImportHeaderId>(headers.map((item) => item.id));
  Object.entries(BULK_IMPORT_HEADER_ALIASES).forEach(([label, headerId]) => {
    if (allowedHeaderIds.has(headerId)) {
      headerLookup.set(label, headerId);
    } else if (headerId === 'intervieweeName' && allowedHeaderIds.has('companyOwner')) {
      headerLookup.set(label, 'companyOwner');
    }
  });
  const firstRowHeaderIds = rows[0].map((cell) => headerLookup.get(normalizeBulkImportHeaderLabel(cell)));
  const hasHeaderRow = firstRowHeaderIds.some(Boolean);
  const dataRows = hasHeaderRow ? rows.slice(1) : rows;
  const headerIndexes = new Map<BulkImportHeaderId, number>();

  if (hasHeaderRow) {
    firstRowHeaderIds.forEach((headerId, index) => {
      if (headerId && headerId !== 'index') {
        headerIndexes.set(headerId, index);
      }
    });
  }

  return dataRows.map((cells) =>
    headers.map((header, index) => {
      if (header.id === 'index') {
        return '';
      }

      if (hasHeaderRow) {
        const sourceIndex = headerIndexes.get(header.id);
        return sourceIndex === undefined ? '' : cells[sourceIndex] ?? '';
      }

      const nonIndexColumnIndex = headers.slice(0, index).filter((item) => item.id !== 'index').length;
      const hasLeadingIndexColumn =
        cells.length > headers.filter((item) => item.id !== 'index').length &&
        (/^#?$/.test(cells[0]) || /^\d+$/.test(cells[0]));

      return cells[nonIndexColumnIndex + (hasLeadingIndexColumn ? 1 : 0)] ?? '';
    })
  );
};

const serializeBulkImportSheetRows = (rows: string[][]) =>
  rows
    .map((cells) => cells.map((cell) => cell.trim()).join('\t'))
    .filter((line) => line.replace(/\t/g, '').trim())
    .join('\n');

const getSystemTypeFromEndingBalanceConfirmation = (value: string) => {
  const normalizedValue = value.replace(/\s+/g, '');

  if (normalizedValue.includes('存货出入库和移动的记录')) {
    return PERPETUAL_SYSTEM_TYPE;
  }

  if (normalizedValue.includes('期末实施的实地盘点结果')) {
    return PERIODIC_SYSTEM_TYPE;
  }

  return '';
};

const getEndingBalanceConfirmationFromSystemType = (value: string) => {
  if (value.includes(PERPETUAL_SYSTEM_TYPE)) {
    return ENDING_BALANCE_CONFIRMATION_OPTIONS[0];
  }

  if (value.includes(PERIODIC_SYSTEM_TYPE)) {
    return ENDING_BALANCE_CONFIRMATION_OPTIONS[1];
  }

  return '';
};

const synchronizeEndingBalanceSystemType = (
  rows: string[][],
  headers: readonly BulkImportHeaderItem[]
) => {
  const confirmationIndex = headers.findIndex((header) => header.id === 'endingBalanceConfirmation');
  const systemTypeIndex = headers.findIndex((header) => header.id === 'systemType');

  if (confirmationIndex < 0 || systemTypeIndex < 0) {
    return rows;
  }

  return rows.map((row) => {
    const nextSystemType = getSystemTypeFromEndingBalanceConfirmation(row[confirmationIndex] ?? '');

    if (!nextSystemType || row[systemTypeIndex] === nextSystemType) {
      return row;
    }

    const nextRow = [...row];
    nextRow[systemTypeIndex] = nextSystemType;
    return nextRow;
  });
};

const getCountMethodFromInventoryCountPlan = (value: string) => {
  const normalizedValue = value.replace(/\s+/g, '');

  if (normalizedValue.includes('在期末实施的') && normalizedValue.includes('整个存货总体')) {
    return '在期末完成盘点';
  }

  if (normalizedValue.includes('期末以外的特定日期') && normalizedValue.includes('整个存货总体')) {
    return '在非期末时点完成盘点';
  }

  if (
    normalizedValue.includes('整个会计期间内') ||
    normalizedValue.includes('每一存放地点') ||
    normalizedValue.includes('每一存放单位')
  ) {
    return '循环盘点';
  }

  return '';
};

const getInventoryCountPlanFromCountMethod = (value: string) => {
  if (value.includes('在期末完成盘点')) {
    return INVENTORY_COUNT_PLAN_OPTIONS[0];
  }

  if (value.includes('在非期末时点完成盘点')) {
    return INVENTORY_COUNT_PLAN_OPTIONS[1];
  }

  if (value.includes('循环盘点')) {
    return INVENTORY_COUNT_PLAN_OPTIONS[2];
  }

  return '';
};

const synchronizeInventoryCountPlanMethod = (
  rows: string[][],
  headers: readonly BulkImportHeaderItem[]
) => {
  const planIndex = headers.findIndex((header) => header.id === 'inventoryCountPlan');
  const countMethodIndex = headers.findIndex((header) => header.id === 'countMethod');

  if (planIndex < 0 || countMethodIndex < 0) {
    return rows;
  }

  return rows.map((row) => {
    const nextCountMethod = getCountMethodFromInventoryCountPlan(row[planIndex] ?? '');

    if (!nextCountMethod || row[countMethodIndex] === nextCountMethod) {
      return row;
    }

    const nextRow = [...row];
    nextRow[countMethodIndex] = nextCountMethod;
    return nextRow;
  });
};

const synchronizeLocationDerivedFields = (
  rows: string[][],
  headers: readonly BulkImportHeaderItem[]
) =>
  synchronizeInventoryCountPlanMethod(
    synchronizeEndingBalanceSystemType(rows, headers),
    headers
  );

const getBulkImportSheetRows = (
  value: string,
  headers: readonly BulkImportHeaderItem[]
): string[][] =>
  synchronizeLocationDerivedFields(
    normalizeBulkImportCellRows(parseBulkImportCells(value), headers),
    headers
  );

const getBulkImportRecords = (
  value: string,
  headers: readonly BulkImportHeaderItem[]
): BulkImportParsedRow[] =>
  getBulkImportSheetRows(value, headers)
    .map((cells) =>
      headers.reduce<BulkImportParsedRow>((record, header, index) => {
        const value = cells[index]?.trim();

        if (value && header.id !== 'index') {
          record[header.id] = value;
        }

        return record;
      }, {})
    )
    .filter((record) => Object.values(record).some((value) => value?.trim()));

const getBulkImportRowFromMethodPlanRow = (row: MethodPlanRow) => {
  return BULK_IMPORT_HEADER_ITEMS.map((header) => {
    switch (header.id) {
      case 'index':
        return '';
      case 'companyName':
        return row.companyName;
      case 'intervieweeName':
        return row.companyOwner;
      case 'category':
        return row.importedCategory ?? '';
      case 'endingBalanceConfirmation':
        return (
          row.importedEndingBalanceConfirmation ??
          getEndingBalanceConfirmationFromSystemType(row.importedSystemType ?? '')
        );
      case 'systemType':
        return row.importedSystemType ?? '';
      case 'thirdPartyStorage':
        return row.importedThirdPartyStorage ?? '';
      case 'inventoryCountPlan':
        return row.importedInventoryCountPlan ?? getInventoryCountPlanFromCountMethod(row.countMethod);
      case 'countMethod':
        return row.countMethod;
      case 'useExpert':
        return row.importedUseExpert ?? '';
      case 'priorBalance':
        return row.importedPriorBalance ?? '';
      case 'finalBalance':
        return row.importedFinalBalance ?? '';
      case 'priorInterimPlannedBalance':
        return row.importedPriorInterimPlannedBalance ?? '';
      case 'interimPlannedBalance':
        return row.importedInterimPlannedBalance ?? '';
      case 'selectedAsSample':
        return row.selectedAsSample;
      default:
        return '';
    }
  });
};

const getBulkImportRowFromMethodPlanFullRow = (row: MethodPlanRow) =>
  METHOD_PLAN_IMPORT_HEADER_ITEMS.map((header) => {
    switch (header.id) {
      case 'index':
        return '';
      case 'companyName':
        return row.companyName;
      case 'companyOwner':
        return row.companyOwner;
      case 'province':
        return row.province;
      case 'city':
        return row.city;
      case 'district':
        return row.district;
      case 'address':
        return row.address;
      case 'sampleQuantity':
        return row.sampleQuantity;
      case 'confirmThirdPartyInventory':
        return row.confirmThirdPartyInventory;
      case 'auditApproach':
        return row.auditApproach;
      case 'monitorMode':
        return row.monitorMode;
      case 'useExperts':
        return row.useExperts;
      case 'useInternalAudit':
        return row.useInternalAudit;
      default:
        return '';
    }
  });

const getMethodPlanAnomalies = (row: MethodPlanRow) =>
  getInventoryProcedureDecision(row).warnings.map((warning) => ({
    ...warning,
    id: row.id + '-' + warning.code,
    rowId: row.id,
    companyName: row.companyName,
    companyOwner: row.companyOwner,
    countMethod: row.countMethod,
  }));

type KoicAnomalyStyle = 'A' | 'B' | 'C';

const KOIC_ANOMALY_STYLE_CLASSES = {
  A: {
    table: 'mt-2 overflow-hidden border-y border-rose-200/70',
    header: 'border-b border-rose-200/70 bg-transparent',
    divider: 'border-r border-rose-200/60',
    row: 'border-b border-rose-200/60 last:border-b-0',
  },
  B: {
    table: 'mt-2',
    header: 'border-b border-rose-200/70 bg-transparent',
    divider: '',
    row: 'border-b border-rose-200/60 last:border-b-0',
  },
  C: {
    table: 'mt-2 overflow-hidden border-y border-rose-200/70',
    header: 'border-b border-rose-200/70 bg-white/70',
    divider: 'border-r border-rose-200/60',
    row: 'border-b border-rose-200/50 last:border-b-0',
  },
} satisfies Record<KoicAnomalyStyle, {
  table: string;
  header: string;
  divider: string;
  row: string;
}>;

const hasBulkImportRowContent = (cells: string[]) =>
  cells.some((cell) => cell.trim());

function SelectCell({
  value,
  options,
  onChange,
  className,
  disabled = false,
}: {
  disabled?: boolean;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className: string;
}) {
  return (
    <td className={`relative ${className}`}>
      <select
        disabled={disabled}
        className={`${selectClassName} text-center`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </td>
  );
}

function AuditApproachPopupSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative mt-1">
      <button
        type="button"
        className="flex h-9 w-full items-center rounded-lg border border-slate-200 bg-white px-3 text-left text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      >
        <span className="min-w-0 flex-1 truncate">{value}</span>
        <ChevronDown className="ml-2 h-3.5 w-3.5 flex-none text-slate-400" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="毕马威就监盘而计划的审计方案"
          className="absolute left-0 top-full z-[110] mt-1 w-full min-w-[260px] rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
        >
          {AUDIT_APPROACH_OPTIONS.map((option) => {
            const explanation = AUDIT_APPROACH_EXPLANATIONS[option];

            return (
              <div key={option} className="group/popup-audit-option relative">
                <button
                  type="button"
                  role="option"
                  aria-selected={value === option}
                  className={`block w-full px-3 py-2 text-left text-xs leading-4 transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none ${
                    value === option ? 'bg-blue-50 font-medium text-[#143f97]' : 'text-slate-700'
                  }`}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                >
                  {option}
                </button>
                {explanation && (
                  <div className="pointer-events-none absolute left-full top-0 z-[120] ml-2 hidden w-[360px] rounded-lg border border-blue-100 bg-white px-3 py-2 text-left text-[11px] font-normal leading-5 text-slate-700 shadow-xl group-hover/popup-audit-option:block group-focus-within/popup-audit-option:block">
                    {explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AuditApproachSelectCell({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [isOpen]);

  return (
    <td
      ref={rootRef}
      className={`relative ${isOpen ? 'z-[70]' : ''} ${className}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      }}
    >
      <button
        type="button"
        className={`${selectClassName} flex items-center text-center`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="min-w-0 flex-1 truncate">{value}</span>
      </button>
      {isOpen && (
        <div
          role="listbox"
          aria-label="毕马威就监盘而计划的审计方案"
          className="absolute left-0 top-full z-[80] mt-1 w-[240px] rounded-md border border-slate-200 bg-white py-1 shadow-xl"
        >
          {AUDIT_APPROACH_OPTIONS.map((option) => {
            const explanation = AUDIT_APPROACH_EXPLANATIONS[option];

            return (
              <div key={option} className="group/audit-option relative">
                <button
                  type="button"
                  role="option"
                  aria-selected={value === option}
                  className={`block w-full px-3 py-2 text-left text-[11px] leading-4 transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none ${
                    value === option ? 'bg-blue-50 font-medium text-[#143f97]' : 'text-slate-700'
                  }`}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                >
                  {option}
                </button>

                {explanation && (
                  <div className="pointer-events-none absolute left-full top-0 z-[90] ml-2 hidden w-[360px] rounded-md border border-blue-100 bg-white px-3 py-2 text-left text-[11px] font-normal leading-5 text-slate-700 shadow-xl group-hover/audit-option:block group-focus-within/audit-option:block">
                    {explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </td>
  );
}

const MethodPlanMatrix = forwardRef<MethodPlanMatrixHandle, MethodPlanMatrixProps>(
  function MethodPlanMatrix(
    {
      rows: controlledRows,
      onRowsChange,
      onBulkImportRows,
      showBulkImportButton = true,
      footerLeftContent,
      hideNoteLabels = false,
      renderTableContent = true,
      bulkImportMode = 'methodPlan',
      onKoicPushConfirm,
    },
    ref
  ) {
    const [uncontrolledRows, setUncontrolledRows] = useState<MethodPlanRow[]>(DEFAULT_ROWS);
    const [isSaved, setIsSaved] = useState(false);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isTableCollapsed, setIsTableCollapsed] = useState(false);
    const [isKoicPushModalOpen, setIsKoicPushModalOpen] = useState(false);
    const [koicAnomalyStyle, setKoicAnomalyStyle] = useState<KoicAnomalyStyle>('B');
    const [selectedKoicWarningIds, setSelectedKoicWarningIds] = useState<string[]>([]);
    const [expandedKoicGroupIds, setExpandedKoicGroupIds] = useState<number[]>([]);
    const [bulkImportValue, setBulkImportValue] = useState('');
    const [bulkImportUploadError, setBulkImportUploadError] = useState('');
    const [bulkImportUploadStatus, setBulkImportUploadStatus] = useState('');
    const [methodPlanPage, setMethodPlanPage] = useState(1);
    const [methodPlanSearchTerm, setMethodPlanSearchTerm] = useState('');
    const [isHomogeneousLocationPopupOpen, setIsHomogeneousLocationPopupOpen] = useState(false);
    const [pendingMethodPlanAction, setPendingMethodPlanAction] = useState<'bulkImport' | null>(null);
    const [hasTriggeredHomogeneousLocationPopup, setHasTriggeredHomogeneousLocationPopup] = useState(false);
    const [selectedHomogeneousLocationIds, setSelectedHomogeneousLocationIds] = useState<string[]>([]);
    const [homogeneousSampleQuantity, setHomogeneousSampleQuantity] = useState('');
    const [homogeneousPopupValues, setHomogeneousPopupValues] =
      useState<Record<MethodPlanPopupField, string>>(DEFAULT_METHOD_PLAN_POPUP_VALUES);
    const [activeBulkImportHeaderIds, setActiveBulkImportHeaderIds] = useState<string[]>(
      (bulkImportMode === 'locations' ? BULK_IMPORT_HEADER_ITEMS : METHOD_PLAN_IMPORT_HEADER_ITEMS).map((item) => item.id)
    );
    const [lockedBulkImportHeaderIds, setLockedBulkImportHeaderIds] = useState<string[]>([]);
    const [recentlyAddedRowIds, setRecentlyAddedRowIds] = useState<string[]>([]);
    const [invalidBulkImportHeaderIds, setInvalidBulkImportHeaderIds] = useState<string[]>([]);
    const bulkImportFocusInputRef = useRef<HTMLInputElement>(null);
    const bulkImportSheetContainerRef = useRef<HTMLDivElement>(null);
    const bulkImportExcelInputRef = useRef<HTMLInputElement>(null);
    const bulkImportValidationTimeoutRef = useRef<number | null>(null);
    const rows = controlledRows ?? uncontrolledRows;
    const isControlled = controlledRows !== undefined;

    const markUnsaved = () => setIsSaved(false);

    const commitRows = (updater: (currentRows: MethodPlanRow[]) => MethodPlanRow[]) => {
      const nextRows = updater(rows).map(normalizeThirdPartyEvidence);

      if (!isControlled) {
        setUncontrolledRows(nextRows);
      }

      onRowsChange?.(nextRows);
    };

    const updateRow = (id: string, field: keyof MethodPlanRow, value: string) => {
      markUnsaved();
      commitRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    };

    const isBulkImportHeaderLocked = (headerId: string) =>
      bulkImportMode === 'locations' && lockedBulkImportHeaderIds.includes(headerId);
    const isLocationBulkImportHeaderRequired = (headerId: string) =>
      LOCATION_BULK_IMPORT_REQUIRED_HEADER_IDS.some((id) => id === headerId);

    const showBulkImportValidation = (headerIds: string[]) => {
      setInvalidBulkImportHeaderIds(headerIds);

      if (bulkImportValidationTimeoutRef.current !== null) {
        window.clearTimeout(bulkImportValidationTimeoutRef.current);
      }

      bulkImportValidationTimeoutRef.current = window.setTimeout(() => {
        setInvalidBulkImportHeaderIds([]);
        bulkImportValidationTimeoutRef.current = null;
      }, 10_000);
    };

    const homogeneousLocationRows = rows
      .map((row, index) => ({
        id: row.id,
        label:
          row.address ||
          [row.province, row.city, row.district].filter(Boolean).join(' ') ||
          row.companyOwner ||
          row.companyName ||
          `地点 ${index + 1}`,
      }))
      .filter((row) => row.label.trim());

    const openHomogeneousLocationPopup = (
      nextAction: 'bulkImport' | null,
      initialLocationId?: string
    ) => {
      setPendingMethodPlanAction(nextAction);
      setHasTriggeredHomogeneousLocationPopup(true);
      setSelectedHomogeneousLocationIds(initialLocationId ? [initialLocationId] : []);
      setHomogeneousSampleQuantity(
        initialLocationId ? rows.find((row) => row.id === initialLocationId)?.sampleQuantity ?? '' : ''
      );
      setHomogeneousPopupValues(DEFAULT_METHOD_PLAN_POPUP_VALUES);
      setIsHomogeneousLocationPopupOpen(true);
    };

    const openBulkImportModal = () => {
      const nextHeaderItems = bulkImportMode === 'locations' ? BULK_IMPORT_HEADER_ITEMS : METHOD_PLAN_IMPORT_HEADER_ITEMS;
      const existingRows = rows
        .map(bulkImportMode === 'locations' ? getBulkImportRowFromMethodPlanRow : getBulkImportRowFromMethodPlanFullRow)
        .filter(hasBulkImportRowContent);

      setBulkImportValue(serializeBulkImportSheetRows(existingRows));
      setActiveBulkImportHeaderIds(nextHeaderItems.map((item) => item.id));
      setIsBulkImportOpen(true);
    };

    const handleBulkImportRequest = () => {
      if (bulkImportMode === 'locations') {
        openHomogeneousLocationPopup('bulkImport');
        return;
      }

      openBulkImportModal();
    };

    const handleMethodPlanTableInteraction = (event: React.MouseEvent<HTMLDivElement>) => {
      if (hasTriggeredHomogeneousLocationPopup || isHomogeneousLocationPopupOpen || isBulkImportOpen) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      openHomogeneousLocationPopup(null);
    };

    const closeHomogeneousLocationPopup = () => {
      setIsHomogeneousLocationPopupOpen(false);
      setPendingMethodPlanAction(null);
    };

    const updateHomogeneousPopupValue = (field: MethodPlanPopupField, value: string) => {
      setHomogeneousPopupValues((current) => {
        const next = { ...current, [field]: value };
        if (!allowsThirdPartyEvidence(next.auditApproach)) next.confirmThirdPartyInventory = '否';
        return next;
      });
    };

    const toggleHomogeneousLocationSelection = (id: string) => {
      setSelectedHomogeneousLocationIds((current) => {
        return current.includes(id) ? current.filter((currentId) => currentId !== id) : [...current, id];
      });
    };

    const toggleAllHomogeneousLocations = () => {
      setSelectedHomogeneousLocationIds((current) =>
        current.length === homogeneousLocationRows.length ? [] : homogeneousLocationRows.map((row) => row.id)
      );
    };

    const applyHomogeneousLocationSetup = () => {
      if (selectedHomogeneousLocationIds.length === 0) {
        return;
      }

      markUnsaved();
      commitRows((currentRows) =>
        currentRows.map((row) => {
          if (!selectedHomogeneousLocationIds.includes(row.id)) {
            return row;
          }

          const nextRow = { ...row };
          nextRow.sampleQuantity = homogeneousSampleQuantity;
          METHOD_PLAN_POPUP_FIELD_CONFIGS.forEach((config) => {
            nextRow[config.field] = homogeneousPopupValues[config.field];
          });
          return nextRow;
        })
      );
      setIsHomogeneousLocationPopupOpen(false);

      if (pendingMethodPlanAction === 'bulkImport') {
        setPendingMethodPlanAction(null);
        openBulkImportModal();
      } else {
        setPendingMethodPlanAction(null);
      }
    };

    const closeBulkImportModal = () => {
      setIsBulkImportOpen(false);
      setBulkImportValue('');
      setBulkImportUploadError('');
      setBulkImportUploadStatus('');
      setInvalidBulkImportHeaderIds([]);
    };

    const confirmBulkImport = () => {
      const parsedRows = getBulkImportRecords(bulkImportValue, activeBulkImportHeaders);

      if (parsedRows.length === 0) {
        closeBulkImportModal();
        return;
      }

      if (bulkImportMode === 'locations') {
        const missingHeaderIds = LOCATION_BULK_IMPORT_REQUIRED_HEADER_IDS.filter((headerId) =>
          parsedRows.some((record) => !record[headerId]?.trim())
        );

        if (missingHeaderIds.length > 0) {
          showBulkImportValidation(missingHeaderIds);
          return;
        }
      }

      if (bulkImportMode === 'methodPlan') {
        const newRows = parsedRows.map((record) =>
          createMethodPlanRow({
            companyName: record.companyName ?? '',
            companyOwner: record.companyOwner ?? '',
            province: record.province ?? '',
            city: record.city ?? '',
            district: record.district ?? '',
            address: record.address ?? '',
            sampleQuantity: record.sampleQuantity ?? '',
            confirmThirdPartyInventory: record.confirmThirdPartyInventory ?? '否',
            countMethod: record.countMethod ?? SELECT_PLACEHOLDER,
            auditApproach: record.auditApproach ?? SELECT_PLACEHOLDER,
            monitorMode: record.monitorMode ?? SELECT_PLACEHOLDER,
            useExperts: record.useExperts ?? '否',
            useInternalAudit: record.useInternalAudit ?? '否',
          })
        );

        commitRows(() => newRows);
        setIsSaved(false);
        setMethodPlanPage(1);
        closeBulkImportModal();
        return;
      }

      const newRows = parsedRows.map((record) => {
        const derivedSystemType = getSystemTypeFromEndingBalanceConfirmation(
          record.endingBalanceConfirmation ?? ''
        );
        const derivedCountMethod = getCountMethodFromInventoryCountPlan(
          record.inventoryCountPlan ?? ''
        );

        return createMethodPlanRow({
          companyName: record.companyName ?? '',
          companyOwner: record.intervieweeName ?? record.companyOwner ?? '',
          importedCategory: record.category,
          importedEndingBalanceConfirmation: record.endingBalanceConfirmation,
          importedInventoryCountPlan: record.inventoryCountPlan,
          countMethod: derivedCountMethod || record.countMethod || '在期末完成盘点',
          importedSystemType: derivedSystemType || record.systemType || '',
          importedThirdPartyStorage: record.thirdPartyStorage ?? '',
          importedUseExpert: record.useExpert ?? '',
          importedPriorBalance: record.priorBalance,
          importedFinalBalance: record.finalBalance,
          importedPriorInterimPlannedBalance: record.priorInterimPlannedBalance,
          importedInterimPlannedBalance: record.interimPlannedBalance,
          selectedAsSample: record.selectedAsSample ?? '否',
        });
      });

      const newIds = newRows.map((row) => row.id);

      commitRows((current) => {
        const nextRows = [...current];

        newRows.forEach((newRow, index) => {
          nextRows[index] = {
            ...(nextRows[index] ?? createMethodPlanRow()),
            ...newRow,
            id: nextRows[index]?.id ?? newRow.id,
          };
        });

        return nextRows;
      });
      setIsSaved(false);
      setMethodPlanPage(1);
      setRecentlyAddedRowIds(newIds);
      setLockedBulkImportHeaderIds([...LOCKED_LOCATION_BULK_IMPORT_HEADER_IDS]);
      onBulkImportRows?.(newRows);
      closeBulkImportModal();

      window.setTimeout(() => {
        setRecentlyAddedRowIds([]);
      }, 700);
    };

    useImperativeHandle(ref, () => ({
      openBulkImportModal,
      openKoicPushModal: () => setIsKoicPushModalOpen(true),
      openLocationSettings: (rowId: string) => openHomogeneousLocationPopup(null, rowId),
    }));

    useEffect(() => {
      if (isBulkImportOpen) {
        setActiveBulkImportHeaderIds(
          (bulkImportMode === 'locations' ? BULK_IMPORT_HEADER_ITEMS : METHOD_PLAN_IMPORT_HEADER_ITEMS).map(
            (item) => item.id
          )
        );
      }
    }, [bulkImportMode, isBulkImportOpen]);

    useEffect(
      () => () => {
        if (bulkImportValidationTimeoutRef.current !== null) {
          window.clearTimeout(bulkImportValidationTimeoutRef.current);
        }
      },
      []
    );

    useEffect(() => {
      if (!isBulkImportOpen) {
        return;
      }

      const timeoutId = window.setTimeout(() => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            bulkImportFocusInputRef.current?.scrollIntoView({
              block: 'center',
              inline: 'nearest',
            });
            bulkImportFocusInputRef.current?.focus();
          });
        });
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }, [activeBulkImportHeaderIds.length, bulkImportValue, isBulkImportOpen]);

    const noteLabel = (noteNumber: number) => (hideNoteLabels ? '' : ` (Note ${noteNumber})`);
    const normalizedMethodPlanSearchTerm = methodPlanSearchTerm.trim().toLowerCase();
    const filteredMethodPlanRows = normalizedMethodPlanSearchTerm
      ? rows.filter((row) =>
          [row.companyName, row.companyOwner, row.province, row.city, row.district, row.address].some((value) =>
            value.toLowerCase().includes(normalizedMethodPlanSearchTerm)
          )
        )
      : rows;
    const shouldShowMethodPlanPagination = filteredMethodPlanRows.length > METHOD_PLAN_PAGE_SIZE;
    const methodPlanTotalPages = Math.max(1, Math.ceil(filteredMethodPlanRows.length / METHOD_PLAN_PAGE_SIZE));
    const methodPlanPageStartIndex = (methodPlanPage - 1) * METHOD_PLAN_PAGE_SIZE;
    const paginatedMethodPlanRows = shouldShowMethodPlanPagination
      ? filteredMethodPlanRows.slice(methodPlanPageStartIndex, methodPlanPageStartIndex + METHOD_PLAN_PAGE_SIZE)
      : filteredMethodPlanRows;
    const bulkImportHeaderItems =
      bulkImportMode === 'locations' ? BULK_IMPORT_HEADER_ITEMS : METHOD_PLAN_IMPORT_HEADER_ITEMS;
    const activeBulkImportHeaders = bulkImportHeaderItems.filter((item) =>
      activeBulkImportHeaderIds.includes(item.id)
    );
    const removedBulkImportHeaders = bulkImportHeaderItems.filter(
      (item) => !activeBulkImportHeaderIds.includes(item.id)
    );
    const taskEligibleRows = rows.filter((row) => !isInventorySampleExcluded(row.selectedAsSample));
    const sampleExcludedLocationCount = rows.length - taskEligibleRows.length;
    const koicPushAnomalies = taskEligibleRows.flatMap(getMethodPlanAnomalies);
    const selectableKoicAnomalies = koicPushAnomalies.filter((anomaly) => !anomaly.blocking);
    const selectedKoicWarningCount = selectableKoicAnomalies.filter((anomaly) => selectedKoicWarningIds.includes(anomaly.id)).length;
    const allKoicWarningsSelected = selectableKoicAnomalies.length > 0 && selectedKoicWarningCount === selectableKoicAnomalies.length;
    const publishableKoicRows = getPublishableInventoryRows(rows, selectedKoicWarningIds);
    const anomalyStyleClasses = KOIC_ANOMALY_STYLE_CLASSES[koicAnomalyStyle];
    useEffect(() => {
      setSelectedKoicWarningIds([]);
    }, [rows, isKoicPushModalOpen]);
    const koicPushGroups = METHOD_PLAN_KOIC_GROUPS.map((group) => ({
      ...group,
      rows: taskEligibleRows.filter(
        (row) =>
          getInventoryProcedureDisplayGroupIds(getInventoryProcedureDecision(row).groupIds).includes(group.id)
      ),
    }));
    const toggleKoicGroupExpanded = (groupId: number) => {
      setExpandedKoicGroupIds((current) =>
        current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId]
      );
    };
    const confirmKoicPush = () => {
      if (publishableKoicRows.length === 0) return;
      setIsKoicPushModalOpen(false);
      onKoicPushConfirm?.(publishableKoicRows);
    };
    const bulkImportGridTemplateColumns = activeBulkImportHeaders
      .map((item) => {
        if (item.id === 'index') {
          return 'minmax(28px, 0.28fr)';
        }

        if (bulkImportMode === 'methodPlan') {
          return 'minmax(130px, 1fr)';
        }

        if (item.id === 'endingBalanceConfirmation') {
          return 'minmax(260px, 1.7fr)';
        }

        if (item.id === 'systemType') {
          return 'minmax(180px, 1.15fr)';
        }

        if (item.id === 'inventoryCountPlan') {
          return 'minmax(300px, 2fr)';
        }

        return 'minmax(44px, 0.62fr)';
      })
      .join(' ');
    const bulkImportSheetRows = getBulkImportSheetRows(bulkImportValue, activeBulkImportHeaders);
    const visibleBulkImportSheetRows = [
      ...bulkImportSheetRows,
      ...Array.from(
        { length: Math.max(BULK_IMPORT_VISIBLE_ROW_COUNT - bulkImportSheetRows.length, 1) },
        () => activeBulkImportHeaders.map(() => '')
      ),
    ];
    const bulkImportFocusRowIndex = Math.max(bulkImportSheetRows.length - 1, 0);

    useEffect(() => {
      const nextTotalPages = Math.max(1, Math.ceil(filteredMethodPlanRows.length / METHOD_PLAN_PAGE_SIZE));
      setMethodPlanPage((currentPage) => Math.min(currentPage, nextTotalPages));
    }, [filteredMethodPlanRows.length]);

    const downloadBulkImportWorkbook = () => {
      const headerLabels = activeBulkImportHeaders.map((header) => header.label);
      const dataRows = getBulkImportSheetRows(bulkImportValue, activeBulkImportHeaders);
      const worksheet = XLSX.utils.aoa_to_sheet([headerLabels, ...dataRows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, bulkImportMode === 'methodPlan' ? '表格二监盘计划.xlsx' : '盘点表.xlsx');
    };

    const handleBulkImportExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const file = input.files?.[0];

      if (!file) {
        return;
      }

      setBulkImportUploadError('');
      setBulkImportUploadStatus('正在读取 Excel，请稍候');
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });

      try {
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
          setBulkImportValue('');
          setBulkImportUploadStatus('');
          setBulkImportUploadError('未读取到工作表内容');
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const mappedRows = synchronizeLocationDerivedFields(
          normalizeBulkImportCellRows(
            getBulkImportCellRowsFromWorksheet(worksheet),
            activeBulkImportHeaders
          ),
          activeBulkImportHeaders
        );
        const nextValue = serializeBulkImportSheetRows(mappedRows);

        setBulkImportValue(nextValue);
        setBulkImportUploadStatus(nextValue ? `已读取 ${mappedRows.length} 行` : '');
        setBulkImportUploadError(nextValue ? '' : '未读取到可导入内容');
      } catch {
        setBulkImportUploadStatus('');
        setBulkImportUploadError('上传失败，请确认文件为 Excel 格式');
      } finally {
        input.value = '';
      }
    };

    const updateBulkImportCell = (rowIndex: number, columnIndex: number, value: string) => {
      if (activeBulkImportHeaders[columnIndex]?.id === 'index') {
        return;
      }

      const nextRows =
        bulkImportSheetRows.length > rowIndex
          ? bulkImportSheetRows.map((row) => [...row])
          : [
              ...bulkImportSheetRows.map((row) => [...row]),
              ...Array.from({ length: rowIndex - bulkImportSheetRows.length + 1 }, () =>
                activeBulkImportHeaders.map(() => '')
              ),
            ];

      nextRows[rowIndex][columnIndex] = value;
      setBulkImportValue(
        serializeBulkImportSheetRows(
          synchronizeLocationDerivedFields(nextRows, activeBulkImportHeaders)
        )
      );
    };

    const handleBulkImportPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
      const pastedText = event.clipboardData.getData('text/plain');

      if (!pastedText.includes('\t') && !pastedText.includes('\n')) {
        return;
      }

      event.preventDefault();
      setBulkImportValue(
        serializeBulkImportSheetRows(getBulkImportSheetRows(pastedText, activeBulkImportHeaders))
      );
    };

    const removeBulkImportHeader = (id: string) => {
      const item = bulkImportHeaderItems.find((header) => header.id === id);

      if (item?.fixed) {
        return;
      }

      setActiveBulkImportHeaderIds((current) => current.filter((headerId) => headerId !== id));
    };

    const restoreBulkImportHeader = (id: string) => {
      setActiveBulkImportHeaderIds((current) => {
        if (current.includes(id)) {
          return current;
        }

        const restored = [...current, id];
        return bulkImportHeaderItems
          .map((item) => item.id)
          .filter((headerId) => restored.includes(headerId));
      });
    };

    const renderTable = () => (
      <>
      <div className="mb-2 mt-2 flex flex-wrap items-center justify-between gap-3 px-1">
        <label className="relative block w-[260px]">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={methodPlanSearchTerm}
            onChange={(event) => {
              setMethodPlanSearchTerm(event.target.value);
              setMethodPlanPage(1);
            }}
            placeholder="搜索所属公司名称、受访单位名称、地点"
            className="h-7 w-full rounded border border-slate-200 bg-white py-1 pl-7 pr-2 text-[11px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#143f97] focus:ring-1 focus:ring-[#143f97]/20"
          />
        </label>
        <span />
      </div>
      <div
        className="overflow-visible rounded-lg"
        onMouseDownCapture={handleMethodPlanTableInteraction}
      >
        <table className="w-full min-w-[1180px] table-fixed rounded-lg border-separate border-spacing-0 text-[13px] [&_thead_th:first-child]:rounded-tl-lg [&_thead_th:last-child]:rounded-tr-lg [&_tbody_tr:last-child_td:first-child]:rounded-bl-lg [&_tbody_tr:last-child_td:last-child]:rounded-br-lg">
          <colgroup>
            <col className="w-[32px]" />
            <col className="w-[105px]" />
            <col className="w-[155px]" />
            <col className="w-[67px]" />
            <col className="w-[73px]" />
            <col className="w-[128px]" />
            <col className="w-[100px]" />
            <col className="w-[120px]" />
            {/* selectedAsSample is kept in data/import flow but hidden from the plan table. */}
            {/* <col className="w-[70px]" /> */}
            <col className="w-[120px]" />
            {/* plannedDate and submissionDate are kept in row data but hidden from the plan table. */}
            {/* <col className="w-[90px]" />
            <col className="w-[90px]" /> */}
            <col className="w-[155px]" />
            <col className="w-[120px]" />
            <col className="w-[48px]" />
          </colgroup>
          <thead style={{ fontFamily: '"Microsoft YaHei", "Microsoft YaHei UI", sans-serif', fontSize: '11px' }}>
            <tr>
              <th className={`${headerBlue} ${stickyLeftCellClassNames[0]}`}>
                <span className="inline-block text-left">#</span>
              </th>
              <th className={`${headerOrange} ${stickyLeftCellClassNames[1]}`}>
                <span className="inline-block text-left">所属公司名称</span>
              </th>
              <th className={`${headerOrange} ${stickyLeftCellClassNames[2]}`}>
                <span className="inline-block text-left">受访单位名称</span>
              </th>
              <th className={`${headerOrange} px-0.5 tracking-[-0.5px]`}>
                <span className="inline-block text-left">
                  <span className="whitespace-nowrap">本期期末余额</span>
                  <br />
                  <span className="whitespace-nowrap">（百万元）</span>
                </span>
              </th>
              <th className={`${headerOrange} px-0.5 tracking-[-0.5px]`}>
                <span className="inline-block text-left">
                  <span className="whitespace-nowrap">本期预审余额</span>
                  <br />
                  <span className="whitespace-nowrap">（百万元）</span>
                </span>
              </th>
              <th className={`${whiteHeaderCell} whitespace-nowrap`}>
                <span className="inline-block text-left">样本数量</span>
              </th>
              <th className={whiteHeaderCell}>
                <span className="inline-block text-left">
                  向第三方函证
                  <br />
                  存货的数量和状况
                </span>
              </th>
              <th className={whiteHeaderCell}>
                <span className="inline-block text-left">
                  <span className="whitespace-nowrap">毕马威就监盘而计划的</span>
                  <br />
                  <span className="inline-flex items-center whitespace-nowrap">
                    审计方案
                    <MethodPlanKButton
                      className="ml-1 align-middle"
                      label={METHOD_PLAN_AUDIT_APPROACH_KAEG_REFERENCE}
                    />
                    <MethodPlanInfoButton label={METHOD_PLAN_NON_SIGNIFICANT_RISK_INFO} />
                    <span>{noteLabel(6)}</span>
                  </span>
                </span>
              </th>
              {/* <th className={headerGreen}>是否被毕马威选为监盘样本</th> */}
              {/* <th className={headerGreen}>样本数量</th> */}
              <th className={whiteHeaderCell}>
                <span className="inline-block text-left">
                  <span className="inline-flex items-center whitespace-nowrap">
                    现场监盘 vs 远程监盘
                    <MethodPlanInfoButton label={METHOD_PLAN_MONITOR_MODE_INFO} />
                    {noteLabel(2)}
                  </span>
                </span>
              </th>
              {/* <th className={headerOrange}>计划的监盘日期</th>
              <th className={headerOrange}>提交底稿日期</th> */}
              <th className={whiteHeaderCell}>
                <span className="inline-block text-left">
                  计划引入专家和/或特定项目组成员，包括信息技术审计人员？
                  <MethodPlanInfoButton label={METHOD_PLAN_EXPERTS_INFO} />
                  {noteLabel(3)}
                </span>
              </th>
              <th className={whiteHeaderCell}>
                <span className="inline-block text-left">
                  计划利用内部审计工作获取审计证据？
                  <MethodPlanInfoButton label={METHOD_PLAN_INTERNAL_AUDIT_INFO} />
                  {noteLabel(4)}
                </span>
              </th>
              <th className={`${whiteHeaderCell} ${stickyRightCellClassName}`}>
                <span className="inline-block text-left">操作</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedMethodPlanRows.map((row, pageIndex) => {
              const index = shouldShowMethodPlanPagination ? methodPlanPageStartIndex + pageIndex : pageIndex;

              return (
              <tr
                key={row.id}
                className={`group border-b border-slate-200 transition-colors hover:bg-slate-50 ${
                  recentlyAddedRowIds.includes(row.id) ? 'prewp-matrix-row-enter' : ''
                }`}
              >
                <td
                  className={`border border-slate-300 bg-slate-50/30 px-2 py-1 text-center font-mono text-[11px] text-slate-400 align-middle group-hover:bg-slate-100 ${stickyLeftCellClassNames[0]}`}
                >
                  {index + 1}
                </td>

                <td className={`${grayCell} group-hover:bg-slate-100 ${stickyLeftCellClassNames[1]}`}>
                  <input
                    className={`${inputClassName} cursor-not-allowed text-slate-500`}
                    value={row.companyName}
                    readOnly
                  />
                </td>

                <td className={`${grayCell} group-hover:bg-slate-100 ${stickyLeftCellClassNames[2]}`}>
                  <input
                    className={`${inputClassName} cursor-not-allowed text-slate-500`}
                    value={row.companyOwner}
                    readOnly
                  />
                </td>

                <td className={`${grayCell} group-hover:bg-slate-100`}>
                  <input
                    className={`${inputClassName} cursor-not-allowed text-center text-slate-500`}
                    value={formatMethodPlanWebAmount(row.importedFinalBalance)}
                    readOnly
                  />
                </td>
                <td className={`${grayCell} group-hover:bg-slate-100`}>
                  <input
                    className={`${inputClassName} cursor-not-allowed text-center text-slate-500`}
                    value={formatMethodPlanWebAmount(row.importedInterimPlannedBalance)}
                    readOnly
                  />
                </td>
                {/* <SelectCell
                  className={whiteCell}
                  value={row.selectedAsSample}
                  options={SAMPLE_SELECTION_OPTIONS}
                  onChange={(value) => updateRow(row.id, 'selectedAsSample', value)}
                /> */}

                <td className={yellowCell}>
                  <input
                    className={`${inputClassName} text-center`}
                    value={row.sampleQuantity}
                    onChange={(event) => updateRow(row.id, 'sampleQuantity', event.target.value)}
                  />
                </td>

                <SelectCell
                  className={whiteCell}
                  value={allowsThirdPartyEvidence(row.auditApproach) ? row.confirmThirdPartyInventory : '否'}
                  disabled={!allowsThirdPartyEvidence(row.auditApproach)}
                  options={YES_NO_OPTIONS}
                  onChange={(value) => updateRow(row.id, 'confirmThirdPartyInventory', value)}
                />

                <AuditApproachSelectCell
                  className={whiteCell}
                  value={row.auditApproach}
                  onChange={(value) => updateRow(row.id, 'auditApproach', value)}
                />

                <SelectCell
                  className={whiteCell}
                  value={row.monitorMode}
                  options={MONITOR_MODE_OPTIONS}
                  onChange={(value) => updateRow(row.id, 'monitorMode', value)}
                />

                {/* <td className={yellowCell}>
                  <input
                    className={inputClassName}
                    value={row.plannedDate}
                    onChange={(event) => updateRow(row.id, 'plannedDate', event.target.value)}
                    placeholder="[DD/MM/YY]"
                  />
                </td>

                <td className={yellowCell}>
                  <input
                    className={inputClassName}
                    value={row.submissionDate}
                    onChange={(event) => updateRow(row.id, 'submissionDate', event.target.value)}
                    placeholder="[DD/MM/YY]"
                  />
                </td> */}

                <SelectCell
                  className={whiteCell}
                  value={row.useExperts}
                  options={YES_NO_OPTIONS}
                  onChange={(value) => updateRow(row.id, 'useExperts', value)}
                />

                <SelectCell
                  className={whiteCell}
                  value={row.useInternalAudit}
                  options={YES_NO_OPTIONS}
                  onChange={(value) => updateRow(row.id, 'useInternalAudit', value)}
                />

                <td className={`border border-slate-300 bg-white px-2 py-1 text-center align-middle group-hover:bg-slate-50 ${stickyRightCellClassName}`}>
                  <button
                    type="button"
                    onClick={() => openHomogeneousLocationPopup(null, row.id)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition hover:bg-blue-50 hover:text-[#00338D] focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-label="打开同质性地点设置"
                    title="打开同质性地点设置"
                  >
                    <Pencil size={13} />
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {shouldShowMethodPlanPagination && (
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-3 py-2 text-xs text-slate-600">
          <span>
            {Math.min(methodPlanPageStartIndex + METHOD_PLAN_PAGE_SIZE, filteredMethodPlanRows.length)} / {filteredMethodPlanRows.length}
          </span>
          <button
            type="button"
            onClick={() => setMethodPlanPage((currentPage) => Math.max(1, currentPage - 1))}
            disabled={methodPlanPage === 1}
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white transition hover:border-blue-300 hover:text-[#143f97] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="上一页"
          >
            <ChevronLeft size={14} />
          </button>
          <span>
            {methodPlanPage} / {methodPlanTotalPages}
          </span>
          <button
            type="button"
            onClick={() =>
              setMethodPlanPage((currentPage) => Math.min(methodPlanTotalPages, currentPage + 1))
            }
            disabled={methodPlanPage === methodPlanTotalPages}
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white transition hover:border-blue-300 hover:text-[#143f97] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="下一页"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
      </>
    );

    return (
      <>
        {renderTableContent && (
        <div className="mt-4 overflow-visible rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-xs font-medium text-slate-400">确定项目组的存货监盘方法</span>
            <button
              type="button"
              onClick={() => setIsTableCollapsed((current) => !current)}
              className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-3 py-1 text-[11px] font-medium text-gray-500 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
              aria-expanded={!isTableCollapsed}
            >
              {isTableCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              {isTableCollapsed ? '编辑' : '收起'}
            </button>
          </div>
          {!isTableCollapsed && (
          <>
          <div className="group/table-fullscreen relative">
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="absolute right-0 top-[-28px] z-20 rounded border border-gray-200 bg-gray-100 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-gray-500 opacity-0 shadow-sm transition hover:border-gray-300 hover:bg-gray-200 hover:text-gray-700 group-hover/table-fullscreen:opacity-100"
              title="全屏查看"
              aria-label="全屏查看"
            >
              full page
            </button>
            {renderTable()}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 p-4">
            {footerLeftContent ?? (showBulkImportButton ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBulkImportRequest}
                  className="flex items-center gap-2 rounded-lg border border-[#00338D] bg-[#00338D] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#002b75] hover:shadow-md active:scale-95"
                >
                  批量导入 | 下载
                </button>
              </div>
            ) : (
              <span />
            ))}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSaved(true)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
                  isSaved
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-blue-600 bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                }`}
              >
                {isSaved ? '已保存' : '保存'}
              </button>
              <button
                type="button"
                onClick={() => setIsKoicPushModalOpen(true)}
                className="rounded-lg border border-[#00338D] bg-white px-4 py-2 text-sm font-medium text-[#00338D] shadow-sm transition-all hover:bg-blue-50 active:scale-95"
              >
                创建任务
              </button>
            </div>
          </div>
          </>
          )}
        </div>
        )}

        {renderTableContent && isFullscreen && (
          <div className="fixed inset-0 z-[70] bg-slate-950/55 backdrop-blur-sm">
            <div className="flex h-full w-full flex-col bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">了解被审计单位的存货</h3>
                  <p className="text-xs text-slate-500">全屏查看与编辑</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-500 hover:text-blue-600"
                  title="退出全屏"
                  aria-label="退出全屏"
                >
                  <Minimize2 size={16} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-auto px-4 py-4">{renderTable()}</div>
            </div>
          </div>
        )}

        {isHomogeneousLocationPopupOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-[94vw] max-w-[980px] overflow-y-auto rounded-2xl border border-white/70 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.25)]">
              <div className="flex items-start justify-between gap-4">
                {/* <div>
                  <h3 className="text-lg font-semibold text-slate-900">确认同质性地点监盘计划</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    选择同质性地点，并统一填写表二中对应的监盘计划信息。
                  </p>
                </div> */}
                {/* <button
                  type="button"
                  onClick={closeHomogeneousLocationPopup}
                  className="rounded-full px-3 py-1 text-sm font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  关闭
                </button> */}
                <button
                  type="button"
                  onClick={closeHomogeneousLocationPopup}
                  className="rounded-full p-2 text-gray-400 transition hover:bg-white/80 hover:text-gray-700"
                  aria-label="关闭确认监盘计划"
                >
                  <ChevronLeft className="rotate-180" size={18} />
                </button>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <div>
                  <div className="text-sm font-semibold text-slate-800">确认监盘计划</div>
                  <div className="mt-3 grid gap-3">
                    <label className="block">
                      <span className="text-xs font-medium leading-5 text-slate-600">样本数量</span>
                      <input
                        type="text"
                        value={homogeneousSampleQuantity}
                        onChange={(event) => setHomogeneousSampleQuantity(event.target.value)}
                        className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </label>
                    {METHOD_PLAN_POPUP_FIELD_CONFIGS.map((config) => (
                      <div key={config.field} className="block">
                        {renderMethodPlanPopupFieldLabel(config)}
                        {config.field === 'auditApproach' ? (
                          <AuditApproachPopupSelect
                            value={homogeneousPopupValues.auditApproach}
                            onChange={(value) => updateHomogeneousPopupValue('auditApproach', value)}
                          />
                        ) : (
                          <select
                            className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            disabled={config.field === 'confirmThirdPartyInventory' && !allowsThirdPartyEvidence(homogeneousPopupValues.auditApproach)}
                            value={homogeneousPopupValues[config.field]}
                            onChange={(event) => updateHomogeneousPopupValue(config.field, event.target.value)}
                          >
                            {config.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-800">采用相同监盘方法</div>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
                      <input
                        type="checkbox"
                        checked={selectedHomogeneousLocationIds.length > 0 && selectedHomogeneousLocationIds.length === homogeneousLocationRows.length}
                        onChange={toggleAllHomogeneousLocations}
                        className="h-3.5 w-3.5"
                      />
                      全选
                    </label>
                  </div>
                  <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    {homogeneousLocationRows.length > 0 ? (
                      homogeneousLocationRows.map((row) => (
                        <label
                          key={row.id}
                          className="flex cursor-pointer items-start gap-2 rounded-lg bg-white px-3 py-2 text-xs text-slate-700 shadow-sm transition hover:bg-blue-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedHomogeneousLocationIds.includes(row.id)}
                            onChange={() => toggleHomogeneousLocationSelection(row.id)}
                            className="mt-0.5"
                          />
                          <span>{row.label}</span>
                        </label>
                      ))
                    ) : (
                      <div className="rounded-lg bg-white px-3 py-4 text-xs text-slate-400">
                        暂无已上传地点
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeHomogeneousLocationPopup}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={applyHomogeneousLocationSetup}
                  disabled={selectedHomogeneousLocationIds.length === 0}
                  className="rounded-lg border border-[#00338D] bg-[#00338D] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#002b75] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-400"
                >
                  确认并填写
                </button>
              </div>
            </div>
          </div>
        )}

        {isBulkImportOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-sm">
            <div className="w-[96vw] max-w-[1680px] rounded-[28px] border border-white/60 bg-white/85 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.25)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">批量导入地点</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    每行输入一个详细地址，系统会按当前表格结构自动创建新行。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeBulkImportModal}
                  className="rounded-full p-2 text-gray-400 transition hover:bg-white/80 hover:text-gray-700"
                  aria-label="关闭批量导入"
                >
                  <ChevronLeft className="rotate-180" size={18} />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-blue-200 bg-white/80">
                  <div className="w-full min-w-[1120px]">
                    <div className="grid" style={{ gridTemplateColumns: bulkImportGridTemplateColumns }}>
                      {activeBulkImportHeaders.map((item) => (
                        <div
                          key={item.id}
                          className="px-2 py-2"
                        >
                          <div
                            className={`flex min-h-[34px] items-start justify-between gap-1 text-[11px] font-medium leading-snug ${
                              invalidBulkImportHeaderIds.includes(item.id)
                                ? 'animate-pulse text-red-500'
                                : 'text-slate-700'
                            }`}
                          >
                            <span className="break-words">
                              {item.label}
                              {bulkImportMode === 'locations' && isLocationBulkImportHeaderRequired(item.id) ? (
                                <span className="ml-0.5 text-red-500">*</span>
                              ) : null}
                            </span>
                            {!item.fixed &&
                              !(bulkImportMode === 'locations' && isLocationBulkImportHeaderRequired(item.id)) && (
                              <button
                                type="button"
                                onClick={() => removeBulkImportHeader(item.id)}
                                className="-mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-red-200 bg-red-50 text-xs leading-none text-red-400 transition hover:border-red-300 hover:bg-red-100 hover:text-red-500"
                                aria-label={`移除${item.label}`}
                              >
                                -
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div ref={bulkImportSheetContainerRef} className="max-h-[340px] overflow-y-auto border-t border-gray-200 p-2">
                      <div className="rounded-xl border border-blue-200 bg-white/75">
                        {visibleBulkImportSheetRows.map((row, rowIndex) => (
                          <div
                            key={`bulk-import-row-${rowIndex}`}
                            className="grid border-b border-gray-100 last:border-b-0"
                            style={{ gridTemplateColumns: bulkImportGridTemplateColumns }}
                          >
                            {activeBulkImportHeaders.map((header, columnIndex) => {
                              const commonClassName =
                                'h-8 min-w-0 border-r border-gray-200 bg-transparent px-1.5 text-[11px] text-gray-700 outline-none transition last:border-r-0 focus:bg-blue-50/70 focus:ring-1 focus:ring-blue-300';

                              if (header.id === 'endingBalanceConfirmation') {
                                return (
                                  <select
                                    key={`${header.id}-${rowIndex}`}
                                    value={row[columnIndex] ?? ''}
                                    onChange={(event) =>
                                      updateBulkImportCell(rowIndex, columnIndex, event.target.value)
                                    }
                                    aria-label={`${header.label} 第 ${rowIndex + 1} 行`}
                                    className={`${commonClassName} appearance-none`}
                                  >
                                    <option value="">请选择</option>
                                    {ENDING_BALANCE_CONFIRMATION_OPTIONS.map((option) => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                );
                              }

                              if (header.id === 'inventoryCountPlan') {
                                return (
                                  <select
                                    key={`${header.id}-${rowIndex}`}
                                    value={row[columnIndex] ?? ''}
                                    onChange={(event) =>
                                      updateBulkImportCell(rowIndex, columnIndex, event.target.value)
                                    }
                                    aria-label={`${header.label} 第 ${rowIndex + 1} 行`}
                                    className={`${commonClassName} appearance-none`}
                                  >
                                    <option value="">请选择</option>
                                    {INVENTORY_COUNT_PLAN_OPTIONS.map((option) => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                );
                              }

                              return (
                                <input
                                  key={`${header.id}-${rowIndex}`}
                                  ref={
                                    rowIndex === bulkImportFocusRowIndex && header.id === 'companyName'
                                      ? bulkImportFocusInputRef
                                      : undefined
                                  }
                                  value={header.id === 'index' ? String(rowIndex + 1) : row[columnIndex] ?? ''}
                                  readOnly={
                                    header.id === 'index' ||
                                    isBulkImportHeaderLocked(header.id) ||
                                    (bulkImportMode === 'locations' &&
                                      (header.id === 'systemType' || header.id === 'countMethod'))
                                  }
                                  onChange={(event) =>
                                    updateBulkImportCell(rowIndex, columnIndex, event.target.value)
                                  }
                                  onPaste={handleBulkImportPaste}
                                  aria-label={`${header.label} 第 ${rowIndex + 1} 行`}
                                  className={`${commonClassName} read-only:bg-gray-50 read-only:text-center read-only:text-gray-400`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-slate-50/70 p-4">
                  <div className="text-xs font-semibold text-slate-500">已移除表头</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {removedBulkImportHeaders.length > 0 ? (
                      removedBulkImportHeaders.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => restoreBulkImportHeader(item.id)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-[#00338D]"
                        >
                          {item.label}
                        </button>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">暂无移除项</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-400">
                    当前将导入 {getBulkImportRecords(bulkImportValue, activeBulkImportHeaders).length} 行
                  </div>
                  {bulkImportUploadStatus ? (
                    <div className="mt-1 text-xs font-medium text-[#00338D]">{bulkImportUploadStatus}</div>
                  ) : null}
                  {bulkImportUploadError ? (
                    <div className="mt-1 text-xs font-medium text-red-500">{bulkImportUploadError}</div>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    ref={bulkImportExcelInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="sr-only"
                    onChange={handleBulkImportExcelUpload}
                  />
                  <button
                    type="button"
                    onClick={downloadBulkImportWorkbook}
                    className="rounded-xl border border-[#143f97] bg-[#143f97] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:border-[#0f2f73] hover:bg-[#0f2f73]"
                  >
                    {bulkImportMode === 'methodPlan' ? '下载当前数据' : '下载模板'}
                  </button>
                  <button
                    type="button"
                    onClick={() => bulkImportExcelInputRef.current?.click()}
                    className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    导入
                  </button>
                  <button
                    type="button"
                    onClick={closeBulkImportModal}
                    className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={confirmBulkImport}
                    className="rounded-xl bg-[#00338D] px-7 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-[#002b75]"
                  >
                    确认添加
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isKoicPushModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-[94vw] max-w-[980px] overflow-y-auto rounded-2xl border border-white/70 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.25)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">存货监盘方法</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    按毕马威就监盘而计划的审计方案列，将地点归入对应的存货监盘方法。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsKoicPushModalOpen(false)}
                  className="rounded-full px-3 py-1 text-sm font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  关闭
                </button>
              </div>

              {sampleExcludedLocationCount > 0 && (
                <div
                  className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800"
                  role="status"
                >
                  <TriangleAlert size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                  <span>存在未被选为盘点对象的地点，这些地点不会发布为任务。</span>
                </div>
              )}

              <div className="mt-4 space-y-2">
                {koicPushGroups.map((group) => {
                  const isGroupExpanded = expandedKoicGroupIds.includes(group.id);

                  return (
                  <section key={group.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="grid grid-cols-[minmax(0,1fr)_72px_24px] items-start gap-2">
                      <h4 className="min-w-0 text-sm font-semibold leading-5 text-slate-800">{group.label}</h4>
                      <span className="pt-0.5 text-left text-xs font-medium leading-5 text-slate-400">
                        {group.rows.length} 个地点
                      </span>
                      <div className="h-6 w-6">
                        {group.rows.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleKoicGroupExpanded(group.id)}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            aria-expanded={isGroupExpanded}
                            aria-label={`${isGroupExpanded ? '收起' : '展开'}${group.label}`}
                          >
                            <ChevronDown
                              size={14}
                              className={isGroupExpanded ? 'rotate-180 transition-transform' : 'transition-transform'}
                            />
                          </button>
                        )}
                      </div>
                    </div>
                    {isGroupExpanded && (
                      <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-100 text-xs font-medium text-slate-600">
                          <div className="px-3 py-2">所属公司名称</div>
                          <div className="border-l border-slate-200 px-3 py-2">受访单位名称</div>
                        </div>
                        {group.rows.length > 0 ? (
                          group.rows.map((row) => (
                            <div
                              key={`${group.id}-${row.id}`}
                              className="grid grid-cols-2 border-b border-slate-100 text-xs text-slate-700 last:border-b-0"
                            >
                              <div className="px-3 py-2">{row.companyName || '-'}</div>
                              <div className="border-l border-slate-100 px-3 py-2">{row.companyOwner || '-'}{group.id === 4 && getInventoryProcedureDecision(row).independentSections.length > 0 && <div className="text-[11px] text-slate-500">仅适用 4.1、4.4、4.5</div>}</div>
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-4 text-xs text-slate-400">暂无地点</div>
                        )}
                      </div>
                    )}
                  </section>
                  );
                })}
              </div>

              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-[#a64949]">
                    <TriangleAlert size={16} strokeWidth={2.2} className="text-rose-400" aria-hidden="true" />
                    <span>识别到的异常</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">样式预览</span>
                    <div
                      className="inline-flex overflow-hidden rounded-md border border-slate-200 bg-white/50"
                      role="group"
                      aria-label="异常区域样式预览"
                    >
                      {(['A', 'B', 'C'] as const).map((style) => (
                        <button
                          key={style}
                          type="button"
                          aria-pressed={koicAnomalyStyle === style}
                          onClick={() => setKoicAnomalyStyle(style)}
                          className={koicAnomalyStyle === style
                            ? 'h-7 min-w-8 border-r border-slate-200 bg-blue-50 px-2 text-[11px] font-semibold text-[#00338D] last:border-r-0'
                            : 'h-7 min-w-8 border-r border-slate-200 bg-transparent px-2 text-[11px] font-medium text-slate-500 transition hover:bg-white/70 hover:text-slate-800 last:border-r-0'}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {koicPushAnomalies.length > 0 ? (
                  <div className={anomalyStyleClasses.table}>
                    <div className={`grid grid-cols-[64px_minmax(220px,0.9fr)_minmax(0,2.1fr)] font-['Microsoft_YaHei'] text-[11px] font-bold text-slate-700 ${anomalyStyleClasses.header}`}>
                      <label className={`flex items-center gap-1 px-2 py-2 ${anomalyStyleClasses.divider}`}>
                        <input type="checkbox" aria-label="全选可发布的异常"
                          checked={allKoicWarningsSelected}
                          disabled={selectableKoicAnomalies.length === 0}
                          ref={(input) => { if (input) input.indeterminate = selectedKoicWarningCount > 0 && !allKoicWarningsSelected; }}
                          onChange={(event) => setSelectedKoicWarningIds(event.target.checked ? selectableKoicAnomalies.map((anomaly) => anomaly.id) : [])}
                          className="h-3.5 w-3.5 accent-[#00338D] disabled:cursor-not-allowed" />
                        全选
                      </label>
                      <div className={`px-3 py-2 ${anomalyStyleClasses.divider}`}>地点</div>
                      <div className="px-3 py-2">触发的警告异常</div>
                    </div>
                    {koicPushAnomalies.map((anomaly) => (
                      <div
                        key={anomaly.id}
                        className={`grid grid-cols-[64px_minmax(220px,0.9fr)_minmax(0,2.1fr)] text-xs leading-5 text-[#994343] ${anomalyStyleClasses.row} ${
                          !anomaly.blocking && selectedKoicWarningIds.includes(anomaly.id) ? 'bg-rose-100/35' : 'bg-transparent'
                        }`}
                      >
                        <div className={`flex items-start justify-center px-3 py-3 ${anomalyStyleClasses.divider}`}>
                          <input type="checkbox"
                            aria-label={anomaly.blocking ? '永久阻断，不可选择' : '选择异常任务：' + (anomaly.companyOwner || anomaly.companyName) + ' ' + anomaly.code}
                            disabled={anomaly.blocking}
                            checked={!anomaly.blocking && selectedKoicWarningIds.includes(anomaly.id)}
                            onChange={(event) => {
                              if (anomaly.blocking) return;
                              setSelectedKoicWarningIds((current) => event.target.checked ? [...current, anomaly.id] : current.filter((id) => id !== anomaly.id));
                            }}
                            className="h-3.5 w-3.5 accent-[#00338D] disabled:cursor-not-allowed disabled:opacity-40" />
                        </div>
                        <div className={`px-3 py-2.5 ${anomalyStyleClasses.divider}`}>
                          <div className="font-semibold text-slate-700">
                            {[anomaly.companyName, anomaly.companyOwner].filter(Boolean).join(' / ') || '未命名地点'}
                          </div>
                        </div>
                        <div className="whitespace-pre-line px-3 py-2.5">
                          <span className="font-semibold">{anomaly.blocking ? '永久阻断：' : '警告异常：'}</span>
                          <br />
                          {anomaly.warning}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-slate-500">暂无识别到的异常。</div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-600" aria-live="polite">本次发布 {publishableKoicRows.length} 个地点任务。正常任务自动发布；异常任务须勾选，永久阻断任务不可发布。</p>
                <button
                  type="button"
                  onClick={confirmKoicPush}
                  disabled={publishableKoicRows.length === 0}
                  className="rounded-lg border border-[#00338D] bg-[#00338D] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#002b75] disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300"
                  title={publishableKoicRows.length === 0 ? '暂无可发布的任务' : '发布正常任务和已选择的异常任务'}
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes prewpMatrixRowEnter {
            0% {
              opacity: 0;
              transform: translateY(-10px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .prewp-matrix-row-enter {
            animation: prewpMatrixRowEnter 0.4s ease-out;
          }
        `}</style>
      </>
    );
  }
);

export default MethodPlanMatrix;
