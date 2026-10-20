const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const options = { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022, esModuleInterop: true };
for (const ext of ['.ts', '.tsx']) {
  require.extensions[ext] = (module, filename) => module._compile(ts.transpile(fs.readFileSync(filename, 'utf8'), options), filename);
}
const filename = path.resolve(__dirname, '../components/InventoryMatrixJuly.tsx');
const source = fs.readFileSync(filename, 'utf8');
for (const unit of ['million', 'thousand']) {
for (const [view, count] of [[null, 17], ['balance', 17], ['management', 13], ['monitoring', 15], ['all', 25]]) {
  const module = new Module(filename);
  module.filename = filename;
  module.paths = Module._nodeModulePaths(path.dirname(filename));
  const testSource = source
    .replace('useState<InventoryMatrixView | null>(null)', `useState<InventoryMatrixView | null>(${JSON.stringify(view)})`)
    .replace("useState<'million' | 'thousand'>('million')", `useState<'million' | 'thousand'>('${unit}')`);
  module._compile(ts.transpile(testSource + '\nexport { formatInventoryWebAmount, convertInventoryWebAmountToRaw };', options), filename);
  const { default: Matrix, createInventoryMatrixRow } = module.exports;
  const row = { ...createInventoryMatrixRow('a'), otherCharacteristics: '低温存储', finalPlannedBalance: '10000000', interimPlannedBalance: '5000000',
    systemType: '永续盘存系统', countMethod: '在期末完成盘点',
    endingBalanceConfirmation: '期末存货余额通过存货出入库和移动的记录来确认',
    inventoryCountPlan: '在期末实施的、盘点对象为整个存货总体的实地存货盘点',
  };
  const html = renderToStaticMarkup(React.createElement(Matrix, { rows: [row], embedded: true }));
  assert.ok(html.includes('金额显示单位'));
  const scale = unit === 'million' ? 0.000001 : 0.001;
  const { formatInventoryWebAmount, convertInventoryWebAmountToRaw } = module.exports;
  assert.equal(formatInventoryWebAmount('10000000', scale), unit === 'million' ? '10.00' : '10,000.00');
  assert.equal(convertInventoryWebAmountToRaw(unit === 'million' ? '2.50' : '2,500.00', scale), '2,500,000.00');
  assert.equal(formatInventoryWebAmount('', scale), '');
  assert.equal(row.finalPlannedBalance, '10000000');
  assert.ok(html.includes('存货其他特征'));
  assert.ok(html.includes('低温存储'));
  assert.ok(html.includes('存货构成'));
  assert.ok(!html.includes('>其他安排<'));
  const table = html.match(/<table\b[\s\S]*?<\/table>/)[0];
  const headerRows = table.match(/<thead[\s\S]*?<\/thead>/)[0].match(/<tr\b[\s\S]*?<\/tr>/g);
  assert.equal(headerRows.length, 2, `${view}: group row above existing headers`);
  const groupRow = headerRows[0];
  assert.equal(groupRow.includes('被审计单位的存货管理方式'), view === null || view === 'management' || view === 'all');
  assert.equal(groupRow.includes('项目组计划的存货监盘方法'), view === null || view === 'monitoring' || view === 'all');
  assert.equal(groupRow.includes('存货构成'), view === null || view === 'balance' || view === 'all');
  const tableWidth = table.match(/^<table[^>]*style="width:([^";]+)/)[1];
  assert.equal(tableWidth.endsWith('px'), view === 'all', `${view}: only all fields use a scrolling width`);
  if (view !== 'all') assert.equal(tableWidth, '100%', `${view}: fill available width without scrolling`);
  const columnWidthSum = [...table.matchAll(/<col style="width:([\d.]+)(?:px|%)/g)]
    .reduce((total, match) => total + Number(match[1]), 0);
  assert.ok(Math.abs(columnWidthSum - parseFloat(tableWidth)) < 0.01, `${view}: columns fill the shared width`);
  assert.equal((table.match(/<col\s/g) || []).length, count, `${view}: column definitions`);
  for (const rowHtml of table.matchAll(/<tr\b[\s\S]*?<\/tr>/g)) {
    const spannedColumns = [...rowHtml[0].matchAll(/<(?:td|th)\s[^>]*>/g)]
      .reduce((total, cell) => total + Number(cell[0].match(/colSpan="(\d+)"/i)?.[1] ?? 1), 0);
    assert.equal(spannedColumns, count, `${view}: grouped headers, data and totals align`);
  }
  if (view === 'management' || view === 'all') {
    assert.equal((table.match(/colSpan="2"/gi) || []).length, 2);
    assert.ok(table.includes('如何确认期末存货余额'));
    assert.ok(table.includes('（设计的盘点方法）'));
  }
  if (view === 'all') {
    assert.ok(!table.includes('上期'), 'all view excludes prior-period amounts');
    assert.ok(!table.includes('变动'), 'all view excludes prior-period comparisons');
    assert.ok(table.includes('本期期末余额') && table.includes('本期预审阶段余额'));
  }
  const dataCells = [...table.matchAll(/<tr\b[\s\S]*?<\/tr>/g)][2][0].match(/<td\b[\s\S]*?<\/td>/g);
  if (view === 'management' || view === 'all') {
    const start = view === 'management' ? 6 : 10;
    assert.ok(dataCells[start].includes(`title="${row.endingBalanceConfirmation}"`));
    assert.ok(dataCells[start + 1].includes(`title="${row.systemType}"`));
    assert.ok(dataCells[start + 2].includes(`title="${row.inventoryCountPlan}"`));
    assert.ok(dataCells[start + 3].includes(`title="${row.countMethod}"`));
  }
  if (view === null) {
    assert.ok(dataCells[9].includes(`title="${row.endingBalanceConfirmation}"`));
    assert.ok(dataCells[10].includes(`title="${row.inventoryCountPlan}"`));
  }
  if (view === null || view === 'all' || view === 'monitoring') assert.ok(table.includes('抽盘数量说明'));
  if (view === 'balance') {
    assert.ok(table.includes('本期期末余额'));
    assert.ok(table.includes('本期预审阶段余额'));
    const finalAmount = unit === 'million' ? '10.00' : '10,000.00';
    const interimAmount = unit === 'million' ? '5.00' : '5,000.00';
    assert.ok(table.includes(`value="${finalAmount}"`));
    assert.ok(table.includes(`value="${interimAmount}"`));
    assert.ok(table.includes(`>${finalAmount}</div>`), 'total follows unit');
    assert.ok(table.includes(unit === 'million' ? '百万元' : '千元'));
    if (unit === 'thousand') assert.ok(!table.includes('百万元'));
  }
  if (view === 'monitoring') {
    assert.ok(!table.includes('本期期末余额'), 'monitoring view does not include the balance column');
    for (const label of ['可否前往实地', '前往当日客户', '计划的审计方案', '抽盘数量', '是否发出函证', '现场监盘 vs 远程监盘', '是否引入专家', '内部审计工作']) assert.ok(table.includes(label), label);
  }
}
}
console.log('All July matrix views and both amount units pass: columns, balances, totals and raw amount conversion.');
