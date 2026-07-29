import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Guards
import ProtectedRoute from '../components/layouts/ProtectedRoute';
import RoleRoute from '../components/layouts/RoleRoute';

// Layouts
import PageLayout from '../components/layouts/PageLayout';

// Pages
import Login from '../pages/auth/Login';
import EmployeeDashboard from '../pages/employee/EmployeeDashboard';
import ManagerDashboard from '../pages/manager/ManagerDashboard';
import FinanceDashboard from '../pages/finance/FinanceDashboard';
import NotFound from '../pages/shared/NotFound';
import Card from '../components/ui/Card';

// Generic Settings page placeholder
const SettingsPlaceholder = () => (
  <div className="space-y-4 animate-fade-in">
    <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">System Settings</h1>
    <p className="text-sm text-slate-500">Configure single sign-on preferences, notification tolerances, and layout options.</p>
    <Card title="User Account Settings">
      <div className="text-sm text-slate-500 font-medium font-sans">
        Settings configurations are stubbed pending active Active Directory integration.
      </div>
    </Card>
  </div>
);

// Route Landing Redirection Controller
const HomeRedirect = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const routes = {
    Employee: '/employee',
    Manager: '/manager',
    Finance: '/finance',
  };

  return <Navigate to={routes[user.role] || '/employee'} replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes Wrapper */}
      <Route element={<ProtectedRoute />}>
        {/* Layout Wrapper */}
        <Route element={<PageLayout />}>
          
          {/* Landing redirect */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Employee Routes */}
          <Route element={<RoleRoute allowedRoles={['Employee']} />}>
            <Route path="/employee/*" element={<EmployeeDashboard />} />
          </Route>

          {/* Manager Routes */}
          <Route element={<RoleRoute allowedRoles={['Manager']} />}>
            <Route path="/manager/*" element={<ManagerDashboard />} />
          </Route>

          {/* Finance Routes */}
          <Route element={<RoleRoute allowedRoles={['Finance']} />}>
            <Route path="/finance/*" element={<FinanceDashboard />} />
          </Route>

          {/* Shared pages */}
          <Route path="/settings" element={<SettingsPlaceholder />} />
          <Route path="/404" element={<NotFound />} />

        </Route>
      </Route>

      {/* Catch-all unmatched routes */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
