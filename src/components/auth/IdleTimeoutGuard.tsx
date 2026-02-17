// src/components/auth/IdleTimeoutGuard.tsx
/**
 * Componente que envuelve rutas autenticadas y cierra sesión por inactividad.
 * Muestra un diálogo de advertencia antes del cierre automático.
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { logoutUser } from "@/services/cognito-auth";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Clock, ShieldAlert } from "lucide-react";

interface IdleTimeoutGuardProps {
  children: React.ReactNode;
  /** Minutos de inactividad antes del cierre (default: 30) */
  timeoutMinutes?: number;
  /** Solo activar para admins (default: false) */
  adminOnly?: boolean;
  isAdmin?: boolean;
}

export default function IdleTimeoutGuard({
  children,
  timeoutMinutes = 30,
  adminOnly = false,
  isAdmin = false,
}: IdleTimeoutGuardProps) {
  const navigate = useNavigate();

  // Si adminOnly y no es admin, desactivar
  const enabled = adminOnly ? isAdmin : true;

  const handleIdle = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Si falla el logout, igual redirigir
    }
    navigate("/login", {
      state: { reason: "idle" },
      replace: true,
    });
  }, [navigate]);

  const { showWarning, remainingSeconds, resetTimer } = useIdleTimeout({
    timeoutMinutes,
    warningSeconds: 60,
    onIdle: handleIdle,
    enabled,
  });

  return (
    <>
      {children}

      <AlertDialog open={showWarning}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <AlertDialogTitle className="text-lg">
                Sesión a punto de expirar
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Tu sesión se cerrará automáticamente por inactividad.
              <span className="flex items-center gap-2 mt-3 text-base font-semibold text-foreground">
                <Clock className="h-4 w-4" />
                {remainingSeconds} segundo{remainingSeconds !== 1 ? "s" : ""} restante{remainingSeconds !== 1 ? "s" : ""}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={resetTimer}>
              Seguir conectado
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
