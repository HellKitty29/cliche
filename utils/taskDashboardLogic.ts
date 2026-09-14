import type { TaskInfo } from '../types.ts';

export type TaskDashboardMode = 'kdc' | 'engagement';

const KDC_EXECUTOR_PATTERN = /\((?:KDC|KDCS)(?:[\/)]|$)/i;

export type TaskStatusOption = {
  status: TaskInfo['status'];
  color: string;
};

export const TASK_STATUS_OPTIONS: TaskStatusOption[] = [
  { status: '已选定', color: '#e6e6e6' },
  { status: '已指派', color: '#5d9bce' },
  { status: '被拒绝', color: '#ef7c33' },
  { status: '已接受', color: '#00328b' },
  { status: '执行中', color: '#a5a5a5' },
  { status: '已提交', color: '#febf00' },
  { status: '已复核', color: '#6fad49' },
];

export const TASK_STATUS_COLOR_MAP: Record<string, string> = Object.fromEntries(
  TASK_STATUS_OPTIONS.map((option) => [option.status, option.color])
);

export const isKdcExecutor = (executor: string) => KDC_EXECUTOR_PATTERN.test(executor);

export const getTaskWithStatusOverride = (
  task: TaskInfo,
  statusOverrides: Record<string, TaskInfo['status']>
) => ({
  ...task,
  status: statusOverrides[task.id] ?? task.status,
});

export const getModeVisibleTasks = (
  tasks: TaskInfo[],
  mode: TaskDashboardMode,
  statusOverrides: Record<string, TaskInfo['status']>,
  hiddenTaskIds: Set<string>
) =>
  tasks
    .filter((task) => !hiddenTaskIds.has(task.id))
    .filter((task) => mode !== 'kdc' || isKdcExecutor(task.executor))
    .map((task) => getTaskWithStatusOverride(task, statusOverrides));

export const getTaskStatusEntries = (tasks: TaskInfo[]) => {
  const counts = new Map<string, number>();
  tasks.forEach((task) => {
    counts.set(task.status, (counts.get(task.status) ?? 0) + 1);
  });

  return TASK_STATUS_OPTIONS.map((option) => ({
    status: option.status,
    count: counts.get(option.status) ?? 0,
    color: option.color,
    tint: `${option.color}14`,
  }));
};
