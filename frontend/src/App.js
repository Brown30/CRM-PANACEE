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
import AppLayout from "@/components/AppLayout";

function ProtectedRoute({ children }) {
  const { user, loading, selectedMarathon } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (!selectedMarathon) return <Navigate to="/select-marathon" />;
  return children;
}

function MarathonRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/select-marathon" element={
            <MarathonRoute><MarathonSelectPage /></MarathonRoute>
          } />
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
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
