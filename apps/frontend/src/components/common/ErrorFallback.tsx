/**
 * ErrorFallback - Componente para mostrar errores con opción de retry
 * Reutilizable en toda la aplicación
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ErrorFallbackProps {
  error?: Error | null;
  onRetry?: () => void;
  title?: string;
  description?: string;
  showHomeButton?: boolean;
  className?: string;
}

export function ErrorFallback({
  error,
  onRetry,
  title = "Error al cargar datos",
  description,
  showHomeButton = true,
  className = "",
}: ErrorFallbackProps) {
  const navigate = useNavigate();

  const errorMessage = error?.message || description || "Ha ocurrido un error inesperado. Por favor, intenta de nuevo.";

  const getErrorDetails = () => {
    if (!error) return null;

    // Identificar tipos de errores comunes
    if (error.message.includes("404")) {
      return "El recurso solicitado no fue encontrado.";
    }
    if (error.message.includes("500") || error.message.includes("503")) {
      return "El servidor está experimentando problemas. Por favor, intenta más tarde.";
    }
    if (error.message.includes("Network") || error.message.includes("fetch")) {
      return "Problemas de conexión. Verifica tu conexión a internet.";
    }
    return errorMessage;
  };

  return (
    <Card className={`border-destructive/50 ${className}`}>
      <CardContent className="p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">{title}</h3>
            <p className="text-muted-foreground max-w-md">{getErrorDetails()}</p>
          </div>

          {/* Detalles técnicos en modo desarrollo */}
          {process.env.NODE_ENV === "development" && error && (
            <details className="mt-4 text-left w-full max-w-md">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">Detalles técnicos</summary>
              <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-auto">{error.stack || error.message}</pre>
            </details>
          )}

          <div className="flex flex-wrap gap-3 mt-4">
            {onRetry && (
              <Button onClick={onRetry} variant="default" className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                Reintentar
              </Button>
            )}

            {showHomeButton && (
              <Button onClick={() => navigate("/")} variant="outline" className="gap-2">
                <Home className="h-4 w-4" />
                Volver al inicio
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * ErrorFallbackFullPage - Versión de página completa
 */
export function ErrorFallbackFullPage(props: ErrorFallbackProps) {
  return (
    <div className="container mx-auto px-4 py-8 min-h-[60vh] flex items-center justify-center">
      <ErrorFallback {...props} />
    </div>
  );
}

/**
 * ProductsErrorFallback - Versión específica para productos
 */
export function ProductsErrorFallback({ error, onRetry }: { error?: Error | null; onRetry?: () => void }) {
  return (
    <ErrorFallback
      error={error}
      onRetry={onRetry}
      title="Error al cargar productos"
      description="No pudimos cargar los productos. Por favor, intenta de nuevo."
      showHomeButton={true}
    />
  );
}
