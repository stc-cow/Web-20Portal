import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import { I18nProvider } from "./i18n";
import Placeholder from "./pages/Placeholder";
import Login from "./pages/Login";
import AdminUsersPage from "./pages/users/Admins";
import AuthorizationsPage from "./pages/users/Authorizations";
import UsersIndexPage from "./pages/users/Index";
import MissionsPage from "./pages/missions/Missions";
import EmployeesIndexPage from "./pages/employees/Index";
import DriversPage from "./pages/employees/Drivers";
import TechniciansPage from "./pages/employees/Technicians";
import SitesPage from "./pages/sites/Sites";
import GeneratorsPage from "./pages/generators/Generators";
import ReportsPage from "./pages/reports/Reports";
import NotificationsPage from "./pages/notifications/Notifications";
import SettingsIndexPage from "./pages/settings/Index";
import GeneralSettingsPage from "./pages/settings/General";
import AdminLogPage from "./pages/settings/AdminLog";
import NotFound from "./pages/NotFound";
import DriverApp from "./pages/mobile/DriverApp";
import { Capacitor } from "@capacitor/core";

const queryClient = new QueryClient();

const RequireAuth = ({ children }: { children: React.ReactElement }) => {
  const isAuth =
    typeof window !== "undefined" &&
    localStorage.getItem("auth.loggedIn") === "true";
  return isAuth ? children : <Navigate to="/login" replace />;
};

const NativeStartRedirect = () => {
  const nav = useNavigate();
  const loc = useLocation();
  useEffect(() => {
    const isNative = Capacitor?.isNativePlatform?.() ?? false;
    if (isNative) {
      const p = loc.pathname || "/";
      if (p === "/" || p === "/login") {
        nav("/driver", { replace: true });
      }
    }
  }, [loc.pathname, nav]);
  return null;
};

const App = () => (
  <I18nProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <NativeStartRedirect />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Index />
                </RequireAuth>
              }
            />
            <Route
              path="/users"
              element={
                <RequireAuth>
                  <UsersIndexPage />
                </RequireAuth>
              }
            />
            <Route
              path="/users/admins"
              element={
                <RequireAuth>
                  <AdminUsersPage />
                </RequireAuth>
              }
            />
            <Route
              path="/users/authorizations"
              element={
                <RequireAuth>
                  <AuthorizationsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/missions"
              element={
                <RequireAuth>
                  <MissionsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/employees"
              element={
                <RequireAuth>
                  <EmployeesIndexPage />
                </RequireAuth>
              }
            />
            <Route
              path="/employees/drivers"
              element={
                <RequireAuth>
                  <DriversPage />
                </RequireAuth>
              }
            />
            <Route
              path="/employees/technicians"
              element={
                <RequireAuth>
                  <TechniciansPage />
                </RequireAuth>
              }
            />
            <Route
              path="/sites"
              element={
                <RequireAuth>
                  <SitesPage />
                </RequireAuth>
              }
            />
            <Route
              path="/generators"
              element={
                <RequireAuth>
                  <GeneratorsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/reports"
              element={
                <RequireAuth>
                  <ReportsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/notifications"
              element={
                <RequireAuth>
                  <NotificationsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAuth>
                  <SettingsIndexPage />
                </RequireAuth>
              }
            />
            <Route
              path="/settings/general"
              element={
                <RequireAuth>
                  <GeneralSettingsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/settings/cities"
              element={
                <RequireAuth>
                  <Placeholder />
                </RequireAuth>
              }
            />
            <Route
              path="/settings/zones"
              element={
                <RequireAuth>
                  <Placeholder />
                </RequireAuth>
              }
            />
            <Route
              path="/settings/admin-log"
              element={
                <RequireAuth>
                  <AdminLogPage />
                </RequireAuth>
              }
            />
            <Route path="/driver" element={<DriverApp />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route
              path="*"
              element={
                <RequireAuth>
                  <NotFound />
                </RequireAuth>
              }
            />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </I18nProvider>
);

// Ensure we only create a single root; reuse across HMR reloads to avoid multiple createRoot warnings
const container = document.getElementById("root");
if (container) {
  // store root on window to persist across HMR reloads
  const anyWin = window as any;
  let root = anyWin.__REACT_APP_ROOT__;
  if (!root) {
    root = createRoot(container);
    anyWin.__REACT_APP_ROOT__ = root;
  }
  root.render(<App />);
}
