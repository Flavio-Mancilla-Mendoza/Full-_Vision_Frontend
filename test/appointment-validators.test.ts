import { describe, it, expect } from "vitest";
import { validateAppointment } from "@/lib/appointment-validators";

function isoDateOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

describe("validateAppointment", () => {
  it("rejects missing location", () => {
    const { valid, errors } = validateAppointment({ locationId: "", date: isoDateOffset(1), time: "09:00" });
    expect(valid).toBe(false);
    expect(errors.locationId).toBeDefined();
  });

  it("rejects past date and today", () => {
    const { valid: validPast } = validateAppointment({ locationId: "x", date: isoDateOffset(-1), time: "09:00" });
    expect(validPast).toBe(false);
    const { valid: validToday } = validateAppointment({ locationId: "x", date: new Date().toISOString().split("T")[0], time: "09:00" });
    expect(validToday).toBe(false);
  });

  it("accepts tomorrow date", () => {
    const { valid } = validateAppointment({ locationId: "x", date: isoDateOffset(1), time: "09:00" });
    expect(valid).toBe(true);
  });

  it("rejects too-far future date (>3 months)", () => {
    const far = new Date();
    far.setMonth(far.getMonth() + 4);
    const farStr = far.toISOString().split("T")[0];
    const { valid } = validateAppointment({ locationId: "x", date: farStr, time: "09:00" });
    expect(valid).toBe(false);
  });

  it("rejects time outside business hours", () => {
    const { valid } = validateAppointment({ locationId: "x", date: isoDateOffset(1), time: "07:30" });
    expect(valid).toBe(false);
  });

  it("rejects notes longer than 500 chars", () => {
    const long = "a".repeat(501);
    const { valid } = validateAppointment({ locationId: "x", date: isoDateOffset(1), time: "09:00", notes: long });
    expect(valid).toBe(false);
  });
});
