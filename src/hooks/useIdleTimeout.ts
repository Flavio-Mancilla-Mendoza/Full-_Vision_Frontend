// src/hooks/useIdleTimeout.ts
/**
 * Hook de cierre de sesión por inactividad
 * 
 * Detecta inactividad del usuario (sin mouse, teclado, touch, scroll)
 * y cierra la sesión automáticamente después de un período configurable.
 * 
 * Muestra una advertencia 60 segundos antes del cierre.
 */

import { useEffect, useRef, useState, useCallback } from "react";

/** Eventos que se consideran actividad del usuario */
const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
  "wheel",
];

interface UseIdleTimeoutOptions {
  /** Tiempo de inactividad en minutos antes de cerrar sesión (default: 30) */
  timeoutMinutes?: number;
  /** Segundos de advertencia antes del cierre (default: 60) */
  warningSeconds?: number;
  /** Callback al cerrar sesión por inactividad */
  onIdle: () => void;
  /** Si el hook está habilitado (default: true) */
  enabled?: boolean;
}

interface UseIdleTimeoutReturn {
  /** Si se está mostrando la advertencia */
  showWarning: boolean;
  /** Segundos restantes antes del cierre */
  remainingSeconds: number;
  /** Resetear el timer manualmente (ej: usuario hace click en "Seguir aquí") */
  resetTimer: () => void;
}

export function useIdleTimeout({
  timeoutMinutes = 30,
  warningSeconds = 60,
  onIdle,
  enabled = true,
}: UseIdleTimeoutOptions): UseIdleTimeoutReturn {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(warningSeconds);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onIdleRef = useRef(onIdle);

  // Mantener referencia actualizada del callback
  onIdleRef.current = onIdle;

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = warningSeconds * 1000;

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningIntervalRef.current) {
      clearInterval(warningIntervalRef.current);
      warningIntervalRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    setRemainingSeconds(warningSeconds);

    if (!enabled) return;

    // Timer principal: cuando expira, mostrar advertencia
    timeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingSeconds(warningSeconds);

      // Countdown de la advertencia
      let secondsLeft = warningSeconds;
      warningIntervalRef.current = setInterval(() => {
        secondsLeft -= 1;
        setRemainingSeconds(secondsLeft);

        if (secondsLeft <= 0) {
          clearAllTimers();
          setShowWarning(false);
          onIdleRef.current();
        }
      }, 1000);
    }, timeoutMs - warningMs);
  }, [enabled, timeoutMs, warningMs, warningSeconds, clearAllTimers]);

  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      return;
    }

    // Iniciar timer
    resetTimer();

    // Listener de actividad
    const handleActivity = () => {
      // Solo resetear si NO estamos en la fase de advertencia
      // (si ya se muestra la advertencia, solo el botón la cierra)
      if (!showWarning) {
        resetTimer();
      }
    };

    // Agregar listeners con { passive: true } para performance
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      clearAllTimers();
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, resetTimer, clearAllTimers, showWarning]);

  return { showWarning, remainingSeconds, resetTimer };
}
