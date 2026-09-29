import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';

const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const StoresPage = lazy(() => import('./pages/StoresPage.jsx'));
const StoreDetailPage = lazy(() => import('./pages/StoreDetailPage.jsx'));
const AuditsPage = lazy(() => import('./pages/AuditsPage.jsx'));
const FindingsPage = lazy(() => import('./pages/FindingsPage.jsx'));
const TasksPage = lazy(() => import('./pages/TasksPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

export default function App() {
  return (
    <Suspense fallback={<div className="page-loading">Loading ShelfSight...</div>}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login." element={<Navigate to="/login" replace />} />
        <Route path="/auth/login" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/stores/:storeId" element={<StoreDetailPage />} />
            <Route path="/audits" element={<AuditsPage />} />
            <Route path="/findings" element={<FindingsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
