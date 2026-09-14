/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Minimize2 } from 'lucide-react';
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
  importedPriorBalance?: string;
  importedFinalBalance?: string;
  importedPriorInterimPlannedBalance?: string;
  importedInterimPlannedBalance?: string;
  countMethod: string;
  selectedAsSample: string;
  inventoryObservationMethod?: string;
  auditApproach: string;
  feasibility: string;
  monitorMode: string;
  plannedDate: string;
  submissionDate: string;
  useExperts: string;
  useInternalAudit: string;
};

type MethodPlanMatrixProps = {
  rows?: MethodPlanRow[];
  onRowsChange?: (rows: MethodPlanRow[]) => void;
  onBulkImportRows?: (rows: MethodPlanRow[]) => void;
  showBulkImportButton?: boolean;
  hideNoteLabels?: boolean;
};

export type MethodPlanMatrixHandle = {
  openBulkImportModal: () => void;
};

const SELECT_PLACEHOLDER = '从下拉菜单选择';

const COUNT_METHOD_OPTIONS = [SELECT_PLACEHOLDER, '循环盘点', '在非期末时点完成盘点', '在期末完成盘点'];
const AUDIT_APPROACH_OPTIONS = [
  SELECT_PLACEHOLDER,
  '双重目的方案',
  '实质性方案',
  '控制测试方案',
  '独立盘点方案',
  '未识别出重大错报风险（仅限ISA项目）',
];
const FEASIBILITY_OPTIONS = [SELECT_PLACEHOLDER, '可实施', '不可实施'];
const MONITOR_MODE_OPTIONS = [SELECT_PLACEHOLDER, '现场监盘', '远程监盘'];
const SAMPLE_SELECTION_OPTIONS = ['是', '否'];
const INVENTORY_OBSERVATION_METHOD_OPTIONS = [SELECT_PLACEHOLDER, '循环盘点', '全面实地盘点', '存货监盘不可行'];
const YES_NO_OPTIONS = ['否', '是'];
const BULK_IMPORT_VISIBLE_ROW_COUNT = 6;
const METHOD_PLAN_PAGE_SIZE_OPTIONS = [15, 30, 50] as const;

const BULK_IMPORT_HEADER_ITEMS = [
  { id: 'index', label: '#', fixed: true },
  { id: 'location-list', label: '地点', fixed: true },
  { id: 'companyName', label: '所属公司名称', fixed: false },
  { id: 'intervieweeName', label: '受访单位名称', fixed: false },
  { id: 'category', label: '类别', fixed: false },
  { id: 'priorBalance', label: '上期期末余额', fixed: false },
  { id: 'finalBalance', label: '期末余额', fixed: false },
  { id: 'priorInterimPlannedBalance', label: '上期预审阶段计划余额', fixed: false },
  { id: 'interimPlannedBalance', label: '预审阶段计划余额', fixed: false },
] as const;

const headerBlue =
  'border border-slate-300 bg-[#00338D] px-2 py-2 text-center text-[11px] font-medium leading-4 text-white';
const headerOrange =
  'border border-slate-300 bg-[#00338D] px-2 py-2 text-center text-[11px] font-medium leading-4 text-white';
const headerGreen =
  'border border-slate-300 bg-[#00a651] px-2 py-2 text-center text-[11px] font-medium leading-4 text-white';
const yellowCell = 'border border-slate-300 bg-white p-0 align-middle';
const grayCell = 'border border-slate-300 bg-[#f7f9fa] p-0 align-middle';
const inputClassName =
  'h-full min-h-[24px] w-full bg-transparent px-2 py-1 text-[11px] leading-4 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500';
const selectClassName =
  'h-full min-h-[24px] w-full appearance-none bg-transparent px-2 py-1 pr-6 text-[11px] leading-4 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500';
const stickyLeftCellClassNames = [
  'sticky left-0 z-20',
  'sticky left-[36px] z-20',
  'sticky left-[116px] z-20',
  'sticky left-[196px] z-20',
  'sticky left-[276px] z-20',
  'sticky left-[356px] z-20',
  'sticky left-[436px] z-20 shadow-[8px_0_12px_-10px_rgba(15,23,42,0.35)]',
] as const;
export const createMethodPlanRow = (overrides: Partial<MethodPlanRow> = {}): MethodPlanRow => ({
  id: Math.random().toString(36).slice(2, 11),
  companyName: '',
  companyOwner: '',
  province: '',
  city: '',
  district: '',
  address: '',
  countMethod: SELECT_PLACEHOLDER,
  selectedAsSample: '是',
  inventoryObservationMethod: SELECT_PLACEHOLDER,
  auditApproach: SELECT_PLACEHOLDER,
  feasibility: SELECT_PLACEHOLDER,
  monitorMode: SELECT_PLACEHOLDER,
  plannedDate: '',
  submissionDate: '',
  useExperts: '否',
  useInternalAudit: '否',
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

type BulkImportHeaderId = (typeof BULK_IMPORT_HEADER_ITEMS)[number]['id'];
type BulkImportParsedRow = Partial<Record<BulkImportHeaderId, string>>;

const normalizeBulkImportHeaderLabel = (value: string) => value.replace(/\s+/g, '');

const parseBulkImportCells = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.split('\t').map((cell) => cell.trim()))
    .filter((cells) => cells.some(Boolean));

const getBulkImportSheetRows = (
  value: string,
  headers: readonly (typeof BULK_IMPORT_HEADER_ITEMS)[number][]
): string[][] => {
  const rows = parseBulkImportCells(value);

  if (rows.length === 0) {
    return [];
  }

  const headerLookup = new Map(
    BULK_IMPORT_HEADER_ITEMS.map((item) => [normalizeBulkImportHeaderLabel(item.label), item.id])
  );
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

      if (cells.length === 1 && header.id === 'location-list') {
        return cells[0] ?? '';
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

const getBulkImportRecords = (
  value: string,
  headers: readonly (typeof BULK_IMPORT_HEADER_ITEMS)[number][]
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
  const locationValue = row.address || [row.province, row.city, row.district].filter(Boolean).join(' ');

  return BULK_IMPORT_HEADER_ITEMS.map((header) => {
    switch (header.id) {
      case 'index':
        return '';
      case 'location-list':
        return locationValue;
      case 'companyName':
        return row.companyName;
      case 'intervieweeName':
        return row.companyOwner;
      case 'category':
        return row.importedCategory ?? '';
      case 'priorBalance':
        return row.importedPriorBalance ?? '';
      case 'finalBalance':
        return row.importedFinalBalance ?? '';
      case 'priorInterimPlannedBalance':
        return row.importedPriorInterimPlannedBalance ?? '';
      case 'interimPlannedBalance':
        return row.importedInterimPlannedBalance ?? '';
      default:
        return '';
    }
  });
};

const hasBulkImportRowContent = (cells: string[]) =>
  cells.some((cell) => cell.trim());

function SelectCell({
  value,
  options,
  onChange,
  className,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className: string;
}) {
  return (
    <td className={`relative ${className}`}>
      <select
        className={selectClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </td>
  );
}

const MethodPlanMatrix = forwardRef<MethodPlanMatrixHandle, MethodPlanMatrixProps>(
  function MethodPlanMatrix(
    { rows: controlledRows, onRowsChange, onBulkImportRows, showBulkImportButton = true, hideNoteLabels = false },
    ref
  ) {
    const [uncontrolledRows, setUncontrolledRows] = useState<MethodPlanRow[]>(DEFAULT_ROWS);
    const [isSaved, setIsSaved] = useState(false);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [bulkImportValue, setBulkImportValue] = useState('');
    const [methodPlanPageSize, setMethodPlanPageSize] = useState<(typeof METHOD_PLAN_PAGE_SIZE_OPTIONS)[number]>(15);
    const [methodPlanPage, setMethodPlanPage] = useState(1);
    const [activeBulkImportHeaderIds, setActiveBulkImportHeaderIds] = useState<string[]>(
      BULK_IMPORT_HEADER_ITEMS.map((item) => item.id)
    );
    const [recentlyAddedRowIds, setRecentlyAddedRowIds] = useState<string[]>([]);
    const bulkImportFocusInputRef = useRef<HTMLInputElement>(null);
    const bulkImportSheetContainerRef = useRef<HTMLDivElement>(null);
    const rows = controlledRows ?? uncontrolledRows;
    const isControlled = controlledRows !== undefined;

    const markUnsaved = () => setIsSaved(false);

    const commitRows = (updater: (currentRows: MethodPlanRow[]) => MethodPlanRow[]) => {
      const nextRows = updater(rows);

      if (!isControlled) {
        setUncontrolledRows(nextRows);
      }

      onRowsChange?.(nextRows);
    };

    const updateRow = (id: string, field: keyof MethodPlanRow, value: string) => {
      markUnsaved();
      commitRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    };

    const openBulkImportModal = () => {
      const existingRows = rows
        .map(getBulkImportRowFromMethodPlanRow)
        .filter(hasBulkImportRowContent);

      setBulkImportValue(serializeBulkImportSheetRows(existingRows));
      setActiveBulkImportHeaderIds(BULK_IMPORT_HEADER_ITEMS.map((item) => item.id));
      setIsBulkImportOpen(true);
    };

    const closeBulkImportModal = () => {
      setIsBulkImportOpen(false);
      setBulkImportValue('');
    };

    const confirmBulkImport = () => {
      const parsedRows = getBulkImportRecords(bulkImportValue, activeBulkImportHeaders);

      if (parsedRows.length === 0) {
        closeBulkImportModal();
        return;
      }

      const newRows = parsedRows.map((record) => {
        const locationValue = record['location-list'] ?? '';
        const parsedAddress = parseChineseAddress(locationValue);

        return createMethodPlanRow({
          companyName: record.companyName ?? '',
          companyOwner: record.intervieweeName ?? '',
          province: parsedAddress.province,
          city: parsedAddress.city,
          district: parsedAddress.district,
          address: parsedAddress.fullAddress,
          importedCategory: record.category,
          importedPriorBalance: record.priorBalance,
          importedFinalBalance: record.finalBalance,
          importedPriorInterimPlannedBalance: record.priorInterimPlannedBalance,
          importedInterimPlannedBalance: record.interimPlannedBalance,
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
      onBulkImportRows?.(newRows);
      closeBulkImportModal();

      window.setTimeout(() => {
        setRecentlyAddedRowIds([]);
      }, 700);
    };

    useEffect(() => {
      const nextTotalPages = Math.max(1, Math.ceil(rows.length / methodPlanPageSize));
      setMethodPlanPage((currentPage) => Math.min(currentPage, nextTotalPages));
    }, [methodPlanPageSize, rows.length]);

    useImperativeHandle(ref, () => ({ openBulkImportModal }));

    useEffect(() => {
      if (isBulkImportOpen) {
        setActiveBulkImportHeaderIds(BULK_IMPORT_HEADER_ITEMS.map((item) => item.id));
      }
    }, [isBulkImportOpen]);

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

    const handleTableWheel = (event: React.WheelEvent<HTMLDivElement>) => {
      const container = event.currentTarget;
      const canScrollHorizontally = container.scrollWidth > container.clientWidth;

      if (!canScrollHorizontally) {
        return;
      }

      const horizontalDelta = event.deltaX !== 0 ? event.deltaX : event.deltaY;
      container.scrollLeft += horizontalDelta;
      event.preventDefault();
    };
    const noteLabel = (noteNumber: number) => (hideNoteLabels ? '' : ` (Note ${noteNumber})`);
    const shouldShowMethodPlanPagination = rows.length > 15;
    const methodPlanTotalPages = Math.max(1, Math.ceil(rows.length / methodPlanPageSize));
    const methodPlanPageStartIndex = (methodPlanPage - 1) * methodPlanPageSize;
    const paginatedMethodPlanRows = shouldShowMethodPlanPagination
      ? rows.slice(methodPlanPageStartIndex, methodPlanPageStartIndex + methodPlanPageSize)
      : rows;
    const activeBulkImportHeaders = BULK_IMPORT_HEADER_ITEMS.filter((item) =>
      activeBulkImportHeaderIds.includes(item.id)
    );
    const removedBulkImportHeaders = BULK_IMPORT_HEADER_ITEMS.filter(
      (item) => !activeBulkImportHeaderIds.includes(item.id)
    );
    const bulkImportGridTemplateColumns = activeBulkImportHeaders
      .map((item) => {
        if (item.id === 'index') {
          return 'minmax(28px, 0.28fr)';
        }

        if (item.id === 'location-list') {
          return 'minmax(150px, 1.35fr)';
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
      setBulkImportValue(serializeBulkImportSheetRows(nextRows));
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
      const item = BULK_IMPORT_HEADER_ITEMS.find((header) => header.id === id);

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
        return BULK_IMPORT_HEADER_ITEMS
          .map((item) => item.id)
          .filter((headerId) => restored.includes(headerId));
      });
    };

    const renderTable = () => (
      <>
      <div className="overflow-x-auto overscroll-none" onWheel={handleTableWheel}>
        <table className="min-w-[1910px] table-fixed border-collapse text-[13px]">
          <colgroup>
            <col className="w-[36px]" />
            <col className="w-[80px]" />
            <col className="w-[80px]" />
            <col className="w-[80px]" />
            <col className="w-[80px]" />
            <col className="w-[80px]" />
            <col className="w-[245px]" />
            <col className="w-[140px]" />
            <col className="w-[155px]" />
            <col className="w-[70px]" />
            <col className="w-[120px]" />
            <col className="w-[85px]" />
            <col className="w-[90px]" />
            <col className="w-[90px]" />
            <col className="w-[90px]" />
            <col className="w-[150px]" />
            <col className="w-[140px]" />
          </colgroup>
          <thead>
            <tr>
              <th className={`${headerBlue} ${stickyLeftCellClassNames[0]}`}>#</th>
              <th className={`${headerOrange} ${stickyLeftCellClassNames[1]}`}>所属公司名称</th>
              <th className={`${headerOrange} ${stickyLeftCellClassNames[2]}`}>受访单位名称</th>
              <th className={`${headerOrange} ${stickyLeftCellClassNames[3]}`}>地点所在省 / 地区</th>
              <th className={`${headerOrange} ${stickyLeftCellClassNames[4]}`}>地点所在市</th>
              <th className={`${headerOrange} ${stickyLeftCellClassNames[5]}`}>地点所在区</th>
              <th className={`${headerOrange} ${stickyLeftCellClassNames[6]}`}>地点详细地址</th>
              <th className={headerOrange}>被审计单位的存货盘点方法</th>
              <th className={headerBlue}>毕马威就监盘而计划的审计方案{noteLabel(6)}</th>
              <th className={headerGreen}>是否被毕马威选为盘点对象</th>
              <th className={headerBlue}>是否可实施实地监盘</th>
              <th className={headerBlue}>选择存货监盘方法</th>
              <th className={headerBlue}>现场监盘 vs 远程监盘{noteLabel(2)}</th>
              <th className={headerOrange}>计划的监盘日期</th>
              <th className={headerOrange}>提交底稿日期</th>
              <th className={headerBlue}>项目组是否计划引入专家和/或特定项目组成员，包括信息技术审计人员？{noteLabel(3)}</th>
              <th className={headerBlue}>项目组是否计划利用内部审计工作获取审计证据？{noteLabel(4)}</th>
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

                <td className={`${yellowCell} group-hover:bg-slate-50 ${stickyLeftCellClassNames[1]}`}>
                  <input
                    className={inputClassName}
                    value={row.companyName}
                    onChange={(event) => updateRow(row.id, 'companyName', event.target.value)}
                  />
                </td>

                <td className={`${yellowCell} group-hover:bg-slate-50 ${stickyLeftCellClassNames[2]}`}>
                  <input
                    className={inputClassName}
                    value={row.companyOwner}
                    onChange={(event) => updateRow(row.id, 'companyOwner', event.target.value)}
                  />
                </td>

                <td className={`${yellowCell} group-hover:bg-slate-50 ${stickyLeftCellClassNames[3]}`}>
                  <input
                    className={inputClassName}
                    value={row.province}
                    onChange={(event) => updateRow(row.id, 'province', event.target.value)}
                  />
                </td>
                <td className={`${yellowCell} group-hover:bg-slate-50 ${stickyLeftCellClassNames[4]}`}>
                  <input
                    className={inputClassName}
                    value={row.city}
                    onChange={(event) => updateRow(row.id, 'city', event.target.value)}
                  />
                </td>
                <td className={`${yellowCell} group-hover:bg-slate-50 ${stickyLeftCellClassNames[5]}`}>
                  <input
                    className={inputClassName}
                    value={row.district}
                    onChange={(event) => updateRow(row.id, 'district', event.target.value)}
                  />
                </td>
                <td className={`${yellowCell} group-hover:bg-slate-50 ${stickyLeftCellClassNames[6]}`}>
                  <input
                    className={inputClassName}
                    value={row.address}
                    onChange={(event) => updateRow(row.id, 'address', event.target.value)}
                  />
                </td>

                <SelectCell
                  className={grayCell}
                  value={row.countMethod}
                  options={COUNT_METHOD_OPTIONS}
                  onChange={(value) => updateRow(row.id, 'countMethod', value)}
                />

                <SelectCell
                  className={grayCell}
                  value={row.auditApproach}
                  options={AUDIT_APPROACH_OPTIONS}
                  onChange={(value) => updateRow(row.id, 'auditApproach', value)}
                />

                <SelectCell
                  className={grayCell}
                  value={row.selectedAsSample}
                  options={SAMPLE_SELECTION_OPTIONS}
                  onChange={(value) => updateRow(row.id, 'selectedAsSample', value)}
                />

                <SelectCell
                  className={grayCell}
                  value={row.feasibility}
                  options={FEASIBILITY_OPTIONS}
                  onChange={(value) => updateRow(row.id, 'feasibility', value)}
                />

                <SelectCell
                  className={grayCell}
                  value={row.inventoryObservationMethod ?? SELECT_PLACEHOLDER}
                  options={INVENTORY_OBSERVATION_METHOD_OPTIONS}
                  onChange={(value) => updateRow(row.id, 'inventoryObservationMethod', value)}
                />

                <SelectCell
                  className={grayCell}
                  value={row.monitorMode}
                  options={MONITOR_MODE_OPTIONS}
                  onChange={(value) => updateRow(row.id, 'monitorMode', value)}
                />

                <td className={yellowCell}>
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
                </td>

                <SelectCell
                  className={grayCell}
                  value={row.useExperts}
                  options={YES_NO_OPTIONS}
                  onChange={(value) => updateRow(row.id, 'useExperts', value)}
                />

                <SelectCell
                  className={grayCell}
                  value={row.useInternalAudit}
                  options={YES_NO_OPTIONS}
                  onChange={(value) => updateRow(row.id, 'useInternalAudit', value)}
                />
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {shouldShowMethodPlanPagination && (
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-3 py-2 text-xs text-slate-600">
          <span>
            {Math.min(methodPlanPageStartIndex + methodPlanPageSize, rows.length)} / {rows.length}
          </span>
          <select
            value={methodPlanPageSize}
            onChange={(event) => {
              setMethodPlanPageSize(Number(event.target.value) as (typeof METHOD_PLAN_PAGE_SIZE_OPTIONS)[number]);
              setMethodPlanPage(1);
            }}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
            aria-label="每页显示监盘方法行数"
          >
            {METHOD_PLAN_PAGE_SIZE_OPTIONS.map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize} / 页
              </option>
            ))}
          </select>
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
        <div className="mt-4 overflow-visible rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
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
            {showBulkImportButton ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={openBulkImportModal}
                  className="flex items-center gap-2 rounded-lg border border-[#00338D] bg-[#00338D] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#002b75] hover:shadow-md active:scale-95"
                >
                  批量导入地点
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:border-blue-500 hover:text-blue-600 hover:shadow-md active:scale-95"
                >
                  Roll-forward
                </button>
              </div>
            ) : (
              <span />
            )}
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
              <div className="text-xs font-medium text-slate-400">当前共 {rows.length} 条记录</div>
            </div>
          </div>
        </div>

        {isFullscreen && (
          <div className="fixed inset-0 z-[70] bg-slate-950/55 backdrop-blur-sm">
            <div className="flex h-full w-full flex-col bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">确定项目组的存货监盘方法</h3>
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
                          <div className="flex min-h-[34px] items-start justify-between gap-1 text-[11px] font-medium leading-snug text-slate-700">
                            <span className="break-words">{item.label}</span>
                            {!item.fixed && (
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
                            {activeBulkImportHeaders.map((header, columnIndex) => (
                              <input
                                key={`${header.id}-${rowIndex}`}
                                ref={
                                  rowIndex === bulkImportFocusRowIndex && header.id === 'location-list'
                                    ? bulkImportFocusInputRef
                                    : undefined
                                }
                                value={header.id === 'index' ? String(rowIndex + 1) : row[columnIndex] ?? ''}
                                readOnly={header.id === 'index'}
                                onChange={(event) =>
                                  updateBulkImportCell(rowIndex, columnIndex, event.target.value)
                                }
                                onPaste={handleBulkImportPaste}
                                aria-label={`${header.label} 第 ${rowIndex + 1} 行`}
                                className="h-8 min-w-0 border-r border-gray-200 bg-transparent px-1.5 text-[11px] text-gray-700 outline-none transition last:border-r-0 read-only:bg-gray-50 read-only:text-center read-only:text-gray-400 focus:bg-blue-50/70 focus:ring-1 focus:ring-blue-300"
                              />
                            ))}
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
                <div className="text-xs text-gray-400">
                  当前将导入 {getBulkImportRecords(bulkImportValue, activeBulkImportHeaders).length} 行
                </div>
                <div className="flex items-center gap-3">
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
