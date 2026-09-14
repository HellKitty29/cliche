

export enum ModuleStep {
  TEMPLATE = 'TEMPLATE',
  LOCATION = 'LOCATION',
  TASK = 'TASK'
}

export interface ChapterTemplate {
  id: string;
  name: string;
  isCheckin: boolean;
  isSignature: boolean;
  labelCount: number;
  extraAttr: string;
  source: string;
  dependency: string;
}

export interface TaskParameter {
  index: number;
  name: string;
  showInList: boolean;
  type: string;
}

export interface LocationInfo {
  id: number;
  companyName: string;
  targetUnit: string;
  province: string;
  city: string;
  isSelected: boolean;
  executor: string;
  lastSubmitDate: string;
  planDate: string;
  amount: string;
  status: 'Executing' | 'Closed' | 'Selected' | 'Accepted';
}

export interface RevisionRecord {
  content: string;
  submitter: string;
  reviewer: string;
  reviewTime: string;
}

export interface TaskInfo {
  EngagementId: string;
  EngagementName: string;
  id: string;
  companyName: string;
  province: string;
  city?: string;
  executor: string;
  lastSubmitDate: string;
  planExecutionDate?: string;
  planDate: string;
  status: '已选定' | '已提交' | '执行中' | '已指派' | '已复核' | '已接受' | '被拒绝' | '已废除' ;
  progress: string;
  currentYearAmount?: number;
  previousYearAmount?: number;
  currentYearQuantity?: number;
  previousYearQuantity?: number;
  salesAmount?: number;
}
