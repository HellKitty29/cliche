import React, { useMemo, useState } from 'react';
import { CloseSquareTwoTone, LoginOutlined, RocketOutlined } from '@ant-design/icons';
import {
  AlertCircle,
  Clock,
  Download,
  Edit2,
  FilterX,
  RotateCcw,
  Search,
} from 'lucide-react';
import { LocationInfo, TaskInfo } from '../types';
import ChinaMap from './ChinaMap';
import { normalizeProvinceName } from '../utils/chinaRegions';

interface TaskDashboardProps {
  onPrev: () => void;
  tasks: TaskInfo[];
  locations: LocationInfo[];
  onTaskClick?: (taskId: string) => void;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  '已选定': '#e6e6e6',
  '已指派': '#5d9bce',
  '被拒绝': '#ef7c33',
  '已接受': '#00328b',
  '执行中': '#a5a5a5',
  '已提交': '#febf00',
  '已复核': '#6fad49',
  '宸查€夊畾': '#e6e6e6',
  '宸叉寚娲?': '#5d9bce',
  '琚嫆缁?': '#ef7c33',
  '宸叉帴鍙?': '#00328b',
  '鎵ц涓?': '#a5a5a5',
  '宸叉彁浜?': '#febf00',
  '宸插鏍?': '#6fad49',
};

const STATUS_ORDER = [
  '\u5df2\u9009\u5b9a',
  '\u5df2\u6307\u6d3e',
  '\u88ab\u62d2\u7edd',
  '\u5df2\u63a5\u53d7',
  '\u6267\u884c\u4e2d',
  '\u5df2\u63d0\u4ea4',
  '\u5df2\u590d\u6838',
  '\u88ab\u590d\u6838',
  '\u5df2\u5e9f\u9664',
];

const getStatusOrderIndex = (status: string) => {
  const index = STATUS_ORDER.indexOf(status);
  return index === -1 ? STATUS_ORDER.length : index;
};

const STATUS_COLORS = ['#5d9bce', '#00328b', '#a5a5a5', '#febf00', '#6fad49', '#e6e6e6'];
const MOCK_TODAY = new Date('2026/01/15').getTime();

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
      .map(([name, count], index) => {
        const length = total === 0 ? 0 : (count / total) * perimeter;
        const segment = {
          name,
          length,
          start: currentPos,
          color: STATUS_COLOR_MAP[name] ?? STATUS_COLORS[index % STATUS_COLORS.length],
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

  const statusEntries = useMemo(() => {
    const counts = new Map<string, number>();
    safeTasks.forEach((task) => {
      counts.set(task.status, (counts.get(task.status) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .sort(([statusA], [statusB]) => getStatusOrderIndex(statusA) - getStatusOrderIndex(statusB))
      .map(([status, count], index) => {
        const color = STATUS_COLOR_MAP[status] ?? STATUS_COLORS[index % STATUS_COLORS.length];
        return {
          status,
          count,
          color,
          tint: `${color}14`,
        };
      });
  }, [safeTasks]);

  const colorByStatus = useMemo(
    () => Object.fromEntries(statusEntries.map((entry) => [entry.status, entry.color])),
    [statusEntries]
  );

  const filteredTasks = useMemo(() => {
    return safeTasks.filter((task) => {
      const matchStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(task.status);
      const matchProvince =
        selectedProvinces.length === 0 ||
        selectedProvinces.includes(getNormalizedProvince(task.province));
      return matchStatus && matchProvince;
    });
  }, [safeTasks, selectedStatuses, selectedProvinces, provinceAliasMap]);

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
    const provinces = new Set<string>();
    safeTasks.forEach((task) => {
      if (task.province && task.province !== '-') {
        provinces.add(getNormalizedProvince(task.province));
      }
    });
    safeLocations.forEach((location) => {
      if (location.province && location.province !== '-') {
        provinces.add(getNormalizedProvince(location.province));
      }
    });
    return Array.from(provinces);
  }, [safeLocations, safeTasks, provinceAliasMap]);

  const getDateStatus = (dateStr: string) => {
    if (!dateStr || dateStr === '-') {
      return { label: '-', className: 'text-gray-400', isOverdue: false };
    }

    const isOverdue = new Date(dateStr).getTime() < MOCK_TODAY;
    return {
      label: dateStr,
      className: isOverdue ? 'text-[#d16f79] font-bold' : 'text-green-600 font-medium',
      isOverdue,
    };
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((item) => item !== status) : [...prev, status]
    );
  };

  const getTicketNumber = (taskId: string) => {
    const numericSeed = taskId.replace(/\D/g, '') || '0';
    return `20260${numericSeed.padStart(8, '0').slice(-8)}`;
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
            selectedProvinces={selectedProvinces}
            onSelectionChange={setSelectedProvinces}
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
            }}
            className="flex items-center rounded-lg bg-white px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            <RotateCcw size={14} className="opacity-60" />
          </button>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            {dashboardMode === 'kdc' && (
              <button className="rounded-lg bg-blue-primary px-7 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-110">
                批量发送
              </button>
            )}
            <button className="flex items-center rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
              <Download size={14} className="mr-1.5" />{' '}
              {dashboardMode === 'engagement' ? '下载任务清单' : '上传 | 下载任务清单'}
            </button>
          </div>
        </div>

        {(selectedStatuses.length > 0 || selectedProvinces.length > 0) && (
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
                  onClick={() => setSelectedProvinces([])}
                  className="ml-3 text-blue-400 transition-colors hover:text-red-500"
                >
                  <FilterX size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-50 bg-gray-50/60 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <tr>
              <th className="w-12 px-4 py-3.5 text-center">
                <input
                  type="checkbox"
                  className="rounded-md border-gray-300 text-blue-primary focus:ring-blue-primary"
                />
              </th>
              {dashboardMode === 'kdc' && <th className="px-4 py-3.5">项目ID</th>}
              {dashboardMode === 'kdc' && <th className="px-4 py-3.5">项目名称</th>}
              {dashboardMode === 'kdc' && <th className="px-3 py-3.5">OAK Ticket no.</th>}
              <th className="px-4 py-3.5">任务 ID</th>
              {dashboardMode === 'engagement' && <th className="px-4 py-3.5">项目流程名称</th>}
              <th className="px-4 py-3.5">受访单位名称</th>
              <th className="px-4 py-3.5">省份</th>
              <th className="px-4 py-3.5">执行人</th>
              <th className="min-w-[118px] px-3 py-3.5">当前状态</th>
              {/* <th className="px-4 py-3.5">任务进度</th> */}
              <th className="px-3 py-3.5 text-right">最迟提交日期</th>
              <th className="px-4 py-3.5 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => {
                const dateInfo = getDateStatus(task.planDate);

                return (
                  <tr key={task.id} className="group transition-colors hover:bg-gray-50/50">
                    <td className="px-4 py-3.5 text-center align-middle">
                      <input
                        type="checkbox"
                        className="rounded-md border-gray-300 text-blue-primary focus:ring-blue-primary"
                      />
                    </td>
                    {dashboardMode === 'kdc' && (
                      <td className="px-4 py-3.5 align-middle text-[13px] font-black tracking-tight text-gray-600">
                        {task.EngagementId}
                      </td>
                    )}
                    {dashboardMode === 'kdc' && (
                      <td className="px-4 py-3.5 align-middle text-[13px] font-black tracking-tight text-gray-600">
                        {task.EngagementName}
                      </td>
                    )}
                    {dashboardMode === 'kdc' && (
                      <td className="px-4 py-3.5 align-middle text-[13px] font-black tracking-tight text-gray-600">
                        {getTicketNumber(task.id)}
                      </td>
                    )}
                    <td className="px-4 py-3.5 align-middle text-[13px] font-black tracking-tight text-gray-600">
                      {task.id}
                    </td>
                    {dashboardMode === 'engagement' && (
                      <td className="px-4 py-3.5 align-middle text-[13px] font-black tracking-tight text-gray-600">
                        {task.companyName}
                      </td>
                    )}
                    <td className="px-4 py-3.5 align-middle font-bold text-gray-600">
                      {task.companyName}
                    </td>
                    <td className="px-4 py-3.5 align-middle font-medium text-gray-500">
                      {task.province}
                    </td>
                    <td className="px-4 py-3.5 align-middle text-[11px] font-medium text-gray-500">
                      {task.executor}
                    </td>
                    <td className="min-w-[118px] px-3 py-3.5 align-middle">
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
                    </td>
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
                    <td className="px-4 py-3.5 align-middle">
                      <div className={`flex items-center space-x-2 text-[11px] ${dateInfo.className}`}>
                        {dateInfo.isOverdue ? (
                          <AlertCircle size={12} strokeWidth={3} />
                        ) : (
                          <Clock size={12} className="opacity-30" />
                        )}
                        <span className="tabular-nums">{dateInfo.label}</span>
                      </div>
                    </td>
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
                  colSpan={dashboardMode === 'kdc' ? 12 : 9}
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
    </div>
  );
};

export default TaskDashboard;
