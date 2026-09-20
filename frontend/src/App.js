import "@/App.css";
import "@/index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "sonner";
import LoginPage from "@/pages/LoginPage";
import MarathonSelectPage from "@/pages/MarathonSelectPage";
import DashboardPage from "@/pages/DashboardPage";
import LeadsPage from "@/pages/LeadsPage";
import MarathonPage from "@/pages/MarathonPage";
import PromisesPage from "@/pages/PromisesPage";
import RankingPage from "@/pages/RankingPage";
import ReportsPage from "@/pages/ReportsPage";
import UsersPage from "@/pages/UsersPage";
import ObjectivesPage from "@/pages/ObjectivesPage";
import MethodologyPage from "@/pages/MethodologyPage";
import AttendancePage from "@/pages/AttendancePage";
import PaymentsPage from "@/pages/PaymentsPage";
import CommissionsPage from "@/pages/CommissionsPage";
import ProfilePage from "@/pages/ProfilePage";
import CertificatsPage from "@/pages/CertificatsPage";
import CertificatCoursePage from "@/pages/CertificatCoursePage";
import VerifyCertificatePage from "@/pages/VerifyCertificatePage";
import ChooseModulePage from "@/pages/ChooseModulePage";
import FinanceCoursesPage from "@/pages/FinanceCoursesPage";
import FinanceCourseDetailPage from "@/pages/FinanceCourseDetailPage";
import PedagogieHomePage from "@/pages/PedagogieHomePage";
import PresenceCoursesPage from "@/pages/PresenceCoursesPage";
import PresenceCourseDetailPage from "@/pages/PresenceCourseDetailPage";
import ProgrammeCoursesPage from "@/pages/ProgrammeCoursesPage";
import ProgrammeCourseDetailPage from "@/pages/ProgrammeCourseDetailPage";
import MesCoursProfesseurPage from "@/pages/MesCoursProfesseurPage";
import ProfesseurProgramPage from "@/pages/ProfesseurProgramPage";
import AppLayout from "@/components/AppLayout";
import FinanceLayout from "@/components/FinanceLayout";
import PedagogieLayout from "@/components/PedagogieLayout";
import ProfesseurLayout from "@/components/ProfesseurLayout";

function ProtectedRoute({ children }) {
  const { user, loading, selectedMarathon } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return children;
}

function MarathonRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function FinanceRoute({ children }) {
  const { user, loading, canAccessFinance } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (!canAccessFinance) return <Navigate to="/select-marathon" />;
  return children;
}

function PedagogieRoute({ children }) {
  const { user, loading, canAccessPedagogie } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (!canAccessPedagogie) return <Navigate to="/select-marathon" />;
  return children;
}

function ProfesseurRoute({ children }) {
  const { user, loading, isProfesseur } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (!isProfesseur) return <Navigate to="/select-marathon" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verificar/:id" element={<VerifyCertificatePage />} />
          <Route path="/select-marathon" element={
            <MarathonRoute><MarathonSelectPage /></MarathonRoute>
          } />
          <Route path="/choose-module" element={
            <MarathonRoute><ChooseModulePage /></MarathonRoute>
          } />
          <Route path="/finance" element={
            <FinanceRoute><FinanceLayout /></FinanceRoute>
          }>
            <Route index element={<FinanceCoursesPage />} />
            <Route path=":marathonId" element={<FinanceCourseDetailPage />} />
          </Route>
          <Route path="/pedagogie" element={
            <PedagogieRoute><PedagogieLayout /></PedagogieRoute>
          }>
            <Route index element={<PedagogieHomePage />} />
            <Route path="presence" element={<PresenceCoursesPage />} />
            <Route path="presence/:marathonId" element={<PresenceCourseDetailPage />} />
            <Route path="programme" element={<ProgrammeCoursesPage />} />
            <Route path="programme/:marathonId" element={<ProgrammeCourseDetailPage />} />
          </Route>
          <Route path="/mon-programme" element={
            <ProfesseurRoute><ProfesseurLayout /></ProfesseurRoute>
          }>
            <Route index element={<MesCoursProfesseurPage />} />
            <Route path=":marathonId" element={<ProfesseurProgramPage />} />
          </Route>
          <Route path="/" element={
            <ProtectedRoute><AppLayout /></ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="promesses" element={<PromisesPage />} />
            <Route path="marathons" element={<MarathonPage />} />
            <Route path="ranking" element={<RankingPage />} />
            <Route path="rapports" element={<ReportsPage />} />
            <Route path="utilisateurs" element={<UsersPage />} />
            <Route path="objectifs" element={<ObjectivesPage />} />
            <Route path="methodologie" element={<MethodologyPage />} />
            <Route path="presence" element={<AttendancePage />} />
            <Route path="paiements" element={<PaymentsPage />} />
            <Route path="commissions" element={<CommissionsPage />} />
            <Route path="certificats" element={<CertificatsPage />} />
            <Route path="certificats/:marathonId" element={<CertificatCoursePage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
