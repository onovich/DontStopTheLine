import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <main className="phase-zero-shell">
      <p className="eyebrow">PHASE 0 · ENGINEERING BASELINE</p>
      <h1>Don't Stop The Line</h1>
      <p className="chinese-title">产线别停</p>
      <p className="status">Web composition root is ready.</p>
    </main>
  );
}

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Missing #root element.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
