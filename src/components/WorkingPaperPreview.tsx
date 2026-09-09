import React, { useEffect, useRef, useState } from 'react';
import { WorkingPaperViewer } from './WorkingPaperViewer';
import { readRowReference } from '../utils/workingPaperRows';

type ViewerProps = React.ComponentProps<typeof WorkingPaperViewer>;
type Snapshot = Pick<ViewerProps, 'file' | 'opinions' | 'replies' | 'status' | 'anomalies'>;
const channelName = (id: string) => `working-paper-preview:${id}`;

// Only data crosses windows. The preview owns its document and its React root.
export function WorkingPaperPreviewSession(props: ViewerProps & {
  id: string; target: Window | null; onClose: () => void;
}) {
  const latest = useRef(props);
  latest.current = props;
  const channel = useRef<BroadcastChannel | null>(null);
  const [embedded, setEmbedded] = useState(!props.target);
  useEffect(() => {
    let ready = false;
    let fallback = !props.target;
    const showFallback = () => { fallback = true; setEmbedded(true); };
    const connection = new BroadcastChannel(channelName(props.id));
    channel.current = connection;
    const send = () => {
      const { file, opinions, replies, status, anomalies } = latest.current;
      connection.postMessage({ type: 'snapshot', file, opinions, replies, status, anomalies });
    };
    connection.onmessage = ({ data }) => {
      if (data?.type === 'ready') { ready = true; send(); }
      if (data?.type === 'opinion' && typeof data.text === 'string' && data.text.trim()) latest.current.onOpinion(data.text.trim(), readRowReference(data.rowReference));
      if (data?.type === 'reply' && typeof data.id === 'string' && typeof data.text === 'string' && data.text.trim()) latest.current.onReply(data.id, data.text.trim());
    };
    const timer = window.setInterval(() => {
      if (latest.current.target?.closed && !fallback) {
        if (ready) latest.current.onClose();
        else showFallback();
      }
    }, 1000);
    // Some hosts return a WindowProxy even when the new page never opens.
    const timeout = window.setTimeout(() => { if (!ready) showFallback(); }, 5000);
    return () => { clearInterval(timer); clearTimeout(timeout); connection.close(); channel.current = null; };
  }, [props.id]);
  useEffect(() => {
    channel.current?.postMessage({ type: 'snapshot', file: props.file, opinions: props.opinions, replies: props.replies, status: props.status, anomalies: props.anomalies });
  }, [props.file, props.opinions, props.replies, props.status, props.anomalies]);
  if (!embedded) return null;
  const previewUrl = new URL(window.location.href);
  previewUrl.search = '';
  previewUrl.hash = '';
  previewUrl.searchParams.set('workingPaperPreview', props.id);
  return <div role="dialog" aria-modal="true" aria-label={`底稿预览：${props.file.name}`}
    style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#0f172a80', padding: 16 }}>
    <div style={{ height: '100%', background: 'white', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderBottom: '1px solid #cbd5e1' }}>
        <span style={{ flex: 1 }}>新窗口未能打开，已在当前页面预览</span>
        <a href={previewUrl.href} target="_blank" rel="noopener noreferrer" style={{ color: '#00338d' }}>在新窗口打开</a>
        <button type="button" onClick={props.onClose} aria-label="关闭底稿预览" style={{ padding: '4px 12px' }}>关闭</button>
      </div>
      <iframe title={`文件预览：${props.file.name}`} src={previewUrl.href} style={{ flex: 1, width: '100%', minHeight: 0, border: 0 }} />
    </div>
  </div>;
}

class PreviewErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed
      ? <p role="alert">文件预览失败，请关闭此窗口后重新打开，或检查文件是否损坏。原页面可继续使用。</p>
      : this.props.children;
  }
}

export function WorkingPaperPreviewWindow({ id }: { id: string }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const connection = useRef<BroadcastChannel | null>(null);
  useEffect(() => {
    const channel = new BroadcastChannel(channelName(id));
    connection.current = channel;
    let received = false;
    channel.onmessage = ({ data }) => {
      if (data?.type !== 'snapshot' || !(data.file instanceof File) || !Array.isArray(data.opinions) || !Array.isArray(data.replies) || !Array.isArray(data.status) || !Array.isArray(data.anomalies)) return;
      received = true;
      setUnavailable(false);
      // Opinion updates must not reparse the same file or reset the document scroll.
      setSnapshot(previous => ({ file: previous?.file ?? data.file, opinions: data.opinions, replies: data.replies, status: data.status, anomalies: data.anomalies }));
    };
    channel.postMessage({ type: 'ready' });
    const retry = window.setInterval(() => { if (!received) channel.postMessage({ type: 'ready' }); }, 1000);
    const timeout = window.setTimeout(() => { if (!received) setUnavailable(true); }, 10000);
    return () => { clearInterval(retry); clearTimeout(timeout); channel.close(); connection.current = null; };
  }, [id]);
  if (!snapshot) return <p role="status" style={{ padding: 24 }}>{unavailable
    ? '无法取得本地文件，请保持原页面打开，并从“查看底稿”重新打开预览。'
    : '正在加载本地文件…'}</p>;
  return <PreviewErrorBoundary><WorkingPaperViewer {...snapshot}
    onOpinion={(text, rowReference) => connection.current?.postMessage({ type: 'opinion', text, rowReference })}
    onReply={(opinionId, text) => connection.current?.postMessage({ type: 'reply', id: opinionId, text })}
  /></PreviewErrorBoundary>;
}
