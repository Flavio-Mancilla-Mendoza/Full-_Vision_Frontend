// src/hooks/useCreateAppointment.ts
import { useEffect, useState, useCallback } from "react";
import { listLocations, appointmentsApi } from "@/services/appointments";
import { validateAppointment } from "@/lib/appointment-validators";
import { useToast } from "@/components/ui/use-toast";
import { buildIsoDateTime, createFallbackLocation } from "@/components/appointments/form-constants";
import type { AppointmentFormData, AppointmentFormErrors } from "@/lib/appointment-validators";
import type { Location } from "@/types/location";

// ================================================================
// Types
// ================================================================

interface FormData {
  locationId: string;
  date: string;
  time: string;
  notes: string;
}

interface UseCreateAppointmentReturn {
  /** Available locations */
  locations: Location[];
  locationsLoading: boolean;
  /** System-level error (e.g. no locations configured) */
  systemError: string | null;
  /** Form state */
  formData: FormData;
  errors: AppointmentFormErrors;
  submitting: boolean;
  /** Actions */
  handleFieldChange: (field: keyof FormData, value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

// ================================================================
// Hook
// ================================================================

const INITIAL_FORM: FormData = {
  locationId: "",
  date: "",
  time: "",
  notes: "",
};

export function useCreateAppointment(): UseCreateAppointmentReturn {
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({ ...INITIAL_FORM });
  const [errors, setErrors] = useState<AppointmentFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // ---- Load locations on mount ----
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLocationsLoading(true);
        setSystemError(null);
        const data = await listLocations();

        if (cancelled) return;
        setLocations(data);

        // Auto-select when there's only one location
        if (data.length === 1) {
          setFormData((prev) => ({ ...prev, locationId: data[0].id }));
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Error cargando ubicaciones";

        if (msg.includes("sistema") || msg.includes("configurado")) {
          setSystemError(msg);
        } else {
          toast({ title: "Error", description: msg, variant: "destructive" });
        }

        setLocations([createFallbackLocation()]);
      } finally {
        if (!cancelled) setLocationsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [toast]);

  // ---- Field change handler ----
  const handleFieldChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear field error on edit
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  // ---- Submit ----
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validation = validateAppointment(formData as AppointmentFormData);
      setErrors(validation.errors);
      if (!validation.valid) return;

      setSubmitting(true);
      try {
        const isoDateTime = buildIsoDateTime(formData.date, formData.time);

        await appointmentsApi.create({
          locationId: formData.locationId,
          iso: isoDateTime,
          notes: formData.notes,
        });

        toast({
          title: "Cita solicitada exitosamente",
          description: "Te contactaremos pronto para confirmar tu cita.",
        });

        // Reset form — keep locationId if only one location
        setFormData({
          ...INITIAL_FORM,
          locationId: locations.length === 1 ? locations[0].id : "",
        });
      } catch (err) {
        console.error("Error submitting appointment:", err);
        const msg = err instanceof Error ? err.message : "Error al crear la cita";
        toast({ title: "Error al agendar", description: msg, variant: "destructive" });
      } finally {
        setSubmitting(false);
      }
    },
    [formData, locations, toast]
  );

  return {
    locations,
    locationsLoading,
    systemError,
    formData,
    errors,
    submitting,
    handleFieldChange,
    handleSubmit,
  };
}
