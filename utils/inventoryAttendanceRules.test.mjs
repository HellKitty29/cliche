import assert from 'node:assert/strict';
import {
  INDEPENDENT_ATTENDANCE_VALUE,
  INDEPENDENT_AUDIT_APPROACH,
  isAuditApproachOptionDisabled,
  resolveAuditApproachForAttendanceDay,
} from './inventoryAttendanceRules.ts';

assert.equal(
  resolveAuditApproachForAttendanceDay(INDEPENDENT_ATTENDANCE_VALUE),
  INDEPENDENT_AUDIT_APPROACH,
  'independent inventory counting should generate the independent-count audit approach'
);
assert.equal(
  resolveAuditApproachForAttendanceDay('是'),
  '从下拉菜单选择',
  'returning to client counting should require the audit approach to be selected again'
);
assert.equal(
  isAuditApproachOptionDisabled('是', INDEPENDENT_AUDIT_APPROACH),
  true,
  'client counting on the attendance day should disable the independent-count approach'
);
assert.equal(
  isAuditApproachOptionDisabled('是', '双重目的方案'),
  false,
  'client counting on the attendance day should leave other audit approaches available'
);
assert.equal(
  isAuditApproachOptionDisabled(INDEPENDENT_ATTENDANCE_VALUE, INDEPENDENT_AUDIT_APPROACH),
  false,
  'independent attendance should retain its generated independent-count approach'
);

console.log('Passed attendance-day audit approach generation checks.');
