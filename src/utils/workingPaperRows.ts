import * as XLSX from 'xlsx';

export type RowReference = { sheetName: string; rows: number[] };

export function getWorksheetRows(sheet: XLSX.WorkSheet) {
  if (!sheet['!ref']) return [];
  const firstRow = XLSX.utils.decode_range(sheet['!ref']).s.r;
  return XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '', raw: false, blankrows: true })
    .map((cells, index) => ({ number: firstRow + index + 1, cells }));
}

export function formatRowReference(reference: RowReference): string {
  return `${reference.sheetName} · 第 ${reference.rows.join('、')} 行`;
}

export function readRowReference(value: unknown): RowReference | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const reference = value as RowReference;
  if (typeof reference.sheetName !== 'string' || !Array.isArray(reference.rows) || !reference.rows.length
    || !reference.rows.every(row => Number.isInteger(row) && row > 0 && row <= 1048576)) return undefined;
  return { sheetName: reference.sheetName, rows: [...new Set(reference.rows)].sort((a, b) => a - b) };
}
