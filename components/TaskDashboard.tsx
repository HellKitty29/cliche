import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DatePicker, Dropdown } from 'antd';
import dayjs from 'dayjs';
import { CloseSquareTwoTone, LoginOutlined, RocketOutlined } from '@ant-design/icons';
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Edit2,
  FilterX,
  RotateCcw,
  Search,
  Settings,
} from 'lucide-react';
import { LocationInfo, TaskInfo } from '../types';
import ChinaMap from './ChinaMap';
import { normalizeProvinceName } from '../utils/chinaRegions';
import {
  TASK_STATUS_COLOR_MAP,
  getModeVisibleTasks,
  getTaskStatusEntries,
} from '../utils/taskDashboardLogic';

const { RangePicker } = DatePicker;

interface TaskDashboardProps {
  onPrev: () => void;
  tasks: TaskInfo[];
  locations: LocationInfo[];
  onTaskClick?: (taskId: string) => void;
}

const MOCK_TODAY = new Date('2026/01/15').getTime();
const MOCK_TASK_CITY_BY_ID: Record<string, string> = {
  T51116: '上海市',
  T51102: '上海市',
  T51101: '上海市',
  T50701: '上海市',
  T50573: '上海市',
  T50572: '成都市',
  T50127: '广州市',
  T47938: '南昌市',
  T47937: '上海市',
  T45138: '深圳市',
  T45139: '广州市',
  T45140: '成都市',
};
const MOCK_TASK_PLAN_EXECUTION_DATE_BY_ID: Record<string, string> = {
  T51116: '2026/04/18',
  T51102: '2026/01/24',
  T51101: '2026/01/19',
  T50701: '2026/01/03',
  T50573: '2026/01/02',
  T50572: '2026/03/30',
  T50127: '-',
  T47938: '2026/03/22',
  T47937: '2025/12/23',
  T45138: '-',
  T45139: '2026/01/18',
  T45140: '2026/02/02',
};

type TaskDashboardColumnKey =
  | 'engagementId'
  | 'engagementName'
  | 'oakTicketNo'
  | 'taskId'
  | 'projectFlowName'
  | 'companyName'
  | 'province'
  | 'city'
  | 'executor'
  | 'status'
  | 'planExecutionDate'
  | 'planDate';

const taskDashboardTableColumnKeys: TaskDashboardColumnKey[] = [
  'engagementId',
  'engagementName',
  'oakTicketNo',
  'taskId',
  'projectFlowName',
  'companyName',
  'province',
  'city',
  'executor',
  'status',
  'planExecutionDate',
  'planDate',
];

const taskDashboardColumnOptions: Array<{ key: TaskDashboardColumnKey; label: string }> = [
  { key: 'engagementId', label: '项目ID' },
  { key: 'engagementName', label: '项目名称' },
  { key: 'oakTicketNo', label: 'OAK Ticket no.' },
  { key: 'taskId', label: '任务 ID' },
  { key: 'projectFlowName', label: '项目流程名称' },
  { key: 'companyName', label: '受访单位名称' },
  { key: 'province', label: '省份' },
  { key: 'city', label: '市' },
  { key: 'executor', label: '执行人' },
  { key: 'status', label: '当前状态' },
  { key: 'planExecutionDate', label: '计划执行日期' },
  { key: 'planDate', label: '计划提交日期' },
];

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

const SquareDonutChart: React.FC<{
  stats: Record<string, number>;
  total: number;
  completed: number;
}> = ({ stats, total, completed }) => {
  const strokeWidth = 12;
  const width = 140;
  const height = 110;

  const segments = useMemo(() => {
    const perimeter = 2 * (width + height);
    let currentPos = 0;

    return (Object.entries(stats) as Array<[string, number]>)
      .filter(([, count]) => count > 0)
      .map(([name, count]) => {
        const length = total === 0 ? 0 : (count / total) * perimeter;
        const segment = {
          name,
          length,
          start: currentPos,
          color: TASK_STATUS_COLOR_MAP[name] ?? '#6B7280',
        };
        currentPos += length;
        return segment;
      });
  }, [stats, total]);

  return (
    <div className="relative flex flex-col items-center">
      <svg
        width={width + 16}
        height={height + 16}
        viewBox={`-8 -8 ${width + 16} ${height + 16}`}
        className="drop-shadow-sm"
      >
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="white"
          stroke="#f1f5f9"
          strokeWidth="1"
          rx="8"
        />
        {segments.map((segment, index) => {
          const perimeter = 2 * (width + height);
          return (
            <rect
              key={`${segment.name}-${index}`}
              x="0"
              y="0"
              width={width}
              height={height}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segment.length} ${perimeter - segment.length}`}
              strokeDashoffset={-segment.start}
              rx="8"
            />
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-1">
        <span className="text-2xl font-black leading-none tracking-tight text-gray-900">
          {completed}/{total}
        </span>
        <span className="mt-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-gray-400">
          完成进度
        </span>
      </div>
    </div>
  );
};

const TaskDashboard: React.FC<TaskDashboardProps> = ({
  onPrev,
  tasks,
  locations,
  onTaskClick,
}) => {
  const [dashboardMode, setDashboardMode] = useState<'kdc' | 'engagement'>('kdc');
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeLocations = Array.isArray(locations) ? locations : [];
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [isPlanExecutionFilterOpen, setIsPlanExecutionFilterOpen] = useState(false);
  const [selectedPlanExecutionRange, setSelectedPlanExecutionRange] = useState<
    [string | null, string | null]
  >([null, null]);
  const [planExecutionOverdueFilter, setPlanExecutionOverdueFilter] = useState<
    'all' | 'overdue' | 'notOverdue'
  >('all');
  const [isPlanFilterOpen, setIsPlanFilterOpen] = useState(false);
  const [selectedPlanRange, setSelectedPlanRange] = useState<[string | null, string | null]>([
    null,
    null,
  ]);
  const [overdueFilter, setOverdueFilter] = useState<'all' | 'overdue' | 'notOverdue'>('all');
  const [isFieldDrawerOpen, setIsFieldDrawerOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<TaskDashboardColumnKey[]>(
    taskDashboardTableColumnKeys
  );
  const [statusOverrides, setStatusOverrides] = useState<Record<string, TaskInfo['status']>>({});
  const [hiddenRejectedTaskIds, setHiddenRejectedTaskIds] = useState<Set<string>>(() => new Set());
  const rejectRemovalTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const isColumnVisible = (columnKey: TaskDashboardColumnKey) => visibleColumns.includes(columnKey);

  useEffect(() => {
    return () => {
      Object.values(rejectRemovalTimers.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const modeVisibleTasks = useMemo(
    () => getModeVisibleTasks(safeTasks, dashboardMode, statusOverrides, hiddenRejectedTaskIds),
    [safeTasks, dashboardMode, statusOverrides, hiddenRejectedTaskIds]
  );

  const provinceAliasMap = useMemo(() => {
    const aliases = new Map<string, string>();

    safeLocations.forEach((location) => {
      const normalizedProvince = normalizeProvinceName(location.province);

      [location.province, normalizedProvince, location.city].forEach((value) => {
        if (!value || value === '-') return;
        aliases.set(value.trim(), normalizedProvince);
      });
    });

    return aliases;
  }, [safeLocations]);

  const getNormalizedProvince = (value: string) => {
    const trimmedValue = value.trim();
    return provinceAliasMap.get(trimmedValue) ?? normalizeProvinceName(trimmedValue);
  };

  const locationCityByUnit = useMemo(() => {
    const cityMap = new Map<string, string>();

    safeLocations.forEach((location) => {
      if (!location.city || location.city === '-') return;

      [location.companyName, location.targetUnit].forEach((key) => {
        const normalizedKey = key?.trim();
        if (normalizedKey) {
          cityMap.set(normalizedKey, location.city.trim());
        }
      });
    });

    return cityMap;
  }, [safeLocations]);

  const getTaskCity = (task: TaskInfo) => {
    const taskWithOptionalCity = task as TaskInfo & { city?: string };
    const directCity = taskWithOptionalCity.city?.trim();
    if (directCity && directCity !== '-') {
      return directCity;
    }

    const mockCity = MOCK_TASK_CITY_BY_ID[task.id];
    if (mockCity) {
      return mockCity;
    }

    return locationCityByUnit.get(task.companyName.trim()) ?? '';
  };

  const getTaskPlanExecutionDate = (task: TaskInfo) => {
    const directPlanExecutionDate = task.planExecutionDate?.trim();
    if (directPlanExecutionDate) {
      return directPlanExecutionDate;
    }

    return MOCK_TASK_PLAN_EXECUTION_DATE_BY_ID[task.id] ?? '-';
  };

  const statusEntries = useMemo(() => {
    return getTaskStatusEntries(modeVisibleTasks);
  }, [modeVisibleTasks]);

  const colorByStatus = useMemo(
    () => Object.fromEntries(statusEntries.map((entry) => [entry.status, entry.color])),
    [statusEntries]
  );

  const hasPlanDateFilter =
    selectedPlanRange[0] !== null || selectedPlanRange[1] !== null || overdueFilter !== 'all';
  const hasPlanExecutionDateFilter =
    selectedPlanExecutionRange[0] !== null ||
    selectedPlanExecutionRange[1] !== null ||
    planExecutionOverdueFilter !== 'all';

  const matchesDateFilter = (
    dateStr: string,
    selectedRange: [string | null, string | null],
    selectedOverdueFilter: 'all' | 'overdue' | 'notOverdue'
  ) => {
    const parsedDate = parsePlanDate(dateStr);

    if (selectedRange[0]) {
      const start = parsePlanDate(selectedRange[0]);
      if (start !== null && (parsedDate === null || parsedDate < start)) {
        return false;
      }
    }

    if (selectedRange[1]) {
      const end = parsePlanDate(selectedRange[1]);
      if (end !== null && (parsedDate === null || parsedDate > end)) {
        return false;
      }
    }

    if (selectedOverdueFilter === 'overdue') {
      return parsedDate !== null && parsedDate < MOCK_TODAY;
    }

    if (selectedOverdueFilter === 'notOverdue') {
      return parsedDate !== null && parsedDate >= MOCK_TODAY;
    }

    return true;
  };

  const filteredTasks = useMemo(() => {
    return modeVisibleTasks.filter((task) => {
      const matchStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(task.status);
      const taskProvince = getNormalizedProvince(task.province);
      const taskCity = getTaskCity(task);
      const matchProvince =
        selectedProvinces.length === 0 ||
        selectedProvinces.includes(taskProvince);
      const matchCity =
        selectedCities.length === 0 ||
        (taskCity ? selectedCities.includes(taskCity) : selectedProvinces.includes(taskProvince));
      const matchPlanExecutionDate = matchesDateFilter(
        getTaskPlanExecutionDate(task),
        selectedPlanExecutionRange,
        planExecutionOverdueFilter
      );
      const matchPlanDate = matchesDateFilter(task.planDate, selectedPlanRange, overdueFilter);

      return (
        matchStatus &&
        matchProvince &&
        matchCity &&
        matchPlanExecutionDate &&
        matchPlanDate
      );
    });
  }, [
    modeVisibleTasks,
    selectedStatuses,
    selectedProvinces,
    selectedCities,
    selectedPlanExecutionRange,
    planExecutionOverdueFilter,
    selectedPlanRange,
    overdueFilter,
    getNormalizedProvince,
    getTaskCity,
    getTaskPlanExecutionDate,
    matchesDateFilter,
  ]);

  const taskStats = useMemo(() => {
    const filteredStatusCounts = new Map<string, number>();
    filteredTasks.forEach((task) => {
      filteredStatusCounts.set(task.status, (filteredStatusCounts.get(task.status) ?? 0) + 1);
    });

    const stats = Object.fromEntries(
      statusEntries.map((entry) => [entry.status, filteredStatusCounts.get(entry.status) ?? 0])
    ) as Record<string, number>;

    const completedCount = filteredTasks.filter((task) => {
      if (!task.progress.includes('/')) return false;
      const [done, total] = task.progress.split('/');
      return done === total;
    }).length;

    return {
      stats,
      completedCount,
      totalCount: filteredTasks.length,
    };
  }, [filteredTasks, statusEntries]);

  const taskProvinces = useMemo(() => {
    const provinces: string[] = [];
    modeVisibleTasks.forEach((task) => {
      if (task.province && task.province !== '-') {
        provinces.push(getNormalizedProvince(task.province));
      }
    });
    safeLocations.forEach((location) => {
      if (location.province && location.province !== '-') {
        provinces.push(getNormalizedProvince(location.province));
      }
    });
    return provinces;
  }, [safeLocations, modeVisibleTasks, provinceAliasMap]);

  const taskCities = useMemo(() => {
    const cityEntries: Array<{ province: string; city: string }> = [];

    safeLocations.forEach((location) => {
      if (!location.city || location.city === '-') return;
      cityEntries.push({
        province: getNormalizedProvince(location.province || location.city),
        city: location.city.trim(),
      });
    });

    modeVisibleTasks.forEach((task) => {
      const city = getTaskCity(task);
      if (!city || city === '-') return;
      cityEntries.push({
        province: getNormalizedProvince(task.province || city),
        city,
      });
    });

    return cityEntries;
  }, [safeLocations, modeVisibleTasks, provinceAliasMap, locationCityByUnit]);

  const getDateStatus = (dateStr: string) => {
    const parsedDate = parsePlanDate(dateStr);
    if (parsedDate === null) {
      return { label: '-', className: 'text-gray-400', isOverdue: false };
    }

    const isOverdue = parsedDate < MOCK_TODAY;
    return {
      label: formatFilterDate(dateStr),
      className: isOverdue ? 'text-[#d16f79] font-bold' : 'text-green-600 font-medium',
      isOverdue,
    };
  };

  const planExecutionFilterOverlay = (
    <div
      className="w-[300px] rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-800">计划执行日期筛选</div>
          <div className="mt-1 text-xs text-gray-400">选择日期，并按逾期状态进一步筛选</div>
        </div>
        {hasPlanExecutionDateFilter && (
          <button
            type="button"
            onClick={() => {
              setSelectedPlanExecutionRange([null, null]);
              setPlanExecutionOverdueFilter('all');
            }}
            className="text-xs font-medium text-blue-600 transition hover:text-blue-700"
          >
            清空
          </button>
        )}
      </div>

      <RangePicker
        value={[
          selectedPlanExecutionRange[0]
            ? dayjs(selectedPlanExecutionRange[0], 'YYYY/MM/DD')
            : null,
          selectedPlanExecutionRange[1]
            ? dayjs(selectedPlanExecutionRange[1], 'YYYY/MM/DD')
            : null,
        ]}
        onChange={(values) =>
          setSelectedPlanExecutionRange([
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
            const active = planExecutionOverdueFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPlanExecutionOverdueFilter(option.value)}
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

  const planFilterOverlay = (
    <div
      className="w-[300px] rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-800">计划提交日期筛选</div>
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

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((item) => item !== status) : [...prev, status]
    );
  };

  const toggleColumnVisibility = (columnKey: TaskDashboardColumnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const visibleDataColumnCount =
    (dashboardMode === 'kdc' && isColumnVisible('engagementId') ? 1 : 0) +
    (dashboardMode === 'kdc' && isColumnVisible('engagementName') ? 1 : 0) +
    (dashboardMode === 'kdc' && isColumnVisible('oakTicketNo') ? 1 : 0) +
    (isColumnVisible('taskId') ? 1 : 0) +
    (dashboardMode === 'engagement' && isColumnVisible('projectFlowName') ? 1 : 0) +
    (isColumnVisible('companyName') ? 1 : 0) +
    (isColumnVisible('province') ? 1 : 0) +
    (isColumnVisible('city') ? 1 : 0) +
    (isColumnVisible('executor') ? 1 : 0) +
    (isColumnVisible('status') ? 1 : 0) +
    (isColumnVisible('planExecutionDate') ? 1 : 0) +
    (isColumnVisible('planDate') ? 1 : 0);

  const getTicketNumber = (taskId: string) => {
    const numericSeed = taskId.replace(/\D/g, '') || '0';
    return `20260${numericSeed.padStart(8, '0').slice(-8)}`;
  };

  const handleRejectTask = (taskId: string) => {
    setStatusOverrides((prev) => ({
      ...prev,
      [taskId]: '被拒绝' as TaskInfo['status'],
    }));

    if (rejectRemovalTimers.current[taskId]) {
      clearTimeout(rejectRemovalTimers.current[taskId]);
    }

    rejectRemovalTimers.current[taskId] = setTimeout(() => {
      setHiddenRejectedTaskIds((prev) => {
        const next = new Set(prev);
        next.add(taskId);
        return next;
      });
      delete rejectRemovalTimers.current[taskId];
    }, 900);
  };

  return (
    <div className="rounded-xl bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="border-l-4 border-blue-primary pl-3 text-xl font-bold tracking-tight text-gray-800">
          任务列表
        </h2>
        <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => setDashboardMode('kdc')}
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] transition ${
              dashboardMode === 'kdc'
                ? 'bg-blue-primary text-white'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            KDC
          </button>
          <button
            type="button"
            onClick={() => setDashboardMode('engagement')}
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] transition ${
              dashboardMode === 'engagement'
                ? 'bg-blue-primary text-white'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            ENGAGEMENT
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="flex w-full flex-shrink-0 flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50/40 p-6 lg:w-[280px]">
          <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            实时审计进度
          </h3>
          <SquareDonutChart
            stats={taskStats.stats}
            total={taskStats.totalCount}
            completed={taskStats.completedCount}
          />
          <div className="mt-6 flex w-full flex-col space-y-2">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-gray-400">总任务规模</span>
              <span className="text-gray-900">{taskStats.totalCount}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-gray-400">完成占比</span>
              <span className="font-black text-blue-600">
                {taskStats.totalCount === 0
                  ? 0
                  : Math.round((taskStats.completedCount / taskStats.totalCount) * 100)}
                %
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-shrink-0 flex-row gap-2 lg:mr-3 lg:w-[118px] lg:flex-col">
          {statusEntries.map((entry) => {
            const isSelected = selectedStatuses.includes(entry.status);
            return (
              <button
                key={entry.status}
                onClick={() => toggleStatus(entry.status)}
                className={`flex min-h-[56px] flex-1 items-center justify-between rounded-xl px-3 py-2 text-left transition-all duration-200 lg:flex-none
                  ${isSelected ? 'shadow-md ring-1 ring-black/5' : 'bg-white hover:bg-gray-50'}`}
                style={
                  isSelected
                    ? { backgroundColor: entry.tint }
                    : { boxShadow: 'inset 0 0 0 1px rgba(226, 232, 240, 0.35)' }
                }
              >
                <span className="flex items-center space-x-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  ></span>
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">
                    {entry.status}
                  </span>
                </span>
                <span className="text-sm font-black" style={{ color: entry.color }}>
                  {entry.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative h-[360px] flex-1 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:h-[380px] lg:max-w-[760px] lg:-ml-6">
          <ChinaMap
            provinces={taskProvinces}
            cityValues={taskCities}
            selectedProvinces={selectedProvinces}
            selectedCities={selectedCities}
            onSelectionChange={setSelectedProvinces}
            onCitySelectionChange={setSelectedCities}
          />
        </div>
      </div>

      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="搜索任务 ID、受访单位..."
              className="w-full rounded-lg border border-gray-100 py-2.5 pl-11 pr-4 text-sm shadow-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button className="rounded-lg bg-blue-primary px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-110">
            执行检索
          </button>
          <button
            onClick={() => {
              setSelectedStatuses([]);
              setSelectedProvinces([]);
              setSelectedCities([]);
              setSelectedPlanExecutionRange([null, null]);
              setPlanExecutionOverdueFilter('all');
              setSelectedPlanRange([null, null]);
              setOverdueFilter('all');
            }}
            className="flex items-center rounded-lg bg-white px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            <RotateCcw size={14} className="opacity-60" />
          </button>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            {dashboardMode === 'kdc' && (
              <button className="rounded-lg bg-blue-primary px-6 py-2 text-sm text-white shadow-sm transition hover:brightness-110">
                待分配任务
              </button>
            )}
            {dashboardMode === 'kdc' && (
              <button className="rounded-lg bg-blue-primary px-5 py-2 text-sm text-white shadow-sm transition hover:brightness-110">
                批量发送
              </button>
            )}
            <button className="flex items-center rounded-lg border border-gray-200 bg-white px-5 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
              <Download size={14} className="mr-1.5" />{' '}
              {dashboardMode === 'engagement' ? '下载任务清单' : '上传 | 下载任务清单'}
            </button>
          </div>
        </div>

        {(selectedStatuses.length > 0 ||
          selectedProvinces.length > 0 ||
          selectedCities.length > 0 ||
          hasPlanExecutionDateFilter ||
          hasPlanDateFilter) && (
          <div className="flex flex-wrap items-center gap-3">
            {selectedStatuses.length > 0 && (
              <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-gray-800 shadow-sm">
                <span className="mr-3 flex items-center space-x-1.5">
                  {selectedStatuses.map((status) => (
                    <span
                      key={status}
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: colorByStatus[status] || '#6B7280' }}
                    ></span>
                  ))}
                </span>
                当前状态: {selectedStatuses.join(' / ')}
                <button
                  onClick={() => setSelectedStatuses([])}
                  className="ml-3 text-gray-400 transition-colors hover:text-red-500"
                >
                  <FilterX size={14} />
                </button>
              </div>
            )}

            {selectedProvinces.length > 0 && (
              <div className="flex items-center rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-blue-800 shadow-sm">
                地图筛选: {selectedProvinces.join(' / ')}
                <button
                  onClick={() => {
                    setSelectedProvinces([]);
                    setSelectedCities([]);
                  }}
                  className="ml-3 text-blue-400 transition-colors hover:text-red-500"
                >
                  <FilterX size={14} />
                </button>
              </div>
            )}

            {selectedCities.length > 0 && (
              <div className="flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-wider text-slate-700 shadow-sm">
                城市筛选: {selectedCities.join(' / ')}
                <button
                  onClick={() => setSelectedCities([])}
                  className="ml-3 text-gray-400 transition-colors hover:text-red-500"
                >
                  <FilterX size={14} />
                </button>
              </div>
            )}
            {hasPlanExecutionDateFilter && (
              <div className="flex items-center rounded-lg border border-cyan-100 bg-cyan-50 px-4 py-2 text-[11px] font-black tracking-wider text-cyan-800 shadow-sm">
                计划执行日期筛选已启用
                <button
                  onClick={() => {
                    setSelectedPlanExecutionRange([null, null]);
                    setPlanExecutionOverdueFilter('all');
                  }}
                  className="ml-3 text-cyan-500 transition-colors hover:text-red-500"
                >
                  <FilterX size={14} />
                </button>
              </div>
            )}
            {hasPlanDateFilter && (
              <div className="flex items-center rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-2 text-[11px] font-black tracking-wider text-emerald-800 shadow-sm">
                计划提交日期筛选已启用
                <button
                  onClick={() => {
                    setSelectedPlanRange([null, null]);
                    setOverdueFilter('all');
                  }}
                  className="ml-3 text-emerald-500 transition-colors hover:text-red-500"
                >
                  <FilterX size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-50 bg-gray-50/60 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <tr>
              <th className="w-12 px-4 py-3.5 text-center">
                <input
                  type="checkbox"
                  className="rounded-md border-gray-300 text-blue-primary focus:ring-blue-primary"
                />
              </th>
              {dashboardMode === 'kdc' && isColumnVisible('engagementId') && <th className="px-4 py-3.5">项目ID</th>}
              {dashboardMode === 'kdc' && isColumnVisible('engagementName') && <th className="px-4 py-3.5">项目名称</th>}
              {dashboardMode === 'kdc' && isColumnVisible('oakTicketNo') && <th className="px-3 py-3.5">OAK Ticket no.</th>}
              {isColumnVisible('taskId') && <th className="px-4 py-3.5">任务 ID</th>}
              {dashboardMode === 'engagement' && isColumnVisible('projectFlowName') && <th className="px-4 py-3.5">项目流程名称</th>}
              {isColumnVisible('companyName') && <th className="px-4 py-3.5">受访单位名称</th>}
              {isColumnVisible('province') && <th className="px-4 py-3.5">省份</th>}
              {isColumnVisible('city') && <th className="px-4 py-3.5">市</th>}
              {isColumnVisible('executor') && <th className="px-4 py-3.5">执行人</th>}
              {isColumnVisible('status') && <th className="min-w-[118px] px-3 py-3.5">当前状态</th>}
              {/* <th className="px-4 py-3.5">任务进度</th> */}
              {isColumnVisible('planExecutionDate') && <th className="px-3 py-3.5 text-right">
                <Dropdown
                  trigger={['click']}
                  open={isPlanExecutionFilterOpen}
                  onOpenChange={setIsPlanExecutionFilterOpen}
                  dropdownRender={() => planExecutionFilterOverlay}
                >
                  <button
                    type="button"
                    className={`ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition ${
                      hasPlanExecutionDateFilter
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                  >
                    <span>计划执行日期</span>
                    <CalendarDays size={13} />
                    <ChevronDown size={13} />
                  </button>
                </Dropdown>
              </th>}
              {isColumnVisible('planDate') && <th className="px-3 py-3.5 text-right">
                <Dropdown
                  trigger={['click']}
                  open={isPlanFilterOpen}
                  onOpenChange={setIsPlanFilterOpen}
                  dropdownRender={() => planFilterOverlay}
                >
                  <button
                    type="button"
                    className={`ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition ${
                      hasPlanDateFilter
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                  >
                    <span>计划提交日期</span>
                    <CalendarDays size={13} />
                    <ChevronDown size={13} />
                  </button>
                </Dropdown>
              </th>}
              <th className="px-4 py-3.5 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => {
                const city = getTaskCity(task) || '-';
                const planExecutionDateInfo = getDateStatus(getTaskPlanExecutionDate(task));
                const dateInfo = getDateStatus(task.planDate);
                const isRejecting = statusOverrides[task.id] === '被拒绝';

                return (
                  <tr
                    key={task.id}
                    className={`group transition-all duration-500 ease-out hover:bg-gray-50/50 ${
                      isRejecting ? 'translate-x-2 bg-orange-50/80 opacity-70' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5 text-center align-middle">
                      <input
                        type="checkbox"
                        className="rounded-md border-gray-300 text-blue-primary focus:ring-blue-primary"
                      />
                    </td>
                    {dashboardMode === 'kdc' && isColumnVisible('engagementId') && (
                      <td className="px-4 py-3.5 align-middle text-[13px] font-black tracking-tight text-gray-600">
                        {task.EngagementId}
                      </td>
                    )}
                    {dashboardMode === 'kdc' && isColumnVisible('engagementName') && (
                      <td className="px-4 py-3.5 align-middle text-[13px] font-black tracking-tight text-gray-600">
                        {task.EngagementName}
                      </td>
                    )}
                    {dashboardMode === 'kdc' && isColumnVisible('oakTicketNo') && (
                      <td className="px-4 py-3.5 align-middle text-[13px] font-black tracking-tight text-gray-600">
                        {getTicketNumber(task.id)}
                      </td>
                    )}
                    {isColumnVisible('taskId') && <td className="px-4 py-3.5 align-middle text-[13px] font-black tracking-tight text-gray-600">
                      {task.id}
                    </td>}
                    {dashboardMode === 'engagement' && isColumnVisible('projectFlowName') && (
                      <td className="px-4 py-3.5 align-middle text-[13px] font-black tracking-tight text-gray-600">
                        {task.companyName}
                      </td>
                    )}
                    {isColumnVisible('companyName') && <td className="px-4 py-3.5 align-middle font-bold text-gray-600">
                      {task.companyName}
                    </td>}
                    {isColumnVisible('province') && <td className="px-4 py-3.5 align-middle font-medium text-gray-500">
                      {task.province}
                    </td>}
                    {isColumnVisible('city') && <td className="px-4 py-3.5 align-middle font-medium text-gray-500">
                      {city}
                    </td>}
                    {isColumnVisible('executor') && <td className="px-4 py-3.5 align-middle text-[11px] font-medium text-gray-500">
                      {task.executor}
                    </td>}
                    {isColumnVisible('status') && <td className="min-w-[118px] px-3 py-3.5 align-middle">
                      <span className="inline-flex items-center whitespace-nowrap">
                        <span
                          className="mr-2.5 h-1.5 w-1.5 rounded-full shadow-sm"
                          style={{
                            backgroundColor: colorByStatus[task.status] || '#6B7280',
                          }}
                        ></span>
                        <span className="whitespace-nowrap text-[11px] font-black tracking-tighter text-gray-600">
                          {task.status}
                        </span>
                      </span>
                    </td>}
                    {/* <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center space-x-3">
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-gray-100 shadow-inner">
                          <div
                            className="h-full bg-blue-primary transition-all duration-1000 ease-out"
                            style={{
                              width: task.progress.includes('/')
                                ? `${(parseInt(task.progress.split('/')[0]) /
                                    parseInt(task.progress.split('/')[1])) * 100}%`
                                : '0%',
                            }}
                          ></div>
                        </div>
                        <span className="tabular-nums text-[10px] font-black text-gray-500">
                          {task.progress}
                        </span>
                      </div>
                    </td> */}
                    {isColumnVisible('planExecutionDate') && <td className="px-4 py-3.5 align-middle">
                      <div className={`flex items-center space-x-2 text-[11px] ${planExecutionDateInfo.className}`}>
                        {planExecutionDateInfo.isOverdue ? (
                          <AlertCircle size={12} strokeWidth={3} />
                        ) : (
                          <Clock size={12} className="opacity-30" />
                        )}
                        <span className="tabular-nums">{planExecutionDateInfo.label}</span>
                      </div>
                    </td>}
                    {isColumnVisible('planDate') && <td className="px-4 py-3.5 align-middle">
                      <div className={`flex items-center space-x-2 text-[11px] ${dateInfo.className}`}>
                        {dateInfo.isOverdue ? (
                          <AlertCircle size={12} strokeWidth={3} />
                        ) : (
                          <Clock size={12} className="opacity-30" />
                        )}
                        <span className="tabular-nums">{dateInfo.label}</span>
                      </div>
                    </td>}
                    <td className="px-4 py-3.5 text-right align-middle">
                      <div className="flex justify-end gap-3 text-gray-300 transition-opacity group-hover:text-gray-400">
                        <button className="transition-all hover:scale-110 hover:text-blue-primary active:scale-95">
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onTaskClick?.(task.id)}
                          className="transition-all hover:scale-110 hover:text-blue-primary active:scale-95"
                        >
                          <LoginOutlined />
                        </button>
                        {dashboardMode === 'kdc' && (
                          <button
                            type="button"
                            title="拒绝"
                            onClick={() => handleRejectTask(task.id)}
                            className="transition-all hover:scale-110 hover:text-blue-primary active:scale-95"
                          >
                            <CloseSquareTwoTone twoToneColor="#9ca3af" />
                          </button>
                        )}
                        {dashboardMode === 'kdc' && (
                          <button
                            title="发送给项目组"
                            className="transition-all hover:scale-110 hover:text-blue-primary active:scale-95"
                          >
                            <RocketOutlined />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={visibleDataColumnCount + 2}
                  className="px-4 py-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-gray-300">
                    <FilterX size={48} className="mb-4 animate-pulse opacity-10" />
                    <p className="text-sm font-bold italic tracking-wider text-gray-400">
                      未发现匹配的审计任务记录
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
        <button
          type="button"
          onClick={() => setIsFieldDrawerOpen((prev) => !prev)}
          className={`field-settings-trigger group/field absolute right-0 top-10 z-30 flex h-6 max-w-[132px] translate-x-0 items-center justify-start overflow-hidden rounded-l-lg border border-r-0 shadow-sm transition-all duration-300 ${
            isFieldDrawerOpen
              ? 'w-[132px] border-blue-600 bg-[#1b328a] text-white'
              : 'w-8 border-gray-200 bg-gray-50 text-gray-500 hover:w-[132px] hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
          }`}
          aria-label="字段设置"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center">
            <Settings
              key={isFieldDrawerOpen ? 'task-field-settings-open' : 'task-field-settings-closed'}
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
          className={`absolute right-0 top-10 z-20 flex h-[calc(100%-2.5rem)] w-[520px] flex-col border-l border-gray-200 bg-white shadow-2xl transition-all duration-300 ease-out ${
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
            项目字段仅在 KDC 视图中显示，项目流程名称仅在 ENGAGEMENT 视图中显示。
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-3 gap-x-5 gap-y-2">
              {taskDashboardColumnOptions.map((column) => {
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
              onClick={() => setVisibleColumns(taskDashboardTableColumnKeys)}
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
  );
};

export default TaskDashboard;
