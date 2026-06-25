import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ToastProvider } from "./components/Toast";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import Layout from "./components/Layout";
import OnboardingGuide from "./components/OnboardingGuide";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AccountPage from "./pages/AccountPage";
import TraitementPage from "./pages/TraitementPage";
import ClientsPage from "./pages/ClientsPage";
import DashboardPage from "./pages/DashboardPage";
import HistoriquePage from "./pages/HistoriquePage";
import MailPage from "./pages/MailPage";
import LogsPage from "./pages/LogsPage";
import AdminPage from "./pages/AdminPage";
import LegalNoticePage from "./pages/legal/LegalNoticePage";
import PrivacyPage from "./pages/legal/PrivacyPage";
import TermsPage from "./pages/legal/TermsPage";

// Layout protégé : exige une session, puis rend les pages via <Outlet/>.
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Layout>
        <Outlet />
      </Layout>
      {/* Guide de prise en main : s'ouvre à la première connexion, relançable depuis le compte. */}
      <OnboardingGuide />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            {/* Pages légales publiques (accessibles sans authentification) */}
            <Route path="/mentions-legales" element={<LegalNoticePage />} />
            <Route path="/confidentialite" element={<PrivacyPage />} />
            <Route path="/cgu" element={<TermsPage />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/traitement" element={<TraitementPage />} />
              <Route path="/compte" element={<AccountPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/historique" element={<HistoriquePage />} />
              <Route path="/mail" element={<MailPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
