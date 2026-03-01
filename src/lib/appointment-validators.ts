export interface AppointmentFormData {
  locationId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
}

export interface AppointmentFormErrors {
  locationId?: string;
  date?: string;
  time?: string;
  notes?: string;
}

export function validateAppointment(formData: AppointmentFormData, now = new Date()): { valid: boolean; errors: AppointmentFormErrors } {
  const errors: AppointmentFormErrors = {};

  // Location
  if (!formData.locationId) {
    errors.locationId = "Selecciona un local";
  }

  // Date
  if (!formData.date) {
    errors.date = "Selecciona una fecha";
  } else {
    // Compare using YYYY-MM-DD strings to avoid timezone issues
    const selected = formData.date; // expected format YYYY-MM-DD

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    if (selected < tomorrowStr) {
      errors.date = "La fecha debe ser desde mañana";
    }

    const maxDate = new Date(now);
    maxDate.setMonth(maxDate.getMonth() + 3);
    const maxDateStr = maxDate.toISOString().split("T")[0];
    if (selected > maxDateStr) {
      errors.date = "Máximo 3 meses de anticipación";
    }
  }

  // Time
  if (!formData.time) {
    errors.time = "Selecciona una hora";
  } else {
    const [hours] = formData.time.split(":").map(Number);
    if (Number.isNaN(hours) || hours < 10 || hours >= 19) {
      errors.time = "Horario de atención: 10:00 - 19:00";
    }
  }

  // Notes
  if (formData.notes && formData.notes.length > 500) {
    errors.notes = "Máximo 500 caracteres";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
