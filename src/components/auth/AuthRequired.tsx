import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuthCognito";
import { ReactNode } from "react";

interface AuthRequiredProps {
  children: ReactNode;
  redirectTo?: string;
  requireAdmin?: boolean;
}

const AuthRequired = ({ children, redirectTo = "/login", requireAdmin = false }: AuthRequiredProps) => {
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

  return <>{children}</>;
};

export default AuthRequired;
