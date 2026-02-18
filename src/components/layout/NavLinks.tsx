// Links de navegación desktop
import { Badge } from "@/components/ui/badge";
import type { NavItem } from "@/components/layout/navbar-config";

interface NavLinksProps {
  navItems: NavItem[];
  pendingAppointments: { length: number };
  onNavClick: (label: string) => void;
}

export function NavLinks({ navItems, pendingAppointments, onNavClick }: NavLinksProps) {
  return (
    <div className="hidden lg:flex items-center space-x-6">
      {navItems.map((item) => (
        <button
          key={item.label}
          onClick={() => onNavClick(item.label)}
          className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors duration-200 hover:scale-105 transform relative"
        >
          <span>{item.label}</span>
          {item.label === "Mis Citas" && pendingAppointments.length > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 text-xs">
              {pendingAppointments.length}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}
