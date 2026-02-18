// src/components/appointments/CalendarLegend.tsx
import { STATUS_COLORS, STATUS_LABELS } from "./calendar-constants";

/** Color-coded legend for appointment statuses, deduplicates repeated labels */
export function CalendarLegend() {
  // Deduplicate entries that share the same label (e.g. requested/pending)
  const seen = new Set<string>();
  const entries = Object.entries(STATUS_COLORS).filter(([status]) => {
    const label = STATUS_LABELS[status] || status;
    if (seen.has(label)) return false;
    seen.add(label);
    return true;
  });

  return (
    <div className="mt-4 flex flex-wrap gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Leyenda:</span>
      </div>
      {entries.map(([status, color]) => (
        <div key={status} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
          <span className="text-muted-foreground">
            {STATUS_LABELS[status] || status}
          </span>
        </div>
      ))}
    </div>
  );
}
