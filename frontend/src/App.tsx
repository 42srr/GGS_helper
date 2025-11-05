import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicReservationsPage } from './pages/PublicReservationsPage';
import { LoginPage } from './pages/LoginPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReservationsPage } from './pages/ReservationsPage';
import { CreateReservationPage } from './pages/CreateReservationPage';
import { MyReservationsPage } from './pages/MyReservationsPage';
import { RoomsPage } from './pages/RoomsPage';
import { CreateRoomPage } from './pages/CreateRoomPage';
import { AdminPage } from './pages/AdminPage';
import { AdminRoomsPage } from './pages/admin/AdminRoomsPage';
import { AdminReservationsPage } from './pages/admin/AdminReservationsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminBackupPage } from './pages/admin/AdminBackupPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminStatisticsPage } from './pages/admin/AdminStatisticsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<PublicReservationsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
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
      </Router>
    </AuthProvider>
  );
}

export default App;
