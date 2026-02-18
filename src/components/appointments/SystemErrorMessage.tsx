// src/components/appointments/SystemErrorMessage.tsx

interface SystemErrorMessageProps {
  message: string;
}

/**
 * Displayed when the appointments system isn't configured yet.
 * Shows a fallback contact block so the user can still reach the business.
 */
export function SystemErrorMessage({ message }: SystemErrorMessageProps) {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="font-medium">Sistema de citas en configuración</p>
        <p className="text-sm mt-1">{message}</p>
      </div>
      <div className="text-sm text-muted-foreground">
        <p>Mientras tanto, puedes contactarnos directamente:</p>
        <p className="font-medium mt-2">📞 (01) 234-5678</p>
        <p className="font-medium">📧 citas@fullvision.com</p>
      </div>
    </div>
  );
}
