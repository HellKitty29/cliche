import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../components/PreWpJuly.tsx', import.meta.url), 'utf8');
const compile = (start, end, result, dependencies) => {
  const offset = source.indexOf(start);
  assert.ok(offset >= 0);
  const snippet = source.slice(offset, source.indexOf(end, offset));
  return new Function(...Object.keys(dependencies),
    ts.transpile(snippet, { target: ts.ScriptTarget.ES2022 }) + `\nreturn ${result};`
  )(...Object.values(dependencies));
};
const records = new Map();
const storage = {
  getItem: (key) => records.get(key) ?? null,
  setItem: (key, value) => records.set(key, value),
};
const readDraft = compile('function readJulyDraft(', 'export default function PreWpJuly', 'readJulyDraft', { localStorage: storage });
const draft = {
  entityRiskLevel: '高', entityIndustrySegment: '制造业',
  methodPlanStepNotes: { 2: '业务背景', 10: '抽盘范围及分配记录' },
  inventoryNatureAnswers: { 1: 'yes', 4: 'no' },
  stepTwoSelections: { '1.1': ['是'] },
  inventoryMatrixRows: [{ id: 'location-1', selectedAsSample: '是' }],
  publishedMethodPlanRows: [], hasConfirmedKoicPush: false,
};
let snapshot, saved, error;
const persist = compile('  const persistDraft =', '  const methodPlanMatrixRef =', 'persistDraft', {
  currentDraft: draft, draftKey: 'task-a', localStorage: storage,
  setLastSavedSnapshot: (value) => { snapshot = value; },
  setInventoryStepsSaved: (value) => { saved = value; },
  setSaveError: (value) => { error = value; },
});
assert.equal(persist(), true);
assert.equal(saved, true);
assert.equal(error, '');
assert.deepEqual(readDraft('task-a'), draft);
assert.equal(snapshot, JSON.stringify(draft));
assert.equal(readDraft('task-b'), null, 'drafts are isolated by task');

const published = [{ id: 'location-1', auditApproach: '实质性程序方案' }];
let confirmed = false;
const createTasks = compile('  const handleKoicPushConfirm =', '\n  useEffect(() => {', 'handleKoicPushConfirm', {
  getInventoryProcedureDecision: () => ({ blocked: false }),
  publishedMethodPlanRows: [], persistDraft: persist,
  setPublishedMethodPlanRows: () => {}, setHasConfirmedKoicPush: (value) => { confirmed = value; },
  setShowPrepAfterTask: () => {}, setIsWorkpaperIntroCollapsed: () => {},
  setIsMethodPlanPrepCollapsed: () => {}, setIsPlanSetupCollapsed: () => {},
  setActivePreWpJulyStage: () => {}, window: { requestAnimationFrame: (fn) => fn() },
  inventorySectionRef: { current: null },
});
createTasks(published);
assert.equal(confirmed, true);
const restored = readDraft('task-a');
assert.deepEqual(restored.inventoryNatureAnswers, draft.inventoryNatureAnswers);
assert.deepEqual(restored.methodPlanStepNotes, draft.methodPlanStepNotes);
assert.deepEqual(restored.publishedMethodPlanRows, published);
assert.equal(restored.hasConfirmedKoicPush, true);

let expanded = false;
let collapsed = true;
let scrolled = false;
const navigate = compile('  const navigateToStage =', '  const inventoryMatrixSection =', 'navigateToStage', {
  hasConfirmedKoicPush: restored.hasConfirmedKoicPush,
  setShowPrepAfterTask: (value) => { expanded = value; },
  setIsMethodPlanPrepCollapsed: (value) => { collapsed = value; },
  setIsWorkpaperIntroCollapsed: () => {}, setActivePreWpJulyStage: () => {},
  methodPlanProgramSectionRef: { current: { scrollIntoView: () => { scrolled = true; } } },
  inventorySectionRef: { current: null }, planSectionRef: { current: null },
  window: { requestAnimationFrame: (fn) => fn() },
});
navigate('method');
assert.equal(expanded, true);
assert.equal(collapsed, false);
assert.equal(scrolled, true);

saved = false;
storage.setItem = () => { throw new Error('Quota exceeded'); };
assert.equal(persist(), false);
assert.equal(saved, false, 'failed writes must not mark the draft saved');
assert.ok(error.includes('保存失败'));
records.set('broken', '{');
assert.equal(readDraft('broken'), null);
console.log('WP July save → create tasks → restore questions regression passed.');
