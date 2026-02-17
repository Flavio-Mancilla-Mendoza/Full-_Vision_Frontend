// src/pages/Login.tsx
import AuthCard from "@/components/auth/AuthCard";
import { useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function Login() {
  const location = useLocation();
  const wasIdleLogout = location.state?.reason === "idle";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full">
        {wasIdleLogout && (
          <div className="max-w-md mx-auto mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            Tu sesión fue cerrada por inactividad. Inicia sesión nuevamente.
          </div>
        )}
        <AuthCard />
      </div>
    </div>
  );
}
