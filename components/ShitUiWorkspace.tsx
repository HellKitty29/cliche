import React, { useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Download,
  Eye,
  Globe2,
  Mail,
  PenLine,
  RefreshCcw,
  Save,
  Search,
  Upload,
  UserRound,
} from 'lucide-react';
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

const newVersionRows = [
  ['GOSPD01002 加盟商收入 - 函证 (Trade receivables (total customer balance) - external confirmation)', '销售(Sales)', '合同负债(Contract liabilities)', '', 'Inspection; Confirmation', 'Substantive sampling; MUS', 'Not Selected'],
  ['GOSPD01031 销售 - 截止测试（期末前） (Sales - cut-off test (before period end))', '销售(Sales)', '营业收入', '', 'Inspection', 'All items', 'Not Selected'],
  ['SAP1 收入的反舞弊分析程序', '销售(Sales)', '合同负债(Contract liabilities)', '', 'Predictive analysis', '', 'Not Selected'],
  ['SPD01902 毛利的实质性分析（趋势） (Gross margin substantive analytical (trend))', '销售(Sales)', '合同负债(Contract liabilities)', '', 'Trend analysis; Ratio analysis', '', 'Not Selected'],
  ['TOD1 加盟收入重计算', '销售(Sales)', '合同负债(Contract liabilities)', '', 'Inspection; Recalculation', 'All items', 'Not Selected'],
  ['TOD2 银行流水核查', '销售(Sales)', '合同负债(Contract liabilities)', '', 'Inspection', 'All items', 'Not Selected'],
  ['SPD02001 采购 - 函证或直接访问 (Purchases - external confirmation or direct access)', '采购(Purchases)', '管理费用', '', 'Inspection; Confirmation', 'Substantive sampling; MUS', 'YES'],
  ['SPD02003 预提费用 - 检查并重新计算 (Accrued expenses - vouch and recalculate)', '采购(Purchases)', '管理费用', '', 'Inspection; Recalculation', 'Substantive sampling; MUS', 'YES'],
  ['SPD02005 预付款 - 重新计算并检查 (Prepayment - recalculate and vouch)', '采购(Purchases)', '预付款项(Prepayments)', '', 'Inspection; Recalculation', 'All items', 'YES'],
  ['SPD02006 采购 - 截止测试 (Purchases - cut-off test)', '采购(Purchases)', '其他应付款(Other payables)', '', 'Inspection', 'All items', 'YES'],
  ['SPD02007 查找未入账的负债 (Search for unrecorded liabilities)', '采购(Purchases)', '管理费用', '', 'Inspection', 'Substantive sampling', 'YES'],
  ['SPD02013 应付 - 检查 (Expenses - vouch)', '采购(Purchases)', '应付账款(Trade payables)', '', 'Inspection', 'Substantive sampling', 'YES'],
  ['SPD17011 集团内部往来交易和余额 - 检查 (Intercompany transactions and balances - vouch)', '采购(Purchases)', '应付账款(Trade payables)', '', 'Inspection; Inquiry; Recalculation', 'All items', 'YES'],
  ['T.TOD1 采购细节性测试 Purchase - vouching', '采购(Purchases)', '应付账款(Trade payables)', '', 'Inspection', 'Substantive sampling; MUS', 'Not Selected'],
  ['SPD02001 采购 - 函证或直接访问 (Purchases - external confirmation or direct access)', '采购(Purchases)', '管理费用', '', 'Inspection; Confirmation', 'Substantive sampling; MUS', 'YES'],
  ['SPD02003 预提费用 - 检查并重新计算 (Accrued expenses - vouch and recalculate)', '采购(Purchases)', '管理费用', '', 'Inspection; Recalculation', 'Substantive sampling; MUS', 'YES'],
  ['SPD02005 预付款 - 重新计算并检查 (Prepayment - recalculate and vouch)', '采购(Purchases)', '预付款项(Prepayments)', '', 'Inspection; Recalculation', 'All items', 'YES'],
  ['SPD02006 采购 - 截止测试 (Purchases - cut-off test)', '采购(Purchases)', '其他应付款(Other payables)', '', 'Inspection', 'All items', 'YES'],
  ['SPD02007 查找未入账的负债 (Search for unrecorded liabilities)', '采购(Purchases)', '管理费用', '', 'Inspection', 'Substantive sampling', 'YES'],
  ['SPD02013 应付 - 检查 (Expenses - vouch)', '采购(Purchases)', '应付账款(Trade payables)', '', 'Inspection', 'Substantive sampling', 'YES'],
  ['SPD17011 集团内部往来交易和余额 - 检查 (Intercompany transactions and balances - vouch)', '采购(Purchases)', '应付账款(Trade payables)', '', 'Inspection; Inquiry; Recalculation', 'All items', 'YES'],
  ['T.TOD1 采购细节性测试 Purchase - vouching', '采购(Purchases)', '应付账款(Trade payables)', '', 'Inspection', 'Substantive sampling; MUS', 'Not Selected'],
  ['GOSPD06001 现金等价物 - 检查并评估分类 (Cash equivalents - vouch and assess classification)', '资金和债务(Treasury and debt)', '现金及现金等价物(Cash and cash equivalents)', '', 'Inspection', 'All items', 'YES'],
  ['GOSPD06004 现金及现金等价物 - 银行存款余额调节表 (Cash and cash equivalents - bank reconciliation)', '资金和债务(Treasury and debt)', '现金及现金等价物(Cash and cash equivalents)', '', 'Inspection; Recalculation', 'All items', 'YES'],
  ['GOSPD06008 银行函证 (Bank confirmations)', '资金和债务(Treasury and debt)', '现金及现金等价物(Cash and cash equivalents)', '', 'Inspection; Confirmation', 'All items', 'YES'],
  ['GOSPD06014 现金及现金等价物账户 - 识别 (Unrecorded cash and cash equivalents accounts - identification)', '资金和债务(Treasury and debt)', '现金及现金等价物(Cash and cash equivalents)', '', 'Inspection; Inquiry; Confirmation', 'All items', 'YES'],
  ['GOSPD04006 利润分享与奖金负债和费用 - 检查并重新计算 (Profit-sharing and bonus liabilities and expenses - vouch and recalculate)', '人力资源(Human resources)', '研发费用-人工费用', '', 'Inspection; Inquiry; Recalculation', 'All items', 'YES'],
  ['GOSPD04019 员工薪酬负债 - 检查并重新计算 (Employee benefit liabilities - vouch and recalculate)', '人力资源(Human resources)', '应付工资(Payroll liabilities)', '', 'Inspection; Inquiry; Recalculation', 'All items', 'YES'],
  ['SPD04002 职工薪酬负债 - 识别 (Employee benefit liabilities - identification)', '人力资源(Human resources)', '管理费用-人工费用', '', 'Inspection; Inquiry', 'All items', 'YES'],
  ['SPD04004 定期工资费用 - 检查 (Periodic payroll expenses - vouch)', '人力资源(Human resources)', '应付工资(Payroll liabilities)', '', '', 'All items', 'Not Selected'],
  ['SPD04901 工资费用的实质性分析（预测） (Payroll expense substantive analytical (predictive))', '人力资源(Human resources)', '销售费用-人工费用', '', 'Predictive analysis', '', 'YES'],
  ['TT GOSPT09002 当期所得税 - 检查纳税申报(初稿)并验证计算的准确性 (Current tax - inspect draft tax filing and verify mathematical accuracy)', '税项(Tax)', '所得税费用', '', 'Inspection; Recalculation', 'All items', 'YES'],
  ['TT GOSPT09003 当期所得税 - 检查上期所得税负债T表 (Current tax - inspect prior period income tax liability reconciliation)', '税项(Tax)', '递延所得税负债(Deferred tax liabilities)', '', 'Inspection; Inquiry', 'All items', 'YES'],
  ['TT GOSPT09004 当期所得税 - 检查所得税付款 (Current tax - vouch income tax payments)', '税项(Tax)', '递延所得税资产(Deferred tax assets)', '', 'Inspection', 'All items', 'YES'],
  ['TT GOSPT09007 递延所得税 - 检查并评估 (Deferred tax - vouch and assess)', '税项(Tax)', '递延所得税负债(Deferred tax liabilities)', '', 'Inspection; Recalculation', 'All items', 'YES'],
  ['CNSP4 增值税 - 检查增值税负债 (VAT - vouch tax payments)', '税项(Tax)', '应交增值税(Value added tax payable)', '', 'Inspection', 'Substantive sampling; KSP', 'YES'],
  ['CNSP5 其他税项 - 检查纳税申报 (Other tax - inspect tax filing)', '税项(Tax)', '应交其他税', '', 'Inspection; Recalculation', 'All items', 'YES'],
  ['CNSP55 增值税项税费分析(预测) (Output VAT substantive analytical (predictive))', '税项(Tax)', '应交增值税(Value added tax payable)', '', 'Predictive analysis', '', 'YES'],
  ['CNSP56 增值税进项税费分析(预测) (Input VAT substantive analytical (predictive))', '税项(Tax)', '应交增值税(Value added tax payable)', '', 'Predictive analysis', '', 'YES'],
  ['GOSPD01030 存货 - 截止测试（期末后） (Sales - cut-off test (after period end))', '存货(Inventory)', '存货，总额(Inventories, gross)', '', 'Inspection', 'Substantive sampling; MUS', 'YES'],
  ['GOSPD01031 销售 - 截止测试（期末前） (Sales - cut-off test (before period end))', '存货(Inventory)', '营业收入', '', 'Inspection', 'All items', 'YES'],
  ['SPD02006 采购 - 截止测试 (Purchases - cut-off test)', '存货(Inventory)', '其他应付款(Other payables)', '', 'Inspection', 'Substantive sampling; MUS', 'YES'],
  ['SPD03001 存货监盘 (Inventory observations)', '存货(Inventory)', '存货，总额(Inventories, gross)', '', 'Inspection; Observation; Inquiry', 'All items', 'YES'],
  ['SPD03003 从盘点日起执行存货前进后推程序 - 检查 (Inventory roll-forward or roll-back from count date - vouch)', '存货(Inventory)', '存货，总额(Inventories, gross)', '', 'Inspection; Recalculation', 'Substantive sampling; MUS', 'YES'],
  ['SPD03016 盘点日存货截止 - 截止前 (Inventory cut-off at count date - before)', '存货(Inventory)', '存货，总额(Inventories, gross)', '', '', 'All items', 'YES'],
  ['SPD03017 盘点日存货截止 - 截止后 (Inventory cut-off at count date - after)', '存货(Inventory)', '存货，总额(Inventories, gross)', '', '', 'All items', 'YES'],
  ['SPD03021 存放于第三方的存货 (Inventory at third party locations)', '存货(Inventory)', '存货，总额(Inventories, gross)', '', 'Inspection; Observation; Inquiry; Confirmation', 'All items', 'YES'],
  ['SPD03025 已销售货物的成本 - 检查 (Cost of goods sold - vouch)', '存货(Inventory)', '存货，总额(Inventories, gross)', '', 'Inspection', 'Substantive sampling; MUS', 'YES'],
  ['SPD03027 存货材料、物料和购入产成品（实际成本法）- 加权平均公式 - 检查、评价并重计算 (Inventory materials and supplies and purchased finished goods (actual cost method) - average formula - inspect, assess and recalculate)', '存货(Inventory)', '存货，总额(Inventories, gross)', '', 'Inspection; Recalculation', 'Substantive sampling; MUS', ''],
  ['SPD03905 毛利的实质性分析（趋势） (Gross margin substantive analytical (trend))', '存货(Inventory)', '营业成本', '', 'Trend analysis', '', 'YES'],
].map(([procedure, process, account, clarify, nature, extent, evidence], index) => {
  const draftUploaded = index % 5 === 2 ? 'negative' : 'positive';
  const draftStatus = draftUploaded === 'negative' ? 'negative' : index % 4 === 1 ? 'negative' : 'positive';

  return {
    procedure,
    process,
    account,
    clarify,
    nature,
    extent,
    wpLink: 'KCw WP Hyper link',
    guidanceLink: 'KCw Guidance Hyper link',
    evidence,
    misstatement: '',
    draftUploaded,
    draftStatus,
    action: 'icons',
  };
});

function renderDraftStatus(value, type) {
  const isPositive = value === 'positive';
  const label = type === 'upload' ? (isPositive ? '已上传' : '未上传') : isPositive ? '已通过' : '未通过';

  return (
    <span className="status-line">
      <span className={isPositive ? 'status-dot positive' : 'status-dot negative'} />
      <span>{label}</span>
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
    if (!normalizedSearch) {
      return true;
    }

    return [
      row.procedure,
      row.process,
      row.account,
      row.clarify,
      row.nature,
      row.extent,
      row.wpLink,
      row.guidanceLink,
      row.evidence,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch);
  });

  const updateRowField = (rowId: string, key: string, value: string) => {
    setTableRows((current) => current.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)));
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

  return (
    <main className="app-shell">
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
                    <h1>1310956 - ABC Company</h1>
                    <p>Entity name: ABC Company</p>
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
                    <ToolButton icon={Upload} label="上传RAAR Report" />
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
              <div className="page-head">
                <div>
                  <h1>1310956 - ABC Company</h1>
                  <p>Entity name: ABC Company</p>
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
                  <ToolButton icon={Upload} label="上传RAAR Report" />
                  <button type="button" className="tool-button significance-button" aria-label="同步附件至KCW">
                    <span>同步附件至KCW</span>
                  </button>
                  <ToolButton icon={Download} label="Export" />
                  <ToolButton icon={Save} label="Save" primary />
                </div>
              </div>

              <div className="new-version-surface">
                <div className="new-version-header-row" role="table" aria-label="new version header">
                  {[
                    '实质性程序描述',
                    '业务流程',
                    '账户/披露',
                    '阐明程序描述',
                    '性质',
                    '范围（细节测试）',
                    'KCw 标准工作底稿',
                    'KCw 实质性程序指引',
                    '项目组是否已从实质性程序中获取了预期的证据？',
                    '审计错报',
                    '底稿是否上传',
                    '底稿是否通过检验',
                    '操作',
                  ].map((label) => (
                    <div key={label} className="new-version-header-cell" role="columnheader">
                      {label}
                    </div>
                  ))}
                </div>
                <div className="new-version-body" role="rowgroup">
                  {filteredNewVersionRows.map((row, index) => (
                    <div key={`${row.procedure}-${index}`} className="new-version-data-row" role="row">
                      <div className="new-version-data-cell">{row.procedure}</div>
                      <div className="new-version-data-cell">{row.process}</div>
                      <div className="new-version-data-cell">{row.account}</div>
                      <div className="new-version-data-cell">{row.clarify}</div>
                      <div className="new-version-data-cell">{row.nature}</div>
                      <div className="new-version-data-cell">{row.extent}</div>
                      <div className="new-version-data-cell">
                        <a href="https://example.com/kcw-wp" className="table-link" target="_blank" rel="noreferrer">
                          {row.wpLink}
                        </a>
                      </div>
                      <div className="new-version-data-cell">
                        <a href="https://example.com/kcw-guidance" className="table-link" target="_blank" rel="noreferrer">
                          {row.guidanceLink}
                        </a>
                      </div>
                      <div className="new-version-data-cell">{row.evidence}</div>
                      <div className="new-version-data-cell">{row.misstatement}</div>
                      <div className="new-version-data-cell">{renderDraftStatus(row.draftUploaded, 'upload')}</div>
                      <div className="new-version-data-cell">{renderDraftStatus(row.draftStatus, 'check')}</div>
                      <div className="new-version-data-cell">
                        <ActionIcons />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

export default ShitUiWorkspace;
