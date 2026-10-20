import { getInventoryProcedureDecision } from '../utils/inventoryProcedureRules';
﻿/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LoginOutlined } from '@ant-design/icons';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download, Edit3, ExternalLink, Save, Upload, X, ZoomIn, ZoomOut } from 'lucide-react';
import InventoryMatrix, {
  INITIAL_INVENTORY_MATRIX_ROWS,
  createInventoryMatrixRow,
  resolveInventoryAuditApproach,
  type InventoryMatrixRow,
} from './InventoryMatrixJuly';
import MethodPlanMatrix, {
  createMethodPlanRow,
  type MethodPlanMatrixHandle,
  type MethodPlanRow,
} from './MethodPlanMatrixJuly';
import TableFullscreenFrame from './TableFullscreenFrameJuly';
import { parseChineseAddress } from '../utils/addressParser';

type AttachCompletion = '' | 'completed' | 'not-applicable';
type Language = 'zh' | 'en';

const INVENTORY_CONSIDERATION_HEADING_CLASS_NAME = 'text-base font-bold leading-6 text-[#00338D]';

type TaskDetail = {
  label: string;
  value: string;
  editable?: boolean;
};

type StepItem = {
  id: number;
  displayNumber?: number;
  procedure: string;
  kaeg: readonly string[];
  workflow: readonly { readonly name: string }[];
};

type AttachItem = {
  id: number;
  nameZh: string;
};

type UploadTarget = 'inventoryPolicy' | 'inventoryQuality' | 'method';
type PreWpJulyStage = 'understand' | 'method' | 'plan';

interface PreWpJulyProps {
  onBack?: () => void;
  taskId?: string;
  menuOpen?: boolean;
  showCompactNavigation?: boolean;
  showOverview?: boolean;
  onMenuClose?: () => void;
}

const JULY_NAV_STAGES: Array<{ key: PreWpJulyStage; label: string }> = [
  { key: 'method', label: '了解被审计单位的存货' },
  { key: 'understand', label: '存货了解矩阵' },
  { key: 'plan', label: '存货监盘方法' },
];

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const PRE_WP_JULY_STEP_REFERENCES = Object.freeze({
  1: Object.freeze({
    kaeg: Object.freeze(['项目组对被审计单位存货的了解 [7747.6870]']),
    workflow: Object.freeze([]),
  }),
  2: Object.freeze({
    kaeg: Object.freeze(['项目组对被审计单位存货的了解 [7747.6870]']),
    workflow: Object.freeze([{ name: '3.1 业务流程 - 了解有关情况' }]),
  }),
  3: Object.freeze({
    kaeg: Object.freeze(['项目组对被审计单位存货的了解 [7747.6870]']),
    workflow: Object.freeze([{ name: '3.1 业务流程 - 了解有关情况' }]),
  }),
  4: Object.freeze({
    kaeg: Object.freeze(['项目组对被审计单位存货的了解 [7747.6870]']),
    workflow: Object.freeze([{ name: '3.1 业务流程 - 了解有关情况' }]),
  }),
  5: Object.freeze({
    kaeg: Object.freeze(['项目组对被审计单位存货的了解 [7747.6870]']),
    workflow: Object.freeze([{ name: '3.1 业务流程 - 了解有关情况' }]),
  }),
  6: Object.freeze({
    kaeg: Object.freeze(['项目组对被审计单位存货的了解 [7747.6870]']),
    workflow: Object.freeze([{ name: '3.1 业务流程 - 了解有关情况' }]),
  }),
  7: Object.freeze({
    kaeg: Object.freeze(['项目组对被审计单位存货的了解 [7747.6870]']),
    workflow: Object.freeze([]),
  }),
  8: Object.freeze({
    kaeg: Object.freeze(['项目组对被审计单位存货的了解 [7747.6870]']),
    workflow: Object.freeze([{ name: '3.1 业务流程 - 了解有关情况' }]),
  }),
});

const KAEG_LIBRARY_URL = 'https://spo-global.kpmg.com/sites/cn-oi-svc-AUD/KAEG/Forms/AllItems.aspx';
const KAEG_MORE_INFO_URL = 'https://spo-global.kpmg.com/sites/cn-oi-svc-AUD/SitePages/DPPAudit_KAEG2025.aspx';
const INVENTORY_GUIDE_PAGE_BASE_URL = '/reference/inventory-count-guide';

function formatInventoryGuideText(text: string) {
  const paragraphs: string[] = [];
  let paragraph = '';
  const flush = () => {
    if (paragraph) paragraphs.push(paragraph);
    paragraph = '';
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }
    if (line.startsWith('©')) {
      flush();
      paragraphs.push(line);
      continue;
    }
    if (/^(?:\d+[)）.]|QRC#|Page \d)/.test(line)) flush();
    if (paragraph && /[。；：:！？]$/.test(paragraph)) flush();
    paragraph += line;
  }
  flush();
  return paragraphs.join('\n\n');
}

type InventoryNatureAnswers = Record<number, 'yes' | 'no'>;

function InventoryNatureQuestions({ answers, setAnswers, group = 'general' }: {
  answers: InventoryNatureAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<InventoryNatureAnswers>>;
  group?: 'general' | 'before-policy';
}) {
  const [previewPages, setPreviewPages] = useState<readonly number[] | null>(null);
  const [previewMode, setPreviewMode] = useState<'image' | 'text'>('image');
  const [previewZoom, setPreviewZoom] = useState(1);
  const [guidePageText, setGuidePageText] = useState<Record<string, string> | null>(null);
  const [guideTextError, setGuideTextError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${INVENTORY_GUIDE_PAGE_BASE_URL}/pages-text.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Guide text unavailable');
        return response.json() as Promise<Record<string, string>>;
      })
      .then(setGuidePageText)
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setGuideTextError(true);
      });
    return () => controller.abort();
  }, []);

  const openPreview = (pages: readonly number[]) => {
    setPreviewPages(pages);
    setPreviewZoom(1);
  };

  const closePreview = () => {
    setPreviewPages(null);
  };

  useEffect(() => {
    if (!previewPages) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePreview();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [previewPages]);

  const pageLabel = (pages: readonly number[]) => pages.join(pages.length === 2 ? ' & ' : '、');

  const documentLink = (title: string) => (
    <a
      href={KAEG_LIBRARY_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="打开 KAEG 文档库查找该文件"
      className="rounded-sm font-medium text-[#2c547d] no-underline transition hover:bg-sky-100 hover:text-lime-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00338D]"
    >
      {title}
      <ExternalLink size={12} className="ml-1 inline-block align-baseline" aria-hidden="true" />
    </a>
  );

  const guideButton = (pages: readonly number[]) => (
    <button
      type="button"
      onClick={() => openPreview(pages)}
      aria-label={`预览指导文件第 ${pageLabel(pages)} 页`}
      className="ml-1 inline-block align-baseline rounded-md border border-slate-400 px-2 text-sm font-medium leading-5 text-[#2c547d] transition hover:bg-sky-100 hover:text-cyan-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00338D]"
    >
      指导文件
    </button>
  );

  const questions: Array<{ number: number; content: React.ReactNode; recordInQuestion: string; note?: React.ReactNode }> = [
    {
      number: 1,
      content: '被审计单位的存货是否存放在多个地点？',
      note: <><div>下载{documentLink('KAEG-I：国际审计准则第530号——审计抽样')}，阅读 1.1.7 确定针对多个地点的实质性抽样方法，必要时寻求协助，完成相关计划工作。</div><div>针对存货存放地点清单的完整性，查看项目组可以执行哪些审计程序 {guideButton([16, 17])}</div></>,
      recordInQuestion: '3',
    },
    {
      number: 2,
      content: '被审计单位是否聘请外部专业机构（例如专业测量公司）协助进行存货盘点？',
      note: <><div>下载获取{documentLink('KAEG-I：国际审计准则第620号——利用审计师的专家的工作')}，了解更多相关信息</div><div>针对利用外部专业机构，查看项目组如何利用并取代哪些存货监盘程序 {guideButton([12, 13, 14])}</div></>,
      recordInQuestion: '3',
    },
    {
      number: 3,
      content: '项目组是否识别到被审计单位持有在产品？',
      note: <>查看如何监盘上述类型的存货 {guideButton([52])}</>,
      recordInQuestion: '3',
    },
    {
      number: 4,
      content: '项目组是否识别到被审计单位持有所有权不属于被审计单位的存货以及在途存货？',
      note: <>查看如何处理上述类型的存货 {guideButton([54])}</>,
      recordInQuestion: '3',
    },
    {
      number: 5,
      content: '被审计单位是否拥有高度自动化仓库？',
      note: <>查看项目组如何应对 {guideButton([64])}</>,
      recordInQuestion: '3',
    },
    {
      number: 6,
      content: '被审计单位是否已执行了一系列自动化程序来协助盘点？',
      recordInQuestion: '4',
    },
    {
      number: 7,
      content: '项目组是否识别到无法用标签予以标识、数量难以估计或质量难以确定的特殊类型存货（如矿石堆、稀有玉石、林木、原油等）？',
      note: <>查看如何开展存货监盘，涉及的相关计量或估计方法 {guideButton([38])}</>,
      recordInQuestion: '5 & 6',
    },
    {
      number: 8,
      content: '项目组是否识别到其他特殊类型的存货？',
      note: <>查看如何开展存货监盘，涉及的相关计量或估计方法 {guideButton([42, 44])}</>,
      recordInQuestion: '5 & 6',
    },
  ];

  return <>
    <ul aria-label="存货性质与存货监盘考虑事项" className="space-y-4 py-3 text-sm text-slate-800">
      {questions.filter((question) => group === 'before-policy' ? [2, 6].includes(question.number) : ![2, 6].includes(question.number)).map((question) => (
        <li key={question.number}>
          <div className="min-w-0 leading-6">
            <div className="font-semibold">{question.content}</div>
            {question.note && <div className="mt-1">{question.note}</div>}
            <div className="mt-2">
              <fieldset className="inline-flex flex-wrap items-center gap-x-10 gap-y-1">
                <legend className="sr-only">{question.content} 是否</legend>
                {(['yes', 'no'] as const).map((answer) => (
                  <label key={answer} className="inline-flex cursor-pointer items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name={`inventory-nature-question-${question.number}`}
                      value={answer}
                      checked={answers[question.number] === answer}
                      onChange={() => setAnswers((current) => ({ ...current, [question.number]: answer }))}
                      className="h-4 w-4 shrink-0 accent-[#00338D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00338D]"
                    />
                    <span className={cn('font-medium transition-colors', answers[question.number] === answer ? 'font-semibold text-[#00338D]' : 'text-slate-600 hover:text-[#00338D]')}>
                      {answer === 'yes' ? `是，记录在问题${question.recordInQuestion}` : '否'}
                    </span>
                  </label>
                ))}
              </fieldset>
            </div>
          </div>
        </li>
      ))}
    </ul>
    {previewPages && createPortal(
      <div onClick={closePreview} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/25 p-3 backdrop-blur-md sm:p-6">
        <section
          role="dialog"
          aria-label={`指导文件第 ${pageLabel(previewPages)} 页预览`}
          onClick={(event) => event.stopPropagation()}
          className="flex max-h-[88vh] w-full max-w-[1060px] flex-col overflow-hidden rounded-xl border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
        >
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">指导文件 · Page {pageLabel(previewPages)}</h3>
              <p className="mt-0.5 text-xs text-slate-300">共 {previewPages.length} 页 · 可切换原版图片和可选中文字</p>
            </div>
            <div className="flex items-center gap-2">
              <div role="group" aria-label="预览显示方式" className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs">
                {(['image', 'text'] as const).map((mode) => <button
                  key={mode}
                  type="button"
                  onClick={() => setPreviewMode(mode)}
                  aria-pressed={previewMode === mode}
                  className={cn('rounded px-2.5 py-1 font-medium transition', previewMode === mode ? 'bg-white text-[#00338D] shadow-sm' : 'text-slate-500 hover:text-slate-800')}
                >{mode === 'image' ? '原版图片' : '提取文字'}</button>)}
              </div>
              <div role="group" aria-label="预览缩放" className="inline-flex items-center gap-1 text-xs text-slate-600">
                <button type="button" onClick={() => setPreviewZoom((zoom) => Math.max(0.75, zoom - 0.25))} disabled={previewZoom <= 0.75} aria-label="缩小预览" className="rounded p-1 hover:bg-slate-100 disabled:opacity-40"><ZoomOut size={16} /></button>
                <span className="w-9 text-center tabular-nums">{Math.round(previewZoom * 100)}%</span>
                <button type="button" onClick={() => setPreviewZoom((zoom) => Math.min(2, zoom + 0.25))} disabled={previewZoom >= 2} aria-label="放大预览" className="rounded p-1 hover:bg-slate-100 disabled:opacity-40"><ZoomIn size={16} /></button>
              </div>
              <button type="button" onClick={closePreview} aria-label="关闭指导文件预览" className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00338D]">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="min-h-0 overflow-auto bg-slate-100/80 p-2 sm:p-4">
            <div className="mx-auto space-y-4" style={previewMode === 'image' ? { width: `${previewZoom * 100}%` } : undefined}>
              {previewMode === 'image' ? previewPages.map((page) => <figure key={page} className="overflow-hidden rounded-md bg-white shadow-sm">
                <img src={`${INVENTORY_GUIDE_PAGE_BASE_URL}/page-${page}.png`} alt={`指导文件 PDF 第 ${page} 页`} className="block h-auto w-full" />
              </figure>) : previewPages.map((page) => <section key={page} aria-label={`第 ${page} 页提取文字`} className="rounded-md bg-white px-5 py-5 shadow-sm sm:px-8">
                <h4 className="mb-3 border-b border-slate-100 pb-2 text-xs font-semibold text-[#00338D]">第 {page} 页</h4>
                <div className="whitespace-pre-wrap break-words text-slate-800" style={{ fontSize: `${15 * previewZoom}px`, lineHeight: 1.8 }}>
                  {guidePageText?.[String(page)] ? formatInventoryGuideText(guidePageText[String(page)]) : (guideTextError ? '文字提取暂不可用，请查看原版图片。' : '正在读取文字…')}
                </div>
              </section>)}
            </div>
          </div>
        </section>
      </div>,
      document.body
    )}
  </>;
}

const PRE_WP_JULY_STEP_NOTE_PLACEHOLDERS: Partial<Record<number, string>> = {};

const PRE_WP_JULY_STEP_TWO_SUBQUESTIONS = Object.freeze([
  Object.freeze({
    id: '1.1',
    text: '被审计单位的存货是否存放在多个地点？',
    selection: 'single',
    options: Object.freeze(['是', '否']),
  }),
  Object.freeze({
    id: '1.2',
    text: '勾选被审计单位的存货类型及存储方式？',
    selection: 'multiple',
    options: Object.freeze(['在途存货', '在产品', '包装箱中的存货', '散货集装箱中的存货', '不涉及以上类型的存货']),
  }),
  Object.freeze({
    id: '1.3',
    text: '被审计单位是否持有如下特殊类型的存货？如有，请勾选。',
    selection: 'multiple',
    options: Object.freeze([
      '堆积型存货',
      '散装物品',
      '使用磅秤测量的存货',
      '易挥发或具有危害性的存货',
      '贵金属、石器、艺术品与收藏品',
      '木材、钢筋盘条、管子',
      '生产纸浆用木材、 牲畜',
      '池塘里的鱼、虾',
      '地下管道里的油、气或海底线缆等',
      '不涉及以上性质或存储方式的存货',
    ]),
    breakBeforeOption: '木材、钢筋盘条、管子',
  }),
  Object.freeze({
    id: '1.4',
    text: '被审计单位是否聘请外部专业机构（例如专业测量公司）协助进行存货盘点？',
    selection: 'single',
    options: Object.freeze(['是', '否']),
  }),
  Object.freeze({
    id: '1.5',
    text: '被审计单位是否存在高度自动化仓库？如有，请勾选。',
    selection: 'multiple',
    options: Object.freeze(['自动化与人工相结合的自动化仓库', '完全自动化仓库', '不存在高度自动化仓库']),
  }),
  Object.freeze({
    id: '1.6',
    text: '被审计单位仓库中是否存在所有权不属于被审计单位的存货',
    selection: 'single',
    options: Object.freeze(['是', '否']),
  }),
]);
const STEP_TWO_EXCLUSIVE_MULTIPLE_OPTIONS: Partial<Record<string, string>> = {
  '1.2': '不涉及以上类型的存货',
  '1.3': '不涉及以上性质或存储方式的存货',
  '1.5': '不存在高度自动化仓库',
};

const MULTIPLE_LOCATION_COMPLETENESS_PROCEDURES = Object.freeze([
  '询问被审计单位除管理层和财务部门以外的其他人员，如营销人员、仓库人员等，以了解有关存货存放地点的情况；',
  '比较被审计单位不同时期的存货存放地点清单，关注仓库变动情况，以确定是否存在因仓库变动而未将存货纳入盘点范围的情况发生；',
  '检查被审计单位存货的出、入库单，关注是否存在被审计单位尚未告知项目组的仓库（如期末库存量为零的仓库）；',
  '检查费用支出明细账和租赁合同，关注被审计单位是否租赁仓库并支付租金，如果有，该仓库是否已包括在被审计单位提供的仓库清单中；',
  '检查被审计单位“固定资产—房屋建筑物”明细清单，了解被审计单位可用于存放存货的房屋建筑物。',
]);

const INVENTORY_COUNT_COMPLETENESS_EVIDENCE = Object.freeze([
  '测试管理层针对存货盘点完整性的控制（如标签控制表）的控制运行有效性。',
  '执行“从实到账”盘点，即将存货实物中选取的项目（实）追查至管理层的存货盘点记录（账）。',
  '检查永续盘存清单是否存在“零数量箱柜”（即，记录表明存货数量为零的指定仓库地点），并确认从中选取的这些地点实际上没有存货。',
  '检查常规存放地点以外的存货是否已被盘点。',
]);

const SPECIAL_INVENTORY_GUIDANCE = Object.freeze([
  Object.freeze({
    inventoryType: '堆积型存货',
    procedure: '如糖、煤、钢废料\n这类存货通常既无标签也不做标记，在估计存货数量时存在困难，因此项目组可实施以下程序：\n1. 运用工程估测、几何计算、高空勘测，并依赖详细的存货记录；\n2. 如果堆场中的存货堆得不高，可进行实地监盘，或通过旋转存货堆加以估计',
  }),
  Object.freeze({
    inventoryType: '散装物品',
    procedure: '如贮窖存货、使用桶、箱、罐、槽等容器储存的液体、气体、谷类粮食、流体存货等。\n这类存货通常在盘点时通常难以加以识别和确认，在估计存货数量时存在困难，且在确定存货质量时存在困难，因此项目组可实施以下程序：\n1. 使用容器进行监盘或通过预先编号的清单列表加以确定；\n2. 使用浸蘸、测量棒、工程报告以及依赖永续存货记录；\n3. 选择样品进行化验与分析，或利用专家的工作。',
  }),
  Object.freeze({
    inventoryType: '使用磅秤测量的存货',
    procedure: '这类存货通常在估计存货数量时存在困难，因此项目组可实施以下程序：\n1. 在监盘前和监盘过程中均应检验磅秤的精准度，并留意磅秤的位置移动与重新调校程序；\n2. 检查和重新称量程序相结合；\n3. 检查秤量尺度的换算问题。',
  }),
  Object.freeze({
    inventoryType: '易挥发或具有危害性的存货',
    procedure: '这类存货通常无法观察数量和状况，因此项目组可实施以下程序：\n1. 了解存放的位置、包装物的大小；\n2. 检查购货、生产和销售记录；\n3. 了解生产、使用和处置情况；\n4. 利用专家的工作。',
  }),
  Object.freeze({
    inventoryType: '贵金属、石器、艺术品与收藏品',
    procedure: '这类存货通常在存货辨认、质量确定方面存在困难，因此项目组可实施以下程序：\n1. 选择样品进行化验与分析，或利用专家的工作',
  }),
  Object.freeze({
    inventoryType: '木材、钢筋盘条、管子',
    procedure: '这类存货通常通常无标签，但在盘点时会做上标记或用粉笔标识，或难以确定存货的数量或等级，因此项目组可实施以下程序：\n1. 检查标记或标识；\n2. 利用专家或被审计单位内部有经验人员的工作。',
  }),
  Object.freeze({
    inventoryType: '生产纸浆用木材、 牲畜',
    procedure: '这类存货通常在存货辨认、质量确定方面存在困难，因此项目组可实施以下程序：\n1. 通过过高空摄影以确定其存在性， 对不同时点的数量进行比较，并依赖永续存货记录；\n2. 通过安放在牲畜身上的电子环或芯片协助判断',
  }),
  Object.freeze({
    inventoryType: '池塘里的鱼、虾',
    procedure: '这类存货通常流动性强且易死亡，因此项目组可实施以下程序：\n1. 观察池塘的周边面积、鱼虾等养殖密度；\n2. 检查购买鱼虾苗、饲料交易记录；\n3. 了解每天鱼虾捕捞、销售情况；\n4. 利用专家的工作。',
  }),
  Object.freeze({
    inventoryType: '地下管道里的油、气或海底线缆等',
    procedure: '这类存货通常不能盘点，因此项目组可实施以下程序：\n1. 检查日输入或输出量；\n2. 了解地下管道或线缆的安装、使用情况',
  }),
]);

const STORAGE_METHOD_GUIDANCE = Object.freeze([
  Object.freeze({
    inventoryType: '在途存货',
    procedure: '项目组针对在途存货，可实施以下程序：\n1. 利用外部来源的文件（例如，外部发票、提货单、供应商对账单等）可以提供足够和适当的证据，证明存货在运输过程中的存在和准确性。',
  }),
  Object.freeze({
    inventoryType: '在产品',
    procedure: '项目组针对在产品，可实施以下程序：\n1. 确定如何识别完工程度；\n2. 如果在盘点过程中不能中止生产，应建议被审计单位将盘点前生产的在产品和盘点后生产的在产品区分开来，并考虑被审计单位的盘点程序是否恰当；\n3. 确定被审计单位用于生成期末报表中在产品数据的会计记录，若在产品能单独区分，应实施实地检查以取得支持在产品完工程度的证据；\n4. 如果有关在产品的完工程度未被明确列出，应当考虑采用其他有助于确定完工程度的措施，如获取零部件明细清单、标准成本表以及作业成本表，与工厂的有关人员进行讨论等，并运用职业判断；\n5. 考虑在产品的数量和性质以及被审计单位是否聘用评估专家或存货盘点人，根据存货生产过程的复杂程度考虑利用专家工作；\n6. 在可行的情况下，进行拍照以记录证据。',
  }),
  Object.freeze({
    inventoryType: '包装箱中的存货',
    procedure: '项目组针对包装箱中的存货，可实施开箱检查，并在执行中注意：\n1. 作为反舞弊程序，项目组应在与项目经理/合伙人讨论评估舞弊风险的基础上，选取开箱检查的存货类别和数量；\n2. 检查被审计单位的存货生产记录、包装记录等，佐证“空箱”、“堆为中空”或箱内货物不符的风险；\n3. 检查至最小单位的包装箱。包装箱无论大小，均不可仅依赖存货包装箱外面的标签/标识/箱单等；\n4. 考虑对密封的包装物称重。对放置在货架高处或其他难以够着的位置的包装箱，要求被审计单位将货架放下来或动用叉车协助盘点；\n5. 尽量避免让被审计单位事先了解，提高开箱检查的不可预见性；\n6. 开箱检查的存货项目包括难以盘点（如货架高处）、隐蔽性较强（如货堆中间、仓库偏僻角落）或库龄较长等的存货。',
  }),
  Object.freeze({
    inventoryType: '散货集装箱中的存货',
    procedure: '项目组针对散货集装箱中的存货，可实施以下程序：\n1. 采用把油尺或卷尺放入相关储罐或筒仓内，或读表的方式来测量箱内装物高度；\n2. 项目组在计划和实施针对存货的审计程序时可能考虑某些增量风险，如：\n- 将测量值换算为体积、质量或重量时可能有误；\n- 散货集装箱中的物品可能与管理层所声称的不相符。',
  }),
]);

const EXTERNAL_PROFESSIONAL_ORGANIZATION_GUIDANCE = Object.freeze([
  '被审计单位聘请外部专业机构执行的存货盘点本身并不足以为存货相关认定提供充分、适当的审计证据，项目组仍应在盘点现场观察盘点执行情况，实施存货监盘程序。项目组应在存货了解矩阵里记录“被审计单位是否使用了专家”。',
  '项目组应考虑外部专业机构是否构成管理层的专家，并在适用的情况下根据对其客观性、专业素养和胜任能力进行的评估，调整亲自测试的范围。',
]);

const AUTOMATED_WAREHOUSE_GUIDANCE = Object.freeze([
  Object.freeze({
    inventoryType: '自动化与人工相结合的自动化仓库',
    procedure: '被审计单位管理层都应评估其实际存货数量与记录的存货数量是否存在不符的风险。随着自动化程度的提高，这种风险可能会降低，但不太可能完全消除。\n管理层应设计和执行控制活动，以解决潜在的“存货数量可能与记录不符”的错报风险。',
  }),
  Object.freeze({
    inventoryType: '完全自动化仓库',
    procedure: '被审计单位的管理层或审计师可能无法直接在存货的货架/位置对库存数量执行计数测试，因为完全自动化的仓库不会接受任何人工的干扰。\n无论自动化程度如何，被审计单位管理层都应评估其实际存货数量与记录的存货数量是否存在不符的风险。随着自动化程度的提高，这种风险可能会降低，但不太可能完全消除。\n管理层应设计和执行控制活动，以解决潜在的“存货数量可能与记录不符”的错报风险。',
  }),
]);

const THIRD_PARTY_OWNED_INVENTORY_GUIDANCE = Object.freeze([
  '识别被审计单位是否有相关程序来单独标识该等存货。',
  '取得此类型存货的规格、数量等有关资料。',
  '了解管理层如何监督该等存货。',
  '观察这些存货的实际存放情况，确定其已被明确区分、单独摆放并标明，且未被纳入盘点范围，以及该等存货是如何从期末存货明细账金额中被剔除的（如适用）。',
  '关注是否存在某些存货不属于被审计单位的迹象，监盘人员一旦发现盘点计划之外的“受托代存存货”，应立即报告给现场负责人，以避免盘点范围不当。',
  '在可行的情况下，进行拍照以记录证据。',
]);

const includesAny = (value: string, terms: string[]) =>
  terms.some((term) => value.includes(term));

const isYesValue = (value: string) => includesAny(value, ['Yes', '是']);
const isNoValue = (value: string) => includesAny(value, ['No', '否', '鍚']);
const buildInventoryLocationValue = (row: Pick<MethodPlanRow, 'province' | 'city' | 'district' | 'address'>) =>
  row.address || [row.province, row.city, row.district].filter(Boolean).join(' ');

const buildInventoryRowFromMethodPlanRow = (row: MethodPlanRow) => ({
  location: buildInventoryLocationValue(row).trim(),
  companyName: row.companyName ?? '',
  intervieweeName: row.companyOwner ?? '',
  selectedAsSample: row.selectedAsSample ?? '',
  category: row.importedCategory ?? '',
  otherCharacteristics: row.importedOtherCharacteristics ?? '',
  endingBalanceConfirmation:
    row.importedEndingBalanceConfirmation ??
    (row.importedSystemType === '定期盘存系统'
      ? '期末存货余额通过期末实施的实地盘点结果来确定'
      : row.importedSystemType === '永续盘存系统'
        ? '期末存货余额通过存货出入库和移动的记录来确认'
        : ''),
  systemType: row.importedSystemType ?? '',
  thirdPartyStorage: row.importedThirdPartyStorage ?? '',
  inventoryCountPlan:
    row.importedInventoryCountPlan ??
    (row.countMethod === '在非期末时点完成盘点'
      ? '在期末以外的特定日期实施的、盘点对象为整个存货总体的实地存货盘点'
      : row.countMethod === '循环盘点'
        ? '在整个会计期间内，定期进行的存货盘点'
        : row.countMethod === '在期末完成盘点'
          ? '在期末实施的、盘点对象为整个存货总体的实地存货盘点'
          : ''),
  countMethod: row.countMethod === '从下拉菜单选择' ? '' : row.countMethod ?? '',
  useExpert: row.importedUseExpert ?? '',
  priorBalance: row.importedPriorBalance ?? '',
  finalPlannedBalance: row.importedFinalBalance ?? '',
  currentInterimStage: row.importedPriorInterimPlannedBalance ?? '',
  interimPlannedBalance: row.importedInterimPlannedBalance ?? '',
  plannedAttendancePrimary: row.importedPlannedAttendancePrimary ?? (row.auditApproach && row.auditApproach !== '从下拉菜单选择' ? '是' : ''),
  plannedAttendanceSecondary: row.importedPlannedAttendanceSecondary ?? (row.auditApproach === '独立盘点方案' ? '否，项目组采取独立盘点' : row.auditApproach && row.auditApproach !== '从下拉菜单选择' ? '是' : ''),
  auditApproach: row.auditApproach ?? '从下拉菜单选择',
  sampleQuantity: row.sampleQuantity ?? '',
  confirmedInventoryMethod: '从下拉菜单选择',
  confirmThirdPartyInventory: row.confirmThirdPartyInventory ?? '',
  monitorMode: row.monitorMode ?? '从下拉菜单选择',
  useExperts: row.useExperts ?? '',
  useInternalAudit: row.useInternalAudit ?? '',
});

const EMPTY_INVENTORY_IMPORT_ROW = createInventoryMatrixRow('');

const hasInventoryImportContent = (
  row: Pick<
    InventoryMatrixRow,
    | 'location'
    | 'companyName'
    | 'intervieweeName'
    | 'category'
    | 'otherCharacteristics'
    | 'endingBalanceConfirmation'
    | 'systemType'
    | 'thirdPartyStorage'
    | 'inventoryCountPlan'
    | 'countMethod'
    | 'useExpert'
    | 'selectedAsSample'
    | 'priorBalance'
    | 'currentInterimStage'
    | 'interimPlannedBalance'
    | 'finalPlannedBalance'
    | 'auditApproach'
    | 'sampleQuantity'
    | 'confirmThirdPartyInventory'
    | 'monitorMode'
    | 'useExperts'
    | 'useInternalAudit'
  >
) =>
  [
    row.location,
    row.companyName,
    row.intervieweeName,
    row.category,
    row.otherCharacteristics ?? '',
    row.priorBalance,
    row.currentInterimStage,
    row.interimPlannedBalance,
    row.finalPlannedBalance,
    row.endingBalanceConfirmation === EMPTY_INVENTORY_IMPORT_ROW.endingBalanceConfirmation
      ? ''
      : row.endingBalanceConfirmation,
    row.systemType === EMPTY_INVENTORY_IMPORT_ROW.systemType ? '' : row.systemType,
    row.thirdPartyStorage === EMPTY_INVENTORY_IMPORT_ROW.thirdPartyStorage ? '' : row.thirdPartyStorage,
    row.inventoryCountPlan === EMPTY_INVENTORY_IMPORT_ROW.inventoryCountPlan
      ? ''
      : row.inventoryCountPlan,
    row.countMethod === EMPTY_INVENTORY_IMPORT_ROW.countMethod ? '' : row.countMethod,
    row.useExpert === EMPTY_INVENTORY_IMPORT_ROW.useExpert ? '' : row.useExpert,
    row.selectedAsSample === EMPTY_INVENTORY_IMPORT_ROW.selectedAsSample ? '' : row.selectedAsSample,
    row.auditApproach === EMPTY_INVENTORY_IMPORT_ROW.auditApproach ? '' : row.auditApproach,
    row.sampleQuantity,
    row.confirmThirdPartyInventory === EMPTY_INVENTORY_IMPORT_ROW.confirmThirdPartyInventory ? '' : row.confirmThirdPartyInventory,
    row.monitorMode === EMPTY_INVENTORY_IMPORT_ROW.monitorMode ? '' : row.monitorMode,
    row.useExperts === EMPTY_INVENTORY_IMPORT_ROW.useExperts ? '' : row.useExperts,
    row.useInternalAudit === EMPTY_INVENTORY_IMPORT_ROW.useInternalAudit ? '' : row.useInternalAudit,
  ].some((value) => value.trim());

const isEmptyInventoryImportTarget = (row: InventoryMatrixRow) =>
  !hasInventoryImportContent(row);

const buildMethodPlanRowFromInventoryRow = (
  inventoryRow: InventoryMatrixRow,
  existingRow?: MethodPlanRow
) => {
  const parsedAddress = parseChineseAddress(inventoryRow.location);

  return createMethodPlanRow({
    ...existingRow,
    id: inventoryRow.id,
    companyName: inventoryRow.companyName,
    companyOwner: inventoryRow.intervieweeName,
    selectedAsSample: inventoryRow.selectedAsSample,
    sampleChangeReason: inventoryRow.sampleChangeReason,
    countMethod: inventoryRow.countMethod,
    sampleQuantity: inventoryRow.sampleQuantity,
    confirmThirdPartyInventory: inventoryRow.confirmThirdPartyInventory,
    auditApproach: resolveInventoryAuditApproach(inventoryRow) ?? inventoryRow.auditApproach,
    monitorMode: inventoryRow.monitorMode,
    useExperts: inventoryRow.useExperts,
    useInternalAudit: inventoryRow.useInternalAudit,
    province: parsedAddress.province,
    city: parsedAddress.city,
    district: parsedAddress.district,
    address: parsedAddress.fullAddress,
    importedCategory: inventoryRow.category,
    importedOtherCharacteristics: inventoryRow.otherCharacteristics ?? '',
    importedEndingBalanceConfirmation: inventoryRow.endingBalanceConfirmation,
    importedSystemType: inventoryRow.systemType,
    importedThirdPartyStorage: inventoryRow.thirdPartyStorage,
    importedInventoryCountPlan: inventoryRow.inventoryCountPlan,
    importedUseExpert: inventoryRow.useExpert,
    importedPriorBalance: inventoryRow.priorBalance,
    importedFinalBalance: inventoryRow.finalPlannedBalance,
    importedPriorInterimPlannedBalance: inventoryRow.currentInterimStage,
    importedInterimPlannedBalance: inventoryRow.interimPlannedBalance,
  });
};

const syncMethodPlanRowsFromInventoryRows = (
  inventoryRows: InventoryMatrixRow[],
  currentMethodRows: MethodPlanRow[]
) => {
  const currentRowsById = new Map(currentMethodRows.map((row) => [row.id, row]));
  return inventoryRows
    .filter((inventoryRow) => isYesValue(inventoryRow.selectedAsSample))
    .map((inventoryRow) =>
      buildMethodPlanRowFromInventoryRow(inventoryRow, currentRowsById.get(inventoryRow.id))
  );
};

function mergeImportedLocationsIntoInventoryRows(
  currentRows: InventoryMatrixRow[],
  importedRows: MethodPlanRow[]
) {
  const importedInventoryRows = importedRows
    .map(buildInventoryRowFromMethodPlanRow)
    .filter(hasInventoryImportContent);

  if (importedInventoryRows.length === 0) {
    return currentRows;
  }

  const baseRows =
    currentRows.length > 0
      ? currentRows.map((row) => ({ ...row }))
      : INITIAL_INVENTORY_MATRIX_ROWS.map((row) => ({ ...row }));

  let nextRows = baseRows;

  for (const importedRow of importedInventoryRows) {
    const emptyRowIndex = nextRows.findIndex(isEmptyInventoryImportTarget);

    if (emptyRowIndex >= 0) {
      nextRows[emptyRowIndex] = {
        ...nextRows[emptyRowIndex],
        ...importedRow,
      };
      continue;
    }

    nextRows = [
      ...nextRows,
      {
        ...createInventoryMatrixRow(Math.random().toString(36).slice(2, 11)),
        ...importedRow,
      },
    ];
  }

  return nextRows.filter(hasInventoryImportContent);
}

function RetroRadio({
  label,
  selected,
  onClick,
  disabled = false,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group flex select-none items-center gap-2',
        disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'
      )}
      aria-pressed={selected}
      aria-disabled={disabled}
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
          !disabled && 'group-hover:text-gray-900',
          disabled && 'text-gray-400',
          selected && 'text-gray-900'
        )}
      >
        {label}
      </span>
    </button>
  );
}

function KButton({ label, className = '' }: { label: string; className?: string }) {
  return (
    <button
      type="button"
      aria-label={`KAEG 索引 ${label}`}
      className={cn(
        'group/kaeg relative inline-flex h-4 w-4 flex-none items-center justify-center rounded-full border border-[#00338D] bg-[#00338D] text-[10px] font-semibold leading-none text-white shadow-sm transition hover:border-[#002b75] hover:bg-[#002b75] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#00338D]/30',
        className
      )}
    >
      K
      <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 w-max max-w-[300px] -translate-x-1/2 whitespace-normal rounded bg-gray-900 px-2 py-1 text-left text-[11px] leading-4 text-white opacity-0 shadow-lg transition-opacity group-hover/kaeg:opacity-100 group-focus-visible/kaeg:opacity-100">
        {label}
      </span>
    </button>
  );
}

function PreWpJulyCompactStepIndicator({
  currentStage,
  onStageClick,
  showSave,
  onSave,
  saved,
}: {
  currentStage: PreWpJulyStage;
  onStageClick: (stage: PreWpJulyStage) => void;
  showSave: boolean;
  onSave: () => void;
  saved: boolean;
}) {
  const stages = JULY_NAV_STAGES;

  return (
    <nav
      className="fixed right-5 top-1/2 z-[55] flex -translate-y-1/2 flex-col items-center gap-3 rounded-full border border-white/70 bg-white/65 px-2 py-3 shadow-lg backdrop-blur-xl"
      aria-label="快速步骤导航"
    >
      <span className="absolute bottom-6 top-6 left-1/2 w-px -translate-x-1/2 bg-slate-200" aria-hidden="true" />
      {stages.map((stage, index) => {
        const isActive = stage.key === currentStage;
        return (
          <button
            key={stage.key}
            type="button"
            onClick={() => onStageClick(stage.key)}
            title={stage.label}
            aria-label={`${index + 1} ${stage.label}`}
            aria-current={isActive ? 'step' : undefined}
            className={cn(
              'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold shadow-sm transition hover:scale-105',
              isActive
                ? 'border-[#00338D] bg-[#00338D] text-white'
                : 'border-slate-300 bg-white text-slate-500 hover:border-blue-400 hover:text-[#00338D]'
            )}
          >
            {index + 1}
          </button>
        );
      })}
      {showSave && (
        <button
          type="button"
          onClick={onSave}
          title="保存"
          aria-label="保存"
          className={cn(
            'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold shadow-sm backdrop-blur-sm transition hover:scale-105',
            saved
              ? 'border-blue-600/75 bg-white/90 text-blue-700 hover:border-sky-300'
              : 'border-blue-600/30 bg-white/80 text-blue-700 hover:border-sky-300'
          )}
        >
          <Save size={15} strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </nav>
  );
}

function StepProcedureCell({
  step,
  children,
  showInventoryNatureQuestions = false,
  inventoryNatureAnswers,
  setInventoryNatureAnswers,
}: {
  step: StepItem;
  children?: React.ReactNode;
  showInventoryNatureQuestions?: boolean;
  inventoryNatureAnswers?: InventoryNatureAnswers;
  setInventoryNatureAnswers?: React.Dispatch<React.SetStateAction<InventoryNatureAnswers>>;
}) {
  const [areInventoryNatureQuestionsCollapsed, setAreInventoryNatureQuestionsCollapsed] = useState(false);
  return (
    <div className="relative space-y-1">
      <div className="font-medium leading-6 text-gray-800">
        {step.displayNumber !== undefined && (
          <span className="absolute -left-6 top-0 w-5 text-right font-medium leading-6 text-gray-800">{step.displayNumber}.<sup className="absolute -right-1 top-0 text-[10px] leading-none text-red-500" aria-hidden="true">*</sup><span className="sr-only">（必填）</span></span>
        )}
        <span className={cn([4, 5].includes(step.id) ? 'inline' : 'inline-flex flex-wrap items-start gap-1')}>
          <span className={cn('whitespace-pre-line', step.id === 1 && INVENTORY_CONSIDERATION_HEADING_CLASS_NAME)}>
            {step.procedure}
          </span>
          <span className={cn('inline-flex items-center gap-1', [4, 5].includes(step.id) ? 'ml-1 align-middle' : 'pt-1')}>
            {step.kaeg.map((item, index) => (
              <KButton key={`${step.id}-kaeg-${index}`} label={item} />
            ))}
          </span>
          {showInventoryNatureQuestions && (
            <button
              type="button"
              onClick={() => setAreInventoryNatureQuestionsCollapsed((current) => !current)}
              aria-label={areInventoryNatureQuestionsCollapsed ? '展开存货性质子题目' : '收起存货性质子题目'}
              aria-expanded={!areInventoryNatureQuestionsCollapsed}
              aria-controls="inventory-nature-questions"
              className="ml-2 inline-flex h-5 w-5 align-middle items-center justify-center rounded text-slate-500 transition hover:bg-slate-100 hover:text-[#00338D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00338D]"
            >
              {areInventoryNatureQuestionsCollapsed ? <ChevronDown size={15} aria-hidden="true" /> : <ChevronUp size={15} aria-hidden="true" />}
            </button>
          )}
        </span>
      </div>
      {(step.id === 2 || step.id === 7) && <div className="space-y-0.5">
        {step.workflow.length > 0 ? (
          step.workflow.map((item, index) => (
            <div
              key={`${step.id}-workflow-${index}`}
              className="inline-flex min-w-0 items-start gap-1 text-xs font-medium leading-5 text-gray-700"
            >
              <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-gray-400">
                KAEG
                <ExternalLink size={11} strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="min-w-0 whitespace-pre-line">{item.name}</span>
            </div>
          ))
        ) : null}
      </div>}
      {showInventoryNatureQuestions && inventoryNatureAnswers && setInventoryNatureAnswers && (
        <div id="inventory-nature-questions" hidden={areInventoryNatureQuestionsCollapsed}>
          <InventoryNatureQuestions answers={inventoryNatureAnswers} setAnswers={setInventoryNatureAnswers} />
        </div>
      )}
      {children}
    </div>
  );
}

function ConnectedOptionGroup({
  ariaLabel,
  options,
  selectedOptions,
  multiple,
  compact = false,
  breakBeforeOption,
  onSelect,
}: {
  ariaLabel: string;
  options: readonly string[];
  selectedOptions: readonly string[];
  multiple: boolean;
  compact?: boolean;
  breakBeforeOption?: string;
  onSelect: (option: string) => void;
}) {
  return (
    <div
      className={cn(
        multiple
          ? 'flex w-full flex-wrap gap-2'
          : 'inline-flex max-w-full flex-wrap pl-px pt-px'
      )}
      role="group"
      aria-label={ariaLabel}
      aria-multiselectable={multiple || undefined}
    >
      {options.map((option) => {
        const isSelected = selectedOptions.includes(option);

        return (
          <React.Fragment key={option}>
            {multiple && option === breakBeforeOption && (
              <span className="h-0 basis-full" aria-hidden="true" />
            )}
            <button
              type="button"
              onClick={() => onSelect(option)}
              aria-pressed={isSelected}
              className={cn(
                'border px-3 text-xs font-medium leading-5 transition-colors focus:relative focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-300',
                multiple ? 'w-auto rounded-md' : '-ml-px -mt-px',
                compact ? 'min-w-12 py-0.5' : 'min-h-8 py-1.5',
                isSelected
                  ? 'relative z-[1] border-[#00338D] bg-[#00338D] text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-blue-50 hover:text-[#00338D]'
              )}
            >
              {option}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function GuidanceTable({
  title,
  rows,
  typeHeader = '存货类型',
  summaryOnly,
}: {
  title: string;
  rows: readonly { readonly inventoryType: string; readonly procedure: string }[];
  typeHeader?: string;
  summaryOnly?: string;
}) {
  if (rows.length === 0 && !summaryOnly) {
    return null;
  }

  return (
    <section className="space-y-2">
      <h5 className="text-sm font-semibold text-black">{title}</h5>
      <div className="relative overflow-hidden rounded-xl bg-white shadow-sm">
        <span
          className="absolute inset-y-0 left-0 z-10 w-1.5 rounded-r-full bg-[linear-gradient(180deg,#cfd4da_0%,#00338D_7%,#00338D_93%,#cfd4da_100%)]"
          aria-hidden="true"
        />
        <table className="w-full border-collapse text-left text-xs">
          {summaryOnly ? (
            <tbody className="bg-white">
              <tr>
                <td className="bg-[#eef4ff] px-4 py-3 font-semibold text-gray-900">
                  {summaryOnly}
                </td>
              </tr>
            </tbody>
          ) : (
            <>
              <thead className="border-b border-[#c9dcef] bg-[#e7f2fb] text-gray-800">
                <tr>
                  <th className="w-48 border-r border-[#c9dcef] px-3 py-2 font-semibold">{typeHeader}</th>
                  <th className="px-3 py-2 font-semibold">项目组应关注</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {rows.map((row) => (
                  <tr key={row.inventoryType} className="align-top">
                    <td className="border-r border-blue-100 bg-[#eef4ff] px-3 py-3 font-semibold text-gray-900">
                      {row.inventoryType}
                    </td>
                    <td className="whitespace-pre-line px-3 py-3 leading-5 text-gray-700">{row.procedure}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </table>
      </div>
    </section>
  );
}

const formatNumberedGuidance = (items: readonly string[]) =>
  items.map((item, index) => `${index + 1}. ${item}`).join('\n');

function StepTwoGuidanceCard({
  selections,
  generated,
}: {
  selections: Record<string, string[]>;
  generated: boolean;
}) {
  const guidanceExportRef = useRef<HTMLDivElement>(null);
  const [isExportingGuidance, setIsExportingGuidance] = useState(false);

  if (!generated) {
    return (
      <div className="flex min-h-[360px] items-center justify-center px-8 text-center">
        <div className="max-w-md">
          <h4 className="text-base font-semibold text-gray-800">审计指引尚未生成</h4>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            请完成存货性质问卷的全部分题，并点击“确认并生成指引”。
          </p>
        </div>
      </div>
    );
  }

  const hasMultipleLocations = (selections['1.1'] ?? []).includes('是');
  const usesExternalProfessionalOrganization = (selections['1.4'] ?? []).includes('是');
  const hasThirdPartyOwnedInventory = (selections['1.6'] ?? []).includes('是');
  const selectedStorageMethods = selections['1.2'] ?? [];
  const selectedSpecialInventoryTypes = selections['1.3'] ?? [];
  const selectedAutomatedWarehouseTypes = selections['1.5'] ?? [];
  const multipleLocationSummary = hasMultipleLocations
    ? '被审计单位的存货存放于多个地点'
    : '被审计单位的存货未存放于多个地点';
  const storageSummaryOnly = selectedStorageMethods.includes('不涉及以上类型的存货')
    ? '此次审计不涉及在途、在产品、包装箱或散货集装箱中的存货'
    : undefined;
  const specialInventorySummaryOnly = selectedSpecialInventoryTypes.includes(
    '不涉及以上性质或存储方式的存货'
  )
    ? '此次审计不涉及上述特殊性质或存储方式的存货'
    : undefined;
  const externalOrganizationSummary = usesExternalProfessionalOrganization
    ? '此次盘点有外部专业机构参与存货盘点'
    : '此次盘点无外部专业机构参与存货盘点';
  const automatedWarehouseSummaryOnly = selectedAutomatedWarehouseTypes.includes(
    '不存在高度自动化仓库'
  )
    ? '被审计单位不存在高度自动化仓库'
    : undefined;
  const thirdPartyOwnedInventorySummary = hasThirdPartyOwnedInventory
    ? '存在所有权不属于被审计单位的存货'
    : '不存在所有权不属于被审计单位的存货';

  const multipleLocationRows = hasMultipleLocations
    ? [
        {
          inventoryType: multipleLocationSummary,
          procedure: `如果被审计单位的存货存放在多个地点，项目组应要求被审计单位提供一份完整的存货存放地点清单（包括期末库存量为零的仓库、租赁的仓库，以及第三方代被审计单位保管存货的仓库等），并根据具体情况下的风险评估结果，执行以下一项或多项审计程序，评估其完整性：\n${formatNumberedGuidance(MULTIPLE_LOCATION_COMPLETENESS_PROCEDURES)}\n\n项目组应考虑获取关于盘点完整性的证据，包括但不限于：\n${formatNumberedGuidance(INVENTORY_COUNT_COMPLETENESS_EVIDENCE)}`,
        },
      ]
    : [];

  const storageGuidanceRows = STORAGE_METHOD_GUIDANCE.filter((item) =>
    selectedStorageMethods.includes(item.inventoryType)
  );

  const specialGuidanceRows = SPECIAL_INVENTORY_GUIDANCE.filter((item) =>
    selectedSpecialInventoryTypes.includes(item.inventoryType)
  );

  const externalOrganizationRows = usesExternalProfessionalOrganization
    ? [
        {
          inventoryType: '',
          procedure: EXTERNAL_PROFESSIONAL_ORGANIZATION_GUIDANCE.join('\n\n'),
        },
      ]
    : [];

  const automatedWarehouseGuidanceRows = AUTOMATED_WAREHOUSE_GUIDANCE.filter((item) =>
    selectedAutomatedWarehouseTypes.includes(item.inventoryType)
  );

  const thirdPartyOwnedInventoryRows = hasThirdPartyOwnedInventory
    ? [
        {
          inventoryType: thirdPartyOwnedInventorySummary,
          procedure: `${formatNumberedGuidance(THIRD_PARTY_OWNED_INVENTORY_GUIDANCE)}`,
        },
      ]
    : [];

  const handleExportGuidancePdf = async () => {
    const guidanceElement = guidanceExportRef.current;
    if (!guidanceElement || isExportingGuidance) {
      return;
    }

    setIsExportingGuidance(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      await pdf.html(guidanceElement, {
        margin: [10, 10, 12, 10],
        autoPaging: 'text',
        html2canvas: {
          backgroundColor: '#ffffff',
          scale: 1.25,
          useCORS: true,
        },
        width: 190,
        windowWidth: guidanceElement.scrollWidth,
      });
      pdf.save('问题2-审计指引.pdf');
    } finally {
      setIsExportingGuidance(false);
    }
  };

  return (
    <div ref={guidanceExportRef} className="space-y-6 bg-white p-5">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <h4 className="text-base font-semibold text-gray-900">审计指引</h4>
        <button
          type="button"
          onClick={handleExportGuidancePdf}
          disabled={isExportingGuidance}
          data-html2canvas-ignore="true"
          className="inline-flex items-center gap-1.5 rounded border border-blue-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#00338D] transition hover:border-[#00338D] hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60"
        >
          <Download size={13} aria-hidden="true" />
          {isExportingGuidance ? '正在导出…' : '导出指引'}
        </button>
      </div>

      <GuidanceTable
        title="1.1 存货存放地点"
        rows={multipleLocationRows}
        typeHeader="存货存放情况"
        summaryOnly={hasMultipleLocations ? undefined : multipleLocationSummary}
      />
      <GuidanceTable
        title="1.2 存货类型及存储方式"
        rows={storageGuidanceRows}
        typeHeader="存货类型及存储方式"
        summaryOnly={storageSummaryOnly}
      />
      <GuidanceTable
        title="1.3 特殊类型的存货"
        rows={specialGuidanceRows}
        typeHeader="特殊类型的存货"
        summaryOnly={specialInventorySummaryOnly}
      />
      <GuidanceTable
        title="1.4 外部专业机构参与存货盘点"
        rows={externalOrganizationRows}
        typeHeader={externalOrganizationSummary}
        summaryOnly={usesExternalProfessionalOrganization ? undefined : externalOrganizationSummary}
      />

      <GuidanceTable
        title="1.5 高度自动化仓库"
        rows={automatedWarehouseGuidanceRows}
        typeHeader="自动化仓库类型"
        summaryOnly={automatedWarehouseSummaryOnly}
      />
      <GuidanceTable
        title="1.6 所有权不属于被审计单位的存货"
        rows={thirdPartyOwnedInventoryRows}
        typeHeader="存货所有权情况"
        summaryOnly={hasThirdPartyOwnedInventory ? undefined : thirdPartyOwnedInventorySummary}
      />
    </div>
  );
}

type JulyDraft = {
  attachmentCompletion: Record<number, AttachCompletion>;
  language: Language;
  inventoryPolicyFileName: string;
  inventoryQualityFileName: string;
  methodFileName: string;
  inventoryMatrixRows: InventoryMatrixRow[];
  methodPlanRows: MethodPlanRow[];
  methodPlanStepFiles: Record<number, string>;
  methodPlanStepNotes: Record<number, string>;
  entityRiskLevel: string;
  entityIndustry: string;
  entityIndustrySegment: string;
  interimInventoryTotal: string;
  yearEndInventoryTotal: string;
  stepTwoSelections: Record<string, string[]>;
  inventoryNatureAnswers: InventoryNatureAnswers;
  isStepTwoConfirmed: boolean;
  hasConfirmedKoicPush: boolean;
  publishedMethodPlanRows: MethodPlanRow[];
};

function readJulyDraft(key: string): Partial<JulyDraft> | null {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    return saved?.version === 1 && saved.data && typeof saved.data === 'object'
      ? saved.data : null;
  } catch {
    return null;
  }
}

export default function PreWpJuly({ onBack, taskId, menuOpen = false, showCompactNavigation = true, showOverview = false, onMenuClose }: PreWpJulyProps) {
  const draftKey = `wp-for-july:draft:1325146:${taskId || 'default'}`;
  const [savedDraft] = useState(() => readJulyDraft(draftKey));
  const [saveError, setSaveError] = useState('');
  const menuRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLButtonElement>('[aria-current="step"]')?.focus({ preventScroll: true });
    const closeMenu = () => {
      onMenuClose?.();
      document.getElementById('wp-july-menu-button')?.focus({ preventScroll: true });
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen, onMenuClose]);
  const [attachmentCompletion, setAttachmentCompletion] = useState<Record<number, AttachCompletion>>(savedDraft?.attachmentCompletion ?? {});
  const [language, setLanguage] = useState<Language>(savedDraft?.language ?? 'zh');
  const [inventoryStepsSaved, setInventoryStepsSaved] = useState(Boolean(savedDraft));
  const [uploadModalTarget, setUploadModalTarget] = useState<UploadTarget | null>(null);
  const [pendingFileName, setPendingFileName] = useState('');
  const [inventoryPolicyFileName, setInventoryPolicyFileName] = useState(savedDraft?.inventoryPolicyFileName ?? '');
  const [inventoryQualityFileName, setInventoryQualityFileName] = useState(savedDraft?.inventoryQualityFileName ?? '');
  const [methodFileName, setMethodFileName] = useState(savedDraft?.methodFileName ?? '');
  const [inventoryMatrixRows, setInventoryMatrixRows] = useState<InventoryMatrixRow[]>(
    savedDraft?.inventoryMatrixRows ?? INITIAL_INVENTORY_MATRIX_ROWS
  );
  const [methodPlanRows, setMethodPlanRows] = useState<MethodPlanRow[]>(savedDraft?.methodPlanRows ?? []);
  const [methodPlanStepFiles, setMethodPlanStepFiles] = useState<Record<number, string>>(savedDraft?.methodPlanStepFiles ?? {});
  const [methodPlanStepNotes, setMethodPlanStepNotes] = useState<Record<number, string>>(savedDraft?.methodPlanStepNotes ?? {});
  const [entityRiskLevel, setEntityRiskLevel] = useState(savedDraft?.entityRiskLevel ?? '');
  const [entityIndustry, setEntityIndustry] = useState(savedDraft?.entityIndustry ?? '');
  const [entityIndustrySegment, setEntityIndustrySegment] = useState(savedDraft?.entityIndustrySegment ?? '');
  const [interimInventoryTotal, setInterimInventoryTotal] = useState(savedDraft?.interimInventoryTotal ?? '');
  const [yearEndInventoryTotal, setYearEndInventoryTotal] = useState(savedDraft?.yearEndInventoryTotal ?? '');
  const [stepTwoSelections, setStepTwoSelections] = useState<Record<string, string[]>>(savedDraft?.stepTwoSelections ?? {});
  const [inventoryNatureAnswers, setInventoryNatureAnswers] = useState<InventoryNatureAnswers>(savedDraft?.inventoryNatureAnswers ?? {});
  const [isStepTwoConfirmed, setIsStepTwoConfirmed] = useState(savedDraft?.isStepTwoConfirmed ?? false);
  const [isStepTwoCollapsed, setIsStepTwoCollapsed] = useState(false);
  const [activeStepTwoCard, setActiveStepTwoCard] = useState<0 | 1>(0);
  const [stepTwoCarouselHeight, setStepTwoCarouselHeight] = useState<number | null>(null);
  const [activePreWpJulyStage, setActivePreWpJulyStage] = useState<PreWpJulyStage>('method');
  const [isWorkpaperIntroCollapsed, setIsWorkpaperIntroCollapsed] = useState(true);
  const [isMethodPlanPrepCollapsed, setIsMethodPlanPrepCollapsed] = useState(false);
  const [isPlanSetupCollapsed, setIsPlanSetupCollapsed] = useState(false);
  const [hasConfirmedKoicPush, setHasConfirmedKoicPush] = useState(savedDraft?.hasConfirmedKoicPush ?? false);
  const [showPrepAfterTask, setShowPrepAfterTask] = useState(false);
  const [publishedMethodPlanRows, setPublishedMethodPlanRows] = useState<MethodPlanRow[]>(savedDraft?.publishedMethodPlanRows ?? []);
  const currentDraft: JulyDraft = {
    attachmentCompletion, language, inventoryPolicyFileName, inventoryQualityFileName, methodFileName,
    inventoryMatrixRows, methodPlanRows, methodPlanStepFiles, methodPlanStepNotes,
    entityRiskLevel, entityIndustry, entityIndustrySegment, interimInventoryTotal, yearEndInventoryTotal,
    stepTwoSelections, inventoryNatureAnswers, isStepTwoConfirmed, hasConfirmedKoicPush, publishedMethodPlanRows,
  };
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() => savedDraft ? JSON.stringify(savedDraft) : '');
  const isCurrentDraftSaved = JSON.stringify(currentDraft) === lastSavedSnapshot;
  const persistDraft = (overrides: Partial<JulyDraft> = {}) => {
    const draft = { ...currentDraft, ...overrides };
    try {
      localStorage.setItem(draftKey, JSON.stringify({ version: 1, data: draft }));
      setLastSavedSnapshot(JSON.stringify(draft));
      setInventoryStepsSaved(true);
      setSaveError('');
      return true;
    } catch {
      setSaveError('保存失败，浏览器存储不可用或空间不足。填写内容仍保留在当前页面，请重试。');
      return false;
    }
  };
  const methodPlanMatrixRef = useRef<MethodPlanMatrixHandle>(null);
  const stepTwoCarouselRef = useRef<HTMLDivElement>(null);
  const stepTwoQuestionCardRef = useRef<HTMLElement>(null);
  const stepTwoGuidanceCardRef = useRef<HTMLElement>(null);
  const shouldRestoreStepTwoCardPositionRef = useRef(false);
  const inventorySectionRef = useRef<HTMLDivElement>(null);
  const methodPlanProgramSectionRef = useRef<HTMLDivElement>(null);
  const planSectionRef = useRef<HTMLDivElement>(null);
  const workpaperHeaderRef = useRef<HTMLDivElement>(null);
  const [showFloatingSaveButton, setShowFloatingSaveButton] = useState(false);
  const [isWorkpaperHeaderPinned, setIsWorkpaperHeaderPinned] = useState(false);

  const taskDetails: TaskDetail[] = [
    // { label: '任务名称', value: '存货监盘 FY25', editable: true },
    // { label: '种类', value: 'Inventory Physical Counts - Chinese version' },
    // { label: 'KDC 联系人', value: '-' },
    // { label: '程序', value: '现场监盘程序' },
    // { label: '项目合伙人', value: 'Wang Magie (SH/PTR)' },
    { label: '目标', value: '本工作底稿旨在说明按照《毕马威审计执行指引 - 国际版》(KAEG - I) 中的“存货”章节拟实施的程序。' },
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
      procedure: '根据了解到的被审计单位存货性质信息进行勾选，获悉项目组在设计或执行程序时应考虑的因素',
      ...PRE_WP_JULY_STEP_REFERENCES[2],
      kaeg: [],
    },
    {
      id: 2,
      displayNumber: 1,
      procedure: '询问管理层，了解并记录被审计单位的业务背景、存货的性质与构成类型。关注并记录存货的波动程度，发生的所有显著变化，以及是否存在任何高价值项目。',
      ...PRE_WP_JULY_STEP_REFERENCES[1],
    },
    {
      id: 3,
      displayNumber: 2,
      procedure: '考虑项目组就以往的存货盘点实施的审计程序的结果，获取有关被审计单位历史盘点结果的信息，并记录项目组识别和评估到的本期重大错报风险。',
      ...PRE_WP_JULY_STEP_REFERENCES[3],
    },
    {
      id: 4,
      displayNumber: 3,
      procedure: '了解被审计单位关于存货管理的会计政策或原则（包括聘请外部专业机构执行的存货盘点），记录被审计单位的存货盘点计划和方案。\n项目组应考虑外部专业机构是否构成管理层的专家，并在适用的情况下根据对其独立性、客观性专业素养和胜任能力进行的评估，调整亲自测试的范围。',
      ...PRE_WP_JULY_STEP_REFERENCES[4],
    },
    {
      id: 5,
      displayNumber: 4,
      procedure: '如果管理层已经执行了一系列自动化程序来协助盘点，记录程序抓取哪些信息以及该等信息如何传输至被审计单位的存货追踪系统，并记录有哪些相关的自动化控制活动（如通过系统接口）。\n记录项目组是否考虑引入特定项目组成员（如信息技术审计人员）。',
      ...PRE_WP_JULY_STEP_REFERENCES[5],
    },
    {
      id: 6,
      displayNumber: 5,
      procedure: '记录被审计单位是如何计量存货数量（包括必要时对天平、测量仪器、计量器等进行校准）。',
      ...PRE_WP_JULY_STEP_REFERENCES[6],
    },
    {
      id: 7,
      displayNumber: 6,
      procedure: '如果被审计单位对存货数量进行估计，记录其对项目组的存货监盘方法的影响及项目组的应对方式（如考虑引入专家或利用审计软件工具（SAT））。',
      ...PRE_WP_JULY_STEP_REFERENCES[7],
    },
    {
      id: 8,
      displayNumber: 7,
      procedure: '如果被审计单位使用抽样方法来选取存货实物进行盘点，则按照“评价被审计单位使用抽样方法的适当性（如适用）进行存货盘点”实施程序并记录。',
      ...PRE_WP_JULY_STEP_REFERENCES[8],
    },
    {
      id: 9,
      displayNumber: 8,
      procedure: '记录项目组在计划阶段，观察到的其他事项',
      kaeg: [],
      workflow: [],
    },

  ];

  const visibleMethodPlanPrepSteps = steps.filter((step) =>
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(step.id) && (!showOverview || step.id !== 1)
  );
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
      nameZh: '存货盘点-独立盘点（不可预见情形仅适用 4.1、4.4、4.5）',
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

  const methodPlanKoicGroupIds = useMemo(() => {
    const groupIds = new Set<number>();

    publishedMethodPlanRows.forEach((row) => {
      getInventoryProcedureDecision(row).groupIds.forEach((id) => groupIds.add(id));
    });

    return Array.from(groupIds);
  }, [publishedMethodPlanRows]);

  const visibleAttachmentSteps = attachmentSteps.filter((item) => methodPlanKoicGroupIds.includes(item.id));

  const hasUploadedRequiredFiles =
    Boolean(inventoryPolicyFileName) && Boolean(inventoryQualityFileName);

  const requiredAttachmentYesIds = methodPlanKoicGroupIds;
  const shouldShowThirdPartyEvidence = methodPlanKoicGroupIds.includes(3);

  const hasSelectedRequiredYesOptions = methodPlanKoicGroupIds.length > 0;

  const shouldShowSubmit = hasUploadedRequiredFiles && hasSelectedRequiredYesOptions;

  const sampleChangeRows = useMemo(
    () => inventoryMatrixRows.filter((row) => isNoValue(row.selectedAsSample) && row.sampleChangeReason.trim()),
    [inventoryMatrixRows]
  );

  const getAttachmentSelectValue = (id: number): AttachCompletion => attachmentCompletion[id] ?? '';
  const updateStepTwoSelection = (questionId: string, option: string, multiple: boolean) => {
    setIsStepTwoConfirmed(false);
    setIsStepTwoCollapsed(false);
    setStepTwoSelections((current) => {
      const selectedOptions = current[questionId] ?? [];
      const exclusiveOption = STEP_TWO_EXCLUSIVE_MULTIPLE_OPTIONS[questionId];
      let nextOptions: string[];

      if (!multiple) {
        nextOptions = [option];
      } else if (option === exclusiveOption) {
        nextOptions = selectedOptions.includes(option) ? [] : [option];
      } else {
        const selectableOptions = exclusiveOption
          ? selectedOptions.filter((item) => item !== exclusiveOption)
          : selectedOptions;
        nextOptions = selectableOptions.includes(option)
          ? selectableOptions.filter((item) => item !== option)
          : [...selectableOptions, option];
      }

      return { ...current, [questionId]: nextOptions };
    });
  };

  const hasStepInputContent = (stepId: number) =>
    stepId === 1
      ? Object.values(stepTwoSelections).some((selectedOptions) => selectedOptions.length > 0)
      : Boolean(methodPlanStepNotes[stepId]?.trim());

  const isStepTwoComplete = PRE_WP_JULY_STEP_TWO_SUBQUESTIONS.every(
    (subquestion) =>
      !('options' in subquestion) || (stepTwoSelections[subquestion.id]?.length ?? 0) > 0
  );

  const isMethodPlanPrepComplete =
    Boolean(
      entityRiskLevel &&
      entityIndustry &&
      entityIndustrySegment.trim() &&
      interimInventoryTotal.trim() &&
      yearEndInventoryTotal.trim()
    ) &&
    (showOverview || isStepTwoComplete) &&
    [2, 3, 4, 5, 6, 7, 8].every((stepId) => Boolean(methodPlanStepNotes[stepId]?.trim()));

  const scrollToStepTwoCard = (cardIndex: 0 | 1) => {
    setActiveStepTwoCard(cardIndex);
    window.requestAnimationFrame(() => {
      const carousel = stepTwoCarouselRef.current;
      const targetCard = carousel?.children[cardIndex] as HTMLElement | undefined;
      if (carousel && targetCard) {
        carousel.scrollTo({ left: targetCard.offsetLeft, behavior: 'smooth' });
      }
    });
  };

  const confirmAndGenerateStepTwoGuidance = () => {
    setIsStepTwoConfirmed(true);
    scrollToStepTwoCard(1);
  };

  const handlePageSave = () => {
    if (!persistDraft()) return;

    if (isMethodPlanPrepComplete) {
      setIsMethodPlanPrepCollapsed(true);
      return;
    }

    if (!showOverview && isStepTwoConfirmed && isStepTwoComplete) {
      setIsStepTwoCollapsed(false);
      scrollToStepTwoCard(1);
    }
  };

  const handleStepTwoCarouselScroll = () => {
    const carousel = stepTwoCarouselRef.current;
    const guidanceCard = carousel?.children[1] as HTMLElement | undefined;
    if (!carousel || !guidanceCard) {
      return;
    }

    setActiveStepTwoCard(carousel.scrollLeft >= guidanceCard.offsetLeft / 2 ? 1 : 0);
  };

  const getRequiredYesMessage = (id: number) => {
    if (!requiredAttachmentYesIds.includes(id)) {
      return '';
    }

    return '根据上方表格选择结果，此项应选择“是 Yes”。';
  };

  const handleAttachmentChange = (id: number, value: AttachCompletion) => {
    setAttachmentCompletion((current) => ({
      ...current,
      [id]: value,
    }));
  };

  const handleInventoryMatrixRowsChange = (nextRows: InventoryMatrixRow[]) => {
    setInventoryMatrixRows(nextRows);
    setMethodPlanRows((currentRows) =>
      syncMethodPlanRowsFromInventoryRows(nextRows, currentRows)
    );
  };

  const handleInventoryMatrixSave = () => {
    if (!persistDraft()) return;
    setMethodPlanRows((currentRows) =>
      syncMethodPlanRowsFromInventoryRows(inventoryMatrixRows, currentRows)
    );
  };

  const handleMethodPlanRowsChange = (nextRows: MethodPlanRow[]) => {
    setMethodPlanRows(nextRows);
    const nextRowsById = new Map(nextRows.map((row) => [row.id, row]));

    setInventoryMatrixRows((currentRows) =>
      currentRows.map((inventoryRow) => {
        const methodRow = nextRowsById.get(inventoryRow.id);
        if (!methodRow) return inventoryRow;

        return {
          ...inventoryRow,
          location: buildInventoryLocationValue(methodRow).trim(),
          companyName: methodRow.companyName,
          intervieweeName: methodRow.companyOwner,
          selectedAsSample: methodRow.selectedAsSample,
          sampleChangeReason: methodRow.sampleChangeReason,
          category: methodRow.importedCategory ?? inventoryRow.category,
          otherCharacteristics: methodRow.importedOtherCharacteristics ?? inventoryRow.otherCharacteristics,
          endingBalanceConfirmation:
            methodRow.importedEndingBalanceConfirmation ?? inventoryRow.endingBalanceConfirmation,
          systemType: methodRow.importedSystemType ?? inventoryRow.systemType,
          thirdPartyStorage: methodRow.importedThirdPartyStorage ?? inventoryRow.thirdPartyStorage,
          inventoryCountPlan:
            methodRow.importedInventoryCountPlan ?? inventoryRow.inventoryCountPlan,
          countMethod: methodRow.countMethod,
          useExpert: methodRow.importedUseExpert ?? inventoryRow.useExpert,
          priorBalance: methodRow.importedPriorBalance ?? inventoryRow.priorBalance,
          finalPlannedBalance:
            methodRow.importedFinalBalance ?? inventoryRow.finalPlannedBalance,
          currentInterimStage:
            methodRow.importedPriorInterimPlannedBalance ?? inventoryRow.currentInterimStage,
          interimPlannedBalance:
            methodRow.importedInterimPlannedBalance ?? inventoryRow.interimPlannedBalance,
          auditApproach: methodRow.auditApproach,
          sampleQuantity: methodRow.sampleQuantity,
          confirmThirdPartyInventory: methodRow.confirmThirdPartyInventory,
          monitorMode: methodRow.monitorMode,
          useExperts: methodRow.useExperts,
          useInternalAudit: methodRow.useInternalAudit,
        };
      })
    );
  };

  const handleMethodPlanBulkImport = (importedRows: MethodPlanRow[]) => {
    setInventoryMatrixRows((currentRows) => {
      const nextInventoryRows = mergeImportedLocationsIntoInventoryRows(currentRows, importedRows);

      setMethodPlanRows((currentMethodRows) =>
        syncMethodPlanRowsFromInventoryRows(nextInventoryRows, currentMethodRows)
      );

      return nextInventoryRows;
    });
  };

  const openInventoryBulkImport = () => {
    methodPlanMatrixRef.current?.openBulkImportModal();
  };

  const handleKoicPushConfirm = (publishedRows: MethodPlanRow[]) => {
    const acceptedRows = publishedRows.filter((row) => !getInventoryProcedureDecision(row).blocked);
    if (acceptedRows.length === 0) return;
    const byId = new Map(publishedMethodPlanRows.map((row) => [row.id, row]));
    acceptedRows.forEach((row) => byId.set(row.id, { ...row }));
    const nextPublishedRows = Array.from(byId.values());
    setPublishedMethodPlanRows(nextPublishedRows);
    persistDraft({ publishedMethodPlanRows: nextPublishedRows, hasConfirmedKoicPush: true });
    setHasConfirmedKoicPush(true);
    setShowPrepAfterTask(false);
    setIsWorkpaperIntroCollapsed(true);
    setIsMethodPlanPrepCollapsed(true);
    setIsPlanSetupCollapsed(true);
    setActivePreWpJulyStage('understand');
    window.requestAnimationFrame(() => {
      inventorySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  useEffect(() => {
    setMethodPlanRows((currentRows) =>
      syncMethodPlanRowsFromInventoryRows(inventoryMatrixRows, currentRows)
    );
  }, [inventoryMatrixRows]);

  useEffect(() => {
    const introCollapseTimeout = window.setTimeout(() => {
      setIsWorkpaperIntroCollapsed(true);
    }, 3000);

    return () => window.clearTimeout(introCollapseTimeout);
  }, []);

  useEffect(() => {
    if (showOverview) {
      setStepTwoCarouselHeight(null);
      return;
    }
    if (activePreWpJulyStage !== 'method') {
      setStepTwoCarouselHeight(null);
      shouldRestoreStepTwoCardPositionRef.current = true;
      if (isStepTwoConfirmed && !isStepTwoCollapsed) {
        setActiveStepTwoCard(1);
      }
      return;
    }

    if (isStepTwoCollapsed) {
      setStepTwoCarouselHeight(null);
      return;
    }

    let resizeObserver: ResizeObserver | null = null;
    let secondFrameId = 0;
    const firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(() => {
        const carousel = stepTwoCarouselRef.current;
        const activeCard =
          activeStepTwoCard === 0 ? stepTwoQuestionCardRef.current : stepTwoGuidanceCardRef.current;
        if (!carousel || !activeCard) {
          return;
        }

        if (shouldRestoreStepTwoCardPositionRef.current) {
          carousel.scrollLeft = activeCard.offsetLeft;
          shouldRestoreStepTwoCardPositionRef.current = false;
        }

        const updateCarouselHeight = () => {
          const nextHeight = activeCard.scrollHeight;
          if (nextHeight > 0) {
            setStepTwoCarouselHeight(nextHeight);
          }
        };

        updateCarouselHeight();
        resizeObserver = new ResizeObserver(updateCarouselHeight);
        resizeObserver.observe(activeCard);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrameId);
      window.cancelAnimationFrame(secondFrameId);
      resizeObserver?.disconnect();
    };
  }, [activePreWpJulyStage, activeStepTwoCard, isStepTwoCollapsed, isStepTwoConfirmed, showOverview]);

  useEffect(() => {
    setAttachmentCompletion((current) => {
      const next = { ...current };
      let changed = false;

      if (!shouldShowThirdPartyEvidence && next[3]) {
        delete next[3];
        changed = true;
      }

      return changed ? next : current;
    });
  }, [shouldShowThirdPartyEvidence]);

  const openUploadModal = (target: UploadTarget) => {
    setUploadModalTarget(target);
    const currentFileName =
      target === 'inventoryPolicy'
        ? inventoryPolicyFileName
        : target === 'inventoryQuality'
          ? inventoryQualityFileName
          : methodFileName;
    setPendingFileName(currentFileName);
  };

  const closeUploadModal = () => {
    setUploadModalTarget(null);
    setPendingFileName('');
  };

  const confirmUpload = () => {
    if (!uploadModalTarget || !pendingFileName.trim()) {
      return;
    }

    if (uploadModalTarget === 'inventoryPolicy') {
      setInventoryPolicyFileName(pendingFileName.trim());
    } else if (uploadModalTarget === 'inventoryQuality') {
      setInventoryQualityFileName(pendingFileName.trim());
    } else {
      setMethodFileName(pendingFileName.trim());
    }

    closeUploadModal();
  };

  useEffect(() => {
    if (activePreWpJulyStage === 'understand') {
      setShowFloatingSaveButton(true);
      return;
    }

    const updateFloatingSaveVisibility = () => {
      const currentProgramSectionRef = methodPlanProgramSectionRef;

      if (!currentProgramSectionRef.current) {
        setShowFloatingSaveButton(false);
        return;
      }

      setShowFloatingSaveButton(currentProgramSectionRef.current.getBoundingClientRect().top <= 24);
    };

    updateFloatingSaveVisibility();
    window.addEventListener('scroll', updateFloatingSaveVisibility, { passive: true });
    window.addEventListener('resize', updateFloatingSaveVisibility);

    return () => {
      window.removeEventListener('scroll', updateFloatingSaveVisibility);
      window.removeEventListener('resize', updateFloatingSaveVisibility);
    };
  }, [activePreWpJulyStage]);

  useEffect(() => {
    const updateWorkpaperHeaderPinning = () => {
      setIsWorkpaperHeaderPinned(workpaperHeaderRef.current?.getBoundingClientRect().top <= 0);
    };

    updateWorkpaperHeaderPinning();
    window.addEventListener('scroll', updateWorkpaperHeaderPinning, { passive: true });
    window.addEventListener('resize', updateWorkpaperHeaderPinning);

    return () => {
      window.removeEventListener('scroll', updateWorkpaperHeaderPinning);
      window.removeEventListener('resize', updateWorkpaperHeaderPinning);
    };
  }, []);

  const navigateToStage = (stage: PreWpJulyStage) => {
    if (stage === 'method' && hasConfirmedKoicPush) {
      setShowPrepAfterTask(true);
      setIsMethodPlanPrepCollapsed(false);
      setIsWorkpaperIntroCollapsed(false);
    }
    setActivePreWpJulyStage(stage);
    const sectionRef =
      stage === 'method'
        ? methodPlanProgramSectionRef
        : stage === 'understand'
          ? inventorySectionRef
          : planSectionRef;

    window.requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const inventoryMatrixSection = (
      <div ref={inventorySectionRef} className={cn('scroll-mt-24 space-y-4', showOverview ? '' : 'order-2 -mt-4')}>
        <div className={cn('flex items-center justify-between gap-4', !showOverview && 'ml-4')}>
          <h2 className={cn('text-lg font-bold', !showOverview && 'border-l-4 border-blue-600 pl-3')}>存货了解矩阵</h2>
        </div>
        <p className={cn('font-medium leading-6 text-gray-800', !showOverview && 'ml-4')}>
          获取按类型和/或存放地点划分、并已调节至期中总账的存货分析。完成存货监盘计划矩阵。
        </p>
        <div className={cn('overflow-visible', !showOverview && 'ml-4')}>
          <InventoryMatrix
            embedded
            hideNoteLabels
            rows={inventoryMatrixRows}
            onRowsChange={handleInventoryMatrixRowsChange}
            createdTaskRowIds={publishedMethodPlanRows.map((row) => row.id)}
            onCreateTasks={() => methodPlanMatrixRef.current?.openKoicPushModal()}
            onOpenLocationSettings={(rowId) =>
              methodPlanMatrixRef.current?.openLocationSettings(rowId)
            }
            footerRightContent={
              shouldShowSubmit ? (
                <button
                  type="button"
                  onClick={() => methodPlanMatrixRef.current?.openKoicPushModal()}
                  className="flex items-center rounded border border-gray-300 bg-blue-600 px-4 py-1.5 text-sm text-white shadow-sm transition hover:bg-gray-50"
                >
                  创建程序
                </button>
              ) : null
            }
            lockIdentityColumns={inventoryStepsSaved}
            toolbarActions={
              <button
                type="button"
                onClick={openInventoryBulkImport}
                className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100 hover:text-[#00338D]"
                title="下载空白模板、当前列表或导入存货数据"
              >
                <Upload size={14} aria-hidden="true" />
                批量导入
              </button>
            }
          />
          {sampleChangeRows.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800">
                样本变更原因
              </div>
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-gray-100 text-xs tracking-wider text-gray-700">
                    <th className="w-[180px] border-b border-gray-200 px-4 py-3 font-medium">
                      所属公司名称
                    </th>
                    <th className="w-[240px] border-b border-gray-200 px-4 py-3 font-medium">
                      受访单位名称
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 font-medium">
                      对毕马威所选为监盘地点发生变动进行相关解释
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sampleChangeRows.map((row) => (
                    <tr key={`sample-change-${row.id}`} className="transition-colors hover:bg-gray-50">
                      <td className="whitespace-pre-line px-4 py-4 align-top text-gray-800">
                        {row.companyName || '-'}
                      </td>
                      <td className="whitespace-pre-line px-4 py-4 align-top text-gray-800">
                        {row.intervieweeName || '-'}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="whitespace-pre-line rounded border border-gray-100 bg-gray-50 px-3 py-2 text-sm leading-5 text-gray-700">
                          {row.sampleChangeReason || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 flex items-center justify-end">
            {/* <button
              type="button"
              onClick={handleInventoryMatrixSave}
              className={cn(
                'rounded-lg border px-4 py-2 text-sm font-medium transition-all active:scale-95',
                inventoryStepsSaved
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                  : 'border-blue-600 bg-blue-600 text-white shadow-sm hover:bg-blue-700'
              )}
            >
              保存
            </button> */}
          </div>
        </div>
      </div>
  );

  return (
    <div className={cn('relative -left-4 min-w-0 flex flex-col gap-8', menuOpen ? 'px-0 sm:px-2 lg:px-4' : 'px-3 sm:px-4 lg:px-8')}>
      {menuOpen && (
        <aside
          id="wp-july-menu"
          ref={menuRef}
          aria-label="工作底稿导航"
          className="fixed bottom-0 left-0 top-[60px] z-[58] flex w-[200px] flex-col border-r border-white/50 bg-white/35 p-2.5 shadow-[4px_0_24px_rgba(15,23,42,0.06)] backdrop-blur-md backdrop-saturate-150"
        >
          <nav aria-label="左侧步骤导航" className="space-y-2">
            {JULY_NAV_STAGES.map((stage, index) => (
              <button
                key={stage.key}
                type="button"
                onClick={() => navigateToStage(stage.key)}
                aria-current={activePreWpJulyStage === stage.key ? 'step' : undefined}
                className={cn(
                  'flex w-full items-start gap-2 rounded-lg px-2 py-3 text-left text-xs leading-5 transition duration-200 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00338D]',
                  activePreWpJulyStage === stage.key
                    ? 'bg-blue-50/80 font-bold text-[#00338D]'
                    : 'font-medium text-slate-600 hover:bg-white/70 hover:text-[#00338D]'
                )}
              >
                <span className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors',
                  activePreWpJulyStage === stage.key
                    ? 'border-[#00338D] bg-[#00338D] font-bold text-white shadow-sm'
                    : 'border-slate-300/60 bg-white/30 text-slate-500'
                )}>{index + 1}</span>
                <span className="min-w-0 break-words">{stage.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              aria-label="收起工作底稿导航"
              onClick={() => {
                onMenuClose?.();
                document.getElementById('wp-july-menu-button')?.focus({ preventScroll: true });
              }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00338D]"
            ><X size={16} /></button>
          </div>
        </aside>
      )}
      <div className="-mb-4 flex items-start">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-gray-900">1325146-Tech Solutions Demo & Training (CN)</h1>
          {/* <p className="mt-1 text-xs text-gray-500">任务 ID: {taskId} | 任务编码: R000009895379</p> */}
        </div>
      </div>

      <div ref={workpaperHeaderRef} className="h-[58px]">
        <div className="relative h-full">
          <div
            className={cn(
              'flex flex-wrap items-center justify-between gap-4 pb-3 transition-[left] duration-300 motion-reduce:transition-none',
              isWorkpaperHeaderPinned &&
                'fixed inset-x-0 top-0 z-40 border-b border-white/30 bg-white/30 px-2 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-md backdrop-saturate-150 sm:px-4 lg:px-8'
            )}
          >
          <h2 className="shrink-0 border-l-[5px] border-blue-600 pl-4 text-2xl font-bold leading-9">存货工作底稿</h2>
          <div className="ml-auto flex shrink-0 items-center gap-2">
          {saveError && <span role="alert" className="max-w-sm text-xs text-red-600">{saveError}</span>}
          {showOverview && (
            <button type="button" onClick={handlePageSave} className="flex items-center gap-1.5 rounded border border-slate-300/70 bg-white/65 px-4 py-1.5 text-sm font-medium text-[#54709e] shadow-sm transition hover:bg-white/90">
              <Save size={14} />{isCurrentDraftSaved ? '已保存' : '保存'}
            </button>
          )}
          <button className="flex items-center rounded border border-[#00338D] bg-[#00338D] px-4 py-1.5 text-sm text-white shadow-sm transition hover:bg-[#002b75]">
            <Download size={14} className="mr-1.5" /> 导出底稿
          </button>
          </div>
          </div>
        </div>
      </div>

      {showCompactNavigation && <PreWpJulyCompactStepIndicator
        currentStage={activePreWpJulyStage}
        onStageClick={navigateToStage}
        showSave={showFloatingSaveButton}
        onSave={handlePageSave}
        saved={isCurrentDraftSaved}
      />}

      {(!showOverview || (hasConfirmedKoicPush && !showPrepAfterTask)) && inventoryMatrixSection}

      {(
      <>
      {(!hasConfirmedKoicPush || showPrepAfterTask) && (<>
      <div className={cn('order-1 ml-4 flex items-center justify-between gap-4', showOverview ? '-mt-8' : '-mt-3')}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsWorkpaperIntroCollapsed((current) => !current)}
            className="absolute right-full top-[calc(65%+6px)] mr-1 -translate-y-1/2 whitespace-nowrap rounded px-2 py-0 text-[9px] font-medium text-slate-800 transition hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-200"
            aria-expanded={!isWorkpaperIntroCollapsed}
            aria-label={isWorkpaperIntroCollapsed ? '展开引言' : '收起引言'}
            title={isWorkpaperIntroCollapsed ? '展开引言' : '收起引言'}
          >
            <span className="flex flex-col items-center leading-[11px]">
              <span>引</span>
              <span>言</span>
            </span>
          </button>
          <h2 className="border-l-4 border-blue-600 pl-3 text-lg font-bold text-gray-900">
            了解被审计单位的存货
          </h2>
        </div>
      </div>
      {!isWorkpaperIntroCollapsed && (
        <div className="order-1 ml-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
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
      )}
      </>)}
      {(!hasConfirmedKoicPush || showPrepAfterTask) && (
      <div
        ref={methodPlanProgramSectionRef}
        className="relative order-1 -mt-4 scroll-mt-24 space-y-4"
      >
        <div>
          {isMethodPlanPrepCollapsed && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsMethodPlanPrepCollapsed(false)}
                className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-3 py-1 text-[11px] font-medium text-gray-500 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
                aria-expanded={false}
              >
                <ChevronDown size={12} /> 展开
              </button>
            </div>
          )}
          {!isMethodPlanPrepCollapsed && (
          <div className="overflow-visible rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <TableFullscreenFrame
              title="了解被审计单位的存货"
              headerActions={
                <button
                  type="button"
                  onClick={() => setIsMethodPlanPrepCollapsed(true)}
                  className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-3 py-1 text-[11px] font-medium text-gray-500 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
                  aria-expanded={true}
                >
                  <ChevronUp size={12} /> 收起
                </button>
              }
            >
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full table-fixed border-collapse text-left">
                <colgroup><col style={{ width: 48 }} /><col /></colgroup>
                <thead>
                  <tr className="bg-gray-100 text-sm tracking-wider text-gray-600">
                    <th className="w-12 min-w-12 border-b border-gray-200 px-1.5 py-2 text-center font-medium">状态</th>
                    <th className="border-b border-gray-200 px-3 py-2 font-medium">
                      <span>程序</span>
                      <span className="ml-3 inline-flex items-center gap-1.5 text-[10px] font-normal tracking-normal text-gray-400">
                        <span className="font-medium">KAEG</span>
                        <span>3.1 业务流程 - 了解有关情况</span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="bg-slate-50/40">
                    <td className="px-2 py-4 align-top">
                      <div className="flex justify-center pt-1.5">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              entityRiskLevel && entityIndustry && entityIndustrySegment.trim() && interimInventoryTotal.trim() && yearEndInventoryTotal.trim()
                                ? '#0D92F8'
                                : '#D1D5DB',
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-4 align-top">
                      <div className="mb-3 text-sm font-semibold text-gray-800">
                        记录被审计单位的基本信息及相关存货金额
                      </div>
                      <div className="w-full overflow-x-auto">
                        <div className="grid min-w-[1050px] grid-cols-5 gap-3 text-xs">
                          <label className="flex min-w-0 flex-col gap-1.5">
                            <span className="whitespace-nowrap text-gray-600">存货风险等级</span>
                            <select
                              value={entityRiskLevel}
                              onChange={(event) => setEntityRiskLevel(event.target.value)}
                              className="h-8 w-1/2 rounded border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              aria-label="选择被审计单位存货的风险等级"
                            >
                              <option value="">请选择</option>
                              <option value="高">高</option>
                              <option value="中">中</option>
                              <option value="低">低</option>
                            </select>
                          </label>
                          <label className="flex min-w-0 flex-col gap-1.5">
                            <span className="whitespace-nowrap text-gray-600">所属行业</span>
                            <select
                              value={entityIndustry}
                              onChange={(event) => setEntityIndustry(event.target.value)}
                              className="h-8 w-1/2 rounded border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              aria-label="选择被审计单位所属行业"
                            >
                              <option value="">请选择</option>
                              {['房地产', '零售', '化工', '科技', '其他'].map((industry) => (
                                <option key={industry} value={industry}>{industry}</option>
                              ))}
                            </select>
                          </label>
                          <label className="flex min-w-0 flex-col gap-1.5">
                            <span className="whitespace-nowrap text-gray-600">行业细分</span>
                            <input
                              type="text"
                              value={entityIndustrySegment}
                              onChange={(event) => setEntityIndustrySegment(event.target.value)}
                              className="h-8 w-1/2 rounded border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder="请输入"
                              aria-label="填写被审计单位行业细分"
                            />
                          </label>
                        <label className="flex min-w-0 flex-col gap-1.5">
                          <span className="text-gray-600">本期预审阶段存货总额</span>
                          <input
                            type="text"
                            value={interimInventoryTotal}
                            onChange={(event) => setInterimInventoryTotal(event.target.value)}
                            className="h-8 w-1/2 rounded border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="请输入金额"
                          />
                        </label>
                        <label className="flex min-w-0 flex-col gap-1.5">
                          <span className="text-gray-600">本期期末存货总额</span>
                          <input
                            type="text"
                            value={yearEndInventoryTotal}
                            onChange={(event) => setYearEndInventoryTotal(event.target.value)}
                            className="h-8 w-1/2 rounded border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="请输入金额"
                          />
                        </label>
                        </div>
                      </div>
                    </td>
                  </tr>
                  {!isMethodPlanPrepCollapsed && visibleMethodPlanPrepSteps.map((step) => {
                    return (
                      <React.Fragment key={`method-plan-prep-${step.id}`}>
                        <tr className="transition-colors hover:bg-gray-50">
                          <td className="px-2 pb-2 pt-6 align-top">
                            <div className="flex items-start justify-center">
                              {(!showOverview || step.id !== 1) && <div
                                className="mt-1.5 h-2.5 w-2.5 rounded-full transition-colors"
                                style={{ backgroundColor: hasStepInputContent(step.id) ? '#0D92F8' : '#D1D5DB' }}
                              />}
                            </div>
                          </td>
                          <td className="px-3 pb-2 pt-6 align-top">
                            <StepProcedureCell step={step}>
                              {step.id === 1 && !showOverview && isStepTwoConfirmed && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStepTwoCarouselHeight(null);
                                    setActiveStepTwoCard(0);
                                    setIsStepTwoCollapsed((current) => !current);
                                    if (stepTwoCarouselRef.current) {
                                      stepTwoCarouselRef.current.scrollLeft = 0;
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-500 transition hover:border-blue-300 hover:text-blue-700"
                                  aria-expanded={!isStepTwoCollapsed}
                                >
                                  {isStepTwoCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                                  {isStepTwoCollapsed ? '展开审计指引' : '收起审计指引'}
                                </button>
                              )}
                              {[3, 4, 7, 8, 9, 10].includes(step.id) && (
                                <div>
                                  <label
                                    className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-600 transition hover:text-gray-900"
                                    htmlFor={`method-plan-step-file-${step.id}`}
                                  >
                                    <Upload size={14} className="text-[#00338D]" />
                                    <span className="max-w-[280px] truncate">
                                      {methodPlanStepFiles[step.id] || '上传相关文件'}
                                    </span>
                                    <input
                                      id={`method-plan-step-file-${step.id}`}
                                      type="file"
                                      className="sr-only"
                                      onChange={(event) => {
                                        const fileName = event.target.files?.[0]?.name;
                                        if (!fileName) {
                                          return;
                                        }

                                        setMethodPlanStepFiles((current) => ({
                                          ...current,
                                          [step.id]: fileName,
                                        }));
                                      }}
                                    />
                                  </label>
                                </div>
                              )}
                            </StepProcedureCell>
                          </td>
                        </tr>
                        {step.id === 1 && !showOverview && !isStepTwoCollapsed && (
                          <tr className="bg-white">
                            <td className="px-2 pb-6 align-top" />
                            <td className="px-3 pb-6 align-top">
                              <div className="relative">
                              <div
                                ref={stepTwoCarouselRef}
                                onScroll={handleStepTwoCarouselScroll}
                                className={cn(
                                  'flex w-full snap-x snap-mandatory items-start overflow-y-hidden scroll-smooth overscroll-x-contain transition-[height] duration-300 ease-out [&::-webkit-scrollbar]:hidden',
                                  isStepTwoConfirmed ? 'overflow-x-auto' : 'overflow-x-hidden'
                                )}
                                style={{
                                  scrollbarWidth: 'none',
                                  height: stepTwoCarouselHeight ? `${stepTwoCarouselHeight}px` : undefined,
                                }}
                                aria-label="存货性质问卷与审计指引卡片"
                              >
                                <section
                                  ref={stepTwoQuestionCardRef}
                                  className="relative w-full shrink-0 snap-start"
                                  aria-label="存货性质问卷卡片一"
                                >
                                  <ol
                                    className="space-y-6 rounded-md border border-gray-200 bg-gray-50/60 pl-8 pr-4 py-4"
                                    aria-label="存货性质问卷的分题"
                                  >
                                    {PRE_WP_JULY_STEP_TWO_SUBQUESTIONS.map((subquestion) => {
                                  const hasOptions = 'selection' in subquestion && 'options' in subquestion;
                                  const isSingleChoice = hasOptions && subquestion.selection === 'single';
                                  const subquestionNumber = subquestion.id.split('.').at(-1);

                                  return (
                                    <li key={subquestion.id} className="text-sm leading-6 text-gray-700">
                                      <div className="relative grid w-[70%] min-w-[700px] max-w-full grid-cols-[minmax(0,1fr)] items-start gap-y-2">
                                        <span className="absolute -left-6 top-0 w-5 text-right font-semibold text-[#00338D]">{subquestionNumber}.<sup className="absolute -right-1 top-0 text-[10px] leading-none text-red-500" aria-hidden="true">*</sup><span className="sr-only">（必填）</span></span>
                                        <span>{subquestion.text}</span>
                                        {isSingleChoice && (
                                          <div className="row-start-2 mt-1 min-w-0">
                                            <ConnectedOptionGroup
                                              ariaLabel={`${subquestion.id} ${subquestion.text}`}
                                              options={subquestion.options}
                                              selectedOptions={stepTwoSelections[subquestion.id] ?? []}
                                              multiple={false}
                                              compact
                                              onSelect={(option) => updateStepTwoSelection(subquestion.id, option, false)}
                                            />
                                          </div>
                                        )}
                                        {hasOptions && !isSingleChoice && (
                                          <>
                                            <div className="row-start-2 mt-1 min-w-0">
                                              <ConnectedOptionGroup
                                                ariaLabel={`${subquestion.id} ${subquestion.text}`}
                                                options={subquestion.options}
                                                selectedOptions={stepTwoSelections[subquestion.id] ?? []}
                                                multiple
                                                breakBeforeOption={
                                                  'breakBeforeOption' in subquestion
                                                    ? subquestion.breakBeforeOption
                                                    : undefined
                                                }
                                                onSelect={(option) => updateStepTwoSelection(subquestion.id, option, true)}
                                              />
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </li>
                                  );
                                    })}
                                  </ol>
                                  {isStepTwoComplete && (
                                    <div className="mt-4 flex justify-start">
                                      <button
                                        type="button"
                                        onClick={confirmAndGenerateStepTwoGuidance}
                                        disabled={isStepTwoConfirmed}
                                        className={cn(
                                          'rounded border px-5 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300',
                                          isStepTwoConfirmed
                                            ? 'cursor-default border-blue-200 bg-blue-50 text-[#00338D]'
                                            : 'border-[#00338D] bg-[#00338D] text-white hover:bg-[#002b75]'
                                        )}
                                      >
                                        {isStepTwoConfirmed ? '已生成指引' : '确认并生成指引'}
                                      </button>
                                    </div>
                                  )}
                                  {isStepTwoConfirmed && activeStepTwoCard === 0 && (
                                    <div className="group/next absolute inset-y-0 right-0 flex w-1/4 items-center justify-end pr-4">
                                      <button
                                        type="button"
                                        onClick={() => scrollToStepTwoCard(1)}
                                        aria-label="滑动到卡片二"
                                        className="translate-x-2 rounded-full border border-gray-200 bg-gray-100/90 p-2 text-gray-400 opacity-0 shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-gray-200 hover:text-gray-500 group-hover/next:translate-x-0 group-hover/next:opacity-100"
                                      >
                                        <ChevronRight size={24} className="animate-pulse" aria-hidden="true" />
                                      </button>
                                    </div>
                                  )}
                                </section>
                                <section
                                  ref={stepTwoGuidanceCardRef}
                                  className="relative ml-4 w-full shrink-0 snap-start overflow-hidden rounded-md border border-gray-200 bg-white"
                                  aria-label="存货性质问卷卡片二"
                                >
                                  <StepTwoGuidanceCard
                                    selections={stepTwoSelections}
                                    generated={isStepTwoConfirmed}
                                  />
                                </section>
                              </div>
                              {isStepTwoConfirmed && activeStepTwoCard === 1 && (
                                <div className="group/previous absolute inset-y-0 -left-4 z-20 flex w-[calc(25%+1rem)] items-center justify-start pl-1">
                                  <button
                                    type="button"
                                    onClick={() => scrollToStepTwoCard(0)}
                                    aria-label="返回卡片一"
                                    className="-translate-x-2 rounded-full border border-gray-200 bg-gray-100/90 p-2 text-gray-400 opacity-0 shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-gray-200 hover:text-gray-500 group-hover/previous:translate-x-0 group-hover/previous:opacity-100"
                                  >
                                    <ChevronLeft size={24} className="animate-pulse" aria-hidden="true" />
                                  </button>
                                </div>
                              )}
                              </div>
                              {isStepTwoConfirmed && (
                                <div className="mt-3 flex items-center justify-center gap-2" aria-label="存货性质问卷卡片分页">
                                  {([0, 1] as const).map((cardIndex) => (
                                    <button
                                      key={cardIndex}
                                      type="button"
                                      onClick={() => scrollToStepTwoCard(cardIndex)}
                                      aria-label={`切换到卡片${cardIndex + 1}`}
                                      aria-current={activeStepTwoCard === cardIndex ? 'true' : undefined}
                                      className={cn(
                                        'h-2 rounded-full transition-all duration-300',
                                        activeStepTwoCard === cardIndex
                                          ? 'w-5 bg-gray-700 shadow-sm'
                                          : 'w-2 bg-gray-300 hover:bg-gray-400'
                                      )}
                                    />
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10].includes(step.id) && (
                          <tr className="bg-white">
                            <td className="px-2 pb-6 align-top" />
                            <td className="px-3 pb-6 align-top">
                              {/* <label
                                className="mb-1 block text-[11px] font-medium leading-4 text-gray-400"
                                htmlFor={`method-plan-step-note-${step.id}`}
                              >
                                相关信息
                              </label> */}
                              <textarea
                                id={step.id === 7 ? 'inventory-step-note-7' : `method-plan-step-note-${step.id}`}
                                value={methodPlanStepNotes[step.id] ?? ''}
                                placeholder={step.id === 7 ? '请输入相关信息' : PRE_WP_JULY_STEP_NOTE_PLACEHOLDERS[step.id]}
                                onChange={(event) =>
                                  setMethodPlanStepNotes((current) => ({
                                    ...current,
                                    [step.id]: event.target.value,
                                  }))
                                }
                                aria-label={`问题 ${step.displayNumber ?? step.id} 文件说明`}
                                className={cn(
                                  'min-h-[64px] w-full resize-y rounded border border-gray-200 bg-white px-3 py-2 text-sm font-normal leading-5 text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 lg:w-[80%]'
                                )}
                              />
                            </td>
                          </tr>
                        )}
                        {showOverview && step.id === 3 && (
                          <tr className="bg-white" style={{ borderTopWidth: 0 }}>
                            <td className="px-2 pb-6 align-top" />
                            <td className="px-3 pb-6 align-top">
                              <h3 className={cn('mb-5 pt-5', INVENTORY_CONSIDERATION_HEADING_CLASS_NAME)}>
                                根据了解到的被审计单位存货盘点信息，获悉项目组在设计或执行程序时应考虑的因素
                              </h3>
                              <InventoryNatureQuestions group="before-policy" answers={inventoryNatureAnswers} setAnswers={setInventoryNatureAnswers} />
                            </td>
                          </tr>
                        )}
                        {showOverview && step.id === 2 && (
                          <tr className="bg-white" style={{ borderTopWidth: 0 }}>
                            <td className="px-2 pb-6 align-top" />
                            <td className="px-3 pb-6 align-top">
                              <div className="space-y-6">
                                {inventoryMatrixSection}
                                <StepProcedureCell step={steps[0]} showInventoryNatureQuestions inventoryNatureAnswers={inventoryNatureAnswers} setInventoryNatureAnswers={setInventoryNatureAnswers} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {!isMethodPlanPrepCollapsed && (
                    <tr aria-hidden="true">
                      <td colSpan={2} className="border-t border-gray-100 px-0 py-1" />
                    </tr>
                  )}
                  {/* <tr className="transition-colors hover:bg-gray-50"> */}
                    {/* <td className="px-4 py-6 align-top">
                      <div className="flex items-start justify-center">
                        <div
                          className="mt-1.5 h-2.5 w-2.5 rounded-full transition-colors"
                          style={{
                            backgroundColor: inventoryPolicyFileName ? '#0D92F8' : '#D1D5DB',
                          }}
                        />
                      </div>
                    </td> */}
                    {/* <td className="px-4 py-5 align-top" colSpan={2}>
                      <div className="flex items-start gap-2">
                        <div className="min-w-0">

                          {inventoryPolicyFileName && (
                            <div className="mt-1 truncate text-xs text-gray-500">
                              已上传文件: {inventoryPolicyFileName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td> */}

                    {/* <td className="px-4 py-5 align-top" colSpan={2}>
                      <div className="flex items-start gap-2">
                        <div className="min-w-0">

                          {inventoryQualityFileName && (
                            <div className="mt-1 truncate text-xs text-gray-500">
                              已上传文件: {inventoryQualityFileName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td> */}
                    {/* <td className="px-4 py-5 align-top" />
                    <td className="px-4 py-5 align-top" />
                  </tr> */}
                </tbody>
              </table>
            </div>
            </TableFullscreenFrame>
          </div>
          )}

          {!isMethodPlanPrepCollapsed && methodFileName && (
            <p className="mt-3 text-xs text-gray-500">已上传文件: {methodFileName}</p>
          )}
        </div>
      </div>
      )}
      <MethodPlanMatrix
        ref={methodPlanMatrixRef}
        rows={methodPlanRows}
        locationExportRows={inventoryMatrixRows.filter(hasInventoryImportContent).map((row) => ({
          ...buildMethodPlanRowFromInventoryRow(row),
          auditApproach: row.auditApproach,
          confirmThirdPartyInventory: row.confirmThirdPartyInventory,
          importedPlannedAttendancePrimary: row.plannedAttendancePrimary,
          importedPlannedAttendanceSecondary: row.plannedAttendanceSecondary,
        }))}
        onRowsChange={handleMethodPlanRowsChange}
        onBulkImportRows={handleMethodPlanBulkImport}
        showBulkImportButton={false}
        renderTableContent={false}
        bulkImportMode="locations"
        onKoicPushConfirm={handleKoicPushConfirm}
        hideNoteLabels
      />

      <div ref={planSectionRef} className="order-3 ml-4 scroll-mt-24">
        {/* 确定项目组的存货监盘方法 header intentionally hidden. */}
      </div>

      {hasConfirmedKoicPush && (
      <div className="order-3 space-y-4">
        <div className="ml-4 flex flex-wrap items-center justify-between gap-3 border-l-4 border-blue-600 pl-3">
          <div className="flex flex-wrap items-center gap-5">
          <h2 className="text-lg font-bold">项目组选定的存货监盘方法</h2>
          {/* <h3 className="text-sm text-blue-400">
            *开启毕马威打卡星存货盘点模块前，须完成本页面中所有程序步骤。
          </h3> */}
          </div>
        </div>

        <div className="ml-4 overflow-visible rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <TableFullscreenFrame title="项目组选定的存货监盘方法">
          <div className="overflow-x-auto rounded-lg">
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
                {visibleAttachmentSteps.map((item) => {
                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-6 align-top">
                        <div className="flex items-start justify-center">
                          <div
                            className="mt-1.5 h-2.5 w-2.5 rounded-full transition-colors"
                            style={{ backgroundColor: '#0D92F8' }}
                          />
                        </div>
                      </td>

                      <td
                        className="px-4 py-6 align-top font-medium leading-6 text-gray-800"
                      >
                        {item.id}. {item.nameZh}
                      </td>

                      <td className="px-4 py-6 align-top">
                        <div className="flex flex-wrap items-center gap-3">
                          <a
                            href="#"
                            aria-label={`Open link for attachment ${item.id}`}
                            title="Open link"
                            className="inline-flex items-center text-base leading-none text-[#3C85D3] no-underline transition hover:text-blue-800"
                          >
                            <LoginOutlined />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </TableFullscreenFrame>
        </div>
      </div>
      )}
      </>
      )}

      {/* {uploadModalTarget && (
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
      )} */}
    </div>
  );
}
