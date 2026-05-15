import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, ChevronDown, Copy, ListPlus, X, Check, CircleAlert } from 'lucide-react';

interface RowData {
  id: string;
  [key: string]: string; 
}

const COLUMN_IDS = [
  'category', 'assetId', 'description', 'depMethod', 'acqDate', 
  'recordedAmount', 'nbv', 'usefulLife', 'salvageValue', 'periodDep',
  'expectedMonthlyDep', 'dateAvailable', 'expectedStartDate', 'periodStart', 'periodEnd',
  'monthsToStart', 'monthsToEnd', 'monthsForPeriod', 'recalcDep', 'variance',
  'inspectData', 'compareSystem', 'notes'
];

const INITIAL_ROWS: RowData[] = [
  {
    id: '1',
    category: '', assetId: '', description: '', depMethod: '', acqDate: '',
    recordedAmount: '', nbv: '', usefulLife: '', salvageValue: '', periodDep: '',
    expectedMonthlyDep: '', dateAvailable: '', expectedStartDate: '01/02/1900', periodStart: '', periodEnd: '',
    monthsToStart: '-', monthsToEnd: '-', monthsForPeriod: '-', recalcDep: '-', variance: '-',
    inspectData: 'Not selected 未选', compareSystem: 'Not selected 未选', notes: ''
  },
];

const DERIVED_FIELDS = new Set([
  'expectedMonthlyDep',
  'expectedStartDate',
  'monthsToStart',
  'monthsToEnd',
  'monthsForPeriod',
  'recalcDep',
  'variance',
]);

const STICKY_COLUMN_CLASS: Record<string, string> = {
  category: 'sticky left-[48px] z-20 min-w-[120px] bg-white group-hover:bg-slate-50',
  assetId: 'sticky left-[168px] z-20 min-w-[100px] bg-white group-hover:bg-slate-50',
  description: 'sticky left-[268px] z-20 min-w-[150px] bg-white group-hover:bg-slate-50 shadow-[8px_0_12px_-12px_rgba(15,23,42,0.8)]',
};

const parseNumber = (value: string): number | null => {
  const normalized = value.replace(/,/g, '').trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseExcelDate = (value: string): Date | null => {
  const normalized = value.trim();
  if (!normalized) return null;

  const serial = Number(normalized);
  if (Number.isFinite(serial) && serial > 0) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    return new Date(excelEpoch + serial * 24 * 60 * 60 * 1000);
  }

  const parts = normalized.match(/^(\d{1,4})[/-](\d{1,2})[/-](\d{1,4})$/);
  if (!parts) {
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const first = Number(parts[1]);
  const second = Number(parts[2]);
  const third = Number(parts[3]);
  const year = parts[1].length === 4 ? first : third;
  const month = parts[1].length === 4 ? second : first;
  const day = parts[1].length === 4 ? third : second;
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
};

const endOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const formatDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${date.getFullYear()}`;
};

const dateDiffMonths = (start: Date, end: Date): number => {
  let months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
  if (end.getDate() < start.getDate()) months -= 1;
  return Math.max(months, 0);
};

const formatCalculatedNumber = (value: number): string => {
  if (!Number.isFinite(value)) return '';
  if (value === 0) return '-';
  return (Math.round(value * 100) / 100).toFixed(2);
};

const calculateRow = (row: RowData): RowData => {
  const recordedAmount = parseNumber(row.recordedAmount);
  const usefulLife = parseNumber(row.usefulLife);
  const salvageValue = parseNumber(row.salvageValue);
  const periodDep = parseNumber(row.periodDep);
  const dateAvailable = parseExcelDate(row.dateAvailable);
  const periodStart = parseExcelDate(row.periodStart);
  const periodEnd = parseExcelDate(row.periodEnd);

  const expectedMonthlyDep =
    recordedAmount !== null && usefulLife !== null && usefulLife !== 0
      ? (recordedAmount - (salvageValue ?? 0)) / usefulLife
      : null;
  const expectedStartDate = dateAvailable ? addDays(endOfMonth(dateAvailable), 1) : null;
  const monthsToStart =
    expectedStartDate && periodStart && expectedStartDate < periodStart
      ? dateDiffMonths(expectedStartDate, periodStart)
      : 0;
  const monthsToEnd =
    expectedStartDate && periodEnd
      ? dateDiffMonths(expectedStartDate, addDays(endOfMonth(periodEnd), 1))
      : null;

  let monthsForPeriod: number | null = null;
  if (usefulLife !== null && monthsToEnd !== null) {
    if (usefulLife <= monthsToStart) monthsForPeriod = 0;
    else if (monthsToStart < usefulLife && usefulLife < monthsToEnd) monthsForPeriod = usefulLife - monthsToStart;
    else monthsForPeriod = monthsToEnd - monthsToStart;
  }

  const recalcDep =
    expectedMonthlyDep !== null && monthsForPeriod !== null ? expectedMonthlyDep * monthsForPeriod : null;
  const variance = recalcDep !== null && periodDep !== null ? recalcDep - periodDep : null;

  return {
    ...row,
    expectedMonthlyDep: expectedMonthlyDep === null ? '' : formatCalculatedNumber(expectedMonthlyDep),
    expectedStartDate: expectedStartDate ? formatDate(expectedStartDate) : '',
    monthsToStart: formatCalculatedNumber(monthsToStart),
    monthsToEnd: monthsToEnd === null ? '' : formatCalculatedNumber(monthsToEnd),
    monthsForPeriod: monthsForPeriod === null ? '' : formatCalculatedNumber(monthsForPeriod),
    recalcDep: recalcDep === null ? '' : formatCalculatedNumber(recalcDep),
    variance: variance === null ? '' : formatCalculatedNumber(variance),
  };
};

export default function InventoryMatrix() {
  const [rows, setRows] = useState<RowData[]>(INITIAL_ROWS);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState('');

  const createNewRow = (data: Partial<RowData> = {}): RowData => {
    const row: RowData = { id: Math.random().toString(36).substr(2, 9) };
    COLUMN_IDS.forEach(id => {
      row[id] = data[id] || '';
    });
    row.expectedStartDate = row.expectedStartDate || '01/02/1900';
    return row;
  };

  const addRow = () => {
    setRows([...rows, createNewRow()]);
  };

  const handleBulkAdd = () => {
    const lines = bulkInput.split('\n').filter(line => line.trim().length > 0);
    const newRows = lines.map(line => {
      const columns = line.split('\t');
      const rowData: Partial<RowData> = {};
      COLUMN_IDS.forEach((id, idx) => {
        if (columns[idx]) rowData[id] = columns[idx].trim();
      });
      return createNewRow(rowData);
    });

    if (newRows.length > 0) {
      setRows([...rows, ...newRows]);
      setBulkInput('');
      setIsBulkModalOpen(false);
    }
  };

  const duplicateRow = (row: RowData) => {
    const newRow = { ...row, id: Math.random().toString(36).substr(2, 9) };
    setRows([...rows, newRow]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const updateRow = (id: string, field: string, value: string) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-xl relative overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 min-w-[3200px] text-[11px] font-sans">
          <thead>
            {/* Top Tier Header */}
            <tr className="bg-[#003399] text-white">
              <th className="sticky left-0 z-40 p-3 border-r border-white/20 w-12 min-w-[48px] bg-[#003399]" rowSpan={2}>#</th>
              <th className="sticky left-[48px] z-40 p-3 border-r border-white/20 font-bold bg-[#003399] min-w-[370px] shadow-[8px_0_12px_-12px_rgba(15,23,42,0.8)]" colSpan={3}>
                Asset information <br/> 
              </th>
              <th className="p-3 border-r border-white/20 font-bold" colSpan={12}>
                Per PPE system or assets register <br/> 基于固定资产系统或资产台账
              </th>
              <th className="p-3 border-r border-white/20 font-bold" colSpan={5}>
                1. Recalculation of depreciation expense <br/> 1. 重新计算折旧费用
              </th>
              <th className="p-3 border-r border-white/20 font-bold" colSpan={2}>
                Testing steps <br/> 测试步骤
              </th>
              <th className="p-3 font-bold" rowSpan={2}>
                Notes <br/> 注释
              </th>
            </tr>
            {/* Second Tier Header */}
            <tr className="bg-[#003399] text-white border-t border-white/10 text-center">
              <th className="sticky left-[48px] z-30 p-2 border-r border-white/20 font-medium w-[120px] min-w-[120px] bg-[#003399]">Asset category<br/>资产类别</th>
              <th className="sticky left-[168px] z-30 p-2 border-r border-white/20 font-medium w-[100px] min-w-[100px] bg-[#003399]">Asset ID<br/>资产编号</th>
              <th className="sticky left-[268px] z-30 p-2 border-r border-white/20 font-medium w-[150px] min-w-[150px] bg-[#003399] shadow-[8px_0_12px_-12px_rgba(15,23,42,0.8)]">Asset description<br/>资产描述</th>
              <th className="p-2 border-r border-white/20 font-medium w-[120px]">Depreciation method<br/>折旧方法</th>
              <th className="p-2 border-r border-white/20 font-medium w-[140px]">
                <div className="flex flex-col items-center">
                  <span>Acquisition date</span>
                  <span className="italic text-red-400 mt-1">a</span>
                </div>
              </th>
              <th className="p-2 border-r border-white/20 font-medium w-[120px]">
                <div className="flex flex-col items-center text-center">
                  <span>Recorded amount Rmb</span>
                  <span className="italic text-red-400 mt-1">b1</span>
                </div>
              </th>
              <th className="p-2 border-r border-white/20 font-medium w-[120px]">
                <div className="flex flex-col items-center">
                  <span>NBV at start of period</span>
                  <span className="italic text-red-400 mt-1">b2</span>
                </div>
              </th>
              <th className="p-2 border-r border-white/20 font-medium w-[110px]">
                <div className="flex flex-col items-center">
                  <span>Useful life (months)</span>
                  <span className="italic text-red-400 mt-1">c</span>
                </div>
              </th>
              <th className="p-2 border-r border-white/20 font-medium w-[110px]">
                <div className="flex flex-col items-center">
                  <span>Salvage value</span>
                  <span className="italic text-red-400 mt-1">d</span>
                </div>
              </th>
              <th className="p-2 border-r border-white/20 font-medium w-[120px]">
                <div className="flex flex-col items-center">
                  <span>Dep for period</span>
                  <span className="italic text-red-400 mt-1">D</span>
                </div>
              </th>
              <th className="p-2 border-r border-white/20 font-medium w-[140px]">
                <div className="flex flex-col items-center text-center">
                  <span>Exp monthly dep</span>
                  <span className="italic text-red-400 mt-1">A=(b-d)/c</span>
                </div>
              </th>
              <th className="p-2 border-r border-white/20 font-medium w-[140px]">
                <div className="flex flex-col items-center">
                  <span>PPE date for use</span>
                  <span className="italic text-red-400 mt-1">g</span>
                </div>
              </th>
              <th className="p-2 border-r border-white/20 font-medium w-[150px]">
                <div className="flex flex-col items-center text-center">
                   <span>Exp start date</span>
                   <span className="italic text-red-400 mt-1 text-[9px]">i=EOMONTH(g,0)+1</span>
                </div>
              </th>
              <th className="p-2 border-r border-white/20 font-medium w-[120px]">
                <div className="flex flex-col items-center">
                  <span>Period start</span>
                  <span className="italic text-red-400 mt-1">ii</span>
                </div>
              </th>
              <th className="p-2 border-r border-white/20 font-medium w-[120px]">
                <div className="flex flex-col items-center">
                  <span>Period end</span>
                  <span className="italic text-red-400 mt-1">iii</span>
                </div>
              </th>

              <th className="p-2 border-r border-white/20 font-medium w-[160px]">
                <div className="flex flex-col items-center text-center">
                  <span>Months Start to P-Start</span>
                  <span className="italic text-red-400 mt-1 text-[9px]">e</span>
                </div>
              </th>
              <th className="p-2 border-r border-white/20 font-medium w-[160px]">
                <div className="flex flex-col items-center text-center">
                  <span>Months Start to P-End</span>
                  <span className="italic text-red-400 mt-1 text-[9px]">f</span>
                </div>
              </th>
              <th className="p-2 border-r border-white/20 font-medium w-[150px]">
                <div className="flex flex-col items-center text-center">
                  <span>Months for period</span>
                  <span className="italic text-red-400 mt-1">B</span>
                </div>
              </th>
              <th className="p-2 border-r border-white/20 font-medium w-[140px]">
                <div className="flex flex-col items-center">
                  <span>Recalc dep expense 重新计算后的折旧费用
              人民币</span>
                  <span className="italic text-red-400 mt-1">C=A*B</span>
                </div>
              </th>
              <th className="p-2 border-r border-white/20 font-medium w-[120px]">
                <div className="flex flex-col items-center">
                  <span>Variance RMB</span>
                  <span className="italic text-red-400 mt-1">E=C-D</span>
                </div>
              </th>

              <th className="p-2 border-r border-white/20 font-medium w-[200px] text-left">
                2. Inspect the data used in the calculation to relevant documentation (e.g.: depreciation policy, useful life analysis, etc.).
                </th>
              <th className="p-2 border-r border-white/20 font-medium w-[200px] text-left">3. Compare the recalculated amounts to the amount recorded in the property, plant and equipment system.</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((row, index) => {
                const displayRow = calculateRow(row);

                return (
                <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group hover:bg-slate-50 transition-colors border-b border-slate-200">
                  <td className="sticky left-0 z-30 p-2 border-r border-slate-300 text-center text-slate-400 font-mono bg-slate-50 group-hover:bg-slate-100 min-w-[48px]">{index + 1}</td>
                  {COLUMN_IDS.map((field) => {
                    const isDerivedField = DERIVED_FIELDS.has(field);
                    const rowNumber = index + 1;
                    const showVarianceAlert = field === 'variance' && (rowNumber === 1 || rowNumber === 7);
                    const showPpeDateAlert = field === 'dateAvailable' && rowNumber === 1;

                    return (
                    <td key={field} className={`p-0 border-r border-slate-300 relative ${STICKY_COLUMN_CLASS[field] ?? ''}`}>
                      {field === 'inspectData' || field === 'compareSystem' ? (
                        <select className="w-full h-full p-2 bg-transparent appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer pr-6 text-slate-600" value={displayRow[field]} onChange={(e) => updateRow(row.id, field, e.target.value)}>
                          <option>Not selected 未选</option>
                          <option>Agree 相符</option>
                          <option>Disagrees 不符</option>
                          <option>N/A 不适用</option>
                        </select>
                      ) : (
                        <input className={`w-full p-2 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono text-[10px] ${isDerivedField ? 'text-blue-600 bg-blue-50/40 cursor-not-allowed' : ''}`} value={displayRow[field]} onChange={(e) => updateRow(row.id, field, e.target.value)} readOnly={isDerivedField} />
                      )}
                      {(showVarianceAlert || showPpeDateAlert) && (
                        <div className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 z-20 text-[#d06777]">
                          <CircleAlert size={14} color="#ec749e" />
                        </div>
                      )}
                      {field === 'notes' && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-1 translate-x-full pl-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none group-hover:pointer-events-auto">
                          <button onClick={() => duplicateRow(row)} className="p-1.5 bg-white border border-slate-200 rounded text-slate-400 hover:text-slate-600 shadow-sm transition-all"><Copy size={12} /></button>
                          <button onClick={() => removeRow(row.id)} className="p-1.5 bg-white border border-slate-200 rounded text-slate-400 hover:text-red-500 shadow-sm transition-all" disabled={rows.length === 1}><Trash2 size={12} /></button>
                        </div>
                      )}
                    </td>
                    );
                  })}
                </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
        <div className="flex gap-2">
          <button onClick={addRow} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600 shadow-sm transition-all">
            <Plus size={14} /> 添加单条资产
          </button>
          <button onClick={() => setIsBulkModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#003399] text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-md transition-all">
             <ListPlus size={14} /> 批量粘贴 Excel
          </button>
        </div>
        <div className="text-xs font-mono text-slate-400">Records: {rows.length}</div>
      </div>

      {/* Bulk Add Modal */}
      <AnimatePresence>
        {isBulkModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBulkModalOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-[101] overflow-hidden">
               <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900">批量粘贴 Excel</h3>
                  <button onClick={() => setIsBulkModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                </div>
                <p className="text-xs text-slate-500 bg-blue-50 p-2 rounded">直接粘贴 Excel 选中的多列多行数据即可。</p>
                <textarea autoFocus className="w-full h-80 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#003399] outline-none font-mono text-[10px]" value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} />
                <div className="flex gap-3">
                  <button onClick={() => setIsBulkModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 font-semibold">取消</button>
                  <button onClick={handleBulkAdd} className="flex-1 bg-[#003399] text-white px-4 py-2 rounded-lg text-sm font-semibold">识别并导入</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
