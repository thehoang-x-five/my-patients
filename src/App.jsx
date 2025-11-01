import React from 'react';
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Sidebar from "./components/ui/Sidebar.jsx";
import Topbar from "./components/ui/Topbar.jsx";
import { ErrorBoundary } from "./components/ui/ErrorBoundary.jsx";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
export default function App() {
  const location = useLocation();
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="pl-[var(--sbw)]">
        <Topbar />
        <main className="overflow-auto scrollbar-none">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <Outlet key={location.pathname} />
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
