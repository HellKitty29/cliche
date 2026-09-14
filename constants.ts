
import { ChapterTemplate, TaskParameter, LocationInfo, RevisionRecord, TaskInfo } from './types';

export const CHAPTER_TEMPLATES: ChapterTemplate[] = [
  { id: '39157', name: '存货工作底稿 - 附件2 (全面实地盘点) 引言', isCheckin: false, isSignature: false, labelCount: 1, extraAttr: '常规', source: '标准', dependency: '无' },
  { id: '39158', name: '2.1 项目组的风险评估及计划程序 | 全面实地盘点', isCheckin: false, isSignature: false, labelCount: 2, extraAttr: '特殊', source: '标准', dependency: '无' },
  { id: '39163', name: '现场打卡', isCheckin: true, isSignature: false, labelCount: 1, extraAttr: '常规', source: '标准', dependency: '无' },
  { id: '39159', name: '2.2 存货监盘审计程序 | 全面实地盘点', isCheckin: false, isSignature: false, labelCount: 5, extraAttr: '常规', source: '标准', dependency: '无' },
  { id: '39160', name: '2.3 评价结果 | 全面实地盘点', isCheckin: false, isSignature: false, labelCount: 2, extraAttr: '特殊', source: '标准', dependency: '无' },
  { id: '39161', name: '盘点文件归档', isCheckin: false, isSignature: false, labelCount: 1, extraAttr: '常规', source: '标准', dependency: '无' },
  { id: '39162', name: '截止性测试文件归档', isCheckin: false, isSignature: false, labelCount: 1, extraAttr: '常规', source: '标准', dependency: '无' },
];

export const TASK_PARAMETERS: TaskParameter[] = [
  { index: 1, name: '所属公司名称', showInList: true, type: '固定参数' },
  { index: 2, name: '受访单位名称', showInList: true, type: '固定参数' },
  { index: 3, name: '受访单位编码', showInList: false, type: '固定参数' },
  { index: 4, name: '受访单位所在省/地区', showInList: true, type: '固定参数' },
  { index: 5, name: '受访单位所在市', showInList: true, type: '固定参数' },
];

export const LOCATIONS: LocationInfo[] = [
  { id: 1, companyName: 'test', targetUnit: 'test', province: '上海市', city: '上海市', isSelected: true, executor: 'Shen, Johnny (SH/AQPP)', lastSubmitDate: '2025/12/27', planDate: '2025/12/27', amount: '-', status: 'Executing' },
  { id: 2, companyName: 't2', targetUnit: 't2', province: '北京市', city: '北京市', isSelected: false, executor: 'Huang, Ian (SH/AQPP)', lastSubmitDate: '-', planDate: '-', amount: '-', status: 'Closed' },
  { id: 3, companyName: '恒隆22号', targetUnit: 'kpmg', province: '北京市', city: '-', isSelected: true, executor: '-', lastSubmitDate: '-', planDate: '-', amount: '-', status: 'Selected' },
  { id: 4, companyName: 'A-1230', targetUnit: 'A-1230', province: '北京市', city: '北京市', isSelected: true, executor: 'Li, Xiaobo (KDC/ITS)', lastSubmitDate: '-', planDate: '-', amount: '-', status: 'Accepted' },
  { id: 5, companyName: 'C-4567', targetUnit: 'C-4567', province: '广东省', city: '广州市', isSelected: true, executor: 'Wang, Li (BJ/AQPP)', lastSubmitDate: '-', planDate: '-', amount: '-', status: 'Accepted' },
  { id: 6, companyName: 'D-8901', targetUnit: 'D-8901', province: '四川省', city: '成都市', isSelected: false, executor: 'Chen, Wei (CD/AQPP)', lastSubmitDate: '-', planDate: '-', amount: '-', status: 'Selected' },
];

export const REVISIONS: RevisionRecord[] = [
  { content: '修改项目模板', submitter: 'Huang, Ian (SH/AQPP)', reviewer: 'Huang, Ian (SH/AQPP)', reviewTime: '2026-01-08 09:47:21' },
  { content: '修改项目模板', submitter: 'Shen, Johnny (SH/AQPP)', reviewer: 'Shen, Johnny (SH/AQPP)', reviewTime: '2026-01-04 10:18:07' },
];

export const TASKS: TaskInfo[] = [
  { EngagementId:'1666011', EngagementName:'Costco (China) Investment Co., Ltd.', id: 'T51116', companyName: 'test once', province: '上海市', executor: 'Huang, Ian (SH/AQPP)', lastSubmitDate: '2026/04/22', planDate: '2026/04/22', status: '被拒绝', progress: '0/2', currentYearAmount: 12.4, previousYearAmount: 10.8, currentYearQuantity: 760, previousYearQuantity: 690, salesAmount: 42.5},
  { EngagementId:'1666011', EngagementName:'Costco (China) Investment Co., Ltd.',id: 'T51102', companyName: 'D项目仓库审计', province: '上海市', executor: 'Feng, June (KDCS/Trusted)', lastSubmitDate: '2026/03/31', planDate: '2026/01/28', status: '已复核', progress: '4/4', currentYearAmount: 31.8, previousYearAmount: 29.6, currentYearQuantity: 1820, previousYearQuantity: 1740, salesAmount: 88.2},
  { EngagementId:'1666033', EngagementName:'Aldi (China) Investment Co., Ltd.',id: 'T51101', companyName: 'D项目仓库审计', province: '上海市', executor: 'Li, Joy (KDCS/Trusted)', lastSubmitDate: '2026/02/28', planDate: '2026/01/23', status: '执行中', progress: '4/4', currentYearAmount: 24.5, previousYearAmount: 22.1, currentYearQuantity: 1540, previousYearQuantity: 1410, salesAmount: 73.6},
  { EngagementId:'1666033', EngagementName:'Aldi (China) Investment Co., Ltd.',id: 'T50701', companyName: 'physical test', province: '上海市', executor: '-', lastSubmitDate: '2026/01/06', planDate: '2026/01/06', status: '已指派', progress: '0/4', currentYearAmount: 8.9, previousYearAmount: 7.4, currentYearQuantity: 520, previousYearQuantity: 470, salesAmount: 26.8},
  { EngagementId:'1666033', EngagementName:'Aldi (China) Investment Co., Ltd.',id: 'T50573', companyName: 'test0104', province: '上海市', executor: 'Huang, Ian (SH/AQPP)', lastSubmitDate: '2026/01/04', planDate: '2026/01/04', status: '已复核', progress: '4/4', currentYearAmount: 18.6, previousYearAmount: 17.2, currentYearQuantity: 1060, previousYearQuantity: 980, salesAmount: 54.1},
  { EngagementId:'1666066', EngagementName:'CITIC Pacific Special Steel Group Co., Ltd',id: 'T50572', companyName: 'test0104', province: '四川省', executor: 'Huang, Ian (SH/AQPP)', lastSubmitDate: '2026/04/04', planDate: '2026/04/04', status: '已选定', progress: '0/2', currentYearAmount: 6.7, previousYearAmount: 5.9, currentYearQuantity: 430, previousYearQuantity: 390, salesAmount: 18.4},
  { EngagementId:'1666066', EngagementName:'CITIC Pacific Special Steel Group Co., Ltd',id: 'T50127', companyName: 'physical test', province: '广东省', executor: 'Li, Xiaobo (KDC/ITS)', lastSubmitDate: '-', planDate: '-', status: '执行中', progress: '1/4', currentYearAmount: 15.2, previousYearAmount: 13.7, currentYearQuantity: 920, previousYearQuantity: 850, salesAmount: 47.9},
  { EngagementId:'1666011', EngagementName:'Costco (China) Investment Co., Ltd.',id: 'T47938', companyName: 'physical test', province: '江西省', executor: 'Huang, Ian (SH/AQPP)', lastSubmitDate: '2026/03/26', planDate: '2026/03/26', status: '已指派', progress: '0/2', currentYearAmount: 9.6, previousYearAmount: 8.8, currentYearQuantity: 610, previousYearQuantity: 560, salesAmount: 31.3},
  { EngagementId:'1666033', EngagementName:'Aldi (China) Investment Co., Ltd.',id: 'T47937', companyName: 'physical test', province: '上海市', executor: 'Shen, Johnny (SH/AQPP)', lastSubmitDate: '2025/12/27', planDate: '2025/12/27', status: '执行中', progress: '0/4', currentYearAmount: 11.3, previousYearAmount: 10.5, currentYearQuantity: 780, previousYearQuantity: 730, salesAmount: 35.7},
  { EngagementId:'1666111', EngagementName:'Costco (China) Investment Co., Ltd.',id: 'T45138', companyName: '全国实地盘点', province: '广东省', executor: 'Li, Lian (KDC/ITS)', lastSubmitDate: '-', planDate: '-', status: '已接受', progress: '0/3', currentYearAmount: 20.1, previousYearAmount: 19.4, currentYearQuantity: 1290, previousYearQuantity: 1220, salesAmount: 62.5},
  { EngagementId:'1666222', EngagementName:'Tech Solution I',id: 'T45139', companyName: '广州分所审计', province: '广东省', executor: 'Wang, Li (GZ/AQPP)', lastSubmitDate: '2026/01/15', planDate: '2026/01/20', status: '已提交', progress: '1/2', currentYearAmount: 13.9, previousYearAmount: 12.6, currentYearQuantity: 850, previousYearQuantity: 790, salesAmount: 39.8},
  { EngagementId:'1666333', EngagementName:'Tech Solution II',id: 'T45140', companyName: '成都分所审计', province: '成都市', executor: 'Chen, Wei (KDC/AQPP)', lastSubmitDate: '2026/02/01', planDate: '2026/02/05', status: '已提交', progress: '2/3', currentYearAmount: 16.4, previousYearAmount: 14.9, currentYearQuantity: 990, previousYearQuantity: 930, salesAmount: 48.7},
];
