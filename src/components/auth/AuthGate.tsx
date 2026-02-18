// src/components/auth/AuthGate.tsx
import { ReactNode, useEffect } from "react";
import { useSession, useAuth } from "@/hooks/auth";
import { useNavigate } from "react-router-dom";

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate("/login");
  }, [loading, session, navigate]);

  if (loading || !session) return null;
  return <>{children}</>;
}

// src/components/auth/AdminOnly.tsx
export function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAuth();

  if (loading) return null;
  if (!isAdmin) return <div className="p-6">No autorizado.</div>;
  return <>{children}</>;
}
