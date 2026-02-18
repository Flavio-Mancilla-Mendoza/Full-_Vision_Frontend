// src/components/appointments/CreateAppointmentForm.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Loader2 } from "lucide-react";
import { useCreateAppointment } from "@/hooks/useCreateAppointment";
import { SystemErrorMessage } from "./SystemErrorMessage";
import { LocationField, DateField, TimeField, NotesField } from "./FormFields";

export default function CreateAppointmentForm() {
  const {
    locations,
    locationsLoading,
    systemError,
    formData,
    errors,
    submitting,
    handleFieldChange,
    handleSubmit,
  } = useCreateAppointment();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Reservar examen de vista
        </CardTitle>
      </CardHeader>
      <CardContent>
        {systemError ? (
          <SystemErrorMessage message={systemError} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <LocationField
              locations={locations}
              loading={locationsLoading}
              value={formData.locationId}
              error={errors.locationId}
              onChange={handleFieldChange}
            />

            <DateField
              value={formData.date}
              error={errors.date}
              onChange={handleFieldChange}
            />

            <TimeField
              value={formData.time}
              error={errors.time}
              onChange={handleFieldChange}
            />

            <NotesField
              value={formData.notes}
              error={errors.notes}
              onChange={handleFieldChange}
            />

            <Button type="submit" disabled={submitting || locationsLoading} className="w-full">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Enviando..." : "Reservar cita"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
