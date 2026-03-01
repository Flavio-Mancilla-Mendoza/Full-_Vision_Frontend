// src/components/appointments/FormFields.tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Clock, MapPin, Loader2 } from "lucide-react";
import { TIME_SLOTS, getMinDate, getMaxDate } from "./form-constants";
import type { Location } from "@/types/location";
import type { AppointmentFormErrors } from "@/lib/appointment-validators";

// ================================================================
// Shared Props
// ================================================================

interface FieldChangeHandler {
  (field: "locationId" | "date" | "time" | "notes", value: string): void;
}

// ================================================================
// Location Field
// ================================================================

interface LocationFieldProps {
  locations: Location[];
  loading: boolean;
  value: string;
  error?: string;
  onChange: FieldChangeHandler;
}

export function LocationField({
  locations,
  loading,
  value,
  error,
  onChange,
}: LocationFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="location" className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Local
      </Label>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando locales...
        </div>
      ) : (
        <Select value={value} onValueChange={(v) => onChange("locationId", v)}>
          <SelectTrigger
            id="location"
            aria-invalid={!!error}
            aria-describedby={error ? "location-error" : undefined}
          >
            <SelectValue placeholder="Selecciona un local" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>
                {loc.name}
                {loc.city && ` - ${loc.city}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {error && (
        <p id="location-error" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

// ================================================================
// Date Field
// ================================================================

interface DateFieldProps {
  value: string;
  error?: string;
  onChange: FieldChangeHandler;
}

export function DateField({ value, error, onChange }: DateFieldProps) {
  const minDate = getMinDate();
  const maxDate = getMaxDate();

  return (
    <div className="space-y-2">
      <Label htmlFor="date">Fecha</Label>
      <Input
        id="date"
        type="date"
        value={value}
        onChange={(e) => onChange("date", e.target.value)}
        min={minDate}
        max={maxDate}
        aria-invalid={!!error}
        aria-describedby={error ? "date-error" : undefined}
      />
      <p className="text-xs text-muted-foreground">
        Seleccione una fecha desde mañana hasta {maxDate}.
      </p>
      {error && (
        <p id="date-error" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

// ================================================================
// Time Field
// ================================================================

interface TimeFieldProps {
  value: string;
  error?: string;
  onChange: FieldChangeHandler;
}

export function TimeField({ value, error, onChange }: TimeFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="time" className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Hora
      </Label>
      <Select value={value} onValueChange={(v) => onChange("time", v)}>
        <SelectTrigger
          id="time"
          aria-invalid={!!error}
          aria-describedby={error ? "time-error" : undefined}
        >
          <SelectValue placeholder="Selecciona una hora" />
        </SelectTrigger>
        <SelectContent>
          {TIME_SLOTS.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p id="time-error" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Horario de atención: 10:00 AM - 7:00 PM
      </p>
    </div>
  );
}

// ================================================================
// Notes Field
// ================================================================

interface NotesFieldProps {
  value: string;
  error?: string;
  onChange: FieldChangeHandler;
}

export function NotesField({ value, error, onChange }: NotesFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="notes">Notas adicionales (opcional)</Label>
      <Textarea
        id="notes"
        value={value}
        onChange={(e) => onChange("notes", e.target.value)}
        placeholder="Preferencias de horario, consultas específicas, etc."
        maxLength={500}
        rows={3}
        aria-invalid={!!error}
        aria-describedby={error ? "notes-error" : undefined}
      />
      <div className="flex justify-between items-center">
        {error && (
          <p id="notes-error" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <p className="text-xs text-muted-foreground ml-auto">
          {value.length}/500
        </p>
      </div>
    </div>
  );
}
