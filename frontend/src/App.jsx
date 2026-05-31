import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import DashboardPage  from './pages/DashboardPage';
import WorkersPage    from './pages/WorkersPage';
import WorkerDetailPage from './pages/WorkerDetailPage';
import AddWorkerPage  from './pages/AddWorkerPage';
import AttendancePage from './pages/AttendancePage';
import SalaryPage     from './pages/SalaryPage';
import SalaryDetailPage from './pages/SalaryDetailPage';
import RecordsPage    from './pages/RecordsPage';
import PaymentsPage   from './pages/PaymentsPage';
import AdminPage      from './pages/AdminPage';

// ─── Route guards ─────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_admin) return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

// ─── App ──────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected */}
        <Route path="/"           element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/workers"    element={<ProtectedRoute><WorkersPage /></ProtectedRoute>} />
        <Route path="/workers/add" element={<ProtectedRoute><AddWorkerPage /></ProtectedRoute>} />
        <Route path="/workers/:id" element={<ProtectedRoute><WorkerDetailPage /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
        <Route path="/salary"     element={<ProtectedRoute><SalaryPage /></ProtectedRoute>} />
        <Route path="/salary/:workerId" element={<ProtectedRoute><SalaryDetailPage /></ProtectedRoute>} />
        <Route path="/records"    element={<ProtectedRoute><RecordsPage /></ProtectedRoute>} />
        <Route path="/payments"   element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
        <Route path="/payments/:workerId" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
