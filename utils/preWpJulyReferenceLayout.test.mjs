import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const preWpJuly = readFileSync(new URL('../components/PreWpJuly.tsx', import.meta.url), 'utf8');

assert.match(
  preWpJuly,
  /id: 1,\s*procedure: '了解并记录被审计单位的业务背景[\s\S]*id: 2,\s*procedure: '结合项目组就以往的存货盘点实施的审计程序的结果[\s\S]*id: 7,\s*procedure: '了解被审计单位的存货类型和存放地点/,
  'questions should be renumbered continuously after moving the former stage-two first question to stage one'
);

assert.match(
  preWpJuly,
  /inventoryMatrixPrepSteps = steps\.filter\(\(step\) => step\.id === 7\)[\s\S]*methodDeterminationSteps = steps\.filter\(\(step\) => \[1, 2, 3, 4, 5, 6\]\.includes\(step\.id\)\)/,
  'stage one should contain questions 1-6 and stage two should continue with question 7'
);

assert.match(
  preWpJuly,
  /PRE_WP_JULY_STEP_NOTE_PLACEHOLDERS[\s\S]*1: 'A股上市公司\/IPO \/ 其他类型 勾选题（FROM KAEG\)\\n以上行业 \/ 存货性质需要特别进行记录 勾选题 带出舞弊\/风险等相关提示'[\s\S]*5: '存货是否容易识别， 是否需要称重\/属性判断\/特殊公式计算\\n在制品相关的应对'[\s\S]*placeholder=\{PRE_WP_JULY_STEP_NOTE_PLACEHOLDERS\[step\.id\]\}[\s\S]*placeholder:text-gray-400/,
  'stage-one questions 1 and 5 should show their gray multiline guidance placeholders'
);

assert.match(
  preWpJuly,
  /const PRE_WP_JULY_STEP_REFERENCES/,
  'step KAEG and Workflow references should live in a temporary reference database'
);

assert.match(
  preWpJuly,
  /function KButton/,
  'KAEG indexes should render through a dedicated K button component'
);

assert.match(
  preWpJuly,
  /function KButton[\s\S]*aria-label=\{`KAEG 索引 \$\{label\}`\}[\s\S]*h-4 w-4[\s\S]*border border-\[#00338D\] bg-\[#00338D\][\s\S]*text-\[10px\] font-semibold[\s\S]*>\s*K\s*<[\s\S]*group-hover\/kaeg:opacity-100[\s\S]*group-focus-visible\/kaeg:opacity-100/,
  'K button should use the larger original blue style and keep the hover tooltip available'
);

assert.match(
  preWpJuly,
  /import \{[\s\S]*ExternalLink[\s\S]*\} from 'lucide-react'/,
  'step workflow reference should use a link icon before each visible reference'
);

assert.match(
  preWpJuly,
  /function KButton[\s\S]*<button[\s\S]*font-semibold[\s\S]*<\/button>[\s\S]*function PreWpJulyStepIndicator/,
  'K button text should be readable in the larger question style'
);

assert.doesNotMatch(
  preWpJuly,
  /function KButton[\s\S]*KAEG[\s\S]*<ExternalLink[\s\S]*<span className="min-w-0 whitespace-normal text-left">\{label\}<\/span>/,
  'K button should not render the KAEG reference text inline'
);

assert.match(
  preWpJuly,
  /function StepProcedureCell/,
  'procedure cells should own procedure text, Workflow text, and KAEG buttons'
);

assert.match(
  preWpJuly,
  /step\.workflow\.map[\s\S]*inline-flex min-w-0 items-start gap-1[\s\S]*text-gray-400[\s\S]*KAEG[\s\S]*<ExternalLink[\s\S]*item\.name/,
  'Workflow references should render below the question text with a light gray KAEG plus link icon before the reference text'
);

assert.match(
  preWpJuly,
  /<span className="inline-flex flex-wrap items-start gap-1">[\s\S]*\{step\.id\}\. \{step\.procedure\}[\s\S]*<span className="inline-flex items-center gap-1 pt-1">[\s\S]*step\.kaeg\.map[\s\S]*<KButton/,
  'each KAEG index should render inline and level with the procedure text'
);

assert.doesNotMatch(
  preWpJuly,
  /absolute -right-0\.5 -top-1[\s\S]*<KButton/,
  'question K buttons should not sit at the upper-right corner of the procedure text'
);

assert.doesNotMatch(
  preWpJuly,
  /<th[^>]*>KAEG 索引<\/th>|<th[^>]*>KPMG Clara Workflow 索引<\/th>/,
  'KAEG and Workflow should no longer be separate table columns'
);

console.log('check passed: PreWpJuly reference layout');
