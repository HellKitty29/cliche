import React, { useMemo, useState } from 'react';
import { LoginOutlined } from '@ant-design/icons';
import { Button, DatePicker, Dropdown } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  Clock,
  Download,
  Edit2,
  RotateCcw,
  Search,
  Settings,
  X,
} from 'lucide-react';
import { TaskInfo } from '../types';

const { RangePicker } = DatePicker;

interface TaskModuleProps {
  tasks?: TaskInfo[];
  onTaskClick?: (taskId: string) => void;
}

interface ChartDatum {
  label: string;
  value: number;
  color: string;
  isSelected: boolean;
}

type OverdueFilter = 'all' | 'overdue' | 'notOverdue';
type AmountUnit = 'mCny' | 'million';
type MetricKey =
  | 'currentYearAmount'
  | 'previousYearAmount'
  | 'currentYearQuantity'
  | 'previousYearQuantity'
  | 'salesAmount';

const STATUS_COLOR_MAP: Record<string, string> = {
  已选定: '#e6e6e6',
  已提交: '#fcbe03',
  执行中: '#a5a5a5',
  已指派: '#5499dc',
  已复核: '#6dae49',
  已接受: '#01328e',
  被拒绝: '#ed7d32',
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

const FALLBACK_STATUS_COLORS = [
  '#5B9BD5',
  '#002D72',
  '#A5A5A5',
  '#FFC000',
  '#70AD47',
  '#ED7D31',
  '#7f7f7f',
];

const AMOUNT_UNIT_LABELS: Record<AmountUnit, string> = {
  mCny: 'M CNY',
  million: '百万',
};

const METRIC_OPTIONS: Array<{ key: MetricKey; label: string; unit: 'amount' | 'quantity' }> = [
  { key: 'currentYearAmount', label: '存货 本年金额', unit: 'amount' },
  { key: 'previousYearAmount', label: '存货 上年金额', unit: 'amount' },
  { key: 'currentYearQuantity', label: '存货 本年数量', unit: 'quantity' },
  { key: 'previousYearQuantity', label: '存货 上年数量', unit: 'quantity' },
  { key: 'salesAmount', label: '销售额', unit: 'amount' },
];

const TASK_AMOUNT_FALLBACKS: Record<
  string,
  Record<MetricKey, number>
> = {
  T51116: { currentYearAmount: 12.4, previousYearAmount: 10.8, currentYearQuantity: 760, previousYearQuantity: 690, salesAmount: 42.5 },
  T51102: { currentYearAmount: 31.8, previousYearAmount: 29.6, currentYearQuantity: 1820, previousYearQuantity: 1740, salesAmount: 88.2 },
  T51101: { currentYearAmount: 24.5, previousYearAmount: 22.1, currentYearQuantity: 1540, previousYearQuantity: 1410, salesAmount: 73.6 },
  T50701: { currentYearAmount: 8.9, previousYearAmount: 7.4, currentYearQuantity: 520, previousYearQuantity: 470, salesAmount: 26.8 },
  T50573: { currentYearAmount: 18.6, previousYearAmount: 17.2, currentYearQuantity: 1060, previousYearQuantity: 980, salesAmount: 54.1 },
  T50572: { currentYearAmount: 6.7, previousYearAmount: 5.9, currentYearQuantity: 430, previousYearQuantity: 390, salesAmount: 18.4 },
  T50127: { currentYearAmount: 15.2, previousYearAmount: 13.7, currentYearQuantity: 920, previousYearQuantity: 850, salesAmount: 47.9 },
  T47938: { currentYearAmount: 9.6, previousYearAmount: 8.8, currentYearQuantity: 610, previousYearQuantity: 560, salesAmount: 31.3 },
  T47937: { currentYearAmount: 11.3, previousYearAmount: 10.5, currentYearQuantity: 780, previousYearQuantity: 730, salesAmount: 35.7 },
  T45138: { currentYearAmount: 20.1, previousYearAmount: 19.4, currentYearQuantity: 1290, previousYearQuantity: 1220, salesAmount: 62.5 },
  T45139: { currentYearAmount: 13.9, previousYearAmount: 12.6, currentYearQuantity: 850, previousYearQuantity: 790, salesAmount: 39.8 },
  T45140: { currentYearAmount: 16.4, previousYearAmount: 14.9, currentYearQuantity: 990, previousYearQuantity: 930, salesAmount: 48.7 },
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

const getTaskMetricValue = (task: TaskInfo, metricKey: MetricKey) =>
  task[metricKey] ?? TASK_AMOUNT_FALLBACKS[task.id]?.[metricKey] ?? 0;

const formatAmount = (amount: number) => `${amount.toFixed(1)}M`;

const formatMetricValue = (
  value: number,
  metric: { unit: 'amount' | 'quantity' },
  amountUnit: AmountUnit
) => {
  if (metric.unit === 'quantity') return Math.round(value).toLocaleString();

  return amountUnit === 'mCny' ? formatAmount(value) : `${value.toFixed(1)}百万`;
};

const polarToCartesian = (center: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: center + radius * Math.cos(angleInRadians),
    y: center + radius * Math.sin(angleInRadians),
  };
};

const describeDonutSegment = (
  center: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
) => {
  const outerStart = polarToCartesian(center, outerRadius, endAngle);
  const outerEnd = polarToCartesian(center, outerRadius, startAngle);
  const innerStart = polarToCartesian(center, innerRadius, startAngle);
  const innerEnd = polarToCartesian(center, innerRadius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ');
};

const SegmentedRingCard: React.FC<{
  title: string;
  value: string;
  label: string;
  data: ChartDatum[];
}> = ({ title, value, label, data }) => {
  const size = 188;
  const center = size / 2;
  const outerRadius = 82;
  const innerRadius = 60;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  return (
    <div className="flex min-w-[230px] flex-1 flex-col rounded-2xl bg-gradient-to-b from-slate-50 to-white px-5 py-5">
      <div className="mb-4 text-center text-xs font-bold tracking-[0.16em] text-gray-500">
        {title}
      </div>

      <div className="mx-auto flex h-[188px] w-[188px] items-center justify-center">
        <div className="relative flex h-[188px] w-[188px] items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {data.map((item) => {
              const angle = total === 0 ? 0 : (item.value / total) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              const midAngle = startAngle + angle / 2;
              const popOffset = item.isSelected ? polarToCartesian(0, 10, midAngle) : { x: 0, y: 0 };
              currentAngle = endAngle;

              if (angle === 0) return null;

              return (
                <g
                  key={item.label}
                  className="transition-opacity duration-200"
                  opacity={data.some((entry) => entry.isSelected) && !item.isSelected ? 0.42 : 1}
                  transform={`translate(${popOffset.x} ${popOffset.y})`}
                >
                  <path
                    d={describeDonutSegment(center, outerRadius, innerRadius, startAngle, endAngle)}
                    fill={item.color}
                    stroke={item.isSelected ? item.color : 'white'}
                    strokeWidth={item.isSelected ? '1' : '1.5'}
                    style={{
                      filter: item.isSelected ? `drop-shadow(0 0 5px ${item.color})` : undefined,
                    }}
                  />
                </g>
              );
            })}
            <circle
              cx={center}
              cy={center}
              r={innerRadius}
              fill="white"
              stroke="white"
              strokeWidth="2"
            />
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-[22px] font-black leading-none text-gray-900">{value}</div>
            <div className="mt-1 max-w-[72px] text-[9px] font-semibold leading-3 text-gray-400">
              {label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TaskModule: React.FC<TaskModuleProps> = ({ tasks, onTaskClick }) => {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [isPlanFilterOpen, setIsPlanFilterOpen] = useState(false);
  const [selectedPlanRange, setSelectedPlanRange] = useState<
    [string | null, string | null]
  >([null, null]);
  const [overdueFilter, setOverdueFilter] = useState<OverdueFilter>('all');
  const [amountUnit, setAmountUnit] = useState<AmountUnit>('mCny');
  const [isMetricSettingsOpen, setIsMetricSettingsOpen] = useState(false);
  const [selectedMetricKeys, setSelectedMetricKeys] = useState<MetricKey[]>([
    'currentYearAmount',
    'previousYearAmount',
  ]);
  const alternateAmountUnit: AmountUnit = amountUnit === 'mCny' ? 'million' : 'mCny';

  const statusEntries = useMemo(() => {
    const counts = new Map<string, number>();
    safeTasks.forEach((task) => {
      counts.set(task.status, (counts.get(task.status) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .sort(([statusA], [statusB]) => getStatusOrderIndex(statusA) - getStatusOrderIndex(statusB))
      .map(([status, count], index) => ({
        status,
        count,
        color:
          STATUS_COLOR_MAP[status] ??
          FALLBACK_STATUS_COLORS[index % FALLBACK_STATUS_COLORS.length],
      }));
  }, [safeTasks]);

  const chartTasks = useMemo(
    () =>
      selectedStatuses.length === 0
        ? safeTasks
        : safeTasks.filter((task) => selectedStatuses.includes(task.status)),
    [safeTasks, selectedStatuses]
  );

  const chartData = useMemo<ChartDatum[]>(
    () =>
      statusEntries.map((entry) => ({
        label: entry.status,
        value: entry.count,
        color: entry.color,
        isSelected: selectedStatuses.includes(entry.status),
      })),
    [selectedStatuses, statusEntries]
  );

  const stats = useMemo(() => {
    const completedCount = chartTasks.filter((task) => {
      if (!task.progress.includes('/')) return false;
      const [current, total] = task.progress.split('/');
      return current === total;
    }).length;

    const overdueCount = chartTasks.filter((task) => {
      const taskDate = parsePlanDate(task.planDate);
      return taskDate !== null && taskDate < MOCK_TODAY;
    }).length;

    const provinceCount = new Set(
      chartTasks.map((task) => task.province).filter((province) => province && province !== '-')
    ).size;

    return {
      total: safeTasks.length,
      selected: chartTasks.length,
      completed: completedCount,
      overdue: overdueCount,
      provinces: provinceCount,
    };
  }, [chartTasks, safeTasks.length]);

  const metricCards = useMemo(
    () =>
      selectedMetricKeys
        .map((metricKey) => METRIC_OPTIONS.find((option) => option.key === metricKey))
        .filter((metric): metric is (typeof METRIC_OPTIONS)[number] => Boolean(metric))
        .map((metric) => {
          const selectedTotal = chartTasks.reduce(
            (sum, task) => sum + getTaskMetricValue(task, metric.key),
            0
          );
          const metricChartData = statusEntries.map((entry) => {
            const value = safeTasks
              .filter((task) => task.status === entry.status)
              .reduce((sum, task) => sum + getTaskMetricValue(task, metric.key), 0);

            return {
              label: entry.status,
              value,
              color: entry.color,
              isSelected: selectedStatuses.includes(entry.status),
            };
          });

          return {
            key: metric.key,
            title: metric.label,
            value: formatMetricValue(selectedTotal, metric, amountUnit),
            label: selectedStatuses.length === 0 ? '全部状态总计' : '已选状态总计',
            data: metricChartData,
          };
        }),
    [amountUnit, chartTasks, safeTasks, selectedMetricKeys, selectedStatuses, statusEntries]
  );

  const filteredTasks = useMemo(() => {
    return safeTasks.filter((task) => {
      const matchStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(task.status);

      const normalizedKeyword = keyword.trim().toLowerCase();
      const matchKeyword =
        normalizedKeyword.length === 0 ||
        [task.id, task.companyName, task.province, task.executor]
          .join(' ')
          .toLowerCase()
          .includes(normalizedKeyword);

      const taskDate = parsePlanDate(task.planDate);
      const [rangeStart, rangeEnd] = selectedPlanRange;
      const startTimestamp = rangeStart
        ? dayjs(rangeStart, 'YYYY/MM/DD').startOf('day').valueOf()
        : null;
      const endTimestamp = rangeEnd
        ? dayjs(rangeEnd, 'YYYY/MM/DD').endOf('day').valueOf()
        : null;
      const matchPlanDate =
        (startTimestamp === null || (taskDate !== null && taskDate >= startTimestamp)) &&
        (endTimestamp === null || (taskDate !== null && taskDate <= endTimestamp));

      const isOverdue = taskDate !== null && taskDate < MOCK_TODAY;
      const matchOverdue =
        overdueFilter === 'all' ||
        (overdueFilter === 'overdue' && isOverdue) ||
        (overdueFilter === 'notOverdue' && taskDate !== null && !isOverdue);

      return matchStatus && matchKeyword && matchPlanDate && matchOverdue;
    });
  }, [keyword, overdueFilter, safeTasks, selectedPlanRange, selectedStatuses]);

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((item) => item !== status)
        : [...prev, status]
    );
  };

  const toggleMetric = (metricKey: MetricKey) => {
    setSelectedMetricKeys((prev) => {
      if (prev.includes(metricKey)) {
        return prev.length === 1 ? prev : prev.filter((item) => item !== metricKey);
      }

      if (prev.length >= 4) return prev;

      return [...prev, metricKey];
    });
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

  const resetAllFilters = () => {
    setKeyword('');
    setSelectedStatuses([]);
    setSelectedPlanRange([null, null]);
    setOverdueFilter('all');
  };

  const planFilterOverlay = (
    <div
      className="w-[300px] rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-800">任务计划时间筛选</div>
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
        placeholder={['????', '????']}
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
        <h2 className="border-l-4 border-gray-200 pl-3 text-xl font-bold">任务管理</h2>
      </div>

      <div
        className="relative mb-8 overflow-visible rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
        onClick={() => setSelectedStatuses([])}
      >
        <div className="mb-6 flex items-start justify-between">
          <h3 className="border-l-4 border-blue-600 pl-3 text-sm font-bold text-gray-800">
            任务进度状态
          </h3>
          <div className="group relative text-[10px] font-medium text-gray-400">
            <button
              type="button"
              onClick={(event) => event.stopPropagation()}
              className="rounded px-1 py-0.5 text-[10px] font-medium text-gray-400 transition hover:text-gray-700"
            >
              {AMOUNT_UNIT_LABELS[amountUnit]}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setAmountUnit(alternateAmountUnit);
              }}
              className="absolute right-0 top-full z-20 mt-1 whitespace-nowrap px-1 text-[10px] text-gray-500 opacity-0 transition-opacity duration-150 hover:text-gray-800 group-hover:opacity-100"
            >
              {AMOUNT_UNIT_LABELS[alternateAmountUnit]}
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[148px_minmax(0,1fr)] xl:items-stretch">
          <div className="flex w-full flex-col gap-2.5">
            {statusEntries.map(({ status, count, color }) => {
              const isSelected = selectedStatuses.includes(status);
              return (
                <button
                  key={status}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleStatus(status);
                  }}
                  onMouseEnter={() => setHoveredStatus(status)}
                  onMouseLeave={() => setHoveredStatus(null)}
                  className={`
                    flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-all duration-200
                    ${isSelected
                      ? 'scale-[1.02] border-transparent shadow-lg shadow-gray-300/60'
                      : 'border-transparent bg-white text-gray-700 hover:border-gray-200 hover:bg-gray-50'
                    }
                    ${selectedStatuses.length > 0 && !isSelected ? 'opacity-30' : 'opacity-100'}
                    ${selectedStatuses.length === 0 && hoveredStatus && hoveredStatus !== status ? 'opacity-50' : ''}
                  `}
                  style={
                    isSelected
                      ? { backgroundColor: `${color}20` }
                      : undefined
                  }
                >
                  <span className="flex items-center space-x-2">
                    <span
                      className="h-2 w-2 rounded-full shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isSelected ? 'text-gray-800' : 'text-gray-400'
                      }`}
                    >
                      {status}
                    </span>
                  </span>
                  <span
                    className={`font-mono text-sm font-bold ${
                      isSelected ? 'text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-[repeat(auto-fit,minmax(230px,1fr))]">
            <SegmentedRingCard
              title="任务状态数量统计"
              value={`${selectedStatuses.length === 0 ? stats.completed : stats.selected}/${stats.total}`}
              label={selectedStatuses.length === 0 ? '已完成 / 任务总数' : '已选择 / 任务总数'}
              data={chartData}
            />
            {metricCards.map((card) => (
              <SegmentedRingCard
                key={card.key}
                title={card.title}
                value={card.value}
                label={card.label}
                data={card.data}
              />
            ))}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-gray-50 pt-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">计划最迟完成日期</span>
            <span className="text-xl font-black tracking-tight text-gray-400">2026/03/29</span>
          </div>
          <div className="relative flex items-center gap-2">
            {selectedStatuses.length > 0 && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedStatuses([]);
                }}
                className="flex items-center space-x-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 transition-all hover:shadow-sm"
              >
                <X size={12} />
                <span>正在筛选: {selectedStatuses.join(', ')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsMetricSettingsOpen((prev) => !prev);
              }}
              aria-label="指标设置"
              className={`field-settings-trigger flex h-7 w-7 items-center justify-center rounded-md border transition ${
                isMetricSettingsOpen
                  ? 'border-blue-600 bg-[#1b328a] text-white shadow-sm'
                  : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-white hover:text-gray-700'
              }`}
            >
              <Settings
                key={isMetricSettingsOpen ? 'metric-settings-open' : 'metric-settings-closed'}
                size={15}
                className={`field-settings-gear transition-transform duration-500 ${
                  isMetricSettingsOpen ? 'field-settings-gear-roll' : ''
                }`}
              />
            </button>
            <div
              onClick={(event) => event.stopPropagation()}
              className={`absolute bottom-full right-0 z-30 mb-2 w-[220px] rounded-lg border border-gray-200 bg-white p-3 shadow-xl transition-all duration-200 ${
                isMetricSettingsOpen
                  ? 'translate-y-0 opacity-100'
                  : 'pointer-events-none translate-y-2 opacity-0'
              }`}
            >
              <div className="mb-2 text-xs font-bold text-gray-700">指标设置</div>
              <div className="grid gap-1">
                {METRIC_OPTIONS.map((metric) => {
                  const isMetricSelected = selectedMetricKeys.includes(metric.key);
                  const isDisabled = !isMetricSelected && selectedMetricKeys.length >= 4;

                  return (
                    <button
                      key={metric.key}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => toggleMetric(metric.key)}
                      className={`flex items-center justify-between rounded-md border px-2 py-1.5 text-left text-[11px] font-medium transition ${
                        isMetricSelected
                          ? 'border-blue-100 bg-blue-50 text-gray-800'
                          : isDisabled
                            ? 'cursor-not-allowed border-transparent text-gray-300'
                            : 'border-transparent text-gray-500 hover:border-gray-100 hover:bg-gray-50 hover:text-gray-700'
                      }`}
                    >
                      <span>{metric.label}</span>
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isMetricSelected ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div className="relative min-w-[260px] max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                type="text"
                placeholder="搜索任务ID、公司名称、省份、执行人"
                className="w-full rounded border border-gray-200 py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              onClick={resetAllFilters}
              className="flex items-center rounded border border-gray-300 px-5 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
            >
              <RotateCcw size={14} className="mr-1.5" /> 重置
            </button>
            {hasPlanDateFilter && (
              <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                <CalendarDays size={13} />
                <span>
                  {selectedPlanRange[0] || selectedPlanRange[1] ? `???? ${selectedPlanRange[0] ?? '??'} - ${selectedPlanRange[1] ?? '??'}` : '????'}
                  {overdueFilter === 'overdue' && ' / 已逾期'}
                  {overdueFilter === 'notOverdue' && ' / 未逾期'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="primary">批量修改</Button>
            <Button icon={<Download size={14} />}>批量下载</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500">
              <tr>
                <th className="w-10 px-4 py-3 text-center">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-4 py-3">任务ID</th>
                <th className="px-4 py-3">所属公司名称</th>
                <th className="px-4 py-3">省份</th>
                <th className="px-4 py-3">执行人</th>
                <th className="px-4 py-3">任务状态</th>
                <th className="px-4 py-3">任务进度</th>
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
                      <span>最迟提交日期</span>
                      <CalendarDays size={13} />
                      <ChevronDown size={13} />
                    </button>
                  </Dropdown>
                </th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTasks.map((task) => {
                const dateInfo = getDateStatus(task.planDate);
                const statusColor =
                  statusEntries.find((entry) => entry.status === task.status)?.color ?? '#94a3b8';

                return (
                  <tr key={task.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-3 font-semibold text-blue-600">{task.id}</td>
                    <td className="px-4 py-3">{task.companyName}</td>
                    <td className="px-4 py-3 text-gray-600">{task.province}</td>
                    <td className="px-4 py-3 text-gray-500">{task.executor}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center">
                        <span
                          className="mr-2 h-2 w-2 rounded-full"
                          style={{ backgroundColor: statusColor }}
                        />
                        <span className="text-xs font-bold text-gray-700">{task.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{task.progress}</td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center space-x-1 text-[11px] ${dateInfo.className}`}>
                        {dateInfo.isOverdue ? (
                          <AlertCircle size={12} />
                        ) : (
                          <Clock size={12} className="opacity-60" />
                        )}
                        <span>{dateInfo.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end space-x-2 text-gray-400">
                        <button className="transition-colors hover:text-blue-600">
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onTaskClick?.(task.id)}
                          className="transition-colors hover:text-blue-600"
                        >
                          <LoginOutlined />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-sm font-medium text-gray-400">
                    未发现匹配的任务记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaskModule;
