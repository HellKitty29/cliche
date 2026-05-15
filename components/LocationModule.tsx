import React, { useRef, useState } from 'react';
import { DatePicker, Dropdown } from 'antd';
import dayjs from 'dayjs';
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Edit2,
  Plus,
  Send,
  Settings,
  Trash2,
  Upload,
} from 'lucide-react';
import AddLocationModal from './AddLocationModal';
import { LOCATIONS } from '../constants';
import { LocationInfo } from '../types';

const { RangePicker } = DatePicker;

interface LocationModuleProps {
  onAction?: () => void;
}

export const TASK_EXECUTION_GUIDE =
  '在这里您可以上传审计地点的 Excel 文件。一个地点对应一个审计任务。您也可以在任务发布前调整地点列表，分配执行人员。';

const statusLabelMap: Record<LocationInfo['status'], string> = {
  Executing: '执行中',
  Closed: '已关闭',
  Selected: '预选定',
  Accepted: '已接受',
};

const statusColorMap: Record<LocationInfo['status'], string> = {
  Executing: '#a5a5a5',
  Closed: '#6b7280',
  Selected: '#e6e6e6',
  Accepted: '#01328e',
};

const MOCK_TODAY = new Date('2026/01/15').getTime();

const parsePlanDate = (dateStr: string) => {
  if (!dateStr || dateStr === '-') return null;

  const normalized = dateStr.replace(/\./g, '/').replace(/-/g, '/');
  const timestamp = new Date(normalized).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const formatFilterDate = (dateStr: string) => {
  const parsed = parsePlanDate(dateStr);
  return parsed ? dayjs(parsed).format('YYYY/MM/DD') : dateStr;
};

type LocationColumnKey =
  | 'id'
  | 'targetCode'
  | 'companyName'
  | 'targetUnit'
  | 'targetDistrict'
  | 'province'
  | 'city'
  | 'detailAddress'
  | 'isSelected'
  | 'executor'
  | 'contactName'
  | 'otherInfo'
  | 'locationMark'
  | 'lastSubmitDate'
  | 'lastSubmitter'
  | 'planDate'
  | 'actualExecutionDate'
  | 'currentYearAmount'
  | 'previousYearAmount'
  | 'status';

const tableSupportedColumnKeys: LocationColumnKey[] = [
  'id',
  'companyName',
  'targetUnit',
  'province',
  'city',
  'isSelected',
  'executor',
  'lastSubmitDate',
  'planDate',
  'status',
];

const locationColumnOptions: Array<{ key: LocationColumnKey; label: string }> = [
  { key: 'id', label: '序号' },
  { key: 'targetCode', label: '受访单位编码' },
  { key: 'targetDistrict', label: '受访单位所在 区' },
  { key: 'executor', label: '执行人邮箱' },
  { key: 'contactName', label: '联系人姓名' },
  { key: 'otherInfo', label: '其他信息' },
  { key: 'locationMark', label: '地点标识' },
  { key: 'companyName', label: '所属公司名称' },
  { key: 'province', label: '受访单位所在 省/地区' },
  { key: 'detailAddress', label: '受访单位所在 详细地址' },
  { key: 'lastSubmitDate', label: '最迟提交日期' },
  { key: 'currentYearAmount', label: '存货 本年金额' },
  { key: 'status', label: '任务状态' },
  { key: 'targetUnit', label: '受访单位名称' },
  { key: 'city', label: '受访单位所在 市' },
  { key: 'isSelected', label: '是否预选' },
  { key: 'planDate', label: '计划执行日期' },
  { key: 'actualExecutionDate', label: '联系/执行日期' },
  { key: 'previousYearAmount', label: '存货 上年金额' },
];

const LocationModule: React.FC<LocationModuleProps> = ({ onAction }) => {
  const [currentLocations, setCurrentLocations] = useState<LocationInfo[]>(LOCATIONS);
  const [guideText, setGuideText] = useState(TASK_EXECUTION_GUIDE);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [isFieldDrawerOpen, setIsFieldDrawerOpen] = useState(false);
  const [isPlanFilterOpen, setIsPlanFilterOpen] = useState(false);
  const [selectedPlanRange, setSelectedPlanRange] = useState<[string | null, string | null]>([
    null,
    null,
  ]);
  const [overdueFilter, setOverdueFilter] = useState<'all' | 'overdue' | 'notOverdue'>('all');
  const [visibleColumns, setVisibleColumns] = useState<LocationColumnKey[]>(
    tableSupportedColumnKeys
  );
  const editableRef = useRef<HTMLParagraphElement>(null);
  const isColumnVisible = (columnKey: LocationColumnKey) => visibleColumns.includes(columnKey);

  const toggleSelection = (id: number) => {
    setCurrentLocations((prev) =>
      prev.map((loc) => (loc.id === id ? { ...loc, isSelected: !loc.isSelected } : loc))
    );
  };

  const handleAction = () => {
    onAction?.();
  };

  const handleBlur = () => {
    if (editableRef.current) {
      setGuideText(editableRef.current.innerText);
    }
  };

  const handleAddLocationConfirm = () => {
    setIsAddLocationModalOpen(false);
  };

  const toggleColumnVisibility = (columnKey: LocationColumnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const getDateStatus = (dateStr: string) => {
    const parsedDate = parsePlanDate(dateStr);
    if (parsedDate === null) {
      return { label: '-', className: 'text-gray-400', isOverdue: false };
    }

    const isOverdue = parsedDate < MOCK_TODAY;
    return {
      label: formatFilterDate(dateStr),
      className: isOverdue ? 'font-bold text-[#d16f79]' : 'font-medium text-green-600',
      isOverdue,
    };
  };

  const hasPlanDateFilter =
    selectedPlanRange[0] !== null || selectedPlanRange[1] !== null || overdueFilter !== 'all';

  const filteredLocations = currentLocations.filter((loc) => {
    const parsedDate = parsePlanDate(loc.planDate);

    if (selectedPlanRange[0]) {
      const start = parsePlanDate(selectedPlanRange[0]);
      if (start !== null && (parsedDate === null || parsedDate < start)) {
        return false;
      }
    }

    if (selectedPlanRange[1]) {
      const end = parsePlanDate(selectedPlanRange[1]);
      if (end !== null && (parsedDate === null || parsedDate > end)) {
        return false;
      }
    }

    if (overdueFilter === 'overdue') {
      return parsedDate !== null && parsedDate < MOCK_TODAY;
    }

    if (overdueFilter === 'notOverdue') {
      return parsedDate !== null && parsedDate >= MOCK_TODAY;
    }

    return true;
  });

  const planFilterOverlay = (
    <div
      className="w-[300px] rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-800">计划执行日期筛选</div>
          <div className="mt-1 text-xs text-gray-400">选择日期，并按逾期状态进一步筛选</div>
        </div>
        {hasPlanDateFilter && (
          <button
            type="button"
            onClick={() => {
              setSelectedPlanRange([null, null]);
              setOverdueFilter('all');
            }}
            className="text-xs font-medium text-blue-600 transition hover:text-blue-700"
          >
            清空
          </button>
        )}
      </div>

      <RangePicker
        value={[
          selectedPlanRange[0] ? dayjs(selectedPlanRange[0], 'YYYY/MM/DD') : null,
          selectedPlanRange[1] ? dayjs(selectedPlanRange[1], 'YYYY/MM/DD') : null,
        ]}
        onChange={(values) =>
          setSelectedPlanRange([
            values?.[0] ? values[0].format('YYYY/MM/DD') : null,
            values?.[1] ? values[1].format('YYYY/MM/DD') : null,
          ])
        }
        allowClear
        placeholder={['开始日期', '结束日期']}
        format="YYYY/MM/DD"
        className="mb-4 w-full"
      />

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
          逾期状态
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all' as const, label: '全部' },
            { value: 'overdue' as const, label: '已逾期' },
            { value: 'notOverdue' as const, label: '未逾期' },
          ].map((option) => {
            const active = overdueFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setOverdueFilter(option.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="border-l-4 border-blue-600 pl-3 text-xl font-bold">地点管理</h2>
          <div className="ml-6 flex items-center space-x-6 text-sm text-gray-500">
            <span>
              地点总数: <span className="font-bold text-gray-900">{filteredLocations.length}</span>
            </span>
            <span>
              地点数量覆盖率: <span className="font-bold text-gray-900">80.00%</span>
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="flex items-center rounded border border-gray-300 px-4 py-1.5 text-sm shadow-sm transition hover:bg-gray-50">
            多程序地点管理
          </button>
          <button className="flex items-center rounded bg-blue-600 px-4 py-1.5 text-sm text-white shadow-sm transition hover:bg-blue-700">
            发布任务 <Send size={14} className="ml-1" />
          </button>
        </div>
      </div>

      <div className="group mb-8">
        <div className="location-guide-editor rounded-lg border border-blue-100 bg-blue-50 p-4 transition-all duration-300 hover:ring-2 hover:ring-blue-200 focus-within:bg-white">
          <h4 className="mb-1 text-sm font-bold text-blue-900">任务执行指引</h4>
          <p
            ref={editableRef}
            contentEditable
            onBlur={handleBlur}
            suppressContentEditableWarning
            className="min-h-[1.25rem] cursor-text text-sm leading-relaxed text-blue-800 opacity-90 outline-none"
          >
            {guideText}
          </p>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700">地点信息汇总表</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleAction}
            className="flex items-center rounded bg-blue-600 px-3 py-1 text-sm text-white transition hover:bg-blue-700"
          >
            <Upload size={14} className="mr-1" /> 上传全部地点
          </button>
          <button className="flex items-center rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
            <Download size={14} className="mr-1" /> 导出列表
          </button>
          <button className="flex items-center rounded border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50">
            <Trash2 size={14} className="mr-1" /> 删除
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="group absolute left-[-0.9rem] top-[3.3rem] z-[100] translate-x-0.5 -translate-y-1/2">
          <button
            onClick={() => setIsAddLocationModalOpen(true)}
            aria-label="添加地点"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-[#1b328a] text-white shadow-md transition hover:border-sky-0 hover:bg-sky-200 hover:text-white"
          >
            <Plus size={11} strokeWidth={3.5} />
          </button>
          <span className="pointer-events-none absolute left-full top-1/2 z-[101] ml-2 -translate-y-1/2 whitespace-nowrap text-[10px] text-gray-800 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            新增地点
          </span>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="w-10 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              {isColumnVisible('id') && <th className="px-4 py-3">序号</th>}
              {isColumnVisible('companyName') && <th className="px-4 py-3">所属公司名称</th>}
              {isColumnVisible('targetUnit') && <th className="px-4 py-3">受访单位名称</th>}
              {isColumnVisible('province') && <th className="px-4 py-3">受访单位所在省/地区</th>}
              {isColumnVisible('city') && <th className="px-4 py-3">受访单位所在市</th>}
              {isColumnVisible('isSelected') && <th className="px-4 py-3 text-center">是否预选</th>}
              {isColumnVisible('executor') && <th className="px-4 py-3">执行人邮箱</th>}
              {isColumnVisible('lastSubmitDate') && <th className="px-4 py-3">最近提交日期</th>}
              {isColumnVisible('planDate') && (
                <th className="px-4 py-3">
                  <Dropdown
                    trigger={['click']}
                    open={isPlanFilterOpen}
                    onOpenChange={setIsPlanFilterOpen}
                    dropdownRender={() => planFilterOverlay}
                  >
                    <button
                      type="button"
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition ${
                        hasPlanDateFilter
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                      }`}
                    >
                      <span>计划执行日期</span>
                      <CalendarDays size={13} />
                      <ChevronDown size={13} />
                    </button>
                  </Dropdown>
                </th>
              )}
              {isColumnVisible('status') && <th className="min-w-[110px] px-6 py-3">状态</th>}
              <th className="px-12 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredLocations.map((loc) => {
              const dateInfo = getDateStatus(loc.planDate);
              const statusColor = statusColorMap[loc.status] ?? '#94a3b8';

              return (
                <tr key={loc.id} className="transition-colors hover:bg-gray-50">
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                {isColumnVisible('id') && <td className="px-4 py-3">{loc.id}</td>}
                {isColumnVisible('companyName') && <td className="px-4 py-3">{loc.companyName}</td>}
                {isColumnVisible('targetUnit') && <td className="px-4 py-3">{loc.targetUnit}</td>}
                {isColumnVisible('province') && <td className="px-4 py-3">{loc.province}</td>}
                {isColumnVisible('city') && <td className="px-4 py-3">{loc.city}</td>}
                {isColumnVisible('isSelected') && <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleSelection(loc.id)}
                    className={`relative h-5 w-10 rounded-full transition-colors duration-200 ${
                      loc.isSelected ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        loc.isSelected ? 'translate-x-5.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </td>}
                {isColumnVisible('executor') && <td className="px-4 py-3 text-gray-600">{loc.executor}</td>}
                {isColumnVisible('lastSubmitDate') && <td className="px-4 py-3 text-gray-500">{loc.lastSubmitDate}</td>}
                {isColumnVisible('planDate') && <td className="px-4 py-3">
                  <div className={`flex items-center space-x-1 text-[11px] ${dateInfo.className}`}>
                    {dateInfo.isOverdue ? (
                      <AlertCircle size={12} />
                    ) : (
                      <Clock size={12} className="opacity-60" />
                    )}
                    <span>{dateInfo.label}</span>
                  </div>
                </td>}
                {isColumnVisible('status') && <td className="min-w-[110px] px-4 py-3">
                  <span className="inline-flex items-center whitespace-nowrap">
                    <span
                      className="mr-2 h-2 w-2 rounded-full"
                      style={{ backgroundColor: statusColor }}
                    />
                    <span className="whitespace-nowrap text-xs font-bold text-gray-700">{statusLabelMap[loc.status]}</span>
                  </span>
                </td>}
                <td className="px-12 py-3 text-right">
                  <div className="flex justify-end space-x-2 text-gray-400">
                    <button className="transition-colors hover:text-blue-600">
                      <Edit2 size={16} />
                    </button>
                    <button className="transition-colors hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        <button
          type="button"
          onClick={() => setIsFieldDrawerOpen((prev) => !prev)}
          className={`field-settings-trigger group/field absolute right-0 top-2 z-30 flex h-6 max-w-[132px] translate-x-0 items-center justify-start overflow-hidden rounded-l-lg border border-r-0 shadow-sm transition-all duration-300 ${
            isFieldDrawerOpen
              ? 'w-[132px] border-blue-600 bg-[#1b328a] text-white'
              : 'w-8 border-gray-200 bg-gray-50 text-gray-500 hover:w-[132px] hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
          }`}
          aria-label="字段设置"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center">
            <Settings
              key={isFieldDrawerOpen ? 'field-settings-open' : 'field-settings-closed'}
              size={16}
              className={`field-settings-gear transition-transform duration-500 ${
                isFieldDrawerOpen ? 'field-settings-gear-roll' : ''
              }`}
            />
          </span>
          <span
            className={`whitespace-nowrap text-sm font-medium transition-opacity duration-200 ${
              isFieldDrawerOpen ? 'opacity-100' : 'opacity-0 group-hover/field:opacity-100'
            }`}
          >
            字段设置
          </span>
          <ChevronRight
            size={12}
            className={`ml-1 shrink-0 transition-opacity duration-200 ${
              isFieldDrawerOpen ? 'opacity-80' : 'opacity-0 group-hover/field:opacity-30'
            }`}
          />
        </button>
        <div
          className={`absolute right-0 top-0 z-20 flex h-full w-[520px] flex-col border-l border-gray-200 bg-white shadow-2xl transition-all duration-300 ease-out ${
            isFieldDrawerOpen ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-full opacity-0'
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-4">
            <h4 className="text-sm font-bold text-gray-800">字段显示设置</h4>
            <button
              type="button"
              onClick={() => setIsFieldDrawerOpen(false)}
              className="rounded-md p-1 text-gray-500 transition hover:bg-gray-200 hover:text-gray-800"
              aria-label="关闭字段设置"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="border-b border-gray-50 px-2 py-1 text-[11px] text-gray-400">
            可配置字段较多，未在当前表格中实现的字段会先保留为配置项。
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-3 gap-x-5 gap-y-2">
            {locationColumnOptions.map((column) => {
              const isVisible = isColumnVisible(column.key);

              return (
                <label
                  key={column.key}
                  className="group flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-1 py-1 text-[13px] transition hover:border-gray-100 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => toggleColumnVisibility(column.key)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{column.label}</span>
                </label>
              );
            })}
            </div>
          </div>
          <div className="flex gap-2 border-t border-gray-100 p-4">
            <button
              type="button"
              onClick={() => setVisibleColumns(tableSupportedColumnKeys)}
              className="flex-1 rounded-md border border-gray-200 py-1.5 text-xs text-gray-700 transition hover:bg-gray-50"
            >
              重置
            </button>
            <button
              type="button"
              onClick={() => setIsFieldDrawerOpen(false)}
              className="flex-1 rounded-md bg-blue-600 py-1.5 text-xs text-white shadow-sm shadow-blue-100 transition hover:bg-blue-700"
            >
              保存设置
            </button>
          </div>
        </div>
      </div>
      </div>

      <AddLocationModal
        isOpen={isAddLocationModalOpen}
        onClose={() => setIsAddLocationModalOpen(false)}
        onConfirm={handleAddLocationConfirm}
      />
    </div>
  );
};

export default LocationModule;
