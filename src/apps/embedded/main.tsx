import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { ThemeProvider } from 'flowbite-react';
import { router } from './router';
import { customTheme } from '../../theme/customTheme';
import '../../index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider theme={customTheme as any}>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);
