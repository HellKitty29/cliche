import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GripVertical, Pin, PinOff } from 'lucide-react';
import * as XLSX from 'xlsx';
import { renderAsync } from 'docx-preview';

import { formatRowReference, getWorksheetRows, type RowReference } from '../utils/workingPaperRows';

type Opinion = { id: string; text: string; timestamp: string; fileId?: string; fileName?: string; rowReference?: RowReference };
type Reply = { id: string; opinionId: string; text: string; timestamp: string; author: string };
type WorkpaperStatus = { label: string; value: string; tone: 'success' | 'warning' | 'danger' | 'pending' };
export function WorkingPaperViewer({ file, opinions, replies, status, anomalies, onOpinion, onReply }: {
  file: File; opinions: Opinion[]; replies: Reply[]; status: WorkpaperStatus[]; anomalies: string[];
  onOpinion: (text: string, rowReference?: RowReference) => void; onReply: (id: string, text: string) => void;
}) {
  const target = window;
  const docContainer = useRef<HTMLDivElement>(null);
  const [book, setBook] = useState<XLSX.WorkBook | null>(null);
  const [sheet, setSheet] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [pinned, setPinned] = useState(true);
  const [position, setPosition] = useState(0);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const side = useRef<HTMLElement>(null);
  const main = useRef<HTMLElement>(null);
  const drag = useRef<{ x: number; right: number; width: number } | null>(null);
  const clampPosition = (right: number) => Math.max(0, Math.min(target.innerWidth - (side.current?.offsetWidth ?? 320), right));
  useEffect(() => {
    const resize = () => setPosition(current => clampPosition(current));
    target.addEventListener('resize', resize);
    return () => target.removeEventListener('resize', resize);
  }, []);
  useEffect(() => {
    let cancelled = false;
    document.title = file.name;
    setError('');
    setBook(null);
    setSheet('');
    setSelectedRows([]);
    setSelected(null);
    setLoading(true);
    const container = docContainer.current;
    container?.replaceChildren();
    (async () => {
      try {
        const buffer = await file.arrayBuffer();
        if (cancelled) return;
        if (/\.xlsx?$/i.test(file.name)) {
          const parsed = XLSX.read(buffer, { type: 'array' });
          setBook(parsed); setSheet(parsed.SheetNames[0] ?? '');
        } else if (/\.docx$/i.test(file.name) && container) {
          // Render off-screen so a cancelled parse cannot overwrite a newer file.
          const rendered = document.createElement('div');
          await renderAsync(buffer, rendered, undefined, { ignoreWidth: true, ignoreHeight: true, renderAltChunks: false });
          if (!cancelled) container.replaceChildren(rendered);
        } else setError('当前支持 Excel 和 DOCX 文件预览。');
      } catch { if (!cancelled) setError('文件无法预览，请确认文件格式正确且未加密。'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [file]);
  const data = useMemo(() => book && sheet ? getWorksheetRows(book.Sheets[sheet]) : [], [book, sheet]);
  const rowReference = selectedRows.length ? { sheetName: sheet, rows: selectedRows } : undefined;
  const selectOpinion = (opinion: Opinion) => {
    setSelected(opinion.id);
    if (book && opinion.rowReference && book.Sheets[opinion.rowReference.sheetName]) {
      setSheet(opinion.rowReference.sheetName);
      setSelectedRows(opinion.rowReference.rows);
    } else setSelectedRows([]);
  };
  useEffect(() => {
    if (selected && selectedRows.length) main.current?.querySelector(`[data-row-number="${selectedRows[0]}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selected, sheet, selectedRows]);
  return <div className={`wp-viewer ${pinned ? 'is-pinned' : ''}`}>
    <style>{`
      body { margin:0; font-family:Arial,"Microsoft YaHei",sans-serif; color:#334155; background:#f1f5f9 }
      .wp-viewer * { box-sizing:border-box } .wp-viewer button { cursor:pointer; border:1px solid #cbd5e1; border-radius:5px; background:white; color:#00338d; padding:7px 10px }
      .wp-viewer { --wp-side-width:min(320px,85vw); height:100vh; height:100dvh; overflow:hidden; display:flex; flex-direction:column }
      .wp-top { background:#00338d; color:white; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-shrink:0 }
      .wp-top span:first-child { overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
      .wp-main { padding:16px; overflow:auto; flex:1; min-height:0 }
      .wp-viewer.is-pinned .wp-top,.wp-viewer.is-pinned .wp-main { margin-right:var(--wp-side-width) }
      .wp-grid { border-collapse:collapse; background:white; font-size:12px } .wp-grid td,.wp-grid th { border:1px solid #dbe2ea; min-width:100px; max-width:360px; padding:7px; white-space:pre-wrap; overflow-wrap:anywhere } .wp-grid th { background:#eaf2fb; min-width:40px }
      .wp-grid tr.wp-row-selected td,.wp-grid tr.wp-row-selected th { background:#eff6ff; color:#00338d }
      .wp-grid th { position:sticky; left:0; z-index:1 } .wp-grid th label { display:flex; align-items:center; gap:8px; cursor:pointer; white-space:nowrap }
      .wp-grid input { accent-color:#00338d } .wp-row-context { font-size:11px; color:#00338d; margin:8px 0; overflow-wrap:anywhere }
      .wp-side { width:var(--wp-side-width); background:white; border-left:1px solid #cbd5e1; box-shadow:0 0 20px #33415522; display:flex; flex-direction:column; position:fixed; top:0; bottom:0; z-index:5 }
      .wp-status { padding:12px; border-bottom:1px solid #e2e8f0; background:#f8fafc; flex-shrink:0 } .wp-status-title { font-size:11px; font-weight:700; color:#00338d; margin-bottom:10px }
      .wp-status-row { display:flex; align-items:flex-start } .wp-status-item { flex:1; min-width:0; text-align:center; position:relative } .wp-status-line { height:2px; flex:0 0 18px; margin:7px -9px 0; background:#cbd5e1 }
      .wp-status-dot { width:16px; height:16px; margin:0 auto 5px; border-radius:999px; display:block; box-shadow:0 0 0 2px white } .wp-status-dot.success { background:#5f833a } .wp-status-dot.warning { background:#c59e40 } .wp-status-dot.danger { background:#d95755 } .wp-status-dot.pending { background:#94a3b8 }
      .wp-status-label { display:block; font-size:9px; line-height:12px; font-weight:700; color:#475569 } .wp-status-value { display:block; margin-top:2px; font-size:9px; line-height:12px; color:#64748b }
      .wp-side-header { padding:12px; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; font-size:14px; user-select:none }
      .wp-anomalies { margin-bottom:10px; border:1px solid #fecaca; border-radius:6px; background:#fef2f2; padding:9px } .wp-anomalies-title { margin-bottom:7px; color:#d95755; font-size:11px; font-weight:700 } .wp-anomaly { margin-top:5px; border-radius:4px; background:white; padding:7px; color:#475569; font-size:11px; line-height:1.45 }
      .wp-notes { padding:12px; overflow:auto; flex:1; min-height:0 } .wp-note { border:1px solid #e2e8f0; padding:10px; margin-bottom:8px; border-radius:6px; cursor:pointer; font-size:12px; white-space:pre-wrap; overflow-wrap:anywhere }
      .wp-note.selected { background:#eff6ff; border-color:#60a5fa; transform:translateX(-4px) } .wp-reply { background:#f1f7fd; padding:9px; margin-bottom:8px; font-size:12px; white-space:pre-wrap } .wp-meta { font-size:10px; color:#64748b; margin-bottom:5px }
      .wp-compose { padding:12px; border-top:1px solid #e2e8f0; flex-shrink:0; max-height:55%; overflow:auto } .wp-compose textarea { width:100%; height:80px; margin:8px 0; padding:8px; border:1px solid #cbd5e1; border-radius:5px; resize:vertical; font:11px/1.6 Arial,"Microsoft YaHei",sans-serif } .wp-compose button { font-size:11px; padding:5px 10px } .wp-compose button.wp-save { background:#00338d; color:white; border-color:#00338d } .wp-tabs { display:flex; gap:5px; margin-bottom:10px; flex-wrap:wrap } .wp-viewer button:disabled { opacity:.4; cursor:default }
    `}</style>
    <header className="wp-top"><span>{file.name}</span><span style={{ fontSize:12 }}>工作底稿 · 网页预览</span></header>
    <main className="wp-main" ref={main}>
      {loading && <p>正在加载文件…</p>}{error && <p role="alert">{error}</p>}
      {book && <><div className="wp-tabs">{book.SheetNames.map(name => <button key={name} onClick={() => { setSheet(name); setSelectedRows([]); setSelected(null); }} style={{ background:sheet === name ? '#dbeafe' : 'white' }}>{name}</button>)}</div>
      <p className="wp-row-context">勾选左侧行号，可为选中行添加意见（支持多行）。</p>
      <table className="wp-grid"><tbody>{data.map(row => <tr key={row.number} data-row-number={row.number} className={selectedRows.includes(row.number) ? 'wp-row-selected' : ''}><th scope="row"><label><input type="checkbox" aria-label={`选择第 ${row.number} 行`} checked={selectedRows.includes(row.number)} onChange={() => { setSelected(null); setSelectedRows(previous => previous.includes(row.number) ? previous.filter(number => number !== row.number) : [...previous, row.number].sort((a,b) => a-b)); }}/>{row.number}</label></th>{row.cells.map((cell, j) => <td key={j}>{String(cell)}</td>)}</tr>)}</tbody></table></>}
      <div ref={docContainer} />
    </main>
    <aside className="wp-side" ref={side} style={{ right:pinned ? 0 : position }}>
      <div className="wp-status">
        <div className="wp-status-title">底稿状态</div>
        <div className="wp-status-row">
          {status.map((step, index) => <React.Fragment key={step.label}>
            <div className="wp-status-item">
              <span className={`wp-status-dot ${step.tone}`} />
              <span className="wp-status-label">{step.label}</span>
              <span className="wp-status-value">{step.value}</span>
            </div>
            {index < status.length - 1 && <span className="wp-status-line" aria-hidden="true" />}
          </React.Fragment>)}
        </div>
      </div>
      <div className="wp-side-header" tabIndex={0} aria-label="拖动异常记录栏，或使用左右方向键移动" style={{ cursor:'ew-resize', touchAction:'none' }}
        onKeyDown={e => { if (e.target !== e.currentTarget || !['ArrowLeft','ArrowRight'].includes(e.key)) return; e.preventDefault(); setPinned(false); setPosition(clampPosition((pinned ? 0 : position) + (e.key === 'ArrowLeft' ? 20 : -20))); }}
        onPointerDown={e => { if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return; const rect = side.current!.getBoundingClientRect(); drag.current = { x:e.clientX,right:target.innerWidth-rect.right,width:rect.width }; setPosition(target.innerWidth-rect.right); setPinned(false); e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={e => { const d = drag.current; if (d) setPosition(Math.max(0,Math.min(target.innerWidth-d.width,d.right+d.x-e.clientX))); }}
        onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
        <strong style={{ display:'flex',alignItems:'center',gap:6 }}><GripVertical size={15}/>异常记录</strong><button title={pinned ? '取消固定，可拖动' : '固定到右侧'} onClick={() => { setPosition(0); setPinned(!pinned); }}>{pinned ? <Pin size={15}/> : <PinOff size={15}/>}</button>
      </div>
      <div className="wp-notes">
        {anomalies.length > 0 && <div className="wp-anomalies"><div className="wp-anomalies-title">系统预检异常</div>{anomalies.map(anomaly => <div className="wp-anomaly" key={anomaly}>{anomaly}</div>)}</div>}
        {!opinions.length && <p style={{ fontSize:12,color:'#94a3b8' }}>暂无复核意见</p>}{opinions.map((opinion,i) => <React.Fragment key={opinion.id}>
        <div role="button" tabIndex={0} className={`wp-note ${selected === opinion.id ? 'selected' : ''}`} onClick={() => selectOpinion(opinion)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectOpinion(opinion); } }}><div className="wp-meta">复核意见 {i+1} · {opinion.timestamp}</div>{opinion.rowReference && <div className="wp-row-context">{formatRowReference(opinion.rowReference)}</div>}{opinion.text}</div>
        {replies.filter(r => r.opinionId === opinion.id).map(r => <div className="wp-reply" key={r.id}><div className="wp-meta">回复人：{r.author} · {r.timestamp}</div>{r.text}</div>)}
      </React.Fragment>)}</div>
      <div className="wp-compose"><div style={{ display:'flex',justifyContent:'space-between',fontSize:11 }}><span>{selected ? '回复所选复核意见' : '新增本文件复核意见'}</span>{selected && <button onClick={() => { setSelected(null); setSelectedRows([]); }}>新增意见</button>}</div>
      {!selected && rowReference && <div className="wp-row-context" role="status">{formatRowReference(rowReference)} <button onClick={() => setSelectedRows([])}>清除选行</button></div>}
      <textarea aria-label="复核意见或回复" value={text} onChange={e => setText(e.target.value)} placeholder="请输入意见或回复…" />
      <button className="wp-save" disabled={!text.trim()} onClick={() => { if (selected) onReply(selected,text.trim()); else { onOpinion(text.trim(),rowReference); setSelectedRows([]); } setText(''); }}>保存</button></div>
    </aside>
  </div>;
}
