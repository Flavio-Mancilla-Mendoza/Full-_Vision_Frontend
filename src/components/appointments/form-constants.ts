// src/components/appointments/form-constants.ts

// ================================================================
// Time Slots
// ================================================================

const START_HOUR = 10;
const END_HOUR = 19; // exclusive — last slot is 18:30

/**
 * Pre-computed time slots from 08:00 to 17:30 in 30-minute increments
 */
export const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    slots.push(`${hour.toString().padStart(2, "0")}:30`);
  }
  return slots;
})();

// ================================================================
// Date Constraints
// ================================================================

/** Get the minimum selectable date (tomorrow) as YYYY-MM-DD */
export function getMinDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

/** Get the maximum selectable date (3 months from now) as YYYY-MM-DD */
export function getMaxDate(): string {
  const max = new Date();
  max.setMonth(max.getMonth() + 3);
  return max.toISOString().split("T")[0];
}

// ================================================================
// Date-time Helpers
// ================================================================

/**
 * Combina campos de fecha y hora del formulario en un ISO string (UTC)
 * usando la zona horaria local del navegador.
 */
export function buildIsoDateTime(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0).toISOString();
}

// ================================================================
// Default Location Fallback
// ================================================================

import type { Location } from "@/types/location";

export function createFallbackLocation(): Location {
  const now = new Date().toISOString();
  return {
    id: "default-location",
    name: "Full Vision - Centro",
    address: "Av. Principal 123",
    city: "Lima",
    phone: "",
    email: "",
    is_active: true,
    business_hours: "",
    created_at: now,
    updated_at: now,
  };
}
