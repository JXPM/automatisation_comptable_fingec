import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ToastProvider } from "./components/Toast";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import TraitementPage from "./pages/TraitementPage";
import ClientsPage from "./pages/ClientsPage";
import DashboardPage from "./pages/DashboardPage";
import HistoriquePage from "./pages/HistoriquePage";
import MailPage from "./pages/MailPage";
import LogsPage from "./pages/LogsPage";
import AdminPage from "./pages/AdminPage";

// Layout protégé : exige une session, puis rend les pages via <Outlet/>.
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Layout>
        <Outlet />
      </Layout>
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
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<TraitementPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
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
