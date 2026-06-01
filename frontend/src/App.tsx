import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/Toast";
import Layout from "./components/Layout";
import TraitementPage from "./pages/TraitementPage";
import ClientsPage from "./pages/ClientsPage";
import DashboardPage from "./pages/DashboardPage";
import HistoriquePage from "./pages/HistoriquePage";
import LogsPage from "./pages/LogsPage";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<TraitementPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/historique" element={<HistoriquePage />} />
            <Route path="/logs" element={<LogsPage />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </BrowserRouter>
  );
}
