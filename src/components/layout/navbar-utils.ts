// Utilidades puras del Navbar

/**
 * Obtiene las iniciales de un nombre para el avatar
 */
export function getInitials(name: string | null): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
