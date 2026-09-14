import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Funnel,
  Globe2,
  Mail,
  PenLine,
  RefreshCcw,
  Save,
  Search,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import { shitUiNewVersionSourceRows } from './shitUiNewVersionData';
import './shitui.css';

type ShitUiPage = 'current' | 'new-version';

interface ShitUiWorkspaceProps {
  page: ShitUiPage;
}

type StickyStyle = React.CSSProperties | undefined;

interface EditableCellProps {
  children: React.ReactNode;
  className?: string;
  stickyStyle?: StickyStyle;
}

interface SelectCellProps {
  value: string;
  options: string[];
  className?: string;
  stickyStyle?: StickyStyle;
  onChange: (value: string) => void;
}

interface StatusCellProps {
  value: string;
  type: 'upload' | 'check';
  className?: string;
  stickyStyle?: StickyStyle;
}

interface LinkCellProps {
  href: string;
  className?: string;
  stickyStyle?: StickyStyle;
}

interface ScrollableLinesCellProps {
  lines: string[];
  className?: string;
  stickyStyle?: StickyStyle;
  scrollRef?: React.Ref<HTMLDivElement>;
  onScroll?: React.UIEventHandler<HTMLDivElement>;
  renderLine?: (line: string, index: number) => React.ReactNode;
}

interface ToolButtonProps {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  primary?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const baseRows = [
  {
    report: 'All',
    process: 'Sales',
    id: '115.2.14',
    description:
      'For performance obligations satisfied at a point in time, revenue is not recognised in the correct accounting period.',
    account: 'Revenue',
    assertions: ['v', 'v', '', '', '', ''],
    assessment:
      'For point-in-time obligations, the likelihood and magnitude of misstatement are assessed as low, so the RMM is Base.',
    level: 'Base',
    fraud: 'No',
    rcm: 'N',
    procedure: 'GOSPD01031 Sales - cut-off test (before period end)',
    nature: 'Inspection',
    extent: 'All items',
    template: 'https://example.com/kcw-template-115-2-14',
    evidence: '',
    misstatement: '',
    draftUploaded: 'positive',
    draftStatus: 'positive',
    action: '',
  },
  {
    report: 'All',
    process: 'Sales',
    id: '115.2.02',
    description:
      'Revenue is recognised for arrangements that do not meet the definition of a contract under the standard, or do not exist.',
    account: 'Contract liabilities',
    assertions: ['', 'v', '', '', 'v', ''],
    assessment:
      'The entity has many franchise customers and a large volume of revenue contracts. The inherent risk remains Base.',
    level: 'Base',
    fraud: 'No',
    rcm: 'N',
    procedure: 'GOSPD01002 Franchise revenue - external confirmation',
    nature: 'Inspection; Confirmation',
    extent: 'Substantive sampling:MUS',
    template: 'https://example.com/kcw-template-115-2-02',
    evidence: '',
    misstatement: '',
    draftUploaded: 'positive',
    draftStatus: 'negative',
    action: '',
  },
  {
    report: 'All',
    process: 'Sales',
    id: '115.2.08',
    description:
      'Sales prices, discounts, or variable consideration are not recorded in accordance with contract terms, causing inaccurate revenue recognition.',
    account: 'Trade receivables',
    assertions: ['v', '', 'v', '', '', ''],
    assessment:
      'There are many customers and discount approvals depend on system configuration and approval trails, so the inherent risk is Base.',
    level: 'Base',
    fraud: 'No',
    rcm: 'N',
    procedure: 'GOSPD01018 Sales pricing review - sample test',
    nature: 'Inspection; Recalculation',
    extent: 'Targeted sample',
    template: 'https://example.com/kcw-template-115-2-08',
    evidence: '',
    misstatement: '',
    draftUploaded: 'negative',
    draftStatus: 'negative',
    action: '',
  },
  {
    report: 'All',
    process: 'Sales',
    id: '115.2.21',
    description:
      'Revenue recognised at a point in time may be overstated because management incentives, manual overrides, and cut-off pressure increase the risk of misstatement.',
    account: 'Revenue',
    assertions: ['v', 'v', '', '', '', ''],
    assessment:
      'The entity recognises a substantial volume of point-in-time revenue near period end, with fraud factors and management bias present. We therefore assess the inherent risk level as Significant.',
    level: 'Significant',
    fraud: 'Yes',
    rcm: 'N',
    procedure: 'N/A',
    procedureLines: [
      'GOSPD01002 Franchise revenue - external confirmation',
      'SAP1 Revenue anti-fraud analytical procedure',
      'SPD01902 Gross margin trend analysis',
      'TOD2 Bank flow inspection',
      'TOD1 Franchise revenue recalculation',
      'Subsequent cash receipt tracing',
    ],
    nature: 'N/A',
    natureLines: ['Inspection;', 'Predictive', 'Trend analysis;', 'Inspection', 'Inspection;', 'Recalculation'],
    extent: 'N/A',
    extentLines: ['Substantive', 'N/A', 'N/A', 'All items', 'Targeted sample', 'Judgmental'],
    template: 'https://example.com/kcw-template-115-2-21',
    templateLines: [
      'https://example.com/kcw-template-115-2-21-a',
      'https://example.com/kcw-template-115-2-21-b',
      'https://example.com/kcw-template-115-2-21-c',
      'https://example.com/kcw-template-115-2-21-d',
      'https://example.com/kcw-template-115-2-21-e',
      'https://example.com/kcw-template-115-2-21-f',
    ],
    evidence: 'N/A',
    evidenceLines: ['Not Selected', 'Not Selected', 'Not Selected', 'Not Selected', 'Not Selected', 'Not Selected'],
    misstatement: 'N/A',
    misstatementLines: ['N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A'],
    draftUploaded: 'positive',
    draftUploadedLines: ['positive', 'positive', 'positive', 'positive', 'positive', 'positive'],
    draftStatus: 'positive',
    draftStatusLines: ['positive', 'positive', 'negative', 'positive', 'negative', 'positive'],
    action: 'N/A',
    actionLines: ['icons', 'icons', 'icons', 'icons', 'icons', 'icons'],
  },
];

const uploaders = [
  'Huang, Ian (SH/AQPP)',
  'Lu, Lois (HZ/CP1)',
  'Hu, Freya (BJ/CP3)',
];

const entityOptions = ['All', 'XYZ Company', 'KIEA Company'];

const newVersionRows = shitUiNewVersionSourceRows.map((sourceRow, index) => {
  const draftUploaded = index % 5 === 2 ? 'negative' : 'positive';
  const draftStatus = draftUploaded === 'negative' ? 'negative' : index % 4 === 1 ? 'negative' : 'positive';
  const uploadedBy = uploaders[index % uploaders.length];
  const uploadedAt = `2026-07-${String((index % 18) + 2).padStart(2, '0')} ${String(9 + (index % 8)).padStart(2, '0')}:${index % 2 === 0 ? '15' : '45'}`;

  return {
    ...sourceRow,
    id: `new-version-${sourceRow.sourceId}-${index}`,
    procedure: `${sourceRow.procedureId} ${sourceRow.procedureDescription}`.trim(),
    wpLink: 'KCw WP Hyper link',
    usesKcwStandardWorkingPaper: draftUploaded === 'negative' ? 'No' as const : 'Yes' as const,
    evidence: draftUploaded === 'negative' ? 'Not Selected' : 'Yes',
    misstatement: '',
    draftUploaded,
    draftStatus,
    uploadedBy,
    uploadedAt,
    action: 'icons',
  };
});

function renderDraftStatus(value, type, uploadedBy = '', uploadedAt = '') {
  const isPositive = value === 'positive';

  return (
    <span className="status-line">
      <span className={isPositive ? 'status-dot positive' : 'status-dot negative'} />
      {type === 'upload' && isPositive ? (
        <span className="upload-details">
          <span>{uploadedBy}</span>
          <span className="upload-time">{uploadedAt}</span>
        </span>
      ) : (
        <span>{type === 'upload' ? '未上传' : isPositive ? '已通过' : '未通过'}</span>
      )}
    </span>
  );
}

const assertionLabels = ['C', 'E', 'A', 'V', 'O', 'P'];

const selectOptions = {
  process: ['Sales', 'Procurement', 'Inventory', 'Treasury', 'Payroll'],
  account: ['Revenue', 'Contract liabilities', 'Trade receivables', 'Cash', 'Inventory'],
  extent: ['All items', 'Targeted sample', 'Substantive sampling:MUS', 'Controls sample', 'Judgmental sample'],
};

const columns = [
  { key: 'report', label: 'Tagged Reports', width: 59, section: 'left', sticky: 'left', className: 'c-report' },
  { key: 'process', label: 'Business process', width: 96, section: 'left', sticky: 'left', className: 'c-process', editor: 'select' },
  { key: 'id', label: 'RMM ID', width: 137, section: 'left', sticky: 'left', className: 'c-id' },
  { key: 'description', label: 'RMM description', width: 382, section: 'left', sticky: 'left', className: 'c-desc wrap' },
  { key: 'account', label: 'counts / disclosures', width: 120, section: 'left', className: 'c-account', editor: 'select' },
  { key: 'assessment', label: 'Assessment of inherent risk - likelihood and magnitude', width: 234, section: 'left', className: 'c-assess wrap' },
  { key: 'level', label: 'Level of inherent risk', width: 63, section: 'right', className: 'c-level risk-level' },
  { key: 'fraud', label: 'Fraud risk?', width: 63, section: 'right', className: 'c-fraud' },
  { key: 'rcm', label: 'RMM Control risk assessment', width: 63, section: 'right', className: 'c-rcm' },
  { key: 'procedure', label: 'Substantive procedure description', width: 204, section: 'right', className: 'c-procedure wrap response-col' },
  { key: 'nature', label: 'Nature', width: 96, section: 'right', className: 'c-nature response-col' },
  { key: 'extent', label: 'Extent (Test of Details)', width: 111, section: 'right', className: 'c-extent response-col', editor: 'select' },
  { key: 'template', label: 'KCw standard working paper templates', width: 95, section: 'right', className: 'c-template response-col' },
  { key: 'evidence', label: 'Expected evidence obtained', width: 95, section: 'right', className: 'c-evidence response-col' },
  { key: 'misstatement', label: 'Audit misstatement', width: 95, section: 'right', className: 'c-misstatement response-col' },
  { key: 'draftUploaded', label: '底稿是否上传？', width: 90, section: 'right', className: 'c-draft-uploaded draft-col' },
  { key: 'draftStatus', label: '检测状态', width: 100, section: 'right', className: 'c-draft-status draft-col' },
  { key: 'action', label: '操作', width: 80, section: 'right', sticky: 'right', className: 'c-draft-action draft-col' },
];

const scrollSyncColumns = new Set([
  'procedure',
  'nature',
  'extent',
  'template',
  'evidence',
  'misstatement',
  'draftUploaded',
  'draftStatus',
  'action',
]);

function EditableCell({ children, className = '', stickyStyle }: EditableCellProps) {
  const cellClassName = [className, stickyStyle ? 'sticky-cell' : ''].filter(Boolean).join(' ');

  return (
    <td className={cellClassName} style={stickyStyle}>
      <div contentEditable suppressContentEditableWarning spellCheck="false" className="editable">
        {children}
      </div>
    </td>
  );
}

function SelectCell({ value, options, className = '', stickyStyle, onChange }: SelectCellProps) {
  const cellClassName = [className, stickyStyle ? 'sticky-cell' : ''].filter(Boolean).join(' ');

  return (
    <td className={cellClassName} style={stickyStyle}>
      <div className="select-shell">
        <select className="cell-select" value={value} onChange={(event) => onChange(event.target.value)}>
          <option value=""></option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </td>
  );
}

function StatusCell({ value, type, className = '', stickyStyle }: StatusCellProps) {
  const cellClassName = [className, stickyStyle ? 'sticky-cell' : ''].filter(Boolean).join(' ');
  const isPositive = value === 'positive';
  const label = type === 'upload' ? (isPositive ? '已上传' : '未上传') : isPositive ? '已通过' : '未通过';

  return (
    <td className={cellClassName} style={stickyStyle}>
      <div className="status-indicator">
        <span className={isPositive ? 'status-dot positive' : 'status-dot negative'} />
        <span>{label}</span>
      </div>
    </td>
  );
}

function LinkCell({ href, className = '', stickyStyle }: LinkCellProps) {
  const cellClassName = [className, stickyStyle ? 'sticky-cell' : ''].filter(Boolean).join(' ');

  return (
    <td className={cellClassName} style={stickyStyle}>
      <div className="link-cell">
        <a href={href} className="table-link" target="_blank" rel="noreferrer">
          KCw template
        </a>
      </div>
    </td>
  );
}

function ActionIcons() {
  return (
    <div className="action-icons">
      <button type="button" className="action-icon-button" aria-label="view" title="View">
        <Eye size={12} />
      </button>
      <button type="button" className="action-icon-button" aria-label="edit" title="Edit">
        <PenLine size={12} />
      </button>
      <button type="button" className="action-icon-button" aria-label="upload" title="Upload">
        <Upload size={12} />
      </button>
    </div>
  );
}

function ScrollableLinesCell({ lines, className = '', stickyStyle, scrollRef, onScroll, renderLine }: ScrollableLinesCellProps) {
  const cellClassName = [className, stickyStyle ? 'sticky-cell' : ''].filter(Boolean).join(' ');

  return (
    <td className={cellClassName} style={stickyStyle}>
      <div ref={scrollRef} className="multiline-scroll" onScroll={onScroll}>
        {lines.map((line, index) => (
          <div key={`${index}-${String(line)}`} className="multiline-line">
            {renderLine ? renderLine(line, index) : line || 'N/A'}
          </div>
        ))}
      </div>
    </td>
  );
}

function ToolButton({ icon: Icon, label, primary = false, onClick }: ToolButtonProps) {
  const className = primary ? 'tool-button primary' : 'tool-button';

  return (
    <button className={className} type="button" aria-label={label} title={label} onClick={onClick}>
      <Icon size={15} />
      <span>{label}</span>
    </button>
  );
}

function ShitUiWorkspace({ page }: ShitUiWorkspaceProps) {
  const [tableRows, setTableRows] = useState(baseRows);
  const [searchTerm, setSearchTerm] = useState('');
  const [processFilter, setProcessFilter] = useState<string[]>([]);
  const [uploadFilter, setUploadFilter] = useState<string[]>([]);
  const [checkFilter, setCheckFilter] = useState<string[]>([]);
  const [openFilter, setOpenFilter] = useState<'process' | 'draftUploaded' | 'draftStatus' | null>(null);
  const [selectedEntity, setSelectedEntity] = useState('All');
  const [isEntityMenuOpen, setIsEntityMenuOpen] = useState(false);
  const [workingPaperSearches, setWorkingPaperSearches] = useState<Record<string, string>>({});
  const [newVersionPage, setNewVersionPage] = useState(1);
  const [newVersionPageSize, setNewVersionPageSize] = useState<15 | 30>(15);
  const [kcwWorkingPaperChoices, setKcwWorkingPaperChoices] = useState<Record<string, 'Yes' | 'No'>>(() =>
    Object.fromEntries(
      newVersionRows.map((row) => [row.id, row.usesKcwStandardWorkingPaper]),
    ) as Record<string, 'Yes' | 'No'>,
  );
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTransferUrlConfirmed, setIsTransferUrlConfirmed] = useState(false);
  const [processUrlRows, setProcessUrlRows] = useState(() =>
    Array.from(new Set(newVersionRows.map((row) => row.process))).map((process, index) => ({
      id: `${index}-${process}`,
      process,
      url: '',
    })),
  );
  const scrollGroupsRef = useRef<Record<string, Record<string, HTMLDivElement | null>>>({});

  const leftColumns = columns.filter((column) => column.section === 'left' && column.key !== 'assessment');
  const rightColumns = columns.filter((column) => !leftColumns.includes(column));
  const visibleBodyColumnCount = columns.length + assertionLabels.length;
  const leftSectionSpan = columns.filter((column) => column.section === 'left').length + assertionLabels.length;
  const rightSectionSpan = visibleBodyColumnCount - leftSectionSpan;

  const stickyStyles = useMemo(() => {
    const styles = {};
    let leftOffset = 0;

    columns.forEach((column) => {
      if (column.sticky === 'left') {
        styles[column.key] = { left: `${leftOffset}px` };
        leftOffset += column.width;
      }
    });

    columns.forEach((column) => {
      if (column.sticky === 'right') {
        styles[column.key] = { right: '0px' };
      }
    });

    return styles;
  }, []);

  const tableWidth = columns.reduce((sum, column) => sum + column.width, 0) + assertionLabels.length * 24;

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const processFilterOptions = useMemo(
    () => Array.from(new Set(newVersionRows.map((row) => row.process))).sort(),
    [],
  );
  const filteredRows = tableRows.filter((row) => {
    if (!normalizedSearch) {
      return true;
    }

    return [
      row.report,
      row.process,
      row.id,
      row.description,
      row.account,
      row.assessment,
      row.level,
      row.fraud,
      row.rcm,
      row.procedure,
      row.nature,
      row.extent,
      row.template,
      row.evidence,
      row.misstatement,
      ...row.assertions,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch);
  });

  const filteredNewVersionRows = newVersionRows.filter((row) => {
    const displayedUploadStatus = kcwWorkingPaperChoices[row.id] === 'No' ? 'negative' : 'positive';
    const displayedCheckStatus =
      kcwWorkingPaperChoices[row.id] === 'No' ? 'negative' : row.draftStatus;

    if (processFilter.length > 0 && !processFilter.includes(row.process)) {
      return false;
    }
    if (uploadFilter.length > 0) {
      const matchesUploadFilter = uploadFilter.some((value) => {
        if (value === displayedUploadStatus) {
          return true;
        }
        if (value.startsWith('uploader:') && displayedUploadStatus === 'positive') {
          return row.uploadedBy === value.slice('uploader:'.length);
        }
        return false;
      });

      if (!matchesUploadFilter) {
        return false;
      }
    }
    if (checkFilter.length > 0 && !checkFilter.includes(displayedCheckStatus)) {
      return false;
    }
    if (!normalizedSearch) {
      return true;
    }

    return [
      row.sourceId,
      row.process,
      row.account,
      row.rmId,
      row.procedureId,
      row.procedureDescription,
      row.procedureType,
      row.extent,
      row.wpLink,
      row.evidence,
      row.uploadedBy,
      row.uploadedAt,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch);
  });
  const newVersionPageCount = Math.max(1, Math.ceil(filteredNewVersionRows.length / newVersionPageSize));
  const activeNewVersionPage = Math.min(newVersionPage, newVersionPageCount);
  const paginatedNewVersionRows = filteredNewVersionRows.slice(
    (activeNewVersionPage - 1) * newVersionPageSize,
    activeNewVersionPage * newVersionPageSize,
  );

  useEffect(() => {
    setNewVersionPage(1);
  }, [searchTerm, processFilter, uploadFilter, checkFilter, newVersionPageSize]);

  const updateRowField = (rowId: string, key: string, value: string) => {
    setTableRows((current) => current.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)));
  };

  const updateKcwWorkingPaperChoice = (rowId: string, value: 'Yes' | 'No') => {
    setKcwWorkingPaperChoices((current) => ({ ...current, [rowId]: value }));
  };

  const updateProcessUrlRow = (rowId: string, key: 'process' | 'url', value: string) => {
    setIsTransferUrlConfirmed(false);
    setProcessUrlRows((current) => current.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)));
  };

  const openTransferModal = () => {
    setIsTransferUrlConfirmed(false);
    setIsTransferModalOpen(true);
  };

  const closeTransferModal = () => {
    setIsTransferUrlConfirmed(false);
    setIsTransferModalOpen(false);
  };

  const registerScrollCell = (rowId: string, key: string, node: HTMLDivElement | null) => {
    if (!scrollGroupsRef.current[rowId]) {
      scrollGroupsRef.current[rowId] = {};
    }
    if (node) {
      scrollGroupsRef.current[rowId][key] = node;
    } else {
      delete scrollGroupsRef.current[rowId][key];
    }
  };

  const syncScrollGroup = (rowId: string, sourceKey: string, scrollTop: number) => {
    const group = scrollGroupsRef.current[rowId];
    if (!group) {
      return;
    }
    Object.entries(group).forEach(([key, node]) => {
      if (key !== sourceKey && node && node.scrollTop !== scrollTop) {
        node.scrollTop = scrollTop;
      }
    });
  };

  const renderDataCell = (row: (typeof baseRows)[number], column: (typeof columns)[number]) => {
    const cellClassName = [column.className, row.level === 'Significant' && column.key === 'level' ? 'significant-level' : '']
      .filter(Boolean)
      .join(' ');

    if (row.level === 'Significant' && scrollSyncColumns.has(column.key) && Array.isArray(row[`${column.key}Lines`])) {
      const renderLine = (line: string) => {
        if (column.key === 'template') {
          return (
            <a href={line} className="table-link" target="_blank" rel="noreferrer">
              KCw template
            </a>
          );
        }
        if (column.key === 'draftUploaded' || column.key === 'draftStatus') {
          const isPositive = line === 'positive';
          const label = column.key === 'draftUploaded' ? (isPositive ? '已上传' : '未上传') : isPositive ? '已通过' : '未通过';
          return (
            <span className="status-line">
              <span className={isPositive ? 'status-dot positive' : 'status-dot negative'} />
              <span>{label}</span>
            </span>
          );
        }
        if (column.key === 'action') {
          return (
            <span className="action-line">
              <ActionIcons />
            </span>
          );
        }
        return line || 'N/A';
      };

      return (
        <ScrollableLinesCell
          key={`${row.id}-${column.key}`}
          lines={row[`${column.key}Lines`]}
          className={cellClassName}
          stickyStyle={stickyStyles[column.key]}
          scrollRef={(node) => registerScrollCell(row.id, column.key, node)}
          onScroll={(event) => syncScrollGroup(row.id, column.key, event.currentTarget.scrollTop)}
          renderLine={renderLine}
        />
      );
    }

    if (column.key === 'template' && row.template) {
      return <LinkCell key={`${row.id}-${column.key}`} href={row.template} className={cellClassName} stickyStyle={stickyStyles[column.key]} />;
    }

    if (column.key === 'action') {
      return (
        <td key={`${row.id}-${column.key}`} className={[cellClassName, stickyStyles[column.key] ? 'sticky-cell' : ''].filter(Boolean).join(' ')} style={stickyStyles[column.key]}>
          <div className="action-cell">
            <ActionIcons />
          </div>
        </td>
      );
    }

    if (column.key === 'draftUploaded' || column.key === 'draftStatus') {
      return (
        <StatusCell
          key={`${row.id}-${column.key}`}
          value={row[column.key]}
          type={column.key === 'draftUploaded' ? 'upload' : 'check'}
          className={cellClassName}
          stickyStyle={stickyStyles[column.key]}
        />
      );
    }

    if (column.editor === 'select') {
      return (
        <SelectCell
          key={`${row.id}-${column.key}`}
          value={row[column.key]}
          options={selectOptions[column.key]}
          className={cellClassName}
          stickyStyle={stickyStyles[column.key]}
          onChange={(value) => updateRowField(row.id, column.key, value)}
        />
      );
    }

    return (
      <EditableCell key={`${row.id}-${column.key}`} className={cellClassName} stickyStyle={stickyStyles[column.key]}>
        {row[column.key]}
      </EditableCell>
    );
  };

  const renderEntitySelector = () => (
    <p className="entity-row">
      <span>Entity:</span>
      <span className="entity-selector">
        <button
          type="button"
          className="entity-selector-button"
          aria-haspopup="listbox"
          aria-expanded={isEntityMenuOpen}
          onClick={() => setIsEntityMenuOpen((current) => !current)}
        >
          {selectedEntity}
          <ChevronDown size={13} />
        </button>
        {isEntityMenuOpen && (
          <span className="entity-selector-menu" role="listbox" aria-label="选择 Entity">
            {entityOptions.map((entity) => (
              <button
                type="button"
                role="option"
                aria-selected={selectedEntity === entity}
                key={entity}
                onClick={() => {
                  setSelectedEntity(entity);
                  setIsEntityMenuOpen(false);
                }}
              >
                {entity}
              </button>
            ))}
          </span>
        )}
      </span>
    </p>
  );

  return (
    <main className={`app-shell${page === 'new-version' ? ' new-version-shell' : ''}`}>
      <header className="banner" aria-label="Audit Application Platform banner">
        <div className="brand-lockup">
          <span className="kpmg-mark">KPMG</span>
          <span className="platform-name">Substantive audit document management platform</span>
        </div>
        <nav className="banner-actions" aria-label="application controls">
          <button type="button" className="banner-link">
            Chinese Mainland
            <ChevronDown size={10} />
          </button>
          <button type="button" className="banner-icon" aria-label="language">
            <Globe2 size={12} />
            <ChevronDown size={9} />
          </button>
          <button type="button" className="banner-icon" aria-label="messages">
            <Mail size={11} />
          </button>
          <button type="button" className="banner-user">
            <UserRound size={12} />
            <span>Ian Huang</span>
            <ChevronDown size={10} />
          </button>
        </nav>
      </header>

      <div className="app-body">
        <div className="page-area">
          {page === 'current' ? (
            <>
              <section className="workspace">
                <div className="page-head">
                  <div>
                    <h1>1310956 - ABC Limited Co.</h1>
                    {renderEntitySelector()}
                    <p className="period-text">会计期间: 2026年1月1日至2026年12月31日</p>
                  </div>
                  <div className="status-strip" aria-label="table status">
                    <div>
                      <strong>{filteredNewVersionRows.length}</strong>
                      <span>Risks</span>
                    </div>
                    <div>
                      <strong>{filteredNewVersionRows.length}</strong>
                      <span>Procedures</span>
                    </div>
                  </div>
                </div>

                <div className="control-bar">
                  <label className="search-box">
                    <Search size={15} />
                    <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search RMM ID, process, account" />
                    <button type="button" className="search-reset" aria-label="reset search" title="Reset search" onClick={() => setSearchTerm('')} disabled={!searchTerm}>
                      <RefreshCcw color="#6871e8" strokeWidth={2.25} size={14} />
                    </button>
                  </label>

                  <div className="tools">
                    <ToolButton icon={RefreshCcw} label="更新数据" />
                    <button type="button" className="tool-button significance-button" aria-label="同步附件至KCW">
                      <span>同步附件至KCW</span>
                    </button>
                    <ToolButton icon={Download} label="Export" />
                    <ToolButton icon={Save} label="Save" primary />
                  </div>
                </div>
              </section>

              <section className="table-frame" aria-label="editable audit risk table">
                <div className="table-scroll">
                  <table className="audit-table" style={{ width: `${tableWidth}px` }}>
                    <colgroup>
                      {leftColumns.map((column) => (
                        <col key={column.key} className={column.className.split(' ')[0]} />
                      ))}
                      {assertionLabels.map((label) => (
                        <col key={label} className="c-assert" />
                      ))}
                      {rightColumns.map((column) => (
                        <col key={column.key} className={column.className.split(' ')[0]} />
                      ))}
                    </colgroup>
                    <thead>
                      <tr className="section-row">
                        <th colSpan={leftSectionSpan}>Assessment of the identified risks of material misstatement<br />对识别出的重大错报风险的评估</th>
                        <th colSpan={rightSectionSpan}>Audit responses for each risk of material misstatement<br />对每项重大错报风险的审计应对措施</th>
                      </tr>
                      <tr className="main-head">
                        {leftColumns.map((column) => (
                          <th key={column.key} rowSpan={2} className={stickyStyles[column.key] ? 'sticky-cell' : ''} style={stickyStyles[column.key]}>
                            {column.label}
                          </th>
                        ))}
                        <th colSpan={6}>ASSERTIONS<br />认定</th>
                        {rightColumns.map((column) => {
                          const headerClass = column.className.includes('draft-col')
                            ? 'draft-head'
                            : column.className.includes('response-col')
                              ? 'response-head'
                              : '';

                          return (
                            <th key={column.key} rowSpan={2} className={[headerClass, stickyStyles[column.key] ? 'sticky-cell' : ''].filter(Boolean).join(' ')} style={stickyStyles[column.key]}>
                              {column.label}
                            </th>
                          );
                        })}
                      </tr>
                      <tr className="assert-row">
                        {assertionLabels.map((label) => (
                          <th key={label}>{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => (
                        <tr key={row.id}>
                          {leftColumns.map((column) => renderDataCell(row, column))}
                          {row.assertions.map((value, index) => (
                            <EditableCell key={`${row.id}-assert-${assertionLabels[index]}`} className="assertion">
                              {value}
                            </EditableCell>
                          ))}
                          {rightColumns.map((column) => renderDataCell(row, column))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <section className="workspace new-version-page">
              <div className="new-version-sticky-area">
                <div className="page-head">
                  <div>
                    <h1>1310956 - ABC Limited Co.</h1>
                    {renderEntitySelector()}
                    <p className="period-text">会计期间: 2026年1月1日至2026年12月31日</p>
                  </div>
                  <div className="new-version-status-group">
                    <button type="button" className="new-version-level-button">
                      重要性水平
                    </button>
                    <div className="status-strip" aria-label="table status">
                      {/* <div>
                        <strong>{filteredRows.length}</strong>
                        <span>Risks</span>
                      </div> */}
                      <div>
                        <strong>{filteredNewVersionRows.length}</strong>
                        <span>Procedures</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="control-bar new-version-control-bar">
                  <label className="search-box">
                    <Search size={15} />
                    <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search RMM ID, process, account" />
                    <button type="button" className="search-reset" aria-label="reset search" title="Reset search" onClick={() => setSearchTerm('')} disabled={!searchTerm}>
                      <RefreshCcw color="#6871e8" strokeWidth={2.25} size={14} />
                    </button>
                  </label>

                  <div className="tools">
                    <ToolButton icon={RefreshCcw} label="更新数据" />
                    <button
                      type="button"
                      className="tool-button significance-button"
                      aria-label="同步附件至KCW"
                      onClick={openTransferModal}
                    >
                      <span>同步附件至KCW</span>
                    </button>
                    <ToolButton icon={Download} label="Export" />
                    <div className="new-version-pagination" aria-label="分页导航">
                      <label className="new-version-page-size">
                        <span>每页</span>
                        <select
                          value={newVersionPageSize}
                          aria-label="每页显示行数"
                          onChange={(event) => setNewVersionPageSize(Number(event.target.value) as 15 | 30)}
                        >
                          <option value={15}>15</option>
                          <option value={30}>30</option>
                        </select>
                        <span>条</span>
                      </label>
                      <button
                        type="button"
                        aria-label="上一页"
                        title="上一页"
                        disabled={activeNewVersionPage === 1}
                        onClick={() => setNewVersionPage((current) => Math.max(1, current - 1))}
                      >
                        <ChevronLeft size={15} />
                      </button>
                      <span className="new-version-page-indicator">
                        {activeNewVersionPage}/{newVersionPageCount}
                      </span>
                      <button
                        type="button"
                        aria-label="下一页"
                        title="下一页"
                        disabled={activeNewVersionPage === newVersionPageCount}
                        onClick={() => setNewVersionPage((current) => Math.min(newVersionPageCount, current + 1))}
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="new-version-header-row" role="table" aria-label="new version header">
                  {[
                    { key: 'sourceId', label: 'ID' },
                    { key: 'process', label: '业务流程' },
                    { key: 'account', label: '账户/披露' },
                    { key: 'rmId', label: 'RM ID' },
                    { key: 'procedureId', label: '程序ID' },
                    { key: 'procedureDescription', label: '实质性程序描述' },
                    { key: 'procedureType', label: '实质性程序类型' },
                    { key: 'extent', label: '范围（细节测试）' },
                    { key: 'wpLink', label: 'KCw 标准工作底稿模板' },
                    { key: 'usesKcw', label: '是否使用KCw标准工作底稿模板' },
                    { key: 'evidence', label: '项目组是否已从实质性程序中获取了预期的证据？' },
                    { key: 'misstatement', label: '审计错报' },
                    { key: 'draftUploaded', label: '底稿是否上传' },
                    { key: 'draftStatus', label: '底稿是否通过检验' },
                    { key: 'action', label: '操作' },
                  ].map(({ key, label }) => (
                    <div key={key} className="new-version-header-cell" role="columnheader">
                      <span>{label}</span>
                      {key === 'process' && (
                        <div className="new-version-filter">
                          <button
                            type="button"
                            className={`new-version-filter-button${processFilter.length > 0 ? ' active' : ''}`}
                            aria-label="筛选业务流程"
                            aria-expanded={openFilter === 'process'}
                            onClick={() => setOpenFilter((current) => current === 'process' ? null : 'process')}
                          >
                            <Funnel size={12} />
                          </button>
                          {openFilter === 'process' && (
                            <div className="new-version-filter-menu" role="menu" aria-label="筛选业务流程选项">
                              {[
                                { value: '', label: '全部' },
                                ...processFilterOptions.map((option) => ({ value: option, label: option })),
                              ].map((option) => (
                                <button
                                  type="button"
                                  role="menuitemcheckbox"
                                  aria-checked={option.value === '' ? processFilter.length === 0 : processFilter.includes(option.value)}
                                  key={option.value || 'all'}
                                  onClick={() => {
                                    setProcessFilter((current) =>
                                      option.value === ''
                                        ? []
                                        : current.includes(option.value)
                                          ? current.filter((value) => value !== option.value)
                                          : [...current, option.value],
                                    );
                                  }}
                                >
                                  <span className="new-version-filter-check" aria-hidden="true">
                                    {(option.value === '' ? processFilter.length === 0 : processFilter.includes(option.value)) ? '✓' : ''}
                                  </span>
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {key === 'draftUploaded' && (
                        <div className="new-version-filter">
                          <button
                            type="button"
                            className={`new-version-filter-button${uploadFilter.length > 0 ? ' active' : ''}`}
                            aria-label="筛选底稿是否上传"
                            aria-expanded={openFilter === 'draftUploaded'}
                            onClick={() => setOpenFilter((current) => current === 'draftUploaded' ? null : 'draftUploaded')}
                          >
                            <Funnel size={12} />
                          </button>
                          {openFilter === 'draftUploaded' && (
                            <div className="new-version-filter-menu" role="menu" aria-label="筛选底稿是否上传选项">
                              {[
                                { value: '', label: '全部' },
                                { value: 'positive', label: '已上传' },
                                { value: 'negative', label: '未上传' },
                                ...uploaders.map((uploader) => ({
                                  value: `uploader:${uploader}`,
                                  label: uploader,
                                })),
                              ].map((option) => (
                                <button
                                  type="button"
                                  role="menuitemcheckbox"
                                  aria-checked={option.value === '' ? uploadFilter.length === 0 : uploadFilter.includes(option.value)}
                                  key={option.value || 'all'}
                                  title={option.label}
                                  onClick={() => {
                                    setUploadFilter((current) =>
                                      option.value === ''
                                        ? []
                                        : current.includes(option.value)
                                          ? current.filter((value) => value !== option.value)
                                          : [...current, option.value],
                                    );
                                  }}
                                >
                                  <span className="new-version-filter-check" aria-hidden="true">
                                    {(option.value === '' ? uploadFilter.length === 0 : uploadFilter.includes(option.value)) ? '✓' : ''}
                                  </span>
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {key === 'draftStatus' && (
                        <div className="new-version-filter">
                          <button
                            type="button"
                            className={`new-version-filter-button${checkFilter.length > 0 ? ' active' : ''}`}
                            aria-label="筛选底稿是否通过检验"
                            aria-expanded={openFilter === 'draftStatus'}
                            onClick={() => setOpenFilter((current) => current === 'draftStatus' ? null : 'draftStatus')}
                          >
                            <Funnel size={12} />
                          </button>
                          {openFilter === 'draftStatus' && (
                            <div className="new-version-filter-menu" role="menu" aria-label="筛选底稿是否通过检验选项">
                              {[
                                { value: '', label: '全部' },
                                { value: 'positive', label: '已通过' },
                                { value: 'negative', label: '未通过' },
                              ].map((option) => (
                                <button
                                  type="button"
                                  role="menuitemcheckbox"
                                  aria-checked={option.value === '' ? checkFilter.length === 0 : checkFilter.includes(option.value)}
                                  key={option.value || 'all'}
                                  onClick={() => {
                                    setCheckFilter((current) =>
                                      option.value === ''
                                        ? []
                                        : current.includes(option.value)
                                          ? current.filter((value) => value !== option.value)
                                          : [...current, option.value],
                                    );
                                  }}
                                >
                                  <span className="new-version-filter-check" aria-hidden="true">
                                    {(option.value === '' ? checkFilter.length === 0 : checkFilter.includes(option.value)) ? '✓' : ''}
                                  </span>
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="new-version-surface">
                <div className="new-version-body" role="rowgroup">
                  {paginatedNewVersionRows.map((row, index) => (
                    <div key={`${row.procedure}-${index}`} className="new-version-data-row" role="row">
                      <div className="new-version-data-cell">{row.sourceId}</div>
                      <div className="new-version-data-cell">{row.process}</div>
                      <div className="new-version-data-cell">{row.account}</div>
                      <div className="new-version-data-cell">{row.rmId}</div>
                      <div className="new-version-data-cell">{row.procedureId}</div>
                      <div className="new-version-data-cell">{row.procedureDescription}</div>
                      <div className="new-version-data-cell">{row.procedureType}</div>
                      <div className="new-version-data-cell">{row.extent}</div>
                      <div className={`new-version-data-cell${/^(TT|CNSP|SAP)/.test(row.procedureId) ? ' working-paper-search-cell' : ''}`}>
                        {/^(TT|CNSP|SAP)/.test(row.procedureId) ? (
                          <label className="working-paper-search">
                            <Search size={12} aria-hidden="true" />
                            <input
                              type="search"
                              value={workingPaperSearches[row.id] ?? ''}
                              aria-label={`${row.procedureId} 查询KCw标准工作底稿`}
                              placeholder="查询"
                              onChange={(event) =>
                                setWorkingPaperSearches((current) => ({
                                  ...current,
                                  [row.id]: event.target.value,
                                }))
                              }
                            />
                          </label>
                        ) : (
                          <a href="https://example.com/kcw-wp" className="table-link" target="_blank" rel="noreferrer">
                            {row.wpLink}
                          </a>
                        )}
                      </div>
                      <div className="new-version-data-cell new-version-choice-cell">
                        <select
                          className="new-version-choice-select"
                          value={kcwWorkingPaperChoices[row.id]}
                          aria-label={`${row.procedure} 是否使用KCw标准工作底稿`}
                          onChange={(event) => updateKcwWorkingPaperChoice(row.id, event.target.value as 'Yes' | 'No')}
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div className="new-version-data-cell">{row.evidence}</div>
                      <div className="new-version-data-cell">{row.misstatement}</div>

                      <div className="new-version-data-cell">
                        {renderDraftStatus(
                          kcwWorkingPaperChoices[row.id] === 'No' ? 'negative' : 'positive',
                          'upload',
                          row.uploadedBy,
                          row.uploadedAt,
                        )}
                      </div>
                      <div className="new-version-data-cell">
                        {renderDraftStatus(kcwWorkingPaperChoices[row.id] === 'No' ? 'negative' : row.draftStatus, 'check')}
                      </div>
                      <div className="new-version-data-cell">
                        <ActionIcons />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {isTransferModalOpen && (
                <div className="transfer-modal-backdrop" role="presentation" onMouseDown={closeTransferModal}>
                  <section
                    className="transfer-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="transfer-modal-title"
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <div className="transfer-modal-header">
                      <h2 id="transfer-modal-title">确认底稿传输地址（业务流程url）</h2>
                      <button
                        type="button"
                        className="transfer-modal-close"
                        aria-label="关闭弹窗"
                        title="关闭"
                        onClick={closeTransferModal}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="transfer-table" role="table" aria-label="业务流程传输地址">
                      <div className="transfer-table-row transfer-table-head" role="row">
                        <div role="columnheader">业务流程</div>
                        <div role="columnheader">URL</div>
                      </div>
                      <div className="transfer-table-body" role="rowgroup">
                        {processUrlRows.map((row) => (
                          <div key={row.id} className="transfer-table-row" role="row">
                            <div role="cell">
                              <input
                                type="text"
                                value={row.process}
                                aria-label={`${row.process} 业务流程`}
                                onChange={(event) => updateProcessUrlRow(row.id, 'process', event.target.value)}
                              />
                            </div>
                            <div role="cell">
                              <input
                                type="text"
                                value={row.url}
                                aria-label={`${row.process} URL`}
                                placeholder="请输入业务流程 URL"
                                onChange={(event) => updateProcessUrlRow(row.id, 'url', event.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="transfer-modal-footer">
                      <button type="button" className="transfer-modal-button" onClick={() => setIsTransferUrlConfirmed(true)}>
                        确认url地址
                      </button>
                      <button
                        type="button"
                        className="transfer-modal-button primary"
                        disabled={!isTransferUrlConfirmed}
                        onClick={closeTransferModal}
                      >
                        发送至KCw
                      </button>
                      <button type="button" className="transfer-modal-button" onClick={closeTransferModal}>
                        取消
                      </button>
                    </div>
                  </section>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

export default ShitUiWorkspace;
