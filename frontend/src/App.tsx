import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { MedicalDisclaimer } from './components/common/MedicalDisclaimer';

// Pages
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { NewAssessmentPage } from './pages/NewAssessmentPage';
import { AssessmentResultPage } from './pages/AssessmentResultPage';
import { EmergencyCasesPage } from './pages/EmergencyCasesPage';
import { HospitalsPage } from './pages/HospitalsPage';
import { ReferralsPage } from './pages/ReferralsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProfilePage } from './pages/ProfilePage';
import { BeFastScreeningPage } from './pages/BeFastScreeningPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { HospitalDashboardPage } from './pages/hospital/HospitalDashboardPage';

// Protected App Layout
const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400">Verifying Clinical Provider Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Medical Safety Banner */}
      <MedicalDisclaimer />

      {/* Main Top Header with Mobile Hamburger */}
      <Navbar 
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="flex-1 flex">
        {/* Left Sidebar (Desktop + Mobile Drawer) */}
        <Sidebar 
          isMobileOpen={isMobileMenuOpen} 
          onCloseMobile={() => setIsMobileMenuOpen(false)} 
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-5 lg:p-7 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected Clinical Portal Routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />
            <Route path="/assessment/new" element={<NewAssessmentPage />} />
            <Route path="/assessment/result/:id" element={<AssessmentResultPage />} />
            <Route path="/befast" element={<BeFastScreeningPage />} />
            <Route path="/emergency" element={<EmergencyCasesPage />} />
            <Route path="/hospitals" element={<HospitalsPage />} />
            <Route path="/referrals" element={<ReferralsPage />} />
            <Route path="/audit-logs" element={<AuditLogPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            
            {/* Hospital Staff Portal */}
            <Route path="/hospital/dashboard" element={<HospitalDashboardPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
