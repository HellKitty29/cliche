import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { TASK_EXECUTION_GUIDE } from './LocationModule';
import { TASK_DETAIL_CHAPTERS } from './TemplateModule';

interface TaskDetailPageProps {
  onBack: () => void;
}

const TASK_DETAIL_INFO = {
  title: '1325146-Tech Solutions Demo & Training (CN)-2025/01/01~2025/12/31',
  code: 'T51447-260211/任务详情',
  scenario: '盘点-全面实地盘点',
  locationMark: 'test1, test1, 北京市 海淀, xxxxxx',
  manager: 'Yau, Kurt (HK/AQPP)',
  publisher: 'Huang, Ian (SH/AQPP)',
  executor: 'Huang, Ian (SH/AQPP)',
  planDate: '-',
  lastSubmitDate: '2026/02/12',
  address: '北京市海淀区 xxxxxx',
};

const guideText =
  '在这里您可以上传审计地点的 Excel 文件。一个地点对应一个审计任务。您也可以在任务发布前调整地点列表，分配执行人员。';

const TaskDetailPage: React.FC<TaskDetailPageProps> = ({ onBack }) => {
  const [keyword, setKeyword] = useState('');
  const [activeKeyword, setActiveKeyword] = useState('');
  const [isGuideExpanded, setIsGuideExpanded] = useState(true);
  const [isReviewed, setIsReviewed] = useState(false);
  const [reviewDecisionOpen, setReviewDecisionOpen] = useState(false);
  const [reviewRepeatOpen, setReviewRepeatOpen] = useState(false);

  const filteredChapters = useMemo(() => {
    const normalizedKeyword = activeKeyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return TASK_DETAIL_CHAPTERS;
    }

    return TASK_DETAIL_CHAPTERS.filter((chapter) =>
      [chapter.templateName, chapter.location, chapter.status]
        .join(' ')
        .toLowerCase()
        .includes(normalizedKeyword)
    );
  }, [activeKeyword]);

  return (
    <div className="px-6 py-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center text-sm text-[#1e49e2] transition hover:opacity-80"
        >
          <ChevronLeft size={16} className="mr-1" />
          返回
        </button>
        <button
          type="button"
          onClick={() => {
            if (isReviewed) {
              setReviewRepeatOpen(true);
              return;
            }
            setReviewDecisionOpen(true);
          }}
          className={`rounded px-5 py-2 text-sm font-medium text-white transition ${
            isReviewed ? 'bg-[#977a76] hover:bg-slate-800' : 'bg-[#1e49e2] hover:brightness-110'
          }`}
        >
          复核
        </button>
      </div>

      <div className="mb-2 text-[18px] font-semibold tracking-tight text-gray-900">
        {TASK_DETAIL_INFO.title}
      </div>
      <div className="mb-5 text-sm font-semibold text-gray-400">{TASK_DETAIL_INFO.code}</div>

      <section className="mb-8">
        <div className="mb-3 flex items-center">
          <span className="mr-2 h-5 w-1 bg-[#1e49e2]" />
          <h2 className="text-lg font-semibold text-gray-900">任务信息</h2>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-5 shadow-sm">
          <div className="grid grid-cols-1 gap-x-10 gap-y-4 text-sm text-gray-700 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <span className="text-gray-500">标准应用场景：</span>
              <span className="font-medium text-gray-900">{TASK_DETAIL_INFO.scenario}</span>
            </div>
            <div>
              <span className="text-gray-500">地点标识：</span>
              <span className="text-gray-900">{TASK_DETAIL_INFO.locationMark}</span>
            </div>
            <div>
              <span className="text-gray-500">项目经理：</span>
              <span className="text-gray-900">{TASK_DETAIL_INFO.manager}</span>
            </div>
            <div>
              <span className="text-gray-500">发布人：</span>
              <span className="text-gray-900">{TASK_DETAIL_INFO.publisher}</span>
            </div>
            <div>
              <span className="text-gray-500">执行人：</span>
              <span className="text-gray-900">{TASK_DETAIL_INFO.executor}</span>
            </div>
            <div>
              <span className="text-gray-500">计划执行日期：</span>
              <span className="text-gray-900">{TASK_DETAIL_INFO.planDate}</span>
            </div>
            <div>
              <span className="text-gray-500">最近提交日期：</span>
              <span className="text-gray-900">{TASK_DETAIL_INFO.lastSubmitDate}</span>
            </div>
            <div>
              <span className="text-gray-500">任务地点：</span>
              <span className="text-gray-900">{TASK_DETAIL_INFO.address}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <button
          type="button"
          onClick={() => setIsGuideExpanded((prev) => !prev)}
          className="mb-3 flex items-center gap-2"
        >
          <span className="mr-2 h-5 w-1 bg-[#1e49e2]" />
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            任务执行指引
            <ChevronDown
              size={16}
              className={`ml-2 text-[#1e49e2] transition-transform ${
                isGuideExpanded ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </h2>
        </button>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-5 shadow-sm">
          <div className="space-y-4">
            {isGuideExpanded && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
                <p className="text-sm italic leading-relaxed text-blue-900/80">
                  {guideText || TASK_EXECUTION_GUIDE}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center">
          <span className="mr-2 h-5 w-1 bg-[#1e49e2]" />
          <h2 className="text-lg font-semibold text-gray-900">章节列表</h2>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-gray-700" htmlFor="chapter-search">
                章节搜索
              </label>
              <input
                id="chapter-search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="请输入"
                className="h-10 w-44 rounded border border-gray-300 px-3 text-sm outline-none transition focus:border-[#1e49e2]"
              />
              <button
                type="button"
                onClick={() => setActiveKeyword(keyword)}
                className="h-10 rounded bg-[#1e49e2] px-4 text-sm font-medium text-white transition hover:brightness-110"
              >
                查询
              </button>
              <button
                type="button"
                onClick={() => {
                  setKeyword('');
                  setActiveKeyword('');
                }}
                className="h-10 rounded border border-gray-300 px-4 text-sm text-gray-700 transition hover:bg-gray-50"
              >
                重置
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled
                className="h-10 rounded border border-gray-200 bg-gray-50 px-6 text-sm text-gray-400"
              >
                提交
              </button>
              <button
                type="button"
                className="h-10 rounded border border-[#1e49e2] px-6 text-sm font-medium text-[#1e49e2] transition hover:bg-blue-50"
              >
                查看
              </button>
            </div>
          </div>

          <div className="overflow-hidden border border-gray-200">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-[#fafafa] text-gray-600">
                <tr>
                  <th className="w-20 px-3 py-3 font-medium">序号</th>
                  <th className="px-3 py-3 font-medium">章节模板</th>
                  <th className="w-[45%] px-3 py-3 font-medium">打卡地点</th>
                  <th className="w-[15%] px-3 py-3 font-medium">执行人</th>
                  <th className="w-28 px-3 py-3 font-medium">章节状态</th>
                  <th className="w-24 px-3 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredChapters.map((chapter) => (
                  <tr key={chapter.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 align-top text-gray-700">{chapter.order}</td>
                    <td className="px-3 py-3 align-top text-gray-900">{chapter.templateName}</td>
                    <td className="px-3 py-3 align-top text-gray-700">{chapter.location}</td>
                    <td className="px-3 py-3 align-top text-gray-900">
                      {chapter.templateName === '现场打卡' ? 'Nico, Love' : 'Ian, Huang'}
                    </td>
                    <td className="px-3 py-3 align-top text-gray-900">{chapter.status}</td>
                    <td className="px-3 py-3 align-top">
                      <button
                        type="button"
                        className="text-[#1e49e2] transition hover:underline"
                      >
                        执行
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredChapters.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-sm text-gray-400">
                      未找到匹配的章节
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {reviewDecisionOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/20 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <div className="text-base font-semibold text-gray-900">是否通过复核</div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewDecisionOpen(false)}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
              >
                不通过
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsReviewed(true);
                  setReviewDecisionOpen(false);
                }}
                className="rounded bg-[#1e49e2] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
              >
                通过
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewRepeatOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/20 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="text-base font-semibold text-gray-900">
              本任务已同经[Johnny, Shen]复核，是否继续复核任务
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewRepeatOpen(false)}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
              >
                否
              </button>
              <button
                type="button"
                onClick={() => setReviewRepeatOpen(false)}
                className="rounded bg-[#1e49e2] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
              >
                是
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetailPage;
