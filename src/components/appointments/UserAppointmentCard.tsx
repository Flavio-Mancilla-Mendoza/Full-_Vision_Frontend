// src/components/appointments/UserAppointmentCard.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { UserAppointmentItem } from "./user-appointment-types";
import { getStatusDisplay } from "./user-appointment-types";
import {
  formatDate,
  formatTime,
  isPastAppointment,
  canCancelAppointment,
} from "./user-appointment-utils";

// ================================================================
// Status Icon Map
// ================================================================

const STATUS_ICONS = {
  "alert-circle": AlertCircle,
  "check-circle": CheckCircle,
  "x-circle": XCircle,
} as const;

// ================================================================
// Component
// ================================================================

interface UserAppointmentCardProps {
  appointment: UserAppointmentItem;
  cancellingId: string | null;
  onCancel: (id: string) => Promise<void>;
}

export function UserAppointmentCard({
  appointment,
  cancellingId,
  onCancel,
}: UserAppointmentCardProps) {
  const status = getStatusDisplay(appointment.status);
  const StatusIcon = STATUS_ICONS[status.iconName];
  const isPast = isPastAppointment(
    appointment.appointment_date,
    appointment.appointment_time
  );
  const showCancel = canCancelAppointment(appointment);
  const isCancelling = cancellingId === appointment.id;

  return (
    <Card className={`border-l-4 ${status.borderColor}`}>
      <CardContent className="p-4">
        <div className="flex justify-between">
          <div className="space-y-3 flex-1">
            {/* Status */}
            <div className="flex items-center gap-3">
              <Badge className={`${status.color} border`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
              {isPast &&
                appointment.status !== "completed" &&
                appointment.status !== "cancelled" && (
                  <Badge
                    variant="outline"
                    className="text-orange-600 border-orange-200"
                  >
                    Expirada
                  </Badge>
                )}
            </div>

            {/* Date and Time */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {formatDate(appointment.appointment_date)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatTime(appointment.appointment_time)}</span>
                <span className="text-muted-foreground">
                  ({appointment.duration_minutes} min)
                </span>
              </div>
            </div>

            {/* Location */}
            {appointment.eye_exam_locations && (
              <div className="flex items-start gap-1 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">
                    {appointment.eye_exam_locations.name}
                  </p>
                  {appointment.eye_exam_locations.address && (
                    <p className="text-muted-foreground">
                      {appointment.eye_exam_locations.address}
                    </p>
                  )}
                  {appointment.eye_exam_locations.city && (
                    <p className="text-muted-foreground">
                      {appointment.eye_exam_locations.city}
                    </p>
                  )}
                  {appointment.eye_exam_locations.phone && (
                    <div className="flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" />
                      <span>{appointment.eye_exam_locations.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {appointment.notes && (
              <div className="text-sm">
                <p className="text-muted-foreground">Notas:</p>
                <p className="bg-gray-50 p-2 rounded text-sm">
                  {appointment.notes}
                </p>
              </div>
            )}

            {/* Exam Type */}
            <div className="text-sm text-muted-foreground">
              Tipo de examen:{" "}
              <span className="capitalize">{appointment.exam_type}</span>
            </div>
          </div>

          {/* Cancel Action */}
          <div className="ml-4">
            {showCancel && (
              <CancelDialog
                appointment={appointment}
                isCancelling={isCancelling}
                onConfirm={() => onCancel(appointment.id)}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ================================================================
// Cancel Confirmation Dialog
// ================================================================

interface CancelDialogProps {
  appointment: UserAppointmentItem;
  isCancelling: boolean;
  onConfirm: () => void;
}

function CancelDialog({
  appointment,
  isCancelling,
  onConfirm,
}: CancelDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isCancelling}>
          {isCancelling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Cancelar"
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Cancelar cita?</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que quieres cancelar tu cita del{" "}
            {formatDate(appointment.appointment_date)} a las{" "}
            {formatTime(appointment.appointment_time)}? Esta acción no se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No, mantener cita</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Sí, cancelar cita
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
