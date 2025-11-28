import React from 'react';
import ReactDOM from 'react-dom/client';
import DebugApp from './DebugApp';
import '../../index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <DebugApp />
  </React.StrictMode>
);
