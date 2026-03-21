import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';

// 즉시 로드 (초기 진입 페이지)
import { PublicReservationsPage } from './pages/PublicReservationsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// 지연 로드 (인증 후 접근 페이지)
const ReservationsPage = lazy(() => import('./pages/ReservationsPage').then(m => ({ default: m.ReservationsPage })));
const CreateReservationPage = lazy(() => import('./pages/CreateReservationPage').then(m => ({ default: m.CreateReservationPage })));
const MyReservationsPage = lazy(() => import('./pages/MyReservationsPage').then(m => ({ default: m.MyReservationsPage })));
const RoomsPage = lazy(() => import('./pages/RoomsPage').then(m => ({ default: m.RoomsPage })));
const CreateRoomPage = lazy(() => import('./pages/CreateRoomPage').then(m => ({ default: m.CreateRoomPage })));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage').then(m => ({ default: m.ChangePasswordPage })));

// 지연 로드 (관리자 페이지)
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const AdminRoomsPage = lazy(() => import('./pages/admin/AdminRoomsPage').then(m => ({ default: m.AdminRoomsPage })));
const AdminReservationsPage = lazy(() => import('./pages/admin/AdminReservationsPage').then(m => ({ default: m.AdminReservationsPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminBackupPage = lazy(() => import('./pages/admin/AdminBackupPage').then(m => ({ default: m.AdminBackupPage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));
const AdminStatisticsPage = lazy(() => import('./pages/admin/AdminStatisticsPage').then(m => ({ default: m.AdminStatisticsPage })));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Toaster />
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={<PublicReservationsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reservations" element={
              <ProtectedRoute>
                <ReservationsPage />
              </ProtectedRoute>
            } />
            <Route path="/create-reservation" element={
              <ProtectedRoute>
                <CreateReservationPage />
              </ProtectedRoute>
            } />
            <Route path="/my-reservations" element={
              <ProtectedRoute>
                <MyReservationsPage />
              </ProtectedRoute>
            } />
            <Route path="/change-password" element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            } />
            <Route path="/rooms" element={
              <ProtectedRoute>
                <RoomsPage />
              </ProtectedRoute>
            } />
            <Route path="/create-room" element={
              <ProtectedRoute>
                <CreateRoomPage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminPage />
              </ProtectedRoute>
            }>
              <Route path="rooms" element={<AdminRoomsPage />} />
              <Route path="reservations" element={<AdminReservationsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="backup" element={<AdminBackupPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="statistics" element={<AdminStatisticsPage />} />
            </Route>
          </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
