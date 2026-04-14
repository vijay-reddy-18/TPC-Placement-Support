import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/Global.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import QuickSettings from './components/QuickSettings';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import NavBar from './components/NavBar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard'; // kept for backward compat
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
import TPCIncomingTickets from './pages/TPCIncomingTickets';
import TPCSLAPage from './pages/TPCSLAPage';
import TPCKnowledgeBase from './pages/TPCKnowledgeBase';
import TPCTeamPage from './pages/TPCTeamPage';

// NEW Student Portal Pages (Advanced Redesign)
import StudentHome from './pages/student/StudentHome';
import StudentTickets from './pages/student/StudentTickets';
import StudentTicketDetail from './pages/student/StudentTicketDetail';
import StudentCreateTicket from './pages/student/StudentCreateTicket';
import StudentNotifications from './pages/student/StudentNotifications';
import StudentHelp from './pages/student/StudentHelp';
import StudentFeedback from './pages/student/StudentFeedback';
import StudentProfile from './pages/student/StudentProfile';

function DashboardRouter() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  } else if (user?.role === 'tpc') {
    return <Navigate to="/tpc/dashboard" replace />;
  } else {
    // Students → redirect to new advanced portal
    return <Navigate to="/student/dashboard" replace />;
  }
}


function App() {
  return (
    <ThemeProvider>
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

            {/* ===== NEW Student Portal Routes (Advanced Redesign) ===== */}
            <Route path="/student/dashboard" element={<ProtectedRoute><StudentHome /></ProtectedRoute>} />
            <Route path="/student/tickets" element={<ProtectedRoute><StudentTickets /></ProtectedRoute>} />
            <Route path="/student/tickets/:id" element={<ProtectedRoute><StudentTicketDetail /></ProtectedRoute>} />
            <Route path="/student/create-ticket" element={<ProtectedRoute><StudentCreateTicket /></ProtectedRoute>} />
            <Route path="/student/notifications" element={<ProtectedRoute><StudentNotifications /></ProtectedRoute>} />
            <Route path="/student/help" element={<ProtectedRoute><StudentHelp /></ProtectedRoute>} />
            <Route path="/student/feedback" element={<ProtectedRoute><StudentFeedback /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />

            {/* ===== NEW TPC Routes (Redesigned) ===== */}
            <Route path="/tpc/dashboard" element={<ProtectedRoute><TPCDashboardPage /></ProtectedRoute>} />
            <Route path="/tpc/tickets" element={<ProtectedRoute><TPCTicketsPage /></ProtectedRoute>} />
            <Route path="/tpc/tickets/:id" element={<ProtectedRoute><TPCTicketDetail /></ProtectedRoute>} />
            <Route path="/tpc/analytics" element={<ProtectedRoute><TPCAnalyticsPage /></ProtectedRoute>} />
            <Route path="/tpc/profile" element={<ProtectedRoute><TPCProfilePage /></ProtectedRoute>} />
            <Route path="/tpc/incoming" element={<ProtectedRoute><TPCIncomingTickets /></ProtectedRoute>} />
            <Route path="/tpc/sla" element={<ProtectedRoute><TPCSLAPage /></ProtectedRoute>} />
            <Route path="/tpc/knowledge" element={<ProtectedRoute><TPCKnowledgeBase /></ProtectedRoute>} />
            <Route path="/tpc/team" element={<ProtectedRoute><TPCTeamPage /></ProtectedRoute>} />

            {/* Legacy TPC Routes (kept for backward compat) */}
            <Route path="/tpc/new-queries" element={<ProtectedRoute><><NavBar /><TPCNewQueries /></></ProtectedRoute>} />
            <Route path="/tpc/in-progress" element={<ProtectedRoute><><NavBar /><TPCInProgressQueries /></></ProtectedRoute>} />
            <Route path="/tpc/resolved" element={<ProtectedRoute><><NavBar /><TPCResolvedQueries /></></ProtectedRoute>} />
            <Route path="/tpc/student-records" element={<ProtectedRoute><><NavBar /><StudentRecords /></></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/queries" element={<ProtectedRoute><><NavBar /><AdminQueries /></></ProtectedRoute>} />
            <Route path="/admin/tpc-ids" element={<ProtectedRoute><><NavBar /><AdminTPCIDs /></></ProtectedRoute>} />
            <Route path="/admin/statistics" element={<ProtectedRoute><><NavBar /><AdminStatistics /></></ProtectedRoute>} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

          {/* Global Quick Settings FAB — available on all pages */}
          <QuickSettings />

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
    </ThemeProvider>
  );
}

export default App;

