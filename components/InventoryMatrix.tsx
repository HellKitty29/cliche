/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import TableFullscreenFrame from './TableFullscreenFrame';

export type InventoryMatrixRow = {
  id: string;
  location: string;
  category: string;
  priorBalance: string;
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
  rows?: InventoryMatrixRow[];
  onRowsChange?: (rows: InventoryMatrixRow[]) => void;
};

type MatrixHintKey = 'location' | 'interimChange' | 'finalChange' | 'thirdPartyStorage';

const SYSTEM_OPTIONS = ['定期盘存系统', '永续盘存系统'];
const YES_NO_OPTIONS = ['否', '是'];
const COUNT_METHOD_OPTIONS = [
  '循环盘点',
  '在期末完成盘点',
];

export const createInventoryMatrixRow = (id: string): InventoryMatrixRow => ({
  id,
  location: '',
  category: '',
  priorBalance: '',
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

const selectClassName =
  'h-[21px] w-full appearance-none border-0 bg-transparent px-2 text-center text-[12px] text-[#1f1f1f] outline-none';

export default function InventoryMatrix({
  title = '了解矩阵',
  embedded = false,
  rows: controlledRows,
  onRowsChange,
}: InventoryMatrixProps) {
  const [rows, setRows] = useState<InventoryMatrixRow[]>(controlledRows ?? INITIAL_INVENTORY_MATRIX_ROWS);
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
  const [matrixScrollLeft, setMatrixScrollLeft] = useState(0);
  const interimChangeHeaderRef = useRef<HTMLTableCellElement>(null);
  const finalChangeHeaderRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    if (controlledRows) {
      setRows(controlledRows);
    }
  }, [controlledRows]);

  const addRow = () => {
    setRows((current) => [...current, createInventoryMatrixRow(Math.random().toString(36).slice(2, 11))]);
  };

  const removeRow = (id: string) => {
    setRows((current) => (current.length === 1 ? current : current.filter((row) => row.id !== id)));
  };

  const updateRow = (id: string, field: keyof InventoryMatrixRow, value: string) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  useEffect(() => {
    onRowsChange?.(rows);
  }, [onRowsChange, rows]);

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
        <span className="absolute bottom-[-6px] left-5 h-3 w-3 rotate-45 border-b border-r border-pink-200 bg-white" />
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
    fallbackLeft: number
  ) => {
    if (!headerRef.current) {
      return fallbackLeft;
    }

    return headerRef.current.offsetLeft + headerRef.current.offsetWidth / 2 - 65;
  };

  const isLocationHintVisible = visibleHints.location;
  const isLocationHintBreaking = breakingHints.location;
  const closeLocationHint = () => closeMatrixHint('location');

  return (
    <div className={embedded ? 'mt-8' : 'space-y-4'}>
      {!embedded && <h2 className="border-l-4 border-blue-600 pl-3 text-lg font-bold">{title}</h2>}

      <div className={`${embedded ? '' : 'ml-4'} overflow-visible rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]`}>
        <TableFullscreenFrame title={title}>
        {isLocationHintVisible && (
          <div
            className={`inventory-location-hint absolute left-[58px] top-[-92px] z-30 w-[260px] rounded-md border border-pink-200 bg-white px-3 py-2 text-left text-[12px] font-medium leading-5 text-slate-700 shadow-[0_12px_30px_rgba(190,24,93,0.18)] ${
              isLocationHintBreaking ? 'inventory-location-hint-break' : ''
            }`}
            style={{ left: 58 - matrixScrollLeft }}
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
        {renderMatrixHint(
          'interimChange',
          getHeaderHintLeft(interimChangeHeaderRef, 1016),
          <>
            <p className="pr-5">检测单体波动</p>
            <p className="mt-1 text-pink-600">检测整体显著变化</p>
          </>
        )}
        {renderMatrixHint(
          'finalChange',
          getHeaderHintLeft(finalChangeHeaderRef, 1254),
          <>
            <p className="pr-5">检测单体波动</p>
            <p className="mt-1 text-pink-600">检测整体显著变化</p>
          </>
        )}
        {renderMatrixHint(
          'thirdPartyStorage',
          1562,
          <>
            <p className="pr-5">如有，则可开启appendix 3</p>
          </>
        )}
        <div
          className="overflow-x-auto rounded-lg"
          onScroll={(event) => setMatrixScrollLeft(event.currentTarget.scrollLeft)}
        >
          <table className="min-w-[1454px] table-fixed border-collapse bg-white">
            <colgroup>
              <col style={{ width: '38px' }} />
              <col style={{ width: '220px' }} />
              <col style={{ width: '180px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '34px' }} />
              <col style={{ width: '130px' }} />
              <col style={{ width: '34px' }} />
              <col style={{ width: '42px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '28px' }} />
              <col style={{ width: '42px' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '210px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '48px' }} />
            </colgroup>

            <thead>
              <tr>
                <th className={`${headerCellClassName} bg-[#143f97]`}>#</th>
                <th className={`${headerCellClassName} bg-[#143f97]`}>地点(Note 1)</th>
                <th className={`${headerCellClassName} bg-[#143f97]`}>类别( Note 2)</th>
                <th className={`${headerCellClassName} bg-[#143f97]`}>上期余额</th>
                <th className={`${lightHeaderCellClassName} bg-[#fce5cd]`}>占比</th>
                <th className={`${headerCellClassName} bg-[#143f97]`}>预审阶段计划余额</th>
                <th className={`${lightHeaderCellClassName} bg-[#fce5cd]`}>占比</th>
                <th
                  ref={interimChangeHeaderRef}
                  className={`${lightHeaderCellClassName} bg-[#fce5cd]`}
                >
                  变动幅度
                </th>
                <th className={`${headerCellClassName} bg-[#143f97]`}>期末计划余额</th>
                <th className={`${lightHeaderCellClassName} bg-[#fce5cd]`}>占比</th>
                <th
                  ref={finalChangeHeaderRef}
                  className={`${lightHeaderCellClassName} bg-[#fce5cd]`}
                >
                  变动幅度
                </th>
                <th className={`${headerCellClassName} bg-[#143f97]`}>
                  被审计单位是否使用永续盘存系统或定期盘存系统？
                  <br />
                  (Note 3)
                </th>
                <th className={`${headerCellClassName} bg-[#143f97]`}>
                  是否存放在第三方地点？
                  <br />
                  (Note 3)
                </th>
                <th className={`${headerCellClassName} bg-[#143f97]`}>被审计单位 的存货盘点方法</th>
                <th className={`${headerCellClassName} bg-[#143f97]`}>
                  被审计单位是否使用了专家？
                  <br />
                  (Note 4)
                </th>
                <th className={`${headerCellClassName} bg-[#143f97]`}>操作</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <td className="border border-[#2b2b2b] bg-slate-50/30 px-2 py-1 text-center font-mono text-[11px] text-slate-400 align-middle">
                    {index + 1}
                  </td>
                  <td className={yellowCellClassName}>
                    <input
                      className={inputClassName}
                      value={row.location}
                      onChange={(event) => updateRow(row.id, 'location', event.target.value)}
                    />
                  </td>
                  <td className={yellowCellClassName}>
                    <input
                      className={inputClassName}
                      value={row.category}
                      onChange={(event) => updateRow(row.id, 'category', event.target.value)}
                    />
                  </td>
                  <td className={yellowCellClassName}>
                    <input
                      className={inputClassName}
                      value={row.priorBalance}
                      onChange={(event) => updateRow(row.id, 'priorBalance', event.target.value)}
                    />
                  </td>
                  <td className={yellowCellClassName}>
                    <input
                      className={inputClassName}
                      value={row.priorShare}
                      onChange={(event) => updateRow(row.id, 'priorShare', event.target.value)}
                    />
                  </td>
                  <td className={yellowCellClassName}>
                    <input
                      className={inputClassName}
                      value={row.interimPlannedBalance}
                      onChange={(event) =>
                        updateRow(row.id, 'interimPlannedBalance', event.target.value)
                      }
                    />
                  </td>
                  <td className={yellowCellClassName}>
                    <input
                      className={inputClassName}
                      value={row.interimShare}
                      onChange={(event) => updateRow(row.id, 'interimShare', event.target.value)}
                    />
                  </td>
                  <td className={yellowCellClassName}>
                    <input
                      className={inputClassName}
                      value={row.interimChange}
                      onChange={(event) => updateRow(row.id, 'interimChange', event.target.value)}
                    />
                  </td>
                  <td className={yellowCellClassName}>
                    <input
                      className={inputClassName}
                      value={row.finalPlannedBalance}
                      onChange={(event) =>
                        updateRow(row.id, 'finalPlannedBalance', event.target.value)
                      }
                    />
                  </td>
                  <td className={yellowCellClassName}>
                    <input
                      className={inputClassName}
                      value={row.finalShare}
                      onChange={(event) => updateRow(row.id, 'finalShare', event.target.value)}
                    />
                  </td>
                  <td className={yellowCellClassName}>
                    <input
                      className={inputClassName}
                      value={row.finalChange}
                      onChange={(event) => updateRow(row.id, 'finalChange', event.target.value)}
                    />
                  </td>
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
                  <td className="border border-[#2b2b2b] bg-white p-0 text-center align-middle">
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
              ))}

              <tr>
                <td className="border border-[#2b2b2b] bg-slate-50/30 px-2 py-1 text-center align-middle">
                  <button
                    type="button"
                    onClick={addRow}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition hover:border-blue-500 hover:text-blue-600 hover:shadow-sm active:scale-95"
                    title="新增行"
                  >
                    <Plus size={14} />
                  </button>
                </td>
                <td className="border border-[#2b2b2b] bg-white px-2 py-1 text-center text-[12px] leading-[1.1] text-[#1f1f1f]">
                  （根据需要添加更多行）
                </td>
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-white px-2 py-1" />
              </tr>

              <tr>
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-black px-2 py-1 text-center text-[12px] font-semibold leading-[1.1] text-white">
                  存货总额
                </td>
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-black px-2 py-1 text-center text-[12px] font-semibold text-white">
                  -
                </td>
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-black px-2 py-1 text-center text-[12px] font-semibold text-white">
                  -
                </td>
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-black px-2 py-1 text-center text-[12px] font-semibold text-white">
                  -
                </td>
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
                <td className="border border-[#2b2b2b] bg-black px-2 py-1" />
              </tr>
            </tbody>
          </table>
        </div>
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
