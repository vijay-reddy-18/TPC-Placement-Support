import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/Global.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import NavBar from './components/NavBar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import TPCDashboard from './pages/TPCDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TPCNewQueries from './pages/TPCNewQueries';
import TPCInProgressQueries from './pages/TPCInProgressQueries';
import TPCResolvedQueries from './pages/TPCResolvedQueries';
import StudentRecords from './pages/StudentRecords';
import AdminQueries from './pages/AdminQueries';
import AdminTPCIDs from './pages/AdminTPCIDs';
import AdminStatistics from './pages/AdminStatistics';

// NEW TPC Pages (Redesigned)
import TPCDashboardPage from './pages/TPCDashboardPage';
import TPCTicketsPage from './pages/TPCTicketsPage';
import TPCTicketDetail from './pages/TPCTicketDetail';
import TPCAnalyticsPage from './pages/TPCAnalyticsPage';
import TPCProfilePage from './pages/TPCProfilePage';

function DashboardRouter() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return (
      <>
        <AdminDashboard />
      </>
    );
  } else if (user?.role === 'tpc') {
    // Redirect TPC users to the new redesigned dashboard
    return <Navigate to="/tpc/dashboard" replace />;
  } else {
    return (
      <>
        <NavBar />
        <StudentDashboard />
      </>
    );
  }
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes - Role-based Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />

          {/* ===== NEW TPC Routes (Redesigned) ===== */}
          <Route
            path="/tpc/dashboard"
            element={
              <ProtectedRoute>
                <TPCDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tpc/tickets"
            element={
              <ProtectedRoute>
                <TPCTicketsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tpc/tickets/:id"
            element={
              <ProtectedRoute>
                <TPCTicketDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tpc/analytics"
            element={
              <ProtectedRoute>
                <TPCAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tpc/profile"
            element={
              <ProtectedRoute>
                <TPCProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Legacy TPC Routes (kept for backward compat) */}
          <Route
            path="/tpc/new-queries"
            element={
              <ProtectedRoute>
                <>
                  <NavBar />
                  <TPCNewQueries />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tpc/in-progress"
            element={
              <ProtectedRoute>
                <>
                  <NavBar />
                  <TPCInProgressQueries />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tpc/resolved"
            element={
              <ProtectedRoute>
                <>
                  <NavBar />
                  <TPCResolvedQueries />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tpc/student-records"
            element={
              <ProtectedRoute>
                <>
                  <NavBar />
                  <StudentRecords />
                </>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/queries"
            element={
              <ProtectedRoute>
                <>
                  <NavBar />
                  <AdminQueries />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tpc-ids"
            element={
              <ProtectedRoute>
                <>
                  <NavBar />
                  <AdminTPCIDs />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/statistics"
            element={
              <ProtectedRoute>
                <>
                  <NavBar />
                  <AdminStatistics />
                </>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          style={{ zIndex: 9999 }}
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
