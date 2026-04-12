import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import "./index.css";
import { UIProvider } from "./context/UIContext.jsx";
import App from "./App.jsx";
import AppProviders from "./providers/AppProviders.jsx";
import Login from "./routes/Login.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const Overview = React.lazy(() => import("./routes/Overview.jsx"));
const Appointments = React.lazy(() => import("./routes/Appointments.jsx"));
const Examination = React.lazy(() => import("./routes/Examination.jsx"));
const Patients = React.lazy(() => import("./routes/Patients.jsx"));
const Departments = React.lazy(() => import("./routes/Departments.jsx"));
const Staff = React.lazy(() => import("./routes/Staff.jsx"));
const Prescriptions = React.lazy(() => import("./routes/Prescriptions.jsx"));
const History = React.lazy(() => import("./routes/History.jsx"));
const Notifications = React.lazy(() => import("./routes/Notifications.jsx"));
const Reports = React.lazy(() => import("./routes/Reports.jsx"));
const Settings = React.lazy(() => import("./routes/Settings.jsx"));
const AdminUsers = React.lazy(() => import("./routes/AdminUsers.jsx"));
const UnpaidInvoices = React.lazy(() => import("./routes/UnpaidInvoices.jsx"));

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute permKey="overview">
            <Overview />
          </ProtectedRoute>
        ),
      },
      {
        path: "/appointments",
        element: (
          <ProtectedRoute permKey="appointments">
            <Appointments />
          </ProtectedRoute>
        ),
      },
      {
        path: "/examination",
        element: (
          <ProtectedRoute permKey="examination">
            <Examination />
          </ProtectedRoute>
        ),
      },
      {
        path: "/patients",
        element: (
          <ProtectedRoute permKey="patients">
            <Patients />
          </ProtectedRoute>
        ),
      },
      {
        path: "/departments",
        element: (
          <ProtectedRoute permKey="departments">
            <Departments />
          </ProtectedRoute>
        ),
      },
      {
        path: "/staff",
        element: (
          <ProtectedRoute permKey="staff">
            <Staff />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/users",
        element: (
          <ProtectedRoute permKey="adminUsers">
            <Staff />
          </ProtectedRoute>
        ),
      },
      {
        path: "/prescriptions",
        element: (
          <ProtectedRoute permKey="prescriptions">
            <Prescriptions />
          </ProtectedRoute>
        ),
      },
      {
        path: "/unpaid-invoices",
        element: (
          <ProtectedRoute permKey="unpaidInvoices">
            <UnpaidInvoices />
          </ProtectedRoute>
        ),
      },
      {
        path: "/history",
        element: (
          <ProtectedRoute permKey="history">
            <History />
          </ProtectedRoute>
        ),
      },
      {
        path: "/notifications",
        element: (
          <ProtectedRoute permKey="notifications">
            <Notifications />
          </ProtectedRoute>
        ),
      },
      {
        path: "/reports",
        element: (
          <ProtectedRoute permKey="reports">
            <Reports />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings",
        element: (
          <ProtectedRoute permKey="settings">
            <Settings />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UIProvider>
      <Suspense fallback={<div className="p-6">Đang tải…</div>}>
        <AnimatePresence mode="wait">
        <AppProviders>
     <RouterProvider router={router} />
     <ToastContainer
      limit={1}
      newestOnTop
      position="top-right"
      autoClose={3200}
      pauseOnFocusLoss={false}
     />
    </AppProviders>
        </AnimatePresence>
      </Suspense>
    </UIProvider>
  </React.StrictMode>
);
