import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { B } from "../theme";

/** Protège les routes : redirige vers /login si non connecté.
 *  `adminOnly` restreint au rôle admin. */
export default function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: 32, height: 32, border: "3px solid #F3F4F6", borderTopColor: B,
          borderRadius: "50%", animation: "spin 0.8s linear infinite",
        }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
