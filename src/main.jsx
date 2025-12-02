import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import "./index.css";
import { UIProvider } from "./context/UIContext.jsx";
import App from "./App.jsx";
import AppProviders from "./providers/AppProviders.jsx";
import Login from "./routes/Login.jsx";
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

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Overview /> },
      { path: "/appointments", element: <Appointments /> },
      { path: "/examination", element: <Examination /> },
      { path: "/patients", element: <Patients /> },
      { path: "/departments", element: <Departments /> },
      { path: "/staff", element: <Staff /> },
      { path: "/prescriptions", element: <Prescriptions /> },
      { path: "/history", element: <History /> },
      { path: "/notifications", element: <Notifications /> },
      { path: "/reports", element: <Reports /> },
      { path: "/settings", element: <Settings /> },
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
     <ToastContainer />
    </AppProviders>
        </AnimatePresence>
      </Suspense>
    </UIProvider>
  </React.StrictMode>
);
