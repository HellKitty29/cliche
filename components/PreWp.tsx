/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { LoginOutlined } from '@ant-design/icons';
import { AlertCircle, ChevronLeft, Download, Edit3, Info } from 'lucide-react';

type StepCompletion = '' | 'completed' | 'not-applicable';
type AttachCompletion = '' | 'completed' | 'not-applicable';
type Language = 'zh' | 'en';

type TaskDetail = {
  label: string;
  value: string;
  editable?: boolean;
};

type StepItem = {
  id: number;
  procedure: string;
  kaeg: string[];
  workflow: { name: string }[];
};

type AttachItem = {
  id: number;
  nameZh: string;
};

type UploadTarget = 'matrix' | 'method';

interface PreWpProps {
  onBack?: () => void;
  taskId?: string;
}

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

function RetroRadio({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex cursor-pointer select-none items-center gap-2"
      aria-pressed={selected}
    >
      <div
        className={cn(
          'flex h-[12px] w-[12px] items-center justify-center rounded-full transition-all',
          'border-[1px] border-[#808080] bg-[rgb(229,231,235)]',
          // 'shadow-[inset_1px_1px_0px_#000,1px_1px_0px_#fff]',
          selected && 'bg-[rgb(223,227,235)]'
        )}
      >
        {selected && (
          <div className="h-[3px] w-[3px] rounded-full bg-black shadow-[1px_1px_0px_rgba(255,255,255,0.3)]" />
        )}
      </div>
      <span
        className={cn(
          'text-xs font-semibold tracking-wider text-gray-700 transition-colors',
          'group-hover:text-gray-900',
          selected && 'text-gray-900'
        )}
      >
        {label}
      </span>
    </button>
  );
}

export default function PreWp({ onBack, taskId }: PreWpProps) {
  const [stepCompletion, setStepCompletion] = useState<Record<number, StepCompletion>>({});
  const [attachmentCompletion, setAttachmentCompletion] = useState<Record<number, AttachCompletion>>({});
  const [language, setLanguage] = useState<Language>('zh');
  const [isAlertRetracted, setIsAlertRetracted] = useState(false);
  const [inventoryStepsSaved, setInventoryStepsSaved] = useState(false);
  const [uploadModalTarget, setUploadModalTarget] = useState<UploadTarget | null>(null);
  const [pendingFileName, setPendingFileName] = useState('');
  const [matrixFileName, setMatrixFileName] = useState('');
  const [methodFileName, setMethodFileName] = useState('');

  const taskDetails: TaskDetail[] = [
    // { label: '任务名称', value: '存货监盘 FY25', editable: true },
    // { label: '种类', value: 'Inventory Physical Counts - Chinese version' },
    // { label: 'KDC 联系人', value: '-' },
    // { label: '程序', value: '现场监盘程序' },
    // { label: '项目合伙人', value: 'Wang Magie (SH/PTR)' },
    { label: '目标', value: '—  本工作底稿旨在说明按照《毕马威审计执行指引 - 国际版》(KAEG - I) 中的“存货”章节拟实施的程序。' },
    { label: '最低复核要求', value: '项目组按照 KAEG 中最低必要复核要求执行复核。' },
    {
      label: '适用情形',
      value:
        '当存货对财务报表重要，且需要通过监盘获取有关数量和状况的审计证据时，应完成本工作底稿。',
    },
    {
      label: '与 KPMG Clara Workflow 的结合',
      value:`— 如果存放于被审计单位或第三方地点的存货数量和状况存在一项或多项重大错报风险，则将相关存货账户链接至相关的存货业务流程。从错报风险库中选择相关的错报风险并映射至相关的存货账户
            — 本工作底稿旨在说明相关程序或程序的结果记录在KPMG Clara workflow中的何处（如适用），以便项目组能够使用该工作流程的全部功能。在适用情况下，这些功能包括测试相关流程控制活动运行的有效性和实施实质性程序。如果KPMG Clara workflow索引未被纳入本工作底稿或不适用，则在KPMG Clara workflow中进行记录，或将记录作为附件添加至KPMG Clara workflow并在本工作底稿中提供索引。` ,
    },
    
    {
      label: '时间安排',
      value: '本工作底稿应在风险评估和计划阶段完成，用于记录项目组对存货盘点政策的理解及监盘计划。',
    },
  ];

  const findTaskDetail = (label: string) =>
    taskDetails.find((detail) => detail.label === label) ?? { label, value: '-' };

  // const leftColumnDetails = [
  //   findTaskDetail('任务名称'),
  //   findTaskDetail('种类'),
  //   findTaskDetail('KDC 联系人'),
  //   findTaskDetail('程序'),
  //   findTaskDetail('项目合伙人'),
  //   findTaskDetail('财务期间'),
  // ];

  const rightColumnTopDetails = [
    findTaskDetail('目标'),
    findTaskDetail('适用情形'),
    findTaskDetail('最低复核要求'),
  ];

  const rightColumnBottomDetails = [findTaskDetail('时间安排'), findTaskDetail('与 KPMG Clara Workflow 的结合')];

  const steps: StepItem[] = [
    {
      id: 1,
      procedure: '获取按类型和/或地点划分的存货分析，并更新项目组对存货类型及存放地点的理解。',
      kaeg: ['项目组对被审计单位存货的了解 [7747.6870]'],
      workflow: [],
    },
    {
      id: 2,
      procedure: '结合计划阶段分析程序并询问管理层，了解本期存货变化、波动情况以及高价值项目。',
      kaeg: ['项目组对被审计单位存货的了解 [7747.6870]'],
      workflow: [{ name: '2.1.3 计划阶段的分析程序' }],
    },
    {
      id: 3,
      procedure: '考虑以往存货监盘结果，获取有关历史盘点情况的信息，以识别和评估本期重大错报风险。',
      kaeg: ['项目组对被审计单位存货的了解 [7747.6870]'],
      workflow: [{ name: '3.1 业务流程 - 了解有关情况' }],
    },
    {
      id: 4,
      procedure: '了解影响确认存货数量和状况的会计政策或原则。',
      kaeg: ['项目组对被审计单位存货的了解 [7747.6870]'],
      workflow: [{ name: '3.1 业务流程 - 了解有关情况' }],
    },
    {
      id: 5,
      procedure: '如管理层使用自动化程序协助盘点，了解程序抓取的信息及其如何传输至存货跟踪系统。',
      kaeg: ['项目组对被审计单位存货的了解 [7747.6870]'],
      workflow: [{ name: '3.1 业务流程 - 了解有关情况' }],
    },
    {
      id: 6,
      procedure: '了解被审计单位如何计量存货数量，包括对计量设备的校准。',
      kaeg: ['项目组对被审计单位存货的了解 [7747.6870]'],
      workflow: [{ name: '3.1 业务流程 - 了解有关情况' }],
    },
  ];

  const attachmentSteps: AttachItem[] = [
    
    {
      id: 1,
      nameZh: '采取控制测试方案或双重目的的方案对管理层的循环盘点实施程序',
    },
    {
      id: 2,
      nameZh: '采取实质性方案、控制测试方案或双重目的的方案对管理层的全面实地盘点实施程序',
    },
    {
      id: 3,
      nameZh: '就存放于第三方地点的存货获取证据',
    },
    {
      id: 4,
      nameZh: '仅限于非整合审计或 ISA 项目，对管理层在非期末时点执行的循环盘点或全面实地盘点实施监盘程序',
    },
    {
      id: 5,
      nameZh: '当项目组因不可预见的情况而无法在管理层存货盘点现场实施监盘时，实施的程序',
    },
    {
      id: 6,
      nameZh: '如果在存货盘点现场实施存货监盘不可行时，实施的替代程序',
    },
    {
      id: 7,
      nameZh: '仅限于 ISA 项目，当与存货数量和状况有关的风险未被评估为重大错报风险但存货对财务报表重要时，参加管理层存货盘点时实施的程序',
    },
  ];

  const hasCompletedAllInventorySteps = useMemo(() => {
    return steps.every((step) => {
      const value = stepCompletion[step.id];
      return value === 'completed' || value === 'not-applicable';
    });
  }, [stepCompletion, steps]);

  const hasUploadedRequiredFiles = Boolean(matrixFileName) && Boolean(methodFileName);

  const hasSelectedRequiredYesOptions = [1, 2, 4].some(
    (id) => attachmentCompletion[id] === 'completed'
  );

  const shouldShowSubmit =
    hasCompletedAllInventorySteps && hasUploadedRequiredFiles && hasSelectedRequiredYesOptions;

  const getAttachmentSelectValue = (id: number): AttachCompletion => attachmentCompletion[id] ?? '';

  const handleAttachmentChange = (id: number, value: AttachCompletion) => {
    setAttachmentCompletion((current) => ({
      ...current,
      [id]: value,
    }));
  };

  const openUploadModal = (target: UploadTarget) => {
    setUploadModalTarget(target);
    setPendingFileName(target === 'matrix' ? matrixFileName : methodFileName);
  };

  const closeUploadModal = () => {
    setUploadModalTarget(null);
    setPendingFileName('');
  };

  const confirmUpload = () => {
    if (!uploadModalTarget || !pendingFileName.trim()) {
      return;
    }

    if (uploadModalTarget === 'matrix') {
      setMatrixFileName(pendingFileName.trim());
    } else {
      setMethodFileName(pendingFileName.trim());
    }

    closeUploadModal();
  };

  useEffect(() => {
    if (isAlertRetracted) {
      return;
    }

    const timer = setTimeout(() => {
      setIsAlertRetracted(true);
    }, 5500);

    return () => clearTimeout(timer);
  }, [isAlertRetracted]);

  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-gray-900">1325146-Tech Solutions Demo & Training (CN)</h1>
          {/* <p className="mt-1 text-xs text-gray-500">任务 ID: {taskId} | 任务编码: R000009895379</p> */}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="flex items-center rounded border border-gray-300 px-4 py-1.5 text-sm transition hover:bg-gray-50"
          >
            <ChevronLeft size={16} className="mr-1" /> 返回程序列表
          </button>
          <button className="flex items-center rounded bg-blue-600 px-4 py-1.5 text-sm text-white shadow-sm transition hover:bg-blue-700">
            <Download size={14} className="mr-1.5" /> 导出底稿
          </button>
        </div>
      </div>

      <div className="relative space-y-4">
        {isAlertRetracted && (
          <button
            type="button"
            onClick={() => setIsAlertRetracted(false)}
            aria-label="展开操作指引"
            className="absolute right-0 top-[-20px] z-40 flex h-[44px] w-[30px] items-center justify-center rounded-l-xl bg-[#00338D] text-white shadow-lg transition hover:w-[34px] hover:bg-[#002b75]"
          >
            <AlertCircle size={16} strokeWidth={2.2} />
          </button>
        )}
        <div
          className={cn(
            'prewp-alert-shell absolute left-0 right-0 top-[-20px] z-30 overflow-hidden rounded-xl border border-[#8bbcff] bg-white shadow-sm transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]',
            !isAlertRetracted && 'prewp-alert-border-shimmer',
            isAlertRetracted ? 'pointer-events-none' : 'pointer-events-auto'
          )}
          style={{
            transform: isAlertRetracted ? 'translateX(calc(100% - 30px))' : 'translateX(0)',
            opacity: isAlertRetracted ? 0 : 1,
          }}
        >
          <div className="flex items-center gap-3 px-4 py-2.5">
            <div className="rounded-lg bg-blue-50/50 p-3 text-slate-400">
              <Info size={16} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {/* <span className="text-xs font-bold uppercase tracking-wider text-slate-400">操作指引</span> */}
                <span className="h-1 w-1 rounded-full bg-slate-200" />
                <span className="text-[10px] font-medium text-slate-300">Requirement</span>
              </div>
              <p className="mt-0.5 text-sm font-medium leading-5 text-[#00338d]">
                请先完成此页<span className="font text-red-500">存货盘点底稿</span>再进入创建程序流程。
              </p>
            </div>
            <div className="flex items-center gap-2">
            </div>
          </div>
        </div>

        <h2 className="border-l-4 border-blue-600 pl-3 text-lg font-bold">存货工作底稿</h2>
        <div className="ml-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="space-y-5 p-6">
            {[...rightColumnTopDetails, ...rightColumnBottomDetails].map((detail, index) => (
              <div key={`${detail.label}-${index}`} className="flex items-start gap-3">
                <span className="w-40 shrink-0 text-gray-500">{detail.label}</span>
                <div className="min-w-0 flex-1">
                  <span className="whitespace-pre-line text-gray-800">{detail.value || '-'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="ml-4 flex items-center justify-between">
          <h2 className="border-l-4 border-blue-600 pl-3 text-lg font-bold">了解被审计单位的存货</h2>
          <button
            type="button"
            disabled={!hasCompletedAllInventorySteps && !inventoryStepsSaved}
            onClick={() => {
              if (hasCompletedAllInventorySteps || inventoryStepsSaved) {
                setInventoryStepsSaved((current) => !current);
              }
            }}
            className={cn(
              'rounded border px-4 py-1.5 text-sm transition',
              inventoryStepsSaved
                ? 'border-blue-600 bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                : 'border-gray-300 bg-white text-gray-700 shadow-none',
              !hasCompletedAllInventorySteps && !inventoryStepsSaved
                ? 'cursor-not-allowed border-gray-200 bg-white text-gray-400'
                : !inventoryStepsSaved
                  ? 'hover:bg-gray-50'
                  : ''
            )}
          >
            {inventoryStepsSaved ? '编辑' : '保存'}
          </button>
        </div>
        <div className="ml-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-100 text-xs tracking-wider text-gray-600">
                  <th className="w-24 border-b border-gray-200 px-4 py-2 font-medium">状态</th>
                  <th className="min-w-[420px] border-b border-gray-200 px-4 py-2 font-medium">程序</th>
                  <th className="min-w-[240px] border-b border-gray-200 px-4 py-2 font-medium">KAEG 索引</th>
                  <th className="min-w-[260px] border-b border-gray-200 px-4 py-2 font-medium">KPMG Clara Workflow 索引</th>
                  <th className="min-w-[220px] border-b border-gray-200 px-4 py-2 font-medium">是否已完成</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {steps.map((step) => {
                  const completionStatus = stepCompletion[step.id] ?? '';

                  return (
                    <tr key={step.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-6 align-top">
                        <div className="flex items-start justify-center">
                          <div
                            className="mt-1.5 h-2.5 w-2.5 rounded-full transition-colors"
                            style={{
                              backgroundColor: !completionStatus
                                ? '#D1D5DB'
                                : completionStatus === 'completed'
                                  ? '#0D92F8'
                                  : '#F0F4FF',
                            }}
                          />
                        </div>
                      </td>
                      <td className="whitespace-pre-line px-4 py-6 align-top font-medium leading-6 text-gray-800">
                        {step.id}. {step.procedure}
                      </td>
                      <td className="px-4 py-6 align-top">
                        <div className="space-y-1 text-xs leading-relaxed text-gray-600">
                          {step.kaeg.map((item, index) => (
                            <p key={index}>{item}</p>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-6 align-top">
                        <div className="space-y-3">
                          {step.workflow.length > 0 ? (
                            step.workflow.map((item, index) => (
                              <div key={index} className="text-xs text-gray-700">
                                <span className="font-medium">{item.name}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-6 align-top">
                        <label className="sr-only" htmlFor={`completion-${step.id}`}>
                          是否已完成
                        </label>
                        <select
                          id={`completion-${step.id}`}
                          value={completionStatus}
                          disabled={inventoryStepsSaved}
                          onChange={(event) =>
                            setStepCompletion((current) => ({
                              ...current,
                              [step.id]: event.target.value as StepCompletion,
                            }))
                          }
                          className={cn(
                            'w-[88px] bg-transparent px-3 py-2 text-xs text-gray-700 outline-none',
                            inventoryStepsSaved && 'cursor-not-allowed text-gray-400'
                          )}
                        >
                          <option value="">请选择</option>
                          <option value="completed">已完成   
                            completed</option>
                          <option value="not-applicable">不适用 N/A</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="border-l-4 border-blue-600 pl-3 text-lg font-bold">了解矩阵</h2>
        <div className="ml-4 overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => openUploadModal('matrix')}
              className="flex items-center rounded bg-blue-600 px-4 py-1.5 text-sm text-white shadow-sm transition hover:bg-blue-700"
            >
              <Download size={14} className="mr-1.5" /> 上传文件
            </button>
            <button className="rounded border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-500 transition hover:bg-gray-50">
              预览
            </button>
          </div>
          {matrixFileName && (
            <p className="mt-3 text-xs text-gray-500">已上传文件: {matrixFileName}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="border-l-4 border-blue-600 pl-3 text-lg font-bold">确定项目组的存货监盘方法</h2>
        <div className="ml-4 overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => openUploadModal('method')}
              className="flex items-center rounded bg-blue-600 px-4 py-1.5 text-sm text-white shadow-sm transition hover:bg-blue-700"
            >
              <Download size={14} className="mr-1.5" /> 上传文件
            </button>
            <button className="rounded border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-500 transition hover:bg-gray-50">
              预览
            </button>
          </div>
          {methodFileName && (
            <p className="mt-3 text-xs text-gray-500">已上传文件: {methodFileName}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-l-4 border-blue-600 pl-3">
          <div className="flex flex-wrap items-center gap-5">
          <h2 className="text-lg font-bold">选择存货监盘方法</h2>
          <h3 className="text-sm text-red-400">
            *开启毕马威打卡星存货盘点模块前，须完成本页面中所有程序步骤。
          </h3>
          </div>
          <div className="flex items-center gap-4">
  
            {shouldShowSubmit && (
              <button className="flex items-center rounded bg-blue-600 border border-gray-300 px-4 py-1.5 text-sm text-white shadow-sm transition hover:bg-gray-50">
            创建程序
          </button>
            )}
          </div>
        </div>

        <div className="ml-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-100 text-xs tracking-wider text-gray-700">
                      <th colSpan={3} className="border-b border-gray-300 px-4 py-3 font-medium">
                        {/* <div className="flex items-center gap-6 pl-12">
                          <span className="font-semibold">为工作底稿选择语言</span>
                          <div className="flex items-center gap-5" role="radiogroup" aria-label="选择底稿语言">
                            <RetroRadio
                              label="英文"
                              selected={language === 'en'}
                              onClick={() => setLanguage('en')}
                            />
                            <RetroRadio
                              label="中文"
                              selected={language === 'zh'}
                              onClick={() => setLanguage('zh')}
                            />
                          </div>
                        </div> */}
                      </th>
                    </tr>
            
                
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attachmentSteps.map((item) => {
                  const completionStatus = getAttachmentSelectValue(item.id);
                  const shouldShowLink =
                    [1, 2, 3, 4, 5, 6, 7].includes(item.id) && completionStatus === 'completed';

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-6 align-top">
                        <div className="flex items-start justify-center">
                          <div
                            className="mt-1.5 h-2.5 w-2.5 rounded-full transition-colors"
                            style={{
                              backgroundColor: !completionStatus
                                ? '#D1D5DB'
                                : completionStatus === 'completed'
                                  ? '#0D92F8'
                                  : '#F0F4FF',
                            }}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-6 align-top font-medium leading-6 text-gray-800">
                        {item.id}. {item.nameZh}
                      </td>

                      <td className="px-4 py-6 align-top">
                        <div className="flex items-center gap-3">
                          <label className="sr-only" htmlFor={`attachment-completion-${item.id}`}>
                            Completion
                          </label>
                          <select
                            id={`attachment-completion-${item.id}`}
                            value={completionStatus}
                            onChange={(event) =>
                              handleAttachmentChange(item.id, event.target.value as AttachCompletion)
                            }
                            className="w-[88px] bg-transparent px-3 py-2 text-xs text-gray-700 outline-none"
                          >
                            <option value="">请选择</option>
                            <option value="completed">是 Yes</option>
                            <option value="not-applicable">否 No</option>
                          </select>

                          {shouldShowLink && (
                            <a
                              href="#"
                              aria-label={`Open link for attachment ${item.id}`}
                              title="Open link"
                              className="inline-flex items-center text-base leading-none text-[#3C85D3] transition hover:text-blue-800 hover:underline"
                            >
                              <LoginOutlined />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {uploadModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">
              {uploadModalTarget === 'matrix' ? '上传了解矩阵文件' : '上传存货监盘方法文件'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              请输入或选择要上传的文件名，确认后视为该区域已上传文件。
            </p>

            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={pendingFileName}
                onChange={(event) => setPendingFileName(event.target.value)}
                placeholder="例如：inventory-matrix.xlsx"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <input
                type="file"
                onChange={(event) =>
                  setPendingFileName(event.target.files?.[0]?.name ?? pendingFileName)
                }
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:text-blue-700"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeUploadModal}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmUpload}
                disabled={!pendingFileName.trim()}
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                确认上传
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .prewp-alert-border-shimmer {
          animation: prewpAlertBreath 1.9s ease-in-out infinite;
        }

        @keyframes prewpAlertBreath {
          0%, 100% {
            border-color: rgba(139, 188, 255, 0.55);
            box-shadow: 0 0 0 0 rgba(139, 188, 255, 0.08);
          }
          50% {
            border-color: rgba(139, 188, 255, 1);
            box-shadow: 0 0 0 3px rgba(139, 188, 255, 0.14);
          }
        }
      `}</style>
    </div>
  );
}
