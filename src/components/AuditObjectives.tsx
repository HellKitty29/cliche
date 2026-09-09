import React, { useState, useMemo } from 'react';
import { WorkingPaperPreviewSession } from './WorkingPaperPreview';
import { createId } from '../utils/createId';
import { formatRowReference, type RowReference } from '../utils/workingPaperRows';
import { 
  substantiveDocumentRows as initialSubstantiveRows,
  businessProcesses as initialProcesses,
  auditProceduresData as initialProcedures 
} from '../data/mockData';
import { SubstantiveDocumentRow, BusinessProcessItem, AuditProcedureRow } from '../types';
import { 
  Check,
  Search, 
  RefreshCw, 
  Download, 
  Eye, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal, 
  FileText, 
  File as FileIcon,
  FileSpreadsheet,
  Presentation,
  ShieldCheck, 
  Cpu, 
  BarChart3, 
  Link2,
  TriangleAlert,
  CalendarDays,
  Columns3,
  Minus,
  Users,
  Trash2,
  X
} from 'lucide-react';

interface AuditObjectivesProps {
  onModifyProcedure?: (proc: any) => void;
}

type AccountingPeriodFilter = 'all' | '2026' | '2025';
type AmountUnit = 'yuan' | 'million';
type WorkingPaperStageState = 'done' | 'active' | 'blocked' | 'unavailable';
type SummaryFilter =
  | 'all'
  | 'uploaded'
  | 'unuploaded'
  | 'review-passed'
  | 'review-failed'
  | 'precheck-passed'
  | 'precheck-failed';

const kcwBusinessProcesses = [
  { id: 'fixed-assets', name: '固定资产与在建工程', englishName: 'Fixed assets and construction in progress' },
  { id: 'tax', name: '税项', englishName: 'Tax' },
  { id: 'sales', name: '销售', englishName: 'Sales' },
  { id: 'purchases', name: '采购', englishName: 'Purchases' },
  { id: 'human-resources', name: '人力资源', englishName: 'Human resources' },
  { id: 'inventory', name: '存货', englishName: 'Inventory' },
  { id: 'treasury-debt', name: '资金与债务', englishName: 'Treasury and debt' }
];

const formatDay = (dateTime: string) => {
  const match = dateTime.match(/^\d{4}-\d{2}-\d{2}/);
  return match?.[0] ?? '—';
};

// Keep the mock review dates varied but stable across re-renders.
const getReviewDay = (row: SubstantiveDocumentRow) => {
  if (!row.isUploaded || row.uploadDate === '-') return '—';

  const uploadDay = formatDay(row.uploadDate);
  const parsedUploadDay = new Date(`${uploadDay}T00:00:00Z`);
  if (Number.isNaN(parsedUploadDay.getTime())) return '—';

  const stableOffset = (Array.from(row.id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 5) + 1;
  parsedUploadDay.setUTCDate(parsedUploadDay.getUTCDate() + stableOffset);
  return parsedUploadDay.toISOString().slice(0, 10);
};

const assigneePool = [
  'Huang, Ian (SH/AQPP)',
  'Lu, Lois (HZ/CP1)',
  'Hu, Freya (BJ/CP3)'
];

const getStableRowScore = (row: SubstantiveDocumentRow) =>
  Array.from(row.id).reduce((sum, char) => sum + char.charCodeAt(0), 0);

const getAssignedPeople = (row: SubstantiveDocumentRow) => {
  const stableScore = getStableRowScore(row);
  const peopleCount = stableScore % 4 === 0 ? 3 : stableScore % 3 === 0 ? 2 : 1;
  return Array.from({ length: peopleCount }, (_, index) => assigneePool[(stableScore + index) % assigneePool.length]);
};

const getReviewerPeople = (row: SubstantiveDocumentRow) => {
  const primaryReviewer = row.reviewedBy ?? row.uploadedBy;
  const stableScore = getStableRowScore(row);
  const additionalCount = stableScore % 4 === 0 ? 2 : stableScore % 4 === 1 ? 1 : 0;
  const additionalReviewers = assigneePool
    .filter(person => person !== primaryReviewer)
    .slice(0, additionalCount);
  return [primaryReviewer, ...additionalReviewers];
};

const ExpandablePeopleCell: React.FC<{ people: string[] }> = ({ people }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMultiplePeople = people.length > 1;

  return (
    <div className="px-1 text-center text-slate-600">
      <div className="audit-person-name" title={people.join('、')}>
        {people[0]}
        {hasMultiplePeople && (
          <button
            type="button"
            onClick={() => setIsExpanded(previous => !previous)}
            className="ml-0.5 inline font-normal text-[#00338D] hover:underline"
            aria-expanded={isExpanded}
            title={isExpanded ? '收起人员名单' : '展开全部人员'}
          >
            等
          </button>
        )}
      </div>
      {hasMultiplePeople && isExpanded && (
        <div className="mt-1 space-y-1 border-t border-slate-100 pt-1 text-[9px] leading-3 text-slate-500">
          {people.slice(1).map(person => <div key={person}>{person}</div>)}
        </div>
      )}
    </div>
  );
};

type ReviewIconState = 'complete' | 'pending' | 'comment';
type ReviewDecision = 'approved' | 'rejected';
type AuditFlowState = 'green' | 'gray' | 'red' | 'amber';
type SampleModalMode = 'information' | 'details';
type ReviewOpinionEntry = { id: string; text: string; timestamp: string; fileId?: string; fileName?: string; rowReference?: RowReference };
type ReviewReplyEntry = { id: string; opinionId: string; text: string; timestamp: string; author: string };
type WorkingPaperFile = { id: string; name: string; source?: File };
type FileStatusTone = 'success' | 'warning' | 'danger' | 'pending';

const WorkingPaperFileStatusFlow: React.FC<{
  steps: Array<{ label: string; value: string; tone: FileStatusTone }>;
}> = ({ steps }) => {
  const toneClasses: Record<FileStatusTone, string> = {
    success: 'bg-[#5F833A] text-white',
    warning: 'bg-[#C59E40] text-white',
    danger: 'bg-[#D95755] text-white',
    pending: 'bg-slate-400 text-white'
  };

  return (
    <div className="grid grid-cols-3">
      {steps.map((step, index) => (
        <div key={step.label} className="relative flex min-w-0 flex-col items-center text-center">
          {index < steps.length - 1 && (
            <span className="absolute left-1/2 top-3 h-0.5 w-full bg-slate-200" aria-hidden="true" />
          )}
          <span className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full ${toneClasses[step.tone]}`}>
            {step.tone === 'success'
              ? <Check className="h-3.5 w-3.5 stroke-[3]" />
              : step.tone === 'danger'
                ? <span className="text-[11px] font-black">!</span>
                : <span className="h-1.5 w-1.5 rounded-full bg-white" />}
          </span>
          <span className="mt-2 text-[10px] font-bold text-slate-700">{step.label}</span>
          <span className="mt-0.5 text-[9px] font-semibold text-slate-500">{step.value}</span>
        </div>
      ))}
    </div>
  );
};

const getWorkingPaperFileKind = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'xlsx' || extension === 'xls') return 'excel';
  if (extension === 'pdf') return 'pdf';
  if (extension === 'docx' || extension === 'doc') return 'doc';
  if (extension === 'pptx' || extension === 'ppt') return 'ppt';
  return 'other';
};

const WorkingPaperFileIcon: React.FC<{ fileName: string; className?: string }> = ({ fileName, className = 'h-5 w-5' }) => {
  const kind = getWorkingPaperFileKind(fileName);
  if (kind === 'excel') return <FileSpreadsheet className={`${className} text-emerald-600`} />;
  if (kind === 'pdf') return <FileText className={`${className} text-red-500`} />;
  if (kind === 'ppt') return <Presentation className={`${className} text-orange-500`} />;
  if (kind === 'doc') return <FileText className={`${className} text-blue-600`} />;
  return <FileIcon className={`${className} text-slate-500`} />;
};

const ExcavatorIcon: React.FC<{ className?: string }> = ({ className = 'h-7 w-7' }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <path d="M9 44h39a8 8 0 0 1 0 16H9a8 8 0 0 1 0-16Z" fill="currentColor" opacity=".18" />
    <circle cx="17" cy="52" r="5" fill="currentColor" />
    <circle cx="42" cy="52" r="5" fill="currentColor" />
    <path d="M15 43V28h19l8 15H15Z" fill="currentColor" opacity=".85" />
    <path d="M21 31h10l5 9H21v-9Z" fill="white" opacity=".9" />
    <path d="M35 27 46 10l5 3-9 18M49 12l7 19" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m54 29 7 2-3 11-9-4 5-9Z" fill="currentColor" />
  </svg>
);

const formatMinuteTimestamp = (date = new Date()) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getInitialReviewTimestamp = (row: SubstantiveDocumentRow) => {
  const reviewDay = row.reviewDate ? formatDay(row.reviewDate) : formatDay(row.uploadDate);
  return reviewDay === '—' ? '2026-09-07 09:30' : `${reviewDay} 10:30`;
};

const ReviewThreadList: React.FC<{
  opinions: ReviewOpinionEntry[];
  replies: ReviewReplyEntry[];
  emptyText?: string;
  selectedOpinionId?: string | null;
  onSelectOpinion?: (opinionId: string) => void;
}> = ({ opinions, replies, emptyText = '暂无复核意见及回复', selectedOpinionId, onSelectOpinion }) => {
  if (opinions.length === 0) {
    return <div className="py-2 text-center text-[10px] text-slate-400">{emptyText}</div>;
  }

  return (
    <div className="space-y-2">
      {opinions.map((opinion, index) => {
        const opinionReplies = replies.filter(reply => reply.opinionId === opinion.id);
        return (
          <div
            key={opinion.id}
            className={`space-y-1.5 ${onSelectOpinion ? 'cursor-pointer' : ''}`}
            onClick={onSelectOpinion ? () => onSelectOpinion(opinion.id) : undefined}
            onKeyDown={onSelectOpinion ? event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelectOpinion(opinion.id);
              }
            } : undefined}
            role={onSelectOpinion ? 'button' : undefined}
            tabIndex={onSelectOpinion ? 0 : undefined}
            aria-label={onSelectOpinion ? `选择复核意见 ${index + 1} 进行回复` : undefined}
          >
            <div className={`rounded-md border px-2.5 py-2 transition-all duration-150 ${
              selectedOpinionId === opinion.id
                ? '-translate-x-1.5 border-blue-400 bg-blue-50 shadow-md ring-1 ring-blue-100'
                : onSelectOpinion
                  ? 'translate-x-0 border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
                  : 'border-slate-200 bg-white'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-[9px] font-bold text-[#D95755]">复核意见 {index + 1}</div>
                <time className="shrink-0 text-[9px] font-normal text-slate-400">{opinion.timestamp}</time>
              </div>
              <p className="mt-1 text-[10px] leading-4 text-slate-600">{opinion.text}</p>
              {opinion.fileName && <div className="mt-1 text-[9px] text-slate-400">底稿：{opinion.fileName}</div>}
              {opinion.rowReference && <div className="mt-1 text-[10px] text-[#00338D]">{formatRowReference(opinion.rowReference)}</div>}
            </div>
            {opinionReplies.map((reply, replyIndex) => (
              <div key={reply.id} className="rounded-md border border-blue-100 bg-blue-50/60 px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[9px] font-bold text-blue-700">
                    回复 {replyIndex + 1} · 回复人：{reply.author}
                  </div>
                  <time className="shrink-0 text-[9px] font-normal text-slate-400">{reply.timestamp}</time>
                </div>
                <p className="mt-1 text-[10px] leading-4 text-slate-600">{reply.text}</p>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

const getReviewIconState = (row: SubstantiveDocumentRow, decision?: ReviewDecision): ReviewIconState => {
  if (decision === 'approved') return 'complete';
  if (decision === 'rejected') return 'comment';
  if (!row.isUploaded) return 'pending';
  const stableScore = getStableRowScore(row);
  if (stableScore % 5 === 0) return 'pending';
  if (stableScore % 5 === 1) return 'comment';
  return 'complete';
};

const getReviewComment = (row: SubstantiveDocumentRow) =>
  `请补充说明 ${row.accountDisclosure} 相关底稿的判断依据，并确认支持性证据已与程序 ${row.procedureId} 完成勾稽。`;

const kspSalesRowIds = new Set(['sales-gospd01010-6', 'sales-gospd01010-7', '149627', '149632']);

const getSamplingMethod = (row: SubstantiveDocumentRow) => {
  if (row.procedureType === 'SAP') return 'SAP';
  if (row.id === '149625') return 'All items';
  if (kspSalesRowIds.has(row.id)) return 'KSP';
  if (row.accountDisclosure.includes('应付职工薪酬')) return 'KSP';
  return 'MUS';
};

const getSystemPrecheckAnomalies = (row: SubstantiveDocumentRow) => {
  const subject = row.accountDisclosure;
  const anomalies = [`${subject} 样本数量与抽样结果不一致`];
  if (getSamplingMethod(row) === 'MUS') {
    anomalies.push(`${subject} 信息与抽样结果不一致`);
  }
  anomalies.push(`${subject} 会计期间异常`);
  return anomalies;
};

const businessProcessDisplayOrder = [
  '销售',
  '采购',
  '存货',
  '固定资产与在建工程',
  '税项',
  '人力资源',
  '资金与融资'
];

const getBusinessProcessRank = (businessProcess: string) => {
  const rank = businessProcessDisplayOrder.findIndex(process => businessProcess.includes(process));
  return rank === -1 ? businessProcessDisplayOrder.length : rank;
};

const getProcedureDecimalOrder = (procedureId: string) => {
  const decimalMatch = procedureId.match(/\.(\d+)\s*$/);
  return decimalMatch ? Number(decimalMatch[1]) : Number.POSITIVE_INFINITY;
};

const isStableTemplateException = (row: SubstantiveDocumentRow) => {
  // The seven imported sales records already carry deliberately varied mock states.
  if (row.id.startsWith('sales-gospd01010-')) return false;

  const stableScore = Array.from(row.id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return row.isUploaded && row.isKcwTemplateUsed === 'Yes' && stableScore % 4 === 0;
};

const initialRowsWithTemplateStates: SubstantiveDocumentRow[] = initialSubstantiveRows
  .map(row => isStableTemplateException(row) ? { ...row, isKcwTemplateUsed: 'Exception' as const } : row)
  .sort((left, right) => {
    const businessProcessDifference = getBusinessProcessRank(left.businessProcess) - getBusinessProcessRank(right.businessProcess);
    if (businessProcessDifference !== 0) return businessProcessDifference;
    return getProcedureDecimalOrder(left.procedureId) - getProcedureDecimalOrder(right.procedureId);
  });

const getStableRowHash = (row: SubstantiveDocumentRow) =>
  Array.from(row.id).reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 2166136261);

const sapceHiddenSalesRowIds = new Set(
  initialRowsWithTemplateStates
    .filter(row => row.businessProcess.includes('销售'))
    .sort((left, right) => getStableRowHash(left) - getStableRowHash(right))
    .slice(0, 4)
    .map(row => row.id)
);

const completedSamplingRowIds = new Set(initialRowsWithTemplateStates.slice(0, 2).map(row => row.id));

const getSamplingProgress = (row: SubstantiveDocumentRow) => {
  const stableScore = getStableRowScore(row);
  const denominator = 12 + (stableScore % 88);
  const numerator = completedSamplingRowIds.has(row.id)
    ? denominator
    : 1 + (stableScore % (denominator - 1));
  return {
    numerator,
    denominator,
    percentage: Math.round((numerator / denominator) * 100)
  };
};

const getInherentRisk = (row: SubstantiveDocumentRow) => {
  if (row.procedureType === 'SAP') return '';
  const stableScore = getStableRowScore(row);
  const riskLevels = ['特别', '升高', '初级'] as const;
  return riskLevels[stableScore % riskLevels.length];
};

const getControlTestResult = (row: SubstantiveDocumentRow) => {
  if (row.procedureType === 'SAP') return '';
  const stableScore = getStableRowScore(row);
  return stableScore % 2 === 0 ? '是' : '否';
};

const getPopulationAmount = (row: SubstantiveDocumentRow) => {
  if (row.procedureType === 'SAP') return '';
  return '100,000,000,000.00';
};

const getDisplayPopulationAmount = (row: SubstantiveDocumentRow, amountUnit: AmountUnit) => {
  if (row.procedureType === 'SAP') return '';
  return amountUnit === 'million' ? '100,000.00' : getPopulationAmount(row);
};

const getMusSamplingDetailGroups = (row: SubstantiveDocumentRow) => {
  const stableScore = getStableRowScore(row);
  const randomSeed = String(700_000_000 + ((stableScore * 7919) % 299_999_999));
  return [
    {
      title: '参数',
      items: [
        ['随机种子编号', randomSeed],
        ['固有风险', getInherentRisk(row)],
        ['控制依赖', getControlTestResult(row)],
        ['可容忍错报', '20,790,000.00'],
        ['审计错报归集界限（AMPT）', '1,540,000.00'],
        ['预期错报', '0.00'],
        ['总体包括汇总抽样单元', '否'],
        ['基于特定项目测试中获取的证据减少样本量', '是'],
        ['特定项目的金额（如果经过测试）', '0.00']
      ]
    },
    {
      title: '总体',
      items: [
        ['正值项目金额', '100,850,000,000.00'],
        ['负值项目金额', '-850,000,000.00'],
        ['净值', '100,000,000,000.00'],
        ['零金额项目的数量', String(20 + (stableScore % 40))]
      ]
    },
    {
      title: '样本量',
      items: [
        ['个别重大项目的账面价值', '0.00'],
        ['抽样总体的账面价值', '100,850,000,000.00'],
        ['拟抽样字段的总值', '100,850,000,000.00'],
        ['个别重大项目的数量', '0'],
        ['抽样单元的数量', '100'],
        ['样本总量', '100'],
        ['上期样本量', '不适用'],
        ['提取总数', '100'],
        ['能够识别出的事实错报和推断错报总额', '1,699,839.95']
      ]
    }
  ] as const;
};

const getKspSamplingDetailGroups = (row: SubstantiveDocumentRow) => {
  const stableScore = getStableRowScore(row);
  const populationItemCount = 1_000_000;
  const significantItemCount = 80 + (stableScore % 41);
  const samplingUnitCount = 60 + (stableScore % 31);
  const plannedSampleCount = significantItemCount + samplingUnitCount;
  const expectedMisstatement = ['无', '低水平', '高水平'][stableScore % 3];
  return [
    {
      title: '参数',
      items: [
        ['固有风险', getInherentRisk(row)],
        ['控制测试有效', getControlTestResult(row)],
        ['可容忍错报', '20,790,000.00'],
        ['审计错报归集界限', '1,540,000.00'],
        ['预期错报', expectedMisstatement],
        ['总体包含汇总项目，项目组计划使用汇总提取法', stableScore % 2 === 0 ? '是' : '否'],
        ['基于特定项目和/或个别重大项目测试中获取的证据减少样本量', stableScore % 3 === 0 ? '否' : '是']
      ]
    },
    {
      title: '重大项目',
      items: [
        ['计算的最有效的货币金额', '1,000,000,000.00'],
        ['确定的最有效的货币金额', '1,000,000,000.00']
      ]
    },
    {
      title: '拟抽样总体',
      items: [
        ['总体中的项目数量', populationItemCount.toLocaleString('en-US')],
        ['总体金额', '100,000,000,000.00'],
        ['个别重大项目的数量', significantItemCount.toLocaleString('en-US')],
        ['个别重大项目的金额', '1,000,000,000.00'],
        ['拟抽样总体中的项目数量', (populationItemCount - significantItemCount).toLocaleString('en-US')],
        ['抽样总体的金额', '99,000,000,000.00'],
        ['所测试的特定项目和个别重大项目金额占比（%）', '1.00%']
      ]
    },
    {
      title: '样本量',
      items: [
        ['抽样单元的数量', samplingUnitCount.toLocaleString('en-US')],
        ['重大项目的数量', significantItemCount.toLocaleString('en-US')],
        ['拟测试项目的总样本量', plannedSampleCount.toLocaleString('en-US')]
      ]
    }
  ] as const;
};

const createInitialWorkingPaperFiles = (row: SubstantiveDocumentRow): WorkingPaperFile[] => {
  const filePrefix = row.procedureId.replace(/\s+/g, '') || row.id;
  return [
    {
      id: `${row.id}-initial-workpaper`,
      name: `${filePrefix}-工作底稿.xlsx`
    },
    {
      id: `${row.id}-initial-support`,
      name: `${filePrefix}-支持文件.pptx`
    }
  ];
};

const getWorkingPaperStages = (
  row: SubstantiveDocumentRow,
  isTemplateExceptionConfirmed: boolean
): Array<{ label: string; state: WorkingPaperStageState }> => {
  if (row.isKcwTemplateUsed === 'No') {
    return ['上传', '检查', '修正', '复核', '归档'].map(label => ({ label, state: 'unavailable' }));
  }

  if (row.isKcwTemplateUsed === 'Exception') {
    return isTemplateExceptionConfirmed
      ? [
          { label: '上传', state: 'done' },
          { label: '检查', state: 'active' },
          { label: '修正', state: 'active' },
          { label: '复核', state: 'unavailable' },
          { label: '归档', state: 'unavailable' }
        ]
      : [
          { label: '上传', state: 'blocked' },
          { label: '检查', state: 'unavailable' },
          { label: '修正', state: 'unavailable' },
          { label: '复核', state: 'unavailable' },
          { label: '归档', state: 'unavailable' }
        ];
  }

  return [
    { label: '上传', state: row.isUploaded ? 'done' : 'blocked' },
    { label: '检查', state: !row.isUploaded ? 'blocked' : row.inspectionStatus === 'passed' ? 'done' : 'blocked' },
    { label: '修正', state: row.inspectionStatus === 'passed' ? 'done' : row.isUploaded ? 'active' : 'blocked' },
    { label: '复核', state: row.inspectionStatus === 'passed' ? 'done' : 'unavailable' },
    { label: '归档', state: row.isUploaded && row.inspectionStatus === 'passed' ? 'done' : 'unavailable' }
  ];
};

export const AuditObjectives: React.FC<AuditObjectivesProps> = ({ onModifyProcedure }) => {
  // Main view state: 'substantive' (Substantive Document Management) vs 'procedures' (Procedure Matrix)
  const [viewMode, setViewMode] = useState<'substantive' | 'procedures'>('substantive');

  // Business Process state
  const [selectedBpFilter, setSelectedBpFilter] = useState<string>('all');

  // Engagement scope filters
  const [selectedEntity, setSelectedEntity] = useState<string>('abc-limited-co');
  const [selectedPeriod, setSelectedPeriod] = useState<AccountingPeriodFilter>('2026');

  // Substantive Documents dataset state
  const [rows, setRows] = useState<SubstantiveDocumentRow[]>(initialRowsWithTemplateStates);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectionFilter, setInspectionFilter] = useState<string>('all');
  const [summaryFilter, setSummaryFilter] = useState<SummaryFilter>('all');
  const [showIdentifierColumns, setShowIdentifierColumns] = useState<boolean>(false);
  const [amountUnit, setAmountUnit] = useState<AmountUnit>('yuan');

  // Modals state
  const [detailModalRow, setDetailModalRow] = useState<SubstantiveDocumentRow | null>(null);
  const [commentModalRow, setCommentModalRow] = useState<SubstantiveDocumentRow | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [commentsByRow, setCommentsByRow] = useState<Record<string, ReviewOpinionEntry[]>>({});
  const [savedReviewCommentsByRow, setSavedReviewCommentsByRow] = useState<Record<string, boolean>>({});
  const [reviewDecisionsByRow, setReviewDecisionsByRow] = useState<Record<string, ReviewDecision>>({});
  const [isCommentHistoryExpanded, setIsCommentHistoryExpanded] = useState<boolean>(false);
  const [reviewCommentModalRow, setReviewCommentModalRow] = useState<SubstantiveDocumentRow | null>(null);
  const [reviewReplyText, setReviewReplyText] = useState<string>('');
  const [selectedReplyOpinionId, setSelectedReplyOpinionId] = useState<string | null>(null);
  const [reviewRepliesByRow, setReviewRepliesByRow] = useState<Record<string, ReviewReplyEntry[]>>({});
  const [scanExceptionModalRow, setScanExceptionModalRow] = useState<SubstantiveDocumentRow | null>(null);
  const [scannedRows, setScannedRows] = useState<Record<string, boolean>>({});
  const [uploadModalRow, setUploadModalRow] = useState<SubstantiveDocumentRow | null>(null);
  const [workingPaperFileDetail, setWorkingPaperFileDetail] = useState<{ row: SubstantiveDocumentRow; file: WorkingPaperFile } | null>(null);
  const [fileViewers, setFileViewers] = useState<Array<{ id: string; target: Window | null; rowId: string; file: WorkingPaperFile }>>([]);
  const [uploadedFilesByRow, setUploadedFilesByRow] = useState<Record<string, WorkingPaperFile[]>>(() =>
    Object.fromEntries(initialRowsWithTemplateStates.map(row => [row.id, createInitialWorkingPaperFiles(row)]))
  );
  const [sampleModalRow, setSampleModalRow] = useState<SubstantiveDocumentRow | null>(null);
  const [sampleModalMode, setSampleModalMode] = useState<SampleModalMode>('information');
  const [templateExceptionModalRow, setTemplateExceptionModalRow] = useState<SubstantiveDocumentRow | null>(null);
  const [templateExceptionReason, setTemplateExceptionReason] = useState<string>('');
  const [templateExceptionReasons, setTemplateExceptionReasons] = useState<Record<string, string>>({});
  const [confirmedTemplateExceptions, setConfirmedTemplateExceptions] = useState<Record<string, boolean>>({});
  const [workpaperReasonModalRow, setWorkpaperReasonModalRow] = useState<SubstantiveDocumentRow | null>(null);
  const [workpaperReason, setWorkpaperReason] = useState<string>('');
  const [workpaperReasons, setWorkpaperReasons] = useState<Record<string, string>>({});
  const [isKcwSyncModalOpen, setIsKcwSyncModalOpen] = useState<boolean>(false);
  const [isWorkAssignmentModalOpen, setIsWorkAssignmentModalOpen] = useState<boolean>(false);
  const [expandedAssignmentProcesses, setExpandedAssignmentProcesses] = useState<Record<string, boolean>>({});
  const [workAssignments, setWorkAssignments] = useState<Record<string, string>>({});
  const [draftWorkAssignments, setDraftWorkAssignments] = useState<Record<string, string>>({});
  const [kcwUrls, setKcwUrls] = useState<Record<string, string>>(() =>
    Object.fromEntries(kcwBusinessProcesses.map(process => [process.id, '']))
  );
  const [areKcwUrlsConfirmed, setAreKcwUrlsConfirmed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Show Toast
  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Sync to KCW
  const handleSyncToKCW = () => {
    setAreKcwUrlsConfirmed(false);
    setIsKcwSyncModalOpen(true);
  };

  const handleSendToKCW = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setIsKcwSyncModalOpen(false);
      showNotification('底稿及附件已成功同步至 KPMG KCW 云底稿系统');
    }, 1200);
  };

  const openBlankWorkspace = () => {
    window.open('about:blank', '_blank', 'noopener,noreferrer');
  };

  const openWorkingPaperWindow = (rowId: string, file: WorkingPaperFile) => {
    const row = rows.find(item => item.id === rowId);
    const previewSource = file.source ?? new File([
      `字段,内容\n程序ID,${row?.procedureId ?? rowId}\n业务流程,${row?.businessProcess ?? ''}\n账户或披露,${row?.accountDisclosure ?? ''}\n文件名称,${file.name}\n说明,模拟底稿文件内容`
    ], file.name, { type: 'text/csv;charset=utf-8' });
    const previewFile = { ...file, source: previewSource };

    setCommentsByRow(previous => {
      const currentOpinions = previous[rowId] ?? [];
      if (currentOpinions.some(opinion => opinion.fileId === file.id)) return previous;
      return {
        ...previous,
        [rowId]: [
          ...currentOpinions,
          {
            id: `${file.id}-mock-opinion`,
            text: `请确认 ${file.name} 中的关键数据已与支持性证据完成勾稽，并补充必要说明。`,
            timestamp: row ? getInitialReviewTimestamp(row) : formatMinuteTimestamp(),
            fileId: file.id,
            fileName: file.name
          }
        ]
      };
    });

    const id = createId();
    const previewUrl = new URL(window.location.href);
    previewUrl.search = '';
    previewUrl.hash = '';
    previewUrl.searchParams.set('workingPaperPreview', id);
    let target: Window | null = null;
    try { target = window.open(previewUrl.href, '_blank'); }
    catch { /* Embedded browsers may reject popups; keep an in-page preview. */ }

    setFileViewers(previous => [...previous, { id, target, rowId, file: previewFile }]);
  };

  const allKcwUrlsProvided = kcwBusinessProcesses.every(process => kcwUrls[process.id]?.trim());

  const workAssignmentGroups = useMemo(() => {
    const groups = new Map<string, Map<string, SubstantiveDocumentRow>>();
    rows.forEach(row => {
      if (!groups.has(row.businessProcess)) groups.set(row.businessProcess, new Map());
      const accounts = groups.get(row.businessProcess)!;
      if (!accounts.has(row.accountDisclosure)) accounts.set(row.accountDisclosure, row);
    });
    return Array.from(groups, ([businessProcess, accounts]) => ({
      businessProcess,
      accounts: Array.from(accounts, ([accountDisclosure, representativeRow]) => ({ accountDisclosure, representativeRow }))
    }));
  }, [rows]);

  const getWorkAssignmentValue = (
    businessProcess: string,
    accountDisclosure: string,
    row: SubstantiveDocumentRow,
    assignments: Record<string, string> = workAssignments
  ) => assignments[`${businessProcess}::${accountDisclosure}`] ?? getAssignedPeople(row)[0];

  const assignEntireProcess = (businessProcess: string, assignee: string) => {
    const processGroup = workAssignmentGroups.find(group => group.businessProcess === businessProcess);
    if (!processGroup) return;
    setDraftWorkAssignments(previous => {
      const next = { ...previous };
      processGroup.accounts.forEach(({ accountDisclosure }) => {
        next[`${businessProcess}::${accountDisclosure}`] = assignee;
      });
      return next;
    });
  };

  const getDashboardReviewState = (row: SubstantiveDocumentRow): ReviewIconState => {
    if (!scannedRows[row.id]) return 'pending';
    if (!row.isUploaded || row.isKcwTemplateUsed === 'No') return 'pending';
    if (row.isKcwTemplateUsed === 'Exception' && !confirmedTemplateExceptions[row.id]) return 'comment';
    if (row.inspectionStatus === 'failed') return 'comment';
    if (row.inspectionStatus !== 'passed') return 'pending';
    return getReviewIconState(row, reviewDecisionsByRow[row.id]);
  };

  const entityRows = useMemo(() => {
    if (selectedEntity !== 'sapce-limited-co') return rows;
    return rows.filter(row => !(row.businessProcess.includes('销售') && sapceHiddenSalesRowIds.has(row.id)));
  }, [rows, selectedEntity]);

  // Filtered rows calculation
  const filteredRows = useMemo(() => {
    return entityRows.filter(r => {
      // Use the dated working-paper activity as the available period signal in this prototype.
      if (selectedPeriod !== 'all') {
        const rowPeriod = r.uploadDate === '-' ? '2026' : r.uploadDate.slice(0, 4);
        if (rowPeriod !== selectedPeriod) return false;
      }

      // Business process match
      if (selectedBpFilter !== 'all') {
        const bpMatch = r.businessProcess.toLowerCase().includes(selectedBpFilter.toLowerCase()) ||
                        (selectedBpFilter === '固定资产' && r.businessProcess.includes('固定资产')) ||
                        (selectedBpFilter === '税项' && r.businessProcess.includes('税项')) ||
                        (selectedBpFilter === '销售' && r.businessProcess.includes('销售')) ||
                        (selectedBpFilter === '采购' && r.businessProcess.includes('采购')) ||
                        (selectedBpFilter === '人力资源' && r.businessProcess.includes('人力资源')) ||
                        (selectedBpFilter === '存货' && r.businessProcess.includes('存货')) ||
                        (selectedBpFilter === '资金' && r.businessProcess.includes('资金'));
        if (!bpMatch) return false;
      }

      // Inspection status match
      if (inspectionFilter === 'passed' && r.inspectionStatus !== 'passed') return false;
      if (inspectionFilter === 'failed' && r.inspectionStatus !== 'failed') return false;
      if (inspectionFilter === 'unuploaded' && r.isUploaded) return false;

      // Dashboard summary card match
      if (summaryFilter === 'uploaded' && !r.isUploaded) return false;
      if (summaryFilter === 'unuploaded' && r.isUploaded) return false;
      if (summaryFilter === 'review-passed' && getDashboardReviewState(r) !== 'complete') return false;
      if (summaryFilter === 'review-failed' && getDashboardReviewState(r) === 'complete') return false;
      if (summaryFilter === 'precheck-passed' && r.inspectionStatus !== 'passed') return false;
      if (summaryFilter === 'precheck-failed' && r.inspectionStatus !== 'failed') return false;

      // Text query match
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          r.id.toLowerCase().includes(q) ||
          r.rmmId.toLowerCase().includes(q) ||
          r.procedureId.toLowerCase().includes(q) ||
          r.businessProcess.toLowerCase().includes(q) ||
          r.accountDisclosure.toLowerCase().includes(q) ||
          r.procedureDesc.toLowerCase().includes(q) ||
          r.uploadedBy.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [entityRows, selectedPeriod, selectedBpFilter, inspectionFilter, summaryFilter, searchQuery, reviewDecisionsByRow, scannedRows, confirmedTemplateExceptions]);

  const handleExportRows = () => {
    const headers = [
      '业务流程', '账户/披露', 'RM ID', '程序ID', '实质性程序描述', '类型', '抽样方式', '样本信息',
      '固有风险', '依赖控制测试', `总体金额（${amountUnit === 'million' ? '百万元' : '元'}）`, '抽样详情', '抽样进度',
      '底稿模板', '工作底稿', '上传人', '上传日期', '复核人', '复核日期'
    ];
    const exportRows = filteredRows.map(row => {
      const hasUploader = row.isUploaded && row.isKcwTemplateUsed !== 'No';
      const hasReviewer = row.isUploaded && row.isKcwTemplateUsed === 'Yes';

      return [
        row.businessProcess,
        row.accountDisclosure,
        row.rmmId,
        row.procedureId,
        row.procedureDesc,
        row.procedureType,
        getSamplingMethod(row),
        `sample（${getSamplingMethod(row)}）`,
        getInherentRisk(row),
        getControlTestResult(row),
        getDisplayPopulationAmount(row, amountUnit),
        `${getSamplingProgress(row).percentage}%`,
        `${getSamplingProgress(row).numerator}/${getSamplingProgress(row).denominator}`,
        row.kcwTemplate,
        (uploadedFilesByRow[row.id] ?? []).map(file => file.name).join('；'),
        hasUploader ? row.uploadedBy : '—',
        hasUploader ? formatDay(row.uploadDate) : '—',
        hasReviewer ? (row.reviewedBy ?? row.uploadedBy) : '—',
        hasReviewer ? (row.reviewDate ?? getReviewDay(row)) : '—'
      ];
    });
    const escapeCsvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csvContent = `\uFEFF${[headers, ...exportRows]
      .map(record => record.map(escapeCsvCell).join(','))
      .join('\r\n')}`;
    const downloadUrl = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = '实质性审计底稿清单-2026.csv';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(downloadUrl);
    showNotification(`已导出 ${filteredRows.length} 条当前筛选记录`);
  };

  // Statistics calculation for Digital Dashboard
  const stats = useMemo(() => {
    const total = entityRows.length;
    const uploaded = entityRows.filter(r => r.isUploaded).length;
    const unuploaded = total - uploaded;
    const reviewPassed = entityRows.filter(r => getDashboardReviewState(r) === 'complete').length;
    const reviewFailed = total - reviewPassed;
    const reviewed = total;
    const precheckPassed = entityRows.filter(r => r.inspectionStatus === 'passed').length;
    const precheckFailed = entityRows.filter(r => r.inspectionStatus === 'failed').length;
    const prechecked = precheckPassed + precheckFailed;

    return {
      total,
      currentCount: total,
      uploaded,
      unuploaded,
      uploadRate: total > 0 ? Math.round((uploaded / total) * 100) : 0,
      unuploadRate: total > 0 ? Math.round((unuploaded / total) * 100) : 0,
      reviewPassed,
      reviewFailed,
      reviewPassRate: reviewed > 0 ? Math.round((reviewPassed / reviewed) * 100) : 0,
      reviewFailRate: reviewed > 0 ? Math.round((reviewFailed / reviewed) * 100) : 0,
      precheckPassed,
      precheckFailed,
      precheckPassRate: prechecked > 0 ? Math.round((precheckPassed / prechecked) * 100) : 0,
      precheckFailRate: prechecked > 0 ? Math.round((precheckFailed / prechecked) * 100) : 0
    };
  }, [entityRows, reviewDecisionsByRow, scannedRows, confirmedTemplateExceptions]);

  const applySummaryFilter = (filter: SummaryFilter) => {
    setSummaryFilter(filter);
    setSelectedBpFilter('all');
    setInspectionFilter('all');
    setSearchQuery('');
  };

  const handleRefreshPrograms = () => {
    setRows([...initialRowsWithTemplateStates]);
    setTemplateExceptionReasons({});
    setConfirmedTemplateExceptions({});
    setWorkpaperReasons({});
    setReviewDecisionsByRow({});
    setScannedRows({});
    showNotification('程序数据已重新拉取并同步');
  };

  const handleRefreshSamples = () => {
    setUploadedFilesByRow(Object.fromEntries(
      initialRowsWithTemplateStates.map(row => [row.id, createInitialWorkingPaperFiles(row)])
    ));
    setSampleModalRow(null);
    showNotification('样本及底稿文件数据已重新拉取并同步');
  };

  const addWorkingPaperFiles = (rowId: string, files: FileList | File[]) => {
    const selectedFiles = Array.from(files);
    if (selectedFiles.length === 0) return;
    const fileEntries = selectedFiles.map((file, index) => ({
      id: `${rowId}-file-${Date.now()}-${index}`,
      name: file.name,
      source: file
    }));
    setUploadedFilesByRow(previous => ({
      ...previous,
      [rowId]: [...(previous[rowId] ?? []), ...fileEntries]
    }));
    showNotification(`已添加 ${selectedFiles.length} 个工作底稿文件`);
  };

  const replaceWorkingPaperFile = (rowId: string, uploadedFile: WorkingPaperFile, replacementFile: File) => {
    if (!window.confirm(`确定要用 ${replacementFile.name} 替换已上传的 ${uploadedFile.name} 吗？`)) return;
    const nextFile = { ...uploadedFile, name: replacementFile.name, source: replacementFile };
    setUploadedFilesByRow(previous => ({
      ...previous,
      [rowId]: (previous[rowId] ?? []).map(file => file.id === uploadedFile.id
        ? nextFile
        : file)
    }));
    setWorkingPaperFileDetail(previous => previous?.row.id === rowId && previous.file.id === uploadedFile.id
      ? { ...previous, file: nextFile }
      : previous);
    showNotification(`已用 ${replacementFile.name} 替换 ${uploadedFile.name}`);
  };

  // Handle Upload Submission
  const handleConfirmUpload = (id: string) => {
    setRows(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          isUploaded: true,
          uploadedBy: 'Huang, Ian (SH/AQPP)',
          uploadDate: '2026-08-06 09:30',
          isKcwTemplateUsed: 'Yes',
          inspectionStatus: 'passed'
        };
      }
      return r;
    }));
    setUploadModalRow(null);
    showNotification(`底稿已成功上传至 KCW 并完成 AI 预检 [ID: ${id}]`);
  };

  const openReviewModal = (row: SubstantiveDocumentRow) => {
    setCommentModalRow(row);
    setCommentText('');
    setIsCommentHistoryExpanded(false);
  };

  const handleReviewDecision = (decision: ReviewDecision) => {
    if (!commentModalRow) return;
    const hasSavedComment = savedReviewCommentsByRow[commentModalRow.id];
    if (decision === 'approved' && hasSavedComment) return;
    if (decision === 'rejected' && !commentText.trim() && !hasSavedComment) return;

    if (commentText.trim()) {
      setCommentsByRow(previous => ({
        ...previous,
        [commentModalRow.id]: [
          ...(previous[commentModalRow.id] ?? []),
          {
            id: `${commentModalRow.id}-opinion-${Date.now()}`,
            text: commentText.trim(),
            timestamp: formatMinuteTimestamp()
          }
        ]
      }));
    }

    setReviewDecisionsByRow(previous => ({ ...previous, [commentModalRow.id]: decision }));
    if (decision === 'approved') {
      setRows(previous => previous.map(row => row.id === commentModalRow.id ? {
        ...row,
        isUploaded: true,
        uploadedBy: row.isUploaded ? row.uploadedBy : 'Huang, Ian (SH/AQPP)',
        uploadDate: row.isUploaded ? row.uploadDate : '2026-09-04 09:30',
        isKcwTemplateUsed: 'Yes',
        inspectionStatus: 'passed',
        reviewedBy: 'Huang, Ian (SH/AQPP)',
        reviewDate: '2026-09-04'
      } : row));
      showNotification(`已通过复核，相关状态已同步更新 [ID: ${commentModalRow.id}]`);
    } else {
      showNotification(`已标记为需跟进并记录评论 [ID: ${commentModalRow.id}]`);
    }

    setCommentModalRow(null);
    setCommentText('');
    setIsCommentHistoryExpanded(false);
  };

  const handleSaveReviewComment = () => {
    if (!commentModalRow || !commentText.trim()) return;
    setCommentsByRow(previous => ({
      ...previous,
      [commentModalRow.id]: [
        ...(previous[commentModalRow.id] ?? []),
        {
          id: `${commentModalRow.id}-opinion-${Date.now()}`,
          text: commentText.trim(),
          timestamp: formatMinuteTimestamp()
        }
      ]
    }));
    setSavedReviewCommentsByRow(previous => ({ ...previous, [commentModalRow.id]: true }));
    setCommentText('');
    setIsCommentHistoryExpanded(true);
    showNotification(`复核意见已保存 [ID: ${commentModalRow.id}]`);
  };

  const handleSubmitReviewReply = () => {
    if (!reviewCommentModalRow || !reviewReplyText.trim()) return;
    const availableOpinions = getReviewOpinions(reviewCommentModalRow);
    const targetOpinion = availableOpinions.find(opinion => opinion.id === selectedReplyOpinionId)
      ?? availableOpinions.at(-1);
    if (!targetOpinion) return;
    setReviewRepliesByRow(previous => ({
      ...previous,
      [reviewCommentModalRow.id]: [
        ...(previous[reviewCommentModalRow.id] ?? []),
        {
          id: `${reviewCommentModalRow.id}-reply-${Date.now()}`,
          opinionId: targetOpinion.id,
          text: reviewReplyText.trim(),
          timestamp: formatMinuteTimestamp(),
          author: 'Huang, Ian (SH/AQPP)'
        }
      ]
    }));
    setReviewReplyText('');
    showNotification(`复核意见回复已保存 [ID: ${reviewCommentModalRow.id}]`);
  };

  const handleDownloadWorkingPaperTemplate = (row: SubstantiveDocumentRow) => {
    const templateRows = [
      ['字段', '内容'],
      ['业务流程', row.businessProcess],
      ['账户/披露', row.accountDisclosure],
      ['RM ID', row.rmmId],
      ['程序ID', row.procedureId],
      ['实质性程序描述', row.procedureDesc],
      ['当前复核意见', getReviewComment(row)]
    ];
    const csvContent = `\uFEFF${templateRows
      .map(record => record.map(value => `"${value.replace(/"/g, '""')}"`).join(','))
      .join('\r\n')}`;
    const downloadUrl = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = `${row.procedureId.replace(/[\\/:*?"<>|]/g, '-')}-工作底稿.csv`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(downloadUrl);
    showNotification(`当前底稿模板已下载 [${row.procedureId}]`);
  };

  const openTemplateExceptionModal = (row: SubstantiveDocumentRow) => {
    setTemplateExceptionModalRow(row);
    setTemplateExceptionReason(templateExceptionReasons[row.id] ?? '');
  };

  const handleConfirmTemplateException = () => {
    if (!templateExceptionModalRow || !templateExceptionReason.trim()) return;

    setTemplateExceptionReasons(previous => ({
      ...previous,
      [templateExceptionModalRow.id]: templateExceptionReason.trim()
    }));
    setConfirmedTemplateExceptions(previous => ({
      ...previous,
      [templateExceptionModalRow.id]: true
    }));
    showNotification(`未使用标准模板原因已记录 [ID: ${templateExceptionModalRow.id}]`);
    setTemplateExceptionModalRow(null);
    setTemplateExceptionReason('');
  };

  const handleConfirmWorkpaperReason = () => {
    if (!workpaperReasonModalRow || !workpaperReason.trim()) return;
    setWorkpaperReasons(previous => ({
      ...previous,
      [workpaperReasonModalRow.id]: workpaperReason.trim()
    }));
    showNotification(`未使用工作底稿原因已记录 [ID: ${workpaperReasonModalRow.id}]`);
    setWorkpaperReasonModalRow(null);
    setWorkpaperReason('');
  };

  const handleBatchSystemScan = () => {
    setScannedRows(previous => ({
      ...previous,
      ...Object.fromEntries(filteredRows.map(row => [row.id, true]))
    }));
    showNotification(`已完成 ${filteredRows.length} 项批量预检`);
  };

  const maximumWorkingPaperFiles = Math.max(0, ...filteredRows.map(row => (uploadedFilesByRow[row.id] ?? []).length));
  const workingPaperItemCount = maximumWorkingPaperFiles + 1;
  const workingPaperColumnWidth = Math.max(60, (workingPaperItemCount * 48) + ((workingPaperItemCount - 1) * 6) + 12);
  const tableColumnWidths = showIdentifierColumns
    ? [58, 74, 54, 68, 166, 44, 58, 74, 54, 78, 112, 58, 58, 78, workingPaperColumnWidth, 76, 86, 90, 90, 44]
    : [58, 74, 166, 44, 58, 74, 54, 78, 112, 58, 58, 78, workingPaperColumnWidth, 76, 44];
  const tableMinWidth = tableColumnWidths.reduce((total, width) => total + width, 0);

  const getTemplateColumnState = (row: SubstantiveDocumentRow): AuditFlowState => {
    if (!row.isUploaded) return 'gray';
    if (row.isKcwTemplateUsed === 'Yes') return 'green';
    if (row.isKcwTemplateUsed === 'No') return 'gray';
    return confirmedTemplateExceptions[row.id] ? 'amber' : 'red';
  };

  const getScanColumnState = (row: SubstantiveDocumentRow): AuditFlowState => {
    if (!scannedRows[row.id]) return 'gray';
    const templateState = getTemplateColumnState(row);
    if (!row.isUploaded || templateState === 'gray') return 'gray';
    if (templateState === 'red') return 'red';
    if (row.inspectionStatus === 'passed') return 'green';
    if (row.inspectionStatus === 'failed') return 'red';
    return 'gray';
  };

  const getVisibleSystemPrecheckAnomalies = (row: SubstantiveDocumentRow) =>
    row.inspectionStatus === 'failed' || row.isKcwTemplateUsed !== 'Yes'
      ? getSystemPrecheckAnomalies(row)
      : [];

  const getReviewColumnState = (row: SubstantiveDocumentRow): ReviewIconState => {
    return getDashboardReviewState(row);
  };

  const getReviewOpinions = (row: SubstantiveDocumentRow): ReviewOpinionEntry[] => {
    const savedOpinions = commentsByRow[row.id] ?? [];
    const initialOpinionId = `${row.id}-initial-opinion`;
    const hasRepliesToInitialOpinion = (reviewRepliesByRow[row.id] ?? [])
      .some(reply => reply.opinionId === initialOpinionId);
    const shouldIncludeInitialOpinion = hasRepliesToInitialOpinion || (
      getReviewColumnState(row) === 'comment' && reviewDecisionsByRow[row.id] !== 'rejected'
    );
    if (!shouldIncludeInitialOpinion) return savedOpinions;
    return [{
      id: initialOpinionId,
      text: getReviewComment(row),
      timestamp: getInitialReviewTimestamp(row)
    }, ...savedOpinions];
  };

  const handleDownloadReviewHistory = (row: SubstantiveDocumentRow) => {
    const opinions = getReviewOpinions(row);
    const replies = reviewRepliesByRow[row.id] ?? [];
    const records: string[][] = [['类型', '关联意见', '人员', '时间', '内容', '底稿文件', '工作表', 'Excel 行号']];
    opinions.forEach((opinion, index) => {
      const source = [opinion.fileName ?? '', opinion.rowReference?.sheetName ?? '', opinion.rowReference?.rows.join('、') ?? ''];
      records.push(['复核意见', `复核意见 ${index + 1}`, row.reviewedBy ?? 'Lu, Lois (HZ/CP1)', opinion.timestamp, opinion.text, ...source]);
      replies
        .filter(reply => reply.opinionId === opinion.id)
        .forEach(reply => records.push(['回复', `复核意见 ${index + 1}`, reply.author, reply.timestamp, reply.text, ...source]));
    });
    const escapeCsvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csvContent = `\uFEFF${records.map(record => record.map(escapeCsvCell).join(',')).join('\r\n')}`;
    const downloadUrl = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = `${row.procedureId.replace(/[\\/:*?"<>|]/g, '-')}-复核意见记录.csv`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(downloadUrl);
    showNotification(`复核意见记录已下载 [${row.procedureId}]`);
  };

  const handleExportReviewRecords = () => {
    const headers = [
      'Entity', '会计期间', '业务流程', '账户/披露', 'RM ID', '程序ID', '条目ID', '实质性程序描述',
      '记录类型', '记录ID', '关联意见ID', '底稿文件', '工作表', 'Excel行号', '记录人', '记录时间', '详细内容', '底稿复核状态'
    ];
    const records: string[][] = [];
    filteredRows.forEach(row => {
      const opinions = getReviewOpinions(row);
      opinions.forEach(opinion => {
        const shared = [
          selectedEntity === 'sapce-limited-co' ? 'SAPCE LIMITED CO.' : 'ABC LIMITED CO.',
          selectedPeriod === 'all' ? '全部会计期间' : selectedPeriod,
          row.businessProcess,
          row.accountDisclosure,
          row.rmmId,
          row.procedureId,
          row.id,
          row.procedureDesc
        ];
        const source = [
          opinion.fileName ?? '—',
          opinion.rowReference?.sheetName ?? '—',
          opinion.rowReference?.rows.join('、') ?? '—'
        ];
        records.push([
          ...shared,
          '复核意见',
          opinion.id,
          '—',
          ...source,
          row.reviewedBy ?? 'Lu, Lois (HZ/CP1)',
          opinion.timestamp,
          opinion.text,
          getReviewColumnState(row) === 'complete' ? '已完成' : getReviewColumnState(row) === 'comment' ? '有意见' : '待复核'
        ]);
        (reviewRepliesByRow[row.id] ?? [])
          .filter(reply => reply.opinionId === opinion.id)
          .forEach(reply => records.push([
            ...shared,
            '意见回复',
            reply.id,
            opinion.id,
            ...source,
            reply.author,
            reply.timestamp,
            reply.text,
            getReviewColumnState(row) === 'complete' ? '已完成' : getReviewColumnState(row) === 'comment' ? '有意见' : '待复核'
          ]));
      });
    });
    const escapeCsvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csvContent = `\uFEFF${[headers, ...records].map(record => record.map(escapeCsvCell).join(',')).join('\r\n')}`;
    const downloadUrl = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = '实质性审计底稿-复核记录.csv';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(downloadUrl);
    showNotification(`已导出 ${records.length} 条复核详细记录`);
  };

  const getWorkingPaperFileStatusSteps = (row: SubstantiveDocumentRow): Array<{ label: string; value: string; tone: FileStatusTone }> => {
    const templateState = getTemplateColumnState(row);
    const scanState = getScanColumnState(row);
    return [
      {
        label: '工作底稿状态',
        value: row.isUploaded ? '已上传' : '待上传',
        tone: row.isUploaded ? 'success' : 'pending'
      },
      {
        label: '使用标准模板',
        value: row.isKcwTemplateUsed === 'Yes'
          ? '已使用'
          : row.isKcwTemplateUsed === 'Exception'
            ? confirmedTemplateExceptions[row.id] ? '例外已确认' : '待确认例外'
            : '未使用',
        tone: templateState === 'green'
          ? 'success'
          : templateState === 'amber'
            ? 'warning'
            : templateState === 'red' ? 'danger' : 'pending'
      },
      {
        label: '系统预检结果',
        value: scanState === 'green' ? '已通过' : scanState === 'red' ? '未通过' : '待预检',
        tone: scanState === 'green' ? 'success' : scanState === 'red' ? 'danger' : 'pending'
      }
    ];
  };

  const workingPaperFileStatusSteps = workingPaperFileDetail
    ? getWorkingPaperFileStatusSteps(workingPaperFileDetail.row)
    : [];

  const workingPaperFileOpinions = workingPaperFileDetail
    ? (() => {
        const { row, file } = workingPaperFileDetail;
        const opinions = getReviewOpinions(row).filter(opinion => !opinion.fileId || opinion.fileId === file.id);
        if (opinions.length > 0) return opinions;
        return [{
          id: `${file.id}-mock-opinion`,
          text: `请确认 ${file.name} 中的关键数据已与支持性证据完成勾稽，并补充必要说明。`,
          timestamp: getInitialReviewTimestamp(row),
          fileId: file.id,
          fileName: file.name
        }];
      })()
    : [];

  const handleSubmitWorkingPaperFileReply = () => {
    if (!workingPaperFileDetail || !reviewReplyText.trim()) return;
    const targetOpinion = workingPaperFileOpinions.find(opinion => opinion.id === selectedReplyOpinionId)
      ?? workingPaperFileOpinions.at(-1);
    if (!targetOpinion) return;
    const rowId = workingPaperFileDetail.row.id;
    setReviewRepliesByRow(previous => ({
      ...previous,
      [rowId]: [
        ...(previous[rowId] ?? []),
        {
          id: `${rowId}-reply-${Date.now()}`,
          opinionId: targetOpinion.id,
          text: reviewReplyText.trim(),
          timestamp: formatMinuteTimestamp(),
          author: 'Huang, Ian (SH/AQPP)'
        }
      ]
    }));
    setSelectedReplyOpinionId(targetOpinion.id);
    setReviewReplyText('');
    showNotification(`复核意见回复已保存 [文件: ${workingPaperFileDetail.file.name}]`);
  };

  const handleDeleteWorkingPaperFile = () => {
    if (!workingPaperFileDetail) return;
    const { row, file } = workingPaperFileDetail;
    if (!window.confirm(`确定删除 ${file.name} 吗？相关意见及回复将继续保留。`)) return;
    setUploadedFilesByRow(previous => ({
      ...previous,
      [row.id]: (previous[row.id] ?? []).filter(item => item.id !== file.id)
    }));
    setWorkingPaperFileDetail(null);
    setReviewReplyText('');
    setSelectedReplyOpinionId(null);
    showNotification(`已删除 ${file.name}，相关意见及回复已保留`);
  };

  const getWorkingPaperFileStatusByRowId = (rowId: string) => {
    const row = rows.find(item => item.id === rowId);
    return row ? getWorkingPaperFileStatusSteps(row) : [];
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {fileViewers.map(viewer => viewer.file.source && <WorkingPaperPreviewSession
        key={viewer.id}
        id={viewer.id}
        target={viewer.target}
        file={viewer.file.source}
        status={getWorkingPaperFileStatusByRowId(viewer.rowId)}
        anomalies={rows.find(row => row.id === viewer.rowId) ? getVisibleSystemPrecheckAnomalies(rows.find(row => row.id === viewer.rowId)!) : []}
        opinions={(commentsByRow[viewer.rowId] ?? []).filter(opinion => opinion.fileId === viewer.file.id)}
        replies={reviewRepliesByRow[viewer.rowId] ?? []}
        onClose={() => setFileViewers(previous => previous.filter(item => item.id !== viewer.id))}
        onOpinion={(text, rowReference) => {
          const opinion = { id: createId(), text, timestamp: formatMinuteTimestamp(), fileId: viewer.file.id, fileName: viewer.file.name, rowReference };
          setCommentsByRow(previous => ({ ...previous, [viewer.rowId]: [...(previous[viewer.rowId] ?? []), opinion] }));
          setSavedReviewCommentsByRow(previous => ({ ...previous, [viewer.rowId]: true }));
        }}
        onReply={(opinionId, text) => {
          const reply = { id: createId(), opinionId, text, timestamp: formatMinuteTimestamp(), author: 'Huang, Ian (SH/AQPP)' };
          setReviewRepliesByRow(previous => ({ ...previous, [viewer.rowId]: [...(previous[viewer.rowId] ?? []), reply] }));
        }}
      />)}
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-[#00338D] text-white px-4 py-2.5 rounded-md shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top KPMG Substantive Platform Header */}
      <div className="bg-[#00338D] text-white rounded-lg p-3.5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="bg-white text-[#00338D] font-extrabold text-xs px-2.5 py-1 rounded tracking-tight shadow-xs">
            KPMG
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-wide flex items-center space-x-2">
              <span>Substantive audit document management platform</span>
              <span className="text-xs text-blue-100 font-normal">实质性审计底稿管理平台</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs font-medium text-blue-100">
          <div className="flex items-center space-x-1 hover:text-white cursor-pointer bg-blue-900/60 px-2.5 py-1 rounded border border-blue-600/40">
            <span>Chinese Mainland</span>
            <ChevronRight className="w-3.5 h-3.5 rotate-90" />
          </div>
          <div className="flex items-center space-x-1.5 hover:text-white cursor-pointer">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Ian Huang</span>
          </div>
        </div>
      </div>

      {/* Project & Period Information Bar */}
      <div className="rounded-lg bg-blue-950 px-6 py-3 text-xs text-blue-100 shadow-2xs">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex h-8 items-center gap-2">
            <span className="font-semibold text-blue-200">项目代码:</span>
            <span className="font-extrabold tracking-wide text-white">1310956 - ABC Limited Co.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-blue-200">Entity:</span>
            <div className="relative">
              <select
                aria-label="Entity filter"
                value={selectedEntity}
                onChange={(event) => {
                  setSelectedEntity(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 min-w-48 appearance-none rounded-md border border-blue-700 bg-blue-900/70 py-0 pl-3 pr-9 font-semibold text-white outline-none transition-colors hover:border-blue-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">All (全部主体)</option>
                <option value="abc-limited-co">ABC LIMITED CO.</option>
                <option value="sapce-limited-co">SAPCE LIMITED CO.</option>
              </select>
              <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-blue-100" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-200" />
            <label htmlFor="accounting-period-filter" className="font-medium text-blue-200">会计期间:</label>
            <div className="relative">
              <select
                id="accounting-period-filter"
                value={selectedPeriod}
                onChange={(event) => {
                  setSelectedPeriod(event.target.value as AccountingPeriodFilter);
                  setCurrentPage(1);
                }}
                className="h-8 min-w-64 appearance-none rounded-md border border-blue-700 bg-blue-900/70 py-0 pl-3 pr-9 font-semibold text-white outline-none transition-colors hover:border-blue-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">全部会计期间</option>
                <option value="2026">2026年1月1日至2026年12月31日</option>
                <option value="2025">2025年1月1日至2025年12月31日</option>
              </select>
              <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-blue-100" />
            </div>
          </div>
        </div>
      </div>

      {/* Digital Dashboard (数字dashboard - Improvised as requested) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Metric 1: Total Procedures */}
        <button
          type="button"
          onClick={() => applySummaryFilter('all')}
          className={`order-1 relative overflow-hidden rounded-lg border bg-white p-3 text-left shadow-2xs transition-all hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-200 group ${
            summaryFilter === 'all' ? 'border-blue-400 ring-1 ring-blue-100' : 'border-slate-200'
          }`}
        >
          {summaryFilter === 'all' && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          )}
          <div className="relative">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">实质性程序总数</div>
            <div className="mt-0.5 text-xl font-extrabold text-slate-900">{stats.total}</div>
            <div className="text-[10px] font-normal text-slate-500">Procedures</div>
          </div>
        </button>

        {/* Metric 2: Uploaded Working Papers */}
        <button
          type="button"
          onClick={() => applySummaryFilter(summaryFilter === 'uploaded' ? 'unuploaded' : 'uploaded')}
          title={summaryFilter === 'uploaded' ? '再次点击筛选未上传任务' : '点击筛选已上传任务'}
          className={`order-2 relative overflow-hidden rounded-lg border bg-white p-3 text-left shadow-2xs transition-all hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-200 group ${
            summaryFilter === 'unuploaded'
              ? 'audit-metric-card--flip border-red-300 ring-1 ring-red-100'
              : summaryFilter === 'uploaded' ? 'border-blue-400 ring-1 ring-blue-100' : 'border-slate-200'
          }`}
        >
          {(summaryFilter === 'uploaded' || summaryFilter === 'unuploaded') && (
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 ${
              summaryFilter === 'unuploaded' ? 'bg-red-50' : 'bg-blue-50'
            }`}></div>
          )}
          <div className="relative">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">底稿上传率</div>
            <div className={`mt-0.5 text-xl font-extrabold ${summaryFilter === 'unuploaded' ? 'text-[#D95755]' : 'text-[#00338D]'}`}>
              {summaryFilter === 'unuploaded' ? stats.unuploadRate : stats.uploadRate}%
            </div>
            <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              {summaryFilter === 'unuploaded' ? (
                <>
                  <div className="h-full bg-[#D95755]" style={{ width: `${stats.unuploadRate}%` }} />
                  <div className="h-full flex-1 bg-gradient-to-r from-blue-500 to-[#00338D]" />
                </>
              ) : (
                <>
                  <div className="h-full bg-gradient-to-r from-blue-500 to-[#00338D]" style={{ width: `${stats.uploadRate}%` }} />
                  <div className="h-full flex-1 bg-[#D95755]" />
                </>
              )}
            </div>
            <div className={`mt-1.5 h-3 text-center text-[10px] font-semibold ${summaryFilter === 'unuploaded' ? 'text-[#D95755]' : 'text-blue-800'}`}>
              {summaryFilter === 'unuploaded' ? `未上传：${stats.unuploaded}/${stats.currentCount}` : `已上传：${stats.uploaded}/${stats.currentCount}`}
            </div>
          </div>
        </button>

        {/* Metric 3: Working Paper Review Pass Rate */}
        <button
          type="button"
          onClick={() => applySummaryFilter(summaryFilter === 'review-passed' ? 'review-failed' : 'review-passed')}
          title={summaryFilter === 'review-passed' ? '再次点击筛选未通过任务' : '点击筛选已通过任务'}
          className={`order-4 relative overflow-hidden rounded-lg border bg-white p-3 text-left shadow-2xs transition-all hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-200 group ${
            summaryFilter === 'review-failed'
              ? 'audit-metric-card--flip border-red-300 ring-1 ring-red-100'
              : summaryFilter === 'review-passed'
                ? 'border-blue-400 ring-1 ring-blue-100'
                : 'border-slate-200'
          }`}
        >
          {(summaryFilter === 'review-passed' || summaryFilter === 'review-failed') && (
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-110 ${
              summaryFilter === 'review-failed' ? 'bg-red-50' : 'bg-blue-50'
            }`}></div>
          )}
          <div className="relative">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">底稿复核通过率</div>
            <div className={`text-xl font-extrabold mt-0.5 ${summaryFilter === 'review-failed' ? 'text-[#D95755]' : 'text-[#00338D]'}`}>
              {summaryFilter === 'review-failed' ? stats.reviewFailRate : stats.reviewPassRate}%
            </div>
            <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100" aria-label={`已通过 ${stats.reviewPassed}，未通过 ${stats.reviewFailed}`}>
              {summaryFilter === 'review-failed' ? (
                <>
                  <div className="h-full bg-[#D95755]" style={{ width: `${stats.reviewFailRate}%` }} title={`未通过：${stats.reviewFailed}`} />
                  <div className="h-full flex-1 bg-gradient-to-r from-blue-500 to-[#00338D]" title={`已通过：${stats.reviewPassed}`} />
                </>
              ) : (
                <>
                  <div className="h-full bg-gradient-to-r from-blue-500 to-[#00338D]" style={{ width: `${stats.reviewPassRate}%` }} title={`已通过：${stats.reviewPassed}`} />
                  <div className="h-full flex-1 bg-[#D95755]" title={`未通过：${stats.reviewFailed}`} />
                </>
              )}
            </div>
            <div className="mt-1.5 grid h-3 w-full grid-cols-2 items-center text-[10px] font-semibold">
              {summaryFilter === 'review-failed' ? (
                <>
                  <div className="whitespace-nowrap border-r border-slate-300 px-1 text-center text-[#D95755]">未通过：{stats.reviewFailed}</div>
                  <div className="whitespace-nowrap px-1 text-center text-blue-800">已通过：{stats.reviewPassed}</div>
                </>
              ) : (
                <>
                  <div className="whitespace-nowrap border-r border-slate-300 px-1 text-center text-blue-800">已通过：{stats.reviewPassed}</div>
                  <div className="whitespace-nowrap px-1 text-center text-[#D95755]">未通过：{stats.reviewFailed}</div>
                </>
              )}
            </div>
          </div>
        </button>

        {/* Metric 4: Working Paper Precheck Rate */}
        <button
          type="button"
          onClick={() => applySummaryFilter(summaryFilter === 'precheck-passed' ? 'precheck-failed' : 'precheck-passed')}
          title={summaryFilter === 'precheck-passed' ? '再次点击筛选预检未通过任务' : '点击筛选预检已通过任务'}
          className={`order-3 relative overflow-hidden rounded-lg border bg-white p-3 text-left shadow-2xs transition-all hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-200 group ${
            summaryFilter === 'precheck-failed'
              ? 'audit-metric-card--flip border-red-300 ring-1 ring-red-100'
              : summaryFilter === 'precheck-passed'
                ? 'border-blue-400 ring-1 ring-blue-100'
                : 'border-slate-200'
          }`}
        >
          {(summaryFilter === 'precheck-passed' || summaryFilter === 'precheck-failed') && (
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-110 ${
              summaryFilter === 'precheck-failed' ? 'bg-red-50' : 'bg-blue-50'
            }`}></div>
          )}
          <div className="relative">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">底稿预检率</div>
            <div className={`text-xl font-extrabold mt-0.5 flex items-baseline space-x-1 ${summaryFilter === 'precheck-failed' ? 'text-[#D95755]' : 'text-[#00338D]'}`}>
              <span>{summaryFilter === 'precheck-failed' ? stats.precheckFailRate : stats.precheckPassRate}%</span>
              <span className="text-[10px] font-normal text-slate-500">Precheck</span>
            </div>
            <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              {summaryFilter === 'precheck-failed' ? (
                <>
                  <div className="h-full bg-[#D95755]" style={{ width: `${stats.precheckFailRate}%` }} />
                  <div className="h-full flex-1 bg-gradient-to-r from-blue-500 to-[#00338D]" />
                </>
              ) : (
                <>
                  <div className="h-full bg-gradient-to-r from-blue-500 to-[#00338D]" style={{ width: `${stats.precheckPassRate}%` }} />
                  <div className="h-full flex-1 bg-[#D95755]" />
                </>
              )}
            </div>
            <div className={`mt-1.5 text-[10px] font-medium flex items-center space-x-1 ${summaryFilter === 'precheck-failed' ? 'text-[#D95755]' : 'text-blue-800'}`}>
              <ShieldCheck className={`w-3 h-3 ${summaryFilter === 'precheck-failed' ? 'text-[#D95755]' : 'text-blue-600'}`} />
              <span>{summaryFilter === 'precheck-failed' ? `未通过：${stats.precheckFailed}` : `已通过：${stats.precheckPassed}`}</span>
            </div>
          </div>
        </button>

        {/* Metric 5: Materiality Threshold Card (Matching table header light blue) */}
        <div className="order-5 bg-[#eef4ff] border border-blue-200 rounded-xl p-3 shadow-2xs flex flex-col justify-between">
          <div>
            <div>
              <div className="text-[10px] font-extrabold text-[#00338D] uppercase tracking-wider">重要性水平</div>
              <div className="mt-0.5 text-lg font-extrabold text-[#00338D]">CNY 12,600,000</div>
            </div>
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-2 border-t border-blue-200/80 pt-1.5 text-[9px]">
            <div>
              <div className="font-semibold text-blue-700">实际执行重要性水平</div>
              <div className="text-[11px] font-black text-[#00338D]">CNY 9,450,000</div>
            </div>
            <div>
              <div className="font-semibold text-blue-700">微小错报</div>
              <div className="text-[11px] font-black text-[#00338D]">CNY 630,000</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout (collapsible BUSINESS PROCESS selector + table) */}
      <div className="@container grid grid-cols-[28px_minmax(0,1fr)] items-start gap-4 transition-[grid-template-columns] duration-300 ease-out has-[aside:hover]:grid-cols-[calc((100%-1rem)/6)_minmax(0,1fr)] has-[aside:focus-within]:grid-cols-[calc((100%-1rem)/6)_minmax(0,1fr)] motion-reduce:transition-none">
        {/* Left BUSINESS PROCESS Panel (业务流程类仿) */}
        <aside className="group/bp relative min-w-0 overflow-visible">
          <button
            type="button"
            aria-label="展开业务流程选择"
            title="业务流程选择"
            className="absolute left-0 top-0 flex h-[30%] w-7 items-center justify-center rounded-r-2xl border border-l-0 border-blue-100 bg-blue-800 text-[11px] font-bold tracking-[0.18em] text-white shadow-md transition-opacity group-hover/bp:opacity-0 group-focus-within/bp:opacity-0"
            style={{ writingMode: 'vertical-rl' }}
          >
            业务流程
          </button>
          <div className="invisible w-[calc((100cqw-1rem)/6)] space-y-3 rounded-xl border border-slate-200 bg-white p-3 opacity-0 shadow-xs transition-opacity duration-200 group-hover/bp:visible group-hover/bp:opacity-100 group-focus-within/bp:visible group-focus-within/bp:opacity-100 motion-reduce:transition-none">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold text-[#00338D]">业务流程选择</h3>
          </div>

          {/* Process Filter List */}
          <div className="space-y-1.5 max-h-[720px] overflow-y-auto pr-0.5">
            {/* All Processes */}
            <div
              onClick={() => setSelectedBpFilter('all')}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                selectedBpFilter === 'all'
                  ? 'bg-blue-50/90 border-l-4 border-l-[#00338D] border-blue-300 shadow-2xs font-bold text-[#00338D]'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-800'
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs font-bold">全部流程</div>
                <div className="text-[10px] text-slate-400 mt-0.5">共 14 项程序</div>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold shrink-0 ${
                selectedBpFilter === 'all' ? 'bg-[#00338D] text-white shadow-2xs' : 'bg-slate-100 text-slate-700'
              }`}>
                {entityRows.length}
              </span>
            </div>

            {/* Business Process Items - Elongated vertical padding and gaps */}
            {[
              { id: 'bp-sales', name: '销售' },
              { id: 'bp-pur', name: '采购' },
              { id: 'bp-inv', name: '存货' },
              { id: 'bp-fa', name: '固定资产与在建工程' },
              { id: 'bp-tax', name: '税项' },
              { id: 'bp-hr', name: '人力资源' },
              { id: 'bp-fin', name: '资金与融资' }
            ].map(bp => {
              const isSelected = selectedBpFilter === bp.name;
              const processRows = entityRows.filter(row => row.businessProcess.includes(bp.name));
              const passedCount = processRows.filter(row => row.inspectionStatus === 'passed').length;
              const progressPct = processRows.length > 0
                ? Math.round((passedCount / processRows.length) * 100)
                : 0;
              return (
                <div
                  key={bp.id}
                  onClick={() => setSelectedBpFilter(bp.name)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/90 border-l-4 border-l-[#00338D] border-blue-300 shadow-2xs font-bold text-[#00338D]'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold leading-snug">{bp.name}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className={`text-[9px] font-bold ${isSelected ? 'text-blue-700' : 'text-slate-500'}`}>
                        {progressPct}%
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                        isSelected ? 'bg-[#00338D] text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {processRows.length}
                      </span>
                    </div>
                  </div>
                  <div
                    className="mt-2 h-1 w-[80%] overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-label={`${bp.name}质检通过进度，${passedCount}/${processRows.length}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progressPct}
                    title={`质检通过 ${passedCount}/${processRows.length}`}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 via-blue-600 to-[#00338D] transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </aside>

        {/* Right KPMG Table Content Panel */}
        <div className="min-w-0 w-full bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-3.5">
          {/* Streamlined, Card-ified Top Toolbar */}
          <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            {/* Search and Status Filter Group */}
            <div className="flex items-center flex-1 min-w-[280px] space-x-2">
              <div className="relative w-full max-w-[360px] flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索 RMM ID、程序编号、科目描述..."
                  className="w-full pl-9 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#00338D] placeholder:text-slate-400 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              <select
                value={inspectionFilter}
                onChange={(e) => {
                  setInspectionFilter(e.target.value);
                  setSummaryFilter('all');
                }}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:outline-none shrink-0"
              >
                <option value="all">所有状态 (All)</option>
                <option value="passed">已通过 (Passed)</option>
                <option value="failed">未通过 (Failed)</option>
                <option value="unuploaded">未上传 (Unuploaded)</option>
              </select>

              <label className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700">
                <span>金额单位</span>
                <select
                  aria-label="总体金额单位"
                  value={amountUnit}
                  onChange={(event) => setAmountUnit(event.target.value as AmountUnit)}
                  className="bg-transparent font-bold text-[#00338D] outline-none"
                >
                  <option value="yuan">元</option>
                  <option value="million">百万元</option>
                </select>
              </label>

              <button
                type="button"
                onClick={() => setShowIdentifierColumns(previous => !previous)}
                aria-pressed={showIdentifierColumns}
                title={showIdentifierColumns ? '隐藏 RM ID、程序ID、分配至、上传人和复核人' : '显示 RM ID、程序ID、分配至、上传人和复核人'}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors focus:outline-none focus:ring-1 focus:ring-[#00338D] ${
                  showIdentifierColumns
                    ? 'border-blue-300 bg-blue-50 text-[#00338D]'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:text-[#00338D]'
                }`}
              >
                <Columns3 className="h-3.5 w-3.5" />
                <span>显示隐藏列</span>
              </button>
            </div>

            {/* Concentrated Action Group */}
            <div className="flex items-center space-x-2 shrink-0">
              {/* Segmented Secondary Toolbar Buttons */}
              <div className="inline-flex items-center p-0.5 bg-white border border-slate-300 rounded-lg shadow-2xs">
                <div className="group/refresh relative">
                  <button
                    type="button"
                    className="flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-blue-50/80 hover:text-[#00338D]"
                    title="选择刷新范围"
                    aria-haspopup="menu"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">刷新</span>
                  </button>
                  <div className="pointer-events-none invisible absolute left-0 top-full z-40 pt-1 opacity-0 transition-all group-hover/refresh:pointer-events-auto group-hover/refresh:visible group-hover/refresh:opacity-100 group-focus-within/refresh:pointer-events-auto group-focus-within/refresh:visible group-focus-within/refresh:opacity-100">
                    <div className="inline-flex items-center rounded-md border border-slate-200 bg-white p-1 shadow-lg" role="menu">
                      <button type="button" role="menuitem" onClick={handleRefreshPrograms} className="rounded px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-blue-50 hover:text-[#00338D]">程序</button>
                      <span className="text-slate-300" aria-hidden="true">|</span>
                      <button type="button" role="menuitem" onClick={handleRefreshSamples} className="rounded px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-blue-50 hover:text-[#00338D]">样本</button>
                    </div>
                  </div>
                </div>
                <div className="w-[1px] h-4 bg-slate-200 my-auto"></div>
                <button
                  type="button"
                  onClick={handleBatchSystemScan}
                  className="flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-blue-50/80 hover:text-[#00338D]"
                  title="批量预检当前清单"
                >
                  <Cpu className="h-3.5 w-3.5" />
                  <span>批量预检</span>
                </button>
                <div className="w-[1px] h-4 bg-slate-200 my-auto"></div>
                <button
                  type="button"
                  onClick={() => {
                    setExpandedAssignmentProcesses({});
                    setDraftWorkAssignments(workAssignments);
                    setIsWorkAssignmentModalOpen(true);
                  }}
                  className="flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-blue-50/80 hover:text-[#00338D]"
                  title="工作分配"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>工作分配</span>
                </button>
                <div className="w-[1px] h-4 bg-slate-200 my-auto"></div>
                <button
                  onClick={handleSyncToKCW}
                  disabled={isSyncing}
                  className="flex items-center space-x-1.5 px-2.5 py-1 text-[#00338D] hover:bg-blue-50/80 rounded-md text-xs font-bold transition-colors"
                  title="同步附件至KCW"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>同步 KCW</span>
                </button>
                <div className="w-[1px] h-4 bg-slate-200 my-auto"></div>
                <button
                  onClick={handleExportRows}
                  className="flex items-center space-x-1.5 px-2.5 py-1 text-slate-700 hover:text-[#00338D] hover:bg-blue-50/80 rounded-md text-xs font-semibold transition-colors"
                  title="导出当前筛选结果"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>导出清单</span>
                </button>
                <div className="my-auto h-4 w-px bg-slate-200"></div>
                <button
                  type="button"
                  onClick={handleExportReviewRecords}
                  className="flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-blue-50/80 hover:text-[#00338D]"
                  title="导出当前筛选范围内的复核详细记录"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>复核记录</span>
                </button>
              </div>

            </div>
          </div>

          {/* Substantive Audit Documents Table - Soft Light Blue Header */}
          <div className="w-full overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
            <table
              className="audit-procedure-table text-left border-collapse"
              style={{ width: '100%', minWidth: `${tableMinWidth}px` }}
            >
              <colgroup>
                {tableColumnWidths.map((width, index) => (
                  <col key={`${showIdentifierColumns ? 'expanded' : 'collapsed'}-${index}`} style={{ width: `${width}px` }} />
                ))}
              </colgroup>
              <thead>
                <tr className="bg-[#F1F6FD] text-center text-[#00338D] font-extrabold text-[11px] leading-tight border-b-2 border-blue-200">
                  <th className="border-r border-blue-200/80">业务流程</th>
                  <th className="border-r border-blue-200/80">账户/披露</th>
                  {showIdentifierColumns && <th className="text-center border-r border-blue-200/80">RM ID</th>}
                  {showIdentifierColumns && <th className="text-center border-r border-blue-200/80">程序ID</th>}
                  <th className="border-r border-blue-200/80">实质性程序描述</th>
                  <th className="text-center border-r border-blue-200/80">类型</th>
                  <th className="text-center border-r border-blue-200/80">抽样方式</th>
                  <th className="text-center border-r border-blue-200/80">样本信息</th>
                  <th className="text-center border-r border-blue-200/80">固有风险</th>
                  <th className="text-center border-r border-blue-200/80">依赖控制测试</th>
                  <th className="text-center border-r border-blue-200/80">总体金额（{amountUnit === 'million' ? '百万元' : '元'}）</th>
                  <th className="text-center border-r border-blue-200/80">抽样详情</th>
                  <th className="text-center border-r border-blue-200/80">抽样进度</th>
                  <th className="text-center border-r border-blue-200/80">底稿模板</th>
                  <th className="text-center border-r border-blue-200/80">工作底稿</th>
                  <th className="whitespace-nowrap text-center border-r border-blue-200/80">底稿复核状态</th>
                  {showIdentifierColumns && <th className="text-center border-r border-blue-200/80">分配至</th>}
                  {showIdentifierColumns && <th className="text-center border-r border-blue-200/80">上传人</th>}
                  {showIdentifierColumns && <th className="text-center border-r border-blue-200/80">复核人</th>}
                  <th className="text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 bg-white">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={showIdentifierColumns ? 20 : 15} className="py-8 text-center text-slate-400 font-medium">
                      没有找到符合条件的实质性程序底稿条目
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-blue-50/40 transition-colors">
                      {/* 业务流程 */}
                      <td className="py-2.5 px-2.5 font-medium border-r border-slate-200 leading-snug">
                        {row.businessProcess}
                      </td>

                      {/* 账户/披露 */}
                      <td className="py-2.5 px-2.5 border-r border-slate-200">
                        <div className="font-semibold text-slate-900 leading-snug">{row.accountDisclosure}</div>
                      </td>

                      {showIdentifierColumns && (
                        <td className="py-2.5 px-2 text-center font-mono font-medium text-slate-700 border-r border-slate-200">
                          {row.rmmId}
                        </td>
                      )}

                      {showIdentifierColumns && (
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-[#00338D] border-r border-slate-200">
                          {row.procedureId}
                        </td>
                      )}

                      {/* 实质性程序描述 */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-800 leading-normal font-normal">
                        {row.procedureDesc}
                      </td>

                      {/* 实质性程序类型 */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-200">
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-normal ${
                          row.procedureType === 'TOD' ? 'bg-blue-100 text-[#00338D]' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {row.procedureType}
                        </span>
                      </td>

                      {/* 抽样方式 */}
                      <td className="border-r border-slate-200 px-1.5 py-2.5 text-center">
                        <span className="sampling-method-value rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-[#00338D]">
                          {getSamplingMethod(row)}
                        </span>
                      </td>

                      {/* 样本信息 */}
                      <td className="py-2.5 px-2 text-center text-slate-600 border-r border-slate-200 font-medium text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            setSampleModalMode('information');
                            setSampleModalRow(row);
                          }}
                          className="mx-auto inline-flex items-center gap-1 font-semibold text-[#00338D] hover:underline"
                          title="查看样本信息"
                        >
                          <span>sample</span>
                          <Link2 className="h-3 w-3" />
                        </button>
                      </td>

                      {/* 固有风险 */}
                      <td className="border-r border-slate-200 px-1.5 py-2.5 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          getInherentRisk(row) === '特别'
                            ? 'bg-red-50 text-red-700'
                            : getInherentRisk(row) === '升高'
                              ? 'bg-amber-50 text-amber-700'
                              : getInherentRisk(row) === '初级'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-transparent text-slate-400'
                        }`}>
                          {getInherentRisk(row)}
                        </span>
                      </td>

                      {/* 依赖控制测试 */}
                      <td className="border-r border-slate-200 px-1.5 py-2.5 text-center text-[9px] font-semibold text-slate-600">
                        {getControlTestResult(row)}
                      </td>

                      {/* 总体金额 */}
                      <td className="population-amount-cell whitespace-nowrap border-r border-slate-200 px-2 py-2.5 font-mono text-[9px] font-semibold tabular-nums text-slate-700">
                        <div className="flex h-full w-full items-center justify-end text-right">
                          {getDisplayPopulationAmount(row, amountUnit)}
                        </div>
                      </td>

                      {/* 抽样详情 */}
                      <td className="border-r border-slate-200 px-1.5 py-2.5 text-center text-[9px]">
                        <button
                          type="button"
                          onClick={() => {
                            setSampleModalMode('details');
                            setSampleModalRow(row);
                          }}
                          className="font-semibold text-[#00338D] hover:underline"
                          title="查看抽样详情"
                        >
                          查看
                        </button>
                      </td>

                      {/* 抽样进度 */}
                      <td className="whitespace-nowrap border-r border-slate-200 px-1.5 py-2.5 text-center text-[9px] font-semibold text-slate-600">
                        {getSamplingProgress(row).numerator}/{getSamplingProgress(row).denominator}
                      </td>

                      {/* 底稿模板 */}
                      <td className="border-r border-slate-200 px-2 py-2.5 text-center text-[10px] font-medium text-slate-600">
                        <button
                          type="button"
                          onClick={openBlankWorkspace}
                          className="mx-auto inline-flex items-center gap-1 whitespace-nowrap font-semibold text-[#00338D] hover:underline"
                          title="查看底稿模板"
                        >
                          <span>Wp temp</span>
                          <Link2 className="h-3 w-3" />
                        </button>
                      </td>

                      {/* 工作底稿文件 */}
                      <td className="border-r border-slate-200 px-2 py-2">
                        <div className="flex flex-nowrap items-start justify-start gap-1.5">
                          {(uploadedFilesByRow[row.id] ?? []).map(file => (
                            <button
                              key={file.id}
                              type="button"
                              onClick={() => {
                                setWorkingPaperFileDetail({ row, file });
                                setReviewReplyText('');
                                setSelectedReplyOpinionId(null);
                              }}
                              className={`flex h-[51px] w-[48px] min-w-0 shrink-0 flex-col items-center justify-center rounded border px-1 py-1.5 text-center transition-colors hover:bg-blue-50 ${
                                file.source
                                  ? 'border-blue-200 bg-blue-50/40 text-[#00338D]'
                                  : 'border-slate-200 bg-white text-slate-700'
                              }`}
                              title={`${file.name}${file.source ? '（本地上传）' : '（模拟文件）'}`}
                            >
                              <WorkingPaperFileIcon fileName={file.name} className="h-4 w-4 shrink-0" />
                              <span className="mt-1 block w-full truncate text-[8px] font-semibold leading-3">{file.name}</span>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setUploadModalRow(row)}
                            className="flex h-[51px] w-[48px] shrink-0 flex-col items-center justify-center rounded border border-dashed border-blue-300 bg-blue-50/20 text-[#00338D] transition-colors hover:border-[#00338D] hover:bg-blue-50"
                            title="上传工作底稿文件"
                            aria-label={`为 ${row.procedureId} 上传工作底稿文件`}
                          >
                            <Upload className="h-4 w-4" />
                            <span className="mt-1 text-[8px] font-semibold">上传</span>
                          </button>
                        </div>
                      </td>

                      {/* 复核状态 */}
                      <td className="border-r border-slate-200 text-center">
                        <button
                          type="button"
                          disabled={getReviewColumnState(row) === 'pending' && !(commentsByRow[row.id]?.length)}
                          onClick={() => {
                            setReviewCommentModalRow(row);
                            setReviewReplyText('');
                            const opinions = getReviewOpinions(row);
                            setSelectedReplyOpinionId(opinions.at(-1)?.id ?? null);
                          }}
                          aria-label={
                            getReviewColumnState(row) === 'complete'
                              ? '已复核，点击查看复核意见历史'
                              : getReviewColumnState(row) === 'comment' ? '存在复核意见，点击查看' : '待复核'
                          }
                          title={
                            getReviewColumnState(row) === 'complete'
                              ? '复核完成，点击查看复核意见历史'
                              : getReviewColumnState(row) === 'comment' ? '有复核意见，点击查看' : '待复核'
                          }
                          className={`mx-auto flex h-5 w-5 items-center justify-center rounded-full ${
                            getReviewColumnState(row) === 'complete'
                              ? 'cursor-pointer bg-[#DCE9C8] text-[#5F833A] transition-colors hover:bg-[#C9DDAA]'
                              : getReviewColumnState(row) === 'comment'
                                ? 'cursor-pointer bg-[#FAEAEA] text-[#D95755] transition-colors hover:bg-[#F6DADA]'
                                : 'cursor-default bg-slate-100 text-slate-500'
                          }`}
                        >
                          {getReviewColumnState(row) === 'complete'
                            ? <Check className="h-3 w-3 stroke-[3]" />
                            : getReviewColumnState(row) === 'comment'
                              ? <span className="text-[13px] font-black leading-none">!</span>
                              : <Minus className="h-3 w-3 stroke-[2.5]" />}
                        </button>
                      </td>

                      {/* 分配至 */}
                      {showIdentifierColumns && (
                        <td className="border-r border-slate-200 text-center">
                          <ExpandablePeopleCell
                            people={
                              workAssignments[`${row.businessProcess}::${row.accountDisclosure}`]
                                ? [workAssignments[`${row.businessProcess}::${row.accountDisclosure}`]]
                                : getAssignedPeople(row)
                            }
                          />
                        </td>
                      )}

                      {/* 上传人 */}
                      {showIdentifierColumns && <td className="border-r border-slate-200 text-center">
                        {row.isKcwTemplateUsed === 'No' ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <div className="audit-person-name text-slate-600" title={row.isUploaded ? row.uploadedBy : '未上传'}>
                            {row.isUploaded ? row.uploadedBy : '—'}
                          </div>
                        )}
                      </td>}

                      {/* 复核人 */}
                      {showIdentifierColumns && <td className="border-r border-slate-200 text-center">
                        {row.isKcwTemplateUsed !== 'Yes' ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          row.isUploaded
                            ? <ExpandablePeopleCell people={getReviewerPeople(row)} />
                            : <span className="text-slate-400">—</span>
                        )}
                      </td>}

                      {/* 操作 */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => openReviewModal(row)}
                          className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF2FB] text-[#5F833A] transition-colors hover:bg-[#DCEAF8] focus:outline-none focus:ring-2 focus:ring-[#7FA653]/30"
                          title="复核"
                          aria-label={`复核 ${row.procedureId}`}
                        >
                          <ShieldCheck className="h-2.5 w-2.5 stroke-[2.5]" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination Bar (Matching Screenshot Pagination) */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
            <div>
              显示第 <span className="font-bold text-slate-800">1</span> 至 <span className="font-bold text-slate-800">{filteredRows.length}</span> 条，共 <span className="font-bold text-slate-800">{entityRows.length}</span> 条实质性程序记录
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <span>每页</span>
                <select className="px-1.5 py-0.5 border border-slate-300 rounded bg-white text-slate-700 font-bold focus:outline-none">
                  <option value="15">15 条 ▾</option>
                  <option value="30">30 条 ▾</option>
                  <option value="50">50 条 ▾</option>
                </select>
              </div>
              <div className="flex items-center space-x-1 text-slate-600 font-bold">
                <span>1/11</span>
                <button className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button className="p-1 border border-slate-200 rounded hover:bg-slate-100">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS & DRAWERS --- */}

      {/* Work Assignment Modal */}
      {isWorkAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="work-assignment-title"
            className="flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 id="work-assignment-title" className="text-base font-extrabold text-slate-900">确认工作分配</h3>
                <p className="mt-1 text-[10px] text-slate-500">展开业务流程，为账户/披露选择负责人员</p>
              </div>
              <button
                type="button"
                onClick={() => setIsWorkAssignmentModalOpen(false)}
                className="text-slate-500 transition-colors hover:text-slate-800"
                aria-label="关闭工作分配"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="overflow-hidden rounded-lg border border-blue-200">
                <table className="w-full table-fixed border-collapse text-left text-xs">
                  <colgroup>
                    <col style={{ width: '58%' }} />
                    <col style={{ width: '42%' }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-[#F1F6FD] text-[#00338D]">
                      <th className="border-r border-blue-200 px-4 py-3 text-center font-extrabold">业务流程 / 账户披露</th>
                      <th className="px-4 py-3 text-center font-extrabold">分配至</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {workAssignmentGroups.map(group => {
                      const assignmentValues = group.accounts.map(({ accountDisclosure, representativeRow }) =>
                        getWorkAssignmentValue(group.businessProcess, accountDisclosure, representativeRow, draftWorkAssignments)
                      );
                      const commonAssignment = assignmentValues.every(value => value === assignmentValues[0])
                        ? assignmentValues[0]
                        : '';
                      const isExpanded = Boolean(expandedAssignmentProcesses[group.businessProcess]);

                      return (
                        <React.Fragment key={group.businessProcess}>
                          <tr className="bg-slate-50/80">
                            <td className="border-r border-slate-200 px-4 py-2.5">
                              <button
                                type="button"
                                onClick={() => setExpandedAssignmentProcesses(previous => ({
                                  ...previous,
                                  [group.businessProcess]: !previous[group.businessProcess]
                                }))}
                                className="flex w-full items-center gap-2 text-left font-bold text-slate-800 hover:text-[#00338D]"
                                aria-expanded={isExpanded}
                              >
                                <ChevronRight className={`h-4 w-4 shrink-0 text-[#00338D] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                <span>{group.businessProcess}</span>
                                <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-[#00338D]">
                                  {group.accounts.length}
                                </span>
                              </button>
                            </td>
                            <td className="px-4 py-2.5">
                              <select
                                value={commonAssignment}
                                onChange={event => assignEntireProcess(group.businessProcess, event.target.value)}
                                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-[#00338D] focus:ring-2 focus:ring-blue-100"
                                aria-label={`为${group.businessProcess}统一分配人员`}
                              >
                                <option value="" disabled>分别分配</option>
                                {assigneePool.map(person => <option key={person} value={person}>{person}</option>)}
                              </select>
                            </td>
                          </tr>
                          {isExpanded && group.accounts.map(({ accountDisclosure, representativeRow }) => (
                            <tr key={`${group.businessProcess}-${accountDisclosure}`} className="hover:bg-blue-50/30">
                              <td className="border-r border-slate-200 py-2 pl-11 pr-4 text-slate-600">
                                {accountDisclosure}
                              </td>
                              <td className="px-4 py-2">
                                <select
                                  value={getWorkAssignmentValue(group.businessProcess, accountDisclosure, representativeRow, draftWorkAssignments)}
                                  onChange={event => setDraftWorkAssignments(previous => ({
                                    ...previous,
                                    [`${group.businessProcess}::${accountDisclosure}`]: event.target.value
                                  }))}
                                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00338D] focus:ring-2 focus:ring-blue-100"
                                  aria-label={`为${accountDisclosure}分配人员`}
                                >
                                  {assigneePool.map(person => <option key={person} value={person}>{person}</option>)}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
              <button
                type="button"
                onClick={() => setIsWorkAssignmentModalOpen(false)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  setWorkAssignments(draftWorkAssignments);
                  setIsWorkAssignmentModalOpen(false);
                  showNotification('工作分配已确认并同步至任务列表');
                }}
                className="rounded-md bg-[#00338D] px-4 py-2 text-xs font-bold text-white hover:bg-blue-900"
              >
                确认工作分配
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sample Information Modal */}
      {sampleModalRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sample-information-title"
            className={`w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
              sampleModalMode === 'details' && ['MUS', 'KSP'].includes(getSamplingMethod(sampleModalRow)) ? 'max-w-4xl' : 'max-w-lg'
            }`}
          >
            <div className="flex items-center justify-between bg-[#00338D] px-4 py-3 text-white">
              <div>
                <h3 id="sample-information-title" className="text-sm font-bold">
                  {sampleModalMode === 'details' ? '抽样详情' : '样本信息'}
                </h3>
                <p className="mt-0.5 text-[10px] text-blue-200">{sampleModalRow.procedureId} · {sampleModalRow.accountDisclosure}</p>
              </div>
              <button
                type="button"
                onClick={() => setSampleModalRow(null)}
                className="text-blue-200 transition-colors hover:text-white"
                aria-label={sampleModalMode === 'details' ? '关闭抽样详情' : '关闭样本信息'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[72vh] space-y-3 overflow-y-auto p-5">
              <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2.5 text-xs">
                <span className="font-semibold text-slate-500">抽样方式</span>
                <span className="rounded bg-white px-2 py-1 font-bold text-[#00338D] shadow-2xs">
                  {getSamplingMethod(sampleModalRow)}
                </span>
              </div>
              {sampleModalMode === 'details' && ['MUS', 'KSP'].includes(getSamplingMethod(sampleModalRow)) ? (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="grid grid-cols-[minmax(0,1fr)_180px] bg-[#00338D] px-3 py-2 text-xs font-bold text-white">
                    <span>程序名称</span>
                    <span className="text-right">初步</span>
                  </div>
                  {(getSamplingMethod(sampleModalRow) === 'MUS'
                    ? getMusSamplingDetailGroups(sampleModalRow)
                    : getKspSamplingDetailGroups(sampleModalRow)
                  ).map(group => (
                    <section key={group.title}>
                      <h4 className="border-y border-slate-300 bg-slate-300 px-3 py-1.5 text-[11px] font-extrabold text-slate-900">
                        {group.title}
                      </h4>
                      <dl className="divide-y divide-slate-200">
                        {group.items.map(([label, value], index) => (
                          <div
                            key={label}
                            className={`grid grid-cols-[minmax(0,1fr)_180px] items-center gap-3 px-3 py-1.5 text-[11px] ${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
                          >
                            <dt className="font-medium text-slate-700">{label}</dt>
                            <dd className="text-right font-mono font-semibold text-slate-900">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  ))}
                </div>
              ) : (
                <>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                可上传样本清单或工作底稿，也可以使用 Sample Engine 或 Data Mining 获取样本。
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={openBlankWorkspace}
                  className="group flex min-h-28 flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/30 p-4 text-center transition-colors hover:border-[#00338D] hover:bg-blue-50"
                >
                  <Upload className="h-6 w-6 text-[#00338D]" />
                  <span className="mt-2 text-xs font-bold text-[#00338D]">导入底稿</span>
                  <span className="mt-1 text-[10px] text-slate-500">上传样本清单 / 工作底稿</span>
                </button>
                <button
                  type="button"
                  onClick={openBlankWorkspace}
                  className="group flex min-h-28 flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/30 p-4 text-center transition-colors hover:border-[#00338D] hover:bg-blue-50"
                >
                  <Cpu className="h-6 w-6 text-[#00338D]" />
                  <span className="mt-2 text-xs font-bold text-[#00338D]">使用 Sample Engine 计算样本</span>
                  <span className="mt-1 text-[10px] text-slate-500">进入样本计算工作区</span>
                </button>
                <button
                  type="button"
                  onClick={() => showNotification('正在从 KCW 挖掘样本信息')}
                  className="group flex min-h-28 flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/30 p-4 text-center transition-colors hover:border-[#00338D] hover:bg-blue-50"
                >
                  <ExcavatorIcon className="h-7 w-7 text-[#00338D]" />
                  <span className="mt-2 text-xs font-bold text-[#00338D]">使用 Data Mining 从 KCW 中挖掘样本信息</span>
                  <span className="mt-1 text-[10px] text-slate-500">从 KCW 底稿数据中识别样本</span>
                </button>
              </div>
                </>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-4 py-3">
              <button
                type="button"
                onClick={() => setSampleModalRow(null)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Scan Exception Modal */}
      {scanExceptionModalRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="scan-exception-title"
            className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between bg-[#00338D] px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <TriangleAlert className="h-5 w-5 text-red-300" />
                <div>
                  <h3 id="scan-exception-title" className="text-sm font-bold">系统预检异常</h3>
                  <p className="mt-0.5 text-[10px] text-blue-200">{scanExceptionModalRow.procedureId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScanExceptionModalRow(null)}
                className="text-blue-200 transition-colors hover:text-white"
                aria-label="关闭系统预检异常"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 p-4 text-xs">
              <div className="rounded-lg border border-red-200 bg-red-50/70 p-3">
                <div className="font-bold text-[#D95755]">预检结果：未通过</div>
                <div className="mt-2 space-y-1.5 text-slate-700">
                  {getSystemPrecheckAnomalies(scanExceptionModalRow).map(anomaly => (
                    <div key={anomaly} className="flex items-start gap-1.5 leading-5">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#D95755]" />
                      <span>{anomaly}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div>
                  <div className="text-[10px] font-semibold text-slate-500">业务流程</div>
                  <div className="mt-1 font-bold text-slate-800">{scanExceptionModalRow.businessProcess}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-500">账户/披露</div>
                  <div className="mt-1 font-bold text-slate-800">{scanExceptionModalRow.accountDisclosure}</div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
              <button
                type="button"
                onClick={() => setScanExceptionModalRow(null)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                关闭
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetailModalRow(scanExceptionModalRow);
                  setScanExceptionModalRow(null);
                }}
                className="rounded-lg bg-[#00338D] px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-900"
              >
                查看底稿详情
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Comment Modal */}
      {reviewCommentModalRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-comment-title"
            className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between bg-[#00338D] px-4 py-3 text-white">
              <div>
                <h3 id="review-comment-title" className="text-sm font-bold">复核意见及回复</h3>
                <p className="mt-0.5 text-[10px] text-blue-200">
                  {reviewCommentModalRow.procedureId} · {reviewCommentModalRow.accountDisclosure}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReviewCommentModalRow(null);
                  setReviewReplyText('');
                  setSelectedReplyOpinionId(null);
                }}
                className="text-blue-200 transition-colors hover:text-white"
                aria-label="关闭复核意见及回复"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <div className={`rounded-lg border p-3 ${
                getReviewColumnState(reviewCommentModalRow) === 'complete'
                  ? 'border-green-200 bg-green-50/60'
                  : 'border-red-200 bg-red-50/70'
              }`}>
                <div className={`flex items-center gap-2 text-[11px] font-bold ${
                  getReviewColumnState(reviewCommentModalRow) === 'complete'
                    ? 'text-[#5F833A]'
                    : 'text-[#D95755]'
                }`}>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    getReviewColumnState(reviewCommentModalRow) === 'complete'
                      ? 'bg-[#DCE9C8] text-[#5F833A]'
                      : 'bg-[#FAEAEA] text-[13px] font-black text-[#D95755]'
                  }`}>
                    {getReviewColumnState(reviewCommentModalRow) === 'complete'
                      ? <Check className="h-3 w-3 stroke-[3]" />
                      : '!'}
                  </span>
                  <span>{getReviewColumnState(reviewCommentModalRow) === 'complete' ? '过往复核意见' : '复核人意见'}</span>
                </div>
                <div className="mt-2">
                  <ReviewThreadList
                    opinions={getReviewOpinions(reviewCommentModalRow)}
                    replies={reviewRepliesByRow[reviewCommentModalRow.id] ?? []}
                    emptyText="该工作底稿已通过复核，暂无过往复核意见。"
                    selectedOpinionId={getReviewColumnState(reviewCommentModalRow) !== 'complete' ? selectedReplyOpinionId : null}
                    onSelectOpinion={getReviewColumnState(reviewCommentModalRow) !== 'complete'
                      ? setSelectedReplyOpinionId
                      : undefined}
                  />
                </div>
                <div className="mt-2 text-[10px] text-slate-500">
                  {reviewCommentModalRow.reviewedBy ?? 'Lu, Lois (HZ/CP1)'}
                </div>
              </div>

              {getReviewColumnState(reviewCommentModalRow) !== 'complete' && (
                <div className="space-y-2">
                  <label htmlFor="review-comment-reply" className="block text-xs font-bold text-slate-700">
                    回复内容
                    {getReviewOpinions(reviewCommentModalRow).length > 1 && selectedReplyOpinionId && (
                      <span className="ml-1 font-normal text-slate-400">
                        · 复核意见 {getReviewOpinions(reviewCommentModalRow).findIndex(opinion => opinion.id === selectedReplyOpinionId) + 1}
                      </span>
                    )}
                  </label>
                  <textarea
                    id="review-comment-reply"
                    value={reviewReplyText}
                    onChange={event => setReviewReplyText(event.target.value)}
                    rows={3}
                    placeholder="请输入回复内容..."
                    className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#00338D] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
              <button
                type="button"
                onClick={() => handleDownloadWorkingPaperTemplate(reviewCommentModalRow)}
                className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-[#00338D] transition-colors hover:bg-blue-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>下载当前底稿</span>
              </button>
              {getReviewColumnState(reviewCommentModalRow) !== 'complete' && (
                <button
                  type="button"
                  disabled={!reviewReplyText.trim()}
                  onClick={handleSubmitReviewReply}
                  className="rounded-lg bg-[#00338D] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  保存回复
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Working Paper Exception Reason Modal */}
      {workpaperReasonModalRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="workpaper-reason-title"
            className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between bg-[#00338D] p-4 text-white">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-200" />
                <h3 id="workpaper-reason-title" className="text-sm font-bold">记录未使用工作底稿原因</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWorkpaperReasonModalRow(null);
                  setWorkpaperReason('');
                }}
                className="text-blue-200 transition-colors hover:text-white"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 p-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                {workpaperReasonModalRow.procedureId} · {workpaperReasonModalRow.accountDisclosure}
              </div>
              <div>
                <label htmlFor="workpaper-reason" className="mb-1.5 block text-xs font-bold text-slate-700">
                  未使用工作底稿原因 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="workpaper-reason"
                  rows={4}
                  autoFocus
                  value={workpaperReason}
                  onChange={event => setWorkpaperReason(event.target.value)}
                  placeholder="请输入未使用工作底稿的原因..."
                  className="w-full resize-none rounded-lg border border-slate-300 p-2.5 text-xs text-slate-700 outline-none focus:border-[#00338D] focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-3">
              <button
                type="button"
                onClick={() => {
                  setWorkpaperReasonModalRow(null);
                  setWorkpaperReason('');
                }}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmWorkpaperReason}
                disabled={!workpaperReason.trim()}
                className="rounded bg-[#00338D] px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Working Paper File Detail Modal */}
      {workingPaperFileDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="working-paper-file-detail-title"
            className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between bg-[#00338D] px-4 py-3 text-white">
              <div className="flex min-w-0 items-center gap-2.5">
                <WorkingPaperFileIcon fileName={workingPaperFileDetail.file.name} className="h-5 w-5 shrink-0" />
                <div className="min-w-0">
                  <h3 id="working-paper-file-detail-title" className="truncate text-sm font-bold">{workingPaperFileDetail.file.name}</h3>
                  <p className="mt-0.5 text-[10px] text-blue-200">
                    {workingPaperFileDetail.row.procedureId} · {workingPaperFileDetail.row.accountDisclosure}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWorkingPaperFileDetail(null);
                  setReviewReplyText('');
                  setSelectedReplyOpinionId(null);
                }}
                className="text-blue-200 transition-colors hover:text-white"
                aria-label="关闭底稿文件详情"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[72vh] space-y-4 overflow-y-auto p-4 text-xs">
              <section className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5">
                <WorkingPaperFileStatusFlow steps={workingPaperFileStatusSteps} />
              </section>

              <section className="grid grid-cols-2 gap-x-5 gap-y-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-3">
                <div className="min-w-0">
                  <div className="text-[9px] font-semibold text-slate-400">文件名称</div>
                  <div className="mt-1 truncate font-bold text-slate-800" title={workingPaperFileDetail.file.name}>{workingPaperFileDetail.file.name}</div>
                </div>
                <div>
                  <div className="text-[9px] font-semibold text-slate-400">文件类型</div>
                  <div className="mt-1 font-bold uppercase text-slate-800">{getWorkingPaperFileKind(workingPaperFileDetail.file.name)}</div>
                </div>
                <div>
                  <div className="text-[9px] font-semibold text-slate-400">文件来源</div>
                  <div className="mt-1 font-bold text-slate-800">{workingPaperFileDetail.file.source ? '本地上传' : '模拟数据'}</div>
                </div>
                <div>
                  <div className="text-[9px] font-semibold text-slate-400">上传人</div>
                  <div className="mt-1 font-bold text-slate-800">{workingPaperFileDetail.row.isUploaded ? workingPaperFileDetail.row.uploadedBy : '—'}</div>
                </div>
                <div>
                  <div className="text-[9px] font-semibold text-slate-400">上传时间</div>
                  <div className="mt-1 font-mono font-bold text-slate-800">{workingPaperFileDetail.row.isUploaded ? workingPaperFileDetail.row.uploadDate : '—'}</div>
                </div>
                <div>
                  <div className="text-[9px] font-semibold text-slate-400">业务流程</div>
                  <div className="mt-1 font-bold text-slate-800">{workingPaperFileDetail.row.businessProcess}</div>
                </div>
              </section>

              {getVisibleSystemPrecheckAnomalies(workingPaperFileDetail.row).length > 0 && (
                <section className="rounded-lg border border-red-200 bg-red-50/70 p-3">
                  <div className="flex items-center gap-1.5 font-bold text-[#D95755]">
                    <TriangleAlert className="h-4 w-4" />
                    <span>系统预检异常</span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {getVisibleSystemPrecheckAnomalies(workingPaperFileDetail.row).map(anomaly => (
                      <div key={anomaly} className="flex items-start gap-2 rounded-md border border-red-100 bg-white/80 px-2.5 py-2 text-[10px] text-slate-700">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D95755]" />
                        <span>{anomaly}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-[#00338D]">
                    <ShieldCheck className="h-4 w-4" />
                    <span>复核意见及回复</span>
                  </div>
                  <span className="text-[9px] text-slate-400">点击意见可选择回复对象</span>
                </div>
                <ReviewThreadList
                  opinions={workingPaperFileOpinions}
                  replies={reviewRepliesByRow[workingPaperFileDetail.row.id] ?? []}
                  emptyText="该文件暂无复核意见及回复"
                  selectedOpinionId={selectedReplyOpinionId ?? workingPaperFileOpinions.at(-1)?.id ?? null}
                  onSelectOpinion={setSelectedReplyOpinionId}
                />
                {workingPaperFileOpinions.length > 0 && (
                  <div className="mt-3 flex items-end gap-2 border-t border-slate-200 pt-3">
                    <label className="min-w-0 flex-1">
                      <span className="sr-only">回复复核意见</span>
                      <textarea
                        rows={2}
                        value={reviewReplyText}
                        onChange={event => setReviewReplyText(event.target.value)}
                        placeholder="输入回复意见..."
                        className="w-full resize-none rounded-md border border-slate-300 bg-white px-2.5 py-2 text-[10px] text-slate-700 outline-none focus:border-[#00338D] focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={!reviewReplyText.trim()}
                      onClick={handleSubmitWorkingPaperFileReply}
                      className="shrink-0 rounded-md bg-[#00338D] px-3 py-2 text-[10px] font-bold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      保存回复
                    </button>
                  </div>
                )}
              </section>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeleteWorkingPaperFile}
                  className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#D95755] hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  删除文件
                </button>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#00338D] hover:bg-blue-50">
                  <RefreshCw className="h-3.5 w-3.5" />
                  替换文件
                  <input
                    type="file"
                    accept=".xlsx,.xls,.pdf,.docx,.doc,.pptx,.ppt"
                    className="sr-only"
                    onChange={event => {
                      const replacementFile = event.target.files?.[0];
                      if (replacementFile) {
                        replaceWorkingPaperFile(workingPaperFileDetail.row.id, workingPaperFileDetail.file, replacementFile);
                      }
                      event.target.value = '';
                    }}
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWorkingPaperFileDetail(null)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  关闭
                </button>
                <button
                  type="button"
                  onClick={() => openWorkingPaperWindow(workingPaperFileDetail.row.id, workingPaperFileDetail.file)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#00338D] px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-900"
                >
                  <Eye className="h-3.5 w-3.5" />
                  查看底稿
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Exception Reason Modal */}
      {templateExceptionModalRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-exception-title"
            className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between bg-[#00338D] p-4 text-white">
              <div className="flex items-center gap-2">
                <TriangleAlert className="h-5 w-5 text-amber-300" />
                <h3 id="template-exception-title" className="text-sm font-bold">记录未使用标准模板原因</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTemplateExceptionModalRow(null);
                  setTemplateExceptionReason('');
                }}
                className="text-blue-200 transition-colors hover:text-white"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 p-4 text-xs">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-semibold text-slate-500">程序 / 业务流程</div>
                <div className="mt-0.5 font-bold text-slate-900">{templateExceptionModalRow.procedureId}</div>
                <div className="mt-0.5 text-slate-600">{templateExceptionModalRow.businessProcess}</div>
              </div>
              <div>
                <label htmlFor="template-exception-reason" className="font-bold text-slate-700">
                  未使用标准模板原因 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="template-exception-reason"
                  rows={4}
                  autoFocus
                  value={templateExceptionReason}
                  onChange={(event) => setTemplateExceptionReason(event.target.value)}
                  placeholder="请输入原因及必要说明..."
                  className="mt-1 w-full resize-none rounded-md border border-slate-300 p-2.5 text-xs font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-[10px] text-slate-500">确认后将进入检查与修正阶段，复核和归档仍保持待处理。</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-3">
              <button
                type="button"
                onClick={() => {
                  setTemplateExceptionModalRow(null);
                  setTemplateExceptionReason('');
                }}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmTemplateException}
                disabled={!templateExceptionReason.trim()}
                className="rounded bg-[#00338D] px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Detail View Modal */}
      {detailModalRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#00338D] text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-200" />
                <h3 className="font-bold text-base">实质性底稿程序详情 — {detailModalRow.procedureId}</h3>
              </div>
              <button onClick={() => setDetailModalRow(null)} className="text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-5 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 font-medium">程序 ID / 条目 ID:</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{detailModalRow.procedureId} (ID: {detailModalRow.id})</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">RM ID (风险编号):</span>
                  <div className="font-bold text-[#00338D] text-sm mt-0.5">{detailModalRow.rmmId}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">业务流程:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{detailModalRow.businessProcess}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">账户/披露:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{detailModalRow.accountDisclosure}</div>
                </div>
              </div>

              <div className={`rounded-lg border p-3 ${
                detailModalRow.inspectionStatus === 'failed' || detailModalRow.isKcwTemplateUsed !== 'Yes'
                  ? 'border-red-200 bg-red-50/70'
                  : 'border-green-200 bg-green-50/60'
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className={`flex items-center gap-1.5 font-bold ${
                    detailModalRow.inspectionStatus === 'failed' || detailModalRow.isKcwTemplateUsed !== 'Yes'
                      ? 'text-[#D95755]'
                      : 'text-[#5F833A]'
                  }`}>
                    <Cpu className="h-4 w-4" />
                    <span>系统预检异常</span>
                  </div>
                  <div className="group/files relative shrink-0">
                    <button
                      type="button"
                      className="rounded border border-blue-300 bg-white px-2.5 py-1 text-[10px] font-bold text-[#00338D] transition-colors hover:bg-blue-100"
                    >
                      查看底稿
                    </button>
                    <div className="pointer-events-none invisible absolute right-0 top-full z-40 w-56 pt-1 opacity-0 transition-all group-hover/files:pointer-events-auto group-hover/files:visible group-hover/files:opacity-100 group-focus-within/files:pointer-events-auto group-focus-within/files:visible group-focus-within/files:opacity-100">
                      <div className="rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl">
                        {(uploadedFilesByRow[detailModalRow.id] ?? []).length > 0 ? (
                          (uploadedFilesByRow[detailModalRow.id] ?? []).map(file => (
                            <button
                              key={file.id}
                              type="button"
                              onClick={() => openWorkingPaperWindow(detailModalRow.id, file)}
                              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-blue-50"
                              title={file.name}
                            >
                              <WorkingPaperFileIcon fileName={file.name} className="h-4 w-4" />
                              <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-slate-700">{file.name}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-2 py-2 text-center text-[10px] text-slate-400">暂无已上传文件</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {detailModalRow.inspectionStatus === 'failed' || detailModalRow.isKcwTemplateUsed !== 'Yes' ? (
                  <div className="mt-3 space-y-2">
                    {getSystemPrecheckAnomalies(detailModalRow).map(anomaly => (
                      <div key={anomaly} className="rounded-md border border-red-100 bg-white/80 px-3 py-2 text-slate-700">
                        {anomaly}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-md border border-green-100 bg-white/80 px-3 py-2 text-slate-700">
                    系统预检完成，未发现异常。
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                <div className="flex items-center gap-1.5 font-bold text-[#00338D]">
                  <ShieldCheck className="h-4 w-4" />
                  <span>复核意见及回复</span>
                </div>

                <div className="mt-3">
                  <ReviewThreadList
                    opinions={getReviewOpinions(detailModalRow)}
                    replies={reviewRepliesByRow[detailModalRow.id] ?? []}
                    emptyText="当前条目暂无复核意见及回复"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. Review & Comment Modal */}
      {commentModalRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="comment-modal-title"
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="bg-[#00338D] text-white p-4 flex items-center justify-between">
              <div>
                <h3 id="comment-modal-title" className="font-bold text-sm">复核 — {commentModalRow.procedureId}</h3>
                <p className="mt-0.5 text-[10px] text-blue-100">Review substantive audit working paper</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCommentModalRow(null);
                    setCommentText('');
                    setIsCommentHistoryExpanded(false);
                  }}
                  className="text-blue-200 hover:text-white"
                  aria-label="关闭复核窗口"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div>
                  <div className="text-[10px] font-semibold text-slate-500">业务流程</div>
                  <div className="mt-0.5 font-bold text-slate-800">{commentModalRow.businessProcess}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-500">账户/披露</div>
                  <div className="mt-0.5 font-bold text-slate-800">{commentModalRow.accountDisclosure}</div>
                </div>
              </div>

              <div>
                <label htmlFor="working-paper-comment" className="font-bold text-slate-700">
                  复核意见
                </label>
                <textarea
                  id="working-paper-comment"
                  rows={5}
                  autoFocus
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="请输入复核意见或后续处理要求..."
                  className="mt-1 w-full resize-none rounded-md border border-slate-300 p-2.5 font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                  <button
                    type="button"
                    onClick={() => setIsCommentHistoryExpanded(previous => !previous)}
                    className="flex items-center gap-1 text-slate-500 transition-colors hover:text-[#00338D]"
                    aria-expanded={isCommentHistoryExpanded}
                  >
                    <ChevronRight className={`h-3 w-3 transition-transform ${isCommentHistoryExpanded ? 'rotate-90' : ''}`} />
                    <span>复核意见历史记录</span>
                  </button>
                  {commentText.trim() && (
                    <button
                      type="button"
                      onClick={handleSaveReviewComment}
                      className="rounded border border-slate-300 px-1.5 py-0.5 font-normal text-slate-500 transition-colors hover:border-slate-400 hover:text-[#00338D]"
                      aria-label="保存复核意见"
                    >
                      保存
                    </button>
                  )}
                </div>
                {isCommentHistoryExpanded && (
                  <div className="mt-2 max-h-36 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <ReviewThreadList
                      opinions={getReviewOpinions(commentModalRow)}
                      replies={reviewRepliesByRow[commentModalRow.id] ?? []}
                      emptyText="暂无复核意见历史"
                    />
                    {getReviewOpinions(commentModalRow).length > 0 && (
                      <div className="pt-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownloadReviewHistory(commentModalRow)}
                          className="rounded border border-slate-300 px-1.5 py-0.5 text-[10px] font-normal text-slate-500 transition-colors hover:border-slate-400 hover:text-[#00338D]"
                        >
                          下载记录
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-2 text-[10px] text-slate-400">标记为需跟进时必须填写评论；通过复核可不填写。</div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleReviewDecision('rejected')}
                disabled={!commentText.trim() && !savedReviewCommentsByRow[commentModalRow.id]}
                className="rounded border border-red-300 bg-white px-4 py-1.5 text-xs font-bold text-[#D95755] transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                需跟进
              </button>
              <button
                type="button"
                onClick={() => handleReviewDecision('approved')}
                disabled={savedReviewCommentsByRow[commentModalRow.id]}
                className="rounded bg-[#00338D] px-4 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                title={savedReviewCommentsByRow[commentModalRow.id] ? '已保存评论，不能通过复核' : '通过复核'}
              >
                通过复核
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. KCW Business Process URL Modal */}
      {isKcwSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="kcw-sync-title"
            className="flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 id="kcw-sync-title" className="text-base font-extrabold text-slate-900">
                确认底稿传输地址（业务流程 URL）
              </h3>
              <button
                type="button"
                onClick={() => setIsKcwSyncModalOpen(false)}
                disabled={isSyncing}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="关闭同步 KCW 弹窗"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {/* Audit UI skill is intentionally scoped to this table only. */}
              <div className="overflow-hidden rounded-lg border border-slate-200 shadow-2xs">
                <table className="w-full table-fixed border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-blue-200 bg-[#F1F6FD] text-[11px] font-extrabold text-[#00338D]">
                      <th scope="col" className="w-[38%] border-r border-blue-200/80 px-3 py-3 text-center">
                        业务流程
                      </th>
                      <th scope="col" className="px-3 py-3 text-center">URL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {kcwBusinessProcesses.map(process => (
                      <tr key={process.id} className="transition-colors hover:bg-slate-50">
                        <td className="border-r border-slate-200 px-4 py-3 align-middle text-slate-800">
                          <span className="font-semibold">{process.name}</span>
                          <span className="ml-1 text-slate-500">({process.englishName})</span>
                        </td>
                        <td className="p-2 align-middle">
                          <input
                            type="url"
                            value={kcwUrls[process.id] ?? ''}
                            onChange={(event) => {
                              setKcwUrls(previous => ({ ...previous, [process.id]: event.target.value }));
                              setAreKcwUrlsConfirmed(false);
                            }}
                            placeholder="请输入业务流程 URL"
                            aria-label={`${process.name} URL`}
                            disabled={isSyncing}
                            className="h-9 w-full rounded-md border border-transparent bg-transparent px-3 font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-200 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!allKcwUrlsProvided && (
                <p className="mt-2 text-[11px] text-slate-500">请填写全部业务流程的 URL 后再确认。</p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
              <button
                type="button"
                onClick={() => setAreKcwUrlsConfirmed(true)}
                disabled={!allKcwUrlsProvided || isSyncing}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-blue-300 hover:text-[#00338D] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                {areKcwUrlsConfirmed ? 'URL 地址已确认' : '确认 URL 地址'}
              </button>
              <button
                type="button"
                onClick={handleSendToKCW}
                disabled={!areKcwUrlsConfirmed || isSyncing}
                className="flex items-center gap-1.5 rounded-md bg-[#00338D] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? '发送中...' : '发送至 KCW'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsKcwSyncModalOpen(false)}
                disabled={isSyncing}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Upload Modal */}
      {uploadModalRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#00338D] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">上传工作底稿至 KCW — {uploadModalRow.procedureId}</h3>
              <button onClick={() => setUploadModalRow(null)} className="text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-5 text-center">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label
                  className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 p-4 transition-colors hover:border-blue-500 hover:bg-blue-50"
                  onDragOver={event => event.preventDefault()}
                  onDrop={event => {
                    event.preventDefault();
                    if (event.dataTransfer.files.length > 0) {
                      addWorkingPaperFiles(uploadModalRow.id, event.dataTransfer.files);
                    }
                  }}
                >
                  <input
                    type="file"
                    multiple
                    accept=".xlsx,.xls,.pdf,.docx,.doc,.pptx,.ppt"
                    className="hidden"
                    onChange={event => {
                      if (event.target.files?.length) {
                        addWorkingPaperFiles(uploadModalRow.id, event.target.files);
                        event.target.value = '';
                      }
                    }}
                  />
                  <Upload className="h-7 w-7 text-[#00338D]" />
                  <div className="mt-2 text-xs font-bold leading-5 text-slate-800">点击选择文件或拖拽工作底稿</div>
                  <div className="mt-1 text-[10px] text-slate-400">.xlsx、.pdf、.docx、.pptx</div>
                </label>

                <button
                  type="button"
                  onClick={openBlankWorkspace}
                  className="flex min-h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 p-4 text-[#00338D] transition-colors hover:border-blue-500 hover:bg-blue-50"
                >
                  <FileText className="h-7 w-7" />
                  <span className="mt-2 text-xs font-bold">Online working paper edit</span>
                  <span className="mt-1 text-[10px] font-normal text-slate-400">在线编辑当前工作底稿</span>
                </button>
              </div>

              <div className="text-left">
                <div className="mb-2 text-[10px] font-bold text-slate-500">已上传文件</div>
                {(uploadedFilesByRow[uploadModalRow.id] ?? []).length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {(uploadedFilesByRow[uploadModalRow.id] ?? []).map(file => (
                      <div
                        key={file.id}
                        onDragOver={event => event.preventDefault()}
                        onDrop={event => {
                          event.preventDefault();
                          const replacementFile = event.dataTransfer.files[0];
                          if (replacementFile) replaceWorkingPaperFile(uploadModalRow.id, file, replacementFile);
                        }}
                        className="flex min-h-24 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-2 py-2 text-center transition-colors hover:border-blue-300 hover:bg-blue-50/30"
                        title={`拖拽新文件至此替换 ${file.name}`}
                      >
                        <WorkingPaperFileIcon fileName={file.name} className="h-6 w-6" />
                        <div className="mt-1.5 w-full truncate text-[10px] font-semibold text-slate-700" title={file.name}>{file.name}</div>
                        <div className="mt-1 text-[8px] text-slate-400">拖拽文件至此替换</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-[10px] text-slate-400">
                    暂无已上传文件
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-xs">
                <div>
                  <div className="text-[10px] font-semibold text-slate-500">上传人</div>
                  <div className="mt-1 font-bold text-slate-700">
                    {uploadModalRow.isUploaded ? uploadModalRow.uploadedBy : 'Huang, Ian (SH/AQPP)'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-500">上传时间</div>
                  <div className="mt-1 font-mono font-bold text-slate-700">
                    {uploadModalRow.isUploaded && uploadModalRow.uploadDate !== '-'
                      ? uploadModalRow.uploadDate
                      : '2026-09-04 09:30'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setUploadModalRow(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded font-semibold text-xs"
              >
                取消
              </button>
              <button
                onClick={() => handleConfirmUpload(uploadModalRow.id)}
                className="px-4 py-1.5 bg-[#00338D] hover:bg-blue-900 text-white rounded font-bold text-xs shadow-2xs"
              >
                确认上传并触发 AI 预检
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
