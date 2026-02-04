// src/components/appointments/CreateAppointmentForm.tsx
import { useEffect, useState } from "react";
import { listLocations, createAppointment } from "@/services/appointments";
import { validateAppointment } from "@/lib/appointment-validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import type { Location } from "@/types/location";

interface FormData {
  locationId: string;
  date: string;
  time: string;
  notes: string;
}

interface FormErrors {
  locationId?: string;
  date?: string;
  time?: string;
  notes?: string;
}

export default function CreateAppointmentForm() {
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    locationId: "",
    date: "",
    time: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLocationsLoading(true);
        setSystemError(null);
        const data = await listLocations();
        setLocations(data);

        // Si solo hay una ubicación, seleccionarla automáticamente
        if (data.length === 1) {
          setFormData((prev) => ({ ...prev, locationId: data[0].id }));
        }
      } catch (error) {
        console.error("Error loading locations:", error);
        const errorMessage = error instanceof Error ? error.message : "Error cargando ubicaciones";

        // Si es un error de configuración del sistema, mostrarlo como error del sistema
        if (errorMessage.includes("sistema") || errorMessage.includes("configurado")) {
          setSystemError(errorMessage);
        } else {
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }

        // Configurar una ubicación por defecto si hay error (proveer todos los campos requeridos)
        const nowIso = new Date().toISOString();
        setLocations([
          {
            id: "default-location",
            name: "Full Vision - Centro",
            address: "Av. Principal 123",
            city: "Lima",
            phone: "",
            email: "",
            is_active: true,
            business_hours: "",
            created_at: nowIso,
            updated_at: nowIso,
          },
        ]);
      } finally {
        setLocationsLoading(false);
      }
    };

    loadLocations();
  }, [toast]);

  const validateForm = (): boolean => {
    const res = validateAppointment(formData);
    setErrors(res.errors);
    return res.valid;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Combine date and time into ISO string using local datetime parts
      const [y, m, d] = formData.date.split("-").map(Number);
      const [hh, mm] = formData.time.split(":").map(Number);
      const dt = new Date(y, m - 1, d, hh, mm, 0, 0); // local time
      const isoDateTime = dt.toISOString();

      await createAppointment(formData.locationId, isoDateTime, formData.notes);

      toast({
        title: "Cita solicitada exitosamente",
        description: "Te contactaremos pronto para confirmar tu cita.",
      });

      // Reset form
      setFormData({
        locationId: locations.length === 1 ? locations[0].id : "", // Mantener selección si solo hay una ubicación
        date: "",
        time: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error submitting appointment:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al crear la cita";
      toast({
        title: "Error al agendar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate time slots (8:00 to 17:30, every 30 minutes)
  const timeSlots = [];
  for (let hour = 8; hour < 18; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, "0")}:00`);
    timeSlots.push(`${hour.toString().padStart(2, "0")}:30`);
  }

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  // Get maximum date (3 months from now)
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateString = maxDate.toISOString().split("T")[0];

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
          <div className="text-center py-8 space-y-4">
            <div className="text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="font-medium">Sistema de citas en configuración</p>
              <p className="text-sm mt-1">{systemError}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Mientras tanto, puedes contactarnos directamente:</p>
              <p className="font-medium mt-2">📞 (01) 234-5678</p>
              <p className="font-medium">📧 citas@fullvision.com</p>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {/* Location Selection */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Local
              </Label>
              {locationsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando locales...
                </div>
              ) : (
                <Select value={formData.locationId} onValueChange={(value) => handleInputChange("locationId", value)}>
                  <SelectTrigger
                    id="location"
                    aria-invalid={!!errors.locationId}
                    aria-describedby={errors.locationId ? "location-error" : undefined}
                  >
                    <SelectValue placeholder="Selecciona un local" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                        {location.city && ` - ${location.city}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.locationId && (
                <p id="location-error" className="text-sm text-red-600">
                  {errors.locationId}
                </p>
              )}
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                min={minDate}
                max={maxDateString}
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? "date-error" : undefined}
              />
              <p className="text-xs text-muted-foreground">Seleccione una fecha desde mañana hasta {maxDateString}.</p>
              {errors.date && (
                <p id="date-error" className="text-sm text-red-600">
                  {errors.date}
                </p>
              )}
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hora
              </Label>
              <Select value={formData.time} onValueChange={(value) => handleInputChange("time", value)}>
                <SelectTrigger id="time" aria-invalid={!!errors.time} aria-describedby={errors.time ? "time-error" : undefined}>
                  <SelectValue placeholder="Selecciona una hora" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.time && (
                <p id="time-error" className="text-sm text-red-600">
                  {errors.time}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Horario de atención: 8:00 AM - 6:00 PM</p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales (opcional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Preferencias de horario, consultas específicas, etc."
                maxLength={500}
                rows={3}
                aria-invalid={!!errors.notes}
                aria-describedby={errors.notes ? "notes-error" : undefined}
              />
              <div className="flex justify-between items-center">
                {errors.notes && (
                  <p id="notes-error" className="text-sm text-red-600">
                    {errors.notes}
                  </p>
                )}
                <p className="text-xs text-muted-foreground ml-auto">{formData.notes.length}/500</p>
              </div>
            </div>

            <Button type="submit" disabled={loading || locationsLoading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Enviando..." : "Reservar cita"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
