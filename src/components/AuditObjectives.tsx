import React, { useState, useMemo } from 'react';
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
  Edit3, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal, 
  FileText, 
  ShieldCheck, 
  Cpu, 
  BarChart3, 
  Link2,
  TriangleAlert,
  CalendarDays,
  X
} from 'lucide-react';

interface AuditObjectivesProps {
  onModifyProcedure?: (proc: any) => void;
}

type AccountingPeriodFilter = 'all' | '2026' | '2025';
type WorkingPaperStageState = 'done' | 'active' | 'blocked' | 'unavailable';
type SummaryFilter = 'all' | 'archived' | 'unarchived' | 'passed' | 'failed' | 'kcw' | 'non-kcw';

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

const getSamplingMethod = (row: SubstantiveDocumentRow) => {
  if (row.id === '149625') return 'All items';
  if (row.accountDisclosure.includes('应付职工薪酬')) return 'KSP';
  return 'MUS';
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
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<AccountingPeriodFilter>('2026');

  // Substantive Documents dataset state
  const [rows, setRows] = useState<SubstantiveDocumentRow[]>(initialRowsWithTemplateStates);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectionFilter, setInspectionFilter] = useState<string>('all');
  const [summaryFilter, setSummaryFilter] = useState<SummaryFilter>('all');

  // Modals state
  const [detailModalRow, setDetailModalRow] = useState<SubstantiveDocumentRow | null>(null);
  const [isAiDetailExpanded, setIsAiDetailExpanded] = useState<boolean>(false);
  const [commentModalRow, setCommentModalRow] = useState<SubstantiveDocumentRow | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [commentsByRow, setCommentsByRow] = useState<Record<string, string>>({});
  const [uploadModalRow, setUploadModalRow] = useState<SubstantiveDocumentRow | null>(null);
  const [templateExceptionModalRow, setTemplateExceptionModalRow] = useState<SubstantiveDocumentRow | null>(null);
  const [templateExceptionReason, setTemplateExceptionReason] = useState<string>('');
  const [templateExceptionReasons, setTemplateExceptionReasons] = useState<Record<string, string>>({});
  const [confirmedTemplateExceptions, setConfirmedTemplateExceptions] = useState<Record<string, boolean>>({});
  const [isKcwSyncModalOpen, setIsKcwSyncModalOpen] = useState<boolean>(false);
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

  const allKcwUrlsProvided = kcwBusinessProcesses.every(process => kcwUrls[process.id]?.trim());

  // Filtered rows calculation
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      // The mock dataset belongs to the ABC LIMITED CO.; All includes the same group records.
      if (selectedEntity !== 'all' && selectedEntity !== 'abc-limited-co') return false;

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
      if (summaryFilter === 'archived' && !(r.isUploaded && r.inspectionStatus === 'passed')) return false;
      if (summaryFilter === 'unarchived' && r.isUploaded && r.inspectionStatus === 'passed') return false;
      if (summaryFilter === 'passed' && r.inspectionStatus !== 'passed') return false;
      if (summaryFilter === 'failed' && r.inspectionStatus !== 'failed') return false;
      if (summaryFilter === 'kcw' && r.isKcwTemplateUsed !== 'Yes') return false;
      if (summaryFilter === 'non-kcw' && r.isKcwTemplateUsed === 'Yes') return false;

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
  }, [rows, selectedEntity, selectedPeriod, selectedBpFilter, inspectionFilter, summaryFilter, searchQuery]);

  const handleExportRows = () => {
    const headers = [
      '业务流程', '账户/披露', 'RM ID', '程序ID', '实质性程序描述', '类型', '抽样方式', '样本信息',
      'KCW模板', '使用标准模板', '底稿进度', '上传人', '上传日期', '复核人', '复核日期', '质检状态'
    ];
    const exportRows = filteredRows.map(row => {
      const templateStatus = row.isKcwTemplateUsed === 'Yes'
        ? '已使用标准模板'
        : row.isKcwTemplateUsed === 'Exception'
          ? `未使用标准模板（${confirmedTemplateExceptions[row.id] ? '原因已记录' : '待记录原因'}）`
          : '未上传';
      const progress = getWorkingPaperStages(row, Boolean(confirmedTemplateExceptions[row.id]))
        .map(stage => `${stage.label}：${stage.state === 'done' ? '完成' : stage.state === 'active' ? '进行中' : '未完成'}`)
        .join(' / ');
      const hasUploader = row.isUploaded && row.isKcwTemplateUsed !== 'No';
      const hasReviewer = row.isUploaded && row.isKcwTemplateUsed === 'Yes';
      const inspectionStatus = row.inspectionStatus === 'passed'
        ? '已通过'
        : row.inspectionStatus === 'failed' ? '未通过' : '待检查';

      return [
        row.businessProcess,
        row.accountDisclosure,
        row.rmmId,
        row.procedureId,
        row.procedureDesc,
        row.procedureType,
        getSamplingMethod(row),
        row.scopeDetail,
        row.kcwTemplate,
        templateStatus,
        progress,
        hasUploader ? row.uploadedBy : '—',
        hasUploader ? formatDay(row.uploadDate) : '—',
        hasReviewer ? (row.reviewedBy ?? row.uploadedBy) : '—',
        hasReviewer ? (row.reviewDate ?? getReviewDay(row)) : '—',
        inspectionStatus
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
    const total = rows.length;
    const uploaded = rows.filter(r => r.isUploaded).length;
    const archived = rows.filter(r => r.isUploaded && r.inspectionStatus === 'passed').length;
    const passed = rows.filter(r => r.inspectionStatus === 'passed').length;
    const failed = rows.filter(r => r.inspectionStatus === 'failed').length;
    const inspected = passed + failed;
    const kcwUsed = rows.filter(r => r.isKcwTemplateUsed === 'Yes').length;
    const unarchived = total - archived;
    const nonKcw = total - kcwUsed;

    return {
      total,
      currentCount: total,
      uploaded,
      archived,
      unarchived,
      archiveRate: total > 0 ? Math.round((archived / total) * 100) : 0,
      unarchiveRate: total > 0 ? Math.round((unarchived / total) * 100) : 0,
      passed,
      passRate: inspected > 0 ? Math.round((passed / inspected) * 100) : 0,
      failed,
      failRate: inspected > 0 ? Math.round((failed / inspected) * 100) : 0,
      kcwUsed,
      nonKcw,
      kcwRate: total > 0 ? Math.round((kcwUsed / total) * 100) : 0,
      nonKcwRate: total > 0 ? Math.round((nonKcw / total) * 100) : 0
    };
  }, [rows]);

  const applySummaryFilter = (filter: SummaryFilter) => {
    setSummaryFilter(filter);
    setSelectedBpFilter('all');
    setInspectionFilter('all');
    setSearchQuery('');
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
    showNotification(`底稿已成功上传至 KCW 并通过 AI 规则校验 [ID: ${id}]`);
  };

  const openCommentModal = (row: SubstantiveDocumentRow) => {
    setCommentModalRow(row);
    setCommentText(commentsByRow[row.id] ?? '');
  };

  const handleSaveComment = () => {
    if (!commentModalRow || !commentText.trim()) return;
    setCommentsByRow(previous => ({ ...previous, [commentModalRow.id]: commentText.trim() }));
    showNotification(`评论已保存 [ID: ${commentModalRow.id}]`);
    setCommentModalRow(null);
    setCommentText('');
  };

  const handleApproveDetailReview = () => {
    if (!detailModalRow) return;

    const reviewedRow: SubstantiveDocumentRow = {
      ...detailModalRow,
      isKcwTemplateUsed: 'Yes',
      inspectionStatus: 'passed',
      reviewedBy: 'Huang, Ian (SH/AQPP)',
      reviewDate: '2026-08-27'
    };
    setRows(previous => previous.map(row => row.id === reviewedRow.id ? reviewedRow : row));
    setDetailModalRow(reviewedRow);
    showNotification(`复核已通过 [ID: ${reviewedRow.id}]`);
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

  return (
    <div className="space-y-4 font-sans text-slate-800">
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
          className={`relative overflow-hidden rounded-lg border bg-white p-3 text-left shadow-2xs transition-all hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-200 group ${
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

        {/* Metric 2: Archived Working Paper Coverage */}
        <button
          type="button"
          onClick={() => applySummaryFilter(summaryFilter === 'archived' ? 'unarchived' : 'archived')}
          title={summaryFilter === 'archived' ? '再次点击筛选未归档任务' : '点击筛选已归档任务'}
          className={`relative overflow-hidden rounded-lg border bg-white p-3 text-left shadow-2xs transition-all hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-200 group ${
            summaryFilter === 'unarchived'
              ? 'audit-metric-card--flip border-red-300 ring-1 ring-red-100'
              : summaryFilter === 'archived' ? 'border-blue-400 ring-1 ring-blue-100' : 'border-slate-200'
          }`}
        >
          {(summaryFilter === 'archived' || summaryFilter === 'unarchived') && (
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 ${
              summaryFilter === 'unarchived' ? 'bg-red-50' : 'bg-blue-50'
            }`}></div>
          )}
          <div className="relative">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">底稿已归档覆盖率</div>
            <div className={`mt-0.5 text-xl font-extrabold ${summaryFilter === 'unarchived' ? 'text-[#D95755]' : 'text-[#00338D]'}`}>
              {summaryFilter === 'unarchived' ? stats.unarchiveRate : stats.archiveRate}%
            </div>
            <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              {summaryFilter === 'unarchived' ? (
                <>
                  <div className="h-full bg-[#D95755]" style={{ width: `${stats.unarchiveRate}%` }} />
                  <div className="h-full flex-1 bg-gradient-to-r from-blue-500 to-[#00338D]" />
                </>
              ) : (
                <>
                  <div className="h-full bg-gradient-to-r from-blue-500 to-[#00338D]" style={{ width: `${stats.archiveRate}%` }} />
                  <div className="h-full flex-1 bg-[#D95755]" />
                </>
              )}
            </div>
            <div className={`mt-1.5 h-3 text-center text-[10px] font-semibold ${summaryFilter === 'unarchived' ? 'text-[#D95755]' : 'text-blue-800'}`}>
              {summaryFilter === 'unarchived' ? `未归档：${stats.unarchived}/${stats.currentCount}` : `已归档：${stats.archived}/${stats.currentCount}`}
            </div>
          </div>
        </button>

        {/* Metric 3: Inspection Pass Rate */}
        <button
          type="button"
          onClick={() => applySummaryFilter(summaryFilter === 'passed' ? 'failed' : 'passed')}
          title={summaryFilter === 'passed' ? '再次点击筛选未通过任务' : '点击筛选已通过任务'}
          className={`relative overflow-hidden rounded-lg border bg-white p-3 text-left shadow-2xs transition-all hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-200 group ${
            summaryFilter === 'failed'
              ? 'audit-metric-card--flip border-red-300 ring-1 ring-red-100'
              : summaryFilter === 'passed'
                ? 'border-blue-400 ring-1 ring-blue-100'
                : 'border-slate-200'
          }`}
        >
          {(summaryFilter === 'passed' || summaryFilter === 'failed') && (
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-110 ${
              summaryFilter === 'failed' ? 'bg-red-50' : 'bg-blue-50'
            }`}></div>
          )}
          <div className="relative">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">复核质检通过率</div>
            <div className={`text-xl font-extrabold mt-0.5 ${summaryFilter === 'failed' ? 'text-[#D95755]' : 'text-emerald-800'}`}>
              {summaryFilter === 'failed' ? stats.failRate : stats.passRate}%
            </div>
            <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100" aria-label={`已通过 ${stats.passed}，未通过 ${stats.failed}`}>
              {summaryFilter === 'failed' ? (
                <>
                  <div className="h-full bg-[#D95755]" style={{ width: `${stats.failRate}%` }} title={`未通过：${stats.failed}`} />
                  <div className="h-full flex-1 bg-gradient-to-r from-blue-500 to-[#00338D]" title={`已通过：${stats.passed}`} />
                </>
              ) : (
                <>
                  <div className="h-full bg-gradient-to-r from-blue-500 to-[#00338D]" style={{ width: `${stats.passRate}%` }} title={`已通过：${stats.passed}`} />
                  <div className="h-full flex-1 bg-[#D95755]" title={`未通过：${stats.failed}`} />
                </>
              )}
            </div>
            <div className="mt-1.5 flex h-3 w-full items-center text-[10px] font-semibold">
              {summaryFilter === 'failed' ? (
                <>
                  <div className="border-r border-slate-300 pr-1 text-center text-[#D95755]" style={{ width: `${stats.failRate}%` }}>未通过：{stats.failed}</div>
                  <div className="flex-1 pl-1 text-center text-blue-800">已通过：{stats.passed}</div>
                </>
              ) : (
                <>
                  <div className="border-r border-slate-300 pr-1 text-center text-blue-800" style={{ width: `${stats.passRate}%` }}>已通过：{stats.passed}</div>
                  <div className="flex-1 pl-1 text-center text-[#D95755]">未通过：{stats.failed}</div>
                </>
              )}
            </div>
          </div>
        </button>

        {/* Metric 4: KCW Template Compliance */}
        <button
          type="button"
          onClick={() => applySummaryFilter(summaryFilter === 'kcw' ? 'non-kcw' : 'kcw')}
          title={summaryFilter === 'kcw' ? '再次点击筛选未使用标准模板和未上传任务' : '点击筛选已使用标准模板任务'}
          className={`relative overflow-hidden rounded-lg border bg-white p-3 text-left shadow-2xs transition-all hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-200 group ${
            summaryFilter === 'non-kcw'
              ? 'audit-metric-card--flip border-red-300 ring-1 ring-red-100'
              : summaryFilter === 'kcw'
                ? 'border-blue-400 ring-1 ring-blue-100'
                : 'border-slate-200'
          }`}
        >
          {(summaryFilter === 'kcw' || summaryFilter === 'non-kcw') && (
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-110 ${
              summaryFilter === 'non-kcw' ? 'bg-red-50' : 'bg-blue-50'
            }`}></div>
          )}
          <div className="relative">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KCW 标准模板率</div>
            <div className={`text-xl font-extrabold mt-0.5 flex items-baseline space-x-1 ${summaryFilter === 'non-kcw' ? 'text-[#D95755]' : 'text-[#00338D]'}`}>
              <span>{summaryFilter === 'non-kcw' ? stats.nonKcwRate : stats.kcwRate}%</span>
              <span className="text-[10px] font-normal text-slate-500">Compliance</span>
            </div>
            <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              {summaryFilter === 'non-kcw' ? (
                <>
                  <div className="h-full bg-[#D95755]" style={{ width: `${stats.nonKcwRate}%` }} />
                  <div className="h-full flex-1 bg-gradient-to-r from-blue-500 to-[#00338D]" />
                </>
              ) : (
                <>
                  <div className="h-full bg-gradient-to-r from-blue-500 to-[#00338D]" style={{ width: `${stats.kcwRate}%` }} />
                  <div className="h-full flex-1 bg-[#D95755]" />
                </>
              )}
            </div>
            <div className={`mt-1.5 text-[10px] font-medium flex items-center space-x-1 ${summaryFilter === 'non-kcw' ? 'text-[#D95755]' : 'text-blue-800'}`}>
              <ShieldCheck className={`w-3 h-3 ${summaryFilter === 'non-kcw' ? 'text-[#D95755]' : 'text-blue-600'}`} />
              <span>{summaryFilter === 'non-kcw' ? `未使用/未上传：${stats.nonKcw}` : `已使用标准模板：${stats.kcwUsed}`}</span>
            </div>
          </div>
        </button>

        {/* Metric 5: Materiality Threshold Card (Matching table header light blue) */}
        <div className="bg-[#eef4ff] border border-blue-200 rounded-xl p-3 shadow-2xs flex flex-col justify-between">
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

      {/* Main Content Layout (Left BUSINESS PROCESS Selector + Right Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left BUSINESS PROCESS Panel (业务流程类仿) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-3">
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
                {rows.length}
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
              const processRows = rows.filter(row => row.businessProcess.includes(bp.name));
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

        {/* Right KPMG Table Content Panel */}
        <div className="lg:col-span-10 min-w-0 bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-3.5">
          {/* Streamlined, Card-ified Top Toolbar */}
          <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            {/* Search and Status Filter Group */}
            <div className="flex items-center flex-1 min-w-[280px] space-x-2">
              <div className="relative flex-1">
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
            </div>

            {/* Concentrated Action Group */}
            <div className="flex items-center space-x-2 shrink-0">
              {/* Segmented Secondary Toolbar Buttons */}
              <div className="inline-flex items-center p-0.5 bg-white border border-slate-300 rounded-lg shadow-2xs">
                <button
                  onClick={() => {
                    setRows([...initialRowsWithTemplateStates]);
                    setTemplateExceptionReasons({});
                    setConfirmedTemplateExceptions({});
                    showNotification('数据已重新拉取并同步');
                  }}
                  className="flex items-center space-x-1.5 px-2.5 py-1 text-slate-700 hover:text-[#00338D] hover:bg-blue-50/80 rounded-md text-xs font-semibold transition-colors"
                  title="更新数据"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">刷新</span>
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
                  <span>导出</span>
                </button>
              </div>

            </div>
          </div>

          {/* Substantive Audit Documents Table - Soft Light Blue Header */}
          <div className="w-full overflow-hidden border border-slate-200 rounded-xl shadow-2xs">
            <table className="audit-procedure-table text-left border-collapse">
              <colgroup>
                <col style={{ width: '6%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '5%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '3.5%' }} />
                <col style={{ width: '4%' }} />
                <col style={{ width: '5%' }} />
                <col style={{ width: '6%' }} />
                <col style={{ width: '5%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '8.5%' }} />
                <col style={{ width: '7.5%' }} />
                <col style={{ width: '6.5%' }} />
              </colgroup>
              <thead>
                <tr className="bg-[#F1F6FD] text-center text-[#00338D] font-extrabold text-[11px] leading-tight border-b-2 border-blue-200">
                  <th className="border-r border-blue-200/80">业务流程</th>
                  <th className="border-r border-blue-200/80">账户/披露</th>
                  <th className="text-center border-r border-blue-200/80">RM ID</th>
                  <th className="text-center border-r border-blue-200/80">程序ID</th>
                  <th className="border-r border-blue-200/80">实质性程序描述</th>
                  <th className="text-center border-r border-blue-200/80">类型</th>
                  <th className="text-center border-r border-blue-200/80">抽样方式</th>
                  <th className="text-center border-r border-blue-200/80">样本信息</th>
                  <th className="text-center border-r border-blue-200/80">KCW模板</th>
                  <th className="whitespace-nowrap text-center border-r border-blue-200/80">使用标准模板</th>
                  <th className="text-center border-r border-blue-200/80">底稿进度</th>
                  <th className="text-center border-r border-blue-200/80">上传人</th>
                  <th className="text-center border-r border-blue-200/80">复核人</th>
                  <th className="text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 bg-white">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-8 text-center text-slate-400 font-medium">
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

                      {/* RM ID */}
                      <td className="py-2.5 px-2 text-center font-mono font-medium text-slate-700 border-r border-slate-200">
                        {row.rmmId}
                      </td>

                      {/* 程序ID */}
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-[#00338D] border-r border-slate-200">
                        {row.procedureId}
                      </td>

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
                      <td className="border-r border-slate-200 px-2 py-2.5 text-center">
                        <span className="sampling-method-value whitespace-nowrap text-[9px] font-semibold text-slate-700">
                          {getSamplingMethod(row)}
                        </span>
                      </td>

                      {/* 样本信息 */}
                      <td className="py-2.5 px-2 text-center text-slate-600 border-r border-slate-200 font-medium text-[10px]">
                        <button
                          type="button"
                          onClick={() => showNotification(`已打开样本信息 [${row.procedureId}]`)}
                          className="mx-auto inline-flex items-center gap-1 font-semibold text-[#00338D] hover:underline"
                          title="查看样本信息"
                        >
                          <span>sample</span>
                          <Link2 className="h-3 w-3" />
                        </button>
                      </td>

                      {/* KCW 标准工作底稿模板 */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-200">
                        {row.kcwTemplate === 'KCw WP Hyperlink' ? (
                          <button 
                            onClick={() => showNotification(`已打开 KCW 底稿超链接模板 [${row.procedureId}]`)}
                            className="text-blue-600 hover:underline font-semibold flex items-center justify-center space-x-1 mx-auto"
                          >
                            <span>KCW</span>
                            <Link2 className="h-3 w-3" />
                          </button>
                        ) : row.kcwTemplate === 'Q 查询' ? (
                          <button 
                            onClick={() => showNotification(`开启 Q 查询底稿匹配 [${row.procedureId}]`)}
                            className="mx-auto font-medium text-slate-500 hover:text-blue-700"
                          >
                            <span>Q 查询</span>
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* 是否使用KCW标准工作底稿模板 */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-200">
                        <button
                          type="button"
                          onClick={row.isKcwTemplateUsed === 'Exception' ? () => openTemplateExceptionModal(row) : undefined}
                          aria-label={
                            row.isKcwTemplateUsed === 'Yes'
                              ? '已使用标准模板'
                              : row.isKcwTemplateUsed === 'Exception'
                                ? '未使用标准模板，点击记录原因'
                                : '未上传'
                          }
                          title={
                            row.isKcwTemplateUsed === 'Yes'
                              ? '已使用标准模板'
                              : row.isKcwTemplateUsed === 'Exception'
                                ? '未使用标准模板'
                                : '未上传'
                          }
                          className={`mx-auto flex h-5 w-5 items-center justify-center ${
                            row.isKcwTemplateUsed === 'Yes'
                              ? 'cursor-default rounded-full bg-[#DCE9C8] text-[#5F833A]'
                              : row.isKcwTemplateUsed === 'Exception'
                                ? confirmedTemplateExceptions[row.id]
                                  ? 'cursor-pointer rounded-full bg-amber-100 text-amber-600 transition-colors hover:bg-amber-200'
                                  : 'cursor-pointer rounded-full bg-[#FAEAEA] text-[#D95755] transition-colors hover:bg-[#F6DADA]'
                                : 'cursor-default rounded-full bg-slate-100 text-slate-600'
                          }`}
                        >
                          {row.isKcwTemplateUsed === 'Yes'
                            ? <Check className="h-3 w-3 stroke-[3]" />
                            : row.isKcwTemplateUsed === 'Exception'
                              ? confirmedTemplateExceptions[row.id]
                                ? <Check className="h-3 w-3 stroke-[3]" />
                                : <span className="text-[13px] font-black leading-none">!</span>
                              : <X className="h-3 w-3 stroke-[2.5]" />}
                        </button>
                      </td>

                      {/* 底稿进度：上传 → 检查 → 修正 → 复核 → 归档 */}
                      <td className="border-r border-slate-200 px-2.5">
                        <div
                          className={`working-paper-progress ${
                            getWorkingPaperStages(row, Boolean(confirmedTemplateExceptions[row.id])).every(stage => stage.state === 'done')
                              ? 'working-paper-progress--all-done'
                              : ''
                          }`}
                          role="progressbar"
                          aria-label={`${row.procedureId}底稿进度`}
                          aria-valuemin={0}
                          aria-valuemax={5}
                          aria-valuenow={getWorkingPaperStages(row, Boolean(confirmedTemplateExceptions[row.id])).filter(stage => stage.state === 'done').length}
                        >
                          {getWorkingPaperStages(row, Boolean(confirmedTemplateExceptions[row.id])).map(stage => (
                            <div key={stage.label} className="min-w-0 flex-1 text-center" title={`${stage.label}：${stage.state === 'done' ? '完成' : stage.state === 'active' ? '进行中' : stage.state === 'unavailable' ? '不适用' : '未完成'}`}>
                              <div className={`working-paper-progress__segment working-paper-progress__segment--${stage.state}`} />
                              <div className="working-paper-progress__label">{stage.label}</div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* 上传人 */}
                      <td className="border-r border-slate-200 text-center">
                        {row.isKcwTemplateUsed === 'No' ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <>
                            <div className="audit-person-name text-slate-600" title={row.isUploaded ? row.uploadedBy : '未上传'}>
                              {row.isUploaded ? row.uploadedBy : '—'}
                            </div>
                            {row.isUploaded && (
                              <div className="mt-1 whitespace-nowrap font-mono text-[9px] text-slate-400" title="上传日期">
                                {formatDay(row.uploadDate)}
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      {/* 复核人 */}
                      <td className="border-r border-slate-200 text-center">
                        {row.isKcwTemplateUsed !== 'Yes' ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <>
                            <div className="audit-person-name text-slate-600" title={row.isUploaded ? (row.reviewedBy ?? row.uploadedBy) : '未分配'}>
                              {row.isUploaded ? (row.reviewedBy ?? row.uploadedBy) : '—'}
                            </div>
                            {row.isUploaded && (
                              <div className="mt-1 whitespace-nowrap font-mono text-[9px] text-slate-400" title="复核日期">
                                {row.reviewDate ?? getReviewDay(row)}
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      {/* 操作 */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-0.5 whitespace-nowrap text-slate-500">
                          <button
                            onClick={() => {
                              setDetailModalRow(row);
                              setIsAiDetailExpanded(false);
                            }}
                            className="p-1 hover:text-[#00338D] hover:bg-blue-50 rounded"
                            title="查看详情 (View)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openCommentModal(row)}
                            className="p-1 hover:text-[#00338D] hover:bg-blue-50 rounded"
                            title="评论 (Comment)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setUploadModalRow(row)}
                            className="p-1 hover:text-[#00338D] hover:bg-blue-50 rounded"
                            title="上传/替换底稿 (Upload)"
                          >
                            <Upload className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
              显示第 <span className="font-bold text-slate-800">1</span> 至 <span className="font-bold text-slate-800">{filteredRows.length}</span> 条，共 <span className="font-bold text-slate-800">{rows.length}</span> 条实质性程序记录
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
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#00338D] text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-200" />
                <h3 className="font-bold text-base">实质性底稿程序详情 — {detailModalRow.procedureId}</h3>
              </div>
              <button onClick={() => setDetailModalRow(null)} className="text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
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

              <div>
                <span className="font-bold text-slate-900 text-sm">实质性程序描述:</span>
                <p className="mt-1 text-slate-700 bg-white p-3 rounded border border-slate-200 leading-relaxed font-normal">
                  {detailModalRow.procedureDesc}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-2.5 border border-slate-200 rounded-lg bg-slate-50/50">
                  <span className="text-slate-500 font-semibold">程序类型:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{detailModalRow.procedureType}</div>
                </div>
                <div className="p-2.5 border border-slate-200 rounded-lg bg-slate-50/50">
                  <span className="text-slate-500 font-semibold">KCW 模板:</span>
                  <div className={`mt-0.5 font-bold ${detailModalRow.isKcwTemplateUsed === 'Yes' ? 'text-emerald-700' : 'text-red-600'}`}>
                    {detailModalRow.isKcwTemplateUsed === 'Yes' ? '已按标准模板引用' : '未引用标准模板'}
                  </div>
                </div>
                <div className="p-2.5 border border-slate-200 rounded-lg bg-slate-50/50">
                  <span className="text-slate-500 font-semibold">质检状态:</span>
                  <div className={`font-bold mt-0.5 ${detailModalRow.inspectionStatus === 'passed' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {detailModalRow.inspectionStatus === 'passed' ? '已通过检验' : '需要重新核验'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-200 text-blue-900">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-bold flex items-center space-x-1">
                    <Cpu className="w-4 h-4 text-[#00338D]" />
                    <span>AI Agent 审计错报:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAiDetailExpanded(previous => !previous)}
                    className="shrink-0 rounded border border-blue-300 bg-white px-2 py-1 text-[10px] font-bold text-[#00338D] transition-colors hover:bg-blue-100"
                  >
                    {isAiDetailExpanded ? '收起详情' : '查看详情'}
                  </button>
                </div>
                <p className="mt-1 text-slate-700">{detailModalRow.aiIntelligence || '智能智能校验引擎匹配成功，无系统异常或勾稽不符。'}</p>
                {isAiDetailExpanded && (
                  <div className="mt-2 grid grid-cols-1 gap-1.5 rounded-md border border-blue-200 bg-white/80 p-2 text-[10px] text-slate-600 sm:grid-cols-3">
                    <div><span className="font-bold text-slate-700">程序：</span>{detailModalRow.procedureId}</div>
                    <div><span className="font-bold text-slate-700">模板：</span>{detailModalRow.isKcwTemplateUsed === 'Yes' ? '标准模板' : '未使用'}</div>
                    <div><span className="font-bold text-slate-700">质检：</span>{detailModalRow.inspectionStatus === 'passed' ? '已通过' : '待复核'}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-end space-x-2">
              {(detailModalRow.isKcwTemplateUsed !== 'Yes' || detailModalRow.inspectionStatus !== 'passed') && (
                <button
                  type="button"
                  onClick={handleApproveDetailReview}
                  className="rounded bg-[#00338D] px-4 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-blue-900"
                >
                  复核通过
                </button>
              )}
              <button
                onClick={() => setDetailModalRow(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-xs"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Comment Modal */}
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
                <h3 id="comment-modal-title" className="font-bold text-sm">添加评论 — {commentModalRow.procedureId}</h3>
                <p className="mt-0.5 text-[10px] text-blue-100">Comment on substantive audit working paper</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCommentModalRow(null);
                  setCommentText('');
                }}
                className="text-blue-200 hover:text-white"
                aria-label="关闭评论窗口"
              >
                <X className="w-5 h-5" />
              </button>
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
                  评论内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="working-paper-comment"
                  rows={5}
                  autoFocus
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="请输入评论、复核意见或后续处理要求..."
                  className="mt-1 w-full resize-none rounded-md border border-slate-300 p-2.5 font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                  <span>评论将关联至该程序记录。</span>
                  <span>{commentText.length} 字符</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setCommentModalRow(null);
                  setCommentText('');
                }}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded font-semibold text-xs"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveComment}
                disabled={!commentText.trim()}
                className="px-4 py-1.5 bg-[#00338D] hover:bg-blue-900 text-white rounded font-bold text-xs shadow-2xs disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                保存评论
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
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#00338D] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">上传/归档底稿至 KCW — {uploadModalRow.procedureId}</h3>
              <button onClick={() => setUploadModalRow(null)} className="text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 text-center space-y-4">
              <div className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 rounded-xl p-6 cursor-pointer transition-colors">
                <Upload className="w-8 h-8 text-[#00338D] mx-auto animate-bounce" />
                <div className="mt-2 font-bold text-slate-800 text-xs">点击选择文件或拖拽工作底稿 (.xlsx, .pdf, .docx)</div>
                <div className="text-[10px] text-slate-400 mt-1">文件将被加密上传至 KPMG KCW 云底稿服务器</div>
              </div>

              <div className="text-left text-xs bg-slate-50 p-3 rounded border border-slate-200">
                <div className="font-bold text-slate-700">归档参数验证:</div>
                <div className="text-slate-500 mt-0.5">归档人员: Ian Huang (SH/AQPP)</div>
                <div className="text-slate-500">归档时间: {new Date().toISOString().slice(0, 16).replace('T', ' ')}</div>
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
                确认上传并触发 AI 校验
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
