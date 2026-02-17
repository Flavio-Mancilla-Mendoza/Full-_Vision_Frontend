import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuthCognito";
import { ReactNode } from "react";
import IdleTimeoutGuard from "./IdleTimeoutGuard";

interface AuthRequiredProps {
  children: ReactNode;
  redirectTo?: string;
  requireAdmin?: boolean;
  /** Minutos de inactividad antes de cerrar sesión (default: 30) */
  idleTimeoutMinutes?: number;
}

const AuthRequired = ({
  children,
  redirectTo = "/login",
  requireAdmin = false,
  idleTimeoutMinutes = 30,
}: AuthRequiredProps) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <IdleTimeoutGuard timeoutMinutes={idleTimeoutMinutes} isAdmin={isAdmin}>
      {children}
    </IdleTimeoutGuard>
  );
};

export default AuthRequired;
