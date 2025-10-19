import './global.css';

import { Toaster } from '@/components/ui/toaster';
import { createRoot } from 'react-dom/client';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { MobileGuard } from '@/components/MobileGuard';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Sites from './pages/sites/Sites';
import Reports from './pages/reports/Reports';
import Missions from './pages/missions/Missions';
import EmployeesIndex from './pages/employees/Index';
import Drivers from './pages/employees/Drivers';
import Technicians from './pages/employees/Technicians';
import UsersIndex from './pages/users/Index';
import Admins from './pages/users/Admins';
import Authorizations from './pages/users/Authorizations';
import SettingsIndex from './pages/settings/Index';
import GeneralSettings from './pages/settings/General';
import Notifications from './pages/notifications/Notifications';
import Generators from './pages/generators/Generators';
import DriverApp from './pages/mobile/DriverApp';
import DriverLogin from './pages/driver/DriverLogin';
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverMissionDetail from './pages/driver/DriverMissionDetail';
import DriverNotifications from './pages/driver/DriverNotifications';
import DriverSettings from './pages/driver/DriverSettings';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />

          {/* Primary sections */}
          <Route path="/sites" element={<Sites />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/missions" element={<Missions />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/generators" element={<Generators />} />

          {/* Employees */}
          <Route path="/employees" element={<EmployeesIndex />} />
          <Route path="/employees/drivers" element={<Drivers />} />
          <Route path="/employees/technicians" element={<Technicians />} />

          {/* Users & Auth */}
          <Route path="/users" element={<UsersIndex />} />
          <Route path="/users/admins" element={<Admins />} />
          <Route path="/users/authorizations" element={<Authorizations />} />

          {/* Settings */}
          <Route path="/settings" element={<SettingsIndex />} />
          <Route path="/settings/general" element={<GeneralSettings />} />

          {/* Mobile */}
          <Route path="/mobile/driver" element={<DriverApp />} />

          {/* Driver App Routes */}
          <Route
            path="/driver/login"
            element={
              <MobileGuard mode="block">
                <DriverLogin />
              </MobileGuard>
            }
          />
          <Route
            path="/driver/dashboard"
            element={
              <MobileGuard mode="block">
                <DriverDashboard />
              </MobileGuard>
            }
          />
          <Route
            path="/driver/mission/:taskId"
            element={
              <MobileGuard mode="block">
                <DriverMissionDetail />
              </MobileGuard>
            }
          />
          <Route
            path="/driver/notifications"
            element={
              <MobileGuard mode="block">
                <DriverNotifications />
              </MobileGuard>
            }
          />
          <Route
            path="/driver/settings"
            element={
              <MobileGuard mode="block">
                <DriverSettings />
              </MobileGuard>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

const container = document.getElementById('root')!;
// Reuse existing root if present (prevents React warning during HMR or double script loads)
if ((window as any).__app_root) {
  (window as any).__app_root.render(<App />);
} else {
  const root = createRoot(container);
  (window as any).__app_root = root;
  root.render(<App />);
}
