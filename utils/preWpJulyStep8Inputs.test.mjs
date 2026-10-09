import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const preWpJuly = readFileSync(new URL('../components/PreWpJuly.tsx', import.meta.url), 'utf8');

assert.match(
  preWpJuly,
  /\[4,\s*5,\s*8\]\.includes\(step\.id\)[\s\S]*method-plan-step-file-\$\{step\.id\}/,
  'method plan step 8 should show the same file upload control as steps 4 and 5'
);

assert.match(
  preWpJuly,
  /\[3,\s*4,\s*5,\s*6,\s*7,\s*8\]\.includes\(step\.id\)[\s\S]*method-plan-step-note-\$\{step\.id\}/,
  'method plan step 8 should show the same text box as steps 3 through 7'
);

console.log('check passed: PreWpJuly step 8 inputs');
