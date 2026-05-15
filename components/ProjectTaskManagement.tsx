import React, { useState } from 'react';
import { ChevronRight, ChevronDown, ExternalLink, Calendar, Bold } from 'lucide-react';
import { LoginOutlined } from '@ant-design/icons';
import { color } from 'echarts';

interface ProjectTaskManagementProps {
  onOpenPreWp?: () => void;
}

interface TaskItem {
  id: number;
  name: string;
  scenario: string;
  creator: string;
  createTime: string;
  locationCount: number;
  taskCount: number;
  completedCount: number;
}

const SAMPLE_DATA: TaskItem[] = [
  { id: 1, name: 'AAA', scenario: '盘点-全面实地走访', creator: 'Shen, Johnny (SH/AQPP)', createTime: '2026-03-19 10:37:57', locationCount: 0, taskCount: 0, completedCount: 0 },
  { id: 2, name: '260211', scenario: '盘点-全面实地走访', creator: 'Huang, Ian (SH/AQPP)', createTime: '2026-02-11 10:50:08', locationCount: 5, taskCount: 4, completedCount: 0 },
  { id: 3, name: 'Adv testing', scenario: '盘点-独立盘点', creator: 'Li, Joy (KDCSH/Trusted)', createTime: '2026-01-20 08:49:38', locationCount: 0, taskCount: 0, completedCount: 0 },
  { id: 4, name: 'D项目仓库审计', scenario: '现场走访-通用经营场所走访', creator: 'Li, Joy (KDCSH/Trusted)', createTime: '2026-01-16 17:22:29', locationCount: 2, taskCount: 2, completedCount: 1 },
  { id: 5, name: 'test0104', scenario: '盘点-全面实走访', creator: 'Huang, Ian (SH/AQPP)', createTime: '2026-01-04 10:21:44', locationCount: 1, taskCount: 2, completedCount: 0 },
  { id: 6, name: 'physical test', scenario: '盘点-全面实地走访', creator: 'Huang, Ian (SH/AQPP)', createTime: '2025-12-26 10:40:33', locationCount: 5, taskCount: 4, completedCount: 1 },
  { id: 7, name: 'test template', scenario: 'Inventory-Physical Counts', creator: 'Huang, Ian (SH/AQPP)', createTime: '2025-12-24 11:59:07', locationCount: 0, taskCount: 0, completedCount: 0 },
  { id: 8, name: 'test once', scenario: '盘点-全面实地走访', creator: 'Huang, Ian (SH/AQPP)', createTime: '2025-12-19 11:34:48', locationCount: 2, taskCount: 1, completedCount: 0 },
  { id: 9, name: '全面实地走访', scenario: '盘点-全面实地走访', creator: 'Huang, Ian (SH/AQPP)', createTime: '2025-12-11 13:55:18', locationCount: 6, taskCount: 4, completedCount: 0 },
  { id: 10, name: '盘点测试', scenario: '盘点-实地走访', creator: 'Huang, Ian (SH/AQPP)', createTime: '2025-12-08 16:26:33', locationCount: 1, taskCount: 2, completedCount: 0 },
];

const SharedColGroup = () => (
  <colgroup>
    <col style={{ width: '64px' }} />
    <col style={{ width: '224px' }} />
    <col />
    <col />
    <col />
    <col />
    <col />
    <col />
    <col style={{ width: '80px' }} />
  </colgroup>
);

const ProjectTaskManagement: React.FC<ProjectTaskManagementProps> = ({ onOpenPreWp }) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['存货盘点']);
  const [expandedDateSections, setExpandedDateSections] = useState<string[]>([]);

  // Randomly assign tasks to categories
  const [inventoryTasks, siteVisitTasks] = React.useMemo(() => {
    const shuffled = [...SAMPLE_DATA].sort(() => Math.random() - 0.5);
    const mid = Math.floor(shuffled.length / 2);
    return [shuffled.slice(0, mid), shuffled.slice(mid)];
  }, []);

  const categories = [
    { name: '存货盘点', tasks: inventoryTasks },
    { name: '现场走访', tasks: siteVisitTasks },
  ];

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => 
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const toggleDateSection = (key: string) => {
    setExpandedDateSections((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const inventoryDateSections = React.useMemo(
    () => [
      {
        key: '2025',
        label: '2025/01/01 ~ 2025/12/31',
        tasks: inventoryTasks.filter(
          (task) => new Date(task.createTime.replace(/-/g, '/')).getFullYear() === 2025
        ),
      },
      {
        key: '2026',
        label: '2026/01/01 ~ 2026/12/31',
        tasks: inventoryTasks.filter(
          (task) => new Date(task.createTime.replace(/-/g, '/')).getFullYear() === 2026
        ),
      },
    ],
    [inventoryTasks]
  );

  return (
    <div className="p-6 bg-white min-h-[600px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 bg-blue-600 rounded-full" />
          <h2 className="text-lg font-bold text-gray-900">项目任务管理</h2>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-lg shadow-sm">
        <table className="w-full text-sm text-left">
          <SharedColGroup />
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 w-16">序号</th>
              <th className="w-56 px-4 py-3">项目流程名称</th>
              <th className="px-4 py-3">标准应用场景</th>
              <th className="px-4 py-3">创建人</th>
              <th className="px-4 py-3">创建时间</th>
              <th className="px-4 py-3">地点总数</th>
              <th className="px-4 py-3">任务总数</th>
              <th className="px-4 py-3">已完成任务数</th>
              <th className="w-20 px-4 py-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {categories.map((category) => {
              const isExpanded = expandedCategories.includes(category.name);
              const displayTasks = category.tasks;

              return (
                <React.Fragment key={category.name}>
                  {/* Category Header Row */}
                  <tr 
                    className="bg-blue-50/30 cursor-pointer hover:bg-blue-50/50 transition-colors"
                    onClick={() => toggleCategory(category.name)}
                  >
                    <td colSpan={9} className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2 font-bold text-blue-800">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        {category.name} ({category.tasks.length})
                      </div>
                    </td>
                  </tr>

                  <tr className="bg-white">
                    <td colSpan={9} className="p-0">
                      <div
                        className={`overflow-hidden border-b border-gray-50 transition-all duration-500 ease-out ${
                          isExpanded
                            ? 'max-h-[1200px] translate-y-0 opacity-100'
                            : 'max-h-0 -translate-y-2 opacity-0'
                        }`}
                      >
                        <div className="bg-white shadow-[inset_0_8px_18px_-18px_rgba(0,51,141,0.45)]">
                          {category.name === '存货盘点' ? (
                            <table className="w-full table-fixed text-sm text-left">
                              <SharedColGroup />
                              <tbody className="divide-y divide-gray-50">
                                {inventoryDateSections.map((section, sectionIndex) => {
                                  const isSectionExpanded = expandedDateSections.includes(section.key);

                                  return (
                                    <React.Fragment key={section.key}>
                                      <tr className="bg-blue-50/20">
                                        <td colSpan={8} className="px-4 py-3">
                                          <button
                                            type="button"
                                            onClick={() => toggleDateSection(section.key)}
                                            className="flex items-center gap-2 text-left text-xs font-medium text-blue-800 transition-colors hover:text-blue-900"
                                          >
                                            <Calendar size={12} className="text-blue-500" />
                                            {section.label}
                                            <span className="text-xs font-medium text-blue-500">
                                              ({section.tasks.length})
                                            </span>
                                          </button>
                                        </td>
                                        <td className="w-20 px-4 py-3 text-center">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onOpenPreWp?.();
                                            }}
                                            className="inline-flex items-center justify-center rounded-md border border-transparent p-1.5 transition-colors hover:border-gray-200 hover:bg-gray-100"
                                            style={{ color: '#1A1627' }}
                                          >
                                            <LoginOutlined style={{ fontSize: '13px', color: '#086fff'
                                              // transform: 'rotate(180deg)' 
                                                                  }} />
                                          </button>
                                        </td>
                                      </tr>

                                      {isSectionExpanded &&
                                        (section.tasks.length > 0 ? (
                                          section.tasks.map((task, idx) => (
                                            <tr
                                              key={`${section.key}-${task.id}`}
                                              className="group hover:bg-gray-50 transition-all duration-300"
                                              style={{
                                                transitionDelay: isSectionExpanded
                                                  ? `${sectionIndex * 80 + idx * 45}ms`
                                                  : '0ms',
                                                opacity: isSectionExpanded ? 1 : 0,
                                                transform: isSectionExpanded
                                                  ? 'translateX(0px)'
                                                  : 'translateX(-18px)',
                                              }}
                                            >
                                              <td className="w-16 px-4 py-3 text-gray-500">{idx + 1}</td>
                                              <td className="w-56 px-4 py-3 
                                                            font-medium text-gray-700 
                                                            ">
                                                {task.name}
                                              </td>
                                              <td className="px-4 py-3 text-gray-600">{task.scenario}</td>
                                              <td className="px-4 py-3 text-gray-600">{task.creator}</td>
                                              <td className="px-4 py-3 text-gray-500">{task.createTime}</td>
                                              <td className="px-4 py-3 text-center text-gray-700">{task.locationCount}</td>
                                              <td className="px-4 py-3 text-center text-gray-700">{task.taskCount}</td>
                                              <td className="px-4 py-3 text-center text-gray-700">{task.completedCount}</td>
                                              <td className="w-20 px-4 py-3 text-center">
                                                <button className="text-blue-500 hover:text-blue-800 transition-colors">
                                                  <LoginOutlined size={14} />
                                                </button>
                                              </td>
                                            </tr>
                                          ))
                                        ) : (
                                          <tr>
                                            <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">
                                              当前区间暂无项目流程
                                            </td>
                                          </tr>
                                        ))}
                                    </React.Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                          ) : (
                            <table className="w-full table-fixed text-sm text-left">
                              <SharedColGroup />
                              <tbody className="divide-y divide-gray-50">
                                {displayTasks.map((task, idx) => (
                                  <tr
                                    key={task.id}
                                    className="group hover:bg-gray-50 transition-all duration-300"
                                    style={{
                                      transitionDelay: isExpanded ? `${idx * 45}ms` : '0ms',
                                      opacity: isExpanded ? 1 : 0,
                                      transform: isExpanded
                                        ? 'translateX(0px)'
                                        : 'translateX(-18px)',
                                    }}
                                  >
                                    <td className="w-16 px-4 py-3 text-gray-500">{idx + 1}</td>
                                    <td className="w-56 px-4 py-3 font-medium text-gray-700">
                                      {task.name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{task.scenario}</td>
                                    <td className="px-4 py-3 text-gray-600">{task.creator}</td>
                                    <td className="px-4 py-3 text-gray-500">{task.createTime}</td>
                                    <td className="px-4 py-3 text-center text-gray-700">{task.locationCount}</td>
                                    <td className="px-4 py-3 text-center text-gray-700">{task.taskCount}</td>
                                    <td className="px-4 py-3 text-center text-gray-700">{task.completedCount}</td>
                                    <td className="w-20 px-4 py-3 text-center">
                                      <button className="text-blue-600 hover:text-blue-800 transition-colors">
                                        <LoginOutlined style={{ fontSize: '13px' }} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectTaskManagement;
