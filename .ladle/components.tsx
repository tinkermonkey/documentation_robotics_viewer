import type { GlobalProvider } from "@ladle/react";
import "@/index.css";

export const Provider: GlobalProvider = ({ children }) => (
  <div className="min-h-screen bg-white dark:bg-gray-900">
    {children}
  </div>
);
