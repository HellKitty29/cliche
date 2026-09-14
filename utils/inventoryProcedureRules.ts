export type ProcedureInput = {
  auditApproach: string;
  countMethod: string;
  importedSystemType?: string;
  confirmThirdPartyInventory: string;
};

export type ProcedureWarning = { code: string; warning: string; blocking: boolean };

const has = (value: string, ...terms: string[]) => terms.some((term) => value.includes(term));

export function allowsThirdPartyEvidence(auditApproach: string) {
  return !has(auditApproach, '不可预见', '无法实施', '不可行');
}

export function normalizeThirdPartyEvidence<T extends ProcedureInput>(row: T): T {
  return allowsThirdPartyEvidence(row.auditApproach) || row.confirmThirdPartyInventory === '否'
    ? row
    : { ...row, confirmThirdPartyInventory: '否' };
}

export function getPublishableInventoryRows<T extends ProcedureInput & { id: string }>(
  rows: T[],
  selectedWarningIds: readonly string[],
): T[] {
  const selected = new Set(selectedWarningIds);
  return rows.filter((row) => {
    const decision = getInventoryProcedureDecision(row);
    return !decision.blocked && decision.groupIds.length > 0 &&
      decision.warnings.every((warning) => selected.has(`${row.id}-${warning.code}`));
  });
}

// One decision table shared by the task preview and the resulting appendices.
export function getInventoryProcedureDecision(row: ProcedureInput) {
  const approach = row.auditApproach;
  const cycle = has(row.countMethod, '循环盘点', 'Cycle count');
  const atEnd = has(row.countMethod, '在期末完成盘点', 'Complete count at period end');
  const offEnd = has(row.countMethod, '在非期末时点完成盘点', 'Complete count at a date other than period end');
  const periodic = has(row.importedSystemType ?? '', '定期盘存', 'Periodic');
  const warnings: ProcedureWarning[] = [];
  let groupIds: number[] = [];
  let independentSections: string[] = [];
  const warn = (code: string, warning: string, blocking = false) => warnings.push({ code, warning: `[ISA | ${code}]\n${warning}`, blocking });
  const periodicCycleWarning = () => warn('7765.8396', '被审计单位采用定期盘存制，则被审计单位或项目组不可能依赖循环盘点，因为被审计单位没有能够确保循环盘点流程控制活动有效的存货出入库流程和流程控制活动。');

  if (has(approach, '不可预见', '无法实施')) {
    groupIds = [5, 4];
    independentSections = ['4.1', '4.4', '4.5'];
    warn('7799.7442', '不可预见的情况包括：\n本所是在存货盘点完成后才被任命为被审计单位的审计师；\n天气情况恶劣，项目组无法在盘点现场实施监盘；\n剥离审计。\n请确认项目组由于上述情况，无法按计划对管理层的全面实地盘点实施存货监盘。\n如果项目组能够另择日期对管理层的全面实地盘点实施存货监盘，则请重新选择审计方案。');
  } else if (has(approach, '不可行')) {
    groupIds = [6];
    warn('7746.6862', '[ISA | 7801.6862]\n存货监盘不可行：\n“不可行”并没有具体定义，这可能是由存货性质和存放地点等因素造成的。\n例如，存货存放在战区，实地监盘对人员的安全有威胁。此类情形预计较罕见，通常的不便因素不足以得出监盘不可行的结论。《国际审计准则第200号》指出，审计中的困难、时间或成本等事项本身，不能作为审计师省略不可替代的审计程序或满足于说服力不足的审计证据的正当理由。');
  } else if (has(approach, '未识别出重大错报风险')) {
    groupIds = [7];
  } else if (has(approach, '独立盘点', 'Independent count')) {
    groupIds = [4];
    if (periodic && cycle) periodicCycleWarning();
    if (periodic && offEnd) warn('7765.8402', '如果被审计单位采用定期盘存制，则项目组不能依赖流程控制活动或依赖该系统的输出数据来获取审计证据，以确定存货盘点日与财务报表日之间的存货变动是否已得到恰当记录。但是，如果存货盘点是在足够接近期末的日期进行，并且如果项目组认为存货盘点日与期末之间的存货移动发生重大错报风险的可能性极小，则项目组可以依赖该盘点结果。');
    if (atEnd) warn('7765.8384', '同时满足下列条件时，项目组可采取独立盘点方案：\n管理层在期末以外的某一天或某几天进行存货盘点；\n项目组计划并能够在期末进行独立盘点，以获取有关期末存货数量和状况的充分、适当的审计证据。');
  } else if (has(approach, '实质性程序方案', '实质性方案', 'Substantive')) {
    if (cycle) warn('7765.8393', '项目组不可以仅采用实质性方案对管理层的循环盘点结果进行测试，而不对针对存货的数量和状况的重大错报风险的流程控制活动进行测试。请重新选择审计方案。', true);
    else if (atEnd || offEnd) groupIds = [2];
  } else if (has(approach, '控制测试方案', '双重目的', 'Controls', 'Dual-purpose')) {
    if (cycle) {
      groupIds = [1];
      if (periodic) periodicCycleWarning();
    } else if (atEnd || offEnd) groupIds = [2];
  }
  const blocked = warnings.some((warning) => warning.blocking);
  const thirdPartyAllowed = allowsThirdPartyEvidence(approach);
  if (!blocked && groupIds.length > 0 && thirdPartyAllowed && has(row.confirmThirdPartyInventory, '是', 'Yes')) groupIds.push(3);
  return { groupIds, independentSections, warnings, blocked, thirdPartyAllowed };
}
