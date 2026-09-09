export type NavTab = 
  | 'overview' 
  | 'collaboration' 
  | 'lifecycle' 
  | 'objectives' 
  | 'orchestra';

export interface KPIItem {
  label: string;
  value: string;
  subtext: string;
}

export interface MetricVariance {
  metric: string;
  auroraVal: string;
  industryVal: string;
  auroraBarPct: number;
  industryBarPct: number;
  valDisplay: string;
}

export interface RiskFocusRow {
  id: string;
  riskCategory: 'Revenue recognition' | 'Inventory valuation';
  riskFocus: string;
  originalRiskLevel: 'Low' | 'Medium' | 'High';
  riskDriftFrom: 'Low' | 'Medium' | 'High';
  riskDriftTo: 'Low' | 'Medium' | 'High';
  driftStatus: 'Escalating' | 'Stable' | 'Emerging' | 'Critical';
  driftDescription: string;
  auditImpact: string[];
  humanActionRole: 'Partner Escalation' | 'Manager Review';
  humanActionStatus: 'Pending decision';
  humanActionNote: string;
  relatedObjective: string;
}

export interface BusinessProcessItem {
  id: string;
  name: string;
  completionPct: number;
  subtitle: string;
}

export interface AuditProcedureRow {
  id: string;
  risk: string;
  fraud: 'Yes' | 'No';
  auditObjective: string;
  rmm: 'Significant' | 'Medium' | 'Low';
  controlReliance: 'No reliance' | 'Limited' | 'Reduced' | 'Full';
  procedureCode: string;
  procedureTitle: string;
  procedureStepsCount: number;
  assertion: string;
  pbcCode: string;
  pbcStatus: 'accepted' | 'reviewing' | 'supplement' | 'pending';
  agentCode: string;
  agentName: string;
  agentStatus: 'Done' | 'Idle' | 'Running' | 'Paused';
  progressPct: number;
}

export interface PBCOperationRow {
  id: string;
  phase: string;
  businessProcess: string;
  auditProcedure: string;
  pbcCode: string;
  pbcDescription: string;
  request: boolean;
  submitted: boolean;
  validating: 'check' | 'dot' | 'alert' | 'none';
  secondRequest: 'alert' | 'dash' | 'none';
  accepted: 'check' | 'dash' | 'none';
  cleansing: 'check' | 'dot' | 'dash' | 'none';
  archived: 'check' | 'dash' | 'none';
  secondRequestComment: string;
  humanActionNeeded: boolean;
}

export interface AgentInfo {
  id: string;
  code: string;
  name: string;
  description: string;
  updateTime: string;
  status: 'active' | 'idle' | 'paused';
}

export interface SubstantiveDocumentRow {
  id: string;
  businessProcess: string;
  accountDisclosure: string;
  rmmId: string;
  procedureId: string;
  procedureDesc: string;
  procedureType: 'TOD' | 'SAP';
  scopeDetail: string;
  kcwTemplate: string;
  isKcwTemplateUsed: 'Yes' | 'No' | 'Exception';
  obtainedExpectedEvidence: 'Yes' | 'Not Selected' | 'No';
  auditReport: string;
  uploadedBy: string;
  uploadDate: string;
  reviewedBy?: string;
  reviewDate?: string;
  isUploaded: boolean;
  inspectionStatus: 'passed' | 'failed' | 'pending';
  aiIntelligence?: string;
}

export interface InterventionLogItem {
  id: string;
  timestamp: string;
  title: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  category: string;
  agentName: string;
  description: string;
  actionRequired: string;
  status: 'Pending Review' | 'Approved' | 'Escalated';
}
