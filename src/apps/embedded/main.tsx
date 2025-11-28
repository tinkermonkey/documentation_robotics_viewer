import React from 'react';
import ReactDOM from 'react-dom/client';
import EmbeddedApp from './EmbeddedApp';
import '../../index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <EmbeddedApp />
  </React.StrictMode>
);
