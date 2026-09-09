import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {WorkingPaperPreviewWindow} from './components/WorkingPaperPreview';

const previewId = new URLSearchParams(window.location.search).get('workingPaperPreview');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {previewId ? <WorkingPaperPreviewWindow id={previewId} /> : <App />}
  </StrictMode>,
);
