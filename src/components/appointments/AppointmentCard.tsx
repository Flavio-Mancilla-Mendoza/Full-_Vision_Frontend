// src/components/appointments/AppointmentCard.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  Calendar,
  User,
  MapPin,
  FileText,
  CheckCircle,
  Clock,
  Phone,
} from "lucide-react";
import type { AdminAppointment } from "./types";
import {
  formatAppointmentDate,
  getStatusConfig,
  getAppointmentLocation,
  getClientName,
  getClientEmail,
} from "./appointment-utils";

// ================================================================
// Status Badge
// ================================================================

const STATUS_ICONS = {
  clock: Clock,
  "check-circle": CheckCircle,
  "alert-circle": AlertCircle,
} as const;

function StatusBadge({ status }: { status: string }) {
  const config = getStatusConfig(status);
  const Icon = STATUS_ICONS[config.iconName];

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

// ================================================================
// Location Section
// ================================================================

function LocationInfo({ appointment }: { appointment: AdminAppointment }) {
  const location = getAppointmentLocation(appointment.eye_exam_locations);

  if (!location) {
    return (
      <div className="flex items-start gap-2">
        <MapPin className="w-4 h-4 text-red-500 mt-0.5" />
        <div>
          <p className="font-medium text-red-500">⚠️ Sin ubicación asignada</p>
          <p className="text-xs text-red-400">
            La cita no tiene location_id o la ubicación fue eliminada
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
      <div>
        <p className="font-medium">{location.name}</p>
        {location.address && (
          <p className="text-sm text-muted-foreground">{location.address}</p>
        )}
        {location.city && (
          <p className="text-sm text-muted-foreground">{location.city}</p>
        )}
        {location.phone && (
          <div className="flex items-center gap-1 mt-1">
            <Phone className="h-3 w-3" />
            <span className="text-sm">{location.phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================================
// Appointment Card
// ================================================================

interface AppointmentCardProps {
  appointment: AdminAppointment;
  onConfirm: (id: string) => Promise<void>;
}

export function AppointmentCard({ appointment, onConfirm }: AppointmentCardProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm(appointment.id);
    } finally {
      setIsConfirming(false);
    }
  };

  const clientName = getClientName(appointment);
  const clientEmail = getClientEmail(appointment);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            {/* Location */}
            <LocationInfo appointment={appointment} />

            {/* Date and Status */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {formatAppointmentDate(appointment)}
                </span>
              </div>
              <StatusBadge status={appointment.status} />
            </div>

            {/* Client */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                Cliente: <span className="font-medium">{clientName}</span>
                {clientEmail && (
                  <span className="text-muted-foreground"> ({clientEmail})</span>
                )}
              </span>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span className="text-sm text-muted-foreground">
                  <span className="font-medium">Notas:</span> {appointment.notes}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Action */}
          {appointment.status === "scheduled" && (
            <Button
              onClick={handleConfirm}
              disabled={isConfirming}
              size="sm"
              className="shrink-0"
            >
              {isConfirming ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
