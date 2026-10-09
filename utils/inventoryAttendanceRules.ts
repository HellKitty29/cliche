export const INDEPENDENT_ATTENDANCE_VALUE = '否，项目组采取独立盘点';
export const INDEPENDENT_AUDIT_APPROACH = '独立盘点方案';
export const INVENTORY_SELECT_PLACEHOLDER = '从下拉菜单选择';

export function isAuditApproachOptionDisabled(attendanceDayValue: string, option: string) {
  return attendanceDayValue === '是' && option === INDEPENDENT_AUDIT_APPROACH;
}

export function resolveAuditApproachForAttendanceDay(attendanceDayValue: string) {
  return attendanceDayValue === INDEPENDENT_ATTENDANCE_VALUE
    ? INDEPENDENT_AUDIT_APPROACH
    : INVENTORY_SELECT_PLACEHOLDER;
}
