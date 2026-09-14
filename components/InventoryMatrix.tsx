/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import TableFullscreenFrame from './TableFullscreenFrame';

export type InventoryMatrixRow = {
  id: string;
  location: string;
  companyName: string;
  intervieweeName: string;
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
  systemType: string;
  thirdPartyStorage: string;
  countMethod: string;
  useExpert: string;
};

type InventoryMatrixProps = {
  title?: string;
  embedded?: boolean;
  hideNoteLabels?: boolean;
  rows?: InventoryMatrixRow[];
  onRowsChange?: (rows: InventoryMatrixRow[]) => void;
};

type MatrixHintKey = 'location' | 'interimChange' | 'finalChange' | 'thirdPartyStorage';
const INVENTORY_PAGE_SIZE_OPTIONS = [15, 30, 50] as const;

const SYSTEM_OPTIONS = ['定期盘存系统', '永续盘存系统'];
const YES_NO_OPTIONS = ['否', '是'];
const COUNT_METHOD_OPTIONS = [
  '循环盘点',
  '在期末完成盘点',
];

export const createInventoryMatrixRow = (id: string): InventoryMatrixRow => ({
  id,
  location: '',
  companyName: '',
  intervieweeName: '',
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
  systemType: '永续盘存系统',
  thirdPartyStorage: '否',
  countMethod: '在期末完成盘点',
  useExpert: '否',
});

export const INITIAL_INVENTORY_MATRIX_ROWS: InventoryMatrixRow[] = ['1', '2', '3', '4', '5', '6'].map(createInventoryMatrixRow);
const AMOUNT_FIELDS: Array<keyof InventoryMatrixRow> = [
  'priorBalance',
  'currentInterimStage',
  'interimPlannedBalance',
  'finalPlannedBalance',
];

const headerCellClassName =
  'border border-[#2b2b2b] px-2 py-1 text-center text-[12px] font-semibold leading-[1.15] text-white';

const lightHeaderCellClassName =
  'border border-[#2b2b2b] px-2 py-1 text-center text-[12px] font-semibold leading-[1.15] text-[#1f1f1f]';

const bodyCellClassName =
  'border border-[#2b2b2b] bg-white p-0 align-middle text-[12px] leading-[1.1] text-[#1f1f1f]';

const yellowCellClassName = `${bodyCellClassName} bg-white`;
const neutralCellClassName = `${bodyCellClassName} bg-white`;
const grayCellClassName = `${bodyCellClassName} bg-[#f2f2f2]`;

const inputClassName =
  'h-[21px] w-full border-0 bg-transparent px-2 text-center text-[12px] text-[#1f1f1f] outline-none';
const leftAlignedInputClassName =
  'h-[21px] w-full border-0 bg-transparent px-2 text-left text-[12px] text-[#1f1f1f] outline-none';
const amountInputClassName =
  'h-[21px] w-full border-0 bg-transparent px-2 text-right text-[12px] text-[#1f1f1f] outline-none';

const selectClassName =
  'h-[21px] w-full appearance-none border-0 bg-transparent px-2 text-center text-[12px] text-[#1f1f1f] outline-none';

const calculatedCellClassName =
  'border border-[#2b2b2b] bg-black px-2 py-1 align-middle text-center text-[12px] font-semibold text-white';
const derivedCellClassName =
  'border border-[#2b2b2b] bg-[#d9d9d9] px-2 py-1 align-middle text-center text-[12px] font-semibold text-[#1f1f1f]';
const stickyIndexHeaderClassName = 'sticky left-0 z-30';
const stickyLocationHeaderClassName =
  'sticky left-[32px] z-30 shadow-[8px_0_12px_-10px_rgba(15,23,42,0.35)]';
const stickyIndexCellClassName = 'sticky left-0 z-20';
const stickyLocationCellClassName =
  'sticky left-[32px] z-20 shadow-[8px_0_12px_-10px_rgba(15,23,42,0.35)]';
const stickyRightHeaderClassName =
  'sticky right-0 z-30 shadow-[-8px_0_12px_-10px_rgba(15,23,42,0.35)]';
const stickyRightCellClassName =
  'sticky right-0 z-20 shadow-[-8px_0_12px_-10px_rgba(15,23,42,0.35)]';

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
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(value);
}

function formatEditableAmount(value: string) {
  const amount = parseAmount(value);
  return amount === null ? value : formatAmount(amount);
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
  rows: controlledRows,
  onRowsChange,
}: InventoryMatrixProps) {
  const [uncontrolledRows, setUncontrolledRows] = useState<InventoryMatrixRow[]>(
    controlledRows ?? INITIAL_INVENTORY_MATRIX_ROWS
  );
  const [visibleHints, setVisibleHints] = useState<Record<MatrixHintKey, boolean>>({
    location: true,
    interimChange: true,
    finalChange: true,
    thirdPartyStorage: true,
  });
  const [breakingHints, setBreakingHints] = useState<Record<MatrixHintKey, boolean>>({
    location: false,
    interimChange: false,
    finalChange: false,
    thirdPartyStorage: false,
  });
  const [phaseView, setPhaseView] = useState<'balance' | 'interim'>('balance');
  const [matrixScrollLeft, setMatrixScrollLeft] = useState(0);
  const [isCategoryTooltipVisible, setIsCategoryTooltipVisible] = useState(false);
  const [inventoryPageSize, setInventoryPageSize] = useState<(typeof INVENTORY_PAGE_SIZE_OPTIONS)[number]>(15);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [, setMatrixLayoutVersion] = useState(0);
  const locationHeaderRef = useRef<HTMLTableCellElement>(null);
  const categoryHeaderRef = useRef<HTMLTableCellElement>(null);
  const interimChangeHeaderRef = useRef<HTMLTableCellElement>(null);
  const finalChangeHeaderRef = useRef<HTMLTableCellElement>(null);
  const thirdPartyStorageHeaderRef = useRef<HTMLTableCellElement>(null);
  const rows = controlledRows ?? uncontrolledRows;
  const isControlled = controlledRows !== undefined;

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
    const nextTotalPages = Math.max(1, Math.ceil(rows.length / inventoryPageSize));
    setInventoryPage((currentPage) => Math.min(currentPage, nextTotalPages));
  }, [inventoryPageSize, rows.length]);

  useLayoutEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setMatrixLayoutVersion((version) => version + 1);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [phaseView, rows.length, inventoryPage, inventoryPageSize]);

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

  const totalPriorBalance = rows.reduce<number | null>((sum, row) => {
    const amount = parseAmount(row.priorBalance);
    if (amount === null) {
      return sum;
    }

    return (sum ?? 0) + amount;
  }, null);

  const totalInterimPlannedBalance = rows.reduce<number | null>((sum, row) => {
    const amount = parseAmount(row.interimPlannedBalance);
    if (amount === null) {
      return sum;
    }

    return (sum ?? 0) + amount;
  }, null);

  const totalCurrentInterimStage = rows.reduce<number | null>((sum, row) => {
    const amount = parseAmount(row.currentInterimStage);
    if (amount === null) {
      return sum;
    }

    return (sum ?? 0) + amount;
  }, null);

  const totalFinalPlannedBalance = rows.reduce<number | null>((sum, row) => {
    const amount = parseAmount(row.finalPlannedBalance);
    if (amount === null) {
      return sum;
    }

    return (sum ?? 0) + amount;
  }, null);

  const derivedRows = rows.map((row) => {
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

  const shouldShowInventoryPagination = rows.length > 15;
  const inventoryTotalPages = Math.max(1, Math.ceil(rows.length / inventoryPageSize));
  const inventoryPageStartIndex = (inventoryPage - 1) * inventoryPageSize;
  const paginatedRows = shouldShowInventoryPagination
    ? rows.slice(inventoryPageStartIndex, inventoryPageStartIndex + inventoryPageSize)
    : rows;

  const closeMatrixHint = (hintKey: MatrixHintKey) => {
    setBreakingHints((current) => ({ ...current, [hintKey]: true }));
    window.setTimeout(() => {
      setVisibleHints((current) => ({ ...current, [hintKey]: false }));
      setBreakingHints((current) => ({ ...current, [hintKey]: false }));
    }, 520);
  };

  const renderMatrixHint = (hintKey: MatrixHintKey, left: number, children: React.ReactNode) => {
    if (!visibleHints[hintKey]) {
      return null;
    }

    return (
      <div
        className={`inventory-location-hint absolute top-[-62px] z-30 w-[130px] rounded-md border border-pink-200 bg-white px-3 py-2 text-left text-[12px] font-medium leading-5 text-slate-700 shadow-[0_12px_30px_rgba(190,24,93,0.18)] ${
          breakingHints[hintKey] ? 'inventory-location-hint-break' : ''
        }`}
        style={{ left: left - matrixScrollLeft }}
      >
        <button
          type="button"
          onClick={() => closeMatrixHint(hintKey)}
          className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded text-slate-400 transition hover:bg-pink-50 hover:text-pink-600"
          aria-label="关闭提示"
        >
          <X size={13} />
        </button>
        {children}
        <span className="absolute bottom-[-6px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-pink-200 bg-white" />
        <span className="inventory-location-hint-chip inventory-location-hint-chip-1" />
        <span className="inventory-location-hint-chip inventory-location-hint-chip-2" />
        <span className="inventory-location-hint-chip inventory-location-hint-chip-3" />
        <span className="inventory-location-hint-chip inventory-location-hint-chip-4" />
        <span className="inventory-location-hint-chip inventory-location-hint-chip-5" />
      </div>
    );
  };

  const getHeaderHintLeft = (
    headerRef: React.RefObject<HTMLTableCellElement | null>,
    fallbackLeft: number,
    hintWidth = 130
  ) => {
    if (!headerRef.current) {
      return fallbackLeft;
    }

    return headerRef.current.offsetLeft + headerRef.current.offsetWidth / 2 - hintWidth / 2;
  };

  const isLocationHintVisible = visibleHints.location;
  const isLocationHintBreaking = breakingHints.location;
  const closeLocationHint = () => closeMatrixHint('location');
  const noteLabel = (noteNumber: number) => (hideNoteLabels ? '' : ` (Note ${noteNumber})`);
  const isBalanceView = phaseView === 'balance';
  const isInterimView = phaseView === 'interim';
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

  return (
    <div className={embedded ? 'mt-8' : 'space-y-4'}>
      {!embedded && <h2 className="border-l-4 border-blue-600 pl-3 text-lg font-bold">{title}</h2>}

      <div className={`${embedded ? '' : 'ml-4'} overflow-visible rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]`}>
        <TableFullscreenFrame
          title={title}
          headerActions={
            <div
              className="flex -translate-y-1.5 items-center overflow-hidden rounded-full border border-blue-200 bg-blue-50 p-0.5 text-[11px] font-medium shadow-sm"
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
          }
        >
        {isLocationHintVisible && (
          <div
            className={`inventory-location-hint absolute left-[58px] top-[-92px] z-30 w-[260px] rounded-md border border-pink-200 bg-white px-3 py-2 text-left text-[12px] font-medium leading-5 text-slate-700 shadow-[0_12px_30px_rgba(190,24,93,0.18)] ${
              isLocationHintBreaking ? 'inventory-location-hint-break' : ''
            }`}
            style={{ left: getHeaderHintLeft(locationHeaderRef, 58, 260) - matrixScrollLeft }}
          >
            <button
              type="button"
              onClick={closeLocationHint}
              className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded text-slate-400 transition hover:bg-pink-50 hover:text-pink-600"
              aria-label="关闭地点提示"
            >
              <X size={13} />
            </button>
            <p className="pr-5">性质及其类型。对比是否发生仓库/门店变动</p>
            <p className="mt-1 text-pink-600">自动roll 上年度地点信息</p>
            <span className="absolute bottom-[-6px] left-5 h-3 w-3 rotate-45 border-b border-r border-pink-200 bg-white" />
            <span className="inventory-location-hint-chip inventory-location-hint-chip-1" />
            <span className="inventory-location-hint-chip inventory-location-hint-chip-2" />
            <span className="inventory-location-hint-chip inventory-location-hint-chip-3" />
            <span className="inventory-location-hint-chip inventory-location-hint-chip-4" />
            <span className="inventory-location-hint-chip inventory-location-hint-chip-5" />
          </div>
        )}
        {isCategoryTooltipVisible && (
          <div
            className="absolute top-[-118px] z-[80] w-[300px] rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-[11px] font-normal leading-5 text-gray-700 shadow-lg"
            style={{ left: getHeaderHintLeft(categoryHeaderRef, 344, 300) - matrixScrollLeft }}
          >
            根据财务报告编制基础的不同，存货类别可能包括原材料、材料与物料、包装材料、在产品、产成品、持有以供转售商品、备品备件及其他。
            <span className="absolute bottom-[-5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-gray-200 bg-white" />
          </div>
        )}
        {isInterimView &&
          renderMatrixHint(
            'interimChange',
            getHeaderHintLeft(interimChangeHeaderRef, 702),
            <>
              <p className="pr-5">检测单体波动</p>
              <p className="mt-1 text-pink-600">检测整体显著变化</p>
            </>
          )}
        {isBalanceView &&
          renderMatrixHint(
            'finalChange',
            getHeaderHintLeft(finalChangeHeaderRef, 658),
            <>
              <p className="pr-5">检测单体波动</p>
              <p className="mt-1 text-pink-600">检测整体显著变化</p>
            </>
          )}
        {renderMatrixHint(
          'thirdPartyStorage',
          getHeaderHintLeft(thirdPartyStorageHeaderRef, 1562),
          <>
            <p className="pr-5">如有，则可开启appendix 3</p>
          </>
        )}
        <div
          className="overflow-x-auto overscroll-none rounded-lg"
          onScroll={(event) => setMatrixScrollLeft(event.currentTarget.scrollLeft)}
          onWheel={handleInventoryMatrixWheel}
        >
          <table className="min-w-[1554px] table-fixed border-collapse bg-white">
            <colgroup>
              <col style={{ width: '32px' }} />
              <col style={{ width: '210px' }} />
              <col style={{ width: '82px' }} />
              <col style={{ width: '82px' }} />
              <col style={{ width: '76px' }} />
              {isBalanceView && <col style={{ width: '80px' }} />}
              {isInterimView && <col style={{ width: '100px' }} />}
              {isInterimView && <col style={{ width: '32px' }} />}
              {isBalanceView && <col style={{ width: '30px' }} />}
              {isInterimView && <col style={{ width: '100px' }} />}
              {isInterimView && <col style={{ width: '32px' }} />}
              {isInterimView && <col style={{ width: '42px' }} />}
              {isBalanceView && <col style={{ width: '80px' }} />}
              {isBalanceView && <col style={{ width: '30px' }} />}
              {isBalanceView && <col style={{ width: '42px' }} />}
              <col style={{ width: '110px' }} />
              <col style={{ width: '95px' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '96px' }} />
              <col style={{ width: '40px' }} />
            </colgroup>

            <thead>
              <tr>
                <th className={`${headerCellClassName} ${stickyIndexHeaderClassName} bg-[#143f97]`}>#</th>
                <th ref={locationHeaderRef} className={`${headerCellClassName} ${stickyLocationHeaderClassName} bg-[#143f97]`}>地点{noteLabel(1)}</th>
                <th className={`${headerCellClassName} bg-[#143f97]`}>所属公司名称</th>
                <th className={`${headerCellClassName} bg-[#143f97]`}>受访单位名称</th>
                <th ref={categoryHeaderRef} className={`${headerCellClassName} bg-[#143f97]`}>
                  <span className="inline-flex items-center justify-center gap-1">
                    类别{noteLabel(2)}
                    <button
                      type="button"
                      onMouseEnter={() => setIsCategoryTooltipVisible(true)}
                      onMouseLeave={() => setIsCategoryTooltipVisible(false)}
                      onFocus={() => setIsCategoryTooltipVisible(true)}
                      onBlur={() => setIsCategoryTooltipVisible(false)}
                      className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/80 bg-white text-[9px] font-bold leading-none text-[#143f97]"
                      aria-label="类别说明"
                    >
                      i
                    </button>
                  </span>
                </th>
                {isBalanceView && (
                  <th className={`${headerCellClassName} bg-[#143f97]`}>上期期末余额</th>
                )}
                {isInterimView && (
                  <th className={`${headerCellClassName} bg-[#143f97]`}>上期预审阶段余额</th>
                )}
                {isInterimView && (
                  <th className={`${lightHeaderCellClassName} bg-[#fce5cd]`}>占比</th>
                )}
                {isBalanceView && (
                  <th className={`${lightHeaderCellClassName} bg-[#fce5cd]`}>占比</th>
                )}
                {isInterimView && (
                  <th className={`${headerCellClassName} bg-[#143f97]`}>本期预审阶段余额</th>
                )}
                {isInterimView && (
                  <th className={`${lightHeaderCellClassName} bg-[#fce5cd]`}>占比</th>
                )}
                {isInterimView && (
                  <th
                    ref={interimChangeHeaderRef}
                    className={`${lightHeaderCellClassName} bg-[#fce5cd]`}
                  >
                    变动幅度
                  </th>
                )}
                {isBalanceView && (
                  <th className={`${headerCellClassName} bg-[#143f97]`}>本期期末余额</th>
                )}
                {isBalanceView && (
                  <th className={`${lightHeaderCellClassName} bg-[#fce5cd]`}>占比</th>
                )}
                {isBalanceView && (
                  <th
                    ref={finalChangeHeaderRef}
                    className={`${lightHeaderCellClassName} bg-[#fce5cd]`}
                  >
                    变动幅度
                  </th>
                )}
                <th ref={thirdPartyStorageHeaderRef} className={`${headerCellClassName} bg-[#143f97]`}>
                  被审计单位是否使用永续盘存系统或定期盘存系统？
                  <br />
                  {noteLabel(3)}
                </th>
                <th className={`${headerCellClassName} bg-[#143f97]`}>
                  是否存放在第三方地点？
                  <br />
                  {noteLabel(3)}
                </th>
                <th className={`${headerCellClassName} bg-[#143f97]`}>被审计单位的存货盘点方法</th>
                <th className={`${headerCellClassName} bg-[#143f97]`}>
                  被审计单位是否使用了专家？
                  <br />
                  {noteLabel(4)}
                </th>
                <th className={`${headerCellClassName} ${stickyRightHeaderClassName} bg-[#143f97]`}>操作</th>
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
                  <td className={`${yellowCellClassName} ${stickyLocationCellClassName}`}>
                    <input
                      className={leftAlignedInputClassName}
                      value={row.location}
                      onChange={(event) => updateRow(row.id, 'location', event.target.value)}
                    />
                  </td>
                  <td className={yellowCellClassName}>
                    <input
                      className={inputClassName}
                      value={row.companyName}
                      onChange={(event) => updateRow(row.id, 'companyName', event.target.value)}
                    />
                  </td>
                  <td className={yellowCellClassName}>
                    <input
                      className={inputClassName}
                      value={row.intervieweeName}
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
                  {isBalanceView && (
                    <td className={yellowCellClassName}>
                      <input
                        className={amountInputClassName}
                        value={row.priorBalance}
                        onChange={(event) => updateRow(row.id, 'priorBalance', event.target.value)}
                        onBlur={(event) =>
                          updateRow(row.id, 'priorBalance', formatEditableAmount(event.target.value))
                        }
                      />
                    </td>
                  )}
                  {isInterimView && (
                    <td className={yellowCellClassName}>
                      <input
                        className={amountInputClassName}
                        value={row.currentInterimStage}
                        onChange={(event) =>
                          updateRow(row.id, 'currentInterimStage', event.target.value)
                        }
                        onBlur={(event) =>
                          updateRow(row.id, 'currentInterimStage', formatEditableAmount(event.target.value))
                        }
                      />
                    </td>
                  )}
                  {isInterimView && (
                    <td className={derivedCellClassName}>{derivedRow.currentInterimShare}</td>
                  )}
                  {isBalanceView && <td className={derivedCellClassName}>{derivedRow.priorShare}</td>}
                  {isInterimView && (
                    <td className={yellowCellClassName}>
                      <input
                        className={amountInputClassName}
                        value={row.interimPlannedBalance}
                        onChange={(event) =>
                          updateRow(row.id, 'interimPlannedBalance', event.target.value)
                        }
                        onBlur={(event) =>
                          updateRow(row.id, 'interimPlannedBalance', formatEditableAmount(event.target.value))
                        }
                      />
                    </td>
                  )}
                  {isInterimView && <td className={derivedCellClassName}>{derivedRow.interimShare}</td>}
                  {isInterimView && <td className={derivedCellClassName}>{derivedRow.interimChange}</td>}
                  {isBalanceView && (
                    <td className={yellowCellClassName}>
                      <input
                        className={amountInputClassName}
                        value={row.finalPlannedBalance}
                        onChange={(event) =>
                          updateRow(row.id, 'finalPlannedBalance', event.target.value)
                        }
                        onBlur={(event) =>
                          updateRow(row.id, 'finalPlannedBalance', formatEditableAmount(event.target.value))
                        }
                      />
                    </td>
                  )}
                  {isBalanceView && <td className={derivedCellClassName}>{derivedRow.finalShare}</td>}
                  {isBalanceView && <td className={derivedCellClassName}>{derivedRow.finalChange}</td>}
                  <td className={grayCellClassName}>
                    <select
                      className={selectClassName}
                      value={row.systemType}
                      onChange={(event) => updateRow(row.id, 'systemType', event.target.value)}
                    >
                      {SYSTEM_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
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
                  <td className={grayCellClassName}>
                    <select
                      className={selectClassName}
                      value={row.countMethod}
                      onChange={(event) => updateRow(row.id, 'countMethod', event.target.value)}
                    >
                      {COUNT_METHOD_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
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
                <td className={`border border-[#2b2b2b] bg-slate-50 px-2 py-1 text-center align-middle ${stickyIndexCellClassName}`}>
                  <button
                    type="button"
                    onClick={addRow}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition hover:border-blue-500 hover:text-blue-600 hover:shadow-sm active:scale-95"
                    title="新增行"
                  >
                    <Plus size={14} />
                  </button>
                </td>
                <td className={`border border-[#2b2b2b] bg-white px-2 py-1 text-center text-[12px] leading-[1.1] text-[#1f1f1f] ${stickyLocationCellClassName}`}>
                  （根据需要添加更多行）
                </td>
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                {isBalanceView && <td className="border border-[#2b2b2b] bg-white px-2 py-1" />}
                {isInterimView && <td className="border border-[#2b2b2b] bg-white px-2 py-1" />}
                {isInterimView && <td className="border border-[#2b2b2b] bg-gray-300 px-2 py-1" />}
                {isBalanceView && <td className="border border-[#2b2b2b] bg-gray-300 px-2 py-1" />}
                {isInterimView && <td className="border border-[#2b2b2b] bg-white px-2 py-1" />}
                {isInterimView && <td className="border border-[#2b2b2b] bg-gray-300 px-2 py-1" />}
                {isInterimView && <td className="border border-[#2b2b2b] bg-gray-300 px-2 py-1" />}
                {isBalanceView && <td className="border border-[#2b2b2b] bg-white px-2 py-1" />}
                {isBalanceView && <td className="border border-[#2b2b2b] bg-gray-300 px-2 py-1" />}
                {isBalanceView && <td className="border border-[#2b2b2b] bg-gray-300 px-2 py-1" />}
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className={`border border-[#2b2b2b] bg-white px-2 py-1 ${stickyRightCellClassName}`} />
              </tr>

              <tr>
                <td className={`border border-[#2b2b2b] bg-black px-2 py-1 ${stickyIndexCellClassName}`} />
                <td className={`border border-[#2b2b2b] bg-black px-2 py-1 text-center text-[12px] font-semibold leading-[1.1] text-white ${stickyLocationCellClassName}`}>
                  存货总额
                </td>
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                {isBalanceView && (
                  <td className={calculatedCellClassName}>{formatAmount(totalPriorBalance)}</td>
                )}
                {isInterimView && <td className="border border-[#2b2b2b] bg-black px-2 py-1" />}
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
                    {formatAmount(totalInterimPlannedBalance)}
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
                  <td className={calculatedCellClassName}>{formatAmount(totalFinalPlannedBalance)}</td>
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
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
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
              {Math.min(inventoryPageStartIndex + inventoryPageSize, rows.length)} / {rows.length}
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
