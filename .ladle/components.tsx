import type { GlobalProvider } from "@ladle/react";
import { MemoryRouter } from 'react-router-dom';
import "@/index.css";

export const Provider: GlobalProvider = ({ children }) => (
  <MemoryRouter>
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {children}
    </div>
  </MemoryRouter>
);
