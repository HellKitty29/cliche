/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, Minimize2, Plus, Trash2 } from 'lucide-react';
import { parseChineseAddress } from '../utils/addressParser';

export type MethodPlanRow = {
  id: string;
  companyName: string;
  companyOwner: string;
  province: string;
  city: string;
  district: string;
  address: string;
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
  onRowsChange?: (rows: MethodPlanRow[]) => void;
  onBulkImportRows?: (rows: MethodPlanRow[]) => void;
  showBulkImportButton?: boolean;
};

export type MethodPlanMatrixHandle = {
  openBulkImportModal: () => void;
};

const COUNT_METHOD_OPTIONS = ['循环盘点', '在非期末时点完成盘点', '在期末完成盘点'];
const AUDIT_APPROACH_OPTIONS = [
  '双重目的方案',
  '实质性方案',
  '控制测试方案',
  '独立盘点方案',
  '未识别出重大错报风险（仅限ISA项目）',
];
const FEASIBILITY_OPTIONS = ['从下拉菜单选择', '可实施', '不可实施'];
const MONITOR_MODE_OPTIONS = ['现场监盘', '远程监盘'];
const SAMPLE_SELECTION_OPTIONS = ['是', '否'];
const INVENTORY_OBSERVATION_METHOD_OPTIONS = ['循环盘点', '全面实地盘点', '存货监盘不可行'];
const YES_NO_OPTIONS = ['否', '是'];

const headerBlue =
  'border border-slate-300 bg-[#00338D] px-2 py-2 text-center text-[11px] font-medium leading-4 text-white';
const headerOrange =
  'border border-slate-300 bg-[#00338D] px-2 py-2 text-center text-[11px] font-medium leading-4 text-white';
const headerGreen =
  'border border-slate-300 bg-[#00a651] px-2 py-2 text-center text-[11px] font-medium leading-4 text-white';
const yellowCell = 'border border-slate-300 bg-white p-0 align-middle';
const grayCell = 'border border-slate-300 bg-[#f2f2f2] p-0 align-middle';
const inputClassName =
  'h-full min-h-[24px] w-full bg-transparent px-2 py-1 text-[11px] leading-4 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500';
const selectClassName =
  'h-full min-h-[24px] w-full appearance-none bg-transparent px-2 py-1 pr-6 text-[11px] leading-4 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500';
const stickyLeftCellClassNames = [
  'sticky left-0 z-20',
  'sticky left-[36px] z-20',
  'sticky left-[116px] z-20',
  'sticky left-[216px] z-20',
  'sticky left-[296px] z-20',
  'sticky left-[376px] z-20',
  'sticky left-[456px] z-20 shadow-[8px_0_12px_-10px_rgba(15,23,42,0.35)]',
] as const;
const stickyRightCellClassName =
  'sticky right-0 z-20 shadow-[-8px_0_12px_-10px_rgba(15,23,42,0.35)]';

const createMethodPlanRow = (overrides: Partial<MethodPlanRow> = {}): MethodPlanRow => ({
  id: Math.random().toString(36).slice(2, 11),
  companyName: '',
  companyOwner: '',
  province: '',
  city: '',
  district: '',
  address: '',
  countMethod: '在期末完成盘点',
  selectedAsSample: '否',
  inventoryObservationMethod: '全面实地盘点',
  auditApproach: '双重目的方案',
  feasibility: '从下拉菜单选择',
  monitorMode: '现场监盘',
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
    countMethod: '循环盘点',
  }),
  createMethodPlanRow({
    countMethod: '在非期末时点完成盘点',
  }),
  createMethodPlanRow(),
  createMethodPlanRow(),
  createMethodPlanRow(),
  createMethodPlanRow({
    auditApproach: '未识别出重大错报风险（仅限ISA项目）',
  }),
];

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
    { onRowsChange, onBulkImportRows, showBulkImportButton = true },
    ref
  ) {
    const [rows, setRows] = useState<MethodPlanRow[]>(DEFAULT_ROWS);
    const [isSaved, setIsSaved] = useState(false);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [bulkImportValue, setBulkImportValue] = useState('');
    const [recentlyAddedRowIds, setRecentlyAddedRowIds] = useState<string[]>([]);
    const bulkImportTextareaRef = useRef<HTMLTextAreaElement>(null);

    const markUnsaved = () => setIsSaved(false);

    const addRow = () => {
      markUnsaved();
      setRows((current) => [...current, createMethodPlanRow()]);
    };

    const removeRow = (id: string) => {
      markUnsaved();
      setRows((current) => (current.length === 1 ? current : current.filter((row) => row.id !== id)));
    };

    const updateRow = (id: string, field: keyof MethodPlanRow, value: string) => {
      markUnsaved();
      setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    };

    const openBulkImportModal = () => {
      setBulkImportValue('');
      setIsBulkImportOpen(true);
    };

    const closeBulkImportModal = () => {
      setIsBulkImportOpen(false);
      setBulkImportValue('');
    };

    const confirmBulkImport = () => {
      const lines = bulkImportValue
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        closeBulkImportModal();
        return;
      }

      const newRows = lines.map((line) => {
        const parsedAddress = parseChineseAddress(line);

        return createMethodPlanRow({
          province: parsedAddress.province,
          city: parsedAddress.city,
          district: parsedAddress.district,
          address: parsedAddress.fullAddress,
        });
      });

      const newIds = newRows.map((row) => row.id);

      setRows((current) => [...current, ...newRows]);
      setIsSaved(false);
      setRecentlyAddedRowIds(newIds);
      onBulkImportRows?.(newRows);
      closeBulkImportModal();

      window.setTimeout(() => {
        setRecentlyAddedRowIds([]);
      }, 700);
    };

    useEffect(() => {
      onRowsChange?.(rows);
    }, [onRowsChange, rows]);

    useImperativeHandle(ref, () => ({ openBulkImportModal }), []);

    useEffect(() => {
      if (isBulkImportOpen) {
        window.setTimeout(() => {
          bulkImportTextareaRef.current?.focus();
        }, 0);
      }
    }, [isBulkImportOpen]);

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

    const renderTable = () => (
      <div className="overflow-x-auto overscroll-none" onWheel={handleTableWheel}>
        <table className="min-w-[1910px] table-fixed border-collapse text-[13px]">
          <colgroup>
            <col className="w-[36px]" />
            <col className="w-[80px]" />
            <col className="w-[100px]" />
            <col className="w-[80px]" />
            <col className="w-[80px]" />
            <col className="w-[80px]" />
            <col className="w-[85px]" />
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
            <col className="w-[42px]" />
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
              <th className={headerBlue}>毕马威就监盘而计划的审计方案 (Note 6)</th>
              <th className={headerGreen}>毕马威是否被选为监督样本</th>
              <th className={headerBlue}>是否可实施实地监盘</th>
              <th className={headerBlue}>选择存货监盘方法</th>
              <th className={headerBlue}>现场监盘 vs 远程监盘 (Note 2)</th>
              <th className={headerOrange}>计划的监盘日期</th>
              <th className={headerOrange}>提交底稿日期</th>
              <th className={headerBlue}>项目组是否计划引入专家和/或特定项目组成员，包括信息技术审计人员？(Note 3)</th>
              <th className={headerBlue}>项目组是否计划利用内部审计工作获取审计证据？(Note 4)</th>
              <th className={`${headerBlue} ${stickyRightCellClassName}`}>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
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

                <td
                  className={`border border-slate-300 bg-[#fffbd6] p-0 align-middle group-hover:bg-[#fff7bf] ${stickyLeftCellClassNames[2]}`}
                >
                  <textarea
                    className="min-h-[24px] w-full resize-none border-0 bg-transparent px-2 py-1 text-[11px] leading-4 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                    rows={2}
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
                  value={row.inventoryObservationMethod ?? '全面实地盘点'}
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

                <td
                  className={`border border-slate-300 bg-white p-0 text-center align-middle group-hover:bg-slate-50 ${stickyRightCellClassName}`}
                >
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

            <tr className="border-b border-slate-200 bg-white">
              <td
                className={`border border-slate-300 bg-slate-50/30 px-2 py-2 text-center align-middle ${stickyLeftCellClassNames[0]}`}
              >
                <button
                  type="button"
                  onClick={addRow}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition hover:border-blue-500 hover:text-blue-600 hover:shadow-sm active:scale-95"
                  title="新增行"
                >
                  <Plus size={14} />
                </button>
              </td>
              <td
                className={`border border-slate-300 bg-white px-2 py-2 text-[11px] text-slate-400 ${stickyLeftCellClassNames[1]}`}
                colSpan={6}
              >
                新增地点
              </td>
              <td className="border border-slate-300 bg-white px-2 py-2 text-[11px] text-slate-400" colSpan={10}>
                新增地点
              </td>
              <td className={`border border-slate-300 bg-white px-2 py-2 ${stickyRightCellClassName}`} />
            </tr>
          </tbody>
        </table>
      </div>
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
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-500 hover:text-blue-600 hover:shadow-md'
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
            <div className="w-full max-w-2xl rounded-[28px] border border-white/60 bg-white/85 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.25)] backdrop-blur-xl">
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

              <div className="mt-6">
                <textarea
                  ref={bulkImportTextareaRef}
                  value={bulkImportValue}
                  onChange={(event) => setBulkImportValue(event.target.value)}
                  placeholder="上海市浦东新区张江路123号&#10;北京仓 北京市海淀区中关村大街1号"
                  className="min-h-[280px] w-full rounded-2xl border border-gray-200 bg-white/70 px-5 py-4 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  当前将导入 {bulkImportValue.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).length} 行
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
