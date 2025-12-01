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
import { AdminClubsPage } from './pages/admin/AdminClubsPage';
import { CreateClubPage } from './pages/club/CreateClubPage';
import { ClubsPage } from './pages/club/ClubsPage';
import { ClubDetailPage } from './pages/club/ClubDetailPage';
import { ClubManagePage } from './pages/club/manage/ClubManagePage';
import { ClubManageMembersPage } from './pages/club/manage/ClubManageMembersPage';
import { ClubManageSettingsPage } from './pages/club/manage/ClubManageSettingsPage';

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
          <Route path="/clubs" element={
            <ProtectedRoute>
              <ClubsPage />
            </ProtectedRoute>
          } />
          <Route path="/clubs/create" element={
            <ProtectedRoute>
              <CreateClubPage />
            </ProtectedRoute>
          } />
          <Route path="/clubs/:id" element={
            <ProtectedRoute>
              <ClubDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/clubs/:id/manage" element={
            <ProtectedRoute>
              <ClubManagePage />
            </ProtectedRoute>
          } />
          <Route path="/clubs/:id/manage/members" element={
            <ProtectedRoute>
              <ClubManageMembersPage />
            </ProtectedRoute>
          } />
          <Route path="/clubs/:id/manage/settings" element={
            <ProtectedRoute>
              <ClubManageSettingsPage />
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
            <Route path="clubs" element={<AdminClubsPage />} />
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
